import {contextBridge, ipcRenderer} from 'electron';
import {IpcChannel} from './ipcMain';

// 日志接口类型
interface LogAPI {
  trace: (category: string, message: string, data?: any) => Promise<any>;
  debug: (category: string, message: string, data?: any) => Promise<any>;
  info: (category: string, message: string, data?: any) => Promise<any>;
  warn: (category: string, message: string, data?: any) => Promise<any>;
  error: (category: string, message: string, data?: any) => Promise<any>;
  fatal: (category: string, message: string, data?: any) => Promise<any>;
  getLogFiles: () => Promise<any>;
  cleanupLogs: (days?: number) => Promise<any>;
}

// 更新接口类型
interface UpdaterAPI {
  checkForUpdates: () => Promise<void>;
  downloadUpdate: () => Promise<void>;
  quitAndInstall: () => Promise<void>;
  onUpdateAvailable: (callback: (info: any) => void) => void;
  onUpdateNotAvailable: (callback: (info: any) => void) => void;
  onUpdateProgress: (callback: (progress: any) => void) => void;
  onUpdateDownloaded: (callback: (info: any) => void) => void;
  onUpdateError: (callback: (error: any) => void) => void;
}

// 窗口配置类型
interface WindowConfig {
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  isMaximized?: boolean;
}

// 窗口配置接口类型
interface WindowConfigAPI {
  getConfig: () => Promise<WindowConfig>;
  saveConfig: (config: WindowConfig) => Promise<boolean>;
}

// 自启动设置接口
interface AutoLaunchAPI {
  get: () => Promise<boolean>;
  set: (enable: boolean) => Promise<boolean>;
}

// 自定义IPC接口
interface CustomIpcRenderer {
  getVersion: () => Promise<string>;
  on: (channel: string, func: (...args: any[]) => void) => void;
  off: (channel: string) => void;
  send: (channel: string, ...args: any[]) => void;
  invoke: <T = any>(channel: string, ...args: any[]) => Promise<T>;
  toggleWindowTop: (message: boolean) => Promise<void>;
}

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('ipcRenderer', {
  /** 获取应用版本 */
  getVersion: () => ipcRenderer.invoke(IpcChannel.GET_APP_VERSION),
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args;
    return ipcRenderer.on(channel, (event, ...args) =>
      listener(event, ...args)
    );
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

  toggleWindowTop: (message: boolean) =>
    ipcRenderer.invoke(IpcChannel.TOGGLE_WINDOW_TOP, message),
} as unknown as CustomIpcRenderer);

// 暴露日志API
contextBridge.exposeInMainWorld('logger', {
  // 各种日志级别方法
  trace: (category: string, message: string, data?: any) =>
    ipcRenderer.invoke('log:write', {level: 'trace', category, message, data}),

  debug: (category: string, message: string, data?: any) =>
    ipcRenderer.invoke('log:write', {level: 'debug', category, message, data}),

  info: (category: string, message: string, data?: any) =>
    ipcRenderer.invoke('log:write', {level: 'info', category, message, data}),

  warn: (category: string, message: string, data?: any) =>
    ipcRenderer.invoke('log:write', {level: 'warn', category, message, data}),

  error: (category: string, message: string, data?: any) =>
    ipcRenderer.invoke('log:write', {level: 'error', category, message, data}),

  fatal: (category: string, message: string, data?: any) =>
    ipcRenderer.invoke('log:write', {level: 'fatal', category, message, data}),

  // 日志文件管理
  getLogFiles: () => ipcRenderer.invoke('log:get-files'),

  cleanupLogs: (days = 30) => ipcRenderer.invoke('log:clean', {days}),
} as LogAPI);

// 暴露更新API
contextBridge.exposeInMainWorld('updater', {
  // 主动检查更新
  checkForUpdates: () => ipcRenderer.invoke('updater:check'),

  // 下载更新
  downloadUpdate: () => ipcRenderer.invoke('updater:download'),

  // 退出并安装更新
  quitAndInstall: () => ipcRenderer.invoke('updater:install'),

  // 更新事件监听
  onUpdateAvailable: (callback: (info: any) => void) => {
    ipcRenderer.on('update-available', (_event, info) => callback(info));
  },

  onUpdateNotAvailable: (callback: (info: any) => void) => {
    ipcRenderer.on('update-not-available', (_event, info) => callback(info));
  },

  onUpdateProgress: (callback: (progress: any) => void) => {
    ipcRenderer.on('update-progress', (_event, progress) => callback(progress));
  },

  onUpdateDownloaded: (callback: (info: any) => void) => {
    ipcRenderer.on('update-downloaded', (_event, info) => callback(info));
  },

  onUpdateError: (callback: (error: any) => void) => {
    ipcRenderer.on('update-error', (_event, error) => callback(error));
  },
} as UpdaterAPI);

// 暴露窗口配置API
contextBridge.exposeInMainWorld('windowConfig', {
  // 获取窗口配置
  getConfig: () => ipcRenderer.invoke(IpcChannel.GET_WINDOW_CONFIG),

  // 保存窗口配置
  saveConfig: (config: WindowConfig) =>
    ipcRenderer.invoke(IpcChannel.SAVE_WINDOW_CONFIG, config),
} as WindowConfigAPI);

// 暴露自动启动API
contextBridge.exposeInMainWorld('autoLaunch', {
  // 获取自启动状态
  get: () => ipcRenderer.invoke(IpcChannel.GET_AUTO_LAUNCH),

  // 设置自启动状态
  set: (enable: boolean) =>
    ipcRenderer.invoke(IpcChannel.SET_AUTO_LAUNCH, enable),
} as AutoLaunchAPI);
