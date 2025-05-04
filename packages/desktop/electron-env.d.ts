/// <reference types="vite-plugin-electron/electron-env" />

import type { LogAPI } from './electron/logger/types'

declare namespace NodeJS {
  interface ProcessEnv {
    VSCODE_DEBUG?: 'true'
    DIST_ELECTRON: string
    DIST: string
    /** /dist/ or /public/ */
    VITE_PUBLIC: string
  }
}

// 为window添加自定义属性
interface Window {
  ipcRenderer: {
    on: (channel: string, func: (...args: any[]) => void) => void
    off: (channel: string) => void
    send: (channel: string, ...args: any[]) => void
    invoke: <T = any>(channel: string, ...args: any[]) => Promise<T>
  }
  
  // 添加日志API
  logger: LogAPI
} 