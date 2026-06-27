'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'

const NAV_LINKS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/topics', label: 'Topics' },
  { href: '/chat', label: 'AI Chat' },
]

interface NavbarProps {
  username?: string
  /** Pass a <LogoutButton /> server/client component */
  logoutButton?: ReactNode
  onLogout?: () => void
}

/**
 * Top navigation bar — visible on tablet and desktop.
 * On mobile, the Sidebar/BottomNav handles navigation.
 */
export function Navbar({ username, logoutButton, onLogout }: NavbarProps) {
  const pathname = usePathname()

  return (
    <header className="hidden md:flex items-center justify-between h-16 px-6 bg-surface-card border-b border-surface-muted sticky top-0 z-40">
      {/* Logo */}
      <Link href="/dashboard" className="flex items-center gap-2 font-semibold text-text-primary">
        <span className="text-primary text-xl font-bold">☁</span>
        <span>AWS Flash Cards</span>
      </Link>

      {/* Nav links */}
      <nav aria-label="Primary navigation">
        <ul className="flex items-center gap-1">
          {NAV_LINKS.map(({ href, label }) => {
            const active = pathname.startsWith(href)
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={[
                    'px-4 py-2 rounded-xl text-sm font-medium transition-colors',
                    active
                      ? 'bg-primary/10 text-primary'
                      : 'text-text-muted hover:text-text-primary hover:bg-surface-muted',
                  ].join(' ')}
                  aria-current={active ? 'page' : undefined}
                >
                  {label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* User actions */}
      <div className="flex items-center gap-3">
        {username && (
          <span className="text-sm text-text-muted hidden lg:block">{username}</span>
        )}
        {logoutButton}
        {onLogout && !logoutButton && (
          <button onClick={onLogout} className="text-sm text-text-muted hover:text-text-primary px-3 py-1.5 rounded-xl hover:bg-surface-muted transition-colors">
            Sign out
          </button>
        )}
      </div>
    </header>
  )
}
