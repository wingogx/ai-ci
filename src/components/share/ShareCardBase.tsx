'use client'

import { forwardRef, ReactNode } from 'react'
import { QRCodeCanvas } from 'qrcode.react'

interface ShareCardBaseProps {
  children: ReactNode
  inviteCode?: string
  appUrl?: string
  showQR?: boolean
  className?: string
}

/**
 * 分享卡片基础组件
 * 所有分享卡片的通用布局
 */
export const ShareCardBase = forwardRef<HTMLDivElement, ShareCardBaseProps>(
  ({ children, inviteCode, appUrl, showQR = true, className = '' }, ref) => {
    const baseUrl = appUrl || process.env.NEXT_PUBLIC_APP_URL || 'https://wordduck.app'
    const inviteUrl = inviteCode
      ? `${baseUrl}/invite/${inviteCode}`
      : baseUrl

    return (
      <div
        ref={ref}
        className={`rounded-2xl p-6 w-[320px] shadow-lg ${className}`}
        style={{
          background: 'linear-gradient(to bottom right, #eff6ff, #e0e7ff)',
        }}
      >
        {/* 卡片内容 */}
        <div className="mb-4">{children}</div>

        {/* 底部：二维码 + 品牌 */}
        <div
          className="flex items-center justify-between pt-4"
          style={{ borderTop: '1px solid rgba(191, 219, 254, 0.5)' }}
        >
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
              style={{ backgroundColor: '#facc15' }}
            >
              🦆
            </div>
            <div>
              <div className="font-bold text-sm" style={{ color: '#1f2937' }}>爱词鸭</div>
              <div className="text-xs" style={{ color: '#6b7280' }}>WordDuck</div>
            </div>
          </div>

          {showQR && (
            <div className="p-1.5 rounded-lg shadow-sm" style={{ backgroundColor: '#ffffff' }}>
              <QRCodeCanvas
                value={inviteUrl}
                size={56}
                level="M"
                includeMargin={false}
              />
            </div>
          )}
        </div>
      </div>
    )
  }
)

ShareCardBase.displayName = 'ShareCardBase'
