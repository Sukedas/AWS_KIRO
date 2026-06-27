'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import { Button } from '@/components/ui/Button'
import type { AWSTopic, AWSCategory } from '@/types'

const CATEGORIES: AWSCategory[] = [
  'Fundamentals', 'Compute', 'Storage', 'Databases',
  'Networking', 'Security', 'Serverless', 'AI Services',
]

interface TopicWithPct extends AWSTopic { completion_pct: number }

export default function TopicsPage() {
  const [topics, setTopics] = useState<TopicWithPct[]>([])
  const [filtered, setFiltered] = useState<TopicWithPct[]>([])
  const [activeCategory, setActiveCategory] = useState<AWSCategory | null>(null)
  const [search, setSearch] = useState('')
  const [searchError, setSearchError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Load topics + completion percentages
  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      const { data: topicRows } = await supabase
        .from('aws_topics')
        .select('id, category, service_name, description, difficulty')
        .order('category')

      const rows = (topicRows ?? []) as AWSTopic[]

      // Fetch completion for each topic if user is logged in
      const withPct: TopicWithPct[] = await Promise.all(
        rows.map(async (t) => {
          if (!user) return { ...t, completion_pct: 0 }
          const { count: total } = await supabase
            .from('flash_cards').select('id', { count: 'exact', head: true }).eq('topic_id', t.id)
          if (!total) return { ...t, completion_pct: 0 }
          const { count: done } = await supabase
            .from('progress').select('id', { count: 'exact', head: true })
            .eq('user_id', user.id).eq('completion_status', 'completed')
          return { ...t, completion_pct: Math.round(((done ?? 0) / total) * 100) }
        })
      )

      setTopics(withPct)
      setFiltered(withPct)
      setLoading(false)
    }
    load()
  }, [])

  // Filter logic
  const applyFilters = useCallback((q: string, cat: AWSCategory | null, all: TopicWithPct[]) => {
    let result = cat ? all.filter(t => t.category === cat) : all
    if (q.length >= 2) {
      const lower = q.toLowerCase()
      result = result.filter(t =>
        t.service_name.toLowerCase().includes(lower) ||
        t.description.toLowerCase().includes(lower)
      )
    }
    return result
  }, [])

  function handleSearch(value: string) {
    setSearch(value)
    if (value.length === 1) {
      setSearchError('Search query must be at least 2 characters')
      setFiltered(applyFilters('', activeCategory, topics))
      return
    }
    setSearchError(null)
    setFiltered(applyFilters(value, activeCategory, topics))
  }

  function handleCategory(cat: AWSCategory | null) {
    setActiveCategory(cat)
    setFiltered(applyFilters(search.length >= 2 ? search : '', cat, topics))
  }

  if (loading) return (
    <div className="flex justify-center items-center py-20">
      <Spinner size="lg" label="Loading topics…" />
    </div>
  )

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">AWS Topics</h1>
        <p className="text-text-muted text-sm mt-1">Browse and start studying by service or category</p>
      </div>

      {/* Category filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Filter by category">
        <button
          role="tab"
          aria-selected={activeCategory === null}
          onClick={() => handleCategory(null)}
          className={['px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors',
            activeCategory === null ? 'bg-primary text-surface' : 'bg-surface-muted text-text-muted hover:text-text-primary'
          ].join(' ')}
        >
          All
        </button>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            role="tab"
            aria-selected={activeCategory === cat}
            onClick={() => handleCategory(cat)}
            className={['px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors',
              activeCategory === cat ? 'bg-primary text-surface' : 'bg-surface-muted text-text-muted hover:text-text-primary'
            ].join(' ')}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="max-w-md">
        <Input
          label="Search topics"
          type="search"
          placeholder="e.g. S3, Lambda, VPC…"
          value={search}
          onChange={e => handleSearch(e.target.value)}
          error={searchError ?? undefined}
        />
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center py-16 gap-3 text-text-muted">
          <span className="text-4xl" aria-hidden="true">🔍</span>
          <p className="text-sm">No topics match your current filters.</p>
          <Button variant="secondary" size="sm" onClick={() => { setSearch(''); setActiveCategory(null); setFiltered(topics) }}>
            Clear filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(topic => (
            <div key={topic.id} className="group bg-surface-card border border-surface-muted rounded-2xl p-5 hover:border-primary transition-all flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-text-primary group-hover:text-primary transition-colors">
                  {topic.service_name}
                </h3>
                <Badge variant={topic.difficulty} label={topic.difficulty} />
              </div>
              <p className="text-xs text-text-muted line-clamp-2 flex-1">{topic.description}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="category" label={topic.category} />
                  <span className="text-xs text-text-muted">{topic.completion_pct}%</span>
                </div>
                <Link href={`/study/${topic.id}`}>
                  <Button size="sm">Study</Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
