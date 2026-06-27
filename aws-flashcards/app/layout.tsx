import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'AWS Flash Cards',
  description: 'AI-powered AWS learning platform with interactive flash cards',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        {/* Sub-320px notice */}
        <div className="block min-[320px]:hidden fixed inset-0 z-50 bg-surface flex items-center justify-center p-6 text-center">
          <p className="text-text-muted text-sm">
            Minimum supported width is 320px. Please use a wider device or browser window.
          </p>
        </div>
        {/* Main app */}
        <div className="hidden min-[320px]:block">{children}</div>
        {/* Accessible live region for route announcements */}
        <div role="status" aria-live="polite" aria-atomic="true" className="sr-only" id="route-announcer" />
      </body>
    </html>
  )
}
