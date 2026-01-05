'use client'

import { useState, useRef, useCallback, ReactNode, useEffect } from 'react'
import { Modal, Button } from '@/components/ui'
import { t } from '@/i18n'
import { generateShareImage, copyToClipboard, isWeChatBrowser } from '@/lib/share'

interface ShareModalProps {
  isOpen: boolean
  onClose: () => void
  lang: 'zh' | 'en'
  inviteCode?: string
  children: ReactNode // 分享卡片组件
}

type ShareAction = 'wechat' | 'copy' | null

export function ShareModal({
  isOpen,
  onClose,
  lang,
  inviteCode,
  children,
}: ShareModalProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState<ShareAction>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isInWeChat, setIsInWeChat] = useState(false)
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null)

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://wordduck.app'
  const shareUrl = inviteCode ? `${baseUrl}/invite/${inviteCode}` : baseUrl
  const shareText = t('share.inviteText', lang)

  // 检测是否在微信浏览器中
  useEffect(() => {
    setIsInWeChat(isWeChatBrowser())
  }, [])

  // 弹窗关闭时重置状态
  useEffect(() => {
    if (!isOpen) {
      if (generatedImageUrl) {
        URL.revokeObjectURL(generatedImageUrl)
      }
      setGeneratedImageUrl(null)
      setError(null)
      setCopied(false)
    }
  }, [isOpen, generatedImageUrl])

  const handleGenerateImage = useCallback(async () => {
    if (!cardRef.current) return null
    try {
      return await generateShareImage(cardRef.current)
    } catch (err) {
      console.error('生成图片失败:', err)
      setError(lang === 'zh' ? '生成图片失败' : 'Failed to generate image')
      return null
    }
  }, [lang])

  const handleWeChatShare = async () => {
    setLoading('wechat')
    setError(null)
    try {
      const imageBlob = await handleGenerateImage()
      if (!imageBlob) {
        setError(lang === 'zh' ? '生成图片失败，请重试' : 'Failed to generate image')
        return
      }
      // 生成图片 URL 显示出来，让用户长按保存
      const imageUrl = URL.createObjectURL(imageBlob)
      setGeneratedImageUrl(imageUrl)
    } catch (err) {
      console.error('分享失败:', err)
      setError(lang === 'zh' ? '生成失败，请重试' : 'Generation failed')
    } finally {
      setLoading(null)
    }
  }

  const handleCopyLink = async () => {
    setLoading('copy')
    setError(null)
    try {
      await copyToClipboard(`${shareText} ${shareUrl}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      setError(lang === 'zh' ? '复制失败' : 'Copy failed')
    } finally {
      setLoading(null)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-4 max-w-sm mx-auto">
        <h2 className="text-lg font-bold text-center mb-4">
          {t('share.title', lang)}
        </h2>

        {/* 分享卡片预览 / 生成的图片 */}
        <div className="flex justify-center mb-4">
          {generatedImageUrl ? (
            <img
              src={generatedImageUrl}
              alt="分享图片"
              className="max-w-full rounded-lg shadow-lg"
              style={{ maxHeight: '60vh' }}
            />
          ) : (
            <div ref={cardRef}>{children}</div>
          )}
        </div>

        {/* 微信浏览器长按提示 */}
        {generatedImageUrl && isInWeChat && (
          <div className="text-center text-sm text-amber-700 mb-4 bg-amber-50 p-3 rounded-lg border border-amber-200">
            {lang === 'zh'
              ? '👆 长按上方图片保存到相册'
              : '👆 Long press the image to save'}
          </div>
        )}

        {/* 分享按钮 */}
        <div className="space-y-3">
          {/* 微信内已生成图片时只显示复制链接 */}
          {!(isInWeChat && generatedImageUrl) && (
            /* 生成分享图片 */
            <Button
              onClick={handleWeChatShare}
              disabled={loading !== null}
              className="w-full bg-[#07C160] hover:bg-[#06AD56] text-white flex items-center justify-center gap-2"
            >
              <WeChatIcon />
              {loading === 'wechat'
                ? (lang === 'zh' ? '生成中...' : 'Generating...')
                : (lang === 'zh' ? '生成分享图片' : 'Generate Share Image')}
            </Button>
          )}

          {/* 复制链接 */}
          <Button
            onClick={handleCopyLink}
            disabled={loading !== null}
            variant="secondary"
            className="w-full flex items-center justify-center gap-2"
          >
            <CopyIcon />
            {copied
              ? t('share.copied', lang)
              : t('share.copyLink', lang)}
          </Button>
        </div>

        {error && (
          <p className="text-red-500 text-sm text-center mt-4">{error}</p>
        )}
      </div>
    </Modal>
  )
}

function WeChatIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 0 1 .598.082l1.584.926a.272.272 0 0 0 .14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 0 1-.023-.156.49.49 0 0 1 .201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-6.656-6.088V8.89c-.135-.01-.269-.03-.406-.03zm-2.53 3.274c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.97-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.969-.982z" />
    </svg>
  )
}

function CopyIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
      />
    </svg>
  )
}
