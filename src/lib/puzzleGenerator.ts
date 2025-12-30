import type {
  PuzzleCell,
  PuzzleLayout,
  PuzzleWord,
  PuzzleOptions,
  Position,
  Direction,
} from '@/types'
import { generateId, shuffle, sortLetters } from '@/utils/helpers'

/**
 * 拼图生成错误
 */
export class PuzzleGenerationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PuzzleGenerationError'
  }
}

/**
 * 默认配置
 */
const DEFAULT_OPTIONS: PuzzleOptions = {
  preFillRatio: 0.4,
  maxRetries: 50,
}

/**
 * 找出两个单词的共同字母及其位置
 */
function findIntersections(
  word1: string,
  word2: string
): Array<{ char: string; pos1: number; pos2: number }> {
  const result: Array<{ char: string; pos1: number; pos2: number }> = []
  const w1 = word1.toLowerCase()
  const w2 = word2.toLowerCase()

  for (let i = 0; i < w1.length; i++) {
    for (let j = 0; j < w2.length; j++) {
      if (w1[i] === w2[j]) {
        result.push({ char: w1[i], pos1: i, pos2: j })
      }
    }
  }

  return result
}

/**
 * 创建空网格
 */
function createEmptyGrid(rows: number, cols: number): (string | null)[][] {
  return Array(rows)
    .fill(null)
    .map(() => Array(cols).fill(null))
}

/**
 * 检查位置是否在网格范围内
 */
function isInBounds(
  pos: Position,
  size: { rows: number; cols: number }
): boolean {
  return pos.row >= 0 && pos.row < size.rows && pos.col >= 0 && pos.col < size.cols
}

/**
 * 检查单词能否放置在指定位置
 */
function canPlaceWord(
  grid: (string | null)[][],
  word: string,
  startPos: Position,
  direction: Direction,
  size: { rows: number; cols: number }
): boolean {
  const w = word.toLowerCase()

  for (let i = 0; i < w.length; i++) {
    const pos: Position =
      direction === 'horizontal'
        ? { row: startPos.row, col: startPos.col + i }
        : { row: startPos.row + i, col: startPos.col }

    if (!isInBounds(pos, size)) {
      return false
    }

    const existing = grid[pos.row][pos.col]
    if (existing !== null && existing !== w[i]) {
      return false
    }
  }

  return true
}

/**
 * 在网格上放置单词
 */
function placeWord(
  grid: (string | null)[][],
  word: string,
  startPos: Position,
  direction: Direction
): void {
  const w = word.toLowerCase()

  for (let i = 0; i < w.length; i++) {
    const pos: Position =
      direction === 'horizontal'
        ? { row: startPos.row, col: startPos.col + i }
        : { row: startPos.row + i, col: startPos.col }

    grid[pos.row][pos.col] = w[i]
  }
}

/**
 * 尝试生成拼图布局
 */
function tryGeneratePuzzle(
  words: string[],
  options: PuzzleOptions
): PuzzleLayout | null {
  if (words.length === 0) {
    throw new PuzzleGenerationError('单词列表不能为空')
  }

  if (words.length === 1) {
    // 只有一个单词，直接横向放置
    return generateSingleWordPuzzle(words[0], options)
  }

  // 按长度排序，最长的先放
  const sortedWords = [...words].sort((a, b) => b.length - a.length)

  // 计算网格大小（预留足够空间）
  const maxWordLength = Math.max(...words.map((w) => w.length))
  const gridSize = maxWordLength * 2 + 2
  const size = { rows: gridSize, cols: gridSize }

  // 创建临时网格用于放置
  const grid = createEmptyGrid(gridSize, gridSize)

  // 记录已放置的单词信息
  const placedWords: Array<{
    word: string
    startPos: Position
    direction: Direction
  }> = []

  // 放置第一个单词（最长的，横向居中）
  const firstWord = sortedWords[0]
  const firstStartPos: Position = {
    row: Math.floor(gridSize / 2),
    col: Math.floor((gridSize - firstWord.length) / 2),
  }

  placeWord(grid, firstWord, firstStartPos, 'horizontal')
  placedWords.push({
    word: firstWord,
    startPos: firstStartPos,
    direction: 'horizontal',
  })

  // 尝试放置剩余单词
  for (let i = 1; i < sortedWords.length; i++) {
    const word = sortedWords[i]
    let placed = false

    // 随机打乱已放置单词的顺序，增加随机性
    const shuffledPlaced = shuffle(placedWords)

    for (const placedWord of shuffledPlaced) {
      if (placed) break

      // 找交叉点
      const intersections = findIntersections(placedWord.word, word)
      const shuffledIntersections = shuffle(intersections)

      for (const intersection of shuffledIntersections) {
        if (placed) break

        // 新单词的方向与已放置单词垂直
        const newDirection: Direction =
          placedWord.direction === 'horizontal' ? 'vertical' : 'horizontal'

        // 计算新单词的起始位置
        let newStartPos: Position

        if (placedWord.direction === 'horizontal') {
          // 已放置单词是横向的，新单词纵向
          const crossCol = placedWord.startPos.col + intersection.pos1
          const crossRow = placedWord.startPos.row
          newStartPos = {
            row: crossRow - intersection.pos2,
            col: crossCol,
          }
        } else {
          // 已放置单词是纵向的，新单词横向
          const crossRow = placedWord.startPos.row + intersection.pos1
          const crossCol = placedWord.startPos.col
          newStartPos = {
            row: crossRow,
            col: crossCol - intersection.pos2,
          }
        }

        // 检查能否放置
        if (canPlaceWord(grid, word, newStartPos, newDirection, size)) {
          placeWord(grid, word, newStartPos, newDirection)
          placedWords.push({
            word,
            startPos: newStartPos,
            direction: newDirection,
          })
          placed = true
        }
      }
    }

    if (!placed) {
      // 无法放置这个单词，生成失败
      return null
    }
  }

  // 裁剪网格到实际使用的区域
  return cropAndBuildLayout(grid, placedWords, size, options)
}

/**
 * 生成单个单词的拼图
 */
function generateSingleWordPuzzle(
  word: string,
  options: PuzzleOptions
): PuzzleLayout {
  const w = word.toLowerCase()
  const cells: PuzzleCell[][] = [[]]
  const puzzleWord: PuzzleWord = {
    id: generateId(),
    word: w,
    direction: 'horizontal',
    startPos: { row: 0, col: 0 },
    cells: [],
    isCompleted: false,
    isCorrect: false,
  }

  for (let i = 0; i < w.length; i++) {
    const cell: PuzzleCell = {
      id: `cell_0_${i}`,
      letter: w[i],
      isPreFilled: false,
      isCrossPoint: false,
      wordIds: [puzzleWord.id],
      position: { row: 0, col: i },
    }
    cells[0].push(cell)
    puzzleWord.cells.push(cell)
  }

  // 预填
  applyPreFill(cells, [], options.preFillRatio)

  return {
    grid: cells,
    words: [puzzleWord],
    size: { rows: 1, cols: w.length },
    allLetters: sortLetters(w.split('')),
  }
}

/**
 * 裁剪网格并构建最终布局
 */
function cropAndBuildLayout(
  grid: (string | null)[][],
  placedWords: Array<{
    word: string
    startPos: Position
    direction: Direction
  }>,
  size: { rows: number; cols: number },
  options: PuzzleOptions
): PuzzleLayout {
  // 找到实际使用的边界
  let minRow = size.rows,
    maxRow = 0,
    minCol = size.cols,
    maxCol = 0

  for (let row = 0; row < size.rows; row++) {
    for (let col = 0; col < size.cols; col++) {
      if (grid[row][col] !== null) {
        minRow = Math.min(minRow, row)
        maxRow = Math.max(maxRow, row)
        minCol = Math.min(minCol, col)
        maxCol = Math.max(maxCol, col)
      }
    }
  }

  // 裁剪后的尺寸
  const newRows = maxRow - minRow + 1
  const newCols = maxCol - minCol + 1

  // 创建 PuzzleCell 网格
  const cells: PuzzleCell[][] = []
  for (let row = 0; row < newRows; row++) {
    cells[row] = []
    for (let col = 0; col < newCols; col++) {
      const letter = grid[row + minRow][col + minCol]
      cells[row][col] = {
        id: `cell_${row}_${col}`,
        letter,
        isPreFilled: false,
        isCrossPoint: false,
        wordIds: [],
        position: { row, col },
      }
    }
  }

  // 构建 PuzzleWord 并关联 cells
  const puzzleWords: PuzzleWord[] = placedWords.map((pw) => {
    const id = generateId()
    const w = pw.word.toLowerCase()
    const wordCells: PuzzleCell[] = []

    // 调整起始位置（相对于裁剪后的网格）
    const adjustedStartPos: Position = {
      row: pw.startPos.row - minRow,
      col: pw.startPos.col - minCol,
    }

    for (let i = 0; i < w.length; i++) {
      const pos: Position =
        pw.direction === 'horizontal'
          ? { row: adjustedStartPos.row, col: adjustedStartPos.col + i }
          : { row: adjustedStartPos.row + i, col: adjustedStartPos.col }

      const cell = cells[pos.row][pos.col]
      cell.wordIds.push(id)
      wordCells.push(cell)
    }

    return {
      id,
      word: w,
      direction: pw.direction,
      startPos: adjustedStartPos,
      cells: wordCells,
      isCompleted: false,
      isCorrect: false,
    }
  })

  // 标记交叉点
  for (let row = 0; row < newRows; row++) {
    for (let col = 0; col < newCols; col++) {
      if (cells[row][col].wordIds.length > 1) {
        cells[row][col].isCrossPoint = true
      }
    }
  }

  // 应用预填
  const crossPoints = cells
    .flat()
    .filter((c) => c.isCrossPoint)
    .map((c) => c.position)
  applyPreFill(cells, crossPoints, options.preFillRatio)

  // 收集所有字母
  const allLetters = collectAllLetters(cells)

  return {
    grid: cells,
    words: puzzleWords,
    size: { rows: newRows, cols: newCols },
    allLetters,
  }
}

/**
 * 应用预填逻辑
 */
function applyPreFill(
  cells: PuzzleCell[][],
  crossPoints: Position[],
  preFillRatio: number
): void {
  // 1. 交叉点必填
  for (const pos of crossPoints) {
    cells[pos.row][pos.col].isPreFilled = true
  }

  // 2. 计算还需要预填多少
  const allCells = cells.flat().filter((c) => c.letter !== null)
  const targetPreFill = Math.floor(allCells.length * preFillRatio)
  const currentPreFill = crossPoints.length
  const remaining = targetPreFill - currentPreFill

  // 3. 随机选择额外预填
  if (remaining > 0) {
    const emptyCells = allCells.filter((c) => !c.isPreFilled)
    const shuffled = shuffle(emptyCells)
    for (let i = 0; i < Math.min(remaining, shuffled.length); i++) {
      shuffled[i].isPreFilled = true
    }
  }
}

/**
 * 收集所有需要填写的字母（非预填）
 */
function collectAllLetters(cells: PuzzleCell[][]): string[] {
  const letters: string[] = []

  for (const row of cells) {
    for (const cell of row) {
      if (cell.letter && !cell.isPreFilled) {
        letters.push(cell.letter)
      }
    }
  }

  return sortLetters(letters)
}

/**
 * 生成拼图
 * @param words 单词列表
 * @param options 配置选项
 */
export function generatePuzzle(
  words: string[],
  options: Partial<PuzzleOptions> = {}
): PuzzleLayout {
  const opts: PuzzleOptions = { ...DEFAULT_OPTIONS, ...options }

  if (words.length === 0) {
    throw new PuzzleGenerationError('单词列表不能为空')
  }

  // 过滤无效单词
  const validWords = words.filter((w) => w && w.length > 0)
  if (validWords.length === 0) {
    throw new PuzzleGenerationError('没有有效的单词')
  }

  // 尝试生成，失败则重试
  for (let attempt = 0; attempt < opts.maxRetries!; attempt++) {
    const result = tryGeneratePuzzle(validWords, opts)
    if (result) {
      return result
    }
  }

  throw new PuzzleGenerationError(
    `无法生成拼图：尝试 ${opts.maxRetries} 次后失败`
  )
}

/**
 * 验证单词是否正确完成
 */
export function validateWord(
  puzzleWord: PuzzleWord,
  placedLetters: Map<string, string>
): boolean {
  const expectedWord = puzzleWord.word.toLowerCase()

  for (let i = 0; i < puzzleWord.cells.length; i++) {
    const cell = puzzleWord.cells[i]
    const expectedLetter = expectedWord[i]

    if (cell.isPreFilled) {
      // 预填字母直接检查
      if (cell.letter?.toLowerCase() !== expectedLetter) {
        return false
      }
    } else {
      // 用户放置的字母
      const placed = placedLetters.get(cell.id)?.toLowerCase()
      if (placed !== expectedLetter) {
        return false
      }
    }
  }

  return true
}

/**
 * 检查单词是否已完成填写（不管对错）
 */
export function isWordComplete(
  puzzleWord: PuzzleWord,
  placedLetters: Map<string, string>
): boolean {
  for (const cell of puzzleWord.cells) {
    if (!cell.isPreFilled && !placedLetters.has(cell.id)) {
      return false
    }
  }
  return true
}

/**
 * 检查整个拼图是否完成
 */
export function isPuzzleComplete(
  puzzle: PuzzleLayout,
  placedLetters: Map<string, string>
): boolean {
  return puzzle.words.every((word) => isWordComplete(word, placedLetters))
}

/**
 * 验证整个拼图是否正确
 */
export function validatePuzzle(
  puzzle: PuzzleLayout,
  placedLetters: Map<string, string>
): boolean {
  return puzzle.words.every((word) => validateWord(word, placedLetters))
}

export default generatePuzzle
