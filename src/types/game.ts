import type { Word } from './word'

/**
 * 拼图格子
 */
export interface PuzzleCell {
  id: string
  letter: string | null
  isPreFilled: boolean
  isCrossPoint: boolean
  wordIds: string[]
  position: Position
}

/**
 * 位置坐标
 */
export interface Position {
  row: number
  col: number
}

/**
 * 单词方向
 */
export type Direction = 'horizontal' | 'vertical'

/**
 * 拼图中的单词
 */
export interface PuzzleWord {
  id: string
  word: string
  direction: Direction
  startPos: Position
  cells: PuzzleCell[]
  isCompleted: boolean
  isCorrect: boolean
}

/**
 * 拼图布局
 */
export interface PuzzleLayout {
  grid: PuzzleCell[][]
  words: PuzzleWord[]
  size: { rows: number; cols: number }
  allLetters: string[] // 字母池中的所有字母
}

/**
 * 拼图生成选项
 */
export interface PuzzleOptions {
  preFillRatio: number // 预填比例 0-1
  maxRetries?: number // 最大重试次数
}

/**
 * 关卡类型
 */
export type LevelType = 'normal' | 'challenge'

/**
 * 关卡信息
 */
export interface LevelInfo {
  level: number
  type: LevelType
  wordCount: number
  words: Word[]
}

/**
 * 游戏状态枚举
 */
export type GameStatus = 'idle' | 'playing' | 'completed' | 'failed'

/**
 * 放置的字母记录
 */
export interface PlacedLetter {
  cellId: string
  letter: string
  fromPool: boolean // 是否来自字母池
}
