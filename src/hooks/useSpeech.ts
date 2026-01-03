'use client'

import { useCallback, useRef, useState, useEffect } from 'react'

// 优先使用美式英语语音（按优先级排序）
const PREFERRED_VOICES = [
  'Samantha',           // macOS 美式英语女声
  'Alex',               // macOS 美式英语男声
  'Google US English',  // Chrome 美式英语
  'Microsoft Zira',     // Windows 美式英语女声
  'Microsoft David',    // Windows 美式英语男声
  'Ava',                // macOS 美式英语
  'Tom',                // macOS 美式英语
]

/**
 * 发音 Hook
 * 使用 Web Speech API 的 TTS 功能
 */
export function useSpeech() {
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const [preferredVoice, setPreferredVoice] = useState<SpeechSynthesisVoice | null>(null)

  /**
   * 检查浏览器是否支持 TTS
   */
  const isSupported = useCallback(() => {
    return typeof window !== 'undefined' && 'speechSynthesis' in window
  }, [])

  /**
   * 获取最佳语音（同步方法，用于发音时动态获取）
   * 优先选择美式英语 (en-US)
   */
  const getBestVoice = useCallback((): SpeechSynthesisVoice | null => {
    if (!isSupported()) return null

    const voices = speechSynthesis.getVoices()
    // 优先美式英语 (en-US)，其次其他英语
    const usVoices = voices.filter(v => v.lang === 'en-US' || v.lang === 'en_US')
    const englishVoices = voices.filter(v => v.lang.startsWith('en'))

    // 按优先级查找最佳美式语音
    for (const name of PREFERRED_VOICES) {
      const found = usVoices.find(v => v.name.includes(name))
      if (found) return found
    }

    // 尝试在所有英语语音中查找
    for (const name of PREFERRED_VOICES) {
      const found = englishVoices.find(v => v.name.includes(name))
      if (found) return found
    }

    // 没有优先语音，选择第一个美式英语语音
    if (usVoices.length > 0) return usVoices[0]
    return englishVoices.length > 0 ? englishVoices[0] : null
  }, [isSupported])

  /**
   * 加载并选择最佳语音
   */
  useEffect(() => {
    if (!isSupported()) return

    const loadVoices = () => {
      const voice = getBestVoice()
      if (voice) {
        setPreferredVoice(voice)
      }
    }

    // 语音列表可能异步加载
    loadVoices()
    speechSynthesis.onvoiceschanged = loadVoices
  }, [isSupported, getBestVoice])

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

      // 使用优选语音，如果还没加载则动态获取
      const voice = preferredVoice || getBestVoice()
      if (voice) {
        utterance.voice = voice
        utterance.lang = voice.lang
      } else {
        utterance.lang = options?.lang || 'en-US'
      }

      utterance.rate = options?.rate || 0.85 // 稍慢一点，更清晰
      utterance.pitch = 1
      utterance.volume = 1

      utteranceRef.current = utterance
      speechSynthesis.speak(utterance)
    },
    [isSupported, stop, preferredVoice, getBestVoice]
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
