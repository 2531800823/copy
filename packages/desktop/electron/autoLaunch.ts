import path from 'node:path';
import process from 'node:process';
import { app } from 'electron';
import logger from './logger'
import { getAutoLaunch, setAutoLaunch } from './store'

/**
 * 设置应用自启动状态
 */
export function updateAutoLaunchState() {
  // 获取用户设置的自启动状态
  const userSetting = getAutoLaunch()
  // 获取当前系统实际的自启动状态
  const isAutoLaunchEnabled = app.getLoginItemSettings().openAtLogin

  logger.info('App', `用户自启动设置: ${userSetting}`)
  logger.info('App', `系统自启动状态: ${isAutoLaunchEnabled}`)

  // 如果是首次使用应用（没有保存过设置），默认启用自启动
  // 这里通过检查 userSetting 是否为 undefined 或 null 来判断是否首次使用
  const isFirstRun = userSetting === undefined || userSetting === null

  if (isFirstRun) {
    logger.info('App', '首次运行应用，默认启用自启动')
    // 默认启用自启动
    setAutoLaunchAndApply(true)
    return
  }

  // 如果不是首次运行，确保系统设置与用户设置一致
  if (isAutoLaunchEnabled !== userSetting) {
    setAutoLaunchAndApply(userSetting)
  }
}

/**
 * 内部函数：设置并应用自启动设置到系统
 * @param enable 是否启用自启动
 */
function setAutoLaunchAndApply(enable: boolean) {
  try {
    // 保存用户设置
    setAutoLaunch(enable)

    // 应用设置到系统
    app.setLoginItemSettings({
      openAtLogin: enable,
      // 在Windows上，启动时不显示，而是在后台启动
      openAsHidden: enable,
      // 如果是开发环境则不设置自启动
      path: app.isPackaged ? undefined : process.execPath,
      args: app.isPackaged ? [] : [path.resolve(process.argv[1] || '.')],
    })

    logger.info('App', `已${enable ? '启用' : '禁用'}开机自启动`)
  }
  catch (error) {
    logger.error('App', '设置开机自启动失败', error)
  }
}

/**
 * 设置应用自启动
 * @param enable 是否启用自启动
 */
export function setAppAutoLaunch(enable: boolean): boolean {
  try {
    // 更新存储的设置
    setAutoLaunch(enable)

    // 应用设置到系统
    app.setLoginItemSettings({
      openAtLogin: enable,
      openAsHidden: enable,
      path: app.isPackaged ? undefined : process.execPath,
      args: app.isPackaged ? [] : [path.resolve(process.argv[1] || '.')],
    })

    logger.info('App', `已${enable ? '启用' : '禁用'}开机自启动`)
    return true
  }
  catch (error) {
    logger.error('App', '设置开机自启动失败', error)
    return false
  }
}

/**
 * 获取应用自启动状态
 */
export function getAppAutoLaunch(): boolean {
  // 优先使用系统实际设置的值
  const systemSetting = app.getLoginItemSettings().openAtLogin
  // 返回系统设置，如果获取不到则使用存储的设置
  return systemSetting
}
