'use client'

import { Letter } from './Letter'
import { cn } from '@/utils'

interface LetterPoolProps {
  letters: string[]
  usedLetters: Set<string>
  className?: string
}

export function LetterPool({
  letters,
  usedLetters,
  className,
}: LetterPoolProps) {
  // 跟踪每个字母的使用次数
  const letterUseCounts = new Map<string, number>()
  const letterIds: Array<{ id: string; letter: string; isUsed: boolean }> = []

  letters.forEach((letter) => {
    const count = letterUseCounts.get(letter) || 0
    letterUseCounts.set(letter, count + 1)

    const id = `pool-${letter}-${count}`
    const isUsed = usedLetters.has(id)

    letterIds.push({ id, letter, isUsed })
  })

  return (
    <div
      className={cn(
        'flex flex-wrap justify-center gap-1.5 sm:gap-2 p-3 sm:p-4',
        'bg-gray-100 rounded-lg sm:rounded-xl',
        className
      )}
      data-testid="letter-pool"
    >
      {letterIds.map(({ id, letter, isUsed }) => (
        <Letter
          key={id}
          id={id}
          letter={letter}
          isUsed={isUsed}
        />
      ))}
    </div>
  )
}

export default LetterPool
