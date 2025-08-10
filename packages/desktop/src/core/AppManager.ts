import {app} from 'electron';
import {IPCManager} from './IPCManager';
import {MainWindow} from './windows/MainWindow';
import {WindowManager} from './WindowManager';
import TrayService from '@/services/TrayService';

/**
 * 应用管理器
 */
export class AppManager {
  private windowManager = WindowManager.getInstance();
  private ipcManager = new IPCManager();
  private trayService = new TrayService();

  public init() {
    app.whenReady().then(() => {
      const mainWindow = new MainWindow();
      this.windowManager.add('main', mainWindow);
      this.ipcManager.registerHandlers();
    });

    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') app.quit();
    });

    app.on('activate', () => {
      if (this.windowManager.count() === 0) {
        const mainWindow = new MainWindow();
        this.windowManager.add('main', mainWindow);
      }
    });

    app.on('before-quit', () => {
      this.destroyEvent();
    });
  }

  destroyEvent() {
    this.trayService.destroy();
  }
}
