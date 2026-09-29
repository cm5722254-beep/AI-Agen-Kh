import { contextBridge, ipcRenderer } from 'electron'
import type { IPC_CHANNELS } from '../shared/constants'

type Channel = typeof IPC_CHANNELS[keyof typeof IPC_CHANNELS]

// Expose a safe, typed API to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  invoke: (channel: Channel, ...args: unknown[]) => ipcRenderer.invoke(channel, ...args),
  on: (channel: Channel, listener: (...args: unknown[]) => void) => {
    ipcRenderer.on(channel, (_event, ...args) => listener(...args))
    return () => ipcRenderer.removeListener(channel, listener as any)
  },
  once: (channel: Channel, listener: (...args: unknown[]) => void) => {
    ipcRenderer.once(channel, (_event, ...args) => listener(...args))
  },
  removeListener: (channel: Channel, listener: (...args: unknown[]) => void) => {
    ipcRenderer.removeListener(channel, listener as any)
  },
  removeAllListeners: (channel: Channel) => {
    ipcRenderer.removeAllListeners(channel)
  },
  send: (channel: Channel, ...args: unknown[]) => {
    ipcRenderer.send(channel, ...args)
  },
})
