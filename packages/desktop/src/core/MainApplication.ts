import type {Container} from 'inversify';
import type {ChildProcessWithoutNullStreams} from 'node:child_process';
import type {Subscription} from 'rxjs';
import type {PartialConfig} from '@/common/config';
import type {ServiceInstanceMapping, ServiceMapping} from '@/services';
import {spawn} from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import {app, BrowserWindow, dialog, Menu, screen} from 'electron';
import {debounceTime, filter} from 'rxjs/operators';
import {isDev, preloadPath} from '@/common';
import {EnumServiceKey} from '@/services/type';
import {parseExtractZipArg} from '@/services/ShellContextMenuService';
import logger from '../services/LoggerService';
import {Config} from './Config';
import {initRegisterServices} from './container';
import {ElectronNativeEventManager} from './ElectronNativeEventManager';

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
  private _dropWindow: BrowserWindow | null = null;
  private _dragMonitorProcess: ChildProcessWithoutNullStreams | null = null;
  private _dropWindowHideTimer: NodeJS.Timeout | null = null;
  private _isQuitting = false;
  private _subscriptions = new Set<Subscription>();

  // 核心管理器实例
  private _nativeEventManager = new ElectronNativeEventManager();

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

    // 二次实例事件：处理右键菜单参数，或聚焦已有主窗口
    this._subscriptions.add(
      this._nativeEventManager.appSecondInstance$.subscribe(
        async ({argv, additionalData}) => {
          const zipPath =
            additionalData?.extractZip || parseExtractZipArg(argv);
          if (zipPath) {
            logger.info('MainApplication', '收到右键菜单解压请求', zipPath);
            await this._handleExtractZipFromContextMenu(zipPath);
            return;
          }

          logger.info(
            'MainApplication',
            '检测到二次实例启动，尝试聚焦已有主窗口',
            {argv, additionalData}
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
    const contextZipPath = parseExtractZipArg(process.argv);

    // 在生产环境下，先设置协议处理器，确保页面加载前协议就绪
    if (!isDev) {
      logger.info('MainApplication', '开始设置协议处理器');
      this.getService(EnumServiceKey.ProtocolService).setupAppProtocol();
      logger.info('MainApplication', '协议处理器设置完成');
    }

    if (process.platform === 'win32') {
      this.getService(EnumServiceKey.ShellContextMenuService).registerZipExtractMenu();
    }

    // 右键菜单启动时只保留托盘，不弹出主窗口
    if (!contextZipPath) {
      await this._createMainWindow();
    }

    await this._createDropWindow();

    if (this._mainWindow) {
      this.getService(EnumServiceKey.WindowStateManager).start(this._mainWindow);
    }

    // 初始化自动更新
    this.getService(EnumServiceKey.AutoUpdaterService).init();

    // 初始化快捷键服务（必须在 app ready 之后）
    this.getService(EnumServiceKey.HotkeyService).initialize();

    this.getService(EnumServiceKey.CustomEventService).createMainWin$.next();
    this._startDragMonitor();

    if (contextZipPath) {
      await this._handleExtractZipFromContextMenu(contextZipPath);
    }

    logger.info('MainApplication', '应用准备就绪处理完成');
  }

  private async _handleExtractZipFromContextMenu(zipPath: string): Promise<void> {
    try {
      const result = await this.getService(EnumServiceKey.ArchiveService).extractZipAndOpen(
        zipPath
      );
      logger.info('MainApplication', '右键菜单解压完成', result);
    }
    catch (error) {
      logger.error('MainApplication', '右键菜单解压失败', error);
      dialog.showErrorBox(
        '解压失败',
        error instanceof Error ? error.message : '解压 ZIP 失败'
      );
    }
  }

  /**
   * 应用退出前的处理
   */
  private async _onBeforeQuit(): Promise<void> {
    this._isQuitting = true;
    this._stopDragMonitor();
    // 停止应用
    await this.stop();
  }

  /**
   * 应用激活时的处理
   */
  private async _onActivate(): Promise<void> {
    if (this._mainWindow && !this._mainWindow.isDestroyed()) {
      if (this._mainWindow.isMinimized()) {
        this._mainWindow.restore();
      }
      this._mainWindow.show();
      this._mainWindow.focus();
      return;
    }

    await this._createMainWindow();
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

    // 统一处理窗口关闭：应用退出时放行，普通关闭时按配置隐藏或最小化。
    this._mainWindow.on('close', (event) => {
      if (this._isQuitting) {
        logger.info(
          'MainApplication',
          `应用正在退出，允许关闭窗口 (ID: ${this._mainWindow?.id})`
        );
        return;
      }

      const closeButtonBehavior = windowConfig.closeButtonBehavior;
      if (closeButtonBehavior === 'quit') {
        logger.info(
          'MainApplication',
          `用户点击关闭按钮，退出应用 (ID: ${this._mainWindow?.id})`
        );
        app.quit();
        return;
      }

      event.preventDefault();

      logger.info(
        'MainApplication',
        `用户点击关闭按钮，执行${closeButtonBehavior === 'hide' ? '隐藏' : '最小化'}操作 (ID: ${this._mainWindow?.id})`
      );

      if (closeButtonBehavior === 'hide') {
        this._mainWindow?.hide();
      } else {
        this._mainWindow?.minimize();
      }
    });

    // 加载页面
    await this._loadWindow();

    logger.info('MainApplication', '主窗口创建完成');
  }

  private async _createDropWindow(): Promise<void> {
    if (this._dropWindow && !this._dropWindow.isDestroyed()) {
      return;
    }

    const {x, y} = this._getDropWindowBounds();

    this._dropWindow = new BrowserWindow({
      width: 280,
      height: 170,
      x,
      y,
      frame: false,
      transparent: true,
      resizable: false,
      maximizable: false,
      minimizable: false,
      skipTaskbar: true,
      show: false,
      alwaysOnTop: true,
      autoHideMenuBar: true,
      backgroundColor: '#00000000',
      webPreferences: {
        preload: preloadPath,
        webSecurity: true,
        nodeIntegration: true,
        contextIsolation: true,
        allowRunningInsecureContent: true,
      },
    });

    this._dropWindow.setAlwaysOnTop(true, 'floating');
    this._dropWindow.setVisibleOnAllWorkspaces(true, {
      visibleOnFullScreen: true,
    });

    this._dropWindow.on('closed', () => {
      logger.info('MainApplication', 'ZIP 投放窗口已关闭');
      this._dropWindow = null;
    });

    await this._loadDropWindow();
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

  private async _loadDropWindow(): Promise<void> {
    if (!this._dropWindow) return;

    const appUrl = this._config.get('appUrl');
    const dropWindowUrl = new URL(appUrl);
    dropWindowUrl.searchParams.set('window', 'drop');

    await this._dropWindow.loadURL(dropWindowUrl.toString());
    logger.info('MainApplication', `ZIP 投放窗口已加载: ${dropWindowUrl}`);
  }

  public showDropWindow(): void {
    if (!this._dropWindow || this._dropWindow.isDestroyed()) {
      void this._createDropWindow().then(() => this.showDropWindow());
      return;
    }

    if (this._dropWindowHideTimer) {
      clearTimeout(this._dropWindowHideTimer);
      this._dropWindowHideTimer = null;
    }

    this._dropWindow.setBounds(this._getDropWindowBounds());
    this._dropWindow.showInactive();
  }

  public hideDropWindow(delay = 600): void {
    if (!this._dropWindow || this._dropWindow.isDestroyed()) return;

    if (this._dropWindowHideTimer) {
      clearTimeout(this._dropWindowHideTimer);
    }

    this._dropWindowHideTimer = setTimeout(() => {
      this._dropWindow?.hide();
      this._dropWindowHideTimer = null;
    }, delay);
  }

  private _getDropWindowBounds() {
    const width = 280;
    const height = 170;
    const workArea = screen.getPrimaryDisplay().workArea;
    const margin = 18;

    return {
      width,
      height,
      x: workArea.x + workArea.width - width - margin,
      y: workArea.y + margin,
    };
  }

  private _startDragMonitor(): void {
    if (process.platform !== 'win32' || this._dragMonitorProcess) return;

    const scriptPath = isDev
      ? path.join(app.getAppPath(), 'src/native/drag-monitor.ps1')
      : path.join(process.resourcesPath, 'native/drag-monitor.ps1');

    if (!fs.existsSync(scriptPath)) {
      logger.error('MainApplication', '拖拽监听脚本不存在', {scriptPath});
      return;
    }

    logger.info('MainApplication', '启动拖拽监听 helper', {scriptPath});

    this._dragMonitorProcess = spawn(
      'powershell.exe',
      ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', scriptPath],
      {
        windowsHide: true,
      }
    );

    this._dragMonitorProcess.stdout.on('data', (chunk) => {
      const lines = chunk.toString().split(/\r?\n/).filter(Boolean);
      lines.forEach((line: string) => {
        try {
          const event = JSON.parse(line) as {type?: string};
          if (event.type === 'ready') {
            logger.info('MainApplication', '拖拽监听 helper 已就绪');
            return;
          }
          if (event.type === 'dragstart') {
            logger.debug('MainApplication', '检测到系统拖拽开始');
            this.showDropWindow();
          }
          else if (event.type === 'dragend') {
            logger.debug('MainApplication', '检测到系统拖拽结束');
            this.hideDropWindow();
          }
        } catch (error) {
          logger.warn('MainApplication', '解析拖拽监听事件失败', {
            line,
            error,
          });
        }
      });
    });

    this._dragMonitorProcess.stderr.on('data', (chunk) => {
      logger.warn('MainApplication', '拖拽监听 helper 输出错误', chunk.toString());
    });

    this._dragMonitorProcess.on('error', (error) => {
      logger.error('MainApplication', '拖拽监听 helper 启动失败', error);
      this._dragMonitorProcess = null;
    });

    this._dragMonitorProcess.on('exit', (code, signal) => {
      logger.info('MainApplication', '拖拽监听 helper 已退出', {code, signal});
      this._dragMonitorProcess = null;

      if (!this._isQuitting) {
        setTimeout(() => this._startDragMonitor(), 1500);
      }
    });
  }

  private _stopDragMonitor(): void {
    this._dragMonitorProcess?.kill();
    this._dragMonitorProcess = null;
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
