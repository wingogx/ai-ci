import localforage from 'localforage'
import type { UserData } from '@/types'
import { DEFAULT_USER_DATA } from '@/types'

// 用户数据存储实例
const userStore = localforage.createInstance({
  name: 'wordduck',
  storeName: 'user',
})

// 词库缓存存储实例
const wordStore = localforage.createInstance({
  name: 'wordduck',
  storeName: 'words',
})

const USER_DATA_KEY = 'userData'

/**
 * 存储工具类
 */
export const storage = {
  /**
   * 获取用户数据
   */
  async getUserData(): Promise<UserData> {
    try {
      const data = await userStore.getItem<UserData>(USER_DATA_KEY)
      if (data) {
        // 合并默认值，处理数据结构升级
        return { ...DEFAULT_USER_DATA, ...data }
      }
      return { ...DEFAULT_USER_DATA }
    } catch (error) {
      console.error('获取用户数据失败:', error)
      return { ...DEFAULT_USER_DATA }
    }
  },

  /**
   * 保存用户数据
   */
  async saveUserData(data: UserData): Promise<boolean> {
    try {
      await userStore.setItem(USER_DATA_KEY, data)
      return true
    } catch (error) {
      console.error('保存用户数据失败:', error)
      return false
    }
  },

  /**
   * 更新用户数据（部分更新）
   */
  async updateUserData(updates: Partial<UserData>): Promise<boolean> {
    try {
      const current = await this.getUserData()
      const updated = { ...current, ...updates }
      return await this.saveUserData(updated)
    } catch (error) {
      console.error('更新用户数据失败:', error)
      return false
    }
  },

  /**
   * 清除用户数据
   */
  async clearUserData(): Promise<boolean> {
    try {
      await userStore.removeItem(USER_DATA_KEY)
      return true
    } catch (error) {
      console.error('清除用户数据失败:', error)
      return false
    }
  },

  /**
   * 获取词库缓存
   */
  async getWordCache<T>(key: string): Promise<T | null> {
    try {
      return await wordStore.getItem<T>(key)
    } catch (error) {
      console.error('获取词库缓存失败:', error)
      return null
    }
  },

  /**
   * 设置词库缓存
   */
  async setWordCache<T>(key: string, data: T): Promise<boolean> {
    try {
      await wordStore.setItem(key, data)
      return true
    } catch (error) {
      console.error('设置词库缓存失败:', error)
      return false
    }
  },

  /**
   * 清除词库缓存
   */
  async clearWordCache(): Promise<boolean> {
    try {
      await wordStore.clear()
      return true
    } catch (error) {
      console.error('清除词库缓存失败:', error)
      return false
    }
  },
}

export default storage
