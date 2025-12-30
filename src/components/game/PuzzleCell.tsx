'use client'

import { useDroppable } from '@dnd-kit/core'
import { cn } from '@/utils'
import type { PuzzleCell as PuzzleCellType } from '@/types'

interface PuzzleCellProps {
  cell: PuzzleCellType
  placedLetter?: string
  isCorrect?: boolean
  isWrong?: boolean
  onRemove?: (cellId: string) => void
}

export function PuzzleCell({
  cell,
  placedLetter,
  isCorrect = false,
  isWrong = false,
  onRemove,
}: PuzzleCellProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: cell.id,
    disabled: cell.isPreFilled || !!placedLetter,
  })

  // 点击移除已放置的字母（非预填、非正确状态）
  const handleClick = () => {
    if (placedLetter && !cell.isPreFilled && !isCorrect && onRemove) {
      onRemove(cell.id)
    }
  }

  // 空格子（没有字母的位置）
  if (!cell.letter) {
    return <div className="w-12 h-12" />
  }

  const displayLetter = cell.isPreFilled ? cell.letter : placedLetter

  // 是否可点击移除
  const canRemove = placedLetter && !cell.isPreFilled && !isCorrect

  return (
    <div
      ref={setNodeRef}
      onClick={handleClick}
      className={cn(
        'w-12 h-12 flex items-center justify-center',
        'text-xl font-bold uppercase rounded-lg',
        'border-2 transition-all duration-150',
        // 默认空槽位
        !cell.isPreFilled && !placedLetter && 'border-dashed border-gray-400 bg-gray-50',
        !cell.isPreFilled && !placedLetter && isOver && 'border-blue-500 bg-blue-50 scale-105',
        // 预填字母
        cell.isPreFilled && 'border-blue-500 bg-blue-500 text-white',
        // 已放置字母
        placedLetter && !isCorrect && !isWrong && 'border-yellow-400 bg-yellow-400 text-gray-900',
        // 正确状态
        isCorrect && 'border-green-500 bg-green-500 text-white',
        // 错误状态
        isWrong && 'border-red-500 bg-red-500 text-white animate-shake',
        // 可点击移除的样式
        canRemove && 'cursor-pointer hover:opacity-80'
      )}
    >
      {displayLetter?.toUpperCase()}
    </div>
  )
}

export default PuzzleCell
