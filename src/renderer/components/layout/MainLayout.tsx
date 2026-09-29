import React from 'react'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import { useAppState } from '../../store/appStore'

// Views
import DashboardView from '../dashboard/DashboardView'
import AgentView from '../agent/AgentView'
import ProjectsView from '../../pages/ProjectsPage'
import EditorView from '../editor/EditorView'
import FilesView from '../files/FilesView'
import TerminalView from '../terminal/TerminalView'
import ServerView from '../server/ServerView'
import PreviewView from '../preview/PreviewView'
import ApiKeysView from '../settings/ApiKeysView'
import UsageView from '../usage/UsageView'
import SettingsView from '../settings/SettingsView'
import AdminView from '../admin/AdminView'
import ProfileView from '../../pages/ProfilePage'

const VIEW_MAP: Record<string, React.ReactNode> = {}

export default function MainLayout() {
  const { state } = useAppState()

  function renderView() {
    switch (state.currentView) {
      case 'dashboard': return <DashboardView />
      case 'agent': return <AgentView />
      case 'projects': return <ProjectsView />
      case 'editor': return <EditorView />
      case 'files': return <FilesView />
      case 'terminal': return <TerminalView />
      case 'server': return <ServerView />
      case 'preview': return <PreviewView />
      case 'apikeys': return <ApiKeysView />
      case 'usage': return <UsageView />
      case 'settings': return <SettingsView />
      case 'admin': return <AdminView />
      case 'profile': return <ProfileView />
      default: return <DashboardView />
    }
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Topbar />
        <main style={{ flex: 1, overflow: 'auto', background: 'var(--bg-primary)' }}>
          {renderView()}
        </main>
      </div>
    </div>
  )
}
