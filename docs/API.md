# 🔌 IPC API Reference — Khmer AI Coding Agent

All communication between Renderer and Main process uses Electron IPC via `window.electronAPI.invoke(channel, ...args)`.

---

## Auth Channels

### `auth:firstRun`
Check if this is the first launch (no users exist).
- **Returns:** `boolean`

### `auth:login`
- **Args:** `{ email: string, password: string }`
- **Returns:** `IpcResponse<AuthResult>` — contains `user` and `token`

### `auth:register`
- **Args:** `{ name, email, password, role? }`
- **Returns:** `IpcResponse<AuthResult>`

### `auth:logout`
- **Args:** `token: string`
- **Returns:** `IpcResponse`

### `auth:getCurrent`
Validate existing session token.
- **Args:** `token: string`
- **Returns:** `IpcResponse<UserPublic>`

### `auth:changePassword`
- **Args:** `userId, oldPassword, newPassword`
- **Returns:** `IpcResponse`

---

## AI Channels

### `ai:chatStream`
Start streaming AI response. Returns `streamId`, then pushes chunks via `ai:stream:<streamId>` events.
- **Args:** `(options: AiRequestOptions, userId: string)`
- **Returns:** `IpcResponse<{ streamId: string }>`
- **Events:** `ai:stream:<streamId>` — `AiStreamChunk` (`{type: 'delta'|'done'|'error', content?, usage?, error?}`)

### `ai:chat`
Non-streaming chat.
- **Args:** `(options: AiRequestOptions, userId: string)`
- **Returns:** `IpcResponse<{ content: string, usage: TokenUsageSummary }>`

### `ai:stop`
Stop current AI generation.

### `agent:run`
Run the AI Agent loop with tools + streaming.
- **Args:** `{ userMessage, projectPath?, conversationHistory, apiKeyId, modelId, userId }`
- **Returns:** `IpcResponse<{ streamId: string }>`
- **Events:**
  - `ai:stream:<streamId>` — text chunks
  - `agent:status:<streamId>` — `{ phase, message }`
  - `agent:tool:<streamId>` — tool call notification
  - `agent:toolResult:<streamId>` — tool execution result
  - `agent:confirmTool:<streamId>` — requires user confirmation

---

## API Key Channels

### `apikey:list`
- **Returns:** `IpcResponse<ApiKeyInfo[]>`

### `apikey:add`
- **Args:** `{ providerId, name, apiKey, isDefault? }`
- **Returns:** `IpcResponse<{ id: string }>`

### `apikey:delete`
- **Args:** `keyId: string`
- **Returns:** `IpcResponse`

### `apikey:test`
Test API key connection.
- **Args:** `keyId: string`
- **Returns:** `IpcResponse<{ success: boolean, message: string }>`

### `provider:list`
- **Returns:** `IpcResponse<ApiProviderInfo[]>`

### `model:list`
- **Args:** `providerId: string`
- **Returns:** `IpcResponse<AiModelInfo[]>`

---

## Project Channels

### `projects:list`
- **Args:** `userId: string`
- **Returns:** `IpcResponse<ProjectInfo[]>`

### `projects:create`
- **Args:** `(userId, { name, description?, path?, framework?, language? })`
- **Returns:** `IpcResponse<ProjectInfo>`

### `projects:delete`
Soft-delete (archive).
- **Args:** `projectId: string`

### `projects:rename`
- **Args:** `(projectId, newName)`

### `projects:openDialog`
Open folder picker dialog.
- **Returns:** `IpcResponse<{ path: string }>`

---

## File Channels

### `files:list`
- **Args:** `(dirPath: string, recursive?: boolean)`
- **Returns:** `IpcResponse<FileNode[]>`

### `files:read`
- **Args:** `filePath: string`
- **Returns:** `IpcResponse<string>` — file content

### `files:write`
- **Args:** `(filePath, content)`

### `files:delete`
- **Args:** `filePath`

### `files:createDir`
- **Args:** `dirPath`

### `files:rename`
- **Args:** `(oldPath, newPath)`

---

## Server Channels

### `server:list`
- **Returns:** `IpcResponse<ServerProcessInfo[]>`

### `server:start`
- **Args:** `{ name, command, port?, cwd?, projectId? }`
- **Returns:** `IpcResponse<{ id, port, pid }>`
- **Events:** `server:log:<serverId>` — log lines; `server:statusChange` — status updates

### `server:stop`
- **Args:** `serverId`

### `server:logs`
- **Args:** `serverId`
- **Returns:** `IpcResponse<string[]>`

---

## Usage Channels

### `usage:summary`
- **Args:** `userId`
- **Returns:** `IpcResponse<UsageSummary>`

### `usage:get`
- **Args:** `(userId, days?)`
- **Returns:** `IpcResponse<TokenUsageRecord[]>`

### `usage:chart`
- **Args:** `(userId, days?)`
- **Returns:** `IpcResponse<{ date, tokens, cost, requests }[]>`

---

## Admin Channels

### `admin:stats`
- **Returns:** `IpcResponse<AdminStats>`

### `admin:users`
- **Returns:** `IpcResponse<User[]>`

### `admin:createUser`
- **Args:** `{ name, email, password, role }`

### `admin:updateUser`
- **Args:** `(userId, { name?, role?, status? })`

### `admin:deleteUser` (soft)
- **Args:** `userId`

### `admin:setLimit`
- **Args:** `(userId, { dailyTokenLimit?, monthlyTokenLimit?, ... })`

### `admin:logs`
- **Args:** `limit?: number`
- **Returns:** `IpcResponse<AuditLog[]>`

---

## System Channels

### `system:openExternal`
Open URL in default browser.
- **Args:** `url: string`

### `system:openPath`
Open file/folder in Explorer.
- **Args:** `path: string`

### `system:selectDirectory`
Open folder picker.
- **Returns:** `string | null`

### `system:version`
- **Returns:** `string` — app version
