import type StoreManager from './store/storeManager'
import {spawn} from 'node:child_process'
import fs from 'node:fs/promises'
import path from 'node:path'
import {pathToFileURL} from 'node:url'
import {dialog, type BrowserWindow, type OpenDialogOptions, shell} from 'electron'
import extract from 'extract-zip'
import {inject, injectable} from 'inversify'
import {dataPath} from '@/common/path'
import logger from './LoggerService'
import {EnumStoreKey} from './store'
import {EnumServiceKey} from './type'

export interface ExtractZipResult {
  outputDir: string
}

@injectable()
export class ArchiveService {
  constructor(
    @inject(EnumServiceKey.StoreManager)
    private storeManager: StoreManager
  ) {}

  public async getWorkspaceDir(): Promise<string> {
    const savedPath = this.storeManager.get(EnumStoreKey.ARCHIVE_WORKSPACE_DIR)
    const workspaceDir = savedPath || path.join(dataPath, 'workspaces')
    await fs.mkdir(workspaceDir, {recursive: true})
    return workspaceDir
  }

  public async selectWorkspaceDir(
    window: BrowserWindow | null
  ): Promise<string | null> {
    const currentDir = await this.getWorkspaceDir()
    const options: OpenDialogOptions = {
      title: '选择 ZIP 工作目录',
      defaultPath: currentDir,
      properties: ['openDirectory', 'createDirectory'],
    }

    const result = window
      ? await dialog.showOpenDialog(window, options)
      : await dialog.showOpenDialog(options)

    if (result.canceled || !result.filePaths[0]) {
      return null
    }

    const selectedDir = result.filePaths[0]
    await fs.mkdir(selectedDir, {recursive: true})
    this.storeManager.set(EnumStoreKey.ARCHIVE_WORKSPACE_DIR, selectedDir)
    logger.info('Archive', 'ZIP 工作目录已更新', selectedDir)
    return selectedDir
  }

  public async extractZipAndOpen(zipPath: string): Promise<ExtractZipResult> {
    const normalizedZipPath = path.resolve(zipPath)
    await this.validateZipPath(normalizedZipPath)

    const workspaceDir = await this.getWorkspaceDir()
    const outputDir = await this.createOutputDir(workspaceDir, normalizedZipPath)

    await extract(normalizedZipPath, {
      dir: outputDir,
      onEntry: (entry) => {
        const entryPath = path.resolve(outputDir, entry.fileName)
        if (!this.isInsideDirectory(entryPath, outputDir)) {
          throw new Error(`ZIP 内包含非法路径: ${entry.fileName}`)
        }
      },
    })

    await this.openInVSCode(outputDir)
    logger.info('Archive', 'ZIP 解压并打开完成', {zipPath, outputDir})

    return {outputDir}
  }

  private async validateZipPath(zipPath: string): Promise<void> {
    if (path.extname(zipPath).toLowerCase() !== '.zip') {
      throw new Error('仅支持 ZIP 文件')
    }

    const stat = await fs.stat(zipPath).catch(() => null)
    if (!stat?.isFile()) {
      throw new Error('ZIP 文件不存在或不可读取')
    }
  }

  private async createOutputDir(
    workspaceDir: string,
    zipPath: string
  ): Promise<string> {
    const baseName = this.sanitizeName(path.basename(zipPath, path.extname(zipPath)))
    const timestamp = this.formatTimestamp(new Date())
    const candidates = [
      baseName,
      `${baseName}-${timestamp}`,
      ...Array.from({length: 99}, (_, index) => `${baseName}-${timestamp}-${index + 2}`),
    ]

    for (const candidate of candidates) {
      const outputDir = path.resolve(workspaceDir, candidate)

      if (!this.isInsideDirectory(outputDir, workspaceDir)) {
        throw new Error('解压目标目录非法')
      }

      if (await this.createFreshDir(outputDir)) {
        return outputDir
      }
    }

    throw new Error('无法创建唯一的解压目录')
  }

  private async createFreshDir(targetPath: string): Promise<boolean> {
    return fs.mkdir(targetPath).then(
      () => true,
      (error: NodeJS.ErrnoException) => {
        if (error.code === 'EEXIST') {
          return false
        }
        throw error
      }
    )
  }

  private sanitizeName(name: string): string {
    const sanitized = name.replace(/[<>:"/\\|?*\x00-\x1F]/g, '-').trim()
    return sanitized || 'archive'
  }

  private formatTimestamp(date: Date): string {
    const pad = (value: number) => `${value}`.padStart(2, '0')
    return [
      date.getFullYear(),
      pad(date.getMonth() + 1),
      pad(date.getDate()),
      '-',
      pad(date.getHours()),
      pad(date.getMinutes()),
      pad(date.getSeconds()),
    ].join('')
  }

  private isInsideDirectory(targetPath: string, parentDir: string): boolean {
    const relativePath = path.relative(parentDir, targetPath)
    return (
      relativePath === '' ||
      (!relativePath.startsWith('..') && !path.isAbsolute(relativePath))
    )
  }

  private async openInVSCode(outputDir: string): Promise<void> {
    const vscodeUri = `vscode://file${pathToFileURL(outputDir).pathname}`

    try {
      await shell.openExternal(vscodeUri)
      return
    }
    catch (error) {
      logger.warn('Archive', '通过 VSCode URI 打开失败，尝试 code 命令', error)
    }

    await new Promise<void>((resolve, reject) => {
      const child = spawn('code', [outputDir], {
        detached: true,
        shell: process.platform === 'win32',
        stdio: 'ignore',
      })

      child.once('error', reject)
      child.once('spawn', () => {
        child.unref()
        resolve()
      })
    }).catch((error) => {
      logger.error('Archive', '打开 VSCode 失败', error)
      throw new Error('未能启动 VSCode，请确认 VSCode 已安装并配置 code 命令')
    })
  }
}
