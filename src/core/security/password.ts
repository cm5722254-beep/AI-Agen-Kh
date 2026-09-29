/**
 * Password hashing using Node.js built-in crypto.scrypt
 *
 * Algorithm: scrypt (memory-hard, CPU-hard — same security class as Argon2id)
 * Parameters match OWASP recommendations:
 *   N=32768 (2^15), r=8, p=1, keylen=64 bytes
 *
 * Format stored in DB:
 *   "scrypt:N:r:p:saltHex:hashHex"
 *
 * No native modules required — uses Node.js built-in crypto only.
 */
import crypto from 'crypto'
import { logger } from '../logging/logger'

// scrypt parameters (OWASP recommended minimums)
const SCRYPT_N = 32768  // CPU/memory cost
const SCRYPT_R = 8      // block size
const SCRYPT_P = 1      // parallelization
const KEY_LEN  = 64     // output length in bytes
const SALT_LEN = 32     // random salt length in bytes
const VERSION  = 'scrypt'

/**
 * Hash a plaintext password (async, non-blocking)
 */
export async function hashPassword(plaintext: string): Promise<string> {
  const salt = crypto.randomBytes(SALT_LEN)

  const hash = await new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(
      plaintext,
      salt,
      KEY_LEN,
      { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P },
      (err, derivedKey) => {
        if (err) reject(err)
        else resolve(derivedKey)
      }
    )
  })

  return `${VERSION}:${SCRYPT_N}:${SCRYPT_R}:${SCRYPT_P}:${salt.toString('hex')}:${hash.toString('hex')}`
}

/**
 * Verify a plaintext password against a stored hash
 * Timing-safe comparison to prevent timing attacks
 */
export async function verifyPassword(plaintext: string, stored: string): Promise<boolean> {
  try {
    const parts = stored.split(':')

    // Support legacy bcrypt hashes (starts with $2b$) during migration
    if (stored.startsWith('$2')) {
      logger.warn('Legacy bcrypt hash detected — user should reset password')
      // Cannot verify bcrypt without bcryptjs, reject old hashes
      return false
    }

    if (parts.length !== 6 || parts[0] !== VERSION) {
      logger.error('Invalid password hash format')
      return false
    }

    const [, N_str, r_str, p_str, saltHex, hashHex] = parts
    const N = parseInt(N_str)
    const r = parseInt(r_str)
    const p = parseInt(p_str)
    const salt = Buffer.from(saltHex, 'hex')
    const expectedHash = Buffer.from(hashHex, 'hex')

    const actualHash = await new Promise<Buffer>((resolve, reject) => {
      crypto.scrypt(
        plaintext,
        salt,
        KEY_LEN,
        { N, r, p },
        (err, derivedKey) => {
          if (err) reject(err)
          else resolve(derivedKey)
        }
      )
    })

    // Timing-safe comparison
    if (actualHash.length !== expectedHash.length) return false
    return crypto.timingSafeEqual(actualHash, expectedHash)
  } catch (err: any) {
    logger.error(`Password verify error: ${err.message}`)
    return false
  }
}

/**
 * Quick benchmark — log how long hashing takes on this machine
 */
export async function benchmarkHash(): Promise<void> {
  const start = Date.now()
  await hashPassword('benchmark-test-password-123')
  logger.info(`scrypt hash benchmark: ${Date.now() - start}ms`)
}
