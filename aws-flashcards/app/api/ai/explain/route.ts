/**
 * POST /api/ai/explain
 *
 * Returns an AI explanation for an AWS concept.
 * Used by the AI Chat page (/chat).
 */
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { invokeAI } from '@/lib/ai/bedrock'
import { buildExplainPrompt, isOnTopicResponse } from '@/lib/ai/prompts'
import { aiChatInputSchema } from '@/lib/validation'
import type { LearningLevel, AWSTopic } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()

    // Validate input
    const inputResult = aiChatInputSchema.safeParse(body.message)
    if (!inputResult.success) {
      return NextResponse.json(
        { error: 'Invalid message', details: inputResult.error.flatten() },
        { status: 400 }
      )
    }

    // Fetch user learning level
    const { data: profile } = await supabase
      .from('users').select('learning_level').eq('id', user.id).single()
    const learningLevel: LearningLevel = (profile?.learning_level as LearningLevel) ?? 'beginner'

    // Optionally fetch topic context
    let topicName: string | undefined
    let category: string | undefined
    if (body.topic_id) {
      const { data: topic } = await supabase
        .from('aws_topics')
        .select('service_name, category')
        .eq('id', body.topic_id)
        .single()
      if (topic) {
        topicName = (topic as AWSTopic).service_name
        category = (topic as AWSTopic).category
      }
    }

    const prompt = buildExplainPrompt({
      concept: inputResult.data,
      topicName,
      category,
      learningLevel,
    })

    const response = await invokeAI({
      systemInstruction: '',
      prompt,
      maxTokens: 1024,
      temperature: 0.6,
    })

    // Content filter (Req 15 AC4)
    if (!isOnTopicResponse(response.content)) {
      return NextResponse.json(
        { error: 'I can only answer questions about AWS and cloud computing.' },
        { status: 422 }
      )
    }

    // Log to ai_history
    await supabase.from('ai_history').insert({
      user_id: user.id,
      prompt: 'explain:[redacted]',
      response: response.content.slice(0, 500),
      request_type: 'explain',
    })

    return NextResponse.json({ explanation: response.content })
  } catch (err) {
    console.error('[api:ai:explain]', err)
    return NextResponse.json(
      { error: (err as Error).message || 'AI service error. Please try again.' },
      { status: 500 }
    )
  }
}
