/**
 * Bedrock_Client — communicates with Amazon Bedrock (primary) and an optional
 * fallback provider. All AI calls in the application MUST go through this module.
 *
 * Security rules (Req 15, Req 16):
 * - Credentials are read from server-side environment variables only.
 * - Never imported from client-side code.
 * - Logs duration + error code — never logs prompt content.
 * - Retries up to 2 times with exponential backoff (1s, 2s) before failing.
 * - Routes to fallback provider when FALLBACK_AI_PROVIDER env var is set.
 */
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from '@aws-sdk/client-bedrock-runtime'

export interface AIRequest {
  /** System-level instruction (AWS-scope restriction always prepended) */
  systemInstruction: string
  /** User/task prompt — must be sanitized before passing in */
  prompt: string
  maxTokens?: number
  temperature?: number
}

export interface AIResponse {
  content: string
  /** Provider that served the response */
  provider: 'bedrock' | 'openai' | 'fallback'
}

// ─── Bedrock client (lazy-initialised) ───────────────────────────────────────

let _bedrockClient: BedrockRuntimeClient | null = null

function getBedrockClient(): BedrockRuntimeClient {
  if (!_bedrockClient) {
    _bedrockClient = new BedrockRuntimeClient({
      region: process.env.AWS_REGION ?? 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    })
  }
  return _bedrockClient
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** Exponential backoff delays: 1s, 2s */
const BACKOFF_MS = [1000, 2000]

// ─── Primary: Amazon Bedrock ──────────────────────────────────────────────────

async function invokeBedrockWithRetry(request: AIRequest): Promise<string> {
  const modelId =
    process.env.BEDROCK_MODEL_ID ?? 'anthropic.claude-3-sonnet-20240229-v1:0'

  const fullPrompt = `${request.systemInstruction}\n\n${request.prompt}`

  // Claude models use the Messages API format
  const body = JSON.stringify({
    anthropic_version: 'bedrock-2023-05-31',
    max_tokens: request.maxTokens ?? 2048,
    temperature: request.temperature ?? 0.7,
    messages: [{ role: 'user', content: fullPrompt }],
  })

  let lastError: Error | null = null

  for (let attempt = 0; attempt <= 2; attempt++) {
    const start = Date.now()
    try {
      const command = new InvokeModelCommand({
        modelId,
        contentType: 'application/json',
        accept: 'application/json',
        body: Buffer.from(body),
      })

      const response = await getBedrockClient().send(command)
      const duration = Date.now() - start
      console.log(`[bedrock] attempt=${attempt} duration=${duration}ms model=${modelId}`)

      const parsed = JSON.parse(Buffer.from(response.body).toString())
      // Claude response shape: { content: [{ type: 'text', text: '...' }] }
      const text: string = parsed?.content?.[0]?.text ?? ''
      if (!text) throw new Error('Empty response from Bedrock')
      return text
    } catch (err) {
      const duration = Date.now() - start
      const code = (err as { name?: string })?.name ?? 'UnknownError'
      // Log error code + duration only — never log prompt content (Req 16 AC5)
      console.error(`[bedrock] attempt=${attempt} error=${code} duration=${duration}ms`)
      lastError = err as Error

      if (attempt < 2) await sleep(BACKOFF_MS[attempt])
    }
  }

  throw lastError ?? new Error('Bedrock unavailable after retries')
}

// ─── Fallback: OpenAI-compatible API ─────────────────────────────────────────

async function invokeOpenAIFallback(request: AIRequest): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('Fallback provider not configured')

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      max_tokens: request.maxTokens ?? 2048,
      temperature: request.temperature ?? 0.7,
      messages: [
        { role: 'system', content: request.systemInstruction },
        { role: 'user', content: request.prompt },
      ],
    }),
  })

  if (!res.ok) {
    const errCode = res.status
    console.error(`[openai-fallback] error=${errCode}`)
    throw new Error(`OpenAI fallback error: ${errCode}`)
  }

  const json = await res.json()
  return json.choices?.[0]?.message?.content ?? ''
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Sends a request to the AI service.
 * Tries Bedrock first; falls back to the configured fallback provider on failure.
 * Throws if both are unavailable.
 */
export async function invokeAI(request: AIRequest): Promise<AIResponse> {
  try {
    const content = await invokeBedrockWithRetry(request)
    return { content, provider: 'bedrock' }
  } catch (bedrockErr) {
    console.error('[bedrock] all retries exhausted:', (bedrockErr as Error).message)

    const fallbackProvider = process.env.FALLBACK_AI_PROVIDER
    if (fallbackProvider === 'openai') {
      try {
        const content = await invokeOpenAIFallback(request)
        return { content, provider: 'openai' }
      } catch (fallbackErr) {
        console.error('[fallback] error:', (fallbackErr as Error).message)
        throw new Error('AI service is currently unavailable. Please try again later.')
      }
    }

    throw new Error('AI service is currently unavailable. Please try again later.')
  }
}
