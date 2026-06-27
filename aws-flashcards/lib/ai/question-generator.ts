/**
 * Question_Generator — generates multiple-choice practice questions.
 *
 * Rules (Req 11):
 * - 1–20 questions per request.
 * - Each question: 4 options, 1 correct answer, explanation ≤100 words.
 * - Logs errors server-side; returns descriptive message to client.
 */
import { invokeAI } from './bedrock'
import { buildQuestionGenPrompt, isOnTopicResponse } from './prompts'
import type { PracticeQuestion, LearningLevel, AWSCategory } from '@/types'
import { z } from 'zod'

interface GenerateQuestionsParams {
  topicName: string
  category: AWSCategory
  count: number
  learningLevel: LearningLevel
}

// Zod schema for a single MCQ
const practiceQuestionSchema = z.object({
  question: z.string().min(10),
  options: z.tuple([z.string(), z.string(), z.string(), z.string()]),
  correct_index: z.union([
    z.literal(0), z.literal(1), z.literal(2), z.literal(3),
  ]),
  explanation: z.string().min(1).max(500),
})

/**
 * Generates MCQ practice questions for a given AWS topic.
 * Returns validated questions only — invalid ones are discarded with a log.
 */
export async function generatePracticeQuestions(
  params: GenerateQuestionsParams
): Promise<PracticeQuestion[]> {
  if (params.count < 1 || params.count > 20) {
    throw new Error('Question count must be between 1 and 20.')
  }

  const prompt = buildQuestionGenPrompt(params)

  const response = await invokeAI({
    systemInstruction: '',
    prompt,
    maxTokens: 4000,
    temperature: 0.6,
  })

  // Content filter
  if (!isOnTopicResponse(response.content)) {
    console.error('[question-generator] off-topic response detected')
    throw new Error('AI returned off-topic content. Please try again.')
  }

  // Parse JSON
  let parsed: { questions: unknown[] }
  try {
    const cleaned = response.content.replace(/```json?\n?/g, '').replace(/```/g, '').trim()
    parsed = JSON.parse(cleaned)
  } catch (err) {
    console.error('[question-generator] JSON parse error:', (err as Error).message)
    throw new Error('AI returned an unexpected response format. Please try again.')
  }

  if (!Array.isArray(parsed?.questions)) {
    console.error('[question-generator] missing questions array in response')
    throw new Error('AI response did not contain a questions array.')
  }

  const validQuestions: PracticeQuestion[] = []

  for (const raw of parsed.questions) {
    const result = practiceQuestionSchema.safeParse(raw)
    if (!result.success) {
      console.error('[question-generator] invalid question discarded:', result.error.flatten())
      continue
    }

    validQuestions.push({
      question: result.data.question,
      options: result.data.options,
      correct_index: result.data.correct_index,
      explanation: result.data.explanation,
    })
  }

  if (validQuestions.length === 0) {
    throw new Error('No valid questions could be generated. Please try again.')
  }

  return validQuestions
}
