import type { Container } from 'inversify'
import { containerServices } from '@/services'

/**
 * 初始化所有服务，使用字符串键作为标识符绑定服务
 * @param container inversify 的容器实例
 */
export function initServices(container: Container) {
  // 使用 Object.entries 获取键值对，键作为绑定标识符
  Object.entries(containerServices).forEach(([key, ServiceClass]) => {
    console.log('🚀 绑定服务 - 键:', key, '类:', ServiceClass);
    // 关键修复：使用字符串键作为标识符，而不是类本身
    container.bind(key).to(ServiceClass).inSingletonScope();
  })
  console.log('🚀 容器初始化完成');
}
