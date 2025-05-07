import path from 'node:path'
import { app, Menu, nativeImage, Tray } from 'electron'
import logger from './logger'
import { PUBLIC, win } from './main'

/**
 * 创建系统托盘图标
 */
// eslint-disable-next-line import/no-mutable-exports
export let tray: Tray | null = null

export function createTray() {
  logger.info('Tray', '正在创建系统托盘图标')

  // 加载托盘图标
  const iconPath = path.join(PUBLIC, 'electron-vite.svg')
  const icon = nativeImage.createFromPath(iconPath)

  tray = new Tray(icon)
  tray.setToolTip('我的应用')

  // 创建托盘菜单
  const contextMenu = Menu.buildFromTemplate([
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
      label: '显示窗口',
      click: () => {
        if (win) {
          win.show()
          win.focus()
        }
      },
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => {
        app.quit()
      },
    },
  ])

  // 设置托盘菜单
  tray.setContextMenu(contextMenu)

  // 点击托盘图标时显示窗口
  tray.on('click', () => {
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

  logger.info('Tray', '系统托盘图标创建完成')
}
