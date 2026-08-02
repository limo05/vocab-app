<template>
  <div class="max-w-2xl mx-auto space-y-6">
    <!-- 头部信息 -->
    <div class="flex items-center justify-between">
      <router-link to="/" class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
        ← 返回
      </router-link>
      <div class="text-sm text-gray-500 dark:text-gray-400">
        {{ currentIndex + 1 }} / {{ words.length }}
      </div>
    </div>

    <!-- 进度条 -->
    <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
      <div class="bg-primary-500 h-2 rounded-full transition-all" :style="{ width: progress + '%' }"></div>
    </div>

    <!-- 闪卡区域 -->
    <div v-if="currentWord" class="flip-card w-full" style="min-height: 350px;" @click="isFlipped = !isFlipped">
      <div class="flip-card-inner w-full h-full" :class="{ flipped: isFlipped }" style="min-height: 350px;">
        <!-- 正面：单词 -->
        <div class="flip-card-front absolute inset-0 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center p-8">
          <div class="text-center">
            <h2 class="text-4xl font-bold mb-4">{{ currentWord.word }}</h2>
            
            <!-- 音标 -->
            <div v-if="currentWord.phoneticUk || currentWord.phoneticUs" class="text-gray-500 dark:text-gray-400 mb-4">
              <span v-if="currentWord.phoneticUk">英 {{ currentWord.phoneticUk }}</span>
              <span v-if="currentWord.phoneticUs" class="ml-3">美 {{ currentWord.phoneticUs }}</span>
            </div>

            <!-- 发音按钮 -->
            <div class="flex justify-center space-x-4 mb-6">
              <button @click.stop="playAudio('uk')" class="p-3 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 rounded-full transition-colors" title="英音">
                🔊
              </button>
              <button @click.stop="playAudio('us')" class="p-3 bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-900/50 rounded-full transition-colors" title="美音">
                🔊
              </button>
            </div>

            <p class="text-gray-400 dark:text-gray-500 text-sm">点击卡片翻转查看释义</p>
          </div>
        </div>

        <!-- 背面：释义 -->
        <div class="flip-card-back absolute inset-0 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center p-8 overflow-y-auto">
          <div class="text-center w-full">
            <h3 class="text-2xl font-bold mb-2">{{ currentWord.word }}</h3>
            <p class="text-lg text-primary-600 dark:text-primary-400 mb-4">{{ currentWord.translation }}</p>

            <!-- 助记 -->
            <div v-if="currentWord.mnemonic" class="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 mb-4 text-left">
              <p class="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-1">💡 助记</p>
              <p class="text-sm text-yellow-700 dark:text-yellow-300">{{ currentWord.mnemonic }}</p>
            </div>

            <!-- 例句 -->
            <div v-if="currentWord.sentence" class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 mb-4 text-left">
              <p class="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">📝 例句</p>
              <p class="text-sm text-blue-700 dark:text-blue-300">{{ currentWord.sentence }}</p>
            </div>

            <!-- 用户笔记 -->
            <div class="mt-4">
              <textarea 
                v-model="userNotes[currentWord.word]" 
                placeholder="添加你的助记笔记..."
                class="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                rows="2"
                @click.stop
              ></textarea>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 评级按钮 -->
    <div v-if="currentWord" class="grid grid-cols-3 gap-3">
      <button @click="rate('again')" class="py-3 px-4 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-400 rounded-xl font-medium transition-colors">
        😵 不认识
      </button>
      <button @click="rate('hard')" class="py-3 px-4 bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:hover:bg-yellow-900/50 text-yellow-700 dark:text-yellow-400 rounded-xl font-medium transition-colors">
        😐 模糊
      </button>
      <button @click="rate('good')" class="py-3 px-4 bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-900/50 text-green-700 dark:text-green-400 rounded-xl font-medium transition-colors">
        😊 认识
      </button>
    </div>

    <!-- 完成提示 -->
    <div v-if="!currentWord" class="text-center py-12">
      <div class="text-6xl mb-4">🎉</div>
      <h2 class="text-2xl font-bold mb-2">学习完成！</h2>
      <p class="text-gray-500 dark:text-gray-400 mb-6">本轮学习 {{ words.length }} 个单词</p>
      <div class="flex justify-center space-x-4">
        <router-link to="/" class="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors">
          返回首页
        </router-link>
        <button @click="restart" class="px-6 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg font-medium transition-colors">
          再来一轮
        </button>
      </div>
    </div>

    <!-- 快捷键提示 -->
    <div class="text-center text-xs text-gray-400 dark:text-gray-500">
      快捷键：空格翻转卡片 | ← 不认识 | → 认识 | P 播放发音
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, reactive, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useLearning } from '@/composables/useLearning'
import { useSettings } from '@/composables/useSettings'
import { useStudyTimer } from '@/composables/useStudyTimer'
import type { Word, ReviewGrade } from '@/types'

const route = useRoute()
const { getNewWords, startLearningWord, reviewWord, playPronunciation } = useLearning()
const { settings } = useSettings()
const { startTimer, stopTimer } = useStudyTimer()

const bookId = computed(() => Number(route.params.bookId))
const words = ref<Word[]>([])
const currentIndex = ref(0)
const isFlipped = ref(false)
const userNotes = reactive<Record<string, string>>({})
const recordIds = ref<number[]>([])

const currentWord = computed(() => words.value[currentIndex.value] || null)
const progress = computed(() => words.value.length > 0 ? ((currentIndex.value) / words.value.length) * 100 : 0)

async function playAudio(accent: 'uk' | 'us'): Promise<void> {
  if (currentWord.value) {
    await playPronunciation(currentWord.value.word, accent)
  }
}

async function rate(grade: 'again' | 'hard' | 'good'): Promise<void> {
  if (!currentWord.value) return

  const wordIndex = currentIndex.value
  const word = currentWord.value

  // 获取或创建学习记录
  const { db } = await import('@/db')
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

  if (record?.id) {
    await reviewWord(record.id, grade as ReviewGrade)
  }

  // 如果不认识，加入生词本
  if (grade === 'again') {
    const { addToWordBook } = useLearning()
    await addToWordBook(wordIndex + 1, bookId.value, 'dictation')
  }

  // 下一个单词
  currentIndex.value++
  isFlipped.value = false
}

function restart(): void {
  currentIndex.value = 0
  isFlipped.value = false
  loadWords()
}

async function loadWords(): Promise<void> {
  const newWords = await getNewWords(bookId.value, settings.value.dailyNewWords)
  words.value = newWords
}

// 监听卡片变化，自动发音
watch(currentIndex, async () => {
  if (settings.value.autoPronunciation.flashcard && currentWord.value) {
    await playPronunciation(currentWord.value.word)
  }
})

// 键盘快捷键
function handleKeydown(e: KeyboardEvent): void {
  if (e.code === 'Space') {
    e.preventDefault()
    isFlipped.value = !isFlipped.value
  } else if (e.code === 'ArrowLeft') {
    rate('again')
  } else if (e.code === 'ArrowRight') {
    rate('good')
  } else if (e.code === 'KeyP') {
    playAudio(settings.value.pronunciation)
  }
}

onMounted(async () => {
  await loadWords()
  startTimer() // 开始计时
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(async () => {
  window.removeEventListener('keydown', handleKeydown)
  await stopTimer() // 停止计时并保存
})
</script>
