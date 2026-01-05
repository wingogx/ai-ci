-- ================================================================
-- 修复排行榜和学习记录的 RLS 问题
-- 在 Supabase SQL Editor 中执行此脚本
-- ================================================================

-- 0. 创建获取当前用户信息的函数（绕过 RLS）
CREATE OR REPLACE FUNCTION get_user_by_id(p_user_id uuid)
RETURNS TABLE (
  id uuid,
  nickname text,
  avatar_url text,
  city text,
  invite_code text,
  created_at timestamptz,
  updated_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id,
    u.nickname,
    u.avatar_url,
    u.city,
    u.invite_code,
    u.created_at,
    u.updated_at
  FROM public.users u
  WHERE u.id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 0.1 创建更新用户昵称的函数
CREATE OR REPLACE FUNCTION update_user_nickname(p_user_id uuid, p_nickname text)
RETURNS TABLE (
  id uuid,
  nickname text,
  avatar_url text,
  city text,
  invite_code text
) AS $$
BEGIN
  UPDATE public.users
  SET nickname = p_nickname, updated_at = now()
  WHERE users.id = p_user_id;

  RETURN QUERY
  SELECT u.id, u.nickname, u.avatar_url, u.city, u.invite_code
  FROM public.users u
  WHERE u.id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 0.2 创建获取用户邀请码的函数
CREATE OR REPLACE FUNCTION get_user_invite_code(p_user_id uuid)
RETURNS text AS $$
DECLARE
  code text;
BEGIN
  SELECT invite_code INTO code
  FROM public.users
  WHERE id = p_user_id;
  RETURN code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 0.3 根据邀请码获取用户信息
CREATE OR REPLACE FUNCTION get_user_by_invite_code(p_invite_code text)
RETURNS TABLE (
  id uuid,
  nickname text,
  avatar_url text
) AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.nickname, u.avatar_url
  FROM public.users u
  WHERE u.invite_code = UPPER(p_invite_code);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 0.4 获取用户统计
CREATE OR REPLACE FUNCTION get_user_stats(p_user_id uuid)
RETURNS TABLE (
  total_words_learned int,
  streak_days int,
  longest_streak int
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(us.total_words_learned, 0)::int,
    COALESCE(us.streak_days, 0)::int,
    COALESCE(us.longest_streak, 0)::int
  FROM public.user_stats us
  WHERE us.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 0.5 增加用户帮助次数
CREATE OR REPLACE FUNCTION increment_user_help_count(p_user_id uuid, p_amount int DEFAULT 1)
RETURNS void AS $$
BEGIN
  UPDATE public.users
  SET help_count = COALESCE(help_count, 0) + p_amount,
      updated_at = now()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. 创建获取排行榜的函数（绕过 RLS）
CREATE OR REPLACE FUNCTION get_leaderboard(
  p_vocab_mode text,
  p_grade text,
  p_limit int DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  nickname text,
  avatar_url text,
  city text,
  total_words_learned int,
  streak_days int,
  grade_words_learned bigint,
  rank_in_grade bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id,
    u.nickname,
    u.avatar_url,
    u.city,
    COALESCE(us.total_words_learned, 0)::int,
    COALESCE(us.streak_days, 0)::int,
    COALESCE(array_length(up.learned_words, 1), 0)::bigint as grade_words_learned,
    rank() over (
      order by COALESCE(array_length(up.learned_words, 1), 0) desc nulls last
    )::bigint as rank_in_grade
  FROM public.users u
  LEFT JOIN public.user_stats us ON u.id = us.user_id
  LEFT JOIN public.user_progress up ON u.id = up.user_id
  WHERE up.vocab_mode = p_vocab_mode
    AND up.grade = p_grade
  ORDER BY grade_words_learned DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. 创建获取城市排行榜的函数（绕过 RLS）
CREATE OR REPLACE FUNCTION get_city_leaderboard(
  p_city text,
  p_vocab_mode text,
  p_grade text,
  p_limit int DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  nickname text,
  avatar_url text,
  city text,
  total_words_learned int,
  streak_days int,
  grade_words_learned bigint,
  rank_in_city bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id,
    u.nickname,
    u.avatar_url,
    u.city,
    COALESCE(us.total_words_learned, 0)::int,
    COALESCE(us.streak_days, 0)::int,
    COALESCE(array_length(up.learned_words, 1), 0)::bigint as grade_words_learned,
    rank() over (
      order by COALESCE(array_length(up.learned_words, 1), 0) desc nulls last
    )::bigint as rank_in_city
  FROM public.users u
  LEFT JOIN public.user_stats us ON u.id = us.user_id
  LEFT JOIN public.user_progress up ON u.id = up.user_id
  WHERE u.city = p_city
    AND up.vocab_mode = p_vocab_mode
    AND up.grade = p_grade
  ORDER BY grade_words_learned DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. 创建获取用户排名百分比的函数
CREATE OR REPLACE FUNCTION get_user_rank_percentile(
  p_user_id uuid,
  p_vocab_mode text,
  p_grade text
)
RETURNS numeric AS $$
DECLARE
  user_rank bigint;
  total_users bigint;
BEGIN
  -- 获取用户排名
  SELECT rank_in_grade INTO user_rank
  FROM (
    SELECT
      u.id,
      rank() over (
        order by COALESCE(array_length(up.learned_words, 1), 0) desc nulls last
      ) as rank_in_grade
    FROM public.users u
    LEFT JOIN public.user_progress up ON u.id = up.user_id
    WHERE up.vocab_mode = p_vocab_mode
      AND up.grade = p_grade
  ) ranked
  WHERE id = p_user_id;

  -- 获取总用户数
  SELECT COUNT(*) INTO total_users
  FROM public.user_progress
  WHERE vocab_mode = p_vocab_mode
    AND grade = p_grade;

  IF total_users = 0 OR user_rank IS NULL THEN
    RETURN 0;
  END IF;

  -- 计算百分比（超过了多少人）
  RETURN ROUND(((total_users - user_rank)::numeric / total_users) * 100, 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. 创建获取用户城市排名百分比的函数
CREATE OR REPLACE FUNCTION get_user_city_rank_percentile(
  p_user_id uuid,
  p_vocab_mode text,
  p_grade text
)
RETURNS numeric AS $$
DECLARE
  user_city text;
  user_rank bigint;
  total_users bigint;
BEGIN
  -- 获取用户所在城市
  SELECT city INTO user_city
  FROM public.users
  WHERE id = p_user_id;

  IF user_city IS NULL THEN
    RETURN 0;
  END IF;

  -- 获取用户在城市内的排名
  SELECT rank_in_city INTO user_rank
  FROM (
    SELECT
      u.id,
      rank() over (
        order by COALESCE(array_length(up.learned_words, 1), 0) desc nulls last
      ) as rank_in_city
    FROM public.users u
    LEFT JOIN public.user_progress up ON u.id = up.user_id
    WHERE u.city = user_city
      AND up.vocab_mode = p_vocab_mode
      AND up.grade = p_grade
  ) ranked
  WHERE id = p_user_id;

  -- 获取同城市总用户数
  SELECT COUNT(*) INTO total_users
  FROM public.users u
  JOIN public.user_progress up ON u.id = up.user_id
  WHERE u.city = user_city
    AND up.vocab_mode = p_vocab_mode
    AND up.grade = p_grade;

  IF total_users = 0 OR user_rank IS NULL THEN
    RETURN 0;
  END IF;

  -- 计算百分比（超过了多少人）
  RETURN ROUND(((total_users - user_rank)::numeric / total_users) * 100, 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. 授权函数给已认证用户
GRANT EXECUTE ON FUNCTION get_user_by_id TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_nickname TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_invite_code TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_by_invite_code TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_stats TO authenticated;
GRANT EXECUTE ON FUNCTION increment_user_help_count TO authenticated;
GRANT EXECUTE ON FUNCTION get_leaderboard TO authenticated;
GRANT EXECUTE ON FUNCTION get_city_leaderboard TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_rank_percentile TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_city_rank_percentile TO authenticated;

-- 7. 允许匿名用户也可以使用
GRANT EXECUTE ON FUNCTION get_user_by_id TO anon;
GRANT EXECUTE ON FUNCTION update_user_nickname TO anon;
GRANT EXECUTE ON FUNCTION get_user_invite_code TO anon;
GRANT EXECUTE ON FUNCTION get_user_by_invite_code TO anon;
GRANT EXECUTE ON FUNCTION get_user_stats TO anon;
GRANT EXECUTE ON FUNCTION increment_user_help_count TO anon;
GRANT EXECUTE ON FUNCTION get_leaderboard TO anon;
GRANT EXECUTE ON FUNCTION get_city_leaderboard TO anon;
