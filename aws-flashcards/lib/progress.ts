/**
 * Progress Tracker module.
 *
 * All progress record operations go through this module.
 * Never call Supabase progress table directly from components or pages.
 */
import { createClient } from '@/lib/supabase/server'
import type { KnowledgeLevel, Progress, StudySessionSummary } from '@/types'

// ─── Upsert ───────────────────────────────────────────────────────────────────

/**
 * Creates or updates a progress record for a user/card pair.
 * Uses upsert with onConflict to prevent duplicate rows.
 */
export async function upsertProgress(params: {
  userId: string
  flashCardId: string
  knowledgeLevel: KnowledgeLevel
  completionStatus?: 'in_progress' | 'completed'
  score?: number
}): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase.from('progress').upsert(
    {
      user_id: params.userId,
      flash_card_id: params.flashCardId,
      completion_status: params.completionStatus ?? 'in_progress',
      score: params.score ?? 0,
      knowledge_level: params.knowledgeLevel,
      review_date: new Date().toISOString(),
    },
    { onConflict: 'user_id,flash_card_id' }
  )

  if (error) {
    console.error('[progress:upsert]', error.code, error.message)
    throw new Error('Failed to save progress')
  }
}

/**
 * Marks all provided flash card IDs as completed for a user.
 * Called at the end of a study session.
 */
export async function markSessionComplete(
  userId: string,
  flashCardIds: string[]
): Promise<void> {
  const supabase = await createClient()

  const records = flashCardIds.map((id) => ({
    user_id: userId,
    flash_card_id: id,
    completion_status: 'completed' as const,
    review_date: new Date().toISOString(),
  }))

  const { error } = await supabase
    .from('progress')
    .upsert(records, { onConflict: 'user_id,flash_card_id' })

  if (error) {
    console.error('[progress:markSessionComplete]', error.code, error.message)
    throw new Error('Failed to mark session as complete')
  }
}

// ─── Read ─────────────────────────────────────────────────────────────────────

/**
 * Calculates the user's completion percentage for a given topic.
 * Returns 0 when the topic contains no flash cards (division-by-zero guard).
 */
export async function getTopicCompletionPct(
  userId: string,
  topicId: string
): Promise<number> {
  const supabase = await createClient()

  // Get all card IDs for this topic
  const { data: cards, error: cardsError } = await supabase
    .from('flash_cards')
    .select('id')
    .eq('topic_id', topicId)

  if (cardsError) {
    console.error('[progress:getTopicCompletionPct:cards]', cardsError.code)
    throw new Error('Failed to fetch flash cards for topic')
  }

  if (!cards || cards.length === 0) return 0

  const cardIds = cards.map((c) => c.id)

  const { count, error: progressError } = await supabase
    .from('progress')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('completion_status', 'completed')
    .in('flash_card_id', cardIds)

  if (progressError) {
    console.error('[progress:getTopicCompletionPct:progress]', progressError.code)
    throw new Error('Failed to fetch progress for topic')
  }

  return Math.round(((count ?? 0) / cards.length) * 100)
}

/**
 * Returns all progress records for a user.
 */
export async function getUserProgress(userId: string): Promise<Progress[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('progress')
    .select(
      'id, user_id, flash_card_id, completion_status, score, knowledge_level, review_date'
    )
    .eq('user_id', userId)
    .order('review_date', { ascending: false })

  if (error) {
    console.error('[progress:getUserProgress]', error.code, error.message)
    throw new Error('Failed to fetch user progress')
  }

  return (data ?? []) as Progress[]
}

/**
 * Identifies weak concept card IDs for a user.
 * A card is "weak" when reviewed ≥2 times AND most recent knowledge_level is 'hard'.
 */
export async function getWeakConceptCardIds(userId: string): Promise<string[]> {
  const supabase = await createClient()

  // Cards rated 'hard' that the user has a progress record for
  const { data, error } = await supabase
    .from('progress')
    .select('flash_card_id, knowledge_level, review_date')
    .eq('user_id', userId)
    .eq('knowledge_level', 'hard')

  if (error) {
    console.error('[progress:getWeakConceptCardIds]', error.code, error.message)
    throw new Error('Failed to fetch weak concepts')
  }

  return (data ?? []).map((r) => r.flash_card_id)
}

/**
 * Builds a StudySessionSummary from an in-memory map of card → knowledge level.
 * Pure function — no DB calls.
 */
export function buildSessionSummary(
  ratings: Map<string, KnowledgeLevel>,
  repeatQueueCardIds: Set<string>
): StudySessionSummary {
  let easy = 0, medium = 0, hard = 0

  for (const level of ratings.values()) {
    if (level === 'easy') easy++
    else if (level === 'medium') medium++
    else hard++
  }

  return {
    total_reviewed: ratings.size,
    easy_count: easy,
    medium_count: medium,
    hard_count: hard,
    repeat_queue_count: repeatQueueCardIds.size,
  }
}
