import type { MainApplication } from './MainApplication';
import { Container } from 'inversify';
import { containerServices } from '@/services';
import { EnumServiceKey } from '@/services/type';

/**
 * 初始化所有服务，使用字符串键作为标识符绑定服务
 * @param container inversify 的容器实例
 */
export function initRegisterServices(ctx: MainApplication) {
  const container = new Container();
  Object.entries(containerServices).forEach(([key, ServiceClass]) => {
    container.bind(key).to(ServiceClass).inSingletonScope();
  })

  container.bind(EnumServiceKey.MainApplication).toConstantValue(ctx);
  container.bind(EnumServiceKey.Config).toConstantValue(ctx.config);
  console.log('🚀 容器初始化完成');
  initServices(container);
  return container;
}

export function initServices(container: Container) {
  Object.entries(containerServices).forEach(([key]) => {
    container.get(key);
  })
}
