'use client'

import { forwardRef } from 'react'
import { ShareCardBase } from './ShareCardBase'
import type { Word } from '@/types/word'

interface LevelShareCardProps {
  level: number
  words: Word[]
  timeSpent?: number // 秒
  nickname?: string
  lang: 'zh' | 'en'
  inviteCode?: string
}

/**
 * 通关分享卡片
 */
export const LevelShareCard = forwardRef<HTMLDivElement, LevelShareCardProps>(
  ({ level, words, timeSpent, nickname = '学习者', lang, inviteCode }, ref) => {
    const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60)
      const secs = seconds % 60
      return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    const isChallenge = level % 5 === 0

    return (
      <ShareCardBase ref={ref} inviteCode={inviteCode}>
        {/* 标题 */}
        <div className="text-center mb-4">
          {isChallenge && (
            <div
              className="inline-block text-white text-xs px-3 py-1 rounded-full mb-2"
              style={{ background: 'linear-gradient(to right, #facc15, #fb923c)' }}
            >
              {lang === 'zh' ? '挑战关' : 'Challenge'}
            </div>
          )}
          <div className="text-2xl font-bold" style={{ color: '#1f2937' }}>
            {lang === 'zh' ? `第 ${level} 关通过！` : `Level ${level} Complete!`}
          </div>
          <div className="text-sm mt-1" style={{ color: '#6b7280' }}>{nickname}</div>
        </div>

        {/* 本关单词 */}
        <div className="rounded-xl p-4 mb-4" style={{ backgroundColor: 'rgba(255, 255, 255, 0.6)' }}>
          <div className="text-xs mb-2 text-center" style={{ color: '#6b7280' }}>
            {lang === 'zh' ? '本关单词' : 'Words in this level'}
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            {words.slice(0, 6).map((word, index) => (
              <div
                key={index}
                className="px-3 py-1.5 rounded-lg shadow-sm text-sm font-medium"
                style={{ backgroundColor: '#ffffff', color: '#374151' }}
              >
                {word.word}
              </div>
            ))}
            {words.length > 6 && (
              <div
                className="px-3 py-1.5 rounded-lg text-sm"
                style={{ backgroundColor: '#f3f4f6', color: '#6b7280' }}
              >
                +{words.length - 6}
              </div>
            )}
          </div>
        </div>

        {/* 用时（如果有） */}
        {timeSpent && (
          <div className="text-center text-sm" style={{ color: '#6b7280' }}>
            {lang === 'zh' ? '用时' : 'Time'}: {formatTime(timeSpent)}
          </div>
        )}
      </ShareCardBase>
    )
  }
)

LevelShareCard.displayName = 'LevelShareCard'
