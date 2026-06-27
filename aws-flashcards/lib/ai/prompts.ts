/**
 * Prompt_Builder — constructs sanitized, structured prompts for the AI Service.
 *
 * Rules (Req 15):
 * - All user-supplied text is sanitized before inclusion.
 * - Every prompt includes the AWS-scope system instruction.
 * - No credential or sensitive data is ever included in prompts.
 */
import { sanitizeForPrompt } from '@/lib/validation'
import type { LearningLevel, AWSCategory } from '@/types'

// ─── System instruction (always prepended) ───────────────────────────────────

export const AWS_SYSTEM_INSTRUCTION = `You are an AWS educational assistant. You ONLY respond to questions and tasks related to Amazon Web Services and cloud computing. If asked about anything outside AWS or cloud computing, politely decline and redirect the user to AWS topics. Always be accurate, educational, and concise.`

// ─── Output content filter ────────────────────────────────────────────────────

// Keywords that suggest off-topic content (server-side filter, Req 15 AC4)
const OFF_TOPIC_PATTERNS = [
  /\b(recipe|cooking|music|sport|film|movie|celebrity|politics|religion|invest|stock|crypto)\b/i,
]

/**
 * Checks whether an AI response appears to be on-topic (AWS/cloud computing).
 * Returns false if clearly off-topic content is detected.
 */
export function isOnTopicResponse(response: string): boolean {
  return !OFF_TOPIC_PATTERNS.some((pattern) => pattern.test(response))
}

// ─── Flash Card Generation ────────────────────────────────────────────────────

export interface CardGenPromptParams {
  topicName: string
  category: AWSCategory
  difficulty: 'easy' | 'medium' | 'hard'
  count: number
  learningLevel: LearningLevel
}

export function buildCardGenPrompt(params: CardGenPromptParams): string {
  const { topicName, category, difficulty, count, learningLevel } = params

  const levelGuide = {
    beginner: 'Focus on definitions, basic concepts, and simple analogies.',
    intermediate: 'Include comparisons, trade-offs, and configuration options.',
    advanced: 'Include architecture decisions, edge cases, cost/performance optimization.',
  }[learningLevel]

  return `${AWS_SYSTEM_INSTRUCTION}

[CONTEXT]
User learning level: ${learningLevel}
AWS Topic: ${sanitizeForPrompt(topicName)} (${category})
Difficulty: ${difficulty}

[TASK]
Generate exactly ${count} AWS flash card(s) for the topic above.
${levelGuide}

[OUTPUT FORMAT]
Return ONLY a valid JSON object with this exact structure — no markdown, no explanation, no code fences:
{
  "cards": [
    {
      "question": "string (10-500 chars)",
      "answer": "string (10-1000 chars)",
      "explanation": "string (20-2000 chars)",
      "difficulty": "${difficulty}",
      "aws_category": "${category}",
      "aws_service": "string",
      "real_world_scenario": "string describing a practical use-case",
      "documentation_links": ["https://docs.aws.amazon.com/..."]
    }
  ]
}`
}

// ─── Concept Explanation ──────────────────────────────────────────────────────

export interface ExplainPromptParams {
  concept: string
  topicName?: string
  category?: string
  learningLevel: LearningLevel
}

export function buildExplainPrompt(params: ExplainPromptParams): string {
  const { concept, topicName, category, learningLevel } = params
  const sanitized = sanitizeForPrompt(concept)

  const levelGuide = {
    beginner: 'Use simple language, avoid jargon, use everyday analogies.',
    intermediate: 'Assume familiarity with basic cloud concepts.',
    advanced: 'Include technical depth, edge cases, and architectural considerations.',
  }[learningLevel]

  const context = topicName
    ? `Topic context: ${sanitizeForPrompt(topicName)}${category ? ` (${category})` : ''}\n`
    : ''

  return `${AWS_SYSTEM_INSTRUCTION}

[CONTEXT]
${context}User learning level: ${learningLevel}

[TASK]
Explain the following AWS concept clearly and accurately:
"${sanitized}"

${levelGuide}
Keep the explanation under 300 words. Do not include content unrelated to AWS or cloud computing.`
}

// ─── Practice Questions ───────────────────────────────────────────────────────

export interface QuestionGenPromptParams {
  topicName: string
  category: AWSCategory
  count: number
  learningLevel: LearningLevel
}

export function buildQuestionGenPrompt(params: QuestionGenPromptParams): string {
  const { topicName, category, count, learningLevel } = params

  return `${AWS_SYSTEM_INSTRUCTION}

[CONTEXT]
User learning level: ${learningLevel}
AWS Topic: ${sanitizeForPrompt(topicName)} (${category})

[TASK]
Generate exactly ${count} multiple-choice practice question(s) about the topic above.
Each question must have exactly 4 answer options with exactly 1 correct answer.
Explanations must be ≤100 words.

[OUTPUT FORMAT]
Return ONLY a valid JSON object — no markdown, no explanation, no code fences:
{
  "questions": [
    {
      "question": "string",
      "options": ["option A", "option B", "option C", "option D"],
      "correct_index": 0,
      "explanation": "string (≤100 words)"
    }
  ]
}`
}

// ─── Recommendations ──────────────────────────────────────────────────────────

export interface RecommendPromptParams {
  learningLevel: LearningLevel
  completedTopics: string[]
  weakConcepts: string[]
  availableTopics: string[]
}

export function buildRecommendPrompt(params: RecommendPromptParams): string {
  const { learningLevel, completedTopics, weakConcepts, availableTopics } = params

  return `${AWS_SYSTEM_INSTRUCTION}

[CONTEXT]
User learning level: ${learningLevel}
Completed topics: ${completedTopics.length > 0 ? completedTopics.join(', ') : 'None yet'}
Weak concepts (rated hard): ${weakConcepts.length > 0 ? weakConcepts.join(', ') : 'None identified'}
Available topics to recommend: ${availableTopics.join(', ')}

[TASK]
Recommend exactly 5 AWS topics the user should study next, in priority order.
Base your recommendations on their progress, weak areas, and learning level.
If they have no progress, recommend Fundamentals topics first.
Each recommendation must include a brief rationale (≤50 words).

[OUTPUT FORMAT]
Return ONLY a valid JSON object — no markdown, no explanation, no code fences:
{
  "recommendations": [
    {
      "topic_name": "string (must match one of the available topics exactly)",
      "rationale": "string (≤50 words)"
    }
  ]
}`
}

// ─── Hints ────────────────────────────────────────────────────────────────────

export interface HintPromptParams {
  question: string
  topicName: string
  category: string
}

export function buildHintPrompt(params: HintPromptParams): string {
  const { question, topicName, category } = params

  return `${AWS_SYSTEM_INSTRUCTION}

[CONTEXT]
AWS Topic: ${sanitizeForPrompt(topicName)} (${category})

[TASK]
Provide a helpful hint for the following AWS flash card question WITHOUT revealing the answer.
The hint should guide the user toward the answer through a clue, analogy, or related concept.
Keep the hint to 1-2 sentences (≥10 characters, ≤300 characters).

Question: "${sanitizeForPrompt(question)}"

[OUTPUT FORMAT]
Return ONLY a valid JSON object — no markdown, no explanation, no code fences:
{
  "hint": "string (your hint here)"
}`
}
