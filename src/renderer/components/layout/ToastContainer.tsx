import React from 'react'
import { useAppState } from '../../store/appStore'

const ICONS: Record<string, string> = {
  success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️',
}

export default function ToastContainer() {
  const { state, dispatch } = useAppState()
  if (state.toasts.length === 0) return null

  return (
    <div className="toast-container">
      {state.toasts.map(toast => (
        <div key={toast.id} className={`toast toast-${toast.type}`}>
          <span className="shrink-0">{ICONS[toast.type]}</span>
          <span className="flex-1 text-[13px] text-[#e8e8f0]">{toast.message}</span>
          <button
            onClick={() => dispatch({ type: 'REMOVE_TOAST', payload: toast.id })}
            className="text-[#606080] hover:text-[#e8e8f0] bg-transparent border-none
                       cursor-pointer text-[14px] transition-colors shrink-0"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}
