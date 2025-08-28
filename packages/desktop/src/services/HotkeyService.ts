import {injectable, inject} from 'inversify';
import {globalShortcut, BrowserWindow, app} from 'electron';
import logger from './LoggerService';
import {EnumServiceKey} from './type';
import type {MainApplication} from '@/core/MainApplication';

/**
 * 快捷键服务
 * 管理全局快捷键注册和处理
 */
@injectable()
export class HotkeyService {
  private _isInitialized = false;
  private _registeredHotkeys = new Set<string>();

  constructor(
    @inject(EnumServiceKey.MainApplication) private _mainApp: MainApplication
  ) {}

  /**
   * 初始化快捷键服务
   */
  public initialize(): void {
    if (this._isInitialized) {
      logger.warn('HotkeyService', '快捷键服务已经初始化');
      return;
    }

    // 检查 Electron 应用是否已准备就绪
    if (!app.isReady()) {
      logger.error('HotkeyService', 'Electron 应用尚未准备就绪，无法注册全局快捷键');
      throw new Error('Electron app is not ready yet');
    }

    try {
      this._registerDefaultHotkeys();
      this._isInitialized = true;
      logger.info('HotkeyService', '快捷键服务初始化完成');
    } catch (error) {
      logger.error('HotkeyService', '快捷键服务初始化失败', error);
      throw error;
    }
  }

  /**
   * 注册默认快捷键
   */
  private _registerDefaultHotkeys(): void {
    // 注册开发者工具快捷键 Ctrl+Shift+0
    this.registerHotkey(
      'CommandOrControl+Shift+0',
      () => {
        this._toggleDevTools();
      },
      '打开/关闭开发者工具'
    );

    // 可以在这里添加更多默认快捷键
    // this.registerHotkey('CommandOrControl+R', () => {
    //   this._reloadWindow();
    // }, '刷新窗口');
  }

  /**
   * 注册快捷键
   * @param accelerator 快捷键组合，使用 Electron 的 accelerator 格式
   * @param callback 回调函数
   * @param description 快捷键描述
   */
  public registerHotkey(
    accelerator: string,
    callback: () => void,
    description?: string
  ): boolean {
    // 检查应用是否准备就绪
    if (!app.isReady()) {
      logger.error('HotkeyService', `无法注册快捷键 ${accelerator}：Electron 应用尚未准备就绪`);
      return false;
    }

    try {
      const success = globalShortcut.register(accelerator, callback);

      if (success) {
        this._registeredHotkeys.add(accelerator);
        logger.info(
          'HotkeyService',
          `快捷键注册成功: ${accelerator}${description ? ` - ${description}` : ''}`
        );
      } else {
        logger.warn(
          'HotkeyService',
          `快捷键注册失败: ${accelerator}，可能已被其他应用占用`
        );
      }

      return success;
    } catch (error) {
      logger.error('HotkeyService', `快捷键注册异常: ${accelerator}`, error);
      return false;
    }
  }

  /**
   * 取消注册快捷键
   * @param accelerator 快捷键组合
   */
  public unregisterHotkey(accelerator: string): void {
    try {
      globalShortcut.unregister(accelerator);
      this._registeredHotkeys.delete(accelerator);
      logger.info('HotkeyService', `快捷键取消注册: ${accelerator}`);
    } catch (error) {
      logger.error(
        'HotkeyService',
        `快捷键取消注册失败: ${accelerator}`,
        error
      );
    }
  }

  /**
   * 切换开发者工具显示状态
   */
  private _toggleDevTools(): void {
    const mainWindow = this._mainApp.getMainWindow();

    if (!mainWindow || mainWindow.isDestroyed()) {
      logger.warn('HotkeyService', '主窗口不存在，无法打开开发者工具');
      return;
    }

    try {
      if (mainWindow.webContents.isDevToolsOpened()) {
        mainWindow.webContents.closeDevTools();
        logger.info('HotkeyService', '开发者工具已关闭');
      } else {
        mainWindow.webContents.openDevTools();
        logger.info('HotkeyService', '开发者工具已打开');
      }
    } catch (error) {
      logger.error('HotkeyService', '切换开发者工具失败', error);
    }
  }

  /**
   * 刷新窗口（示例功能）
   */
  private _reloadWindow(): void {
    const mainWindow = this._mainApp.getMainWindow();

    if (!mainWindow || mainWindow.isDestroyed()) {
      logger.warn('HotkeyService', '主窗口不存在，无法刷新');
      return;
    }

    try {
      mainWindow.webContents.reload();
      logger.info('HotkeyService', '窗口已刷新');
    } catch (error) {
      logger.error('HotkeyService', '刷新窗口失败', error);
    }
  }

  /**
   * 检查快捷键是否已注册
   * @param accelerator 快捷键组合
   */
  public isRegistered(accelerator: string): boolean {
    return globalShortcut.isRegistered(accelerator);
  }

  /**
   * 获取所有已注册的快捷键
   */
  public getRegisteredHotkeys(): string[] {
    return Array.from(this._registeredHotkeys);
  }

  /**
   * 清理所有已注册的快捷键
   */
  public cleanup(): void {
    try {
      globalShortcut.unregisterAll();
      this._registeredHotkeys.clear();
      this._isInitialized = false;
      logger.info('HotkeyService', '所有快捷键已清理');
    } catch (error) {
      logger.error('HotkeyService', '清理快捷键失败', error);
    }
  }

  /**
   * 获取初始化状态
   */
  public get isInitialized(): boolean {
    return this._isInitialized;
  }
}

export default HotkeyService;
