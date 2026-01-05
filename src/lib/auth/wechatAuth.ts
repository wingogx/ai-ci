/**
 * 微信登录服务
 *
 * 支持两种场景：
 * 1. PC 端：微信扫码登录（需要微信开放平台）
 * 2. 微信内 H5：公众号网页授权（需要微信公众号）
 */

import { getSupabaseClient } from '@/lib/supabase'

// 微信开放平台配置（PC 扫码登录）
const WECHAT_OPEN_APP_ID = process.env.NEXT_PUBLIC_WECHAT_OPEN_APP_ID || ''
const WECHAT_REDIRECT_URI = process.env.NEXT_PUBLIC_WECHAT_REDIRECT_URI || ''

// 微信公众号配置（H5 登录）
const WECHAT_MP_APP_ID = process.env.NEXT_PUBLIC_WECHAT_MP_APP_ID || ''

/**
 * 检测是否在微信浏览器中
 */
export function isWechatBrowser(): boolean {
  if (typeof window === 'undefined') return false
  const ua = window.navigator.userAgent.toLowerCase()
  return ua.includes('micromessenger')
}

/**
 * 检测是否为移动设备
 */
export function isMobile(): boolean {
  if (typeof window === 'undefined') return false
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    window.navigator.userAgent
  )
}

/**
 * 生成 state 参数（防止 CSRF）
 */
function generateState(): string {
  const state = Math.random().toString(36).substring(2, 15)
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('wechat_oauth_state', state)
  }
  return state
}

/**
 * 验证 state 参数
 */
export function verifyState(state: string): boolean {
  if (typeof window === 'undefined') return false
  const savedState = sessionStorage.getItem('wechat_oauth_state')
  sessionStorage.removeItem('wechat_oauth_state')
  return savedState === state
}

/**
 * PC 端微信扫码登录
 * 跳转到微信开放平台授权页面
 */
export function redirectToWechatQRLogin(inviteCode?: string) {
  if (!WECHAT_OPEN_APP_ID) {
    console.error('未配置微信开放平台 AppID')
    return
  }

  const state = generateState()
  const redirectUri = encodeURIComponent(
    inviteCode
      ? `${WECHAT_REDIRECT_URI}?invite=${inviteCode}`
      : WECHAT_REDIRECT_URI
  )

  const url = `https://open.weixin.qq.com/connect/qrconnect?appid=${WECHAT_OPEN_APP_ID}&redirect_uri=${redirectUri}&response_type=code&scope=snsapi_login&state=${state}#wechat_redirect`

  window.location.href = url
}

/**
 * 微信内 H5 网页授权登录
 * 跳转到微信公众号授权页面
 */
export function redirectToWechatMPLogin(inviteCode?: string) {
  if (!WECHAT_MP_APP_ID) {
    console.error('未配置微信公众号 AppID')
    return
  }

  const state = generateState()
  const currentUrl = window.location.href.split('?')[0]
  const redirectUri = encodeURIComponent(
    inviteCode
      ? `${currentUrl}?invite=${inviteCode}`
      : currentUrl
  )

  const url = `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${WECHAT_MP_APP_ID}&redirect_uri=${redirectUri}&response_type=code&scope=snsapi_userinfo&state=${state}#wechat_redirect`

  window.location.href = url
}

/**
 * 智能选择微信登录方式
 */
export function initiateWechatLogin(inviteCode?: string) {
  if (isWechatBrowser()) {
    // 微信内浏览器使用公众号授权
    redirectToWechatMPLogin(inviteCode)
  } else {
    // PC/其他浏览器使用扫码登录
    redirectToWechatQRLogin(inviteCode)
  }
}

/**
 * 处理微信授权回调
 * 在 /api/auth/wechat/callback 中调用
 */
export async function handleWechatCallback(code: string, state: string) {
  // state 验证应该在后端进行
  // 这里返回需要发送到后端的数据
  return { code, state }
}

/**
 * 检查微信登录是否可用
 */
export function isWechatLoginAvailable(): boolean {
  return !!(WECHAT_OPEN_APP_ID || WECHAT_MP_APP_ID)
}

/**
 * 获取推荐的登录方式
 */
export function getRecommendedAuthMethod(): 'wechat_mp' | 'wechat_qr' | 'anonymous' {
  if (isWechatBrowser() && WECHAT_MP_APP_ID) {
    return 'wechat_mp'
  }
  if (WECHAT_OPEN_APP_ID) {
    return 'wechat_qr'
  }
  return 'anonymous'
}
