/**
 * @jest-environment jsdom
 */
import { DEFAULT_USER_DATA } from '@/types'

describe('本地存储', () => {
  // 创建 mock 函数
  const mockGetItem = jest.fn()
  const mockSetItem = jest.fn()
  const mockRemoveItem = jest.fn()
  const mockClear = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    jest.resetModules()

    // Mock localforage
    jest.doMock('localforage', () => ({
      createInstance: () => ({
        getItem: mockGetItem,
        setItem: mockSetItem,
        removeItem: mockRemoveItem,
        clear: mockClear,
      }),
    }))
  })

  describe('getUserData', () => {
    test('返回默认数据当存储为空', async () => {
      mockGetItem.mockResolvedValue(null)
      const { storage } = await import('@/lib/storage')
      const result = await storage.getUserData()
      expect(result).toEqual(DEFAULT_USER_DATA)
    })

    test('返回存储的数据', async () => {
      const savedData = {
        ...DEFAULT_USER_DATA,
        settings: { ...DEFAULT_USER_DATA.settings, language: 'en' as const },
      }
      mockGetItem.mockResolvedValue(savedData)
      const { storage } = await import('@/lib/storage')
      const result = await storage.getUserData()
      expect(result.settings.language).toBe('en')
    })

    test('存储出错时返回默认数据', async () => {
      mockGetItem.mockRejectedValue(new Error('Storage error'))
      const { storage } = await import('@/lib/storage')
      const result = await storage.getUserData()
      expect(result).toEqual(DEFAULT_USER_DATA)
    })
  })

  describe('saveUserData', () => {
    test('成功保存数据返回true', async () => {
      mockSetItem.mockResolvedValue(undefined)
      const { storage } = await import('@/lib/storage')
      const result = await storage.saveUserData(DEFAULT_USER_DATA)
      expect(result).toBe(true)
    })

    test('保存失败返回false', async () => {
      mockSetItem.mockRejectedValue(new Error('Save error'))
      const { storage } = await import('@/lib/storage')
      const result = await storage.saveUserData(DEFAULT_USER_DATA)
      expect(result).toBe(false)
    })
  })

  describe('clearUserData', () => {
    test('成功清除数据返回true', async () => {
      mockRemoveItem.mockResolvedValue(undefined)
      const { storage } = await import('@/lib/storage')
      const result = await storage.clearUserData()
      expect(result).toBe(true)
    })

    test('清除失败返回false', async () => {
      mockRemoveItem.mockRejectedValue(new Error('Clear error'))
      const { storage } = await import('@/lib/storage')
      const result = await storage.clearUserData()
      expect(result).toBe(false)
    })
  })

  describe('词库缓存', () => {
    test('获取缓存成功', async () => {
      const cachedWords = [{ id: '1', word: 'test' }]
      mockGetItem.mockResolvedValue(cachedWords)
      const { storage } = await import('@/lib/storage')
      const result = await storage.getWordCache('words_a1')
      expect(result).toEqual(cachedWords)
    })

    test('缓存不存在返回null', async () => {
      mockGetItem.mockResolvedValue(null)
      const { storage } = await import('@/lib/storage')
      const result = await storage.getWordCache('words_a1')
      expect(result).toBeNull()
    })

    test('设置缓存成功返回true', async () => {
      mockSetItem.mockResolvedValue(undefined)
      const { storage } = await import('@/lib/storage')
      const result = await storage.setWordCache('words_a1', [])
      expect(result).toBe(true)
    })

    test('清除缓存成功返回true', async () => {
      mockClear.mockResolvedValue(undefined)
      const { storage } = await import('@/lib/storage')
      const result = await storage.clearWordCache()
      expect(result).toBe(true)
    })
  })
})
