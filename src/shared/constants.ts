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
  // ── Llama 3.x ────────────────────────────────────────────────────────────
  { modelId: 'meta/llama-3.1-405b-instruct',            displayName: 'Llama 3.1 405B Instruct',          contextWindow: 131072 },
  { modelId: 'meta/llama-3.1-70b-instruct',             displayName: 'Llama 3.1 70B Instruct',           contextWindow: 131072 },
  { modelId: 'meta/llama-3.1-8b-instruct',              displayName: 'Llama 3.1 8B Instruct',            contextWindow: 131072 },
  { modelId: 'meta/llama-3.3-70b-instruct',             displayName: 'Llama 3.3 70B Instruct',           contextWindow: 131072 },
  { modelId: 'meta/llama-3.2-90b-vision-instruct',      displayName: 'Llama 3.2 90B Vision',             contextWindow: 131072 },
  { modelId: 'meta/llama-3.2-11b-vision-instruct',      displayName: 'Llama 3.2 11B Vision',             contextWindow: 131072 },
  { modelId: 'meta/llama-3.2-3b-instruct',              displayName: 'Llama 3.2 3B Instruct',            contextWindow: 131072 },
  { modelId: 'meta/llama-3.2-1b-instruct',              displayName: 'Llama 3.2 1B Instruct',            contextWindow: 131072 },
  { modelId: 'meta/llama3-70b-instruct',                displayName: 'Llama 3 70B Instruct',             contextWindow: 8192  },
  { modelId: 'meta/llama3-8b-instruct',                 displayName: 'Llama 3 8B Instruct',              contextWindow: 8192  },
  { modelId: 'meta/codellama-70b',                      displayName: 'CodeLlama 70B',                    contextWindow: 100000 },

  // ── NVIDIA Nemotron ───────────────────────────────────────────────────────
  { modelId: 'nvidia/llama-3.1-nemotron-70b-instruct',  displayName: 'Nemotron 70B Instruct',            contextWindow: 131072 },
  { modelId: 'nvidia/llama-3.1-nemotron-51b-instruct',  displayName: 'Nemotron 51B Instruct',            contextWindow: 131072 },
  { modelId: 'nvidia/nemotron-4-340b-instruct',         displayName: 'Nemotron-4 340B Instruct',         contextWindow: 4096  },
  { modelId: 'nvidia/nemotron-mini-4b-instruct',        displayName: 'Nemotron Mini 4B',                 contextWindow: 4096  },

  // ── Mistral / Mixtral ─────────────────────────────────────────────────────
  { modelId: 'mistralai/mixtral-8x22b-instruct-v0.1',   displayName: 'Mixtral 8x22B Instruct',           contextWindow: 65536 },
  { modelId: 'mistralai/mixtral-8x7b-instruct-v0.1',    displayName: 'Mixtral 8x7B Instruct',            contextWindow: 32768 },
  { modelId: 'mistralai/mistral-large',                 displayName: 'Mistral Large',                    contextWindow: 131072 },
  { modelId: 'mistralai/mistral-nemo',                  displayName: 'Mistral Nemo 12B',                 contextWindow: 131072 },
  { modelId: 'mistralai/mistral-7b-instruct-v0.3',      displayName: 'Mistral 7B Instruct v0.3',         contextWindow: 32768 },
  { modelId: 'mistralai/codestral-22b-instruct-v0.1',   displayName: 'Codestral 22B (Code)',             contextWindow: 32768 },
  { modelId: 'mistralai/mamba-codestral-7b-v0.1',       displayName: 'Mamba Codestral 7B (Code)',        contextWindow: 256000 },

  // ── Microsoft Phi ─────────────────────────────────────────────────────────
  { modelId: 'microsoft/phi-3-mini-128k-instruct',      displayName: 'Phi-3 Mini 128K',                  contextWindow: 131072 },
  { modelId: 'microsoft/phi-3-medium-128k-instruct',    displayName: 'Phi-3 Medium 128K',                contextWindow: 131072 },
  { modelId: 'microsoft/phi-3-small-128k-instruct',     displayName: 'Phi-3 Small 128K',                 contextWindow: 131072 },
  { modelId: 'microsoft/phi-3.5-mini-instruct',         displayName: 'Phi-3.5 Mini Instruct',            contextWindow: 131072 },
  { modelId: 'microsoft/phi-3.5-moe-instruct',          displayName: 'Phi-3.5 MoE Instruct',             contextWindow: 131072 },

  // ── Qwen ──────────────────────────────────────────────────────────────────
  { modelId: 'qwen/qwen2-7b-instruct',                  displayName: 'Qwen2 7B Instruct',                contextWindow: 131072 },
  { modelId: 'qwen/qwen2-72b-instruct',                 displayName: 'Qwen2 72B Instruct',               contextWindow: 131072 },
  { modelId: 'qwen/qwq-32b',                            displayName: 'QwQ 32B (Reasoning)',              contextWindow: 131072 },

  // ── DeepSeek ──────────────────────────────────────────────────────────────
  { modelId: 'deepseek-ai/deepseek-coder-6.7b-instruct',displayName: 'DeepSeek Coder 6.7B',              contextWindow: 16384 },
  { modelId: 'deepseek-ai/deepseek-r1',                 displayName: 'DeepSeek R1 (Reasoning)',          contextWindow: 163840 },

  // ── Google Gemma ──────────────────────────────────────────────────────────
  { modelId: 'google/gemma-2-9b-it',                    displayName: 'Gemma 2 9B Instruct',              contextWindow: 8192  },
  { modelId: 'google/gemma-2-27b-it',                   displayName: 'Gemma 2 27B Instruct',             contextWindow: 8192  },
  { modelId: 'google/gemma-2-2b-it',                    displayName: 'Gemma 2 2B Instruct',              contextWindow: 8192  },

  // ── Upstage Solar ─────────────────────────────────────────────────────────
  { modelId: 'upstage/solar-10.7b-instruct',            displayName: 'Solar 10.7B Instruct',             contextWindow: 4096  },
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
