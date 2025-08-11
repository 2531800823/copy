/**
 * Electron 主进程入口文件
 * 使用面向对象架构管理应用生命周期
 */
import 'reflect-metadata';
import {BrowserWindow} from 'electron';
import {MainApplication, ApplicationConfig} from './core/MainApplication';
import logger from './services/LoggerService';
import {EnumServiceKey, containerServices} from './services';
import {EnumStoreKey} from './services/store';
import {skip} from 'rxjs';

/** 主窗口实例 - 保持向后兼容性 */
export let win: BrowserWindow | null = null;

/**
 * 应用配置
 */
const appConfig: ApplicationConfig = {
  window: {
    width: 800,
    height: 600,
    autoHideMenuBar: true,
    frame: true,
  },
  development: {
    webUrl: process.env.VITE_WEB_URL || 'http://localhost:3000',
    openDevTools: true,
  },
  production: {
    appUrl: 'app://./index.html#/',
  },
};

/**
 * 创建并启动应用实例
 */
async function startApplication() {
  try {
    const app = new MainApplication(appConfig);
    const storeManager = app.getService(EnumServiceKey.StoreManager);
    storeManager.set(EnumStoreKey.WINDOW, {
      width: 800,
      height: 600,
      x: 100,
      y: 100,
      isMaximized: false,
    });
    console.log(storeManager.get(EnumStoreKey.WINDOW));

    // 方案1: 跳过初始值，只监听后续变化
    app.config
      .watch('window')
      .pipe(skip(1))
      .subscribe((window) => {
        console.log('🚀 测试 windowConfig 变化:', window);
      });

    // 方案2: 如果需要初始值和变化都监听，可以区分处理
    // app.config.watch('window').subscribe((window) => {
    //   console.log('🚀 测试 windowConfig (包含初始值):', window);
    // });
    app.config.set('window', {
      width: 1000,
      height: 800,
      autoHideMenuBar: true,
      frame: true,
    });
    // await app.start();

    // 更新全局 win 变量以保持兼容性
    // win = app.getMainWindow();

    // // 监听主窗口变化
    // app.getEventManager().on('window:created', (window) => {
    //   win = window;
    // });

    // app.getEventManager().on('window:destroyed', () => {
    //   win = null;
    // });

    // logger.info('Main', '应用启动成功');
  } catch (error) {
    logger.error('Main', '应用启动失败', error);
    process.exit(1);
  }
}

// 启动应用
startApplication();
