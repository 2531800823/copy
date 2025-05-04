import fs from 'node:fs'
import path from 'node:path'
import { app } from 'electron'
import logger from './index'

/**
 * 日志工具类
 */
export class LogUtils {
  /**
   * 记录未捕获的异常
   */
  public static setupUncaughtExceptionHandler(): void {
    process.on('uncaughtException', (error) => {
      logger.error('UncaughtException', '未捕获的异常', error)
      console.error('未捕获的异常:', error)
    })

    process.on('unhandledRejection', (reason) => {
      logger.error('UnhandledRejection', '未处理的Promise拒绝', reason)
      console.error('未处理的Promise拒绝:', reason)
    })
  }

  /**
   * 记录应用启动信息
   */
  public static logAppStartup(): void {
    const appInfo = {
      name: app.getName(),
      version: app.getVersion(),
      electronVersion: process.versions.electron,
      nodeVersion: process.versions.node,
      platform: process.platform,
      arch: process.arch,
      paths: {
        appPath: app.getAppPath(),
        userData: app.getPath('userData'),
        logs: app.getPath('logs'),
      },
    }

    logger.info('App', '应用启动', appInfo)
  }

  /**
   * 获取日志文件列表
   * @returns 日志文件列表
   */
  public static getLogFiles(): string[] {
    try {
      const logPath = path.join(app.getPath('userData'), 'logs')
      if (!fs.existsSync(logPath)) {
        return []
      }

      return fs.readdirSync(logPath)
        .filter(file => file.endsWith('.log') || file.endsWith('.log.gz'))
        .map(file => path.join(logPath, file))
    }
    catch (error) {
      logger.error('LogUtils', '获取日志文件列表失败', error)
      return []
    }
  }

  /**
   * 清理过期日志文件
   * @param days 保留天数，默认30天
   */
  public static cleanupOldLogs(days = 30): void {
    try {
      const logPath = path.join(app.getPath('userData'), 'logs')
      if (!fs.existsSync(logPath)) {
        return
      }

      const now = new Date().getTime()
      const maxAge = days * 24 * 60 * 60 * 1000 // 转换为毫秒

      fs.readdirSync(logPath).forEach((file) => {
        const filePath = path.join(logPath, file)
        const stats = fs.statSync(filePath)

        // 如果文件超过最大保留期限，删除它
        if (now - stats.mtime.getTime() > maxAge) {
          fs.unlinkSync(filePath)
          logger.debug('LogUtils', `删除过期日志文件: ${file}`)
        }
      })
    }
    catch (error) {
      logger.error('LogUtils', '清理过期日志文件失败', error)
    }
  }
}

export default LogUtils
