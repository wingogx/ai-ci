-- =============================================
-- 添加城市字段 + 总榜/城市榜支持
-- =============================================

-- 1. 添加 city 字段
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS city text;

-- 2. 创建城市索引（优化城市榜查询）
CREATE INDEX IF NOT EXISTS idx_users_city ON public.users(city);

-- 3. 更新 leaderboard 视图（总榜，包含城市信息）
DROP VIEW IF EXISTS public.leaderboard;
CREATE VIEW public.leaderboard AS
SELECT
  u.id,
  u.nickname,
  u.avatar_url,
  u.city,
  us.total_words_learned,
  us.streak_days,
  up.vocab_mode,
  up.grade,
  up.completed_levels,
  array_length(up.learned_words, 1) as grade_words_learned,
  rank() over (
    partition by up.vocab_mode, up.grade
    order by array_length(up.learned_words, 1) desc nulls last
  ) as rank_in_grade
FROM public.users u
JOIN public.user_stats us ON u.id = us.user_id
JOIN public.user_progress up ON u.id = up.user_id;

-- 4. 创建城市榜视图
CREATE OR REPLACE VIEW public.city_leaderboard AS
SELECT
  u.id,
  u.nickname,
  u.avatar_url,
  u.city,
  us.total_words_learned,
  us.streak_days,
  up.vocab_mode,
  up.grade,
  up.completed_levels,
  array_length(up.learned_words, 1) as grade_words_learned,
  rank() over (
    partition by u.city, up.vocab_mode, up.grade
    order by array_length(up.learned_words, 1) desc nulls last
  ) as rank_in_city
FROM public.users u
JOIN public.user_stats us ON u.id = us.user_id
JOIN public.user_progress up ON u.id = up.user_id
WHERE u.city IS NOT NULL;

-- 5. 创建更新城市的函数
CREATE OR REPLACE FUNCTION update_user_city(p_user_id uuid, p_city text)
RETURNS void AS $$
BEGIN
  UPDATE public.users
  SET city = p_city, updated_at = now()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. 获取用户城市排名百分比
CREATE OR REPLACE FUNCTION get_user_city_rank_percentile(
  p_user_id uuid,
  p_vocab_mode text,
  p_grade text
)
RETURNS numeric AS $$
DECLARE
  user_city text;
  user_words int;
  total_users int;
  users_below int;
BEGIN
  -- 获取用户城市
  SELECT city INTO user_city FROM public.users WHERE id = p_user_id;

  IF user_city IS NULL THEN
    RETURN NULL;
  END IF;

  -- 获取用户已学词数
  SELECT array_length(learned_words, 1)
  INTO user_words
  FROM public.user_progress
  WHERE user_id = p_user_id
    AND vocab_mode = p_vocab_mode
    AND grade = p_grade;

  IF user_words IS NULL THEN
    user_words := 0;
  END IF;

  -- 获取同城市同等级总用户数
  SELECT count(*)
  INTO total_users
  FROM public.user_progress up
  JOIN public.users u ON up.user_id = u.id
  WHERE up.vocab_mode = p_vocab_mode
    AND up.grade = p_grade
    AND u.city = user_city;

  IF total_users <= 1 THEN
    RETURN 50;
  END IF;

  -- 获取比当前用户词数少的用户数
  SELECT count(*)
  INTO users_below
  FROM public.user_progress up
  JOIN public.users u ON up.user_id = u.id
  WHERE up.vocab_mode = p_vocab_mode
    AND up.grade = p_grade
    AND u.city = user_city
    AND (array_length(up.learned_words, 1) < user_words
         OR up.learned_words IS NULL
         OR array_length(up.learned_words, 1) IS NULL);

  RETURN round((users_below::numeric / total_users::numeric) * 100, 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
