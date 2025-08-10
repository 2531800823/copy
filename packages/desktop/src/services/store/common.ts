/** 存储键名枚举 */
export enum EnumStoreKey {
  /** 窗口配置 */
  WINDOW = 'window',
  /** 自动启动配置 */
  AUTO_LAUNCH = 'autoLaunch',
}

/** 存储配置接口 */
export interface StoreConfig {
  [EnumStoreKey.WINDOW]: WindowConfig;
  [EnumStoreKey.AUTO_LAUNCH]: boolean;
}

/**
 * 窗口配置类型定义
 */
export interface WindowConfig {
  /** 窗口宽度 */
  width?: number;
  /** 窗口高度 */
  height?: number;
  /** 窗口x坐标 */
  x?: number;
  /** 窗口y坐标 */
  y?: number;
  /** 是否最大化 */
  isMaximized?: boolean;
}
