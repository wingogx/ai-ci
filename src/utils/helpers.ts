/**
 * Fisher-Yates 洗牌算法
 */
export function shuffle<T>(array: T[]): T[] {
  const result = [...array]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

/**
 * 生成唯一 ID
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 9)
}

/**
 * 延迟函数
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * 获取今天的日期字符串 (YYYY-MM-DD)
 */
export function getTodayString(): string {
  return new Date().toISOString().split('T')[0]
}

/**
 * 判断两个日期是否是连续的天
 */
export function isConsecutiveDay(date1: string, date2: string): boolean {
  if (!date1 || !date2) return false
  const d1 = new Date(date1)
  const d2 = new Date(date2)
  const diffTime = Math.abs(d2.getTime() - d1.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays === 1
}

/**
 * 判断是否是今天
 */
export function isToday(dateString: string): boolean {
  return dateString === getTodayString()
}

/**
 * 判断是否是挑战关（每5关一个挑战关）
 */
export function isChallengeLevel(level: number): boolean {
  return level > 0 && level % 5 === 0
}

/**
 * 根据关卡获取单词数量
 * 普通关: 3-4个
 * 挑战关: 5-7个
 */
export function getWordCountForLevel(level: number): number {
  if (isChallengeLevel(level)) {
    // 挑战关 5-7 个单词
    return 5 + Math.floor(Math.random() * 3)
  }
  // 普通关 3-4 个单词
  return 3 + Math.floor(Math.random() * 2)
}

/**
 * 获取预填比例
 * 根据等级递减
 */
export function getPreFillRatio(grade: string): number {
  const ratios: Record<string, number> = {
    a1: 0.5,
    a2: 0.45,
    b1: 0.4,
    b2: 0.35,
    c1: 0.25,
    c2: 0.15,
    primary: 0.5,
    junior: 0.4,
    senior: 0.3,
  }
  return ratios[grade] ?? 0.4
}

/**
 * 对字母数组排序
 */
export function sortLetters(letters: string[]): string[] {
  return [...letters].sort((a, b) => a.localeCompare(b))
}

/**
 * 找出两个单词的共同字母
 */
export function findCommonLetters(word1: string, word2: string): string[] {
  const set1 = new Set(word1.toLowerCase().split(''))
  const set2 = new Set(word2.toLowerCase().split(''))
  return [...set1].filter((char) => set2.has(char))
}

/**
 * 触发震动反馈
 */
export function vibrate(duration: number = 10): void {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(duration)
  }
}
