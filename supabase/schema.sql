-- =============================================
-- 爱词鸭 (WordDuck) 数据库设计
-- =============================================

-- 启用 UUID 扩展
create extension if not exists "uuid-ossp";

-- =============================================
-- 1. 用户表
-- =============================================
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text,
  avatar_url text,
  invite_code text unique not null,
  invited_by uuid references public.users(id),
  help_count int default 5,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 邀请码索引
create index idx_users_invite_code on public.users(invite_code);

-- =============================================
-- 2. 用户学习进度表
-- =============================================
create table public.user_progress (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade not null,
  vocab_mode text not null,  -- 'cefr' | 'china'
  grade text not null,       -- 'a1', 'a2', 'primary', 'junior' 等
  completed_levels int default 0,
  learned_words text[] default '{}',
  helped_words text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, vocab_mode, grade)
);

-- 用户进度索引
create index idx_user_progress_user on public.user_progress(user_id);

-- =============================================
-- 3. 用户统计表
-- =============================================
create table public.user_stats (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade unique not null,
  total_words_learned int default 0,
  total_levels_completed int default 0,
  streak_days int default 0,
  longest_streak int default 0,
  last_play_date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =============================================
-- 4. 学习历史表（热力图数据）
-- =============================================
create table public.learning_history (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade not null,
  date date not null,
  words_learned int default 0,
  levels_completed int default 0,
  play_time_minutes int default 0,
  created_at timestamptz default now(),
  unique(user_id, date)
);

-- 历史记录索引
create index idx_learning_history_user_date on public.learning_history(user_id, date);

-- =============================================
-- 5. 用户勋章表
-- =============================================
create table public.user_badges (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade not null,
  badge_id text not null,
  unlocked_at timestamptz default now(),
  unique(user_id, badge_id)
);

-- 勋章索引
create index idx_user_badges_user on public.user_badges(user_id);

-- =============================================
-- 6. 邀请记录表
-- =============================================
create table public.invitations (
  id uuid primary key default uuid_generate_v4(),
  inviter_id uuid references public.users(id) on delete cascade not null,
  invitee_id uuid references public.users(id) on delete cascade not null,
  status text default 'registered',  -- registered, level5, level20
  inviter_reward_claimed boolean default false,
  invitee_reward_claimed boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(inviter_id, invitee_id)
);

-- 邀请记录索引
create index idx_invitations_inviter on public.invitations(inviter_id);
create index idx_invitations_invitee on public.invitations(invitee_id);

-- =============================================
-- 7. 分享记录表（数据分析用）
-- =============================================
create table public.share_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade,
  share_type text not null,  -- badge, milestone, level, stats, word
  share_content jsonb,
  platform text,  -- wechat, weibo, download, copy
  created_at timestamptz default now()
);

-- 分享记录索引
create index idx_share_logs_user on public.share_logs(user_id);
create index idx_share_logs_type on public.share_logs(share_type);

-- =============================================
-- 8. 每日任务表
-- =============================================
create table public.daily_tasks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade not null,
  date date not null,
  task_type text not null,  -- complete_level, learn_words, streak
  target_value int not null,
  current_value int default 0,
  completed boolean default false,
  reward_claimed boolean default false,
  created_at timestamptz default now(),
  unique(user_id, date, task_type)
);

-- 每日任务索引
create index idx_daily_tasks_user_date on public.daily_tasks(user_id, date);

-- =============================================
-- 9. 排行榜视图
-- =============================================
create or replace view public.leaderboard as
select
  u.id,
  u.nickname,
  u.avatar_url,
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
from public.users u
join public.user_stats us on u.id = us.user_id
join public.user_progress up on u.id = up.user_id;

-- =============================================
-- RLS 策略（行级安全）
-- =============================================

-- 启用 RLS
alter table public.users enable row level security;
alter table public.user_progress enable row level security;
alter table public.user_stats enable row level security;
alter table public.learning_history enable row level security;
alter table public.user_badges enable row level security;
alter table public.invitations enable row level security;
alter table public.share_logs enable row level security;
alter table public.daily_tasks enable row level security;

-- 用户表策略
create policy "用户可以查看所有人的公开信息" on public.users
  for select using (true);

create policy "用户只能更新自己的信息" on public.users
  for update using (auth.uid() = id);

create policy "新用户可以插入自己的记录" on public.users
  for insert with check (auth.uid() = id);

-- 用户进度策略
create policy "用户只能查看自己的进度" on public.user_progress
  for select using (auth.uid() = user_id);

create policy "用户只能更新自己的进度" on public.user_progress
  for all using (auth.uid() = user_id);

-- 用户统计策略
create policy "用户可以查看所有人的统计（排行榜）" on public.user_stats
  for select using (true);

create policy "用户只能更新自己的统计" on public.user_stats
  for all using (auth.uid() = user_id);

-- 学习历史策略
create policy "用户只能查看自己的历史" on public.learning_history
  for select using (auth.uid() = user_id);

create policy "用户只能更新自己的历史" on public.learning_history
  for all using (auth.uid() = user_id);

-- 勋章策略
create policy "用户可以查看所有人的勋章" on public.user_badges
  for select using (true);

create policy "用户只能更新自己的勋章" on public.user_badges
  for all using (auth.uid() = user_id);

-- 邀请记录策略
create policy "用户可以查看与自己相关的邀请" on public.invitations
  for select using (auth.uid() = inviter_id or auth.uid() = invitee_id);

create policy "用户可以创建邀请记录" on public.invitations
  for insert with check (auth.uid() = invitee_id);

create policy "用户可以更新与自己相关的邀请" on public.invitations
  for update using (auth.uid() = inviter_id or auth.uid() = invitee_id);

-- 分享记录策略
create policy "用户只能查看自己的分享记录" on public.share_logs
  for select using (auth.uid() = user_id);

create policy "用户可以创建分享记录" on public.share_logs
  for insert with check (auth.uid() = user_id or user_id is null);

-- 每日任务策略
create policy "用户只能查看自己的任务" on public.daily_tasks
  for select using (auth.uid() = user_id);

create policy "用户只能更新自己的任务" on public.daily_tasks
  for all using (auth.uid() = user_id);

-- =============================================
-- 触发器：自动更新 updated_at
-- =============================================
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger users_updated_at
  before update on public.users
  for each row execute function update_updated_at();

create trigger user_progress_updated_at
  before update on public.user_progress
  for each row execute function update_updated_at();

create trigger user_stats_updated_at
  before update on public.user_stats
  for each row execute function update_updated_at();

create trigger invitations_updated_at
  before update on public.invitations
  for each row execute function update_updated_at();

-- =============================================
-- 函数：生成邀请码
-- =============================================
create or replace function generate_invite_code()
returns text as $$
declare
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := '';
  i int;
begin
  for i in 1..6 loop
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  end loop;
  return result;
end;
$$ language plpgsql;

-- =============================================
-- 函数：创建新用户记录
-- =============================================
create or replace function handle_new_user()
returns trigger as $$
declare
  new_invite_code text;
begin
  -- 生成唯一邀请码
  loop
    new_invite_code := generate_invite_code();
    exit when not exists (select 1 from public.users where invite_code = new_invite_code);
  end loop;

  -- 创建用户记录
  insert into public.users (id, nickname, avatar_url, invite_code)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nickname', new.raw_user_meta_data->>'name', '学习者'),
    new.raw_user_meta_data->>'avatar_url',
    new_invite_code
  );

  -- 创建统计记录
  insert into public.user_stats (user_id)
  values (new.id);

  return new;
end;
$$ language plpgsql security definer;

-- 新用户触发器
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- =============================================
-- 函数：处理邀请绑定
-- =============================================
create or replace function bind_invitation(invitee_user_id uuid, inviter_code text)
returns boolean as $$
declare
  inviter_user_id uuid;
begin
  -- 查找邀请者
  select id into inviter_user_id
  from public.users
  where invite_code = inviter_code;

  if inviter_user_id is null then
    return false;
  end if;

  -- 不能自己邀请自己
  if inviter_user_id = invitee_user_id then
    return false;
  end if;

  -- 更新被邀请者的 invited_by
  update public.users
  set invited_by = inviter_user_id
  where id = invitee_user_id and invited_by is null;

  -- 创建邀请记录
  insert into public.invitations (inviter_id, invitee_id)
  values (inviter_user_id, invitee_user_id)
  on conflict do nothing;

  -- 给被邀请者发放奖励（+2 帮助次数）
  update public.users
  set help_count = help_count + 2
  where id = invitee_user_id;

  -- 给邀请者发放奖励（+1 帮助次数）
  update public.users
  set help_count = help_count + 1
  where id = inviter_user_id;

  return true;
end;
$$ language plpgsql security definer;

-- =============================================
-- 函数：更新邀请状态并发放奖励
-- =============================================
create or replace function update_invitation_status(
  p_user_id uuid,
  p_new_status text
)
returns void as $$
declare
  inv record;
begin
  for inv in
    select * from public.invitations
    where invitee_id = p_user_id
    and status != p_new_status
  loop
    -- 更新状态
    update public.invitations
    set status = p_new_status
    where id = inv.id;

    -- 根据状态发放奖励
    if p_new_status = 'level5' and not inv.inviter_reward_claimed then
      -- 好友完成第5关，邀请者 +2 帮助
      update public.users
      set help_count = help_count + 2
      where id = inv.inviter_id;

      update public.invitations
      set inviter_reward_claimed = true
      where id = inv.id;
    end if;
  end loop;
end;
$$ language plpgsql security definer;

-- =============================================
-- 函数：获取用户排名百分比
-- =============================================
create or replace function get_user_rank_percentile(
  p_user_id uuid,
  p_vocab_mode text,
  p_grade text
)
returns numeric as $$
declare
  user_words int;
  total_users int;
  users_below int;
begin
  -- 获取用户已学词数
  select array_length(learned_words, 1)
  into user_words
  from public.user_progress
  where user_id = p_user_id
    and vocab_mode = p_vocab_mode
    and grade = p_grade;

  if user_words is null then
    user_words := 0;
  end if;

  -- 获取同等级总用户数
  select count(*)
  into total_users
  from public.user_progress
  where vocab_mode = p_vocab_mode
    and grade = p_grade;

  if total_users <= 1 then
    return 50;
  end if;

  -- 获取比当前用户词数少的用户数
  select count(*)
  into users_below
  from public.user_progress
  where vocab_mode = p_vocab_mode
    and grade = p_grade
    and (array_length(learned_words, 1) < user_words
         or learned_words is null
         or array_length(learned_words, 1) is null);

  return round((users_below::numeric / total_users::numeric) * 100, 1);
end;
$$ language plpgsql security definer;
