'use client'

import { useAuthStore } from '@/lib/stores/auth-store'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export function useAuth() {
  const router = useRouter()
  const {
    isAuthenticated,
    currentUser,
    isLoading,
    login,
    signup,
    logout,
    checkAuth,
    checkAuthRequired,
    error,
    hasHydrated,
    authRequired
  } = useAuthStore()

  useEffect(() => {
    if (hasHydrated) {
      if (authRequired === null) {
        checkAuthRequired().then((required) => {
          if (required) {
            checkAuth()
          }
        })
      } else if (authRequired) {
        checkAuth()
      }
    }
  }, [hasHydrated, authRequired, checkAuthRequired, checkAuth])

  const redirectUser = () => {
    const redirectPath = sessionStorage.getItem('redirectAfterLogin')
    if (redirectPath) {
      sessionStorage.removeItem('redirectAfterLogin')
      router.push(redirectPath)
    } else {
      router.push('/notebooks')
    }
  }

  const handleLogin = async (email: string, password: string) => {
    const result = await login(email, password)
    if (result.success) {
      redirectUser()
    }
    return result
  }

  const handleSignup = async (email: string, password: string) => {
    const result = await signup(email, password)
    if (result.success) {
      redirectUser()
    }
    return result
  }

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  return {
    isAuthenticated,
    currentUser,
    isLoading: isLoading || !hasHydrated,
    error,
    login: handleLogin,
    signup: handleSignup,
    logout: handleLogout
  }
}