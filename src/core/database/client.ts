import { PrismaClient } from '@prisma/client'
import path from 'path'
import fs from 'fs'
import { logger } from '../logging/logger'

// Safe import of electron app — works in both main process and tests
function getApp() {
  try {
    const { app } = require('electron')
    return app
  } catch {
    return null
  }
}

let prisma: PrismaClient | null = null

export function getDatabasePath(): string {
  const electronApp = getApp()
  const userDataPath = electronApp ? electronApp.getPath('userData') : path.join(process.cwd(), 'data')
  if (!fs.existsSync(userDataPath)) {
    fs.mkdirSync(userDataPath, { recursive: true })
  }
  return path.join(userDataPath, 'khmer-ai.db')
}

export function getPrismaClient(): PrismaClient {
  if (prisma) return prisma

  const dbPath = getDatabasePath()

  process.env.DATABASE_URL = `file:${dbPath}`

  prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development'
      ? [{ emit: 'event', level: 'query' }]
      : [],
  })

  return prisma
}

export async function disconnectDatabase(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect()
    prisma = null
  }
}

export async function initDatabase(): Promise<void> {
  const client = getPrismaClient()
  try {
    // Run migrations via programmatic API
    const { execSync } = require('child_process')
    const prismaPath = path.join(process.cwd(), 'node_modules', '.bin', 'prisma')
    const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma')

    // Use migrate deploy for production, migrate dev for dev
    const cmd = process.env.NODE_ENV === 'development'
      ? `"${prismaPath}" migrate dev --schema="${schemaPath}" --name=init --skip-seed`
      : `"${prismaPath}" migrate deploy --schema="${schemaPath}"`

    execSync(cmd, { stdio: 'pipe', env: { ...process.env, DATABASE_URL: `file:${getDatabasePath()}` } })
    logger.info('Database migrated successfully')
  } catch (err: any) {
    // If migration fails (already migrated or no migrations), try db push
    try {
      const { execSync } = require('child_process')
      const prismaPath = path.join(process.cwd(), 'node_modules', '.bin', 'prisma')
      const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma')
      execSync(`"${prismaPath}" db push --schema="${schemaPath}" --skip-generate`, {
        stdio: 'pipe',
        env: { ...process.env, DATABASE_URL: `file:${getDatabasePath()}` }
      })
      logger.info('Database schema pushed successfully')
    } catch (pushErr: any) {
      logger.error(`Database init error: ${pushErr.message}`)
      // Continue — tables may already exist
    }
  }

  // Seed default data
  await seedDefaults(client)
}

async function seedDefaults(client: PrismaClient): Promise<void> {
  // Seed default AI providers
  const { DEFAULT_AI_PROVIDERS, NVIDIA_MODELS, DEFAULT_SETTINGS } = await import('../../shared/constants')

  for (const prov of DEFAULT_AI_PROVIDERS) {
    const existing = await client.apiProvider.findFirst({ where: { name: prov.name } })
    if (!existing) {
      const created = await client.apiProvider.create({
        data: {
          name: prov.name,
          displayName: prov.displayName,
          baseUrl: prov.baseUrl,
          sortOrder: prov.sortOrder,
        },
      })
      // Seed NVIDIA models
      if (prov.name === 'nvidia') {
        for (const model of NVIDIA_MODELS) {
          await client.aiModel.create({
            data: {
              providerId: created.id,
              modelId: model.modelId,
              displayName: model.displayName,
              contextWindow: model.contextWindow,
            },
          })
        }
      }
    }
  }

  // Seed default settings
  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    const existing = await client.setting.findUnique({ where: { key } })
    if (!existing) {
      await client.setting.create({
        data: { key, value: String(value), category: 'general' },
      })
    }
  }
}
