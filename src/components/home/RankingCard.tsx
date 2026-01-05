'use client'

import { useState, useEffect } from 'react'
import { t } from '@/i18n'
import { getSupabaseClient } from '@/lib/supabase'
import type { LeaderboardEntry } from '@/types/database'

type RankingType = 'total' | 'city'

interface RankingCardProps {
  userId?: string
  userCity?: string | null
  vocabMode: string
  grade: string
  lang: 'zh' | 'en'
}

export function RankingCard({ userId, userCity, vocabMode, grade, lang }: RankingCardProps) {
  const [rankingType, setRankingType] = useState<RankingType>('total')
  const [rankPercent, setRankPercent] = useState<number | null>(null)
  const [cityRankPercent, setCityRankPercent] = useState<number | null>(null)
  const [topUsers, setTopUsers] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadRanking() {
      setLoading(true)
      try {
        const supabase = getSupabaseClient()

        if (userId) {
          // 获取总榜排名百分比
          const { data: percent } = await supabase.rpc('get_user_rank_percentile', {
            p_user_id: userId,
            p_vocab_mode: vocabMode,
            p_grade: grade,
          })
          setRankPercent(percent)

          // 获取城市榜排名百分比（如果有城市信息）
          if (userCity) {
            const { data: cityPercent } = await supabase.rpc('get_user_city_rank_percentile', {
              p_user_id: userId,
              p_vocab_mode: vocabMode,
              p_grade: grade,
            })
            setCityRankPercent(cityPercent)
          }
        }

        // 根据榜单类型获取排行数据
        if (rankingType === 'total') {
          // 使用 RPC 函数绕过 RLS
          const { data: leaderboard, error } = await supabase.rpc('get_leaderboard', {
            p_vocab_mode: vocabMode,
            p_grade: grade,
            p_limit: 5,
          })
          if (error) {
            console.error('获取排行榜失败:', error)
          }
          setTopUsers(leaderboard || [])
        } else if (userCity) {
          // 使用 RPC 函数获取城市排行榜
          const { data: cityLeaderboard, error } = await supabase.rpc('get_city_leaderboard', {
            p_city: userCity,
            p_vocab_mode: vocabMode,
            p_grade: grade,
            p_limit: 5,
          })
          if (error) {
            console.error('获取城市排行榜失败:', error)
          }
          setTopUsers(cityLeaderboard || [])
        }
      } catch (err) {
        console.error('加载排行榜失败:', err)
      } finally {
        setLoading(false)
      }
    }

    loadRanking()
  }, [userId, userCity, vocabMode, grade, rankingType])

  const currentPercent = rankingType === 'total' ? rankPercent : cityRankPercent

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-4 shadow-sm animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 bg-gray-200 rounded" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      {/* 标题和切换按钮 */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-gray-800 flex items-center gap-2">
          <span>🏆</span>
          {t('ranking.title', lang)}
        </h3>

        {/* 榜单切换 */}
        {userCity && (
          <div className="flex bg-gray-100 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setRankingType('total')}
              className={`px-2 py-1 rounded-md transition-colors ${
                rankingType === 'total'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-500'
              }`}
            >
              {lang === 'zh' ? '总榜' : 'All'}
            </button>
            <button
              onClick={() => setRankingType('city')}
              className={`px-2 py-1 rounded-md transition-colors ${
                rankingType === 'city'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-500'
              }`}
            >
              {userCity}
            </button>
          </div>
        )}
      </div>

      {/* 我的排名 */}
      {currentPercent !== null && currentPercent > 0 && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-3 mb-4">
          <div className="text-sm text-gray-600 mb-1">
            {rankingType === 'city' && userCity
              ? (lang === 'zh' ? `${userCity}排名` : `Rank in ${userCity}`)
              : t('ranking.myRank', lang)}
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-orange-600">
              {Math.round(currentPercent)}%
            </span>
            <span className="text-sm text-gray-500">
              {lang === 'zh' ? '的学习者被你超越' : 'beaten'}
            </span>
          </div>
        </div>
      )}

      {/* 排行榜 */}
      {topUsers.length > 0 ? (
        <div className="space-y-2">
          <div className="text-sm text-gray-500 mb-2">
            {rankingType === 'city' && userCity
              ? (lang === 'zh' ? `${userCity}学霸` : `Top in ${userCity}`)
              : t('ranking.topLearners', lang)}
          </div>
          {topUsers.map((user, index) => (
            <div
              key={user.id}
              className={`flex items-center gap-3 p-2 rounded-lg ${
                user.id === userId ? 'bg-blue-50' : ''
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
                  index === 0
                    ? 'bg-yellow-400 text-white'
                    : index === 1
                    ? 'bg-gray-300 text-white'
                    : index === 2
                    ? 'bg-orange-400 text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-800 truncate">
                  {user.nickname || (lang === 'zh' ? '学习者' : 'Learner')}
                  {user.id === userId && (
                    <span className="ml-1 text-xs text-blue-500">
                      ({t('ranking.you', lang)})
                    </span>
                  )}
                </div>
                {/* 总榜显示城市 */}
                {rankingType === 'total' && user.city && (
                  <div className="text-xs text-gray-400">{user.city}</div>
                )}
              </div>
              <div className="text-sm text-gray-500">
                {user.grade_words_learned || 0} {lang === 'zh' ? '词' : 'words'}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-400 py-4">
          {t('ranking.noData', lang)}
        </div>
      )}
    </div>
  )
}
