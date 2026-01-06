'use client'

import { useCallback, useEffect, useState } from 'react'
import { useGameStore, useUserStore } from '@/stores'
import { useSpeech } from './useSpeech'
import { loadWordList } from '@/lib/wordLoader'
import { loadThemeData } from '@/lib/themeLoader'
import type { Word } from '@/types'
import type { ThemeData } from '@/lib/themeSelector'

/**
 * 游戏主逻辑 Hook
 */
export function useGame() {
  const [isLoading, setIsLoading] = useState(true)
  const [allWords, setAllWords] = useState<Word[]>([])
  const [themeData, setThemeData] = useState<ThemeData | null>(null)
  const [error, setError] = useState<string | null>(null)

  const { speak, speakWords } = useSpeech()

  // Game store
  const {
    currentLevel,
    isChallenge,
    isTutorialLevel,
    currentGrade: gameGrade,
    currentTheme,
    currentPuzzle,
    currentWords,
    placedLetters,
    usedPoolLetters,
    isCompleted,
    correctCells,
    wrongCells,
    helpCount,
    isHelpUsed,
    revealedWords,
    initLevel,
    placeLetter,
    removeLetter,
    useHelp: storeUseHelp,
    reset: resetGame,
  } = useGameStore()

  // User store
  const {
    settings,
    getCurrentProgress,
    addLearnedWord,
    addHelpedWord,
    completeLevel,
    addHelpCount,
    useHelp: userUseHelp,
  } = useUserStore()

  /**
   * 加载词库和主题数据
   */
  const loadWords = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // 加载词库
      const words = await loadWordList(settings.currentGrade)
      setAllWords(words)

      // 加载主题数据（仅小学和初中）
      const themes = await loadThemeData(settings.currentGrade)
      setThemeData(themes)
    } catch (err) {
      setError('加载词库失败，请检查网络连接')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [settings.currentGrade])

  /**
   * 开始新关卡
   */
  const startLevel = useCallback(
    (level: number) => {
      if (allWords.length === 0) return

      const progress = getCurrentProgress()
      const learnedWords = new Set(progress.learnedWords)
      const helpedWords = new Set(progress.helpedWords)

      initLevel(
        level,
        allWords,
        learnedWords,
        helpedWords,
        settings.currentGrade,
        progress.helpCount,
        themeData
      )
    },
    [allWords, themeData, getCurrentProgress, initLevel, settings.currentGrade]
  )

  /**
   * 播放当前关卡所有单词发音
   */
  const playAllWords = useCallback(() => {
    if (currentWords.length > 0 && settings.soundEnabled) {
      speakWords(currentWords.map((w) => w.word))
    }
  }, [currentWords, settings.soundEnabled, speakWords])

  /**
   * 播放单个单词发音
   */
  const playWord = useCallback(
    (word: string) => {
      if (settings.soundEnabled) {
        speak(word)
      }
    },
    [settings.soundEnabled, speak]
  )

  /**
   * 使用帮助
   */
  const useHelp = useCallback(() => {
    // 同时更新游戏状态和持久化存储
    storeUseHelp()
    userUseHelp()
  }, [storeUseHelp, userUseHelp])

  /**
   * 处理通关
   */
  const handleLevelComplete = useCallback(() => {
    if (!isCompleted) return

    // 更新进度
    if (isHelpUsed) {
      // 使用了帮助，单词加入重学列表
      currentWords.forEach((w) => addHelpedWord(w.id))
    } else {
      // 正常通关，单词计入已学
      currentWords.forEach((w) => addLearnedWord(w.id))
    }

    completeLevel(isHelpUsed, currentWords.length)

    // 每5关获得1次帮助
    if (currentLevel % 5 === 0) {
      addHelpCount(1)
    }
  }, [
    isCompleted,
    isHelpUsed,
    currentWords,
    currentLevel,
    addLearnedWord,
    addHelpedWord,
    completeLevel,
    addHelpCount,
  ])

  /**
   * 进入下一关
   */
  const nextLevel = useCallback(() => {
    startLevel(currentLevel + 1)
  }, [currentLevel, startLevel])

  // 等级变化时重置游戏状态（比较 store 中的 gameGrade 与 settings 中的 currentGrade）
  useEffect(() => {
    if (gameGrade !== null && gameGrade !== settings.currentGrade) {
      resetGame()
    }
  }, [gameGrade, settings.currentGrade, resetGame])

  // 加载词库
  useEffect(() => {
    loadWords()
  }, [loadWords])

  // 词库加载完成后开始游戏（只在首次加载时执行）
  useEffect(() => {
    if (allWords.length > 0 && !currentPuzzle) {
      // 对于小学和初中，需要等待主题数据加载完成
      const needsTheme = settings.currentGrade === 'primary' || settings.currentGrade === 'junior'
      const themeReady = !needsTheme || themeData !== null

      if (themeReady) {
        const progress = getCurrentProgress()
        startLevel(progress.completedLevels + 1)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allWords.length, themeData]) // 依赖词库和主题数据

  // 进入关卡时播放单词
  useEffect(() => {
    if (currentPuzzle && currentWords.length > 0) {
      // 延迟播放，等待渲染完成
      const timer = setTimeout(() => {
        playAllWords()
      }, 500)
      return () => clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPuzzle?.words.length])

  // 通关处理
  useEffect(() => {
    if (isCompleted) {
      handleLevelComplete()
    }
  }, [isCompleted, handleLevelComplete])

  return {
    // 状态
    isLoading,
    error,
    currentLevel,
    isChallenge,
    isTutorialLevel,
    currentTheme,
    currentPuzzle,
    currentWords,
    placedLetters,
    usedPoolLetters,
    isCompleted,
    correctCells,
    wrongCells,
    helpCount,
    isHelpUsed,
    revealedWords,

    // 方法
    startLevel,
    placeLetter,
    removeLetter,
    useHelp,
    nextLevel,
    playAllWords,
    playWord,
    loadWords,
  }
}

export default useGame
