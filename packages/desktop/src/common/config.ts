import type {DeepPartial} from '@/utils/typeUtils';
import path from 'node:path';
import {isDev} from '.';
import {LOCATION} from './protocol';

export interface ApplicationConfig {
  /** 窗口默认配置 */
  window: {
    width: number;
    height: number;
    autoHideMenuBar: boolean;
    frame: boolean;
    /** 关闭按钮行为 */
    closeButtonBehavior: 'minimize' | 'hide' | 'quit';
  };
  appUrl: string;
  resourcePath: string;
}
export type PartialConfig = DeepPartial<ApplicationConfig>;

/**
 * 获取web资源路径
 * 开发环境：使用相对路径
 * 生产环境：使用打包后的资源路径
 */
function getResourcePath(): string {
  if (isDev) {
    return path.join(__dirname, '../../web/dist');
  } else {
    return path.join(process.resourcesPath, 'web/dist');
  }
}

export const defaultConfig: ApplicationConfig = {
  window: {
    width: 800,
    height: 600,
    autoHideMenuBar: true,
    frame: true,
    closeButtonBehavior: 'hide',
  },
  appUrl: isDev
    ? process.env.VITE_WEB_URL || 'http://localhost:7010/app'
    : `${LOCATION}/app`,
  resourcePath: getResourcePath(),
};
