import type {Container} from 'inversify';
import type {Subscription} from 'rxjs';
import type {PartialConfig} from '@/common/config';
import type {ServiceInstanceMapping, ServiceMapping} from '@/services';
import {BrowserWindow, Menu} from 'electron';
import {debounceTime, filter} from 'rxjs/operators';
import {isDev, preloadPath} from '@/common';
import {EnumServiceKey} from '@/services/type';
import logger from '../services/LoggerService';
import {Config} from './Config';
import {initRegisterServices} from './container';
import {ElectronNativeEventManager} from './ElectronNativeEventManager';
import {WindowManager} from './WindowManager';

/**
 * 主应用类
 * 整合所有管理器，提供统一的应用入口
 * 使用 RxJS 事件流进行应用级别的事件管理
 */
export class MainApplication {
  private _config: Config;
  private _container!: Container;
  private _isInitialized = false;
  private _mainWindow: BrowserWindow | null = null;
  private _subscriptions = new Set<Subscription>();

  // 核心管理器实例
  private _nativeEventManager = new ElectronNativeEventManager();
  private _windowManager = WindowManager.getInstance();

  /**
   * 构造函数
   * @param config 应用配置
   */
  constructor(config: PartialConfig = {}) {
    this._config = new Config(config);
    this.initContainer();

    this._setupAppEventSubscriptions();
  }

  getService<T extends keyof ServiceMapping>(
    key: T
  ): ServiceInstanceMapping[T] {
    return this._container.get(key);
  }

  initContainer() {
    this._container = initRegisterServices(this);
  }

  /**
   * 初始化应用
   */
  public async initialize(): Promise<this> {
    if (this._isInitialized) {
      logger.warn('MainApplication', '应用已经初始化');
      return this;
    }

    try {
      // 初始化协议服务（只注册协议权限，不设置处理器）
      this.getService(EnumServiceKey.ProtocolService).initialize();

      await this._nativeEventManager.initialize();

      this._isInitialized = true;
      logger.info('MainApplication', '应用初始化完成');
    } catch (error) {
      logger.error('MainApplication', '应用初始化失败', error);
      throw error;
    }

    return this;
  }

  /**
   * 启动应用
   */
  public async start(): Promise<this> {
    if (!this._isInitialized) {
      await this.initialize();
    }

    logger.info('MainApplication', '应用启动');
    return this;
  }

  /**
   * 停止应用
   */
  public async stop(): Promise<this> {
    try {
      // 取消所有事件订阅
      this._subscriptions.forEach((subscription) => subscription.unsubscribe());
      this._subscriptions.clear();

      // 清理应用事件管理器
      this._nativeEventManager.cleanup();

      // 重置协议管理器
      this.getService(EnumServiceKey.ProtocolService).reset();

      // 清理快捷键服务
      this.getService(EnumServiceKey.HotkeyService).cleanup();

      this._isInitialized = false;
      logger.info('MainApplication', '应用已停止');
    } catch (error) {
      logger.error('MainApplication', '应用停止时出错', error);
    }

    return this;
  }

  /**
   * 获取主窗口实例
   */
  public getMainWindow(): BrowserWindow | null {
    return this._mainWindow;
  }

  /**
   * 获取 Electron 应用事件管理器
   */
  public getAppEventManager(): ElectronNativeEventManager {
    return this._nativeEventManager;
  }

  /**
   * 设置应用级别的 RxJS 事件订阅
   */
  private _setupAppEventSubscriptions(): void {
    // 应用准备就绪时的处理
    this._subscriptions.add(
      this._nativeEventManager.appReady$.subscribe(async () => {
        await this._onAppReady();
      })
    );

    // 应用退出前的处理
    this._subscriptions.add(
      this._nativeEventManager.appBeforeQuit$.subscribe(async () => {
        await this._onBeforeQuit();
      })
    );

    // 所有窗口关闭时的处理
    this._subscriptions.add(
      this._nativeEventManager.appWindowAllClosed$.subscribe(() => {
        this._mainWindow = null;
        logger.info('MainApplication', '所有窗口已关闭，主窗口引用已清空');
      })
    );

    // 应用激活时的处理（主要用于 macOS）
    this._subscriptions.add(
      this._nativeEventManager.appActivate$.subscribe(async () => {
        await this._onActivate();
      })
    );

    // 应用将要退出的处理
    this._subscriptions.add(
      this._nativeEventManager.appWillQuit$.subscribe(() => {
        logger.info('MainApplication', '应用将要退出');
      })
    );

    // 应用已退出的处理
    this._subscriptions.add(
      this._nativeEventManager.appQuit$.subscribe(() => {
        logger.info('MainApplication', '应用已完全退出');
      })
    );

    // 二次实例事件：确保窗口单例并聚焦现有窗口
    this._subscriptions.add(
      this._nativeEventManager.appSecondInstance$.subscribe(
        async ({argv, cwd}) => {
          logger.info(
            'MainApplication',
            '检测到二次实例启动，尝试聚焦已有主窗口'
          );
          if (this._mainWindow && !this._mainWindow.isDestroyed()) {
            if (this._mainWindow.isMinimized()) {
              this._mainWindow.restore();
            }
            this._mainWindow.focus();
            if (!this._mainWindow.isVisible()) {
              this._mainWindow.show();
            }
          } else {
            await this._createMainWindow();
          }
        }
      )
    );

    // 演示使用防抖的应用事件流（防止事件过于频繁）
    this._subscriptions.add(
      this._nativeEventManager
        .getDebouncedAppEvents$(200)
        .subscribe((event) => {
          logger.debug('MainApplication', `应用事件（防抖）: ${event.type}`, {
            timestamp: new Date(event.timestamp).toISOString(),
          });
        })
    );

    // 演示使用过滤的应用事件流（只监听特定事件）
    this._subscriptions.add(
      this._nativeEventManager
        .getFilteredEventStream('app:ready', 'app:before-quit', 'app:quit')
        .subscribe((event) => {
          logger.info('MainApplication', `重要应用事件: ${event.type}`);
        })
    );

    // 监听所有应用事件进行调试
    this._subscriptions.add(
      this._nativeEventManager.allAppEvents$
        .pipe(
          filter((event) => event.type.startsWith('app:')), // 确保只处理应用事件
          debounceTime(50) // 轻微防抖以避免日志过多
        )
        .subscribe((event) => {
          logger.debug('MainApplication', `应用事件: ${event.type}`, {
            timestamp: new Date(event.timestamp).toISOString(),
          });
        })
    );

    logger.info('MainApplication', 'RxJS 应用事件订阅已设置');
  }

  /**
   * 应用准备就绪时的处理
   */
  private async _onAppReady(): Promise<void> {
    // 在生产环境下，先设置协议处理器，确保页面加载前协议就绪
    if (!isDev) {
      logger.info('MainApplication', '开始设置协议处理器');
      this.getService(EnumServiceKey.ProtocolService).setupAppProtocol();
      logger.info('MainApplication', '协议处理器设置完成');
    }

    // 创建主窗口
    await this._createMainWindow();

    this.getService(EnumServiceKey.WindowStateManager).start(this._mainWindow);

    // 初始化自动更新
    this.getService(EnumServiceKey.AutoUpdaterService).init();

    // 初始化快捷键服务（必须在 app ready 之后）
    this.getService(EnumServiceKey.HotkeyService).initialize();

    this.getService(EnumServiceKey.CustomEventService).createMainWin$.next();

    logger.info('MainApplication', '应用准备就绪处理完成');
  }

  /**
   * 应用退出前的处理
   */
  private async _onBeforeQuit(): Promise<void> {
    // 停止应用
    await this.stop();
  }

  /**
   * 应用激活时的处理
   */
  private async _onActivate(): Promise<void> {
    if (this._windowManager.count() === 0) {
      await this._createMainWindow();
    }
  }

  /**
   * 创建主窗口
   */
  private async _createMainWindow(): Promise<void> {
    if (this._mainWindow && !this._mainWindow.isDestroyed()) {
      this._mainWindow.focus();
      return;
    }

    logger.info('MainApplication', '正在创建主窗口');

    // 获取窗口状态
    const windowStateManager = this.getService(
      EnumServiceKey.WindowStateManager
    );
    const windowState = windowStateManager.getSavedState();

    const windowConfig = this._config.get('window');
    // 创建窗口选项
    const windowOptions = {
      width: windowState.width || windowConfig.width,
      height: windowState.height || windowConfig.height,
      autoHideMenuBar: windowConfig.autoHideMenuBar,
      frame: windowConfig.frame,
      webPreferences: {
        preload: preloadPath,
        webSecurity: true,
        nodeIntegration: true,
        contextIsolation: true,
        allowRunningInsecureContent: true,
      },
      // 设置窗口位置
      ...(windowState.x !== undefined && windowState.y !== undefined
        ? {x: windowState.x, y: windowState.y}
        : {}),
    };

    // 创建浏览器窗口
    this._mainWindow = new BrowserWindow(windowOptions);

    windowStateManager.start(this._mainWindow);

    // 开始跟踪窗口状态
    // this._windowStateManager.track(this._mainWindow);

    // 根据保存的配置决定是否最大化窗口
    if (windowState.isMaximized) {
      this._mainWindow.maximize();
    }

    // 移除应用菜单
    Menu.setApplicationMenu(null);

    // 设置窗口关闭事件（直接在窗口上监听，不通过事件管理器）
    this._mainWindow.on('closed', () => {
      logger.info(
        'MainApplication',
        `窗口已关闭 (ID: ${this._mainWindow?.id})`
      );
      this._mainWindow = null;
    });

    // 设置窗口关闭前事件，实现点击关闭按钮时最小化而不是关闭
    this._mainWindow.on('close', (event) => {
      // 阻止默认的关闭行为
      event.preventDefault();

      logger.info(
        'MainApplication',
        `用户点击关闭按钮，执行最小化操作 (ID: ${this._mainWindow?.id})`
      );

      // 最小化窗口而不是关闭
      this._mainWindow?.minimize();

      // 可选：隐藏到系统托盘
      // this._mainWindow?.hide();
    });

    // 加载页面
    await this._loadWindow();

    logger.info('MainApplication', '主窗口创建完成');
  }

  /**
   * 加载窗口页面
   */
  private async _loadWindow(): Promise<void> {
    if (!this._mainWindow) return;

    try {
      if (isDev) {
        // 开发环境
        const webUrl = this._config.get('appUrl');
        logger.info('MainApplication', `加载开发环境URL: ${webUrl}`);

        await this._mainWindow.loadURL(webUrl);

        if (isDev) {
          this._mainWindow.webContents.openDevTools();
        }
      } else {
        // 生产环境
        const appUrl = this._config.get('appUrl');
        logger.info('MainApplication', `加载生产环境URL: ${appUrl}`);

        await this._mainWindow.loadURL(appUrl);
      }

      logger.info('MainApplication', '页面加载完成');
    } catch (error) {
      logger.error('MainApplication', '页面加载失败', error);

      // 打开开发者工具帮助调试
      if (
        this._mainWindow &&
        !this._mainWindow.webContents.isDevToolsOpened()
      ) {
        this._mainWindow.webContents.openDevTools();
      }

      throw error;
    }
  }

  /**
   * 获取应用是否已初始化
   */
  public get isInitialized() {
    return this._isInitialized;
  }

  /**
   * 获取应用配置
   */
  public get config() {
    return this._config;
  }

  /**
   * 获取事件统计信息
   */
  public getEventStats() {
    return {
      ...this._nativeEventManager.getEventStats(),
      appSubscriptions: this._subscriptions.size,
    };
  }
}
