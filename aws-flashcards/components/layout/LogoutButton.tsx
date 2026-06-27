'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { useState } from 'react'

/**
 * Client component that handles sign-out.
 * On failure, aborts and preserves session state (Req 1 AC6).
 */
export function LogoutButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleLogout() {
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signOut()

    if (error) {
      // Abort — do not clear state or redirect (Req 1 AC6)
      console.error('[auth:signOut] failed:', error.message)
      setLoading(false)
      return
    }

    router.push('/login')
    router.refresh()
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleLogout} loading={loading}>
      Sign out
    </Button>
  )
}
