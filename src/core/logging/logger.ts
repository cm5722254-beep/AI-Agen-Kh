import electronLog from 'electron-log'
import path from 'path'

// Configure electron-log
electronLog.transports.file.level = 'info'
electronLog.transports.console.level = process.env.NODE_ENV === 'development' ? 'debug' : 'warn'

// Never log secrets
const SECRET_PATTERNS = [
  /api[_-]?key["\s]*[:=]["\s]*[\w-]+/gi,
  /password["\s]*[:=]["\s]*[\w-]+/gi,
  /secret["\s]*[:=]["\s]*[\w-]+/gi,
  /token["\s]*[:=]["\s]*[\w-]+/gi,
  /Bearer\s+[\w.-]+/gi,
  /sk-[\w-]{20,}/gi,
  /nvapi-[\w-]{20,}/gi,
]

function redactSecrets(message: string): string {
  let result = message
  for (const pattern of SECRET_PATTERNS) {
    result = result.replace(pattern, '[REDACTED]')
  }
  return result
}

export const logger = {
  info: (msg: string, ...args: unknown[]) => {
    electronLog.info(redactSecrets(msg), ...args)
  },
  warn: (msg: string, ...args: unknown[]) => {
    electronLog.warn(redactSecrets(msg), ...args)
  },
  error: (msg: string, ...args: unknown[]) => {
    electronLog.error(redactSecrets(msg), ...args)
  },
  debug: (msg: string, ...args: unknown[]) => {
    electronLog.debug(redactSecrets(msg), ...args)
  },
  security: (msg: string, ...args: unknown[]) => {
    electronLog.warn(`[SECURITY] ${redactSecrets(msg)}`, ...args)
  },
  ai: (msg: string, ...args: unknown[]) => {
    electronLog.info(`[AI] ${redactSecrets(msg)}`, ...args)
  },
  server: (msg: string, ...args: unknown[]) => {
    electronLog.info(`[SERVER] ${redactSecrets(msg)}`, ...args)
  },
  db: (msg: string, ...args: unknown[]) => {
    electronLog.debug(`[DB] ${redactSecrets(msg)}`, ...args)
  },
}

export default logger
