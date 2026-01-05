'use client'

import { forwardRef } from 'react'
import { ShareCardBase } from './ShareCardBase'

interface Badge {
  id: string
  name: { zh: string; en: string }
  description: { zh: string; en: string }
  icon: string
}

interface BadgeShareCardProps {
  badge: Badge
  nickname?: string
  lang: 'zh' | 'en'
  inviteCode?: string
}

/**
 * 勋章分享卡片
 */
export const BadgeShareCard = forwardRef<HTMLDivElement, BadgeShareCardProps>(
  ({ badge, nickname = '学习者', lang, inviteCode }, ref) => {
    return (
      <ShareCardBase ref={ref} inviteCode={inviteCode}>
        {/* 标题 */}
        <div className="text-center mb-4">
          <span className="text-sm" style={{ color: '#6b7280' }}>
            {nickname} {lang === 'zh' ? '获得了新勋章' : 'earned a badge'}
          </span>
        </div>

        {/* 勋章展示 */}
        <div
          className="text-center py-6 rounded-xl mb-4"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.6)' }}
        >
          <div className="text-6xl mb-3">{badge.icon}</div>
          <div className="font-bold text-xl mb-1" style={{ color: '#1f2937' }}>
            {badge.name[lang]}
          </div>
          <div className="text-sm" style={{ color: '#6b7280' }}>
            {badge.description[lang]}
          </div>
        </div>

        {/* 获得时间 */}
        <div className="text-center text-xs" style={{ color: '#9ca3af' }}>
          {new Date().toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </div>
      </ShareCardBase>
    )
  }
)

BadgeShareCard.displayName = 'BadgeShareCard'
