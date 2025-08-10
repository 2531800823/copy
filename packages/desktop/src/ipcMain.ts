import type {BrowserWindow} from 'electron';
import {app, ipcMain} from 'electron';
import {autoUpdater} from 'electron-updater';
import {getWindowConfig, saveWindowConfig} from './services/store';
import logger from './services/LoggerService';
import { getAppAutoLaunch, setAppAutoLaunch } from './autoLaunch';

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
  /** 获取窗口配置 */
  GET_WINDOW_CONFIG: 'get-window-config',
  /** 保存窗口配置 */
  SAVE_WINDOW_CONFIG: 'save-window-config',
  /** 获取自启动状态 */
  GET_AUTO_LAUNCH: 'get-auto-launch',
  /** 设置自启动状态 */
  SET_AUTO_LAUNCH: 'set-auto-launch',
};

/**
 * 初始化 IPC 主进程
 * @param mainWindow 主窗口实例
 */
export default function initIpcMain(mainWindow: BrowserWindow) {
  // 置顶窗口
  ipcMain.handle(IpcChannel.TOGGLE_WINDOW_TOP, (_event, flag) => {
    if (!mainWindow) return;

    mainWindow.setAlwaysOnTop(flag);
    logger.info('IPC', `窗口置顶状态: ${flag}`);
  });

  // 获取应用版本
  ipcMain.handle(IpcChannel.GET_APP_VERSION, () => app.getVersion());

  // 获取窗口配置
  ipcMain.handle(IpcChannel.GET_WINDOW_CONFIG, () => {
    logger.debug('IPC', '获取窗口配置');
    return getWindowConfig();
  });

  // 保存窗口配置
  ipcMain.handle(IpcChannel.SAVE_WINDOW_CONFIG, (_event, config) => {
    logger.debug('IPC', '保存窗口配置', config);
    saveWindowConfig(config);
    return true;
  });

  // 获取自启动状态
  ipcMain.handle(IpcChannel.GET_AUTO_LAUNCH, () => {
    logger.debug('IPC', '获取自启动状态');
    return getAppAutoLaunch();
  });

  // 设置自启动状态
  ipcMain.handle(IpcChannel.SET_AUTO_LAUNCH, (_event, enable) => {
    logger.debug('IPC', `设置自启动状态: ${enable}`);
    return setAppAutoLaunch(enable);
  });

  // 检查更新
  ipcMain.handle(IpcChannel.CHECK_FOR_UPDATES, async () => {
    try {
      return await autoUpdater.checkForUpdates();
    } catch (error) {
      logger.error('Updater', '检查更新失败', error);
      return null;
    }
  });

  // 下载更新
  ipcMain.handle(IpcChannel.DOWNLOAD_UPDATE, async () => {
    try {
      return await autoUpdater.downloadUpdate();
    } catch (error) {
      logger.error('Updater', '下载更新失败', error);
      throw error;
    }
  });

  // 安装更新
  ipcMain.handle(IpcChannel.INSTALL_UPDATE, () => {
    logger.info('Updater', '退出并安装更新');
    autoUpdater.quitAndInstall(false, true);
  });
}
