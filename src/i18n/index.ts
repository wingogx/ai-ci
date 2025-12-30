import { zh } from './zh'
import { en } from './en'
import type { Language } from '@/types'

// 翻译资源
const resources = {
  zh,
  en,
}

type TranslationKeys = typeof zh
type NestedKeyOf<ObjectType extends object> = {
  [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object
    ? `${Key}` | `${Key}.${NestedKeyOf<ObjectType[Key]>}`
    : `${Key}`
}[keyof ObjectType & (string | number)]

type TranslationKey = NestedKeyOf<TranslationKeys>

/**
 * 获取嵌套对象的值
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce((acc: unknown, part: string) => {
    if (acc && typeof acc === 'object' && part in acc) {
      return (acc as Record<string, unknown>)[part]
    }
    return undefined
  }, obj)
}

/**
 * 翻译函数
 * @param key 翻译键，支持嵌套如 'home.title'
 * @param lang 语言
 * @param params 插值参数
 */
export function t(
  key: TranslationKey | string,
  lang: Language = 'zh',
  params?: Record<string, string | number>
): string {
  const translation = getNestedValue(resources[lang], key)

  if (typeof translation !== 'string') {
    // 如果找不到翻译，返回 key
    console.warn(`Translation not found: ${key}`)
    return key
  }

  // 处理插值 {param}
  if (params) {
    return translation.replace(/\{(\w+)\}/g, (_, paramKey) => {
      return String(params[paramKey] ?? `{${paramKey}}`)
    })
  }

  return translation
}

/**
 * 创建特定语言的翻译函数
 */
export function createT(lang: Language) {
  return (key: TranslationKey | string, params?: Record<string, string | number>) =>
    t(key, lang, params)
}

export { zh, en, resources }
export default t
