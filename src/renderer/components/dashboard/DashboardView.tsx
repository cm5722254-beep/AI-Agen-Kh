import React, { useEffect, useState } from 'react'
import { useAppState } from '../../store/appStore'
import { useApi } from '../../hooks/useApi'
import { IPC_CHANNELS } from '../../../shared/constants'
import type { UsageSummary, AdminStats } from '../../../shared/types'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'

interface ChartPoint { date: string; tokens: number; requests: number }

const STAT_CARD = ({ icon, label, value, accent = false }: {
  icon: string; label: string; value: string | number; accent?: boolean
}) => (
  <div className={`card p-4 ${accent ? 'border-primary-500/40' : ''}`}>
    <div className="flex items-center gap-2 mb-2">
      <span>{icon}</span>
      <span className="text-[12px] text-[#606080]">{label}</span>
    </div>
    <div className={`text-[22px] font-bold ${accent ? 'text-primary-400' : 'text-[#e8e8f0]'}`}>
      {value}
    </div>
  </div>
)

export default function DashboardView() {
  const { state, dispatch } = useAppState()
  const { invoke } = useApi()
  const [summary, setSummary]     = useState<UsageSummary | null>(null)
  const [adminStats, setAdmin]    = useState<AdminStats | null>(null)
  const [chartData, setChartData] = useState<ChartPoint[]>([])

  useEffect(() => { if (state.user) loadData() }, [state.user])

  async function loadData() {
    if (!state.user) return
    const [sumRes, chartRes, projRes] = await Promise.all([
      invoke<UsageSummary>(IPC_CHANNELS.USAGE_SUMMARY, state.user.id),
      invoke<ChartPoint[]>(IPC_CHANNELS.USAGE_CHART, state.user.id, 7),
      invoke(IPC_CHANNELS.PROJECTS_LIST, state.user.id),
    ])
    if (sumRes.success   && sumRes.data)   setSummary(sumRes.data)
    if (chartRes.success && chartRes.data) setChartData(chartRes.data)
    if (projRes.success  && projRes.data)  dispatch({ type: 'SET_PROJECTS', payload: projRes.data as any[] })

    const isAdmin = state.user.role === 'SUPER_ADMIN' || state.user.role === 'ADMIN'
    if (isAdmin) {
      const adminRes = await invoke<AdminStats>(IPC_CHANNELS.ADMIN_STATS)
      if (adminRes.success && adminRes.data) setAdmin(adminRes.data)
    }
  }

  const isAdmin = state.user?.role === 'SUPER_ADMIN' || state.user?.role === 'ADMIN'

  const quickActions = [
    { icon: '🤖', label: 'AI Agent',     view: 'agent' },
    { icon: '📁', label: 'គម្រោងថ្មី',   view: 'projects' },
    { icon: '💻', label: 'Code Editor',  view: 'editor' },
    { icon: '🖥️', label: 'Terminal',    view: 'terminal' },
    { icon: '🌐', label: 'ម៉ាស៊ីនមេ',   view: 'server' },
    { icon: '🔑', label: 'API Keys',     view: 'apikeys' },
  ]

  return (
    <div className="p-6 max-w-[1200px] overflow-y-auto h-full">
      {/* Welcome */}
      <div className="mb-6">
        <h1 className="text-[22px] font-bold text-[#e8e8f0]">
          🇰🇭 សួស្ដី, {state.user?.name}!
        </h1>
        <p className="text-[#9090b0] text-sm mt-1">
          Khmer AI Coding Agent — ស្វាគមន៍មក Platform AI Coding ជាភាសាខ្មែរ
        </p>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-6">
        {quickActions.map(a => (
          <button
            key={a.view}
            onClick={() => dispatch({ type: 'SET_VIEW', payload: a.view as any })}
            className="card flex flex-col items-center gap-2 py-4 px-3 cursor-pointer
                       hover:border-primary-500/60 hover:bg-surface-500 transition-all duration-150
                       border-[#2a2a45] text-[12px] text-[#9090b0] hover:text-[#e8e8f0]"
          >
            <span className="text-[28px]">{a.icon}</span>
            <span>{a.label}</span>
          </button>
        ))}
      </div>

      {/* Admin stats */}
      {isAdmin && adminStats && (
        <div className="mb-6">
          <h3 className="text-[11px] uppercase tracking-wider text-[#606080] mb-3">
            System Overview
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <STAT_CARD icon="👥" label="Users"            value={adminStats.totalUsers} />
            <STAT_CARD icon="📁" label="Projects"          value={adminStats.totalProjects} />
            <STAT_CARD icon="🔢" label="Tokens ខែនេះ"     value={adminStats.totalTokens.toLocaleString()} accent />
            <STAT_CARD icon="💰" label="ថ្លៃប្រហែល"        value={`$${adminStats.estimatedCost.toFixed(4)}`} />
          </div>
        </div>
      )}

      {/* Token summary */}
      {summary && (
        <div className="mb-6">
          <h3 className="text-[11px] uppercase tracking-wider text-[#606080] mb-3">
            Token Usage
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <STAT_CARD icon="📊" label="Token ថ្ងៃនេះ"     value={summary.dailyTokens.toLocaleString()} />
            <STAT_CARD icon="📅" label="Token ខែនេះ"       value={summary.monthlyTokens.toLocaleString()} accent />
            <STAT_CARD icon="💬" label="Requests ថ្ងៃនេះ"  value={summary.dailyRequests} />
            <STAT_CARD icon="💰" label="ថ្លៃប្រហែលខែ"       value={`$${summary.estimatedMonthlyCost.toFixed(4)}`} />
          </div>
        </div>
      )}

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="card mb-6">
          <h3 className="text-[14px] font-semibold mb-4 text-[#e8e8f0]">
            📈 Token Usage — 7 ថ្ងៃចុងក្រោយ
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="tokenGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#7c6af7" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#7c6af7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a45" />
              <XAxis dataKey="date" tick={{ fill: '#606080', fontSize: 10 }} />
              <YAxis tick={{ fill: '#606080', fontSize: 10 }} />
              <Tooltip
                contentStyle={{
                  background: '#1e1e30', border: '1px solid #2a2a45',
                  borderRadius: 8, fontSize: 12,
                }}
              />
              <Area
                type="monotone" dataKey="tokens"
                stroke="#7c6af7" fill="url(#tokenGrad)"
                strokeWidth={2} name="Tokens"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent projects */}
      {state.projects.length > 0 && (
        <div>
          <h3 className="text-[11px] uppercase tracking-wider text-[#606080] mb-3">
            គម្រោងថ្មីៗ
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {state.projects.slice(0, 6).map(p => (
              <div
                key={p.id}
                className="card cursor-pointer hover:border-primary-500/60 hover:bg-surface-500
                           transition-all duration-150"
                onClick={() => {
                  dispatch({ type: 'SET_ACTIVE_PROJECT', payload: p.id })
                  dispatch({ type: 'SET_VIEW', payload: 'agent' })
                }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-[28px]">
                    {p.framework?.includes('react') ? '⚛️' :
                     p.framework?.includes('vue')   ? '💚' : '📁'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-[14px] truncate text-[#e8e8f0]">{p.name}</div>
                    <div className="text-[11px] text-[#606080]">{p.framework ?? p.language ?? 'Project'}</div>
                  </div>
                </div>
                <div className="text-[11px] text-[#606080]">
                  📅 {new Date(p.updatedAt).toLocaleDateString('km-KH')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
