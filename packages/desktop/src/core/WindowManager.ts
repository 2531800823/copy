import { BaseWindow } from './windows/BaseWindow';

export class WindowManager {
  private static instance: WindowManager;
  private windows: Map<string, BaseWindow> = new Map();

  private constructor() {}

  public static getInstance() {
    if (!WindowManager.instance) {
      WindowManager.instance = new WindowManager();
    }
    return WindowManager.instance;
  }

  public add(key: string, window: BaseWindow) {
    this.windows.set(key, window);
  }

  public get(key: string) {
    return this.windows.get(key);
  }

  public count() {
    return this.windows.size;
  }

  public remove(key: string) {
    this.windows.delete(key);
  }
}
