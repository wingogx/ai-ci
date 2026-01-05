import { create } from 'zustand'
import type { User } from '@/types/database'
import {
  getCurrentUser,
  signOut as authSignOut,
  onAuthStateChange,
} from '@/lib/auth/authService'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  isInitialized: boolean

  // Actions
  initialize: () => Promise<void>
  setUser: (user: User | null) => void
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  isInitialized: false,

  initialize: async () => {
    if (get().isInitialized) return

    set({ isLoading: true })

    try {
      const user = await getCurrentUser()
      set({
        user,
        isAuthenticated: !!user,
        isLoading: false,
        isInitialized: true,
      })

      // 监听认证状态变化
      onAuthStateChange((user) => {
        set({
          user,
          isAuthenticated: !!user,
        })
      })
    } catch (error) {
      console.error('初始化认证状态失败:', error)
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        isInitialized: true,
      })
    }
  },

  setUser: (user) => {
    set({
      user,
      isAuthenticated: !!user,
    })
  },

  signOut: async () => {
    try {
      await authSignOut()
      set({
        user: null,
        isAuthenticated: false,
      })
    } catch (error) {
      console.error('登出失败:', error)
      throw error
    }
  },
}))
