/**
 * Input validation module.
 *
 * All user-supplied data is validated here before being passed to Supabase
 * or the AI Service. Uses Zod for schema validation.
 */
import { z } from 'zod'
import type { AWSCategory, KnowledgeLevel } from '@/types'

// ─── Constants ────────────────────────────────────────────────────────────────

export const AWS_CATEGORIES: AWSCategory[] = [
  'Fundamentals',
  'Compute',
  'Storage',
  'Databases',
  'Networking',
  'Security',
  'Serverless',
  'AI Services',
]

export const KNOWLEDGE_LEVELS: KnowledgeLevel[] = ['easy', 'medium', 'hard']

// ─── Schemas ──────────────────────────────────────────────────────────────────

export const usernameSchema = z
  .string({ invalid_type_error: 'Username must be a string' })
  .min(3, 'Username must be at least 3 characters')
  .max(50, 'Username must be at most 50 characters')

export const learningLevelSchema = z.enum(['beginner', 'intermediate', 'advanced'], {
  errorMap: () => ({
    message: "Learning level must be 'beginner', 'intermediate', or 'advanced'",
  }),
})

export const profileUpdateSchema = z
  .object({
    username: usernameSchema.optional(),
    learning_level: learningLevelSchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for a profile update',
  })

export const flashCardSchema = z.object({
  question: z
    .string()
    .min(10, 'Question must be at least 10 characters')
    .max(500, 'Question must be at most 500 characters'),
  answer: z
    .string()
    .min(10, 'Answer must be at least 10 characters')
    .max(1000, 'Answer must be at most 1000 characters'),
  explanation: z
    .string()
    .min(20, 'Explanation must be at least 20 characters')
    .max(2000, 'Explanation must be at most 2000 characters'),
  difficulty: z.enum(['easy', 'medium', 'hard'], {
    errorMap: () => ({ message: "Difficulty must be 'easy', 'medium', or 'hard'" }),
  }),
  aws_category: z.enum(
    [
      'Fundamentals',
      'Compute',
      'Storage',
      'Databases',
      'Networking',
      'Security',
      'Serverless',
      'AI Services',
    ],
    { errorMap: () => ({ message: 'Invalid AWS category' }) }
  ),
  aws_service: z.string().optional(),
  real_world_scenario: z.string().optional(),
  ai_generated: z.boolean().default(false),
  documentation_links: z
    .array(z.string().url('Each documentation link must be a valid URL'))
    .default([]),
})

export const aiChatInputSchema = z
  .string()
  .min(1, 'Message cannot be empty')
  .max(500, 'Message must be at most 500 characters')

export const generateCardsRequestSchema = z.object({
  topic_id: z.string().uuid('Invalid topic ID'),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  count: z
    .number()
    .int()
    .min(1, 'Must request at least 1 card')
    .max(20, 'Cannot request more than 20 cards at once')
    .default(5),
})

export const practiceQuestionsRequestSchema = z.object({
  topic_id: z.string().uuid('Invalid topic ID'),
  count: z
    .number()
    .int()
    .min(1, 'Must request at least 1 question')
    .max(20, 'Cannot request more than 20 questions at once'),
})

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Sanitizes a string for safe inclusion in AI prompts.
 * Strips common prompt-injection patterns while preserving legitimate content.
 */
export function sanitizeForPrompt(input: string): string {
  return input
    .replace(/\[SYSTEM\]/gi, '')
    .replace(/\[TASK\]/gi, '')
    .replace(/\[CONTEXT\]/gi, '')
    .replace(/ignore\s+previous\s+instructions?/gi, '')
    .replace(/you\s+are\s+now\s+a?\s*different/gi, '')
    .replace(/<\/?[^>]+(>|$)/g, '') // strip HTML tags
    .trim()
    .slice(0, 500) // hard cap at 500 chars
}
