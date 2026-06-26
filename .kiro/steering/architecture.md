---
inclusion: always
---

# Architecture Steering Rules

## Core Principles

- Follow clean architecture: separate concerns into distinct layers (UI, API, lib, types).
- All database interactions MUST go through `lib/supabase/client.ts` or `lib/supabase/server.ts`. Direct Supabase calls from React components or pages are FORBIDDEN.
- All AI Service invocations MUST originate from server-side API routes in `app/api/`. Calling AI services from client components is FORBIDDEN.
- Keep modules small and single-responsibility. Each file in `lib/ai/` handles exactly one AI sub-feature.

## Code Style

- Use TypeScript strict mode. No `any` types.
- Use named exports, not default exports for utility modules.
- All shared types live in `types/index.ts`.
- Use async/await, not raw `.then()` chains.
- Handle all errors explicitly — no silent catches.

## Documentation

- Document all exported functions with JSDoc.
- Explain technical decisions with inline comments when a choice is non-obvious.
- Update `design.md` when architecture changes are made.

## Security

- Never expose AWS credentials or Supabase service-role keys to the client.
- Always validate and sanitize user input before passing it to any external service.
- Use environment variables for all secrets. Reference them by key name only in code.
