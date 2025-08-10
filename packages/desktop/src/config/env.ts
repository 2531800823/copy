import {app} from 'electron';

/**
 * 判断是否为开发环境
 */
export const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
console.log("🚀 liu123 ~ isDev:", isDev)
