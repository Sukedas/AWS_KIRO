/**
 * Auth Service module.
 *
 * All authentication operations go through this module.
 * Never call supabase.auth directly from pages or components — use these helpers.
 */
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { User } from '@/types'

// ─── Session ──────────────────────────────────────────────────────────────────

/**
 * Returns the authenticated user from the server-side session.
 * Redirects to /login if no valid session exists.
 */
export async function requireAuth(): Promise<{ id: string; email: string }> {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  return { id: user.id, email: user.email! }
}

/**
 * Returns the authenticated user or null — does NOT redirect.
 * Use in layouts or pages that support both auth states.
 */
export async function getOptionalUser(): Promise<{ id: string; email: string } | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  return { id: user.id, email: user.email! }
}

// ─── Profile ──────────────────────────────────────────────────────────────────

/**
 * Fetches the user profile row from the `users` table.
 * Returns null if not found.
 */
export async function getUserProfile(userId: string): Promise<User | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('users')
    .select('id, username, email, learning_level, created_at')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('[auth:getUserProfile]', error.code, error.message)
    return null
  }

  return data as User
}

/**
 * Creates a user profile row after registration.
 * Sets default learning_level to 'beginner'.
 */
export async function createUserProfile(params: {
  id: string
  username: string
  email: string
}): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase.from('users').insert({
    id: params.id,
    username: params.username,
    email: params.email,
    learning_level: 'beginner',
  })

  if (error) {
    console.error('[auth:createUserProfile]', error.code, error.message)
    throw new Error('Failed to create user profile')
  }
}

/**
 * Updates specific profile fields. Validates before writing.
 * Only persists fields that pass validation — skips invalid ones.
 *
 * Returns an object describing which fields were saved and which were skipped.
 */
export async function updateUserProfile(
  userId: string,
  updates: { username?: string; learning_level?: string }
): Promise<{ saved: string[]; skipped: string[] }> {
  const supabase = await createClient()
  const saved: string[] = []
  const skipped: string[] = []
  const validUpdates: Record<string, string> = {}

  // Validate username
  if (updates.username !== undefined) {
    if (
      typeof updates.username !== 'string' ||
      updates.username.length < 3 ||
      updates.username.length > 50
    ) {
      skipped.push('username')
    } else {
      validUpdates.username = updates.username
      saved.push('username')
    }
  }

  // Validate learning_level
  if (updates.learning_level !== undefined) {
    if (!['beginner', 'intermediate', 'advanced'].includes(updates.learning_level)) {
      skipped.push('learning_level')
    } else {
      validUpdates.learning_level = updates.learning_level
      saved.push('learning_level')
    }
  }

  // Only write if there's something valid to save
  if (Object.keys(validUpdates).length > 0) {
    const { error } = await supabase
      .from('users')
      .update(validUpdates)
      .eq('id', userId)

    if (error) {
      console.error('[auth:updateUserProfile]', error.code, error.message)
      throw new Error('Failed to update profile')
    }
  }

  return { saved, skipped }
}
