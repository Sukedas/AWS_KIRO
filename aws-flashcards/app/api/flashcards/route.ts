/**
 * API Route: /api/flashcards
 *
 * GET  — fetch flash cards for a topic, with optional difficulty filter
 * POST — save an AI-generated flash card to a topic deck
 */
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { flashCardSchema } from '@/lib/validation'
import type { FlashCard } from '@/types'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const topicId = searchParams.get('topic_id')
    const difficulty = searchParams.get('difficulty')
    const search = searchParams.get('q')

    if (!topicId) {
      return NextResponse.json({ error: 'topic_id is required' }, { status: 400 })
    }

    let query = supabase
      .from('flash_cards')
      .select('id, topic_id, question, answer, explanation, difficulty, aws_category, aws_service, real_world_scenario, ai_generated, documentation_links')
      .eq('topic_id', topicId)

    if (difficulty) {
      query = query.eq('difficulty', difficulty)
    }

    const { data, error } = await query.order('difficulty')
    if (error) {
      console.error('[api:flashcards:GET]', error.code, error.message)
      return NextResponse.json({ error: 'Failed to fetch flash cards' }, { status: 500 })
    }

    let cards = (data ?? []) as FlashCard[]

    // Search filter applied in-memory (case-insensitive, ≥2 chars)
    if (search && search.length >= 2) {
      const lower = search.toLowerCase()
      cards = cards.filter(
        (c) =>
          c.question.toLowerCase().includes(lower) ||
          c.explanation.toLowerCase().includes(lower)
      )
    }

    return NextResponse.json({ cards })
  } catch (err) {
    console.error('[api:flashcards:GET] unexpected', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const parsed = flashCardSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid flash card data', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { topic_id, ...cardData } = body as { topic_id: string } & typeof parsed.data

    if (!topic_id) {
      return NextResponse.json({ error: 'topic_id is required' }, { status: 400 })
    }

    const { data: saved, error } = await supabase
      .from('flash_cards')
      .insert({ topic_id, ...parsed.data })
      .select()
      .single()

    if (error) {
      console.error('[api:flashcards:POST]', error.code, error.message)
      return NextResponse.json({ error: 'Failed to save flash card' }, { status: 500 })
    }

    return NextResponse.json({ card: saved }, { status: 201 })
  } catch (err) {
    console.error('[api:flashcards:POST] unexpected', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
