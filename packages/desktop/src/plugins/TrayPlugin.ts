import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import {
  app,
  dialog,
  Menu,
  NativeImage,
  nativeImage,
  Tray,
  MenuItem,
} from 'electron';
import {IPlugin, PluginContext, PluginLifecycle} from '../core/PluginSystem';
import logger from '../services/LoggerService';
import {appName} from '../config';

/**
 * 托盘菜单项配置
 */
export interface TrayMenuItem {
  label?: string;
  type?: 'normal' | 'separator' | 'submenu' | 'checkbox' | 'radio';
  checked?: boolean;
  enabled?: boolean;
  visible?: boolean;
  accelerator?: string;
  icon?: NativeImage;
  sublabel?: string;
  toolTip?: string;
  click?: (menuItem: MenuItem) => void;
  submenu?: TrayMenuItem[];
}

/**
 * 托盘插件配置
 */
export interface TrayPluginConfig {
  /** 图标路径 */
  iconPath?: string;
  /** 工具提示文本 */
  tooltip?: string;
  /** 是否启用点击显示/隐藏窗口 */
  enableClickToggle?: boolean;
  /** 自定义菜单项 */
  customMenuItems?: TrayMenuItem[];
}

/**
 * 托盘插件
 * 负责管理系统托盘图标和菜单
 */
export class TrayPlugin implements IPlugin {
  public readonly name = 'tray';
  public readonly version = '1.0.0';
  public readonly description = '系统托盘管理插件';
  public readonly dependencies = [];
  public enabled = true;

  private _context?: PluginContext;
  private _tray: Tray | null = null;
  private _contextMenu: Menu | null = null;
  private _icon: NativeImage | null = null;
  private _config: TrayPluginConfig;

  constructor(config: TrayPluginConfig = {}) {
    this._config = {
      tooltip: '我的应用',
      enableClickToggle: true,
      customMenuItems: [],
      ...config,
    };
  }

  /**
   * 安装插件
   */
  public async install(context: PluginContext): Promise<void> {
    this._context = context;

    this._initIcon();
    this._createTray();
    this._createContextMenu();
    this._registerEvents();

    logger.info('TrayPlugin', '系统托盘插件安装完成');
  }

  /**
   * 卸载插件
   */
  public async uninstall(): Promise<void> {
    this._tray?.destroy();
    this._tray = null;
    this._contextMenu = null;
    this._icon = null;

    logger.info('TrayPlugin', '系统托盘插件卸载完成');
  }

  /**
   * 生命周期钩子
   */
  public async onLifecycle(
    lifecycle: PluginLifecycle,
    context: PluginContext
  ): Promise<void> {
    switch (lifecycle) {
      case PluginLifecycle.READY:
        await this._onReady();
        break;
      case PluginLifecycle.DESTROY:
        await this.uninstall();
        break;
    }
  }

  /**
   * 更新托盘图标
   * @param iconPath 图标路径
   */
  public updateIcon(iconPath: string): void {
    if (!this._tray) return;

    try {
      const icon = nativeImage.createFromPath(iconPath);
      if (!icon.isEmpty()) {
        this._tray.setImage(icon);
        this._icon = icon;
        logger.debug('TrayPlugin', `托盘图标已更新: ${iconPath}`);
      } else {
        logger.warn('TrayPlugin', `无效的图标路径: ${iconPath}`);
      }
    } catch (error) {
      logger.error('TrayPlugin', `更新托盘图标失败: ${iconPath}`, error);
    }
  }

  /**
   * 更新工具提示
   * @param tooltip 工具提示文本
   */
  public updateTooltip(tooltip: string): void {
    if (!this._tray) return;

    this._tray.setToolTip(tooltip);
    this._config.tooltip = tooltip;
    logger.debug('TrayPlugin', `托盘提示已更新: ${tooltip}`);
  }

  /**
   * 更新上下文菜单
   * @param menuItems 菜单项配置
   */
  public updateMenu(menuItems: TrayMenuItem[]): void {
    this._config.customMenuItems = menuItems;
    this._createContextMenu();
    logger.debug('TrayPlugin', '托盘菜单已更新');
  }

  /**
   * 添加菜单项
   * @param menuItem 菜单项配置
   * @param position 插入位置（可选）
   */
  public addMenuItem(menuItem: TrayMenuItem, position?: number): void {
    if (!this._config.customMenuItems) {
      this._config.customMenuItems = [];
    }

    if (position !== undefined) {
      this._config.customMenuItems.splice(position, 0, menuItem);
    } else {
      this._config.customMenuItems.push(menuItem);
    }

    this._createContextMenu();
    logger.debug('TrayPlugin', `托盘菜单项已添加: ${menuItem.label}`);
  }

  /**
   * 移除菜单项
   * @param label 菜单项标签
   */
  public removeMenuItem(label: string): void {
    if (!this._config.customMenuItems) return;

    const index = this._config.customMenuItems.findIndex(
      (item) => item.label === label
    );
    if (index !== -1) {
      this._config.customMenuItems.splice(index, 1);
      this._createContextMenu();
      logger.debug('TrayPlugin', `托盘菜单项已移除: ${label}`);
    }
  }

  /**
   * 显示气泡通知
   * @param title 标题
   * @param content 内容
   */
  public displayBalloon(title: string, content: string): void {
    if (!this._tray) return;

    this._tray.displayBalloon({
      title,
      content,
      icon: this._icon || undefined,
    });

    logger.debug('TrayPlugin', `显示托盘通知: ${title}`);
  }

  /**
   * 获取托盘图标路径
   */
  private _getIconPath(): string {
    if (this._config.iconPath) {
      return this._config.iconPath;
    }

    if (process.env.NODE_ENV === 'development') {
      const devPath = path.join(__dirname, '../build/icons/png/32x32.png');
      logger.debug('TrayPlugin', `开发环境图标路径: ${devPath}`);
      return devPath;
    }

    // 生产环境图标路径
    const iconPath = path.join(
      process.resourcesPath,
      'build',
      'icons',
      'png',
      '32x32.png'
    );

    logger.debug(
      'TrayPlugin',
      `生产环境图标路径: ${iconPath}, 文件存在: ${fs.existsSync(iconPath)}`
    );
    return iconPath;
  }

  /**
   * 初始化图标
   */
  private _initIcon(): void {
    const iconPath = this._getIconPath();

    try {
      this._icon = nativeImage.createFromPath(iconPath);

      if (this._icon.isEmpty()) {
        logger.warn('TrayPlugin', `托盘图标为空: ${iconPath}`);
        // 创建默认图标
        this._icon = nativeImage.createEmpty();
      } else {
        logger.debug('TrayPlugin', `托盘图标加载成功: ${iconPath}`);
      }
    } catch (error) {
      logger.error('TrayPlugin', `加载托盘图标失败: ${iconPath}`, error);
      this._icon = nativeImage.createEmpty();
    }
  }

  /**
   * 创建托盘
   */
  private _createTray(): void {
    if (!this._icon) {
      throw new Error('托盘图标未初始化');
    }

    this._tray = new Tray(this._icon);
    this._tray.setToolTip(this._config.tooltip || '我的应用');

    logger.debug('TrayPlugin', '系统托盘已创建');
  }

  /**
   * 创建上下文菜单
   */
  private _createContextMenu(): void {
    if (!this._tray) return;

    const defaultMenuItems: TrayMenuItem[] = [
      {
        label: '置顶窗口',
        type: 'checkbox',
        checked: false,
        click: (menuItem) => {
          const window = this._context?.app.getMainWindow?.();
          if (!window) return;

          window.setAlwaysOnTop(menuItem.checked);
          logger.debug('TrayPlugin', `窗口置顶状态: ${menuItem.checked}`);
        },
      },
      {type: 'separator'},
      {
        label: '显示窗口',
        click: () => {
          const window = this._context?.app.getMainWindow?.();
          if (window) {
            window.show();
            window.focus();
          }
        },
      },
      {
        label: '关于',
        click: () => {
          this._showAbout();
        },
      },
      {type: 'separator'},
      {
        label: '退出',
        click: () => {
          app.quit();
        },
      },
    ];

    // 合并自定义菜单项
    const allMenuItems = [
      ...(this._config.customMenuItems || []),
      ...(this._config.customMenuItems?.length
        ? [{type: 'separator' as const}]
        : []),
      ...defaultMenuItems,
    ];

    this._contextMenu = Menu.buildFromTemplate(
      this._convertMenuItems(allMenuItems)
    );
    this._tray.setContextMenu(this._contextMenu);

    logger.debug('TrayPlugin', '托盘上下文菜单已创建');
  }

  /**
   * 转换菜单项配置为Electron菜单项
   */
  private _convertMenuItems(
    items: TrayMenuItem[]
  ): Electron.MenuItemConstructorOptions[] {
    return items.map((item) => ({
      label: item.label,
      type: item.type,
      checked: item.checked,
      enabled: item.enabled,
      visible: item.visible,
      accelerator: item.accelerator,
      icon: item.icon,
      sublabel: item.sublabel,
      toolTip: item.toolTip,
      click: item.click,
      submenu: item.submenu ? this._convertMenuItems(item.submenu) : undefined,
    }));
  }

  /**
   * 注册事件
   */
  private _registerEvents(): void {
    if (!this._tray || !this._config.enableClickToggle) return;

    this._tray.on('click', () => {
      const window = this._context?.app.getMainWindow?.();
      if (!window) return;

      if (window.isVisible()) {
        window.hide();
      } else {
        window.show();
        window.focus();
      }
    });

    // 监听气泡通知点击事件
    this._tray.on('balloon-click', () => {
      const window = this._context?.app.getMainWindow?.();
      if (window) {
        window.show();
        window.focus();
      }
    });

    logger.debug('TrayPlugin', '托盘事件已注册');
  }

  /**
   * 显示关于对话框
   */
  private _showAbout(): void {
    const detail = `应用版本：${app.getVersion()}`;

    dialog.showMessageBox({
      title: '关于',
      type: 'info',
      message: appName || '我的应用',
      detail,
      noLink: true,
      buttons: ['确定'],
    });
  }

  /**
   * 应用准备就绪时的处理
   */
  private async _onReady(): Promise<void> {
    logger.debug('TrayPlugin', '托盘插件准备就绪');
  }

  /**
   * 获取托盘实例
   */
  public getTray(): Tray | null {
    return this._tray;
  }

  /**
   * 获取配置
   */
  public getConfig(): TrayPluginConfig {
    return {...this._config};
  }

  /**
   * 更新配置
   */
  public updateConfig(config: Partial<TrayPluginConfig>): void {
    this._config = {...this._config, ...config};

    if (config.tooltip) {
      this.updateTooltip(config.tooltip);
    }

    if (config.iconPath) {
      this.updateIcon(config.iconPath);
    }

    if (config.customMenuItems) {
      this.updateMenu(config.customMenuItems);
    }
  }
}

/**
 * 创建托盘插件实例
 */
export function createTrayPlugin(config?: TrayPluginConfig): TrayPlugin {
  return new TrayPlugin(config);
}
