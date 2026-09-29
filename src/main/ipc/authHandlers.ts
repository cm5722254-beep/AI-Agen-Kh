import type { IpcMain } from 'electron'
import {
  loginUser, registerUser, logoutSession,
  validateSession, changePassword, isFirstRun,
} from '../../core/auth/authService'
import { IPC_CHANNELS } from '../../shared/constants'
import type { IpcResponse, LoginRequest, RegisterRequest } from '../../shared/types'
import { logger } from '../../core/logging/logger'

export function registerAuthHandlers(ipcMain: IpcMain): void {
  ipcMain.handle(IPC_CHANNELS.AUTH_FIRST_RUN, async (): Promise<boolean> => {
    return isFirstRun()
  })

  ipcMain.handle(IPC_CHANNELS.AUTH_LOGIN, async (_e, req: LoginRequest): Promise<IpcResponse> => {
    try {
      const result = await loginUser(req)
      return { success: result.success, data: result, error: result.message }
    } catch (err: any) {
      logger.error(`Login error: ${err.message}`)
      return { success: false, error: 'មានបញ្ហាក្នុងការ Login' }
    }
  })

  ipcMain.handle(IPC_CHANNELS.AUTH_REGISTER, async (_e, req: RegisterRequest): Promise<IpcResponse> => {
    try {
      const result = await registerUser(req)
      return { success: result.success, data: result, error: result.message }
    } catch (err: any) {
      logger.error(`Register error: ${err.message}`)
      return { success: false, error: 'មានបញ្ហាក្នុងការ Register' }
    }
  })

  ipcMain.handle(IPC_CHANNELS.AUTH_LOGOUT, async (_e, token: string): Promise<IpcResponse> => {
    try {
      await logoutSession(token)
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle(IPC_CHANNELS.AUTH_GET_CURRENT, async (_e, token: string): Promise<IpcResponse> => {
    try {
      const user = await validateSession(token)
      if (!user) return { success: false, error: 'Session expired' }
      return { success: true, data: user }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle(IPC_CHANNELS.AUTH_CHANGE_PASSWORD, async (_e, userId: string, oldPw: string, newPw: string): Promise<IpcResponse> => {
    try {
      const result = await changePassword(userId, oldPw, newPw)
      return { success: result.success, error: result.message }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })
}
