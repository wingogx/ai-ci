import { storage } from './storage'
import type { Word, WordList, WordLevel } from '@/types'

/**
 * 词库加载错误
 */
export class WordLoadError extends Error {
  constructor(level: string, cause?: Error) {
    super(`加载词库 ${level} 失败`)
    this.name = 'WordLoadError'
    this.cause = cause
  }
}

/**
 * 动态导入词库文件
 */
async function importWordList(level: WordLevel): Promise<WordList> {
  // CEFR 等级
  if (['a1', 'a2', 'b1', 'b2', 'c1', 'c2'].includes(level)) {
    const data = await import(`@/data/words/cefr/${level}.json`)
    return data.default || data
  }

  // 中国教材等级
  if (['primary', 'junior', 'senior', 'cet4', 'cet6'].includes(level)) {
    const data = await import(`@/data/words/china/${level}.json`)
    return data.default || data
  }

  throw new Error(`未知的词库等级: ${level}`)
}

/**
 * 带重试的词库加载
 */
async function loadWithRetry(
  level: WordLevel,
  retries: number = 3
): Promise<WordList> {
  let lastError: Error | undefined

  for (let i = 0; i < retries; i++) {
    try {
      return await importWordList(level)
    } catch (error) {
      lastError = error as Error
      // 递增延迟重试
      if (i < retries - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)))
      }
    }
  }

  throw new WordLoadError(level, lastError)
}

/**
 * 加载词库
 * @param level 词库等级
 * @returns 单词数组（按词长排序）
 */
// 缓存版本号 - 更改此值可强制刷新缓存
// v6: 2026-01-04 修复了中文含义被截断的问题
const CACHE_VERSION = 6

export async function loadWordList(level: WordLevel): Promise<Word[]> {
  const cacheKey = `words_${level}_v${CACHE_VERSION}`

  // 1. 先查本地缓存
  try {
    const cached = await storage.getWordCache<Word[]>(cacheKey)
    if (cached && cached.length > 0) {
      return cached
    }
  } catch (error) {
    console.warn('词库缓存读取失败:', error)
  }

  // 2. 动态导入词库
  const wordList = await loadWithRetry(level)

  // 3. 过滤太短的单词（少于3个字母的单词难以形成交叉拼图）
  const validWords = wordList.words.filter((w) => w.word.length >= 3)

  // 4. 按词长排序
  const sortedWords = [...validWords].sort(
    (a, b) => a.word.length - b.word.length
  )

  // 5. 存入缓存
  try {
    await storage.setWordCache(cacheKey, sortedWords)
  } catch (error) {
    console.warn('词库缓存写入失败:', error)
  }

  return sortedWords
}

/**
 * 预加载词库（后台加载，不阻塞）
 */
export function preloadWordList(level: WordLevel): void {
  loadWordList(level).catch((error) => {
    console.warn('词库预加载失败:', error)
  })
}

/**
 * 获取词库信息（不加载全部单词）
 */
export async function getWordListInfo(
  level: WordLevel
): Promise<{ level: string; totalWords: number; version: number }> {
  const wordList = await loadWithRetry(level)
  return {
    level: wordList.level,
    totalWords: wordList.totalWords,
    version: wordList.version,
  }
}

export default loadWordList
