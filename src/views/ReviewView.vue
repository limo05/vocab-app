<template>
  <div class="max-w-2xl mx-auto space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold">复习单词</h1>
      <router-link to="/" class="text-gray-500 hover:text-gray-700 dark:text-gray-400">← 返回</router-link>
    </div>

    <!-- 选择词库 -->
    <div v-if="!selectedBookId" class="space-y-4">
      <p class="text-gray-500 dark:text-gray-400">选择要复习的词库：</p>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button 
          v-for="book in wordBooks" 
          :key="book.id"
          @click="selectBook(book.id!)"
          class="p-5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-primary-500 transition-colors text-left"
        >
          <h3 class="font-semibold mb-1">{{ book.name }}</h3>
          <p class="text-sm text-gray-500 dark:text-gray-400">待复习: {{ getDueCount(book.id!) }} 词</p>
        </button>
      </div>

      <!-- 全部复习 -->
      <button 
        @click="reviewAll"
        class="w-full p-5 bg-primary-50 dark:bg-primary-900/20 rounded-xl border border-primary-200 dark:border-primary-800 hover:border-primary-500 transition-colors text-left"
      >
        <h3 class="font-semibold text-primary-700 dark:text-primary-300 mb-1">📋 全部复习</h3>
        <p class="text-sm text-primary-500 dark:text-primary-400">复习所有词库中到期的单词 ({{ totalDueCount }} 词)</p>
      </button>
    </div>

    <!-- 复习进行中 -->
    <div v-else-if="currentItem" class="space-y-6">
      <!-- 进度 -->
      <div class="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
        <span>{{ currentIndex + 1 }} / {{ reviewItems.length }}</span>
        <button @click="selectedBookId = 0" class="text-primary-500 hover:text-primary-600">退出复习</button>
      </div>
      <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div class="bg-yellow-500 h-2 rounded-full transition-all" :style="{ width: ((currentIndex / reviewItems.length) * 100) + '%' }"></div>
      </div>

      <!-- 单词卡片 -->
      <div class="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm border border-gray-200 dark:border-gray-700">
        <div class="text-center">
          <h2 class="text-3xl font-bold mb-3">{{ currentItem.word.word }}</h2>
          
          <div v-if="currentItem.word.phoneticUk" class="text-gray-500 dark:text-gray-400 mb-4">
            {{ currentItem.word.phoneticUk }}
          </div>

          <button @click="playAudio(currentItem.word.word)" class="p-2 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 rounded-full transition-colors mb-4">
            🔊
          </button>

          <!-- 显示释义 -->
          <div v-if="showAnswer" class="mt-4 space-y-3">
            <p class="text-xl text-primary-600 dark:text-primary-400 font-medium">{{ currentItem.word.translation }}</p>
            
            <div v-if="currentItem.word.mnemonic" class="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3">
              <p class="text-sm text-yellow-700 dark:text-yellow-300">💡 {{ currentItem.word.mnemonic }}</p>
            </div>

            <div v-if="currentItem.word.sentence" class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
              <p class="text-sm text-blue-700 dark:text-blue-300">📝 {{ currentItem.word.sentence }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div v-if="!showAnswer" class="text-center">
        <button @click="showAnswer = true" class="px-8 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium transition-colors">
          显示答案
        </button>
      </div>
      <div v-else class="grid grid-cols-3 gap-3">
        <button @click="rate('again')" class="py-3 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-400 rounded-xl font-medium transition-colors">
          😵 不认识
        </button>
        <button @click="rate('hard')" class="py-3 bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:hover:bg-yellow-900/50 text-yellow-700 dark:text-yellow-400 rounded-xl font-medium transition-colors">
          😐 模糊
        </button>
        <button @click="rate('good')" class="py-3 bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-900/50 text-green-700 dark:text-green-400 rounded-xl font-medium transition-colors">
          😊 认识
        </button>
      </div>
    </div>

    <!-- 完成 -->
    <div v-else class="text-center py-12">
      <div class="text-6xl mb-4">🎉</div>
      <h2 class="text-2xl font-bold mb-2">复习完成！</h2>
      <p class="text-gray-500 dark:text-gray-400 mb-6">本轮复习了 {{ reviewItems.length }} 个单词</p>
      <router-link to="/" class="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors">
        返回首页
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useLearning } from '@/composables/useLearning'
import { playPronunciation } from '@/services/pronunciation'
import { useStudyTimer } from '@/composables/useStudyTimer'
import { useSettings } from '@/composables/useSettings'
import type { WordBook, ReviewGrade } from '@/types'

const { getWordBooks, getDueReviewWords, reviewWord } = useLearning()
const { startTimer, stopTimer } = useStudyTimer()
const { settings } = useSettings()

function playAudio(word: string): void {
  playPronunciation(word)
}

const wordBooks = ref<WordBook[]>([])
const selectedBookId = ref(0)
const reviewItems = ref<Array<{ word: any; record: any }>>([])
const currentIndex = ref(0)
const showAnswer = ref(false)
const dueCountMap = ref<Map<number, number>>(new Map())

const currentItem = computed(() => reviewItems.value[currentIndex.value] || null)
const totalDueCount = computed(() => {
  let total = 0
  dueCountMap.value.forEach(count => total += count)
  return total
})

function getDueCount(bookId: number): number {
  return dueCountMap.value.get(bookId) || 0
}

async function selectBook(bookId: number): Promise<void> {
  selectedBookId.value = bookId
  const items = await getDueReviewWords(bookId)
  reviewItems.value = items
  currentIndex.value = 0
  showAnswer.value = false
  startTimer() // 开始复习计时
  // 自动发音
  if (settings.value.autoPronunciation.review && items.length > 0) {
    await playPronunciation(items[0].word.word)
  }
}

async function reviewAll(): Promise<void> {
  selectedBookId.value = -1
  let allItems: Array<{ word: any; record: any }> = []
  for (const book of wordBooks.value) {
    const items = await getDueReviewWords(book.id!)
    allItems = allItems.concat(items)
  }
  reviewItems.value = allItems
  currentIndex.value = 0
  showAnswer.value = false
  startTimer() // 开始复习计时
  // 自动发音
  if (settings.value.autoPronunciation.review && allItems.length > 0) {
    await playPronunciation(allItems[0].word.word)
  }
}

async function rate(grade: ReviewGrade): Promise<void> {
  if (!currentItem.value) return
  await reviewWord(currentItem.value.record.id, grade)
  currentIndex.value++
  showAnswer.value = false
}

// 监听题目变化，自动发音
watch(currentIndex, async () => {
  if (settings.value.autoPronunciation.review && currentItem.value) {
    await playPronunciation(currentItem.value.word.word)
  }
})

onMounted(async () => {
  wordBooks.value = await getWordBooks()
  for (const book of wordBooks.value) {
    const items = await getDueReviewWords(book.id!)
    dueCountMap.value.set(book.id!, items.length)
  }
})

onUnmounted(async () => {
  await stopTimer() // 停止计时并保存
})
</script>
