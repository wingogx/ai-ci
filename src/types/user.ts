import type { WordLevel, WordListMode } from './word'

/**
 * 用户语言设置
 */
export type Language = 'zh' | 'en'

/**
 * 用户设置
 */
export interface UserSettings {
  language: Language
  wordListMode: WordListMode
  currentGrade: WordLevel
  soundEnabled: boolean
  vibrateEnabled: boolean
}

/**
 * 单个等级的进度
 */
export interface GradeProgress {
  completedLevels: number
  learnedWords: string[]
  helpedWords: string[] // 使用帮助的词，需要重学
  helpCount: number
  levelWords: { [level: number]: string[] } // 每关学过的词汇（用于复习关卡）
}

/**
 * 用户进度
 */
export interface UserProgress {
  [grade: string]: GradeProgress
}

/**
 * 用户统计
 */
export interface UserStats {
  streakDays: number
  lastPlayDate: string
  totalWordsLearned: number // 保留兼容，不再使用
  totalLevelsCompleted: number
  // 分词库累计
  cefrWordsLearned: number
  chinaWordsLearned: number
  cefrLevelsCompleted: number
  chinaLevelsCompleted: number
}

/**
 * 勋章
 */
export interface Badge {
  id: string
  name: { zh: string; en: string }
  description: { zh: string; en: string }
  icon: string
  earnedAt?: string
}

/**
 * 完整用户数据
 */
export interface UserData {
  version: number
  settings: UserSettings
  progress: UserProgress
  stats: UserStats
  badges: string[]
}

/**
 * 默认用户设置
 */
export const DEFAULT_USER_SETTINGS: UserSettings = {
  language: 'zh',
  wordListMode: 'cefr',
  currentGrade: 'a1',
  soundEnabled: true,
  vibrateEnabled: true,
}

/**
 * 默认等级进度
 */
export const DEFAULT_GRADE_PROGRESS: GradeProgress = {
  completedLevels: 0,
  learnedWords: [],
  helpedWords: [],
  helpCount: 3, // 新用户初始 3 次帮助
  levelWords: {}, // 记录每关学过的词汇
}

/**
 * 默认用户统计
 */
export const DEFAULT_USER_STATS: UserStats = {
  streakDays: 0,
  lastPlayDate: '',
  totalWordsLearned: 0,
  totalLevelsCompleted: 0,
  cefrWordsLearned: 0,
  chinaWordsLearned: 0,
  cefrLevelsCompleted: 0,
  chinaLevelsCompleted: 0,
}

/**
 * 默认用户数据
 */
export const DEFAULT_USER_DATA: UserData = {
  version: 1,
  settings: DEFAULT_USER_SETTINGS,
  progress: {},
  stats: DEFAULT_USER_STATS,
  badges: [],
}
