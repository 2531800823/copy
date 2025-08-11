import {BrowserWindow} from 'electron';
import logger from '../services/LoggerService';

/**
 * 事件处理器类型
 */
export type EventHandler<T = any> = (data?: T) => void | Promise<void>;

/**
 * 事件管理器
 * 负责管理应用内的事件系统，提供发布-订阅模式
 */
export class EventManager {
  private _events = new Map<string, Set<EventHandler>>();
  private _onceEvents = new Map<string, Set<EventHandler>>();

  /**
   * 订阅事件
   * @param eventName 事件名称
   * @param handler 事件处理器
   */
  public on<T = any>(eventName: string, handler: EventHandler<T>): this {
    if (!this._events.has(eventName)) {
      this._events.set(eventName, new Set());
    }

    this._events.get(eventName)!.add(handler);
    logger.debug('EventManager', `订阅事件: ${eventName}`);

    return this;
  }

  /**
   * 订阅一次性事件
   * @param eventName 事件名称
   * @param handler 事件处理器
   */
  public once<T = any>(eventName: string, handler: EventHandler<T>): this {
    if (!this._onceEvents.has(eventName)) {
      this._onceEvents.set(eventName, new Set());
    }

    this._onceEvents.get(eventName)!.add(handler);
    logger.debug('EventManager', `订阅一次性事件: ${eventName}`);

    return this;
  }

  /**
   * 取消订阅事件
   * @param eventName 事件名称
   * @param handler 事件处理器（可选，不提供则取消所有）
   */
  public off<T = any>(eventName: string, handler?: EventHandler<T>): this {
    if (handler) {
      // 移除特定处理器
      this._events.get(eventName)?.delete(handler);
      this._onceEvents.get(eventName)?.delete(handler);
      logger.debug('EventManager', `取消订阅特定处理器: ${eventName}`);
    } else {
      // 移除所有处理器
      this._events.delete(eventName);
      this._onceEvents.delete(eventName);
      logger.debug('EventManager', `取消订阅所有处理器: ${eventName}`);
    }

    return this;
  }

  /**
   * 发布事件
   * @param eventName 事件名称
   * @param data 事件数据
   */
  public async emit<T = any>(eventName: string, data?: T): Promise<this> {
    const handlers = this._events.get(eventName);
    const onceHandlers = this._onceEvents.get(eventName);

    // 执行普通事件处理器
    if (handlers && handlers.size > 0) {
      logger.debug('EventManager', `发布事件: ${eventName}`, {
        handlerCount: handlers.size,
      });

      for (const handler of handlers) {
        try {
          await handler(data);
        } catch (error) {
          logger.error(
            'EventManager',
            `事件处理器执行失败: ${eventName}`,
            error
          );
        }
      }
    }

    // 执行一次性事件处理器并清理
    if (onceHandlers && onceHandlers.size > 0) {
      logger.debug('EventManager', `发布一次性事件: ${eventName}`, {
        handlerCount: onceHandlers.size,
      });

      for (const handler of onceHandlers) {
        try {
          await handler(data);
        } catch (error) {
          logger.error(
            'EventManager',
            `一次性事件处理器执行失败: ${eventName}`,
            error
          );
        }
      }

      // 清理一次性事件处理器
      this._onceEvents.delete(eventName);
    }

    return this;
  }

  /**
   * 获取事件的订阅者数量
   * @param eventName 事件名称
   */
  public getListenerCount(eventName: string): number {
    const regularCount = this._events.get(eventName)?.size || 0;
    const onceCount = this._onceEvents.get(eventName)?.size || 0;
    return regularCount + onceCount;
  }

  /**
   * 获取所有已注册的事件名称
   */
  public getEventNames(): string[] {
    const regularEvents = Array.from(this._events.keys());
    const onceEvents = Array.from(this._onceEvents.keys());
    return [...new Set([...regularEvents, ...onceEvents])];
  }

  /**
   * 清理所有事件
   */
  public clear(): this {
    const eventCount = this.getEventNames().length;
    this._events.clear();
    this._onceEvents.clear();

    logger.info('EventManager', `已清理所有事件 (${eventCount} 个)`);
    return this;
  }

  /**
   * 设置窗口事件监听器
   * @param window 浏览器窗口实例
   */
  public setupWindowEvents(window: BrowserWindow): this {
    // 监听页面加载完成
    window.webContents.on('did-finish-load', () => {
      this.emit('window:did-finish-load', {window});
      window.webContents.send(
        'main-process-message',
        new Date().toLocaleString()
      );
    });

    // 监听页面加载失败
    window.webContents.on(
      'did-fail-load',
      (event, errorCode, errorDescription, validatedURL) => {
        this.emit('window:did-fail-load', {
          window,
          errorCode,
          errorDescription,
          validatedURL,
        });
      }
    );

    // 监听渲染进程崩溃
    window.webContents.on('render-process-gone', (event, details) => {
      this.emit('window:render-process-gone', {
        window,
        reason: details.reason,
        exitCode: details.exitCode,
      });
    });

    // 监听键盘事件
    window.webContents.on('before-input-event', (event, input) => {
      this.emit('window:before-input-event', {window, event, input});
    });

    logger.info('EventManager', '窗口事件监听器已设置');
    return this;
  }

  /**
   * 设置开发者工具快捷键
   * @param window 浏览器窗口实例
   * @param shortcut 快捷键组合（默认 Ctrl+Shift+`）
   */
  public setupDevToolsShortcut(
    window: BrowserWindow,
    shortcut = 'Ctrl+Shift+`'
  ): this {
    this.on(
      'window:before-input-event',
      ({window: eventWindow, event, input}) => {
        if (eventWindow !== window) return;

        // 检测开发者工具快捷键
        if (input.control && input.shift && input.code === 'Backquote') {
          if (window.webContents.isDevToolsOpened()) {
            window.webContents.closeDevTools();
          } else {
            window.webContents.openDevTools();
          }
          event.preventDefault();
        }
      }
    );

    logger.info('EventManager', `开发者工具快捷键已设置: ${shortcut}`);
    return this;
  }

  /**
   * 设置页面加载错误处理
   * @param window 浏览器窗口实例
   * @param options 配置选项
   */
  public setupLoadErrorHandler(
    window: BrowserWindow,
    options: {
      retryDelay?: number;
      openDevTools?: boolean;
    } = {}
  ): this {
    const {retryDelay = 3000, openDevTools = true} = options;

    this.on(
      'window:did-fail-load',
      ({window: eventWindow, errorCode, errorDescription, validatedURL}) => {
        if (eventWindow !== window) return;

        logger.error(
          'EventManager',
          `页面加载失败: ${validatedURL}, 错误码: ${errorCode}, 描述: ${errorDescription}`
        );

        // 显示开发者工具便于调试
        if (openDevTools && !window.webContents.isDevToolsOpened()) {
          window.webContents.openDevTools();
        }

        // 延迟重试加载
        setTimeout(() => {
          logger.info('EventManager', '尝试重新加载页面...');
          window.loadURL(validatedURL).catch((err) => {
            logger.error('EventManager', `重试加载失败: ${err.message}`);
          });
        }, retryDelay);
      }
    );

    logger.info('EventManager', '页面加载错误处理已设置');
    return this;
  }

  /**
   * 设置渲染进程崩溃处理
   * @param window 浏览器窗口实例
   */
  public setupRenderProcessHandler(window: BrowserWindow): this {
    this.on(
      'window:render-process-gone',
      ({window: eventWindow, reason, exitCode}) => {
        if (eventWindow !== window) return;

        logger.error(
          'EventManager',
          `渲染进程崩溃: ${reason}, 退出码: ${exitCode}`
        );

        // 可以在这里添加崩溃恢复逻辑
        this.emit('app:render-process-crashed', {window, reason, exitCode});
      }
    );

    logger.info('EventManager', '渲染进程崩溃处理已设置');
    return this;
  }
}
