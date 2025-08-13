import type { BrowserWindow } from 'electron';
import type { WindowState } from './store';
import type StoreManager from './store/storeManager';
import { inject, injectable } from 'inversify';
import logger from './LoggerService';
import { EnumStoreKey } from './store';
import { EnumServiceKey } from './type';

/**
 * 窗口状态管理器
 * 负责管理窗口的位置、大小和状态的持久化
 */
@injectable()
export class WindowStateManager {
  private _window: BrowserWindow | null = null;
  private _isTracking = false;
  private _defaultState: WindowState;

  /**
   * 构造函数
   * @param defaultState 默认窗口状态
   */
  constructor(
    @inject(EnumServiceKey.StoreManager) private storeManager: StoreManager,
    defaultState: WindowState = {},
  ) {
    this._defaultState = {
      width: 800,
      height: 600,
      isMaximized: false,
      ...defaultState,
    };
  }

  start(window: BrowserWindow | null) {
    if (!window) {
      logger.warn('WindowStateManager', '没有窗口实例，无法跟踪窗口状态');
      return;
    }

    if (!this._window) {
      this.track(window);
    }
    this._setupEventListeners();
  }

  /**
   * 开始跟踪窗口状态
   * @param window 要跟踪的窗口实例
   */
  public track(window: BrowserWindow): this {
    if (this._isTracking) {
      logger.warn('WindowStateManager', '已经在跟踪窗口状态');
      return this;
    }

    this._window = window;
    // this._setupEventListeners()
    this._restoreWindowState();
    this._isTracking = true;

    logger.info('WindowStateManager', '开始跟踪窗口状态');
    return this;
  }

  /**
   * 停止跟踪窗口状态
   */
  public untrack(): this {
    if (!this._isTracking || !this._window) {
      return this;
    }

    this._saveCurrentState();
    this._removeEventListeners();
    this._window = null;
    this._isTracking = false;

    logger.info('WindowStateManager', '停止跟踪窗口状态');
    return this;
  }

  /**
   * 获取当前窗口状态
   */
  public getCurrentState(): WindowState | null {
    if (!this._window) {
      return null;
    }

    const isMaximized = this._window.isMaximized();

    if (isMaximized) {
      return { isMaximized }
    }

    const bounds = this._window.getBounds();
    return {
      width: bounds.width,
      height: bounds.height,
      x: bounds.x,
      y: bounds.y,
      isMaximized: false,
    };
  }

  /**
   * 获取保存的窗口状态
   */
  public getSavedState(): WindowState {
    const savedConfig = this.storeManager.get(EnumStoreKey.WINDOW);
    return {
      ...this._defaultState,
      ...savedConfig,
    };
  }

  /**
   * 应用窗口状态到当前窗口
   * @param state 要应用的状态
   */
  public applyState(state: WindowState): this {
    if (!this._window) {
      logger.warn('WindowStateManager', '没有窗口实例，无法应用状态');
      return this;
    }

    try {
      // 设置窗口大小和位置
      if (state.width && state.height) {
        this._window.setSize(state.width, state.height);
      }

      if (state.x !== undefined && state.y !== undefined) {
        this._window.setPosition(state.x, state.y);
      }

      // 设置最大化状态
      if (state.isMaximized) {
        this._window.maximize();
      }
      else if (this._window.isMaximized()) {
        this._window.unmaximize();
      }

      logger.debug('WindowStateManager', '窗口状态已应用', state);
    }
    catch (error) {
      logger.error('WindowStateManager', '应用窗口状态失败', error);
    }

    return this;
  }

  /**
   * 保存当前窗口状态
   */
  public saveCurrentState(): this {
    const currentState = this.getCurrentState();
    if (currentState) {
      this._saveState(currentState);
    }
    return this;
  }

  /**
   * 重置为默认状态
   */
  public resetToDefault(): this {
    this.applyState(this._defaultState);
    this._saveState(this._defaultState);
    logger.info('WindowStateManager', '窗口状态已重置为默认值');
    return this;
  }

  /**
   * 设置事件监听器
   */
  private _setupEventListeners(): void {
    if (!this._window)
      return;

    // 监听窗口大小和位置变化
    this._window.on('resize', this._handleWindowChange.bind(this));
    this._window.on('move', this._handleWindowChange.bind(this));

    // 监听窗口最大化和还原事件
    this._window.on('maximize', this._handleMaximize.bind(this));
    this._window.on('unmaximize', this._handleUnmaximize.bind(this));

    // 监听窗口关闭前事件
    this._window.on('close', this._handleWindowClose.bind(this));
  }

  /**
   * 移除事件监听器
   */
  private _removeEventListeners(): void {
    if (!this._window)
      return;

    this._window.removeAllListeners('resize');
    this._window.removeAllListeners('move');
    this._window.removeAllListeners('maximize');
    this._window.removeAllListeners('unmaximize');
    this._window.removeAllListeners('close');
  }

  /**
   * 处理窗口变化事件
   */
  private _handleWindowChange(): void {
    if (!this._window?.isMaximized()) {
      this._saveCurrentState();
    }
  }

  /**
   * 处理窗口最大化事件
   */
  private _handleMaximize(): void {
    this._saveState({ isMaximized: true });
    logger.debug('WindowStateManager', '窗口已最大化');
  }

  /**
   * 处理窗口还原事件
   */
  private _handleUnmaximize(): void {
    this._saveCurrentState();
    logger.debug('WindowStateManager', '窗口已还原');
  }

  /**
   * 处理窗口关闭事件
   */
  private _handleWindowClose(): void {
    this._saveCurrentState();
    logger.info('WindowStateManager', '窗口关闭前保存状态');
  }

  /**
   * 恢复窗口状态
   */
  private _restoreWindowState(): void {
    const savedState = this.getSavedState();
    this.applyState(savedState);
    logger.info('WindowStateManager', '窗口状态已恢复', savedState);
  }

  /**
   * 保存状态到持久化存储
   */
  private _saveState(state: WindowState): void {
    try {
      this.storeManager.set(EnumStoreKey.WINDOW, state);
      logger.debug('WindowStateManager', '窗口状态已保存', state);
    }
    catch (error) {
      logger.error('WindowStateManager', '保存窗口状态失败', error);
    }
  }

  /**
   * 保存当前状态的内部方法
   */
  private _saveCurrentState(): void {
    const currentState = this.getCurrentState();
    logger.info('WindowStateManager', '保存当前状态', currentState);
    if (currentState) {
      this._saveState(currentState);
    }
  }

  /**
   * 获取是否正在跟踪状态
   */
  public get isTracking(): boolean {
    return this._isTracking;
  }

  /**
   * 获取当前跟踪的窗口
   */
  public get window(): BrowserWindow | null {
    return this._window;
  }
}
