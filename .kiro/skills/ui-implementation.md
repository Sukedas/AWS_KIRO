---
inclusion: manual
---

# UI Implementation Skill

## Description

Transforms design specifications into frontend React/Next.js components using Tailwind CSS, following the design system and accessibility standards defined for the AWS Learning Flash Cards application.

## Design Token Reference

```typescript
// tailwind.config.ts — extend these tokens, never override with arbitrary values
colors: {
  primary:       '#FF9900',   // AWS orange — CTAs, highlights
  'primary-dark':'#CC7A00',   // hover state
  surface:       '#0F172A',   // page background (slate-900)
  'surface-card':'#1E293B',   // card background (slate-800)
  'surface-muted':'#334155',  // secondary surface (slate-700)
  'text-primary': '#F8FAFC',  // main text
  'text-muted':   '#94A3B8',  // secondary text
  success:        '#22C55E',  // easy / correct
  warning:        '#F59E0B',  // medium
  danger:         '#EF4444',  // hard / error
  'ai-badge':     '#7C3AED',  // AI-generated indicator
}
```

## Flash Card Flip Component Pattern

```tsx
// components/flashcard/FlashCard.tsx
'use client'
// Uses CSS perspective + rotateY for 3D flip
// Front face: bg-surface-card (slate-800)
// Back face:  bg-surface-muted (slate-700)
// Transition: transform 400ms ease-in-out
// Keyboard:   onKeyDown handles Enter + Space to flip
// State:      isFlipped (boolean), hintsRevealed (boolean)
// Props:      card: FlashCard, onRate: (level: KnowledgeLevel) => void
```

Key CSS classes to apply:
```
.card-container  → perspective-1000 w-full h-64 cursor-pointer
.card-inner      → relative w-full h-full transition-transform duration-[400ms] transform-style-preserve-3d
.card-inner.flipped → rotate-y-180
.card-face       → absolute w-full h-full backface-hidden rounded-2xl p-6
.card-front      → bg-surface-card
.card-back       → bg-surface-muted rotate-y-180
```

## Knowledge Level Button Pattern

```tsx
// Only render when isFlipped === true
// Easy  → bg-success text-white
// Medium→ bg-warning text-white
// Hard  → bg-danger  text-white
// Each button: focus:ring-2 focus:ring-offset-2 accessible
```

## AI Badge Pattern

```tsx
// Shown when card.ai_generated === true
// Purple pill badge: bg-ai-badge text-white text-xs px-2 py-0.5 rounded-full
// Label: "AI Generated"
// Position: top-right corner of the card face
```

## Loading States

```tsx
// Spinner for unknown-shape content
<div role="status" aria-busy="true" aria-label="Loading...">
  <Spinner className="w-6 h-6 text-primary animate-spin" />
</div>

// Skeleton for known-shape content (e.g., card grid)
<div className="animate-pulse bg-surface-muted rounded-2xl h-40 w-full" aria-hidden="true" />
```

## Empty State Pattern

```tsx
// Always include: icon, message, and a suggested next action
<div className="flex flex-col items-center gap-4 py-16 text-text-muted">
  <Icon className="w-12 h-12" aria-hidden="true" />
  <p className="text-lg">{message}</p>
  <Button variant="primary" onClick={action}>{actionLabel}</Button>
</div>
```

## Responsive Layout Helpers

```tsx
// Mobile-first grid
className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"

// Sidebar: hidden on mobile, visible on desktop
className="hidden lg:flex lg:flex-col lg:w-64"

// Bottom tab bar: visible on mobile only
className="fixed bottom-0 left-0 right-0 flex lg:hidden"

// Sub-320px notice (add to root layout)
className="hidden min-[320px]:block"  // hide real content
// + a <div className="block min-[320px]:hidden"> notice </div>
```

## Page Route Announcement (Accessibility)

```tsx
// In layout.tsx — announces route changes to screen readers
<div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
  {pageTitle}
</div>
```

## Form Input Pattern

```tsx
// Always pair label + input
<div className="flex flex-col gap-1">
  <label htmlFor={id} className="text-sm text-text-muted">{label}</label>
  <input
    id={id}
    type={type}
    className="bg-surface-card border border-surface-muted rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
    aria-describedby={error ? `${id}-error` : undefined}
  />
  {error && <span id={`${id}-error`} role="alert" className="text-danger text-xs">{error}</span>}
</div>
```
