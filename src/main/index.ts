import { app, BrowserWindow, ipcMain, shell, dialog } from 'electron'
import path from 'path'
import os from 'os'
import { initDatabase } from '../core/database/client'
import { logger } from '../core/logging/logger'
import { registerAuthHandlers } from './ipc/authHandlers'
import { registerProjectHandlers } from './ipc/projectHandlers'
import { registerAiHandlers } from './ipc/aiHandlers'
import { registerFileHandlers } from './ipc/fileHandlers'
import { registerServerHandlers, restartServer } from './ipc/serverHandlers'
import { registerUsageHandlers } from './ipc/usageHandlers'
import { registerAdminHandlers } from './ipc/adminHandlers'
import { registerSettingsHandlers } from './ipc/settingsHandlers'
import { registerTerminalHandlers } from './ipc/terminalHandlers'
import { IPC_CHANNELS } from '../shared/constants'

let mainWindow: BrowserWindow | null = null

const isDev = process.env.NODE_ENV === 'development'

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'Khmer AI Coding Agent',
    icon: path.join(__dirname, '../../resources/icon.ico'),
    frame: true,
    show: false,
    backgroundColor: '#0f0f1a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: true,
      allowRunningInsecureContent: false,
    },
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow!.show()
    mainWindow!.focus()
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  // Security: prevent navigation to external URLs
  mainWindow.webContents.on('will-navigate', (event, url) => {
    const parsedUrl = new URL(url)
    if (parsedUrl.origin !== 'http://localhost:5173' && !url.startsWith('file://')) {
      event.preventDefault()
      logger.security(`Blocked navigation to: ${url}`)
    }
  })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })
}

app.whenReady().then(async () => {
  logger.info('App starting...')

  try {
    await initDatabase()
    logger.info('Database initialized')
  } catch (err: any) {
    logger.error(`Database init failed: ${err.message}`)
  }

  // Register all IPC handlers
  registerAuthHandlers(ipcMain)
  registerProjectHandlers(ipcMain)
  registerAiHandlers(ipcMain, () => mainWindow)
  registerFileHandlers(ipcMain)
  registerServerHandlers(ipcMain, () => mainWindow)
  registerUsageHandlers(ipcMain)
  registerAdminHandlers(ipcMain)
  registerSettingsHandlers(ipcMain)
  registerTerminalHandlers(ipcMain, () => mainWindow)

  // System handlers
  ipcMain.handle(IPC_CHANNELS.OPEN_EXTERNAL, (_e, url: string) => {
    shell.openExternal(url)
  })

  ipcMain.handle(IPC_CHANNELS.OPEN_PATH, (_e, filePath: string) => {
    shell.openPath(filePath)
  })

  ipcMain.handle(IPC_CHANNELS.SELECT_DIRECTORY, async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory', 'createDirectory'],
      title: 'ជ្រើសរើស Folder',
    })
    return result.filePaths[0] ?? null
  })

  ipcMain.handle(IPC_CHANNELS.APP_VERSION, () => app.getVersion())

  // ── SYSTEM_INFO handler ──────────────────────────────────────────────────
  ipcMain.handle(IPC_CHANNELS.SYSTEM_INFO, async () => {
    return {
      platform:      process.platform,          // 'win32' | 'darwin' | 'linux'
      arch:          process.arch,              // 'x64' | 'arm64' etc.
      hostname:      os.hostname(),
      cpus:          os.cpus().length,
      totalMemMB:    Math.round(os.totalmem() / 1024 / 1024),
      freeMemMB:     Math.round(os.freemem()  / 1024 / 1024),
      nodeVersion:   process.versions.node,
      electronVersion: process.versions.electron,
      appVersion:    app.getVersion(),
      userDataPath:  app.getPath('userData'),
      documentsPath: app.getPath('documents'),
    }
  })

  // ── SERVER_RESTART handler ───────────────────────────────────────────────
  ipcMain.handle(IPC_CHANNELS.SERVER_RESTART, async (_e, serverId: string) => {
    try {
      const result = await restartServer(serverId, mainWindow)
      return result
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', () => {
  logger.info('App shutting down')
})

// Security: content security policy
app.on('web-contents-created', (_event, contents) => {
  contents.on('will-navigate', (navEvent, url) => {
    if (!url.startsWith('http://localhost:5173') && !url.startsWith('file://')) {
      navEvent.preventDefault()
      logger.security(`Blocked navigation to: ${url}`)
    }
  })
})
