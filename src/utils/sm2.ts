import type { ReviewGrade, LearningRecord } from '@/types'

/**
 * SM2间隔重复算法实现
 * 基于SuperMemo SM-2算法改进
 */

// 评级对应的质量分数映射
const GRADE_QUALITY_MAP: Record<ReviewGrade, number> = {
  again: 0,   // 完全不认识
  hard: 3,    // 模糊，勉强想起
  good: 4,    // 正确回答
  easy: 5     // 轻松记住
}

// 最小间隔天数
const MIN_INTERVAL = 1
// 最大间隔天数（已掌握单词）
const MAX_INTERVAL = 365
// 掌握阈值：连续正确次数达到此值视为掌握
const MASTERY_THRESHOLD = 5

/**
 * 计算下次复习日期
 * @param record 当前学习记录
 * @param grade 用户评级
 * @returns 更新后的学习记录参数
 */
export function calculateNextReview(
  record: Partial<LearningRecord>,
  grade: ReviewGrade
): Pick<LearningRecord, 'easeFactor' | 'interval' | 'repetitions' | 'nextReviewDate' | 'lastReviewDate' | 'status'> {
  const quality = GRADE_QUALITY_MAP[grade]
  const now = Date.now()
  
  let easeFactor = record.easeFactor ?? 2.5
  let interval = record.interval ?? 0
  let repetitions = record.repetitions ?? 0

  // SM2算法核心逻辑
  if (quality < 3) {
    // 回答错误，重置重复次数
    repetitions = 0
    interval = MIN_INTERVAL
  } else {
    // 回答正确
    if (repetitions === 0) {
      interval = 1
    } else if (repetitions === 1) {
      interval = 6
    } else {
      // 使用难度因子计算间隔
      interval = Math.round(interval * easeFactor)
    }
    repetitions += 1
  }

  // 更新难度因子（EF最小值为1.3）
  easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  if (easeFactor < 1.3) {
    easeFactor = 1.3
  }

  // 根据评级微调间隔
  if (grade === 'hard') {
    interval = Math.max(MIN_INTERVAL, Math.round(interval * 0.8))
  } else if (grade === 'easy') {
    interval = Math.round(interval * 1.3)
  }

  // 限制最大间隔
  interval = Math.min(interval, MAX_INTERVAL)

  // 计算下次复习日期
  const nextReviewDate = now + interval * 24 * 60 * 60 * 1000

  // 判断单词状态
  let status: 'unlearned' | 'learning' | 'mastered' = 'learning'
  if (repetitions >= MASTERY_THRESHOLD && quality >= 4) {
    status = 'mastered'
  } else if (repetitions === 0) {
    status = 'unlearned'
  }

  return {
    easeFactor,
    interval,
    repetitions,
    nextReviewDate,
    lastReviewDate: now,
    status
  }
}

/**
 * 创建新的学习记录
 */
export function createLearningRecord(wordId: number, bookId: number): Omit<LearningRecord, 'id'> {
  const now = Date.now()
  return {
    wordId,
    bookId,
    status: 'unlearned',
    easeFactor: 2.5,
    interval: 0,
    repetitions: 0,
    nextReviewDate: now, // 立即可复习
    lastReviewDate: 0,
    correctCount: 0,
    wrongCount: 0,
    createdAt: now,
    updatedAt: now
  }
}

/**
 * 判断单词是否需要复习
 */
export function isDueForReview(record: LearningRecord): boolean {
  return record.nextReviewDate <= Date.now()
}

/**
 * 获取需要复习的单词列表
 */
export function filterDueRecords(records: LearningRecord[]): LearningRecord[] {
  const now = Date.now()
  return records.filter(r => r.nextReviewDate <= now)
}

/**
 * 获取已掌握但需要抽查的单词
 * 已掌握单词每30天抽查一次
 */
export function filterMasteredForCheck(records: LearningRecord[]): LearningRecord[] {
  const now = Date.now()
  const checkInterval = 30 * 24 * 60 * 60 * 1000 // 30天
  return records.filter(r => 
    r.status === 'mastered' && 
    (r.lastReviewDate + checkInterval) <= now
  )
}
