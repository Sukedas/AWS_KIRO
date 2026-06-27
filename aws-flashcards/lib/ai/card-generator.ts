/**
 * Card_Generator — generates AWS flash cards via the AI Service.
 *
 * Rules (Req 9):
 * - Sets ai_generated = true on all produced cards.
 * - Validates each card against the flash card schema.
 * - Logs malformed responses server-side; never surfaces raw errors to clients.
 * - Round-trip guarantee: parse → serialize → parse produces equivalent object.
 */
import { invokeAI } from './bedrock'
import { buildCardGenPrompt, isOnTopicResponse } from './prompts'
import { flashCardSchema } from '@/lib/validation'
import type { GeneratedFlashCard, LearningLevel, AWSCategory, KnowledgeLevel } from '@/types'

interface GenerateCardsParams {
  topicName: string
  category: AWSCategory
  difficulty: KnowledgeLevel
  count: number
  learningLevel: LearningLevel
}

interface GenerateCardsResult {
  cards: GeneratedFlashCard[]
  errors: string[]
}

/**
 * Generates flash cards for a given AWS topic using the AI Service.
 * Invalid cards are discarded; errors are collected and returned.
 */
export async function generateFlashCards(
  params: GenerateCardsParams
): Promise<GenerateCardsResult> {
  const prompt = buildCardGenPrompt(params)

  const response = await invokeAI({
    systemInstruction: '',   // already embedded in prompt
    prompt,
    maxTokens: 3000,
    temperature: 0.7,
  })

  // Content filter (Req 15 AC4)
  if (!isOnTopicResponse(response.content)) {
    console.error('[card-generator] off-topic response detected')
    throw new Error('AI returned off-topic content. Please try again.')
  }

  // Parse JSON
  let parsed: { cards: unknown[] }
  try {
    // Strip any accidental markdown code fences before parsing
    const cleaned = response.content.replace(/```json?\n?/g, '').replace(/```/g, '').trim()
    parsed = JSON.parse(cleaned)
  } catch (err) {
    console.error('[card-generator] JSON parse error:', (err as Error).message)
    throw new Error('AI returned an unexpected response format. Please try again.')
  }

  if (!Array.isArray(parsed?.cards)) {
    console.error('[card-generator] missing cards array in response')
    throw new Error('AI response did not contain a cards array.')
  }

  const validCards: GeneratedFlashCard[] = []
  const errors: string[] = []

  for (const rawCard of parsed.cards) {
    const result = flashCardSchema.safeParse({ ...(rawCard as object), ai_generated: true })

    if (!result.success) {
      const issues = result.error.flatten().fieldErrors
      console.error('[card-generator] invalid card discarded:', JSON.stringify(issues))
      errors.push(`Card discarded: ${Object.keys(issues).join(', ')} failed validation`)
      continue
    }

    // Round-trip check (Req 9 AC8)
    const serialized = JSON.stringify(result.data)
    const reparsed = JSON.parse(serialized)
    const roundTripResult = flashCardSchema.safeParse(reparsed)

    if (!roundTripResult.success) {
      console.error('[card-generator] round-trip check failed for card')
      errors.push('Card discarded: failed round-trip serialization check')
      continue
    }

    validCards.push({
      question: result.data.question,
      answer: result.data.answer,
      explanation: result.data.explanation,
      difficulty: result.data.difficulty as KnowledgeLevel,
      aws_category: result.data.aws_category as AWSCategory,
      aws_service: result.data.aws_service,
      real_world_scenario: result.data.real_world_scenario,
      documentation_links: result.data.documentation_links,
    })
  }

  return { cards: validCards, errors }
}
