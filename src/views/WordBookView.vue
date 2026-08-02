<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold">📝 生词本</h1>
      <span class="text-sm text-gray-500 dark:text-gray-400">共 {{ wordBookItems.length }} 个生词</span>
    </div>

    <!-- 空状态 -->
    <div v-if="wordBookItems.length === 0" class="text-center py-16">
      <div class="text-6xl mb-4">📭</div>
      <h2 class="text-xl font-semibold mb-2">生词本是空的</h2>
      <p class="text-gray-500 dark:text-gray-400">默写错误的单词会自动加入生词本</p>
    </div>

    <!-- 生词列表 -->
    <div v-else class="space-y-3">
      <div 
        v-for="item in wordBookItems" 
        :key="item.item.id"
        class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700"
      >
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="flex items-center space-x-3 mb-1">
              <h3 class="text-lg font-bold">{{ item.word.word }}</h3>
              <span class="px-2 py-0.5 text-xs rounded-full" :class="item.item.source === 'dictation' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'">
                {{ item.item.source === 'dictation' ? '默写错误' : '手动添加' }}
              </span>
            </div>
            <p class="text-gray-600 dark:text-gray-400 text-sm">{{ item.word.translation }}</p>
            <p v-if="item.word.phoneticUk" class="text-gray-400 dark:text-gray-500 text-xs mt-1">{{ item.word.phoneticUk }}</p>
          </div>
          <div class="flex items-center space-x-2">
            <button @click="playAudio(item.word.word)" class="p-2 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 rounded-full transition-colors" title="播放发音">
              🔊
            </button>
            <button @click="removeWord(item)" class="p-2 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full transition-colors" title="移出生词本">
              ✕
            </button>
          </div>
        </div>

        <!-- 助记 -->
        <div v-if="item.word.mnemonic" class="mt-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-2">
          <p class="text-xs text-yellow-700 dark:text-yellow-300">💡 {{ item.word.mnemonic }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useLearning } from '@/composables/useLearning'
import { playPronunciation } from '@/services/pronunciation'

const { getWordBookItems, removeFromWordBook } = useLearning()

const wordBookItems = ref<Array<{ word: any; item: any }>>([])

async function playAudio(word: string): Promise<void> {
  await playPronunciation(word)
}

async function removeWord(item: { word: any; item: any }): Promise<void> {
  await removeFromWordBook(item.item.wordId, item.item.bookId)
  wordBookItems.value = await getWordBookItems()
}

onMounted(async () => {
  wordBookItems.value = await getWordBookItems()
})
</script>
