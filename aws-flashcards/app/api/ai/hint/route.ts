/**
 * POST /api/ai/hint
 *
 * Generates a contextual hint for a flash card question.
 * Never includes the answer in the prompt (Req 13 AC1).
 */
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateHint } from '@/lib/ai/hint-generator'
import { z } from 'zod'
import type { AWSTopic } from '@/types'

const hintRequestSchema = z.object({
  flash_card_id: z.string().uuid('Invalid flash card ID'),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const parsed = hintRequestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    // Fetch flash card — only question field (never pass answer to AI, Req 13 AC1)
    const { data: card } = await supabase
      .from('flash_cards')
      .select('id, question, topic_id, aws_category')
      .eq('id', parsed.data.flash_card_id)
      .single()

    if (!card) return NextResponse.json({ error: 'Flash card not found' }, { status: 404 })

    // Fetch topic name
    const { data: topic } = await supabase
      .from('aws_topics')
      .select('service_name, category')
      .eq('id', card.topic_id)
      .single()

    const result = await generateHint(
      {
        question: card.question,
        topicName: (topic as AWSTopic)?.service_name ?? card.aws_category,
        category: (topic as AWSTopic)?.category ?? card.aws_category,
      },
      [] // stored hints — extend this to pass from flash card data if needed
    )

    // Log to ai_history
    await supabase.from('ai_history').insert({
      user_id: user.id,
      prompt: 'hint:[redacted]',
      response: result.hint.slice(0, 300),
      request_type: 'hint',
    })

    return NextResponse.json({
      hint: result.hint,
      from_ai: result.fromAI,
    })
  } catch (err) {
    console.error('[api:ai:hint]', err)
    return NextResponse.json(
      { error: (err as Error).message || 'AI service error. Please try again.' },
      { status: 500 }
    )
  }
}
