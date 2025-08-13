import type {Configuration} from 'log4js';
import path from 'node:path';
import {dataPath} from '../common/path';

const defaultLogConfig = {
  type: 'dateFile',
  filename: dataPath + '/log/app.log',
  keepFileExt: true,
  compress: true,
  daysToKeep: 7,
  backups: 10,
  maxLogSize: 1000 * 1000 * 10, // 10 MB
};

/**
 * 获取日志文件保存路径
 * @returns 日志文件保存路径
 */
export function getLogPath(): string {
  // 获取用户数据目录
  return path.join(dataPath, 'logs');
}

/**
 * 日志配置
 */
export function getLogConfig(): Configuration {
  const logPath = getLogPath();

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
      app: {
        ...defaultLogConfig,
        filename: path.join(logPath, 'app.log'),
      },
    },
    categories: {
      default: {
        appenders: ['console', 'app'],
        level: 'info',
      },
      main: {
        appenders: ['console', 'app'],
        level: 'debug',
      },
      renderer: {
        appenders: ['console', 'app'],
        level: 'debug',
      },
      ipc: {
        appenders: ['console', 'app'],
        level: 'debug',
      },
    },
  };
}
