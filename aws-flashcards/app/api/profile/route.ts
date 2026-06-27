/**
 * API Route: /api/profile
 *
 * GET  — fetch the authenticated user's profile
 * PATCH — update username and/or learning_level
 *
 * Partial updates are supported: only valid fields are persisted.
 */
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserProfile, updateUserProfile } from '@/lib/auth'
import { profileUpdateSchema } from '@/lib/validation'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const profile = await getUserProfile(user.id)
    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    return NextResponse.json({ profile })
  } catch (err) {
    console.error('[api:profile:GET]', err)
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const parsed = profileUpdateSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const result = await updateUserProfile(user.id, parsed.data)

    if (result.saved.length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update', skipped: result.skipped },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true, saved: result.saved, skipped: result.skipped })
  } catch (err) {
    console.error('[api:profile:PATCH]', err)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}
