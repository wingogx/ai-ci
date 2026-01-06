import type { Word } from '@/types'
import { shuffle } from '@/utils/helpers'

/**
 * 主题数据结构
 */
export interface Theme {
  id: string
  name: string
  level: string
  words: string[] // 词ID列表
  wordCount: number
}

/**
 * 主题词库数据
 */
export interface ThemeData {
  level: string
  totalThemes: number
  themes: Theme[]
}

/**
 * 按词长分组
 */
function groupByLength(words: Word[]): Map<number, Word[]> {
  const groups = new Map<number, Word[]>()

  words.forEach((word) => {
    const length = word.word.length
    if (!groups.has(length)) {
      groups.set(length, [])
    }
    groups.get(length)!.push(word)
  })

  return groups
}

/**
 * 检查两个单词是否有共同字母
 */
function hasCommonLetter(word1: string, word2: string): boolean {
  const letters1 = new Set(word1.toLowerCase())
  for (const letter of word2.toLowerCase()) {
    if (letters1.has(letter)) return true
  }
  return false
}

/**
 * 检查候选词是否可以与已选词列表中的某个词交叉
 */
function canCrossWithAny(candidate: Word, selected: Word[]): boolean {
  if (selected.length === 0) return true
  return selected.some((w) => hasCommonLetter(candidate.word, w.word))
}

/**
 * 从主题中选择单词
 *
 * 策略：
 * 1. 按词长从短到长排序（短词更简单）
 * 2. 在相同词长组内随机选择
 * 3. 确保选的词可以交叉
 *
 * @param allWords 完整词库
 * @param themeWordIds 主题词ID列表
 * @param learnedWords 已学单词ID集合
 * @param helpedWords 需要重学的单词ID集合
 * @param wordCount 需要的单词数量
 */
export function selectWordsFromTheme(
  allWords: Word[],
  themeWordIds: string[],
  learnedWords: Set<string>,
  helpedWords: Set<string>,
  wordCount: number = 4
): Word[] {
  const result: Word[] = []

  console.log('[selectWordsFromTheme] 开始选词:', {
    totalWords: allWords.length,
    themeWordIds: themeWordIds.length,
    wordCount
  })

  // 1. 筛选主题词
  const themeWords = allWords.filter((w) => themeWordIds.includes(w.id))

  console.log('[selectWordsFromTheme] 筛选主题词:', {
    themeWords: themeWords.length,
    themeWordIdsExample: themeWordIds.slice(0, 3),
    allWordsIdsExample: allWords.slice(0, 3).map(w => w.id)
  })

  if (themeWords.length === 0) {
    console.warn('[selectWordsFromTheme] 没有找到主题词！')
    return result
  }

  // 2. 分类：未学的、需要重学的、已学的
  const unlearned = themeWords.filter(
    (w) => !learnedWords.has(w.id) && !helpedWords.has(w.id)
  )
  const relearn = themeWords.filter(
    (w) => helpedWords.has(w.id) && !learnedWords.has(w.id)
  )
  const learned = themeWords.filter((w) => learnedWords.has(w.id))

  // 3. 优先级：未学 > 需要重学 > 已学
  const candidates = [
    ...unlearned,
    ...relearn,
    ...learned,
  ]

  if (candidates.length === 0) {
    return result
  }

  // 4. 按词长分组
  const groups = groupByLength(candidates)
  const sortedLengths = Array.from(groups.keys()).sort((a, b) => a - b)

  // 5. 从最短的词开始选，逐步增加长度
  const addWordIfCrossable = (word: Word): boolean => {
    if (result.some((r) => r.id === word.id)) return false
    if (!canCrossWithAny(word, result)) return false
    result.push(word)
    return true
  }

  // 6. 按词长组依次尝试
  for (const length of sortedLengths) {
    if (result.length >= wordCount) break

    const group = groups.get(length)!
    const shuffled = shuffle([...group])

    for (const word of shuffled) {
      if (result.length >= wordCount) break
      addWordIfCrossable(word)
    }
  }

  // 7. 如果还不够，放宽交叉限制，直接添加
  if (result.length < wordCount) {
    for (const word of candidates) {
      if (result.length >= wordCount) break
      if (!result.some((r) => r.id === word.id)) {
        result.push(word)
      }
    }
  }

  return result
}

/**
 * 获取关卡类型
 *
 * @param level 关卡数（从1开始）
 * @returns 'theme' | 'challenge'
 */
export function getLevelType(level: number): 'theme' | 'challenge' {
  // 每5关一个难度关卡
  return level % 5 === 0 ? 'challenge' : 'theme'
}

/**
 * 获取关卡对应的主题索引
 *
 * 关卡规划：
 * 1-4: 主题0-3
 * 5: 难度关卡
 * 6-9: 主题4-7
 * 10: 难度关卡
 * 11-14: 主题8-11
 * 15: 难度关卡
 * 16-19: 主题12-15（循环开始）
 *
 * @param level 关卡数（从1开始）
 * @param totalThemes 总主题数
 * @returns 主题索引
 */
export function getThemeIndex(level: number, totalThemes: number): number {
  // 计算已经过了多少个难度关卡
  const challengeCount = Math.floor(level / 5)

  // 减去难度关卡，得到实际的主题关卡序号（从0开始）
  const themeSequence = level - challengeCount - 1

  // 循环使用主题
  return themeSequence % totalThemes
}

/**
 * 根据关卡获取主题
 *
 * @param level 关卡数
 * @param themeData 主题数据
 * @returns 主题对象，如果是难度关卡则返回 null
 */
export function getThemeForLevel(
  level: number,
  themeData: ThemeData | null
): Theme | null {
  if (!themeData || getLevelType(level) === 'challenge') {
    return null
  }

  const themeIndex = getThemeIndex(level, themeData.totalThemes)
  return themeData.themes[themeIndex] || null
}
