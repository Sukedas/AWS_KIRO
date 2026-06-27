'use client'

import { useState, useCallback } from 'react'
import type { FlashCard as FlashCardType, KnowledgeLevel } from '@/types'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { KnowledgeLevelButtons } from './KnowledgeLevelButtons'

interface FlashCardProps {
  card: FlashCardType
  /** Called when the user selects a knowledge level — advances the session */
  onRate: (cardId: string, level: KnowledgeLevel) => void
  /** Pre-stored hints from DB (shown as fallback when AI is unavailable) */
  storedHints?: string[]
  /** Current hint count used this session (0–3) */
  hintsUsed?: number
  onRequestHint?: (cardId: string) => void
  isRequestingHint?: boolean
  activeHint?: string | null
  disabled?: boolean
}

const MAX_HINTS = 3

/**
 * Interactive flash card with CSS 3D flip animation.
 *
 * Front face: question + optional Hint button
 * Back face:  answer, explanation, documentation links, knowledge-level rating buttons
 *
 * Flip trigger: click, Enter, or Space (accessible)
 * Flip duration: 400ms CSS rotateY transition
 */
export function FlashCard({
  card,
  onRate,
  storedHints = [],
  hintsUsed = 0,
  onRequestHint,
  isRequestingHint = false,
  activeHint = null,
  disabled = false,
}: FlashCardProps) {
  const [isFlipped, setIsFlipped] = useState(false)
  const [hintVisible, setHintVisible] = useState(false)

  const flip = useCallback(() => {
    if (disabled) return
    setIsFlipped((f) => !f)
    // Hide hint when returning to question side
    if (isFlipped) setHintVisible(false)
  }, [disabled, isFlipped])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        flip()
      }
    },
    [flip]
  )

  const handleRate = useCallback(
    (level: KnowledgeLevel) => {
      onRate(card.id, level)
    },
    [card.id, onRate]
  )

  const handleHint = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation() // don't trigger flip
      if (hintsUsed >= MAX_HINTS) return
      setHintVisible(true)
      onRequestHint?.(card.id)
    },
    [card.id, hintsUsed, onRequestHint]
  )

  const hasHints = storedHints.length > 0 || onRequestHint
  const hintsRemaining = MAX_HINTS - hintsUsed
  const displayedHint = activeHint ?? (hintVisible ? storedHints[hintsUsed - 1] : null)

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* 3D flip container */}
      <div
        className="perspective-1000 w-full"
        style={{ height: '360px' }}
      >
        <div
          role="button"
          tabIndex={0}
          aria-label={isFlipped ? 'Flash card answer side. Press Enter or Space to flip back.' : 'Flash card question side. Press Enter or Space to flip.'}
          aria-pressed={isFlipped}
          onKeyDown={handleKeyDown}
          onClick={flip}
          className={[
            'relative w-full h-full transform-style-3d cursor-pointer',
            'transition-transform duration-[400ms] ease-in-out',
            isFlipped ? 'rotate-y-180' : '',
          ].join(' ')}
        >
          {/* ── FRONT FACE (question) ── */}
          <div className="absolute inset-0 backface-hidden bg-surface-card rounded-2xl p-6 flex flex-col justify-between border border-surface-muted">
            {/* Top row: category + AI badge */}
            <div className="flex items-center justify-between">
              <Badge variant="category" label={card.aws_category} />
              <div className="flex gap-2">
                <Badge variant={card.difficulty} label={card.difficulty} />
                {card.ai_generated && <Badge variant="ai" label="AI Generated" />}
              </div>
            </div>

            {/* Question */}
            <div className="flex-1 flex items-center justify-center py-4">
              <p className="text-lg font-medium text-text-primary text-center leading-relaxed">
                {card.question}
              </p>
            </div>

            {/* Bottom row: hint button + flip hint */}
            <div className="flex items-center justify-between">
              {hasHints && hintsRemaining > 0 ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleHint}
                  loading={isRequestingHint}
                  aria-label={`Request hint. ${hintsRemaining} hint${hintsRemaining === 1 ? '' : 's'} remaining`}
                >
                  💡 Hint ({hintsRemaining}/{MAX_HINTS})
                </Button>
              ) : (
                <span />
              )}
              <span className="text-xs text-text-muted">Click or press Space to flip</span>
            </div>
          </div>

          {/* ── BACK FACE (answer) ── */}
          <div className="absolute inset-0 backface-hidden rotate-y-180 bg-surface-muted rounded-2xl p-6 flex flex-col border border-surface-muted">
            {/* Answer */}
            <div className="mb-3">
              <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">Answer</p>
              <p className="text-base font-medium text-text-primary">{card.answer}</p>
            </div>

            {/* Explanation */}
            {card.explanation && (
              <div className="mb-3 flex-1 overflow-y-auto">
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">Explanation</p>
                <p className="text-sm text-text-muted leading-relaxed">{card.explanation}</p>
              </div>
            )}

            {/* Documentation links */}
            {card.documentation_links.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">Docs</p>
                <ul className="flex flex-wrap gap-2">
                  {card.documentation_links.map((url, i) => (
                    <li key={i}>
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs text-primary hover:underline"
                        aria-label={`AWS documentation link ${i + 1}`}
                      >
                        📄 Docs {i + 1}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Knowledge level buttons — only on answer side */}
            <KnowledgeLevelButtons onRate={handleRate} disabled={disabled} />
          </div>
        </div>
      </div>

      {/* Hint panel — slides in below card, never flips the card */}
      {hintVisible && displayedHint && (
        <div
          role="note"
          aria-live="polite"
          className="mt-4 p-4 bg-primary/10 border border-primary/30 rounded-xl"
        >
          <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">
            Hint {hintsUsed}/{MAX_HINTS}
          </p>
          <p className="text-sm text-text-primary">{displayedHint}</p>
        </div>
      )}
    </div>
  )
}
