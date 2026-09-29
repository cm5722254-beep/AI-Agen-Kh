import type { IpcMain, BrowserWindow } from 'electron'
import { spawn, ChildProcess } from 'child_process'
import net from 'net'
import { getPrismaClient } from '../../core/database/client'
import { IPC_CHANNELS } from '../../shared/constants'
import type { IpcResponse, ServerProcessInfo } from '../../shared/types'
import { logger } from '../../core/logging/logger'
import treeKill from 'tree-kill'

// Runtime server process registry
const runningProcesses = new Map<string, {
  process: ChildProcess
  logs: string[]
  port?: number
}>()

async function isPortInUse(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer()
    server.once('error', () => resolve(true))
    server.once('listening', () => { server.close(); resolve(false) })
    server.listen(port)
  })
}

async function findFreePort(startPort: number): Promise<number> {
  let port = startPort
  while (await isPortInUse(port)) port++
  return port
}

export function registerServerHandlers(ipcMain: IpcMain, getWindow: () => BrowserWindow | null): void {
  ipcMain.handle(IPC_CHANNELS.SERVER_LIST, async (): Promise<IpcResponse> => {
    try {
      const db = getPrismaClient()
      const procs = await db.serverProcess.findMany({ orderBy: { createdAt: 'desc' }, take: 20 })
      const enriched: ServerProcessInfo[] = procs.map(p => {
        const running = runningProcesses.has(p.id)
        return {
          id: p.id,
          name: p.name,
          command: p.command,
          port: p.port ?? undefined,
          pid: p.pid ?? undefined,
          status: running ? 'RUNNING' : (p.status as any),
          startedAt: p.startedAt?.toISOString(),
          projectId: p.projectId ?? undefined,
          url: p.port ? `http://localhost:${p.port}` : undefined,
        }
      })
      return { success: true, data: enriched }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle(IPC_CHANNELS.SERVER_START, async (
    _e,
    config: { name: string; command: string; port?: number; cwd?: string; projectId?: string }
  ): Promise<IpcResponse> => {
    try {
      const db = getPrismaClient()
      const win = getWindow()

      // Check/find free port
      let port = config.port
      if (port) {
        const inUse = await isPortInUse(port)
        if (inUse) {
          port = await findFreePort(port)
          if (win) win.webContents.send('server:portChanged', { original: config.port, found: port })
        }
      }

      // Parse command
      const parts = config.command.split(' ')
      const cmd = parts[0]
      const args = parts.slice(1)

      const child = spawn(cmd, args, {
        cwd: config.cwd ?? process.cwd(),
        shell: true,
        env: { ...process.env, PORT: port ? String(port) : undefined },
      })

      const record = await db.serverProcess.create({
        data: {
          name: config.name,
          command: config.command,
          port,
          pid: child.pid,
          projectId: config.projectId,
          status: 'RUNNING',
          startedAt: new Date(),
        },
      })

      runningProcesses.set(record.id, { process: child, logs: [], port })

      child.stdout?.on('data', (data: Buffer) => {
        const text = data.toString()
        const entry = runningProcesses.get(record.id)
        if (entry) entry.logs.push(text)
        if (win) win.webContents.send(`server:log:${record.id}`, text)
      })

      child.stderr?.on('data', (data: Buffer) => {
        const text = data.toString()
        const entry = runningProcesses.get(record.id)
        if (entry) entry.logs.push(`[ERR] ${text}`)
        if (win) win.webContents.send(`server:log:${record.id}`, `[ERR] ${text}`)
      })

      child.on('exit', async (code) => {
        runningProcesses.delete(record.id)
        await db.serverProcess.update({
          where: { id: record.id },
          data: { status: code === 0 ? 'STOPPED' : 'ERROR', stoppedAt: new Date() },
        })
        if (win) win.webContents.send('server:statusChange', { id: record.id, status: code === 0 ? 'STOPPED' : 'ERROR' })
        logger.server(`Server ${config.name} exited with code ${code}`)
      })

      logger.server(`Server started: ${config.name} (PID ${child.pid})`)
      return { success: true, data: { id: record.id, port, pid: child.pid } }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle(IPC_CHANNELS.SERVER_STOP, async (_e, serverId: string): Promise<IpcResponse> => {
    try {
      const db = getPrismaClient()
      const entry = runningProcesses.get(serverId)
      if (!entry) return { success: false, error: 'Server មិនដំណើរការ' }

      await new Promise<void>((resolve) => {
        treeKill(entry.process.pid!, 'SIGTERM', (err) => {
          if (err) logger.error(`treeKill error: ${err.message}`)
          resolve()
        })
      })

      runningProcesses.delete(serverId)
      await db.serverProcess.update({
        where: { id: serverId },
        data: { status: 'STOPPED', stoppedAt: new Date() },
      })

      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle(IPC_CHANNELS.SERVER_LOGS, async (_e, serverId: string): Promise<IpcResponse> => {
    const entry = runningProcesses.get(serverId)
    const logs = entry?.logs ?? []
    return { success: true, data: logs }
  })

  ipcMain.handle(IPC_CHANNELS.SERVER_STATUS, async (_e, serverId: string): Promise<IpcResponse> => {
    const running = runningProcesses.has(serverId)
    return { success: true, data: { running } }
  })
}
