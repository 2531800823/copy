// 自定义IPC接口
interface CustomIpcRenderer {
  getVersion: () => Promise<string>
  on: (channel: string, func: (...args: any[]) => void) => void
  off: (channel: string) => void
  send: (channel: string, ...args: any[]) => void
  invoke: <T = any>(channel: string, ...args: any[]) => Promise<T>
  toggleWindowTop: (message: boolean) => Promise<void>
}

// 窗口配置类型
interface WindowConfig {
  width?: number
  height?: number
  x?: number
  y?: number
  isMaximized?: boolean
}

// 窗口配置接口类型
interface WindowConfigAPI {
  getConfig: () => Promise<WindowConfig>
  saveConfig: (config: WindowConfig) => Promise<boolean>
}

// 自启动设置接口
interface AutoLaunchAPI {
  get: () => Promise<boolean>
  set: (enable: boolean) => Promise<boolean>
}

// 日志接口类型
interface LogAPI {
  trace: (category: string, message: string, data?: any) => Promise<any>
  debug: (category: string, message: string, data?: any) => Promise<any>
  info: (category: string, message: string, data?: any) => Promise<any>
  warn: (category: string, message: string, data?: any) => Promise<any>
  error: (category: string, message: string, data?: any) => Promise<any>
  fatal: (category: string, message: string, data?: any) => Promise<any>
  getLogFiles: () => Promise<any>
  cleanupLogs: (days?: number) => Promise<any>
}

// 更新接口类型
interface UpdaterAPI {
  checkForUpdates: () => Promise<void>
  downloadUpdate: () => Promise<void>
  quitAndInstall: () => Promise<void>
  onUpdateAvailable: (callback: (info: any) => void) => void
  onUpdateNotAvailable: (callback: (info: any) => void) => void
  onUpdateProgress: (callback: (progress: any) => void) => void
  onUpdateDownloaded: (callback: (info: any) => void) => void
  onUpdateError: (callback: (error: any) => void) => void
}

// 扩展Window接口
interface Window {
  ipcRenderer: CustomIpcRenderer
  logger: LogAPI
  updater: UpdaterAPI
  windowConfig: WindowConfigAPI
  autoLaunch: AutoLaunchAPI
}
