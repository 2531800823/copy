import {app} from 'electron';
import logger from '../services/LoggerService';
import {setupAutoUpdater} from '../update';

/**
 * 应用生命周期管理器
 * 负责管理应用的启动、关闭等生命周期事件
 */
export class ApplicationLifecycle {
  private _isInitialized = false;
  private _onReadyCallbacks: Array<() => void | Promise<void>> = [];
  private _onBeforeQuitCallbacks: Array<() => void | Promise<void>> = [];
  private _onWindowAllClosedCallbacks: Array<() => void | Promise<void>> = [];
  private _onActivateCallbacks: Array<() => void | Promise<void>> = [];

  /**
   * 初始化应用生命周期管理
   */
  public async initialize(): Promise<void> {
    if (this._isInitialized) {
      logger.warn('ApplicationLifecycle', '应用生命周期已经初始化');
      return;
    }

    this._setupEventListeners();
    this._setupAppFeatures();

    this._isInitialized = true;
    logger.info('ApplicationLifecycle', '应用生命周期管理器初始化完成');
  }

  /**
   * 添加应用准备就绪回调
   */
  public onReady(callback: () => void | Promise<void>): this {
    this._onReadyCallbacks.push(callback);
    return this;
  }

  /**
   * 添加应用退出前回调
   */
  public onBeforeQuit(callback: () => void | Promise<void>): this {
    this._onBeforeQuitCallbacks.push(callback);
    return this;
  }

  /**
   * 添加所有窗口关闭回调
   */
  public onWindowAllClosed(callback: () => void | Promise<void>): this {
    this._onWindowAllClosedCallbacks.push(callback);
    return this;
  }

  /**
   * 添加应用激活回调
   */
  public onActivate(callback: () => void | Promise<void>): this {
    this._onActivateCallbacks.push(callback);
    return this;
  }

  /**
   * 设置应用事件监听器
   */
  private _setupEventListeners(): void {
    // 应用准备就绪
    app.whenReady().then(async () => {
      logger.info('ApplicationLifecycle', '应用准备就绪');
      await this._executeCallbacks(this._onReadyCallbacks);
    });

    // 所有窗口关闭
    app.on('window-all-closed', async () => {
      logger.info('ApplicationLifecycle', '所有窗口已关闭');

      await this._executeCallbacks(this._onWindowAllClosedCallbacks);

      // 在非 macOS 平台下退出应用
      if (process.platform !== 'darwin') {
        logger.info('ApplicationLifecycle', '应用即将退出');
        app.quit();
      }
    });

    // 应用激活（macOS）
    app.on('activate', async () => {
      logger.info('ApplicationLifecycle', '应用被激活');
      await this._executeCallbacks(this._onActivateCallbacks);
    });

    // 应用退出前
    app.on('before-quit', async () => {
      logger.info('ApplicationLifecycle', '应用即将退出');
      await this._executeCallbacks(this._onBeforeQuitCallbacks);
    });
  }

  /**
   * 设置应用功能
   */
  private _setupAppFeatures(): void {
    // 配置自动更新
    setupAutoUpdater();

    // 设置自启动状态（在应用准备就绪后执行）
    this.onReady(() => {});
  }

  /**
   * 执行回调函数数组
   */
  private async _executeCallbacks(
    callbacks: Array<() => void | Promise<void>>
  ): Promise<void> {
    for (const callback of callbacks) {
      try {
        await callback();
      } catch (error) {
        logger.error('ApplicationLifecycle', '执行回调函数时出错', error);
      }
    }
  }

  /**
   * 获取应用是否已初始化
   */
  public get isInitialized(): boolean {
    return this._isInitialized;
  }
}
