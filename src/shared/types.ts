// =============================================================
// Shared Types — used by both main process and renderer
// =============================================================

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'USER'
export type UserStatus = 'ACTIVE' | 'DISABLED'
export type ProjectStatus = 'ACTIVE' | 'ARCHIVED'
export type ServerStatus = 'RUNNING' | 'STOPPED' | 'ERROR'
export type LogCategory = 'INFO' | 'WARNING' | 'ERROR' | 'SECURITY' | 'AI' | 'SERVER' | 'DATABASE'

// ---- Auth ----
export interface UserPublic {
  id: string
  name: string
  email: string
  role: UserRole
  status: UserStatus
  createdAt: string
  lastLogin?: string
}

export interface AuthResult {
  success: boolean
  user?: UserPublic
  token?: string
  message?: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  name: string
  email: string
  password: string
  role?: UserRole
}

// ---- Projects ----
export interface ProjectInfo {
  id: string
  userId: string
  name: string
  description?: string
  path: string
  framework?: string
  language?: string
  status: ProjectStatus
  createdAt: string
  updatedAt: string
}

export interface CreateProjectRequest {
  name: string
  description?: string
  path: string
  framework?: string
  language?: string
}

// ---- AI Providers ----
export interface ApiProviderInfo {
  id: string
  name: string
  displayName: string
  baseUrl: string
  isActive: boolean
  sortOrder: number
}

export interface ApiKeyInfo {
  id: string
  providerId: string
  name: string
  keyHint: string
  isDefault: boolean
  isActive: boolean
  createdAt: string
}

export interface AddApiKeyRequest {
  providerId: string
  name: string
  apiKey: string
  isDefault?: boolean
}

export interface AiModelInfo {
  id: string
  providerId: string
  modelId: string
  displayName: string
  contextWindow: number
  inputCostPer1k?: number
  outputCostPer1k?: number
}

// ---- AI Chat ----
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
  tokens?: number
}

export interface AiRequestOptions {
  apiKeyId: string
  modelId: string
  messages: ChatMessage[]
  temperature?: number
  maxTokens?: number
  stream?: boolean
  projectId?: string
}

export interface AiStreamChunk {
  type: 'delta' | 'done' | 'error'
  content?: string
  usage?: TokenUsageSummary
  error?: string
}

export interface TokenUsageSummary {
  inputTokens: number
  outputTokens: number
  totalTokens: number
  inputCost?: number
  outputCost?: number
  totalCost?: number
  isEstimated: boolean
}

// ---- Agent ----
export type AgentToolName =
  | 'read_file'
  | 'write_file'
  | 'edit_file'
  | 'delete_file'
  | 'create_folder'
  | 'list_files'
  | 'search_code'
  | 'run_command'
  | 'install_package'
  | 'start_server'
  | 'stop_server'
  | 'get_server_status'
  | 'git_status'
  | 'git_diff'
  | 'git_commit'

export interface AgentToolCall {
  id: string
  tool: AgentToolName
  args: Record<string, unknown>
  requiresConfirmation: boolean
  status: 'pending' | 'approved' | 'denied' | 'running' | 'done' | 'error'
  result?: unknown
}

export interface AgentStatus {
  phase: string
  message: string
  isRunning: boolean
}

// ---- Token Usage ----
export interface TokenUsageRecord {
  id: string
  userId: string
  modelId: string
  provider: string
  inputTokens: number
  outputTokens: number
  totalTokens: number
  inputCost?: number
  outputCost?: number
  totalCost?: number
  isEstimated: boolean
  createdAt: string
  projectId?: string
}

export interface UsageSummary {
  dailyTokens: number
  monthlyTokens: number
  dailyRequests: number
  monthlyRequests: number
  estimatedDailyCost: number
  estimatedMonthlyCost: number
}

export interface UsageLimitInfo {
  dailyTokenLimit?: number
  monthlyTokenLimit?: number
  dailyRequestLimit?: number
  monthlyRequestLimit?: number
}

// ---- Server Manager ----
export interface ServerProcessInfo {
  id: string
  name: string
  command: string
  port?: number
  pid?: number
  status: ServerStatus
  startedAt?: string
  projectId?: string
  url?: string
  cpuUsage?: number
  memoryUsage?: number
}

// ---- File System ----
export interface FileNode {
  name: string
  path: string
  type: 'file' | 'directory'
  children?: FileNode[]
  size?: number
  extension?: string
  modifiedAt?: string
}

// ---- IPC ----
export interface IpcResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  code?: string
}

// ---- Settings ----
export interface AppSettings {
  theme: 'dark' | 'light'
  language: 'km' | 'en'
  fontSize: number
  fontFamily: string
  autoSave: boolean
  confirmDangerousCommands: boolean
  maxTerminalHistory: number
  projectsDirectory: string
  logLevel: LogCategory
}

// ---- Admin ----
export interface AdminStats {
  totalUsers: number
  activeUsers: number
  totalProjects: number
  totalRequests: number
  totalTokens: number
  estimatedCost: number
  activeServers: number
  systemErrors: number
}
