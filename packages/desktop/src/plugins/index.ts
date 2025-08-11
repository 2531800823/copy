import {autoLaunchManager} from './autoLaunch';
import type {IAppPlugin} from './types';

/**
 * 默认内置插件列表
 */
export const builtinPlugins: IAppPlugin[] = [autoLaunchManager];

export * from './types';
export * from './autoLaunch';


