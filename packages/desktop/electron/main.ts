import type { Tray } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { app, BrowserWindow, dialog, Menu, nativeImage, net, protocol } from 'electron'
import { autoUpdater } from 'electron-updater'
import { updateAutoLaunchState } from './autoLaunch';
import initIpcMain from './ipcMain';
import logger from './logger';
import { LogIpcManager } from './logger/ipc';
import { LogUtils } from './logger/utils';
import { setupProtocol } from './protocol'
import { getAutoLaunch, getWindowConfig, saveWindowConfig, setAutoLaunch } from './store'
import { createTray, tray } from './tray';
import { setupAutoUpdater } from './update'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.DIST_ELECTRON = path.join(__dirname, '../')
process.env.DIST = path.join(process.env.DIST_ELECTRON, '../dist-electron')
export const DIST_ELECTRON = path.join(__dirname, '../')

export const PUBLIC = path.join(DIST_ELECTRON, '../public')

/**
 * 判断是否为开发环境
 */
export const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged
console.log('[DEBUG] isDev:', isDev)

/**
 * 获取最可能的渲染进程路径
 */
function getRendererPath() {
  if (isDev) {
    const devPath = path.join(__dirname, '../../web/dist');  // 开发环境使用web/dist
    console.log(`开发环境使用路径: ${devPath}`);
    return devPath;
  }

  console.log('当前应用路径信息:');
  console.log(`- 可执行文件路径: ${app.getPath('exe')}`);
  console.log(`- 应用程序目录: ${app.getAppPath()}`);
  console.log(`- 用户数据目录: ${app.getPath('userData')}`);
  console.log(`- 当前工作目录: ${process.cwd()}`);

  // 生产环境下尝试多个可能的路径
  const possiblePaths = [
    path.join(app.getPath('exe'), '../../resources/web/dist'), // electron-builder extraFiles
    path.join(app.getPath('exe'), '../resources/web/dist'), // 相对于exe的另一种路径
    path.join(app.getAppPath(), '../web/dist'), // 应用根目录
    path.join(app.getAppPath(), 'dist'), // 默认dist目录
    path.join(app.getAppPath(), '../../web/dist'), // 往上两级查找
    path.join(process.cwd(), 'resources/web/dist'), // 相对于当前工作目录
    path.join(process.cwd(), 'web/dist'), // 相对于当前工作目录
    path.join(process.cwd(), '../web/dist'), // 相对于当前工作目录向上一级
    path.join(app.getPath('userData'), '../web/dist'), // 相对于用户数据目录
  ];

  // 检查每个可能的路径
  for (const testPath of possiblePaths) {
    try {
      console.log(`检查路径: ${testPath}`);

      if (fs.existsSync(testPath)) {
        console.log(`找到有效的渲染进程路径: ${testPath}`);

        // 检查index.html是否存在
        const indexPath = path.join(testPath, 'index.html');
        if (fs.existsSync(indexPath)) {
          console.log(`index.html存在于: ${indexPath}`);

          // 列出目录内容
          try {
            const files = fs.readdirSync(testPath);
            console.log(`目录内容: ${files.join(', ')}`);

            return testPath;
          }
          catch (error: any) {
            console.error(`无法读取目录内容: ${error.message}`);
          }
        }
        else {
          console.log(`index.html不存在于: ${indexPath}`);
        }
      }
    }
    catch (error: any) {
      console.error(`检查路径出错: ${testPath}, 错误: ${error.message}`);
      // 忽略错误，继续检查下一个路径
    }
  }

  // 使用app.asar提取的路径
  const asarPaths = [
    path.join(app.getPath('exe'), '../resources/app.asar.unpacked/dist'),
    path.join(app.getPath('exe'), '../resources/app.asar.unpacked/web/dist'),
    path.join(app.getAppPath(), 'dist'),
  ];

  for (const asarPath of asarPaths) {
    try {
      console.log(`检查asar路径: ${asarPath}`);
      if (fs.existsSync(asarPath)) {
        console.log(`找到有效的asar解压渲染进程路径: ${asarPath}`);
        return asarPath;
      }
    }
    catch {
      // 忽略错误
    }
  }

  // 如果都不存在，返回一个默认路径，稍后会尝试多种方式加载
  const defaultPath = path.join(app.getPath('exe'), '../../resources/web/dist');
  console.log(`未找到有效路径，使用默认路径: ${defaultPath}`);
  return defaultPath;
}

// 添加 Web 构建产物的路径
export const RENDERER_DIST = getRendererPath();

console.log('🚀 加载渲染进程路径:', RENDERER_DIST)

export const isMac = process.platform === 'darwin'
export const isLinux = process.platform === 'linux'
export const isWin = process.platform === 'win32'

/**
 * 获取环境变量中的 WEB_URL
 * 在开发环境中使用 process.env 替代 import.meta.env
 */
export const WEB_URL = import.meta.env.VITE_WEB_URL

/** 主窗口实例 */
// eslint-disable-next-line import/no-mutable-exports
export let win: BrowserWindow | null

// 安全性设置，允许加载本地资源 - 必须在app ready之前调用
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true, supportFetchAPI: true, corsEnabled: true } },
])

/**
 * 应用初始化
 */
function initApp() {
  // 初始化日志系统
  logger.init()

  // 设置未捕获异常处理
  LogUtils.setupUncaughtExceptionHandler()

  // 设置IPC日志处理
  LogIpcManager.setup()

  // 记录应用启动信息
  LogUtils.logAppStartup()

  // 配置自动更新
  setupAutoUpdater()

  logger.info('App', '应用初始化完成')
}

/**
 * 保存窗口位置和大小
 */
function saveWindowState() {
  if (!win)
    return;

  try {
    // 判断窗口是否最大化
    const isMaximized = win.isMaximized();

    // 如果窗口最大化，只保存最大化状态
    if (isMaximized) {
      saveWindowConfig({ isMaximized });
      return;
    }

    // 获取窗口位置和大小
    const bounds = win.getBounds();

    // 保存窗口配置
    saveWindowConfig({
      width: bounds.width,
      height: bounds.height,
      x: bounds.x,
      y: bounds.y,
      isMaximized: false,
    });

    logger.debug('Window', '窗口状态已保存', bounds);
  }
  catch (error) {
    logger.error('Window', '保存窗口状态失败', error);
  }
}

/**
 * 创建主窗口
 */
function createWindow() {
  logger.info('Window', '正在创建主窗口')

  // 获取保存的窗口配置
  const windowConfig = getWindowConfig();

  // 合并默认配置和保存的配置
  const windowOptions = {
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      // 允许跨域访问，但关闭web安全限制以允许加载本地资源
      webSecurity: true,
      // 允许集成 Node.js 以便 web 项目可以使用 Node API
      nodeIntegration: true,
      contextIsolation: true,
      allowRunningInsecureContent: true, // 允许执行不安全内容
    },
    // 隐藏菜单栏但保留窗口控制按钮
    autoHideMenuBar: true,
    frame: true, // 保留窗口框架，这样会显示最大化/最小化按钮
    // 使用保存的窗口大小，如果没有则使用默认值
    width: windowConfig.width || 800,
    height: windowConfig.height || 600,
    // 如果存在窗口位置，则使用保存的位置
    ...(windowConfig.x !== undefined && windowConfig.y !== undefined
      ? { x: windowConfig.x, y: windowConfig.y }
      : {}),
  };

  win = new BrowserWindow(windowOptions);

  // 根据保存的配置决定是否最大化窗口
  if (windowConfig.isMaximized) {
    win.maximize();
  }

  // 移除应用菜单
  Menu.setApplicationMenu(null)

  // 创建系统托盘
  createTray()

  // 监听窗口大小和位置变化
  win.on('resize', () => {
    if (!win?.isMaximized()) {
      saveWindowState();
    }
  });

  win.on('move', () => {
    if (!win?.isMaximized()) {
      saveWindowState();
    }
  });

  // 监听窗口最大化和还原事件
  win.on('maximize', () => {
    saveWindowConfig({ isMaximized: true });
    logger.debug('Window', '窗口已最大化');
  })

  win.on('unmaximize', () => {
    saveWindowState();
    logger.debug('Window', '窗口已还原');
  })

  // 监听窗口关闭前事件，保存窗口状态
  win.on('close', () => {
    saveWindowState();
    logger.info('Window', '窗口关闭前保存状态');
  })

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date()).toLocaleString())
    logger.debug('Window', '主窗口加载完成')
  });

  initIpcMain(win)

  // 加载本地静态文件
  // const indexPath = path.join(RENDERER_DIST, 'index.html')

  // 检查文件是否存在
  try {
    win.webContents.on('before-input-event', (event, input) => {
      console.log('🚀 liu123 ~ event:', event, input)
      // 检测 Ctrl+Shift+I 组合键
      if (input.control && input.shift && input.code === 'Backquote') {
        if (win?.webContents.isDevToolsOpened())
          win?.webContents.closeDevTools()
        else
          win?.webContents.openDevTools()

        event.preventDefault()
      }
    })

    // 添加页面加载错误事件处理
    win.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
      logger.error('Window', `页面加载失败: ${validatedURL}, 错误码: ${errorCode}, 描述: ${errorDescription}`);
      // 显示开发者工具便于调试
      if (win && !win.webContents.isDevToolsOpened()) {
        win.webContents.openDevTools();
      }

      // 尝试加载错误页或重试
      setTimeout(() => {
        logger.info('Window', '尝试重新加载页面...');
        win?.loadURL(validatedURL).catch((err) => {
          logger.error('Window', `重试加载失败: ${err.message}`);
        })
      }, 3000);
    })

    // 监听渲染进程崩溃
    win.webContents.on('render-process-gone', (event, details) => {
      logger.error('Window', `渲染进程崩溃: ${details.reason}, ${details.exitCode}`);
    })

    if (isDev) {
      logger.info('Window', `url: ${WEB_URL}`)
      win?.loadURL(WEB_URL)
      win.webContents.openDevTools()
      return;
    }

    // 使用自定义app://协议加载HTML文件，解决资源路径问题
    const appUrl = `app://./index.html#/`  // 注意这里添加了#/确保使用hash路由
    logger.debug('Window', `加载生产环境URL: ${appUrl}`)
    console.log('🚀 加载本地静态文件:', appUrl)

    // 添加错误处理
    win?.loadURL(appUrl)
      .then(() => {
        logger.info('Window', '成功加载页面');
      })
      .catch((error) => {
        logger.error('Window', `加载URL失败: ${error.message}`, error);
        // 打开开发者工具帮助调试
        if (win && !win.webContents.isDevToolsOpened()) {
          win.webContents.openDevTools();
        }
      });

    // 开发环境下打开开发者工具
  }
  catch (error) {
    logger.error('Window', '加载渲染进程失败', error)
    console.error('加载渲染进程失败:', error)
  }
}

app.on('window-all-closed', () => {
  logger.info('App', '所有窗口已关闭')

  if (process.platform !== 'darwin') {
    logger.info('App', '应用即将退出')
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  logger.info('App', '应用被激活')

  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

// 应用准备好后设置协议并创建窗口
app.whenReady().then(() => {
  initApp() // 初始化应用
  setupProtocol()
  createWindow()

  // 设置自启动状态
  updateAutoLaunchState()
});

// 应用退出前记录日志
app.on('before-quit', () => {
  logger.info('App', '应用即将退出')
  // 保存窗口状态
  saveWindowState()
  // 销毁托盘图标
  if (tray) {
    tray.destroy()
  }
})
