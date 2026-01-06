# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

WordDuck（爱词鸭）是一个英语单词拼图学习应用。用户通过拖拽字母完成交叉词拼图来学习单词。

## 常用命令

```bash
npm run dev          # 启动开发服务器 (localhost:3000)
npm run build        # 生产构建 (禁用Turbopack)
npm start            # 启动生产服务器
npm run lint         # ESLint 代码检查
npm test             # 运行所有测试
npm run test:watch   # 监视模式测试
npm run test:coverage # 生成覆盖率报告 (目标70%)

# 运行单个测试文件
npx jest src/__tests__/lib/puzzleGenerator.test.ts

# 数据库管理 (通过 Supabase SQL Editor)
supabase/schema.sql              # 主数据库 schema
supabase/add_device_id_dedup.sql # device_id 去重机制
supabase/reset_all_data.sql      # 重置所有数据（仅测试用）
```

## 技术栈

- **框架**: Next.js 16 (App Router) + React 19 + TypeScript
- **状态管理**: Zustand (带 persist 中间件)
- **拖拽**: @dnd-kit
- **后端**: Supabase (PostgreSQL + Auth)
- **样式**: Tailwind CSS 4
- **测试**: Jest + React Testing Library

## 核心架构

### 目录结构

```
src/
├── app/              # Next.js App Router 页面
├── components/       # React 组件 (ui/, game/, home/, auth/, feedback/, share/)
├── stores/           # Zustand stores (useGameStore, useUserStore, useAuthStore)
├── lib/              # 核心业务逻辑
├── hooks/            # 自定义 Hooks
├── types/            # TypeScript 类型定义
├── data/             # 静态数据 (badges, words/)
├── i18n/             # 国际化 (zh, en)
├── utils/            # 工具函数
└── __tests__/        # 单元测试
```

### 关键模块

**拼图生成** (`lib/puzzleGenerator.ts`)
- 交叉词拼图算法：单词按长度降序排列，最长词横向居中，后续词通过共同字母垂直交叉
- 预填策略：交叉点必填 + 按难度等级随机预填（A1: 50%, C2: 15%）
- 最多重试50次，失败抛出 `PuzzleGenerationError`
- 输出 `PuzzleLayout` 包含 grid、words、allLetters

**单词选择** (`lib/wordSelector.ts`)
- 三优先级：需重学词（用过帮助的）> 未学词（按"交叉友好度"排序）> 已学词
- 难度递进：1-5关最长4字母，6-10关5字母，11-20关6字母，21+无限制
- 交叉可行性检查：候选词必须与已选词至少有一个共同字母
- 未用帮助的词加入 `learnedWords`，用帮助的加入 `helpedWords`

**状态管理** (`stores/`)
- `useGameStore`: 当前关卡、拼图、放置字母状态、正确/错误标记
  - `initLevel()`: 初始化关卡，最多重试10次选词+生成拼图
  - `placeLetter()`: 放置后自动检查包含该格子的所有单词
  - `checkWord()`: 验证单词，标记正确/错误格子
  - 教学模式：前3关自动显示答案，每5关为挑战关
- `useUserStore`: 用户设置、各等级进度、统计、勋章 (Zustand persist → localStorage)
  - 分词库模式统计（CEFR vs 中国教材）
  - 连续学习天数追踪，帮助次数上限5次
- `useAuthStore`: 认证状态

**认证与去重** (`lib/auth/`)
- 设备认证 (`deviceAuth.ts`): 首次访问生成 `device_id`（timestamp-random-browser）存于 localStorage
- Device ID 去重机制：通过 `auth_user_mapping` 表实现多对一映射（多个 auth.users → 一个 public.users）
- 触发器 `handle_new_auth_user()` 检查 device_id，已存在则仅创建映射，不创建新用户
- OAuth 支持：Google, Apple, GitHub, 手机号OTP, 微信
- 待绑定邀请码：访问邀请链接时存入 localStorage，用户初始化后自动绑定

**词库加载** (`lib/wordLoader.ts`)
- CEFR: A1-C2 (6个级别) / 中国教材: 小学-CET6 (5个级别)
- 动态导入 `data/words/{mode}/{level}.json`
- 使用 LocalForage (IndexedDB) 缓存，版本号控制（`CACHE_VERSION = 6`）
- 缓存键：`words_{level}_v{version}`，命中直接返回
- 数据预处理：过滤短词（< 3字母），按词长升序排序
- 失败重试机制（最多3次，递增延迟）

**单词显示** (`components/game/WordCard.tsx`)
- 释义自动折叠：超过 100 字符时自动折叠，显示"查看更多"/"收起"按钮
- 支持中英文释义切换（根据用户语言设置）
- 显示音标、词性标签（带颜色区分）
- 发音按钮（调用浏览器 TTS）

**数据同步** (`lib/sync/syncService.ts`)
- 双向同步：上传本地进度到 Supabase，下载云端数据合并到本地
- 冲突解决：统计数据取最大值，学习词数云端优先，勋章取并集
- `uploadProgress()`: 上传进度、统计、勋章、学习历史（UPSERT）
- `downloadProgress()`: 拉取数据合并到 Zustand store
- `getLearningHistory(days)`: 获取近N天学习历史（热力图数据）

### 数据库 (Supabase)

Schema 在 `supabase/schema.sql`，主要表：
- `users`: 用户信息 (包含 device_id, invite_code, help_count)
- `auth_user_mapping`: auth.users 到 public.users 的映射表，支持设备去重
- `user_progress`: 各等级进度 (唯一约束: user_id + vocab_mode + grade)
- `user_stats`: 统计数据 (总学习词数、连续天数等)
- `user_badges`: 已解锁勋章
- `learning_history`: 学习记录（用于热力图）
- `invitations`: 邀请记录
- `daily_tasks`: 每日任务
- `share_logs`: 分享记录

视图：
- `leaderboard`: 排行榜视图 (按 vocab_mode + grade 分区排名)
- `city_leaderboard`: 城市排行榜视图

关键函数：
- `generate_invite_code()`: 生成6位邀请码（排除混淆字符 I,O,0,1）
- `handle_new_auth_user()`: 新用户创建触发器，基于 device_id 去重
- `bind_invitation()`: 处理邀请绑定，发放奖励（被邀请者 +2 帮助，邀请者 +1）
- `get_user_by_id()`: 通过映射表获取用户
- `update_invitation_status()`: 根据好友等级发放邀请奖励
- `get_user_rank_percentile()`: 获取用户在等级内的排名百分位
- `clean_duplicate_anonymous_users()`: 清理无数据的重复匿名用户

RLS 策略：所有表启用行级安全，用户只能访问自己的数据（users基本信息、排行榜等公开数据例外）

### 类型定义

- `types/game.ts`: PuzzleLayout, PuzzleWord, PuzzleCell
- `types/word.ts`: Word, WordList, VocabMode, Grade
- `types/user.ts`: UserSettings, GradeProgress, UserStats

## 环境变量

需要配置 Supabase 相关环境变量：
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 关键技术决策

- **构建配置**: 禁用 Turbopack (`TURBOPACK=0`) 保证稳定性，`next.config.ts` 启用 `webpackBuildWorker` 优化性能
- **状态管理**: Zustand + Persist 持久化到 localStorage，使用 `merge` 函数处理 SSR hydration
- **拖拽实现**: @dnd-kit 支持触摸和鼠标，性能优秀
- **词库缓存**: LocalForage (IndexedDB) 存储，容量无 5MB 限制，版本号控制在 `lib/wordLoader.ts` 的 `CACHE_VERSION`
- **测试策略**: Jest + React Testing Library，覆盖率目标 70%，核心逻辑（puzzleGenerator, wordSelector）100% 覆盖
- **数据库设计**: `user_progress` 使用 `(user_id, vocab_mode, grade)` 联合唯一键，去重机制通过映射表实现多对一关系

## 数据库迁移

修改数据库 schema 时：
1. 在 `supabase/` 创建新的 SQL 文件
2. 使用 Supabase SQL Editor 执行迁移
3. 注意触发器执行顺序：先删除旧触发器再创建新的
4. 视图和函数的重建：先 DROP 再 CREATE (避免依赖问题)
5. 测试环境可使用 `reset_all_data.sql` 清空数据

## 设备去重机制

- 每个设备首次访问时生成唯一的 `device_id` (存在 localStorage)
- `auth.users` 通过 `auth_user_mapping` 表映射到 `public.users`
- 相同 `device_id` 的多次注册会映射到同一个 `public.users` 记录
- 防止用户刷新页面或重新登录产生重复账号
