import { getPrismaClient } from '../database/client'
import { generateToken } from '../security/crypto'
import { hashPassword, verifyPassword } from '../security/password'
import { logger } from '../logging/logger'
import type { AuthResult, LoginRequest, RegisterRequest, UserPublic, UserRole } from '../../shared/types'
import { SESSION_EXPIRE_HOURS } from '../../shared/constants'

function toUserPublic(user: any): UserPublic {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role as UserRole,
    status: user.status,
    createdAt: user.createdAt?.toISOString() ?? '',
    lastLogin: user.lastLogin?.toISOString(),
  }
}

export async function registerUser(req: RegisterRequest, requestingRole?: UserRole): Promise<AuthResult> {
  const db = getPrismaClient()

  // Validation
  const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRx.test(req.email)) {
    return { success: false, message: 'អ៊ីម៉ែលមិនត្រឹមត្រូវ' }
  }
  if (req.password.length < 8) {
    return { success: false, message: 'ពាក្យសម្ងាត់ត្រូវមានយ៉ាងហោចណាស់ 8 តួអក្សរ' }
  }
  if (req.name.trim().length < 2) {
    return { success: false, message: 'ឈ្មោះត្រូវមានយ៉ាងហោចណាស់ 2 តួអក្សរ' }
  }

  const existing = await db.user.findUnique({ where: { email: req.email.toLowerCase() } })
  if (existing) {
    return { success: false, message: 'អ៊ីម៉ែលនេះត្រូវបានប្រើរួចហើយ' }
  }

  // Hash password with scrypt (Argon2-equivalent, pure Node.js)
  const passwordHash = await hashPassword(req.password)

  // First ever user → SUPER_ADMIN
  const userCount = await db.user.count()
  const role: UserRole = userCount === 0 ? 'SUPER_ADMIN' : (req.role ?? 'USER')

  // Only SUPER_ADMIN can create ADMIN/SUPER_ADMIN roles
  if ((role === 'ADMIN' || role === 'SUPER_ADMIN') && requestingRole !== 'SUPER_ADMIN') {
    return { success: false, message: 'អ្នកមិនមានសិទ្ធិបង្កើត Admin ទេ' }
  }

  const user = await db.user.create({
    data: {
      name: req.name.trim(),
      email: req.email.toLowerCase(),
      passwordHash,
      role,
      status: 'ACTIVE',
    },
  })

  await db.usageLimit.create({ data: { userId: user.id } })

  logger.info(`User registered: ${user.email} (${role})`)

  const { token } = await createSession(user.id)
  return { success: true, user: toUserPublic(user), token }
}

export async function loginUser(req: LoginRequest): Promise<AuthResult> {
  const db = getPrismaClient()

  const user = await db.user.findUnique({ where: { email: req.email.toLowerCase() } })
  if (!user) {
    logger.security(`Failed login attempt for unknown email`)
    // Deliberate constant-time delay to prevent user enumeration
    await new Promise(r => setTimeout(r, 300))
    return { success: false, message: 'អ៊ីម៉ែល ឬ ពាក្យសម្ងាត់មិនត្រឹមត្រូវ' }
  }

  if (user.status === 'DISABLED') {
    return { success: false, message: 'គណនីនេះត្រូវបានបិទដំណើរការ។ សូមទាក់ទងអ្នកគ្រប់គ្រង' }
  }

  const valid = await verifyPassword(req.password, user.passwordHash)
  if (!valid) {
    logger.security(`Wrong password attempt for user: ${user.id}`)
    return { success: false, message: 'អ៊ីម៉ែល ឬ ពាក្យសម្ងាត់មិនត្រឹមត្រូវ' }
  }

  await db.user.update({
    where: { id: user.id },
    data: { lastLogin: new Date() },
  })

  const { token } = await createSession(user.id)

  logger.info(`User logged in: ${user.id}`)
  await createAuditLog(user.id, 'LOGIN', 'INFO')

  return { success: true, user: toUserPublic(user), token }
}

export async function validateSession(token: string): Promise<UserPublic | null> {
  const db = getPrismaClient()
  const session = await db.session.findUnique({
    where: { token },
    include: { user: true },
  })

  if (!session) return null
  if (session.expiresAt < new Date()) {
    await db.session.delete({ where: { id: session.id } })
    return null
  }
  if (session.user.status === 'DISABLED') return null

  return toUserPublic(session.user)
}

export async function logoutSession(token: string): Promise<void> {
  const db = getPrismaClient()
  await db.session.deleteMany({ where: { token } })
}

export async function changePassword(userId: string, oldPassword: string, newPassword: string): Promise<{ success: boolean; message?: string }> {
  const db = getPrismaClient()
  const user = await db.user.findUnique({ where: { id: userId } })
  if (!user) return { success: false, message: 'រកមិនឃើញអ្នកប្រើ' }

  const valid = await verifyPassword(oldPassword, user.passwordHash)
  if (!valid) return { success: false, message: 'ពាក្យសម្ងាត់ចាស់មិនត្រឹមត្រូវ' }

  if (newPassword.length < 8) return { success: false, message: 'ពាក្យសម្ងាត់ថ្មីត្រូវមានយ៉ាងហោចណាស់ 8 តួអក្សរ' }

  const passwordHash = await hashPassword(newPassword)
  await db.user.update({ where: { id: userId }, data: { passwordHash } })
  return { success: true }
}

export async function adminResetPassword(userId: string, newPassword: string): Promise<{ success: boolean; message?: string }> {
  const db = getPrismaClient()
  if (newPassword.length < 8) return { success: false, message: 'ពាក្យសម្ងាត់ត្រូវ 8 តួ+' }
  const passwordHash = await hashPassword(newPassword)
  await db.user.update({ where: { id: userId }, data: { passwordHash } })
  return { success: true }
}

export async function isFirstRun(): Promise<boolean> {
  const db = getPrismaClient()
  const count = await db.user.count()
  return count === 0
}

async function createSession(userId: string): Promise<{ token: string }> {
  const db = getPrismaClient()
  const token = generateToken(48)
  const expiresAt = new Date(Date.now() + SESSION_EXPIRE_HOURS * 60 * 60 * 1000)

  await db.session.create({
    data: { userId, token, expiresAt },
  })

  return { token }
}

export async function createAuditLog(
  userId: string | null,
  action: string,
  category: string,
  details?: string
): Promise<void> {
  try {
    const db = getPrismaClient()
    await db.auditLog.create({
      data: {
        userId: userId ?? undefined,
        action,
        category,
        details,
      },
    })
  } catch {
    // Audit log failure should never crash the app
  }
}
