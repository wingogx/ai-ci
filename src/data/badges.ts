import type { UserStats, GradeProgress, WordListMode, WordLevel } from '@/types'

/**
 * 勋章检查上下文
 */
interface BadgeContext {
  stats: UserStats
  progress: GradeProgress
  wordListMode: WordListMode
  totalWordsInGrade: number // 当前等级总词汇量
  currentLevel: WordLevel // 当前等级
}

interface BadgeConfig {
  id: string
  name: { zh: string; en: string }
  description: { zh: string; en: string }
  icon: string
  category: 'grade' | 'wordlist' | 'streak' | 'general' // 勋章类别
  condition: (ctx: BadgeContext) => boolean
}

export const badges: BadgeConfig[] = [
  // ========== CEFR 等级专属勋章 ==========
  // A1 等级
  {
    id: 'cefr_a1_25',
    name: { zh: 'A1 起步', en: 'A1 Starter' },
    description: { zh: 'A1等级完成25%', en: 'Complete 25% of A1' },
    icon: '🌱',
    category: 'grade',
    condition: (ctx) => ctx.currentLevel === 'a1' && ctx.totalWordsInGrade > 0 && ctx.progress.learnedWords.length >= ctx.totalWordsInGrade * 0.25,
  },
  {
    id: 'cefr_a1_50',
    name: { zh: 'A1 进阶', en: 'A1 Progressing' },
    description: { zh: 'A1等级完成50%', en: 'Complete 50% of A1' },
    icon: '🌿',
    category: 'grade',
    condition: (ctx) => ctx.currentLevel === 'a1' && ctx.totalWordsInGrade > 0 && ctx.progress.learnedWords.length >= ctx.totalWordsInGrade * 0.5,
  },
  {
    id: 'cefr_a1_75',
    name: { zh: 'A1 精通', en: 'A1 Advanced' },
    description: { zh: 'A1等级完成75%', en: 'Complete 75% of A1' },
    icon: '🌳',
    category: 'grade',
    condition: (ctx) => ctx.currentLevel === 'a1' && ctx.totalWordsInGrade > 0 && ctx.progress.learnedWords.length >= ctx.totalWordsInGrade * 0.75,
  },
  {
    id: 'cefr_a1_100',
    name: { zh: 'A1 毕业生', en: 'A1 Graduate' },
    description: { zh: 'A1等级完成100%', en: 'Complete 100% of A1' },
    icon: '🎓',
    category: 'grade',
    condition: (ctx) => ctx.currentLevel === 'a1' && ctx.totalWordsInGrade > 0 && ctx.progress.learnedWords.length >= ctx.totalWordsInGrade,
  },
  // A2 等级
  {
    id: 'cefr_a2_25',
    name: { zh: 'A2 起步', en: 'A2 Starter' },
    description: { zh: 'A2等级完成25%', en: 'Complete 25% of A2' },
    icon: '🌱',
    category: 'grade',
    condition: (ctx) => ctx.currentLevel === 'a2' && ctx.totalWordsInGrade > 0 && ctx.progress.learnedWords.length >= ctx.totalWordsInGrade * 0.25,
  },
  {
    id: 'cefr_a2_50',
    name: { zh: 'A2 进阶', en: 'A2 Progressing' },
    description: { zh: 'A2等级完成50%', en: 'Complete 50% of A2' },
    icon: '🌿',
    category: 'grade',
    condition: (ctx) => ctx.currentLevel === 'a2' && ctx.totalWordsInGrade > 0 && ctx.progress.learnedWords.length >= ctx.totalWordsInGrade * 0.5,
  },
  {
    id: 'cefr_a2_75',
    name: { zh: 'A2 精通', en: 'A2 Advanced' },
    description: { zh: 'A2等级完成75%', en: 'Complete 75% of A2' },
    icon: '🌳',
    category: 'grade',
    condition: (ctx) => ctx.currentLevel === 'a2' && ctx.totalWordsInGrade > 0 && ctx.progress.learnedWords.length >= ctx.totalWordsInGrade * 0.75,
  },
  {
    id: 'cefr_a2_100',
    name: { zh: 'A2 毕业生', en: 'A2 Graduate' },
    description: { zh: 'A2等级完成100%', en: 'Complete 100% of A2' },
    icon: '🎓',
    category: 'grade',
    condition: (ctx) => ctx.currentLevel === 'a2' && ctx.totalWordsInGrade > 0 && ctx.progress.learnedWords.length >= ctx.totalWordsInGrade,
  },
  // B1 等级
  {
    id: 'cefr_b1_25',
    name: { zh: 'B1 起步', en: 'B1 Starter' },
    description: { zh: 'B1等级完成25%', en: 'Complete 25% of B1' },
    icon: '🌱',
    category: 'grade',
    condition: (ctx) => ctx.currentLevel === 'b1' && ctx.totalWordsInGrade > 0 && ctx.progress.learnedWords.length >= ctx.totalWordsInGrade * 0.25,
  },
  {
    id: 'cefr_b1_50',
    name: { zh: 'B1 进阶', en: 'B1 Progressing' },
    description: { zh: 'B1等级完成50%', en: 'Complete 50% of B1' },
    icon: '🌿',
    category: 'grade',
    condition: (ctx) => ctx.currentLevel === 'b1' && ctx.totalWordsInGrade > 0 && ctx.progress.learnedWords.length >= ctx.totalWordsInGrade * 0.5,
  },
  {
    id: 'cefr_b1_75',
    name: { zh: 'B1 精通', en: 'B1 Advanced' },
    description: { zh: 'B1等级完成75%', en: 'Complete 75% of B1' },
    icon: '🌳',
    category: 'grade',
    condition: (ctx) => ctx.currentLevel === 'b1' && ctx.totalWordsInGrade > 0 && ctx.progress.learnedWords.length >= ctx.totalWordsInGrade * 0.75,
  },
  {
    id: 'cefr_b1_100',
    name: { zh: 'B1 毕业生', en: 'B1 Graduate' },
    description: { zh: 'B1等级完成100%', en: 'Complete 100% of B1' },
    icon: '🎓',
    category: 'grade',
    condition: (ctx) => ctx.currentLevel === 'b1' && ctx.totalWordsInGrade > 0 && ctx.progress.learnedWords.length >= ctx.totalWordsInGrade,
  },
  // B2 等级
  {
    id: 'cefr_b2_25',
    name: { zh: 'B2 起步', en: 'B2 Starter' },
    description: { zh: 'B2等级完成25%', en: 'Complete 25% of B2' },
    icon: '🌱',
    category: 'grade',
    condition: (ctx) => ctx.currentLevel === 'b2' && ctx.totalWordsInGrade > 0 && ctx.progress.learnedWords.length >= ctx.totalWordsInGrade * 0.25,
  },
  {
    id: 'cefr_b2_50',
    name: { zh: 'B2 进阶', en: 'B2 Progressing' },
    description: { zh: 'B2等级完成50%', en: 'Complete 50% of B2' },
    icon: '🌿',
    category: 'grade',
    condition: (ctx) => ctx.currentLevel === 'b2' && ctx.totalWordsInGrade > 0 && ctx.progress.learnedWords.length >= ctx.totalWordsInGrade * 0.5,
  },
  {
    id: 'cefr_b2_75',
    name: { zh: 'B2 精通', en: 'B2 Advanced' },
    description: { zh: 'B2等级完成75%', en: 'Complete 75% of B2' },
    icon: '🌳',
    category: 'grade',
    condition: (ctx) => ctx.currentLevel === 'b2' && ctx.totalWordsInGrade > 0 && ctx.progress.learnedWords.length >= ctx.totalWordsInGrade * 0.75,
  },
  {
    id: 'cefr_b2_100',
    name: { zh: 'B2 毕业生', en: 'B2 Graduate' },
    description: { zh: 'B2等级完成100%', en: 'Complete 100% of B2' },
    icon: '🎓',
    category: 'grade',
    condition: (ctx) => ctx.currentLevel === 'b2' && ctx.totalWordsInGrade > 0 && ctx.progress.learnedWords.length >= ctx.totalWordsInGrade,
  },
  // C1 等级
  {
    id: 'cefr_c1_25',
    name: { zh: 'C1 起步', en: 'C1 Starter' },
    description: { zh: 'C1等级完成25%', en: 'Complete 25% of C1' },
    icon: '🌱',
    category: 'grade',
    condition: (ctx) => ctx.currentLevel === 'c1' && ctx.totalWordsInGrade > 0 && ctx.progress.learnedWords.length >= ctx.totalWordsInGrade * 0.25,
  },
  {
    id: 'cefr_c1_50',
    name: { zh: 'C1 进阶', en: 'C1 Progressing' },
    description: { zh: 'C1等级完成50%', en: 'Complete 50% of C1' },
    icon: '🌿',
    category: 'grade',
    condition: (ctx) => ctx.currentLevel === 'c1' && ctx.totalWordsInGrade > 0 && ctx.progress.learnedWords.length >= ctx.totalWordsInGrade * 0.5,
  },
  {
    id: 'cefr_c1_75',
    name: { zh: 'C1 精通', en: 'C1 Advanced' },
    description: { zh: 'C1等级完成75%', en: 'Complete 75% of C1' },
    icon: '🌳',
    category: 'grade',
    condition: (ctx) => ctx.currentLevel === 'c1' && ctx.totalWordsInGrade > 0 && ctx.progress.learnedWords.length >= ctx.totalWordsInGrade * 0.75,
  },
  {
    id: 'cefr_c1_100',
    name: { zh: 'C1 毕业生', en: 'C1 Graduate' },
    description: { zh: 'C1等级完成100%', en: 'Complete 100% of C1' },
    icon: '🎓',
    category: 'grade',
    condition: (ctx) => ctx.currentLevel === 'c1' && ctx.totalWordsInGrade > 0 && ctx.progress.learnedWords.length >= ctx.totalWordsInGrade,
  },
  // C2 等级
  {
    id: 'cefr_c2_25',
    name: { zh: 'C2 起步', en: 'C2 Starter' },
    description: { zh: 'C2等级完成25%', en: 'Complete 25% of C2' },
    icon: '🌱',
    category: 'grade',
    condition: (ctx) => ctx.currentLevel === 'c2' && ctx.totalWordsInGrade > 0 && ctx.progress.learnedWords.length >= ctx.totalWordsInGrade * 0.25,
  },
  {
    id: 'cefr_c2_50',
    name: { zh: 'C2 进阶', en: 'C2 Progressing' },
    description: { zh: 'C2等级完成50%', en: 'Complete 50% of C2' },
    icon: '🌿',
    category: 'grade',
    condition: (ctx) => ctx.currentLevel === 'c2' && ctx.totalWordsInGrade > 0 && ctx.progress.learnedWords.length >= ctx.totalWordsInGrade * 0.5,
  },
  {
    id: 'cefr_c2_75',
    name: { zh: 'C2 精通', en: 'C2 Advanced' },
    description: { zh: 'C2等级完成75%', en: 'Complete 75% of C2' },
    icon: '🌳',
    category: 'grade',
    condition: (ctx) => ctx.currentLevel === 'c2' && ctx.totalWordsInGrade > 0 && ctx.progress.learnedWords.length >= ctx.totalWordsInGrade * 0.75,
  },
  {
    id: 'cefr_c2_100',
    name: { zh: 'C2 毕业生', en: 'C2 Graduate' },
    description: { zh: 'C2等级完成100%', en: 'Complete 100% of C2' },
    icon: '🎓',
    category: 'grade',
    condition: (ctx) => ctx.currentLevel === 'c2' && ctx.totalWordsInGrade > 0 && ctx.progress.learnedWords.length >= ctx.totalWordsInGrade,
  },

  // ========== 中国教材等级专属勋章 ==========
  // 小学
  {
    id: 'china_primary_25',
    name: { zh: '小学起步', en: 'Primary Starter' },
    description: { zh: '小学词汇完成25%', en: 'Complete 25% of Primary' },
    icon: '🌱',
    category: 'grade',
    condition: (ctx) => ctx.currentLevel === 'primary' && ctx.totalWordsInGrade > 0 && ctx.progress.learnedWords.length >= ctx.totalWordsInGrade * 0.25,
  },
  {
    id: 'china_primary_50',
    name: { zh: '小学进阶', en: 'Primary Progressing' },
    description: { zh: '小学词汇完成50%', en: 'Complete 50% of Primary' },
    icon: '🌿',
    category: 'grade',
    condition: (ctx) => ctx.currentLevel === 'primary' && ctx.totalWordsInGrade > 0 && ctx.progress.learnedWords.length >= ctx.totalWordsInGrade * 0.5,
  },
  {
    id: 'china_primary_75',
    name: { zh: '小学精通', en: 'Primary Advanced' },
    description: { zh: '小学词汇完成75%', en: 'Complete 75% of Primary' },
    icon: '🌳',
    category: 'grade',
    condition: (ctx) => ctx.currentLevel === 'primary' && ctx.totalWordsInGrade > 0 && ctx.progress.learnedWords.length >= ctx.totalWordsInGrade * 0.75,
  },
  {
    id: 'china_primary_100',
    name: { zh: '小学毕业', en: 'Primary Graduate' },
    description: { zh: '小学词汇完成100%', en: 'Complete 100% of Primary' },
    icon: '🎒',
    category: 'grade',
    condition: (ctx) => ctx.currentLevel === 'primary' && ctx.totalWordsInGrade > 0 && ctx.progress.learnedWords.length >= ctx.totalWordsInGrade,
  },
  // 初中
  {
    id: 'china_junior_25',
    name: { zh: '初中起步', en: 'Junior Starter' },
    description: { zh: '初中词汇完成25%', en: 'Complete 25% of Junior' },
    icon: '🌱',
    category: 'grade',
    condition: (ctx) => ctx.currentLevel === 'junior' && ctx.totalWordsInGrade > 0 && ctx.progress.learnedWords.length >= ctx.totalWordsInGrade * 0.25,
  },
  {
    id: 'china_junior_50',
    name: { zh: '初中进阶', en: 'Junior Progressing' },
    description: { zh: '初中词汇完成50%', en: 'Complete 50% of Junior' },
    icon: '🌿',
    category: 'grade',
    condition: (ctx) => ctx.currentLevel === 'junior' && ctx.totalWordsInGrade > 0 && ctx.progress.learnedWords.length >= ctx.totalWordsInGrade * 0.5,
  },
  {
    id: 'china_junior_75',
    name: { zh: '初中精通', en: 'Junior Advanced' },
    description: { zh: '初中词汇完成75%', en: 'Complete 75% of Junior' },
    icon: '🌳',
    category: 'grade',
    condition: (ctx) => ctx.currentLevel === 'junior' && ctx.totalWordsInGrade > 0 && ctx.progress.learnedWords.length >= ctx.totalWordsInGrade * 0.75,
  },
  {
    id: 'china_junior_100',
    name: { zh: '初中毕业', en: 'Junior Graduate' },
    description: { zh: '初中词汇完成100%', en: 'Complete 100% of Junior' },
    icon: '📝',
    category: 'grade',
    condition: (ctx) => ctx.currentLevel === 'junior' && ctx.totalWordsInGrade > 0 && ctx.progress.learnedWords.length >= ctx.totalWordsInGrade,
  },
  // 高中
  {
    id: 'china_senior_25',
    name: { zh: '高中起步', en: 'Senior Starter' },
    description: { zh: '高中词汇完成25%', en: 'Complete 25% of Senior' },
    icon: '🌱',
    category: 'grade',
    condition: (ctx) => ctx.currentLevel === 'senior' && ctx.totalWordsInGrade > 0 && ctx.progress.learnedWords.length >= ctx.totalWordsInGrade * 0.25,
  },
  {
    id: 'china_senior_50',
    name: { zh: '高中进阶', en: 'Senior Progressing' },
    description: { zh: '高中词汇完成50%', en: 'Complete 50% of Senior' },
    icon: '🌿',
    category: 'grade',
    condition: (ctx) => ctx.currentLevel === 'senior' && ctx.totalWordsInGrade > 0 && ctx.progress.learnedWords.length >= ctx.totalWordsInGrade * 0.5,
  },
  {
    id: 'china_senior_75',
    name: { zh: '高中精通', en: 'Senior Advanced' },
    description: { zh: '高中词汇完成75%', en: 'Complete 75% of Senior' },
    icon: '🌳',
    category: 'grade',
    condition: (ctx) => ctx.currentLevel === 'senior' && ctx.totalWordsInGrade > 0 && ctx.progress.learnedWords.length >= ctx.totalWordsInGrade * 0.75,
  },
  {
    id: 'china_senior_100',
    name: { zh: '高中毕业', en: 'Senior Graduate' },
    description: { zh: '高中词汇完成100%', en: 'Complete 100% of Senior' },
    icon: '🎓',
    category: 'grade',
    condition: (ctx) => ctx.currentLevel === 'senior' && ctx.totalWordsInGrade > 0 && ctx.progress.learnedWords.length >= ctx.totalWordsInGrade,
  },
  // 四级
  {
    id: 'china_cet4_25',
    name: { zh: '四级起步', en: 'CET-4 Starter' },
    description: { zh: '四级词汇完成25%', en: 'Complete 25% of CET-4' },
    icon: '🌱',
    category: 'grade',
    condition: (ctx) => ctx.currentLevel === 'cet4' && ctx.totalWordsInGrade > 0 && ctx.progress.learnedWords.length >= ctx.totalWordsInGrade * 0.25,
  },
  {
    id: 'china_cet4_50',
    name: { zh: '四级进阶', en: 'CET-4 Progressing' },
    description: { zh: '四级词汇完成50%', en: 'Complete 50% of CET-4' },
    icon: '🌿',
    category: 'grade',
    condition: (ctx) => ctx.currentLevel === 'cet4' && ctx.totalWordsInGrade > 0 && ctx.progress.learnedWords.length >= ctx.totalWordsInGrade * 0.5,
  },
  {
    id: 'china_cet4_75',
    name: { zh: '四级精通', en: 'CET-4 Advanced' },
    description: { zh: '四级词汇完成75%', en: 'Complete 75% of CET-4' },
    icon: '🌳',
    category: 'grade',
    condition: (ctx) => ctx.currentLevel === 'cet4' && ctx.totalWordsInGrade > 0 && ctx.progress.learnedWords.length >= ctx.totalWordsInGrade * 0.75,
  },
  {
    id: 'china_cet4_100',
    name: { zh: '四级达人', en: 'CET-4 Master' },
    description: { zh: '四级词汇完成100%', en: 'Complete 100% of CET-4' },
    icon: '🏅',
    category: 'grade',
    condition: (ctx) => ctx.currentLevel === 'cet4' && ctx.totalWordsInGrade > 0 && ctx.progress.learnedWords.length >= ctx.totalWordsInGrade,
  },
  // 六级
  {
    id: 'china_cet6_25',
    name: { zh: '六级起步', en: 'CET-6 Starter' },
    description: { zh: '六级词汇完成25%', en: 'Complete 25% of CET-6' },
    icon: '🌱',
    category: 'grade',
    condition: (ctx) => ctx.currentLevel === 'cet6' && ctx.totalWordsInGrade > 0 && ctx.progress.learnedWords.length >= ctx.totalWordsInGrade * 0.25,
  },
  {
    id: 'china_cet6_50',
    name: { zh: '六级进阶', en: 'CET-6 Progressing' },
    description: { zh: '六级词汇完成50%', en: 'Complete 50% of CET-6' },
    icon: '🌿',
    category: 'grade',
    condition: (ctx) => ctx.currentLevel === 'cet6' && ctx.totalWordsInGrade > 0 && ctx.progress.learnedWords.length >= ctx.totalWordsInGrade * 0.5,
  },
  {
    id: 'china_cet6_75',
    name: { zh: '六级精通', en: 'CET-6 Advanced' },
    description: { zh: '六级词汇完成75%', en: 'Complete 75% of CET-6' },
    icon: '🌳',
    category: 'grade',
    condition: (ctx) => ctx.currentLevel === 'cet6' && ctx.totalWordsInGrade > 0 && ctx.progress.learnedWords.length >= ctx.totalWordsInGrade * 0.75,
  },
  {
    id: 'china_cet6_100',
    name: { zh: '六级达人', en: 'CET-6 Master' },
    description: { zh: '六级词汇完成100%', en: 'Complete 100% of CET-6' },
    icon: '👑',
    category: 'grade',
    condition: (ctx) => ctx.currentLevel === 'cet6' && ctx.totalWordsInGrade > 0 && ctx.progress.learnedWords.length >= ctx.totalWordsInGrade,
  },

  // ========== 早期词汇勋章（5% 和 15%，补充进度勋章 25% 之前的空白） ==========
  // CEFR 等级
  {
    id: 'cefr_a1_words_5',
    name: { zh: 'A1 启程', en: 'A1 Launch' },
    description: { zh: 'A1词汇完成5%', en: 'Complete 5% of A1 vocabulary' },
    icon: '🚀',
    category: 'wordlist',
    condition: (ctx) => ctx.currentLevel === 'a1' && ctx.totalWordsInGrade > 0 && ctx.progress.learnedWords.length >= ctx.totalWordsInGrade * 0.05,
  },
  {
    id: 'cefr_a1_words_15',
    name: { zh: 'A1 小成', en: 'A1 Progress' },
    description: { zh: 'A1词汇完成15%', en: 'Complete 15% of A1 vocabulary' },
    icon: '⭐',
    category: 'wordlist',
    condition: (ctx) => ctx.currentLevel === 'a1' && ctx.totalWordsInGrade > 0 && ctx.progress.learnedWords.length >= ctx.totalWordsInGrade * 0.15,
  },
  {
    id: 'cefr_a2_words_5',
    name: { zh: 'A2 启程', en: 'A2 Launch' },
    description: { zh: 'A2词汇完成5%', en: 'Complete 5% of A2 vocabulary' },
    icon: '🚀',
    category: 'wordlist',
    condition: (ctx) => ctx.currentLevel === 'a2' && ctx.totalWordsInGrade > 0 && ctx.progress.learnedWords.length >= ctx.totalWordsInGrade * 0.05,
  },
  {
    id: 'cefr_a2_words_15',
    name: { zh: 'A2 小成', en: 'A2 Progress' },
    description: { zh: 'A2词汇完成15%', en: 'Complete 15% of A2 vocabulary' },
    icon: '⭐',
    category: 'wordlist',
    condition: (ctx) => ctx.currentLevel === 'a2' && ctx.totalWordsInGrade > 0 && ctx.progress.learnedWords.length >= ctx.totalWordsInGrade * 0.15,
  },
  {
    id: 'cefr_b1_words_5',
    name: { zh: 'B1 启程', en: 'B1 Launch' },
    description: { zh: 'B1词汇完成5%', en: 'Complete 5% of B1 vocabulary' },
    icon: '🚀',
    category: 'wordlist',
    condition: (ctx) => ctx.currentLevel === 'b1' && ctx.totalWordsInGrade > 0 && ctx.progress.learnedWords.length >= ctx.totalWordsInGrade * 0.05,
  },
  {
    id: 'cefr_b1_words_15',
    name: { zh: 'B1 小成', en: 'B1 Progress' },
    description: { zh: 'B1词汇完成15%', en: 'Complete 15% of B1 vocabulary' },
    icon: '⭐',
    category: 'wordlist',
    condition: (ctx) => ctx.currentLevel === 'b1' && ctx.totalWordsInGrade > 0 && ctx.progress.learnedWords.length >= ctx.totalWordsInGrade * 0.15,
  },
  {
    id: 'cefr_b2_words_5',
    name: { zh: 'B2 启程', en: 'B2 Launch' },
    description: { zh: 'B2词汇完成5%', en: 'Complete 5% of B2 vocabulary' },
    icon: '🚀',
    category: 'wordlist',
    condition: (ctx) => ctx.currentLevel === 'b2' && ctx.totalWordsInGrade > 0 && ctx.progress.learnedWords.length >= ctx.totalWordsInGrade * 0.05,
  },
  {
    id: 'cefr_b2_words_15',
    name: { zh: 'B2 小成', en: 'B2 Progress' },
    description: { zh: 'B2词汇完成15%', en: 'Complete 15% of B2 vocabulary' },
    icon: '⭐',
    category: 'wordlist',
    condition: (ctx) => ctx.currentLevel === 'b2' && ctx.totalWordsInGrade > 0 && ctx.progress.learnedWords.length >= ctx.totalWordsInGrade * 0.15,
  },
  {
    id: 'cefr_c1_words_5',
    name: { zh: 'C1 启程', en: 'C1 Launch' },
    description: { zh: 'C1词汇完成5%', en: 'Complete 5% of C1 vocabulary' },
    icon: '🚀',
    category: 'wordlist',
    condition: (ctx) => ctx.currentLevel === 'c1' && ctx.totalWordsInGrade > 0 && ctx.progress.learnedWords.length >= ctx.totalWordsInGrade * 0.05,
  },
  {
    id: 'cefr_c1_words_15',
    name: { zh: 'C1 小成', en: 'C1 Progress' },
    description: { zh: 'C1词汇完成15%', en: 'Complete 15% of C1 vocabulary' },
    icon: '⭐',
    category: 'wordlist',
    condition: (ctx) => ctx.currentLevel === 'c1' && ctx.totalWordsInGrade > 0 && ctx.progress.learnedWords.length >= ctx.totalWordsInGrade * 0.15,
  },
  {
    id: 'cefr_c2_words_5',
    name: { zh: 'C2 启程', en: 'C2 Launch' },
    description: { zh: 'C2词汇完成5%', en: 'Complete 5% of C2 vocabulary' },
    icon: '🚀',
    category: 'wordlist',
    condition: (ctx) => ctx.currentLevel === 'c2' && ctx.totalWordsInGrade > 0 && ctx.progress.learnedWords.length >= ctx.totalWordsInGrade * 0.05,
  },
  {
    id: 'cefr_c2_words_15',
    name: { zh: 'C2 小成', en: 'C2 Progress' },
    description: { zh: 'C2词汇完成15%', en: 'Complete 15% of C2 vocabulary' },
    icon: '⭐',
    category: 'wordlist',
    condition: (ctx) => ctx.currentLevel === 'c2' && ctx.totalWordsInGrade > 0 && ctx.progress.learnedWords.length >= ctx.totalWordsInGrade * 0.15,
  },
  // 中国教材等级
  {
    id: 'china_primary_words_5',
    name: { zh: '小学启程', en: 'Primary Launch' },
    description: { zh: '小学词汇完成5%', en: 'Complete 5% of Primary vocabulary' },
    icon: '🚀',
    category: 'wordlist',
    condition: (ctx) => ctx.currentLevel === 'primary' && ctx.totalWordsInGrade > 0 && ctx.progress.learnedWords.length >= ctx.totalWordsInGrade * 0.05,
  },
  {
    id: 'china_primary_words_15',
    name: { zh: '小学小成', en: 'Primary Progress' },
    description: { zh: '小学词汇完成15%', en: 'Complete 15% of Primary vocabulary' },
    icon: '⭐',
    category: 'wordlist',
    condition: (ctx) => ctx.currentLevel === 'primary' && ctx.totalWordsInGrade > 0 && ctx.progress.learnedWords.length >= ctx.totalWordsInGrade * 0.15,
  },
  {
    id: 'china_junior_words_5',
    name: { zh: '初中启程', en: 'Junior Launch' },
    description: { zh: '初中词汇完成5%', en: 'Complete 5% of Junior vocabulary' },
    icon: '🚀',
    category: 'wordlist',
    condition: (ctx) => ctx.currentLevel === 'junior' && ctx.totalWordsInGrade > 0 && ctx.progress.learnedWords.length >= ctx.totalWordsInGrade * 0.05,
  },
  {
    id: 'china_junior_words_15',
    name: { zh: '初中小成', en: 'Junior Progress' },
    description: { zh: '初中词汇完成15%', en: 'Complete 15% of Junior vocabulary' },
    icon: '⭐',
    category: 'wordlist',
    condition: (ctx) => ctx.currentLevel === 'junior' && ctx.totalWordsInGrade > 0 && ctx.progress.learnedWords.length >= ctx.totalWordsInGrade * 0.15,
  },
  {
    id: 'china_senior_words_5',
    name: { zh: '高中启程', en: 'Senior Launch' },
    description: { zh: '高中词汇完成5%', en: 'Complete 5% of Senior vocabulary' },
    icon: '🚀',
    category: 'wordlist',
    condition: (ctx) => ctx.currentLevel === 'senior' && ctx.totalWordsInGrade > 0 && ctx.progress.learnedWords.length >= ctx.totalWordsInGrade * 0.05,
  },
  {
    id: 'china_senior_words_15',
    name: { zh: '高中小成', en: 'Senior Progress' },
    description: { zh: '高中词汇完成15%', en: 'Complete 15% of Senior vocabulary' },
    icon: '⭐',
    category: 'wordlist',
    condition: (ctx) => ctx.currentLevel === 'senior' && ctx.totalWordsInGrade > 0 && ctx.progress.learnedWords.length >= ctx.totalWordsInGrade * 0.15,
  },
  {
    id: 'china_cet4_words_5',
    name: { zh: '四级启程', en: 'CET-4 Launch' },
    description: { zh: '四级词汇完成5%', en: 'Complete 5% of CET-4 vocabulary' },
    icon: '🚀',
    category: 'wordlist',
    condition: (ctx) => ctx.currentLevel === 'cet4' && ctx.totalWordsInGrade > 0 && ctx.progress.learnedWords.length >= ctx.totalWordsInGrade * 0.05,
  },
  {
    id: 'china_cet4_words_15',
    name: { zh: '四级小成', en: 'CET-4 Progress' },
    description: { zh: '四级词汇完成15%', en: 'Complete 15% of CET-4 vocabulary' },
    icon: '⭐',
    category: 'wordlist',
    condition: (ctx) => ctx.currentLevel === 'cet4' && ctx.totalWordsInGrade > 0 && ctx.progress.learnedWords.length >= ctx.totalWordsInGrade * 0.15,
  },
  {
    id: 'china_cet6_words_5',
    name: { zh: '六级启程', en: 'CET-6 Launch' },
    description: { zh: '六级词汇完成5%', en: 'Complete 5% of CET-6 vocabulary' },
    icon: '🚀',
    category: 'wordlist',
    condition: (ctx) => ctx.currentLevel === 'cet6' && ctx.totalWordsInGrade > 0 && ctx.progress.learnedWords.length >= ctx.totalWordsInGrade * 0.05,
  },
  {
    id: 'china_cet6_words_15',
    name: { zh: '六级小成', en: 'CET-6 Progress' },
    description: { zh: '六级词汇完成15%', en: 'Complete 15% of CET-6 vocabulary' },
    icon: '⭐',
    category: 'wordlist',
    condition: (ctx) => ctx.currentLevel === 'cet6' && ctx.totalWordsInGrade > 0 && ctx.progress.learnedWords.length >= ctx.totalWordsInGrade * 0.15,
  },

  // ========== 连续学习勋章 ==========
  {
    id: 'three_days',
    name: { zh: '坚持三天', en: 'Three Day Streak' },
    description: { zh: '连续学习3天', en: 'Learn for 3 days in a row' },
    icon: '🔥',
    category: 'streak',
    condition: (ctx) => ctx.stats.streakDays >= 3,
  },
  {
    id: 'persistent',
    name: { zh: '坚持不懈', en: 'Persistent' },
    description: { zh: '连续学习7天', en: 'Learn for 7 days in a row' },
    icon: '💪',
    category: 'streak',
    condition: (ctx) => ctx.stats.streakDays >= 7,
  },
  {
    id: 'dedicated',
    name: { zh: '学习达人', en: 'Dedicated Learner' },
    description: { zh: '连续学习30天', en: 'Learn for 30 days in a row' },
    icon: '🏆',
    category: 'streak',
    condition: (ctx) => ctx.stats.streakDays >= 30,
  },

  // ========== 通用勋章 ==========
  {
    id: 'ice_breaker',
    name: { zh: '破冰者', en: 'Ice Breaker' },
    description: { zh: '完成第一关', en: 'Complete your first level' },
    icon: '🧊',
    category: 'general',
    condition: (ctx) => ctx.progress.completedLevels >= 1,
  },
  {
    id: 'rising_star',
    name: { zh: '初露锋芒', en: 'Rising Star' },
    description: { zh: '完成第5关', en: 'Complete level 5' },
    icon: '⭐',
    category: 'general',
    condition: (ctx) => ctx.progress.completedLevels >= 5,
  },
  {
    id: 'ten_levels',
    name: { zh: '小试牛刀', en: 'Getting Started' },
    description: { zh: '完成10关', en: 'Complete 10 levels' },
    icon: '🎯',
    category: 'general',
    condition: (ctx) => ctx.progress.completedLevels >= 10,
  },
]

/**
 * 检查用户获得了哪些新勋章
 */
export function checkNewBadges(
  ctx: BadgeContext,
  earnedBadges: string[]
): BadgeConfig[] {
  return badges.filter(
    (badge) =>
      !earnedBadges.includes(badge.id) && badge.condition(ctx)
  )
}

export type { BadgeConfig, BadgeContext }

/**
 * 获取勋章信息
 */
export function getBadgeById(id: string): BadgeConfig | undefined {
  return badges.find((b) => b.id === id)
}

export default badges
