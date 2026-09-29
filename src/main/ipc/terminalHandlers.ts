/**
 * Terminal Handler
 * Uses node-pty if available (requires build tools), otherwise falls back
 * to a spawn-based pseudo-terminal compatible with xterm.js
 */
import type { IpcMain, BrowserWindow } from 'electron'
import { spawn, ChildProcessWithoutNullStreams } from 'child_process'
import { IPC_CHANNELS } from '../../shared/constants'
import { logger } from '../../core/logging/logger'

interface TerminalSession {
  process: ChildProcessWithoutNullStreams
  inputBuffer: string[]
}

const terminals = new Map<string, TerminalSession>()

export function registerTerminalHandlers(ipcMain: IpcMain, getWindow: () => BrowserWindow | null): void {
  ipcMain.handle(IPC_CHANNELS.TERMINAL_CREATE, (_e, id: string, cwd?: string): { success: boolean; error?: string } => {
    try {
      const shell = process.platform === 'win32' ? 'powershell.exe' : 'bash'
      const args = process.platform === 'win32' ? ['-NoLogo'] : []

      const child = spawn(shell, args, {
        cwd: cwd ?? process.env.USERPROFILE ?? process.env.HOME ?? '/',
        env: { ...process.env, TERM: 'xterm-256color' },
        stdio: ['pipe', 'pipe', 'pipe'],
        windowsHide: false,
      }) as ChildProcessWithoutNullStreams

      terminals.set(id, { process: child, inputBuffer: [] })

      const win = getWindow()

      child.stdout.on('data', (data: Buffer) => {
        win?.webContents.send(`${IPC_CHANNELS.TERMINAL_DATA}:${id}`, data.toString())
      })

      child.stderr.on('data', (data: Buffer) => {
        win?.webContents.send(`${IPC_CHANNELS.TERMINAL_DATA}:${id}`, data.toString())
      })

      child.on('exit', (code) => {
        terminals.delete(id)
        win?.webContents.send(`terminal:exit:${id}`, code)
        logger.info(`Terminal ${id} exited with code ${code}`)
      })

      child.on('error', (err) => {
        win?.webContents.send(`${IPC_CHANNELS.TERMINAL_DATA}:${id}`, `\r\n[ERROR] ${err.message}\r\n`)
      })

      logger.info(`Terminal created: ${id} (${shell})`)
      return { success: true }
    } catch (err: any) {
      logger.error(`Terminal create error: ${err.message}`)
      return { success: false, error: err.message }
    }
  })

  ipcMain.on(IPC_CHANNELS.TERMINAL_INPUT, (_e, id: string, data: string) => {
    const term = terminals.get(id)
    if (term && term.process.stdin.writable) {
      term.process.stdin.write(data)
    }
  })

  ipcMain.handle(IPC_CHANNELS.TERMINAL_RESIZE, (_e, _id: string, _cols: number, _rows: number): void => {
    // Resize not supported without node-pty, ignore gracefully
  })

  ipcMain.handle(IPC_CHANNELS.TERMINAL_KILL, (_e, id: string): void => {
    const term = terminals.get(id)
    if (term) {
      term.process.kill()
      terminals.delete(id)
    }
  })
}
