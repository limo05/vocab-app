import { ref, computed } from 'vue'
import { db, getSettings } from '@/db'
import type { Word, WordBook, LearningRecord, DailyStats, ReviewGrade } from '@/types'
import { calculateNextReview, createLearningRecord, isDueForReview } from '@/utils/sm2'
import { playPronunciation as _playPronunciation } from '@/services/pronunciation'

/**
 * 学习管理composable
 * 管理单词学习、复习、每日任务等核心逻辑
 */

// 当前学习会话状态
const currentBookId = ref<number>(0)
const sessionStartTime = ref<number>(0)
const isLearning = ref(false)

export function useLearning() {
  /**
   * 初始化词库（加载内置词库到数据库）
   */
  async function initWordBooks(): Promise<void> {
    const count = await db.wordBooks.count()
    if (count > 0) return // 已初始化

    // 加载中考词库
    const zhongkaoWords = (await import('@/wordlists/zhongkao.json')).default
    await db.wordBooks.add({
      name: '中考核心词汇',
      description: '中考英语核心词汇，适合初中生使用',
      wordCount: zhongkaoWords.length,
      words: zhongkaoWords,
      isBuiltIn: true,
      createdAt: Date.now()
    })

    // 加载高考词库
    const gaokaoWords = (await import('@/wordlists/gaokao.json')).default
    await db.wordBooks.add({
      name: '高考3500词汇',
      description: '高考英语3500核心词汇',
      wordCount: gaokaoWords.length,
      words: gaokaoWords,
      isBuiltIn: true,
      createdAt: Date.now()
    })
  }

  /**
   * 获取所有词库
   */
  async function getWordBooks(): Promise<WordBook[]> {
    return await db.wordBooks.toArray()
  }

  /**
   * 获取词库中的单词
   */
  async function getWordsByBookId(bookId: number): Promise<Word[]> {
    const book = await db.wordBooks.get(bookId)
    return book?.words || []
  }

  /**
   * 获取今日新词（从未学习过的单词）
   */
  async function getNewWords(bookId: number, limit: number): Promise<Word[]> {
    const settings = await getSettings()
    const maxNew = limit || settings.dailyNewWords || 20

    const book = await db.wordBooks.get(bookId)
    if (!book) return []

    // 获取已学习的单词ID
    const learnedRecords = await db.learningRecords
      .where('bookId').equals(bookId)
      .toArray()
    const learnedWordIds = new Set(learnedRecords.map(r => r.wordId))

    // 筛选未学习的单词
    const newWords = book.words.filter((_, index) => !learnedWordIds.has(index + 1))
    return newWords.slice(0, maxNew)
  }

  /**
   * 获取今日到期复习单词
   */
  async function getDueReviewWords(bookId: number): Promise<Array<{ word: Word; record: LearningRecord }>> {
    const records = await db.learningRecords
      .where('bookId').equals(bookId)
      .toArray()

    const dueRecords = records.filter(r => isDueForReview(r))
    if (dueRecords.length === 0) return []

    const book = await db.wordBooks.get(bookId)
    if (!book) return []

    return dueRecords.map(record => ({
      word: book.words[record.wordId - 1],
      record
    })).filter(item => item.word)
  }

  /**
   * 开始学习新单词
   */
  async function startLearningWord(wordId: number, bookId: number): Promise<void> {
    // 检查是否已有学习记录
    const existing = await db.learningRecords
      .where('wordId').equals(wordId)
      .and(r => r.bookId === bookId)
      .first()

    if (!existing) {
      await db.learningRecords.add(createLearningRecord(wordId, bookId))
    }

    // 更新今日统计
    await updateDailyStats('newWord')
  }

  /**
   * 复习单词（提交评级）
   */
  async function reviewWord(recordId: number, grade: ReviewGrade): Promise<void> {
    const record = await db.learningRecords.get(recordId)
    if (!record) return

    const updates = calculateNextReview(record, grade)
    await db.learningRecords.update(recordId, {
      ...updates,
      correctCount: record.correctCount + (grade !== 'again' ? 1 : 0),
      wrongCount: record.wrongCount + (grade === 'again' ? 1 : 0),
      updatedAt: Date.now()
    })

    // 更新统计
    await updateDailyStats('review', grade !== 'again')

    // 如果答错，加入生词本
    if (grade === 'again') {
      await addToWordBook(record.wordId, record.bookId, 'dictation')
    }
  }

  /**
   * 添加到生词本
   */
  async function addToWordBook(wordId: number, bookId: number, source: 'dictation' | 'manual' = 'manual'): Promise<void> {
    const existing = await db.wordBookItems
      .where('wordId').equals(wordId)
      .and(item => item.bookId === bookId)
      .first()

    if (!existing) {
      await db.wordBookItems.add({
        wordId,
        bookId,
        addedAt: Date.now(),
        source
      })
    }
  }

  /**
   * 从生词本移除
   */
  async function removeFromWordBook(wordId: number, bookId: number): Promise<void> {
    await db.wordBookItems
      .where('wordId').equals(wordId)
      .and(item => item.bookId === bookId)
      .delete()
  }

  /**
   * 获取生词本
   */
  async function getWordBookItems(): Promise<Array<{ word: Word; item: any }>> {
    const items = await db.wordBookItems.toArray()
    const result: Array<{ word: Word; item: any }> = []

    for (const item of items) {
      const book = await db.wordBooks.get(item.bookId)
      if (book) {
        const word = book.words[item.wordId - 1]
        if (word) {
          result.push({ word, item })
        }
      }
    }

    return result
  }

  /**
   * 更新每日统计
   */
  async function updateDailyStats(type: 'newWord' | 'review', isCorrect: boolean = true): Promise<void> {
    const today = new Date().toISOString().split('T')[0]
    let stats = await db.dailyStats.where('date').equals(today).first()

    if (!stats) {
      stats = {
        date: today,
        newWords: 0,
        reviewCount: 0,
        correctCount: 0,
        wrongCount: 0,
        studyTime: 0,
        createdAt: Date.now()
      }
      await db.dailyStats.add(stats)
      stats = await db.dailyStats.where('date').equals(today).first()
    }

    if (!stats?.id) return

    const updates: Partial<DailyStats> = {}
    if (type === 'newWord') {
      updates.newWords = (stats.newWords || 0) + 1
    } else {
      updates.reviewCount = (stats.reviewCount || 0) + 1
      if (isCorrect) {
        updates.correctCount = (stats.correctCount || 0) + 1
      } else {
        updates.wrongCount = (stats.wrongCount || 0) + 1
      }
    }

    await db.dailyStats.update(stats.id, updates)
  }

  /**
   * 更新学习时长
   */
  async function updateStudyTime(seconds: number): Promise<void> {
    const today = new Date().toISOString().split('T')[0]
    const stats = await db.dailyStats.where('date').equals(today).first()
    if (stats?.id) {
      await db.dailyStats.update(stats.id, {
        studyTime: (stats.studyTime || 0) + seconds
      })
    }
  }

  /**
   * 播放单词发音
   */
  async function playPronunciation(word: string, accent?: 'uk' | 'us'): Promise<void> {
    await _playPronunciation(word, accent)
  }

  /**
   * 导入自定义词库
   */
  async function importWordBook(name: string, words: Word[]): Promise<number> {
    const bookId = await db.wordBooks.add({
      name,
      description: '自定义导入词库',
      wordCount: words.length,
      words,
      isBuiltIn: false,
      createdAt: Date.now()
    })
    return bookId
  }

  /**
   * 删除词库
   */
  async function deleteWordBook(bookId: number): Promise<void> {
    await db.wordBooks.delete(bookId)
    await db.learningRecords.where('bookId').equals(bookId).delete()
  }

  return {
    initWordBooks,
    getWordBooks,
    getWordsByBookId,
    getNewWords,
    getDueReviewWords,
    startLearningWord,
    reviewWord,
    addToWordBook,
    removeFromWordBook,
    getWordBookItems,
    updateDailyStats,
    updateStudyTime,
    playPronunciation,
    importWordBook,
    deleteWordBook,
    currentBookId,
    isLearning
  }
}
