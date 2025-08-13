import type { BrowserWindow } from 'electron';
import { app, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater'
import { IpcChannel } from './ipc/channels'
import logger from './services/LoggerService'

// 共享 IpcChannel

/**
 * 初始化 IPC 主进程
 * @param mainWindow 主窗口实例
 */
export default function initIpcMain(mainWindow: BrowserWindow) {
  // 置顶窗口
  ipcMain.handle(IpcChannel.TOGGLE_WINDOW_TOP, (_event, flag) => {
    if (!mainWindow)
      return;

    mainWindow.setAlwaysOnTop(flag);
    logger.info('IPC', `窗口置顶状态: ${flag}`);
  })

  // 获取应用版本
  ipcMain.handle(IpcChannel.GET_APP_VERSION, () => app.getVersion());

  // 获取窗口配置
  ipcMain.handle(IpcChannel.GET_WINDOW_CONFIG, () => {
    logger.debug('IPC', '获取窗口配置');
    // return getWindowConfig()
    return {};
  })

  // 保存窗口配置
  ipcMain.handle(IpcChannel.SAVE_WINDOW_CONFIG, (_event, config) => {
    logger.debug('IPC', '保存窗口配置', config);
    // saveWindowConfig(config)
    return true;
  })

  // 获取自启动状态
  ipcMain.handle(IpcChannel.GET_AUTO_LAUNCH, () => {
    logger.debug('IPC', '获取自启动状态');
    // return getAppAutoLaunch();
    return false;
  })

  // 设置自启动状态
  ipcMain.handle(IpcChannel.SET_AUTO_LAUNCH, (_event, enable) => {
    logger.debug('IPC', `设置自启动状态: ${enable}`);
    // return setAppAutoLaunch(enable);
    return false;
  })

  // 检查更新
  ipcMain.handle(IpcChannel.CHECK_FOR_UPDATES, async () => {
    try {
      return await autoUpdater.checkForUpdates();
    }
    catch (error) {
      logger.error('Updater', '检查更新失败', error);
      return null;
    }
  });

  // 下载更新
  ipcMain.handle(IpcChannel.DOWNLOAD_UPDATE, async () => {
    try {
      return await autoUpdater.downloadUpdate();
    }
    catch (error) {
      logger.error('Updater', '下载更新失败', error);
      throw error;
    }
  });

  // 安装更新
  ipcMain.handle(IpcChannel.INSTALL_UPDATE, () => {
    logger.info('Updater', '退出并安装更新');
    autoUpdater.quitAndInstall(false, true);
  })
}
