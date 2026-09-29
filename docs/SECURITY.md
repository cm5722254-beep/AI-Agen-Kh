# 🔒 SECURITY — Khmer AI Coding Agent

## Password Security

- Algorithm: **bcrypt** with cost factor 12
- Plain-text passwords are **never stored or logged**
- Minimum length: 8 characters

```typescript
// bcrypt hash example
const hash = await bcrypt.hash(password, 12)
// Stored in DB: "$2a$12$..."
```

---

## API Key Security

All API keys are encrypted before storage using **AES-256-GCM**:

```
User inputs: nvapi-xxxxxxxxxxxxxxxx
     ↓
AES-256-GCM encrypt with app-specific key
     ↓
DB stores: "a1b2c3...:d4e5f6...:encrypted"  (iv:authTag:ciphertext hex)
     ↓
UI displays: nvapi-••••••••last4
```

The encryption key (`encryption.key`) is:
- Auto-generated on first launch
- Stored in `userData` folder (not the app directory)
- **Never leaves the machine**
- `chmod 600` equivalent (Windows: restricted ACL)

---

## Session Security

```
Token: crypto.randomBytes(48).toString('hex')  = 96 hex chars
Expiry: 7 days
Storage: DB sessions table (server-side) + localStorage (client)
```

On logout:
- Session deleted from DB
- localStorage cleared

---

## Role-Based Access Control

```
SUPER_ADMIN
  ├── Can manage all users
  ├── Can assign ADMIN role
  ├── Can view all data
  └── Full system control

ADMIN
  ├── Can manage USER accounts
  ├── Can set token limits
  └── Can view usage stats

USER
  ├── Own projects only
  ├── Own API keys only
  └── Own token usage only
```

Enforcement: Every sensitive IPC handler checks `user.role`.

---

## Agent Command Security

When AI Agent wants to run a terminal command:

```
1. Check if command matches DANGEROUS_COMMANDS list
2. If risky → Show confirmation dialog to user
3. User must explicitly click [អនុញ្ញាត] to proceed
4. If user clicks [បដិសេធ] → Command is blocked

DANGEROUS_COMMANDS include:
  rm -rf, del /f, format, DROP TABLE,
  DROP DATABASE, TRUNCATE, shutdown, etc.
```

---

## Secret Redaction in Logs

The logger automatically redacts secrets before writing to log files:

```typescript
// These patterns are redacted:
/api[_-]?key["\s]*[:=]["\s]*[\w-]+/gi → [REDACTED]
/password["\s]*[:=]["\s]*[\w-]+/gi    → [REDACTED]
/Bearer\s+[\w.-]+/gi                  → [REDACTED]
/sk-[\w-]{20,}/gi                     → [REDACTED]
/nvapi-[\w-]{20,}/gi                  → [REDACTED]
```

---

## Electron Security Settings

```typescript
webPreferences: {
  contextIsolation: true,    // Renderer ≠ Node.js
  nodeIntegration: false,    // No Node in renderer
  sandbox: false,            // Needed for preload only
  webSecurity: true,         // CSP enforced
  allowRunningInsecureContent: false,
}
```

---

## File System Protection

- Agent tools validate paths to prevent path traversal
- `node_modules`, `.git`, `dist` are excluded from listings
- Delete operations require explicit user confirmation
- Write operations restricted to project directories

---

## Privacy

- User project files stay **100% local**
- Only the text you send to AI goes to the AI provider
- No telemetry, no analytics, no external data collection
- The app shows which content is sent to AI (project context)

---

## Audit Logging

All security-relevant actions are recorded in `audit_logs`:

```
LOGIN        - Every login attempt
LOGOUT       - User logout
CREATE_USER  - Admin creates user
UPDATE_USER  - Admin modifies user
DISABLE_USER - Admin disables account
LOGIN_FAIL   - Failed login attempts (SECURITY category)
```
