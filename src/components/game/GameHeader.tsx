'use client'

import { Button } from '@/components/ui'
import { cn } from '@/utils'

interface GameHeaderProps {
  level: number
  helpCount: number
  onBack: () => void
  onHelp: () => void
  onReplay: () => void
  onRestart: () => void
  isChallenge?: boolean
  isTutorialLevel?: boolean
  theme?: { id: string; name: string } | null
  className?: string
}

export function GameHeader({
  level,
  helpCount,
  onBack,
  onHelp,
  onReplay,
  onRestart,
  isChallenge = false,
  isTutorialLevel = false,
  theme = null,
  className,
}: GameHeaderProps) {
  return (
    <header
      className={cn(
        'flex items-center justify-between',
        'px-3 sm:px-4 py-2 sm:py-3 bg-white shadow-sm',
        'safe-area-inset-top',
        className
      )}
    >
      {/* 返回按钮 */}
      <Button variant="ghost" size="sm" onClick={onBack} data-testid="back-button" className="text-sm sm:text-base px-2 sm:px-3">
        ←
      </Button>

      {/* 关卡信息 */}
      <div className="flex items-center gap-1 sm:gap-2">
        {isTutorialLevel && (
          <span className="px-1.5 sm:px-2 py-0.5 bg-green-500 text-white text-[10px] sm:text-xs rounded-full">
            教学
          </span>
        )}
        {isChallenge && (
          <span className="px-1.5 sm:px-2 py-0.5 bg-orange-500 text-white text-[10px] sm:text-xs rounded-full">
            挑战
          </span>
        )}
        <div className="flex flex-col items-center">
          <span className="font-bold text-gray-900 text-sm sm:text-base">第 {level} 关</span>
          {theme && (
            <span className="text-xs sm:text-sm text-blue-600 font-semibold">
              {theme.name}
            </span>
          )}
        </div>
      </div>

      {/* 右侧按钮 */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* 重新开始按钮 */}
        <Button
          variant="outline"
          size="sm"
          onClick={onRestart}
          title="重新开始"
          className="w-8 h-8 sm:w-9 sm:h-9 p-0"
        >
          🔄
        </Button>

        {/* 帮助按钮 - 教学关卡不显示（已自动显示答案） */}
        {!isTutorialLevel && (
          <Button
            variant="outline"
            size="sm"
            onClick={onHelp}
            disabled={helpCount <= 0}
            className="relative w-8 h-8 sm:w-9 sm:h-9 p-0"
          >
            💡
            {helpCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-blue-500 text-white text-[10px] sm:text-xs rounded-full flex items-center justify-center">
                {helpCount}
              </span>
            )}
          </Button>
        )}

        {/* 重播发音按钮 */}
        <Button variant="outline" size="sm" onClick={onReplay} className="w-8 h-8 sm:w-9 sm:h-9 p-0">
          🔊
        </Button>
      </div>
    </header>
  )
}

export default GameHeader
