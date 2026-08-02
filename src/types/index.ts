/**
 * 单词数据结构
 */
export interface Word {
  id?: number
  word: string
  phoneticUk: string
  phoneticUs: string
  translation: string
  mnemonic: string
  sentence: string
  audioUk: string
  audioUs: string
}

/**
 * 词库数据结构
 */
export interface WordBook {
  id?: number
  name: string
  description: string
  wordCount: number
  words: Word[]
  isBuiltIn: boolean
  createdAt: number
}

/**
 * 学习记录数据结构
 */
export interface LearningRecord {
  id?: number
  wordId: number
  bookId: number
  status: WordStatus
  // SM2算法参数
  easeFactor: number
  interval: number
  repetitions: number
  nextReviewDate: number
  lastReviewDate: number
  // 统计
  correctCount: number
  wrongCount: number
  createdAt: number
  updatedAt: number
}

/**
 * 单词状态
 */
export type WordStatus = 'unlearned' | 'learning' | 'mastered'

/**
 * 复习评级
 */
export type ReviewGrade = 'again' | 'hard' | 'good' | 'easy'

/**
 * 每日统计
 */
export interface DailyStats {
  id?: number
  date: string // YYYY-MM-DD
  newWords: number
  reviewCount: number
  correctCount: number
  wrongCount: number
  studyTime: number // 秒
  createdAt: number
}

/**
 * 生词本
 */
export interface WordBookItem {
  id?: number
  wordId: number
  bookId: number
  addedAt: number
  source: 'dictation' | 'manual' // 来源：默写错误或手动添加
}

/**
 * 用户设置
 */
export interface UserSettings {
  id?: number
  theme: 'light' | 'dark'
  networkEnabled: boolean
  dailyNewWords: number
  pronunciation: 'uk' | 'us'
  dictationHints: {
    phonetic: boolean
    firstLetter: boolean
  }
  speechRate: number
  // 自动发音设置
  autoPronunciation: {
    flashcard: boolean   // 闪卡模式自动发音
    dictation: boolean   // 默写模式自动发音
    review: boolean      // 复习模式自动发音
  }
}

/**
 * API缓存
 */
export interface ApiCache {
  id?: number
  word: string
  data: any
  expireAt: number
  createdAt: number
}

/**
 * 学习会话
 */
export interface LearningSession {
  id?: number
  bookId: number
  mode: 'flashcard' | 'dictation'
  dictationType?: 'en2zh' | 'zh2en'
  startTime: number
  endTime?: number
  words: number[]
}
