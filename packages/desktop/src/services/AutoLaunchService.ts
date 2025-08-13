import type StoreManager from './store/storeManager'
import type { MainApplication } from '@/core/MainApplication'
import path from 'node:path'
import { app } from 'electron'
import { inject, injectable } from 'inversify'
import { isLinux } from '@/common'
import logger from './LoggerService'
import { EnumStoreKey } from './store/common'
import { EnumServiceKey } from './type'

/**
 * 开机自启动管理服务
 * 负责读取/设置系统登录项，以及持久化用户选择
 */
@injectable()
export class AutoLaunchService {
  constructor(
    @inject(EnumServiceKey.StoreManager)
    private storeManager: StoreManager,
    @inject(EnumServiceKey.MainApplication)
    private mainApplication: MainApplication,
  ) {
    this.mainApplication.getAppEventManager().appReady$.subscribe(() => {
      this.applySavedSetting()
    });
  }

  /**
   * 是否启用开机自启动（优先读取系统登录项，其次回退到本地持久化）
   */
  public isEnabled(): boolean {
    try {
      if (isLinux) {
        // 目前暂不支持 Linux，自启动始终返回 false
        return false
      }
      const settings = app.getLoginItemSettings()
      return !!settings.openAtLogin
    }
    catch (error) {
      logger.error('AutoLaunch', '读取系统登录项失败', error)
      // 读取系统失败时，回退到本地配置（默认为 false）
      try {
        return !!this.storeManager.get(EnumStoreKey.AUTO_LAUNCH)
      }
      catch {
        return false
      }
    }
  }

  /**
   * 设置开机自启动
   * @param enable 是否启用
   * @returns 是否设置成功
   */
  public setEnabled(enable: boolean): boolean {
    console.log("🚀 liu123 ~ enable:", enable)
    try {
      if (isLinux) {
        // 目前不支持 Linux 的一键自启动
        this.storeManager.set(EnumStoreKey.AUTO_LAUNCH, false)
        logger.warn('AutoLaunch', 'Linux 暂不支持开机自启动')
        return false
      }

      app.setLoginItemSettings({
        openAtLogin: enable,
        openAsHidden: true,
        path: app.isPackaged ? undefined : process.execPath,
        args: app.isPackaged ? [] : [path.resolve(process.argv[1] || '.')],
      })

      // 双重确认状态
      const applied = this.isEnabled()
      // 持久化用户选择（即便系统未生效也记录用户意图）
      this.storeManager.set(EnumStoreKey.AUTO_LAUNCH, enable)

      logger.info(
        'AutoLaunch',
        `设置自启动状态: ${enable}，系统状态: ${applied}`,
      );
      return applied
    }
    catch (error) {
      logger.error('AutoLaunch', '设置系统登录项失败', error)
      return false
    }
  }

  public getAutoLaunch(): boolean {
    return this.isEnabled()
  }

  /**
   * 在应用启动时应用已保存的自启动设置
   */
  public applySavedSetting(): void {
    try {
      if (isLinux)
        return
      const saved = !!this.storeManager.get(EnumStoreKey.AUTO_LAUNCH)
      const current = this.isEnabled()
      if (saved !== current) {
        this.setEnabled(saved)
      }
    }
    catch (error) {
      logger.error('AutoLaunch', '应用开机自启动设置时出错', error)
    }
  }
}
