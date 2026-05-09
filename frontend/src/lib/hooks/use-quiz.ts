import { useState, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { quizApi } from '@/lib/api/quiz'
import type { Quiz, QuizResultResponse } from '@/lib/types/quiz'
import { toast } from 'sonner'

const QUIZ_QUERY_KEY = 'quizzes'

export function useQuiz(sourceId: string) {
  const queryClient = useQueryClient()
  const [isGenerating, setIsGenerating] = useState(false)
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null)
  const [quizResult, setQuizResult] = useState<QuizResultResponse | null>(null)

  const { data: quizzes = [], isLoading } = useQuery({
    queryKey: [QUIZ_QUERY_KEY, sourceId],
    queryFn: () => quizApi.listForSource(sourceId),
    enabled: !!sourceId,
    staleTime: 30 * 1000,
  })

  const refreshList = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: [QUIZ_QUERY_KEY, sourceId] })
  }, [queryClient, sourceId])

  const generateQuiz = useCallback(
    async (numQuestions: number, difficulty: 'easy' | 'medium' | 'hard') => {
      try {
        setIsGenerating(true)
        let quiz: Quiz
        
        try {
          quiz = await quizApi.generate(sourceId, numQuestions, difficulty)
        } catch (error: any) {
          // If backend is not ready (404), use the fallback strategy requested by the user
          if (error.response?.status === 404) {
            console.log('Backend endpoint not found, falling back to insight-based generation')
            quiz = await fallbackGenerateQuiz(sourceId, numQuestions, difficulty)
          } else {
            throw error
          }
        }

        refreshList()
        setActiveQuiz(quiz)
        setQuizResult(null)
        toast.success('Quiz generated successfully!')
      } catch (error) {
        console.error('Failed to generate quiz:', error)
        toast.error('Failed to generate quiz. Please try again.')
        throw error
      } finally {
        setIsGenerating(false)
      }
    },
    [sourceId, refreshList]
  )

  /**
   * Manual generation using insights and chat API as a fallback
   */
  async function fallbackGenerateQuiz(
    sourceId: string, 
    numQuestions: number, 
    difficulty: string
  ): Promise<Quiz> {
    const { insightsApi } = await import('@/lib/api/insights')
    const { chatApi } = await import('@/lib/api/chat')
    const { sourcesApi } = await import('@/lib/api/sources')

    // 1. Get insights for the source
    const insights = await insightsApi.listForSource(sourceId)
    const summary = insights.find(i => i.insight_type === 'dense_summary')?.content || 
                    insights[0]?.content || 
                    'No summary available.'

    // 2. Get source info for title
    const source = await sourcesApi.get(sourceId)
    const title = source.title

    // 3. Create a temp chat session for generation
    // We need a notebook ID. We'll try to find one from the source or use a dummy
    const notebookId = (source as any).notebooks?.[0] || 'notebook:default'
    const session = await chatApi.createSession({
      notebook_id: notebookId,
      title: `Quiz Generation - ${title}`,
    })

    // 4. Send generation prompt to Ollama
    const prompt = `
      Based on the following summary of "${title}", generate a quiz with EXACTLY ${numQuestions} questions of ${difficulty} difficulty.
      
      You MUST generate EXACTLY ${numQuestions} questions. Do not generate more or fewer than ${numQuestions}.
      
      Summary:
      ${summary}
      
      Respond ONLY with a JSON object in this format (ensuring the "questions" array has exactly ${numQuestions} items):
      {
        "title": "${title} Quiz",
        "questions": [
          {
            "text": "Question text here?",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correct_answer": "Option A"
          }
        ]
      }
    `

    const response = await chatApi.sendMessage({
      session_id: session.id,
      message: prompt,
      context: { sources: [{ id: sourceId, content: 'full content' }], notes: [] }
    })

    // 5. Parse JSON from AI response
    const lastMessage = response.messages[response.messages.length - 1]
    const jsonMatch = lastMessage.content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('AI failed to generate valid JSON quiz')
    }

    const quizData = JSON.parse(jsonMatch[0])
    
    // 6. Return as a Quiz object (mock ID since it's local)
    return {
      id: `local_${Date.now()}`,
      source_id: sourceId,
      title: quizData.title || `${title} Quiz`,
      questions: quizData.questions,
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
    }
  }

  const startQuiz = useCallback((quiz: Quiz) => {
    setActiveQuiz(quiz)
    setQuizResult(null)
  }, [])

  const submitAnswers = useCallback(
    async (answers: Record<number, string>) => {
      if (!activeQuiz) return

      try {
        const result = await quizApi.submitAnswers(activeQuiz.id, answers)
        setQuizResult(result)
      } catch (error) {
        console.error('Failed to submit answers:', error)
        toast.error('Failed to submit answers. Please try again.')
        throw error
      }
    },
    [activeQuiz]
  )

  const deleteQuiz = useCallback(
    async (quizId: string) => {
      try {
        await quizApi.deleteQuiz(quizId)
        refreshList()
        if (activeQuiz?.id === quizId) {
          setActiveQuiz(null)
          setQuizResult(null)
        }
        toast.success('Quiz deleted')
      } catch (error) {
        console.error('Failed to delete quiz:', error)
        toast.error('Failed to delete quiz')
      }
    },
    [activeQuiz, refreshList]
  )

  const resetQuiz = useCallback(() => {
    setActiveQuiz(null)
    setQuizResult(null)
  }, [])

  return {
    quizzes,
    isLoading,
    isGenerating,
    activeQuiz,
    quizResult,
    generateQuiz,
    startQuiz,
    submitAnswers,
    deleteQuiz,
    resetQuiz,
  }
}
