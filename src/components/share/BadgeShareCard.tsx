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
          <span className="text-gray-500 text-sm">
            {nickname} {lang === 'zh' ? '获得了新勋章' : 'earned a badge'}
          </span>
        </div>

        {/* 勋章展示 */}
        <div className="text-center py-6 bg-white/60 rounded-xl mb-4">
          <div className="text-6xl mb-3">{badge.icon}</div>
          <div className="font-bold text-xl text-gray-800 mb-1">
            {badge.name[lang]}
          </div>
          <div className="text-gray-500 text-sm">
            {badge.description[lang]}
          </div>
        </div>

        {/* 获得时间 */}
        <div className="text-center text-gray-400 text-xs">
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
