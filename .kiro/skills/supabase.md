---
inclusion: manual
---

# Supabase Skill

## Description

Handles database design, authentication flows, query patterns, and security policy implementation for the AWS Learning Flash Cards application using Supabase.

## Client Initialization

### Browser client (`lib/supabase/client.ts`)
```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### Server client (`lib/supabase/server.ts`)
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: (c) => c.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } }
  )
}
```

## Common Query Patterns

### Fetch flash cards for a topic
```typescript
const { data, error } = await supabase
  .from('flash_cards')
  .select('id, question, answer, explanation, difficulty, aws_category, aws_service, real_world_scenario, ai_generated, documentation_links')
  .eq('topic_id', topicId)
  .order('difficulty', { ascending: true })
```

### Upsert a progress record
```typescript
const { error } = await supabase
  .from('progress')
  .upsert(
    { user_id: userId, flash_card_id: cardId, completion_status, score, knowledge_level, review_date: new Date().toISOString() },
    { onConflict: 'user_id,flash_card_id' }
  )
```

### Calculate topic completion percentage
```typescript
const { count: completed } = await supabase
  .from('progress')
  .select('id', { count: 'exact', head: true })
  .eq('user_id', userId)
  .eq('completion_status', 'completed')
  .in('flash_card_id', cardIdsForTopic)

const { count: total } = await supabase
  .from('flash_cards')
  .select('id', { count: 'exact', head: true })
  .eq('topic_id', topicId)

const percentage = total === 0 ? 0 : Math.round((completed! / total!) * 100)
```

### Fetch dashboard stats
```typescript
// Weak concepts: reviewed ≥2 times AND most recent knowledge_level = 'hard'
const { data: weakCards } = await supabase
  .from('progress')
  .select('flash_card_id, knowledge_level, review_date')
  .eq('user_id', userId)
  .eq('knowledge_level', 'hard')
  .gte('review_date', twoReviewsThreshold)
```

## Authentication Patterns

### Sign up
```typescript
const { data, error } = await supabase.auth.signUp({ email, password })
```

### Sign in
```typescript
const { data, error } = await supabase.auth.signInWithPassword({ email, password })
```

### Sign out
```typescript
const { error } = await supabase.auth.signOut()
if (error) throw new Error('Logout failed — session preserved') // abort, do not clear state
```

### Get current user (server-side)
```typescript
const { data: { user }, error } = await supabase.auth.getUser()
if (!user) redirect('/login')
```

## Migration File Template

```sql
-- supabase/migrations/YYYYMMDDHHMMSS_description.sql

-- Always wrap in a transaction
BEGIN;

-- Your schema changes here

COMMIT;
```

## Error Handling Pattern

```typescript
const { data, error } = await supabase.from('table').select(...)
if (error) {
  console.error('[supabase:table:operation]', error.code, error.message)
  throw new Error('A database error occurred') // generic message to client
}
```
