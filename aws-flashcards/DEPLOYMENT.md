# AWS Kiro - Deployment Guide 🚀

This guide covers deploying the AWS Kiro application to production using Vercel (Frontend/API) and Supabase (Database/Auth).

## 1. Supabase Setup

### Database
1. Go to your [Supabase Dashboard](https://app.supabase.com/) and create a new project.
2. In the SQL Editor, run the schema migration files to set up the necessary tables (`profiles`, `flashcards`, `user_progress`, `ai_history`, etc.).
3. Enable Row Level Security (RLS) policies as defined in the database setup guide to ensure user data isolation.

### Authentication
1. Go to Authentication > Providers.
2. Enable Email/Password authentication or your preferred OAuth providers.
3. Configure the Site URL and Redirect URLs to match your production domain.

## 2. Vercel Deployment

AWS Kiro is built with Next.js, making Vercel the optimal hosting platform.

### Steps
1. Create a [Vercel](https://vercel.com/) account and link your GitHub repository.
2. Import the `aws-flashcards` project.
3. Configure the following Environment Variables in the Vercel project settings:
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon key
   - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key (if required for admin tasks)
   - `AI_PROVIDER`: The primary AI provider to use (e.g., `anthropic`)
   - `FALLBACK_AI_PROVIDER`: The fallback AI provider (e.g., `openai`)
   - `ANTHROPIC_API_KEY`: API key for Anthropic
   - `OPENAI_API_KEY`: API key for OpenAI
4. Click **Deploy**.

## 3. Post-Deployment Checks
- Navigate to your production URL.
- Test the signup/login flow.
- Verify that AI generation requests (Flashcards, Hints, Quizzes) are successfully fulfilled and errors are correctly handled.
- Ensure that the dashboard correctly reflects the user's progress.

## Security Considerations
- **Environment Variables**: Ensure all server-side API keys (e.g., AI provider keys) are never prefixed with `NEXT_PUBLIC_` to prevent leaking to the client.
- **Rate Limiting**: Monitor AI endpoint usage and configure rate limiting in Vercel/Supabase if needed to prevent abuse.
- **Prompt Injection**: The `sanitizeForPrompt` utility strips malicious instructions, but always monitor AI outputs for anomalies.
