import React, { useEffect, useState } from 'react'
import { useAppState } from '../../store/appStore'
import { useApi } from '../../hooks/useApi'
import { useToast } from '../../hooks/useToast'
import { IPC_CHANNELS } from '../../../shared/constants'
import type { AppSettings } from '../../../shared/types'

export default function SettingsView() {
  const { state, dispatch } = useAppState()
  const { invoke } = useApi()
  const toast = useToast()
  const [settings, setSettings] = useState<AppSettings | null>(state.settings)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  async function loadSettings() {
    const res = await invoke<AppSettings>(IPC_CHANNELS.SETTINGS_GET)
    if (res.success && res.data) {
      setSettings(res.data)
      dispatch({ type: 'SET_SETTINGS', payload: res.data })
    }
  }

  async function handleSave(key: string, value: string) {
    setSaving(true)
    const res = await invoke(IPC_CHANNELS.SETTINGS_SET, key, value)
    setSaving(false)
    if (res.success) {
      toast.success('បានរក្សាទុក')
      loadSettings()
    } else {
      toast.error(res.error ?? 'Error')
    }
  }

  async function handleSelectDir() {
    const res = await invoke(IPC_CHANNELS.SELECT_DIRECTORY)
    if (res.success && res.data) {
      await handleSave('projectsDirectory', res.data as string)
    }
  }

  if (!settings) return <div className="empty-state"><span className="spinner" /></div>

  return (
    <div style={{ padding: 24, maxWidth: 700 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>⚙️ ការកំណត់</h2>

      {/* Appearance */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>🎨 រូបរាង</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 14 }}>Theme</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>ជ្រើស Light ឬ Dark Mode</div>
            </div>
            <select
              value={settings.theme}
              onChange={e => handleSave('theme', e.target.value)}
              style={{
                background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
                borderRadius: 6, padding: '6px 10px', color: 'var(--text-primary)',
                fontFamily: 'var(--font-ui)',
              }}
            >
              <option value="dark">🌙 Dark</option>
              <option value="light">☀️ Light</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 14 }}>Font Size</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>ទំហំ Font ក្នុង Editor</div>
            </div>
            <select
              value={settings.fontSize}
              onChange={e => handleSave('fontSize', e.target.value)}
              style={{
                background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
                borderRadius: 6, padding: '6px 10px', color: 'var(--text-primary)',
                fontFamily: 'var(--font-ui)',
              }}
            >
              {[11, 12, 13, 14, 15, 16, 18].map(s => (
                <option key={s} value={s}>{s}px</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Projects */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>📁 Project</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <input
            className="input"
            value={settings.projectsDirectory || ''}
            readOnly
            placeholder="ទីតាំង Default Project..."
          />
          <button className="btn btn-secondary btn-sm" onClick={handleSelectDir}>
            📂 ជ្រើស
          </button>
        </div>
      </div>

      {/* Security */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>🔒 សុវត្ថិភាព</h3>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={settings.confirmDangerousCommands}
            onChange={e => handleSave('confirmDangerousCommands', String(e.target.checked))}
            style={{ width: 16, height: 16 }}
          />
          <div>
            <div style={{ fontSize: 14 }}>បញ្ជាក់ Command គ្រោះថ្នាក់</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              សួរ Permission មុន AI ដំណើរការ Command ដែលមានហានិភ័យ
            </div>
          </div>
        </label>
      </div>

      {/* Auto Save */}
      <div className="card">
        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>💾 Auto Save</h3>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={settings.autoSave}
            onChange={e => handleSave('autoSave', String(e.target.checked))}
            style={{ width: 16, height: 16 }}
          />
          <div>
            <div style={{ fontSize: 14 }}>Auto Save File</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              រក្សាទុក File ដោយស្វ័យប្រវត្តិនៅពេល AI ផ្លាស់ប្តូរ
            </div>
          </div>
        </label>
      </div>

      {saving && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, color: 'var(--text-muted)', fontSize: 13 }}>
          <span className="spinner" />
          <span>កំពុងរក្សាទុក...</span>
        </div>
      )}
    </div>
  )
}
