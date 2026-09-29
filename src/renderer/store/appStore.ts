/**
 * Simple reactive store using React Context + useReducer
 * No external state library needed — keeps bundle lean
 */
import { createContext, useContext, useReducer, Dispatch } from 'react'
import type { UserPublic, ProjectInfo, AppSettings } from '../../shared/types'

export type AppView =
  | 'dashboard'
  | 'agent'
  | 'projects'
  | 'editor'
  | 'terminal'
  | 'server'
  | 'files'
  | 'preview'
  | 'apikeys'
  | 'usage'
  | 'settings'
  | 'admin'
  | 'profile'
  | 'khqr'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  type: ToastType
  message: string
}

export interface AppState {
  // Auth
  user: UserPublic | null
  token: string | null
  isAuthenticated: boolean
  isFirstRun: boolean

  // Navigation
  currentView: AppView
  activeProjectId: string | null
  activeFilePath: string | null

  // Projects
  projects: ProjectInfo[]

  // Settings
  settings: AppSettings | null

  // UI
  toasts: Toast[]
  isLoading: boolean
  sidebarCollapsed: boolean
}

export type AppAction =
  | { type: 'SET_AUTH'; payload: { user: UserPublic; token: string } }
  | { type: 'LOGOUT' }
  | { type: 'SET_FIRST_RUN'; payload: boolean }
  | { type: 'SET_VIEW'; payload: AppView }
  | { type: 'SET_ACTIVE_PROJECT'; payload: string | null }
  | { type: 'SET_ACTIVE_FILE'; payload: string | null }
  | { type: 'SET_PROJECTS'; payload: ProjectInfo[] }
  | { type: 'ADD_PROJECT'; payload: ProjectInfo }
  | { type: 'SET_SETTINGS'; payload: AppSettings }
  | { type: 'ADD_TOAST'; payload: Toast }
  | { type: 'REMOVE_TOAST'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'TOGGLE_SIDEBAR' }

const initialState: AppState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isFirstRun: false,
  currentView: 'dashboard',
  activeProjectId: null,
  activeFilePath: null,
  projects: [],
  settings: null,
  toasts: [],
  isLoading: false,
  sidebarCollapsed: false,
}

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_AUTH':
      return { ...state, user: action.payload.user, token: action.payload.token, isAuthenticated: true }
    case 'LOGOUT':
      return { ...initialState }
    case 'SET_FIRST_RUN':
      return { ...state, isFirstRun: action.payload }
    case 'SET_VIEW':
      return { ...state, currentView: action.payload }
    case 'SET_ACTIVE_PROJECT':
      return { ...state, activeProjectId: action.payload }
    case 'SET_ACTIVE_FILE':
      return { ...state, activeFilePath: action.payload }
    case 'SET_PROJECTS':
      return { ...state, projects: action.payload }
    case 'ADD_PROJECT':
      return { ...state, projects: [action.payload, ...state.projects] }
    case 'SET_SETTINGS':
      return { ...state, settings: action.payload }
    case 'ADD_TOAST':
      return { ...state, toasts: [...state.toasts, action.payload] }
    case 'REMOVE_TOAST':
      return { ...state, toasts: state.toasts.filter(t => t.id !== action.payload) }
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarCollapsed: !state.sidebarCollapsed }
    default:
      return state
  }
}

export const AppContext = createContext<{
  state: AppState
  dispatch: Dispatch<AppAction>
} | null>(null)

export function useAppState() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useAppState must be used within AppProvider')
  return ctx
}

export { initialState, reducer }
