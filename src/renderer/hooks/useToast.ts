import { useCallback } from 'react'
import { v4 as uuid } from 'uuid'
import { useAppState } from '../store/appStore'

export function useToast() {
  const { dispatch } = useAppState()

  const show = useCallback((message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info', duration = 4000) => {
    const id = uuid()
    dispatch({ type: 'ADD_TOAST', payload: { id, type, message } })
    setTimeout(() => dispatch({ type: 'REMOVE_TOAST', payload: id }), duration)
  }, [dispatch])

  const success = useCallback((msg: string) => show(msg, 'success'), [show])
  const error = useCallback((msg: string) => show(msg, 'error', 6000), [show])
  const warning = useCallback((msg: string) => show(msg, 'warning'), [show])
  const info = useCallback((msg: string) => show(msg, 'info'), [show])

  return { show, success, error, warning, info }
}
