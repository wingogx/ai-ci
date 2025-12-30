'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  useSensor,
  useSensors,
  PointerSensor,
  TouchSensor,
} from '@dnd-kit/core'
import { useGame } from '@/hooks'
import { useUserStore } from '@/stores'
import { GameHeader, PuzzleBoard, LetterPool, Letter, WordCard } from '@/components/game'
import { Confetti, BadgeModal } from '@/components/feedback'
import { Modal, Button } from '@/components/ui'
import { checkNewBadges, getBadgeById } from '@/data/badges'
import { t } from '@/i18n'

export default function GamePage() {
  const router = useRouter()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [activeLetter, setActiveLetter] = useState<string | null>(null)
  const [showConfetti, setShowConfetti] = useState(false)
  const [showCompletedModal, setShowCompletedModal] = useState(false)
  const [newBadge, setNewBadge] = useState<ReturnType<typeof getBadgeById> | null>(null)
  const [showBadgeModal, setShowBadgeModal] = useState(false)

  const {
    isLoading,
    error,
    currentLevel,
    isChallenge,
    currentPuzzle,
    currentWords,
    placedLetters,
    usedPoolLetters,
    isCompleted,
    correctCells,
    wrongCells,
    helpCount,
    revealedWords,
    placeLetter,
    removeLetter,
    useHelp: triggerHelp,
    startLevel,
    nextLevel,
    playAllWords,
    playWord,
  } = useGame()

  const { settings, stats, getCurrentProgress, earnedBadges, earnBadge } =
    useUserStore()

  const lang = settings.language

  // 拖拽传感器配置
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 100,
        tolerance: 5,
      },
    })
  )

  // 拖拽开始
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event
    setActiveId(active.id as string)

    // 从 pool-letter-index 格式提取字母
    const parts = (active.id as string).split('-')
    if (parts[0] === 'pool' && parts.length >= 2) {
      setActiveLetter(parts[1])
    }
  }, [])

  // 拖拽结束
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event

      setActiveId(null)
      setActiveLetter(null)

      if (over && active.id !== over.id) {
        const poolLetterId = active.id as string
        const cellId = over.id as string

        // 提取字母
        const parts = poolLetterId.split('-')
        if (parts[0] === 'pool' && parts.length >= 2) {
          const letter = parts[1]
          placeLetter(cellId, poolLetterId, letter)
        }
      }
    },
    [placeLetter]
  )

  // 返回首页
  const handleBack = () => {
    router.push('/')
  }

  // 使用帮助
  const handleHelp = () => {
    triggerHelp()
  }

  // 重播发音
  const handleReplay = () => {
    playAllWords()
  }

  // 重新开始当前关（重新选词生成拼图）
  const handleRestart = () => {
    startLevel(currentLevel)
  }

  // 继续下一关
  const handleNextLevel = () => {
    setShowCompletedModal(false)
    setShowConfetti(false)
    nextLevel()
  }

  // 关闭勋章弹窗
  const handleCloseBadge = () => {
    setShowBadgeModal(false)
    setNewBadge(null)
    // 显示通关弹窗
    setShowCompletedModal(true)
  }

  // 监听通关
  useEffect(() => {
    if (isCompleted) {
      // 显示撒花效果
      setShowConfetti(true)

      // 检查新勋章
      const progress = getCurrentProgress()
      const newBadges = checkNewBadges(stats, progress, earnedBadges)

      if (newBadges.length > 0) {
        // 有新勋章，先显示勋章
        const badge = newBadges[0]
        earnBadge(badge.id)
        setNewBadge(badge)
        setTimeout(() => {
          setShowBadgeModal(true)
        }, 1000)
      } else {
        // 无新勋章，直接显示通关弹窗
        setTimeout(() => {
          setShowCompletedModal(true)
        }, 1000)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCompleted])

  // 加载中
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">{t('common.loading', lang)}</p>
        </div>
      </div>
    )
  }

  // 错误
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => router.push('/')}>
            {t('common.back', lang)}
          </Button>
        </div>
      </div>
    )
  }

  // 无拼图
  if (!currentPuzzle) {
    return null
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* 顶栏 */}
        <GameHeader
          level={currentLevel}
          helpCount={helpCount}
          onBack={handleBack}
          onHelp={handleHelp}
          onReplay={handleReplay}
          onRestart={handleRestart}
          isChallenge={isChallenge}
        />

        {/* 帮助提示（显示单词） */}
        {revealedWords.length > 0 && (
          <div className="bg-yellow-100 px-4 py-2 text-center">
            <p className="text-sm text-yellow-800">
              {t('game.helpUsed', lang)}:{' '}
              <span className="font-bold">{revealedWords.join(', ')}</span>
            </p>
          </div>
        )}

        {/* 游戏区域 */}
        <main className="flex-1 flex flex-col items-center justify-center p-4 gap-6">
          {/* 拼图面板 */}
          <PuzzleBoard
            puzzle={currentPuzzle}
            placedLetters={placedLetters}
            correctCells={correctCells}
            wrongCells={wrongCells}
            onRemoveLetter={removeLetter}
          />

          {/* 字母池 */}
          <LetterPool
            letters={currentPuzzle.allLetters}
            usedLetters={usedPoolLetters}
            className="w-full max-w-md"
          />
        </main>

        {/* 拖拽覆盖层 */}
        <DragOverlay>
          {activeId && activeLetter && (
            <Letter id={activeId} letter={activeLetter} isDragging />
          )}
        </DragOverlay>

        {/* 撒花效果 */}
        <Confetti isActive={showConfetti} />

        {/* 勋章弹窗 */}
        <BadgeModal
          isOpen={showBadgeModal}
          onClose={handleCloseBadge}
          badge={newBadge || null}
          language={lang}
        />

        {/* 通关弹窗 */}
        <Modal
          isOpen={showCompletedModal}
          onClose={handleNextLevel}
          title={
            isChallenge
              ? t('game.challengeLevel', lang)
              : t('game.completed', lang)
          }
        >
          <div className="flex flex-col">
            <div className="text-center mb-4">
              <div className="text-5xl mb-2">🎉</div>
              <p className="text-gray-600">
                {lang === 'zh'
                  ? `恭喜你完成了第 ${currentLevel} 关！`
                  : `Congratulations on completing level ${currentLevel}!`}
              </p>
            </div>

            {/* 本关单词列表 */}
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-500 mb-2">
                {lang === 'zh' ? '本关单词' : 'Words in this level'}
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {currentWords.map((word) => (
                  <WordCard
                    key={word.id}
                    word={word}
                    language={lang}
                    onPlaySound={playWord}
                  />
                ))}
              </div>
            </div>

            <Button onClick={handleNextLevel} size="lg" className="w-full">
              {lang === 'zh' ? '继续下一关' : 'Next Level'}
            </Button>
          </div>
        </Modal>
      </div>
    </DndContext>
  )
}
