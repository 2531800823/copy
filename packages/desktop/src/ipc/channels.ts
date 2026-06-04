export const IpcChannel = {
  /** 窗口置顶 */
  TOGGLE_WINDOW_TOP: 'toggle-window-top',
  /** 检查更新 */
  CHECK_FOR_UPDATES: 'updater:check',
  /** 下载更新 */
  DOWNLOAD_UPDATE: 'updater:download',
  /** 安装更新 */
  INSTALL_UPDATE: 'updater:install',
  /** 获取应用版本 */
  GET_APP_VERSION: 'get-app-version',
  /** 获取窗口配置 */
  GET_WINDOW_CONFIG: 'get-window-config',
  /** 保存窗口配置 */
  SAVE_WINDOW_CONFIG: 'save-window-config',
  /** 获取自启动状态 */
  GET_AUTO_LAUNCH: 'get-auto-launch',
  /** 设置自启动状态 */
  SET_AUTO_LAUNCH: 'set-auto-launch',
  /** 解压 ZIP 并用 VSCode 打开 */
  ARCHIVE_EXTRACT_ZIP_AND_OPEN: 'archive:extract-zip-and-open',
  /** 获取 ZIP 工作目录 */
  ARCHIVE_GET_WORKSPACE_DIR: 'archive:get-workspace-dir',
  /** 选择 ZIP 工作目录 */
  ARCHIVE_SELECT_WORKSPACE_DIR: 'archive:select-workspace-dir',
  /** 隐藏 ZIP 投放窗口 */
  ARCHIVE_HIDE_DROP_WINDOW: 'archive:hide-drop-window',
} as const;

export type IpcChannelKey = keyof typeof IpcChannel;
