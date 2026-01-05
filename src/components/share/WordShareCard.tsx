'use client'

import { forwardRef } from 'react'
import { ShareCardBase } from './ShareCardBase'
import type { Word } from '@/types/word'

interface WordShareCardProps {
  word: Word
  lang: 'zh' | 'en'
  inviteCode?: string
}

/**
 * 单词分享卡片
 * 用于分享单个单词，有利于自然传播
 */
export const WordShareCard = forwardRef<HTMLDivElement, WordShareCardProps>(
  ({ word, lang, inviteCode }, ref) => {
    return (
      <ShareCardBase ref={ref} inviteCode={inviteCode}>
        {/* 单词 */}
        <div
          className="text-center py-6 rounded-xl"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.6)' }}
        >
          {/* 单词本身 */}
          <div className="text-3xl font-bold mb-2" style={{ color: '#1f2937' }}>
            {word.word}
          </div>

          {/* 音标 */}
          {word.phonetic && (
            <div className="text-sm mb-3" style={{ color: '#6b7280' }}>
              {word.phonetic}
            </div>
          )}

          {/* 词性和释义 */}
          {word.pos && (
            <span className="text-sm mr-2" style={{ color: '#3b82f6' }}>
              {word.pos}
            </span>
          )}
          {word.meaning && (
            <span style={{ color: '#4b5563' }}>
              {lang === 'zh' ? word.meaning.zh : word.meaning.en}
            </span>
          )}
        </div>

        {/* 底部提示 */}
        <div className="text-center text-xs mt-3" style={{ color: '#9ca3af' }}>
          {lang === 'zh'
            ? '来自「爱词鸭」- 玩中学单词'
            : 'From WordDuck - Learn words through play'}
        </div>
      </ShareCardBase>
    )
  }
)

WordShareCard.displayName = 'WordShareCard'
