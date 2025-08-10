import {EnumStoreKey, WindowConfig} from './common';
import storeManager from './storeManager';
import {createLogger} from '@/services/LoggerService';

const logger = createLogger('store-window');

/**
 * 获取窗口配置
 * @returns 窗口配置
 */
export function getWindowConfig() {
  try {
    return storeManager.get(EnumStoreKey.WINDOW) || {};
  } catch (error) {
    logger.error('获取窗口配置失败', error);
    return {}; // 返回空对象作为默认值
  }
}

/**
 * 保存窗口配置
 * @param config 窗口配置
 */
export function saveWindowConfig(config: WindowConfig): void {
  try {
    storeManager.set(EnumStoreKey.WINDOW, config);
    logger.info('保存窗口配置成功', config);
  } catch (error) {
    logger.error('保存窗口配置失败', error);
  }
}
