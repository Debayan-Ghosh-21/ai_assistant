'use client'

import { useState } from 'react'
import { useQuiz } from '@/lib/hooks/use-quiz'
import type { Quiz } from '@/lib/types/quiz'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Loader2,
  Brain,
  RotateCcw,
  Plus,
  Trash2,
  Clock,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface QuizPanelProps {
  sourceId: string
}

type ViewState = 'config' | 'quiz' | 'results'

export function QuizPanel({ sourceId }: QuizPanelProps) {
  const {
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
  } = useQuiz(sourceId)

  const [viewState, setViewState] = useState<ViewState>('config')
  const [numQuestions, setNumQuestions] = useState(5)
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({})

  const handleGenerate = async () => {
    try {
      await generateQuiz(numQuestions, difficulty)
      setSelectedAnswers({})
      setViewState('quiz')
    } catch {
      // Error handled in hook
    }
  }

  const handleRetake = (quiz: Quiz) => {
    startQuiz(quiz)
    setSelectedAnswers({})
    setViewState('quiz')
  }

  const handleSelectOption = (questionIndex: number, answer: string) => {
    setSelectedAnswers((prev) => ({ ...prev, [questionIndex]: answer }))
  }

  const handleSubmit = async () => {
    try {
      await submitAnswers(selectedAnswers)
      setViewState('results')
    } catch {
      // Error handled in hook
    }
  }

  const handleNewQuiz = () => {
    resetQuiz()
    setSelectedAnswers({})
    setViewState('config')
  }

  const handleRetakeFromResults = () => {
    setSelectedAnswers({})
    setViewState('quiz')
  }

  const getOptionLetter = (optionText: string): string => {
    const match = optionText.match(/^([A-D])\./)
    return match ? match[1] : ''
  }

  // ─── CONFIG VIEW ──────────────────────────────────────────────
  if (viewState === 'config') {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Generate a Quiz
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="quiz-num-questions">Number of Questions</Label>
              <Input
                id="quiz-num-questions"
                type="number"
                min={1}
                max={20}
                value={numQuestions}
                onChange={(e) =>
                  setNumQuestions(
                    Math.min(20, Math.max(1, parseInt(e.target.value) || 1))
                  )
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quiz-difficulty">Difficulty</Label>
              <Select
                value={difficulty}
                onValueChange={(val) =>
                  setDifficulty(val as 'easy' | 'medium' | 'hard')
                }
              >
                <SelectTrigger id="quiz-difficulty">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              className="w-full"
              onClick={handleGenerate}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Quiz...
                </>
              ) : (
                <>
                  <Brain className="mr-2 h-4 w-4" />
                  Generate Quiz
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Past Quizzes */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : quizzes.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Past Quizzes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {quizzes.map((quiz) => (
                <div
                  key={quiz.id}
                  className="flex items-center justify-between rounded-lg border bg-background p-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{quiz.title}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {quiz.questions.length} questions
                      </Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(quiz.created), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRetake(quiz)}
                    >
                      <RotateCcw className="mr-1 h-3 w-3" />
                      Take
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteQuiz(quiz.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : null}
      </div>
    )
  }

  // ─── QUIZ VIEW ────────────────────────────────────────────────
  if (viewState === 'quiz' && activeQuiz) {
    const answeredCount = Object.keys(selectedAnswers).length
    const isComplete = answeredCount === activeQuiz.questions.length
    const progress = (answeredCount / activeQuiz.questions.length) * 100

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button size="sm" variant="ghost" onClick={handleNewQuiz}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back
          </Button>
          <span className="text-sm text-muted-foreground">
            {answeredCount} of {activeQuiz.questions.length} Answered
          </span>
        </div>

        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur py-2">
          <Progress value={progress} className="h-2" />
        </div>

        <div className="space-y-8">
          {activeQuiz.questions.map((question, qIdx) => (
            <Card key={qIdx}>
              <CardContent className="pt-6">
                <p className="text-lg font-medium mb-6">
                  <span className="text-muted-foreground mr-2">{qIdx + 1}.</span>
                  {question.question || (question as any).text}
                </p>

                <div className="space-y-3">
                  {(() => {
                    // Ensure we always show at least 4 options in the UI for consistent layout
                    const options = [...question.options]
                    while (options.length < 4) {
                      const letter = String.fromCharCode(65 + options.length)
                      options.push(`${letter}. [Option placeholder]`)
                    }

                    return options.map((option, idx) => {
                      const letter = getOptionLetter(option) || String.fromCharCode(65 + idx)
                      const isSelected = selectedAnswers[qIdx] === letter

                      return (
                        <button
                          key={idx}
                          onClick={() => handleSelectOption(qIdx, letter)}
                          className={`w-full text-left rounded-lg border p-4 transition-all ${
                            isSelected
                              ? 'border-primary bg-primary/10 ring-2 ring-primary/30'
                              : 'border-border hover:border-primary/50 hover:bg-muted/50'
                          }`}
                        >
                          <span className="text-sm">{option}</span>
                        </button>
                      )
                    })
                  })()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex justify-end pt-4 pb-8">
          <Button onClick={handleSubmit} disabled={!isComplete} size="lg">
            Submit All Answers
          </Button>
        </div>
      </div>
    )
  }

  // ─── RESULTS VIEW ─────────────────────────────────────────────
  if (viewState === 'results' && quizResult) {
    const scoreColor =
      quizResult.percentage >= 70
        ? 'text-green-600 dark:text-green-400'
        : quizResult.percentage >= 50
          ? 'text-yellow-600 dark:text-yellow-400'
          : 'text-red-600 dark:text-red-400'

    const scoreBg =
      quizResult.percentage >= 70
        ? 'bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800'
        : quizResult.percentage >= 50
          ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950/30 dark:border-yellow-800'
          : 'bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800'

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Button size="sm" variant="ghost" onClick={handleNewQuiz}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back
          </Button>
        </div>

        {/* Score Banner */}
        <div className={`rounded-lg border p-6 text-center ${scoreBg}`}>
          <p className={`text-3xl font-bold ${scoreColor}`}>
            {quizResult.score} / {quizResult.total}
          </p>
          <p className={`text-lg font-medium mt-1 ${scoreColor}`}>
            {quizResult.percentage}%
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            You scored {quizResult.score} out of {quizResult.total}
          </p>
        </div>

        {/* Question Results */}
        <div className="space-y-3">
          {quizResult.results.map((result, idx) => (
            <Card key={idx}>
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {result.is_correct ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{result.question}</p>
                    <div className="mt-2 space-y-1">
                      <p className="text-xs">
                        <span className="text-muted-foreground">Your answer: </span>
                        <span
                          className={
                            result.is_correct
                              ? 'text-green-600 dark:text-green-400 font-medium'
                              : 'text-red-600 dark:text-red-400 font-medium'
                          }
                        >
                          {result.your_answer || 'Not answered'}
                        </span>
                      </p>
                      {!result.is_correct && (
                        <p className="text-xs">
                          <span className="text-muted-foreground">
                            Correct answer:{' '}
                          </span>
                          <span className="text-green-600 dark:text-green-400 font-medium">
                            {result.correct_answer}
                          </span>
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        {result.explanation}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={handleRetakeFromResults}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Retake Quiz
          </Button>
          <Button className="flex-1" onClick={handleNewQuiz}>
            <Plus className="mr-2 h-4 w-4" />
            New Quiz
          </Button>
        </div>
      </div>
    )
  }

  // Fallback
  return null
}
