/**
 * 主题数据加载器
 * 负责加载主题词库数据
 */

import localforage from 'localforage'
import type { ThemeData } from './themeSelector'

const THEME_CACHE_VERSION = 1
const THEME_CACHE_KEY_PREFIX = 'theme_data_'

/**
 * 获取主题缓存键
 */
function getThemeCacheKey(grade: string): string {
  return `${THEME_CACHE_KEY_PREFIX}${grade}_v${THEME_CACHE_VERSION}`
}

/**
 * 从缓存加载主题数据
 */
async function loadThemeFromCache(grade: string): Promise<ThemeData | null> {
  try {
    const cached = await localforage.getItem<ThemeData>(getThemeCacheKey(grade))
    return cached
  } catch (err) {
    console.warn('主题缓存读取失败:', err)
    return null
  }
}

/**
 * 保存主题数据到缓存
 */
async function saveThemeToCache(grade: string, data: ThemeData): Promise<void> {
  try {
    await localforage.setItem(getThemeCacheKey(grade), data)
  } catch (err) {
    console.warn('主题缓存保存失败:', err)
  }
}

/**
 * 从网络加载主题数据
 */
async function loadThemeFromNetwork(grade: string): Promise<ThemeData> {
  const response = await fetch(`/data/themes/${grade}.json`)

  if (!response.ok) {
    throw new Error(`主题数据加载失败: ${response.status}`)
  }

  const data: ThemeData = await response.json()
  return data
}

/**
 * 加载主题数据（优先缓存）
 *
 * @param grade 等级（primary, junior）
 * @returns 主题数据，如果不支持主题模式则返回 null
 */
export async function loadThemeData(grade: string): Promise<ThemeData | null> {
  // 只有小学和初中支持主题模式
  if (grade !== 'primary' && grade !== 'junior') {
    console.log('[ThemeLoader] 等级不支持主题模式:', grade)
    return null
  }

  try {
    // 1. 尝试从缓存加载
    const cached = await loadThemeFromCache(grade)
    if (cached) {
      console.log('[ThemeLoader] 从缓存加载主题数据:', grade, cached.totalThemes, '个主题')
      return cached
    }

    // 2. 从网络加载
    console.log('[ThemeLoader] 从网络加载主题数据:', grade)
    const data = await loadThemeFromNetwork(grade)
    console.log('[ThemeLoader] 成功加载主题数据:', data.totalThemes, '个主题')

    // 3. 保存到缓存
    await saveThemeToCache(grade, data)

    return data
  } catch (err) {
    console.error('[ThemeLoader] 主题数据加载失败:', err)
    return null
  }
}

/**
 * 清除主题缓存
 */
export async function clearThemeCache(grade?: string): Promise<void> {
  try {
    if (grade) {
      await localforage.removeItem(getThemeCacheKey(grade))
    } else {
      // 清除所有主题缓存
      const grades = ['primary', 'junior']
      await Promise.all(
        grades.map((g) => localforage.removeItem(getThemeCacheKey(g)))
      )
    }
  } catch (err) {
    console.warn('主题缓存清除失败:', err)
  }
}
