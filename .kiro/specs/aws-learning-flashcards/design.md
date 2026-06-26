# Design Document — AWS Learning Flash Cards App

## Overview

This document defines the technical architecture, database schema, UI specification, AI integration design, and security model for the AWS Learning Flash Cards application. It maps directly to the requirements defined in `requirements.md`.

The application is a full-stack web app built with Next.js (App Router), TypeScript, Tailwind CSS on the frontend, Supabase as the backend platform, and Amazon Bedrock as the primary GenAI provider.

---

## Architecture

### System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser (Client)                          │
│  Next.js App Router · React Components · Tailwind CSS           │
│                                                                  │
│  Pages: /login  /dashboard  /topics  /study/:id  /quiz  /chat   │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTPS
┌────────────────────────▼────────────────────────────────────────┐
│                  Next.js Server (API Routes)                      │
│                                                                  │
│  /api/ai/generate-cards    /api/ai/explain                       │
│  /api/ai/questions         /api/ai/recommend                     │
│  /api/ai/hint              /api/progress                         │
│                                                                  │
│  Modules:  Bedrock_Client · Prompt_Builder · Validator           │
│            Card_Generator · Hint_Generator · Question_Generator  │
│            Recommendation_Engine · Progress_Tracker              │
└──────────┬──────────────────────────────┬───────────────────────┘
           │ Supabase JS SDK              │ AWS SDK v3
┌──────────▼──────────────┐   ┌──────────▼──────────────────────┐
│      Supabase            │   │       Amazon Bedrock             │
│                          │   │                                  │
│  PostgreSQL Database     │   │  Primary: Claude / Titan         │
│  Supabase Auth           │   │  Fallback: OpenAI (env flag)     │
│  Row Level Security      │   │                                  │
│  Storage (assets)        │   └──────────────────────────────────┘
└──────────────────────────┘
```

### Component Responsibilities

| Module | Location | Responsibility |
|---|---|---|
| `Supabase_Client` | `lib/supabase/client.ts` | All DB reads/writes via Supabase JS SDK |
| `Bedrock_Client` | `lib/ai/bedrock.ts` | Amazon Bedrock API calls, retry logic, fallback routing |
| `Prompt_Builder` | `lib/ai/prompts.ts` | Sanitize input, assemble structured prompts with system instructions |
| `Validator` | `lib/validation.ts` | Field validation for user input, flash card data |
| `Progress_Tracker` | `lib/progress.ts` | Upsert progress records, calculate percentages |
| `Card_Generator` | `lib/ai/card-generator.ts` | Call AI Service, parse/validate flash card JSON |
| `Hint_Generator` | `lib/ai/hint-generator.ts` | Call AI Service for hints, manage hint count per session |
| `Question_Generator` | `lib/ai/question-generator.ts` | Call AI Service for MCQ practice questions |
| `Recommendation_Engine` | `lib/ai/recommendations.ts` | Aggregate progress, call AI for topic recommendations |

---

## Database Schema (Supabase / PostgreSQL)

### Table: `users`

```sql
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username      TEXT UNIQUE NOT NULL CHECK (char_length(username) BETWEEN 3 AND 50),
  email         TEXT UNIQUE NOT NULL CHECK (char_length(email) <= 254),
  learning_level TEXT NOT NULL DEFAULT 'beginner'
                  CHECK (learning_level IN ('beginner','intermediate','advanced')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Table: `aws_topics`

```sql
CREATE TABLE aws_topics (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category     TEXT NOT NULL,
  service_name TEXT NOT NULL,
  description  TEXT NOT NULL,
  difficulty   TEXT NOT NULL CHECK (difficulty IN ('easy','medium','hard'))
);
```

### Table: `flash_cards`

```sql
CREATE TABLE flash_cards (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id          UUID NOT NULL REFERENCES aws_topics(id) ON DELETE CASCADE,
  question          TEXT NOT NULL,
  answer            TEXT NOT NULL,
  explanation       TEXT NOT NULL,
  difficulty        TEXT NOT NULL CHECK (difficulty IN ('easy','medium','hard')),
  aws_category      TEXT NOT NULL,
  aws_service       TEXT,
  real_world_scenario TEXT,
  ai_generated      BOOLEAN NOT NULL DEFAULT FALSE,
  documentation_links TEXT[] DEFAULT '{}'
);
```

### Table: `progress`

```sql
CREATE TABLE progress (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  flash_card_id     UUID NOT NULL REFERENCES flash_cards(id) ON DELETE CASCADE,
  completion_status TEXT NOT NULL DEFAULT 'in_progress'
                      CHECK (completion_status IN ('in_progress','completed')),
  score             INTEGER NOT NULL DEFAULT 0,
  knowledge_level   TEXT CHECK (knowledge_level IN ('easy','medium','hard')),
  review_date       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, flash_card_id)
);
```

### Table: `ai_history`

```sql
CREATE TABLE ai_history (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  prompt       TEXT NOT NULL,
  response     TEXT,
  request_type TEXT NOT NULL
                 CHECK (request_type IN ('generate_cards','explain','questions','recommend','hint')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Relationships

```
users (1) ──< progress (N)     [user_id FK]
users (1) ──< ai_history (N)   [user_id FK]
aws_topics (1) ──< flash_cards (N)  [topic_id FK]
flash_cards (1) ──< progress (N)    [flash_card_id FK]
```

### Row Level Security Policies

```sql
-- progress: users can only access their own rows
ALTER TABLE progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY progress_user_policy ON progress
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ai_history: users can only access their own rows
ALTER TABLE ai_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY ai_history_user_policy ON ai_history
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- aws_topics: read by all authenticated, write only by service role
ALTER TABLE aws_topics ENABLE ROW LEVEL SECURITY;
CREATE POLICY aws_topics_read ON aws_topics FOR SELECT USING (auth.role() = 'authenticated');

-- flash_cards: read by all authenticated, write only by service role
ALTER TABLE flash_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY flash_cards_read ON flash_cards FOR SELECT USING (auth.role() = 'authenticated');
```

---

## Folder Structure

```
aws-flashcards/
├── .kiro/
│   ├── settings.kiro
│   ├── steering/
│   │   ├── architecture.md
│   │   ├── supabase.md
│   │   └── ui.md
│   └── skills/
│       ├── aws-knowledge.md
│       ├── flash-card-generator.md
│       ├── supabase.md
│       └── ui-implementation.md
├── app/                          # Next.js App Router
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (protected)/
│   │   ├── dashboard/page.tsx
│   │   ├── topics/page.tsx
│   │   ├── study/[topicId]/page.tsx
│   │   ├── quiz/[topicId]/page.tsx
│   │   └── chat/page.tsx
│   ├── api/
│   │   ├── ai/
│   │   │   ├── generate-cards/route.ts
│   │   │   ├── explain/route.ts
│   │   │   ├── questions/route.ts
│   │   │   ├── recommend/route.ts
│   │   │   └── hint/route.ts
│   │   └── progress/route.ts
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/                       # Primitive design system components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── Input.tsx
│   │   ├── Spinner.tsx
│   │   └── ProgressBar.tsx
│   ├── flashcard/
│   │   ├── FlashCard.tsx         # Flip mechanic component
│   │   ├── FlashCardDeck.tsx
│   │   └── KnowledgeLevelButtons.tsx
│   ├── dashboard/
│   │   ├── StatsPanel.tsx
│   │   ├── WeakConceptsList.tsx
│   │   └── RecommendationsList.tsx
│   ├── quiz/
│   │   ├── QuizCard.tsx
│   │   └── QuizSummary.tsx
│   └── layout/
│       ├── Navbar.tsx
│       └── Sidebar.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # Browser Supabase client
│   │   └── server.ts             # Server Supabase client
│   ├── ai/
│   │   ├── bedrock.ts
│   │   ├── prompts.ts
│   │   ├── card-generator.ts
│   │   ├── hint-generator.ts
│   │   ├── question-generator.ts
│   │   └── recommendations.ts
│   ├── progress.ts
│   └── validation.ts
├── types/
│   └── index.ts                  # Shared TypeScript interfaces
├── supabase/
│   └── migrations/               # SQL migration files
├── docs/
│   └── mcp-integrations.md
├── tailwind.config.ts
├── next.config.ts
└── package.json
```

---

## UI Specification

### Design System Tokens (Tailwind)

| Token | Value | Usage |
|---|---|---|
| `primary` | `#FF9900` | AWS orange — buttons, highlights |
| `primary-dark` | `#CC7A00` | Hover states |
| `surface` | `#0F172A` | Dark background (slate-900) |
| `surface-card` | `#1E293B` | Card background (slate-800) |
| `surface-muted` | `#334155` | Secondary surfaces (slate-700) |
| `text-primary` | `#F8FAFC` | Main text |
| `text-muted` | `#94A3B8` | Secondary text |
| `success` | `#22C55E` | Easy / correct |
| `warning` | `#F59E0B` | Medium |
| `danger` | `#EF4444` | Hard / error |
| `ai-badge` | `#7C3AED` | AI-generated indicator |

Typography: `Inter` (body), `JetBrains Mono` (code/service names)

### Screens

#### 1. Login / Register (`/login`, `/register`)
- Centered card layout, AWS branding
- Email + password fields with validation feedback
- Toggle between Login and Register views
- Redirect to `/dashboard` on success

#### 2. Dashboard (`/dashboard`)
- Greeting with username and learning_level badge
- Overall progress ring (circular percentage)
- Stats row: cards reviewed · sessions completed · last session date
- Knowledge Level distribution bar (easy/medium/hard %)
- Weak Concepts list (cards rated `hard` ≥ 2 times)
- AI Recommendations panel (top 5 next topics)
- Quick-start buttons per category

#### 3. Topic Browser (`/topics`)
- Category filter tabs (horizontal scroll on mobile)
- Search input (min 2 chars to trigger)
- Topic cards grid: name, description, difficulty badge, completion %
- Hover → "Start Studying" CTA

#### 4. Flash Card Study (`/study/[topicId]`)
- Progress indicator "Card N of M"
- Flash Card component (3D CSS flip)
  - Front: question + "Hint" button (if hints available)
  - Back: answer + explanation + documentation links
  - Hint panel: slides in without flipping card
  - AI-generated badge if applicable
- Knowledge Level buttons (Easy / Medium / Hard) — shown on answer side only
- Session summary modal on completion

#### 5. Quiz (`/quiz/[topicId]`)
- Multiple choice: 4 options per question
- Immediate feedback after selection (green/red highlight)
- Explanation shown below after answer
- Progress bar at top
- Score summary screen at end

#### 6. AI Chat / Hints (`/chat`)
- Chat interface: user messages right, AI messages left (distinct styling)
- Input with 500-char limit
- Conversation history persisted in session storage
- Context selector: choose AWS Topic to anchor the conversation
- Loading skeleton while AI responds

### Responsive Behavior

| Breakpoint | Layout |
|---|---|
| Mobile (320–767px) | Single column, stacked nav, swipeable cards |
| Tablet (768–1023px) | Two-column where applicable, collapsible sidebar |
| Desktop (1024px+) | Full sidebar navigation, multi-column grids |
| < 320px | Full-width notice: "Minimum supported width is 320px" |

### Flash Card Flip Interaction

```
State: QUESTION_SIDE (default)
  - Shows: question text, Hint button (if available), hint counter
  - Hidden: answer, explanation, Knowledge Level buttons
  
User action: click/Enter/Space → flip animation (≤400ms, CSS rotateY)

State: ANSWER_SIDE
  - Shows: answer, explanation, documentation links, Knowledge Level buttons
  - AI badge visible if ai_generated = true

User action: select Easy/Medium/Hard
  → Progress record updated → advance to next card
  → If Hard → added to repeat queue (max once)

User action: click/Enter/Space again → returns to QUESTION_SIDE
  → Knowledge Level buttons hidden again
```

---

## AI Architecture

### Provider Strategy

```
Primary:  Amazon Bedrock  (model: anthropic.claude-3-sonnet / amazon.titan-text-express)
Fallback: OpenAI API      (model: gpt-4o-mini) — activated via FALLBACK_AI_PROVIDER=openai env var
```

### Bedrock_Client Design

```typescript
// lib/ai/bedrock.ts
interface AIRequest {
  prompt: string;
  systemInstruction: string;
  maxTokens: number;
  temperature: number;
}

// Retry: up to 2 retries with exponential backoff (1s, 2s)
// On exhaustion: route to fallback provider if configured
// Logging: duration + error code only (no prompt content)
```

### Prompt Engineering Strategy

Every prompt sent to the AI Service follows this structure:

```
[SYSTEM]
You are an AWS educational assistant. You ONLY respond to questions and tasks
related to Amazon Web Services and cloud computing. If asked about anything
else, politely decline and redirect to AWS topics.

[CONTEXT]
User learning level: {learning_level}
AWS Topic: {topic_name} ({category})

[TASK]
{specific_task_instruction}

[OUTPUT FORMAT]
{JSON schema definition}
```

### Flash Card Generation Schema

```json
{
  "cards": [
    {
      "question": "string",
      "answer": "string",
      "explanation": "string",
      "difficulty": "easy|medium|hard",
      "aws_category": "string",
      "aws_service": "string",
      "real_world_scenario": "string",
      "documentation_links": ["string"]
    }
  ]
}
```

### Practice Question Schema

```json
{
  "questions": [
    {
      "question": "string",
      "options": ["string", "string", "string", "string"],
      "correct_index": 0,
      "explanation": "string (≤100 words)"
    }
  ]
}
```

### AI Data Flow

```
Client Page
  → POST /api/ai/{endpoint}   (with session cookie)
      → Validate session (Supabase Auth)
      → Sanitize user input (Prompt_Builder)
      → Build structured prompt (Prompt_Builder)
      → Call Bedrock_Client
          → Amazon Bedrock (primary)
          → Fallback provider (if Bedrock unavailable after 2 retries)
      → Parse & validate response JSON
      → Log to ai_history (Supabase, server-side)
      → Return sanitized result to client
```

### AI Security Controls

| Control | Implementation |
|---|---|
| Server-side only | AI routes only in `app/api/` — never in client components |
| Input sanitization | Strip prompt-injection patterns before prompt assembly |
| System instruction | Hard-coded AWS-scope restriction in every prompt |
| Output filtering | Server-side regex check for non-AWS content |
| Credential protection | `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` in `.env.local` only |
| Error masking | Generic "AI service error" returned to client; full error logged server-side |

---

## TypeScript Interfaces

```typescript
// types/index.ts

export type LearningLevel = 'beginner' | 'intermediate' | 'advanced';
export type KnowledgeLevel = 'easy' | 'medium' | 'hard';
export type CompletionStatus = 'in_progress' | 'completed';
export type AIRequestType = 'generate_cards' | 'explain' | 'questions' | 'recommend' | 'hint';

export interface User {
  id: string;
  username: string;
  email: string;
  learning_level: LearningLevel;
  created_at: string;
}

export interface AWSTopic {
  id: string;
  category: string;
  service_name: string;
  description: string;
  difficulty: KnowledgeLevel;
}

export interface FlashCard {
  id: string;
  topic_id: string;
  question: string;
  answer: string;
  explanation: string;
  difficulty: KnowledgeLevel;
  aws_category: string;
  aws_service?: string;
  real_world_scenario?: string;
  ai_generated: boolean;
  documentation_links: string[];
}

export interface Progress {
  id: string;
  user_id: string;
  flash_card_id: string;
  completion_status: CompletionStatus;
  score: number;
  knowledge_level?: KnowledgeLevel;
  review_date: string;
}

export interface AIHistory {
  id: string;
  user_id: string;
  prompt: string;
  response?: string;
  request_type: AIRequestType;
  created_at: string;
}

export interface StudySessionSummary {
  total_reviewed: number;
  easy_count: number;
  medium_count: number;
  hard_count: number;
  repeat_queue_count: number;
}

export interface DashboardStats {
  overall_progress_pct: number;
  completed_topics_count: number;
  total_cards_reviewed: number;
  total_sessions_completed: number;
  knowledge_distribution: { easy: number; medium: number; hard: number };
  last_session_date?: string;
  weak_concepts: FlashCard[];
  recommendations: AWSTopic[];
}
```

---

## Implementation Roadmap

### Milestone 1 — Project Setup
- Initialize Next.js 14 project with TypeScript and Tailwind CSS
- Create folder structure as defined above
- Create `.kiro/settings.kiro`, steering files, and skill definitions
- Set up Supabase project and run SQL migrations
- Configure environment variables (`.env.local`)
- Create `docs/mcp-integrations.md`

**Deliverables:** ✅ Folder structure · ✅ Kiro config · ✅ DB schema · ✅ Documentation

### Milestone 2 — Frontend (Design System + Core UI)
- Implement Tailwind design tokens
- Build primitive UI components (Button, Card, Badge, Input, Spinner, ProgressBar)
- Implement FlashCard component with CSS 3D flip animation
- Build Dashboard, Topic Browser, Study, Quiz, and AI Chat screens
- Implement responsive layouts for all breakpoints
- Wire up Next.js Router with auth guards

**Deliverables:** ✅ Design system · ✅ All screens · ✅ Flash card flip · ✅ Responsive layout

### Milestone 3 — Supabase Backend
- Implement `Supabase_Client` (browser + server)
- Implement `Auth_Service` (register, login, logout, session management)
- Implement `Progress_Tracker` (upsert records, calculate percentages)
- Apply all RLS policies
- Seed initial AWS topic and flash card data

**Deliverables:** ✅ Auth · ✅ DB integration · ✅ RLS · ✅ Seed data

### Milestone 4 — GenAI Features
- Implement `Bedrock_Client` with retry logic and fallback
- Implement `Prompt_Builder` with sanitization and system instructions
- Build API routes for all AI features
- Implement `Card_Generator`, `Hint_Generator`, `Question_Generator`, `Recommendation_Engine`
- Log all AI interactions to `ai_history`

**Deliverables:** ✅ Bedrock integration · ✅ All AI features · ✅ Prompt safety

### Milestone 5 — Testing & Deployment
- Unit tests for Validator, Progress_Tracker, Prompt_Builder, Card_Generator
- Integration tests for API routes
- E2E tests for auth flow, study session, quiz, AI chat
- Deployment guide (Vercel + Supabase)
- Final documentation update

**Deliverables:** ✅ Tests · ✅ Deployment guide · ✅ Final docs
