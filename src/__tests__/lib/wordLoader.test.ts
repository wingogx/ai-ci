/**
 * @jest-environment jsdom
 */

describe('词库加载', () => {
  const mockGetWordCache = jest.fn()
  const mockSetWordCache = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    jest.resetModules()

    // Mock storage
    jest.doMock('@/lib/storage', () => ({
      storage: {
        getWordCache: mockGetWordCache,
        setWordCache: mockSetWordCache,
      },
    }))
  })

  test('能加载 A1 词库', async () => {
    mockGetWordCache.mockResolvedValue(null)
    mockSetWordCache.mockResolvedValue(true)

    const { loadWordList } = await import('@/lib/wordLoader')
    const words = await loadWordList('a1')

    expect(words.length).toBeGreaterThan(0)
    expect(words[0]).toHaveProperty('id')
    expect(words[0]).toHaveProperty('word')
  })

  test('词库按词长排序', async () => {
    mockGetWordCache.mockResolvedValue(null)
    mockSetWordCache.mockResolvedValue(true)

    const { loadWordList } = await import('@/lib/wordLoader')
    const words = await loadWordList('a1')

    for (let i = 1; i < words.length; i++) {
      expect(words[i].word.length).toBeGreaterThanOrEqual(
        words[i - 1].word.length
      )
    }
  })

  test('优先使用缓存', async () => {
    const cachedWords = [
      { id: 'cached_1', word: 'test' },
      { id: 'cached_2', word: 'cache' },
    ]
    mockGetWordCache.mockResolvedValue(cachedWords)

    const { loadWordList } = await import('@/lib/wordLoader')
    const words = await loadWordList('a1')

    expect(words).toEqual(cachedWords)
    expect(mockSetWordCache).not.toHaveBeenCalled()
  })

  test('加载后写入缓存', async () => {
    mockGetWordCache.mockResolvedValue(null)
    mockSetWordCache.mockResolvedValue(true)

    const { loadWordList } = await import('@/lib/wordLoader')
    await loadWordList('a1')

    expect(mockSetWordCache).toHaveBeenCalledWith(
      'words_a1',
      expect.any(Array)
    )
  })

  test('能加载小学词库', async () => {
    mockGetWordCache.mockResolvedValue(null)
    mockSetWordCache.mockResolvedValue(true)

    const { loadWordList } = await import('@/lib/wordLoader')
    const words = await loadWordList('primary')

    expect(words.length).toBeGreaterThan(0)
  })

  test('缓存读取失败时仍能加载', async () => {
    mockGetWordCache.mockRejectedValue(new Error('Cache error'))
    mockSetWordCache.mockResolvedValue(true)

    const { loadWordList } = await import('@/lib/wordLoader')
    const words = await loadWordList('a1')

    expect(words.length).toBeGreaterThan(0)
  })

  test('缓存写入失败时不影响返回', async () => {
    mockGetWordCache.mockResolvedValue(null)
    mockSetWordCache.mockRejectedValue(new Error('Write error'))

    const { loadWordList } = await import('@/lib/wordLoader')
    const words = await loadWordList('a1')

    expect(words.length).toBeGreaterThan(0)
  })
})

describe('词库信息', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.resetModules()
  })

  test('获取词库信息', async () => {
    const { getWordListInfo } = await import('@/lib/wordLoader')
    const info = await getWordListInfo('a1')

    expect(info.level).toBe('A1')
    expect(info.totalWords).toBeGreaterThan(0)
    expect(info.version).toBe(1)
  })
})
