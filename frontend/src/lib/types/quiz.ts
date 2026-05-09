export interface QuizQuestion {
  question: string
  options: string[]
  answer: string
  explanation: string
}

export interface Quiz {
  id: string
  source_id: string
  title: string
  questions: QuizQuestion[]
  created: string
  updated: string
}

export interface GenerateQuizRequest {
  source_id: string
  num_questions: number
  difficulty: 'easy' | 'medium' | 'hard'
  model_override?: string
}

export interface SubmitAnswersRequest {
  answers: Record<number, string>
}

export interface QuizResult {
  question: string
  your_answer: string
  correct_answer: string
  is_correct: boolean
  explanation: string
}

export interface QuizResultResponse {
  score: number
  total: number
  percentage: number
  results: QuizResult[]
}
