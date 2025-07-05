import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import {fileURLToPath} from 'node:url';
import {app, Menu, nativeImage, Tray} from 'electron';
import {toAbout} from './about';
import logger from './logger';
import {win} from './main';
import {checkForUpdates} from './update';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * 创建系统托盘图标
 */
// eslint-disable-next-line import/no-mutable-exports
export let tray: Tray | null = null;

/**
 * 获取托盘图标路径
 * - 开发环境：取源码目录
 * - 生产环境：优先查找常规路径 process.resourcesPath/build/icons/png/32x32.png
 * - 如果常规路径不存在，降级到兼容路径
 */
function getIconPath() {
  if (process.env.NODE_ENV === 'development') {
    const devPath = path.join(__dirname, '../build/icons/png/32x32.png');
    logger.info('Tray', `开发环境图标路径: ${devPath}`);
    return devPath;
  }

  // 优先尝试常规路径（直接在 app.asar 中的图标）
  const normalPath = path.join(
    process.resourcesPath,
    'build',
    'icons',
    'png',
    '32x32.png'
  );

  // 检查路径存在性（为了调试目的打印路径）
  logger.info(
    'Tray',
    `生产环境图标路径: ${normalPath}, 文件存在: ${fs.existsSync(normalPath)}`
  );

  return normalPath;
}

const iconPath = getIconPath();
logger.info(
  'Tray',
  `iconPath: ${iconPath}, exists: ${fs.existsSync(iconPath)}`
);
const icon = nativeImage.createFromPath(iconPath);
logger.info('Tray', `icon is empty: ${icon.isEmpty()}`);

export function createTray() {
  logger.info('Tray', '正在创建系统托盘图标');

  tray = new Tray(icon);
  tray.setToolTip('我的应用');

  // 创建托盘菜单
  const contextMenu = Menu.buildFromTemplate([
    {
      label: '置顶窗口',
      type: 'checkbox',
      checked: false,
      click: (menuItem) => {
        if (!win) return;

        win.setAlwaysOnTop(menuItem.checked);
        logger.info('Tray', `窗口置顶状态: ${menuItem.checked}`);
      },
    },
    {type: 'separator'},
    {
      label: '关于',
      click: () => {
        toAbout();
      },
    },
    {
      label: '显示窗口',
      click: () => {
        if (win) {
          win.show();
          win.focus();
        }
      },
    },
    {
      label: '检查更新',
      click: () => {
        checkForUpdates();
      },
    },

    {type: 'separator'},
    {
      label: '退出',
      click: () => {
        app.quit();
      },
    },
  ]);

  // 设置托盘菜单
  tray.setContextMenu(contextMenu);

  // 点击托盘图标时显示窗口
  tray.on('click', () => {
    if (win) {
      if (win.isVisible()) {
        win.hide();
      } else {
        win.show();
        win.focus();
      }
    }
  });

  logger.info('Tray', '系统托盘图标创建完成');
}
