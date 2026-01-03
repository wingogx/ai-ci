'use client'

import { PuzzleCell } from './PuzzleCell'
import { cn } from '@/utils'
import type { PuzzleLayout } from '@/types'

interface PuzzleBoardProps {
  puzzle: PuzzleLayout
  placedLetters: Map<string, string>
  correctCells?: Set<string>
  wrongCells?: Set<string>
  highlightedCells?: Set<string>
  onRemoveLetter?: (cellId: string) => void
  onCellClick?: (cellId: string) => void
  className?: string
}

export function PuzzleBoard({
  puzzle,
  placedLetters,
  correctCells = new Set(),
  wrongCells = new Set(),
  highlightedCells = new Set(),
  onRemoveLetter,
  onCellClick,
  className,
}: PuzzleBoardProps) {
  return (
    <div
      className={cn('flex flex-col items-center gap-1', className)}
      data-testid="puzzle-board"
    >
      {puzzle.grid.map((row, rowIndex) => (
        <div key={rowIndex} className="flex gap-1">
          {row.map((cell) => (
            <PuzzleCell
              key={cell.id}
              cell={cell}
              placedLetter={placedLetters.get(cell.id)}
              isCorrect={correctCells.has(cell.id)}
              isWrong={wrongCells.has(cell.id)}
              isHighlighted={highlightedCells.has(cell.id)}
              onRemove={onRemoveLetter}
              onCellClick={onCellClick}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

export default PuzzleBoard
