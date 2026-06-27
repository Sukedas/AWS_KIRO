'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      // Return generic message — never reveal which field is wrong (Req 1 AC5)
      setError('Invalid credentials. Please check your email and password.')
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <main className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">☁</div>
          <h1 className="text-2xl font-bold text-text-primary">AWS Flash Cards</h1>
          <p className="text-text-muted text-sm mt-1">Sign in to continue learning</p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            <h2 className="text-lg font-semibold text-text-primary">Sign in</h2>

            {error && (
              <div role="alert" className="p-3 bg-danger/10 border border-danger/30 rounded-xl text-sm text-danger">
                {error}
              </div>
            )}

            <Input
              label="Email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
            />

            <Input
              label="Password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />

            <Button type="submit" loading={loading} className="w-full mt-2">
              Sign in
            </Button>
          </form>
        </Card>

        <p className="text-center text-sm text-text-muted mt-4">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-primary hover:underline font-medium">
            Create one
          </Link>
        </p>
      </div>
    </main>
  )
}
