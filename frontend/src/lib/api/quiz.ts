import apiClient from './client'
import type { Quiz, QuizResultResponse } from '@/lib/types/quiz'

export const quizApi = {
  generate: async (
    sourceId: string,
    numQuestions: number,
    difficulty: 'easy' | 'medium' | 'hard',
    modelOverride?: string
  ) => {
    const response = await apiClient.post<Quiz>('/quiz/generate', {
      source_id: sourceId,
      num_questions: numQuestions,
      difficulty,
      model_override: modelOverride,
    })
    return response.data
  },

  listForSource: async (sourceId: string) => {
    const response = await apiClient.get<Quiz[]>(`/quiz/source/${sourceId}`)
    return response.data
  },

  getById: async (quizId: string) => {
    const response = await apiClient.get<Quiz>(`/quiz/${quizId}`)
    return response.data
  },

  submitAnswers: async (quizId: string, answers: Record<number, string>) => {
    const response = await apiClient.post<QuizResultResponse>(
      `/quiz/${quizId}/submit`,
      { answers }
    )
    return response.data
  },

  deleteQuiz: async (quizId: string) => {
    await apiClient.delete(`/quiz/${quizId}`)
  },
}
