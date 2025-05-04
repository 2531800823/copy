export interface LogAPI {
  /**
   * 记录跟踪级别日志
   * @param category 日志类别
   * @param message 日志消息
   * @param data 附加数据
   */
  trace(category: string, message: string, data?: any): Promise<any>
  
  /**
   * 记录调试级别日志
   * @param category 日志类别
   * @param message 日志消息
   * @param data 附加数据
   */
  debug(category: string, message: string, data?: any): Promise<any>
  
  /**
   * 记录信息级别日志
   * @param category 日志类别
   * @param message 日志消息
   * @param data 附加数据
   */
  info(category: string, message: string, data?: any): Promise<any>
  
  /**
   * 记录警告级别日志
   * @param category 日志类别
   * @param message 日志消息
   * @param data 附加数据
   */
  warn(category: string, message: string, data?: any): Promise<any>
  
  /**
   * 记录错误级别日志
   * @param category 日志类别
   * @param message 日志消息
   * @param data 附加数据
   */
  error(category: string, message: string, data?: any): Promise<any>
  
  /**
   * 记录致命级别日志
   * @param category 日志类别
   * @param message 日志消息
   * @param data 附加数据
   */
  fatal(category: string, message: string, data?: any): Promise<any>
  
  /**
   * 获取日志文件列表
   * @returns 日志文件列表
   */
  getLogFiles(): Promise<{ success: boolean; files?: string[]; error?: string }>
  
  /**
   * 清理过期日志文件
   * @param days 保留天数，默认30天
   * @returns 操作结果
   */
  cleanupLogs(days?: number): Promise<{ success: boolean; error?: string }>
}

declare global {
  interface Window {
    logger: LogAPI
  }
} 