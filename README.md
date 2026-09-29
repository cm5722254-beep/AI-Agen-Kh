# 🇰🇭 Khmer AI Coding Agent

កម្មវិធី Desktop AI Coding Agent សម្រាប់អ្នកប្រើប្រាស់ខ្មែរ

![Version](https://img.shields.io/badge/Version-1.0.0-blue)
![Platform](https://img.shields.io/badge/Platform-Windows-blue)
![Electron](https://img.shields.io/badge/Electron-28-47848F)
![React](https://img.shields.io/badge/React-18-61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6)

---

## 📖 តើជាអ្វី?

**Khmer AI Coding Agent** ជា Desktop Application ដែល:

- ប្រើ AI API (NVIDIA NIM, OpenAI, Anthropic, OpenRouter, Ollama) ដើម្បីជួយ Code
- UI ទាំងស្រុងជា **ភាសាខ្មែរ**
- Run **Local** នៅលើកុំព្យូទ័ររបស់អ្នក
- File data ទុក **Local** — Privacy Protected

---

## ✨ Features

| Feature | ស្ថានភាព |
|---------|---------|
| 🤖 AI Coding Agent | ✅ |
| 💻 Code Editor (CodeMirror) | ✅ |
| 📁 File Explorer | ✅ |
| 🖥️ Integrated Terminal | ✅ |
| 🌐 Local Server Manager | ✅ |
| 👁️ Live Preview | ✅ |
| 🔑 Multi-Provider API Keys | ✅ |
| 📊 Token Usage Tracking | ✅ |
| 👤 User Authentication | ✅ |
| 👑 Admin Dashboard | ✅ |
| 🔒 RBAC (Role-Based Access) | ✅ |
| 📈 Usage Charts | ✅ |
| ⚙️ Settings | ✅ |
| 🏗️ Windows EXE Build | ✅ |

---

## 🚀 ចាប់ផ្តើម Development

### Prerequisites

- **Node.js** >= 18.x
- **npm** >= 9.x

### Installation

```bash
git clone <repo>
cd KHMER-AI-CODING-AGENT
npm install --ignore-scripts
npx prisma db push
```

### Development Mode

```bash
# Terminal 1: Build main process (watch)
npx tsc -p tsconfig.main.json --watch

# Terminal 2: Start renderer (Vite dev server)
npx vite

# Terminal 3: Start Electron
npm run electron
```

### Production Build

```bash
npm run build
npm run package
```

---

## 🏗️ Architecture

```
KHMER-AI-CODING-AGENT/
├── src/
│   ├── main/                    # Electron Main Process
│   │   ├── index.ts             # Entry point
│   │   ├── preload.ts           # Context bridge
│   │   └── ipc/                 # IPC Handlers
│   │       ├── authHandlers.ts
│   │       ├── aiHandlers.ts
│   │       ├── projectHandlers.ts
│   │       ├── fileHandlers.ts
│   │       ├── serverHandlers.ts
│   │       ├── terminalHandlers.ts
│   │       ├── usageHandlers.ts
│   │       ├── adminHandlers.ts
│   │       └── settingsHandlers.ts
│   │
│   ├── core/                    # Business Logic
│   │   ├── ai/                  # AI Provider System
│   │   │   ├── aiService.ts     # Main AI service
│   │   │   └── providers/       # Provider implementations
│   │   │       ├── base.ts      # Interface
│   │   │       └── openai-compatible.ts  # OpenAI/NVIDIA/etc
│   │   ├── agent/               # AI Agent System
│   │   │   ├── agentService.ts  # Agent loop
│   │   │   └── tools/           # Agent tools
│   │   │       └── fileTools.ts
│   │   ├── auth/                # Authentication
│   │   │   └── authService.ts
│   │   ├── database/            # Database
│   │   │   └── client.ts        # Prisma client
│   │   ├── security/            # Security
│   │   │   └── crypto.ts        # AES-256 encryption
│   │   └── logging/             # Logging
│   │       └── logger.ts
│   │
│   ├── renderer/                # React Frontend
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   ├── index.html
│   │   ├── store/               # App state
│   │   ├── hooks/               # Custom hooks
│   │   ├── pages/               # Full pages
│   │   ├── components/          # UI components
│   │   │   ├── layout/          # Layout components
│   │   │   ├── dashboard/       # Dashboard
│   │   │   ├── agent/           # AI Agent chat
│   │   │   ├── editor/          # Code editor
│   │   │   ├── files/           # File explorer
│   │   │   ├── terminal/        # Terminal
│   │   │   ├── server/          # Server manager
│   │   │   ├── preview/         # Live preview
│   │   │   ├── usage/           # Token usage
│   │   │   ├── settings/        # Settings & API keys
│   │   │   └── admin/           # Admin panel
│   │   └── styles/              # Global CSS
│   │
│   └── shared/                  # Shared types & constants
│       ├── types.ts
│       └── constants.ts
│
├── prisma/
│   ├── schema.prisma            # Database schema
│   └── dev.db                   # SQLite database (auto-created)
│
├── dist/                        # Build output
├── release/                     # EXE installer output
└── docs/                        # Documentation
```

---

## 🤖 AI Providers

| Provider | Base URL | Notes |
|----------|----------|-------|
| NVIDIA NIM | `https://integrate.api.nvidia.com/v1` | Default — Llama, Mistral, etc. |
| OpenAI | `https://api.openai.com/v1` | GPT-4, GPT-3.5 |
| Anthropic | `https://api.anthropic.com` | Claude |
| OpenRouter | `https://openrouter.ai/api/v1` | Multi-model |
| Ollama | `http://localhost:11434/v1` | Local LLM |
| Custom | Any OpenAI-compatible URL | Custom endpoints |

---

## 🔐 Security

- Passwords: **bcrypt** (12 rounds)
- API Keys: **AES-256-GCM** encrypted at rest
- Sessions: Secure token (48-byte random hex)
- Role-Based Access: SUPER_ADMIN > ADMIN > USER
- Secret Redaction: Logs never contain secrets
- Path Traversal: Protected in file operations

---

## 📊 Database Tables

```
users           - User accounts
sessions        - Auth sessions
api_providers   - AI provider configurations
api_keys        - Encrypted API keys
ai_models       - Available AI models
projects        - User projects
token_usage     - Token tracking
usage_limits    - Per-user token limits
server_processes - Running servers
settings        - App settings
audit_logs      - Security audit trail
```

---

## 📝 License

MIT — Khmer AI Team 2024
