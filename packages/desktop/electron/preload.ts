import type { LogIpcChannel } from './logger/ipc'
import { contextBridge, ipcRenderer } from 'electron'
import { IpcChannel } from './ipcMain'

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

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('ipcRenderer', {
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args;
    return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args));
  },
  off(...args: Parameters<typeof ipcRenderer.off>) {
    const [channel, ...omit] = args;
    return ipcRenderer.off(channel, ...omit);
  },
  send(...args: Parameters<typeof ipcRenderer.send>) {
    const [channel, ...omit] = args;
    return ipcRenderer.send(channel, ...omit);
  },
  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...omit] = args;
    return ipcRenderer.invoke(channel, ...omit);
  },

  // You can expose other APTs you need here.
  // ...
  toggleWindowTop: (message: boolean) => ipcRenderer.invoke(IpcChannel.TOGGLE_WINDOW_TOP, message),
});

// 暴露日志API
contextBridge.exposeInMainWorld('logger', {
  // 各种日志级别方法
  trace: (category: string, message: string, data?: any) =>
    ipcRenderer.invoke('log:write', { level: 'trace', category, message, data }),

  debug: (category: string, message: string, data?: any) =>
    ipcRenderer.invoke('log:write', { level: 'debug', category, message, data }),

  info: (category: string, message: string, data?: any) =>
    ipcRenderer.invoke('log:write', { level: 'info', category, message, data }),

  warn: (category: string, message: string, data?: any) =>
    ipcRenderer.invoke('log:write', { level: 'warn', category, message, data }),

  error: (category: string, message: string, data?: any) =>
    ipcRenderer.invoke('log:write', { level: 'error', category, message, data }),

  fatal: (category: string, message: string, data?: any) =>
    ipcRenderer.invoke('log:write', { level: 'fatal', category, message, data }),

  // 日志文件管理
  getLogFiles: () => ipcRenderer.invoke('log:get-files'),

  cleanupLogs: (days = 30) => ipcRenderer.invoke('log:clean', { days }),
} as LogAPI);
