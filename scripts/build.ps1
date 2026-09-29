# Production build script for Khmer AI Coding Agent
# Run: .\scripts\build.ps1

Write-Host "🇰🇭 Khmer AI Coding Agent - Production Build" -ForegroundColor Cyan
Write-Host ""

Set-Location $PSScriptRoot\..

# Step 1: Generate Prisma
Write-Host "Step 1/4: Generating Prisma client..." -ForegroundColor Yellow
npx prisma generate
if ($LASTEXITCODE -ne 0) { Write-Host "❌ Prisma generate failed" -ForegroundColor Red; exit 1 }

# Step 2: Compile main process
Write-Host "Step 2/4: Compiling main process (TypeScript)..." -ForegroundColor Yellow
npx tsc -p tsconfig.main.json
if ($LASTEXITCODE -ne 0) { Write-Host "❌ TypeScript compile failed" -ForegroundColor Red; exit 1 }

# Step 3: Build renderer
Write-Host "Step 3/4: Building renderer (Vite)..." -ForegroundColor Yellow
npx vite build
if ($LASTEXITCODE -ne 0) { Write-Host "❌ Vite build failed" -ForegroundColor Red; exit 1 }

# Step 4: Package with electron-builder
Write-Host "Step 4/4: Packaging Windows EXE..." -ForegroundColor Yellow
npx electron-builder --win
if ($LASTEXITCODE -ne 0) { Write-Host "❌ electron-builder failed" -ForegroundColor Red; exit 1 }

Write-Host ""
Write-Host "✅ Build complete!" -ForegroundColor Green
Write-Host "📦 Output: release\KHMER-AI-CODING-AGENT-Setup.exe" -ForegroundColor Cyan
