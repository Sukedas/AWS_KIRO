---
inclusion: always
---

# Supabase Best Practices

## Client Usage

- Use `lib/supabase/server.ts` (server-side Supabase client) inside API routes and Server Components.
- Use `lib/supabase/client.ts` (browser Supabase client) only inside Client Components for auth state listeners.
- Never use the service-role key on the client side. The service-role key is only for server-side admin operations.

## Authentication

- Always check `auth.uid()` server-side before reading or writing user-specific data.
- Redirect unauthenticated users to `/login` using Next.js middleware — do not rely solely on RLS for access control.
- Session tokens are valid for 24 hours. Implement token refresh silently on the client.

## Database Interactions

- Use parameterized queries via the Supabase JS SDK — never interpolate user input directly into SQL strings.
- For upserts on the `progress` table, use `.upsert()` with `onConflict: 'user_id,flash_card_id'` to prevent duplicate rows.
- Always select only the columns you need — avoid `SELECT *` in production queries.

## Row Level Security

- Every table MUST have RLS enabled. No exceptions.
- RLS policies for `progress` and `ai_history` restrict reads and writes to `auth.uid() = user_id`.
- RLS policies for `aws_topics` and `flash_cards` allow reads for all authenticated users; writes are service-role only.
- Test RLS policies with both an authenticated user token and the anonymous role before shipping.

## Migrations

- All schema changes go through migration files in `supabase/migrations/`. Never alter the live schema directly.
- Migration filenames follow the pattern: `YYYYMMDDHHMMSS_description.sql`.
- Never delete or modify existing migration files once they have been applied to any environment.

## Error Handling

- Always handle Supabase client errors explicitly. Check for `.error` on every query result.
- Log Supabase errors server-side with context (operation name, table). Never expose raw Supabase error messages to the client.
- On cascade-delete failures, report which tables succeeded and which failed — do not silently swallow errors.
