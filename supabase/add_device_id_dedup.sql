-- 添加 device_id 列用于设备去重
-- 执行此脚本前请备份数据

-- 1. 添加 device_id 列到 users 表
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS device_id TEXT;

-- 2. 创建 device_id 索引（用于快速查找）
CREATE INDEX IF NOT EXISTS idx_users_device_id ON public.users(device_id);

-- 3. 创建 auth_user_mapping 表（用于映射 auth.users 到 public.users）
-- 必须在触发器之前创建
CREATE TABLE IF NOT EXISTS public.auth_user_mapping (
  auth_user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  public_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  device_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_auth_user_mapping_public_user ON public.auth_user_mapping(public_user_id);
CREATE INDEX IF NOT EXISTS idx_auth_user_mapping_device ON public.auth_user_mapping(device_id);

-- 4. 修改触发器函数，基于 device_id 去重
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
DECLARE
  device_id_value TEXT;
  existing_user_id UUID;
BEGIN
  -- 从用户元数据中获取 device_id
  device_id_value := NEW.raw_user_meta_data->>'device_id';

  -- 如果有 device_id，检查是否已存在相同 device_id 的用户
  IF device_id_value IS NOT NULL AND device_id_value != '' THEN
    SELECT id INTO existing_user_id
    FROM public.users
    WHERE device_id = device_id_value
    LIMIT 1;

    IF existing_user_id IS NOT NULL THEN
      -- 已存在相同 device_id 的用户，不创建新记录
      -- 在 auth_user_mapping 表中记录映射关系
      INSERT INTO public.auth_user_mapping (auth_user_id, public_user_id, device_id)
      VALUES (NEW.id, existing_user_id, device_id_value)
      ON CONFLICT (auth_user_id) DO NOTHING;

      RETURN NEW;
    END IF;
  END IF;

  -- 不存在相同 device_id 的用户，创建新用户
  INSERT INTO public.users (
    id,
    nickname,
    invite_code,
    help_count,
    device_id,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nickname', '学习者'),
    generate_invite_code(),
    5,
    device_id_value,
    NOW(),
    NOW()
  );

  -- 同时记录映射
  INSERT INTO public.auth_user_mapping (auth_user_id, public_user_id, device_id)
  VALUES (NEW.id, NEW.id, device_id_value)
  ON CONFLICT (auth_user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. 确保触发器存在
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();

-- 6. 创建 RPC 函数获取用户（通过映射表）
CREATE OR REPLACE FUNCTION get_mapped_user_id(p_auth_user_id UUID)
RETURNS UUID AS $$
  SELECT public_user_id FROM public.auth_user_mapping WHERE auth_user_id = p_auth_user_id;
$$ LANGUAGE SQL SECURITY DEFINER;

-- 7. 修改 get_user_by_id 函数，使用映射表
CREATE OR REPLACE FUNCTION get_user_by_id(p_user_id UUID)
RETURNS SETOF public.users AS $$
DECLARE
  mapped_user_id UUID;
BEGIN
  -- 先尝试获取映射的用户ID
  SELECT public_user_id INTO mapped_user_id
  FROM public.auth_user_mapping
  WHERE auth_user_id = p_user_id;

  -- 如果有映射，使用映射的ID；否则使用原ID
  IF mapped_user_id IS NOT NULL THEN
    RETURN QUERY SELECT * FROM public.users WHERE id = mapped_user_id;
  ELSE
    RETURN QUERY SELECT * FROM public.users WHERE id = p_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. 为现有用户回填 device_id（基于 auth.users 的 metadata）
-- 注意：这可能不会有数据，因为之前的用户可能没有 device_id
UPDATE public.users u
SET device_id = (
  SELECT raw_user_meta_data->>'device_id'
  FROM auth.users au
  WHERE au.id = u.id
)
WHERE u.device_id IS NULL;

-- 9. 为现有用户创建映射记录
INSERT INTO public.auth_user_mapping (auth_user_id, public_user_id, device_id)
SELECT id, id, device_id FROM public.users
ON CONFLICT (auth_user_id) DO NOTHING;

-- 10. 清理没有实际数据的重复用户的函数
CREATE OR REPLACE FUNCTION clean_duplicate_anonymous_users()
RETURNS TABLE(deleted_count INTEGER) AS $$
DECLARE
  del_count INTEGER := 0;
BEGIN
  -- 删除没有任何学习记录和进度的重复匿名用户
  WITH users_with_data AS (
    SELECT DISTINCT user_id FROM public.learning_history
    UNION
    SELECT DISTINCT user_id FROM public.user_progress
    UNION
    SELECT DISTINCT user_id FROM public.user_badges
  ),
  users_to_delete AS (
    SELECT u.id
    FROM public.users u
    LEFT JOIN users_with_data uwd ON u.id = uwd.user_id
    WHERE uwd.user_id IS NULL
      AND u.nickname = '学习者'
      AND u.avatar_url IS NULL
      AND u.invited_by IS NULL
      -- 保留最近24小时内创建的用户
      AND u.created_at < NOW() - INTERVAL '24 hours'
  )
  DELETE FROM public.users
  WHERE id IN (SELECT id FROM users_to_delete);

  GET DIAGNOSTICS del_count = ROW_COUNT;

  RETURN QUERY SELECT del_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 执行清理（可选）：
-- SELECT * FROM clean_duplicate_anonymous_users();
