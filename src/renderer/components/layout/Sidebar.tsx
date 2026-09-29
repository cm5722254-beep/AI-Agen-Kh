import React from 'react'
import { useAppState, AppView } from '../../store/appStore'

interface NavItem {
  view: AppView
  icon: string
  label: string
  adminOnly?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { view: 'dashboard', icon: '📊', label: 'ផ្ទាំងគ្រប់គ្រង' },
  { view: 'agent',     icon: '🤖', label: 'AI Agent' },
  { view: 'projects',  icon: '📁', label: 'គម្រោង' },
  { view: 'editor',    icon: '💻', label: 'Code Editor' },
  { view: 'files',     icon: '🗂️', label: 'ឯកសារ' },
  { view: 'terminal',  icon: '🖥️', label: 'ស្ថានីយ' },
  { view: 'server',    icon: '🌐', label: 'ម៉ាស៊ីនមេ' },
  { view: 'preview',   icon: '👁️', label: 'Preview' },
  { view: 'apikeys',   icon: '🔑', label: 'API Key' },
  { view: 'usage',     icon: '📈', label: 'Token Usage' },
  { view: 'settings',  icon: '⚙️', label: 'ការកំណត់' },
  { view: 'admin',     icon: '👑', label: 'Admin', adminOnly: true },
]

export default function Sidebar() {
  const { state, dispatch } = useAppState()
  const isAdmin = state.user?.role === 'SUPER_ADMIN' || state.user?.role === 'ADMIN'
  const collapsed = state.sidebarCollapsed
  const items = NAV_ITEMS.filter(item => !item.adminOnly || isAdmin)

  return (
    <aside
      className={[
        'flex flex-col bg-surface-800 border-r border-[#2a2a45] shrink-0 transition-all duration-150',
        collapsed ? 'w-[52px]' : 'w-[220px]',
      ].join(' ')}
    >
      {/* Logo */}
      <div className="h-[52px] flex items-center px-3 border-b border-[#2a2a45] gap-2.5 shrink-0">
        <span className="text-[22px] shrink-0">🇰🇭</span>
        {!collapsed && (
          <span className="text-[11px] font-bold text-primary-400 leading-tight">
            Khmer AI<br />Coding Agent
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2 px-1">
        {items.map(item => {
          const active = state.currentView === item.view
          return (
            <button
              key={item.view}
              onClick={() => dispatch({ type: 'SET_VIEW', payload: item.view })}
              title={collapsed ? item.label : undefined}
              className={[
                'nav-item',
                active ? 'active' : '',
                collapsed ? 'justify-center' : '',
              ].join(' ')}
            >
              <span className="text-base shrink-0">{item.icon}</span>
              {!collapsed && (
                <span className="truncate">{item.label}</span>
              )}
            </button>
          )
        })}
      </nav>

      {/* User profile */}
      {state.user && (
        <div className="border-t border-[#2a2a45] p-2">
          <button
            onClick={() => dispatch({ type: 'SET_VIEW', payload: 'profile' })}
            className={[
              'w-full flex items-center gap-2 p-1.5 rounded-lg bg-transparent border-none',
              'text-[#9090b0] text-xs cursor-pointer transition-colors duration-150',
              'hover:bg-surface-500',
              collapsed ? 'justify-center' : '',
            ].join(' ')}
          >
            {/* Avatar */}
            <span
              className="w-7 h-7 rounded-full bg-primary-500 flex items-center justify-center
                         text-[13px] text-white font-bold shrink-0"
            >
              {state.user.name.charAt(0).toUpperCase()}
            </span>
            {!collapsed && (
              <div className="overflow-hidden text-left">
                <div className="text-[#e8e8f0] font-medium text-[12px] truncate">
                  {state.user.name}
                </div>
                <div className="text-[11px] text-[#606080]">
                  {state.user.role === 'SUPER_ADMIN' ? '👑 Super Admin'
                   : state.user.role === 'ADMIN' ? '🔑 Admin'
                   : '👤 User'}
                </div>
              </div>
            )}
          </button>
        </div>
      )}
    </aside>
  )
}
