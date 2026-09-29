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
import KhqrPage from '../admin/KhqrPage'
import ProfileView from '../../pages/ProfilePage'

export default function MainLayout() {
  const { state } = useAppState()

  function renderView() {
    switch (state.currentView) {
      case 'dashboard': return <DashboardView />
      case 'agent':     return <AgentView />
      case 'projects':  return <ProjectsView />
      case 'editor':    return <EditorView />
      case 'files':     return <FilesView />
      case 'terminal':  return <TerminalView />
      case 'server':    return <ServerView />
      case 'preview':   return <PreviewView />
      case 'apikeys':   return <ApiKeysView />
      case 'usage':     return <UsageView />
      case 'settings':  return <SettingsView />
      case 'admin':     return <AdminView />
      case 'khqr':      return <KhqrPage />
      case 'profile':   return <ProfileView />
      default:          return <DashboardView />
    }
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-auto bg-surface-900">
          {renderView()}
        </main>
      </div>
    </div>
  )
}
