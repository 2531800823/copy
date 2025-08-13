import type { NativeImage } from 'electron'
import type { AutoUpdaterService } from './AutoUpdaterService'
import type { MainApplication } from '@/core/MainApplication'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { app, dialog, Menu, nativeImage, Tray } from 'electron'
import { inject, injectable } from 'inversify'
import { win } from '@/main'
import { createLogger } from './LoggerService'
import { EnumServiceKey } from './type'

const logger = createLogger('tray')

/**
 * 获取托盘图标路径
 * - 开发环境：取源码目录
 * - 生产环境：优先查找常规路径 process.resourcesPath/build/icons/png/32x32.png
 * - 如果常规路径不存在，降级到兼容路径
 */
function getIconPath() {
  if (process.env.NODE_ENV === 'development') {
    const devPath = path.join(__dirname, '../build/icons/png/32x32.png')
    logger.info('Tray', `开发环境图标路径: ${devPath}`)
    return devPath
  }

  // 优先尝试常规路径（直接在 app.asar 中的图标）
  const normalPath = path.join(
    process.resourcesPath,
    'build',
    'icons',
    'png',
    '32x32.png',
  );

  // 检查路径存在性（为了调试目的打印路径）
  logger.info(
    'Tray',
    `生产环境图标路径: ${normalPath}, 文件存在: ${fs.existsSync(normalPath)}`,
  );

  return normalPath
}

@injectable()
class TrayService {
  private tray: Tray | null = null
  private contextMenu: Menu | null = null
  private icon: NativeImage | null = null

  constructor(
    @inject(EnumServiceKey.AutoUpdaterService)
    private autoUpdaterService: AutoUpdaterService,
    @inject(EnumServiceKey.MainApplication)
    private MainApplication: MainApplication,
  ) {
    this.MainApplication.getAppEventManager().appReady$.subscribe(() => {
      this.init()
    });
  }

  init() {
    logger.info('正在创建系统托盘图标')

    this.initIcon()
    this.tray = new Tray(this.icon!)
    console.log('🚀 liu123 ~ this.tray:', this.tray)
    this.tray.setToolTip('我的应用')
    this.createContextMenu()

    this.registerEvent()
    logger.info('系统托盘图标创建完成')
  }

  destroy() {
    this.tray?.destroy()
  }

  initIcon() {
    const iconPath = getIconPath()
    logger.info(
      'Tray',
      `iconPath: ${iconPath}, exists: ${fs.existsSync(iconPath)}`,
    );
    this.icon = nativeImage.createFromPath(iconPath)
    logger.info('Tray', `icon is empty: ${this.icon.isEmpty()}`)
  }

  registerEvent() {
    logger.info('注册托盘事件 - click')

    this.tray?.on('click', () => {
      if (win) {
        if (win.isVisible()) {
          win.hide()
        }
        else {
          win.show()
          win.focus()
        }
      }
    })
  }

  createContextMenu() {
    this.contextMenu = Menu.buildFromTemplate([
      {
        label: '置顶窗口',
        type: 'checkbox',
        checked: false,
        click: (menuItem) => {
          if (!win)
            return

          win.setAlwaysOnTop(menuItem.checked)
          logger.info('Tray', `窗口置顶状态: ${menuItem.checked}`)
        },
      },
      { type: 'separator' },
      {
        label: '关于',
        click: () => {
          logger.info('打开关于')
          this.about()
        },
      },
      {
        label: '显示窗口',
        click: () => {
          logger.info('显示窗口')
          if (win) {
            win.show()
            win.focus()
          }
        },
      },
      {
        label: '检查更新',
        click: () => {
          logger.info('检查更新')
          this.autoUpdaterService.checkForUpdates()
        },
      },

      { type: 'separator' },
      {
        label: '退出',
        click: () => {
          logger.info('退出')
          app.quit()
        },
      },
    ])

    if (this.tray && this.contextMenu) {
      this.tray.setContextMenu(this.contextMenu)
    }
  }

  about() {
    const detail = `APP 版本：${app.getVersion()} `

    dialog.showMessageBox({
      title: '关于',
      type: 'info',
      message: '关于',
      detail,
      noLink: true,
      buttons: ['确定'],
    })
  }

  getIconPath() {
    return getIconPath()
  }
}

export default TrayService
