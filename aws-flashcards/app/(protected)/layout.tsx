import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/Navbar'
import { BottomNav } from '@/components/layout/BottomNav'
import { LogoutButton } from '@/components/layout/LogoutButton'

/**
 * Shared layout for all authenticated (protected) routes.
 * Verifies the session server-side; redirects to /login if unauthenticated.
 */
export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Fetch username for navbar
  const { data: profile } = await supabase
    .from('users')
    .select('username, learning_level')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Navbar username={profile?.username} logoutButton={<LogoutButton />} />
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-6 max-w-7xl mx-auto w-full">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
