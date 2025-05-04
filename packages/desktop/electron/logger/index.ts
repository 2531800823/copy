import fs from 'node:fs'
import path from 'node:path'
import { configure, getLogger } from 'log4js'
import { getLogConfig, getLogPath } from './config'

/**
 * 日志级别
 */
export enum LogLevel {
  TRACE = 'trace',
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal',
}

/**
 * 日志管理器
 * 提供日志记录的统一接口
 */
class Logger {
  private initialized = false

  /**
   * 初始化日志系统
   */
  public init(): void {
    if (this.initialized) {
      return
    }

    try {
      // 确保日志目录存在
      const logPath = getLogPath()
      if (!fs.existsSync(logPath)) {
        fs.mkdirSync(logPath, { recursive: true })
      }

      // 配置log4js
      configure(getLogConfig())
      this.initialized = true

      this.info('Logger', '日志系统初始化成功')
    }
    catch (error) {
      console.error('日志系统初始化失败:', error)
    }
  }

  /**
   * 获取指定类别的日志记录器
   * @param category 日志类别
   * @returns 日志记录器
   */
  public getLogger(category = 'default') {
    if (!this.initialized) {
      this.init()
    }
    return getLogger(category)
  }

  /**
   * 记录跟踪级别日志
   * @param category 日志类别
   * @param message 日志消息
   * @param data 附加数据
   */
  public trace(category: string, message: string, ...data: any[]): void {
    this.log(LogLevel.TRACE, category, message, ...data)
  }

  /**
   * 记录调试级别日志
   * @param category 日志类别
   * @param message 日志消息
   * @param data 附加数据
   */
  public debug(category: string, message: string, ...data: any[]): void {
    this.log(LogLevel.DEBUG, category, message, ...data)
  }

  /**
   * 记录信息级别日志
   * @param category 日志类别
   * @param message 日志消息
   * @param data 附加数据
   */
  public info(category: string, message: string, ...data: any[]): void {
    this.log(LogLevel.INFO, category, message, ...data)
  }

  /**
   * 记录警告级别日志
   * @param category 日志类别
   * @param message 日志消息
   * @param data 附加数据
   */
  public warn(category: string, message: string, ...data: any[]): void {
    this.log(LogLevel.WARN, category, message, ...data)
  }

  /**
   * 记录错误级别日志
   * @param category 日志类别
   * @param message 日志消息
   * @param data 附加数据
   */
  public error(category: string, message: string, ...data: any[]): void {
    this.log(LogLevel.ERROR, category, message, ...data)
  }

  /**
   * 记录致命级别日志
   * @param category 日志类别
   * @param message 日志消息
   * @param data 附加数据
   */
  public fatal(category: string, message: string, ...data: any[]): void {
    this.log(LogLevel.FATAL, category, message, ...data)
  }

  /**
   * 记录日志的通用方法
   * @param level 日志级别
   * @param category 日志类别
   * @param message 日志消息
   * @param data 附加数据
   */
  private log(level: LogLevel, category: string, message: string, ...data: any[]): void {
    try {
      const logger = this.getLogger(category)

      // 根据日志级别选择对应的方法
      switch (level) {
        case LogLevel.TRACE:
          logger.trace(message, ...data)
          break
        case LogLevel.DEBUG:
          logger.debug(message, ...data)
          break
        case LogLevel.INFO:
          logger.info(message, ...data)
          break
        case LogLevel.WARN:
          logger.warn(message, ...data)
          break
        case LogLevel.ERROR:
          logger.error(message, ...data)
          break
        case LogLevel.FATAL:
          logger.fatal(message, ...data)
          break
        default:
          logger.info(message, ...data)
      }
    }
    catch (error) {
      console.error(`日志记录失败 [${level}] ${category} - ${message}:`, error)
    }
  }
}

// 导出单例
export const logger = new Logger()

// 默认导出
export default logger
