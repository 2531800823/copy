import { app, dialog } from 'electron'
import { autoUpdater } from 'electron-updater'
import logger from './logger'
import { isDev, win } from './main'

/**
 * 配置自动更新
 */
export function setupAutoUpdater() {
  logger.info('Updater', '初始化自动更新模块');

  // 配置日志
  autoUpdater.logger = logger.getLogger();

  // 配置自动下载
  autoUpdater.autoDownload = true;

  // 配置允许降级（可选，默认为false）
  autoUpdater.allowDowngrade = false;

  // 强制开发环境也检查更新
  if (isDev) {
    logger.info('Updater', '开发环境下强制启用自动更新');
    // 开发环境强制检查更新
    autoUpdater.forceDevUpdateConfig = true
  }

  // 配置更新服务器（明确指定更新服务器地址）
  autoUpdater.setFeedURL({
    provider: 'github',
    owner: '2531800823',
    repo: 'copy',
    releaseType: 'release',
    private: false,
    publishAutoUpdate: true,
  });

  // 错误处理
  autoUpdater.on('error', (error) => {
    logger.error('Updater', '更新错误', error);
    logger.error('Updater', `更新URL: ${autoUpdater.getFeedURL()}`);

    // 显示更详细的错误信息
    const errorMessage = `检查更新时出现错误: ${error.message}`
    if (error.stack) {
      logger.error('Updater', `错误堆栈: ${error.stack}`)
    }

    dialog.showErrorBox('更新出错', errorMessage)

    if (win) {
      win.webContents.send('update-error', error)
    }
  })

  // 检查更新中
  autoUpdater.on('checking-for-update', () => {
    logger.info('Updater', '正在检查更新...');
    logger.info('Updater', `更新URL: ${autoUpdater.getFeedURL()}`);
  })

  // 有可用更新
  autoUpdater.on('update-available', (info) => {
    logger.info('Updater', '发现新版本', info);
    dialog.showMessageBox({
      type: 'info',
      title: '发现新版本',
      message: `发现新版本: ${info.version}`,
      detail: '正在自动下载更新，下载完成后将提示您安装',
      buttons: ['确定'],
    });
  })

  // 没有可用更新
  autoUpdater.on('update-not-available', (info) => {
    logger.info('Updater', '当前已是最新版本', info);
  })

  // 更新下载进度
  autoUpdater.on('download-progress', (progressObj) => {
    const logMessage = `下载速度: ${progressObj.bytesPerSecond} - 已下载 ${Math.round(progressObj.percent)}% (${progressObj.transferred}/${progressObj.total})`;
    logger.info('Updater', logMessage);
    if (win) {
      win.webContents.send('update-progress', progressObj);
    }
  });

  // 更新下载完成
  autoUpdater.on('update-downloaded', (info) => {
    logger.info('Updater', '更新已下载，准备安装', info);

    dialog.showMessageBox({
      type: 'info',
      title: '安装更新',
      message: '更新已下载',
      detail: '新版本已下载完成，应用将重启并安装',
      buttons: ['立即安装', '稍后安装'],
    }).then((returnValue) => {
      if (returnValue.response === 0) {
        // 关闭应用并安装更新
        autoUpdater.quitAndInstall(false, true);
      }
    });
  })

  // 延迟5秒后检查更新，避免应用启动时的性能影响
  setTimeout(() => {
    logger.info('Updater', '开始检查更新');
    logger.info('Updater', `当前版本: ${app.getVersion()}`);
    logger.info('Updater', `更新源: ${autoUpdater.getFeedURL()}`);
    logger.info('Updater', `是否开发环境: ${isDev}`);
    logger.info('Updater', `强制检查开发更新: ${autoUpdater.forceDevUpdateConfig}`);

    autoUpdater.checkForUpdates().then((result) => {
      logger.info('Updater', '检查更新结果', result);
      if (result && result.updateInfo) {
        logger.info('Updater', `找到的版本: ${result.updateInfo.version}`);
        logger.info('Updater', `发布时间: ${result.updateInfo.releaseDate}`);
        logger.info('Updater', `发布页面: ${result.updateInfo.releaseNotes || '无'}`);
      }
    }).catch((err) => {
      logger.error('Updater', '检查更新失败', err);
    })
  }, 5000);
}
