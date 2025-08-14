import type { Logger } from 'log4js';
import util from 'node:util';
import { app } from 'electron';
import { configure, getLogger, shutdown } from 'log4js';
import { getLogConfig } from '@/config/logger';

util.inspect.defaultOptions.showHidden = true;
util.inspect.defaultOptions.depth = 100;
configure(getLogConfig());

app.on('quit', () => {
  shutdown(() => {});
})

/**
 * 日志管理器
 * 提供日志记录的统一接口
 */
class LoggerService {
  private logger: Logger;
  private timers: Map<string, number>;

  constructor(category = 'default') {
    this.logger = getLogger(category);
    this.timers = new Map();
  }

  /**
   * 记录一条日志，等价于 info
   * @param args 日志内容
   */
  log(...args: unknown[]): void {
    this.logger.info(...(args as [unknown, ...unknown[]]));
  }

  /**
   * 记录一条 info 级别日志
   * @param args 日志内容
   */
  info(...args: unknown[]): void {
    this.logger.info(...(args as [unknown, ...unknown[]]));
  }

  warn(...args: unknown[]): void {
    this.logger.warn(...(args as [unknown, ...unknown[]]));
  }

  error(...args: unknown[]): void {
    this.logger.error(...(args as [unknown, ...unknown[]]));
  }

  debug(...args: unknown[]): void {
    this.logger.debug(...(args as [unknown, ...unknown[]]));
  }

  time(label = 'default') {
    this.timers.set(label, Date.now());
    this.logger.info(`Timer '${label}' started`);
  }

  timeEnd(label = 'default') {
    const startTime = this.timers.get(label);
    if (startTime === undefined) {
      this.logger.warn(`Timer '${label}' does not exist`);
      return;
    }
    const duration = Date.now() - startTime;
    this.timers.delete(label);
    this.logger.info(`Timer '${label}': ${duration}ms`);
    return duration;
  }

  timeLog(label = 'default', ...data: unknown[]): void {
    const startTime = this.timers.get(label);
    if (startTime === undefined) {
      this.logger.warn(`Timer '${label}' does not exist`);
      return;
    }
    const duration = Date.now() - startTime;
    this.logger.info(`Timer '${label}': ${duration}ms`, ...data);
  }

  getActiveTimers(): string[] {
    return Array.from(this.timers.keys());
  }

  clearAllTimers(): void {
    this.timers.clear();
  }
}

/** 创建全局日志记录器实例 */
export function createLogger(category = 'default') {
  return new LoggerService(category);
}

const logger = createLogger();

export default logger;
