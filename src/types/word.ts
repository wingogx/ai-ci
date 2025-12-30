/**
 * 单词数据结构
 */
export interface Word {
  id: string
  word: string
  phonetic?: string // 音标
  pos?: string // 词性: n, v, adj, adv 等
  meaning?: { zh: string; en: string } // 释义
}

/**
 * 词库数据结构
 */
export interface WordList {
  level: string
  totalWords: number
  version: number
  words: Word[]
}

/**
 * 词库等级 - CEFR 国际标准
 */
export type CEFRLevel = 'a1' | 'a2' | 'b1' | 'b2' | 'c1' | 'c2'

/**
 * 词库等级 - 中国教材
 */
export type ChinaLevel = 'primary' | 'junior' | 'senior' | 'cet4' | 'cet6'

/**
 * 词库模式
 */
export type WordListMode = 'cefr' | 'china'

/**
 * 所有词库等级
 */
export type WordLevel = CEFRLevel | ChinaLevel
