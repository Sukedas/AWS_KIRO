/**
 * POST /api/ai/generate-cards
 *
 * Generates AI flash cards for an AWS topic.
 * Server-side only — never call the AI service from the client.
 */
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateFlashCards } from '@/lib/ai/card-generator'
import { generateCardsRequestSchema } from '@/lib/validation'
import type { AWSTopic, LearningLevel } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const parsed = generateCardsRequestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    // Fetch topic details
    const { data: topic } = await supabase
      .from('aws_topics')
      .select('id, category, service_name, description, difficulty')
      .eq('id', parsed.data.topic_id)
      .single()

    if (!topic) return NextResponse.json({ error: 'Topic not found' }, { status: 404 })

    // Fetch user learning level
    const { data: profile } = await supabase
      .from('users').select('learning_level').eq('id', user.id).single()
    const learningLevel: LearningLevel = (profile?.learning_level as LearningLevel) ?? 'beginner'

    const result = await generateFlashCards({
      topicName: (topic as AWSTopic).service_name,
      category: (topic as AWSTopic).category,
      difficulty: parsed.data.difficulty ?? (topic as AWSTopic).difficulty,
      count: parsed.data.count,
      learningLevel,
    })

    // Log to ai_history (server-side only — no prompt content stored in response)
    await supabase.from('ai_history').insert({
      user_id: user.id,
      prompt: `generate_cards:${(topic as AWSTopic).service_name}:${parsed.data.count}`,
      response: `${result.cards.length} cards generated`,
      request_type: 'generate_cards',
    })

    return NextResponse.json({ cards: result.cards, errors: result.errors })
  } catch (err) {
    console.error('[api:ai:generate-cards]', err)
    // Return generic message — never expose AI errors to client (Req 15 AC6)
    return NextResponse.json(
      { error: (err as Error).message || 'AI service error. Please try again.' },
      { status: 500 }
    )
  }
}
