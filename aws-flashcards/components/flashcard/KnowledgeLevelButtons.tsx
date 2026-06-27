'use client'

import type { KnowledgeLevel } from '@/types'

interface KnowledgeLevelButtonsProps {
  onRate: (level: KnowledgeLevel) => void
  disabled?: boolean
}

const LEVELS: { level: KnowledgeLevel; label: string; classes: string }[] = [
  {
    level: 'easy',
    label: 'Easy',
    classes:
      'bg-success/20 text-success border border-success/40 hover:bg-success hover:text-white',
  },
  {
    level: 'medium',
    label: 'Medium',
    classes:
      'bg-warning/20 text-warning border border-warning/40 hover:bg-warning hover:text-white',
  },
  {
    level: 'hard',
    label: 'Hard',
    classes:
      'bg-danger/20 text-danger border border-danger/40 hover:bg-danger hover:text-white',
  },
]

/**
 * Three knowledge-level rating buttons shown on the answer side of a flash card.
 * Only rendered when the card is in the flipped (answer) state.
 */
export function KnowledgeLevelButtons({ onRate, disabled }: KnowledgeLevelButtonsProps) {
  return (
    <div className="flex gap-3 justify-center mt-6" role="group" aria-label="Rate your knowledge">
      {LEVELS.map(({ level, label, classes }) => (
        <button
          key={level}
          onClick={() => onRate(level)}
          disabled={disabled}
          className={[
            'flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold',
            'transition-all duration-150 active:scale-95',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            classes,
          ].join(' ')}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
