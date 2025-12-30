'use client'

import { useCallback } from 'react'
import { cn } from '@/utils'
import type { Word } from '@/types'
import type { Language } from '@/types'

interface WordCardProps {
  word: Word
  language: Language
  onPlaySound?: (word: string) => void
  className?: string
}

/**
 * 单词卡片 - 显示单词、音标、词性和释义
 */
export function WordCard({
  word,
  language,
  onPlaySound,
  className,
}: WordCardProps) {
  const handlePlaySound = useCallback(() => {
    onPlaySound?.(word.word)
  }, [word.word, onPlaySound])

  // 词性缩写映射
  const posLabels: Record<string, { zh: string; en: string }> = {
    n: { zh: '名词', en: 'noun' },
    v: { zh: '动词', en: 'verb' },
    adj: { zh: '形容词', en: 'adj.' },
    adv: { zh: '副词', en: 'adv.' },
    prep: { zh: '介词', en: 'prep.' },
    conj: { zh: '连词', en: 'conj.' },
    pron: { zh: '代词', en: 'pron.' },
    art: { zh: '冠词', en: 'art.' },
    int: { zh: '感叹词', en: 'int.' },
    num: { zh: '数词', en: 'num.' },
    det: { zh: '限定词', en: 'det.' },
  }

  const posLabel = word.pos ? posLabels[word.pos]?.[language] || word.pos : ''
  const meaning = word.meaning?.[language] || ''

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm',
        'border border-gray-100',
        className
      )}
    >
      {/* 发音按钮 */}
      <button
        onClick={handlePlaySound}
        className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors flex-shrink-0"
        aria-label="播放发音"
      >
        🔊
      </button>

      {/* 单词信息 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          {/* 单词 */}
          <span className="text-lg font-bold text-gray-900">{word.word}</span>
          {/* 音标 */}
          {word.phonetic && (
            <span className="text-sm text-gray-500">/{word.phonetic}/</span>
          )}
          {/* 词性 */}
          {posLabel && (
            <span className="text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
              {posLabel}
            </span>
          )}
        </div>
        {/* 释义 */}
        {meaning && (
          <p className="text-sm text-gray-600 mt-0.5 truncate">{meaning}</p>
        )}
      </div>
    </div>
  )
}

export default WordCard
