'use client'

import { Modal, Button } from '@/components/ui'
import { motion } from 'framer-motion'
import type { Language } from '@/types'

interface BadgeModalProps {
  isOpen: boolean
  onClose: () => void
  badge: {
    name: { zh: string; en: string }
    description: { zh: string; en: string }
    icon: string
  } | null
  language: Language
}

export function BadgeModal({
  isOpen,
  onClose,
  badge,
  language,
}: BadgeModalProps) {
  if (!badge) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col items-center text-center">
        {/* 勋章图标 */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', damping: 15, stiffness: 200 }}
          className="text-7xl mb-4"
        >
          {badge.icon}
        </motion.div>

        {/* 恭喜文字 */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-gray-500 text-sm mb-2"
        >
          {language === 'zh' ? '获得新勋章！' : 'New Badge Earned!'}
        </motion.p>

        {/* 勋章名称 */}
        <motion.h3
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-2xl font-bold text-gray-900 mb-2"
        >
          {badge.name[language]}
        </motion.h3>

        {/* 勋章描述 */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-gray-600 mb-6"
        >
          {badge.description[language]}
        </motion.p>

        {/* 关闭按钮 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Button onClick={onClose}>
            {language === 'zh' ? '太棒了！' : 'Awesome!'}
          </Button>
        </motion.div>
      </div>
    </Modal>
  )
}

export default BadgeModal
