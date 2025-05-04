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

// Used in Renderer process, expose in `preload.ts`
interface Window {
  ipcRenderer: import('electron').IpcRenderer
}
