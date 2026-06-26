/**
 * Browser-side Supabase client.
 *
 * Use ONLY inside Client Components ('use client') for auth state listeners
 * and real-time subscriptions. For data fetching in Server Components or API
 * routes, use lib/supabase/server.ts instead.
 */
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
