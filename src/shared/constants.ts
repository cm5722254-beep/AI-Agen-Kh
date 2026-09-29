// Shared constants

export const APP_NAME = 'Khmer AI Coding Agent'
export const APP_VERSION = '1.0.0'

export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  USER: 'USER',
} as const

export const SESSION_EXPIRE_HOURS = 24 * 7 // 7 days

export const DANGEROUS_COMMANDS = [
  'rm -rf',
  'del /f',
  'format',
  'mkfs',
  'dd if=',
  'DROP TABLE',
  'DROP DATABASE',
  'TRUNCATE',
  'shutdown',
  'poweroff',
  'reboot',
  ':(){:|:&};:',
]

export const DEFAULT_AI_PROVIDERS = [
  {
    name: 'nvidia',
    displayName: 'NVIDIA NIM',
    baseUrl: 'https://integrate.api.nvidia.com/v1',
    sortOrder: 1,
  },
  {
    name: 'openai',
    displayName: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    sortOrder: 2,
  },
  {
    name: 'anthropic',
    displayName: 'Anthropic Claude',
    baseUrl: 'https://api.anthropic.com',
    sortOrder: 3,
  },
  {
    name: 'google',
    displayName: 'Google Gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    sortOrder: 4,
  },
  {
    name: 'openrouter',
    displayName: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    sortOrder: 5,
  },
  {
    name: 'ollama',
    displayName: 'Ollama (Local)',
    baseUrl: 'http://localhost:11434/v1',
    sortOrder: 6,
  },
  {
    name: 'custom',
    displayName: 'Custom OpenAI-Compatible',
    baseUrl: '',
    sortOrder: 7,
  },
]

export const NVIDIA_MODELS = [
  { modelId: 'meta/llama-3.1-70b-instruct', displayName: 'Llama 3.1 70B Instruct', contextWindow: 131072 },
  { modelId: 'meta/llama-3.1-8b-instruct', displayName: 'Llama 3.1 8B Instruct', contextWindow: 131072 },
  { modelId: 'meta/llama-3.3-70b-instruct', displayName: 'Llama 3.3 70B Instruct', contextWindow: 131072 },
  { modelId: 'nvidia/llama-3.1-nemotron-70b-instruct', displayName: 'Nemotron 70B Instruct', contextWindow: 131072 },
  { modelId: 'mistralai/mixtral-8x7b-instruct-v0.1', displayName: 'Mixtral 8x7B Instruct', contextWindow: 32768 },
  { modelId: 'mistralai/mistral-7b-instruct-v0.3', displayName: 'Mistral 7B Instruct', contextWindow: 32768 },
  { modelId: 'microsoft/phi-3-mini-128k-instruct', displayName: 'Phi-3 Mini 128K', contextWindow: 131072 },
  { modelId: 'qwen/qwen2-7b-instruct', displayName: 'Qwen2 7B Instruct', contextWindow: 131072 },
  { modelId: 'deepseek-ai/deepseek-coder-6.7b-instruct', displayName: 'DeepSeek Coder 6.7B', contextWindow: 16384 },
]

export const DEFAULT_SETTINGS = {
  theme: 'dark',
  language: 'km',
  fontSize: 14,
  fontFamily: 'Noto Sans Khmer, Monospace',
  autoSave: true,
  confirmDangerousCommands: true,
  maxTerminalHistory: 1000,
  projectsDirectory: '',
  logLevel: 'INFO',
}

export const IPC_CHANNELS = {
  // Auth
  AUTH_LOGIN: 'auth:login',
  AUTH_REGISTER: 'auth:register',
  AUTH_LOGOUT: 'auth:logout',
  AUTH_GET_CURRENT: 'auth:getCurrent',
  AUTH_CHANGE_PASSWORD: 'auth:changePassword',
  AUTH_FIRST_RUN: 'auth:firstRun',

  // Projects
  PROJECTS_LIST: 'projects:list',
  PROJECTS_CREATE: 'projects:create',
  PROJECTS_DELETE: 'projects:delete',
  PROJECTS_RENAME: 'projects:rename',
  PROJECTS_GET: 'projects:get',
  PROJECTS_OPEN_DIALOG: 'projects:openDialog',

  // AI
  AI_CHAT: 'ai:chat',
  AI_CHAT_STREAM: 'ai:chatStream',
  AI_STOP: 'ai:stop',

  // Agent
  AGENT_RUN: 'agent:run',
  AGENT_APPROVE_TOOL: 'agent:approveTool',
  AGENT_DENY_TOOL: 'agent:denyTool',
  AGENT_STATUS: 'agent:status',

  // API Keys
  APIKEY_LIST: 'apikey:list',
  APIKEY_ADD: 'apikey:add',
  APIKEY_DELETE: 'apikey:delete',
  APIKEY_SET_DEFAULT: 'apikey:setDefault',
  PROVIDER_LIST: 'provider:list',
  MODEL_LIST: 'model:list',

  // Files
  FILES_LIST: 'files:list',
  FILES_READ: 'files:read',
  FILES_WRITE: 'files:write',
  FILES_DELETE: 'files:delete',
  FILES_CREATE_DIR: 'files:createDir',
  FILES_RENAME: 'files:rename',

  // Terminal
  TERMINAL_CREATE: 'terminal:create',
  TERMINAL_INPUT: 'terminal:input',
  TERMINAL_RESIZE: 'terminal:resize',
  TERMINAL_KILL: 'terminal:kill',
  TERMINAL_DATA: 'terminal:data',

  // Server
  SERVER_LIST: 'server:list',
  SERVER_START: 'server:start',
  SERVER_STOP: 'server:stop',
  SERVER_RESTART: 'server:restart',
  SERVER_STATUS: 'server:status',
  SERVER_LOGS: 'server:logs',

  // Usage
  USAGE_GET: 'usage:get',
  USAGE_SUMMARY: 'usage:summary',
  USAGE_CHART: 'usage:chart',

  // Admin
  ADMIN_USERS: 'admin:users',
  ADMIN_CREATE_USER: 'admin:createUser',
  ADMIN_UPDATE_USER: 'admin:updateUser',
  ADMIN_DELETE_USER: 'admin:deleteUser',
  ADMIN_SET_LIMIT: 'admin:setLimit',
  ADMIN_STATS: 'admin:stats',
  ADMIN_LOGS: 'admin:logs',

  // Settings
  SETTINGS_GET: 'settings:get',
  SETTINGS_SET: 'settings:set',

  // System
  SYSTEM_INFO: 'system:info',
  OPEN_EXTERNAL: 'system:openExternal',
  OPEN_PATH: 'system:openPath',
  SELECT_DIRECTORY: 'system:selectDirectory',
  APP_VERSION: 'system:version',
} as const
