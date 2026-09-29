import type { IpcMain } from 'electron'
import { getPrismaClient } from '../../core/database/client'
import { IPC_CHANNELS } from '../../shared/constants'
import type { IpcResponse, AdminStats, UserRole, UsageLimitInfo } from '../../shared/types'
import { hashPassword } from '../../core/security/password'
import { logger } from '../../core/logging/logger'

export function registerAdminHandlers(ipcMain: IpcMain): void {
  // List all users (Admin only — caller must verify role before calling)
  ipcMain.handle(IPC_CHANNELS.ADMIN_USERS, async (): Promise<IpcResponse> => {
    try {
      const db = getPrismaClient()
      const users = await db.user.findMany({
        orderBy: { createdAt: 'desc' },
        include: { usageLimit: true },
      })
      return {
        success: true,
        data: users.map(u => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          status: u.status,
          createdAt: u.createdAt.toISOString(),
          lastLogin: u.lastLogin?.toISOString(),
          usageLimit: u.usageLimit,
        })),
      }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle(IPC_CHANNELS.ADMIN_CREATE_USER, async (
    _e,
    data: { name: string; email: string; password: string; role: UserRole }
  ): Promise<IpcResponse> => {
    try {
      const db = getPrismaClient()
      const existing = await db.user.findUnique({ where: { email: data.email } })
      if (existing) return { success: false, error: 'អ៊ីម៉ែលត្រូវបានប្រើរួច' }

      const passwordHash = await hashPassword(data.password)
      const user = await db.user.create({
        data: { name: data.name, email: data.email, passwordHash, role: data.role, status: 'ACTIVE' },
      })
      await db.usageLimit.create({ data: { userId: user.id } })

      logger.info(`Admin created user: ${user.email}`)
      return { success: true, data: { id: user.id } }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle(IPC_CHANNELS.ADMIN_UPDATE_USER, async (
    _e,
    userId: string,
    updates: { name?: string; role?: UserRole; status?: string }
  ): Promise<IpcResponse> => {
    try {
      const db = getPrismaClient()
      await db.user.update({ where: { id: userId }, data: updates })
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle(IPC_CHANNELS.ADMIN_DELETE_USER, async (_e, userId: string): Promise<IpcResponse> => {
    try {
      const db = getPrismaClient()
      await db.user.update({ where: { id: userId }, data: { status: 'DISABLED' } })
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle(IPC_CHANNELS.ADMIN_SET_LIMIT, async (
    _e,
    userId: string,
    limits: UsageLimitInfo
  ): Promise<IpcResponse> => {
    try {
      const db = getPrismaClient()
      await db.usageLimit.upsert({
        where: { userId },
        update: limits,
        create: { userId, ...limits },
      })
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle(IPC_CHANNELS.ADMIN_STATS, async (): Promise<IpcResponse<AdminStats>> => {
    try {
      const db = getPrismaClient()
      const monthStart = new Date()
      monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0)

      const [
        totalUsers,
        activeUsers,
        totalProjects,
        monthlyUsage,
        monthlyReqs,
        errorLogs,
      ] = await Promise.all([
        db.user.count(),
        db.user.count({ where: { status: 'ACTIVE' } }),
        db.project.count({ where: { status: 'ACTIVE' } }),
        db.tokenUsage.aggregate({ where: { createdAt: { gte: monthStart } }, _sum: { totalTokens: true, totalCost: true } }),
        db.tokenUsage.count({ where: { createdAt: { gte: monthStart } } }),
        db.auditLog.count({ where: { category: 'ERROR', createdAt: { gte: monthStart } } }),
      ])

      return {
        success: true,
        data: {
          totalUsers,
          activeUsers,
          totalProjects,
          totalRequests: monthlyReqs,
          totalTokens: monthlyUsage._sum.totalTokens ?? 0,
          estimatedCost: monthlyUsage._sum.totalCost ?? 0,
          activeServers: 0, // Updated dynamically
          systemErrors: errorLogs,
        },
      }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle(IPC_CHANNELS.ADMIN_LOGS, async (_e, limit = 100): Promise<IpcResponse> => {
    try {
      const db = getPrismaClient()
      const logs = await db.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: { user: { select: { name: true, email: true } } },
      })
      return {
        success: true,
        data: logs.map(l => ({ ...l, createdAt: l.createdAt.toISOString() })),
      }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })
}
