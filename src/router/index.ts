import { createRouter, createWebHistory, createWebHashHistory } from 'vue-router'

// GitHub Pages 使用 hash 模式，本地开发使用 history 模式
const isGitHubPages = import.meta.env.VITE_GITHUB_PAGES === 'true'

const router = createRouter({
  history: isGitHubPages ? createWebHashHistory() : createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomeView.vue')
    },
    {
      path: '/library',
      name: 'library',
      component: () => import('@/views/LibraryView.vue')
    },
    {
      path: '/flashcard/:bookId',
      name: 'flashcard',
      component: () => import('@/views/FlashCardView.vue'),
      props: true
    },
    {
      path: '/dictation/:bookId',
      name: 'dictation',
      component: () => import('@/views/DictationView.vue'),
      props: true
    },
    {
      path: '/review',
      name: 'review',
      component: () => import('@/views/ReviewView.vue')
    },
    {
      path: '/wordbook',
      name: 'wordbook',
      component: () => import('@/views/WordBookView.vue')
    },
    {
      path: '/stats',
      name: 'stats',
      component: () => import('@/views/StatsView.vue')
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('@/views/SettingsView.vue')
    }
  ]
})

export default router
