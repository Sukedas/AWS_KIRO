import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import type { FlashCard } from '@/types'

interface WeakConceptsListProps {
  cards: FlashCard[]
}

/**
 * Lists flash cards identified as weak concepts (rated 'hard' ≥ 2 times).
 */
export function WeakConceptsList({ cards }: WeakConceptsListProps) {
  return (
    <Card>
      <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">
        Weak Concepts
        <span className="ml-2 text-danger font-normal normal-case">({cards.length})</span>
      </h2>

      {cards.length === 0 ? (
        <div className="flex flex-col items-center py-8 gap-2 text-text-muted">
          <span className="text-3xl" aria-hidden="true">🎯</span>
          <p className="text-sm">No weak concepts yet — great work!</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {cards.map((card) => (
            <li key={card.id}>
              <Link
                href={`/study/${card.topic_id}`}
                className="flex items-start justify-between p-3 rounded-xl bg-surface-muted hover:bg-surface-card transition-colors group"
              >
                <div className="flex-1 min-w-0 mr-3">
                  <p className="text-sm text-text-primary line-clamp-2 group-hover:text-primary transition-colors">
                    {card.question}
                  </p>
                  <p className="text-xs text-text-muted mt-1">{card.aws_category}</p>
                </div>
                <Badge variant="hard" label="Hard" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
