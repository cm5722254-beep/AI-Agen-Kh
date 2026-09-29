import type { IpcMain } from 'electron'
import { getPrismaClient } from '../../core/database/client'
import { IPC_CHANNELS } from '../../shared/constants'
import type { IpcResponse, UsageSummary } from '../../shared/types'

export function registerUsageHandlers(ipcMain: IpcMain): void {
  ipcMain.handle(IPC_CHANNELS.USAGE_SUMMARY, async (_e, userId: string): Promise<IpcResponse<UsageSummary>> => {
    try {
      const db = getPrismaClient()
      const today = new Date(); today.setHours(0, 0, 0, 0)
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)

      const [dailyAgg, monthlyAgg, dailyReqCount, monthlyReqCount] = await Promise.all([
        db.tokenUsage.aggregate({ where: { userId, createdAt: { gte: today } }, _sum: { totalTokens: true, totalCost: true } }),
        db.tokenUsage.aggregate({ where: { userId, createdAt: { gte: monthStart } }, _sum: { totalTokens: true, totalCost: true } }),
        db.tokenUsage.count({ where: { userId, createdAt: { gte: today } } }),
        db.tokenUsage.count({ where: { userId, createdAt: { gte: monthStart } } }),
      ])

      return {
        success: true,
        data: {
          dailyTokens: dailyAgg._sum.totalTokens ?? 0,
          monthlyTokens: monthlyAgg._sum.totalTokens ?? 0,
          dailyRequests: dailyReqCount,
          monthlyRequests: monthlyReqCount,
          estimatedDailyCost: dailyAgg._sum.totalCost ?? 0,
          estimatedMonthlyCost: monthlyAgg._sum.totalCost ?? 0,
        },
      }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle(IPC_CHANNELS.USAGE_GET, async (_e, userId: string, days: number = 30): Promise<IpcResponse> => {
    try {
      const db = getPrismaClient()
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      const records = await db.tokenUsage.findMany({
        where: { userId, createdAt: { gte: since } },
        orderBy: { createdAt: 'desc' },
        take: 500,
      })
      return {
        success: true,
        data: records.map(r => ({ ...r, createdAt: r.createdAt.toISOString() })),
      }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle(IPC_CHANNELS.USAGE_CHART, async (_e, userId: string, days: number = 7): Promise<IpcResponse> => {
    try {
      const db = getPrismaClient()
      const chartData: Array<{ date: string; tokens: number; cost: number; requests: number }> = []

      for (let i = days - 1; i >= 0; i--) {
        const dayStart = new Date()
        dayStart.setHours(0, 0, 0, 0)
        dayStart.setDate(dayStart.getDate() - i)
        const dayEnd = new Date(dayStart)
        dayEnd.setDate(dayEnd.getDate() + 1)

        const [agg, count] = await Promise.all([
          db.tokenUsage.aggregate({
            where: { userId, createdAt: { gte: dayStart, lt: dayEnd } },
            _sum: { totalTokens: true, totalCost: true },
          }),
          db.tokenUsage.count({ where: { userId, createdAt: { gte: dayStart, lt: dayEnd } } }),
        ])

        chartData.push({
          date: dayStart.toISOString().split('T')[0],
          tokens: agg._sum.totalTokens ?? 0,
          cost: agg._sum.totalCost ?? 0,
          requests: count,
        })
      }

      return { success: true, data: chartData }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })
}
