import { Card } from '@/components/ui/Card'
import { ProgressBar } from '@/components/ui/ProgressBar'
import type { DashboardStats } from '@/types'

interface StatsPanelProps {
  stats: DashboardStats
}

/**
 * Displays overall progress and learning statistics on the Dashboard.
 */
export function StatsPanel({ stats }: StatsPanelProps) {
  const { overall_progress_pct, total_cards_reviewed, total_sessions_completed,
    knowledge_distribution, last_session_date, completed_topics_count } = stats

  return (
    <div className="flex flex-col gap-4">
      {/* Overall progress ring (represented as large progress bar) */}
      <Card>
        <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">
          Overall Progress
        </h2>
        <div className="flex items-center gap-6">
          {/* Circular progress indicator */}
          <div className="relative w-20 h-20 shrink-0">
            <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36" aria-hidden="true">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#334155" strokeWidth="3" />
              <circle
                cx="18" cy="18" r="15.9" fill="none"
                stroke="#FF9900" strokeWidth="3"
                strokeDasharray={`${overall_progress_pct} ${100 - overall_progress_pct}`}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-text-primary">
              {overall_progress_pct}%
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-text-primary font-semibold">{overall_progress_pct}% complete</p>
            <p className="text-sm text-text-muted">{completed_topics_count} topics completed</p>
            {last_session_date ? (
              <p className="text-xs text-text-muted">
                Last session: {new Date(last_session_date).toLocaleDateString()}
              </p>
            ) : (
              <p className="text-xs text-text-muted">No sessions yet — start studying!</p>
            )}
          </div>
        </div>
      </Card>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3">
        <Card variant="muted" className="p-4">
          <p className="text-2xl font-bold text-text-primary">{total_cards_reviewed}</p>
          <p className="text-xs text-text-muted mt-0.5">Cards reviewed</p>
        </Card>
        <Card variant="muted" className="p-4">
          <p className="text-2xl font-bold text-text-primary">{total_sessions_completed}</p>
          <p className="text-xs text-text-muted mt-0.5">Sessions completed</p>
        </Card>
      </div>

      {/* Knowledge distribution */}
      <Card>
        <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">
          Knowledge Distribution
        </h3>
        <div className="flex flex-col gap-3">
          <ProgressBar value={knowledge_distribution.easy} label="Easy" showValue color="success" />
          <ProgressBar value={knowledge_distribution.medium} label="Medium" showValue color="warning" />
          <ProgressBar value={knowledge_distribution.hard} label="Hard" showValue color="danger" />
        </div>
      </Card>
    </div>
  )
}
