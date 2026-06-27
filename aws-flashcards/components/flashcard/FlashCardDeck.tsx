'use client'

import { useState, useCallback } from 'react'
import type { FlashCard as FlashCardType, KnowledgeLevel, StudySessionSummary } from '@/types'
import { FlashCard } from './FlashCard'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Button } from '@/components/ui/Button'
import { buildSessionSummary } from '@/lib/progress'

interface FlashCardDeckProps {
  cards: FlashCardType[]
  onSessionComplete: (summary: StudySessionSummary) => void
  onRateCard?: (cardId: string, level: KnowledgeLevel) => Promise<void>
}

type Phase = 'initial' | 'repeat' | 'complete'

/**
 * Manages the full study session flow:
 * 1. Initial pass through all cards
 * 2. Repeat pass for cards rated 'hard'
 * 3. Session complete — fires onSessionComplete
 */
export function FlashCardDeck({ cards, onSessionComplete, onRateCard }: FlashCardDeckProps) {
  const [phase, setPhase] = useState<Phase>('initial')
  const [currentIndex, setCurrentIndex] = useState(0)
  // Map from cardId → final knowledge level
  const [ratings, setRatings] = useState<Map<string, KnowledgeLevel>>(new Map())
  // Repeat queue — each card appears at most once
  const [repeatQueue, setRepeatQueue] = useState<FlashCardType[]>([])
  const [repeatIndex, setRepeatIndex] = useState(0)

  const activeCards = phase === 'repeat' ? repeatQueue : cards
  const activeIndex = phase === 'repeat' ? repeatIndex : currentIndex
  const totalInPass = activeCards.length

  const handleRate = useCallback(
    async (cardId: string, level: KnowledgeLevel) => {
      // Persist to DB
      await onRateCard?.(cardId, level)

      // Update local ratings map
      setRatings((prev) => {
        const next = new Map(prev)
        next.set(cardId, level)
        return next
      })

      // Add to repeat queue (max once) if rated hard and in initial pass
      if (level === 'hard' && phase === 'initial') {
        setRepeatQueue((prev) => {
          const alreadyQueued = prev.some((c) => c.id === cardId)
          if (alreadyQueued) return prev
          const card = cards.find((c) => c.id === cardId)
          return card ? [...prev, card] : prev
        })
      }

      // Advance to next card
      if (phase === 'initial') {
        if (currentIndex < cards.length - 1) {
          setCurrentIndex((i) => i + 1)
        } else {
          // Initial pass done — check repeat queue
          setRepeatQueue((queue) => {
            if (queue.length > 0) {
              setPhase('repeat')
              setRepeatIndex(0)
            } else {
              // Build summary and complete
              const finalRatings = new Map(ratings)
              finalRatings.set(cardId, level)
              const summary = buildSessionSummary(
                finalRatings,
                new Set(queue.map((c) => c.id))
              )
              onSessionComplete(summary)
              setPhase('complete')
            }
            return queue
          })
        }
      } else if (phase === 'repeat') {
        if (repeatIndex < repeatQueue.length - 1) {
          setRepeatIndex((i) => i + 1)
        } else {
          // Repeat pass done
          const finalRatings = new Map(ratings)
          finalRatings.set(cardId, level)
          const summary = buildSessionSummary(
            finalRatings,
            new Set(repeatQueue.map((c) => c.id))
          )
          onSessionComplete(summary)
          setPhase('complete')
        }
      }
    },
    [phase, currentIndex, repeatIndex, repeatQueue, cards, ratings, onRateCard, onSessionComplete]
  )

  if (phase === 'complete') return null // Parent renders summary screen

  const currentCard = activeCards[activeIndex]
  if (!currentCard) return null

  const progress = ((activeIndex + 1) / totalInPass) * 100

  return (
    <div className="flex flex-col gap-6">
      {/* Session header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-text-muted">
            {phase === 'repeat' ? '🔁 Repeat pass' : 'Study session'}
          </p>
          <p className="text-lg font-semibold text-text-primary">
            Card {activeIndex + 1} of {totalInPass}
          </p>
        </div>
        <span className="text-sm text-text-muted">
          {Math.round(progress)}% complete
        </span>
      </div>

      <ProgressBar value={progress} aria-label="Session progress" />

      {/* Flash card */}
      <FlashCard card={currentCard} onRate={handleRate} />
    </div>
  )
}
