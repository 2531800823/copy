import type {Configuration} from 'log4js';
import path from 'node:path';
import {app} from 'electron';

/**
 * 获取日志文件保存路径
 * @returns 日志文件保存路径
 */
export function getLogPath(): string {
  // 获取用户数据目录
  const userDataPath = app.getPath('userData');
  return path.join(userDataPath, 'logs');
}

/**
 * 日志配置
 */
export function getLogConfig(): Configuration {
  const logPath = getLogPath();
  console.log('🚀 liu123 ~ logPath:', logPath);

  return {
    appenders: {
      // 控制台输出
      console: {
        type: 'console',
        layout: {
          type: 'pattern',
          pattern: '%d{yyyy-MM-dd hh:mm:ss.SSS} [%p] %c - %m',
        },
      },
      // 应用日志
      app: {
        type: 'dateFile',
        filename: path.join(logPath, 'app.log'),
        pattern: 'yyyy-MM-dd',
        keepFileExt: true,
        numBackups: 7, // 保留7天日志
        compress: true, // 是否压缩
        layout: {
          type: 'pattern',
          pattern: '%d{yyyy-MM-dd hh:mm:ss.SSS} [%p] %c - %m',
        },
      },
      // 错误日志
      error: {
        type: 'dateFile',
        filename: path.join(logPath, 'error.log'),
        pattern: 'yyyy-MM-dd',
        keepFileExt: true,
        numBackups: 30, // 保留30天日志
        compress: true,
        layout: {
          type: 'pattern',
          pattern: '%d{yyyy-MM-dd hh:mm:ss.SSS} [%p] %c - %m',
        },
      },
      // 错误日志过滤器
      errorFilter: {
        type: 'logLevelFilter',
        appender: 'error',
        level: 'error',
      },
    },
    categories: {
      default: {
        appenders: ['console', 'app', 'errorFilter'],
        level: 'info',
      },
      main: {
        appenders: ['console', 'app', 'errorFilter'],
        level: 'debug',
      },
      renderer: {
        appenders: ['console', 'app', 'errorFilter'],
        level: 'debug',
      },
      ipc: {
        appenders: ['console', 'app', 'errorFilter'],
        level: 'debug',
      },
    },
  };
}
