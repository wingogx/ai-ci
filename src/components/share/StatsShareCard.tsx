'use client'

import { forwardRef } from 'react'
import { ShareCardBase } from './ShareCardBase'
import { t } from '@/i18n'

interface StatsShareCardProps {
  nickname?: string
  wordsLearned: number
  streakDays: number
  badgeCount: number
  rankPercent?: number
  grade?: string
  lang: 'zh' | 'en'
  inviteCode?: string
}

/**
 * 成绩单分享卡片
 */
export const StatsShareCard = forwardRef<HTMLDivElement, StatsShareCardProps>(
  (
    {
      nickname = '学习者',
      wordsLearned,
      streakDays,
      badgeCount,
      rankPercent,
      grade,
      lang,
      inviteCode,
    },
    ref
  ) => {
    return (
      <ShareCardBase ref={ref} inviteCode={inviteCode}>
        {/* 标题 */}
        <div className="text-center mb-4">
          <div className="text-lg font-bold mb-1" style={{ color: '#1f2937' }}>
            {nickname} {lang === 'zh' ? '的学习成绩单' : "'s Learning Report"}
          </div>
          {grade && (
            <div className="text-sm" style={{ color: '#6b7280' }}>
              {lang === 'zh' ? `正在学习 ${grade}` : `Learning ${grade}`}
            </div>
          )}
        </div>

        {/* 统计数据 */}
        <div className="rounded-xl p-4 mb-4" style={{ backgroundColor: 'rgba(255, 255, 255, 0.6)' }}>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold" style={{ color: '#2563eb' }}>
                {wordsLearned}
              </div>
              <div className="text-xs" style={{ color: '#6b7280' }}>
                {lang === 'zh' ? '已学单词' : 'Words'}
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold" style={{ color: '#f97316' }}>
                {streakDays}
              </div>
              <div className="text-xs" style={{ color: '#6b7280' }}>
                {lang === 'zh' ? '连续天数' : 'Day Streak'}
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold" style={{ color: '#9333ea' }}>
                {badgeCount}
              </div>
              <div className="text-xs" style={{ color: '#6b7280' }}>
                {lang === 'zh' ? '获得勋章' : 'Badges'}
              </div>
            </div>
          </div>
        </div>

        {/* 排名（如果有） */}
        {rankPercent !== undefined && rankPercent > 0 && (
          <div
            className="text-center py-3 rounded-xl"
            style={{ background: 'linear-gradient(to right, #fef3c7, #ffedd5)' }}
          >
            <div className="text-sm" style={{ color: '#4b5563' }}>
              {lang === 'zh' ? '已超越' : 'Beat'}
            </div>
            <div className="text-3xl font-bold" style={{ color: '#ea580c' }}>
              {rankPercent}%
            </div>
            <div className="text-sm" style={{ color: '#4b5563' }}>
              {lang === 'zh' ? '的学习者' : 'of learners'}
            </div>
          </div>
        )}
      </ShareCardBase>
    )
  }
)

StatsShareCard.displayName = 'StatsShareCard'
