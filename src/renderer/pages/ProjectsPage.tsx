import React, { useEffect, useState } from 'react'
import { useAppState } from '../store/appStore'
import { useApi } from '../hooks/useApi'
import { useToast } from '../hooks/useToast'
import { IPC_CHANNELS } from '../../shared/constants'
import type { ProjectInfo } from '../../shared/types'

export default function ProjectsPage() {
  const { state, dispatch } = useAppState()
  const { invoke } = useApi()
  const toast = useToast()
  const [loading, setLoading] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    loadProjects()
  }, [])

  async function loadProjects() {
    if (!state.user) return
    setLoading(true)
    const res = await invoke(IPC_CHANNELS.PROJECTS_LIST, state.user.id)
    if (res.success && res.data) dispatch({ type: 'SET_PROJECTS', payload: res.data as ProjectInfo[] })
    setLoading(false)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!state.user || !newName.trim()) return
    setCreating(true)
    const res = await invoke(IPC_CHANNELS.PROJECTS_CREATE, state.user.id, {
      name: newName.trim(),
      description: newDesc.trim(),
    })
    if (res.success && res.data) {
      dispatch({ type: 'ADD_PROJECT', payload: res.data as ProjectInfo })
      toast.success(`បានបង្កើត: ${newName}`)
      setShowCreate(false)
      setNewName(''); setNewDesc('')
    } else {
      toast.error(res.error ?? 'បង្កើត Project បរាជ័យ')
    }
    setCreating(false)
  }

  async function handleOpenFolder() {
    const res = await invoke(IPC_CHANNELS.PROJECTS_OPEN_DIALOG)
    if (res.success && res.data) {
      const path = (res.data as any).path
      if (!state.user) return
      const createRes = await invoke(IPC_CHANNELS.PROJECTS_CREATE, state.user.id, {
        name: path.split(/[/\\]/).pop() ?? 'Project',
        path,
      })
      if (createRes.success && createRes.data) {
        dispatch({ type: 'ADD_PROJECT', payload: createRes.data as ProjectInfo })
        toast.success('បានបើក Project')
      }
    }
  }

  async function handleDelete(projectId: string, name: string) {
    if (!confirm(`លុប "${name}"?`)) return
    const res = await invoke(IPC_CHANNELS.PROJECTS_DELETE, projectId)
    if (res.success) {
      dispatch({ type: 'SET_PROJECTS', payload: state.projects.filter(p => p.id !== projectId) })
      toast.success('បានលុប Project')
    }
  }

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>📁 គម្រោងរបស់ខ្ញុំ</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
            {state.projects.length} គម្រោង
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={handleOpenFolder}>
            📂 បើកទីតាំង
          </button>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            ➕ បង្កើតគម្រោងថ្មី
          </button>
        </div>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="card" style={{ marginBottom: 20, padding: 20 }}>
          <h3 style={{ marginBottom: 16, fontSize: 15 }}>➕ គម្រោងថ្មី</h3>
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input
              className="input"
              placeholder="ឈ្មោះ​គម្រោង"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              required
              autoFocus
            />
            <input
              className="input"
              placeholder="ពិពណ៌នា (ស្រេចចិត្ត)"
              value={newDesc}
              onChange={e => setNewDesc(e.target.value)}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" className="btn btn-primary" disabled={creating}>
                {creating ? <span className="spinner" /> : '✅ បង្កើត'}
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setShowCreate(false)}>
                បោះបង់
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Projects grid */}
      {loading ? (
        <div className="empty-state"><span className="spinner" /></div>
      ) : state.projects.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📁</div>
          <h3>មិនមានគម្រោង</h3>
          <p>ចុច "បង្កើតគម្រោងថ្មី" ដើម្បីចាប់ផ្តើម</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {state.projects.map(p => (
            <div key={p.id} className="card" style={{ cursor: 'pointer', position: 'relative' }}
              onClick={() => {
                dispatch({ type: 'SET_ACTIVE_PROJECT', payload: p.id })
                dispatch({ type: 'SET_VIEW', payload: 'agent' })
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
                <span style={{ fontSize: 32 }}>
                  {p.framework?.includes('react') ? '⚛️' :
                   p.framework?.includes('vue') ? '💚' :
                   p.framework?.includes('next') ? '▲' :
                   p.language === 'python' ? '🐍' : '📁'}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.name}
                  </div>
                  {p.description && (
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                      {p.description}
                    </div>
                  )}
                </div>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={e => { e.stopPropagation(); handleDelete(p.id, p.name) }}
                  style={{ opacity: 0.6 }}
                >
                  🗑️
                </button>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {p.framework && <span className="badge badge-purple">{p.framework}</span>}
                {p.language && <span className="badge badge-info">{p.language}</span>}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
                📅 {new Date(p.updatedAt).toLocaleDateString('km-KH')}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
