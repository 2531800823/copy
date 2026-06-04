import {execFileSync} from 'node:child_process'
import {app} from 'electron'
import {injectable} from 'inversify'
import logger from './LoggerService'

const MENU_KEY = 'CopyAppExtractZip'
const MENU_TITLE = '解压并用 VSCode 打开'
const REGISTRY_BASE =
  'HKCU\\Software\\Classes\\SystemFileAssociations\\.zip\\shell\\CopyAppExtractZip'
const EXTRACT_ZIP_SWITCH = 'open-zip'

export function parseExtractZipArg(argv: string[]): string | null {
  for (const arg of argv) {
    if (arg.startsWith(`--${EXTRACT_ZIP_SWITCH}=`)) {
      const zipPath = arg.slice(`--${EXTRACT_ZIP_SWITCH}=`.length)
      if (zipPath) {
        return normalizeZipPath(zipPath)
      }
    }
  }

  const index = argv.findIndex(
    (arg) => arg === `--${EXTRACT_ZIP_SWITCH}` || arg === '--extract-zip'
  )
  if (index !== -1) {
    const zipPath = argv[index + 1]
    if (zipPath && !zipPath.startsWith('-')) {
      return normalizeZipPath(zipPath)
    }
  }

  return null
}

function normalizeZipPath(zipPath: string): string {
  return zipPath.replace(/^"|"$/g, '')
}

export function createSingleInstanceAdditionalData(
  argv: string[] = process.argv
): {extractZip?: string} {
  const extractZip = parseExtractZipArg(argv)
  return extractZip ? {extractZip} : {}
}

@injectable()
export class ShellContextMenuService {
  public registerZipExtractMenu(): void {
    if (process.platform !== 'win32') {
      return
    }

    try {
      const command = this.buildExtractCommand()

      execFileSync(
        'reg',
        ['add', REGISTRY_BASE, '/ve', '/d', MENU_TITLE, '/f'],
        {windowsHide: true}
      )
      execFileSync(
        'reg',
        ['add', `${REGISTRY_BASE}\\command`, '/ve', '/d', command, '/f'],
        {windowsHide: true}
      )
      execFileSync(
        'reg',
        ['add', REGISTRY_BASE, '/v', 'Icon', '/d', `${process.execPath},0`, '/f'],
        {windowsHide: true}
      )

      logger.info('ShellContextMenu', 'ZIP 右键菜单已注册', {command})
    }
    catch (error) {
      logger.warn('ShellContextMenu', 'ZIP 右键菜单注册失败', error)
    }
  }

  public unregisterZipExtractMenu(): void {
    if (process.platform !== 'win32') {
      return
    }

    try {
      execFileSync(
        'reg',
        ['delete', REGISTRY_BASE, '/f'],
        {windowsHide: true}
      )
      logger.info('ShellContextMenu', 'ZIP 右键菜单已移除')
    }
    catch (error) {
      logger.warn('ShellContextMenu', 'ZIP 右键菜单移除失败', error)
    }
  }

  private buildExtractCommand(): string {
    if (app.isPackaged) {
      return `"${process.execPath}" --${EXTRACT_ZIP_SWITCH}="%1"`
    }

    return `"${process.execPath}" "${app.getAppPath()}" --${EXTRACT_ZIP_SWITCH}="%1"`
  }
}
