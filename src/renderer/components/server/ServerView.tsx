import React, { useEffect, useState } from 'react'
import { useApi } from '../../hooks/useApi'
import { useToast } from '../../hooks/useToast'
import { useAppState } from '../../store/appStore'
import { IPC_CHANNELS } from '../../../shared/constants'
import type { ServerProcessInfo } from '../../../shared/types'

export default function ServerView() {
  const { state } = useAppState()
  const { invoke } = useApi()
  const toast = useToast()
  const [servers, setServers] = useState<ServerProcessInfo[]>([])
  const [loading, setLoading] = useState(false)
  const [showStart, setShowStart] = useState(false)
  const [serverLogs, setServerLogs] = useState<Record<string, string[]>>({})

  // New server form
  const [name, setName] = useState('')
  const [command, setCommand] = useState('')
  const [port, setPort] = useState('')

  useEffect(() => {
    loadServers()
    const interval = setInterval(loadServers, 5000)
    return () => clearInterval(interval)
  }, [])

  async function loadServers() {
    const res = await invoke<ServerProcessInfo[]>(IPC_CHANNELS.SERVER_LIST)
    if (res.success && res.data) setServers(res.data)
  }

  async function handleStart(e: React.FormEvent) {
    e.preventDefault()
    if (!command.trim()) return

    const activeProject = state.projects.find(p => p.id === state.activeProjectId)
    setLoading(true)
    const res = await invoke(IPC_CHANNELS.SERVER_START, {
      name: name || command,
      command,
      port: port ? parseInt(port) : undefined,
      cwd: activeProject?.path,
      projectId: activeProject?.id,
    })
    setLoading(false)

    if (res.success) {
      toast.success('ចាប់ផ្តើម Server ជោគជ័យ')
      setShowStart(false)
      setName(''); setCommand(''); setPort('')
      loadServers()

      // Listen to logs
      const serverId = (res.data as any).id
      window.electronAPI.on(`server:log:${serverId}`, (text: any) => {
        setServerLogs(prev => ({
          ...prev,
          [serverId]: [...(prev[serverId] ?? []).slice(-200), text],
        }))
      })
    } else {
      toast.error(res.error ?? 'ចាប់ផ្តើម Server បរាជ័យ')
    }
  }

  async function handleStop(serverId: string) {
    const res = await invoke(IPC_CHANNELS.SERVER_STOP, serverId)
    if (res.success) {
      toast.success('Server ឈប់ហើយ')
      loadServers()
    } else {
      toast.error(res.error ?? 'ឈប់ Server បរាជ័យ')
    }
  }

  function openInBrowser(url: string) {
    window.electronAPI.invoke('system:openExternal', url)
  }

  const [selectedServer, setSelectedServer] = useState<string | null>(null)

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>🌐 ម៉ាស៊ីនមេ</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
            គ្រប់គ្រង Local Development Server
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowStart(!showStart)}>
          ➕ ចាប់ផ្តើម Server ថ្មី
        </button>
      </div>

      {/* Start server form */}
      {showStart && (
        <div className="card" style={{ marginBottom: 20, padding: 20 }}>
          <h3 style={{ marginBottom: 16, fontSize: 15 }}>🚀 Server ថ្មី</h3>
          <form onSubmit={handleStart} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 120px', gap: 12 }}>
            <input className="input" placeholder="ឈ្មោះ (ស្រេចចិត្ត)" value={name} onChange={e => setName(e.target.value)} />
            <input className="input" placeholder="Command: npm run dev" value={command} onChange={e => setCommand(e.target.value)} required />
            <input className="input" placeholder="Port: 3000" value={port} onChange={e => setPort(e.target.value)} type="number" />
            <div style={{ gridColumn: '1/-1', display: 'flex', gap: 8 }}>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? <span className="spinner" /> : '▶️ ចាប់ផ្តើម'}
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setShowStart(false)}>បោះបង់</button>
            </div>
          </form>

          {/* Quick commands */}
          <div style={{ marginTop: 12 }}>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>Quick Start:</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[
                { label: 'npm run dev', cmd: 'npm run dev', port: '5173' },
                { label: 'npm start', cmd: 'npm start', port: '3000' },
                { label: 'python manage.py runserver', cmd: 'python manage.py runserver', port: '8000' },
                { label: 'uvicorn main:app', cmd: 'uvicorn main:app --reload', port: '8000' },
              ].map(q => (
                <button key={q.cmd} className="btn btn-secondary btn-sm"
                  onClick={() => { setCommand(q.cmd); setPort(q.port) }}>
                  {q.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Servers list */}
      {servers.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🌐</div>
          <h3>គ្មាន Server</h3>
          <p>ចុច "ចាប់ផ្តើម Server ថ្មី" ដើម្បីបើក Development Server</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {servers.map(server => (
            <div key={server.id} className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {/* Status indicator */}
                <div style={{
                  width: 10, height: 10, borderRadius: '50%',
                  background: server.status === 'RUNNING' ? 'var(--success)' :
                               server.status === 'ERROR' ? 'var(--error)' : 'var(--text-muted)',
                  flexShrink: 0,
                  boxShadow: server.status === 'RUNNING' ? '0 0 6px var(--success)' : 'none',
                }} />

                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{server.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {server.command}
                  </div>
                </div>

                {/* Info */}
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                  {server.port && (
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Port</div>
                      <div style={{ fontWeight: 600 }}>{server.port}</div>
                    </div>
                  )}
                  {server.pid && (
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>PID</div>
                      <div style={{ fontSize: 12 }}>{server.pid}</div>
                    </div>
                  )}
                  <span className={`badge ${server.status === 'RUNNING' ? 'badge-success' : server.status === 'ERROR' ? 'badge-error' : 'badge-warning'}`}>
                    {server.status === 'RUNNING' ? 'ដំណើរការ' : server.status === 'ERROR' ? 'Error' : 'ឈប់'}
                  </span>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8 }}>
                  {server.url && server.status === 'RUNNING' && (
                    <button className="btn btn-secondary btn-sm" onClick={() => openInBrowser(server.url!)}>
                      🌐 Browser
                    </button>
                  )}
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => setSelectedServer(selectedServer === server.id ? null : server.id)}
                  >
                    📋 Logs
                  </button>
                  {server.status === 'RUNNING' ? (
                    <button className="btn btn-danger btn-sm" onClick={() => handleStop(server.id)}>
                      ⏹️ បញ្ឈប់
                    </button>
                  ) : null}
                </div>
              </div>

              {/* Logs panel */}
              {selectedServer === server.id && (
                <div style={{
                  marginTop: 12,
                  background: 'var(--bg-secondary)',
                  borderRadius: 8, padding: 12,
                  fontFamily: 'var(--font-mono)', fontSize: 11,
                  maxHeight: 200, overflow: 'auto',
                  whiteSpace: 'pre-wrap',
                }}>
                  {(serverLogs[server.id] ?? []).length === 0 ? (
                    <span style={{ color: 'var(--text-muted)' }}>គ្មាន Log</span>
                  ) : (
                    serverLogs[server.id].join('')
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
