import Dexie, { type Table } from 'dexie'
import type {
  Word,
  WordBook,
  LearningRecord,
  DailyStats,
  WordBookItem,
  UserSettings,
  ApiCache,
  LearningSession
} from '@/types'

/**
 * Dexie数据库定义
 * 所有学习数据存储在IndexedDB中
 */
export class VocabDatabase extends Dexie {
  // 词库表
  wordBooks!: Table<WordBook, number>
  // 单词表
  words!: Table<Word, number>
  // 学习记录表
  learningRecords!: Table<LearningRecord, number>
  // 每日统计表
  dailyStats!: Table<DailyStats, number>
  // 生词本表
  wordBookItems!: Table<WordBookItem, number>
  // 用户设置表
  userSettings!: Table<UserSettings, number>
  // API缓存表
  apiCache!: Table<ApiCache, number>
  // 学习会话表
  learningSessions!: Table<LearningSession, number>

  constructor() {
    super('VocabAppDB')

    this.version(1).stores({
      wordBooks: '++id, name, createdAt',
      words: '++id, word, [word+bookId]',
      learningRecords: '++id, wordId, bookId, status, nextReviewDate',
      dailyStats: '++id, &date',
      wordBookItems: '++id, wordId, bookId, source',
      userSettings: '++id',
      apiCache: '++id, &word, expireAt',
      learningSessions: '++id, bookId, mode, startTime'
    })
  }
}

// 创建数据库实例
export const db = new VocabDatabase()

/**
 * 初始化默认设置
 */
export async function initDefaultSettings(): Promise<void> {
  const count = await db.userSettings.count()
  if (count === 0) {
    await db.userSettings.add({
      theme: 'light',
      networkEnabled: true,
      dailyNewWords: 20,
      pronunciation: 'uk',
      dictationHints: {
        phonetic: true,
        firstLetter: false
      },
      speechRate: 1.0,
      autoPronunciation: {
        flashcard: true,
        dictation: true,
        review: true
      }
    })
  }
}

/**
 * 获取用户设置
 */
export async function getSettings(): Promise<UserSettings> {
  const settings = await db.userSettings.toCollection().first()
  if (!settings) {
    await initDefaultSettings()
    return (await db.userSettings.toCollection().first())!
  }
  return settings
}

/**
 * 更新用户设置
 */
export async function updateSettings(updates: Partial<UserSettings>): Promise<void> {
  const settings = await getSettings()
  if (settings.id) {
    await db.userSettings.update(settings.id, updates)
  }
}
