import type { IpcMain } from 'electron'
import { IPC_CHANNELS } from '../../shared/constants'
import type { IpcResponse } from '../../shared/types'
import { readFile, writeFile, deleteFile, createFolder, listFiles, renameFile } from '../../core/agent/tools/fileTools'

export function registerFileHandlers(ipcMain: IpcMain): void {
  ipcMain.handle(IPC_CHANNELS.FILES_LIST, async (_e, dirPath: string, recursive?: boolean): Promise<IpcResponse> => {
    try {
      const files = listFiles(dirPath, recursive ?? false)
      return { success: true, data: files }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle(IPC_CHANNELS.FILES_READ, async (_e, filePath: string): Promise<IpcResponse> => {
    try {
      const content = readFile(filePath)
      return { success: true, data: content }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle(IPC_CHANNELS.FILES_WRITE, async (_e, filePath: string, content: string): Promise<IpcResponse> => {
    try {
      writeFile(filePath, content)
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle(IPC_CHANNELS.FILES_DELETE, async (_e, filePath: string): Promise<IpcResponse> => {
    try {
      deleteFile(filePath)
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle(IPC_CHANNELS.FILES_CREATE_DIR, async (_e, dirPath: string): Promise<IpcResponse> => {
    try {
      createFolder(dirPath)
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle(IPC_CHANNELS.FILES_RENAME, async (_e, oldPath: string, newPath: string): Promise<IpcResponse> => {
    try {
      renameFile(oldPath, newPath)
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })
}
