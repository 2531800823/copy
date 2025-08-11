import {BehaviorSubject, Observable} from 'rxjs';

type ConfigSchema = {
  [key: string]: any;
};

export class Config<T extends ConfigSchema> {
  private subjects = new Map<keyof T, BehaviorSubject<any>>();

  constructor(initialConfig: T) {
    Object.keys(initialConfig).forEach((key) => {
      this.subjects.set(
        key as keyof T,
        new BehaviorSubject(initialConfig[key as keyof T])
      );
    });
  }

  /** 获取当前配置值 */
  get<K extends keyof T>(key: K): T[K] {
    const subject = this.subjects.get(key);
    if (!subject) {
      throw new Error(`配置项 ${String(key)} 不存在`);
    }
    return subject.value as T[K];
  }

  /** 设置配置值 */
  set<K extends keyof T>(key: K, value: T[K]) {
    const subject = this.subjects.get(key);
    if (!subject) {
      throw new Error(`配置项 ${String(key)} 不存在`);
    }
    subject.next(value);
  }

  /** 监听配置值变化 */
  watch<K extends keyof T>(key: K): Observable<T[K]> {
    const subject = this.subjects.get(key);
    if (!subject) {
      throw new Error(`配置项 ${String(key)} 不存在`);
    }
    return subject.asObservable();
  }
}
