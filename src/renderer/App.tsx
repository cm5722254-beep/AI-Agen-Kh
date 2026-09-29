import React, { useReducer, useEffect, useState } from 'react'
import { AppContext, initialState, reducer } from './store/appStore'
import { useApi } from './hooks/useApi'
import { IPC_CHANNELS } from '../shared/constants'

// Pages
import SetupPage from './pages/SetupPage'
import LoginPage from './pages/LoginPage'
import MainLayout from './components/layout/MainLayout'
import ToastContainer from './components/layout/ToastContainer'

export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState)
  const [booting, setBooting] = useState(true)

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      <AppInner booting={booting} setBooting={setBooting} />
      <ToastContainer />
    </AppContext.Provider>
  )
}

function AppInner({ booting, setBooting }: { booting: boolean; setBooting: (v: boolean) => void }) {
  const { state, dispatch } = React.useContext(AppContext)!
  const { invoke } = useApi()

  useEffect(() => {
    async function boot() {
      try {
        // Check if first run
        const firstRunRes = await invoke<boolean>(IPC_CHANNELS.AUTH_FIRST_RUN)
        if (firstRunRes.success && firstRunRes.data) {
          dispatch({ type: 'SET_FIRST_RUN', payload: true })
          setBooting(false)
          return
        }

        // Try to restore session from localStorage
        const savedToken = localStorage.getItem('auth_token')
        if (savedToken) {
          const sessionRes = await invoke(IPC_CHANNELS.AUTH_GET_CURRENT, savedToken)
          if (sessionRes.success && sessionRes.data) {
            dispatch({
              type: 'SET_AUTH',
              payload: { user: sessionRes.data as any, token: savedToken },
            })
            // Load settings
            const settingsRes = await invoke(IPC_CHANNELS.SETTINGS_GET)
            if (settingsRes.success && settingsRes.data) {
              dispatch({ type: 'SET_SETTINGS', payload: settingsRes.data as any })
            }
          } else {
            localStorage.removeItem('auth_token')
          }
        }
      } catch (err) {
        // Continue to login
      }
      setBooting(false)
    }
    boot()
  }, [])

  if (booting) {
    return (
      <div style={{
        height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#0f0f1a', flexDirection: 'column', gap: 16,
      }}>
        <div style={{ fontSize: 48 }}>🇰🇭</div>
        <div className="spinner" style={{ width: 32, height: 32 }} />
        <div style={{ color: '#9090b0', fontFamily: 'Noto Sans Khmer, sans-serif' }}>
          កំពុងចាប់ផ្តើម...
        </div>
      </div>
    )
  }

  if (state.isFirstRun) return <SetupPage />
  if (!state.isAuthenticated) return <LoginPage />
  return <MainLayout />
}
