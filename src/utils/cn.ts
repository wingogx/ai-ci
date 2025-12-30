/**
 * 合并 className，过滤 falsy 值
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

export default cn
