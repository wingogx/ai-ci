/**
 * 设备认证服务
 *
 * 零登录门槛方案：
 * 1. 首次访问自动生成设备ID
 * 2. 基于设备ID创建匿名用户
 * 3. 用户可选择设置昵称
 * 4. 后期可绑定真实账号实现跨设备同步
 */

import { getSupabaseClient } from '@/lib/supabase'
import { getCityWithCache } from '@/lib/geo'
import type { User } from '@/types/database'

const DEVICE_ID_KEY = 'wordduck_device_id'
const INVITE_CODE_KEY = 'wordduck_pending_invite'

/**
 * 生成设备唯一ID
 */
function generateDeviceId(): string {
  const timestamp = Date.now().toString(36)
  const randomPart = Math.random().toString(36).substring(2, 10)
  const browserPart = typeof navigator !== 'undefined'
    ? (navigator.userAgent.length % 1000).toString(36)
    : 'srv'
  return `${timestamp}-${randomPart}-${browserPart}`.toUpperCase()
}

/**
 * 获取或创建设备ID
 */
export function getDeviceId(): string {
  if (typeof window === 'undefined') {
    return 'server'
  }

  let deviceId = localStorage.getItem(DEVICE_ID_KEY)
  if (!deviceId) {
    deviceId = generateDeviceId()
    localStorage.setItem(DEVICE_ID_KEY, deviceId)
  }
  return deviceId
}

/**
 * 存储待绑定的邀请码
 */
export function storePendingInviteCode(code: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(INVITE_CODE_KEY, code.toUpperCase())
  }
}

/**
 * 获取并清除待绑定的邀请码
 */
export function consumePendingInviteCode(): string | null {
  if (typeof window === 'undefined') {
    return null
  }
  const code = localStorage.getItem(INVITE_CODE_KEY)
  if (code) {
    localStorage.removeItem(INVITE_CODE_KEY)
  }
  return code
}

/**
 * 初始化设备用户
 * 首次访问时自动创建匿名用户
 */
export async function initializeDeviceUser(): Promise<User | null> {
  const supabase = getSupabaseClient()
  const deviceId = getDeviceId()

  // 先检查是否已有登录的用户
  const { data: { user: authUser } } = await supabase.auth.getUser()

  if (authUser) {
    // 已登录，获取用户信息
    const { data: users } = await supabase.rpc('get_user_by_id', {
      p_user_id: authUser.id
    })
    return users?.[0] || null
  }

  // 未登录，使用匿名登录
  const { data: anonData, error: anonError } = await supabase.auth.signInAnonymously({
    options: {
      data: {
        device_id: deviceId,
        nickname: '学习者',
      }
    }
  })

  if (anonError) {
    console.error('匿名登录失败:', anonError)
    return null
  }

  if (!anonData.user) {
    return null
  }

  // 处理待绑定的邀请码
  const pendingInvite = consumePendingInviteCode()
  if (pendingInvite) {
    await supabase.rpc('bind_invitation', {
      invitee_user_id: anonData.user.id,
      inviter_code: pendingInvite,
    })
  }

  // 获取并保存用户城市
  const city = await getCityWithCache()
  if (city) {
    await supabase.rpc('update_user_city', {
      p_user_id: anonData.user.id,
      p_city: city,
    })
  }

  // 获取创建的用户信息
  const { data: users } = await supabase.rpc('get_user_by_id', {
    p_user_id: anonData.user.id
  })

  return users?.[0] || null
}

/**
 * 获取当前用户
 */
export async function getCurrentDeviceUser(): Promise<User | null> {
  const supabase = getSupabaseClient()

  const { data: { user: authUser } } = await supabase.auth.getUser()

  if (!authUser) {
    return null
  }

  const { data: users } = await supabase.rpc('get_user_by_id', {
    p_user_id: authUser.id
  })

  return users?.[0] || null
}

/**
 * 更新用户昵称
 */
export async function updateNickname(nickname: string): Promise<User | null> {
  const supabase = getSupabaseClient()

  const { data: { user: authUser } } = await supabase.auth.getUser()

  if (!authUser) {
    return null
  }

  const { data: users, error } = await supabase.rpc('update_user_nickname', {
    p_user_id: authUser.id,
    p_nickname: nickname
  })

  if (error) {
    console.error('更新昵称失败:', error)
    return null
  }

  return users?.[0] || null
}

/**
 * 获取用户邀请码
 */
export async function getUserInviteCode(): Promise<string | null> {
  const supabase = getSupabaseClient()

  const { data: { user: authUser } } = await supabase.auth.getUser()

  if (!authUser) {
    return null
  }

  const { data } = await supabase.rpc('get_user_invite_code', {
    p_user_id: authUser.id
  })

  return data || null
}

/**
 * 获取邀请统计
 */
export async function getInviteStats(): Promise<{
  totalInvites: number
  level5Invites: number
  level20Invites: number
}> {
  const supabase = getSupabaseClient()

  const { data: { user: authUser } } = await supabase.auth.getUser()

  if (!authUser) {
    return { totalInvites: 0, level5Invites: 0, level20Invites: 0 }
  }

  const { data: invitations } = await supabase
    .from('invitations')
    .select('status')
    .eq('inviter_id', authUser.id)

  if (!invitations) {
    return { totalInvites: 0, level5Invites: 0, level20Invites: 0 }
  }

  return {
    totalInvites: invitations.length,
    level5Invites: invitations.filter((i: { status: string }) => i.status === 'level5' || i.status === 'level20').length,
    level20Invites: invitations.filter((i: { status: string }) => i.status === 'level20').length,
  }
}

/**
 * 检查是否为匿名用户
 */
export async function isAnonymousUser(): Promise<boolean> {
  const supabase = getSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()

  return user?.is_anonymous ?? true
}

/**
 * 将匿名账户升级为正式账户（后期功能）
 */
export async function upgradeToFullAccount(provider: 'google' | 'apple' | 'github') {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase.auth.linkIdentity({
    provider,
    options: {
      redirectTo: `${window.location.origin}/auth/callback?upgrade=true`,
    }
  })

  if (error) {
    console.error('账户升级失败:', error)
    throw error
  }

  return data
}
