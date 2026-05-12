'use client'

import { AppSidebar } from './AppSidebar'
import { SetupBanner } from './SetupBanner'

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="h-screen w-screen overflow-hidden bg-background text-foreground">
      <div className="flex h-full w-full overflow-hidden bg-background">
        <AppSidebar />
        <main className="flex min-w-0 flex-1 flex-col overflow-hidden bg-[linear-gradient(180deg,oklch(0.992_0.003_86),oklch(0.968_0.007_86))]">
          <SetupBanner />
          {children}
        </main>
      </div>
    </div>
  )
}
