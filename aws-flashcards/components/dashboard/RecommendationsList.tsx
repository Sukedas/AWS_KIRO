import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import type { AWSTopic } from '@/types'

interface RecommendationsListProps {
  topics: AWSTopic[]
}

/**
 * Displays up to 5 recommended next topics from the AI or fallback logic.
 */
export function RecommendationsList({ topics }: RecommendationsListProps) {
  return (
    <Card>
      <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">
        Recommended Next
        <span className="ml-2 text-primary" aria-hidden="true">✨</span>
      </h2>

      {topics.length === 0 ? (
        <div className="flex flex-col items-center py-8 gap-2 text-text-muted">
          <span className="text-3xl" aria-hidden="true">🤔</span>
          <p className="text-sm">Complete some sessions to get recommendations.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {topics.slice(0, 5).map((topic) => (
            <li key={topic.id}>
              <Link
                href={`/study/${topic.id}`}
                className="flex items-center justify-between p-3 rounded-xl bg-surface-muted hover:bg-surface-card transition-colors group"
              >
                <div className="flex-1 min-w-0 mr-3">
                  <p className="text-sm font-medium text-text-primary group-hover:text-primary transition-colors">
                    {topic.service_name}
                  </p>
                  <p className="text-xs text-text-muted mt-0.5">{topic.category}</p>
                </div>
                <Badge variant={topic.difficulty} label={topic.difficulty} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
