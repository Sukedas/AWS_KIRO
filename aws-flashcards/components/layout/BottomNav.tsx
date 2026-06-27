'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Home', icon: '⊞' },
  { href: '/topics', label: 'Topics', icon: '📚' },
  { href: '/chat', label: 'AI Chat', icon: '💬' },
]

/**
 * Bottom tab bar — visible on mobile only (hidden on md+).
 */
export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Mobile navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface-card border-t border-surface-muted"
    >
      <ul className="flex items-center justify-around h-16">
        {NAV_ITEMS.map(({ href, label, icon }) => {
          const active = pathname.startsWith(href)
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={[
                  'flex flex-col items-center justify-center gap-1 h-full text-xs font-medium transition-colors',
                  active ? 'text-primary' : 'text-text-muted',
                ].join(' ')}
                aria-current={active ? 'page' : undefined}
              >
                <span className="text-lg" aria-hidden="true">{icon}</span>
                {label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
