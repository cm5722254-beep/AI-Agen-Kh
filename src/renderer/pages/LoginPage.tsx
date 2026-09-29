import React, { useState } from 'react'
import { useApi } from '../hooks/useApi'
import { useAppState } from '../store/appStore'
import { useToast } from '../hooks/useToast'
import { IPC_CHANNELS } from '../../shared/constants'
import type { AuthResult } from '../../shared/types'

export default function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const { invoke }  = useApi()
  const { dispatch } = useAppState()
  const toast = useToast()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await invoke<AuthResult>(IPC_CHANNELS.AUTH_LOGIN, { email, password })
      if (res.success && res.data) {
        const auth = res.data as AuthResult
        if (auth.token && auth.user) {
          localStorage.setItem('auth_token', auth.token)
          dispatch({ type: 'SET_AUTH', payload: { user: auth.user, token: auth.token } })
          toast.success(`ស្វាគមន៍! ${auth.user.name}`)
        }
      } else {
        toast.error(res.error ?? 'Login បរាជ័យ')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-screen flex items-center justify-center bg-surface-900 p-6">
      <div className="w-full max-w-[420px] flex flex-col gap-0">

        {/* Header card */}
        <div className="card text-center px-10 pt-8 pb-6 rounded-b-none border-b-0">
          <div className="text-[56px] mb-3">🇰🇭</div>
          <h1 className="text-[22px] font-bold mb-1 text-[#e8e8f0]">
            Khmer AI Coding Agent
          </h1>
          <p className="text-[#9090b0] text-sm">ចូលគណនីរបស់អ្នក</p>
        </div>

        {/* Form card */}
        <div className="card px-10 pt-6 pb-8 rounded-t-none border-t border-[#2a2a45]">
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <label className="block text-[13px] text-[#9090b0] mb-1.5">អ៊ីម៉ែល</label>
              <input
                className="input"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div>
              <label className="block text-[13px] text-[#9090b0] mb-1.5">ពាក្យសម្ងាត់</label>
              <input
                className="input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary justify-center mt-2 py-2.5"
              disabled={loading}
            >
              {loading ? <span className="spinner" /> : '🔐 ចូល'}
            </button>
          </form>
        </div>

        <p className="text-center text-[#606080] text-[11px] mt-4">
          Khmer AI Coding Agent v1.0.0 — scrypt + AES-256-GCM
        </p>
      </div>
    </div>
  )
}
