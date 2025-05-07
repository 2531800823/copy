import path from 'node:path';
import { fileURLToPath } from 'node:url'
import { BrowserWindow } from 'electron'
import { isDev, WEB_URL } from './main';

const __dirname = path.dirname(fileURLToPath(import.meta.url))
/**
 * 打开关于我们
 */
export function toAbout() {
  const win = new BrowserWindow({
    width: 300,
    height: 400,
    title: '关于幕布',
    maximizable: false,
    minimizable: false,
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      // 允许跨域访问
      webSecurity: true,
      // 允许集成 Node.js 以便 web 项目可以使用 Node API
      nodeIntegration: true,
      contextIsolation: true,
      allowRunningInsecureContent: true, // 允许执行不安全内容
    },
  });

  if (isDev) {
    win?.loadURL(`${WEB_URL}/#/about`)
  }
  else {
    win.loadURL(`app://./index.html#/about`)
  }
}
