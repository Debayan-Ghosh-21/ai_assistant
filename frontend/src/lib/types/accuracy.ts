export interface AccuracyLogResponse {
  id: string
  chat_id?: string
  insight_id?: string
  accuracy_score: number
  reasoning?: string
  created_at: string
}

export interface DailyAverage {
  date: string
  avg_score: number
}

export interface AccuracyStatsResponse {
  records: AccuracyLogResponse[]
  average_score: number
  min_score: number
  max_score: number
  total_logs: number
  daily_averages: DailyAverage[]
}

export interface CreateAccuracyLogRequest {
  chat_id?: string
  insight_id?: string
}
