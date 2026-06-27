/**
 * Recommendation_Engine — suggests next AWS topics based on user progress.
 *
 * Rules (Req 12):
 * - Supplies user progress data to the AI Service.
 * - New users → recommends Fundamentals topics.
 * - AI unavailable → fallback: topic with lowest completion %.
 * - Caps result at 5 recommendations.
 */
import { invokeAI } from './bedrock'
import { buildRecommendPrompt, isOnTopicResponse } from './prompts'
import type { AWSTopic, LearningLevel } from '@/types'
import { z } from 'zod'

interface GetRecommendationsParams {
  userId: string
  learningLevel: LearningLevel
  completedTopics: string[]
  weakConcepts: string[]
  /** All available topics with current completion % */
  topicsWithPct: { topic: AWSTopic; pct: number }[]
}

const recommendationSchema = z.object({
  recommendations: z.array(
    z.object({
      topic_name: z.string(),
      rationale: z.string().max(300),
    })
  ),
})

/**
 * Returns up to 5 recommended topics for the user to study next.
 * Uses AI when available; falls back to lowest-completion-% topics.
 */
export async function getRecommendations(
  params: GetRecommendationsParams
): Promise<{ topic: AWSTopic; rationale: string }[]> {
  const { learningLevel, completedTopics, weakConcepts, topicsWithPct } = params

  // Zero-progress users → Fundamentals (Req 12 AC2)
  const hasProgress = topicsWithPct.some(({ pct }) => pct > 0)
  if (!hasProgress) {
    return topicsWithPct
      .filter(({ topic }) => topic.category === 'Fundamentals')
      .slice(0, 5)
      .map(({ topic }) => ({ topic, rationale: 'Start here — Fundamentals are the foundation of all AWS knowledge.' }))
  }

  const availableTopicNames = topicsWithPct
    .filter(({ pct }) => pct < 100)
    .map(({ topic }) => topic.service_name)

  try {
    const prompt = buildRecommendPrompt({
      learningLevel,
      completedTopics,
      weakConcepts,
      availableTopics: availableTopicNames,
    })

    const response = await invokeAI({
      systemInstruction: '',
      prompt,
      maxTokens: 1024,
      temperature: 0.5,
    })

    if (!isOnTopicResponse(response.content)) {
      throw new Error('Off-topic recommendation response')
    }

    const cleaned = response.content.replace(/```json?\n?/g, '').replace(/```/g, '').trim()
    const parsed = recommendationSchema.safeParse(JSON.parse(cleaned))

    if (!parsed.success) {
      throw new Error('Invalid recommendation response format')
    }

    // Map topic names back to AWSTopic objects; discard unrecognised names
    const results: { topic: AWSTopic; rationale: string }[] = []

    for (const rec of parsed.data.recommendations.slice(0, 5)) {
      const match = topicsWithPct.find(
        ({ topic }) => topic.service_name.toLowerCase() === rec.topic_name.toLowerCase()
      )
      if (match) {
        results.push({ topic: match.topic, rationale: rec.rationale })
      }
    }

    // If AI returned fewer than 5, pad with fallback logic
    if (results.length < 5) {
      const existingIds = new Set(results.map((r) => r.topic.id))
      const fallbacks = topicsWithPct
        .filter(({ topic, pct }) => pct < 100 && !existingIds.has(topic.id))
        .sort((a, b) => a.pct - b.pct)
        .slice(0, 5 - results.length)
        .map(({ topic }) => ({ topic, rationale: 'Continue building your AWS knowledge.' }))
      results.push(...fallbacks)
    }

    return results.slice(0, 5)
  } catch (err) {
    console.error('[recommendations] AI unavailable, using fallback:', (err as Error).message)

    // Fallback: lowest completion % (Req 12 AC4)
    return topicsWithPct
      .filter(({ pct }) => pct < 100)
      .sort((a, b) => a.pct - b.pct)
      .slice(0, 5)
      .map(({ topic }) => ({
        topic,
        rationale: 'Recommended based on your current progress.',
      }))
  }
}
