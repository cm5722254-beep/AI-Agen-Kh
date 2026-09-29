# 🏗️ ARCHITECTURE — Khmer AI Coding Agent

## Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    ELECTRON DESKTOP APP                         │
│                                                                 │
│  ┌──────────────────┐    IPC Bridge    ┌──────────────────┐   │
│  │  RENDERER PROCESS │◄────────────────►│   MAIN PROCESS   │   │
│  │  (React + Vite)   │   contextBridge  │   (Node.js)      │   │
│  │                   │                  │                  │   │
│  │  - UI Components  │                  │  - Auth Service  │   │
│  │  - Store (state)  │                  │  - AI Service    │   │
│  │  - Chat UI        │                  │  - Agent Loop    │   │
│  │  - Code Editor    │                  │  - File Tools    │   │
│  │  - File Explorer  │                  │  - Server Mgr    │   │
│  │  - Terminal UI    │                  │  - DB (Prisma)   │   │
│  │  - Admin Panel    │                  │  - Crypto        │   │
│  └──────────────────┘                  └──────────────────┘   │
│                                                ▼                │
│                                    ┌──────────────────┐        │
│                                    │   SQLite DB      │        │
│                                    │   (Prisma ORM)   │        │
│                                    └──────────────────┘        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ HTTPS
              ┌───────────────────────────────┐
              │        AI PROVIDERS           │
              │                               │
              │  NVIDIA NIM  │  OpenAI        │
              │  Anthropic   │  OpenRouter    │
              │  Ollama      │  Custom        │
              └───────────────────────────────┘
```

---

## IPC Security Model

```
Renderer Process (Untrusted)
        │
        │  window.electronAPI.invoke(channel, ...args)
        │  [contextBridge - no direct Node.js access]
        ▼
Main Process (Trusted)
        │
        │  ipcMain.handle(channel, handler)
        │  [All business logic here]
        ▼
Core Services (Auth, DB, AI, Files, etc.)
```

**Security Properties:**
- `contextIsolation: true` — Renderer cannot access Node.js
- `nodeIntegration: false` — No direct Node in renderer
- `sandbox: false` — Required for preload IPC only
- All sensitive operations run in main process only

---

## AI Provider Abstraction

```typescript
interface AiProviderInterface {
  name: string
  displayName: string
  chat(params, apiKey): Promise<{content, usage}>
  chatStream(params, apiKey, onChunk): Promise<void>
  listModels(apiKey): Promise<Model[]>
  testConnection(apiKey): Promise<{success, message}>
}

// All providers implement this interface:
OpenAICompatibleProvider  // Works for NVIDIA, OpenAI, OpenRouter, Ollama, Custom
// Future: AnthropicProvider, GoogleProvider (different API format)
```

---

## Agent Loop

```
User Request
     │
     ▼
Build System Prompt + Project Context
     │
     ▼
Stream AI Response via chatStream()
     │
     ▼
Parse <tool_call> blocks in response
     │
     ▼
For each tool:
  ├── Is risky? → Request user confirmation
  └── Execute tool (read/write file, run cmd, etc.)
     │
     ▼
Send tool result back to context
     │
     ▼
Continue streaming until [DONE]
```

---

## Database Schema (Simplified)

```
users ──────────────────────────────────────────┐
  │                                             │
  ├── sessions (auth tokens)                   │
  ├── projects                                  │
  ├── token_usage ◄── api_keys ◄── api_providers│
  └── usage_limits                              │
                                                │
audit_logs ──────────────────────────────────────┘
```

---

## Token Flow

```
User sends message
       │
       ▼
checkUsageLimits() ← UsageLimits table
       │
   [Allowed]
       │
       ▼
AI Provider API call
       │
       ▼
Parse usage from response
  └── If not provided: estimate via ~4 chars/token
       │
       ▼
recordUsage() → token_usage table
       │
       ▼
Return to user + update Dashboard
```

---

## Security Architecture

```
Password Storage:
  bcrypt(password, rounds=12) → password_hash

API Key Storage:
  AES-256-GCM(apiKey, encKey) → encrypted_key
  Only hint shown in UI: "nvapi-••••••••last4"

Session Token:
  crypto.randomBytes(48).toString('hex') → 96-char token
  Stored in: sessions table (expires in 7 days)
  Client stores in: localStorage

Encryption Key:
  Auto-generated on first run
  Stored in: userData/encryption.key (mode 0600)
  Never leaves the machine
```

---

## Future Extension Points

```typescript
// Add new AI Provider:
class AnthropicProvider implements AiProviderInterface { ... }
// Register in: src/core/ai/aiService.ts getProvider()

// Add new Agent Tool:
// 1. Add to AgentToolName type in shared/types.ts
// 2. Implement in src/core/agent/tools/
// 3. Add case in agentService.ts executeTool()

// Add new IPC handler:
// 1. Create src/main/ipc/myHandlers.ts
// 2. Register in src/main/index.ts
// 3. Add channel to shared/constants.ts IPC_CHANNELS
// 4. Use from renderer: invoke(IPC_CHANNELS.MY_CHANNEL, ...)
```
