<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors">
    <!-- 顶部导航栏 -->
    <nav class="sticky top-0 z-50 bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-14">
          <!-- Logo -->
          <div class="flex items-center">
            <router-link to="/" class="flex items-center space-x-2">
              <span class="text-xl">📚</span>
              <span class="text-lg font-bold text-primary-600 dark:text-primary-400">背单词</span>
            </router-link>
          </div>

          <!-- 桌面端导航 -->
          <div class="hidden md:flex items-center space-x-1">
            <router-link 
              v-for="item in navItems" 
              :key="item.path" 
              :to="item.path"
              class="px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              :class="$route.path === item.path 
                ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300' 
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'"
            >
              {{ item.icon }} {{ item.label }}
            </router-link>
          </div>

          <!-- 主题切换按钮 -->
          <div class="flex items-center space-x-2">
            <button 
              @click="toggleTheme"
              class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              :title="settings.theme === 'light' ? '切换到暗色模式' : '切换到亮色模式'"
            >
              {{ settings.theme === 'light' ? '🌙' : '☀️' }}
            </button>
            
            <!-- 移动端菜单按钮 -->
            <button 
              @click="mobileMenuOpen = !mobileMenuOpen"
              class="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              ☰
            </button>
          </div>
        </div>
      </div>

      <!-- 移动端导航菜单 -->
      <div v-if="mobileMenuOpen" class="md:hidden border-t border-gray-200 dark:border-gray-700">
        <div class="px-2 py-2 space-y-1">
          <router-link 
            v-for="item in navItems" 
            :key="item.path" 
            :to="item.path"
            @click="mobileMenuOpen = false"
            class="block px-3 py-2 rounded-lg text-base font-medium transition-colors"
            :class="$route.path === item.path 
              ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300' 
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'"
          >
            {{ item.icon }} {{ item.label }}
          </router-link>
        </div>
      </div>
    </nav>

    <!-- 主内容区 -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useSettings } from '@/composables/useSettings'
import { useLearning } from '@/composables/useLearning'

const { settings, toggleTheme, loadSettings } = useSettings()
const { initWordBooks } = useLearning()

const mobileMenuOpen = ref(false)

const navItems = [
  { path: '/', label: '首页', icon: '🏠' },
  { path: '/library', label: '词库', icon: '📖' },
  { path: '/review', label: '复习', icon: '🔄' },
  { path: '/wordbook', label: '生词本', icon: '📝' },
  { path: '/stats', label: '统计', icon: '📊' },
  { path: '/settings', label: '设置', icon: '⚙️' }
]

onMounted(async () => {
  await loadSettings()
  await initWordBooks()
})
</script>
