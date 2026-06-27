import { Button } from '@/components/ui/Button'
import { ProgressBar } from '@/components/ui/ProgressBar'

interface QuizSummaryProps {
  correct: number
  total: number
  onRetry: () => void
  onExit: () => void
}

/**
 * Score summary screen shown at the end of a quiz.
 */
export function QuizSummary({ correct, total, onRetry, onExit }: QuizSummaryProps) {
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0
  const emoji = pct >= 80 ? '🏆' : pct >= 60 ? '👍' : '📚'
  const message = pct >= 80 ? 'Excellent work!' : pct >= 60 ? 'Good effort!' : 'Keep practicing!'

  return (
    <div className="flex flex-col items-center gap-6 py-8 text-center max-w-sm mx-auto">
      <div className="text-5xl" aria-hidden="true">{emoji}</div>
      <div>
        <h2 className="text-2xl font-bold text-text-primary">{message}</h2>
        <p className="text-text-muted mt-1 text-sm">You scored {correct} out of {total}</p>
      </div>

      <div className="w-full">
        <ProgressBar value={pct} showValue label="Score" color={pct >= 80 ? 'success' : pct >= 60 ? 'warning' : 'danger'} />
      </div>

      <div className="grid grid-cols-3 gap-4 w-full">
        <div className="bg-surface-muted rounded-xl p-3">
          <p className="text-xl font-bold text-success">{correct}</p>
          <p className="text-xs text-text-muted">Correct</p>
        </div>
        <div className="bg-surface-muted rounded-xl p-3">
          <p className="text-xl font-bold text-danger">{total - correct}</p>
          <p className="text-xs text-text-muted">Wrong</p>
        </div>
        <div className="bg-surface-muted rounded-xl p-3">
          <p className="text-xl font-bold text-text-primary">{pct}%</p>
          <p className="text-xs text-text-muted">Score</p>
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="secondary" onClick={onExit}>Exit</Button>
        <Button onClick={onRetry}>Try Again</Button>
      </div>
    </div>
  )
}
