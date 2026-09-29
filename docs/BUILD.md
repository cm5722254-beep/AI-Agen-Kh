# 🔨 BUILD GUIDE — Khmer AI Coding Agent

## Development Build

```bash
# 1. Install deps
npm install --ignore-scripts

# 2. Generate Prisma
npx prisma generate
npx prisma db push

# 3. Compile main process
npx tsc -p tsconfig.main.json

# 4. Build renderer
npx vite build

# 5. Run
npx electron .
```

---

## Production Build (Windows EXE)

### Prerequisites

```
✓ Node.js 18+
✓ npm 9+
✓ Windows 10/11 x64 (for building Windows targets)
```

### Build Steps

```bash
# Full build + package
npm run package

# Output location:
# release/
# └── KHMER-AI-CODING-AGENT-Setup.exe
```

### electron-builder Configuration

The build config is in `package.json` under the `"build"` key:

```json
{
  "build": {
    "appId": "dev.khmerai.coding-agent",
    "productName": "Khmer AI Coding Agent",
    "win": {
      "target": "nsis"
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true,
      "createDesktopShortcut": true,
      "createStartMenuShortcut": true
    }
  }
}
```

---

## App Icon

Place these files in `resources/`:

```
resources/
├── icon.ico        (Windows — 256x256, ICO format)
├── icon.png        (macOS/Linux — 512x512 PNG)
└── icon.icns       (macOS — ICNS format, optional)
```

To create `icon.ico` from a PNG:
- Use [convertio.co](https://convertio.co/png-ico/) ឬ
- ImageMagick: `magick convert icon.png -resize 256x256 icon.ico`

---

## Prisma in Production

Prisma needs its query engine bundled with the app.

The `package.json` build config includes:

```json
"files": [
  "node_modules/.prisma/**/*",
  "node_modules/@prisma/client/**/*"
]
```

Database is stored in Electron's `userData` directory:
- Windows: `C:\Users\<user>\AppData\Roaming\Khmer AI Coding Agent\khmer-ai.db`

---

## Environment Variables

No `.env` file needed at runtime. The app manages its own config.

For development, you can create `.env` (never commit):

```
NODE_ENV=development
```

---

## Build Output Structure

```
release/
├── KHMER-AI-CODING-AGENT-Setup.exe     # NSIS Installer
└── win-unpacked/                        # Unpacked app (for testing)
    ├── Khmer AI Coding Agent.exe
    └── resources/
        ├── app.asar
        └── prisma/
```

---

## Upgrade Notes

### node-pty (Full Terminal Support)

For full PTY terminal (resize, color, etc.) install Visual Studio Build Tools:

```
winget install Microsoft.VisualStudio.2022.BuildTools
winget install Python.Python.3
```

Then:
```bash
npm install node-pty
```

And update `src/main/ipc/terminalHandlers.ts` to use `node-pty`.

### better-sqlite3 (Alternative DB Driver)

Same prerequisites as node-pty. Prisma's built-in SQLite driver works fine without it.
