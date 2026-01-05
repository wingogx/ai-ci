'use client'

import { useState } from 'react'
import { Modal, Button } from '@/components/ui'
import { t } from '@/i18n'
import { updateNickname } from '@/lib/auth/deviceAuth'
import type { Language } from '@/types'

interface NicknameModalProps {
  isOpen: boolean
  onClose: () => void
  currentNickname: string
  lang: Language
  onSuccess?: (newNickname: string) => void
}

export function NicknameModal({
  isOpen,
  onClose,
  currentNickname,
  lang,
  onSuccess,
}: NicknameModalProps) {
  const [nickname, setNickname] = useState(currentNickname)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    const trimmed = nickname.trim()
    if (!trimmed) {
      setError(t('auth.nicknameEmpty', lang))
      return
    }
    if (trimmed.length > 20) {
      setError(t('auth.nicknameTooLong', lang))
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const user = await updateNickname(trimmed)
      if (user) {
        onSuccess?.(trimmed)
        onClose()
      } else {
        setError(t('auth.nicknameFailed', lang))
      }
    } catch (err) {
      setError(t('auth.nicknameFailed', lang))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6 max-w-sm mx-auto">
        <h2 className="text-xl font-bold text-center mb-4">
          {t('auth.setNickname', lang)}
        </h2>

        <input
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder={t('auth.nicknamePlaceholder', lang)}
          maxLength={20}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-lg"
          autoFocus
        />

        <p className="text-gray-400 text-xs text-center mt-2">
          {t('auth.nicknameHint', lang)}
        </p>

        {error && (
          <p className="text-red-500 text-sm text-center mt-3">{error}</p>
        )}

        <div className="flex gap-3 mt-6">
          <Button
            onClick={onClose}
            variant="secondary"
            className="flex-1"
            disabled={isLoading}
          >
            {t('common.cancel', lang)}
          </Button>
          <Button
            onClick={handleSave}
            className="flex-1"
            disabled={isLoading || !nickname.trim()}
          >
            {isLoading ? t('common.loading', lang) : t('common.save', lang)}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
