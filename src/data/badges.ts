import type { UserStats, GradeProgress } from '@/types'

interface BadgeConfig {
  id: string
  name: { zh: string; en: string }
  description: { zh: string; en: string }
  icon: string
  condition: (stats: UserStats, progress: GradeProgress) => boolean
}

export const badges: BadgeConfig[] = [
  {
    id: 'ice_breaker',
    name: { zh: '破冰者', en: 'Ice Breaker' },
    description: { zh: '完成第一关', en: 'Complete your first level' },
    icon: '🧊',
    condition: (stats) => stats.totalLevelsCompleted >= 1,
  },
  {
    id: 'rising_star',
    name: { zh: '初露锋芒', en: 'Rising Star' },
    description: { zh: '完成第5关', en: 'Complete level 5' },
    icon: '⭐',
    condition: (stats) => stats.totalLevelsCompleted >= 5,
  },
  {
    id: 'ten_levels',
    name: { zh: '小试牛刀', en: 'Getting Started' },
    description: { zh: '完成10关', en: 'Complete 10 levels' },
    icon: '🎯',
    condition: (stats) => stats.totalLevelsCompleted >= 10,
  },
  {
    id: 'word_collector',
    name: { zh: '词汇收集者', en: 'Word Collector' },
    description: { zh: '学会50个单词', en: 'Learn 50 words' },
    icon: '📚',
    condition: (stats) => stats.totalWordsLearned >= 50,
  },
  {
    id: 'word_hunter',
    name: { zh: '词汇猎手', en: 'Word Hunter' },
    description: { zh: '学会100个单词', en: 'Learn 100 words' },
    icon: '🏹',
    condition: (stats) => stats.totalWordsLearned >= 100,
  },
  {
    id: 'word_master',
    name: { zh: '词汇大师', en: 'Word Master' },
    description: { zh: '学会500个单词', en: 'Learn 500 words' },
    icon: '👑',
    condition: (stats) => stats.totalWordsLearned >= 500,
  },
  {
    id: 'three_days',
    name: { zh: '坚持三天', en: 'Three Day Streak' },
    description: { zh: '连续学习3天', en: 'Learn for 3 days in a row' },
    icon: '🔥',
    condition: (stats) => stats.streakDays >= 3,
  },
  {
    id: 'persistent',
    name: { zh: '坚持不懈', en: 'Persistent' },
    description: { zh: '连续学习7天', en: 'Learn for 7 days in a row' },
    icon: '💪',
    condition: (stats) => stats.streakDays >= 7,
  },
  {
    id: 'dedicated',
    name: { zh: '学习达人', en: 'Dedicated Learner' },
    description: { zh: '连续学习30天', en: 'Learn for 30 days in a row' },
    icon: '🏆',
    condition: (stats) => stats.streakDays >= 30,
  },
  {
    id: 'challenger',
    name: { zh: '挑战者', en: 'Challenger' },
    description: { zh: '完成10个挑战关', en: 'Complete 10 challenge levels' },
    icon: '⚔️',
    condition: (stats) => Math.floor(stats.totalLevelsCompleted / 5) >= 10,
  },
]

/**
 * 检查用户获得了哪些新勋章
 */
export function checkNewBadges(
  stats: UserStats,
  progress: GradeProgress,
  earnedBadges: string[]
): BadgeConfig[] {
  return badges.filter(
    (badge) =>
      !earnedBadges.includes(badge.id) && badge.condition(stats, progress)
  )
}

/**
 * 获取勋章信息
 */
export function getBadgeById(id: string): BadgeConfig | undefined {
  return badges.find((b) => b.id === id)
}

export default badges
