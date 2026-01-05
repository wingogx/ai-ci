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

    // 克隆元素以避免修改原始 DOM
    const clone = element.cloneNode(true) as HTMLElement
    clone.style.position = 'absolute'
    clone.style.left = '-9999px'
    clone.style.top = '0'
    document.body.appendChild(clone)

    try {
      const canvas = await html2canvas(clone, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: true, // 开启日志以便调试
        foreignObjectRendering: false,
        removeContainer: true,
        // 忽略某些可能导致问题的元素
        ignoreElements: (el) => {
          return el.tagName === 'IFRAME' || el.tagName === 'VIDEO'
        },
      })

      document.body.removeChild(clone)

      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          if (!blob) {
            console.error('canvas.toBlob 返回 null')
          }
          resolve(blob)
        }, 'image/png', 1.0)
      })
    } catch (err) {
      document.body.removeChild(clone)
      throw err
    }
  } catch (err) {
    console.error('生成图片失败:', err)
    return null
  }
}

/**
 * 分享到微信
 * 移动端使用 Web Share API，微信浏览器内返回特殊标记让用户长按保存
 */
export async function shareToWeChat(
  imageBlob: Blob,
  _text: string,
  _url: string
): Promise<{ needLongPress: boolean }> {
  // 微信内置浏览器：无法自动下载，需要用户长按图片保存
  if (isWeChatBrowser()) {
    return { needLongPress: true }
  }

  // 其他环境使用通用下载方式
  await downloadImage(imageBlob, 'wordduck-share.png')
  return { needLongPress: false }
}

/**
 * 下载图片
 * 移动端优先使用 Web Share API，降级为打开新窗口
 */
export async function downloadImage(blob: Blob, filename: string): Promise<void> {
  // 移动端优先使用 Web Share API
  if (isMobile() && navigator.share && navigator.canShare) {
    try {
      const file = new File([blob], filename, { type: 'image/png' })
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'WordDuck',
        })
        return
      }
    } catch (err) {
      // 用户取消或不支持，继续尝试其他方式
      if ((err as Error).name === 'AbortError') {
        return // 用户取消，不继续
      }
      console.log('Web Share API 失败，尝试其他方式')
    }
  }

  // iOS Safari 特殊处理：在新标签页打开图片，提示长按保存
  if (isIOS()) {
    const url = URL.createObjectURL(blob)
    // 直接打开图片 URL，用户可以长按保存
    window.open(url, '_blank')
    // 延迟释放 URL，给用户足够时间保存
    setTimeout(() => URL.revokeObjectURL(url), 60000)
    return
  }

  // 桌面端或 Android：使用传统下载方式
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
 * 检测是否为移动端
 */
function isMobile(): boolean {
  if (typeof window === 'undefined') return false
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
}

/**
 * 检测是否为 iOS
 */
function isIOS(): boolean {
  if (typeof window === 'undefined') return false
  return /iPhone|iPad|iPod/i.test(navigator.userAgent)
}

/**
 * 检测是否为微信内置浏览器
 */
export function isWeChatBrowser(): boolean {
  if (typeof window === 'undefined') return false
  return /MicroMessenger/i.test(navigator.userAgent)
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
