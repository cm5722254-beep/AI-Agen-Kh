import type { ChatMessage, AiStreamChunk, TokenUsageSummary } from '../../../shared/types'

export interface AiRequestParams {
  messages: ChatMessage[]
  model: string
  temperature?: number
  maxTokens?: number
  systemPrompt?: string
}

export interface AiProviderInterface {
  readonly name: string
  readonly displayName: string

  chat(params: AiRequestParams, apiKey: string): Promise<{ content: string; usage: TokenUsageSummary }>
  chatStream(params: AiRequestParams, apiKey: string, onChunk: (chunk: AiStreamChunk) => void): Promise<void>
  listModels(apiKey: string): Promise<Array<{ id: string; name: string }>>
  testConnection(apiKey: string): Promise<{ success: boolean; message: string }>
}
