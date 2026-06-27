/**
 * API Route: /api/progress
 *
 * POST — upsert a single progress record (called after rating a flash card)
 * GET  — fetch all progress records for the authenticated user
 *
 * All DB writes go through the Progress_Tracker module (lib/progress.ts).
 * Auth is validated server-side before any DB operation.
 */
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { upsertProgress, getUserProgress } from '@/lib/progress'
import { z } from 'zod'

const upsertSchema = z.object({
  flash_card_id: z.string().uuid('Invalid flash card ID'),
  knowledge_level: z.enum(['easy', 'medium', 'hard']),
  completion_status: z.enum(['in_progress', 'completed']).default('in_progress'),
  score: z.number().int().min(0).max(100).default(0),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = upsertSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    await upsertProgress({
      userId: user.id,
      flashCardId: parsed.data.flash_card_id,
      knowledgeLevel: parsed.data.knowledge_level,
      completionStatus: parsed.data.completion_status,
      score: parsed.data.score,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[api:progress:POST]', err)
    return NextResponse.json({ error: 'Failed to save progress' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const records = await getUserProgress(user.id)
    return NextResponse.json({ progress: records })
  } catch (err) {
    console.error('[api:progress:GET]', err)
    return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 })
  }
}
