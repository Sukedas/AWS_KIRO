/**
 * POST /api/ai/questions
 *
 * Generates multiple-choice practice questions for an AWS topic.
 * Used by the Quiz page.
 */
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generatePracticeQuestions } from '@/lib/ai/question-generator'
import { practiceQuestionsRequestSchema } from '@/lib/validation'
import type { AWSTopic, LearningLevel } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const parsed = practiceQuestionsRequestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    // Fetch topic
    const { data: topic } = await supabase
      .from('aws_topics')
      .select('id, category, service_name, description, difficulty')
      .eq('id', parsed.data.topic_id)
      .single()

    if (!topic) return NextResponse.json({ error: 'Topic not found' }, { status: 404 })

    // Fetch user learning level
    const { data: profile } = await supabase
      .from('users').select('learning_level').eq('id', user.id).single()
    const learningLevel: LearningLevel = (profile?.learning_level as LearningLevel) ?? 'beginner'

    const questions = await generatePracticeQuestions({
      topicName: (topic as AWSTopic).service_name,
      category: (topic as AWSTopic).category,
      count: parsed.data.count,
      learningLevel,
    })

    // Log to ai_history
    await supabase.from('ai_history').insert({
      user_id: user.id,
      prompt: `questions:${(topic as AWSTopic).service_name}:${parsed.data.count}`,
      response: `${questions.length} questions generated`,
      request_type: 'questions',
    })

    return NextResponse.json({ questions })
  } catch (err) {
    console.error('[api:ai:questions]', err)
    return NextResponse.json(
      { error: (err as Error).message || 'AI service error. Please try again.' },
      { status: 500 }
    )
  }
}
