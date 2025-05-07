/**
 * 应用配置管理模块
 * 用于存储用户配置，如窗口大小、位置等
 */
import path from 'node:path'
import { app } from 'electron'
import Store from 'electron-store'
import logger from './logger'

/**
 * 窗口配置类型定义
 */
interface WindowConfig {
  /** 窗口宽度 */
  width?: number
  /** 窗口高度 */
  height?: number
  /** 窗口x坐标 */
  x?: number
  /** 窗口y坐标 */
  y?: number
  /** 是否最大化 */
  isMaximized?: boolean
}

/**
 * 应用配置类型定义
 */
interface AppConfig {
  /** 窗口配置 */
  window?: WindowConfig
}

/**
 * 配置存储实例
 */
const store = new Store<AppConfig>({
  // 配置存储在用户数据目录下的config.json文件中
  name: 'config',
  // 默认配置
  defaults: {
    window: {
      width: 800,
      height: 600,
    },
  },
})

/**
 * 获取窗口配置
 * @returns 窗口配置
 */
export function getWindowConfig(): WindowConfig {
  try {
    return store.get('window') || {}
  }
  catch (error) {
    logger.error('Store', '获取窗口配置失败', error)
    return {} // 返回空对象作为默认值
  }
}

/**
 * 保存窗口配置
 * @param config 窗口配置
 */
export function saveWindowConfig(config: WindowConfig): void {
  try {
    store.set('window', config)
    logger.debug('Store', '保存窗口配置成功', config)
  }
  catch (error) {
    logger.error('Store', '保存窗口配置失败', error)
  }
}

/**
 * 导出存储实例，以便其他模块可以直接使用
 */
export default store 
