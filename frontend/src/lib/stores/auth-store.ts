import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface UserRecord {
  email: string
  password: string
  createdAt: string
}

export interface LoginResult {
  success: boolean
  requiresSignUp?: boolean
  message?: string
}

interface AuthState {
  isAuthenticated: boolean
  token: string | null
  currentUser: { email: string } | null
  isLoading: boolean
  error: string | null
  lastAuthCheck: number | null
  isCheckingAuth: boolean
  hasHydrated: boolean
  authRequired: boolean | null
  setHasHydrated: (state: boolean) => void
  checkAuthRequired: () => Promise<boolean>
  login: (email: string, password: string) => Promise<LoginResult>
  signup: (email: string, password: string) => Promise<{ success: boolean; message?: string }>
  logout: () => void
  checkAuth: () => Promise<boolean>
}

const REGISTERED_USERS_KEY = 'registered_users'

function getRegisteredUsers(): UserRecord[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(REGISTERED_USERS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch (err) {
    console.error('Failed to parse registered users:', err)
    return []
  }
}

function saveRegisteredUsers(users: UserRecord[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(users))
  } catch (err) {
    console.error('Failed to save registered users:', err)
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      token: null,
      currentUser: null,
      isLoading: false,
      error: null,
      lastAuthCheck: null,
      isCheckingAuth: false,
      hasHydrated: false,
      authRequired: true,

      setHasHydrated: (state: boolean) => {
        set({ hasHydrated: state })
      },

      checkAuthRequired: async () => {
        set({ authRequired: true })
        return true
      },

      signup: async (email: string, password: string) => {
        set({ isLoading: true, error: null })
        const normalizedEmail = email.trim().toLowerCase()
        const users = getRegisteredUsers()

        const existingUser = users.find((u) => u.email.toLowerCase() === normalizedEmail)
        if (existingUser) {
          const errMsg = 'An account with this email already exists. Please sign in.'
          set({ isLoading: false, error: errMsg })
          return { success: false, message: errMsg }
        }

        const newUser: UserRecord = {
          email: normalizedEmail,
          password: password,
          createdAt: new Date().toISOString(),
        }

        users.push(newUser)
        saveRegisteredUsers(users)

        set({
          isAuthenticated: true,
          token: `token-${normalizedEmail}`,
          currentUser: { email: normalizedEmail },
          isLoading: false,
          error: null,
          lastAuthCheck: Date.now(),
        })

        return { success: true }
      },

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null })
        const normalizedEmail = email.trim().toLowerCase()
        const users = getRegisteredUsers()

        const foundUser = users.find((u) => u.email.toLowerCase() === normalizedEmail)

        if (!foundUser) {
          const errMsg = 'No account found with this email. Please sign up.'
          set({
            isLoading: false,
            error: errMsg,
            isAuthenticated: false,
            token: null,
            currentUser: null,
          })
          return { success: false, requiresSignUp: true, message: errMsg }
        }

        if (foundUser.password !== password) {
          const errMsg = 'Invalid password. Please check your credentials and try again.'
          set({
            isLoading: false,
            error: errMsg,
            isAuthenticated: false,
            token: null,
            currentUser: null,
          })
          return { success: false, requiresSignUp: false, message: errMsg }
        }

        set({
          isAuthenticated: true,
          token: `token-${normalizedEmail}`,
          currentUser: { email: normalizedEmail },
          isLoading: false,
          error: null,
          lastAuthCheck: Date.now(),
        })

        return { success: true }
      },

      logout: () => {
        set({
          isAuthenticated: false,
          token: null,
          currentUser: null,
          error: null,
        })
      },

      checkAuth: async () => {
        const { token, isAuthenticated } = get()
        if (!token || !isAuthenticated) {
          set({ isAuthenticated: false, token: null, currentUser: null })
          return false
        }
        return true
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        currentUser: state.currentUser,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    }
  )
)