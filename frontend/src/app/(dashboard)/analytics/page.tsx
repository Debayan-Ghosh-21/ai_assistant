'use client'

import { useMemo } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useAccuracyStats } from '@/lib/hooks/use-accuracy'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
} from 'recharts'
import { Award, BarChart3, TrendingUp, HelpCircle, Activity, Info } from 'lucide-react'
import { format } from 'date-fns'

export default function AnalyticsPage() {
  const { data: stats, isLoading, error } = useAccuracyStats()

  // Process data for charts
  const chartData = useMemo(() => {
    if (!stats || !stats.records || stats.records.length === 0) {
      return {
        barData: [],
        lineData: [],
        areaData: [],
        scatterData: [],
      }
    }

    // Sort records by creation time
    const sortedRecords = [...stats.records].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )

    // 1. Bar Chart Data (accuracy score per log entry)
    const barData = sortedRecords.map((record, index) => ({
      name: `Log #${index + 1}`,
      score: record.accuracy_score,
      date: format(new Date(record.created_at), 'MM/dd HH:mm'),
    }))

    // 2. Line Chart Data (daily averages)
    const lineData = stats.daily_averages.map((da) => ({
      date: format(new Date(da.date + 'T00:00:00'), 'MM/dd'),
      average: da.avg_score,
    }))

    // 3. Area Chart Data (cumulative average accuracy over time)
    let cumulativeSum = 0
    const areaData = sortedRecords.map((record, index) => {
      cumulativeSum += record.accuracy_score
      const cumulativeAverage = cumulativeSum / (index + 1)
      return {
        name: `Log #${index + 1}`,
        score: record.accuracy_score,
        runningAverage: parseFloat(cumulativeAverage.toFixed(2)),
        date: format(new Date(record.created_at), 'MM/dd HH:mm'),
      }
    })

    // 4. Scatter Plot Data
    const scatterData = sortedRecords.map((record, index) => ({
      index: index + 1,
      score: record.accuracy_score,
      time: format(new Date(record.created_at), 'HH:mm'),
    }))

    return { barData, lineData, areaData, scatterData }
  }, [stats])

  if (isLoading) {
    return (
      <AppShell>
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </AppShell>
    )
  }

  if (error || !stats) {
    return (
      <AppShell>
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-4">Analytics Error</h1>
          <p className="text-red-500">Failed to load accuracy statistics. Please make sure database is initialized and running.</p>
        </div>
      </AppShell>
    )
  }

  const { records, average_score, min_score, max_score, total_logs } = stats

  return (
    <AppShell>
      <div className="flex-1 overflow-y-auto">
        <div className="px-6 py-6 space-y-6 max-w-7xl mx-auto">
          {/* Header */}
          <header className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">Accuracy Analytics</h1>
            <p className="text-muted-foreground text-sm">
              Dashboard displaying logged accuracy scores and semantic quality indicators for generated chat responses.
            </p>
          </header>

          {/* Stats Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="shadow-sm border border-border bg-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Overall Average
                </CardTitle>
                <Award className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{average_score}%</div>
                <p className="text-xs text-muted-foreground mt-1">Mean semantic correctness</p>
              </CardContent>
            </Card>

            <Card className="shadow-sm border border-border bg-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Highest Score
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {max_score}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">Maximum logged correctness</p>
              </CardContent>
            </Card>

            <Card className="shadow-sm border border-border bg-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Lowest Score
                </CardTitle>
                <HelpCircle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {min_score}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">Minimum correctness score</p>
              </CardContent>
            </Card>

            <Card className="shadow-sm border border-border bg-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Total Logged Entries
                </CardTitle>
                <Activity className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{total_logs}</div>
                <p className="text-xs text-muted-foreground mt-1">Logged session feedback items</p>
              </CardContent>
            </Card>
          </div>

          {records.length === 0 ? (
            <Card className="p-8 text-center border-dashed border-2">
              <Info className="h-10 w-10 mx-auto opacity-40 mb-3" />
              <CardTitle className="text-base">No Data Available</CardTitle>
              <CardDescription className="mt-1">
                Accuracy stats will populate here once you start logging chat responses using the target accuracy button in the chat sessions.
              </CardDescription>
            </Card>
          ) : (
            <>
              {/* Main Visualizations Grid */}
              <div className="grid gap-6 md:grid-cols-2">
                {/* 1. Bar Chart: Accuracy score per log entry */}
                <Card className="shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-primary" />
                      Individual Accuracy Logs
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Accuracy score breakdown per generated chat response.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-[300px] pt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData.barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                        <XAxis dataKey="name" fontSize={11} tickLine={false} />
                        <YAxis domain={[50, 100]} fontSize={11} tickLine={false} axisLine={false} />
                        <RechartsTooltip
                          contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                          labelClassName="font-medium text-xs text-foreground"
                        />
                        <Bar dataKey="score" name="Accuracy Score" fill="var(--color-primary, hsl(var(--primary)))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* 2. Line Chart: Daily average accuracy score */}
                <Card className="shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      Daily Average Correctness
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Timeline showing the daily aggregated correct accuracy trends.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-[300px] pt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData.lineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                        <XAxis dataKey="date" fontSize={11} tickLine={false} />
                        <YAxis domain={[50, 100]} fontSize={11} tickLine={false} axisLine={false} />
                        <RechartsTooltip
                          contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                        />
                        <Line
                          type="monotone"
                          dataKey="average"
                          name="Daily Average %"
                          stroke="hsl(var(--primary))"
                          strokeWidth={2.5}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* 3. Area Chart: Cumulative trend over time */}
                <Card className="shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Award className="h-4 w-4 text-primary" />
                      Cumulative Average Quality
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Running correctness average showing progression over log timeline.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-[300px] pt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData.areaData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                        <XAxis dataKey="name" fontSize={11} tickLine={false} />
                        <YAxis domain={[50, 100]} fontSize={11} tickLine={false} axisLine={false} />
                        <RechartsTooltip
                          contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                        />
                        <Area
                          type="monotone"
                          dataKey="runningAverage"
                          name="Cumulative Average"
                          stroke="hsl(var(--primary))"
                          fillOpacity={1}
                          fill="url(#colorAvg)"
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* 4. Scatter Plot: Log entry distribution */}
                <Card className="shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Activity className="h-4 w-4 text-primary" />
                      Score Distribution Scatter Plot
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Individual evaluation points mapped by index timeline.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-[300px] pt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis type="number" dataKey="index" name="Log Entry Index" fontSize={11} tickLine={false} />
                        <YAxis type="number" dataKey="score" name="Score" domain={[70, 100]} fontSize={11} tickLine={false} axisLine={false} unit="%" />
                        <RechartsTooltip
                          cursor={{ strokeDasharray: '3 3' }}
                          contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                        />
                        <Legend fontSize={11} />
                        <Scatter name="Correctness Scores" data={chartData.scatterData} fill="hsl(var(--primary))" />
                      </ScatterChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>
      </div>
    </AppShell>
  )
}
