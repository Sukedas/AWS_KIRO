/**
 * API Route: /api/dashboard
 *
 * GET — returns all data needed to render the Dashboard page.
 * Aggregates: overall progress, stats, weak concepts, recommendations.
 */
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  getUserProgress,
  getWeakConceptCardIds,
  getTopicCompletionPct,
} from '@/lib/progress'
import type { AWSTopic, FlashCard, DashboardStats } from '@/types'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Total flash cards in the app
    const { count: totalCards } = await supabase
      .from('flash_cards')
      .select('id', { count: 'exact', head: true })

    // User progress records
    const progressRecords = await getUserProgress(user.id)
    const completedCount = progressRecords.filter(
      (p) => p.completion_status === 'completed'
    ).length

    // Overall progress % (Req 8 AC2)
    const overallPct =
      totalCards && totalCards > 0
        ? Math.round((completedCount / totalCards) * 100)
        : 0

    // Knowledge distribution — percentages sum to 100
    const rated = progressRecords.filter((p) => p.knowledge_level)
    const ratedTotal = rated.length || 1
    const easy = Math.round(
      (rated.filter((p) => p.knowledge_level === 'easy').length / ratedTotal) * 100
    )
    const medium = Math.round(
      (rated.filter((p) => p.knowledge_level === 'medium').length / ratedTotal) * 100
    )
    const hard = 100 - easy - medium // ensures exact 100% sum

    // Last session date
    const lastSession = progressRecords[0]?.review_date

    // Weak concept cards
    const weakCardIds = await getWeakConceptCardIds(user.id)
    let weakCards: FlashCard[] = []
    if (weakCardIds.length > 0) {
      const { data } = await supabase
        .from('flash_cards')
        .select(
          'id, topic_id, question, answer, explanation, difficulty, aws_category, aws_service, real_world_scenario, ai_generated, documentation_links'
        )
        .in('id', weakCardIds.slice(0, 10))
      weakCards = (data ?? []) as FlashCard[]
    }

    // All topics for completion tracking
    const { data: topicRows } = await supabase
      .from('aws_topics')
      .select('id, category, service_name, description, difficulty')
    const topics = (topicRows ?? []) as AWSTopic[]

    // Completed topics (100% completion)
    let completedTopicsCount = 0
    const topicPcts: { topic: AWSTopic; pct: number }[] = []

    for (const topic of topics) {
      const pct = await getTopicCompletionPct(user.id, topic.id)
      topicPcts.push({ topic, pct })
      if (pct === 100) completedTopicsCount++
    }

    // Recommendations: incomplete topics sorted by lowest completion (Req 12 AC4 fallback)
    const recommendations = topicPcts
      .filter(({ pct }) => pct < 100)
      .sort((a, b) => a.pct - b.pct)
      .slice(0, 5)
      .map(({ topic }) => topic)

    const stats: DashboardStats = {
      overall_progress_pct: overallPct,
      completed_topics_count: completedTopicsCount,
      total_cards_reviewed: progressRecords.length,
      total_sessions_completed: completedCount,
      knowledge_distribution: { easy, medium, hard },
      last_session_date: lastSession,
      weak_concepts: weakCards,
      recommendations,
    }

    return NextResponse.json({ stats })
  } catch (err) {
    console.error('[api:dashboard:GET]', err)
    return NextResponse.json({ error: 'Failed to load dashboard data' }, { status: 500 })
  }
}
