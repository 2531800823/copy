import type {DeepPartial} from '@/utils/typeUtils';
import path from 'node:path';
import {isDev} from '.';

export interface ApplicationConfig {
  /** 窗口默认配置 */
  window: {
    width: number;
    height: number;
    autoHideMenuBar: boolean;
    frame: boolean;
  };
  appUrl: string;
  resourcePath: string;
}
export type PartialConfig = DeepPartial<ApplicationConfig>;

export const defaultConfig: ApplicationConfig = {
  window: {
    width: 800,
    height: 600,
    autoHideMenuBar: true,
    frame: true,
  },
  appUrl: isDev
    ? process.env.VITE_WEB_URL || 'http://localhost:7010'
    : 'liu://liu.com/app',
  resourcePath: path.join(__dirname, '../../../web/dist'),
};
