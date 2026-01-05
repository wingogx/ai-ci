import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// 微信开放平台配置
const WECHAT_OPEN_APP_ID = process.env.WECHAT_OPEN_APP_ID || ''
const WECHAT_OPEN_APP_SECRET = process.env.WECHAT_OPEN_APP_SECRET || ''

// 微信公众号配置
const WECHAT_MP_APP_ID = process.env.WECHAT_MP_APP_ID || ''
const WECHAT_MP_APP_SECRET = process.env.WECHAT_MP_APP_SECRET || ''

interface WechatTokenResponse {
  access_token: string
  expires_in: number
  refresh_token: string
  openid: string
  scope: string
  unionid?: string
  errcode?: number
  errmsg?: string
}

interface WechatUserInfo {
  openid: string
  nickname: string
  sex: number
  province: string
  city: string
  country: string
  headimgurl: string
  privilege: string[]
  unionid?: string
  errcode?: number
  errmsg?: string
}

/**
 * 通过 code 获取 access_token
 */
async function getAccessToken(code: string, isMP: boolean): Promise<WechatTokenResponse> {
  const appId = isMP ? WECHAT_MP_APP_ID : WECHAT_OPEN_APP_ID
  const appSecret = isMP ? WECHAT_MP_APP_SECRET : WECHAT_OPEN_APP_SECRET

  const url = `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${appId}&secret=${appSecret}&code=${code}&grant_type=authorization_code`

  const response = await fetch(url)
  return response.json()
}

/**
 * 获取微信用户信息
 */
async function getWechatUserInfo(accessToken: string, openid: string): Promise<WechatUserInfo> {
  const url = `https://api.weixin.qq.com/sns/userinfo?access_token=${accessToken}&openid=${openid}&lang=zh_CN`

  const response = await fetch(url)
  return response.json()
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const inviteCode = searchParams.get('invite')
  const isMP = searchParams.get('mp') === '1'

  if (!code) {
    return NextResponse.redirect(`${origin}/?error=wechat_auth_failed`)
  }

  try {
    // 1. 获取 access_token
    const tokenData = await getAccessToken(code, isMP)

    if (tokenData.errcode) {
      console.error('获取微信 token 失败:', tokenData.errmsg)
      return NextResponse.redirect(`${origin}/?error=wechat_token_failed`)
    }

    // 2. 获取用户信息
    const userInfo = await getWechatUserInfo(tokenData.access_token, tokenData.openid)

    if (userInfo.errcode) {
      console.error('获取微信用户信息失败:', userInfo.errmsg)
      return NextResponse.redirect(`${origin}/?error=wechat_userinfo_failed`)
    }

    // 3. 使用 Supabase 创建或登录用户
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // Ignore errors
            }
          },
        },
      }
    )

    // 使用微信 openid 作为邮箱的一部分创建用户（一种变通方案）
    // 更好的方案是使用 Supabase 的自定义 JWT
    const wechatEmail = `wx_${tokenData.openid}@wordduck.local`

    // 尝试用 openid 查找现有用户
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('wechat_openid' as never, tokenData.openid)
      .single()

    if (existingUser) {
      // 用户已存在，直接设置 session
      // 注意：这里需要使用 admin API 或自定义 token
      // 实际实现需要 Supabase Edge Functions 或后端服务
    } else {
      // 创建新用户（匿名登录 + 更新微信信息）
      const { data: anonData, error: anonError } = await supabase.auth.signInAnonymously()

      if (anonError || !anonData.user) {
        return NextResponse.redirect(`${origin}/?error=create_user_failed`)
      }

      // 更新用户的微信信息
      await (supabase as ReturnType<typeof createServerClient>)
        .from('users')
        .update({
          nickname: userInfo.nickname,
          avatar_url: userInfo.headimgurl,
        })
        .eq('id', anonData.user.id)

      // 处理邀请码
      if (inviteCode) {
        await supabase.rpc('bind_invitation', {
          invitee_user_id: anonData.user.id,
          inviter_code: inviteCode.toUpperCase(),
        })
      }
    }

    return NextResponse.redirect(`${origin}/`)
  } catch (error) {
    console.error('微信登录处理失败:', error)
    return NextResponse.redirect(`${origin}/?error=wechat_auth_error`)
  }
}
