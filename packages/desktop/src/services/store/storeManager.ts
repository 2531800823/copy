import type { StoreConfig } from './common'
import Store from 'electron-store'
import { injectable } from 'inversify'

@injectable()
class StoreManager<T extends StoreConfig = StoreConfig> {
  private store: Store<T>
  constructor() {
    this.store = new Store()
  }

  /** 获取存储值 */
  get<K extends keyof T>(key: K): T[K] {
    return this.store.get(key)
  }

  /** 设置存储值 */
  set<K extends keyof T>(key: K, value: T[K]): void {
    this.store.set(key, value)
  }

  /** 删除存储项 */
  delete(key: keyof T): void {
    this.store.delete(key)
  }

  /** 检查是否存在 */
  has(key: keyof T): boolean {
    return this.store.has(key)
  }

  /** 清空所有存储 */
  clear(): void {
    this.store.clear()
  }
}

export default StoreManager
