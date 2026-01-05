/**
 * IP 地理位置服务
 * 优先使用浏览器定位，降级使用 IP 定位
 */

interface GeoInfo {
  city: string | null
  region: string | null
  country: string | null
}

/**
 * 使用浏览器 Geolocation API 获取位置（最准确，需要用户授权）
 */
async function fetchFromBrowserGeo(): Promise<GeoInfo> {
  if (typeof window === 'undefined' || !navigator.geolocation) {
    throw new Error('浏览器不支持定位')
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords
          // 使用 BigDataCloud 免费反向地理编码 API
          const response = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=zh`
          )
          if (!response.ok) throw new Error('反向地理编码失败')
          const data = await response.json()
          resolve({
            city: data.city || data.locality || null,
            region: data.principalSubdivision || null,
            country: data.countryName || null,
          })
        } catch (err) {
          reject(err)
        }
      },
      (error) => {
        reject(new Error(`定位失败: ${error.message}`))
      },
      { timeout: 5000, maximumAge: 300000 } // 5秒超时，缓存5分钟
    )
  })
}

/**
 * 通过 Vercel Edge API 获取地理位置
 */
async function fetchFromVercelGeo(): Promise<GeoInfo> {
  const response = await fetch('/api/geo')
  if (!response.ok) {
    throw new Error('Vercel Geo API 请求失败')
  }
  return response.json()
}

/**
 * 通过 IP 获取地理位置
 * 优先使用浏览器定位，降级使用 Vercel/第三方服务
 */
export async function getGeoByIP(): Promise<GeoInfo> {
  const providers = [
    fetchFromBrowserGeo, // 浏览器定位，最准确
    fetchFromVercelGeo,  // Vercel Edge
    fetchFromIpApiCo,    // 第三方备用
  ]

  for (const provider of providers) {
    try {
      const result = await provider()
      if (result.city) {
        return result
      }
    } catch (err) {
      console.log('定位服务失败，尝试下一个:', err)
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
