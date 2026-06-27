/**
 * Hint_Generator — generates contextual hints for flash cards.
 *
 * Rules (Req 13):
 * - Prompt never includes the card answer.
 * - Returns pre-stored fallback hints if AI is unavailable.
 * - Valid hint: non-empty string ≥10 characters.
 */
import { invokeAI } from './bedrock'
import { buildHintPrompt, isOnTopicResponse } from './prompts'

interface GenerateHintParams {
  question: string
  topicName: string
  category: string
}

interface HintResult {
  hint: string
  /** true = from AI, false = from stored fallback */
  fromAI: boolean
}

/**
 * Generates a single contextual hint for a flash card question.
 * Falls back to storedHints if the AI is unavailable.
 * Throws if both sources are unavailable.
 */
export async function generateHint(
  params: GenerateHintParams,
  storedHints: string[] = []
): Promise<HintResult> {
  try {
    const prompt = buildHintPrompt(params)

    const response = await invokeAI({
      systemInstruction: '',
      prompt,
      maxTokens: 256,
      temperature: 0.6,
    })

    // Content filter
    if (!isOnTopicResponse(response.content)) {
      throw new Error('Off-topic hint returned')
    }

    // Parse hint from JSON response
    let hint: string
    try {
      const cleaned = response.content.replace(/```json?\n?/g, '').replace(/```/g, '').trim()
      const parsed = JSON.parse(cleaned) as { hint?: string }
      hint = (parsed?.hint ?? '').trim()
    } catch {
      // If JSON parsing fails, try using raw content as hint
      hint = response.content.trim().slice(0, 300)
    }

    // Validate hint (≥10 chars)
    if (hint.length < 10) {
      throw new Error('AI returned an invalid hint (too short)')
    }

    return { hint, fromAI: true }
  } catch (err) {
    console.error('[hint-generator] AI unavailable:', (err as Error).message)

    // Fallback to pre-stored hints (Req 13 AC4)
    if (storedHints.length > 0) {
      const fallback = storedHints[0]
      return { hint: fallback, fromAI: false }
    }

    throw new Error('Hints are currently unavailable. Please try again later.')
  }
}
