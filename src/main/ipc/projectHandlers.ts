import type { IpcMain } from 'electron'
import { getPrismaClient } from '../../core/database/client'
import { IPC_CHANNELS } from '../../shared/constants'
import type { CreateProjectRequest, IpcResponse } from '../../shared/types'
import fs from 'fs'
import path from 'path'
import { app, dialog } from 'electron'
import { logger } from '../../core/logging/logger'

function getDefaultProjectsDir(): string {
  return path.join(app.getPath('documents'), 'KhmerAI-Projects')
}

export function registerProjectHandlers(ipcMain: IpcMain): void {
  ipcMain.handle(IPC_CHANNELS.PROJECTS_LIST, async (_e, userId: string): Promise<IpcResponse> => {
    try {
      const db = getPrismaClient()
      const projects = await db.project.findMany({
        where: { userId, status: 'ACTIVE' },
        orderBy: { updatedAt: 'desc' },
      })
      return { success: true, data: projects.map(p => ({ ...p, createdAt: p.createdAt.toISOString(), updatedAt: p.updatedAt.toISOString() })) }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle(IPC_CHANNELS.PROJECTS_CREATE, async (_e, userId: string, req: CreateProjectRequest): Promise<IpcResponse> => {
    try {
      const db = getPrismaClient()

      // Create physical directory
      const projectDir = req.path || path.join(getDefaultProjectsDir(), req.name.replace(/[^a-zA-Z0-9-_]/g, '-'))
      if (!fs.existsSync(projectDir)) {
        fs.mkdirSync(projectDir, { recursive: true })
      }

      const project = await db.project.create({
        data: {
          userId,
          name: req.name,
          description: req.description,
          path: projectDir,
          framework: req.framework,
          language: req.language,
        },
      })

      logger.info(`Project created: ${project.name} at ${projectDir}`)
      return { success: true, data: { ...project, createdAt: project.createdAt.toISOString(), updatedAt: project.updatedAt.toISOString() } }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle(IPC_CHANNELS.PROJECTS_GET, async (_e, projectId: string): Promise<IpcResponse> => {
    try {
      const db = getPrismaClient()
      const project = await db.project.findUnique({ where: { id: projectId } })
      if (!project) return { success: false, error: 'Project រកមិនឃើញ' }
      return { success: true, data: { ...project, createdAt: project.createdAt.toISOString(), updatedAt: project.updatedAt.toISOString() } }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle(IPC_CHANNELS.PROJECTS_DELETE, async (_e, projectId: string): Promise<IpcResponse> => {
    try {
      const db = getPrismaClient()
      await db.project.update({ where: { id: projectId }, data: { status: 'ARCHIVED' } })
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle(IPC_CHANNELS.PROJECTS_RENAME, async (_e, projectId: string, newName: string): Promise<IpcResponse> => {
    try {
      const db = getPrismaClient()
      await db.project.update({ where: { id: projectId }, data: { name: newName } })
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle(IPC_CHANNELS.PROJECTS_OPEN_DIALOG, async (): Promise<IpcResponse> => {
    try {
      const result = await dialog.showOpenDialog({
        properties: ['openDirectory'],
        title: 'បើក Project Folder',
      })
      if (result.canceled || !result.filePaths[0]) {
        return { success: false, error: 'cancelled' }
      }
      return { success: true, data: { path: result.filePaths[0] } }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })
}
