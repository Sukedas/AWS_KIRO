import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getUserProgress, getWeakConceptCardIds, getTopicCompletionPct } from '@/lib/progress'
import { StatsPanel } from '@/components/dashboard/StatsPanel'
import { WeakConceptsList } from '@/components/dashboard/WeakConceptsList'
import { RecommendationsList } from '@/components/dashboard/RecommendationsList'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import type { DashboardStats, FlashCard, AWSTopic } from '@/types'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch user profile
  const { data: profile } = await supabase
    .from('users')
    .select('username, learning_level, created_at')
    .eq('id', user.id)
    .single()

  // Fetch all flash cards (for total count)
  const { count: totalCards } = await supabase
    .from('flash_cards')
    .select('id', { count: 'exact', head: true })

  // Fetch user progress
  const progressRecords = await getUserProgress(user.id)
  const completedCount = progressRecords.filter(p => p.completion_status === 'completed').length
  const overallPct = totalCards && totalCards > 0
    ? Math.round((completedCount / totalCards) * 100) : 0

  // Knowledge distribution
  const rated = progressRecords.filter(p => p.knowledge_level)
  const total = rated.length || 1
  const easy = Math.round((rated.filter(p => p.knowledge_level === 'easy').length / total) * 100)
  const medium = Math.round((rated.filter(p => p.knowledge_level === 'medium').length / total) * 100)
  const hard = 100 - easy - medium

  // Last session date
  const lastSession = progressRecords[0]?.review_date

  // Weak concepts
  const weakCardIds = await getWeakConceptCardIds(user.id)
  let weakCards: FlashCard[] = []
  if (weakCardIds.length > 0) {
    const { data } = await supabase
      .from('flash_cards')
      .select('id, topic_id, question, answer, explanation, difficulty, aws_category, aws_service, real_world_scenario, ai_generated, documentation_links')
      .in('id', weakCardIds.slice(0, 10))
    weakCards = (data ?? []) as FlashCard[]
  }

  // Completed topics count
  const { data: allTopics } = await supabase
    .from('aws_topics')
    .select('id, category, service_name, description, difficulty')
  const topics = (allTopics ?? []) as AWSTopic[]

  let completedTopicsCount = 0
  for (const topic of topics) {
    const pct = await getTopicCompletionPct(user.id, topic.id)
    if (pct === 100) completedTopicsCount++
  }

  // Recommendations: topics with lowest completion %
  const topicPcts = await Promise.all(
    topics.map(async (t) => ({ topic: t, pct: await getTopicCompletionPct(user.id, t.id) }))
  )
  const recommendations = topicPcts
    .filter(({ pct }) => pct < 100)
    .sort((a, b) => a.pct - b.pct)
    .slice(0, 5)
    .map(({ topic }) => topic)

  const stats: DashboardStats = {
    overall_progress_pct: overallPct,
    completed_topics_count: completedTopicsCount,
    total_cards_reviewed: progressRecords.length,
    total_sessions_completed: progressRecords.filter(p => p.completion_status === 'completed').length,
    knowledge_distribution: { easy, medium, hard },
    last_session_date: lastSession,
    weak_concepts: weakCards,
    recommendations,
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Greeting */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            Welcome back, {profile?.username ?? 'learner'} 👋
          </h1>
          <p className="text-text-muted text-sm mt-1">Keep up the momentum!</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="level" label={profile?.learning_level ?? 'beginner'} />
          <Link href="/topics">
            <Button size="sm">Browse Topics</Button>
          </Link>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stats — left col on desktop */}
        <div className="lg:col-span-1">
          <StatsPanel stats={stats} />
        </div>

        {/* Right cols */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <RecommendationsList topics={recommendations} />
          <WeakConceptsList cards={weakCards} />
        </div>
      </div>

      {/* Quick-start category buttons */}
      <div>
        <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">Quick Start</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {['Fundamentals', 'Compute', 'Storage', 'Security'].map((cat) => (
            <Link key={cat} href={`/topics?category=${encodeURIComponent(cat)}`}>
              <div className="p-4 bg-surface-card rounded-2xl border border-surface-muted hover:border-primary hover:bg-primary/5 transition-all text-center cursor-pointer">
                <p className="text-sm font-medium text-text-primary">{cat}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
