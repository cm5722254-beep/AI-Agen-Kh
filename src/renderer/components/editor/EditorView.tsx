import React, { useState, useCallback, useEffect, useRef } from 'react'
import Editor, { OnMount, OnChange } from '@monaco-editor/react'
import type * as Monaco from 'monaco-editor'
import { useAppState } from '../../store/appStore'
import { useApi } from '../../hooks/useApi'
import { useToast } from '../../hooks/useToast'
import { IPC_CHANNELS } from '../../../shared/constants'

// Map file extension → Monaco language ID
const EXT_LANG: Record<string, string> = {
  js: 'javascript', jsx: 'javascript',
  ts: 'typescript', tsx: 'typescript',
  py: 'python',
  html: 'html', htm: 'html',
  css: 'css', scss: 'scss', less: 'less',
  json: 'json', jsonc: 'json',
  md: 'markdown', mdx: 'markdown',
  sql: 'sql',
  rs: 'rust',
  go: 'go',
  java: 'java',
  cs: 'csharp',
  cpp: 'cpp', cc: 'cpp', cxx: 'cpp', c: 'c', h: 'c',
  php: 'php',
  rb: 'ruby',
  sh: 'shell', bash: 'shell', ps1: 'powershell',
  yml: 'yaml', yaml: 'yaml',
  xml: 'xml', svg: 'xml',
  toml: 'ini',
  env: 'ini',
  kt: 'kotlin',
  swift: 'swift',
}

interface Tab {
  path: string
  name: string
  content: string
  originalContent: string
  language: string
}

export default function EditorView() {
  const { state, dispatch } = useAppState()
  const { invoke } = useApi()
  const toast = useToast()

  const [tabs, setTabs] = useState<Tab[]>([])
  const [activeTab, setActiveTab] = useState<string | null>(null)
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null)
  const monacoRef  = useRef<typeof Monaco | null>(null)

  const currentTab = tabs.find(t => t.path === activeTab) ?? null
  const isDirty    = currentTab ? currentTab.content !== currentTab.originalContent : false

  // Open file when activeFilePath changes
  useEffect(() => {
    if (state.activeFilePath) openFile(state.activeFilePath)
  }, [state.activeFilePath])

  // Ctrl+S to save
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        if (currentTab && isDirty) saveFile(currentTab.path, currentTab.content)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [currentTab, isDirty])

  function getExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() ?? ''
  }

  async function openFile(filePath: string) {
    if (tabs.find(t => t.path === filePath)) {
      setActiveTab(filePath)
      return
    }
    const res = await invoke<string>(IPC_CHANNELS.FILES_READ, filePath)
    if (res.success && res.data !== undefined) {
      const name = filePath.split(/[/\\]/).pop() ?? filePath
      const ext  = getExtension(name)
      const newTab: Tab = {
        path: filePath,
        name,
        content: res.data,
        originalContent: res.data,
        language: EXT_LANG[ext] ?? 'plaintext',
      }
      setTabs(prev => [...prev, newTab])
      setActiveTab(filePath)
    } else {
      toast.error(`មិនអាចបើក: ${res.error}`)
    }
  }

  async function saveFile(path: string, content: string) {
    const res = await invoke(IPC_CHANNELS.FILES_WRITE, path, content)
    if (res.success) {
      setTabs(prev => prev.map(t =>
        t.path === path ? { ...t, originalContent: content } : t
      ))
      toast.success('💾 បានរក្សាទុក')
    } else {
      toast.error(`រក្សាទុកបរាជ័យ: ${res.error}`)
    }
  }

  function closeTab(path: string, e?: React.MouseEvent) {
    e?.stopPropagation()
    const tab = tabs.find(t => t.path === path)
    if (tab && tab.content !== tab.originalContent) {
      if (!confirm(`"${tab.name}" មានការផ្លាស់ប្តូរ។ បិទដោយមិនរក្សាទុក?`)) return
    }
    const remaining = tabs.filter(t => t.path !== path)
    setTabs(remaining)
    if (activeTab === path) {
      setActiveTab(remaining[remaining.length - 1]?.path ?? null)
    }
  }

  const handleEditorChange: OnChange = useCallback((value) => {
    if (!activeTab || value === undefined) return
    setTabs(prev => prev.map(t =>
      t.path === activeTab ? { ...t, content: value } : t
    ))
  }, [activeTab])

  const handleEditorMount: OnMount = useCallback((editor, monaco) => {
    editorRef.current  = editor
    monacoRef.current  = monaco

    // Add Khmer font fallback
    editor.updateOptions({
      fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", Consolas, monospace',
      fontSize: 13,
      lineHeight: 22,
      minimap: { enabled: true, scale: 1 },
      scrollBeyondLastLine: false,
      smoothScrolling: true,
      cursorBlinking: 'smooth',
      cursorSmoothCaretAnimation: 'on',
      renderWhitespace: 'selection',
      bracketPairColorization: { enabled: true },
      guides: { bracketPairs: true },
      wordWrap: 'off',
      tabSize: 2,
    })

    // Ctrl+S keybinding inside Monaco
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      const tab = tabs.find(t => t.path === activeTab)
      if (tab) saveFile(tab.path, editor.getValue())
    })

    // Ctrl+/ for toggle comment
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Slash, () => {
      editor.trigger('keyboard', 'editor.action.commentLine', null)
    })
  }, [tabs, activeTab])

  function formatDocument() {
    editorRef.current?.getAction('editor.action.formatDocument')?.run()
  }

  return (
    <div className="flex flex-col h-full bg-surface-900">
      {/* Tab bar */}
      <div className="flex bg-surface-800 border-b border-[#2a2a45] overflow-x-auto shrink-0 min-h-[36px]">
        {tabs.map(tab => {
          const dirty  = tab.content !== tab.originalContent
          const active = activeTab === tab.path
          return (
            <div
              key={tab.path}
              onClick={() => setActiveTab(tab.path)}
              className={[
                'flex items-center gap-1.5 px-3.5 py-1.5 border-r border-[#2a2a45]',
                'cursor-pointer text-xs whitespace-nowrap select-none shrink-0',
                'transition-colors duration-100',
                active
                  ? 'bg-surface-900 text-[#e8e8f0] border-b-2 border-b-primary-500'
                  : 'text-[#9090b0] hover:bg-surface-700 hover:text-[#e8e8f0]',
              ].join(' ')}
            >
              <span className="opacity-60 text-[10px]">
                {tab.language === 'typescript' ? '🔷' :
                 tab.language === 'python'     ? '🐍' :
                 tab.language === 'html'        ? '🌐' :
                 tab.language === 'css'         ? '🎨' : '📄'}
              </span>
              <span>{tab.name}</span>
              {dirty && <span className="text-amber-400 text-[14px] leading-none">●</span>}
              <button
                onClick={e => closeTab(tab.path, e)}
                className="opacity-0 hover:opacity-100 group-hover:opacity-100 ml-0.5 text-[#606080] hover:text-red-400 transition-opacity"
                style={{ opacity: active ? 0.6 : undefined }}
              >
                ×
              </button>
            </div>
          )
        })}

        {/* Toolbar right */}
        <div className="flex items-center gap-1 px-2 ml-auto shrink-0">
          {currentTab && (
            <>
              <button
                onClick={formatDocument}
                className="btn btn-ghost btn-sm text-[11px]"
                title="Format Document (Alt+Shift+F)"
              >
                ✨ Format
              </button>
              <button
                onClick={() => saveFile(currentTab.path, currentTab.content)}
                disabled={!isDirty}
                className="btn btn-primary btn-sm text-[11px]"
              >
                💾 Save
              </button>
            </>
          )}
        </div>
      </div>

      {/* Editor area */}
      <div className="flex-1 overflow-hidden">
        {!currentTab ? (
          <div className="empty-state h-full">
            <div className="empty-state-icon">💻</div>
            <h3 className="text-[#e8e8f0] font-semibold text-base">Monaco Code Editor</h3>
            <p className="text-sm">
              ជ្រើសឯកសារពី File Explorer<br />
              ឬ AI Agent ដើម្បីចាប់ផ្តើម Edit
            </p>
            <div className="flex flex-wrap gap-2 justify-center mt-2 text-[11px] text-[#606080]">
              <span>Ctrl+S → Save</span>
              <span>Ctrl+/ → Comment</span>
              <span>F1 → Command Palette</span>
            </div>
          </div>
        ) : (
          <Editor
            key={currentTab.path}
            language={currentTab.language}
            value={currentTab.content}
            theme="vs-dark"
            onChange={handleEditorChange}
            onMount={handleEditorMount}
            options={{
              automaticLayout: true,
              scrollBeyondLastLine: false,
              minimap: { enabled: true },
              fontSize: 13,
              tabSize: 2,
              wordWrap: 'off',
              lineNumbers: 'on',
              folding: true,
              bracketPairColorization: { enabled: true },
              renderWhitespace: 'selection',
              smoothScrolling: true,
              cursorBlinking: 'smooth',
              cursorSmoothCaretAnimation: 'on',
            }}
            loading={
              <div className="flex items-center justify-center h-full gap-3 text-[#9090b0]">
                <span className="spinner" />
                <span>Loading Monaco Editor...</span>
              </div>
            }
          />
        )}
      </div>

      {/* Status bar */}
      {currentTab && (
        <div className="flex items-center gap-4 px-3 py-1 bg-primary-600 text-white/80 text-[11px] shrink-0">
          <span>📄 {currentTab.name}</span>
          <span>🔤 {currentTab.language.toUpperCase()}</span>
          {isDirty && <span className="text-amber-300">● មិនទាន់រក្សាទុក</span>}
          <span className="ml-auto opacity-60">Monaco Editor — VS Code Engine</span>
        </div>
      )}
    </div>
  )
}
