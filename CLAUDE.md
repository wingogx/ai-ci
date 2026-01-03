# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

爱词鸭 (WordDuck) - 单词拼图游戏学习应用，面向全球英语学习者。采用娱乐优先、无门槛设计理念。

## 常用命令

```bash
# 开发服务器 (localhost:3000)
cd wordduck && npm run dev

# 生产构建 (使用 Webpack，已禁用 Turbopack)
cd wordduck && npm run build

# ESLint 检查
cd wordduck && npm run lint

# 运行测试
cd wordduck && npm test

# 运行单个测试文件
cd wordduck && npm test -- puzzleGenerator.test.ts

# 监视模式测试
cd wordduck && npm run test:watch

# 测试覆盖率 (阈值: 70%)
cd wordduck && npm run test:coverage
```

## 技术栈

- **框架**: Next.js 16 (App Router) + React 19
- **语言**: TypeScript 5 (严格模式)
- **样式**: Tailwind CSS 4 (PostCSS)
- **状态管理**: Zustand 5 (localStorage 持久化)
- **拖拽系统**: @dnd-kit/core + sortable
- **动画**: framer-motion 12
- **本地存储**: localforage (IndexedDB 封装)
- **测试**: Jest 30 + @testing-library/react (70% 覆盖率阈值)

## 代码架构

### 目录结构 (wordduck/src/)
```
app/                 # Next.js App Router 页面
  ├── page.tsx       # 首页 (词库/等级选择)
  ├── layout.tsx     # 根布局
  └── game/page.tsx  # 游戏页面 (拖拽拼图)
components/
  ├── ui/            # Button, Modal, Select
  ├── game/          # PuzzleBoard, LetterPool, Letter, PuzzleCell, WordCard, GameHeader
  ├── feedback/      # Confetti, BadgeModal
  └── home/          # 首页专用组件
stores/              # Zustand 状态: useGameStore, useUserStore
hooks/               # useSpeech (TTS), useGame
lib/                 # 核心算法: puzzleGenerator, wordSelector, wordLoader, storage
data/                # badges.ts 勋章配置, words/ 词库数据
types/               # word.ts, game.ts, user.ts
utils/               # cn (classnames), helpers
i18n/                # zh.ts, en.ts, 翻译函数 t()
__tests__/           # Jest 单元测试 (lib/ 目录下)
```

### 核心状态 Store

- `useGameStore`: 当前关卡、拼图布局、已放置字母 (placedLetters Map)、帮助次数、正确/错误格子状态
- `useUserStore`: 语言设置、词库模式、等级、学习进度 (learnedWords/helpedWords Set)、连续天数、勋章

### 核心算法

1. **拼图生成** (`lib/puzzleGenerator.ts`):
   - `generatePuzzle(words, options)` - 主入口，带重试机制
   - 最长词横向居中，其余词通过共同字母交叉放置
   - `validateWord/isPuzzleComplete` - 验证逻辑
   - 预填比例由等级决定:
     - CEFR: A1(50%) → A2(45%) → B1(40%) → B2(35%) → C1(25%) → C2(15%)
     - 中国教材: 小学(50%) → 初中(40%) → 高中(30%) → 四级(25%) → 六级(20%)

2. **出词选择** (`lib/wordSelector.ts`):
   - `selectWordsForLevel()` - 优先级: 重学词 → 未学词 → 已学词补充
   - `updateProgressAfterLevel()` - 通关后更新进度
   - 确保 100% 词汇覆盖

3. **词库加载** (`lib/wordLoader.ts`):
   - IndexedDB 缓存 + 动态 import 加载
   - 支持离线使用（有缓存时）
   - 词库数据位于 `data/words/cefr/` 和 `data/words/china/`

### 关键数据结构 (types/game.ts)

- `PuzzleCell`: 单个拼图格子 {id, letter, isPreFilled, isCrossPoint, wordIds, position}
- `PuzzleWord`: 拼图中的单词 {id, word, direction, startPos, cells, isCompleted, isCorrect}
- `PuzzleLayout`: 完整拼图布局 {grid, words, size, allLetters}

### 游戏流程

```
首页选择词库+等级 → loadWordList() 加载词库
  → selectWordsForLevel() 选词 → generatePuzzle() 生成拼图
  → 用户拖拽字母 → checkWord() 验证 → 通关更新进度
```

- 普通关 → 撒花效果 → 自动下一关
- 挑战关 (每5关) → 勋章展示 → 下一关
- 使用帮助：本关单词加入重学列表，不计入已学
- 单词数量随关卡递增: 1-10关(4-5词) → 11-25关(5-6词) → 26-50关(6-7词) → 51+关(7-8词)

## 词库模式

- **CEFR国际标准**: A1(1060) / A2(1352) / B1(2354) / B2(2691) / C1(1010) / C2(973)
- **中国教材**: 小学(503) / 初中(1600) / 高中(3500) / 四级(4500) / 六级(6352)

词库文件位于 `src/data/words/` 目录

## 路径别名

使用 `@/*` 映射到 `./src/*`

## 详细文档

- `docs/prd.md` - 产品需求文档
- `docs/design.md` - 技术设计方案 (含数据结构定义)
- `docs/development-plan.md` - 开发计划

## 文件依赖顺序

开发新功能时建议按此顺序：
1. `types/` → 先定义类型
2. `data/` → 准备数据
3. `lib/` → 核心算法
4. `stores/` → 状态管理
5. `hooks/` → 自定义 Hooks
6. `components/` → UI 组件
7. `app/` → 页面组装

## 发音系统

`hooks/useSpeech.ts` 使用 Web Speech API (TTS)：
- 优先美式英语 (en-US)
- 函数: `speak(text)`, `speakWords(words)`, `stop()`

## 勋章系统

`data/badges.ts` 配置勋章（共 72 个），每个等级独立计算：

### 等级专属勋章（11 等级 × 6 = 66 个）
- **词汇勋章**: 5% 🚀 启程 → 15% ⭐ 小成
- **进度勋章**: 25% 🌱 起步 → 50% 🌿 进阶 → 75% 🌳 精通 → 100% 🎓 毕业

覆盖等级：
- CEFR: A1, A2, B1, B2, C1, C2
- 中国教材: 小学, 初中, 高中, 四级, 六级

### 通用勋章（6 个）
- **连续学习**: 3天 🔥 / 7天 💪 / 30天 🏆
- **关卡成就**: 第1关 🧊 / 第5关 ⭐ / 第10关 🎯

## 国际化

使用 `i18n/index.ts` 中的 `t()` 函数：

```typescript
import { t } from '@/i18n';

// 基础用法
t('game.title', lang)  // lang: 'zh' | 'en'

// 带参数替换
t('game.level', lang, { level: '5' })
```

翻译资源: `i18n/zh.ts`, `i18n/en.ts`

## 开发约定

- 所有交互回答使用中文
- Python 环境: python3/pip3
- Node 环境: node/npm
- 搜索简单字符串用 Grep，结构化模式用 ast-grep
