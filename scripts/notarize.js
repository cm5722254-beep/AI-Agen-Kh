/**
 * macOS Notarization Script
 * Called by electron-builder afterSign hook.
 *
 * Only runs when building on macOS with Apple credentials set.
 * Set these environment variables before running `npm run package:mac`:
 *
 *   APPLE_ID=your@apple.com
 *   APPLE_APP_SPECIFIC_PASSWORD=xxxx-xxxx-xxxx-xxxx
 *   APPLE_TEAM_ID=XXXXXXXXXX
 *
 * To generate an app-specific password:
 *   https://appleid.apple.com → Security → App-Specific Passwords
 */
const { notarize } = require('@electron/notarize')
const path = require('path')

module.exports = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context

  // Only notarize on macOS builds
  if (electronPlatformName !== 'darwin') return

  // Skip if credentials not set (CI without macOS secrets)
  const appleId = process.env.APPLE_ID
  if (!appleId) {
    console.log('[notarize] APPLE_ID not set — skipping notarization')
    return
  }

  const appName  = context.packager.appInfo.productFilename
  const appPath  = path.join(appOutDir, `${appName}.app`)

  console.log(`[notarize] Notarizing ${appPath}...`)

  await notarize({
    appBundleId: 'dev.khmerai.coding-agent',
    appPath,
    appleId,
    appleIdPassword: process.env.APPLE_APP_SPECIFIC_PASSWORD,
    teamId: process.env.APPLE_TEAM_ID,
  })

  console.log('[notarize] ✅ Notarization complete')
}
