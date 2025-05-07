import type {
  BrowserWindow,
} from 'electron';
import {
  app,
  ipcMain,
} from 'electron'
import { autoUpdater } from 'electron-updater'
import logger from './logger'

export const IpcChannel = {
  /** 窗口置顶 */
  TOGGLE_WINDOW_TOP: 'toggle-window-top',
  /** 检查更新 */
  CHECK_FOR_UPDATES: 'updater:check',
  /** 下载更新 */
  DOWNLOAD_UPDATE: 'updater:download',
  /** 安装更新 */
  INSTALL_UPDATE: 'updater:install',
  /** 获取应用版本 */
  GET_APP_VERSION: 'get-app-version',
};

function initIpcMain(win: BrowserWindow) {
  ipcMain.handle(IpcChannel.TOGGLE_WINDOW_TOP, (e, message) => {
    win.setAlwaysOnTop(message);
  })

  // 获取应用版本
  ipcMain.handle(IpcChannel.GET_APP_VERSION, () => {
    logger.info('IPC', '获取应用版本')
    return app.getVersion()
  });

  // 检查更新
  ipcMain.handle(IpcChannel.CHECK_FOR_UPDATES, async () => {
    logger.info('IPC', '收到检查更新请求')
    try {
      return await autoUpdater.checkForUpdates()
    }
    catch (error) {
      logger.error('IPC', '检查更新出错', error)
      throw error
    }
  })

  // 下载更新 (如果设置了autoDownload为false，可以手动触发下载)
  ipcMain.handle(IpcChannel.DOWNLOAD_UPDATE, async () => {
    logger.info('IPC', '收到下载更新请求')
    try {
      return await autoUpdater.downloadUpdate()
    }
    catch (error) {
      logger.error('IPC', '下载更新出错', error)
      throw error
    }
  })

  // 安装更新
  ipcMain.handle(IpcChannel.INSTALL_UPDATE, () => {
    logger.info('IPC', '收到安装更新请求')
    autoUpdater.quitAndInstall(false, true)
  });
}

export default initIpcMain
