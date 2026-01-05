# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

WordDuck（爱词鸭）是一个英语单词拼图学习应用。用户通过拖拽字母完成交叉词拼图来学习单词。

## 常用命令

```bash
npm run dev          # 启动开发服务器 (localhost:3000)
npm run build        # 生产构建 (禁用Turbopack)
npm run lint         # ESLint 代码检查
npm test             # 运行所有测试
npm run test:watch   # 监视模式测试
npm run test:coverage # 生成覆盖率报告 (目标70%)

# 运行单个测试文件
npx jest src/__tests__/lib/puzzleGenerator.test.ts
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

**认证** (`lib/auth/`)
- 设备认证 (`deviceAuth.ts`): 首次访问自动生成设备ID创建匿名用户
- 微信OAuth支持

**词库** (`data/words/`)
- CEFR: A1-C2 (6个级别)
- 中国教材: 小学-CET6 (5个级别)
- 动态导入 + localStorage 缓存

### 数据库 (Supabase)

Schema 在 `supabase/schema.sql`，主要表：
- `users`: 用户信息
- `user_progress`: 各等级进度 (唯一约束: user_id + vocab_mode + grade)
- `user_stats`: 统计数据
- `user_badges`: 已解锁勋章
- `learning_history`: 学习记录

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
