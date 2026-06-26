import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // AWS brand
        primary: '#FF9900',
        'primary-dark': '#CC7A00',
        // Surfaces (dark theme)
        surface: '#0F172A',
        'surface-card': '#1E293B',
        'surface-muted': '#334155',
        // Text
        'text-primary': '#F8FAFC',
        'text-muted': '#94A3B8',
        // Semantic
        success: '#22C55E',
        warning: '#F59E0B',
        danger: '#EF4444',
        // AI indicator
        'ai-badge': '#7C3AED',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      keyframes: {
        'flip-in': {
          '0%': { transform: 'rotateY(-90deg)', opacity: '0' },
          '100%': { transform: 'rotateY(0deg)', opacity: '1' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'flip-in': 'flip-in 0.4s ease-out',
        shimmer: 'shimmer 1.5s infinite',
      },
      transitionDuration: {
        '400': '400ms',
      },
      perspective: {
        '1000': '1000px',
      },
    },
  },
  plugins: [],
}

export default config
