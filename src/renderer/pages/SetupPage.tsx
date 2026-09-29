import React, { useState } from 'react'
import { useApi } from '../hooks/useApi'
import { useAppState } from '../store/appStore'
import { useToast } from '../hooks/useToast'
import { IPC_CHANNELS } from '../../shared/constants'
import type { AuthResult } from '../../shared/types'

type Step = 'welcome' | 'create-admin'

export default function SetupPage() {
  const [step, setStep]             = useState<Step>('welcome')
  const [name, setName]             = useState('')
  const [email, setEmail]           = useState('')
  const [password, setPassword]     = useState('')
  const [confirmPw, setConfirmPw]   = useState('')
  const [loading, setLoading]       = useState(false)
  const { invoke }   = useApi()
  const { dispatch }  = useAppState()
  const toast = useToast()

  async function handleCreateAdmin(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirmPw) { toast.error('ពាក្យសម្ងាត់មិនដូចគ្នា'); return }
    setLoading(true)
    try {
      const res = await invoke<AuthResult>(IPC_CHANNELS.AUTH_REGISTER, { name, email, password, role: 'SUPER_ADMIN' })
      if (res.success && res.data) {
        const auth = res.data as AuthResult
        if (auth.token && auth.user) {
          localStorage.setItem('auth_token', auth.token)
          dispatch({ type: 'SET_AUTH', payload: { user: auth.user, token: auth.token } })
          dispatch({ type: 'SET_FIRST_RUN', payload: false })
        }
      } else {
        toast.error(res.error ?? 'មានបញ្ហា')
      }
    } finally {
      setLoading(false)
    }
  }

  if (step === 'welcome') {
    return (
      <div className="h-screen flex items-center justify-center bg-surface-900 p-6">
        <div className="card max-w-[460px] w-full text-center p-12">
          <div className="text-[72px] mb-4">🇰🇭</div>
          <h1 className="text-[26px] font-bold mb-2 text-[#e8e8f0]">
            Khmer AI Coding Agent
          </h1>
          <p className="text-[#9090b0] mb-2">
            កម្មវិធី AI Coding Agent សម្រាប់អ្នកប្រើប្រាស់ខ្មែរ
          </p>
          <p className="text-[#606080] text-[12px] mb-8">Version 1.0.0</p>
          <button
            className="btn btn-primary btn-lg w-full justify-center"
            onClick={() => setStep('create-admin')}
          >
            🚀 ចាប់ផ្តើម
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex items-center justify-center bg-surface-900 p-6">
      <div className="card max-w-[440px] w-full p-10">
        <div className="text-center mb-8">
          <div className="text-[48px] mb-2">👑</div>
          <h2 className="text-[20px] font-bold text-[#e8e8f0]">បង្កើតគណនី Super Admin</h2>
          <p className="text-[#9090b0] text-[13px] mt-1.5">
            គណនីនេះនឹងមានសិទ្ធិគ្រប់គ្រងប្រព័ន្ធទាំងអស់
          </p>
        </div>

        <form onSubmit={handleCreateAdmin} className="flex flex-col gap-4">
          {[
            { label: 'ឈ្មោះ',              key: 'name',      type: 'text',     ph: 'ឈ្មោះ​អ្នក',        val: name,      set: setName },
            { label: 'អ៊ីម៉ែល',            key: 'email',     type: 'email',    ph: 'admin@example.com', val: email,     set: setEmail },
            { label: 'ពាក្យសម្ងាត់',       key: 'pw',        type: 'password', ph: 'យ៉ាងហោចណាស់ 8 តួ', val: password,  set: setPassword },
            { label: 'បញ្ជាក់ពាក្យសម្ងាត់', key: 'confirm',  type: 'password', ph: 'បញ្ជាក់ម្ដងទៀត',   val: confirmPw, set: setConfirmPw },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-[13px] text-[#9090b0] mb-1.5">{f.label}</label>
              <input
                className="input"
                type={f.type}
                placeholder={f.ph}
                value={f.val}
                onChange={e => f.set(e.target.value)}
                required
                autoFocus={f.key === 'name'}
                minLength={f.key === 'pw' || f.key === 'confirm' ? 8 : undefined}
              />
            </div>
          ))}
          <button
            type="submit"
            className="btn btn-primary btn-lg justify-center mt-2"
            disabled={loading}
          >
            {loading ? <span className="spinner" /> : '✅ បង្កើតគណនី Admin'}
          </button>
        </form>
      </div>
    </div>
  )
}
