/**
 * Server-side Supabase client.
 *
 * Use inside API routes (app/api/) and Server Components.
 * Reads and writes session cookies through Next.js cookie helpers.
 * Never expose the service-role key — this module uses the anon key only.
 */
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // setAll is called from Server Components where cookies cannot be
            // mutated. The middleware handles session refresh instead.
          }
        },
      },
    }
  )
}
