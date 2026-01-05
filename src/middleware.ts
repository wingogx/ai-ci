import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  const response = await updateSession(request)

  // 使用 Vercel 的地理位置功能获取用户城市
  // @ts-expect-error - Vercel Edge 提供的 geo 属性
  const geo = request.geo
  if (geo?.city) {
    // 将城市信息写入响应头，客户端可以读取
    response.headers.set('x-user-city', encodeURIComponent(geo.city))
    response.headers.set('x-user-country', geo.country || '')
    response.headers.set('x-user-region', geo.region || '')
  }

  return response
}

export const config = {
  matcher: [
    /*
     * 匹配所有路径，除了：
     * - _next/static (静态文件)
     * - _next/image (图片优化)
     * - favicon.ico (网站图标)
     * - 公共文件夹中的文件
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
