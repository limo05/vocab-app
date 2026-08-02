<template>
  <div class="max-w-2xl mx-auto space-y-6">
    <h1 class="text-2xl font-bold">⚙️ 设置</h1>

    <!-- 外观设置 -->
    <div class="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
      <h3 class="font-semibold mb-4">🎨 外观</h3>
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="font-medium">主题模式</p>
            <p class="text-sm text-gray-500 dark:text-gray-400">切换亮色/暗色主题</p>
          </div>
          <button @click="toggleTheme" class="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-colors">
            {{ settings.theme === 'light' ? '🌙 暗色模式' : '☀️ 亮色模式' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 学习设置 -->
    <div class="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
      <h3 class="font-semibold mb-4">📚 学习</h3>
      <div class="space-y-4">
        <div>
          <div class="flex items-center justify-between mb-2">
            <div>
              <p class="font-medium">每日新词数量</p>
              <p class="text-sm text-gray-500 dark:text-gray-400">每天学习的新单词上限</p>
            </div>
            <span class="text-lg font-bold text-primary-600 dark:text-primary-400">{{ settings.dailyNewWords }}</span>
          </div>
          <input 
            type="range" 
            min="5" 
            max="100" 
            step="5" 
            :value="settings.dailyNewWords"
            @input="setDailyNewWords(Number(($event.target as HTMLInputElement).value))"
            class="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
          />
          <div class="flex justify-between text-xs text-gray-400 mt-1">
            <span>5</span>
            <span>50</span>
            <span>100</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 发音设置 -->
    <div class="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
      <h3 class="font-semibold mb-4">🔊 发音</h3>
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="font-medium">默认发音</p>
            <p class="text-sm text-gray-500 dark:text-gray-400">选择英音或美音</p>
          </div>
          <div class="flex space-x-2">
            <button @click="setPronunciation('uk')" :class="settings.pronunciation === 'uk' ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-gray-700'" class="px-4 py-2 rounded-lg text-sm transition-colors">
              🇬🇧 英音
            </button>
            <button @click="setPronunciation('us')" :class="settings.pronunciation === 'us' ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-gray-700'" class="px-4 py-2 rounded-lg text-sm transition-colors">
              🇺🇸 美音
            </button>
          </div>
        </div>

        <div>
          <div class="flex items-center justify-between mb-2">
            <div>
              <p class="font-medium">语速调节</p>
              <p class="text-sm text-gray-500 dark:text-gray-400">TTS朗读速度</p>
            </div>
            <span class="text-sm text-gray-500 dark:text-gray-400">{{ settings.speechRate.toFixed(1) }}x</span>
          </div>
          <input 
            type="range" 
            min="0.5" 
            max="2.0" 
            step="0.1" 
            :value="settings.speechRate"
            @input="setSpeechRate(Number(($event.target as HTMLInputElement).value))"
            class="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
          />
        </div>
      </div>
    </div>

    <!-- 自动发音设置 -->
    <div class="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
      <h3 class="font-semibold mb-4">🔔 自动发音</h3>
      <div class="space-y-3">
        <label class="flex items-center justify-between cursor-pointer">
          <div>
            <p class="font-medium">闪卡模式自动发音</p>
            <p class="text-sm text-gray-500 dark:text-gray-400">翻卡时自动播放单词发音</p>
          </div>
          <input 
            type="checkbox" 
            :checked="settings.autoPronunciation.flashcard"
            @change="setAutoPronunciation({ flashcard: ($event.target as HTMLInputElement).checked })"
            class="w-5 h-5 text-primary-500 rounded focus:ring-primary-500"
          />
        </label>
        <label class="flex items-center justify-between cursor-pointer">
          <div>
            <p class="font-medium">默写模式自动发音</p>
            <p class="text-sm text-gray-500 dark:text-gray-400">出题时自动播放单词发音</p>
          </div>
          <input 
            type="checkbox" 
            :checked="settings.autoPronunciation.dictation"
            @change="setAutoPronunciation({ dictation: ($event.target as HTMLInputElement).checked })"
            class="w-5 h-5 text-primary-500 rounded focus:ring-primary-500"
          />
        </label>
        <label class="flex items-center justify-between cursor-pointer">
          <div>
            <p class="font-medium">复习模式自动发音</p>
            <p class="text-sm text-gray-500 dark:text-gray-400">复习时自动播放单词发音</p>
          </div>
          <input 
            type="checkbox" 
            :checked="settings.autoPronunciation.review"
            @change="setAutoPronunciation({ review: ($event.target as HTMLInputElement).checked })"
            class="w-5 h-5 text-primary-500 rounded focus:ring-primary-500"
          />
        </label>
      </div>
    </div>

    <!-- 默写设置 -->
    <div class="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
      <h3 class="font-semibold mb-4">✍️ 默写</h3>
      <div class="space-y-3">
        <label class="flex items-center justify-between cursor-pointer">
          <div>
            <p class="font-medium">音标提示</p>
            <p class="text-sm text-gray-500 dark:text-gray-400">默写时显示音标</p>
          </div>
          <input 
            type="checkbox" 
            :checked="settings.dictationHints.phonetic"
            @change="setDictationHints({ phonetic: ($event.target as HTMLInputElement).checked })"
            class="w-5 h-5 text-primary-500 rounded focus:ring-primary-500"
          />
        </label>
        <label class="flex items-center justify-between cursor-pointer">
          <div>
            <p class="font-medium">首字母提示</p>
            <p class="text-sm text-gray-500 dark:text-gray-400">默写时显示首字母</p>
          </div>
          <input 
            type="checkbox" 
            :checked="settings.dictationHints.firstLetter"
            @change="setDictationHints({ firstLetter: ($event.target as HTMLInputElement).checked })"
            class="w-5 h-5 text-primary-500 rounded focus:ring-primary-500"
          />
        </label>
      </div>
    </div>

    <!-- 网络设置 -->
    <div class="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
      <h3 class="font-semibold mb-4">🌐 网络</h3>
      <div class="space-y-3">
        <label class="flex items-center justify-between cursor-pointer">
          <div>
            <p class="font-medium">联网增强</p>
            <p class="text-sm text-gray-500 dark:text-gray-400">开启后将调用在线API补充音标、发音、例句等信息</p>
          </div>
          <input 
            type="checkbox" 
            :checked="settings.networkEnabled"
            @change="toggleNetwork"
            class="w-5 h-5 text-primary-500 rounded focus:ring-primary-500"
          />
        </label>
        <div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-xs text-gray-500 dark:text-gray-400">
          <p>📌 联网增强使用的公共API：</p>
          <p class="mt-1">• Free Dictionary API (音标、释义、例句)</p>
          <p>• 有道发音接口 (英/美真人发音)</p>
          <p>• 浏览器Web Speech TTS (兜底发音)</p>
          <p class="mt-1">关闭后仍可正常使用内置词库和本地功能。</p>
        </div>
      </div>
    </div>

    <!-- 数据管理 -->
    <div class="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
      <h3 class="font-semibold mb-4">💾 数据</h3>
      <div class="space-y-3">
        <button @click="clearApiCache" class="w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg text-sm transition-colors text-left">
          🗑️ 清除API缓存
        </button>
        <button @click="resetAllData" class="w-full py-2 px-4 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-400 rounded-lg text-sm transition-colors text-left">
          ⚠️ 重置所有数据（不可恢复）
        </button>
      </div>
    </div>

    <!-- 快捷键说明 -->
    <div class="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
      <h3 class="font-semibold mb-4">⌨️ 快捷键</h3>
      <div class="space-y-2 text-sm">
        <div class="flex justify-between">
          <span class="text-gray-600 dark:text-gray-400">翻转卡片</span>
          <kbd class="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">Space</kbd>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-600 dark:text-gray-400">不认识</span>
          <kbd class="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">←</kbd>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-600 dark:text-gray-400">认识</span>
          <kbd class="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">→</kbd>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-600 dark:text-gray-400">播放发音</span>
          <kbd class="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">P</kbd>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-600 dark:text-gray-400">提交答案</span>
          <kbd class="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">Enter</kbd>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useSettings } from '@/composables/useSettings'
import { db } from '@/db'

const { settings, toggleTheme, toggleNetwork, setDailyNewWords, setPronunciation, setSpeechRate, setDictationHints, setAutoPronunciation } = useSettings()

async function clearApiCache(): Promise<void> {
  if (confirm('确定要清除所有API缓存吗？')) {
    await db.apiCache.clear()
    alert('API缓存已清除')
  }
}

async function resetAllData(): Promise<void> {
  if (confirm('⚠️ 确定要重置所有数据吗？此操作不可恢复！')) {
    if (confirm('再次确认：这将删除所有词库、学习记录、统计数据。')) {
      await db.wordBooks.clear()
      await db.words.clear()
      await db.learningRecords.clear()
      await db.dailyStats.clear()
      await db.wordBookItems.clear()
      await db.apiCache.clear()
      await db.learningSessions.clear()
      alert('数据已重置，页面将刷新')
      location.reload()
    }
  }
}
</script>
