import {EventEmitter} from 'events';
import logger from '../services/LoggerService';

/**
 * 插件生命周期阶段
 */
export enum PluginLifecycle {
  SETUP = 'setup',
  READY = 'ready',
  BEFORE_QUIT = 'before-quit',
  DESTROY = 'destroy',
}

/**
 * 插件上下文接口
 * 提供插件运行时需要的应用上下文
 */
export interface PluginContext {
  /** 应用实例 */
  app: any;
  /** 事件管理器 */
  eventManager: any;
  /** 服务容器 */
  serviceContainer: any;
  /** 配置对象 */
  config: any;
}

/**
 * 插件接口
 */
export interface IPlugin {
  /** 插件名称 */
  readonly name: string;
  /** 插件版本 */
  readonly version: string;
  /** 插件描述 */
  readonly description?: string;
  /** 插件依赖的其他插件 */
  readonly dependencies?: string[];
  /** 插件是否启用 */
  enabled: boolean;

  /**
   * 插件安装
   * @param context 插件上下文
   */
  install(context: PluginContext): Promise<void> | void;

  /**
   * 插件卸载
   * @param context 插件上下文
   */
  uninstall?(context: PluginContext): Promise<void> | void;

  /**
   * 插件启用
   * @param context 插件上下文
   */
  enable?(context: PluginContext): Promise<void> | void;

  /**
   * 插件禁用
   * @param context 插件上下文
   */
  disable?(context: PluginContext): Promise<void> | void;

  /**
   * 生命周期钩子
   * @param lifecycle 生命周期阶段
   * @param context 插件上下文
   */
  onLifecycle?(
    lifecycle: PluginLifecycle,
    context: PluginContext
  ): Promise<void> | void;
}

/**
 * 插件元数据
 */
export interface PluginMetadata {
  plugin: IPlugin;
  installed: boolean;
  enabled: boolean;
  installTime?: Date;
  enableTime?: Date;
  error?: Error;
}

/**
 * 插件系统
 * 负责管理所有插件的生命周期
 */
export class PluginSystem extends EventEmitter {
  private _plugins = new Map<string, PluginMetadata>();
  private _context: PluginContext;
  private _isInitialized = false;

  constructor(context: PluginContext) {
    super();
    this._context = context;
  }

  /**
   * 初始化插件系统
   */
  public async initialize(): Promise<void> {
    if (this._isInitialized) {
      logger.warn('PluginSystem', '插件系统已经初始化');
      return;
    }

    this._isInitialized = true;
    logger.info('PluginSystem', '插件系统初始化完成');

    this.emit('initialized');
  }

  /**
   * 注册插件
   * @param plugin 插件实例
   */
  public register(plugin: IPlugin): this {
    if (this._plugins.has(plugin.name)) {
      throw new Error(`插件 ${plugin.name} 已经注册`);
    }

    // 检查依赖
    if (plugin.dependencies) {
      for (const dep of plugin.dependencies) {
        // 检查是否为已注册的插件
        const isPluginDep = this._plugins.has(dep);
        // 检查是否为已注册的服务
        const isServiceDep = this._context.serviceContainer.has(dep);

        if (!isPluginDep && !isServiceDep) {
          throw new Error(`插件 ${plugin.name} 依赖的插件/服务 ${dep} 未找到`);
        }
      }
    }

    const metadata: PluginMetadata = {
      plugin,
      installed: false,
      enabled: plugin.enabled,
    };

    this._plugins.set(plugin.name, metadata);
    logger.info('PluginSystem', `插件 ${plugin.name} 已注册`);

    this.emit('plugin:registered', plugin);
    return this;
  }

  /**
   * 安装插件
   * @param name 插件名称
   */
  public async install(name: string): Promise<void> {
    const metadata = this._plugins.get(name);
    if (!metadata) {
      throw new Error(`插件 ${name} 未注册`);
    }

    if (metadata.installed) {
      logger.warn('PluginSystem', `插件 ${name} 已经安装`);
      return;
    }

    try {
      // 安装依赖
      if (metadata.plugin.dependencies) {
        for (const dep of metadata.plugin.dependencies) {
          await this.install(dep);
        }
      }

      await metadata.plugin.install(this._context);

      metadata.installed = true;
      metadata.installTime = new Date();
      metadata.error = undefined;

      logger.info('PluginSystem', `插件 ${name} 安装成功`);
      this.emit('plugin:installed', metadata.plugin);

      // 如果插件启用，则自动启用
      if (metadata.enabled) {
        await this.enable(name);
      }
    } catch (error) {
      metadata.error = error as Error;
      logger.error('PluginSystem', `插件 ${name} 安装失败`, error);
      this.emit('plugin:install-error', metadata.plugin, error);
      throw error;
    }
  }

  /**
   * 卸载插件
   * @param name 插件名称
   */
  public async uninstall(name: string): Promise<void> {
    const metadata = this._plugins.get(name);
    if (!metadata) {
      throw new Error(`插件 ${name} 未注册`);
    }

    if (!metadata.installed) {
      logger.warn('PluginSystem', `插件 ${name} 未安装`);
      return;
    }

    try {
      // 先禁用插件
      if (metadata.enabled) {
        await this.disable(name);
      }

      // 检查是否有其他插件依赖此插件
      for (const [pluginName, pluginMeta] of this._plugins) {
        if (
          pluginMeta.plugin.dependencies?.includes(name) &&
          pluginMeta.installed
        ) {
          throw new Error(`无法卸载插件 ${name}，插件 ${pluginName} 依赖于它`);
        }
      }

      if (metadata.plugin.uninstall) {
        await metadata.plugin.uninstall(this._context);
      }

      metadata.installed = false;
      metadata.installTime = undefined;
      metadata.error = undefined;

      logger.info('PluginSystem', `插件 ${name} 卸载成功`);
      this.emit('plugin:uninstalled', metadata.plugin);
    } catch (error) {
      metadata.error = error as Error;
      logger.error('PluginSystem', `插件 ${name} 卸载失败`, error);
      this.emit('plugin:uninstall-error', metadata.plugin, error);
      throw error;
    }
  }

  /**
   * 启用插件
   * @param name 插件名称
   */
  public async enable(name: string): Promise<void> {
    const metadata = this._plugins.get(name);
    if (!metadata) {
      throw new Error(`插件 ${name} 未注册`);
    }

    if (!metadata.installed) {
      throw new Error(`插件 ${name} 未安装，无法启用`);
    }

    if (metadata.enabled) {
      logger.warn('PluginSystem', `插件 ${name} 已经启用`);
      return;
    }

    try {
      if (metadata.plugin.enable) {
        await metadata.plugin.enable(this._context);
      }

      metadata.enabled = true;
      metadata.enableTime = new Date();
      metadata.error = undefined;

      logger.info('PluginSystem', `插件 ${name} 启用成功`);
      this.emit('plugin:enabled', metadata.plugin);
    } catch (error) {
      metadata.error = error as Error;
      logger.error('PluginSystem', `插件 ${name} 启用失败`, error);
      this.emit('plugin:enable-error', metadata.plugin, error);
      throw error;
    }
  }

  /**
   * 禁用插件
   * @param name 插件名称
   */
  public async disable(name: string): Promise<void> {
    const metadata = this._plugins.get(name);
    if (!metadata) {
      throw new Error(`插件 ${name} 未注册`);
    }

    if (!metadata.enabled) {
      logger.warn('PluginSystem', `插件 ${name} 已经禁用`);
      return;
    }

    try {
      if (metadata.plugin.disable) {
        await metadata.plugin.disable(this._context);
      }

      metadata.enabled = false;
      metadata.enableTime = undefined;
      metadata.error = undefined;

      logger.info('PluginSystem', `插件 ${name} 禁用成功`);
      this.emit('plugin:disabled', metadata.plugin);
    } catch (error) {
      metadata.error = error as Error;
      logger.error('PluginSystem', `插件 ${name} 禁用失败`, error);
      this.emit('plugin:disable-error', metadata.plugin, error);
      throw error;
    }
  }

  /**
   * 触发生命周期钩子
   * @param lifecycle 生命周期阶段
   */
  public async triggerLifecycle(lifecycle: PluginLifecycle): Promise<void> {
    logger.debug('PluginSystem', `触发生命周期: ${lifecycle}`);

    const enabledPlugins = Array.from(this._plugins.values())
      .filter((meta) => meta.installed && meta.enabled)
      .map((meta) => meta.plugin);

    for (const plugin of enabledPlugins) {
      try {
        if (plugin.onLifecycle) {
          await plugin.onLifecycle(lifecycle, this._context);
        }
      } catch (error) {
        logger.error(
          'PluginSystem',
          `插件 ${plugin.name} 生命周期 ${lifecycle} 执行失败`,
          error
        );
        this.emit('plugin:lifecycle-error', plugin, lifecycle, error);
      }
    }

    this.emit('lifecycle:triggered', lifecycle);
  }

  /**
   * 获取插件信息
   * @param name 插件名称
   */
  public getPlugin(name: string): PluginMetadata | undefined {
    return this._plugins.get(name);
  }

  /**
   * 获取所有插件
   */
  public getAllPlugins(): PluginMetadata[] {
    return Array.from(this._plugins.values());
  }

  /**
   * 获取已安装的插件
   */
  public getInstalledPlugins(): PluginMetadata[] {
    return this.getAllPlugins().filter((meta) => meta.installed);
  }

  /**
   * 获取已启用的插件
   */
  public getEnabledPlugins(): PluginMetadata[] {
    return this.getAllPlugins().filter(
      (meta) => meta.installed && meta.enabled
    );
  }

  /**
   * 检查插件是否存在
   * @param name 插件名称
   */
  public hasPlugin(name: string): boolean {
    return this._plugins.has(name);
  }

  /**
   * 检查插件是否已安装
   * @param name 插件名称
   */
  public isInstalled(name: string): boolean {
    const metadata = this._plugins.get(name);
    return metadata?.installed || false;
  }

  /**
   * 检查插件是否已启用
   * @param name 插件名称
   */
  public isEnabled(name: string): boolean {
    const metadata = this._plugins.get(name);
    return (metadata?.installed && metadata?.enabled) || false;
  }

  /**
   * 获取插件统计信息
   */
  public getStats() {
    const all = this.getAllPlugins();
    const installed = this.getInstalledPlugins();
    const enabled = this.getEnabledPlugins();
    const errors = all.filter((meta) => meta.error);

    return {
      total: all.length,
      installed: installed.length,
      enabled: enabled.length,
      errors: errors.length,
      errorPlugins: errors.map((meta) => ({
        name: meta.plugin.name,
        error: meta.error?.message,
      })),
    };
  }

  /**
   * 销毁插件系统
   */
  public async destroy(): Promise<void> {
    logger.info('PluginSystem', '正在销毁插件系统...');

    // 触发销毁生命周期
    await this.triggerLifecycle(PluginLifecycle.DESTROY);

    // 禁用所有插件
    const enabledPlugins = this.getEnabledPlugins();
    for (const metadata of enabledPlugins) {
      try {
        await this.disable(metadata.plugin.name);
      } catch (error) {
        logger.error(
          'PluginSystem',
          `禁用插件 ${metadata.plugin.name} 失败`,
          error
        );
      }
    }

    // 卸载所有插件
    const installedPlugins = this.getInstalledPlugins();
    for (const metadata of installedPlugins) {
      try {
        await this.uninstall(metadata.plugin.name);
      } catch (error) {
        logger.error(
          'PluginSystem',
          `卸载插件 ${metadata.plugin.name} 失败`,
          error
        );
      }
    }

    this._plugins.clear();
    this._isInitialized = false;

    logger.info('PluginSystem', '插件系统已销毁');
    this.emit('destroyed');
  }
}
