import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useAppState } from '../../store/appStore'
import { useApi } from '../../hooks/useApi'
import { useToast } from '../../hooks/useToast'
import { IPC_CHANNELS } from '../../../shared/constants'
import { v4 as uuid } from 'uuid'
import type { ChatMessage, AgentToolCall } from '../../../shared/types'

// ---- Markdown renderer (lightweight, no extra dep) ----
function renderContent(text: string): React.ReactNode {
  const parts = text.split(/(```[\s\S]*?```)/g)
  return parts.map((part, i) => {
    if (part.startsWith('```')) {
      const lines = part.split('\n')
      const lang  = lines[0].replace('```', '').trim()
      const code  = lines.slice(1, -1).join('\n')
      return (
        <div key={i} className="my-2 rounded-lg overflow-hidden border border-[#2a2a45]">
          {lang && (
            <div className="flex items-center justify-between bg-surface-700 px-3 py-1.5
                            text-[11px] text-primary-400">
              <span>{lang}</span>
              <button
                onClick={() => navigator.clipboard.writeText(code)}
                className="text-[#9090b0] hover:text-[#e8e8f0] bg-transparent border-none
                           cursor-pointer transition-colors text-[11px]"
              >
                📋 Copy
              </button>
            </div>
          )}
          <pre className="bg-surface-900 p-3 m-0 overflow-x-auto text-[12px] font-mono text-[#e8e8f0]">
            <code>{code}</code>
          </pre>
        </div>
      )
    }
    return <span key={i} className="whitespace-pre-wrap break-words">{part}</span>
  })
}

// ---- Tool confirmation dialog ----
function ToolConfirm({ tool, onApprove, onDeny }: {
  tool: AgentToolCall
  onApprove: () => void
  onDeny: () => void
}) {
  return (
    <div className="border border-amber-500/50 bg-amber-500/10 rounded-xl p-4 my-2">
      <div className="flex items-center gap-2 mb-3 text-amber-400 font-medium text-[13px]">
        <span>⚠️</span>
        <span>AI ចង់ដំណើរការ Tool:</span>
      </div>
      <pre className="bg-surface-900 rounded-lg p-3 text-[11px] font-mono text-[#e8e8f0] overflow-x-auto mb-3">
        {tool.tool}: {JSON.stringify(tool.args, null, 2)}
      </pre>
      <div className="flex gap-2">
        <button className="btn btn-primary btn-sm" onClick={onApprove}>✅ អនុញ្ញាត</button>
        <button className="btn btn-danger btn-sm"  onClick={onDeny}>❌ បដិសេធ</button>
      </div>
    </div>
  )
}

export default function AgentView() {
  const { state } = useAppState()
  const { invoke } = useApi()
  const toast = useToast()

  const [messages, setMessages]       = useState<Array<ChatMessage & { streaming?: boolean }>>([])
  const [input, setInput]             = useState('')
  const [isRunning, setIsRunning]     = useState(false)
  const [agentStatus, setAgentStatus] = useState('')
  const [pendingTools, setPendingTools] = useState<AgentToolCall[]>([])
  const [streamId, setStreamId]       = useState<string | null>(null)
  const [apiKeyId, setApiKeyId]       = useState('')
  const [modelId,  setModelId]        = useState('')
  const [apiKeys,  setApiKeys]        = useState<any[]>([])
  const [models,   setModels]         = useState<any[]>([])

  const bottomRef  = useRef<HTMLDivElement>(null)
  const inputRef   = useRef<HTMLTextAreaElement>(null)

  useEffect(() => { loadConfig() }, [])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function loadConfig() {
    const [keyRes, provRes] = await Promise.all([
      invoke(IPC_CHANNELS.APIKEY_LIST),
      invoke(IPC_CHANNELS.PROVIDER_LIST),
    ])
    const keys = (keyRes.data as any[]) ?? []
    setApiKeys(keys)
    const defaultKey = keys.find((k: any) => k.isDefault) ?? keys[0]
    if (defaultKey) {
      setApiKeyId(defaultKey.id)
      const modRes = await invoke(IPC_CHANNELS.MODEL_LIST, defaultKey.providerId)
      const mods = (modRes.data as any[]) ?? []
      setModels(mods)
      if (mods.length > 0) setModelId(mods[0].modelId)
    }
  }

  async function handleSend() {
    if (!input.trim() || isRunning) return
    if (!apiKeyId || !modelId) { toast.error('សូមកំណត់ API Key និង Model ជាមុន'); return }

    const userMsg: ChatMessage = {
      id: uuid(), role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    }
    setMessages(prev => [...prev, userMsg])
    const userInput = input.trim()
    setInput('')
    setIsRunning(true)
    setAgentStatus('កំពុងវិភាគ...')

    const assistantId = uuid()
    setMessages(prev => [...prev, {
      id: assistantId, role: 'assistant', content: '',
      timestamp: new Date().toISOString(), streaming: true,
    }])

    try {
      const activeProject = state.projects.find(p => p.id === state.activeProjectId)
      const res = await invoke(IPC_CHANNELS.AGENT_RUN, {
        userMessage: userInput,
        projectPath: activeProject?.path,
        conversationHistory: messages,
        apiKeyId, modelId,
        userId: state.user!.id,
      })

      if (!res.success) { toast.error(res.error ?? 'Agent Error'); setIsRunning(false); setAgentStatus(''); return }

      const sid = (res.data as any).streamId
      setStreamId(sid)

      const unsubStream = window.electronAPI.on(`ai:stream:${sid}`, (chunk: any) => {
        if (chunk.type === 'delta' && chunk.content) {
          setMessages(prev => prev.map(m => m.id === assistantId
            ? { ...m, content: m.content + chunk.content } : m))
        } else if (chunk.type === 'done') {
          setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, streaming: false } : m))
          setIsRunning(false); setAgentStatus('')
          unsubStream(); unsubStatus()
        } else if (chunk.type === 'error') {
          toast.error(chunk.error ?? 'Stream Error')
          setIsRunning(false); setAgentStatus('')
          unsubStream(); unsubStatus()
        }
      })
      const unsubStatus = window.electronAPI.on(`agent:status:${sid}`, (d: any) => setAgentStatus(d.message))
      window.electronAPI.on(`agent:confirmTool:${sid}`, (tool: any) => setPendingTools(prev => [...prev, tool]))
    } catch (err: any) {
      toast.error(err.message); setIsRunning(false); setAgentStatus('')
    }
  }

  function approveToolCall(toolId: string) {
    if (streamId) window.electronAPI.send(`${IPC_CHANNELS.AGENT_APPROVE_TOOL}:${streamId}`, toolId)
    setPendingTools(prev => prev.filter(t => t.id !== toolId))
  }
  function denyToolCall(toolId: string) {
    if (streamId) window.electronAPI.send(`${IPC_CHANNELS.AGENT_DENY_TOOL}:${streamId}`, toolId)
    setPendingTools(prev => prev.filter(t => t.id !== toolId))
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const selects = 'bg-surface-600 border border-[#2a2a45] rounded-md px-2 py-1 text-[#e8e8f0] text-[12px] font-khmer outline-none'

  return (
    <div className="flex flex-col h-full">
      {/* Config bar */}
      <div className="flex items-center gap-3 px-4 py-2 bg-surface-800 border-b border-[#2a2a45] shrink-0 flex-wrap">
        <span className="text-[12px] text-[#606080]">API Key:</span>
        <select className={selects} value={apiKeyId}
          onChange={async e => {
            setApiKeyId(e.target.value)
            const k = apiKeys.find((k: any) => k.id === e.target.value)
            if (k) {
              const modRes = await invoke(IPC_CHANNELS.MODEL_LIST, k.providerId)
              const mods = (modRes.data as any[]) ?? []
              setModels(mods)
              if (mods.length > 0) setModelId(mods[0].modelId)
            }
          }}>
          <option value="">-- ជ្រើស --</option>
          {apiKeys.map((k: any) => <option key={k.id} value={k.id}>{k.name} ({k.keyHint})</option>)}
        </select>

        <span className="text-[12px] text-[#606080]">Model:</span>
        <select className={`${selects} max-w-[240px]`} value={modelId} onChange={e => setModelId(e.target.value)}>
          <option value="">-- ជ្រើស --</option>
          {models.map((m: any) => <option key={m.modelId} value={m.modelId}>{m.displayName}</option>)}
        </select>

        {apiKeys.length === 0 && (
          <span className="text-[12px] text-amber-400">⚠️ សូមបន្ថែម API Key ជាមុន</span>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {messages.length === 0 && (
          <div className="empty-state h-full">
            <div className="empty-state-icon">🤖</div>
            <h3 className="text-[#e8e8f0] font-semibold text-base">AI Coding Agent</h3>
            <p className="text-sm">
              សរសេរ Request ហើយ AI នឹងជួយ Code, Debug, Build Project
            </p>
            <div className="flex flex-wrap gap-2 justify-center mt-2">
              {['បង្កើត React App', 'Debug Code', 'Explain Code', 'Build REST API'].map(s => (
                <button key={s} className="btn btn-secondary btn-sm" onClick={() => setInput(s)}>{s}</button>
              ))}
            </div>
          </div>
        )}

        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={[
              'max-w-[85%] rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed',
              msg.role === 'user'
                ? 'bg-primary-500 text-white rounded-br-md'
                : 'bg-surface-600 border border-[#2a2a45] rounded-bl-md',
            ].join(' ')}>
              {msg.role === 'assistant' && (
                <div className="flex items-center gap-1.5 mb-1.5 text-[11px] text-[#606080]">
                  <span>🤖</span>
                  <span>AI Agent</span>
                  {msg.streaming && <span className="spinner !w-3 !h-3" />}
                </div>
              )}
              <div>{renderContent(msg.content)}</div>
            </div>
          </div>
        ))}

        {pendingTools.map(t => (
          <ToolConfirm key={t.id} tool={t}
            onApprove={() => approveToolCall(t.id)}
            onDeny={() => denyToolCall(t.id)} />
        ))}

        <div ref={bottomRef} />
      </div>

      {/* Status */}
      {agentStatus && (
        <div className="flex items-center gap-2 px-4 py-1.5 bg-surface-700
                        border-t border-[#2a2a45] text-[12px] text-primary-400 shrink-0">
          <span className="spinner !w-3 !h-3" />
          <span>{agentStatus}</span>
        </div>
      )}

      {/* Input */}
      <div className="bg-surface-800 border-t border-[#2a2a45] p-4 shrink-0">
        <div className="flex gap-3 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isRunning}
            rows={3}
            placeholder="ប្រាប់ AI ចង់ធ្វើអ្វី... (Enter ផ្ញើ | Shift+Enter ចុះបន្ទាត់)"
            className={[
              'flex-1 bg-surface-600 border border-[#2a2a45] rounded-xl text-[#e8e8f0]',
              'font-khmer text-[13px] px-4 py-2.5 resize-none outline-none leading-relaxed',
              'transition-colors focus:border-primary-500 placeholder:text-[#606080]',
            ].join(' ')}
          />
          <div className="flex flex-col gap-2">
            {isRunning ? (
              <button className="btn btn-danger" onClick={() => invoke(IPC_CHANNELS.AI_STOP).then(() => { setIsRunning(false); setAgentStatus('') })}>
                ⏹️ Stop
              </button>
            ) : (
              <button
                className="btn btn-primary"
                onClick={handleSend}
                disabled={!input.trim() || !apiKeyId || !modelId}
              >
                📨 ផ្ញើ
              </button>
            )}
            <button
              className="btn btn-ghost btn-sm justify-center"
              onClick={() => setMessages([])}
              disabled={isRunning}
              title="Clear"
            >
              🗑️
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
