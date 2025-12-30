import {
  generatePuzzle,
  validateWord,
  isWordComplete,
  isPuzzleComplete,
  validatePuzzle,
  PuzzleGenerationError,
} from '@/lib/puzzleGenerator'

describe('拼图生成', () => {
  describe('generatePuzzle', () => {
    test('能生成有效拼图', () => {
      const words = ['cat', 'car', 'act']
      const puzzle = generatePuzzle(words)

      expect(puzzle).not.toBeNull()
      expect(puzzle.words.length).toBe(3)
      expect(puzzle.grid.length).toBeGreaterThan(0)
    })

    test('拼图包含所有单词', () => {
      const words = ['cat', 'car', 'tar'] // 使用有共同字母的单词
      const puzzle = generatePuzzle(words)

      const puzzleWords = puzzle.words.map((w) => w.word)
      expect(puzzleWords).toContain('cat')
      expect(puzzleWords).toContain('car')
      expect(puzzleWords).toContain('tar')
    })

    test('单个单词生成拼图', () => {
      const words = ['hello']
      const puzzle = generatePuzzle(words)

      expect(puzzle.words.length).toBe(1)
      expect(puzzle.words[0].word).toBe('hello')
      expect(puzzle.size.cols).toBe(5)
    })

    test('交叉点正确识别', () => {
      const words = ['cat', 'act']
      const puzzle = generatePuzzle(words)

      const crossPoints = puzzle.grid.flat().filter((c) => c.isCrossPoint)
      // cat 和 act 共享 a, c, t，至少有一个交叉点
      expect(crossPoints.length).toBeGreaterThan(0)
    })

    test('预填比例正确', () => {
      const words = ['hello', 'world']
      const puzzle = generatePuzzle(words, { preFillRatio: 0.5 })

      const allCells = puzzle.grid.flat().filter((c) => c.letter !== null)
      const preFilled = allCells.filter((c) => c.isPreFilled)

      // 预填比例应该接近 50%（允许一定误差）
      const ratio = preFilled.length / allCells.length
      expect(ratio).toBeGreaterThanOrEqual(0.3)
      expect(ratio).toBeLessThanOrEqual(0.7)
    })

    test('字母池包含所有非预填字母', () => {
      const words = ['cat', 'car'] // 使用有共同字母的单词
      const puzzle = generatePuzzle(words)

      const nonPreFilledCells = puzzle.grid
        .flat()
        .filter((c) => c.letter && !c.isPreFilled)
      const expectedLetters = nonPreFilledCells.map((c) => c.letter!)

      // allLetters 应该包含所有需要用户填写的字母
      expect(puzzle.allLetters.length).toBe(expectedLetters.length)
    })

    test('空数组抛出错误', () => {
      expect(() => generatePuzzle([])).toThrow(PuzzleGenerationError)
    })

    test('无效单词过滤后为空抛出错误', () => {
      expect(() => generatePuzzle(['', ''])).toThrow(PuzzleGenerationError)
    })

    test('多个单词能正确交叉', () => {
      const words = ['apple', 'plant', 'eat']
      const puzzle = generatePuzzle(words)

      expect(puzzle.words.length).toBe(3)

      // 检查有交叉点
      const crossPoints = puzzle.grid.flat().filter((c) => c.isCrossPoint)
      expect(crossPoints.length).toBeGreaterThan(0)
    })

    test('较长单词列表', () => {
      const words = ['cat', 'car', 'rat', 'art', 'tar']
      const puzzle = generatePuzzle(words)

      expect(puzzle.words.length).toBe(5)
    })
  })

  describe('validateWord', () => {
    test('正确填写返回true', () => {
      const words = ['cat']
      const puzzle = generatePuzzle(words, { preFillRatio: 0 })
      const word = puzzle.words[0]

      const placedLetters = new Map<string, string>()
      word.cells.forEach((cell, i) => {
        if (!cell.isPreFilled) {
          placedLetters.set(cell.id, 'cat'[i])
        }
      })

      expect(validateWord(word, placedLetters)).toBe(true)
    })

    test('错误填写返回false', () => {
      const words = ['cat']
      const puzzle = generatePuzzle(words, { preFillRatio: 0 })
      const word = puzzle.words[0]

      const placedLetters = new Map<string, string>()
      word.cells.forEach((cell) => {
        if (!cell.isPreFilled) {
          placedLetters.set(cell.id, 'x') // 错误字母
        }
      })

      expect(validateWord(word, placedLetters)).toBe(false)
    })

    test('部分正确返回false', () => {
      const words = ['cat']
      const puzzle = generatePuzzle(words, { preFillRatio: 0 })
      const word = puzzle.words[0]

      const placedLetters = new Map<string, string>()
      placedLetters.set(word.cells[0].id, 'c')
      placedLetters.set(word.cells[1].id, 'a')
      placedLetters.set(word.cells[2].id, 'x') // 最后一个错误

      expect(validateWord(word, placedLetters)).toBe(false)
    })
  })

  describe('isWordComplete', () => {
    test('完全填写返回true', () => {
      const words = ['cat']
      const puzzle = generatePuzzle(words, { preFillRatio: 0 })
      const word = puzzle.words[0]

      const placedLetters = new Map<string, string>()
      word.cells.forEach((cell) => {
        if (!cell.isPreFilled) {
          placedLetters.set(cell.id, 'x')
        }
      })

      expect(isWordComplete(word, placedLetters)).toBe(true)
    })

    test('未完全填写返回false', () => {
      const words = ['cat']
      const puzzle = generatePuzzle(words, { preFillRatio: 0 })
      const word = puzzle.words[0]

      const placedLetters = new Map<string, string>()
      // 只填一个
      if (!word.cells[0].isPreFilled) {
        placedLetters.set(word.cells[0].id, 'c')
      }

      expect(isWordComplete(word, placedLetters)).toBe(false)
    })
  })

  describe('isPuzzleComplete', () => {
    test('所有单词完成返回true', () => {
      const words = ['cat']
      const puzzle = generatePuzzle(words, { preFillRatio: 0 })

      const placedLetters = new Map<string, string>()
      puzzle.words.forEach((word) => {
        word.cells.forEach((cell, i) => {
          if (!cell.isPreFilled) {
            placedLetters.set(cell.id, word.word[i])
          }
        })
      })

      expect(isPuzzleComplete(puzzle, placedLetters)).toBe(true)
    })

    test('部分完成返回false', () => {
      const words = ['cat', 'car'] // 使用有共同字母的单词
      const puzzle = generatePuzzle(words, { preFillRatio: 0 })

      // 只填第一个单词
      const placedLetters = new Map<string, string>()
      const firstWord = puzzle.words[0]
      firstWord.cells.forEach((cell, i) => {
        if (!cell.isPreFilled) {
          placedLetters.set(cell.id, firstWord.word[i])
        }
      })

      expect(isPuzzleComplete(puzzle, placedLetters)).toBe(false)
    })
  })

  describe('validatePuzzle', () => {
    test('全部正确返回true', () => {
      const words = ['cat']
      const puzzle = generatePuzzle(words, { preFillRatio: 0 })

      const placedLetters = new Map<string, string>()
      puzzle.words.forEach((word) => {
        word.cells.forEach((cell, i) => {
          if (!cell.isPreFilled) {
            placedLetters.set(cell.id, word.word[i])
          }
        })
      })

      expect(validatePuzzle(puzzle, placedLetters)).toBe(true)
    })

    test('有错误返回false', () => {
      const words = ['cat']
      const puzzle = generatePuzzle(words, { preFillRatio: 0 })

      const placedLetters = new Map<string, string>()
      puzzle.words[0].cells.forEach((cell) => {
        if (!cell.isPreFilled) {
          placedLetters.set(cell.id, 'x')
        }
      })

      expect(validatePuzzle(puzzle, placedLetters)).toBe(false)
    })
  })

  describe('边界情况', () => {
    test('相同字母的单词', () => {
      const words = ['aaa', 'aa']
      const puzzle = generatePuzzle(words)
      expect(puzzle.words.length).toBe(2)
    })

    test('多个有共同字母的单词能生成', () => {
      // 使用有共同字母的单词
      const words = ['cat', 'car', 'rat', 'art']
      const puzzle = generatePuzzle(words)
      expect(puzzle.words.length).toBe(4)
    })

    test('单字母单词', () => {
      const words = ['a', 'b']
      // 单字母单词没有共同字母，可能生成失败
      // 但由于有重试机制，可能还是会成功
      try {
        const puzzle = generatePuzzle(words)
        expect(puzzle.words.length).toBeGreaterThanOrEqual(1)
      } catch (error) {
        expect(error).toBeInstanceOf(PuzzleGenerationError)
      }
    })
  })
})
