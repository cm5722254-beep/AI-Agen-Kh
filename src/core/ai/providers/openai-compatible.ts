/**
 * OpenAI-Compatible Provider
 * Works for: OpenAI, NVIDIA NIM, OpenRouter, Ollama, and any OpenAI-compatible API
 */
import https from 'https'
import http from 'http'
import { URL } from 'url'
import type { AiProviderInterface, AiRequestParams } from './base'
import type { AiStreamChunk, ChatMessage, TokenUsageSummary } from '../../../shared/types'
import { logger } from '../../logging/logger'

function estimateTokens(text: string): number {
  // Rough GPT-4 tokenization estimate: ~4 chars per token
  return Math.ceil(text.length / 4)
}

function buildMessages(params: AiRequestParams): Array<{ role: string; content: string }> {
  const messages: Array<{ role: string; content: string }> = []
  if (params.systemPrompt) {
    messages.push({ role: 'system', content: params.systemPrompt })
  }
  for (const msg of params.messages) {
    messages.push({ role: msg.role, content: msg.content })
  }
  return messages
}

async function makeRequest(
  baseUrl: string,
  path: string,
  apiKey: string,
  body: object,
  stream: boolean,
  onData?: (chunk: string) => void
): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl.endsWith('/') ? baseUrl : baseUrl + '/')
    const isHttps = url.protocol === 'https:'
    const lib = isHttps ? https : http
    const bodyStr = JSON.stringify(body)

    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Content-Length': Buffer.byteLength(bodyStr),
        ...(stream ? { 'Accept': 'text/event-stream' } : {}),
      },
    }

    const req = lib.request(options, (res) => {
      let data = ''
      res.on('data', (chunk: Buffer) => {
        const text = chunk.toString()
        if (stream && onData) onData(text)
        data += text
      })
      res.on('end', () => resolve({ status: res.statusCode ?? 0, body: data }))
    })

    req.on('error', reject)
    req.write(bodyStr)
    req.end()
  })
}

export class OpenAICompatibleProvider implements AiProviderInterface {
  readonly name: string
  readonly displayName: string
  private baseUrl: string

  constructor(name: string, displayName: string, baseUrl: string) {
    this.name = name
    this.displayName = displayName
    this.baseUrl = baseUrl
  }

  async chat(params: AiRequestParams, apiKey: string): Promise<{ content: string; usage: TokenUsageSummary }> {
    const body = {
      model: params.model,
      messages: buildMessages(params),
      temperature: params.temperature ?? 0.7,
      max_tokens: params.maxTokens ?? 4096,
      stream: false,
    }

    const { status, body: responseBody } = await makeRequest(this.baseUrl, 'chat/completions', apiKey, body, false)

    if (status !== 200) {
      let errMsg = `HTTP ${status}`
      try {
        const parsed = JSON.parse(responseBody)
        errMsg = parsed.error?.message ?? errMsg
      } catch {}
      throw new Error(`AI API Error: ${errMsg}`)
    }

    const parsed = JSON.parse(responseBody)
    const content = parsed.choices?.[0]?.message?.content ?? ''
    const usageData = parsed.usage

    let usage: TokenUsageSummary
    if (usageData) {
      usage = {
        inputTokens: usageData.prompt_tokens ?? 0,
        outputTokens: usageData.completion_tokens ?? 0,
        totalTokens: usageData.total_tokens ?? 0,
        isEstimated: false,
      }
    } else {
      const allText = params.messages.map(m => m.content).join(' ') + content
      const est = estimateTokens(allText)
      usage = {
        inputTokens: Math.ceil(est * 0.7),
        outputTokens: Math.ceil(est * 0.3),
        totalTokens: est,
        isEstimated: true,
      }
    }

    logger.ai(`Chat completed: ${usage.totalTokens} tokens (${usage.isEstimated ? 'estimated' : 'exact'})`)
    return { content, usage }
  }

  async chatStream(
    params: AiRequestParams,
    apiKey: string,
    onChunk: (chunk: AiStreamChunk) => void
  ): Promise<void> {
    const body = {
      model: params.model,
      messages: buildMessages(params),
      temperature: params.temperature ?? 0.7,
      max_tokens: params.maxTokens ?? 4096,
      stream: true,
    }

    let fullContent = ''
    let inputTokens = 0
    let outputTokens = 0
    let usageReceived = false

    await makeRequest(
      this.baseUrl,
      'chat/completions',
      apiKey,
      body,
      true,
      (rawChunk: string) => {
        const lines = rawChunk.split('\n')
        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed.startsWith('data: ')) continue
          const data = trimmed.slice(6)
          if (data === '[DONE]') {
            if (!usageReceived) {
              const allText = params.messages.map(m => m.content).join(' ')
              inputTokens = estimateTokens(allText)
              outputTokens = estimateTokens(fullContent)
            }
            onChunk({
              type: 'done',
              usage: {
                inputTokens,
                outputTokens,
                totalTokens: inputTokens + outputTokens,
                isEstimated: !usageReceived,
              },
            })
            return
          }
          try {
            const parsed = JSON.parse(data)
            const delta = parsed.choices?.[0]?.delta?.content
            if (delta) {
              fullContent += delta
              onChunk({ type: 'delta', content: delta })
            }
            // Some providers send usage in stream
            if (parsed.usage) {
              inputTokens = parsed.usage.prompt_tokens ?? 0
              outputTokens = parsed.usage.completion_tokens ?? 0
              usageReceived = true
            }
          } catch {
            // Skip malformed SSE lines
          }
        }
      }
    )
  }

  async listModels(apiKey: string): Promise<Array<{ id: string; name: string }>> {
    try {
      const result = await new Promise<{ status: number; body: string }>((resolve, reject) => {
        const url = new URL('models', this.baseUrl.endsWith('/') ? this.baseUrl : this.baseUrl + '/')
        const isHttps = url.protocol === 'https:'
        const lib = isHttps ? https : http
        const options = {
          hostname: url.hostname,
          port: url.port || (isHttps ? 443 : 80),
          path: url.pathname,
          method: 'GET',
          headers: { 'Authorization': `Bearer ${apiKey}` },
        }
        const req = lib.request(options, (res) => {
          let data = ''
          res.on('data', (c: Buffer) => (data += c.toString()))
          res.on('end', () => resolve({ status: res.statusCode ?? 0, body: data }))
        })
        req.on('error', reject)
        req.end()
      })

      if (result.status !== 200) return []
      const parsed = JSON.parse(result.body)
      return (parsed.data ?? []).map((m: any) => ({ id: m.id, name: m.id }))
    } catch {
      return []
    }
  }

  async testConnection(apiKey: string): Promise<{ success: boolean; message: string }> {
    try {
      const models = await this.listModels(apiKey)
      if (models.length >= 0) {
        return { success: true, message: `ការតភ្ជាប់ជោគជ័យ — ${this.displayName}` }
      }
      return { success: false, message: 'API Key មិនត្រឹមត្រូវ' }
    } catch (err: any) {
      return { success: false, message: `ការតភ្ជាប់បរាជ័យ: ${err.message}` }
    }
  }
}
