# 🇰🇭 Khmer AI Coding Agent

កម្មវិធី Desktop AI Coding Agent សម្រាប់អ្នកប្រើប្រាស់ខ្មែរ

![Version](https://img.shields.io/badge/Version-1.0.0-blue)
![Windows](https://img.shields.io/badge/Windows-EXE-0078D6?logo=windows)
![macOS](https://img.shields.io/badge/macOS-DMG-000000?logo=apple)
![Linux](https://img.shields.io/badge/Linux-AppImage-FCC624?logo=linux&logoColor=black)
![Android](https://img.shields.io/badge/Android-Flutter-3DDC84?logo=android&logoColor=white)
![iOS](https://img.shields.io/badge/iOS-Flutter-000000?logo=apple)
![Electron](https://img.shields.io/badge/Electron-28-47848F)
![React](https://img.shields.io/badge/React-18-61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6)
![Flutter](https://img.shields.io/badge/Flutter-3.x-02569B?logo=flutter)

---

## 📖 តើជាអ្វី?

**Khmer AI Coding Agent** ជា Desktop Application ដែល:

- ប្រើ AI API (NVIDIA NIM, OpenAI, Anthropic, OpenRouter, Ollama) ដើម្បីជួយ Code
- UI ទាំងស្រុងជា **ភាសាខ្មែរ**
- Run **Local** នៅលើកុំព្យូទ័ររបស់អ្នក
- File data ទុក **Local** — Privacy Protected
- Support **Windows, macOS, Linux** (Electron)
- Mobile support via **Flutter** (Android & iOS)

---

## ✨ Features

| Feature | ស្ថានភាព |
|---------|---------|
| 🤖 AI Coding Agent | ✅ |
| 💻 Code Editor (Monaco) | ✅ |
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
| 🍎 macOS DMG Build | ✅ |
| 🐧 Linux AppImage Build | ✅ |
| 📱 Flutter Android App | ✅ |
| 🍏 Flutter iOS App | ✅ |

---

## 🔐 Admin Account

Default SUPER_ADMIN credentials (auto-created on first run):

| Field | Value |
|-------|-------|
| **Email** | `cm5722254@gmail.com` |
| **Password** | `@Iam_Cheatm2` |
| **Role** | `SUPER_ADMIN` |

> ⚠️ **Security**: Change the password after first login via Settings → Change Password.

To manually seed the admin (if needed):
```bash
npm run seed-admin
```

---

## 🚀 ចាប់ផ្តើម Development

### Prerequisites

- **Node.js** >= 18.x
- **npm** >= 9.x
- **Flutter** >= 3.x (for mobile builds)

### Installation

```bash
git clone https://github.com/cm5722254-beep/AI-Agen-Kh.git
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

---

## 🏗️ Building for All Platforms

### 🪟 Windows EXE (.exe Installer + Portable)

```bash
npm run package:win
```
Output: `release/Khmer AI Coding Agent Setup 1.0.0.exe`

### 🍎 macOS DMG (Intel + Apple Silicon)

> Must be built on a macOS machine
```bash
npm run package:mac
```
Output: `release/Khmer AI Coding Agent-1.0.0.dmg`

### 🐧 Linux AppImage / DEB / RPM

```bash
npm run package:linux
```
Output: `release/Khmer AI Coding Agent-1.0.0.AppImage`

### 📦 Build All Platforms at Once

```bash
npm run package:all
```

---

## 📱 Flutter Mobile App (Android & iOS)

The Flutter mobile companion app is located in `flutter_app/`.

### Prerequisites
```bash
flutter doctor  # Verify Flutter setup
```

### Setup
```bash
cd flutter_app
flutter pub get
```

### Run on Android
```bash
flutter run -d android
```

### Run on iOS
```bash
flutter run -d ios
```

### Build Android APK
```bash
cd flutter_app
flutter build apk --release
# Output: flutter_app/build/app/outputs/flutter-apk/app-release.apk
```

### Build Android AAB (Google Play)
```bash
flutter build appbundle --release
# Output: flutter_app/build/app/outputs/bundle/release/app-release.aab
```

### Build iOS IPA (App Store)
```bash
flutter build ios --release
# Then archive in Xcode for App Store submission
```

### Flutter App Features
- 🔐 Login / Register (connects to local Khmer AI backend)
- 🤖 AI Chat Interface (mobile-optimized)
- 📊 Token Usage Dashboard
- ⚙️ API Key Management
- 🌐 Project Manager
- 🇰🇭 Full Khmer UI

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
│   │   ├── agent/               # AI Agent System
│   │   ├── auth/                # Authentication
│   │   ├── database/            # Database (Prisma + SQLite)
│   │   ├── security/            # AES-256 + scrypt
│   │   └── logging/             # Logging
│   │
│   ├── renderer/                # React Frontend
│   │   ├── App.tsx
│   │   ├── components/          # UI components
│   │   ├── pages/               # Full pages
│   │   └── store/               # App state
│   │
│   └── shared/                  # Shared types & constants
│
├── flutter_app/                 # 📱 Flutter Mobile App
│   ├── android/                 # Android project
│   ├── ios/                     # iOS project
│   ├── lib/
│   │   ├── main.dart            # Entry point
│   │   ├── screens/             # App screens
│   │   ├── services/            # API services
│   │   └── widgets/             # Reusable widgets
│   └── pubspec.yaml
│
├── scripts/
│   ├── seed-admin.js            # Admin account seeder
│   └── notarize.js              # macOS notarization
│
├── prisma/
│   └── schema.prisma            # Database schema
│
├── dist/                        # Build output
└── release/                     # Platform installers
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

- Passwords: **scrypt** (N=32768, OWASP recommended)
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
