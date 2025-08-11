/** 应用名称 */
export const appName = 'copy';

/** 操作系统 */
export const isMac = process.platform === 'darwin';
export const isLinux = process.platform === 'linux'; // 不支持
export const isWin = process.platform === 'win32';

/** 是否开发环境 */
export const isDev = import.meta.env.NODE_ENV === 'development';

/** 是否生产环境 */
export const isProd = import.meta.env.NODE_ENV === 'production';

export const WEB_URL = import.meta.env.VITE_WEB_URL;
