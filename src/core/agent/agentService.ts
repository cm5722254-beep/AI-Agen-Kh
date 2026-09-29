/**
 * AI Agent Service — True Agent Loop
 * Planning → Inspect Files → Generate Plan → Modify Files → Run Commands → Verify
 */
import { v4 as uuid } from 'uuid'
import { chatStream } from '../ai/aiService'
import { readFile, writeFile, editFile, deleteFile, createFolder, listFiles, searchCode } from './tools/fileTools'
import { logger } from '../logging/logger'
import { DANGEROUS_COMMANDS } from '../../shared/constants'
import type { AgentToolCall, AgentToolName, ChatMessage, AiStreamChunk } from '../../shared/types'

export interface AgentRunOptions {
  userMessage: string
  projectPath?: string
  conversationHistory: ChatMessage[]
  apiKeyId: string
  modelId: string
  userId: string
  onStatus: (phase: string, message: string) => void
  onChunk: (chunk: AiStreamChunk) => void
  onToolCall: (tool: AgentToolCall) => void
  onToolResult: (toolId: string, result: unknown) => void
  requestConfirmation: (tool: AgentToolCall) => Promise<boolean>
}

const AGENT_SYSTEM_PROMPT = `អ្នកគឺជា AI Coding Agent ដ៏ប៉ិនប្រសប់។ អ្នកមានសមត្ថភាព:
1. អានឯកសារ (read_file)
2. សរសេរឯកសារ (write_file)  
3. កែឯកសារ (edit_file)
4. លុបឯកសារ (delete_file)
5. បង្កើត Folder (create_folder)
6. មើលឯកសារ (list_files)
7. ស្វែងរក Code (search_code)
8. ដំណើរការ Command (run_command)

នៅពេលត្រូវការប្រើ Tool ត្រូវ Output JSON ក្នុង format:
<tool_call>
{"tool": "tool_name", "args": {...}}
</tool_call>

Agent Loop:
1. វិភាគ Request
2. Inspect Project Files
3. Generate Plan  
4. Execute Plan (ប្រើ Tools)
5. Verify Result
6. Final Response ជាភាសាខ្មែរ

ឆ្លើយជាភាសាខ្មែរ ហើយ Code ត្រូវ Clean និង Production-ready។`

export class AgentService {
  private abortController: AbortController | null = null

  stop() {
    this.abortController?.abort()
  }

  async run(options: AgentRunOptions): Promise<void> {
    this.abortController = new AbortController()
    const signal = this.abortController.signal

    options.onStatus('planning', 'កំពុងវិភាគ Request...')

    // Build initial context
    let projectContext = ''
    if (options.projectPath) {
      try {
        options.onStatus('inspecting', 'កំពុងអានរចនាសម្ព័ន្ធ Project...')
        const files = listFiles(options.projectPath, false)
        const fileList = files.map(f =>
          f.type === 'directory' ? `📁 ${f.name}/` : `📄 ${f.name}`
        ).join('\n')
        projectContext = `\nProject Files:\n${fileList}\n`
      } catch {
        projectContext = ''
      }
    }

    const systemWithContext = AGENT_SYSTEM_PROMPT +
      (projectContext ? `\n\nProject Context:\n${projectContext}` : '')

    const messages: ChatMessage[] = [
      ...options.conversationHistory,
      {
        id: uuid(),
        role: 'user',
        content: options.userMessage,
        timestamp: new Date().toISOString(),
      },
    ]

    options.onStatus('generating', 'កំពុងបង្កើត Plan...')

    let fullResponse = ''

    await chatStream(
      {
        apiKeyId: options.apiKeyId,
        modelId: options.modelId,
        messages,
        temperature: 0.3,
        maxTokens: 8192,
      },
      options.userId,
      async (chunk) => {
        if (signal.aborted) return

        if (chunk.type === 'delta' && chunk.content) {
          fullResponse += chunk.content
          options.onChunk(chunk)

          // Check for tool calls in the accumulated response
          await this.processToolCalls(fullResponse, options, signal)
        } else if (chunk.type === 'done') {
          options.onStatus('done', 'រួចរាល់')
          options.onChunk(chunk)
        } else if (chunk.type === 'error') {
          options.onStatus('error', `កំហុស: ${chunk.error}`)
          options.onChunk(chunk)
        }
      }
    )
  }

  private toolCallsProcessed = new Set<string>()

  private async processToolCalls(
    response: string,
    options: AgentRunOptions,
    signal: AbortSignal
  ): Promise<void> {
    const toolCallRegex = /<tool_call>([\s\S]*?)<\/tool_call>/g
    let match

    while ((match = toolCallRegex.exec(response)) !== null) {
      if (signal.aborted) break

      const callContent = match[1].trim()
      const callKey = callContent.substring(0, 100)
      if (this.toolCallsProcessed.has(callKey)) continue
      this.toolCallsProcessed.add(callKey)

      try {
        const parsed = JSON.parse(callContent)
        const toolName = parsed.tool as AgentToolName
        const args = parsed.args ?? {}

        const requiresConfirmation = this.isRiskyTool(toolName, args)

        const toolCall: AgentToolCall = {
          id: uuid(),
          tool: toolName,
          args,
          requiresConfirmation,
          status: requiresConfirmation ? 'pending' : 'running',
        }

        options.onToolCall(toolCall)

        if (requiresConfirmation) {
          options.onStatus('waiting', `រង់ចាំការអនុញ្ញាត: ${toolName}`)
          const approved = await options.requestConfirmation(toolCall)
          if (!approved) {
            options.onToolResult(toolCall.id, { denied: true, message: 'អ្នកប្រើបានបដិសេធ' })
            continue
          }
        }

        options.onStatus('executing', `កំពុងដំណើរការ: ${toolName}`)
        const result = await this.executeTool(toolName, args, options)
        options.onToolResult(toolCall.id, result)

      } catch (err: any) {
        logger.error(`Agent tool parse error: ${err.message}`)
      }
    }
  }

  private isRiskyTool(tool: AgentToolName, args: Record<string, unknown>): boolean {
    const riskyTools: AgentToolName[] = ['delete_file', 'run_command']
    if (riskyTools.includes(tool)) return true

    if (tool === 'run_command') {
      const cmd = String(args.command ?? '').toLowerCase()
      return DANGEROUS_COMMANDS.some(d => cmd.includes(d.toLowerCase()))
    }

    return false
  }

  private async executeTool(
    tool: AgentToolName,
    args: Record<string, unknown>,
    options: AgentRunOptions
  ): Promise<unknown> {
    try {
      switch (tool) {
        case 'read_file':
          return { content: readFile(String(args.path)) }

        case 'write_file':
          writeFile(String(args.path), String(args.content))
          return { success: true, path: args.path }

        case 'edit_file':
          editFile(String(args.path), String(args.old_content), String(args.new_content))
          return { success: true }

        case 'delete_file':
          deleteFile(String(args.path))
          return { success: true }

        case 'create_folder':
          createFolder(String(args.path))
          return { success: true }

        case 'list_files':
          return listFiles(String(args.path ?? options.projectPath ?? '.'), Boolean(args.recursive))

        case 'search_code':
          return searchCode(
            String(args.path ?? options.projectPath ?? '.'),
            String(args.query),
            args.extensions as string[] | undefined
          )

        default:
          return { error: `Tool "${tool}" មិនទាន់ Implement នៅឡើយ` }
      }
    } catch (err: any) {
      logger.error(`Tool execution error [${tool}]: ${err.message}`)
      return { error: err.message }
    }
  }
}

export const agentService = new AgentService()
