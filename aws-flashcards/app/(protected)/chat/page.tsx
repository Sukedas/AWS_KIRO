'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import type { AWSTopic } from '@/types'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const MAX_INPUT = 500

/**
 * AI Chat page — conversational interface for asking about AWS concepts.
 * History is kept in component state (session storage via useState).
 * AI calls go through the server-side /api/ai/explain route.
 */
export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [topics, setTopics] = useState<AWSTopic[]>([])
  const [selectedTopicId, setSelectedTopicId] = useState<string>('')
  const bottomRef = useRef<HTMLDivElement>(null)

  // Load topics for context selector
  useEffect(() => {
    async function loadTopics() {
      const supabase = createClient()
      const { data } = await supabase
        .from('aws_topics').select('id, service_name, category, description, difficulty').order('category')
      setTopics((data ?? []) as AWSTopic[])
    }
    loadTopics()
  }, [])

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function handleSend() {
    const trimmed = input.trim()
    if (!trimmed || loading) return
    if (trimmed.length > MAX_INPUT) return

    const userMessage: Message = { role: 'user', content: trimmed, timestamp: new Date() }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setError(null)
    setLoading(true)

    try {
      const res = await fetch('/api/ai/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed, topic_id: selectedTopicId || null }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'AI service error')

      const aiMessage: Message = { role: 'assistant', content: json.explanation, timestamp: new Date() }
      setMessages(prev => [...prev, aiMessage])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const selectedTopic = topics.find(t => t.id === selectedTopicId)

  return (
    <div className="max-w-2xl mx-auto flex flex-col h-[calc(100vh-8rem)] gap-0">
      {/* Header */}
      <div className="pb-4 border-b border-surface-muted">
        <h1 className="text-2xl font-bold text-text-primary">AI Chat</h1>
        <p className="text-text-muted text-sm mt-1">Ask anything about AWS. I&apos;ll only answer cloud-related questions.</p>
      </div>

      {/* Topic context selector */}
      <div className="py-3 border-b border-surface-muted">
        <label htmlFor="topic-select" className="text-xs text-text-muted font-medium">
          Topic context (optional)
        </label>
        <select
          id="topic-select"
          value={selectedTopicId}
          onChange={e => setSelectedTopicId(e.target.value)}
          className="mt-1 w-full bg-surface-card border border-surface-muted rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-surface"
        >
          <option value="">No specific topic</option>
          {topics.map(t => (
            <option key={t.id} value={t.id}>{t.service_name} ({t.category})</option>
          ))}
        </select>
        {selectedTopic && (
          <p className="text-xs text-text-muted mt-1">Context: {selectedTopic.description.slice(0, 80)}…</p>
        )}
      </div>

      {/* Message thread */}
      <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-4" role="log" aria-live="polite" aria-label="Chat messages">
        {messages.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-12 text-text-muted text-center">
            <span className="text-4xl" aria-hidden="true">💬</span>
            <p className="text-sm">Ask a question about any AWS service or concept.</p>
            <div className="flex flex-wrap gap-2 justify-center mt-2">
              {['What is S3?', 'Explain IAM roles', 'How does Lambda work?'].map(q => (
                <button key={q} onClick={() => setInput(q)}
                  className="text-xs px-3 py-1.5 bg-surface-muted rounded-xl text-text-muted hover:text-primary hover:bg-primary/10 transition-colors">
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={['flex', msg.role === 'user' ? 'justify-end' : 'justify-start'].join(' ')}>
            <div className={[
              'max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
              msg.role === 'user'
                ? 'bg-primary text-surface rounded-br-sm'
                : 'bg-surface-card text-text-primary rounded-bl-sm border border-surface-muted'
            ].join(' ')}>
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-surface-card border border-surface-muted rounded-2xl rounded-bl-sm px-4 py-3">
              <Spinner size="sm" label="AI is thinking…" />
            </div>
          </div>
        )}

        {error && (
          <div role="alert" className="p-3 bg-danger/10 border border-danger/30 rounded-xl text-sm text-danger flex items-center justify-between gap-3">
            <span>{error}</span>
            <Button size="sm" variant="danger" onClick={handleSend}>Retry</Button>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="pt-3 border-t border-surface-muted">
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <label htmlFor="chat-input" className="sr-only">Message</label>
            <textarea
              id="chat-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about AWS…"
              maxLength={MAX_INPUT}
              rows={2}
              className="w-full bg-surface-card border border-surface-muted rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-surface"
              aria-label="Chat message input"
            />
            <p className="text-xs text-text-muted text-right mt-0.5">{input.length}/{MAX_INPUT}</p>
          </div>
          <Button
            onClick={handleSend}
            disabled={!input.trim() || loading || input.length > MAX_INPUT}
            loading={loading}
            className="mb-5"
            aria-label="Send message"
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  )
}
