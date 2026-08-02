import { ref, onMounted, onUnmounted } from 'vue'
import { db } from '@/db'

/**
 * 学习时长追踪composable
 * 在页面激活时自动计时，离开页面时保存
 */

const isTracking = ref(false)
const startTime = ref(0)
const accumulatedSeconds = ref(0)
let timerInterval: ReturnType<typeof setInterval> | null = null

export function useStudyTimer() {
  /**
   * 开始计时
   */
  function startTimer(): void {
    if (isTracking.value) return
    isTracking.value = true
    startTime.value = Date.now()
    
    // 每秒更新累计时间
    timerInterval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime.value) / 1000)
      accumulatedSeconds.value = elapsed
    }, 1000)
  }

  /**
   * 停止计时并保存
   */
  async function stopTimer(): Promise<void> {
    if (!isTracking.value) return
    isTracking.value = false
    
    if (timerInterval) {
      clearInterval(timerInterval)
      timerInterval = null
    }

    const elapsed = Math.floor((Date.now() - startTime.value) / 1000)
    if (elapsed > 0) {
      await saveStudyTime(elapsed)
    }
    accumulatedSeconds.value = 0
  }

  /**
   * 保存学习时长到数据库
   */
  async function saveStudyTime(seconds: number): Promise<void> {
    const today = new Date().toISOString().split('T')[0]
    let stats = await db.dailyStats.where('date').equals(today).first()

    if (!stats) {
      await db.dailyStats.add({
        date: today,
        newWords: 0,
        reviewCount: 0,
        correctCount: 0,
        wrongCount: 0,
        studyTime: seconds,
        createdAt: Date.now()
      })
    } else if (stats.id) {
      await db.dailyStats.update(stats.id, {
        studyTime: (stats.studyTime || 0) + seconds
      })
    }
  }

  /**
   * 获取当前累计秒数
   */
  function getElapsedSeconds(): number {
    return accumulatedSeconds.value
  }

  return {
    isTracking,
    accumulatedSeconds,
    startTimer,
    stopTimer,
    saveStudyTime,
    getElapsedSeconds
  }
}
