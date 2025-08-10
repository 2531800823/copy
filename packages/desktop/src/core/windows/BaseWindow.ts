import {BrowserWindow} from 'electron';
import path from 'path';

export abstract class BaseWindow {
  protected browserWindow: BrowserWindow | null = null;
  protected abstract width: number;
  protected abstract height: number;
  protected abstract htmlFile: string;

  constructor() {
    this.create();
  }

  private create() {
    this.browserWindow = new BrowserWindow({
      width: this.width,
      height: this.height,
      webPreferences: {
        preload: path.join(__dirname, '../../preload/index.js'),
        contextIsolation: true,
        nodeIntegration: false,
      },
    });

    if (process.env.NODE_ENV === 'development') {
      this.browserWindow.loadURL('http://localhost:3000');
    } else {
      this.browserWindow.loadFile(this.htmlFile);
    }

    this.browserWindow.on('closed', () => {
      this.browserWindow = null;
    });
  }

  public getWindow() {
    return this.browserWindow;
  }
}
