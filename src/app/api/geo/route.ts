import { NextRequest, NextResponse } from 'next/server'

/**
 * 获取用户地理位置
 * 使用 Vercel 的 Edge 地理位置功能
 */
export async function GET(request: NextRequest) {
  // Vercel 在 Edge 环境中提供 geo 信息
  // @ts-expect-error - Vercel Edge 提供的 geo 属性
  const geo = request.geo || {}

  // 也可以从请求头中获取 (Vercel 自动添加)
  const city = geo.city || request.headers.get('x-vercel-ip-city') || null
  const country = geo.country || request.headers.get('x-vercel-ip-country') || null
  const region = geo.region || request.headers.get('x-vercel-ip-country-region') || null

  return NextResponse.json({
    city: city ? decodeURIComponent(city) : null,
    country,
    region,
  })
}

// 使用 Edge Runtime 以获取 geo 信息
export const runtime = 'edge'
