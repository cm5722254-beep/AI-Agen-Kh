/**
 * Database client — Prisma + SQLite
 *
 * PRODUCTION FIX 1: Use dynamic require() for PrismaClient so we can set
 * PRISMA_QUERY_ENGINE_LIBRARY *before* the native module is loaded.
 * Static `import` is hoisted and runs before any code — too late to set env vars.
 *
 * PRODUCTION FIX 2: In a packaged Electron app, the prisma CLI binary
 * is not accessible via execSync. Instead we use Prisma's programmatic
 * $executeRawUnsafe to run CREATE TABLE IF NOT EXISTS statements directly.
 */
import path from 'path'
import fs from 'fs'
import { logger } from '../logging/logger'

// PrismaClient type only — no runtime import at module load time
type PrismaClientType = import('@prisma/client').PrismaClient

let prisma: PrismaClientType | null = null

function getApp() {
  try {
    const { app } = require('electron')
    return app
  } catch {
    return null
  }
}

export function getDatabasePath(): string {
  const electronApp = getApp()
  const userDataPath = electronApp
    ? electronApp.getPath('userData')
    : path.join(process.cwd(), 'data')
  if (!fs.existsSync(userDataPath)) {
    fs.mkdirSync(userDataPath, { recursive: true })
  }
  return path.join(userDataPath, 'khmer-ai.db')
}

export function getPrismaClient(): PrismaClientType {
  if (prisma) return prisma

  // ── Step 1: Set DATABASE_URL ─────────────────────────────────────────────
  const dbPath = getDatabasePath()
  process.env.DATABASE_URL = `file:${dbPath}`

  // ── Step 2: Point Prisma at the unpacked native engine BEFORE require() ──
  // In packaged Electron, process.resourcesPath points to the resources/ dir.
  // The asarUnpack config extracts my-prisma-client to app.asar.unpacked/.
  const resourcesPath: string | undefined = (process as any).resourcesPath
  if (resourcesPath) {
    const engineFile =
      process.platform === 'win32'
        ? 'query_engine-windows.dll.node'
        : process.platform === 'darwin'
          ? 'libquery_engine-darwin.dylib.node'
          : 'libquery_engine-linux-musl.so.node'

    const enginePath = path.join(
      resourcesPath,
      'app.asar.unpacked',
      'node_modules',
      'my-prisma-client',
      engineFile
    )
    process.env.PRISMA_QUERY_ENGINE_LIBRARY = enginePath
    logger.info(`[DB] Prisma engine → ${enginePath}`)
  }

  // ── Step 3: Require PrismaClient AFTER env vars are set ──────────────────
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { PrismaClient } = require('my-prisma-client')
  prisma = new PrismaClient()
  return prisma!
}

export async function disconnectDatabase(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect()
    prisma = null
  }
}

// ─── DDL statements executed directly via $executeRawUnsafe ───────────────────
// This replaces execSync('prisma migrate deploy') which fails in packaged app.
const DDL_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL UNIQUE,
    "password_hash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_login" DATETIME
  )`,
  `CREATE TABLE IF NOT EXISTS "sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL UNIQUE,
    "expires_at" DATETIME NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip_address" TEXT,
    "user_agent" TEXT,
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "api_providers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "base_url" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT 1,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS "api_keys" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "provider_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "encrypted_key" TEXT NOT NULL,
    "key_hint" TEXT NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT 1,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("provider_id") REFERENCES "api_providers"("id")
  )`,
  `CREATE TABLE IF NOT EXISTS "ai_models" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "provider_id" TEXT NOT NULL,
    "model_id" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "context_window" INTEGER NOT NULL DEFAULT 4096,
    "input_cost_per_1k" REAL,
    "output_cost_per_1k" REAL,
    "is_active" BOOLEAN NOT NULL DEFAULT 1,
    FOREIGN KEY ("provider_id") REFERENCES "api_providers"("id")
  )`,
  `CREATE TABLE IF NOT EXISTS "projects" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "path" TEXT NOT NULL,
    "framework" TEXT,
    "language" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("user_id") REFERENCES "users"("id")
  )`,
  `CREATE TABLE IF NOT EXISTS "token_usage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "api_key_id" TEXT,
    "project_id" TEXT,
    "model_id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "input_tokens" INTEGER NOT NULL,
    "output_tokens" INTEGER NOT NULL,
    "total_tokens" INTEGER NOT NULL,
    "input_cost" REAL,
    "output_cost" REAL,
    "total_cost" REAL,
    "is_estimated" BOOLEAN NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("user_id") REFERENCES "users"("id"),
    FOREIGN KEY ("api_key_id") REFERENCES "api_keys"("id")
  )`,
  `CREATE TABLE IF NOT EXISTS "usage_limits" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL UNIQUE,
    "daily_token_limit" INTEGER,
    "monthly_token_limit" INTEGER,
    "daily_request_limit" INTEGER,
    "monthly_request_limit" INTEGER,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("user_id") REFERENCES "users"("id")
  )`,
  `CREATE TABLE IF NOT EXISTS "server_processes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "project_id" TEXT,
    "name" TEXT NOT NULL,
    "command" TEXT NOT NULL,
    "port" INTEGER,
    "pid" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'STOPPED',
    "started_at" DATETIME,
    "stopped_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("project_id") REFERENCES "projects"("id")
  )`,
  `CREATE TABLE IF NOT EXISTS "settings" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "value" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general',
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS "audit_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT,
    "action" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'INFO',
    "details" TEXT,
    "ip_address" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("user_id") REFERENCES "users"("id")
  )`,
  // Indexes for performance
  `CREATE INDEX IF NOT EXISTS "idx_sessions_token"      ON "sessions"("token")`,
  `CREATE INDEX IF NOT EXISTS "idx_sessions_user"       ON "sessions"("user_id")`,
  `CREATE INDEX IF NOT EXISTS "idx_token_usage_user"    ON "token_usage"("user_id", "created_at")`,
  `CREATE INDEX IF NOT EXISTS "idx_audit_logs_category" ON "audit_logs"("category", "created_at")`,
]

export async function initDatabase(): Promise<void> {
  const client = getPrismaClient()

  // Execute DDL directly — works in both dev and packaged production
  for (const sql of DDL_STATEMENTS) {
    try {
      await client.$executeRawUnsafe(sql)
    } catch (err: any) {
      // "already exists" is fine — log only real errors
      if (!err.message?.includes('already exists')) {
        logger.error(`DDL error: ${err.message} — SQL: ${sql.slice(0, 80)}`)
      }
    }
  }

  logger.info('Database schema ensured (direct DDL)')
  await seedDefaults(client)
}

async function seedDefaults(client: PrismaClientType): Promise<void> {
  const { DEFAULT_AI_PROVIDERS, NVIDIA_MODELS, DEFAULT_SETTINGS } = await import('../../shared/constants')

  // Seed AI providers
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

  // ── Auto-seed SUPER_ADMIN on first install ───────────────────────────────
  await seedSuperAdmin(client)

  // ── Auto-seed NVIDIA API key ─────────────────────────────────────────────
  await seedNvidiaApiKey(client)
}

/**
 * Seeds the SUPER_ADMIN account on first run (when no users exist).
 * Uses scrypt (same as password.ts) — no external dependencies.
 */
async function seedSuperAdmin(client: PrismaClientType): Promise<void> {
  try {
    const userCount = await client.user.count()
    if (userCount > 0) return  // Users already exist — skip

    const { hashPassword } = await import('../security/password')
    const { v4: uuidv4 } = await import('uuid')

    const ADMIN_EMAIL    = 'cm5722254@gmail.com'
    const ADMIN_PASSWORD = '@Iam_Cheatm2'
    const ADMIN_NAME     = 'Super Admin'

    logger.info('First run detected — seeding SUPER_ADMIN account...')

    const passwordHash = await hashPassword(ADMIN_PASSWORD)
    const userId = uuidv4()

    await client.$executeRawUnsafe(
      `INSERT INTO "users" ("id","name","email","password_hash","role","status","created_at","updated_at")
       VALUES (?,?,?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`,
      userId, ADMIN_NAME, ADMIN_EMAIL.toLowerCase(), passwordHash, 'SUPER_ADMIN', 'ACTIVE'
    )

    await client.$executeRawUnsafe(
      `INSERT INTO "usage_limits" ("id","user_id","updated_at") VALUES (?,?,CURRENT_TIMESTAMP)`,
      uuidv4(), userId
    )

    logger.info(`SUPER_ADMIN seeded: ${ADMIN_EMAIL}`)
  } catch (err: any) {
    // Seed failure should never crash the app
    logger.error(`seedSuperAdmin failed: ${err.message}`)
  }
}

/**
 * Auto-seeds the NVIDIA NIM API key on first install.
 * Key is AES-256-GCM encrypted before storage — same path as user-added keys.
 */
async function seedNvidiaApiKey(client: PrismaClientType): Promise<void> {
  try {
    // Find the NVIDIA provider
    const nvidiaProvider = await client.apiProvider.findFirst({ where: { name: 'nvidia' } })
    if (!nvidiaProvider) {
      logger.warn('seedNvidiaApiKey: nvidia provider not found — skipping')
      return
    }

    // Check if we already seeded (key hint matches)
    const existing = await client.apiKey.findFirst({
      where: { providerId: nvidiaProvider.id, keyHint: { contains: 'ulZ' } },
    })
    if (existing) {
      logger.info('NVIDIA API key already seeded — skipping')
      return
    }

    const { encrypt, getKeyHint } = await import('../security/crypto')
    const { v4: uuidv4 } = await import('uuid')

    const NVIDIA_API_KEY = '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'

    const encryptedKey = encrypt(NVIDIA_API_KEY)
    const keyHint      = getKeyHint(NVIDIA_API_KEY)

    // Clear any existing default for nvidia
    await client.apiKey.updateMany({
      where: { providerId: nvidiaProvider.id },
      data: { isDefault: false },
    })

    await client.$executeRawUnsafe(
      `INSERT INTO "api_keys" ("id","provider_id","name","encrypted_key","key_hint","is_default","is_active","created_at","updated_at")
       VALUES (?,?,?,?,?,1,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`,
      uuidv4(), nvidiaProvider.id, 'NVIDIA NIM (Default)', encryptedKey, keyHint
    )

    logger.info(`NVIDIA API key seeded: ${keyHint}`)
  } catch (err: any) {
    logger.error(`seedNvidiaApiKey failed: ${err.message}`)
  }
}
