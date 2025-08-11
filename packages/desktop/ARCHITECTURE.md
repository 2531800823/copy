# Electron 应用 OOP 架构说明

## 架构概述

本项目使用面向对象编程（OOP）的方式重构了 Electron 主进程，采用高内聚低耦合的设计原则，提供了可扩展、易维护的架构。

## 设计原则

- **单一职责原则**：每个类只负责一个特定的功能领域
- **开闭原则**：对扩展开放，对修改关闭
- **依赖倒置原则**：依赖抽象而不是具体实现
- **接口隔离原则**：使用最小化的接口
- **高内聚低耦合**：类内部紧密相关，类之间松散耦合

## 核心架构

### 1. 主应用类（MainApplication）

`MainApplication` 是整个应用的入口点和协调者，负责：

- 整合所有管理器
- 管理应用的初始化和启动流程
- 提供统一的配置管理
- 协调各个组件之间的交互

```typescript
const app = new MainApplication(config);
await app.start();
```

### 2. 核心管理器

#### ApplicationLifecycle（应用生命周期管理器）
- 管理 Electron 应用的生命周期事件
- 提供回调机制处理应用启动、退出等事件
- 支持插件式的生命周期钩子

#### WindowStateManager（窗口状态管理器）
- 管理窗口的位置、大小状态的持久化
- 自动保存和恢复窗口状态
- 支持最大化状态记忆

#### ProtocolManager（协议管理器）
- 管理自定义协议的注册和处理
- 处理 app:// 协议以加载本地资源
- 提供协议安全配置

#### EventManager（事件管理器）
- 提供发布-订阅模式的事件系统
- 管理窗口相关事件（键盘、加载、崩溃等）
- 支持一次性事件和持续事件

### 3. 服务层

#### TrayService（系统托盘服务）
- 管理系统托盘图标和菜单
- 提供托盘交互功能

#### LoggerService（日志服务）
- 统一的日志记录服务
- 支持不同级别的日志输出

#### StoreManager（存储管理）
- 管理应用配置的持久化存储
- 提供类型安全的配置读写

### 4. 窗口层

#### BaseWindow（基础窗口类）
- 抽象窗口基类
- 定义窗口的基本属性和行为

#### MainWindow（主窗口类）
- 继承自 BaseWindow
- 实现主窗口的具体逻辑

## 使用示例

### 基本使用

```typescript
import { MainApplication, ApplicationConfig } from './core/MainApplication';

// 配置应用
const config: ApplicationConfig = {
  window: {
    width: 1200,
    height: 800,
    autoHideMenuBar: true,
  },
  development: {
    webUrl: 'http://localhost:3000',
    openDevTools: true,
  },
  production: {
    appUrl: 'app://./index.html#/',
  },
};

// 启动应用
async function startApp() {
  const app = new MainApplication(config);
  await app.start();
}

startApp();
```

### 事件管理

```typescript
const eventManager = app.getEventManager();

// 监听窗口事件
eventManager.on('window:did-finish-load', ({ window }) => {
  console.log('窗口加载完成');
});

// 发布自定义事件
eventManager.emit('custom:event', { data: 'Hello World' });
```

### 窗口状态管理

```typescript
const stateManager = app.getWindowStateManager();

// 手动保存状态
stateManager.saveCurrentState();

// 重置为默认状态
stateManager.resetToDefault();

// 获取当前状态
const state = stateManager.getCurrentState();
```

## 扩展性

### 添加新的管理器

1. 创建新的管理器类：

```typescript
export class PluginManager {
  private plugins: Plugin[] = [];
  
  public registerPlugin(plugin: Plugin): void {
    this.plugins.push(plugin);
    plugin.initialize();
  }
}
```

2. 在 MainApplication 中集成：

```typescript
export class MainApplication {
  private pluginManager = new PluginManager();
  
  constructor(config: ApplicationConfig) {
    // 在构造函数中初始化新管理器
  }
}
```

### 添加新的窗口类型

```typescript
export class SettingsWindow extends BaseWindow {
  protected width = 600;
  protected height = 400;
  protected htmlFile = 'settings.html';
  
  // 实现设置窗口特定的逻辑
}
```

## 优势

1. **可维护性**：清晰的职责分离使代码更容易理解和维护
2. **可测试性**：每个管理器都可以独立测试
3. **可扩展性**：新功能可以通过添加新的管理器来实现
4. **可复用性**：管理器可以在不同的项目中复用
5. **类型安全**：TypeScript 提供完整的类型检查

## 迁移指南

### 从旧架构迁移

原有的过程式代码：
```typescript
// 旧代码
function createWindow() {
  // 大量的窗口创建逻辑
}

app.whenReady().then(() => {
  setupProtocol();
  createWindow();
  updateAutoLaunchState();
});
```

新的 OOP 架构：
```typescript
// 新代码
const app = new MainApplication(config);
await app.start();
```

所有的复杂逻辑都被封装在相应的管理器中，使主入口文件变得非常简洁。

## 最佳实践

1. **配置管理**：使用配置对象来初始化应用，避免硬编码
2. **错误处理**：在每个管理器中适当处理错误
3. **日志记录**：使用统一的日志服务记录重要操作
4. **事件通信**：使用事件管理器而不是直接调用来实现组件间通信
5. **状态管理**：使用专门的状态管理器来处理持久化需求

## 总结

这个 OOP 架构提供了一个强大、灵活且易于维护的 Electron 应用基础。通过合理的抽象和封装，它不仅提高了代码质量，还为未来的功能扩展提供了良好的基础。
