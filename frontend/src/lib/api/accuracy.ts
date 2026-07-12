import apiClient from './client'
import type { AccuracyStatsResponse, AccuracyLogResponse } from '@/lib/types/accuracy'

export const accuracyApi = {
  create: async (params: { chatId?: string; insightId?: string }) => {
    const response = await apiClient.post<AccuracyLogResponse>('/accuracy-logs', {
      chat_id: params.chatId,
      insight_id: params.insightId,
    })
    return response.data
  },

  getStats: async () => {
    const response = await apiClient.get<AccuracyStatsResponse>('/accuracy-logs/stats')
    return response.data
  },
}
