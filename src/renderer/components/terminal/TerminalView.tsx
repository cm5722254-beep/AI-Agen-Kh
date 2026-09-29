import React, { useEffect, useRef, useState } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'
import { useApi } from '../../hooks/useApi'
import { useToast } from '../../hooks/useToast'
import { IPC_CHANNELS } from '../../../shared/constants'
import { v4 as uuid } from 'uuid'

export default function TerminalView() {
  const { invoke } = useApi()
  const toast = useToast()
  const [terminalId] = useState(() => uuid())
  const [ready, setReady]   = useState(false)
  const termRef  = useRef<HTMLDivElement>(null)
  const xtermRef = useRef<Terminal | null>(null)
  const fitRef   = useRef<FitAddon | null>(null)

  useEffect(() => {
    initTerminal()
    return () => {
      if (xtermRef.current) { xtermRef.current.dispose(); invoke(IPC_CHANNELS.TERMINAL_KILL, terminalId) }
      window.electronAPI.removeAllListeners(`${IPC_CHANNELS.TERMINAL_DATA}:${terminalId}`)
      window.electronAPI.removeAllListeners(`terminal:exit:${terminalId}`)
    }
  }, [])

  async function initTerminal() {
    try {
      const xterm = new Terminal({
        theme: {
          background:  '#0f0f1a',
          foreground:  '#e8e8f0',
          cursor:      '#7c6af7',
          black:       '#0f0f1a',
          red:         '#ef4444',
          green:       '#22c55e',
          yellow:      '#f59e0b',
          blue:        '#3b82f6',
          magenta:     '#a855f7',
          cyan:        '#06b6d4',
          white:       '#e8e8f0',
          brightBlack: '#404070',
        },
        fontFamily: '"JetBrains Mono", "Cascadia Code", Consolas, monospace',
        fontSize:   13,
        lineHeight: 1.5,
        cursorBlink: true,
        allowTransparency: true,
        scrollback: 2000,
      })
      const fitAddon = new FitAddon()
      xterm.loadAddon(fitAddon)

      if (termRef.current) {
        xterm.open(termRef.current)
        fitAddon.fit()
        xtermRef.current = xterm
        fitRef.current   = fitAddon

        const res = await invoke(IPC_CHANNELS.TERMINAL_CREATE, terminalId)
        if (!res.success) {
          xterm.writeln('\r\n\x1b[31m[ERROR] ' + res.error + '\x1b[0m')
          return
        }
        setReady(true)
        xterm.writeln('\x1b[32m🇰🇭 Khmer AI Coding Agent Terminal\x1b[0m')
        xterm.writeln('\x1b[90mReady — type commands below\x1b[0m\r\n')

        window.electronAPI.on(`${IPC_CHANNELS.TERMINAL_DATA}:${terminalId}`, (data: any) => xterm.write(data))
        xterm.onData(data => window.electronAPI.send(IPC_CHANNELS.TERMINAL_INPUT, terminalId, data))
        xterm.onResize(({ cols, rows }) => invoke(IPC_CHANNELS.TERMINAL_RESIZE, terminalId, cols, rows))

        const ro = new ResizeObserver(() => fitAddon.fit())
        if (termRef.current) ro.observe(termRef.current)
      }
    } catch (err: any) {
      toast.error(`Terminal Error: ${err.message}`)
    }
  }

  return (
    <div className="flex flex-col h-full bg-surface-900">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-800 border-b border-[#2a2a45] shrink-0">
        <span className="text-[13px] font-medium text-[#9090b0]">🖥️ ស្ថានីយ</span>
        <div className={`w-2 h-2 rounded-full ${ready ? 'bg-green-400' : 'bg-[#606080]'}`} />
        <span className="text-[11px] text-[#606080]">{ready ? 'ដំណើរការ' : 'កំពុងចាប់ផ្តើម...'}</span>
        <div className="flex-1" />
        <button
          className="btn btn-ghost btn-sm text-[12px]"
          onClick={() => navigator.clipboard.writeText(xtermRef.current?.getSelection() ?? '')}
          title="Copy selection"
        >📋</button>
        <button
          className="btn btn-ghost btn-sm text-[12px]"
          onClick={() => xtermRef.current?.clear()}
          title="Clear"
        >🗑️</button>
        <button
          className="btn btn-ghost btn-sm text-[12px]"
          onClick={() => { xtermRef.current?.dispose(); setReady(false); initTerminal() }}
          title="Restart"
        >🔄</button>
      </div>
      <div ref={termRef} className="flex-1 overflow-hidden" />
    </div>
  )
}
