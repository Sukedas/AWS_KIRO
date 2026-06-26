---
inclusion: always
---

# UI Consistency Standards

## Design Tokens

- All colors, spacing, typography, and breakpoints MUST use the design tokens defined in `tailwind.config.ts`.
- Never use arbitrary hex values or hard-coded pixel sizes inline. Use Tailwind utility classes only.
- AWS brand orange (`primary` / `#FF9900`) is reserved for primary actions and key highlights only.

## Component Rules

- All reusable UI primitives (Button, Card, Badge, Input, Spinner, ProgressBar) live in `components/ui/`.
- Never duplicate primitive component logic in page-level components — always import from `components/ui/`.
- Every interactive element MUST have a visible focus ring for keyboard accessibility.
- All images and icons MUST have descriptive `alt` text or `aria-label`.

## Flash Card Component

- The flip animation uses CSS `rotateY` transform with `transform-style: preserve-3d` and completes in ≤400ms.
- The question face and answer face MUST have visually distinct background colors (defined in design tokens).
- Knowledge Level buttons (`Easy`, `Medium`, `Hard`) are ONLY visible when the card is in the answer (flipped) state.
- The "Hint" button is ONLY visible on the question face and MUST NOT trigger the flip action.
- Keyboard users MUST be able to flip cards with Enter or Space, and rate with Tab + Enter.

## Accessibility

- Minimum contrast ratio of 4.5:1 for all body text (WCAG AA).
- All form inputs MUST have associated `<label>` elements.
- Loading states MUST use `aria-busy="true"` and a visible spinner.
- Route transitions MUST announce page changes to screen readers via a live region.

## Responsive Layout

- Mobile-first approach: base styles target 320px, then use `sm:`, `md:`, `lg:` prefixes.
- At viewport widths below 320px display a full-width notice: "Minimum supported width is 320px."
- Navigation collapses to a bottom tab bar on mobile and a sidebar on desktop.
- Flash cards stack vertically on mobile; side-by-side layouts only on tablet and above.

## Loading & Error States

- Every asynchronous operation (data fetch, AI request) MUST show a loading indicator while in progress.
- Skeleton loaders are preferred over spinners for content that has a known shape (cards, lists).
- All error messages must be human-readable. Never show raw API error strings to the user.
- Empty states (no cards, no results) MUST include an explanatory message and a suggested next action.
