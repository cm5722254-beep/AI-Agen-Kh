import React, { useState } from 'react'
import { useAppState } from '../store/appStore'
import { useApi } from '../hooks/useApi'
import { useToast } from '../hooks/useToast'
import { IPC_CHANNELS } from '../../shared/constants'

export default function ProfilePage() {
  const { state, dispatch } = useAppState()
  const { invoke } = useApi()
  const toast = useToast()
  const [oldPw, setOldPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [changing, setChanging] = useState(false)

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    if (newPw !== confirmPw) { toast.error('ពាក្យសម្ងាត់ថ្មីមិនដូចគ្នា'); return }
    if (!state.user) return
    setChanging(true)
    const res = await invoke(IPC_CHANNELS.AUTH_CHANGE_PASSWORD, state.user.id, oldPw, newPw)
    setChanging(false)
    if (res.success) {
      toast.success('បានប្តូរពាក្យសម្ងាត់')
      setOldPw(''); setNewPw(''); setConfirmPw('')
    } else {
      toast.error(res.error ?? 'Error')
    }
  }

  async function handleLogout() {
    const token = state.token
    if (token) await invoke(IPC_CHANNELS.AUTH_LOGOUT, token)
    localStorage.removeItem('auth_token')
    dispatch({ type: 'LOGOUT' })
  }

  if (!state.user) return null

  return (
    <div style={{ padding: 24, maxWidth: 600 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>👤 គណនីរបស់ខ្ញុំ</h2>

      {/* Profile card */}
      <div className="card" style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 20, padding: 24 }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: 'var(--accent-primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 28, color: '#fff', fontWeight: 700,
        }}>
          {state.user.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>{state.user.name}</div>
          <div style={{ color: 'var(--text-secondary)', marginTop: 2 }}>{state.user.email}</div>
          <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
            <span className={`badge ${state.user.role === 'SUPER_ADMIN' ? 'badge-purple' : state.user.role === 'ADMIN' ? 'badge-warning' : 'badge-info'}`}>
              {state.user.role === 'SUPER_ADMIN' ? '👑 Super Admin' : state.user.role === 'ADMIN' ? '🔑 Admin' : '👤 User'}
            </span>
            <span className={`badge ${state.user.status === 'ACTIVE' ? 'badge-success' : 'badge-error'}`}>
              {state.user.status === 'ACTIVE' ? 'សកម្ម' : 'បិទ'}
            </span>
          </div>
        </div>
      </div>

      {/* Change password */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>🔐 ប្តូរពាក្យសម្ងាត់</h3>
        <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
              ពាក្យសម្ងាត់ចាស់
            </label>
            <input
              className="input"
              type="password"
              value={oldPw}
              onChange={e => setOldPw(e.target.value)}
              required
              placeholder="••••••••"
            />
          </div>
          <div>
            <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
              ពាក្យសម្ងាត់ថ្មី
            </label>
            <input
              className="input"
              type="password"
              value={newPw}
              onChange={e => setNewPw(e.target.value)}
              required
              minLength={8}
              placeholder="យ៉ាងហោចណាស់ 8 តួអក្សរ"
            />
          </div>
          <div>
            <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
              បញ្ជាក់ពាក្យសម្ងាត់ថ្មី
            </label>
            <input
              className="input"
              type="password"
              value={confirmPw}
              onChange={e => setConfirmPw(e.target.value)}
              required
              placeholder="••••••••"
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={changing} style={{ width: 'fit-content' }}>
            {changing ? <span className="spinner" /> : '✅ ប្ដូរពាក្យសម្ងាត់'}
          </button>
        </form>
      </div>

      {/* Logout */}
      <div className="card">
        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>🚪 ចេញពីគណនី</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 14 }}>
          ចុចប៊ូតុងនេះដើម្បីចេញពីប្រព័ន្ធ
        </p>
        <button className="btn btn-danger" onClick={handleLogout}>
          🚪 ចេញ
        </button>
      </div>
    </div>
  )
}
