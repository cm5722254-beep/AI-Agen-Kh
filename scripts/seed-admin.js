/**
 * 🔐 Admin Seeder Script
 * Seeds the SUPER_ADMIN account for Khmer AI Coding Agent
 *
 * Usage (run AFTER the Electron app has initialized the DB at least once):
 *   node scripts/seed-admin.js
 *
 * Or for a fresh install (before first run):
 *   node scripts/seed-admin.js --fresh
 *
 * This script directly uses Node.js crypto (same scrypt parameters as app)
 * so it does NOT require the Electron app to be running.
 */

const { PrismaClient } = require('@prisma/client')
const crypto = require('crypto')
const path = require('path')
const os = require('os')
const fs = require('fs')

// ─── Admin credentials ────────────────────────────────────────────────────────
const ADMIN_EMAIL    = 'cm5722254@gmail.com'
const ADMIN_PASSWORD = '@Iam_Cheatm2'
const ADMIN_NAME     = 'Super Admin'
const ADMIN_ROLE     = 'SUPER_ADMIN'

// ─── scrypt parameters (MUST match password.ts) ──────────────────────────────
const SCRYPT_N = 32768
const SCRYPT_R = 8
const SCRYPT_P = 1
const KEY_LEN  = 64
const SALT_LEN = 32

async function hashPassword(plaintext) {
  const salt = crypto.randomBytes(SALT_LEN)
  const hash = await new Promise((resolve, reject) => {
    crypto.scrypt(plaintext, salt, KEY_LEN, { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P }, (err, key) => {
      if (err) reject(err); else resolve(key)
    })
  })
  return `scrypt:${SCRYPT_N}:${SCRYPT_R}:${SCRYPT_P}:${salt.toString('hex')}:${hash.toString('hex')}`
}

async function main() {
  // Determine DB path (same logic as client.ts)
  // On Windows the Electron userData path is %APPDATA%\khmer-ai-coding-agent
  const platform = process.platform
  let userDataPath

  if (platform === 'win32') {
    userDataPath = path.join(process.env.APPDATA || os.homedir(), 'khmer-ai-coding-agent')
  } else if (platform === 'darwin') {
    userDataPath = path.join(os.homedir(), 'Library', 'Application Support', 'khmer-ai-coding-agent')
  } else {
    userDataPath = path.join(os.homedir(), '.config', 'khmer-ai-coding-agent')
  }

  // If userData doesn't exist yet, fall back to local data dir
  if (!fs.existsSync(userDataPath)) {
    console.log(`[seed-admin] userData not found at ${userDataPath}`)
    console.log('[seed-admin] Creating local ./data directory instead...')
    userDataPath = path.join(process.cwd(), 'data')
    fs.mkdirSync(userDataPath, { recursive: true })
  }

  const dbPath = path.join(userDataPath, 'khmer-ai.db')
  process.env.DATABASE_URL = `file:${dbPath}`
  console.log(`[seed-admin] Using database: ${dbPath}`)

  const prisma = new PrismaClient()

  try {
    // Ensure tables exist
    await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "users" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "name" TEXT NOT NULL,
      "email" TEXT NOT NULL UNIQUE,
      "password_hash" TEXT NOT NULL,
      "role" TEXT NOT NULL DEFAULT 'USER',
      "status" TEXT NOT NULL DEFAULT 'ACTIVE',
      "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "last_login" DATETIME
    )`)

    await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "usage_limits" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "user_id" TEXT NOT NULL UNIQUE,
      "daily_token_limit" INTEGER,
      "monthly_token_limit" INTEGER,
      "daily_request_limit" INTEGER,
      "monthly_request_limit" INTEGER,
      "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY ("user_id") REFERENCES "users"("id")
    )`)

    // Check if admin already exists
    const existing = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } })

    if (existing) {
      console.log(`[seed-admin] ⚠️  User already exists: ${ADMIN_EMAIL} (role: ${existing.role})`)

      if (existing.role !== ADMIN_ROLE) {
        // Upgrade to SUPER_ADMIN
        await prisma.user.update({
          where: { email: ADMIN_EMAIL },
          data: { role: ADMIN_ROLE, status: 'ACTIVE' },
        })
        console.log(`[seed-admin] ✅ Upgraded ${ADMIN_EMAIL} to ${ADMIN_ROLE}`)
      } else {
        // Update password
        const passwordHash = await hashPassword(ADMIN_PASSWORD)
        await prisma.user.update({
          where: { email: ADMIN_EMAIL },
          data: { passwordHash, status: 'ACTIVE' },
        })
        console.log(`[seed-admin] ✅ Updated password for ${ADMIN_EMAIL}`)
      }
    } else {
      // Create SUPER_ADMIN
      console.log(`[seed-admin] 🔐 Hashing password (this may take ~1s)...`)
      const passwordHash = await hashPassword(ADMIN_PASSWORD)

      const { v4: uuidv4 } = require('uuid')
      const userId = uuidv4()

      await prisma.$executeRawUnsafe(
        `INSERT INTO "users" ("id","name","email","password_hash","role","status","created_at","updated_at")
         VALUES (?,?,?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`,
        userId, ADMIN_NAME, ADMIN_EMAIL.toLowerCase(), passwordHash, ADMIN_ROLE, 'ACTIVE'
      )

      await prisma.$executeRawUnsafe(
        `INSERT INTO "usage_limits" ("id","user_id","updated_at") VALUES (?,?,CURRENT_TIMESTAMP)`,
        uuidv4(), userId
      )

      console.log(`[seed-admin] ✅ SUPER_ADMIN created successfully!`)
      console.log(`[seed-admin]    Email   : ${ADMIN_EMAIL}`)
      console.log(`[seed-admin]    Password: ${ADMIN_PASSWORD}`)
      console.log(`[seed-admin]    Role    : ${ADMIN_ROLE}`)
    }

    console.log('\n[seed-admin] 🎉 Done! You can now log in with the above credentials.')
  } catch (err) {
    console.error('[seed-admin] ❌ Error:', err.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
