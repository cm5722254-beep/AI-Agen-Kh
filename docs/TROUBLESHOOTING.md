# 🐛 TROUBLESHOOTING — Khmer AI Coding Agent

## ❌ App មិនបើក / Blank Screen

**Windows:**
```
1. Right-click app → "Run as administrator"
2. ពិនិត្យ Windows Defender → Allow app
3. ពិនិត្យ Event Viewer → Application Logs
4. បើ Dev Mode: open DevTools → Console tab for errors
```

**Dev Mode Debug:**
```bash
npm run electron:dev
# DevTools opens automatically
```

---

## ❌ Database Error on Startup

```
Error: Can't reach database server
ឬ
Error: Table 'users' doesn't exist
```

**Fix:**
```bash
del prisma\dev.db
npx prisma db push
npm run electron
```

---

## ❌ API Key Error

```
AI API Error: 401 Unauthorized
ឬ
ការតភ្ជាប់បរាជ័យ
```

**ដោះស្រាយ:**
1. ទៅ Settings → API Keys
2. ចុច "🧪 Test" នៅ Key
3. ប្រសិនបើ Fail: Delete key → Add ជាថ្មី
4. ពិនិត្យ API Key ត្រឹមត្រូវ (copy-paste ម្ដងទៀត)
5. ពិនិត្យ Internet Connection

**NVIDIA NIM:**
- API Key ចាប់ផ្តើម `nvapi-`
- Get key at: [build.nvidia.com](https://build.nvidia.com)
- Free tier: 1000 requests/day per model

---

## ❌ AI Chat មិនដំណើរការ

```
Stream Error / No response
```

**ដោះស្រាយ:**
1. ពិនិត្យ API Key selected (Config bar ខាងលើ Chat)
2. ពិនិត្យ Model selected
3. ពិនិត្យ Token Limit (Usage → Summary)
4. Contact admin ប្រសិនបើ Limit ហើយ

---

## ❌ Terminal មិនបើក

```
Terminal Error: spawn powershell.exe ENOENT
```

**ដោះស្រាយ:**
- Windows: ពិនិត្យ PowerShell installed (`winver`)
- ប្រសិនបើ Path issue: Restart app as Administrator

---

## ❌ Server Start Fail

```
Port 3000 ត្រូវបានប្រើ
ឬ
Error: spawn npm ENOENT
```

**Port conflict:** App auto-finds free port — ចូលទៅ Server tab ដើម្បីឃើញ Port ថ្មី

**npm not found:**
```bash
# ពិនិត្យ Node.js installed:
node --version
npm --version
# ប្រសិនបើ Error: Install Node.js from nodejs.org
```

---

## ❌ Build Error: node-gyp / Python

```
npm error gyp ERR! find Python
```

**ដោះស្រាយ:**
```bash
# Option 1: Skip native builds (recommended)
npm install --ignore-scripts

# Option 2: Install build tools (enables node-pty, better-sqlite3)
winget install Microsoft.VisualStudio.2022.BuildTools --override "--add Microsoft.VisualStudio.Workload.VCTools"
winget install Python.Python.3.11
npm install
```

---

## ❌ Prisma Generate Error

```
Error: @prisma/client did not initialize yet
```

**Fix:**
```bash
npx prisma generate
```

---

## ❌ White/Black Screen after Build

```
Failed to load resource: net::ERR_FILE_NOT_FOUND
```

**Fix:** ពិនិត្យ `vite.config.ts`:
```typescript
base: './'  // Must be relative, not '/'
```

Then rebuild:
```bash
npx vite build
npm run electron
```

---

## 📋 Log Files Location

```
Windows:
C:\Users\<username>\AppData\Roaming\Khmer AI Coding Agent\logs\main.log

Dev:
%USERPROFILE%\AppData\Roaming\Electron\logs\main.log
```

---

## 🆘 Contact Support

ប្រសិនបើបញ្ហានៅតែមាន:
1. Copy error message ពី Log file
2. Screenshots ភ្ជាប់
3. Windows version + Node.js version
4. Contact: support@khmerai.dev
