'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { QuizCard } from '@/components/quiz/QuizCard'
import { QuizSummary } from '@/components/quiz/QuizSummary'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import type { AWSTopic, PracticeQuestion } from '@/types'
import { createClient } from '@/lib/supabase/client'

export default function QuizPage() {
  const { topicId } = useParams<{ topicId: string }>()
  const router = useRouter()

  const [topic, setTopic] = useState<AWSTopic | null>(null)
  const [questions, setQuestions] = useState<PracticeQuestion[]>([])
  const [answers, setAnswers] = useState<(number | null)[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [quizDone, setQuizDone] = useState(false)

  useEffect(() => {
    async function loadTopic() {
      const supabase = createClient()
      const { data } = await supabase
        .from('aws_topics').select('id, category, service_name, description, difficulty')
        .eq('id', topicId).single()
      setTopic(data as AWSTopic)
      setLoading(false)
    }
    loadTopic()
  }, [topicId])

  async function generateQuiz(count = 5) {
    setGenerating(true)
    setError(null)
    setQuizDone(false)
    setCurrentIndex(0)
    setAnswers([])

    try {
      const res = await fetch('/api/ai/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic_id: topicId, count }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to generate questions')
      setQuestions(json.questions)
      setAnswers(new Array(json.questions.length).fill(null))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred generating questions')
    } finally {
      setGenerating(false)
    }
  }

  function handleSelect(optionIndex: number) {
    const updated = [...answers]
    updated[currentIndex] = optionIndex
    setAnswers(updated)
  }

  function handleNext() {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(i => i + 1)
    } else {
      setQuizDone(true)
    }
  }

  const correctCount = answers.filter((a, i) => a === questions[i]?.correct_index).length

  if (loading) return (
    <div className="flex justify-center py-20"><Spinner size="lg" label="Loading…" /></div>
  )

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      <div>
        <button onClick={() => router.push(`/study/${topicId}`)} className="text-sm text-text-muted hover:text-primary mb-2 flex items-center gap-1">
          ← Back to Study
        </button>
        <h1 className="text-2xl font-bold text-text-primary">Quiz: {topic?.service_name}</h1>
        <p className="text-text-muted text-sm mt-1">{topic?.category}</p>
      </div>

      {/* Not started */}
      {questions.length === 0 && !generating && (
        <div className="bg-surface-card rounded-2xl p-8 flex flex-col items-center gap-6 text-center">
          <div className="text-4xl" aria-hidden="true">🧠</div>
          <div>
            <h2 className="text-lg font-semibold text-text-primary">Ready to test your knowledge?</h2>
            <p className="text-text-muted text-sm mt-1">The AI will generate practice questions for {topic?.service_name}</p>
          </div>
          {error && (
            <div role="alert" className="w-full p-3 bg-danger/10 border border-danger/30 rounded-xl text-sm text-danger">
              {error}
            </div>
          )}
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => generateQuiz(5)}>5 Questions</Button>
            <Button onClick={() => generateQuiz(10)}>10 Questions</Button>
          </div>
        </div>
      )}

      {generating && (
        <div className="flex flex-col items-center py-12 gap-4">
          <Spinner size="lg" label="Generating questions with AI…" />
          <p className="text-text-muted text-sm">Generating questions with AI…</p>
        </div>
      )}

      {/* Active quiz */}
      {!quizDone && questions.length > 0 && !generating && (
        <div className="bg-surface-card rounded-2xl p-6 flex flex-col gap-6">
          <ProgressBar value={((currentIndex + 1) / questions.length) * 100} label={`Question ${currentIndex + 1} of ${questions.length}`} />
          <QuizCard
            question={questions[currentIndex]}
            index={currentIndex}
            total={questions.length}
            selectedIndex={answers[currentIndex]}
            onSelect={handleSelect}
          />
          {answers[currentIndex] !== null && (
            <Button onClick={handleNext} className="self-end">
              {currentIndex < questions.length - 1 ? 'Next Question →' : 'See Results'}
            </Button>
          )}
        </div>
      )}

      {/* Summary */}
      {quizDone && (
        <div className="bg-surface-card rounded-2xl p-6">
          <QuizSummary
            correct={correctCount}
            total={questions.length}
            onRetry={() => generateQuiz(questions.length)}
            onExit={() => router.push(`/study/${topicId}`)}
          />
        </div>
      )}
    </div>
  )
}
