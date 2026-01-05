'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui'
import { t } from '@/i18n'
import { getUserInviteCode, getInviteStats } from '@/lib/auth/deviceAuth'
import { copyToClipboard } from '@/lib/share'

interface InvitePanelProps {
  lang: 'zh' | 'en'
}

export function InvitePanel({ lang }: InvitePanelProps) {
  const [inviteCode, setInviteCode] = useState<string | null>(null)
  const [stats, setStats] = useState({ totalInvites: 0, level5Invites: 0, level20Invites: 0 })
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const [code, inviteStats] = await Promise.all([
          getUserInviteCode(),
          getInviteStats(),
        ])
        setInviteCode(code)
        setStats(inviteStats)
      } catch (err) {
        console.error('加载邀请数据失败:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const handleCopyCode = async () => {
    if (!inviteCode) return
    await copyToClipboard(inviteCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleCopyLink = async () => {
    if (!inviteCode) return
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://wordduck.app'
    const link = `${baseUrl}/invite/${inviteCode}`
    const text = lang === 'zh'
      ? `我在「爱词鸭」学单词，一起来玩吧！${link}`
      : `I'm learning English with WordDuck! Join me: ${link}`
    await copyToClipboard(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-4 shadow-sm animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
        <div className="h-10 bg-gray-200 rounded mb-3" />
        <div className="h-10 bg-gray-200 rounded" />
      </div>
    )
  }

  if (!inviteCode) {
    return null
  }

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
        <span>🎁</span>
        {t('invite.title', lang)}
      </h3>

      {/* 邀请码展示 */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 mb-3">
        <div className="text-xs text-gray-500 mb-1">
          {t('invite.myCode', lang)}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-2xl font-mono font-bold text-blue-600 tracking-wider">
            {inviteCode}
          </span>
          <Button
            onClick={handleCopyCode}
            variant="secondary"
            className="text-sm px-3 py-1"
          >
            {copied ? t('share.copied', lang) : t('invite.copyCode', lang)}
          </Button>
        </div>
      </div>

      {/* 分享链接按钮 */}
      <Button onClick={handleCopyLink} className="w-full mb-3">
        {t('invite.shareLink', lang)}
      </Button>

      {/* 邀请统计 */}
      {stats.totalInvites > 0 && (
        <div className="text-center text-sm text-gray-500">
          {t('invite.invited', lang, { count: stats.totalInvites.toString() })}
        </div>
      )}

      {/* 奖励说明 */}
      <div className="mt-3 pt-3 border-t border-gray-100">
        <div className="text-xs text-gray-500">
          <div className="font-medium mb-1">{t('invite.reward', lang)}:</div>
          <div className="whitespace-pre-line">
            {t('invite.rewardDesc', lang)}
          </div>
        </div>
      </div>
    </div>
  )
}
