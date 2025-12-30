'use client'

import { useCallback, useRef } from 'react'

/**
 * 发音 Hook
 * 使用 Web Speech API 的 TTS 功能
 */
export function useSpeech() {
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  /**
   * 检查浏览器是否支持 TTS
   */
  const isSupported = useCallback(() => {
    return typeof window !== 'undefined' && 'speechSynthesis' in window
  }, [])

  /**
   * 停止当前播放
   */
  const stop = useCallback(() => {
    if (isSupported()) {
      speechSynthesis.cancel()
    }
  }, [isSupported])

  /**
   * 发音单个单词
   */
  const speak = useCallback(
    (text: string, options?: { rate?: number; lang?: string }) => {
      if (!isSupported()) {
        console.warn('浏览器不支持 TTS')
        return
      }

      // 停止之前的播放
      stop()

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = options?.lang || 'en-US'
      utterance.rate = options?.rate || 0.9 // 稍慢一点，适合学习
      utterance.pitch = 1
      utterance.volume = 1

      utteranceRef.current = utterance
      speechSynthesis.speak(utterance)
    },
    [isSupported, stop]
  )

  /**
   * 依次发音多个单词
   */
  const speakWords = useCallback(
    async (
      words: string[],
      options?: { rate?: number; lang?: string; interval?: number }
    ) => {
      if (!isSupported() || words.length === 0) return

      const interval = options?.interval || 1500 // 单词间隔

      for (let i = 0; i < words.length; i++) {
        speak(words[i], options)

        // 等待一段时间再播放下一个
        if (i < words.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, interval))
        }
      }
    },
    [isSupported, speak]
  )

  /**
   * 等待当前播放完成
   */
  const waitForEnd = useCallback(() => {
    return new Promise<void>((resolve) => {
      if (!utteranceRef.current) {
        resolve()
        return
      }

      utteranceRef.current.onend = () => resolve()
      utteranceRef.current.onerror = () => resolve()
    })
  }, [])

  return {
    speak,
    speakWords,
    stop,
    isSupported: isSupported(),
    waitForEnd,
  }
}

export default useSpeech
