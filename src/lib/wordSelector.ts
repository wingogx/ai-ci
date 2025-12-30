import type { Word } from '@/types'
import { shuffle } from '@/utils/helpers'

/**
 * 关卡单词选择结果
 */
export interface LevelWords {
  words: Word[]
  hasRelearn: boolean // 是否包含需要重学的词
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
 * 计算单词的"交叉友好度"分数
 * 包含更多常见字母的单词更容易形成交叉
 */
function getCrossabilityScore(word: string): number {
  const commonLetters = 'aeiorstnl' // 英语中最常见的字母
  let score = 0
  const w = word.toLowerCase()
  const uniqueLetters = new Set(w)
  for (const letter of uniqueLetters) {
    if (commonLetters.includes(letter)) {
      score += 2
    }
    score += 1 // 每个不同字母加1分
  }
  return score
}

/**
 * 检查候选词是否可以与已选词列表中的某个词交叉
 */
function canCrossWithAny(candidate: Word, selected: Word[]): boolean {
  if (selected.length === 0) return true
  return selected.some((w) => hasCommonLetter(candidate.word, w.word))
}

/**
 * 选择关卡单词
 *
 * 出词策略（100% 覆盖）：
 * 1. 优先出"需要重学"的词（用了帮助的）
 * 2. 其次出"未学过"的词（按词长排序）
 * 3. 如果未学词不足，从"已学词"中补充
 *
 * @param allWords 完整词库（已按词长排序）
 * @param learnedWords 已学单词 ID 集合
 * @param helpedWords 需要重学的单词 ID 集合
 * @param wordCount 本关需要的单词数量
 */
export function selectWordsForLevel(
  allWords: Word[],
  learnedWords: Set<string>,
  helpedWords: Set<string>,
  wordCount: number = 4
): LevelWords {
  const result: Word[] = []
  let hasRelearn = false

  // 辅助函数：添加可交叉的单词
  const addWordIfCrossable = (word: Word): boolean => {
    if (result.some((r) => r.id === word.id)) return false
    if (!canCrossWithAny(word, result)) return false
    result.push(word)
    return true
  }

  // 1. 优先放"需要重学"的词（用了帮助但还没重新学会的）
  const relearns = allWords.filter(
    (w) => helpedWords.has(w.id) && !learnedWords.has(w.id)
  )

  if (relearns.length > 0) {
    // 随机选一个需要重学的词
    const shuffledRelearns = shuffle([...relearns])
    for (const word of shuffledRelearns) {
      if (addWordIfCrossable(word)) {
        hasRelearn = true
        break
      }
    }
  }

  // 2. 从未学过的词中选取（优先选能交叉且交叉友好度高的）
  const unlearned = allWords.filter(
    (w) =>
      !learnedWords.has(w.id) &&
      !helpedWords.has(w.id) &&
      !result.some((r) => r.id === w.id)
  )

  // 按交叉友好度排序，然后随机选择前一半中的词（兼顾质量和多样性）
  const sortedUnlearned = [...unlearned].sort(
    (a, b) => getCrossabilityScore(b.word) - getCrossabilityScore(a.word)
  )
  // 从排名靠前的词中随机选择
  const topHalf = sortedUnlearned.slice(0, Math.max(wordCount * 3, sortedUnlearned.length))
  const shuffledUnlearned = shuffle(topHalf)
  for (const word of shuffledUnlearned) {
    if (result.length >= wordCount) break
    addWordIfCrossable(word)
  }

  // 3. 如果未学词不够，从已学词中补充
  if (result.length < wordCount) {
    const learned = allWords.filter(
      (w) => learnedWords.has(w.id) && !result.some((r) => r.id === w.id)
    )
    const shuffled = shuffle(learned)

    for (const word of shuffled) {
      if (result.length >= wordCount) break
      addWordIfCrossable(word)
    }
  }

  // 4. 如果还不够，从剩余的重学词中补充
  if (result.length < wordCount) {
    const remainingRelearns = relearns.filter(
      (w) => !result.some((r) => r.id === w.id)
    )

    for (const word of remainingRelearns) {
      if (result.length >= wordCount) break
      addWordIfCrossable(word)
    }
  }

  // 5. 最后兜底：如果仍不够，放宽交叉限制，直接添加
  if (result.length < wordCount) {
    const remaining = allWords.filter((w) => !result.some((r) => r.id === w.id))
    const shuffled = shuffle(remaining)
    for (const word of shuffled) {
      if (result.length >= wordCount) break
      result.push(word)
    }
  }

  return { words: result, hasRelearn }
}

/**
 * 检查是否已学完所有词汇
 */
export function isAllWordsLearned(
  allWords: Word[],
  learnedWords: Set<string>
): boolean {
  return allWords.every((w) => learnedWords.has(w.id))
}

/**
 * 获取学习进度
 */
export function getLearningProgress(
  allWords: Word[],
  learnedWords: Set<string>
): { learned: number; total: number; percentage: number } {
  const learned = allWords.filter((w) => learnedWords.has(w.id)).length
  const total = allWords.length
  const percentage = total > 0 ? Math.round((learned / total) * 100) : 0

  return { learned, total, percentage }
}

/**
 * 通关后更新进度
 */
export function updateProgressAfterLevel(
  completedWords: Word[],
  usedHelp: boolean,
  learnedWords: Set<string>,
  helpedWords: Set<string>
): { learnedWords: Set<string>; helpedWords: Set<string> } {
  const newLearnedWords = new Set(learnedWords)
  const newHelpedWords = new Set(helpedWords)

  if (usedHelp) {
    // 使用了帮助：词不计入已学，加入重学列表
    completedWords.forEach((w) => {
      newHelpedWords.add(w.id)
    })
  } else {
    // 正常通关：词计入已学
    completedWords.forEach((w) => {
      newLearnedWords.add(w.id)
      // 如果之前需要重学，现在学会了，从重学列表移除
      newHelpedWords.delete(w.id)
    })
  }

  return {
    learnedWords: newLearnedWords,
    helpedWords: newHelpedWords,
  }
}

export default selectWordsForLevel
