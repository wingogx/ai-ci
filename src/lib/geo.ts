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
 * 使用免费的 ip-api.com 服务
 */
export async function getGeoByIP(): Promise<GeoInfo> {
  try {
    // ip-api.com 免费服务，每分钟 45 次请求限制
    const response = await fetch('http://ip-api.com/json/?lang=zh-CN&fields=status,city,regionName,country')

    if (!response.ok) {
      throw new Error('获取位置失败')
    }

    const data = await response.json()

    if (data.status === 'success') {
      return {
        city: data.city || null,
        region: data.regionName || null,
        country: data.country || null,
      }
    }

    return { city: null, region: null, country: null }
  } catch (err) {
    console.error('IP 定位失败:', err)
    return { city: null, region: null, country: null }
  }
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
