'use client'

import { useState } from 'react'
import { Modal, Button } from '@/components/ui'
import { t } from '@/i18n'
import { useUserStore } from '@/stores'
import {
  signInWithOAuth,
  signInAnonymously,
  isWechatLoginAvailable,
  initiateWechatLogin,
  isWechatBrowser,
} from '@/lib/auth'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
  inviteCode?: string
  onSuccess?: () => void
}

type LoginMethod = 'wechat' | 'google' | 'guest'

export function LoginModal({
  isOpen,
  onClose,
  inviteCode,
  onSuccess,
}: LoginModalProps) {
  const { settings } = useUserStore()
  const lang = settings.language
  const [isLoading, setIsLoading] = useState<LoginMethod | null>(null)
  const [error, setError] = useState<string | null>(null)

  // 根据语言推荐登录方式
  const isChineseUser = lang === 'zh'
  const showWechat = isWechatLoginAvailable() || isChineseUser
  const showGoogle = !isWechatBrowser() // 微信内浏览器不显示 Google

  const handleWechatLogin = async () => {
    setIsLoading('wechat')
    setError(null)
    try {
      initiateWechatLogin(inviteCode)
    } catch (err) {
      setError(t('auth.loginFailed', lang))
      setIsLoading(null)
    }
  }

  const handleGoogleLogin = async () => {
    setIsLoading('google')
    setError(null)
    try {
      await signInWithOAuth('google')
      // OAuth 会跳转，不需要处理 success
    } catch (err) {
      setError(t('auth.loginFailed', lang))
      setIsLoading(null)
    }
  }

  const handleGuestLogin = async () => {
    setIsLoading('guest')
    setError(null)
    try {
      await signInAnonymously()
      onSuccess?.()
      onClose()
    } catch (err) {
      setError(t('auth.loginFailed', lang))
      setIsLoading(null)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6 max-w-sm mx-auto">
        <h2 className="text-xl font-bold text-center mb-2">
          {t('auth.loginTitle', lang)}
        </h2>
        <p className="text-gray-500 text-center text-sm mb-6">
          {t('auth.loginSubtitle', lang)}
        </p>

        <div className="space-y-3">
          {/* 微信登录 - 中国用户优先显示 */}
          {showWechat && (
            <Button
              onClick={handleWechatLogin}
              disabled={isLoading !== null}
              className="w-full bg-[#07C160] hover:bg-[#06AD56] text-white flex items-center justify-center gap-2"
            >
              <WechatIcon />
              {isLoading === 'wechat'
                ? t('auth.loggingIn', lang)
                : t('auth.loginWithWechat', lang)}
            </Button>
          )}

          {/* Google 登录 - 国外用户优先显示 */}
          {showGoogle && (
            <Button
              onClick={handleGoogleLogin}
              disabled={isLoading !== null}
              className="w-full bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 flex items-center justify-center gap-2"
            >
              <GoogleIcon />
              {isLoading === 'google'
                ? t('auth.loggingIn', lang)
                : t('auth.loginWithGoogle', lang)}
            </Button>
          )}

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">
                {t('auth.or', lang)}
              </span>
            </div>
          </div>

          {/* 游客模式 */}
          <Button
            onClick={handleGuestLogin}
            disabled={isLoading !== null}
            variant="secondary"
            className="w-full"
          >
            {isLoading === 'guest'
              ? t('auth.loggingIn', lang)
              : t('auth.continueAsGuest', lang)}
          </Button>
        </div>

        {error && (
          <p className="text-red-500 text-sm text-center mt-4">{error}</p>
        )}

        <p className="text-gray-400 text-xs text-center mt-6">
          {t('auth.termsHint', lang)}
        </p>
      </div>
    </Modal>
  )
}

function WechatIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 0 1 .598.082l1.584.926a.272.272 0 0 0 .14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 0 1-.023-.156.49.49 0 0 1 .201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-6.656-6.088V8.89c-.135-.01-.269-.03-.406-.03zm-2.53 3.274c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.97-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.969-.982z" />
    </svg>
  )
}

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  )
}
