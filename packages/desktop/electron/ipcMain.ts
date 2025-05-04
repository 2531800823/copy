import type {
  BrowserWindow,
} from 'electron'
import {
  ipcMain,
} from 'electron';

export const IpcChannel = {
  /** 窗口置顶 */
  TOGGLE_WINDOW_TOP: 'toggle-window-top',
}

function initIpcMain(win: BrowserWindow) {
  ipcMain.handle(IpcChannel.TOGGLE_WINDOW_TOP, (e, message) => {
    console.log(message)
    win.setAlwaysOnTop(message)
  });
}

export default initIpcMain;
