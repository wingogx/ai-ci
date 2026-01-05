/**
 * 数据同步服务
 *
 * 负责本地数据与云端的双向同步
 */

import { getSupabaseClient } from '@/lib/supabase'
import { useUserStore } from '@/stores'

/**
 * 上传本地进度到云端
 */
export async function uploadProgress(): Promise<boolean> {
  const supabase = getSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    console.log('用户未登录，跳过上传')
    return false
  }

  try {
    const store = useUserStore.getState()
    const { settings, progress, stats, earnedBadges } = store

    // 1. 上传用户进度（每个等级）
    for (const [key, gradeProgress] of Object.entries(progress)) {
      const [vocabMode, grade] = key.split('-')

      await supabase
        .from('user_progress')
        .upsert({
          user_id: user.id,
          vocab_mode: vocabMode,
          grade,
          completed_levels: gradeProgress.completedLevels,
          learned_words: gradeProgress.learnedWords,
          helped_words: gradeProgress.helpedWords,
        }, {
          onConflict: 'user_id,vocab_mode,grade',
        })
    }

    // 2. 上传用户统计
    await supabase
      .from('user_stats')
      .upsert({
        user_id: user.id,
        total_words_learned: stats.totalWordsLearned,
        total_levels_completed: stats.totalLevelsCompleted,
        streak_days: stats.streakDays,
        longest_streak: stats.streakDays, // 使用当前连续天数作为最长记录
        last_play_date: stats.lastPlayDate,
      }, {
        onConflict: 'user_id',
      })

    // 3. 上传勋章
    const badgeRecords = earnedBadges.map((badgeId: string) => ({
      user_id: user.id,
      badge_id: badgeId,
      unlocked_at: new Date().toISOString(),
    }))

    if (badgeRecords.length > 0) {
      await supabase
        .from('user_badges')
        .upsert(badgeRecords, {
          onConflict: 'user_id,badge_id',
        })
    }

    // 4. 更新今日学习历史
    const today = new Date().toISOString().split('T')[0]
    const currentProgress = progress[`${settings.wordListMode}-${settings.currentGrade}`]

    if (currentProgress) {
      await supabase
        .from('learning_history')
        .upsert({
          user_id: user.id,
          date: today,
          words_learned: currentProgress.learnedWords.length,
          levels_completed: currentProgress.completedLevels,
        }, {
          onConflict: 'user_id,date',
        })
    }

    console.log('数据上传成功')
    return true
  } catch (error) {
    console.error('数据上传失败:', error)
    return false
  }
}

/**
 * 从云端下载进度到本地
 */
export async function downloadProgress(): Promise<boolean> {
  const supabase = getSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    console.log('用户未登录，跳过下载')
    return false
  }

  try {
    // 1. 下载用户进度
    const { data: progressData } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', user.id)

    // 2. 下载用户统计
    const { data: statsData } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // 3. 下载勋章
    const { data: badgesData } = await supabase
      .from('user_badges')
      .select('*')
      .eq('user_id', user.id)

    // 4. 更新本地状态
    const store = useUserStore.getState()

    if (progressData && progressData.length > 0) {
      const newProgress: Record<string, {
        completedLevels: number
        learnedWords: string[]
        helpedWords: string[]
        helpCount: number
      }> = {}

      for (const p of progressData) {
        const key = `${p.vocab_mode}-${p.grade}`
        const existingProgress = store.progress[key]
        newProgress[key] = {
          completedLevels: p.completed_levels,
          learnedWords: p.learned_words || [],
          helpedWords: p.helped_words || [],
          helpCount: existingProgress?.helpCount || 3, // 保留本地的帮助次数
        }
      }

      // 合并本地和云端进度（取最大值）
      for (const [key, cloudProgress] of Object.entries(newProgress)) {
        const localProgress = store.progress[key]
        const cloudWordCount = Array.isArray(cloudProgress.learnedWords)
          ? cloudProgress.learnedWords.length
          : 0
        const localWordCount = localProgress?.learnedWords?.length || 0

        if (!localProgress || cloudWordCount > localWordCount) {
          store.progress[key] = cloudProgress
        }
      }
    }

    if (statsData) {
      const cloudStats = statsData as {
        total_words_learned: number
        streak_days: number
        longest_streak: number
      }
      // 保留更好的统计数据
      if (cloudStats.total_words_learned > store.stats.totalWordsLearned) {
        store.stats.totalWordsLearned = cloudStats.total_words_learned
      }
    }

    if (badgesData && badgesData.length > 0) {
      const cloudBadgeIds = badgesData.map((b: { badge_id: string }) => b.badge_id)
      const localBadgeIds = new Set(store.earnedBadges)

      // 添加云端有但本地没有的勋章
      for (const badgeId of cloudBadgeIds) {
        if (!localBadgeIds.has(badgeId)) {
          store.earnedBadges.push(badgeId)
        }
      }
    }

    console.log('数据下载成功')
    return true
  } catch (error) {
    console.error('数据下载失败:', error)
    return false
  }
}

/**
 * 完整同步（先下载后上传）
 */
export async function fullSync(): Promise<boolean> {
  const downloadSuccess = await downloadProgress()
  const uploadSuccess = await uploadProgress()
  return downloadSuccess && uploadSuccess
}

/**
 * 获取学习历史（用于热力图）
 */
export async function getLearningHistory(days: number = 120): Promise<{
  date: string
  count: number
}[]> {
  const supabase = getSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return []
  }

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  const startDateStr = startDate.toISOString().split('T')[0]

  const { data } = await supabase
    .from('learning_history')
    .select('date, words_learned')
    .eq('user_id', user.id)
    .gte('date', startDateStr)
    .order('date', { ascending: true })

  return (data || []).map((row) => ({
    date: row.date,
    count: row.words_learned,
  }))
}

/**
 * 记录分享行为
 */
export async function logShare(
  shareType: 'badge' | 'stats' | 'level' | 'word',
  content: Record<string, unknown>,
  platform?: string
): Promise<void> {
  const supabase = getSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()

  await supabase
    .from('share_logs')
    .insert({
      user_id: user?.id || null,
      share_type: shareType,
      share_content: content,
      platform,
    })
}
