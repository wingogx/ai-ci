-- ================================================================
-- 修复排行榜和学习记录的 RLS 问题
-- 在 Supabase SQL Editor 中执行此脚本
-- ================================================================

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

-- 5. 授权函数给已认证用户
GRANT EXECUTE ON FUNCTION get_leaderboard TO authenticated;
GRANT EXECUTE ON FUNCTION get_city_leaderboard TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_rank_percentile TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_city_rank_percentile TO authenticated;

-- 5. 允许匿名用户也可以查看排行榜
GRANT EXECUTE ON FUNCTION get_leaderboard TO anon;
GRANT EXECUTE ON FUNCTION get_city_leaderboard TO anon;
