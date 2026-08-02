import { ref, watch, onMounted } from 'vue'
import { db, getSettings, updateSettings } from '@/db'
import type { UserSettings } from '@/types'

/**
 * 设置管理composable
 */

const settings = ref<UserSettings>({
  theme: 'light',
  networkEnabled: true,
  dailyNewWords: 20,
  pronunciation: 'uk',
  dictationHints: {
    phonetic: true,
    firstLetter: false
  },
  speechRate: 1.0,
  autoPronunciation: {
    flashcard: true,
    dictation: true,
    review: true
  }
})

const isLoaded = ref(false)

export function useSettings() {
  /**
   * 加载设置
   */
  async function loadSettings(): Promise<void> {
    const s = await getSettings()
    // 确保 autoPronunciation 字段存在（兼容旧数据）
    if (!s.autoPronunciation) {
      s.autoPronunciation = { flashcard: true, dictation: true, review: true }
      await updateSettings({ autoPronunciation: s.autoPronunciation })
    }
    settings.value = { ...s }
    isLoaded.value = true
    applyTheme(s.theme)
  }

  /**
   * 更新设置
   */
  async function saveSettings(updates: Partial<UserSettings>): Promise<void> {
    await updateSettings(updates)
    settings.value = { ...settings.value, ...updates }
    
    // 如果更新了主题，应用主题
    if (updates.theme) {
      applyTheme(updates.theme)
    }
  }

  /**
   * 应用主题
   */
  function applyTheme(theme: 'light' | 'dark'): void {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  /**
   * 切换主题
   */
  async function toggleTheme(): Promise<void> {
    const newTheme = settings.value.theme === 'light' ? 'dark' : 'light'
    await saveSettings({ theme: newTheme })
  }

  /**
   * 切换联网状态
   */
  async function toggleNetwork(): Promise<void> {
    await saveSettings({ networkEnabled: !settings.value.networkEnabled })
  }

  /**
   * 更新每日新词数量
   */
  async function setDailyNewWords(count: number): Promise<void> {
    await saveSettings({ dailyNewWords: count })
  }

  /**
   * 更新发音设置
   */
  async function setPronunciation(accent: 'uk' | 'us'): Promise<void> {
    await saveSettings({ pronunciation: accent })
  }

  /**
   * 更新语速
   */
  async function setSpeechRate(rate: number): Promise<void> {
    await saveSettings({ speechRate: rate })
  }

  /**
   * 更新默写提示设置
   */
  async function setDictationHints(hints: Partial<UserSettings['dictationHints']>): Promise<void> {
    await saveSettings({ 
      dictationHints: { ...settings.value.dictationHints, ...hints } 
    })
  }

  /**
   * 更新自动发音设置
   */
  async function setAutoPronunciation(autoPron: Partial<UserSettings['autoPronunciation']>): Promise<void> {
    await saveSettings({ 
      autoPronunciation: { ...settings.value.autoPronunciation, ...autoPron } 
    })
  }

  return {
    settings,
    isLoaded,
    loadSettings,
    saveSettings,
    toggleTheme,
    toggleNetwork,
    setDailyNewWords,
    setPronunciation,
    setSpeechRate,
    setDictationHints,
    setAutoPronunciation,
    applyTheme
  }
}
