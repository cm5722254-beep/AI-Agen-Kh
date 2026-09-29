/**
 * Hook to call Electron IPC from renderer
 */
import { useCallback } from 'react'
import type { IpcResponse } from '../../shared/types'

declare global {
  interface Window {
    electronAPI: {
      invoke: (channel: string, ...args: unknown[]) => Promise<unknown>
      on: (channel: string, listener: (...args: unknown[]) => void) => () => void
      once: (channel: string, listener: (...args: unknown[]) => void) => void
      removeListener: (channel: string, listener: (...args: unknown[]) => void) => void
      removeAllListeners: (channel: string) => void
      send: (channel: string, ...args: unknown[]) => void
    }
  }
}

export function useApi() {
  const invoke = useCallback(async <T = unknown>(channel: string, ...args: unknown[]): Promise<IpcResponse<T>> => {
    try {
      const result = await window.electronAPI.invoke(channel, ...args) as IpcResponse<T>
      return result
    } catch (err: any) {
      return { success: false, error: err.message ?? 'Unknown error' }
    }
  }, [])

  const on = useCallback((channel: string, listener: (...args: unknown[]) => void) => {
    return window.electronAPI.on(channel, listener)
  }, [])

  const send = useCallback((channel: string, ...args: unknown[]) => {
    window.electronAPI.send(channel, ...args)
  }, [])

  return { invoke, on, send }
}
