import { getSettings } from '@/db'
import { fetchWordFromAPI } from './dictionary'

/**
 * 发音服务
 * 多层降级策略：有道音频 → FreeDictionary音频 → Web Speech TTS
 */

// 当前播放的Audio实例
let currentAudio: HTMLAudioElement | null = null
// 播放锁：防止并发请求导致多个音频同时播放
let isPlaying = false

/**
 * 播放单词发音（主入口）
 * @param word 单词
 * @param accent 口音：uk(英音) / us(美音)
 */
export async function playPronunciation(word: string, accent?: 'uk' | 'us'): Promise<void> {
  // 停止当前播放并重置状态
  stop()
  
  // 等待一小段时间确保stop完成
  await new Promise(resolve => setTimeout(resolve, 50))
  
  // 设置播放锁
  isPlaying = true

  try {
    const settings = await getSettings()
    const accentType = accent || settings.pronunciation || 'uk'
    const networkEnabled = settings.networkEnabled

    // 第一层：尝试有道音频
    if (networkEnabled && isPlaying) {
      const youdaoSuccess = await tryYoudaoAudio(word, accentType)
      if (youdaoSuccess) return
    }

    // 第二层：尝试FreeDictionary音频
    if (networkEnabled && isPlaying) {
      const fdSuccess = await tryFreeDictionaryAudio(word, accentType)
      if (fdSuccess) return
    }

    // 第三层：使用浏览器TTS
    if (isPlaying) {
      tryWebSpeechTTS(word, accentType, settings.speechRate)
    }
  } finally {
    // 不立即重置锁，等音频播放完毕
  }
}

/**
 * 第一层：有道发音接口
 */
async function tryYoudaoAudio(word: string, accent: 'uk' | 'us'): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const type = accent === 'uk' ? '1' : '2'
      const url = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(word)}&type=${type}`
      
      const audio = new Audio(url)
      currentAudio = audio
      
      // 设置超时
      const timeout = setTimeout(() => {
        if (currentAudio === audio) {
          audio.pause()
          currentAudio = null
        }
        resolve(false)
      }, 5000)

      audio.oncanplaythrough = () => {
        clearTimeout(timeout)
        // 确保还是当前音频（没有被stop清除）
        if (currentAudio === audio && isPlaying) {
          audio.play().then(() => {
            // 播放结束后清理
            audio.onended = () => {
              if (currentAudio === audio) {
                currentAudio = null
                isPlaying = false
              }
            }
            resolve(true)
          }).catch(() => {
            clearTimeout(timeout)
            if (currentAudio === audio) {
              currentAudio = null
            }
            resolve(false)
          })
        } else {
          clearTimeout(timeout)
          resolve(false)
        }
      }

      audio.onerror = () => {
        clearTimeout(timeout)
        if (currentAudio === audio) {
          currentAudio = null
        }
        resolve(false)
      }

      // 预加载
      audio.load()
    } catch (error) {
      if (currentAudio) {
        currentAudio = null
      }
      resolve(false)
    }
  })
}

/**
 * 第二层：FreeDictionary音频
 */
async function tryFreeDictionaryAudio(word: string, accent: 'uk' | 'us'): Promise<boolean> {
  try {
    const data = await fetchWordFromAPI(word)
    if (!data?.audio) return false

    const audioUrl = accent === 'uk' ? data.audio.uk : data.audio.us
    if (!audioUrl) return false

    return new Promise((resolve) => {
      try {
        const audio = new Audio(audioUrl)
        currentAudio = audio

        const timeout = setTimeout(() => {
          if (currentAudio === audio) {
            audio.pause()
            currentAudio = null
          }
          resolve(false)
        }, 5000)

        audio.oncanplaythrough = () => {
          clearTimeout(timeout)
          if (currentAudio === audio && isPlaying) {
            audio.play().then(() => {
              audio.onended = () => {
                if (currentAudio === audio) {
                  currentAudio = null
                  isPlaying = false
                }
              }
              resolve(true)
            }).catch(() => {
              clearTimeout(timeout)
              if (currentAudio === audio) {
                currentAudio = null
              }
              resolve(false)
            })
          } else {
            clearTimeout(timeout)
            resolve(false)
          }
        }

        audio.onerror = () => {
          clearTimeout(timeout)
          if (currentAudio === audio) {
            currentAudio = null
          }
          resolve(false)
        }

        audio.load()
      } catch (error) {
        if (currentAudio) {
          currentAudio = null
        }
        resolve(false)
      }
    })
  } catch (error) {
    return false
  }
}

/**
 * 第三层：浏览器Web Speech TTS
 */
function tryWebSpeechTTS(word: string, accent: 'uk' | 'us', rate: number = 1.0): void {
  if (!('speechSynthesis' in window)) {
    console.warn('浏览器不支持语音合成')
    isPlaying = false
    return
  }

  try {
    const utterance = new SpeechSynthesisUtterance(word)
    utterance.lang = accent === 'uk' ? 'en-GB' : 'en-US'
    utterance.rate = rate || 1.0
    utterance.pitch = 1.0
    utterance.volume = 1.0

    // 尝试选择合适的语音
    const voices = speechSynthesis.getVoices()
    const targetVoice = voices.find(v => 
      v.lang.startsWith(accent === 'uk' ? 'en-GB' : 'en-US')
    )
    if (targetVoice) {
      utterance.voice = targetVoice
    }

    utterance.onend = () => {
      isPlaying = false
    }
    utterance.onerror = () => {
      isPlaying = false
    }

    speechSynthesis.speak(utterance)
  } catch (error) {
    console.error('TTS播放失败:', error)
    isPlaying = false
  }
}

/**
 * 停止当前播放
 */
export function stop(): void {
  isPlaying = false
  if (currentAudio) {
    currentAudio.pause()
    currentAudio.currentTime = 0
    currentAudio.onended = null
    currentAudio = null
  }
  if ('speechSynthesis' in window) {
    speechSynthesis.cancel()
  }
}

/**
 * 获取可用的语音列表
 */
export function getAvailableVoices(): SpeechSynthesisVoice[] {
  if (!('speechSynthesis' in window)) return []
  return speechSynthesis.getVoices().filter(v => v.lang.startsWith('en'))
}

/**
 * 朗读文本（用于例句朗读）
 */
export function speakText(text: string, rate: number = 1.0): void {
  if (!('speechSynthesis' in window)) return
  
  speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'en-US'
  utterance.rate = rate
  speechSynthesis.speak(utterance)
}
