import {
  selectWordsForLevel,
  isAllWordsLearned,
  getLearningProgress,
  updateProgressAfterLevel,
} from '@/lib/wordSelector'
import type { Word } from '@/types'

describe('出词算法', () => {
  const mockWords: Word[] = [
    { id: '1', word: 'cat' },
    { id: '2', word: 'dog' },
    { id: '3', word: 'book' },
    { id: '4', word: 'apple' },
    { id: '5', word: 'happy' },
    { id: '6', word: 'school' },
    { id: '7', word: 'teacher' },
  ]

  describe('selectWordsForLevel', () => {
    test('返回指定数量的单词', () => {
      const result = selectWordsForLevel(mockWords, new Set(), new Set(), 3)
      expect(result.words.length).toBe(3)
    })

    test('返回指定数量的单词（4个）', () => {
      const result = selectWordsForLevel(mockWords, new Set(), new Set(), 4)
      expect(result.words.length).toBe(4)
    })

    test('优先返回未学过的词', () => {
      const learned = new Set(['1', '2'])
      const result = selectWordsForLevel(mockWords, learned, new Set(), 3)
      const ids = result.words.map((w) => w.id)
      expect(ids).not.toContain('1')
      expect(ids).not.toContain('2')
    })

    test('需要重学的词优先出现', () => {
      const helped = new Set(['3'])
      const result = selectWordsForLevel(mockWords, new Set(), helped, 3)
      expect(result.words.some((w) => w.id === '3')).toBe(true)
      expect(result.hasRelearn).toBe(true)
    })

    test('未学词不足时从已学词补充', () => {
      const learned = new Set(['1', '2', '3', '4', '5', '6'])
      const result = selectWordsForLevel(mockWords, learned, new Set(), 3)
      expect(result.words.length).toBe(3)
    })

    test('空词库返回空数组', () => {
      const result = selectWordsForLevel([], new Set(), new Set(), 3)
      expect(result.words.length).toBe(0)
    })

    test('词库数量小于需求时返回全部', () => {
      const result = selectWordsForLevel(
        mockWords.slice(0, 2),
        new Set(),
        new Set(),
        5
      )
      expect(result.words.length).toBe(2)
    })

    test('已学过的词不会作为重学词', () => {
      const learned = new Set(['3'])
      const helped = new Set(['3'])
      const result = selectWordsForLevel(mockWords, learned, helped, 3)
      // id=3 已学过，不应该标记为 hasRelearn
      expect(result.hasRelearn).toBe(false)
    })
  })

  describe('isAllWordsLearned', () => {
    test('全部学完返回true', () => {
      const learned = new Set(['1', '2', '3', '4', '5', '6', '7'])
      expect(isAllWordsLearned(mockWords, learned)).toBe(true)
    })

    test('未全部学完返回false', () => {
      const learned = new Set(['1', '2', '3'])
      expect(isAllWordsLearned(mockWords, learned)).toBe(false)
    })

    test('空词库返回true', () => {
      expect(isAllWordsLearned([], new Set())).toBe(true)
    })
  })

  describe('getLearningProgress', () => {
    test('正确计算进度', () => {
      const learned = new Set(['1', '2', '3'])
      const progress = getLearningProgress(mockWords, learned)
      expect(progress.learned).toBe(3)
      expect(progress.total).toBe(7)
      expect(progress.percentage).toBe(43) // 3/7 ≈ 43%
    })

    test('未学习时进度为0', () => {
      const progress = getLearningProgress(mockWords, new Set())
      expect(progress.learned).toBe(0)
      expect(progress.percentage).toBe(0)
    })

    test('全部学完时进度为100', () => {
      const learned = new Set(['1', '2', '3', '4', '5', '6', '7'])
      const progress = getLearningProgress(mockWords, learned)
      expect(progress.percentage).toBe(100)
    })

    test('空词库进度为0', () => {
      const progress = getLearningProgress([], new Set())
      expect(progress.percentage).toBe(0)
    })
  })

  describe('updateProgressAfterLevel', () => {
    const completedWords: Word[] = [
      { id: '1', word: 'cat' },
      { id: '2', word: 'dog' },
    ]

    test('正常通关时词计入已学', () => {
      const { learnedWords } = updateProgressAfterLevel(
        completedWords,
        false,
        new Set(),
        new Set()
      )
      expect(learnedWords.has('1')).toBe(true)
      expect(learnedWords.has('2')).toBe(true)
    })

    test('使用帮助时词不计入已学', () => {
      const { learnedWords, helpedWords } = updateProgressAfterLevel(
        completedWords,
        true,
        new Set(),
        new Set()
      )
      expect(learnedWords.has('1')).toBe(false)
      expect(learnedWords.has('2')).toBe(false)
      expect(helpedWords.has('1')).toBe(true)
      expect(helpedWords.has('2')).toBe(true)
    })

    test('正常通关时从重学列表移除', () => {
      const initialHelped = new Set(['1'])
      const { helpedWords } = updateProgressAfterLevel(
        completedWords,
        false,
        new Set(),
        initialHelped
      )
      expect(helpedWords.has('1')).toBe(false)
    })

    test('保留已有的已学词', () => {
      const initialLearned = new Set(['3'])
      const { learnedWords } = updateProgressAfterLevel(
        completedWords,
        false,
        initialLearned,
        new Set()
      )
      expect(learnedWords.has('3')).toBe(true)
      expect(learnedWords.has('1')).toBe(true)
    })
  })
})
