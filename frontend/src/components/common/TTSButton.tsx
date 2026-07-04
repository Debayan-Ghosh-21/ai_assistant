'use client'

import { Volume2, VolumeX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useTTSStore } from '@/lib/stores/tts-store'
import { useTranslation } from '@/lib/hooks/use-translation'

interface TTSButtonProps {
  text: string
  lang?: string
  size?: 'sm' | 'default' | 'icon'
  variant?: 'ghost' | 'outline' | 'default'
  className?: string
}

export function TTSButton({
  text,
  lang,
  size = 'sm',
  variant = 'ghost',
  className
}: TTSButtonProps) {
  const { t } = useTranslation()
  const { speak, stop, isPlaying, activeText } = useTTSStore()

  const isThisPlaying = isPlaying && activeText === text

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isThisPlaying) {
      stop()
    } else {
      speak(text, lang)
    }
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={variant}
            size={size}
            className={className}
            onClick={handleClick}
            type="button"
          >
            {isThisPlaying ? (
              <VolumeX className="h-4 w-4 text-primary animate-pulse" />
            ) : (
              <Volume2 className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{isThisPlaying ? (t('common.stop') || 'Stop') : (t('common.readAloud') || 'Read aloud')}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
