import fs from 'node:fs';
import path from 'node:path';
import {app, protocol} from 'electron';
import {createLogger} from './LoggerService';
import {isPathRouter, LOCATION, PROTOCOL} from '@/common/protocol';
import {getMimeType} from '@/utils/getMimeType';
import {inject, injectable} from 'inversify';
import {Config} from '@/core/Config';
import {EnumServiceKey} from './type';
import {isDev} from '@/common';

const logger = createLogger('ProtocolService');

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
@injectable()
export class ProtocolService {
  private _registeredProtocols = new Map<string, ProtocolConfig>();
  private _isInitialized = false;

  constructor(@inject(EnumServiceKey.Config) private readonly config: Config) {}

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
  public setupAppProtocol(): this {
    if (isDev) {
      logger.debug('ProtocolManager', '开发环境无需设置 app:// 协议');
      return this;
    }

    if (!this._registeredProtocols.has(PROTOCOL)) {
      logger.error('ProtocolManager', 'app 协议未注册权限');
      return this;
    }

    try {
      const resourcePath = this.config.get('resourcePath');
      logger.info(
        'ProtocolManager',
        `开始设置协议处理器，资源路径: ${resourcePath}`
      );

      // this._validateResourcePath(resourcePath);
      this._registerAppProtocolHandler();

      logger.info(
        'ProtocolManager',
        `${PROTOCOL}:// 协议处理器已设置，资源路径: ${resourcePath}`
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
      scheme: PROTOCOL,
      privileges: {
        secure: true,
        standard: true,
        supportFetchAPI: true,
        corsEnabled: true,
      },
    });
  }

  /**
   * 注册 app 协议处理器
   * @param resourcePath 资源路径
   */
  private _registerAppProtocolHandler(): void {
    const resourcePath = this.config.get('resourcePath');

    logger.info(
      'ProtocolManager',
      `开始注册协议处理器，协议: ${PROTOCOL}，资源路径: ${resourcePath}`
    );

    protocol.handle(PROTOCOL, async (request) => {
      logger.info('ProtocolManager', `🚀 协议处理器收到请求: ${request.url}`);

      // 移除协议前缀，获取相对路径
      const urlWithoutScheme = request.url.replace(LOCATION, '');

      console.log('🚀 liu123 ~ urlWithoutScheme:', urlWithoutScheme);
      console.log("🚀 liu123 ~ resourcePath:", resourcePath)
      if (isPathRouter(urlWithoutScheme)) {
        const filePath = path.join(resourcePath, './index.html');
        const data = fs.readFileSync(filePath);
        const contentType = getMimeType(filePath);
        console.log(
          '🚀 liu123 ~ protocol.handle ~ 返回:',
          JSON.stringify({
            contentType,
            filePath,
            dataLength: data.length,
          })
        );

        const response = new Response(data, {
          headers: {
            'Content-Type': contentType,
            'Access-Control-Allow-Origin': '*',
          },
        });

        logger.info(
          'ProtocolManager',
          `路由路径响应创建成功，数据长度: ${data.length}`
        );
        return response;
      }

      try {
        // 获取URL中协议之后的部分，例如 'index.html' 或 'assets/index-BFFICt56.js'
        let url = urlWithoutScheme;

        // 智能路径解析：处理各种可能的路径格式
        let filePath = path.join(resourcePath, url);

        // 检查文件是否存在
        if (fs.existsSync(filePath)) {
          // 使用同步读取，因为 protocol.handle 需要同步返回
          const data = fs.readFileSync(filePath);
          console.log(
            '🚀 liu123 ~ protocol.handle ~ 文件读取成功，数据长度:',
            data.length
          );

          const contentType = getMimeType(filePath);
          const response = new Response(data, {
            headers: {
              'Content-Type': contentType,
              'Access-Control-Allow-Origin': '*',
            },
          });

          logger.info(
            'ProtocolManager',
            '响应创建成功',
            JSON.stringify({
              filePath,
              dataLength: data.length,
              contentType,
              response,
            })
          );
          return response;
        } else {
          logger.error('🚀 liu123 ~ protocol.handle ~ 文件不存在:', filePath);
          // 如果文件不存在，返回404错误
          return new Response('File not found', {status: 404});
        }
      } catch (error) {
        logger.error('🚀 liu123 ~ protocol.handle ~ 发生错误:', error);
        return new Response('Internal Server Error', {status: 500});
      }
    });

    logger.info('ProtocolManager', `${PROTOCOL}:// 协议处理器已注册`);
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
