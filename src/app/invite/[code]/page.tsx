'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui'
import { storePendingInviteCode } from '@/lib/auth/deviceAuth'
import { getSupabaseClient } from '@/lib/supabase'

interface InviterInfo {
  nickname: string
  avatar_url: string | null
  wordsLearned: number
  streakDays: number
}

export default function InvitePage() {
  const params = useParams()
  const router = useRouter()
  const code = params.code as string

  const [inviter, setInviter] = useState<InviterInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    async function fetchInviter() {
      try {
        const supabase = getSupabaseClient()

        // 查找邀请者信息
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id, nickname, avatar_url')
          .eq('invite_code', code.toUpperCase())
          .single()

        const user = userData as { id: string; nickname: string | null; avatar_url: string | null } | null

        if (userError || !user) {
          setError(true)
          setLoading(false)
          return
        }

        // 获取邀请者统计
        const { data: statsData } = await supabase
          .from('user_stats')
          .select('total_words_learned, streak_days')
          .eq('user_id', user.id)
          .single()

        const stats = statsData as { total_words_learned: number; streak_days: number } | null

        setInviter({
          nickname: user.nickname || '学习者',
          avatar_url: user.avatar_url,
          wordsLearned: stats?.total_words_learned || 0,
          streakDays: stats?.streak_days || 0,
        })

        // 存储邀请码，等待用户注册时绑定
        storePendingInviteCode(code)
      } catch (err) {
        console.error('获取邀请者信息失败:', err)
        setError(true)
      } finally {
        setLoading(false)
      }
    }

    if (code) {
      fetchInviter()
    }
  }, [code])

  const handleStart = () => {
    // 存储邀请码后跳转首页
    storePendingInviteCode(code)
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-lg">
          <div className="text-6xl mb-4">🦆</div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">邀请码无效</h1>
          <p className="text-gray-500 mb-6">该邀请码不存在或已失效</p>
          <Button onClick={() => router.push('/')} className="w-full">
            直接开始游戏
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-lg">
        {/* 头部 */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-yellow-400 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">
            🦆
          </div>
          <h1 className="text-2xl font-bold text-gray-800">爱词鸭</h1>
          <p className="text-gray-500 text-sm">玩中学，轻松记单词</p>
        </div>

        {/* 邀请者信息 */}
        {inviter && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3 mb-3">
              {inviter.avatar_url ? (
                <img
                  src={inviter.avatar_url}
                  alt={inviter.nickname}
                  className="w-12 h-12 rounded-full"
                />
              ) : (
                <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center text-xl">
                  {inviter.nickname.slice(0, 1)}
                </div>
              )}
              <div>
                <div className="font-bold text-gray-800">{inviter.nickname}</div>
                <div className="text-sm text-gray-500">邀请你一起学习</div>
              </div>
            </div>

            {(inviter.wordsLearned > 0 || inviter.streakDays > 0) && (
              <div className="flex gap-4 text-center pt-3 border-t border-blue-200/50">
                <div className="flex-1">
                  <div className="text-lg font-bold text-blue-600">
                    {inviter.wordsLearned}
                  </div>
                  <div className="text-xs text-gray-500">已学单词</div>
                </div>
                <div className="flex-1">
                  <div className="text-lg font-bold text-orange-500">
                    {inviter.streakDays}
                  </div>
                  <div className="text-xs text-gray-500">连续天数</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 新手礼包 */}
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">🎁</span>
            <span className="font-bold text-gray-800">新手礼包</span>
          </div>
          <p className="text-sm text-gray-600">
            接受邀请开始游戏，立即获得 <span className="font-bold text-orange-600">+2 帮助次数</span>
          </p>
        </div>

        {/* 开始按钮 */}
        <Button onClick={handleStart} className="w-full text-lg py-3">
          接受邀请，开始游戏
        </Button>

        <p className="text-center text-gray-400 text-xs mt-4">
          无需注册，即可开始
        </p>
      </div>
    </div>
  )
}
