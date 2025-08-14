import logger from '../services/LoggerService'

/**
 * 事件处理器类型
 */
export type EventHandler<T = any> = (data?: T) => void | Promise<void>

/**
 * 应用内部事件管理器
 * 负责管理应用内的自定义事件系统，提供发布-订阅模式
 * 注意：此类不处理 Electron 相关事件，Electron 事件由 ElectronEventManager 处理
 */
export class EventManager {
  private _events = new Map<string, Set<EventHandler>>()
  private _onceEvents = new Map<string, Set<EventHandler>>()

  /**
   * 订阅事件
   * @param eventName 事件名称
   * @param handler 事件处理器
   */
  public on<T = any>(eventName: string, handler: EventHandler<T>): this {
    if (!this._events.has(eventName)) {
      this._events.set(eventName, new Set())
    }

    this._events.get(eventName)!.add(handler)
    logger.debug('EventManager', `订阅事件: ${eventName}`)

    return this
  }

  /**
   * 订阅一次性事件
   * @param eventName 事件名称
   * @param handler 事件处理器
   */
  public once<T = any>(eventName: string, handler: EventHandler<T>): this {
    if (!this._onceEvents.has(eventName)) {
      this._onceEvents.set(eventName, new Set())
    }

    this._onceEvents.get(eventName)!.add(handler)
    logger.debug('EventManager', `订阅一次性事件: ${eventName}`)

    return this
  }

  /**
   * 取消订阅事件
   * @param eventName 事件名称
   * @param handler 事件处理器（可选，不提供则取消所有）
   */
  public off<T = any>(eventName: string, handler?: EventHandler<T>): this {
    if (handler) {
      // 移除特定处理器
      this._events.get(eventName)?.delete(handler)
      this._onceEvents.get(eventName)?.delete(handler)
      logger.debug('EventManager', `取消订阅特定处理器: ${eventName}`)
    }
    else {
      // 移除所有处理器
      this._events.delete(eventName)
      this._onceEvents.delete(eventName)
      logger.debug('EventManager', `取消订阅所有处理器: ${eventName}`)
    }

    return this
  }

  /**
   * 发布事件
   * @param eventName 事件名称
   * @param data 事件数据
   */
  public async emit<T = any>(eventName: string, data?: T): Promise<this> {
    const handlers = this._events.get(eventName)
    const onceHandlers = this._onceEvents.get(eventName)

    // 执行普通事件处理器
    if (handlers && handlers.size > 0) {
      logger.debug('EventManager', `发布事件: ${eventName}`, {
        handlerCount: handlers.size,
      })

      for (const handler of handlers) {
        try {
          await handler(data)
        }
        catch (error) {
          logger.error(
            'EventManager',
            `事件处理器执行失败: ${eventName}`,
            error,
          );
        }
      }
    }

    // 执行一次性事件处理器并清理
    if (onceHandlers && onceHandlers.size > 0) {
      logger.debug('EventManager', `发布一次性事件: ${eventName}`, {
        handlerCount: onceHandlers.size,
      })

      for (const handler of onceHandlers) {
        try {
          await handler(data)
        }
        catch (error) {
          logger.error(
            'EventManager',
            `一次性事件处理器执行失败: ${eventName}`,
            error,
          );
        }
      }

      // 清理一次性事件处理器
      this._onceEvents.delete(eventName)
    }

    return this
  }

  /**
   * 获取事件的订阅者数量
   * @param eventName 事件名称
   */
  public getListenerCount(eventName: string): number {
    const regularCount = this._events.get(eventName)?.size || 0
    const onceCount = this._onceEvents.get(eventName)?.size || 0
    return regularCount + onceCount
  }

  /**
   * 获取所有已注册的事件名称
   */
  public getEventNames(): string[] {
    const regularEvents = Array.from(this._events.keys())
    const onceEvents = Array.from(this._onceEvents.keys())
    return [...new Set([...regularEvents, ...onceEvents])]
  }

  /**
   * 清理所有事件
   */
  public clear(): this {
    const eventCount = this.getEventNames().length
    this._events.clear()
    this._onceEvents.clear()

    logger.info('EventManager', `已清理所有事件 (${eventCount} 个)`)
    return this
  }
}
