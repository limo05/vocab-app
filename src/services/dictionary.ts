import { db } from '@/db'
import type { ApiCache } from '@/types'

/**
 * 词典API服务
 * 调用免费公开API获取单词详细信息
 */

// API缓存有效期：7天
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000

// 请求节流：记录最近请求时间
const requestTimestamps: Map<string, number> = new Map()
const MIN_REQUEST_INTERVAL = 1000 // 最小请求间隔1秒

/**
 * 检查网络是否可用
 */
export function isNetworkAvailable(): boolean {
  return navigator.onLine
}

/**
 * 获取缓存的单词信息
 */
async function getCachedWord(word: string): Promise<any | null> {
  const cache = await db.apiCache.where('word').equals(word.toLowerCase()).first()
  if (cache && cache.expireAt > Date.now()) {
    return cache.data
  }
  // 清除过期缓存
  if (cache?.id) {
    await db.apiCache.delete(cache.id)
  }
  return null
}

/**
 * 缓存单词信息
 */
async function cacheWord(word: string, data: any): Promise<void> {
  const now = Date.now()
  // 先清除旧缓存
  await db.apiCache.where('word').equals(word.toLowerCase()).delete()
  // 添加新缓存
  await db.apiCache.add({
    word: word.toLowerCase(),
    data,
    expireAt: now + CACHE_DURATION,
    createdAt: now
  })
}

/**
 * 请求节流检查
 */
function throttleCheck(word: string): boolean {
  const lastRequest = requestTimestamps.get(word) || 0
  const now = Date.now()
  if (now - lastRequest < MIN_REQUEST_INTERVAL) {
    return false // 需要等待
  }
  requestTimestamps.set(word, now)
  return true
}

/**
 * 从Free Dictionary API获取单词信息
 */
export async function fetchWordFromAPI(word: string): Promise<any | null> {
  // 先检查缓存
  const cached = await getCachedWord(word)
  if (cached) return cached

  // 检查网络
  if (!isNetworkAvailable()) {
    console.warn('网络不可用，无法获取单词信息')
    return null
  }

  // 请求节流
  if (!throttleCheck(word)) {
    console.warn('请求过于频繁，请稍后再试')
    return null
  }

  try {
    const response = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`
    )
    
    if (!response.ok) {
      console.warn(`API返回错误: ${response.status}`)
      return null
    }

    const data = await response.json()
    
    // 解析API返回数据
    const parsed = parseDictionaryResponse(data)
    
    // 缓存结果
    await cacheWord(word, parsed)
    
    return parsed
  } catch (error) {
    console.error('获取单词信息失败:', error)
    return null
  }
}

/**
 * 解析Free Dictionary API响应
 */
function parseDictionaryResponse(data: any[]): any {
  if (!data || data.length === 0) return null

  const entry = data[0]
  const result: any = {
    word: entry.word || '',
    phonetics: { uk: '', us: '' },
    meanings: [],
    audio: { uk: '', us: '' }
  }

  // 提取音标
  if (entry.phonetics) {
    for (const p of entry.phonetics) {
      if (p.text) {
        if (!result.phonetics.uk) result.phonetics.uk = p.text
        if (!result.phonetics.us) result.phonetics.us = p.text
      }
      if (p.audio) {
        if (!result.audio.uk) result.audio.uk = p.audio
      }
    }
  }

  // 提取释义
  if (entry.meanings) {
    result.meanings = entry.meanings.map((m: any) => ({
      partOfSpeech: m.partOfSpeech,
      definitions: m.definitions?.slice(0, 3).map((d: any) => ({
        definition: d.definition,
        example: d.example || ''
      }))
    }))
  }

  return result
}

/**
 * 清除单词缓存
 */
export async function clearWordCache(word?: string): Promise<void> {
  if (word) {
    await db.apiCache.where('word').equals(word.toLowerCase()).delete()
  } else {
    await db.apiCache.clear()
  }
}

/**
 * 批量预缓存单词（用于离线准备）
 */
export async function batchCacheWords(words: Array<{ word: string; data: any }>): Promise<void> {
  const now = Date.now()
  for (const item of words) {
    try {
      await db.apiCache.where('word').equals(item.word.toLowerCase()).delete()
      await db.apiCache.add({
        word: item.word.toLowerCase(),
        data: item.data,
        expireAt: now + CACHE_DURATION,
        createdAt: now
      })
    } catch (e) {
      console.warn(`缓存单词失败: ${item.word}`, e)
    }
  }
}
