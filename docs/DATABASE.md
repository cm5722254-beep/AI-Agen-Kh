# 🗃️ DATABASE — Khmer AI Coding Agent

## Technology

- **Database:** SQLite (via Prisma ORM)
- **ORM:** Prisma 5.x
- **Schema File:** `prisma/schema.prisma`
- **Location (Production):** `%APPDATA%\Khmer AI Coding Agent\khmer-ai.db`
- **Location (Dev):** `prisma/dev.db`

---

## Tables

### users
```sql
id           UUID PRIMARY KEY
name         TEXT NOT NULL
email        TEXT UNIQUE NOT NULL
password_hash TEXT NOT NULL          -- bcrypt hash
role         TEXT DEFAULT 'USER'     -- SUPER_ADMIN | ADMIN | USER
status       TEXT DEFAULT 'ACTIVE'   -- ACTIVE | DISABLED
created_at   DATETIME
updated_at   DATETIME
last_login   DATETIME NULL
```

### sessions
```sql
id           UUID PRIMARY KEY
user_id      UUID REFERENCES users(id)
token        TEXT UNIQUE             -- 96-char hex token
expires_at   DATETIME
created_at   DATETIME
ip_address   TEXT NULL
user_agent   TEXT NULL
```

### api_providers
```sql
id           UUID PRIMARY KEY
name         TEXT                    -- nvidia, openai, anthropic, etc.
display_name TEXT
base_url     TEXT
is_active    BOOLEAN DEFAULT true
sort_order   INT DEFAULT 0
created_at   DATETIME
```

### api_keys
```sql
id           UUID PRIMARY KEY
provider_id  UUID REFERENCES api_providers(id)
name         TEXT                    -- User label
encrypted_key TEXT                   -- AES-256-GCM encrypted
key_hint     TEXT                    -- "nvapi-••••••••last4"
is_default   BOOLEAN DEFAULT false
is_active    BOOLEAN DEFAULT true
created_at   DATETIME
updated_at   DATETIME
```

### ai_models
```sql
id              UUID PRIMARY KEY
provider_id     UUID REFERENCES api_providers(id)
model_id        TEXT                -- "meta/llama-3.1-70b-instruct"
display_name    TEXT
context_window  INT DEFAULT 4096
input_cost_per_1k FLOAT NULL       -- USD
output_cost_per_1k FLOAT NULL      -- USD
is_active       BOOLEAN DEFAULT true
```

### projects
```sql
id          UUID PRIMARY KEY
user_id     UUID REFERENCES users(id)
name        TEXT
description TEXT NULL
path        TEXT                    -- Absolute path on disk
framework   TEXT NULL
language    TEXT NULL
status      TEXT DEFAULT 'ACTIVE'   -- ACTIVE | ARCHIVED
created_at  DATETIME
updated_at  DATETIME
```

### token_usage
```sql
id           UUID PRIMARY KEY
user_id      UUID REFERENCES users(id)
api_key_id   UUID NULL REFERENCES api_keys(id)
project_id   UUID NULL
model_id     TEXT
provider     TEXT
input_tokens  INT
output_tokens INT
total_tokens  INT
input_cost    FLOAT NULL
output_cost   FLOAT NULL
total_cost    FLOAT NULL
is_estimated  BOOLEAN DEFAULT false
created_at    DATETIME
```

### usage_limits
```sql
id                     UUID PRIMARY KEY
user_id                UUID UNIQUE REFERENCES users(id)
daily_token_limit      INT NULL    -- NULL = unlimited
monthly_token_limit    INT NULL
daily_request_limit    INT NULL
monthly_request_limit  INT NULL
updated_at             DATETIME
```

### server_processes
```sql
id         UUID PRIMARY KEY
project_id UUID NULL REFERENCES projects(id)
name       TEXT
command    TEXT
port       INT NULL
pid        INT NULL
status     TEXT DEFAULT 'STOPPED'   -- RUNNING | STOPPED | ERROR
started_at DATETIME NULL
stopped_at DATETIME NULL
created_at DATETIME
```

### settings
```sql
key        TEXT PRIMARY KEY
value      TEXT
category   TEXT DEFAULT 'general'
updated_at DATETIME
```

Default settings seeded on first run:
- `theme` = `dark`
- `language` = `km`
- `fontSize` = `14`
- `autoSave` = `true`
- `confirmDangerousCommands` = `true`

### audit_logs
```sql
id         UUID PRIMARY KEY
user_id    UUID NULL REFERENCES users(id)
action     TEXT    -- LOGIN, LOGOUT, CREATE_PROJECT, etc.
category   TEXT    -- INFO | WARNING | ERROR | SECURITY
details    TEXT NULL
ip_address TEXT NULL
created_at DATETIME
```

---

## Prisma Commands

```bash
# View/edit data in browser
npx prisma studio

# Reset and re-push schema
del prisma\dev.db
npx prisma db push

# Generate client after schema changes
npx prisma generate

# Create migration (for production upgrade)
npx prisma migrate dev --name my-change
```

---

## Migration to PostgreSQL/MySQL

To switch from SQLite to PostgreSQL:

1. Update `prisma/schema.prisma`:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

2. Set `DATABASE_URL` environment variable:
```
DATABASE_URL="postgresql://user:pass@localhost:5432/khmerai"
```

3. Run migration:
```bash
npx prisma migrate dev
```

No application code changes needed — Prisma abstracts the database.
