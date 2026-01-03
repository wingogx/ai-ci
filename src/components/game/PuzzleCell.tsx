'use client'

import { useDroppable } from '@dnd-kit/core'
import { cn } from '@/utils'
import type { PuzzleCell as PuzzleCellType } from '@/types'

interface PuzzleCellProps {
  cell: PuzzleCellType
  placedLetter?: string
  isCorrect?: boolean
  isWrong?: boolean
  isHighlighted?: boolean
  onRemove?: (cellId: string) => void
  onCellClick?: (cellId: string) => void
}

export function PuzzleCell({
  cell,
  placedLetter,
  isCorrect = false,
  isWrong = false,
  isHighlighted = false,
  onRemove,
  onCellClick,
}: PuzzleCellProps) {
  // 是否可接受拖放
  const canDrop = !cell.isPreFilled && !placedLetter && !isCorrect

  const { isOver, setNodeRef } = useDroppable({
    id: cell.id,
    disabled: !canDrop,
    data: {
      cellId: cell.id,
      accepts: 'letter',
    },
  })

  // 点击处理：移除字母或高亮单词
  const handleClick = () => {
    // 如果有已放置字母且可移除，优先移除
    if (placedLetter && !cell.isPreFilled && !isCorrect && onRemove) {
      onRemove(cell.id)
      return
    }
    // 否则触发高亮
    if (onCellClick && cell.letter) {
      onCellClick(cell.id)
    }
  }

  // 空格子（没有字母的位置）
  if (!cell.letter) {
    return <div className="w-12 h-12" />
  }

  const displayLetter = cell.isPreFilled ? cell.letter : placedLetter

  // 是否可点击移除
  const canRemove = placedLetter && !cell.isPreFilled && !isCorrect
  // 是否可点击（任何有字母的格子都可点击以高亮）
  const canClick = cell.letter && (canRemove || onCellClick)

  return (
    <div
      ref={setNodeRef}
      onClick={handleClick}
      className={cn(
        'w-12 h-12 flex items-center justify-center relative',
        'text-xl font-bold lowercase rounded-lg',
        'border-2 transition-all duration-150 touch-none',
        // 默认空槽位 - 可接收拖放
        canDrop && 'border-dashed border-gray-400 bg-gray-50 z-10',
        canDrop && isOver && 'border-blue-500 bg-blue-50 scale-105 z-20',
        // 预填字母
        cell.isPreFilled && !isHighlighted && 'border-blue-500 bg-blue-500 text-white',
        // 已放置字母
        placedLetter && !isCorrect && !isWrong && !isHighlighted && 'border-yellow-400 bg-yellow-400 text-gray-900',
        // 正确状态
        isCorrect && !isHighlighted && 'border-green-500 bg-green-500 text-white',
        // 错误状态
        isWrong && 'border-red-500 bg-red-500 text-white animate-shake',
        // 高亮状态（紫色边框 + 发光效果）
        isHighlighted && 'border-purple-500 ring-2 ring-purple-300 ring-opacity-50',
        isHighlighted && cell.isPreFilled && 'bg-blue-500 text-white',
        isHighlighted && placedLetter && !isCorrect && 'bg-yellow-400 text-gray-900',
        isHighlighted && isCorrect && 'bg-green-500 text-white',
        isHighlighted && !cell.isPreFilled && !placedLetter && 'bg-purple-50',
        // 可点击的样式
        canClick && 'cursor-pointer hover:opacity-80'
      )}
    >
      {displayLetter}
    </div>
  )
}

export default PuzzleCell
