'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui'
import { t } from '@/i18n'
import { getSupabaseClient } from '@/lib/supabase'
import type { DailyTask } from '@/types/database'

interface DailyTasksPanelProps {
  userId?: string
  lang: 'zh' | 'en'
  onRewardClaimed?: (helpCount: number) => void
}

interface TaskConfig {
  type: string
  icon: string
  labelKey: string
  target: number
  reward: number
}

const TASK_CONFIGS: TaskConfig[] = [
  { type: 'complete_level', icon: '🎯', labelKey: 'dailyTask.completeLevel', target: 1, reward: 1 },
  { type: 'learn_words', icon: '📚', labelKey: 'dailyTask.learnWords', target: 10, reward: 1 },
  { type: 'streak', icon: '🔥', labelKey: 'dailyTask.streak', target: 1, reward: 1 },
]

export function DailyTasksPanel({
  userId,
  lang,
  onRewardClaimed,
}: DailyTasksPanelProps) {
  const [tasks, setTasks] = useState<DailyTask[]>([])
  const [loading, setLoading] = useState(true)
  const [claiming, setClaiming] = useState<string | null>(null)

  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    async function loadTasks() {
      if (!userId) {
        setLoading(false)
        return
      }

      try {
        const supabase = getSupabaseClient()

        // 获取今日任务
        const { data: existingTasks } = await supabase
          .from('daily_tasks')
          .select('*')
          .eq('user_id', userId)
          .eq('date', today)

        if (existingTasks && existingTasks.length > 0) {
          setTasks(existingTasks)
        } else {
          // 创建今日任务
          const newTasks = TASK_CONFIGS.map((config) => ({
            user_id: userId,
            date: today,
            task_type: config.type,
            target_value: config.target,
            current_value: 0,
            completed: false,
            reward_claimed: false,
          }))

          const { data: createdTasks } = await supabase
            .from('daily_tasks')
            .insert(newTasks)
            .select()

          setTasks(createdTasks || [])
        }
      } catch (err) {
        console.error('加载每日任务失败:', err)
      } finally {
        setLoading(false)
      }
    }

    loadTasks()
  }, [userId, today])

  const handleClaimReward = async (task: DailyTask) => {
    if (!userId || claiming) return

    setClaiming(task.task_type)

    try {
      const supabase = getSupabaseClient()

      // 标记已领取
      await supabase
        .from('daily_tasks')
        .update({ reward_claimed: true })
        .eq('id', task.id)

      // 增加帮助次数（使用RPC函数）
      const config = TASK_CONFIGS.find((c) => c.type === task.task_type)
      const rewardCount = config?.reward || 1

      await supabase.rpc('increment_user_help_count', {
        p_user_id: userId,
        p_amount: rewardCount
      })

      // 更新本地状态
      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id ? { ...t, reward_claimed: true } : t
        )
      )

      onRewardClaimed?.(rewardCount)
    } catch (err) {
      console.error('领取奖励失败:', err)
    } finally {
      setClaiming(null)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-4 shadow-sm animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-gray-200 rounded" />
          ))}
        </div>
      </div>
    )
  }

  if (tasks.length === 0) {
    return null
  }

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
        <span>📋</span>
        {t('dailyTask.title', lang)}
      </h3>

      <div className="space-y-3">
        {tasks.map((task) => {
          const config = TASK_CONFIGS.find((c) => c.type === task.task_type)
          if (!config) return null

          const progress = Math.min(task.current_value / task.target_value, 1)
          const isComplete = task.completed
          const canClaim = isComplete && !task.reward_claimed

          return (
            <div
              key={task.id}
              className={`p-3 rounded-lg border ${
                isComplete
                  ? 'bg-green-50 border-green-200'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{config.icon}</span>
                <div className="flex-1">
                  <div className="font-medium text-gray-800 text-sm">
                    {t(config.labelKey, lang, { count: config.target.toString() })}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isComplete ? 'bg-green-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${progress * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500">
                      {t('dailyTask.progress', lang, {
                        current: task.current_value.toString(),
                        target: task.target_value.toString(),
                      })}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  {task.reward_claimed ? (
                    <span className="text-xs text-gray-400">
                      {t('dailyTask.claimed', lang)}
                    </span>
                  ) : canClaim ? (
                    <Button
                      onClick={() => handleClaimReward(task)}
                      disabled={claiming !== null}
                      className="text-xs px-3 py-1"
                    >
                      {claiming === task.task_type
                        ? '...'
                        : t('dailyTask.claim', lang)}
                    </Button>
                  ) : (
                    <span className="text-xs text-gray-500">
                      {t('dailyTask.helpCount', lang, { count: config.reward.toString() })}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
