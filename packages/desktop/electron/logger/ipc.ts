import { ipcMain } from 'electron'
import logger from './index'
import LogUtils from './utils'

/**
 * 日志IPC频道名称
 */
export enum LogIpcChannel {
  // 日志记录
  LOG = 'log:write',
  // 获取日志文件
  GET_LOGS = 'log:get-files',
  // 清理日志
  CLEAN_LOGS = 'log:clean',
}

/**
 * 日志IPC通信管理器
 * 处理与渲染进程之间的日志相关通信
 */
export class LogIpcManager {
  /**
   * 设置IPC通信处理器
   */
  public static setup(): void {
    // 处理来自渲染进程的日志请求
    ipcMain.handle(LogIpcChannel.LOG, (_, { level, category, message, data }) => {
      try {
        switch (level) {
          case 'trace':
            logger.trace(category, message, data)
            break
          case 'debug':
            logger.debug(category, message, data)
            break
          case 'info':
            logger.info(category, message, data)
            break
          case 'warn':
            logger.warn(category, message, data)
            break
          case 'error':
            logger.error(category, message, data)
            break
          case 'fatal':
            logger.fatal(category, message, data)
            break
          default:
            logger.info(category, message, data)
        }
        return { success: true }
      }
      catch (error: any) {
        console.error('处理日志IPC请求失败:', error)
        return { success: false, error: error?.message || String(error) }
      }
    })

    // 处理获取日志文件请求
    ipcMain.handle(LogIpcChannel.GET_LOGS, () => {
      try {
        return {
          success: true,
          files: LogUtils.getLogFiles(),
        }
      }
      catch (error: any) {
        logger.error('LogIpcManager', '获取日志文件失败', error)
        return { success: false, error: error?.message || String(error) }
      }
    })

    // 处理清理日志请求
    ipcMain.handle(LogIpcChannel.CLEAN_LOGS, (_, { days }) => {
      try {
        LogUtils.cleanupOldLogs(days)
        return { success: true }
      }
      catch (error: any) {
        logger.error('LogIpcManager', '清理日志失败', error)
        return { success: false, error: error?.message || String(error) }
      }
    })

    logger.info('LogIpcManager', '日志IPC通信管理器设置完成')
  }
}

export default LogIpcManager
