/**
 * 分享功能工具库
 */

import html2canvas from 'html2canvas'

/**
 * 将 DOM 元素转换为图片
 */
export async function generateShareImage(element: HTMLElement): Promise<Blob> {
  const canvas = await html2canvas(element, {
    backgroundColor: null,
    scale: 2, // 2x 清晰度
    useCORS: true,
    allowTaint: true,
    logging: false,
  })

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error('Failed to generate image'))
        }
      },
      'image/png',
      1.0
    )
  })
}

/**
 * 下载图片
 */
export async function downloadImage(blob: Blob, filename: string): Promise<void> {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * 复制文本到剪贴板
 */
export async function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    await navigator.clipboard.writeText(text)
  } else {
    // 降级方案
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.left = '-9999px'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
  }
}

/**
 * 使用 Web Share API 分享
 */
export async function shareNative(options: {
  title?: string
  text?: string
  url?: string
  files?: File[]
}): Promise<boolean> {
  if (!navigator.share) {
    return false
  }

  try {
    await navigator.share(options)
    return true
  } catch (err) {
    // 用户取消分享不算错误
    if ((err as Error).name === 'AbortError') {
      return true
    }
    console.error('分享失败:', err)
    return false
  }
}

/**
 * 分享到微信
 * 由于微信 JS-SDK 限制，这里提供多种降级方案
 */
export async function shareToWeChat(
  imageBlob: Blob,
  text: string,
  url: string
): Promise<void> {
  // 检查是否在微信浏览器中
  const isWechat = /micromessenger/i.test(navigator.userAgent)

  if (isWechat) {
    // 微信内：尝试使用 Web Share API（iOS 微信支持）
    const file = new File([imageBlob], 'share.png', { type: 'image/png' })

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      const shared = await shareNative({
        title: '爱词鸭',
        text,
        files: [file],
      })
      if (shared) return
    }

    // 降级：提示用户长按保存图片
    const imageUrl = URL.createObjectURL(imageBlob)
    const modal = document.createElement('div')
    modal.innerHTML = `
      <div style="position:fixed;inset:0;background:rgba(0,0,0,0.8);z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px;">
        <img src="${imageUrl}" style="max-width:90%;max-height:60vh;border-radius:12px;" />
        <p style="color:white;margin-top:20px;text-align:center;">长按图片保存后分享给好友</p>
        <button style="margin-top:20px;padding:10px 30px;background:#07C160;color:white;border:none;border-radius:20px;font-size:16px;">我知道了</button>
      </div>
    `
    document.body.appendChild(modal)
    modal.querySelector('button')?.addEventListener('click', () => {
      document.body.removeChild(modal)
      URL.revokeObjectURL(imageUrl)
    })
  } else {
    // 非微信浏览器：尝试 Web Share API 或下载图片
    const file = new File([imageBlob], 'wordduck-share.png', { type: 'image/png' })

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await shareNative({
        title: '爱词鸭',
        text,
        url,
        files: [file],
      })
    } else {
      // 降级：下载图片
      await downloadImage(imageBlob, 'wordduck-share.png')
    }
  }
}

/**
 * 检查 Web Share API 是否可用
 */
export function isShareSupported(): boolean {
  return typeof navigator !== 'undefined' && !!navigator.share
}

/**
 * 检查是否支持分享文件
 */
export function isFileShareSupported(): boolean {
  if (typeof navigator === 'undefined' || !navigator.canShare) {
    return false
  }

  try {
    const testFile = new File(['test'], 'test.png', { type: 'image/png' })
    return navigator.canShare({ files: [testFile] })
  } catch {
    return false
  }
}
