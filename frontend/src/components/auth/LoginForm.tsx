'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/use-auth'
import { useAuthStore } from '@/lib/stores/auth-store'
import { getConfig } from '@/lib/config'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, UserPlus, LogIn, ArrowRight } from 'lucide-react'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { useTranslation } from '@/lib/hooks/use-translation'

export function LoginForm() {
  const { t, language } = useTranslation()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)
  const [showSignUpPrompt, setShowSignUpPrompt] = useState(false)

  const { login, signup, isLoading, error } = useAuth()
  const { hasHydrated, isAuthenticated } = useAuthStore()
  const [configInfo, setConfigInfo] = useState<{ apiUrl: string; version: string; buildTime: string } | null>(null)
  const router = useRouter()

  useEffect(() => {
    getConfig().then(cfg => {
      setConfigInfo({
        apiUrl: cfg.apiUrl,
        version: cfg.version,
        buildTime: cfg.buildTime,
      })
    }).catch(err => {
      console.error('Failed to load config:', err)
    })
  }, [])

  useEffect(() => {
    if (hasHydrated && isAuthenticated) {
      router.push('/notebooks')
    }
  }, [hasHydrated, isAuthenticated, router])

  if (!hasHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <LoadingSpinner />
      </div>
    )
  }

  const handleModeSwitch = (newMode: 'login' | 'signup') => {
    setMode(newMode)
    setLocalError(null)
    setShowSignUpPrompt(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError(null)
    setShowSignUpPrompt(false)

    if (!email.trim() || !password.trim()) {
      setLocalError('Please fill in both email and password.')
      return
    }

    if (mode === 'signup') {
      if (password !== confirmPassword) {
        setLocalError('Passwords do not match.')
        return
      }
      const res = await signup(email, password)
      if (!res.success && res.message) {
        setLocalError(res.message)
      }
    } else {
      const res = await login(email, password)
      if (!res.success) {
        if (res.requiresSignUp) {
          setShowSignUpPrompt(true)
        }
        if (res.message) {
          setLocalError(res.message)
        }
      }
    }
  }

  const displayError = localError || error

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 sm:p-8">
      <div className="w-full max-w-[960px] overflow-hidden rounded-[2.5rem] border border-white/70 bg-card/95 shadow-[0_26px_80px_rgba(25,24,21,0.08)]">
        <div className="grid min-h-[560px] md:grid-cols-[1.08fr_0.92fr]">
          <section className="flex flex-col justify-between bg-[linear-gradient(180deg,oklch(0.992_0.001_95),oklch(0.962_0.003_95))] p-8 sm:p-10">
            <div className="flex items-center justify-between gap-3 text-[11px] text-muted-foreground">
              <span className="font-medium tracking-normal">Open Notebook</span>
              <span className="rounded-full border bg-card/80 px-3 py-1 text-foreground">
                Private AI
              </span>
            </div>
            <div className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center py-12 text-center">
              <div className="mb-5 flex size-16 items-center justify-center rounded-full border border-white/80 bg-card shadow-sm">
                <span className="text-2xl font-semibold">ON</span>
              </div>
              <h1 className="text-balance text-4xl font-semibold leading-[1.05] tracking-normal text-foreground sm:text-5xl">
                Your research,
                <br />
                shaped quietly.
              </h1>
              <p className="mt-5 max-w-sm text-sm leading-6 text-muted-foreground">
                {mode === 'login'
                  ? 'Sign in to collect sources, build notebooks, and work with your AI assistant.'
                  : 'Create an account to save your notebooks, sources, and local AI sessions.'}
              </p>
            </div>
            <div className="flex items-center justify-between border-t border-border/70 pt-5 text-[11px] text-muted-foreground">
              <span>{configInfo ? `${t('common.version')} ${configInfo.version}` : 'Ready'}</span>
              <span>Local workspace</span>
            </div>
          </section>

          <section className="flex items-center justify-center border-t border-border/70 p-6 md:border-l md:border-t-0 sm:p-10">
            <Card className="w-full max-w-sm border-0 bg-transparent p-0 shadow-none">
              <CardHeader className="text-center pb-4">
                <div className="flex items-center justify-center gap-1 p-1 mb-4 rounded-xl bg-muted/60 text-xs">
                  <button
                    type="button"
                    onClick={() => handleModeSwitch('login')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg font-medium transition-all ${
                      mode === 'login'
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => handleModeSwitch('signup')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg font-medium transition-all ${
                      mode === 'signup'
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    Sign Up
                  </button>
                </div>
                <CardTitle className="text-2xl font-semibold">
                  {mode === 'login' ? 'Welcome Back' : 'Create an Account'}
                </CardTitle>
                <CardDescription>
                  {mode === 'login'
                    ? 'Enter your credentials to access your account'
                    : 'Fill in your details below to get started'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Email</label>
                    <Input
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoading}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Password</label>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                      required
                    />
                  </div>

                  {mode === 'signup' && (
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">Confirm Password</label>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={isLoading}
                        required
                      />
                    </div>
                  )}

                  {displayError && (
                    <div className="flex items-start gap-2 rounded-lg bg-red-500/10 p-3 text-red-600 text-sm border border-red-500/20">
                      <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 text-xs">{displayError}</div>
                    </div>
                  )}

                  {showSignUpPrompt && (
                    <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-center">
                      <p className="text-xs text-foreground mb-2 font-medium">
                        Don't have an account yet?
                      </p>
                      <Button
                        type="button"
                        variant="default"
                        size="sm"
                        onClick={() => handleModeSwitch('signup')}
                        className="w-full flex items-center justify-center gap-1.5"
                      >
                        Create Account Now
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading || !email.trim() || !password.trim() || (mode === 'signup' && !confirmPassword.trim())}
                  >
                    {isLoading
                      ? mode === 'login' ? 'Signing in...' : 'Creating account...'
                      : mode === 'login' ? 'Sign In' : 'Sign Up'}
                  </Button>

                  <div className="text-xs text-center text-muted-foreground pt-3 border-t">
                    {mode === 'login' ? (
                      <span>
                        Need an account?{' '}
                        <button
                          type="button"
                          onClick={() => handleModeSwitch('signup')}
                          className="font-medium text-foreground hover:underline"
                        >
                          Sign Up
                        </button>
                      </span>
                    ) : (
                      <span>
                        Already registered?{' '}
                        <button
                          type="button"
                          onClick={() => handleModeSwitch('login')}
                          className="font-medium text-foreground hover:underline"
                        >
                          Sign In
                        </button>
                      </span>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </div>
  )
}

