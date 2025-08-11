/**
 * 应用插件接口
 * 提供基础的生命周期钩子，供 `AppManager` 调用
 */
export interface IAppPlugin {
  /** 插件名称（用于日志或诊断） */
  name: string;

  /**
   * 注册阶段调用（在 AppManager 初始化时调用）
   * 适合做事件绑定、IPC 注册、准备工作等
   */
  setup(): void;

  /**
   * Electron app.whenReady() 之后触发
   * 适合依赖 app ready 的能力
   */
  onReady?(): void;

  /**
   * 应用退出前触发
   */
  onBeforeQuit?(): void;
}


