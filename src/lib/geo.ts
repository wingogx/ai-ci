/**
 * IP 地理位置服务
 * 自动获取用户城市信息
 */

interface GeoInfo {
  city: string | null
  region: string | null
  country: string | null
}

/**
 * 通过 IP 获取地理位置
 * 使用多个免费服务作为降级方案
 */
export async function getGeoByIP(): Promise<GeoInfo> {
  // 尝试多个服务，按优先级（HTTPS 优先）
  const providers = [
    fetchFromIpApiCo,  // HTTPS，优先使用
    fetchFromIpApi,    // HTTP，仅限非 HTTPS 环境
  ]

  for (const provider of providers) {
    try {
      const result = await provider()
      if (result.city) {
        return result
      }
    } catch (err) {
      console.log('IP 定位服务失败，尝试下一个:', err)
    }
  }

  return { city: null, region: null, country: null }
}

/**
 * 使用 ipapi.co (HTTPS, 免费 1000次/天)
 */
async function fetchFromIpApiCo(): Promise<GeoInfo> {
  const response = await fetch('https://ipapi.co/json/', {
    headers: { 'Accept': 'application/json' }
  })

  if (!response.ok) {
    throw new Error('ipapi.co 请求失败')
  }

  const data = await response.json()

  return {
    city: data.city || null,
    region: data.region || null,
    country: data.country_name || null,
  }
}

/**
 * 使用 ip-api.com (HTTP, 免费 45次/分钟)
 * 仅在非 HTTPS 环境下可用
 */
async function fetchFromIpApi(): Promise<GeoInfo> {
  // 检查是否在 HTTPS 环境中
  if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
    throw new Error('ip-api.com 不支持 HTTPS')
  }

  const response = await fetch('http://ip-api.com/json/?lang=zh-CN&fields=status,city,regionName,country')

  if (!response.ok) {
    throw new Error('ip-api.com 请求失败')
  }

  const data = await response.json()

  if (data.status === 'success') {
    return {
      city: data.city || null,
      region: data.regionName || null,
      country: data.country || null,
    }
  }

  throw new Error('ip-api.com 返回失败状态')
}

/**
 * 获取城市名称（简化版）
 * 返回格式：城市名（如 "北京"、"上海"、"深圳"）
 */
export async function getCityName(): Promise<string | null> {
  const geo = await getGeoByIP()
  return geo.city
}

/**
 * 获取完整地区名称
 * 返回格式：省份 城市（如 "广东 深圳"）
 */
export async function getFullLocation(): Promise<string | null> {
  const geo = await getGeoByIP()

  if (!geo.city) return null

  // 如果是直辖市，只返回城市名
  const municipalities = ['北京', '上海', '天津', '重庆']
  if (municipalities.includes(geo.city)) {
    return geo.city
  }

  // 否则返回 "省份 城市" 格式
  if (geo.region && geo.city) {
    // 去掉省份后缀
    const region = geo.region.replace(/省|市|自治区|特别行政区/g, '')
    return `${region} ${geo.city}`
  }

  return geo.city
}

/**
 * 本地缓存城市信息
 */
const CITY_CACHE_KEY = 'wordduck_user_city'

export function getCachedCity(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(CITY_CACHE_KEY)
}

export function setCachedCity(city: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(CITY_CACHE_KEY, city)
}

/**
 * 获取城市（优先使用缓存）
 */
export async function getCityWithCache(): Promise<string | null> {
  // 先检查缓存
  const cached = getCachedCity()
  if (cached) return cached

  // 没有缓存则请求 IP 定位
  const city = await getCityName()
  if (city) {
    setCachedCity(city)
  }
  return city
}
