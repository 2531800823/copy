import path from "path";

/** 操作系统 */
export const isMac = process.platform === 'darwin';
export const isLinux = process.platform === 'linux'; // 不支持
export const isWin = process.platform === 'win32';

/** 是否开发环境 */
export const isDev = import.meta.env.DEV;

/** 是否生产环境 */
export const isProd = import.meta.env.PROD;

export const WEB_URL = import.meta.env.VITE_WEB_URL;

export const preloadPath = path.join(__dirname, './preload.js');
console.log("🚀 liu123 ~ preloadPath:", preloadPath)
