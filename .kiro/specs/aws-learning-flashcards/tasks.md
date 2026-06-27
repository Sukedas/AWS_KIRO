# Implementation Tasks

## Milestone 1 — Project Setup
- [x] 1.1 Create Kiro configuration files (settings, steering, skills)
- [x] 1.2 Create spec documents (requirements, design)
- [x] 1.3 Create MCP integrations documentation
- [x] 1.4 Scaffold Next.js project with TypeScript and Tailwind CSS
- [x] 1.5 Create shared TypeScript types
- [x] 1.6 Create Supabase client modules (browser + server)
- [x] 1.7 Create SQL migration files for all 5 tables with RLS policies
- [x] 1.8 Create Next.js middleware for auth route protection
- [x] 1.9 Create environment variable template (.env.example)

## Milestone 2 — Frontend (Design System + Core UI)
- [x] 2.1 Configure Tailwind design tokens
- [x] 2.2 Build primitive UI components (Button, Card, Badge, Input, Spinner, ProgressBar)
- [x] 2.3 Build layout components (Navbar, Sidebar, bottom tab bar)
- [x] 2.4 Build FlashCard component with CSS 3D flip animation
- [x] 2.5 Build Login and Register pages
- [x] 2.6 Build Dashboard page
- [x] 2.7 Build Topic Browser page
- [x] 2.8 Build Flash Card Study page
- [x] 2.9 Build Quiz page
- [x] 2.10 Build AI Chat page

## Milestone 3 — Supabase Backend
- [ ] 3.1 Implement Auth Service (register, login, logout)
- [ ] 3.2 Implement Progress Tracker module
- [ ] 3.3 Implement user profile management
- [ ] 3.4 Create seed data for AWS topics and flash cards
- [ ] 3.5 Wire up all Supabase queries to frontend pages

## Milestone 4 — GenAI Features
- [ ] 4.1 Implement Bedrock Client with retry and fallback
- [ ] 4.2 Implement Prompt Builder with sanitization
- [ ] 4.3 Build /api/ai/generate-cards route + Card Generator
- [ ] 4.4 Build /api/ai/explain route + AI Chat
- [ ] 4.5 Build /api/ai/questions route + Question Generator
- [ ] 4.6 Build /api/ai/recommend route + Recommendation Engine
- [ ] 4.7 Build /api/ai/hint route + Hint Generator

## Milestone 5 — Testing & Deployment
- [ ] 5.1 Unit tests for Validator, Progress Tracker, Prompt Builder
- [ ] 5.2 Integration tests for API routes
- [ ] 5.3 E2E tests for auth flow and study session
- [ ] 5.4 Deployment guide (Vercel + Supabase)
- [ ] 5.5 Final documentation update
