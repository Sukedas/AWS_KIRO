/**
 * Unit tests for lib/ai/card-generator.ts
 * Uses vi.mock to stub the Bedrock client so no real AI calls are made.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the Bedrock invoker before importing card-generator
vi.mock('@/lib/ai/bedrock', () => ({
  invokeAI: vi.fn(),
}))

import { generateFlashCards } from '@/lib/ai/card-generator'
import { invokeAI } from '@/lib/ai/bedrock'

const mockInvokeAI = vi.mocked(invokeAI)

const VALID_CARD_RESPONSE = JSON.stringify({
  cards: [
    {
      question: 'What is Amazon S3 used for?',
      answer: 'Object storage for any amount of data.',
      explanation: 'S3 stores objects in buckets with 11 nines of durability and high availability.',
      difficulty: 'easy',
      aws_category: 'Storage',
      aws_service: 'S3',
      real_world_scenario: 'A company stores images in S3 for a web app.',
      documentation_links: ['https://docs.aws.amazon.com/s3/'],
    },
  ],
})

const BASE_PARAMS = {
  topicName: 'S3',
  category: 'Storage' as const,
  difficulty: 'easy' as const,
  count: 1,
  learningLevel: 'beginner' as const,
}

beforeEach(() => {
  mockInvokeAI.mockReset()
})

describe('generateFlashCards', () => {
  it('returns parsed cards on valid AI response', async () => {
    mockInvokeAI.mockResolvedValueOnce({ content: VALID_CARD_RESPONSE, provider: 'bedrock' })

    const result = await generateFlashCards(BASE_PARAMS)

    expect(result.cards).toHaveLength(1)
    expect(result.cards[0].question).toContain('S3')
    expect(result.cards[0].ai_generated).toBeUndefined() // ai_generated is stripped from GeneratedFlashCard
    expect(result.errors).toHaveLength(0)
  })

  it('sets correct fields on generated cards', async () => {
    mockInvokeAI.mockResolvedValueOnce({ content: VALID_CARD_RESPONSE, provider: 'bedrock' })

    const result = await generateFlashCards(BASE_PARAMS)
    const card = result.cards[0]

    expect(card.difficulty).toBe('easy')
    expect(card.aws_category).toBe('Storage')
    expect(card.aws_service).toBe('S3')
    expect(card.documentation_links).toContain('https://docs.aws.amazon.com/s3/')
  })

  it('discards cards that fail schema validation and collects errors', async () => {
    const invalidResponse = JSON.stringify({
      cards: [
        { question: 'Too short', answer: 'ok', explanation: 'exp' }, // missing required fields
        {
          question: 'What is Amazon S3?',
          answer: 'Object storage service.',
          explanation: 'S3 provides scalable object storage with 11 nines durability.',
          difficulty: 'easy',
          aws_category: 'Storage',
        },
      ],
    })
    mockInvokeAI.mockResolvedValueOnce({ content: invalidResponse, provider: 'bedrock' })

    const result = await generateFlashCards(BASE_PARAMS)

    expect(result.cards).toHaveLength(1) // valid card kept
    expect(result.errors.length).toBeGreaterThan(0) // invalid card logged
  })

  it('throws on malformed JSON response', async () => {
    mockInvokeAI.mockResolvedValueOnce({ content: 'not valid json', provider: 'bedrock' })

    await expect(generateFlashCards(BASE_PARAMS)).rejects.toThrow('unexpected response format')
  })

  it('throws when AI response has no cards array', async () => {
    mockInvokeAI.mockResolvedValueOnce({
      content: JSON.stringify({ result: [] }),
      provider: 'bedrock',
    })

    await expect(generateFlashCards(BASE_PARAMS)).rejects.toThrow('cards array')
  })

  it('throws when AI service throws', async () => {
    mockInvokeAI.mockRejectedValueOnce(new Error('AI service unavailable'))

    await expect(generateFlashCards(BASE_PARAMS)).rejects.toThrow('AI service unavailable')
  })

  it('strips markdown code fences before parsing', async () => {
    const withFences = '```json\n' + VALID_CARD_RESPONSE + '\n```'
    mockInvokeAI.mockResolvedValueOnce({ content: withFences, provider: 'bedrock' })

    const result = await generateFlashCards(BASE_PARAMS)
    expect(result.cards).toHaveLength(1)
  })

  it('round-trips cards cleanly (parse → serialize → parse)', async () => {
    mockInvokeAI.mockResolvedValueOnce({ content: VALID_CARD_RESPONSE, provider: 'bedrock' })

    const result = await generateFlashCards(BASE_PARAMS)
    const card = result.cards[0]

    // Simulate round-trip
    const serialized = JSON.stringify(card)
    const reparsed = JSON.parse(serialized)

    expect(reparsed.question).toBe(card.question)
    expect(reparsed.answer).toBe(card.answer)
    expect(reparsed.difficulty).toBe(card.difficulty)
  })
})
