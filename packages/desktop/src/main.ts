import type { BrowserWindow } from 'electron';
import type { ApplicationConfig } from './core/MainApplication';
import { MainApplication } from './core/MainApplication';
import logger from './services/LoggerService';
import 'reflect-metadata';
/**
 * Electron 主进程入口文件
 * 使用面向对象架构和纯 RxJS 事件流管理应用生命周期
 */

/** 主窗口实例 - 保持向后兼容性 */
export let win: BrowserWindow | null = null

/**
 * 应用配置
 */
const appConfig: ApplicationConfig = {
  window: {
    width: 800,
    height: 600,
    autoHideMenuBar: true,
    frame: true,
  },
  development: {
    webUrl: process.env.VITE_WEB_URL || 'http://localhost:7010',
    openDevTools: true,
  },
  production: {
    appUrl: 'app://./index.html#/',
  },
}

/**
 * 创建并启动应用实例
 */
async function startApplication() {
  try {
    const app = new MainApplication(appConfig)

    await app.start()

    // 更新全局 win 变量以保持兼容性
    win = app.getMainWindow()

    // 使用纯 RxJS Observable 监听应用级别的事件
    const appEventManager = app.getAppEventManager()

    // 监听应用准备就绪事件
    appEventManager.appReady$.subscribe(() => {
      win = app.getMainWindow() // 应用准备就绪后更新窗口引用
      logger.info('Main', '应用准备就绪，窗口引用已更新')
    });

    // 监听所有窗口关闭事件
    appEventManager.appWindowAllClosed$.subscribe(() => {
      win = null // 所有窗口关闭时清空引用
      logger.info('Main', '所有窗口已关闭，全局窗口引用已清空')
    });

    // 监听应用激活事件（macOS）
    appEventManager.appActivate$.subscribe(() => {
      // 应用激活时可能会重新创建窗口
      setTimeout(() => {
        win = app.getMainWindow()
        if (win) {
          logger.info('Main', '应用激活后窗口引用已更新')
        }
      }, 100) // 小延迟确保窗口创建完成
    });

    // 监听应用退出事件
    appEventManager.appQuit$.subscribe(() => {
      logger.info('Main', '应用已完全退出')
    });

    // 使用 RxJS 操作符组合监听关键事件
    appEventManager
      .getFilteredEventStream('app:ready', 'app:quit')
      .subscribe((event) => {
        logger.info('Main', `关键应用事件: ${event.type}`)
      });

    // 打印应用事件统计信息
    const stats = app.getEventStats()
    logger.info('Main', '应用启动成功', {
      ...stats,
    })
  }
  catch (error) {
    logger.error('Main', '应用启动失败', error)
    process.exit(1)
  }
}

// 启动应用
startApplication()
