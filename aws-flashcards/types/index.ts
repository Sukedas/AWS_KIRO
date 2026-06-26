// Shared TypeScript interfaces for the AWS Learning Flash Cards application.
// All modules import types from this file — never redefine them locally.

export type LearningLevel = 'beginner' | 'intermediate' | 'advanced'
export type KnowledgeLevel = 'easy' | 'medium' | 'hard'
export type CompletionStatus = 'in_progress' | 'completed'
export type AIRequestType =
  | 'generate_cards'
  | 'explain'
  | 'questions'
  | 'recommend'
  | 'hint'

export type AWSCategory =
  | 'Fundamentals'
  | 'Compute'
  | 'Storage'
  | 'Databases'
  | 'Networking'
  | 'Security'
  | 'Serverless'
  | 'AI Services'

// ─── Database entities ────────────────────────────────────────────────────────

export interface User {
  id: string
  username: string
  email: string
  learning_level: LearningLevel
  created_at: string
}

export interface AWSTopic {
  id: string
  category: AWSCategory
  service_name: string
  description: string
  difficulty: KnowledgeLevel
}

export interface FlashCard {
  id: string
  topic_id: string
  question: string
  answer: string
  explanation: string
  difficulty: KnowledgeLevel
  aws_category: AWSCategory
  aws_service?: string
  real_world_scenario?: string
  ai_generated: boolean
  documentation_links: string[]
}

export interface Progress {
  id: string
  user_id: string
  flash_card_id: string
  completion_status: CompletionStatus
  score: number
  knowledge_level?: KnowledgeLevel
  review_date: string
}

export interface AIHistory {
  id: string
  user_id: string
  prompt: string
  response?: string
  request_type: AIRequestType
  created_at: string
}

// ─── Application state ────────────────────────────────────────────────────────

export interface StudySessionSummary {
  total_reviewed: number
  easy_count: number
  medium_count: number
  hard_count: number
  /** Number of distinct cards that entered the repeat queue */
  repeat_queue_count: number
}

export interface DashboardStats {
  overall_progress_pct: number
  completed_topics_count: number
  total_cards_reviewed: number
  total_sessions_completed: number
  /** Percentages — guaranteed to sum to 100 */
  knowledge_distribution: {
    easy: number
    medium: number
    hard: number
  }
  /** ISO timestamp, undefined if the user has never completed a session */
  last_session_date?: string
  weak_concepts: FlashCard[]
  recommendations: AWSTopic[]
}

// ─── AI payloads ──────────────────────────────────────────────────────────────

/** Shape returned by the Card Generator from the AI service */
export interface GeneratedFlashCard {
  question: string
  answer: string
  explanation: string
  difficulty: KnowledgeLevel
  aws_category: AWSCategory
  aws_service?: string
  real_world_scenario?: string
  documentation_links?: string[]
}

/** A single multiple-choice practice question */
export interface PracticeQuestion {
  question: string
  /** Exactly 4 options */
  options: [string, string, string, string]
  /** 0-indexed position of the correct answer */
  correct_index: 0 | 1 | 2 | 3
  /** ≤100 words */
  explanation: string
}

export interface TopicRecommendation {
  topic: AWSTopic
  /** ≤50 word rationale */
  rationale: string
}

// ─── UI helpers ───────────────────────────────────────────────────────────────

export interface TopicWithProgress extends AWSTopic {
  completion_pct: number
}

export interface FlashCardWithHints extends FlashCard {
  /** Pre-stored hints from the DB, used as fallback when AI is unavailable */
  stored_hints?: string[]
}
