<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold">📊 学习统计</h1>
      <div class="flex space-x-2">
        <button @click="handleExport" class="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg text-sm transition-colors">
          📤 导出
        </button>
        <label class="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg text-sm transition-colors cursor-pointer">
          📥 导入
          <input type="file" accept=".json" @change="handleImport" class="hidden" />
        </label>
      </div>
    </div>

    <!-- 今日数据 -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
        <div class="text-2xl font-bold text-primary-600 dark:text-primary-400">{{ todayStats.newWords }}</div>
        <div class="text-sm text-gray-500 dark:text-gray-400">今日新词</div>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
        <div class="text-2xl font-bold text-green-600 dark:text-green-400">{{ todayStats.reviewCount }}</div>
        <div class="text-sm text-gray-500 dark:text-gray-400">复习数量</div>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
        <div class="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{{ todayAccuracy }}%</div>
        <div class="text-sm text-gray-500 dark:text-gray-400">正确率</div>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
        <div class="text-2xl font-bold text-purple-600 dark:text-purple-400">{{ formatTime(todayStats.studyTime) }}</div>
        <div class="text-sm text-gray-500 dark:text-gray-400">学习时长</div>
      </div>
    </div>

    <!-- 汇总面板 -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
        <div class="text-2xl font-bold">{{ summary.masteredWords }}</div>
        <div class="text-sm text-gray-500 dark:text-gray-400">已掌握</div>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
        <div class="text-2xl font-bold">{{ summary.learnedWords }}</div>
        <div class="text-sm text-gray-500 dark:text-gray-400">学习中</div>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
        <div class="text-2xl font-bold">{{ summary.wordBookCount }}</div>
        <div class="text-sm text-gray-500 dark:text-gray-400">生词总数</div>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
        <div class="text-2xl font-bold text-orange-600 dark:text-orange-400">{{ summary.streakDays }}</div>
        <div class="text-sm text-gray-500 dark:text-gray-400">连续打卡</div>
      </div>
    </div>

    <!-- 趋势图表 -->
    <div class="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
      <div class="flex items-center justify-between mb-4">
        <h3 class="font-semibold">学习趋势</h3>
        <div class="flex space-x-2">
          <button @click="trendDays = 7; renderTrendChart()" :class="trendDays === 7 ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-gray-700'" class="px-3 py-1 rounded text-sm transition-colors">7天</button>
          <button @click="trendDays = 30; renderTrendChart()" :class="trendDays === 30 ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-gray-700'" class="px-3 py-1 rounded text-sm transition-colors">30天</button>
        </div>
      </div>
      <div ref="trendChartRef" class="w-full h-64"></div>
    </div>

    <!-- 正确率趋势 -->
    <div class="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
      <h3 class="font-semibold mb-4">正确率变化</h3>
      <div ref="accuracyChartRef" class="w-full h-48"></div>
    </div>

    <!-- 单词状态分布饼图 -->
    <div class="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
      <h3 class="font-semibold mb-4">单词状态分布</h3>
      <div ref="pieChartRef" class="w-full h-64"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import { useStats } from '@/composables/useStats'
import type { DailyStats } from '@/types'

const { getTodayStats, getRecentStats, getSummaryStats, getWordStatusDistribution, getAccuracyTrend, exportData: doExport, importData: doImport } = useStats()

const todayStats = ref<DailyStats>({ date: '', newWords: 0, reviewCount: 0, correctCount: 0, wrongCount: 0, studyTime: 0, createdAt: 0 })
const summary = ref({ totalWords: 0, learnedWords: 0, masteredWords: 0, wordBookCount: 0, streakDays: 0, totalStudyTime: 0 })
const trendDays = ref(7)

const trendChartRef = ref<HTMLElement | null>(null)
const accuracyChartRef = ref<HTMLElement | null>(null)
const pieChartRef = ref<HTMLElement | null>(null)

let trendChart: echarts.ECharts | null = null
let accuracyChart: echarts.ECharts | null = null
let pieChart: echarts.ECharts | null = null

const todayAccuracy = computed(() => {
  if (todayStats.value.reviewCount === 0) return 0
  return Math.round((todayStats.value.correctCount / todayStats.value.reviewCount) * 100)
})

function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  return `${hours}h${minutes % 60}m`
}

async function renderTrendChart(): Promise<void> {
  const stats = await getRecentStats(trendDays.value)
  if (!trendChartRef.value) return

  if (!trendChart) {
    trendChart = echarts.init(trendChartRef.value)
  }

  trendChart.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: ['新词', '复习'] },
    xAxis: { type: 'category', data: stats.map(s => s.date.slice(5)) },
    yAxis: { type: 'value' },
    series: [
      { name: '新词', type: 'bar', data: stats.map(s => s.newWords), itemStyle: { color: '#0ea5e9' } },
      { name: '复习', type: 'bar', data: stats.map(s => s.reviewCount), itemStyle: { color: '#22c55e' } }
    ]
  })
}

async function renderAccuracyChart(): Promise<void> {
  const trend = await getAccuracyTrend(trendDays.value)
  if (!accuracyChartRef.value) return

  if (!accuracyChart) {
    accuracyChart = echarts.init(accuracyChartRef.value)
  }

  accuracyChart.setOption({
    tooltip: { trigger: 'axis', formatter: '{b}: {c}%' },
    xAxis: { type: 'category', data: trend.map(t => t.date.slice(5)) },
    yAxis: { type: 'value', max: 100, axisLabel: { formatter: '{value}%' } },
    series: [{
      type: 'line',
      data: trend.map(t => t.accuracy),
      smooth: true,
      areaStyle: { color: 'rgba(14, 165, 233, 0.1)' },
      itemStyle: { color: '#0ea5e9' }
    }]
  })
}

async function renderPieChart(): Promise<void> {
  const dist = await getWordStatusDistribution()
  if (!pieChartRef.value) return

  if (!pieChart) {
    pieChart = echarts.init(pieChartRef.value)
  }

  pieChart.setOption({
    tooltip: { trigger: 'item' },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      data: [
        { value: dist.unlearned, name: '未学习', itemStyle: { color: '#94a3b8' } },
        { value: dist.learning, name: '学习中', itemStyle: { color: '#0ea5e9' } },
        { value: dist.mastered, name: '已掌握', itemStyle: { color: '#22c55e' } }
      ],
      label: { formatter: '{b}: {c}' }
    }]
  })
}

async function handleExport(): Promise<void> {
  const data = await doExport()
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `vocab-backup-${new Date().toISOString().split('T')[0]}.json`
  a.click()
  URL.revokeObjectURL(url)
}

async function handleImport(event: Event): Promise<void> {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = async (e) => {
    const content = e.target?.result as string
    try {
      await doImport(content)
      alert('数据导入成功！')
      location.reload()
    } catch (error) {
      alert('导入失败，请检查文件格式')
    }
  }
  reader.readAsText(file)
}

onMounted(async () => {
  todayStats.value = await getTodayStats()
  summary.value = await getSummaryStats()

  await nextTick()
  await renderTrendChart()
  await renderAccuracyChart()
  await renderPieChart()

  window.addEventListener('resize', () => {
    trendChart?.resize()
    accuracyChart?.resize()
    pieChart?.resize()
  })
})
</script>
