'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/use-auth'
import { useAuthStore } from '@/lib/stores/auth-store'
import { getConfig } from '@/lib/config'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { useTranslation } from '@/lib/hooks/use-translation'

export function LoginForm() {
  const { t, language } = useTranslation()
  const [password, setPassword] = useState('')
  const { login, isLoading, error } = useAuth()
  const { authRequired, checkAuthRequired, hasHydrated, isAuthenticated } = useAuthStore()
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [configInfo, setConfigInfo] = useState<{ apiUrl: string; version: string; buildTime: string } | null>(null)
  const router = useRouter()

  // Load config info for debugging
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

  // Check if authentication is required on mount
  useEffect(() => {
    if (!hasHydrated) {
      return
    }

    const checkAuth = async () => {
      try {
        const required = await checkAuthRequired()

        // If auth is not required, redirect to notebooks
        if (!required) {
          router.push('/notebooks')
        }
      } catch (error) {
        console.error('Error checking auth requirement:', error)
        // On error, assume auth is required to be safe
      } finally {
        setIsCheckingAuth(false)
      }
    }

    // If we already know auth status, use it
    if (authRequired !== null) {
      if (!authRequired && isAuthenticated) {
        router.push('/notebooks')
      } else {
        setIsCheckingAuth(false)
      }
    } else {
      void checkAuth()
    }
  }, [hasHydrated, authRequired, checkAuthRequired, router, isAuthenticated])

  // Show loading while checking if auth is required
  if (!hasHydrated || isCheckingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <LoadingSpinner />
      </div>
    )
  }

  // If we still don't know if auth is required (connection error), show error
  if (authRequired === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md rounded-[2rem] border-white/70 bg-card/95">
          <CardHeader className="text-center">
            <CardTitle>{t('common.connectionError')}</CardTitle>
            <CardDescription>
              {t('common.unableToConnect')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-2 text-red-600 text-sm">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  {error || t('auth.connectErrorHint')}
                </div>
              </div>

              {configInfo && (
                <div className="space-y-2 text-xs text-muted-foreground border-t pt-3">
                  <div className="font-medium">{t('common.diagnosticInfo')}:</div>
                  <div className="space-y-1 font-mono">
                    <div>{t('common.version')}: {configInfo.version}</div>
                    <div>{t('common.built')}: {new Date(configInfo.buildTime).toLocaleString(language === 'zh-CN' ? 'zh-CN' : language === 'zh-TW' ? 'zh-TW' : 'en-US')}</div>
                    <div className="break-all">{t('common.apiUrl')}: {configInfo.apiUrl}</div>
                    <div className="break-all">{t('common.frontendUrl')}: {typeof window !== 'undefined' ? window.location.href : 'N/A'}</div>
                  </div>
                  <div className="text-xs pt-2">
                    {t('common.checkConsoleLogs')}
                  </div>
                </div>
              )}

              <Button
                onClick={() => window.location.reload()}
                className="w-full"
              >
                {t('common.retryConnection')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.trim()) {
      try {
        await login(password)
      } catch (error) {
        console.error('Unhandled error during login:', error)
        // The auth store should handle most errors, but this catches any unhandled ones
      }
    }
  }

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
                Sign in to collect sources, build notebooks, and work with your AI assistant.
              </p>
            </div>
            <div className="flex items-center justify-between border-t border-border/70 pt-5 text-[11px] text-muted-foreground">
              <span>{configInfo ? `${t('common.version')} ${configInfo.version}` : 'Ready'}</span>
              <span>Local workspace</span>
            </div>
          </section>

          <section className="flex items-center justify-center border-t border-border/70 p-6 md:border-l md:border-t-0 sm:p-10">
            <Card className="w-full max-w-sm border-0 bg-transparent p-0 shadow-none">
              <CardHeader className="text-center">
                <CardTitle>{t('auth.loginTitle')}</CardTitle>
                <CardDescription>
                  {t('auth.loginDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Input
                      type="password"
                      placeholder={t('auth.passwordPlaceholder')}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 text-red-600 text-sm">
                      <AlertCircle className="h-4 w-4" />
                      {error}
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading || !password.trim()}
                  >
                    {isLoading ? t('auth.signingIn') : t('auth.signIn')}
                  </Button>

                  {configInfo && (
                    <div className="text-xs text-center text-muted-foreground pt-2 border-t">
                      <div>{t('common.version')} {configInfo.version}</div>
                      <div className="font-mono text-[10px]">{configInfo.apiUrl}</div>
                    </div>
                  )}
                </form>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </div>
  )
}
