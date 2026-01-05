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
        <div className="text-center py-6 bg-white/60 rounded-xl">
          {/* 单词本身 */}
          <div className="text-3xl font-bold text-gray-800 mb-2">
            {word.word}
          </div>

          {/* 音标 */}
          {word.phonetic && (
            <div className="text-gray-500 text-sm mb-3">
              {word.phonetic}
            </div>
          )}

          {/* 词性和释义 */}
          {word.pos && (
            <span className="text-blue-500 text-sm mr-2">
              {word.pos}
            </span>
          )}
          {word.meaning && (
            <span className="text-gray-600">
              {lang === 'zh' ? word.meaning.zh : word.meaning.en}
            </span>
          )}
        </div>

        {/* 底部提示 */}
        <div className="text-center text-gray-400 text-xs mt-3">
          {lang === 'zh'
            ? '来自「爱词鸭」- 玩中学单词'
            : 'From WordDuck - Learn words through play'}
        </div>
      </ShareCardBase>
    )
  }
)

WordShareCard.displayName = 'WordShareCard'
