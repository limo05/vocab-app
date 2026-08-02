<template>
  <div class="space-y-6">
    <!-- 今日概览 -->
    <div class="bg-gradient-to-r from-primary-500 to-primary-700 rounded-2xl p-6 text-white">
      <h1 class="text-2xl font-bold mb-2">今日学习</h1>
      <p class="text-primary-100">{{ todayDate }}</p>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <div class="bg-white/20 rounded-xl p-4 cursor-pointer hover:bg-white/30 transition-colors" @click="showNewWordsModal = true">
          <div class="text-3xl font-bold">{{ todayStats.newWords }}</div>
          <div class="text-sm text-primary-100">新学单词</div>
          <div class="text-xs text-primary-200 mt-1">点击查看</div>
        </div>
        <div class="bg-white/20 rounded-xl p-4 cursor-pointer hover:bg-white/30 transition-colors" @click="showReviewWordsModal = true">
          <div class="text-3xl font-bold">{{ todayStats.reviewCount }}</div>
          <div class="text-sm text-primary-100">复习单词</div>
          <div class="text-xs text-primary-200 mt-1">点击查看</div>
        </div>
        <div class="bg-white/20 rounded-xl p-4">
          <div class="text-3xl font-bold">{{ accuracy }}%</div>
          <div class="text-sm text-primary-100">正确率</div>
        </div>
        <div class="bg-white/20 rounded-xl p-4">
          <div class="text-3xl font-bold">{{ formatTime(todayStats.studyTime) }}</div>
          <div class="text-sm text-primary-100">学习时长</div>
        </div>
      </div>
    </div>

    <!-- 快速操作 -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <!-- 选择词库学习 -->
      <div v-for="book in wordBooks" :key="book.id" class="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
        <div class="flex justify-between items-start mb-3">
          <div>
            <h3 class="font-semibold text-lg">{{ book.name }}</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">{{ book.wordCount }} 词</p>
          </div>
          <span class="px-2 py-1 text-xs rounded-full" :class="book.isBuiltIn ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'">
            {{ book.isBuiltIn ? '内置' : '自定义' }}
          </span>
        </div>
        
        <!-- 学习进度 -->
        <div class="mb-4">
          <div class="flex justify-between text-sm text-gray-500 dark:text-gray-400 mb-1">
            <span>学习进度</span>
            <span>{{ getProgress(book.id!) }}%</span>
          </div>
          <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div class="bg-primary-500 h-2 rounded-full transition-all" :style="{ width: getProgress(book.id!) + '%' }"></div>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="flex space-x-2">
          <router-link 
            :to="`/flashcard/${book.id}`"
            class="flex-1 text-center py-2 px-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            📇 闪卡
          </router-link>
          <router-link 
            :to="`/dictation/${book.id}`"
            class="flex-1 text-center py-2 px-3 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            ✍️ 默写
          </router-link>
        </div>
      </div>

      <!-- 添加词库卡片 -->
      <router-link 
        to="/library"
        class="flex items-center justify-center bg-gray-50 dark:bg-gray-800/50 rounded-xl p-5 border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-primary-400 transition-colors min-h-[200px]"
      >
        <div class="text-center text-gray-400">
          <div class="text-4xl mb-2">+</div>
          <div class="text-sm">管理词库</div>
        </div>
      </router-link>
    </div>

    <!-- 待复习提醒 -->
    <div v-if="dueReviewCount > 0" class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-5">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <span class="text-2xl">⏰</span>
          <div>
            <h3 class="font-semibold text-yellow-800 dark:text-yellow-200">有 {{ dueReviewCount }} 个单词需要复习</h3>
            <p class="text-sm text-yellow-600 dark:text-yellow-400">及时复习有助于长期记忆</p>
          </div>
        </div>
        <router-link 
          to="/review"
          class="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg text-sm font-medium transition-colors"
        >
          开始复习
        </router-link>
      </div>
    </div>

    <!-- 连续打卡 -->
    <div class="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <span class="text-2xl">🔥</span>
          <div>
            <h3 class="font-semibold">连续打卡 {{ streakDays }} 天</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">坚持就是胜利！</p>
          </div>
        </div>
        <router-link to="/stats" class="text-primary-500 hover:text-primary-600 text-sm">
          查看详情 →
        </router-link>
      </div>
    </div>

    <!-- 新学单词弹窗 -->
    <div v-if="showNewWordsModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" @click.self="showNewWordsModal = false">
      <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-hidden flex flex-col">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-bold">今日新学单词</h2>
          <button @click="showNewWordsModal = false" class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">✕</button>
        </div>
        <div class="overflow-y-auto flex-1 space-y-2">
          <div v-if="newWordsList.length === 0" class="text-center py-8 text-gray-500 dark:text-gray-400">
            今日暂无新学单词
          </div>
          <div v-for="word in newWordsList" :key="word.word" class="flex justify-between items-center py-2 px-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <span class="font-medium">{{ word.word }}</span>
            <span class="text-sm text-gray-500 dark:text-gray-400 truncate ml-2 max-w-[200px]">{{ word.translation }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 复习单词弹窗 -->
    <div v-if="showReviewWordsModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" @click.self="showReviewWordsModal = false">
      <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-hidden flex flex-col">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-bold">今日复习单词</h2>
          <button @click="showReviewWordsModal = false" class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">✕</button>
        </div>
        <div class="overflow-y-auto flex-1 space-y-2">
          <div v-if="reviewWordsList.length === 0" class="text-center py-8 text-gray-500 dark:text-gray-400">
            今日暂无复习单词
          </div>
          <div v-for="word in reviewWordsList" :key="word.word" class="flex justify-between items-center py-2 px-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <span class="font-medium">{{ word.word }}</span>
            <span class="text-sm text-gray-500 dark:text-gray-400 truncate ml-2 max-w-[200px]">{{ word.translation }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useLearning } from '@/composables/useLearning'
import { useStats } from '@/composables/useStats'
import type { WordBook, DailyStats } from '@/types'
import { db } from '@/db'

const { getWordBooks, getDueReviewWords } = useLearning()
const { getTodayStats, getSummaryStats } = useStats()

const wordBooks = ref<WordBook[]>([])
const todayStats = ref<DailyStats>({ date: '', newWords: 0, reviewCount: 0, correctCount: 0, wrongCount: 0, studyTime: 0, createdAt: 0 })
const dueReviewCount = ref(0)
const streakDays = ref(0)
const progressMap = ref<Map<number, number>>(new Map())

// 弹窗状态
const showNewWordsModal = ref(false)
const showReviewWordsModal = ref(false)
const newWordsList = ref<Array<{ word: string; translation: string }>>([])
const reviewWordsList = ref<Array<{ word: string; translation: string }>>([])

const todayDate = computed(() => {
  const now = new Date()
  return `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`
})

const accuracy = computed(() => {
  if (todayStats.value.reviewCount === 0) return 0
  return Math.round((todayStats.value.correctCount / todayStats.value.reviewCount) * 100)
})

function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  const remainMinutes = minutes % 60
  return `${hours}h${remainMinutes}m`
}

function getProgress(bookId: number): number {
  return progressMap.value.get(bookId) || 0
}

async function loadProgress(bookId: number, totalWords: number): Promise<void> {
  const records = await db.learningRecords.where('bookId').equals(bookId).toArray()
  const learned = records.filter(r => r.status !== 'unlearned').length
  const percent = totalWords > 0 ? Math.round((learned / totalWords) * 100) : 0
  progressMap.value.set(bookId, percent)
}

// 加载今日新学单词列表
async function loadNewWordsList(): Promise<void> {
  const todayStart = new Date(new Date().toISOString().split('T')[0]).getTime()
  const allRecords = await db.learningRecords.toArray()
  const records = allRecords.filter(r => r.createdAt >= todayStart)
  
  const result: Array<{ word: string; translation: string }> = []
  for (const record of records) {
    const book = await db.wordBooks.get(record.bookId)
    if (book) {
      const w = book.words[record.wordId - 1]
      if (w) {
        result.push({ word: w.word, translation: w.translation })
      }
    }
  }
  newWordsList.value = result
}

// 加载今日复习单词列表
async function loadReviewWordsList(): Promise<void> {
  const todayStart = new Date(new Date().toISOString().split('T')[0]).getTime()
  const allRecords = await db.learningRecords.toArray()
  const records = allRecords.filter(r => r.updatedAt >= todayStart && r.status !== 'unlearned')
  
  const result: Array<{ word: string; translation: string }> = []
  const seen = new Set<string>()
  for (const record of records) {
    const book = await db.wordBooks.get(record.bookId)
    if (book) {
      const w = book.words[record.wordId - 1]
      if (w && !seen.has(w.word)) {
        seen.add(w.word)
        result.push({ word: w.word, translation: w.translation })
      }
    }
  }
  reviewWordsList.value = result
}

// 监听弹窗打开，加载数据
watch(showNewWordsModal, (val) => {
  if (val) loadNewWordsList()
})
watch(showReviewWordsModal, (val) => {
  if (val) loadReviewWordsList()
})

onMounted(async () => {
  wordBooks.value = await getWordBooks()
  todayStats.value = await getTodayStats()
  
  const summary = await getSummaryStats()
  streakDays.value = summary.streakDays

  // 计算各词库进度
  for (const book of wordBooks.value) {
    if (book.id) {
      await loadProgress(book.id, book.wordCount)
    }
  }

  // 计算待复习数量
  for (const book of wordBooks.value) {
    const dueWords = await getDueReviewWords(book.id!)
    dueReviewCount.value += dueWords.length
  }
})
</script>
