'use client'

import { useDraggable } from '@dnd-kit/core'
import { cn } from '@/utils'

interface LetterProps {
  id: string
  letter: string
  isUsed?: boolean
  isPreFilled?: boolean
  isCorrect?: boolean
  isWrong?: boolean
  isDragging?: boolean
}

export function Letter({
  id,
  letter,
  isUsed = false,
  isPreFilled = false,
  isCorrect = false,
  isWrong = false,
  isDragging = false,
}: LetterProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id,
    disabled: isPreFilled || isUsed,
  })

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        'w-12 h-12 flex items-center justify-center',
        'text-xl font-bold lowercase rounded-lg',
        'select-none touch-none transition-colors duration-150',
        // 默认状态
        !isPreFilled && !isUsed && !isCorrect && !isWrong && 'bg-yellow-400 text-gray-900 shadow-md cursor-grab active:cursor-grabbing hover:scale-105 hover:shadow-lg',
        // 预填状态
        isPreFilled && 'bg-blue-500 text-white',
        // 已使用状态
        isUsed && 'bg-gray-300 text-gray-400 cursor-not-allowed',
        // 正确状态
        isCorrect && 'bg-green-500 text-white',
        // 错误状态
        isWrong && 'bg-red-500 text-white animate-shake',
        // 拖拽中
        isDragging && 'opacity-50 scale-110 shadow-xl z-50'
      )}
      data-testid={`letter-${letter}`}
    >
      {letter}
    </div>
  )
}

export default Letter
