import React, { useState } from 'react'
import { useApi } from '../../hooks/useApi'
import { IPC_CHANNELS } from '../../../shared/constants'

export default function PreviewView() {
  const { invoke } = useApi()
  const [url, setUrl] = useState('http://localhost:5173')
  const [inputUrl, setInputUrl] = useState('http://localhost:5173')
  const [loading, setLoading] = useState(false)

  function handleLoad() {
    setUrl(inputUrl)
    setLoading(true)
  }

  function openInBrowser() {
    invoke(IPC_CHANNELS.OPEN_EXTERNAL, url)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Toolbar */}
      <div style={{
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-color)',
        padding: '8px 12px',
        display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0,
      }}>
        <span style={{ fontSize: 14 }}>👁️</span>
        <input
          value={inputUrl}
          onChange={e => setInputUrl(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleLoad()}
          style={{
            flex: 1, background: 'var(--bg-card)', border: '1px solid var(--border-color)',
            borderRadius: 6, padding: '4px 10px', color: 'var(--text-primary)',
            fontFamily: 'var(--font-mono)', fontSize: 12, outline: 'none',
          }}
          placeholder="http://localhost:5173"
        />
        <button className="btn btn-primary btn-sm" onClick={handleLoad}>Go</button>
        <button className="btn btn-ghost btn-sm" onClick={() => { setUrl(''); setTimeout(() => setUrl(inputUrl), 100) }}>
          🔄
        </button>
        <button className="btn btn-ghost btn-sm" onClick={openInBrowser}>
          🌐 Browser
        </button>
      </div>

      {/* Quick URL buttons */}
      <div style={{
        background: 'var(--bg-tertiary)',
        borderBottom: '1px solid var(--border-color)',
        padding: '6px 12px',
        display: 'flex', gap: 6,
      }}>
        {['3000', '5173', '8000', '8080', '4000'].map(p => (
          <button
            key={p}
            className="btn btn-ghost btn-sm"
            onClick={() => { const u = `http://localhost:${p}`; setInputUrl(u); setUrl(u) }}
            style={{ fontSize: 11 }}
          >
            :{p}
          </button>
        ))}
      </div>

      {/* Iframe preview */}
      <div style={{ flex: 1, position: 'relative' }}>
        {url ? (
          <iframe
            src={url}
            style={{ width: '100%', height: '100%', border: 'none', background: '#fff' }}
            onLoad={() => setLoading(false)}
            onError={() => setLoading(false)}
            title="Live Preview"
          />
        ) : (
          <div className="empty-state" style={{ height: '100%' }}>
            <div className="empty-state-icon">👁️</div>
            <h3>Live Preview</h3>
            <p>បញ្ចូល URL ហើយចុច Go<br />ឬចាប់ផ្តើម Development Server ជាមុន</p>
          </div>
        )}
        {loading && (
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
          }}>
            <span className="spinner" style={{ width: 32, height: 32 }} />
          </div>
        )}
      </div>
    </div>
  )
}
