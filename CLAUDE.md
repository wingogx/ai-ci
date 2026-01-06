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
- 生成交叉词拼图，自动检测单词共同字母进行交叉
- 输出 `PuzzleLayout` 包含 grid、words、allLetters

**单词选择** (`lib/wordSelector.ts`)
- 三优先级：需重学词 > 未学词 > 已学词
- 难度递进：1-5关最长4字母，6-10关5字母，11-20关6字母，21+无限制

**状态管理** (`stores/`)
- `useGameStore`: 当前关卡、拼图、放置字母状态
- `useUserStore`: 用户设置、各等级进度、统计、勋章 (localStorage 持久化)
- `useAuthStore`: 认证状态

**认证与去重** (`lib/auth/`)
- 设备认证 (`deviceAuth.ts`): 首次访问自动生成设备ID创建匿名用户
- Device ID 去重机制：通过 `auth_user_mapping` 表防止同一设备创建多个用户
- 微信OAuth支持

**词库** (`data/words/`)
- CEFR: A1-C2 (6个级别)
- 中国教材: 小学-CET6 (5个级别)
- 动态导入 + localStorage 缓存

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
- `handle_new_auth_user()`: 新用户创建触发器，基于 device_id 去重
- `bind_invitation()`: 处理邀请绑定和奖励发放
- `get_user_by_id()`: 通过映射表获取用户
- `clean_duplicate_anonymous_users()`: 清理无数据的重复匿名用户

RLS 策略：所有表启用行级安全，用户只能访问自己的数据（排行榜等例外）

### 类型定义

- `types/game.ts`: PuzzleLayout, PuzzleWord, PuzzleCell
- `types/word.ts`: Word, WordList, VocabMode, Grade
- `types/user.ts`: UserSettings, GradeProgress, UserStats

## 环境变量

需要配置 Supabase 相关环境变量：
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 注意事项

- 构建时禁用 Turbopack (`TURBOPACK=0`) 以保证稳定性
- Zustand stores 使用 persist 中间件，注意 SSR hydration 问题
- 词库缓存版本控制在 `lib/wordLoader.ts` 的 `CACHE_VERSION`
- 测试覆盖率目标：70% (branches, functions, lines, statements)

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
