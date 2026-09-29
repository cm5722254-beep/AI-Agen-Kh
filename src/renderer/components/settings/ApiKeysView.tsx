import React, { useEffect, useState } from 'react'
import { useApi } from '../../hooks/useApi'
import { useToast } from '../../hooks/useToast'
import { IPC_CHANNELS } from '../../../shared/constants'
import type { ApiKeyInfo, ApiProviderInfo } from '../../../shared/types'

export default function ApiKeysView() {
  const { invoke } = useApi()
  const toast = useToast()
  const [keys, setKeys] = useState<ApiKeyInfo[]>([])
  const [providers, setProviders] = useState<ApiProviderInfo[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [testing, setTesting] = useState<string | null>(null)

  // Form
  const [providerId, setProviderId] = useState('')
  const [keyName, setKeyName] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [isDefault, setIsDefault] = useState(false)
  const [adding, setAdding] = useState(false)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const [keyRes, provRes] = await Promise.all([
      invoke<ApiKeyInfo[]>(IPC_CHANNELS.APIKEY_LIST),
      invoke<ApiProviderInfo[]>(IPC_CHANNELS.PROVIDER_LIST),
    ])
    if (keyRes.success && keyRes.data) setKeys(keyRes.data)
    if (provRes.success && provRes.data) setProviders(provRes.data)
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!providerId || !apiKey.trim()) return
    setAdding(true)
    const res = await invoke(IPC_CHANNELS.APIKEY_ADD, {
      providerId,
      name: keyName || (providers.find(p => p.id === providerId)?.displayName ?? 'Key'),
      apiKey: apiKey.trim(),
      isDefault,
    })
    setAdding(false)
    if (res.success) {
      toast.success('áž”áž¶áž“áž”áž“áŸ’ážáŸ‚áž˜ API Key')
      setShowAdd(false)
      setApiKey(''); setKeyName(''); setProviderId(''); setIsDefault(false)
      loadData()
    } else {
      toast.error(res.error ?? 'áž”áž“áŸ’ážáŸ‚áž˜ Key áž”ážšáž¶áž‡áŸáž™')
    }
  }

  async function handleTest(keyId: string) {
    setTesting(keyId)
    const res = await invoke('apikey:test', keyId)
    setTesting(null)
    if (res.success) {
      const data = res.data as any
      if (data.success) toast.success(data.message ?? 'API Key ážŠáŸ†ážŽáž¾ážšáž€áž¶ážš')
      else toast.error(data.message ?? 'API Key Error')
    } else {
      toast.error(res.error ?? 'Test Error')
    }
  }

  async function handleDelete(keyId: string) {
    if (!confirm('áž›áž»áž” API Key?')) return
    const res = await invoke(IPC_CHANNELS.APIKEY_DELETE, keyId)
    if (res.success) {
      toast.success('áž”áž¶áž“áž›áž»áž”')
      loadData()
    }
  }

  const providerById = Object.fromEntries(providers.map(p => [p.id, p]))

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>ðŸ”‘ API Key</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
            áž‚áŸ’ážšáž”áŸ‹áž‚áŸ’ážšáž„ AI Provider API Keys
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(!showAdd)}>
          âž• áž”áž“áŸ’ážáŸ‚áž˜ API Key
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="card" style={{ marginBottom: 20, padding: 20 }}>
          <h3 style={{ marginBottom: 16, fontSize: 15 }}>âž• API Key ážáŸ’áž˜áž¸</h3>
          <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                Provider
              </label>
              <select
                value={providerId}
                onChange={e => setProviderId(e.target.value)}
                required
                style={{
                  width: '100%', background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)', borderRadius: 8,
                  padding: '8px 12px', color: 'var(--text-primary)',
                  fontFamily: 'var(--font-ui)', fontSize: 14,
                }}
              >
                <option value="">-- áž‡áŸ’ážšáž¾ážŸ Provider --</option>
                {providers.map(p => (
                  <option key={p.id} value={p.id}>{p.displayName}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                ážˆáŸ’áž˜áŸ„áŸ‡ (ážŸáŸ’ážšáŸáž…áž…áž·ážáŸ’áž)
              </label>
              <input className="input" placeholder="NVIDIA NIM Key" value={keyName} onChange={e => setKeyName(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                API Key
              </label>
              <input
                className="input"
                type="password"
                placeholder="nvapi-â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                required
              />
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                ðŸ”’ Key áž“áž¹áž„ážáŸ’ážšáž¼ážœ Encrypt ážŠáŸ„áž™ AES-256 â€” áž“áž¹áž„áž˜áž·áž“áž”áž„áŸ’áž áž¶áž‰áž–áŸáž‰ áž‘áŸ
              </p>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
              <input type="checkbox" checked={isDefault} onChange={e => setIsDefault(e.target.checked)} />
              áž”áŸ’ážšáž¾áž‡áž¶ Default Key
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" className="btn btn-primary" disabled={adding}>
                {adding ? <span className="spinner" /> : 'âœ… ážšáž€áŸ’ážŸáž¶áž‘áž»áž€'}
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setShowAdd(false)}>
                áž”áŸ„áŸ‡áž”áž„áŸ‹
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Keys list */}
      {keys.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">ðŸ”‘</div>
          <h3>áž‚áŸ’áž˜áž¶áž“ API Key</h3>
          <p>ážŸáž¼áž˜áž”áž“áŸ’ážáŸ‚áž˜ API Key ážŠáž¾áž˜áŸ’áž”áž¸áž…áž¶áž”áŸ‹áž•áŸ’ážáž¾áž˜áž”áŸ’ážšáž¾ AI</p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            ážŸáŸ’ážœáŸ‚áž„ážšáž€ NVIDIA NIM API Key áž“áŸ…: build.nvidia.com
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {keys.map(key => {
            const prov = providerById[key.providerId]
            return (
              <div key={key.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <span style={{ fontSize: 24 }}>ðŸ”‘</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 600 }}>{key.name}</span>
                    {key.isDefault && <span className="badge badge-success">Default</span>}
                    {prov && <span className="badge badge-info">{prov.displayName}</span>}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                    {key.keyHint}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleTest(key.id)}
                    disabled={testing === key.id}
                  >
                    {testing === key.id ? <span className="spinner" style={{ width: 12 }} /> : 'ðŸ§ª Test'}
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(key.id)}>ðŸ—‘ï¸</button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
