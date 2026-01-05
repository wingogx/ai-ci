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
  pointerWithin,
  closestCenter,
  CollisionDetection,
  DroppableContainer,
} from '@dnd-kit/core'
import { useGame } from '@/hooks'
import { useUserStore } from '@/stores'
import { GameHeader, PuzzleBoard, LetterPool, Letter, WordCard } from '@/components/game'
import { Confetti, BadgeModal } from '@/components/feedback'
import { Modal, Button } from '@/components/ui'
import { ShareModal, LevelShareCard, BadgeShareCard } from '@/components/share'
import { checkNewBadges, getBadgeById } from '@/data/badges'
import { getWordListInfo } from '@/lib/wordLoader'
import { getUserInviteCode } from '@/lib/auth/deviceAuth'
import { uploadProgress } from '@/lib/sync'
import { t } from '@/i18n'

export default function GamePage() {
  const router = useRouter()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [activeLetter, setActiveLetter] = useState<string | null>(null)
  const [showConfetti, setShowConfetti] = useState(false)
  const [showCompletedModal, setShowCompletedModal] = useState(false)
  const [newBadge, setNewBadge] = useState<ReturnType<typeof getBadgeById> | null>(null)
  const [showBadgeModal, setShowBadgeModal] = useState(false)
  const [totalWordsInGrade, setTotalWordsInGrade] = useState(0)
  const [highlightedCells, setHighlightedCells] = useState<Set<string>>(new Set())
  const [showShareLevelModal, setShowShareLevelModal] = useState(false)
  const [showShareBadgeModal, setShowShareBadgeModal] = useState(false)
  const [inviteCode, setInviteCode] = useState<string>()
  const [userNickname, setUserNickname] = useState<string>('学习者')

  const {
    isLoading,
    error,
    currentLevel,
    isChallenge,
    isTutorialLevel,
    currentPuzzle,
    currentWords,
    placedLetters,
    usedPoolLetters,
    isCompleted,
    correctCells,
    wrongCells,
    helpCount,
    isHelpUsed,
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

  // 自定义碰撞检测：优先 pointerWithin，回退到 closestCenter
  const customCollisionDetection: CollisionDetection = useCallback((args) => {
    // 先尝试 pointerWithin - 指针在目标区域内
    const pointerCollisions = pointerWithin(args)
    if (pointerCollisions.length > 0) {
      return pointerCollisions
    }
    // 回退到 closestCenter - 找最近的中心点
    return closestCenter(args)
  }, [])

  // 加载当前等级总词汇量
  useEffect(() => {
    getWordListInfo(settings.currentGrade)
      .then((info) => setTotalWordsInGrade(info.totalWords))
      .catch(() => setTotalWordsInGrade(0))
  }, [settings.currentGrade])

  // 加载邀请码
  useEffect(() => {
    getUserInviteCode()
      .then((code) => {
        if (code) setInviteCode(code)
      })
      .catch(() => {})
  }, [])

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

  // 点击格子高亮整个单词
  const handleCellClick = useCallback(
    (cellId: string) => {
      if (!currentPuzzle) return

      // 找到包含此格子的单词
      const word = currentPuzzle.words.find((w) =>
        w.cells.some((c) => c.id === cellId)
      )

      if (word) {
        // 高亮该单词的所有格子
        const cellIds = new Set(word.cells.map((c) => c.id))
        setHighlightedCells(cellIds)

        // 3秒后清除高亮
        setTimeout(() => {
          setHighlightedCells(new Set())
        }, 3000)
      }
    },
    [currentPuzzle]
  )

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
      // 注意：此时 useGame 的 handleLevelComplete 可能还未更新 progress
      // 所以需要手动计算包含本关新学单词的 learnedWords
      const progress = getCurrentProgress()
      const newWordIds = currentWords.map((w) => w.id)

      // 计算更新后的 learnedWords（如果没用帮助，加入本关单词）
      const updatedLearnedWords = isHelpUsed
        ? progress.learnedWords
        : [...new Set([...progress.learnedWords, ...newWordIds])]

      const badgeCtx = {
        stats,
        progress: {
          ...progress,
          learnedWords: updatedLearnedWords,
          completedLevels: progress.completedLevels + 1,
        },
        wordListMode: settings.wordListMode,
        totalWordsInGrade,
        currentLevel: settings.currentGrade,
      }
      const newBadges = checkNewBadges(badgeCtx, earnedBadges)

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

      // 后台同步进度到云端
      uploadProgress().catch((err) => {
        console.error('同步进度失败:', err)
      })
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
      collisionDetection={customCollisionDetection}
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
          isTutorialLevel={isTutorialLevel}
        />

        {/* 帮助提示（显示单词） */}
        {revealedWords.length > 0 && (
          <div className={`px-4 py-2 text-center ${isTutorialLevel ? 'bg-green-100' : 'bg-yellow-100'}`}>
            <p className={`text-sm ${isTutorialLevel ? 'text-green-800' : 'text-yellow-800'}`}>
              {isTutorialLevel
                ? (lang === 'zh' ? '教学模式 - 答案已显示，跟着拼写练习吧！' : 'Tutorial Mode - Answers shown, practice spelling!')
                : t('game.helpUsed', lang)}
              :{' '}
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
            highlightedCells={highlightedCells}
            onRemoveLetter={removeLetter}
            onCellClick={handleCellClick}
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
          onShare={() => {
            setShowBadgeModal(false)
            setShowShareBadgeModal(true)
          }}
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

            <div className="flex gap-2">
              <Button
                onClick={() => setShowShareLevelModal(true)}
                variant="secondary"
                className="flex-1"
              >
                {lang === 'zh' ? '分享' : 'Share'}
              </Button>
              <Button onClick={handleNextLevel} size="lg" className="flex-1">
                {lang === 'zh' ? '下一关' : 'Next'}
              </Button>
            </div>
          </div>
        </Modal>

        {/* 通关分享弹窗 */}
        <ShareModal
          isOpen={showShareLevelModal}
          onClose={() => setShowShareLevelModal(false)}
          lang={lang}
          inviteCode={inviteCode}
        >
          <LevelShareCard
            level={currentLevel}
            words={currentWords}
            nickname={userNickname}
            lang={lang}
            inviteCode={inviteCode}
          />
        </ShareModal>

        {/* 勋章分享弹窗 */}
        {newBadge && (
          <ShareModal
            isOpen={showShareBadgeModal}
            onClose={() => setShowShareBadgeModal(false)}
            lang={lang}
            inviteCode={inviteCode}
          >
            <BadgeShareCard
              badge={newBadge}
              nickname={userNickname}
              lang={lang}
              inviteCode={inviteCode}
            />
          </ShareModal>
        )}
      </div>
    </DndContext>
  )
}
