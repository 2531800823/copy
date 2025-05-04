import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { app, BrowserWindow, net, protocol } from 'electron'
import electronLog from 'electron-log'

// 配置日志
electronLog.transports.console.level = 'debug'
electronLog.transports.file.level = 'info'

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

// 添加 Web 构建产物的路径
// 修改这里指向您的渲染进程dist文件夹
export const RENDERER_DIST = path.join(__dirname, '../../web/dist')
// 如果您的dist在其他位置，请相应修改路径，例如：
// export const RENDERER_DIST = path.join(__dirname, '../dist') // 如果在desktop/dist目录下
electronLog.info('加载渲染进程路径:', RENDERER_DIST)

export const isMac = process.platform === 'darwin'
export const isLinux = process.platform === 'linux'
export const isWin = process.platform === 'win32'

/**
 * 判断是否为开发环境
 */
export const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged
electronLog.info('开发环境状态:', isDev)

/**
 * 获取环境变量中的 WEB_URL
 * 在开发环境中使用 process.env 替代 import.meta.env
 */
export const WEB_URL = import.meta.env.VITE_WEB_URL

/** 主窗口实例 */
let win: BrowserWindow | null

// 安全性设置，允许加载本地资源 - 必须在app ready之前调用
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true, supportFetchAPI: true, corsEnabled: true } },
])

/**
 * 创建主窗口
 */
function createWindow() {
  win = new BrowserWindow({
    icon: path.join(PUBLIC, 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      // 允许跨域访问
      webSecurity: true,
      // 允许集成 Node.js 以便 web 项目可以使用 Node API
      nodeIntegration: true,
      contextIsolation: true,
      allowRunningInsecureContent: true, // 允许执行不安全内容
    },
  })

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date()).toLocaleString())
  })

  // 加载本地静态文件
  // const indexPath = path.join(RENDERER_DIST, 'index.html')

  // 检查文件是否存在
  try {
    if (isDev) {
      win?.loadURL(WEB_URL)
      win.webContents.openDevTools()
      return
    }
    // 使用自定义app://协议加载HTML文件，解决资源路径问题
    const appUrl = `app://./index.html`
    electronLog.info('加载本地静态文件:', appUrl)
    win?.loadURL(appUrl)

    // 开发环境下打开开发者工具
  }
  catch (error) {
    electronLog.error('加载渲染进程失败:', error)
  }
}

/**
 * 设置自定义协议，解决静态资源加载问题
 */
function setupProtocol() {
  if (isDev) {
    return
  }
  // 注册app协议
  protocol.handle('app', (request) => {
    const url = request.url.slice('app://'.length)
    const decodedUrl = decodeURI(url)

    try {
      // 如果URL是根路径，直接返回index.html
      let filePath
      if (decodedUrl === './' || decodedUrl === '.') {
        filePath = path.join(RENDERER_DIST, 'index.html')
      }
      else {
        // 否则尝试从渲染进程的dist目录解析文件
        filePath = path.join(RENDERER_DIST, decodedUrl)
      }

      electronLog.debug('请求资源:', request.url, '->>', filePath)

      // 检查文件是否存在
      if (fs.existsSync(filePath)) {
        return net.fetch(`file://${filePath}`)
      }

      electronLog.warn(`文件不存在: ${filePath}`)
      return new Response(null, { status: 404 })
    }
    catch (error) {
      electronLog.error('加载资源失败:', error)
      return new Response(null, { status: 500 })
    }
  })
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

// 应用准备好后设置协议并创建窗口
app.whenReady().then(() => {
  setupProtocol()
  createWindow()
})
