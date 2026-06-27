/**
 * POST /api/ai/recommend
 *
 * Returns up to 5 recommended AWS topics for the authenticated user.
 */
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getRecommendations } from '@/lib/ai/recommendations'
import { getUserProgress, getWeakConceptCardIds, getTopicCompletionPct } from '@/lib/progress'
import type { AWSTopic, LearningLevel } from '@/types'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Fetch user profile
    const { data: profile } = await supabase
      .from('users').select('learning_level').eq('id', user.id).single()
    const learningLevel: LearningLevel = (profile?.learning_level as LearningLevel) ?? 'beginner'

    // Fetch all topics
    const { data: topicRows } = await supabase
      .from('aws_topics')
      .select('id, category, service_name, description, difficulty')
    const topics = (topicRows ?? []) as AWSTopic[]

    // Compute completion % for each topic
    const topicsWithPct = await Promise.all(
      topics.map(async (t) => ({
        topic: t,
        pct: await getTopicCompletionPct(user.id, t.id),
      }))
    )

    // Completed topic names
    const completedTopics = topicsWithPct
      .filter(({ pct }) => pct === 100)
      .map(({ topic }) => topic.service_name)

    // Weak concept card IDs → topic names
    const progressRecords = await getUserProgress(user.id)
    const weakCardIds = await getWeakConceptCardIds(user.id)
    let weakConcepts: string[] = []
    if (weakCardIds.length > 0) {
      const { data: weakCards } = await supabase
        .from('flash_cards').select('aws_service').in('id', weakCardIds.slice(0, 20))
      weakConcepts = [...new Set((weakCards ?? []).map((c: { aws_service: string }) => c.aws_service).filter(Boolean))]
    }

    const recommendations = await getRecommendations({
      userId: user.id,
      learningLevel,
      completedTopics,
      weakConcepts,
      topicsWithPct,
    })

    // Log to ai_history
    await supabase.from('ai_history').insert({
      user_id: user.id,
      prompt: `recommend:progress=${progressRecords.length}`,
      response: recommendations.map((r) => r.topic.service_name).join(','),
      request_type: 'recommend',
    })

    return NextResponse.json({ recommendations })
  } catch (err) {
    console.error('[api:ai:recommend]', err)
    return NextResponse.json(
      { error: (err as Error).message || 'AI service error. Please try again.' },
      { status: 500 }
    )
  }
}
