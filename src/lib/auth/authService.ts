import { getSupabaseClient } from '@/lib/supabase'
import type { User } from '@/types/database'

export type AuthProvider = 'google' | 'apple' | 'github'

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
}

/**
 * OAuth 登录（Google、Apple、GitHub）
 */
export async function signInWithOAuth(provider: AuthProvider) {
  const supabase = getSupabaseClient()
  const redirectTo = `${window.location.origin}/auth/callback`

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
      queryParams: provider === 'google' ? {
        access_type: 'offline',
        prompt: 'consent',
      } : undefined,
    },
  })

  if (error) {
    console.error('OAuth 登录失败:', error)
    throw error
  }

  return data
}

/**
 * 手机号登录（发送验证码）
 */
export async function signInWithPhone(phone: string) {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase.auth.signInWithOtp({
    phone,
    options: {
      channel: 'sms',
    },
  })

  if (error) {
    console.error('发送验证码失败:', error)
    throw error
  }

  return data
}

/**
 * 验证手机验证码
 */
export async function verifyPhoneOtp(phone: string, token: string) {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase.auth.verifyOtp({
    phone,
    token,
    type: 'sms',
  })

  if (error) {
    console.error('验证码验证失败:', error)
    throw error
  }

  return data
}

/**
 * 匿名登录（游客模式）
 */
export async function signInAnonymously() {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase.auth.signInAnonymously()

  if (error) {
    console.error('匿名登录失败:', error)
    throw error
  }

  return data
}

/**
 * 登出
 */
export async function signOut() {
  const supabase = getSupabaseClient()

  const { error } = await supabase.auth.signOut()

  if (error) {
    console.error('登出失败:', error)
    throw error
  }
}

/**
 * 获取当前用户
 */
export async function getCurrentUser(): Promise<User | null> {
  const supabase = getSupabaseClient()

  const { data: { user: authUser } } = await supabase.auth.getUser()

  if (!authUser) {
    return null
  }

  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .single()

  if (error) {
    console.error('获取用户信息失败:', error)
    return null
  }

  return user
}

/**
 * 更新用户信息
 */
export async function updateUserProfile(updates: {
  nickname?: string
  avatar_url?: string
}) {
  const supabase = getSupabaseClient()

  const { data: { user: authUser } } = await supabase.auth.getUser()

  if (!authUser) {
    throw new Error('用户未登录')
  }

  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', authUser.id)
    .select()
    .single()

  if (error) {
    console.error('更新用户信息失败:', error)
    throw error
  }

  return data
}

/**
 * 绑定邀请关系
 */
export async function bindInviteCode(inviteCode: string): Promise<boolean> {
  const supabase = getSupabaseClient()

  const { data: { user: authUser } } = await supabase.auth.getUser()

  if (!authUser) {
    throw new Error('用户未登录')
  }

  const { data, error } = await supabase.rpc('bind_invitation', {
    invitee_user_id: authUser.id,
    inviter_code: inviteCode.toUpperCase(),
  })

  if (error) {
    console.error('绑定邀请码失败:', error)
    return false
  }

  return data
}

/**
 * 获取用户邀请码
 */
export async function getInviteCode(): Promise<string | null> {
  const supabase = getSupabaseClient()

  const { data: { user: authUser } } = await supabase.auth.getUser()

  if (!authUser) {
    return null
  }

  const { data, error } = await supabase
    .from('users')
    .select('invite_code')
    .eq('id', authUser.id)
    .single()

  if (error) {
    console.error('获取邀请码失败:', error)
    return null
  }

  return data?.invite_code
}

/**
 * 监听认证状态变化
 */
export function onAuthStateChange(callback: (user: User | null) => void) {
  const supabase = getSupabaseClient()

  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (_event: string, session: { user?: { id: string } } | null) => {
      if (session?.user) {
        const user = await getCurrentUser()
        callback(user)
      } else {
        callback(null)
      }
    }
  )

  return () => subscription.unsubscribe()
}
