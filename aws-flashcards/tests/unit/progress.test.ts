/**
 * Unit tests for lib/progress.ts
 * Covers: buildSessionSummary, completion % edge cases
 */
import { describe, it, expect } from 'vitest'
import { buildSessionSummary } from '@/lib/progress'
import type { KnowledgeLevel } from '@/types'

describe('buildSessionSummary', () => {
  it('correctly counts easy, medium, hard ratings', () => {
    const ratings = new Map<string, KnowledgeLevel>([
      ['card-1', 'easy'],
      ['card-2', 'medium'],
      ['card-3', 'hard'],
      ['card-4', 'easy'],
      ['card-5', 'hard'],
    ])
    const repeatQueue = new Set(['card-3', 'card-5'])

    const summary = buildSessionSummary(ratings, repeatQueue)

    expect(summary.total_reviewed).toBe(5)
    expect(summary.easy_count).toBe(2)
    expect(summary.medium_count).toBe(1)
    expect(summary.hard_count).toBe(2)
    expect(summary.repeat_queue_count).toBe(2)
  })

  it('returns all zeros for empty session', () => {
    const summary = buildSessionSummary(new Map(), new Set())
    expect(summary.total_reviewed).toBe(0)
    expect(summary.easy_count).toBe(0)
    expect(summary.medium_count).toBe(0)
    expect(summary.hard_count).toBe(0)
    expect(summary.repeat_queue_count).toBe(0)
  })

  it('handles all-easy session', () => {
    const ratings = new Map<string, KnowledgeLevel>([
      ['card-1', 'easy'],
      ['card-2', 'easy'],
    ])
    const summary = buildSessionSummary(ratings, new Set())
    expect(summary.easy_count).toBe(2)
    expect(summary.hard_count).toBe(0)
    expect(summary.repeat_queue_count).toBe(0)
  })

  it('repeat queue size is independent of hard count (cards queued at most once)', () => {
    const ratings = new Map<string, KnowledgeLevel>([
      ['card-1', 'hard'],
    ])
    // Even if hard, repeat queue only has it once
    const repeatQueue = new Set(['card-1'])
    const summary = buildSessionSummary(ratings, repeatQueue)
    expect(summary.hard_count).toBe(1)
    expect(summary.repeat_queue_count).toBe(1)
  })

  it('total_reviewed equals number of rated cards', () => {
    const ratings = new Map<string, KnowledgeLevel>(
      Array.from({ length: 20 }, (_, i) => [`card-${i}`, 'medium'])
    )
    const summary = buildSessionSummary(ratings, new Set())
    expect(summary.total_reviewed).toBe(20)
  })
})
