/// <reference types="vite-plugin-electron/electron-env" />

declare namespace NodeJS {
  interface ProcessEnv {
    APP_ROOT: string
    /** /dist/ or /public/ */
    VITE_PUBLIC: string
    VITE_WEB_URL: string
  }
  interface ImportMetaEnv {
    readonly VITE_WEB_URL: string
  }
}

// 扩展ImportMeta接口，添加env属性
interface ImportMeta {
  readonly env: {
    readonly VITE_WEB_URL: string
    readonly MODE: string
    readonly DEV: boolean
    readonly PROD: boolean
    [key: string]: any
  }
}

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

// Used in Renderer process, expose in `preload.ts`
interface Window {
  ipcRenderer: CustomIpcRenderer
  logger: LogAPI
  updater: UpdaterAPI
  windowConfig: WindowConfigAPI
  autoLaunch: AutoLaunchAPI
}
