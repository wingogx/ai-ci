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
  className,
}: GameHeaderProps) {
  return (
    <header
      className={cn(
        'flex items-center justify-between',
        'px-4 py-3 bg-white shadow-sm',
        className
      )}
    >
      {/* 返回按钮 */}
      <Button variant="ghost" size="sm" onClick={onBack} data-testid="back-button">
        ← 返回
      </Button>

      {/* 关卡信息 */}
      <div className="flex items-center gap-2">
        {isTutorialLevel && (
          <span className="px-2 py-0.5 bg-green-500 text-white text-xs rounded-full">
            教学关
          </span>
        )}
        {isChallenge && (
          <span className="px-2 py-0.5 bg-orange-500 text-white text-xs rounded-full">
            挑战关
          </span>
        )}
        <span className="font-bold text-gray-900">第 {level} 关</span>
      </div>

      {/* 右侧按钮 */}
      <div className="flex items-center gap-2">
        {/* 重新开始按钮 */}
        <Button
          variant="outline"
          size="sm"
          onClick={onRestart}
          title="重新开始"
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
            className="relative"
          >
            💡
            {helpCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center">
                {helpCount}
              </span>
            )}
          </Button>
        )}

        {/* 重播发音按钮 */}
        <Button variant="outline" size="sm" onClick={onReplay}>
          🔊
        </Button>
      </div>
    </header>
  )
}

export default GameHeader
