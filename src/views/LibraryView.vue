<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <h1 class="text-2xl font-bold">词库管理</h1>
      <button @click="showImportModal = true" class="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-medium transition-colors">
        📥 导入词库
      </button>
    </div>

    <!-- 词库列表 -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div v-for="book in wordBooks" :key="book.id" class="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
        <div class="flex justify-between items-start mb-3">
          <div>
            <h3 class="font-semibold text-lg">{{ book.name }}</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">{{ book.description }}</p>
          </div>
          <span class="px-2 py-1 text-xs rounded-full" :class="book.isBuiltIn ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'">
            {{ book.isBuiltIn ? '内置' : '自定义' }}
          </span>
        </div>

        <div class="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
          <span>📚 {{ book.wordCount }} 词</span>
          <span>📅 {{ formatDate(book.createdAt) }}</span>
        </div>

        <!-- 搜索单词 -->
        <div class="mb-3">
          <input 
            v-model="searchTerms[book.id!]" 
            type="text" 
            placeholder="搜索单词..."
            class="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            @input="filterWords(book.id!)"
          />
        </div>

        <!-- 单词预览 -->
        <div class="max-h-40 overflow-y-auto space-y-1 mb-4">
          <div v-for="word in getFilteredWords(book.id!)" :key="word.word" class="flex justify-between items-center py-1 px-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700">
            <span class="text-sm font-medium">{{ word.word }}</span>
            <span class="text-xs text-gray-500 dark:text-gray-400 truncate ml-2 max-w-[200px]">{{ word.translation }}</span>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="flex space-x-2">
          <button @click="exportBook(book)" class="flex-1 py-2 px-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg text-sm font-medium transition-colors">
            📤 导出
          </button>
          <button v-if="!book.isBuiltIn" @click="deleteBook(book.id!)" class="flex-1 py-2 px-3 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-400 rounded-lg text-sm font-medium transition-colors">
            🗑️ 删除
          </button>
        </div>
      </div>
    </div>

    <!-- 导入弹窗 -->
    <div v-if="showImportModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-lg w-full">
        <h2 class="text-xl font-bold mb-4">导入词库</h2>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-1">词库名称</label>
            <input v-model="importName" type="text" placeholder="输入词库名称" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">选择文件 (.json / .txt / .csv)</label>
            <input type="file" accept=".json,.txt,.csv" @change="handleFileSelect" class="w-full text-sm" />
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              JSON格式：包含word、translation等字段的数组<br>
              TXT格式：每行一个单词和释义，用"|"分隔<br>
              CSV格式：第一列为单词，第二列为释义
            </p>
          </div>

          <div v-if="importPreview.length > 0" class="max-h-40 overflow-y-auto bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
            <p class="text-sm text-gray-500 dark:text-gray-400 mb-2">预览 ({{ importPreview.length }} 词)</p>
            <div v-for="w in importPreview.slice(0, 5)" :key="w.word" class="text-sm">
              <span class="font-medium">{{ w.word }}</span> - {{ w.translation }}
            </div>
            <p v-if="importPreview.length > 5" class="text-xs text-gray-400 mt-1">... 还有 {{ importPreview.length - 5 }} 个单词</p>
          </div>
        </div>

        <div class="flex justify-end space-x-3 mt-6">
          <button @click="showImportModal = false" class="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            取消
          </button>
          <button @click="confirmImport" :disabled="importPreview.length === 0 || !importName" class="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors disabled:opacity-50">
            确认导入
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useLearning } from '@/composables/useLearning'
import type { WordBook, Word } from '@/types'

const { getWordBooks, getWordsByBookId, importWordBook, deleteWordBook } = useLearning()

const wordBooks = ref<WordBook[]>([])
const showImportModal = ref(false)
const importName = ref('')
const importPreview = ref<Word[]>([])
const searchTerms = reactive<Record<number, string>>({})
const filteredWordsMap = reactive<Record<number, Word[]>>({})

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString()
}

function getFilteredWords(bookId: number): Word[] {
  return filteredWordsMap[bookId] || []
}

async function filterWords(bookId: number): Promise<void> {
  const term = (searchTerms[bookId] || '').toLowerCase()
  const allWords = await getWordsByBookId(bookId)
  if (!term) {
    filteredWordsMap[bookId] = allWords.slice(0, 20)
  } else {
    filteredWordsMap[bookId] = allWords
      .filter(w => w.word.toLowerCase().includes(term) || w.translation.includes(term))
      .slice(0, 20)
  }
}

async function exportBook(book: WordBook): Promise<void> {
  const data = JSON.stringify(book.words, null, 2)
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${book.name}.json`
  a.click()
  URL.revokeObjectURL(url)
}

function handleFileSelect(event: Event): void {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    const content = e.target?.result as string
    try {
      let words: Word[] = []
      
      if (file.name.endsWith('.json')) {
        words = JSON.parse(content)
      } else if (file.name.endsWith('.txt')) {
        words = content.split('\n').filter(line => line.trim()).map(line => {
          const [word, ...rest] = line.split('|')
          return {
            word: word.trim(),
            phoneticUk: '',
            phoneticUs: '',
            translation: rest.join('|').trim(),
            mnemonic: '',
            sentence: '',
            audioUk: '',
            audioUs: ''
          }
        })
      } else if (file.name.endsWith('.csv')) {
        words = content.split('\n').filter(line => line.trim()).slice(1).map(line => {
          const parts = line.split(',')
          return {
            word: (parts[0] || '').trim(),
            phoneticUk: '',
            phoneticUs: '',
            translation: (parts[1] || '').trim(),
            mnemonic: '',
            sentence: '',
            audioUk: '',
            audioUs: ''
          }
        })
      }

      importPreview.value = words.filter(w => w.word)
    } catch (error) {
      alert('文件解析失败，请检查格式')
    }
  }
  reader.readAsText(file)
}

async function confirmImport(): Promise<void> {
  if (importPreview.value.length === 0 || !importName.value) return
  
  await importWordBook(importName.value, importPreview.value)
  showImportModal.value = false
  importName.value = ''
  importPreview.value = []
  
  // 刷新列表
  wordBooks.value = await getWordBooks()
}

async function handleDeleteBook(bookId: number): Promise<void> {
  if (confirm('确定要删除这个词库吗？相关学习记录也会被删除。')) {
    await deleteWordBook(bookId)
    wordBooks.value = await getWordBooks()
  }
}

const deleteBook = handleDeleteBook

onMounted(async () => {
  wordBooks.value = await getWordBooks()
  // 加载每个词库的预览单词
  for (const book of wordBooks.value) {
    if (book.id) {
      await filterWords(book.id)
    }
  }
})
</script>
