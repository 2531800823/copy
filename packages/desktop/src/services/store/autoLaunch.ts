import {EnumStoreKey} from './common';
import storeManager from './storeManager';
import {createLogger} from '../LoggerService';
const logger = createLogger('store-autoLaunch');

/**
 * 获取自动启动配置
 * @returns 是否自动启动
 */
export function getAutoLaunch() {
  try {
    return storeManager.get(EnumStoreKey.AUTO_LAUNCH) ?? false;
  } catch (error) {
    logger.error('获取自动启动配置失败', error);
    return false;
  }
}

/**
 * 设置自动启动配置
 * @param enable 是否启用自动启动
 */
export function setAutoLaunch(enable: boolean): void {
  try {
    storeManager.set(EnumStoreKey.AUTO_LAUNCH, enable);
    logger.info(`设置自动启动: ${enable}`);
  } catch (error) {
    logger.error('设置自动启动配置失败', error);
  }
}
