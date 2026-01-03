'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useUserStore } from '@/stores'
import { Button, Select } from '@/components/ui'
import { t } from '@/i18n'
import { getWordListInfo } from '@/lib/wordLoader'
import type { WordListMode, CEFRLevel, ChinaLevel, Language, WordLevel } from '@/types'

const wordListOptions = [
  { value: 'cefr', label: { zh: 'CEFR 欧标', en: 'CEFR Standard' } },
  { value: 'china', label: { zh: '中国教材', en: 'China Textbook' } },
]

const cefrLevelOptions: { value: CEFRLevel; label: string }[] = [
  { value: 'a1', label: 'A1' },
  { value: 'a2', label: 'A2' },
  { value: 'b1', label: 'B1' },
  { value: 'b2', label: 'B2' },
  { value: 'c1', label: 'C1' },
  { value: 'c2', label: 'C2' },
]

const chinaLevelOptions: { value: ChinaLevel; label: { zh: string; en: string } }[] = [
  { value: 'primary', label: { zh: '小学', en: 'Primary' } },
  { value: 'junior', label: { zh: '初中', en: 'Junior High' } },
  { value: 'senior', label: { zh: '高中', en: 'Senior High' } },
  { value: 'cet4', label: { zh: '四级', en: 'CET-4' } },
  { value: 'cet6', label: { zh: '六级', en: 'CET-6' } },
]

const languageOptions: { value: Language; label: string }[] = [
  { value: 'zh', label: '中文' },
  { value: 'en', label: 'English' },
]

export default function HomePage() {
  const router = useRouter()
  const { settings, stats, updateSettings, getCurrentProgress } = useUserStore()
  const [totalWords, setTotalWords] = useState<number>(0)

  const lang = settings.language
  const progress = getCurrentProgress()

  // 加载当前等级的总词汇量
  useEffect(() => {
    getWordListInfo(settings.currentGrade)
      .then((info) => setTotalWords(info.totalWords))
      .catch(() => setTotalWords(0))
  }, [settings.currentGrade])

  // 处理词库模式切换
  const handleWordListChange = (mode: WordListMode) => {
    // 切换词库模式时，同时更新当前等级为该模式的默认等级
    const defaultGrade: WordLevel = mode === 'cefr' ? 'a1' : 'primary'
    updateSettings({ wordListMode: mode, currentGrade: defaultGrade })
  }

  // 处理等级切换
  const handleLevelChange = (level: string) => {
    updateSettings({ currentGrade: level as WordLevel })
  }

  // 处理语言切换
  const handleLanguageChange = (language: Language) => {
    updateSettings({ language })
  }

  // 开始游戏
  const handleStartGame = () => {
    router.push('/game')
  }

  // 获取当前等级选项
  const currentLevelOptions =
    settings.wordListMode === 'cefr'
      ? cefrLevelOptions.map((o) => ({ value: o.value, label: o.label }))
      : chinaLevelOptions.map((o) => ({
          value: o.value,
          label: o.label[lang],
        }))

  // 当前关卡数 (completedLevels + 1)
  const currentLevelNum = progress.completedLevels + 1

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col">
      {/* 顶栏 */}
      <header className="p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-blue-600">🦆 {t('app.name', lang)}</h1>
        <Select
          value={settings.language}
          onChange={(v) => handleLanguageChange(v as Language)}
          options={languageOptions}
          className="w-24"
        />
      </header>

      {/* 主要内容 */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 gap-8">
        {/* Logo 和标语 */}
        <div className="text-center">
          <div className="text-8xl mb-4">🦆</div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            {t('app.name', lang)}
          </h2>
          <p className="text-gray-600">{t('app.tagline', lang)}</p>
        </div>

        {/* 设置区域 */}
        <div className="w-full max-w-sm space-y-4">
          {/* 词库选择 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('settings.wordList', lang)}
            </label>
            <div className="flex gap-2">
              {wordListOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleWordListChange(option.value as WordListMode)}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                    settings.wordListMode === option.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {option.label[lang]}
                </button>
              ))}
            </div>
          </div>

          {/* 等级选择 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('settings.level', lang)}
            </label>
            <Select
              value={settings.currentGrade}
              onChange={handleLevelChange}
              options={currentLevelOptions}
              className="w-full"
            />
          </div>
        </div>

        {/* 统计信息 */}
        <div className="grid grid-cols-3 gap-4 w-full max-w-sm">
          <div className="bg-white rounded-xl p-4 text-center shadow-sm">
            <div className="text-2xl font-bold text-blue-600">
              {currentLevelNum}
            </div>
            <div className="text-xs text-gray-500">{t('stats.currentLevel', lang)}</div>
          </div>
          <div className="bg-white rounded-xl p-4 text-center shadow-sm">
            <div className="text-2xl font-bold text-green-600">
              {progress.learnedWords.length}
            </div>
            <div className="text-xs text-gray-500">{t('stats.wordsLearned', lang)}</div>
          </div>
          <div className="bg-white rounded-xl p-4 text-center shadow-sm">
            <div className="text-2xl font-bold text-orange-600">
              {stats.streakDays}
            </div>
            <div className="text-xs text-gray-500">{t('stats.streakDays', lang)}</div>
          </div>
        </div>

        {/* 学习进度条 */}
        {totalWords > 0 && (
          <div className="w-full max-w-sm">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>{t('stats.progress', lang)}</span>
              <span>{progress.learnedWords.length} / {totalWords}</span>
            </div>
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full transition-all duration-500"
                style={{ width: `${Math.min((progress.learnedWords.length / totalWords) * 100, 100)}%` }}
              />
            </div>
            <div className="text-xs text-gray-500 mt-1 text-center">
              {Math.round((progress.learnedWords.length / totalWords) * 100)}% {t('stats.completed', lang)}
            </div>
          </div>
        )}

        {/* 开始按钮 */}
        <Button onClick={handleStartGame} size="lg" className="w-full max-w-sm">
          {currentLevelNum > 1
            ? t('home.continue', lang)
            : t('home.start', lang)}
        </Button>
      </main>

      {/* 底部 */}
      <footer className="p-4 text-center text-sm text-gray-400">
        {t('app.copyright', lang)}
      </footer>
    </div>
  )
}
