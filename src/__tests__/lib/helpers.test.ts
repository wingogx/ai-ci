import {
  shuffle,
  generateId,
  getTodayString,
  isConsecutiveDay,
  isToday,
  isChallengeLevel,
  getWordCountForLevel,
  getPreFillRatio,
  sortLetters,
  findCommonLetters,
} from '@/utils/helpers'

describe('工具函数', () => {
  describe('shuffle', () => {
    test('返回相同长度的数组', () => {
      const arr = [1, 2, 3, 4, 5]
      const result = shuffle(arr)
      expect(result.length).toBe(arr.length)
    })

    test('包含所有原始元素', () => {
      const arr = [1, 2, 3, 4, 5]
      const result = shuffle(arr)
      expect(result.sort()).toEqual(arr.sort())
    })

    test('不修改原数组', () => {
      const arr = [1, 2, 3, 4, 5]
      const original = [...arr]
      shuffle(arr)
      expect(arr).toEqual(original)
    })

    test('空数组返回空数组', () => {
      expect(shuffle([])).toEqual([])
    })
  })

  describe('generateId', () => {
    test('生成非空字符串', () => {
      const id = generateId()
      expect(typeof id).toBe('string')
      expect(id.length).toBeGreaterThan(0)
    })

    test('生成唯一ID', () => {
      const ids = new Set(Array(100).fill(0).map(() => generateId()))
      expect(ids.size).toBe(100)
    })
  })

  describe('getTodayString', () => {
    test('返回 YYYY-MM-DD 格式', () => {
      const today = getTodayString()
      expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })
  })

  describe('isConsecutiveDay', () => {
    test('连续日期返回true', () => {
      expect(isConsecutiveDay('2025-01-01', '2025-01-02')).toBe(true)
      expect(isConsecutiveDay('2025-01-02', '2025-01-01')).toBe(true)
    })

    test('非连续日期返回false', () => {
      expect(isConsecutiveDay('2025-01-01', '2025-01-03')).toBe(false)
    })

    test('同一天返回false', () => {
      expect(isConsecutiveDay('2025-01-01', '2025-01-01')).toBe(false)
    })

    test('空字符串返回false', () => {
      expect(isConsecutiveDay('', '2025-01-01')).toBe(false)
      expect(isConsecutiveDay('2025-01-01', '')).toBe(false)
    })
  })

  describe('isToday', () => {
    test('今天返回true', () => {
      const today = getTodayString()
      expect(isToday(today)).toBe(true)
    })

    test('其他日期返回false', () => {
      expect(isToday('2020-01-01')).toBe(false)
    })
  })

  describe('isChallengeLevel', () => {
    test('每5关是挑战关', () => {
      expect(isChallengeLevel(5)).toBe(true)
      expect(isChallengeLevel(10)).toBe(true)
      expect(isChallengeLevel(15)).toBe(true)
    })

    test('非5的倍数不是挑战关', () => {
      expect(isChallengeLevel(1)).toBe(false)
      expect(isChallengeLevel(3)).toBe(false)
      expect(isChallengeLevel(7)).toBe(false)
    })

    test('0不是挑战关', () => {
      expect(isChallengeLevel(0)).toBe(false)
    })
  })

  describe('getWordCountForLevel', () => {
    test('普通关返回3-4', () => {
      // 多次测试确保在范围内
      for (let i = 0; i < 10; i++) {
        const count = getWordCountForLevel(1)
        expect(count).toBeGreaterThanOrEqual(3)
        expect(count).toBeLessThanOrEqual(4)
      }
    })

    test('挑战关返回5-7', () => {
      for (let i = 0; i < 10; i++) {
        const count = getWordCountForLevel(5)
        expect(count).toBeGreaterThanOrEqual(5)
        expect(count).toBeLessThanOrEqual(7)
      }
    })
  })

  describe('getPreFillRatio', () => {
    test('A1等级返回0.5', () => {
      expect(getPreFillRatio('a1')).toBe(0.5)
    })

    test('小学等级返回0.5', () => {
      expect(getPreFillRatio('primary')).toBe(0.5)
    })

    test('高等级返回较低比例', () => {
      expect(getPreFillRatio('c2')).toBe(0.15)
    })

    test('未知等级返回默认0.4', () => {
      expect(getPreFillRatio('unknown')).toBe(0.4)
    })
  })

  describe('sortLetters', () => {
    test('按字母顺序排序', () => {
      expect(sortLetters(['c', 'a', 'b'])).toEqual(['a', 'b', 'c'])
    })

    test('不修改原数组', () => {
      const arr = ['c', 'a', 'b']
      sortLetters(arr)
      expect(arr).toEqual(['c', 'a', 'b'])
    })

    test('大写字母排序', () => {
      expect(sortLetters(['C', 'A', 'B'])).toEqual(['A', 'B', 'C'])
    })
  })

  describe('findCommonLetters', () => {
    test('找到共同字母', () => {
      const common = findCommonLetters('cat', 'act')
      expect(common.sort()).toEqual(['a', 'c', 't'])
    })

    test('无共同字母返回空', () => {
      const common = findCommonLetters('xyz', 'abc')
      expect(common).toEqual([])
    })

    test('部分共同字母', () => {
      const common = findCommonLetters('hello', 'world')
      expect(common.sort()).toEqual(['l', 'o'])
    })

    test('大小写不敏感', () => {
      const common = findCommonLetters('CAT', 'act')
      expect(common.sort()).toEqual(['a', 'c', 't'])
    })
  })
})
