'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { FlashCardDeck } from '@/components/flashcard/FlashCardDeck'
import { Spinner } from '@/components/ui/Spinner'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import type { FlashCard, AWSTopic, KnowledgeLevel, StudySessionSummary } from '@/types'

export default function StudyPage() {
  const { topicId } = useParams<{ topicId: string }>()
  const router = useRouter()

  const [topic, setTopic] = useState<AWSTopic | null>(null)
  const [cards, setCards] = useState<FlashCard[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [summary, setSummary] = useState<StudySessionSummary | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setUserId(user.id)

      const { data: topicData } = await supabase
        .from('aws_topics')
        .select('id, category, service_name, description, difficulty')
        .eq('id', topicId)
        .single()

      if (!topicData) { setError('Topic not found.'); setLoading(false); return }
      setTopic(topicData as AWSTopic)

      const { data: cardData } = await supabase
        .from('flash_cards')
        .select('id, topic_id, question, answer, explanation, difficulty, aws_category, aws_service, real_world_scenario, ai_generated, documentation_links')
        .eq('topic_id', topicId)
        .order('difficulty')

      setCards((cardData ?? []) as FlashCard[])
      setLoading(false)
    }
    load()
  }, [topicId])

  // Called on every card rating — persists to DB
  async function handleRateCard(cardId: string, level: KnowledgeLevel) {
    if (!userId) return
    const supabase = createClient()
    await supabase.from('progress').upsert(
      { user_id: userId, flash_card_id: cardId, knowledge_level: level,
        completion_status: 'in_progress', review_date: new Date().toISOString() },
      { onConflict: 'user_id,flash_card_id' }
    )
  }

  // Called when session completes — marks all cards as completed
  async function handleSessionComplete(sessionSummary: StudySessionSummary) {
    if (userId && cards.length > 0) {
      const supabase = createClient()
      const records = cards.map(c => ({
        user_id: userId, flash_card_id: c.id,
        completion_status: 'completed' as const,
        review_date: new Date().toISOString()
      }))
      await supabase.from('progress').upsert(records, { onConflict: 'user_id,flash_card_id' })
    }
    setSummary(sessionSummary)
  }

  if (loading) return (
    <div className="flex justify-center items-center py-20">
      <Spinner size="lg" label="Loading flash cards…" />
    </div>
  )

  if (error) return (
    <div className="flex flex-col items-center py-20 gap-4">
      <p className="text-danger">{error}</p>
      <Button variant="secondary" onClick={() => router.push('/topics')}>Back to Topics</Button>
    </div>
  )

  if (cards.length === 0) return (
    <div className="flex flex-col items-center py-20 gap-4 text-text-muted">
      <span className="text-4xl" aria-hidden="true">📭</span>
      <p>No flash cards available for this topic yet.</p>
      <Button variant="secondary" onClick={() => router.push('/topics')}>Back to Topics</Button>
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      {/* Header */}
      <div>
        <button onClick={() => router.push('/topics')} className="text-sm text-text-muted hover:text-primary mb-2 flex items-center gap-1">
          ← Back to Topics
        </button>
        <h1 className="text-2xl font-bold text-text-primary">{topic?.service_name}</h1>
        <p className="text-text-muted text-sm mt-1">{topic?.category} · {cards.length} cards</p>
      </div>

      {/* Session summary */}
      {summary ? (
        <Card className="text-center">
          <div className="text-4xl mb-3" aria-hidden="true">🎉</div>
          <h2 className="text-xl font-bold text-text-primary mb-4">Session Complete!</h2>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div>
              <p className="text-2xl font-bold text-success">{summary.easy_count}</p>
              <p className="text-xs text-text-muted">Easy</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-warning">{summary.medium_count}</p>
              <p className="text-xs text-text-muted">Medium</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-danger">{summary.hard_count}</p>
              <p className="text-xs text-text-muted">Hard</p>
            </div>
          </div>
          <p className="text-sm text-text-muted mb-6">
            {summary.total_reviewed} cards reviewed · {summary.repeat_queue_count} repeated
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="secondary" onClick={() => router.push('/topics')}>All Topics</Button>
            <Button onClick={() => { setSummary(null); }}>Study Again</Button>
          </div>
        </Card>
      ) : (
        <FlashCardDeck
          cards={cards}
          onSessionComplete={handleSessionComplete}
          onRateCard={handleRateCard}
        />
      )}
    </div>
  )
}
