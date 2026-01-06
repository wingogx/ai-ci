import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type {
  Language,
  WordListMode,
  WordLevel,
  UserSettings,
  GradeProgress,
  UserStats,
} from '@/types'
import {
  DEFAULT_USER_SETTINGS,
  DEFAULT_GRADE_PROGRESS,
  DEFAULT_USER_STATS,
} from '@/types'
import { getTodayString, isConsecutiveDay, isToday } from '@/utils'

/**
 * 检测浏览器语言，返回适合的应用语言
 */
function detectBrowserLanguage(): Language {
  if (typeof window === 'undefined') return 'zh'

  const browserLang = navigator.language || (navigator as { userLanguage?: string }).userLanguage || ''
  // 中文环境返回 'zh'，其他返回 'en'
  return browserLang.toLowerCase().startsWith('zh') ? 'zh' : 'en'
}

interface UserState {
  // 设置
  settings: UserSettings

  // 进度 (按等级存储)
  progress: Record<string, GradeProgress>

  // 统计
  stats: UserStats

  // 勋章
  earnedBadges: string[]

  // Actions - 设置
  updateSettings: (updates: Partial<UserSettings>) => void
  setLanguage: (language: Language) => void
  setWordListMode: (mode: WordListMode) => void
  setCurrentGrade: (grade: WordLevel) => void
  toggleSound: () => void
  toggleVibrate: () => void

  // Actions - 进度
  getCurrentProgress: () => GradeProgress
  addLearnedWord: (wordId: string) => void
  addHelpedWord: (wordId: string) => void
  completeLevel: (usedHelp: boolean, wordsLearned: number, currentWords: { id: string }[]) => void
  addHelpCount: (count: number) => void
  useHelp: () => boolean

  // Actions - 统计
  updateStreak: () => void

  // Actions - 勋章
  earnBadge: (badgeId: string) => void
  hasBadge: (badgeId: string) => boolean

  // Actions - 数据
  clearAllData: () => void
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      settings: DEFAULT_USER_SETTINGS,
      progress: {},
      stats: DEFAULT_USER_STATS,
      earnedBadges: [],

      // 设置
      updateSettings: (updates) =>
        set((state) => ({
          settings: { ...state.settings, ...updates },
        })),

      setLanguage: (language) =>
        set((state) => ({
          settings: { ...state.settings, language },
        })),

      setWordListMode: (wordListMode) =>
        set((state) => ({
          settings: { ...state.settings, wordListMode },
        })),

      setCurrentGrade: (currentGrade) =>
        set((state) => ({
          settings: { ...state.settings, currentGrade },
        })),

      toggleSound: () =>
        set((state) => ({
          settings: { ...state.settings, soundEnabled: !state.settings.soundEnabled },
        })),

      toggleVibrate: () =>
        set((state) => ({
          settings: { ...state.settings, vibrateEnabled: !state.settings.vibrateEnabled },
        })),

      // 进度
      getCurrentProgress: () => {
        const { settings, progress } = get()
        const current = progress[settings.currentGrade] || { ...DEFAULT_GRADE_PROGRESS }
        return current
      },

      addLearnedWord: (wordId) => {
        const { settings, progress } = get()
        const grade = settings.currentGrade
        const current = progress[grade] || { ...DEFAULT_GRADE_PROGRESS }

        if (!current.learnedWords.includes(wordId)) {
          set({
            progress: {
              ...progress,
              [grade]: {
                ...current,
                learnedWords: [...current.learnedWords, wordId],
                // 从重学列表移除
                helpedWords: current.helpedWords.filter((id) => id !== wordId),
              },
            },
          })
        }
      },

      addHelpedWord: (wordId) => {
        const { settings, progress } = get()
        const grade = settings.currentGrade
        const current = progress[grade] || { ...DEFAULT_GRADE_PROGRESS }

        if (!current.helpedWords.includes(wordId)) {
          set({
            progress: {
              ...progress,
              [grade]: {
                ...current,
                helpedWords: [...current.helpedWords, wordId],
              },
            },
          })
        }
      },

      completeLevel: (usedHelp, wordsLearned, currentWords) => {
        const { settings, progress, stats } = get()
        const grade = settings.currentGrade
        const mode = settings.wordListMode
        const current = progress[grade] || { ...DEFAULT_GRADE_PROGRESS }

        // 记录当前关卡使用的单词ID
        const currentLevel = current.completedLevels + 1
        const wordIds = currentWords.map((w) => w.id)

        // 根据词库模式更新对应的累计统计
        const isCefr = mode === 'cefr'
        const wordsToAdd = usedHelp ? 0 : wordsLearned

        set({
          progress: {
            ...progress,
            [grade]: {
              ...current,
              completedLevels: currentLevel,
              levelWords: {
                ...(current.levelWords || {}),
                [currentLevel]: wordIds,
              },
            },
          },
          stats: {
            ...stats,
            totalLevelsCompleted: stats.totalLevelsCompleted + 1,
            totalWordsLearned: stats.totalWordsLearned + wordsToAdd,
            // 分词库累计
            cefrWordsLearned: isCefr
              ? (stats.cefrWordsLearned || 0) + wordsToAdd
              : stats.cefrWordsLearned || 0,
            chinaWordsLearned: !isCefr
              ? (stats.chinaWordsLearned || 0) + wordsToAdd
              : stats.chinaWordsLearned || 0,
            cefrLevelsCompleted: isCefr
              ? (stats.cefrLevelsCompleted || 0) + 1
              : stats.cefrLevelsCompleted || 0,
            chinaLevelsCompleted: !isCefr
              ? (stats.chinaLevelsCompleted || 0) + 1
              : stats.chinaLevelsCompleted || 0,
          },
        })

        // 更新连续天数
        get().updateStreak()
      },

      addHelpCount: (count) => {
        const { settings, progress } = get()
        const grade = settings.currentGrade
        const current = progress[grade] || { ...DEFAULT_GRADE_PROGRESS }

        set({
          progress: {
            ...progress,
            [grade]: {
              ...current,
              helpCount: Math.min(current.helpCount + count, 5), // 最多5次
            },
          },
        })
      },

      useHelp: () => {
        const { settings, progress } = get()
        const grade = settings.currentGrade
        const current = progress[grade] || { ...DEFAULT_GRADE_PROGRESS }

        if (current.helpCount <= 0) return false

        set({
          progress: {
            ...progress,
            [grade]: {
              ...current,
              helpCount: current.helpCount - 1,
            },
          },
        })

        return true
      },

      // 统计
      updateStreak: () => {
        const { stats } = get()
        const today = getTodayString()

        if (isToday(stats.lastPlayDate)) {
          // 今天已经玩过了
          return
        }

        if (isConsecutiveDay(stats.lastPlayDate, today)) {
          // 连续
          set({
            stats: {
              ...stats,
              streakDays: stats.streakDays + 1,
              lastPlayDate: today,
            },
          })
        } else {
          // 中断，重新开始
          set({
            stats: {
              ...stats,
              streakDays: 1,
              lastPlayDate: today,
            },
          })
        }
      },

      // 勋章
      earnBadge: (badgeId) => {
        const { earnedBadges } = get()
        if (!earnedBadges.includes(badgeId)) {
          set({ earnedBadges: [...earnedBadges, badgeId] })
        }
      },

      hasBadge: (badgeId) => {
        return get().earnedBadges.includes(badgeId)
      },

      // 数据
      clearAllData: () => {
        set({
          settings: DEFAULT_USER_SETTINGS,
          progress: {},
          stats: DEFAULT_USER_STATS,
          earnedBadges: [],
        })
      },
    }),
    {
      name: 'wordduck-user',
      storage: createJSONStorage(() => localStorage),
      // 合并存储数据时，首次访问自动检测浏览器语言
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<UserState> | undefined

        // 如果没有持久化数据（首次访问），使用检测到的浏览器语言
        if (!persisted || Object.keys(persisted).length === 0) {
          return {
            ...currentState,
            settings: {
              ...currentState.settings,
              language: detectBrowserLanguage(),
            },
          }
        }

        // 有持久化数据，正常合并
        return {
          ...currentState,
          ...persisted,
          settings: {
            ...currentState.settings,
            ...persisted.settings,
          },
        }
      },
    }
  )
)

export default useUserStore
