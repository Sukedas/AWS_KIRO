/**
 * Unit tests for lib/auth.ts — updateUserProfile validation logic
 * We test the validation decisions without real DB calls by mocking Supabase.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the supabase server client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

// Mock next/navigation to avoid redirect in tests
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}))

import { updateUserProfile } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

const mockUpdate = vi.fn().mockReturnValue({ error: null })
const mockEq = vi.fn().mockReturnValue({ error: null })
const mockFrom = vi.fn().mockReturnValue({
  update: () => ({ eq: mockEq }),
  select: () => ({ eq: () => ({ single: () => ({ data: null, error: null }) }) }),
})

beforeEach(() => {
  vi.mocked(createClient).mockResolvedValue({
    from: mockFrom,
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
  } as never)
  mockEq.mockReturnValue({ error: null })
  mockUpdate.mockReset()
})

describe('updateUserProfile — field validation', () => {
  it('reports username as saved when valid', async () => {
    const result = await updateUserProfile('user-1', { username: 'validname' })
    expect(result.saved).toContain('username')
    expect(result.skipped).not.toContain('username')
  })

  it('reports username as skipped when too short', async () => {
    const result = await updateUserProfile('user-1', { username: 'ab' })
    expect(result.skipped).toContain('username')
    expect(result.saved).not.toContain('username')
  })

  it('reports username as skipped when too long', async () => {
    const result = await updateUserProfile('user-1', { username: 'a'.repeat(51) })
    expect(result.skipped).toContain('username')
  })

  it('reports username as skipped for non-string value', async () => {
    const result = await updateUserProfile('user-1', { username: 123 as unknown as string })
    expect(result.skipped).toContain('username')
  })

  it('reports learning_level as saved when valid', async () => {
    const result = await updateUserProfile('user-1', { learning_level: 'advanced' })
    expect(result.saved).toContain('learning_level')
  })

  it('reports learning_level as skipped for invalid value', async () => {
    const result = await updateUserProfile('user-1', { learning_level: 'expert' })
    expect(result.skipped).toContain('learning_level')
  })

  it('saves valid fields and skips invalid fields in a mixed update', async () => {
    const result = await updateUserProfile('user-1', {
      username: 'goodname',
      learning_level: 'invalid-level',
    })
    expect(result.saved).toContain('username')
    expect(result.skipped).toContain('learning_level')
  })

  it('returns both skipped when all fields are invalid', async () => {
    const result = await updateUserProfile('user-1', {
      username: 'x',
      learning_level: 'ninja',
    })
    expect(result.saved).toHaveLength(0)
    expect(result.skipped).toContain('username')
    expect(result.skipped).toContain('learning_level')
  })
})
