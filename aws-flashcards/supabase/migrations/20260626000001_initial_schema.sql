-- Migration: initial_schema
-- Creates all 5 tables with constraints, foreign keys, and RLS policies.

BEGIN;

-- ─── users ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username      TEXT UNIQUE NOT NULL CHECK (char_length(username) BETWEEN 3 AND 50),
  email         TEXT UNIQUE NOT NULL CHECK (char_length(email) <= 254),
  learning_level TEXT NOT NULL DEFAULT 'beginner'
                  CHECK (learning_level IN ('beginner', 'intermediate', 'advanced')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can read and update their own row only
CREATE POLICY users_select ON users FOR SELECT USING (id = auth.uid());
CREATE POLICY users_update ON users FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- ─── aws_topics ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS aws_topics (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category     TEXT NOT NULL CHECK (category IN (
                 'Fundamentals','Compute','Storage','Databases',
                 'Networking','Security','Serverless','AI Services')),
  service_name TEXT NOT NULL,
  description  TEXT NOT NULL,
  difficulty   TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard'))
);

ALTER TABLE aws_topics ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read; only service role can write
CREATE POLICY aws_topics_select ON aws_topics FOR SELECT USING (auth.role() = 'authenticated');

-- ─── flash_cards ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS flash_cards (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id            UUID NOT NULL REFERENCES aws_topics(id) ON DELETE CASCADE,
  question            TEXT NOT NULL CHECK (char_length(question) BETWEEN 10 AND 500),
  answer              TEXT NOT NULL CHECK (char_length(answer) BETWEEN 10 AND 1000),
  explanation         TEXT NOT NULL CHECK (char_length(explanation) BETWEEN 20 AND 2000),
  difficulty          TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  aws_category        TEXT NOT NULL CHECK (aws_category IN (
                        'Fundamentals','Compute','Storage','Databases',
                        'Networking','Security','Serverless','AI Services')),
  aws_service         TEXT,
  real_world_scenario TEXT,
  ai_generated        BOOLEAN NOT NULL DEFAULT FALSE,
  documentation_links TEXT[] NOT NULL DEFAULT '{}'
);

ALTER TABLE flash_cards ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read; only service role can write
CREATE POLICY flash_cards_select ON flash_cards FOR SELECT USING (auth.role() = 'authenticated');

-- ─── progress ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS progress (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  flash_card_id     UUID NOT NULL REFERENCES flash_cards(id) ON DELETE CASCADE,
  completion_status TEXT NOT NULL DEFAULT 'in_progress'
                      CHECK (completion_status IN ('in_progress', 'completed')),
  score             INTEGER NOT NULL DEFAULT 0,
  knowledge_level   TEXT CHECK (knowledge_level IN ('easy', 'medium', 'hard')),
  review_date       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, flash_card_id)
);

ALTER TABLE progress ENABLE ROW LEVEL SECURITY;

-- Users can only read and write their own progress rows
CREATE POLICY progress_select ON progress FOR SELECT USING (user_id = auth.uid());
CREATE POLICY progress_insert ON progress FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY progress_update ON progress FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ─── ai_history ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_history (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  prompt       TEXT NOT NULL,
  response     TEXT,
  request_type TEXT NOT NULL CHECK (request_type IN (
                 'generate_cards','explain','questions','recommend','hint')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE ai_history ENABLE ROW LEVEL SECURITY;

-- Users can only read and write their own AI history rows
CREATE POLICY ai_history_select ON ai_history FOR SELECT USING (user_id = auth.uid());
CREATE POLICY ai_history_insert ON ai_history FOR INSERT WITH CHECK (user_id = auth.uid());

-- ─── Indexes ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_flash_cards_topic_id    ON flash_cards(topic_id);
CREATE INDEX IF NOT EXISTS idx_flash_cards_category    ON flash_cards(aws_category);
CREATE INDEX IF NOT EXISTS idx_flash_cards_difficulty  ON flash_cards(difficulty);
CREATE INDEX IF NOT EXISTS idx_progress_user_id        ON progress(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_flash_card_id  ON progress(flash_card_id);
CREATE INDEX IF NOT EXISTS idx_ai_history_user_id      ON ai_history(user_id);
CREATE INDEX IF NOT EXISTS idx_aws_topics_category     ON aws_topics(category);

COMMIT;
