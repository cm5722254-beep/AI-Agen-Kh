import crypto from 'crypto'
import path from 'path'
import fs from 'fs'

const KEY_FILE = 'encryption.key'
const ALGORITHM = 'aes-256-gcm'

function getKeyFilePath(): string {
  try {
    const { app } = require('electron')
    const userDataPath = app.getPath('userData')
    return path.join(userDataPath, KEY_FILE)
  } catch {
    const dataDir = path.join(process.cwd(), 'data')
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })
    return path.join(dataDir, KEY_FILE)
  }
}

function loadOrGenerateKey(): Buffer {
  const keyPath = getKeyFilePath()
  if (fs.existsSync(keyPath)) {
    const hex = fs.readFileSync(keyPath, 'utf-8').trim()
    return Buffer.from(hex, 'hex')
  }
  // Generate a new 32-byte key
  const key = crypto.randomBytes(32)
  fs.writeFileSync(keyPath, key.toString('hex'), { encoding: 'utf-8', mode: 0o600 })
  return key
}

let _encKey: Buffer | null = null

function getEncKey(): Buffer {
  if (!_encKey) {
    _encKey = loadOrGenerateKey()
  }
  return _encKey
}

/**
 * Encrypt a plaintext string (e.g. API Key)
 * Returns hex-encoded: iv:authTag:ciphertext
 */
export function encrypt(plaintext: string): string {
  const key = getEncKey()
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  let encrypted = cipher.update(plaintext, 'utf-8', 'hex')
  encrypted += cipher.final('hex')
  const authTag = cipher.getAuthTag().toString('hex')
  return `${iv.toString('hex')}:${authTag}:${encrypted}`
}

/**
 * Decrypt a previously encrypted string
 */
export function decrypt(encryptedData: string): string {
  const key = getEncKey()
  const parts = encryptedData.split(':')
  if (parts.length !== 3) throw new Error('Invalid encrypted data format')
  const [ivHex, authTagHex, ciphertext] = parts
  const iv = Buffer.from(ivHex, 'hex')
  const authTag = Buffer.from(authTagHex, 'hex')
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)
  let decrypted = decipher.update(ciphertext, 'hex', 'utf-8')
  decrypted += decipher.final('utf-8')
  return decrypted
}

/**
 * Get a display hint from an API key (shows type prefix + last 4 chars)
 */
export function getKeyHint(apiKey: string): string {
  if (apiKey.length <= 8) return '••••'
  const last4 = apiKey.slice(-4)
  // Detect prefix type
  if (apiKey.startsWith('sk-')) return `sk-••••••••${last4}`
  if (apiKey.startsWith('nvapi-')) return `nvapi-••••••••${last4}`
  if (apiKey.startsWith('sk-ant-')) return `sk-ant-••••••${last4}`
  return `••••••••••••${last4}`
}

/**
 * Generate a secure random token
 */
export function generateToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('hex')
}
