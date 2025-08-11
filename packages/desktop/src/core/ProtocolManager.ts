import fs from 'node:fs';
import path from 'node:path';
import {app, protocol} from 'electron';
import logger from '../services/LoggerService';
import {isDev} from '../config/env';

/**
 * 协议配置接口
 */
export interface ProtocolConfig {
  scheme: string;
  privileges: {
    secure?: boolean;
    standard?: boolean;
    supportFetchAPI?: boolean;
    corsEnabled?: boolean;
  };
}

/**
 * 协议管理器
 * 负责管理自定义协议的注册和处理
 */
export class ProtocolManager {
  private _registeredProtocols = new Map<string, ProtocolConfig>();
  private _isInitialized = false;

  /**
   * 初始化协议管理器
   */
  public initialize(): this {
    if (this._isInitialized) {
      logger.warn('ProtocolManager', '协议管理器已经初始化');
      return this;
    }

    this._registerDefaultProtocols();
    this._isInitialized = true;

    logger.info('ProtocolManager', '协议管理器初始化完成');
    return this;
  }

  /**
   * 注册协议权限（必须在 app ready 之前调用）
   * @param config 协议配置
   */
  public registerProtocolPrivileges(config: ProtocolConfig): this {
    if (this._registeredProtocols.has(config.scheme)) {
      logger.warn('ProtocolManager', `协议 ${config.scheme} 已经注册`);
      return this;
    }

    try {
      protocol.registerSchemesAsPrivileged([
        {
          scheme: config.scheme,
          privileges: config.privileges,
        },
      ]);

      this._registeredProtocols.set(config.scheme, config);
      logger.info(
        'ProtocolManager',
        `协议权限已注册: ${config.scheme}`,
        config.privileges
      );
    } catch (error) {
      logger.error(
        'ProtocolManager',
        `注册协议权限失败: ${config.scheme}`,
        error
      );
    }

    return this;
  }

  /**
   * 设置应用协议处理器（在 app ready 之后调用）
   * @param resourcePath 资源文件路径
   */
  public setupAppProtocol(resourcePath: string): this {
    if (isDev) {
      logger.debug('ProtocolManager', '开发环境无需设置 app:// 协议');
      return this;
    }

    if (!this._registeredProtocols.has('app')) {
      logger.error('ProtocolManager', 'app 协议未注册权限');
      return this;
    }

    try {
      this._validateResourcePath(resourcePath);
      this._registerAppProtocolHandler(resourcePath);

      logger.info(
        'ProtocolManager',
        `app:// 协议处理器已设置，资源路径: ${resourcePath}`
      );
    } catch (error) {
      logger.error('ProtocolManager', '设置 app:// 协议处理器失败', error);
    }

    return this;
  }

  /**
   * 获取已注册的协议列表
   */
  public getRegisteredProtocols(): string[] {
    return Array.from(this._registeredProtocols.keys());
  }

  /**
   * 检查协议是否已注册
   * @param scheme 协议名称
   */
  public isProtocolRegistered(scheme: string): boolean {
    return this._registeredProtocols.has(scheme);
  }

  /**
   * 注册默认协议
   */
  private _registerDefaultProtocols(): void {
    // 注册 app 协议权限
    this.registerProtocolPrivileges({
      scheme: 'app',
      privileges: {
        secure: true,
        standard: true,
        supportFetchAPI: true,
        corsEnabled: true,
      },
    });
  }

  /**
   * 验证资源路径
   * @param resourcePath 资源路径
   */
  private _validateResourcePath(resourcePath: string): void {
    logger.info('ProtocolManager', `验证资源路径: ${resourcePath}`);
    logger.info('ProtocolManager', `应用执行路径: ${app.getPath('exe')}`);
    logger.info('ProtocolManager', `应用根目录: ${app.getAppPath()}`);

    if (!fs.existsSync(resourcePath)) {
      logger.error('ProtocolManager', `资源目录不存在: ${resourcePath}`);
      this._tryFindAlternativePaths(resourcePath);
      throw new Error(`资源目录不存在: ${resourcePath}`);
    }

    // 检查 index.html 是否存在
    const indexPath = path.join(resourcePath, 'index.html');
    if (!fs.existsSync(indexPath)) {
      logger.error('ProtocolManager', `index.html 不存在: ${indexPath}`);
      throw new Error(`index.html 不存在: ${indexPath}`);
    }

    // 列出目录内容用于调试
    try {
      const files = fs.readdirSync(resourcePath);
      logger.debug('ProtocolManager', `资源目录内容: ${files.join(', ')}`);
    } catch (error) {
      logger.warn('ProtocolManager', '无法读取资源目录内容', error);
    }
  }

  /**
   * 尝试查找备选路径
   * @param originalPath 原始路径
   */
  private _tryFindAlternativePaths(originalPath: string): void {
    const alternativePaths = [
      path.join(app.getAppPath(), '../web/dist'),
      path.join(app.getPath('exe'), '../resources/web/dist'),
      path.join(app.getPath('exe'), '../resources/app.asar/dist'),
      path.join(app.getPath('userData'), '../web/dist'),
    ];

    logger.info('ProtocolManager', '尝试查找备选目录...');

    for (const altPath of alternativePaths) {
      logger.debug('ProtocolManager', `检查备选目录: ${altPath}`);

      if (fs.existsSync(altPath)) {
        logger.info('ProtocolManager', `找到可用的备选目录: ${altPath}`);

        try {
          const files = fs.readdirSync(altPath);
          logger.debug('ProtocolManager', `备选目录内容: ${files.join(', ')}`);
        } catch (err) {
          logger.error('ProtocolManager', `无法读取备选目录内容: ${err}`);
        }
      }
    }
  }

  /**
   * 注册 app 协议处理器
   * @param resourcePath 资源路径
   */
  private _registerAppProtocolHandler(resourcePath: string): void {
    protocol.registerFileProtocol('app', (request, callback) => {
      const url = request.url.substr(6); // 移除 'app://' 前缀
      const filePath = path.normalize(path.join(resourcePath, url));

      logger.debug(
        'ProtocolManager',
        `处理协议请求: ${request.url} -> ${filePath}`
      );

      callback({path: filePath});
    });

    logger.info('ProtocolManager', 'app:// 协议处理器已注册');
  }

  /**
   * 获取是否已初始化
   */
  public get isInitialized(): boolean {
    return this._isInitialized;
  }

  /**
   * 重置协议管理器
   */
  public reset(): this {
    this._registeredProtocols.clear();
    this._isInitialized = false;
    logger.info('ProtocolManager', '协议管理器已重置');
    return this;
  }
}
