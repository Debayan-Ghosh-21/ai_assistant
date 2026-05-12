'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { sourcesApi } from '@/lib/api/sources'
import { SourceListResponse } from '@/lib/types/api'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { EmptyState } from '@/components/common/EmptyState'
import { AppShell } from '@/components/layout/AppShell'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { FileText, Link as LinkIcon, Upload, AlignLeft, Trash2, ArrowUpDown, Sparkles } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/lib/hooks/use-translation'
import { getDateLocale } from '@/lib/utils/date-locale'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { getApiErrorKey } from '@/lib/utils/error-handler'

export default function SourcesPage() {
  const { t, language } = useTranslation()
  const [sources, setSources] = useState<SourceListResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [sortBy, setSortBy] = useState<'created' | 'updated'>('updated')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; source: SourceListResponse | null }>({
    open: false,
    source: null
  })
  const router = useRouter()
  const gridRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const offsetRef = useRef(0)
  const loadingMoreRef = useRef(false)
  const hasMoreRef = useRef(true)
  const PAGE_SIZE = 30

  const fetchSources = useCallback(async (reset = false) => {
    try {
      // Check flags before proceeding
      if (!reset && (loadingMoreRef.current || !hasMoreRef.current)) {
        return
      }

      if (reset) {
        setLoading(true)
        offsetRef.current = 0
        setSources([])
        hasMoreRef.current = true
      } else {
        loadingMoreRef.current = true
        setLoadingMore(true)
      }

      const data = await sourcesApi.list({
        limit: PAGE_SIZE,
        offset: offsetRef.current,
        sort_by: sortBy,
        sort_order: sortOrder,
      })

      if (reset) {
        setSources(data)
      } else {
        setSources(prev => [...prev, ...data])
      }

      // Check if we have more data
      const hasMoreData = data.length === PAGE_SIZE
      hasMoreRef.current = hasMoreData
      offsetRef.current += data.length
    } catch (err) {
      console.error('Failed to fetch sources:', err)
      setError(t('sources.failedToLoad'))
      toast.error(t('sources.failedToLoad'))
    } finally {
      setLoading(false)
      setLoadingMore(false)
      loadingMoreRef.current = false
    }
  }, [sortBy, sortOrder, t('sources.failedToLoad')])

  // Initial load and when sort changes
  useEffect(() => {
    fetchSources(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy, sortOrder])

  useEffect(() => {
    // Focus the tile grid when component mounts or sources change
    if (sources.length > 0 && gridRef.current) {
      gridRef.current.focus()
    }
  }, [sources])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (sources.length === 0) return

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex((prev) => {
            const newIndex = Math.min(prev + 1, sources.length - 1)
            // Scroll to keep selected row visible
            setTimeout(() => scrollToSelectedRow(newIndex), 0)
            return newIndex
          })
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex((prev) => {
            const newIndex = Math.max(prev - 1, 0)
            // Scroll to keep selected row visible
            setTimeout(() => scrollToSelectedRow(newIndex), 0)
            return newIndex
          })
          break
        case 'Enter':
          e.preventDefault()
          if (sources[selectedIndex]) {
            router.push(`/sources/${sources[selectedIndex].id}`)
          }
          break
        case 'Home':
          e.preventDefault()
          setSelectedIndex(0)
          setTimeout(() => scrollToSelectedRow(0), 0)
          break
        case 'End':
          e.preventDefault()
          const lastIndex = sources.length - 1
          setSelectedIndex(lastIndex)
          setTimeout(() => scrollToSelectedRow(lastIndex), 0)
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [sources, selectedIndex, router])

  const scrollToSelectedRow = (index: number) => {
    const scrollContainer = scrollContainerRef.current
    if (!scrollContainer) return

    const tiles = scrollContainer.querySelectorAll('[data-source-tile]')
    const selectedTile = tiles[index] as HTMLElement
    if (!selectedTile) return

    const containerRect = scrollContainer.getBoundingClientRect()
    const tileRect = selectedTile.getBoundingClientRect()

    // Check if row is above visible area
    if (tileRect.top < containerRect.top) {
      selectedTile.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    // Check if row is below visible area
    else if (tileRect.bottom > containerRect.bottom) {
      selectedTile.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  }

  // Set up scroll listener after sources are loaded
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current
    if (!scrollContainer) return

    let scrollTimeout: NodeJS.Timeout | null = null

    const handleScroll = () => {
      if (scrollTimeout) {
        clearTimeout(scrollTimeout)
      }

      scrollTimeout = setTimeout(() => {
        if (!scrollContainerRef.current) return

        const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current
        const distanceFromBottom = scrollHeight - scrollTop - clientHeight

        // Load more when within 200px of the bottom
        if (distanceFromBottom < 200 && !loadingMoreRef.current && hasMoreRef.current) {
          fetchSources(false)
        }
      }, 100)
    }

    scrollContainer.addEventListener('scroll', handleScroll)
    handleScroll() // Check on mount

    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll)
      if (scrollTimeout) {
        clearTimeout(scrollTimeout)
      }
    }
  }, [fetchSources, sources.length])

  const toggleSort = (field: 'created' | 'updated') => {
    if (sortBy === field) {
      // Toggle order if clicking the same field
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      // Switch to new field with default desc order
      setSortBy(field)
      setSortOrder('desc')
    }
  }

  const getSourceIcon = (source: SourceListResponse) => {
    if (source.asset?.url) return <LinkIcon className="h-4 w-4" />
    if (source.asset?.file_path) return <Upload className="h-4 w-4" />
    return <AlignLeft className="h-4 w-4" />
  }

  const getSourceType = (source: SourceListResponse) => {
    if (source.asset?.url) return t('sources.type.link')
    if (source.asset?.file_path) return t('sources.type.file')
    return t('sources.type.text')
  }

  const handleRowClick = useCallback((index: number, sourceId: string) => {
    setSelectedIndex(index)
    router.push(`/sources/${sourceId}`)
  }, [router])

  const handleDeleteClick = useCallback((e: React.MouseEvent, source: SourceListResponse) => {
    e.stopPropagation() // Prevent row click
    setDeleteDialog({ open: true, source })
  }, [])

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.source) return

    try {
      await sourcesApi.delete(deleteDialog.source.id)
      toast.success(t('sources.deleteSuccess'))
      // Remove the deleted source from the list
      setSources(prev => prev.filter(s => s.id !== deleteDialog.source?.id))
      setDeleteDialog({ open: false, source: null })
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } }, message?: string };
      console.error('Failed to delete source:', error)
      toast.error(t(getApiErrorKey(error.response?.data?.detail || error.message)))
    }
  }

  const embeddedCount = sources.filter(source => source.embedded).length
  const linkCount = sources.filter(source => source.asset?.url).length
  const totalInsights = sources.reduce((total, source) => total + (source.insights_count || 0), 0)

  if (loading) {
    return (
      <AppShell>
        <div className="flex h-full items-center justify-center">
          <LoadingSpinner />
        </div>
      </AppShell>
    )
  }

  if (error) {
    return (
      <AppShell>
        <div className="flex h-full items-center justify-center">
          <p className="text-red-500">{error}</p>
        </div>
      </AppShell>
    )
  }

  if (sources.length === 0) {
    return (
      <AppShell>
        <EmptyState
          icon={FileText}
          title={t('sources.noSourcesYet')}
          description={t('sources.allSourcesDescShort')}
        />
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div ref={scrollContainerRef} className="h-full overflow-y-auto">
        <div className="mx-auto flex w-full max-w-[1680px] flex-col gap-5 px-5 py-5 sm:px-6 lg:px-8">
          <section className="grid auto-rows-[minmax(132px,auto)] gap-4 lg:grid-cols-12">
            <div className="relative overflow-hidden rounded-xl bg-primary p-6 text-primary-foreground shadow-[0_18px_44px_rgb(70_62_45_/_15%)] lg:col-span-7 lg:row-span-2">
              <div className="relative z-10 flex h-full min-h-[220px] max-w-2xl flex-col justify-between gap-10">
                <div>
                  <div className="mb-5 flex items-center gap-2 text-xs font-medium uppercase text-primary-foreground/65">
                    <Sparkles className="h-4 w-4" />
                    {t('navigation.collect')}
                  </div>
                  <h1 className="max-w-xl text-4xl font-semibold leading-[0.98] tracking-normal sm:text-5xl">
                    {t('sources.allSources')}
                  </h1>
                  <p className="mt-4 max-w-lg text-sm leading-6 text-primary-foreground/70">
                    {t('sources.allSourcesDesc')}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => toggleSort('created')}
                    className="bg-card text-foreground hover:bg-card/90"
                  >
                    {t('common.created_label')}
                    <ArrowUpDown className={cn(
                      "h-3 w-3",
                      sortBy === 'created' ? 'opacity-100' : 'opacity-40'
                    )} />
                    {sortBy === 'created' && (
                      <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleSort('updated')}
                    className="border-white/20 bg-white/10 text-primary-foreground hover:bg-white/15 hover:text-primary-foreground"
                  >
                    Updated
                    <ArrowUpDown className={cn(
                      "h-3 w-3",
                      sortBy === 'updated' ? 'opacity-100' : 'opacity-40'
                    )} />
                    {sortBy === 'updated' && (
                      <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </Button>
                </div>
              </div>
              <div className="absolute -right-10 -top-12 h-48 w-48 rounded-full border border-white/10" />
              <div className="absolute bottom-6 right-6 h-24 w-32 rounded-lg border border-white/10 bg-white/5" />
            </div>

            <div className="rounded-xl border border-border/70 bg-card p-5 shadow-[0_10px_28px_rgb(70_62_45_/_5%)] lg:col-span-2">
              <p className="text-xs font-medium uppercase text-muted-foreground">{t('common.type')}</p>
              <p className="mt-4 text-4xl font-semibold">{sources.length}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t('sources.allSources')}</p>
            </div>
            <div className="rounded-xl border border-border/70 bg-secondary p-5 lg:col-span-3">
              <p className="text-xs font-medium uppercase text-muted-foreground">{t('sources.insights')}</p>
              <p className="mt-4 text-4xl font-semibold">{totalInsights}</p>
              <p className="mt-1 text-sm text-muted-foreground">Across visible sources</p>
            </div>
            <div className="rounded-xl border border-border/70 bg-card p-5 shadow-[0_10px_28px_rgb(70_62_45_/_5%)] lg:col-span-3">
              <p className="text-xs font-medium uppercase text-muted-foreground">{t('sources.embedded')}</p>
              <p className="mt-4 text-4xl font-semibold">{embeddedCount}</p>
              <p className="mt-1 text-sm text-muted-foreground">Ready for retrieval</p>
            </div>
            <div className="rounded-xl border border-border/70 bg-card p-5 shadow-[0_10px_28px_rgb(70_62_45_/_5%)] lg:col-span-2">
              <p className="text-xs font-medium uppercase text-muted-foreground">Links</p>
              <p className="mt-4 text-4xl font-semibold">{linkCount}</p>
              <p className="mt-1 text-sm text-muted-foreground">Web sources</p>
            </div>
          </section>

          <div
            ref={gridRef}
            tabIndex={0}
            className="grid auto-rows-[minmax(184px,auto)] grid-cols-1 gap-4 outline-none sm:grid-cols-2 xl:grid-cols-4"
          >
            {sources.map((source, index) => {
              const isSelected = selectedIndex === index
              const isFeatureTile = index % 9 === 0
              const isWideTile = index % 5 === 2

              return (
                <article
                  key={source.id}
                  data-source-tile
                  onClick={() => handleRowClick(index, source.id)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={cn(
                    "group relative flex cursor-pointer flex-col justify-between overflow-hidden rounded-xl border bg-card p-5 shadow-[0_10px_28px_rgb(70_62_45_/_5%)] transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_18px_44px_rgb(70_62_45_/_9%)]",
                    isSelected ? "border-primary/40 bg-accent/60 ring-2 ring-primary/10" : "border-border/70",
                    isFeatureTile && "sm:col-span-2 xl:row-span-2",
                    isWideTile && !isFeatureTile && "xl:col-span-2"
                  )}
                >
                  <div>
                    <div className="mb-7 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-foreground">
                          {getSourceIcon(source)}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {getSourceType(source)}
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => handleDeleteClick(e, source)}
                        className="h-8 w-8 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <h2 className={cn(
                      "line-clamp-3 font-semibold leading-tight",
                      isFeatureTile ? "max-w-xl text-3xl" : "text-lg"
                    )}>
                      {source.title || t('sources.untitledSource')}
                    </h2>
                    {source.asset?.url && (
                      <p className="mt-3 truncate text-xs text-muted-foreground">
                        {source.asset.url}
                      </p>
                    )}
                  </div>

                  <div className="mt-8 grid grid-cols-3 gap-2 text-sm">
                    <div className="rounded-lg bg-background/70 p-3">
                      <p className="text-[10px] font-medium uppercase text-muted-foreground">{t('common.created_label')}</p>
                      <p className="mt-1 truncate font-medium">
                        {formatDistanceToNow(new Date(source.created), {
                          addSuffix: true,
                          locale: getDateLocale(language)
                        })}
                      </p>
                    </div>
                    <div className="rounded-lg bg-background/70 p-3">
                      <p className="text-[10px] font-medium uppercase text-muted-foreground">{t('sources.insights')}</p>
                      <p className="mt-1 font-medium">{source.insights_count || 0}</p>
                    </div>
                    <div className="rounded-lg bg-background/70 p-3">
                      <p className="text-[10px] font-medium uppercase text-muted-foreground">{t('sources.embedded')}</p>
                      <p className="mt-1 font-medium">{source.embedded ? t('sources.yes') : t('sources.no')}</p>
                    </div>
                  </div>
                </article>
              )
            })}

            {loadingMore && (
              <div className="col-span-full flex h-24 items-center justify-center rounded-xl border border-border/70 bg-card">
                <LoadingSpinner />
                <span className="ml-2 text-muted-foreground">{t('sources.loadingMore')}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, source: deleteDialog.source })}
        title={t('sources.delete')}
        description={t('sources.deleteConfirmWithTitle').replace('{title}', deleteDialog.source?.title || t('sources.untitledSource'))}
        confirmText={t('common.delete')}
        confirmVariant="destructive"
        onConfirm={handleDeleteConfirm}
      />
    </AppShell>
  )
}
