import {BehaviorSubject, Observable} from 'rxjs';
import {merge} from 'lodash-es';
import {ApplicationConfig, defaultConfig, PartialConfig} from '@/common/config';
import {createLogger} from '@/services/LoggerService';

const logger = createLogger('Config');

export class Config {
  private subjects = new Map<keyof ApplicationConfig, BehaviorSubject<any>>();

  constructor(initialConfig: PartialConfig) {
    const config = merge(defaultConfig, initialConfig);
    logger.info('Config', '初始化配置', config);
    Object.keys(config).forEach((key) => {
      this.subjects.set(
        key as keyof ApplicationConfig,
        new BehaviorSubject(config[key as keyof ApplicationConfig])
      );
    });
  }

  /** 获取当前配置值 */
  get<K extends keyof ApplicationConfig>(key: K): ApplicationConfig[K] {
    const subject = this.subjects.get(key);
    if (!subject) {
      throw new Error(`配置项 ${String(key)} 不存在`);
    }
    return subject.value as ApplicationConfig[K];
  }

  /** 设置配置值 */
  set<K extends keyof ApplicationConfig>(key: K, value: ApplicationConfig[K]) {
    const subject = this.subjects.get(key);
    if (!subject) {
      throw new Error(`配置项 ${String(key)} 不存在`);
    }
    subject.next(value);
  }

  /** 监听配置值变化 */
  watch<K extends keyof ApplicationConfig>(
    key: K
  ): Observable<ApplicationConfig[K]> {
    const subject = this.subjects.get(key);
    if (!subject) {
      throw new Error(`配置项 ${String(key)} 不存在`);
    }
    return subject.asObservable();
  }
}
