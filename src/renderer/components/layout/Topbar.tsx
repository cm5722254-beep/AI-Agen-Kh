import React from 'react'
import { useAppState } from '../../store/appStore'
import { useApi } from '../../hooks/useApi'
import { useToast } from '../../hooks/useToast'
import { IPC_CHANNELS } from '../../../shared/constants'

const VIEW_TITLES: Record<string, string> = {
  dashboard: 'ផ្ទាំងគ្រប់គ្រង',
  agent:     'AI Agent',
  projects:  'គម្រោងរបស់ខ្ញុំ',
  editor:    'Code Editor',
  files:     'ឯកសារ',
  terminal:  'ស្ថានីយ',
  server:    'ម៉ាស៊ីនមេ',
  preview:   'Live Preview',
  apikeys:   'API Key',
  usage:     'Token Usage',
  settings:  'ការកំណត់',
  admin:     'Admin Dashboard',
  profile:   'គណនីរបស់ខ្ញុំ',
  khqr:      '☕ ប៉ាវ​កាហ្វេ​ Team — KHQR',
}

export default function Topbar() {
  const { state, dispatch } = useAppState()
  const { invoke } = useApi()
  const toast = useToast()

  async function handleLogout() {
    if (state.token) await invoke(IPC_CHANNELS.AUTH_LOGOUT, state.token)
    localStorage.removeItem('auth_token')
    dispatch({ type: 'LOGOUT' })
    toast.info('បានចេញពីគណនី')
  }

  const activeProject = state.projects.find(p => p.id === state.activeProjectId)

  return (
    <header className="h-[52px] flex items-center gap-3 px-4
                       bg-surface-800 border-b border-[#2a2a45] shrink-0">
      {/* Sidebar toggle */}
      <button
        onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
        className="btn btn-ghost btn-sm text-base px-2"
        title="Toggle Sidebar"
      >
        ☰
      </button>

      {/* Title */}
      <h2 className="text-[15px] font-semibold flex-1 text-[#e8e8f0]">
        {VIEW_TITLES[state.currentView] ?? state.currentView}
      </h2>

      {/* Active project badge */}
      {activeProject && (
        <div className="flex items-center gap-1.5 bg-surface-600 border border-[#2a2a45]
                        rounded-lg px-2.5 py-1 text-[12px] text-[#9090b0]">
          <span>📁</span>
          <span className="max-w-[160px] truncate">{activeProject.name}</span>
        </div>
      )}

      {/* User + logout */}
      <div className="flex items-center gap-2">
        <span className="text-[13px] text-[#9090b0] hidden sm:block">
          {state.user?.name}
        </span>
        <button
          onClick={handleLogout}
          className="btn btn-ghost btn-sm text-[14px]"
          title="ចេញ"
        >
          🚪
        </button>
      </div>
    </header>
  )
}
