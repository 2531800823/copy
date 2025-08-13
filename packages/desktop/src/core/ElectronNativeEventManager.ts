import type { Observable } from 'rxjs';
import { app } from 'electron'
import { EMPTY, merge, Subject } from 'rxjs';
import { debounceTime, filter, map, share, takeUntil } from 'rxjs/operators';
import logger from '../services/LoggerService';

/**
 * 应用生命周期事件类型
 */
export interface AppLifecycleEvents {
  'app:ready': void
  'app:before-quit': void
  'app:window-all-closed': void
  'app:activate': void
  'app:will-quit': void
  'app:quit': void
  'app:second-instance': {
    argv: string[]
    cwd: string
  }
}

/**
 * 事件数据包装类型
 */
export interface EventData<T = any> {
  type: keyof AppLifecycleEvents
  payload: T
  timestamp: number
}

/**
 * Electron 应用事件管理器 (基于 RxJS)
 * 专门用于统一管理 Electron 应用级别的原生事件（只处理 app.on 事件）
 * 不处理窗口事件，因为窗口是多实例的
 * 使用纯 RxJS Observable 流，不提供传统的 on/off 方法
 */
export class ElectronNativeEventManager {
  private _isInitialized = false;
  private _destroy$ = new Subject<void>();

  // 应用生命周期事件流
  private _appReadySubject = new Subject<void>();
  private _appBeforeQuitSubject = new Subject<void>();
  private _appWindowAllClosedSubject = new Subject<void>();
  private _appActivateSubject = new Subject<void>();
  private _appWillQuitSubject = new Subject<void>();
  private _appQuitSubject = new Subject<void>();
  private _appSecondInstanceSubject = new Subject<{ argv: string[]; cwd: string }>();

  // 公共 Observable 流
  public readonly appReady$ = this._appReadySubject.asObservable().pipe(share());
  public readonly appBeforeQuit$ = this._appBeforeQuitSubject.asObservable().pipe(share());
  public readonly appWindowAllClosed$ = this._appWindowAllClosedSubject.asObservable().pipe(share());
  public readonly appActivate$ = this._appActivateSubject.asObservable().pipe(share());
  public readonly appWillQuit$ = this._appWillQuitSubject.asObservable().pipe(share());
  public readonly appQuit$ = this._appQuitSubject.asObservable().pipe(share());
  public readonly appSecondInstance$ = this._appSecondInstanceSubject.asObservable().pipe(share());

  /**
   * 合并的所有应用事件流
   */
  public readonly allAppEvents$: Observable<EventData> = merge(
    this.appReady$.pipe(map(payload => ({ type: 'app:ready' as const, payload, timestamp: Date.now() }))),
    this.appBeforeQuit$.pipe(map(payload => ({ type: 'app:before-quit' as const, payload, timestamp: Date.now() }))),
    this.appWindowAllClosed$.pipe(map(payload => ({ type: 'app:window-all-closed' as const, payload, timestamp: Date.now() }))),
    this.appActivate$.pipe(map(payload => ({ type: 'app:activate' as const, payload, timestamp: Date.now() }))),
    this.appWillQuit$.pipe(map(payload => ({ type: 'app:will-quit' as const, payload, timestamp: Date.now() }))),
    this.appQuit$.pipe(map(payload => ({ type: 'app:quit' as const, payload, timestamp: Date.now() }))),
    this.appSecondInstance$.pipe(map(payload => ({ type: 'app:second-instance' as const, payload, timestamp: Date.now() }))),
  ).pipe(share());

  /**
   * 初始化 Electron 应用事件管理器
   */
  public async initialize(): Promise<void> {
    if (this._isInitialized) {
      logger.warn('ElectronNativeEventManager', '应用事件管理器已经初始化');
      return;
    }

    try {
      this._setupAppEvents();
      this._isInitialized = true;
      logger.info('ElectronNativeEventManager', 'Electron 应用事件管理器初始化完成');
    }
    catch (error) {
      logger.error('ElectronNativeEventManager', '应用事件管理器初始化失败', error);
      throw error;
    }
  }

  /**
   * 获取特定应用事件类型的 Observable
   * @param eventType 事件类型
   */
  public getEventStream<K extends keyof AppLifecycleEvents>(
    eventType: K,
  ): Observable<AppLifecycleEvents[K]> {
    const streamMap: Record<keyof AppLifecycleEvents, Observable<any>> = {
      'app:ready': this.appReady$,
      'app:before-quit': this.appBeforeQuit$,
      'app:window-all-closed': this.appWindowAllClosed$,
      'app:activate': this.appActivate$,
      'app:will-quit': this.appWillQuit$,
      'app:quit': this.appQuit$,
      'app:second-instance': this.appSecondInstance$,
    };

    return streamMap[eventType] || EMPTY;
  }

  /**
   * 获取特定类型应用事件的过滤流
   * @param eventTypes 要包含的事件类型数组
   */
  public getFilteredEventStream(...eventTypes: (keyof AppLifecycleEvents)[]): Observable<EventData> {
    return this.allAppEvents$.pipe(
      filter(event => eventTypes.includes(event.type)),
      takeUntil(this._destroy$),
    )
  }

  /**
   * 获取防抖的应用事件流
   * @param debounceMs 防抖时间（毫秒）
   */
  public getDebouncedAppEvents$(debounceMs: number = 100): Observable<EventData> {
    return this.allAppEvents$.pipe(
      debounceTime(debounceMs),
      takeUntil(this._destroy$),
    )
  }

  /**
   * 清理所有事件和订阅
   */
  public cleanup(): void {
    // 发送销毁信号
    this._destroy$.next();
    this._destroy$.complete();

    // 完成所有 Subject
    this._appReadySubject.complete();
    this._appBeforeQuitSubject.complete();
    this._appWindowAllClosedSubject.complete();
    this._appActivateSubject.complete();
    this._appWillQuitSubject.complete();
    this._appQuitSubject.complete();
    this._appSecondInstanceSubject.complete();

    this._isInitialized = false;

    logger.info('ElectronNativeEventManager', '已清理所有应用事件和订阅');
  }

  /**
   * 设置应用原生事件监听器
   */
  private _setupAppEvents(): void {
    // 应用单实例锁，防止启动多个实例
    const gotTheLock = app.requestSingleInstanceLock();
    if (!gotTheLock) {
      logger.warn('ElectronNativeEventManager', '检测到已有应用实例，当前进程将退出');
      app.quit();
      return;
    }

    // 监听二次实例事件，将焦点交给已存在窗口
    app.on('second-instance', (_event, argv, workingDirectory) => {
      logger.info('ElectronNativeEventManager', '收到 second-instance 事件');
      this._appSecondInstanceSubject.next({ argv: Array.isArray(argv) ? [...argv] : [], cwd: String(workingDirectory || '') });
    });
    // 应用准备就绪
    app.whenReady().then(() => {
      logger.info('ElectronNativeEventManager', '应用准备就绪');
      this._appReadySubject.next();
    })

    // 所有窗口关闭
    app.on('window-all-closed', () => {
      logger.info('ElectronNativeEventManager', '所有窗口已关闭');
      this._appWindowAllClosedSubject.next();

      // 在非 macOS 平台下退出应用
      if (process.platform !== 'darwin') {
        logger.info('ElectronNativeEventManager', '应用即将退出');
        app.quit();
      }
    });

    // 应用激活（macOS）
    app.on('activate', () => {
      logger.info('ElectronNativeEventManager', '应用被激活');
      this._appActivateSubject.next();
    })

    // 应用退出前
    app.on('before-quit', () => {
      logger.info('ElectronNativeEventManager', '应用即将退出');
      this._appBeforeQuitSubject.next();
    })

    // 应用将要退出
    app.on('will-quit', () => {
      logger.info('ElectronNativeEventManager', '应用将要退出');
      this._appWillQuitSubject.next();
    })

    // 应用已退出
    app.on('quit', () => {
      logger.info('ElectronNativeEventManager', '应用已退出');
      this._appQuitSubject.next();
    })

    logger.info('ElectronNativeEventManager', '应用原生事件监听器已设置');
  }

  /**
   * 获取事件统计信息
   */
  public getEventStats(): {
    isInitialized: boolean
  } {
    return {
      isInitialized: this._isInitialized,
    };
  }

  /**
   * 检查是否已初始化
   */
  public get isInitialized(): boolean {
    return this._isInitialized;
  }
}
