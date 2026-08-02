import { ref, computed } from 'vue'
import { db } from '@/db'
import type { DailyStats, LearningRecord } from '@/types'

/**
 * 统计数据composable
 * 管理学习数据统计和可视化数据
 */

export function useStats() {
  /**
   * 获取今日统计
   */
  async function getTodayStats(): Promise<DailyStats> {
    const today = new Date().toISOString().split('T')[0]
    const stats = await db.dailyStats.where('date').equals(today).first()
    return stats || {
      date: today,
      newWords: 0,
      reviewCount: 0,
      correctCount: 0,
      wrongCount: 0,
      studyTime: 0,
      createdAt: Date.now()
    }
  }

  /**
   * 获取最近N天的统计数据
   */
  async function getRecentStats(days: number = 7): Promise<DailyStats[]> {
    const allStats = await db.dailyStats.toArray()
    const now = new Date()
    const result: DailyStats[] = []

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      
      const stat = allStats.find(s => s.date === dateStr)
      result.push(stat || {
        date: dateStr,
        newWords: 0,
        reviewCount: 0,
        correctCount: 0,
        wrongCount: 0,
        studyTime: 0,
        createdAt: Date.now()
      })
    }

    return result
  }

  /**
   * 获取汇总统计
   */
  async function getSummaryStats(): Promise<{
    totalWords: number
    learnedWords: number
    masteredWords: number
    wordBookCount: number
    streakDays: number
    totalStudyTime: number
  }> {
    const records = await db.learningRecords.toArray()
    const allStats = await db.dailyStats.toArray()

    const learnedWords = records.filter(r => r.status !== 'unlearned').length
    const masteredWords = records.filter(r => r.status === 'mastered').length
    const wordBookItems = await db.wordBookItems.count()
    const totalStudyTime = allStats.reduce((sum, s) => sum + (s.studyTime || 0), 0)

    // 计算连续打卡天数
    const streakDays = calculateStreak(allStats)

    return {
      totalWords: 0, // 需要外部传入
      learnedWords,
      masteredWords,
      wordBookCount: wordBookItems,
      streakDays,
      totalStudyTime
    }
  }

  /**
   * 计算连续打卡天数
   */
  function calculateStreak(stats: DailyStats[]): number {
    if (stats.length === 0) return 0

    const sorted = stats
      .filter(s => s.newWords > 0 || s.reviewCount > 0)
      .map(s => s.date)
      .sort()
      .reverse()

    if (sorted.length === 0) return 0

    let streak = 0
    const today = new Date().toISOString().split('T')[0]
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

    // 检查今天或昨天是否有学习
    if (sorted[0] !== today && sorted[0] !== yesterday) {
      return 0
    }

    let checkDate = new Date(sorted[0])
    for (const dateStr of sorted) {
      const date = new Date(dateStr)
      const diff = Math.round((checkDate.getTime() - date.getTime()) / 86400000)
      
      if (diff <= 1) {
        streak++
        checkDate = date
      } else {
        break
      }
    }

    return streak
  }

  /**
   * 获取单词状态分布
   */
  async function getWordStatusDistribution(bookId?: number): Promise<{
    unlearned: number
    learning: number
    mastered: number
  }> {
    let records: LearningRecord[]
    if (bookId) {
      records = await db.learningRecords.where('bookId').equals(bookId).toArray()
    } else {
      records = await db.learningRecords.toArray()
    }

    return {
      unlearned: records.filter(r => r.status === 'unlearned').length,
      learning: records.filter(r => r.status === 'learning').length,
      mastered: records.filter(r => r.status === 'mastered').length
    }
  }

  /**
   * 获取正确率趋势
   */
  async function getAccuracyTrend(days: number = 7): Promise<Array<{ date: string; accuracy: number }>> {
    const stats = await getRecentStats(days)
    return stats.map(s => ({
      date: s.date,
      accuracy: s.reviewCount > 0 
        ? Math.round((s.correctCount / s.reviewCount) * 100) 
        : 0
    }))
  }

  /**
   * 导出数据为JSON
   */
  async function exportData(): Promise<string> {
    const data = {
      wordBooks: await db.wordBooks.toArray(),
      learningRecords: await db.learningRecords.toArray(),
      dailyStats: await db.dailyStats.toArray(),
      wordBookItems: await db.wordBookItems.toArray(),
      userSettings: await db.userSettings.toArray(),
      exportDate: new Date().toISOString()
    }
    return JSON.stringify(data, null, 2)
  }

  /**
   * 导入数据
   */
  async function importData(jsonStr: string): Promise<void> {
    const data = JSON.parse(jsonStr)
    
    if (data.wordBooks) {
      await db.wordBooks.clear()
      await db.wordBooks.bulkAdd(data.wordBooks)
    }
    if (data.learningRecords) {
      await db.learningRecords.clear()
      await db.learningRecords.bulkAdd(data.learningRecords)
    }
    if (data.dailyStats) {
      await db.dailyStats.clear()
      await db.dailyStats.bulkAdd(data.dailyStats)
    }
    if (data.wordBookItems) {
      await db.wordBookItems.clear()
      await db.wordBookItems.bulkAdd(data.wordBookItems)
    }
    if (data.userSettings) {
      await db.userSettings.clear()
      await db.userSettings.bulkAdd(data.userSettings)
    }
  }

  return {
    getTodayStats,
    getRecentStats,
    getSummaryStats,
    getWordStatusDistribution,
    getAccuracyTrend,
    exportData,
    importData
  }
}
