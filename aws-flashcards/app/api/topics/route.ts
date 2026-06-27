/**
 * API Route: /api/topics
 *
 * GET — fetch all AWS topics, optionally filtered by category.
 * Returns topics with per-user completion percentage when authenticated.
 */
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getTopicCompletionPct } from '@/lib/progress'
import type { AWSTopic, AWSCategory } from '@/types'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') as AWSCategory | null

    let query = supabase
      .from('aws_topics')
      .select('id, category, service_name, description, difficulty')
      .order('category')
      .order('service_name')

    if (category) {
      query = query.eq('category', category)
    }

    const { data, error } = await query
    if (error) {
      console.error('[api:topics:GET]', error.code, error.message)
      return NextResponse.json({ error: 'Failed to fetch topics' }, { status: 500 })
    }

    const topics = (data ?? []) as AWSTopic[]

    // Attach completion percentages for authenticated users
    if (user) {
      const topicsWithPct = await Promise.all(
        topics.map(async (t) => ({
          ...t,
          completion_pct: await getTopicCompletionPct(user.id, t.id),
        }))
      )
      return NextResponse.json({ topics: topicsWithPct })
    }

    // Unauthenticated: return topics without completion data (Req 3 AC9)
    return NextResponse.json({
      topics: topics.map((t) => ({ ...t, completion_pct: null })),
    })
  } catch (err) {
    console.error('[api:topics:GET] unexpected', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
