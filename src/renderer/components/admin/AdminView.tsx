import React, { useEffect, useState } from 'react'
import { useAppState } from '../../store/appStore'
import { useApi } from '../../hooks/useApi'
import { useToast } from '../../hooks/useToast'
import { IPC_CHANNELS } from '../../../shared/constants'
import type { AdminStats, UserRole, UsageLimitInfo } from '../../../shared/types'

type Tab = 'stats' | 'users' | 'logs'

interface AdminUser {
  id: string
  name: string
  email: string
  role: string
  status: string
  createdAt: string
  lastLogin?: string
  usageLimit?: UsageLimitInfo
}

export default function AdminView() {
  const { state } = useAppState()
  const { invoke } = useApi()
  const toast = useToast()
  const [tab, setTab] = useState<Tab>('stats')
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [showCreateUser, setShowCreateUser] = useState(false)
  const [showLimitModal, setShowLimitModal] = useState<AdminUser | null>(null)

  // Access guard
  const isAdmin = state.user?.role === 'SUPER_ADMIN' || state.user?.role === 'ADMIN'
  if (!isAdmin) {
    return (
      <div className="empty-state" style={{ height: '100%' }}>
        <div className="empty-state-icon">🚫</div>
        <h3>គ្មានសិទ្ធិ</h3>
        <p>តំបន់នេះជ្រើសតែ Admin ប៉ុណ្ណោះ</p>
      </div>
    )
  }

  useEffect(() => {
    if (tab === 'stats') loadStats()
    if (tab === 'users') loadUsers()
    if (tab === 'logs') loadLogs()
  }, [tab])

  async function loadStats() {
    const res = await invoke<AdminStats>(IPC_CHANNELS.ADMIN_STATS)
    if (res.success && res.data) setStats(res.data)
  }

  async function loadUsers() {
    setLoading(true)
    const res = await invoke(IPC_CHANNELS.ADMIN_USERS)
    if (res.success && res.data) setUsers(res.data as AdminUser[])
    setLoading(false)
  }

  async function loadLogs() {
    setLoading(true)
    const res = await invoke(IPC_CHANNELS.ADMIN_LOGS, 100)
    if (res.success && res.data) setLogs(res.data as any[])
    setLoading(false)
  }

  async function handleToggleUser(userId: string, status: string) {
    const newStatus = status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE'
    const res = await invoke(IPC_CHANNELS.ADMIN_UPDATE_USER, userId, { status: newStatus })
    if (res.success) {
      toast.success(newStatus === 'ACTIVE' ? 'បើកគណនី' : 'បិទគណនី')
      loadUsers()
    }
  }

  async function handleSetRole(userId: string, role: UserRole) {
    const res = await invoke(IPC_CHANNELS.ADMIN_UPDATE_USER, userId, { role })
    if (res.success) { toast.success('បានផ្លាស់ Role'); loadUsers() }
  }

  async function handleSetLimit(userId: string, limits: UsageLimitInfo) {
    const res = await invoke(IPC_CHANNELS.ADMIN_SET_LIMIT, userId, limits)
    if (res.success) { toast.success('បានកំណត់ Limit'); setShowLimitModal(null); loadUsers() }
    else toast.error(res.error ?? 'Error')
  }

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>👑 Admin Dashboard</h2>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'var(--bg-secondary)', borderRadius: 10, padding: 4, width: 'fit-content' }}>
        {(['stats', 'users', 'logs'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '6px 16px',
              borderRadius: 7,
              border: 'none',
              background: tab === t ? 'var(--accent-primary)' : 'transparent',
              color: tab === t ? '#fff' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: 13,
              fontFamily: 'var(--font-ui)',
              fontWeight: tab === t ? 600 : 400,
            }}
          >
            {t === 'stats' ? '📊 Statistics' : t === 'users' ? '👥 Users' : '📋 Logs'}
          </button>
        ))}
      </div>

      {/* Stats */}
      {tab === 'stats' && stats && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
            {[
              { label: 'Users សរុប', value: stats.totalUsers, icon: '👥' },
              { label: 'Users សកម្ម', value: stats.activeUsers, icon: '✅' },
              { label: 'Projects', value: stats.totalProjects, icon: '📁' },
              { label: 'AI Requests ខែនេះ', value: stats.totalRequests.toLocaleString(), icon: '💬' },
              { label: 'Tokens ខែនេះ', value: stats.totalTokens.toLocaleString(), icon: '🔢' },
              { label: 'ថ្លៃ API ប្រហែល', value: `$${stats.estimatedCost.toFixed(4)}`, icon: '💰' },
              { label: 'Servers សកម្ម', value: stats.activeServers, icon: '🌐' },
              { label: 'System Errors', value: stats.systemErrors, icon: '⚠️' },
            ].map(stat => (
              <div key={stat.label} className="card" style={{ padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span>{stat.icon}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{stat.label}</span>
                </div>
                <div style={{ fontSize: 24, fontWeight: 700 }}>{stat.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Users */}
      {tab === 'users' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
            <button className="btn btn-primary btn-sm" onClick={() => setShowCreateUser(true)}>
              ➕ User ថ្មី
            </button>
          </div>

          {loading ? <div className="empty-state"><span className="spinner" /></div> : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '8px 12px', textAlign: 'left' }}>ឈ្មោះ</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left' }}>អ៊ីម៉ែល</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left' }}>Role</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left' }}>ស្ថានភាព</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left' }}>Login ចុងក្រោយ</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left' }}>ការចាត់ការ</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '8px 12px', fontWeight: 500 }}>{user.name}</td>
                      <td style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>{user.email}</td>
                      <td style={{ padding: '8px 12px' }}>
                        {state.user?.role === 'SUPER_ADMIN' && user.id !== state.user?.id ? (
                          <select
                            value={user.role}
                            onChange={e => handleSetRole(user.id, e.target.value as UserRole)}
                            style={{
                              background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
                              borderRadius: 4, padding: '2px 6px', fontSize: 12, color: 'var(--text-primary)',
                              fontFamily: 'var(--font-ui)',
                            }}
                          >
                            <option value="USER">USER</option>
                            <option value="ADMIN">ADMIN</option>
                            <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                          </select>
                        ) : (
                          <span className={`badge ${user.role === 'SUPER_ADMIN' ? 'badge-purple' : user.role === 'ADMIN' ? 'badge-warning' : 'badge-info'}`}>
                            {user.role}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '8px 12px' }}>
                        <span className={`badge ${user.status === 'ACTIVE' ? 'badge-success' : 'badge-error'}`}>
                          {user.status === 'ACTIVE' ? 'សកម្ម' : 'បិទ'}
                        </span>
                      </td>
                      <td style={{ padding: '8px 12px', color: 'var(--text-muted)', fontSize: 12 }}>
                        {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('km-KH') : '—'}
                      </td>
                      <td style={{ padding: '8px 12px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {user.id !== state.user?.id && (
                            <button
                              className={`btn btn-sm ${user.status === 'ACTIVE' ? 'btn-danger' : 'btn-primary'}`}
                              onClick={() => handleToggleUser(user.id, user.status)}
                            >
                              {user.status === 'ACTIVE' ? '🔒 បិទ' : '🔓 បើក'}
                            </button>
                          )}
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => setShowLimitModal(user)}
                          >
                            📊 Limit
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Logs */}
      {tab === 'logs' && (
        <div>
          {loading ? <div className="empty-state"><span className="spinner" /></div> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {logs.map((log, i) => (
                <div key={i} style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderLeft: `3px solid ${log.category === 'ERROR' ? 'var(--error)' : log.category === 'SECURITY' ? 'var(--warning)' : 'var(--border-color)'}`,
                  borderRadius: 6, padding: '8px 12px',
                  display: 'flex', gap: 12, alignItems: 'center',
                  fontSize: 12,
                }}>
                  <span style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {new Date(log.createdAt).toLocaleString('km-KH')}
                  </span>
                  <span className={`badge ${log.category === 'ERROR' ? 'badge-error' : log.category === 'SECURITY' ? 'badge-warning' : log.category === 'INFO' ? 'badge-info' : 'badge-info'}`}>
                    {log.category}
                  </span>
                  <span style={{ fontWeight: 500 }}>{log.action}</span>
                  {log.user && <span style={{ color: 'var(--text-muted)' }}>— {log.user.name}</span>}
                  {log.details && <span style={{ color: 'var(--text-muted)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{log.details}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Limit Modal */}
      {showLimitModal && (
        <LimitModal
          user={showLimitModal}
          onSave={(limits) => handleSetLimit(showLimitModal.id, limits)}
          onClose={() => setShowLimitModal(null)}
        />
      )}
    </div>
  )
}

function LimitModal({ user, onSave, onClose }: {
  user: AdminUser
  onSave: (limits: UsageLimitInfo) => void
  onClose: () => void
}) {
  const [dailyToken, setDailyToken] = useState(String(user.usageLimit?.dailyTokenLimit ?? ''))
  const [monthlyToken, setMonthlyToken] = useState(String(user.usageLimit?.monthlyTokenLimit ?? ''))
  const [dailyReq, setDailyReq] = useState(String(user.usageLimit?.dailyRequestLimit ?? ''))
  const [monthlyReq, setMonthlyReq] = useState(String(user.usageLimit?.monthlyRequestLimit ?? ''))

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ minWidth: 380 }}>
        <div className="modal-header">
          <span className="modal-title">📊 Token Limit — {user.name}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            { label: 'Daily Token Limit', value: dailyToken, onChange: setDailyToken },
            { label: 'Monthly Token Limit', value: monthlyToken, onChange: setMonthlyToken },
            { label: 'Daily Request Limit', value: dailyReq, onChange: setDailyReq },
            { label: 'Monthly Request Limit', value: monthlyReq, onChange: setMonthlyReq },
          ].map(f => (
            <div key={f.label}>
              <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>{f.label}</label>
              <input
                className="input"
                type="number"
                placeholder="Unlimited (ទុក​ទទេ)"
                value={f.value}
                onChange={e => f.onChange(e.target.value)}
              />
            </div>
          ))}
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button className="btn btn-primary" onClick={() => onSave({
              dailyTokenLimit: dailyToken ? parseInt(dailyToken) : undefined,
              monthlyTokenLimit: monthlyToken ? parseInt(monthlyToken) : undefined,
              dailyRequestLimit: dailyReq ? parseInt(dailyReq) : undefined,
              monthlyRequestLimit: monthlyReq ? parseInt(monthlyReq) : undefined,
            })}>
              ✅ រក្សាទុក
            </button>
            <button className="btn btn-ghost" onClick={onClose}>បោះបង់</button>
          </div>
        </div>
      </div>
    </div>
  )
}
