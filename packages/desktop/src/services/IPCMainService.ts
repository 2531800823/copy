import type {AutoLaunchService} from './AutoLaunchService';
import type {ArchiveService} from './ArchiveService';
import type {CustomEventService} from './CustomEventService';
import type {MainApplication} from '@/core/MainApplication';
import {app, ipcMain} from 'electron';
import {autoUpdater} from 'electron-updater';

import {inject, injectable} from 'inversify';
import {delay} from 'rxjs';
import {IpcChannel} from '@/ipc/channels';
import logger from './LoggerService';
import {EnumServiceKey} from './type';

@injectable()
export class IPCMainService {
  private registered = false;

  constructor(
    @inject(EnumServiceKey.MainApplication)
    private mainApplication: MainApplication,
    @inject(EnumServiceKey.CustomEventService)
    private customEventService: CustomEventService,
    @inject(EnumServiceKey.AutoLaunchService)
    private autoLaunchService: AutoLaunchService,
    @inject(EnumServiceKey.ArchiveService)
    private archiveService: ArchiveService
  ) {
    //   延迟注册
    this.customEventService.createMainWin$.pipe(delay(1000)).subscribe(() => {
      this.register();
    });
  }

  get mainWindow() {
    return this.mainApplication.getMainWindow();
  }

  public register() {
    if (this.registered) return;
    this.registered = true;

    // 置顶窗口
    ipcMain.handle(IpcChannel.TOGGLE_WINDOW_TOP, (_event, flag) => {
      if (!this.mainWindow) return;

      this.mainWindow.setAlwaysOnTop(flag);
      logger.info('IPC', `窗口置顶状态: ${flag}`);
    });

    // 获取应用版本
    ipcMain.handle(IpcChannel.GET_APP_VERSION, () => app.getVersion());

    // 获取窗口配置
    ipcMain.handle(IpcChannel.GET_WINDOW_CONFIG, () => {
      logger.debug('IPC', '获取窗口配置');
      return this.mainApplication
        .getService(EnumServiceKey.WindowStateManager)
        .getSavedState();
    });

    // 保存窗口配置
    ipcMain.handle(IpcChannel.SAVE_WINDOW_CONFIG, (_event, config) => {
      logger.debug('IPC', '保存窗口配置', config);
      this.mainApplication
        .getService(EnumServiceKey.WindowStateManager)
        .saveCurrentState();
      return true;
    });

    // 获取自启动状态
    ipcMain.handle(IpcChannel.GET_AUTO_LAUNCH, () => {
      logger.debug('IPC', '获取自启动状态');
      return this.autoLaunchService.getAutoLaunch();
    });

    // 设置自启动状态
    ipcMain.handle(IpcChannel.SET_AUTO_LAUNCH, (_event, enable) => {
      logger.debug('IPC', `设置自启动状态: ${enable}`);
      return this.autoLaunchService.setEnabled(enable);
    });

    // 解压 ZIP 并打开 VSCode
    ipcMain.handle(IpcChannel.ARCHIVE_EXTRACT_ZIP_AND_OPEN, (_event, zipPath) => {
      logger.debug('IPC', '解压 ZIP 并打开 VSCode', zipPath);
      return this.archiveService.extractZipAndOpen(zipPath);
    });

    // 获取 ZIP 工作目录
    ipcMain.handle(IpcChannel.ARCHIVE_GET_WORKSPACE_DIR, () => {
      logger.debug('IPC', '获取 ZIP 工作目录');
      return this.archiveService.getWorkspaceDir();
    });

    // 选择 ZIP 工作目录
    ipcMain.handle(IpcChannel.ARCHIVE_SELECT_WORKSPACE_DIR, () => {
      logger.debug('IPC', '选择 ZIP 工作目录');
      return this.archiveService.selectWorkspaceDir(this.mainWindow);
    });

    // 隐藏 ZIP 投放窗口
    ipcMain.handle(IpcChannel.ARCHIVE_HIDE_DROP_WINDOW, () => {
      logger.debug('IPC', '隐藏 ZIP 投放窗口');
      this.mainApplication.hideDropWindow(300);
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
}
