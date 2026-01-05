/**
 * 分享相关工具函数
 */

/**
 * 复制文本到剪贴板
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    // 优先使用 Clipboard API
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    }

    // 降级方案：使用 execCommand
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.style.position = 'fixed'
    textArea.style.left = '-9999px'
    textArea.style.top = '-9999px'
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()

    const success = document.execCommand('copy')
    document.body.removeChild(textArea)
    return success
  } catch (err) {
    console.error('复制失败:', err)
    return false
  }
}

/**
 * 生成分享图片
 * 使用 html2canvas 将 DOM 元素转换为图片
 */
export async function generateShareImage(element: HTMLElement): Promise<Blob | null> {
  try {
    // 动态导入 html2canvas
    const html2canvas = (await import('html2canvas')).default

    const canvas = await html2canvas(element, {
      scale: 2, // 高清
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    })

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob)
      }, 'image/png', 1.0)
    })
  } catch (err) {
    console.error('生成图片失败:', err)
    return null
  }
}

/**
 * 分享到微信
 * 由于微信限制，实际实现是下载图片供用户手动分享
 */
export async function shareToWeChat(
  imageBlob: Blob,
  _text: string,
  _url: string
): Promise<void> {
  // 微信内置浏览器可能支持 JSSDK
  // 但通用方案是让用户保存图片后手动分享
  await downloadImage(imageBlob, 'wordduck-share.png')
}

/**
 * 下载图片
 */
export async function downloadImage(blob: Blob, filename: string): Promise<void> {
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.style.display = 'none'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  // 释放 URL
  setTimeout(() => URL.revokeObjectURL(url), 100)
}

/**
 * 使用 Web Share API 分享（移动端）
 */
export async function shareNative(data: {
  title?: string
  text?: string
  url?: string
  files?: File[]
}): Promise<boolean> {
  try {
    if (navigator.share) {
      await navigator.share(data)
      return true
    }
    return false
  } catch (err) {
    // 用户取消分享不算错误
    if ((err as Error).name === 'AbortError') {
      return false
    }
    console.error('分享失败:', err)
    return false
  }
}

/**
 * 检查是否支持原生分享
 */
export function canShareNative(): boolean {
  return typeof navigator !== 'undefined' && !!navigator.share
}
