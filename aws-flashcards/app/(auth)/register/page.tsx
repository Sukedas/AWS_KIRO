'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'

export default function RegisterPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  function validate() {
    const errs: Record<string, string> = {}
    if (!email) errs.email = 'Email is required'
    if (email.length > 254) errs.email = 'Email must be at most 254 characters'
    if (password.length < 8) errs.password = 'Password must be at least 8 characters'
    if (password.length > 128) errs.password = 'Password must be at most 128 characters'
    if (username.length < 3) errs.username = 'Username must be at least 3 characters'
    if (username.length > 50) errs.username = 'Username must be at most 50 characters'
    return errs
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setErrors({})
    setLoading(true)

    const supabase = createClient()
    const { data, error: authError } = await supabase.auth.signUp({ email, password })

    if (authError) {
      const msg = authError.message.toLowerCase().includes('already')
        ? 'This email address is already in use.'
        : 'Registration failed. Please try again.'
      setErrors({ form: msg })
      setLoading(false)
      return
    }

    // Create user profile row with default learning_level = 'beginner'
    if (data.user) {
      await supabase.from('users').insert({
        id: data.user.id,
        username,
        email,
        learning_level: 'beginner',
      })
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <main className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">☁</div>
          <h1 className="text-2xl font-bold text-text-primary">AWS Flash Cards</h1>
          <p className="text-text-muted text-sm mt-1">Create your account</p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            <h2 className="text-lg font-semibold text-text-primary">Create account</h2>

            {errors.form && (
              <div role="alert" className="p-3 bg-danger/10 border border-danger/30 rounded-xl text-sm text-danger">
                {errors.form}
              </div>
            )}

            <Input
              label="Username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              error={errors.username}
              placeholder="yourname"
              minLength={3}
              maxLength={50}
              required
            />

            <Input
              label="Email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              placeholder="you@example.com"
              required
            />

            <Input
              label="Password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              placeholder="••••••••"
              hint="8–128 characters"
              required
            />

            <Button type="submit" loading={loading} className="w-full mt-2">
              Create account
            </Button>
          </form>
        </Card>

        <p className="text-center text-sm text-text-muted mt-4">
          Already have an account?{' '}
          <Link href="/login" className="text-primary hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  )
}
