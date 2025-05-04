/// <reference types="vite/client" />
interface Window {
  ipcRenderer: {
    on: (channel: string, func: (...args: any[]) => void) => void
    off: (channel: string) => void
    send: (channel: string, ...args: any[]) => void
    invoke: <T = any>(channel: string, ...args: any[]) => Promise<T>
    toggleWindowTop: (message: boolean) => Promise<void>
  }

  // 添加日志API
  logger: LogAPI
}
