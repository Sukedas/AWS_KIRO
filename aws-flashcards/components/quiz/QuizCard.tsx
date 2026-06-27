'use client'

import type { PracticeQuestion } from '@/types'

interface QuizCardProps {
  question: PracticeQuestion
  index: number
  total: number
  selectedIndex: number | null
  onSelect: (index: number) => void
}

/**
 * Renders a single multiple-choice quiz question.
 * Shows immediate correct/incorrect feedback after selection.
 */
export function QuizCard({ question, index, total, selectedIndex, onSelect }: QuizCardProps) {
  const answered = selectedIndex !== null

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-text-muted">Question {index + 1} of {total}</span>
      </div>

      <p className="text-base font-medium text-text-primary leading-relaxed">
        {question.question}
      </p>

      <fieldset>
        <legend className="sr-only">Choose your answer</legend>
        <div className="flex flex-col gap-2">
          {question.options.map((option, i) => {
            const isCorrect = i === question.correct_index
            const isSelected = i === selectedIndex

            let optionClass = 'border border-surface-muted bg-surface-muted text-text-primary hover:border-primary hover:bg-primary/5'
            if (answered) {
              if (isCorrect) optionClass = 'border border-success bg-success/10 text-success'
              else if (isSelected) optionClass = 'border border-danger bg-danger/10 text-danger'
              else optionClass = 'border border-surface-muted bg-surface-muted text-text-muted opacity-60'
            }

            return (
              <button
                key={i}
                onClick={() => !answered && onSelect(i)}
                disabled={answered}
                aria-pressed={isSelected}
                className={[
                  'w-full text-left p-4 rounded-xl text-sm transition-all',
                  'disabled:cursor-not-allowed',
                  optionClass,
                ].join(' ')}
              >
                <span className="font-semibold mr-2">{['A', 'B', 'C', 'D'][i]}.</span>
                {option}
              </button>
            )
          })}
        </div>
      </fieldset>

      {/* Explanation — shown after answering */}
      {answered && (
        <div
          role="note"
          aria-live="polite"
          className={['p-4 rounded-xl text-sm',
            selectedIndex === question.correct_index
              ? 'bg-success/10 border border-success/30 text-success'
              : 'bg-danger/10 border border-danger/30 text-danger'
          ].join(' ')}
        >
          <p className="font-semibold mb-1">
            {selectedIndex === question.correct_index ? '✓ Correct!' : '✗ Incorrect'}
          </p>
          <p className="text-text-muted">{question.explanation}</p>
        </div>
      )}
    </div>
  )
}
