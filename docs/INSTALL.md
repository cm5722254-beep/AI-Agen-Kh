# 📦 ការដំឡើង Khmer AI Coding Agent

## លក្ខខណ្ឌ

### សម្រាប់ User ធម្មតា (Run EXE)

- Windows 10 / 11 (x64)
- RAM: 4GB+ (8GB ណែនាំ)
- Storage: 500MB+
- Internet connection (សម្រាប់ AI API)

### សម្រាប់ Developer (Build from Source)

- **Node.js** 18.x ឬ 20.x — [nodejs.org](https://nodejs.org)
- **npm** 9.x+
- **Git** — [git-scm.com](https://git-scm.com)

---

## 🚀 ការដំឡើង (User)

1. ទាញយក `KHMER-AI-CODING-AGENT-Setup.exe` ពី Releases
2. Double-click ដើម្បី Install
3. ជ្រើស Installation Directory
4. ចុច Install
5. បើក App ពី Desktop Shortcut

---

## 🛠️ ការដំឡើង (Developer)

```bash
# 1. Clone
git clone <repository-url>
cd KHMER-AI-CODING-AGENT

# 2. Install dependencies (skip native builds)
npm install --ignore-scripts

# 3. Generate Prisma client
npx prisma generate

# 4. Push database schema
npx prisma db push

# 5. Build main process
npx tsc -p tsconfig.main.json

# 6. Build renderer
npx vite build

# 7. Run Electron
npm run electron
```

---

## ⚙️ ការកំណត់លើកដំបូង

នៅពេលបើក App លើកដំបូង:

1. **បង្កើតគណនី Admin** — ជ្រើស Username, Email, Password
2. **Login** — ដោយប្រើ Email + Password
3. **បន្ថែម API Key** — ទៅ Settings → API Keys
   - ជ្រើស NVIDIA NIM ជា Provider
   - បញ្ចូល API Key: `nvapi-xxxxxxxxxxxx`
4. **ចាប់ផ្តើម AI Chat** — ទៅ AI Agent

---

## 🔑 NVIDIA NIM API Key

1. ចូល [build.nvidia.com](https://build.nvidia.com)
2. Log in ជាមួយ NVIDIA Account
3. ចូល API section
4. Generate API Key
5. Copy Key (ចាប់ផ្តើមដោយ `nvapi-`)

⚠️ **ចាំ**: API Key ជា Secret — មិនត្រូវ Share ជាមួយអ្នកណាទេ

---

## 🐛 ការដោះស្រាយបញ្ហា

### App មិនបើក

```
✓ ពិនិត្យ Windows Defender / Antivirus
✓ Run as Administrator
✓ ពិនិត្យ .NET Runtime
```

### Database Error

```bash
# Reset database
del prisma\dev.db
npx prisma db push
```

### API Key Error

```
✓ ពិនិត្យ Internet Connection
✓ ពិនិត្យ API Key ត្រឹមត្រូវ
✓ Test API Key ក្នុង Settings → API Keys
```

### Build Error (node-gyp)

```
ដំឡើង Python 3.x + Visual Studio Build Tools
ឬ ប្រើ --ignore-scripts flag:
npm install --ignore-scripts
```
