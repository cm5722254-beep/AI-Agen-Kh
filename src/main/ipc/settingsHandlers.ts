import type { IpcMain } from 'electron'
import { getPrismaClient } from '../../core/database/client'
import { IPC_CHANNELS } from '../../shared/constants'
import type { IpcResponse, AppSettings } from '../../shared/types'

export function registerSettingsHandlers(ipcMain: IpcMain): void {
  ipcMain.handle(IPC_CHANNELS.SETTINGS_GET, async (): Promise<IpcResponse<AppSettings>> => {
    try {
      const db = getPrismaClient()
      const settings = await db.setting.findMany()
      const map: Record<string, string> = {}
      settings.forEach(s => (map[s.key] = s.value))

      const appSettings: AppSettings = {
        theme: (map.theme ?? 'dark') as 'dark' | 'light',
        language: (map.language ?? 'km') as 'km' | 'en',
        fontSize: Number(map.fontSize ?? 14),
        fontFamily: map.fontFamily ?? 'Noto Sans Khmer, Monospace',
        autoSave: map.autoSave === 'true',
        confirmDangerousCommands: map.confirmDangerousCommands !== 'false',
        maxTerminalHistory: Number(map.maxTerminalHistory ?? 1000),
        projectsDirectory: map.projectsDirectory ?? '',
        logLevel: (map.logLevel ?? 'INFO') as any,
      }

      return { success: true, data: appSettings }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle(IPC_CHANNELS.SETTINGS_SET, async (_e, key: string, value: string): Promise<IpcResponse> => {
    try {
      const db = getPrismaClient()
      await db.setting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      })
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })
}
