import React, { useState } from 'react'
import { useApi } from '../../hooks/useApi'
import { useToast } from '../../hooks/useToast'

// ─── donation tiers ──────────────────────────────────────────────────────────
const TIERS = [
  { label: 'ប៉ាវកាហ្វេ 1 ពែង',   amount: 1,   icon: '☕',  color: 'from-amber-600 to-amber-500' },
  { label: 'ប៉ាវកាហ្វេ 3 ពែង',   amount: 3,   icon: '☕☕☕', color: 'from-amber-700 to-amber-600' },
  { label: 'អាហារថ្ងៃត្រង់',      amount: 5,   icon: '🍱',  color: 'from-orange-600 to-orange-500' },
  { label: 'គាំទ្រ Server',       amount: 10,  icon: '🖥️',  color: 'from-primary-700 to-primary-500' },
  { label: 'គាំទ្រ Development',  amount: 20,  icon: '💻',  color: 'from-primary-600 to-violet-500' },
  { label: 'Sponsor',             amount: 50,  icon: '🏆',  color: 'from-yellow-600 to-yellow-400' },
]

// ─── supporters mock list (replace with real DB later) ───────────────────────
const SUPPORTERS = [
  { name: 'Anonymous',   amount: 5,  date: '2024-01-15', msg: 'Keep it up! 🇰🇭' },
  { name: 'Khmer Dev',   amount: 10, date: '2024-01-20', msg: 'ល្អណាស់!' },
  { name: 'Anonymous',   amount: 1,  date: '2024-01-22', msg: '' },
]

export default function KhqrPage() {
  const toast = useToast()
  const [copied, setCopied]       = useState(false)
  const [selectedTier, setTier]   = useState<number | null>(null)
  const [showThank, setShowThank] = useState(false)
  const [donorName, setDonorName] = useState('')
  const [donorMsg,  setDonorMsg]  = useState('')

  // BAKONG / ABA account info — replace with real values
  const ACCOUNT_NAME   = 'Khmer AI Team'
  const ACCOUNT_NUMBER = '0123456789'   // replace with real BAKONG/ABA number
  const BANK_NAME      = 'ABA Bank / BAKONG'

  function copyAccount() {
    navigator.clipboard.writeText(ACCOUNT_NUMBER)
    setCopied(true)
    toast.success('បានចម្លង Account Number')
    setTimeout(() => setCopied(false), 2500)
  }

  function handleDonate() {
    if (!selectedTier) { toast.warning('សូមជ្រើស Tier ជាមុន'); return }
    setShowThank(true)
  }

  const totalRaised = SUPPORTERS.reduce((s, d) => s + d.amount, 0)

  return (
    <div className="h-full overflow-y-auto bg-surface-900">
      <div className="max-w-[860px] mx-auto p-6 pb-16">

        {/* ── Hero ── */}
        <div className="relative rounded-2xl overflow-hidden mb-8
                        bg-gradient-to-br from-amber-900/60 via-surface-800 to-primary-900/40
                        border border-amber-700/30 p-8 text-center">
          {/* background glow */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px]
                            bg-amber-500/10 rounded-full blur-3xl" />
          </div>

          <div className="relative z-10">
            <div className="text-[52px] mb-3">☕</div>
            <h1 className="text-[26px] font-bold text-[#e8e8f0] mb-2">
              ប៉ាវ​កាហ្វេ​ឱ្យ​ Team! 🇰🇭
            </h1>
            <p className="text-amber-300 text-[15px] mb-1">
              Buy us a coffee — គាំទ្រ Khmer AI Coding Agent
            </p>
            <p className="text-[#9090b0] text-[13px] max-w-[480px] mx-auto leading-relaxed">
              គម្រោងនេះជា Open-Source ដែលបង្កើតឡើងដោយ Khmer Developer
              ដើម្បី Community ខ្មែរ។ ការគាំទ្ររបស់អ្នកជួយឱ្យ
               យើងអាច Maintain និង Improve App នេះបន្ត។
            </p>

            {/* Progress bar */}
            <div className="mt-6 max-w-[400px] mx-auto">
              <div className="flex justify-between text-[12px] text-[#9090b0] mb-1.5">
                <span>💰 Raised: ${totalRaised}</span>
                <span>Goal: $100 / month</span>
              </div>
              <div className="h-2.5 bg-surface-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all"
                  style={{ width: `${Math.min((totalRaised / 100) * 100, 100)}%` }}
                />
              </div>
              <div className="text-[11px] text-amber-400 mt-1 text-right">
                {SUPPORTERS.length} supporters
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">

          {/* ── KHQR QR Code ── */}
          <div className="card flex flex-col items-center gap-4 p-6">
            <div className="flex items-center gap-2 mb-1">
              {/* KHQR logo badge */}
              <div className="flex items-center gap-1.5 bg-red-600 text-white
                              px-3 py-1 rounded-full text-[12px] font-bold">
                <span>🏦</span>
                <span>KHQR</span>
              </div>
              <span className="text-[#9090b0] text-[12px]">/ BAKONG</span>
            </div>

            {/* QR image — place your real QR at public/khqr.png */}
            <div className="relative bg-white p-3 rounded-2xl shadow-lg">
              <img
                src="khqr.png"
                alt="KHQR QR Code"
                width={220}
                height={220}
                className="block"
                onError={e => {
                  // fallback: show placeholder if image not found
                  const el = e.currentTarget
                  el.style.display = 'none'
                  const next = el.nextElementSibling as HTMLElement | null
                  if (next) next.style.display = 'flex'
                }}
              />
              {/* Fallback placeholder */}
              <div
                className="hidden w-[220px] h-[220px] flex-col items-center justify-center
                           bg-gray-100 rounded-xl text-gray-500 text-[12px] text-center gap-2"
              >
                <span className="text-[40px]">📱</span>
                <span>ដាក់ khqr.png<br />ក្នុង public/ folder</span>
              </div>

              {/* BAKONG center badge overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center
                                shadow-lg border-2 border-white">
                  <span className="text-white text-[16px]">✿</span>
                </div>
              </div>
            </div>

            <div className="text-center">
              <div className="text-[13px] font-semibold text-[#e8e8f0] mb-0.5">{ACCOUNT_NAME}</div>
              <div className="text-[12px] text-[#9090b0]">{BANK_NAME}</div>
            </div>

            {/* Account number copy */}
            <div className="flex items-center gap-2 bg-surface-800 border border-[#2a2a45]
                            rounded-lg px-3 py-2 w-full">
              <span className="flex-1 font-mono text-[13px] text-[#e8e8f0] tracking-wider">
                {ACCOUNT_NUMBER}
              </span>
              <button
                onClick={copyAccount}
                className={[
                  'btn btn-sm transition-all',
                  copied ? 'btn-primary' : 'btn-secondary',
                ].join(' ')}
              >
                {copied ? '✅ Copied' : '📋 Copy'}
              </button>
            </div>

            <p className="text-[11px] text-[#606080] text-center leading-relaxed">
              Scan QR ដោយ ABA, ACLEDA, Wing, TrueMoney<br />
              ឬ App ដែល Support KHQR / BAKONG
            </p>
          </div>

          {/* ── Tier selector ── */}
          <div className="flex flex-col gap-4">
            <h3 className="text-[15px] font-semibold text-[#e8e8f0]">
              ☕ ជ្រើស Amount
            </h3>

            <div className="grid grid-cols-2 gap-2.5">
              {TIERS.map(tier => (
                <button
                  key={tier.amount}
                  onClick={() => setTier(tier.amount)}
                  className={[
                    'relative flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl',
                    'border transition-all duration-150 cursor-pointer text-center',
                    selectedTier === tier.amount
                      ? 'border-amber-400 bg-amber-500/20 scale-[1.03]'
                      : 'border-[#2a2a45] bg-surface-700 hover:border-amber-500/50 hover:bg-surface-600',
                  ].join(' ')}
                >
                  <span className="text-[22px]">{tier.icon}</span>
                  <span className="text-[11px] text-[#9090b0] leading-tight">{tier.label}</span>
                  <span className={[
                    'text-[16px] font-bold',
                    selectedTier === tier.amount ? 'text-amber-400' : 'text-[#e8e8f0]',
                  ].join(' ')}>
                    ${tier.amount}
                  </span>
                  {selectedTier === tier.amount && (
                    <div className="absolute top-1.5 right-1.5 w-4 h-4 bg-amber-400 rounded-full
                                    flex items-center justify-center text-[9px] text-black font-bold">
                      ✓
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Optional message */}
            <input
              className="input text-[13px]"
              placeholder="ឈ្មោះ (ស្រេចចិត្ត)"
              value={donorName}
              onChange={e => setDonorName(e.target.value)}
            />
            <input
              className="input text-[13px]"
              placeholder="សារ (ស្រេចចិត្ត) — e.g. ស្នាមទឹកចិត្ត!"
              value={donorMsg}
              onChange={e => setDonorMsg(e.target.value)}
            />

            <button
              onClick={handleDonate}
              disabled={!selectedTier}
              className="btn btn-lg justify-center w-full
                         bg-gradient-to-r from-amber-600 to-amber-500
                         hover:from-amber-500 hover:to-amber-400
                         text-white border-none disabled:opacity-40"
            >
              ☕ ប៉ាវ​កាហ្វេ ${selectedTier ?? '?'} ឱ្យ Team!
            </button>

            <p className="text-[11px] text-[#606080] leading-relaxed">
              💡 ចំណាំ: បន្ទាប់ពី Scan QR ហើយ Transfer រួច
              សូម Screenshot ផ្ញើមក Telegram / Email ដើម្បី
              បញ្ជាក់ការបរិច្ចាគ។
            </p>
          </div>
        </div>

        {/* ── Thank you modal ── */}
        {showThank && (
          <div className="modal-overlay" onClick={() => setShowThank(false)}>
            <div className="modal max-w-[380px] text-center" onClick={e => e.stopPropagation()}>
              <div className="text-[64px] mb-3">🙏</div>
              <h2 className="text-[20px] font-bold text-amber-400 mb-2">
                អរគុណ​ច្រើន!
              </h2>
              <p className="text-[#9090b0] text-[14px] mb-1 leading-relaxed">
                {donorName ? `${donorName}, អ` : 'អ'}នក​បាន​ជ្រើស​ប៉ាវ​កាហ្វេ
                <span className="text-amber-400 font-bold"> ${selectedTier} </span>
                ឱ្យ Team!
              </p>
              {donorMsg && (
                <div className="bg-surface-700 border border-[#2a2a45] rounded-xl px-4 py-3 my-3
                                text-[13px] text-[#e8e8f0] italic">
                  "{donorMsg}"
                </div>
              )}
              <p className="text-[13px] text-[#9090b0] mb-5">
                សូម Scan KHQR ខាងលើ ដើម្បី Transfer ។<br />
                ការគាំទ្ររបស់អ្នក​ជួយ Khmer Developer យ៉ាងច្រើន! 🇰🇭
              </p>
              <button
                className="btn btn-primary btn-lg w-full justify-center"
                onClick={() => setShowThank(false)}
              >
                ✅ យល់ព្រម
              </button>
            </div>
          </div>
        )}

        {/* ── Supporters list ── */}
        <div className="card">
          <h3 className="text-[15px] font-semibold text-[#e8e8f0] mb-4 flex items-center gap-2">
            <span>🏆</span>
            <span>អ្នកគាំទ្រថ្មីៗ</span>
            <span className="badge badge-success ml-1">{SUPPORTERS.length}</span>
          </h3>
          <div className="flex flex-col gap-2">
            {SUPPORTERS.map((s, i) => (
              <div
                key={i}
                className="flex items-center gap-3 bg-surface-700 rounded-xl px-4 py-3
                           border border-[#2a2a45]"
              >
                <div className="w-9 h-9 rounded-full bg-amber-500/20 flex items-center
                                justify-center text-[18px] shrink-0">
                  ☕
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium text-[#e8e8f0]">{s.name}</div>
                  {s.msg && (
                    <div className="text-[12px] text-[#9090b0] truncate italic">"{s.msg}"</div>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[14px] font-bold text-amber-400">${s.amount}</div>
                  <div className="text-[11px] text-[#606080]">{s.date}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-[#2a2a45] flex items-center
                          justify-between text-[13px]">
            <span className="text-[#9090b0]">សរុបទទួលបាន</span>
            <span className="text-amber-400 font-bold text-[18px]">${totalRaised}</span>
          </div>
        </div>

        {/* ── Contact ── */}
        <div className="mt-6 text-center text-[12px] text-[#606080] space-y-1">
          <p>📧 support@khmerai.dev</p>
          <p>🌐 github.com/cm5722254-beep/AI-Agen-Kh</p>
          <p className="text-[11px] mt-2 text-[#404060]">
            Khmer AI Coding Agent — Open Source ❤️ Made in Cambodia 🇰🇭
          </p>
        </div>

      </div>
    </div>
  )
}
