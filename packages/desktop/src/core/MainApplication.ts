import {BrowserWindow, Menu} from 'electron';
import path from 'node:path';
import {ApplicationLifecycle} from './ApplicationLifecycle';
import {WindowStateManager} from './WindowStateManager';
import {ProtocolManager} from './ProtocolManager';
import {EventManager} from './EventManager';
import logger from '../services/LoggerService';
import {isDev} from '../config/env';
import {getRendererPath} from '../utils/getRendererPath';
import {WindowManager} from './WindowManager';
import {Container} from 'inversify';
import {initServices} from './container';
import {ServiceInstanceMapping, ServiceMapping} from '@/services';
import {Config} from './Config';

  /**
   * 应用配置接口
   */
  export interface ApplicationConfig {
    /** 窗口默认配置 */
    window?: {
      width?: number;
      height?: number;
      autoHideMenuBar?: boolean;
      frame?: boolean;
    };
    /** 开发环境配置 */
    development?: {
      webUrl?: string;
      openDevTools?: boolean;
    };
    /** 生产环境配置 */
    production?: {
      resourcePath?: string;
      appUrl?: string;
    };
  }

  /**
   * 完整应用配置接口（合并后的配置）
   */
  interface MergedApplicationConfig {
    window: {
      width: number;
      height: number;
      autoHideMenuBar: boolean;
      frame: boolean;
    };
    development: {
      webUrl: string;
      openDevTools: boolean;
    };
    production: {
      resourcePath: string;
      appUrl: string;
    };
  }

/**
 * 主应用类
 * 整合所有管理器，提供统一的应用入口
 */
export class MainApplication {
  private _config: Config<MergedApplicationConfig>;
  private _isInitialized = false;
  private _mainWindow: BrowserWindow | null = null;
  private _container!: Container;

  // 核心管理器实例
  private _lifecycle = new ApplicationLifecycle();
  private _windowStateManager = new WindowStateManager();
  private _protocolManager = new ProtocolManager();
  private _eventManager = new EventManager();
  private _windowManager = WindowManager.getInstance();

  /**
   * 构造函数
   * @param config 应用配置
   */
  constructor(config: ApplicationConfig = {}) {
    this._config = new Config(this._mergeDefaultConfig(config));
    this._setupManagerRelations();
    this.initContainer();
  }

  getService<T extends keyof ServiceMapping>(
    key: T
  ): ServiceInstanceMapping[T] {
    return this._container.get(key);
  }

  initContainer() {
    this._container = new Container();
    initServices(this._container);
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
      // 1. 初始化协议管理器（必须在 app ready 之前）
      this._protocolManager.initialize();

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
      // 停止窗口状态跟踪
      this._windowStateManager.untrack();

      // 清理事件管理器
      this._eventManager.clear();

      // 重置协议管理器
      this._protocolManager.reset();

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
   * 获取事件管理器
   */
  public getEventManager(): EventManager {
    return this._eventManager;
  }

  /**
   * 获取窗口状态管理器
   */
  public getWindowStateManager(): WindowStateManager {
    return this._windowStateManager;
  }

  /**
   * 合并默认配置
   */
  private _mergeDefaultConfig(
    config: ApplicationConfig
  ): MergedApplicationConfig {
    return {
      window: {
        width: 800,
        height: 600,
        autoHideMenuBar: true,
        frame: true,
        ...config.window,
      },
      development: {
        webUrl:
          config.development?.webUrl ||
          process.env.VITE_WEB_URL ||
          'http://localhost:3000',
        openDevTools: config.development?.openDevTools ?? true,
      },
      production: {
        resourcePath: config.production?.resourcePath || getRendererPath(),
        appUrl: config.production?.appUrl || 'app://./index.html#/',
      },
    };
  }

  /**
   * 设置管理器之间的关系
   */
  private _setupManagerRelations(): void {
    // 事件管理器与其他管理器的集成将在需要时进行
  }

  /**
   * 设置生命周期回调
   */
  private _setupLifecycleCallbacks(): void {
    // 应用准备就绪时的回调
    this._lifecycle.onReady(async () => {
      await this._onAppReady();
    });

    // 应用退出前的回调
    this._lifecycle.onBeforeQuit(async () => {
      await this._onBeforeQuit();
    });

    // 所有窗口关闭时的回调
    this._lifecycle.onWindowAllClosed(async () => {
      this._mainWindow = null;
    });

    // 应用激活时的回调
    this._lifecycle.onActivate(async () => {
      await this._onActivate();
    });
  }

  /**
   * 应用准备就绪时的处理
   */
  private async _onAppReady(): Promise<void> {
    // 设置协议处理器
    if (!isDev) {
      this._protocolManager.setupAppProtocol(
        this._config.get('production').resourcePath
      );
    }

    // 创建主窗口
    await this._createMainWindow();

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
    const windowState = this._windowStateManager.getSavedState();

    const windowConfig = this._config.get('window');
    // 创建窗口选项
    const windowOptions = {
      width: windowState.width || windowConfig.width,
      height: windowState.height || windowConfig.height,
      autoHideMenuBar: windowConfig.autoHideMenuBar,
      frame: windowConfig.frame,
      webPreferences: {
        preload: path.join(__dirname, 'preload.mjs'),
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

    // 开始跟踪窗口状态
    this._windowStateManager.track(this._mainWindow);

    // 根据保存的配置决定是否最大化窗口
    if (windowState.isMaximized) {
      this._mainWindow.maximize();
    }

    // 移除应用菜单
    Menu.setApplicationMenu(null);

    // 设置窗口事件
    this._setupWindowEvents();

    // 加载页面
    await this._loadWindow();

    logger.info('MainApplication', '主窗口创建完成');
  }

  /**
   * 设置窗口事件
   */
  private _setupWindowEvents(): void {
    if (!this._mainWindow) return;

    // 设置基础窗口事件
    this._eventManager.setupWindowEvents(this._mainWindow);

    // 设置开发者工具快捷键
    this._eventManager.setupDevToolsShortcut(this._mainWindow);

    // 设置页面加载错误处理
    this._eventManager.setupLoadErrorHandler(this._mainWindow);

    // 设置渲染进程崩溃处理
    this._eventManager.setupRenderProcessHandler(this._mainWindow);

    // 监听窗口关闭事件
    this._mainWindow.on('closed', () => {
      this._mainWindow = null;
    });
  }

  /**
   * 加载窗口页面
   */
  private async _loadWindow(): Promise<void> {
    if (!this._mainWindow) return;

    try {
      if (isDev) {
        // 开发环境
        const webUrl = this._config.get('development').webUrl;
        logger.info('MainApplication', `加载开发环境URL: ${webUrl}`);

        await this._mainWindow.loadURL(webUrl);

        if (this._config.get('development').openDevTools) {
          this._mainWindow.webContents.openDevTools();
        }
      } else {
        // 生产环境
        const appUrl = this._config.get('production').appUrl;
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
  public get isInitialized(): boolean {
    return this._isInitialized;
  }

  /**
   * 获取应用配置
   */
  public get config(): Config<MergedApplicationConfig> {
    return this._config;
  }
}
