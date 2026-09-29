# Development start script for Khmer AI Coding Agent
# Run: .\scripts\dev.ps1

Write-Host "🇰🇭 Khmer AI Coding Agent - Development Mode" -ForegroundColor Cyan
Write-Host ""

# Check Node.js
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js not found. Install from https://nodejs.org" -ForegroundColor Red
    exit 1
}

$nodeVersion = node --version
Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    npm install --ignore-scripts
}

# Check if Prisma client exists
if (-not (Test-Path "node_modules/.prisma")) {
    Write-Host "🗃️ Generating Prisma client..." -ForegroundColor Yellow
    npx prisma generate
}

# Push database schema
Write-Host "🗃️ Pushing database schema..." -ForegroundColor Yellow
$env:DATABASE_URL = "file:./prisma/dev.db"
npx prisma db push --skip-generate

Write-Host ""
Write-Host "🚀 Starting development servers..." -ForegroundColor Green
Write-Host ""
Write-Host "  Terminal 1 (Main process watch):"
Write-Host "    npx tsc -p tsconfig.main.json --watch"
Write-Host ""
Write-Host "  Terminal 2 (Renderer dev server):"
Write-Host "    npx vite"
Write-Host ""
Write-Host "  Terminal 3 (After renderer starts):"
Write-Host "    npx electron ."
Write-Host ""
Write-Host "ℹ️  Or run all at once: npm run electron:dev"
Write-Host "   (requires 'concurrently' and 'wait-on')"
