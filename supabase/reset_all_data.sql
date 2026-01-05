-- ⚠️ 警告：此脚本会删除所有数据，仅用于测试环境！
-- 执行前请确认这是你想要的操作

-- 1. 先删除有外键依赖的表数据
TRUNCATE TABLE public.auth_user_mapping CASCADE;
TRUNCATE TABLE public.learning_history CASCADE;
TRUNCATE TABLE public.user_progress CASCADE;
TRUNCATE TABLE public.user_badges CASCADE;
TRUNCATE TABLE public.user_stats CASCADE;
TRUNCATE TABLE public.invitations CASCADE;
TRUNCATE TABLE public.daily_tasks CASCADE;
TRUNCATE TABLE public.share_logs CASCADE;
TRUNCATE TABLE public.city_leaderboard CASCADE;
TRUNCATE TABLE public.leaderboard CASCADE;

-- 2. 删除 users 表数据
TRUNCATE TABLE public.users CASCADE;

-- 3. 删除 auth.users 中的匿名用户
-- 注意：这会删除所有匿名用户的认证记录
DELETE FROM auth.users WHERE is_anonymous = true;

-- 4. 如果你想删除所有 auth 用户（包括非匿名的），取消下面的注释：
-- DELETE FROM auth.users;

-- 5. 重置完成后的确认
SELECT
  'users' as table_name, COUNT(*) as count FROM public.users
UNION ALL
SELECT 'learning_history', COUNT(*) FROM public.learning_history
UNION ALL
SELECT 'user_progress', COUNT(*) FROM public.user_progress
UNION ALL
SELECT 'user_badges', COUNT(*) FROM public.user_badges
UNION ALL
SELECT 'invitations', COUNT(*) FROM public.invitations
UNION ALL
SELECT 'auth_user_mapping', COUNT(*) FROM public.auth_user_mapping
UNION ALL
SELECT 'auth.users', COUNT(*) FROM auth.users;
