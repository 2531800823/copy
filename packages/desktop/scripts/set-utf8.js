/**
 * Set Windows console code page to UTF-8 (65001).
 * No-op on macOS / Linux.
 */
if (process.platform === 'win32') {
  try {
    require('child_process').execSync('chcp 65001', { stdio: 'ignore' })
  } catch {
    // ignore: non-cmd shells or missing chcp
  }
}
