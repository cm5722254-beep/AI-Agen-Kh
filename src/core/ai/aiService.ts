import { getPrismaClient } from '../database/client'
import { decrypt, encrypt, getKeyHint } from '../security/crypto'
import { OpenAICompatibleProvider } from './providers/openai-compatible'
import type { AiProviderInterface } from './providers/base'
import type {
  AiRequestOptions,
  AiStreamChunk,
  ApiKeyInfo,
  ApiProviderInfo,
  AiModelInfo,
  AddApiKeyRequest,
  TokenUsageSummary,
} from '../../shared/types'
import { logger } from '../logging/logger'

// Provider registry
const providerCache = new Map<string, AiProviderInterface>()

function getProvider(providerName: string, baseUrl: string): AiProviderInterface {
  const cacheKey = `${providerName}:${baseUrl}`
  if (providerCache.has(cacheKey)) return providerCache.get(cacheKey)!

  const provider = new OpenAICompatibleProvider(providerName, providerName, baseUrl)
  providerCache.set(cacheKey, provider)
  return provider
}

// ===================== PROVIDERS =====================

export async function listProviders(): Promise<ApiProviderInfo[]> {
  const db = getPrismaClient()
  const providers = await db.apiProvider.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  })
  return providers.map((p) => ({
    id: p.id,
    name: p.name,
    displayName: p.displayName,
    baseUrl: p.baseUrl,
    isActive: p.isActive,
    sortOrder: p.sortOrder,
  }))
}

// ===================== API KEYS =====================

export async function listApiKeys(): Promise<ApiKeyInfo[]> {
  const db = getPrismaClient()
  const keys = await db.apiKey.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' },
  })
  return keys.map((k) => ({
    id: k.id,
    providerId: k.providerId,
    name: k.name,
    keyHint: k.keyHint,
    isDefault: k.isDefault,
    isActive: k.isActive,
    createdAt: k.createdAt.toISOString(),
  }))
}

export async function addApiKey(req: AddApiKeyRequest): Promise<{ success: boolean; id?: string; message?: string }> {
  const db = getPrismaClient()

  if (!req.apiKey || req.apiKey.trim().length < 8) {
    return { success: false, message: 'API Key មិនត្រឹមត្រូវ' }
  }

  const provider = await db.apiProvider.findUnique({ where: { id: req.providerId } })
  if (!provider) return { success: false, message: 'Provider រកមិនឃើញ' }

  const encryptedKey = encrypt(req.apiKey.trim())
  const keyHint = getKeyHint(req.apiKey.trim())

  // If set as default, unset others
  if (req.isDefault) {
    await db.apiKey.updateMany({ where: { providerId: req.providerId }, data: { isDefault: false } })
  }

  const key = await db.apiKey.create({
    data: {
      providerId: req.providerId,
      name: req.name,
      encryptedKey,
      keyHint,
      isDefault: req.isDefault ?? false,
    },
  })

  logger.info(`API key added: ${keyHint} for provider ${provider.name}`)
  return { success: true, id: key.id }
}

export async function deleteApiKey(keyId: string): Promise<void> {
  const db = getPrismaClient()
  await db.apiKey.update({ where: { id: keyId }, data: { isActive: false } })
}

export async function getDecryptedApiKey(keyId: string): Promise<string | null> {
  const db = getPrismaClient()
  const key = await db.apiKey.findUnique({ where: { id: keyId } })
  if (!key || !key.isActive) return null
  try {
    return decrypt(key.encryptedKey)
  } catch {
    return null
  }
}

// ===================== MODELS =====================

export async function listModels(providerId: string): Promise<AiModelInfo[]> {
  const db = getPrismaClient()
  const models = await db.aiModel.findMany({
    where: { providerId, isActive: true },
  })
  return models.map((m) => ({
    id: m.id,
    providerId: m.providerId,
    modelId: m.modelId,
    displayName: m.displayName,
    contextWindow: m.contextWindow,
    inputCostPer1k: m.inputCostPer1k ?? undefined,
    outputCostPer1k: m.outputCostPer1k ?? undefined,
  }))
}

export async function testApiKey(keyId: string): Promise<{ success: boolean; message: string }> {
  const db = getPrismaClient()
  const key = await db.apiKey.findUnique({ where: { id: keyId }, include: { provider: true } })
  if (!key) return { success: false, message: 'API Key រកមិនឃើញ' }

  const apiKey = await getDecryptedApiKey(keyId)
  if (!apiKey) return { success: false, message: 'មិនអាច Decrypt API Key បានទេ' }

  const provider = getProvider(key.provider.name, key.provider.baseUrl)
  return provider.testConnection(apiKey)
}

// ===================== CHAT =====================

export async function chat(
  options: AiRequestOptions,
  userId: string,
): Promise<{ content: string; usage: TokenUsageSummary }> {
  const db = getPrismaClient()

  // Check usage limits
  const limitCheck = await checkUsageLimits(userId)
  if (!limitCheck.allowed) {
    throw new Error(limitCheck.message ?? 'ការប្រើប្រាស់ Token បានដល់កំណត់')
  }

  const apiKey = await getDecryptedApiKey(options.apiKeyId)
  if (!apiKey) throw new Error('API Key រកមិនឃើញ ឬ មិនអាច Decrypt បានទេ')

  const keyRecord = await db.apiKey.findUnique({
    where: { id: options.apiKeyId },
    include: { provider: true },
  })
  if (!keyRecord) throw new Error('API Key record រកមិនឃើញ')

  const provider = getProvider(keyRecord.provider.name, keyRecord.provider.baseUrl)

  const result = await provider.chat(
    {
      messages: options.messages,
      model: options.modelId,
      temperature: options.temperature,
      maxTokens: options.maxTokens,
      systemPrompt: buildSystemPrompt(),
    },
    apiKey
  )

  // Record usage
  await recordUsage(userId, options, result.usage, keyRecord.provider.name)

  return result
}

export async function chatStream(
  options: AiRequestOptions,
  userId: string,
  onChunk: (chunk: AiStreamChunk) => void
): Promise<void> {
  const db = getPrismaClient()

  const limitCheck = await checkUsageLimits(userId)
  if (!limitCheck.allowed) {
    onChunk({ type: 'error', error: limitCheck.message })
    return
  }

  const apiKey = await getDecryptedApiKey(options.apiKeyId)
  if (!apiKey) throw new Error('API Key រកមិនឃើញ')

  const keyRecord = await db.apiKey.findUnique({
    where: { id: options.apiKeyId },
    include: { provider: true },
  })
  if (!keyRecord) throw new Error('API Key record រកមិនឃើញ')

  const provider = getProvider(keyRecord.provider.name, keyRecord.provider.baseUrl)

  let usage: TokenUsageSummary | undefined

  await provider.chatStream(
    {
      messages: options.messages,
      model: options.modelId,
      temperature: options.temperature,
      maxTokens: options.maxTokens,
      systemPrompt: buildSystemPrompt(),
    },
    apiKey,
    (chunk) => {
      if (chunk.type === 'done' && chunk.usage) usage = chunk.usage
      onChunk(chunk)
    }
  )

  if (usage) {
    await recordUsage(userId, options, usage, keyRecord.provider.name)
  }
}

// ===================== HELPERS =====================

function buildSystemPrompt(): string {
  return `អ្នកគឺជា AI Coding Assistant ដ៏ប៉ិនប្រសប់របស់ Khmer AI Coding Agent។
ជួយអ្នកប្រើប្រាស់ខ្មែរក្នុងការសរសេរ Debug Refactor និងពន្យល់ Code។
ឆ្លើយជាភាសាខ្មែរ លុះត្រាតែអ្នកប្រើសុំជាភាសាផ្សេង។
នៅពេលបង្ហាញ Code ត្រូវប្រើ Code Block ឱ្យបានត្រឹមត្រូវ។
Code ត្រូវ Clean, Secure, Typed, និង Maintainable។`
}

async function checkUsageLimits(userId: string): Promise<{ allowed: boolean; message?: string }> {
  const db = getPrismaClient()
  const limit = await db.usageLimit.findUnique({ where: { userId } })
  if (!limit) return { allowed: true }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)

  if (limit.dailyTokenLimit) {
    const daily = await db.tokenUsage.aggregate({
      where: { userId, createdAt: { gte: today } },
      _sum: { totalTokens: true },
    })
    if ((daily._sum.totalTokens ?? 0) >= limit.dailyTokenLimit) {
      return { allowed: false, message: 'ការប្រើប្រាស់ Token ប្រចាំថ្ងៃរបស់អ្នកបានដល់កំណត់។ សូមទាក់ទងអ្នកគ្រប់គ្រង' }
    }
  }

  if (limit.monthlyTokenLimit) {
    const monthly = await db.tokenUsage.aggregate({
      where: { userId, createdAt: { gte: monthStart } },
      _sum: { totalTokens: true },
    })
    if ((monthly._sum.totalTokens ?? 0) >= limit.monthlyTokenLimit) {
      return { allowed: false, message: 'ការប្រើប្រាស់ Token ប្រចាំខែរបស់អ្នកបានដល់កំណត់។ សូមទាក់ទងអ្នកគ្រប់គ្រង' }
    }
  }

  return { allowed: true }
}

async function recordUsage(
  userId: string,
  options: AiRequestOptions,
  usage: TokenUsageSummary,
  providerName: string
): Promise<void> {
  const db = getPrismaClient()
  await db.tokenUsage.create({
    data: {
      userId,
      apiKeyId: options.apiKeyId,
      projectId: options.projectId,
      modelId: options.modelId,
      provider: providerName,
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      totalTokens: usage.totalTokens,
      inputCost: usage.inputCost,
      outputCost: usage.outputCost,
      totalCost: usage.totalCost,
      isEstimated: usage.isEstimated,
    },
  })
}
