import type { IpcMain, BrowserWindow } from 'electron'
import {
  chat, chatStream, listProviders, listApiKeys,
  addApiKey, deleteApiKey, listModels, testApiKey,
} from '../../core/ai/aiService'
import { agentService } from '../../core/agent/agentService'
import { IPC_CHANNELS } from '../../shared/constants'
import type { IpcResponse, AiRequestOptions, AddApiKeyRequest, AgentToolCall } from '../../shared/types'
import { logger } from '../../core/logging/logger'
import { v4 as uuid } from 'uuid'

export function registerAiHandlers(ipcMain: IpcMain, getWindow: () => BrowserWindow | null): void {
  // Provider list
  ipcMain.handle(IPC_CHANNELS.PROVIDER_LIST, async (): Promise<IpcResponse> => {
    try {
      const providers = await listProviders()
      return { success: true, data: providers }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })

  // Model list
  ipcMain.handle(IPC_CHANNELS.MODEL_LIST, async (_e, providerId: string): Promise<IpcResponse> => {
    try {
      const models = await listModels(providerId)
      return { success: true, data: models }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })

  // API Keys
  ipcMain.handle(IPC_CHANNELS.APIKEY_LIST, async (): Promise<IpcResponse> => {
    try {
      const keys = await listApiKeys()
      return { success: true, data: keys }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle(IPC_CHANNELS.APIKEY_ADD, async (_e, req: AddApiKeyRequest): Promise<IpcResponse> => {
    try {
      const result = await addApiKey(req)
      return { success: result.success, data: { id: result.id }, error: result.message }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle(IPC_CHANNELS.APIKEY_DELETE, async (_e, keyId: string): Promise<IpcResponse> => {
    try {
      await deleteApiKey(keyId)
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })

  // Test API key connection
  ipcMain.handle('apikey:test', async (_e, keyId: string): Promise<IpcResponse> => {
    try {
      const result = await testApiKey(keyId)
      return { success: result.success, data: result, error: result.success ? undefined : result.message }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })

  // Streaming chat — pushes chunks via event
  ipcMain.handle(IPC_CHANNELS.AI_CHAT_STREAM, async (_e, options: AiRequestOptions, userId: string): Promise<IpcResponse> => {
    const win = getWindow()
    if (!win) return { success: false, error: 'Window not available' }

    const streamId = uuid()

    // Run async, return stream ID immediately
    setImmediate(async () => {
      try {
        await chatStream(options, userId, (chunk) => {
          win.webContents.send(`ai:stream:${streamId}`, chunk)
        })
      } catch (err: any) {
        win.webContents.send(`ai:stream:${streamId}`, { type: 'error', error: err.message })
      }
    })

    return { success: true, data: { streamId } }
  })

  // Non-streaming chat
  ipcMain.handle(IPC_CHANNELS.AI_CHAT, async (_e, options: AiRequestOptions, userId: string): Promise<IpcResponse> => {
    try {
      const result = await chat(options, userId)
      return { success: true, data: result }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })

  // Stop generation
  ipcMain.handle(IPC_CHANNELS.AI_STOP, async (): Promise<void> => {
    agentService.stop()
  })

  // Agent run with streaming + tool calls
  ipcMain.handle(IPC_CHANNELS.AGENT_RUN, async (
    _e,
    options: { userMessage: string; projectPath?: string; conversationHistory: any[]; apiKeyId: string; modelId: string; userId: string }
  ): Promise<IpcResponse> => {
    const win = getWindow()
    if (!win) return { success: false, error: 'Window not available' }

    const streamId = uuid()

    // Pending tool confirmations
    const pendingConfirmations = new Map<string, (approved: boolean) => void>()

    ipcMain.once(`${IPC_CHANNELS.AGENT_APPROVE_TOOL}:${streamId}`, (_e, toolId: string) => {
      pendingConfirmations.get(toolId)?.(true)
    })
    ipcMain.once(`${IPC_CHANNELS.AGENT_DENY_TOOL}:${streamId}`, (_e, toolId: string) => {
      pendingConfirmations.get(toolId)?.(false)
    })

    setImmediate(async () => {
      try {
        await agentService.run({
          ...options,
          onStatus: (phase, message) => {
            win.webContents.send(`agent:status:${streamId}`, { phase, message })
          },
          onChunk: (chunk) => {
            win.webContents.send(`ai:stream:${streamId}`, chunk)
          },
          onToolCall: (tool) => {
            win.webContents.send(`agent:tool:${streamId}`, tool)
          },
          onToolResult: (toolId, result) => {
            win.webContents.send(`agent:toolResult:${streamId}`, { toolId, result })
          },
          requestConfirmation: (tool: AgentToolCall) => {
            return new Promise((resolve) => {
              pendingConfirmations.set(tool.id, resolve)
              win.webContents.send(`agent:confirmTool:${streamId}`, tool)
            })
          },
        })
      } catch (err: any) {
        win.webContents.send(`ai:stream:${streamId}`, { type: 'error', error: err.message })
      }
    })

    return { success: true, data: { streamId } }
  })
}
