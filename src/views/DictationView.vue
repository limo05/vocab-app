<template>
  <div class="max-w-2xl mx-auto space-y-6">
    <!-- 头部 -->
    <div class="flex items-center justify-between">
      <router-link to="/" class="text-gray-500 hover:text-gray-700 dark:text-gray-400">← 返回</router-link>
      <div class="text-sm text-gray-500 dark:text-gray-400">{{ currentIndex + 1 }} / {{ words.length }}</div>
    </div>

    <!-- 模式选择 -->
    <div v-if="!modeSelected" class="text-center py-12">
      <h2 class="text-2xl font-bold mb-6">选择默写模式</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg mx-auto">
        <button @click="selectMode('zh2en')" class="p-6 bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-primary-500 transition-colors">
          <div class="text-3xl mb-2">🇨🇳 → 🇬🇧</div>
          <h3 class="font-semibold mb-1">汉译英</h3>
          <p class="text-sm text-gray-500 dark:text-gray-400">看中文写英文</p>
        </button>
        <button @click="selectMode('en2zh')" class="p-6 bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-primary-500 transition-colors">
          <div class="text-3xl mb-2">🇬🇧 → 🇨🇳</div>
          <h3 class="font-semibold mb-1">英译汉</h3>
          <p class="text-sm text-gray-500 dark:text-gray-400">看英文写中文释义</p>
        </button>
      </div>
    </div>

    <!-- 默写区域 -->
    <div v-else-if="currentWord" class="space-y-6">
      <!-- 进度条 -->
      <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div class="bg-green-500 h-2 rounded-full transition-all" :style="{ width: progress + '%' }"></div>
      </div>

      <!-- 题目区域 -->
      <div class="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm border border-gray-200 dark:border-gray-700 text-center">
        <!-- 汉译英模式 -->
        <template v-if="dictationMode === 'zh2en'">
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-2">请写出对应的英文单词</p>
          <h2 class="text-2xl font-bold mb-4">{{ currentWord.translation }}</h2>
          <button @click="playAudio" class="p-2 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 rounded-full transition-colors mb-4">
            🔊 播放发音
          </button>
          <div class="flex justify-center space-x-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
            <span v-if="settings.dictationHints.phonetic">📢 {{ currentWord.phoneticUk || '无音标' }}</span>
            <span v-if="settings.dictationHints.firstLetter">💡 首字母: {{ currentWord.word[0]?.toUpperCase() }}</span>
          </div>
        </template>

        <!-- 英译汉模式 -->
        <template v-else>
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-2">请写出对应的中文释义</p>
          <h2 class="text-3xl font-bold mb-4">{{ currentWord.word }}</h2>
          <button @click="playAudio" class="p-2 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 rounded-full transition-colors mb-4">
            🔊 播放发音
          </button>
          <p v-if="settings.dictationHints.firstLetter" class="text-sm text-gray-500 dark:text-gray-400">
            💡 提示: {{ currentWord.translation[0] }}...
          </p>
        </template>
      </div>

      <!-- 输入区域 -->
      <div class="space-y-3">
        <input 
          ref="inputRef"
          v-model="userInput"
          type="text"
          :placeholder="dictationMode === 'zh2en' ? '输入英文单词...' : '输入中文释义...'"
          class="w-full px-4 py-3 text-lg border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          @keyup.enter="handleEnter"
          :disabled="showResult"
        />

        <!-- 结果反馈 -->
        <div v-if="showResult" class="rounded-xl p-4" :class="isCorrect ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'">
          <div class="flex items-center space-x-2 mb-2">
            <span class="text-xl">{{ isCorrect ? '✅' : '❌' }}</span>
            <span class="font-semibold" :class="isCorrect ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'">
              {{ isCorrect ? '回答正确！' : '回答错误' }}
            </span>
          </div>
          <div v-if="!isCorrect" class="text-sm">
            <p class="text-gray-600 dark:text-gray-400">
              正确答案：<span class="font-bold text-gray-900 dark:text-gray-100">
                {{ dictationMode === 'zh2en' ? currentWord.word : currentWord.translation }}
              </span>
            </p>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="flex space-x-3">
          <button v-if="!showResult" @click="submitAnswer" class="flex-1 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium transition-colors">
            提交答案 (Enter)
          </button>
          <button v-else @click="nextWord" class="flex-1 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium transition-colors">
            下一个 (Enter) →
          </button>
        </div>
      </div>

      <!-- 统计 -->
      <div class="flex justify-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
        <span>✅ 正确: {{ correctCount }}</span>
        <span>❌ 错误: {{ wrongCount }}</span>
        <span>📊 正确率: {{ accuracy }}%</span>
      </div>
    </div>

    <!-- 完成 -->
    <div v-else class="text-center py-12">
      <div class="text-6xl mb-4">🎉</div>
      <h2 class="text-2xl font-bold mb-2">默写完成！</h2>
      <p class="text-gray-500 dark:text-gray-400 mb-2">共 {{ words.length }} 个单词</p>
      <p class="text-lg mb-6">
        正确率: <span class="font-bold text-primary-600 dark:text-primary-400">{{ accuracy }}%</span>
      </p>
      <div class="flex justify-center space-x-4">
        <router-link to="/" class="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors">
          返回首页
        </router-link>
        <button @click="restart" class="px-6 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg font-medium transition-colors">
          再来一轮
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useLearning } from '@/composables/useLearning'
import { useSettings } from '@/composables/useSettings'
import { useStudyTimer } from '@/composables/useStudyTimer'
import type { Word } from '@/types'
import { db } from '@/db'

const route = useRoute()
const { getNewWords, startLearningWord, playPronunciation, addToWordBook, reviewWord } = useLearning()
const { settings } = useSettings()
const { startTimer, stopTimer } = useStudyTimer()

const bookId = computed(() => Number(route.params.bookId))
const words = ref<Word[]>([])
const currentIndex = ref(0)
const userInput = ref('')
const showResult = ref(false)
const isCorrect = ref(false)
const correctCount = ref(0)
const wrongCount = ref(0)
const modeSelected = ref(false)
const dictationMode = ref<'zh2en' | 'en2zh'>('zh2en')
const inputRef = ref<HTMLInputElement | null>(null)

const currentWord = computed(() => words.value[currentIndex.value] || null)
const progress = computed(() => words.value.length > 0 ? (currentIndex.value / words.value.length) * 100 : 0)
const accuracy = computed(() => {
  const total = correctCount.value + wrongCount.value
  return total > 0 ? Math.round((correctCount.value / total) * 100) : 0
})

function selectMode(mode: 'zh2en' | 'en2zh'): void {
  dictationMode.value = mode
  modeSelected.value = true
  loadWords()
  startTimer() // 开始计时
}

// 监听题目变化，自动发音
watch(currentIndex, async () => {
  if (settings.value.autoPronunciation.dictation && currentWord.value) {
    await nextTick()
    await playPronunciation(currentWord.value.word)
  }
})

async function playAudio(): Promise<void> {
  if (currentWord.value) {
    await playPronunciation(currentWord.value.word)
  }
}

function checkAnswer(): boolean {
  if (!currentWord.value) return false
  const input = userInput.value.trim().toLowerCase()
  if (dictationMode.value === 'zh2en') {
    return input === currentWord.value.word.toLowerCase()
  } else {
    const translation = currentWord.value.translation.toLowerCase()
    return translation.includes(input) || input.includes(translation.split('；')[0].split(';')[0])
  }
}

async function submitAnswer(): Promise<void> {
  if (!userInput.value.trim() || !currentWord.value) return

  isCorrect.value = checkAnswer()
  showResult.value = true

  const wordIndex = currentIndex.value

  // 确保有学习记录
  let record = await db.learningRecords
    .where('wordId').equals(wordIndex + 1)
    .and(r => r.bookId === bookId.value)
    .first()

  if (!record) {
    await startLearningWord(wordIndex + 1, bookId.value)
    record = await db.learningRecords
      .where('wordId').equals(wordIndex + 1)
      .and(r => r.bookId === bookId.value)
      .first()
  }

  if (isCorrect.value) {
    correctCount.value++
    if (record?.id) {
      await reviewWord(record.id, 'good')
    }
  } else {
    wrongCount.value++
    await addToWordBook(wordIndex + 1, bookId.value, 'dictation')
  }

  await nextTick()
  inputRef.value?.focus()
}

// Enter键处理：未提交时提交答案，已提交时下一个
function handleEnter(): void {
  if (showResult.value) {
    nextWord()
  } else {
    submitAnswer()
  }
}

function nextWord(): void {
  currentIndex.value++
  userInput.value = ''
  showResult.value = false
  isCorrect.value = false
  nextTick(() => {
    inputRef.value?.focus()
  })
}

function restart(): void {
  currentIndex.value = 0
  userInput.value = ''
  showResult.value = false
  correctCount.value = 0
  wrongCount.value = 0
  modeSelected.value = false
  loadWords()
}

async function loadWords(): Promise<void> {
  words.value = await getNewWords(bookId.value, settings.value.dailyNewWords)
  nextTick(() => {
    inputRef.value?.focus()
  })
}

onMounted(() => {
  // 全局监听Enter键，当结果显示时按Enter进入下一个
  window.addEventListener('keydown', handleGlobalKeydown)
})

function handleGlobalKeydown(e: KeyboardEvent): void {
  if (e.key === 'Enter' && showResult.value && modeSelected.value && currentWord.value) {
    e.preventDefault()
    nextWord()
  }
}

onUnmounted(async () => {
  window.removeEventListener('keydown', handleGlobalKeydown)
  await stopTimer() // 停止计时并保存
})
</script>
