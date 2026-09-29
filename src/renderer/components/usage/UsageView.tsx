import React, { useEffect, useState } from 'react'
import { useAppState } from '../../store/appStore'
import { useApi } from '../../hooks/useApi'
import { IPC_CHANNELS } from '../../../shared/constants'
import type { UsageSummary, TokenUsageRecord } from '../../../shared/types'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'

type Period = '7' | '30' | '90'

export default function UsageView() {
  const { state } = useAppState()
  const { invoke } = useApi()
  const [summary, setSummary] = useState<UsageSummary | null>(null)
  const [records, setRecords] = useState<TokenUsageRecord[]>([])
  const [chartData, setChartData] = useState<any[]>([])
  const [period, setPeriod] = useState<Period>('7')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (state.user) loadData()
  }, [state.user, period])

  async function loadData() {
    if (!state.user) return
    setLoading(true)
    const [summaryRes, chartRes, recordsRes] = await Promise.all([
      invoke(IPC_CHANNELS.USAGE_SUMMARY, state.user.id),
      invoke(IPC_CHANNELS.USAGE_CHART, state.user.id, parseInt(period)),
      invoke(IPC_CHANNELS.USAGE_GET, state.user.id, parseInt(period)),
    ])
    if (summaryRes.success && summaryRes.data) setSummary(summaryRes.data as UsageSummary)
    if (chartRes.success && chartRes.data) setChartData(chartRes.data as any[])
    if (recordsRes.success && recordsRes.data) setRecords(recordsRes.data as TokenUsageRecord[])
    setLoading(false)
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>📈 ការប្រើប្រាស់ Token</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
            តាមដានការប្រើប្រាស់ AI Token
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['7', '30', '90'] as Period[]).map(p => (
            <button
              key={p}
              className={`btn btn-sm ${period === p ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setPeriod(p)}
            >
              {p} ថ្ងៃ
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 24 }}>
          {[
            { label: 'Token ថ្ងៃនេះ', value: summary.dailyTokens.toLocaleString(), icon: '📊', color: 'var(--accent-primary)' },
            { label: 'Token ខែនេះ', value: summary.monthlyTokens.toLocaleString(), icon: '📅', color: 'var(--info)' },
            { label: 'Request ថ្ងៃនេះ', value: summary.dailyRequests.toString(), icon: '💬', color: 'var(--success)' },
            { label: 'Request ខែនេះ', value: summary.monthlyRequests.toString(), icon: '🔢', color: 'var(--warning)' },
            { label: 'ថ្លៃថ្ងៃនេះ', value: `$${summary.estimatedDailyCost.toFixed(6)}`, icon: '💰', color: 'var(--accent-primary)' },
            { label: 'ថ្លៃខែនេះ', value: `$${summary.estimatedMonthlyCost.toFixed(4)}`, icon: '💳', color: 'var(--error)' },
          ].map(stat => (
            <div key={stat.label} className="card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span>{stat.icon}</span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{stat.label}</span>
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, color: stat.color }}>{stat.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h3 style={{ marginBottom: 16, fontSize: 14, fontWeight: 600 }}>
            📊 Token Usage ({period} ថ្ងៃ)
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
              <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="tokens" fill="var(--accent-primary)" name="Tokens" radius={[4, 4, 0, 0]} />
              <Bar dataKey="requests" fill="var(--info)" name="Requests" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Records table */}
      <div className="card">
        <h3 style={{ marginBottom: 14, fontSize: 14, fontWeight: 600 }}>📋 ប្រវត្តិ Request</h3>
        {loading ? (
          <div className="empty-state"><span className="spinner" /></div>
        ) : records.length === 0 ? (
          <div className="empty-state">
            <p>គ្មានប្រវត្តិ</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '6px 10px', textAlign: 'left' }}>ពេលវេលា</th>
                  <th style={{ padding: '6px 10px', textAlign: 'left' }}>Provider</th>
                  <th style={{ padding: '6px 10px', textAlign: 'left' }}>Model</th>
                  <th style={{ padding: '6px 10px', textAlign: 'right' }}>Input</th>
                  <th style={{ padding: '6px 10px', textAlign: 'right' }}>Output</th>
                  <th style={{ padding: '6px 10px', textAlign: 'right' }}>Total</th>
                  <th style={{ padding: '6px 10px', textAlign: 'right' }}>ថ្លៃ</th>
                </tr>
              </thead>
              <tbody>
                {records.slice(0, 50).map(r => (
                  <tr key={r.id} style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                    <td style={{ padding: '6px 10px' }}>{new Date(r.createdAt).toLocaleString('km-KH')}</td>
                    <td style={{ padding: '6px 10px' }}>{r.provider}</td>
                    <td style={{ padding: '6px 10px', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'var(--font-mono)' }}>
                      {r.modelId}
                    </td>
                    <td style={{ padding: '6px 10px', textAlign: 'right' }}>{r.inputTokens.toLocaleString()}</td>
                    <td style={{ padding: '6px 10px', textAlign: 'right' }}>{r.outputTokens.toLocaleString()}</td>
                    <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 600 }}>{r.totalTokens.toLocaleString()}</td>
                    <td style={{ padding: '6px 10px', textAlign: 'right' }}>
                      {r.totalCost ? `$${r.totalCost.toFixed(6)}` : <span style={{ color: 'var(--text-muted)' }}>N/A</span>}
                      {r.isEstimated && <span style={{ color: 'var(--text-muted)', fontSize: 10 }}> ~</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
