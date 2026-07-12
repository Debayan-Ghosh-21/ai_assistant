import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { accuracyApi } from '@/lib/api/accuracy'
import { toast } from 'sonner'

const ACCURACY_STATS_KEY = 'accuracy-stats'

export function useAccuracyStats() {
  return useQuery({
    queryKey: [ACCURACY_STATS_KEY],
    queryFn: accuracyApi.getStats,
  })
}

export function useCreateAccuracyLog() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (params: { chatId?: string; insightId?: string }) => accuracyApi.create(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ACCURACY_STATS_KEY] })
      toast.success('AI response accuracy logged successfully!')
    },
    onError: (error: any) => {
      console.error('Failed to log accuracy:', error)
      toast.error('Failed to log accuracy. Please try again.')
    },
  })
}
