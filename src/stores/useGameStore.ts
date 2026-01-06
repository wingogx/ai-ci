import { create } from 'zustand'
import type { PuzzleLayout, Word } from '@/types'
import {
  generatePuzzle,
  validateWord,
  isWordComplete,
} from '@/lib/puzzleGenerator'
import { selectWordsForLevelWithTheme } from '@/lib/wordSelector'
import type { ThemeData } from '@/lib/themeSelector'
import { getWordCountForLevel, getPreFillRatio, isChallengeLevel } from '@/utils'

// 教学关卡数量（前N关自动显示答案）
const TUTORIAL_LEVELS = 3

interface GameState {
  // 当前关卡
  currentLevel: number
  isChallenge: boolean
  isTutorialLevel: boolean // 是否为教学关卡（前3关）

  // 当前使用的词库等级（用于检测等级切换）
  currentGrade: string | null

  // 当前主题（如果是主题关卡）
  currentTheme: { id: string; name: string } | null

  // 当前拼图
  currentPuzzle: PuzzleLayout | null
  currentWords: Word[]

  // 用户操作
  placedLetters: Map<string, string> // cellId -> letter
  usedPoolLetters: Set<string> // poolLetterId set

  // 游戏状态
  isCompleted: boolean
  correctCells: Set<string>
  wrongCells: Set<string>

  // 帮助
  helpCount: number
  isHelpUsed: boolean

  // 显示的单词（使用帮助后显示，或教学关卡自动显示）
  revealedWords: string[]

  // Actions
  initLevel: (
    level: number,
    allWords: Word[],
    learnedWords: Set<string>,
    helpedWords: Set<string>,
    grade: string,
    helpCount: number,
    themeData?: ThemeData | null
  ) => void
  placeLetter: (cellId: string, poolLetterId: string, letter: string) => void
  removeLetter: (cellId: string) => void
  checkWord: (wordId: string) => boolean
  checkAllWords: () => { allCorrect: boolean; completedWords: string[] }
  useHelp: () => void
  reset: () => void
}

export const useGameStore = create<GameState>((set, get) => ({
  currentLevel: 1,
  isChallenge: false,
  isTutorialLevel: true,
  currentGrade: null,
  currentTheme: null,
  currentPuzzle: null,
  currentWords: [],
  placedLetters: new Map(),
  usedPoolLetters: new Set(),
  isCompleted: false,
  correctCells: new Set(),
  wrongCells: new Set(),
  helpCount: 0,
  isHelpUsed: false,
  revealedWords: [],

  initLevel: (level, allWords, learnedWords, helpedWords, grade, helpCount, themeData = null) => {
    const isChallenge = isChallengeLevel(level)
    const isTutorialLevel = level <= TUTORIAL_LEVELS
    const wordCount = getWordCountForLevel(level)
    const preFillRatio = getPreFillRatio(grade)

    // 尝试生成拼图，最多重试 10 次（每次选不同的词）
    let puzzle = null
    let words: Word[] = []
    let theme: { id: string; name: string } | null = null
    let attempts = 0
    const maxAttempts = 10
    const triedWordCombos = new Set<string>()

    while (!puzzle && attempts < maxAttempts) {
      attempts++

      // 选择单词（使用主题模式选词，传入 level 控制词长）
      const result = selectWordsForLevelWithTheme(
        allWords,
        learnedWords,
        helpedWords,
        wordCount,
        level,
        grade,
        themeData
      )
      words = result.words
      theme = result.theme || null

      // 检查是否已尝试过相同的词组合
      const comboKey = words.map((w) => w.id).sort().join(',')
      if (triedWordCombos.has(comboKey)) {
        // 临时标记一个词为"已学"以强制选择不同的词
        if (words.length > 0) {
          learnedWords.add(words[0].id)
        }
        continue
      }
      triedWordCombos.add(comboKey)

      // 生成拼图
      const wordStrings = words.map((w) => w.word)
      try {
        puzzle = generatePuzzle(wordStrings, { preFillRatio, maxRetries: 100 })
      } catch (error) {
        console.warn(`拼图生成失败 (尝试 ${attempts}/${maxAttempts}):`, error)
        // 临时标记这些词为"已学"以便下次选不同的词
        if (attempts < maxAttempts) {
          words.forEach((w) => learnedWords.add(w.id))
        }
      }
    }

    if (!puzzle) {
      // 最后兜底：减少单词数量再试一次
      console.warn('尝试减少单词数量...')
      const reducedCount = Math.max(2, wordCount - 1)
      const result = selectWordsForLevelWithTheme(
        allWords,
        new Set(), // 重置已学列表
        helpedWords,
        reducedCount,
        level,
        grade,
        themeData
      )
      words = result.words
      theme = result.theme || null
      const wordStrings = words.map((w) => w.word)
      try {
        puzzle = generatePuzzle(wordStrings, { preFillRatio, maxRetries: 200 })
      } catch (error) {
        console.error('无法生成拼图，请刷新页面重试:', error)
        return
      }
    }

    set({
      currentLevel: level,
      isChallenge,
      isTutorialLevel,
      currentGrade: grade,
      currentTheme: theme,
      currentPuzzle: puzzle,
      currentWords: words,
      placedLetters: new Map(),
      usedPoolLetters: new Set(),
      isCompleted: false,
      correctCells: new Set(),
      wrongCells: new Set(),
      helpCount,
      isHelpUsed: false,
      // 教学关卡自动显示答案，帮助新手快速入门
      revealedWords: isTutorialLevel ? words.map((w) => w.word) : [],
    })
  },

  placeLetter: (cellId, poolLetterId, letter) => {
    const { placedLetters, usedPoolLetters, currentPuzzle } = get()

    if (!currentPuzzle) return

    // 检查格子是否已经有字母
    const cell = currentPuzzle.grid.flat().find((c) => c.id === cellId)
    if (!cell || cell.isPreFilled || placedLetters.has(cellId)) return

    const newPlacedLetters = new Map(placedLetters)
    const newUsedPoolLetters = new Set(usedPoolLetters)

    newPlacedLetters.set(cellId, letter)
    newUsedPoolLetters.add(poolLetterId)

    set({
      placedLetters: newPlacedLetters,
      usedPoolLetters: newUsedPoolLetters,
      wrongCells: new Set(), // 清除错误状态
    })

    // 自动检查包含此格子的单词
    const affectedWords = currentPuzzle.words.filter((w) =>
      w.cells.some((c) => c.id === cellId)
    )

    for (const word of affectedWords) {
      if (isWordComplete(word, newPlacedLetters)) {
        get().checkWord(word.id)
      }
    }
  },

  removeLetter: (cellId) => {
    const { placedLetters, usedPoolLetters, currentPuzzle } = get()

    if (!currentPuzzle || !placedLetters.has(cellId)) return

    const letter = placedLetters.get(cellId)!
    const newPlacedLetters = new Map(placedLetters)
    const newUsedPoolLetters = new Set(usedPoolLetters)

    newPlacedLetters.delete(cellId)

    // 找到对应的 pool letter ID 并移除
    const letterCount = currentPuzzle.allLetters.filter((l) => l === letter)
    for (let i = 0; i < letterCount.length; i++) {
      const poolId = `pool-${letter}-${i}`
      if (newUsedPoolLetters.has(poolId)) {
        newUsedPoolLetters.delete(poolId)
        break
      }
    }

    set({
      placedLetters: newPlacedLetters,
      usedPoolLetters: newUsedPoolLetters,
    })
  },

  checkWord: (wordId) => {
    const { currentPuzzle, placedLetters, correctCells, wrongCells } = get()

    if (!currentPuzzle) return false

    const word = currentPuzzle.words.find((w) => w.id === wordId)
    if (!word) return false

    const isCorrect = validateWord(word, placedLetters)

    if (isCorrect) {
      // 标记所有格子为正确
      const newCorrectCells = new Set(correctCells)
      word.cells.forEach((cell) => newCorrectCells.add(cell.id))

      set({ correctCells: newCorrectCells })

      // 检查是否全部完成
      const allComplete = currentPuzzle.words.every((w) =>
        w.cells.every((c) => newCorrectCells.has(c.id) || c.isPreFilled)
      )

      if (allComplete) {
        set({ isCompleted: true })
      }
    } else {
      // 标记为错误
      const newWrongCells = new Set(wrongCells)
      word.cells
        .filter((c) => !c.isPreFilled)
        .forEach((cell) => newWrongCells.add(cell.id))

      set({ wrongCells: newWrongCells })

      // 清除错误状态（延迟）
      setTimeout(() => {
        set({ wrongCells: new Set() })
      }, 500)
    }

    return isCorrect
  },

  checkAllWords: () => {
    const { currentPuzzle, placedLetters } = get()

    if (!currentPuzzle) {
      return { allCorrect: false, completedWords: [] }
    }

    const completedWords: string[] = []
    let allCorrect = true

    for (const word of currentPuzzle.words) {
      if (isWordComplete(word, placedLetters)) {
        if (validateWord(word, placedLetters)) {
          completedWords.push(word.word)
        } else {
          allCorrect = false
        }
      } else {
        allCorrect = false
      }
    }

    return { allCorrect, completedWords }
  },

  useHelp: () => {
    const { helpCount, currentWords } = get()

    if (helpCount <= 0) return

    set({
      helpCount: helpCount - 1,
      isHelpUsed: true,
      revealedWords: currentWords.map((w) => w.word),
    })
  },

  reset: () => {
    set({
      currentLevel: 1,
      isChallenge: false,
      isTutorialLevel: true,
      currentGrade: null,
      currentTheme: null,
      currentPuzzle: null,
      currentWords: [],
      placedLetters: new Map(),
      usedPoolLetters: new Set(),
      isCompleted: false,
      correctCells: new Set(),
      wrongCells: new Set(),
      helpCount: 0,
      isHelpUsed: false,
      revealedWords: [],
    })
  },
}))

export default useGameStore
