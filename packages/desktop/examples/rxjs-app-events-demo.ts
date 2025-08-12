/**
 * RxJS 应用事件系统使用示例
 *
 * 此示例展示了如何使用重构后的 ElectronNativeEventManager
 * 来管理 Electron 应用级别的事件
 */

import type { Subscription } from 'rxjs'
import type { ApplicationConfig } from '../core/MainApplication';
import { BrowserWindow, Menu } from 'electron';
import { merge, Subject } from 'rxjs';
import { debounceTime, filter, map, take, takeUntil } from 'rxjs/operators';
import { MainApplication } from '../core/MainApplication';
import logger from '../services/LoggerService';

/**
 * 应用事件处理器示例类
 * 演示如何使用 RxJS 流来处理应用事件
 */
class AppEventHandler {
  private subscriptions = new Set<Subscription>();
  private destroy$ = new Subject<void>();
  private mainWindow: BrowserWindow | null = null;

  constructor(private app: MainApplication) {
    this.setupAppEventListeners();
  }

  /**
   * 设置应用事件监听器
   */
  private setupAppEventListeners(): void {
    const appEventManager = this.app.getAppEventManager();

    // 1. 基础事件监听
    this.listenToBasicAppEvents(appEventManager);

    // 2. 高级 RxJS 操作符使用
    this.useAdvancedRxJSOperators(appEventManager);

    // 3. 事件流组合
    this.combineEventStreams(appEventManager);

    // 4. 条件事件处理
    this.handleConditionalEvents(appEventManager);

    // 5. 统计和监控
    this.setupEventMonitoring(appEventManager);
  }

  /**
   * 基础应用事件监听
   */
  private listenToBasicAppEvents(appEventManager: any): void {
    // 应用准备就绪
    const readySub = appEventManager.appReady$.subscribe(() => {
      logger.info('AppEventHandler', '🚀 应用启动完成');
      this.onAppReady();
    })
    this.subscriptions.add(readySub);

    // 应用即将退出
    const beforeQuitSub = appEventManager.appBeforeQuit$.subscribe(() => {
      logger.info('AppEventHandler', '🛑 应用即将退出，开始清理资源');
      this.onBeforeQuit();
    })
    this.subscriptions.add(beforeQuitSub);

    // 所有窗口关闭
    const allClosedSub = appEventManager.appWindowAllClosed$.subscribe(() => {
      logger.info('AppEventHandler', '🪟 所有窗口已关闭');
      this.onAllWindowsClosed();
    })
    this.subscriptions.add(allClosedSub);

    // 应用激活（主要用于 macOS）
    const activateSub = appEventManager.appActivate$.subscribe(() => {
      logger.info('AppEventHandler', '🔆 应用被激活 (macOS)');
      this.onAppActivate();
    })
    this.subscriptions.add(activateSub);

    // 应用退出
    const quitSub = appEventManager.appQuit$.subscribe(() => {
      logger.info('AppEventHandler', '👋 应用已完全退出');
    })
    this.subscriptions.add(quitSub);
  }

  /**
   * 使用高级 RxJS 操作符
   */
  private useAdvancedRxJSOperators(appEventManager: any): void {
    // 防抖应用事件（避免频繁处理）
    const debouncedSub = appEventManager.getDebouncedAppEvents$(300).subscribe((event: any) => {
      logger.debug('AppEventHandler', `⏱️  防抖事件: ${event.type}`, {
        timestamp: new Date(event.timestamp).toLocaleString(),
      })
    });
    this.subscriptions.add(debouncedSub);

    // 过滤重要事件
    const importantEventsSub = appEventManager.getFilteredEventStream(
      'app:ready',
      'app:before-quit',
      'app:quit',
    ).subscribe((event: any) => {
      logger.info('AppEventHandler', `⭐ 重要事件: ${event.type}`);
      this.handleImportantEvent(event);
    })
    this.subscriptions.add(importantEventsSub);

    // 只监听第一次应用激活
    const firstActivateSub = appEventManager.appActivate$.pipe(
      take(1), // 只取第一次
    ).subscribe(() => {
      logger.info('AppEventHandler', '🎯 首次应用激活');
    })
    this.subscriptions.add(firstActivateSub);

    // 映射事件为自定义格式
    const mappedEventsSub = appEventManager.allAppEvents$.pipe(
      map((event: any) => ({
        eventName: event.type.replace('app:', ''),
        occurredAt: new Date(event.timestamp).toLocaleString(),
        platform: process.platform,
      })),
      filter((mapped: any) => mapped.eventName !== 'activate'), // 过滤掉 activate 事件
    ).subscribe((mappedEvent: any) => {
      logger.debug('AppEventHandler', '🔄 映射事件', mappedEvent);
    })
    this.subscriptions.add(mappedEventsSub);
  }

  /**
   * 事件流组合
   */
  private combineEventStreams(appEventManager: any): void {
    // 合并启动和激活事件
    const startupEventsSub = merge(
      appEventManager.appReady$,
      appEventManager.appActivate$,
    ).subscribe(() => {
      logger.info('AppEventHandler', '🌟 应用启动或激活');
      this.checkAndCreateWindow();
    })
    this.subscriptions.add(startupEventsSub);

    // 监听应用生命周期关键节点
    const lifecycleSub = appEventManager.allAppEvents$.pipe(
      filter((event: any) => ['app:ready', 'app:before-quit', 'app:quit'].includes(event.type)),
      map((event: any) => {
        const stage = event.type.replace('app:', '');
        return `应用${stage === 'ready' ? '启动' : stage === 'before-quit' ? '准备退出' : '已退出'}`;
      }),
    ).subscribe((message: string) => {
      logger.info('AppEventHandler', `🔄 生命周期: ${message}`);
    })
    this.subscriptions.add(lifecycleSub);
  }

  /**
   * 条件事件处理
   */
  private handleConditionalEvents(appEventManager: any): void {
    // macOS 特定的事件处理
    if (process.platform === 'darwin') {
      const macOSActivateSub = appEventManager.appActivate$.pipe(
        filter(() => this.app.getMainWindow() === null), // 只在没有窗口时处理
      ).subscribe(() => {
        logger.info('AppEventHandler', '🍎 macOS: 应用激活但无窗口，创建新窗口');
        this.createMainWindow();
      })
      this.subscriptions.add(macOSActivateSub);
    }

    // 非 macOS 平台的窗口关闭处理
    if (process.platform !== 'darwin') {
      const nonMacOSCloseSub = appEventManager.appWindowAllClosed$.subscribe(() => {
        logger.info('AppEventHandler', '🖥️  非 macOS: 所有窗口关闭，应用将退出');
        // 在非 macOS 平台，所有窗口关闭时应用会自动退出
      })
      this.subscriptions.add(nonMacOSCloseSub);
    }

    // 开发环境特定处理
    if (process.env.NODE_ENV === 'development') {
      const devEventsSub = appEventManager.allAppEvents$.pipe(
        debounceTime(100),
      ).subscribe((event: any) => {
        logger.debug('AppEventHandler', `🔧 开发环境事件: ${event.type}`);
      })
      this.subscriptions.add(devEventsSub);
    }
  }

  /**
   * 事件统计和监控
   */
  private setupEventMonitoring(appEventManager: any): void {
    // 事件计数器
    let eventCount = 0;
    const monitoringSub = appEventManager.allAppEvents$.subscribe((_event: any) => {
      eventCount++;
      if (eventCount % 5 === 0) { // 每 5 个事件记录一次
        logger.info('AppEventHandler', `📊 已处理 ${eventCount} 个应用事件`);
      }
    });
    this.subscriptions.add(monitoringSub);

    // 定期输出统计信息
    const statsSub = appEventManager.appReady$.subscribe(() => {
      setInterval(() => {
        const stats = this.app.getEventStats();
        logger.info('AppEventHandler', '📈 事件系统统计', {
          activeSubscriptions: stats.activeSubscriptions,
          appSubscriptions: stats.appSubscriptions,
          totalEvents: eventCount,
        })
      }, 30000); // 每 30 秒输出一次
    })
    this.subscriptions.add(statsSub);
  }

  /**
   * 应用准备就绪处理
   */
  private onAppReady(): void {
    // 创建主菜单（如果需要）
    this.createApplicationMenu();

    // 设置全局快捷键
    this.setupGlobalShortcuts();

    // 初始化应用功能
    this.initializeAppFeatures();
  }

  /**
   * 应用即将退出处理
   */
  private onBeforeQuit(): void {
    // 保存应用状态
    this.saveApplicationState();

    // 清理资源
    this.cleanup();
  }

  /**
   * 所有窗口关闭处理
   */
  private onAllWindowsClosed(): void {
    this.mainWindow = null;

    // 如果是 macOS，保持应用运行
    if (process.platform === 'darwin') {
      logger.info('AppEventHandler', 'macOS: 应用继续运行，等待重新激活');
    }
  }

  /**
   * 应用激活处理
   */
  private onAppActivate(): void {
    // 如果没有窗口，创建一个
    this.checkAndCreateWindow();
  }

  /**
   * 处理重要事件
   */
  private handleImportantEvent(event: any): void {
    // 可以在这里添加重要事件的特殊处理逻辑
    // 比如发送通知、记录日志、更新状态等

    switch (event.type) {
      case 'app:ready':
        this.notifyAppReady();
        break;
      case 'app:before-quit':
        this.notifyAppQuitting();
        break;
      case 'app:quit':
        this.finalCleanup();
        break;
    }
  }

  /**
   * 检查并创建窗口
   */
  private checkAndCreateWindow(): void {
    if (!this.mainWindow || this.mainWindow.isDestroyed()) {
      this.createMainWindow();
    }
    else {
      this.mainWindow.show();
      this.mainWindow.focus();
    }
  }

  /**
   * 创建主窗口
   */
  private createMainWindow(): void {
    this.mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: true,
      },
    });

    // 直接在窗口上监听事件（不通过应用事件管理器）
    this.setupWindowEvents();

    // 加载页面
    const webUrl = process.env.VITE_WEB_URL || 'http://localhost:5173';
    this.mainWindow.loadURL(webUrl);

    logger.info('AppEventHandler', `🪟 主窗口已创建，加载 URL: ${webUrl}`);
  }

  /**
   * 设置窗口事件（直接在窗口上监听）
   */
  private setupWindowEvents(): void {
    if (!this.mainWindow)
      return;

    // 窗口关闭
    this.mainWindow.on('closed', () => {
      logger.info('AppEventHandler', '🪟 主窗口已关闭');
      this.mainWindow = null;
    })

    // 窗口获得焦点
    this.mainWindow.on('focus', () => {
      logger.debug('AppEventHandler', '🎯 主窗口获得焦点');
    })

    // 窗口失去焦点
    this.mainWindow.on('blur', () => {
      logger.debug('AppEventHandler', '😴 主窗口失去焦点');
    })

    // 窗口最大化
    this.mainWindow.on('maximize', () => {
      logger.debug('AppEventHandler', '📏 主窗口已最大化');
    })

    // 窗口最小化
    this.mainWindow.on('minimize', () => {
      logger.debug('AppEventHandler', '📉 主窗口已最小化');
    })

    // 页面加载完成
    this.mainWindow.webContents.on('did-finish-load', () => {
      logger.info('AppEventHandler', '✅ 页面加载完成');
    })

    // 页面加载失败
    this.mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription) => {
      logger.error('AppEventHandler', '❌ 页面加载失败', {
        errorCode,
        errorDescription,
      })
    });
  }

  /**
   * 创建应用菜单
   */
  private createApplicationMenu(): void {
    const template: any[] = [
      {
        label: '文件',
        submenu: [
          {
            label: '新建窗口',
            accelerator: 'CmdOrCtrl+N',
            click: () => this.createMainWindow(),
          },
          { type: 'separator' },
          {
            label: '退出',
            accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
            click: () => {
              logger.info('AppEventHandler', '📋 用户通过菜单退出应用');
              this.app.stop();
            },
          },
        ],
      },
      {
        label: '编辑',
        submenu: [
          { label: '撤销', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
          { label: '重做', accelerator: 'Shift+CmdOrCtrl+Z', role: 'redo' },
          { type: 'separator' },
          { label: '剪切', accelerator: 'CmdOrCtrl+X', role: 'cut' },
          { label: '复制', accelerator: 'CmdOrCtrl+C', role: 'copy' },
          { label: '粘贴', accelerator: 'CmdOrCtrl+V', role: 'paste' },
        ],
      },
    ]

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);

    logger.info('AppEventHandler', '📋 应用菜单已创建');
  }

  /**
   * 设置全局快捷键
   */
  private setupGlobalShortcuts(): void {
    // 这里可以添加全局快捷键设置
    logger.info('AppEventHandler', '⌨️  全局快捷键已设置');
  }

  /**
   * 初始化应用功能
   */
  private initializeAppFeatures(): void {
    // 这里可以添加应用特定的功能初始化
    logger.info('AppEventHandler', '🔧 应用功能已初始化');
  }

  /**
   * 通知应用准备就绪
   */
  private notifyAppReady(): void {
    logger.info('AppEventHandler', '🎉 应用启动完成通知');
  }

  /**
   * 通知应用即将退出
   */
  private notifyAppQuitting(): void {
    logger.info('AppEventHandler', '👋 应用即将退出通知');
  }

  /**
   * 保存应用状态
   */
  private saveApplicationState(): void {
    // 保存窗口位置、大小、用户设置等
    logger.info('AppEventHandler', '💾 应用状态已保存');
  }

  /**
   * 最终清理
   */
  private finalCleanup(): void {
    logger.info('AppEventHandler', '🧹 最终清理完成');
  }

  /**
   * 清理资源
   */
  private cleanup(): void {
    // 发送销毁信号
    this.destroy$.next();
    this.destroy$.complete();

    // 取消所有订阅
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions.clear();

    logger.info('AppEventHandler', '🧹 事件订阅已清理');
  }

  /**
   * 获取当前主窗口
   */
  public getMainWindow(): BrowserWindow | null {
    return this.mainWindow;
  }
}

/**
 * 主要演示函数
 */
export function createAppEventDemo(): void {
  // 应用配置
  const appConfig: ApplicationConfig = {
    window: {
      width: 1200,
      height: 800,
      autoHideMenuBar: false,
      frame: true,
    },
    development: {
      webUrl: process.env.VITE_WEB_URL || 'http://localhost:5173',
      openDevTools: true,
    },
    production: {
      appUrl: 'app://./index.html#/',
    },
  };

  // 创建应用实例
  const app = new MainApplication(appConfig);

  // 创建事件处理器
  const _eventHandler = new AppEventHandler(app);

  // 启动应用
  app.start().then(() => {
    logger.info('Demo', '🚀 应用事件演示启动成功');

    // 演示向后兼容的事件监听方式
    const appEventManager = app.getAppEventManager();

    // 传统方式监听事件
    const traditionalSub = appEventManager.on('app:ready', () => {
      logger.info('Demo', '📡 传统方式监听到应用准备就绪事件');
    })

    // 一次性事件监听
    const _onceSub = appEventManager.once('app:activate', () => {
      logger.info('Demo', '🎯 一次性监听到应用激活事件');
    })

    // 手动管理订阅（如果需要的话）
    setTimeout(() => {
      traditionalSub.unsubscribe();
      logger.info('Demo', '🔌 传统方式订阅已取消');
    }, 10000);

  }).catch((error: any) => {
    logger.error('Demo', '❌ 应用启动失败', error);
  })
}

// 如果直接运行此文件，则启动演示
if (require.main === module) {
  createAppEventDemo();
}
