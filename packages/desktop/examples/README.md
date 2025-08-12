# RxJS 应用事件系统使用示例

这个目录包含了重构后的 RxJS 应用事件系统的使用示例。

## 📁 文件说明

### `simple-app-events-demo.js`
- **类型**: JavaScript 可执行示例
- **功能**: 演示如何使用 RxJS 应用事件系统
- **特点**:
  - 可以直接运行，无需依赖其他模块
  - 使用模拟对象展示完整的事件流程
  - 包含详细的中文注释和说明

### `rxjs-app-events-demo.ts`
- **类型**: TypeScript 完整示例
- **功能**: 完整的应用事件处理器实现
- **特点**:
  - 包含完整的类型定义
  - 演示了实际项目中的用法
  - 展示了高级 RxJS 操作符的使用

## 🚀 运行示例

### 运行 JavaScript 示例

```bash
# 在项目根目录执行
node packages/desktop/examples/simple-app-events-demo.js
```

### 预期输出

运行后你会看到类似下面的输出：

```
🚀 启动 RxJS 应用事件系统演示...
🎯 开始演示应用事件系统

📌 1. 基础事件监听示例：
  🎧 订阅应用准备就绪事件...
  🎧 订阅应用退出前事件...
  🎧 订阅所有窗口关闭事件...
  🎧 订阅应用激活事件...
  ✅ 应用准备就绪
  💡 处理应用启动逻辑：创建主窗口、初始化功能等
  📡 传统方式触发: app:ready
  📞 传统方式处理应用准备就绪
  ...
```

## 💡 关键概念

### 1. 应用级别事件
- `appReady$` - 应用准备就绪
- `appBeforeQuit$` - 应用退出前
- `appWindowAllClosed$` - 所有窗口关闭
- `appActivate$` - 应用激活（macOS）
- `appWillQuit$` - 应用将要退出
- `appQuit$` - 应用已退出

### 2. 窗口事件处理
窗口事件不在应用事件管理器中处理，而是直接在窗口实例上监听：

```javascript
// ✅ 正确的窗口事件处理方式
mainWindow.on('closed', () => {
  console.log('窗口关闭');
})

mainWindow.webContents.on('did-finish-load', () => {
  console.log('页面加载完成');
})
```

### 3. RxJS 操作符
支持所有 RxJS 操作符，如：
- `filter()` - 过滤事件
- `debounceTime()` - 防抖
- `map()` - 转换数据
- `merge()` - 合并流
- `takeUntil()` - 生命周期管理

### 4. 订阅管理
记得在组件销毁时取消订阅，避免内存泄漏：

```javascript
// 保存订阅引用
const subscription = appEventManager.appReady$.subscribe(() => {
  // 处理事件
});

// 在组件销毁时取消订阅
subscription.unsubscribe();
```

## 🌟 实际使用方式

在真实项目中，你会这样使用：

```javascript
// 获取应用实例
const app = new MainApplication(config);

// 获取应用事件管理器
const appEventManager = app.getAppEventManager();

// 监听应用事件
appEventManager.appReady$.subscribe(() => {
  console.log('应用准备就绪，开始初始化...');
})

// 使用 RxJS 操作符
appEventManager.allAppEvents$.pipe(
  filter(event => event.type === 'app:ready'),
  debounceTime(100)
).subscribe((event) => {
  console.log('处理应用准备就绪事件');
})
```

## 📝 注意事项

1. **职责分离**: 应用事件和窗口事件分别处理
2. **内存管理**: 及时取消订阅避免内存泄漏
3. **平台兼容**: 注意 macOS 和其他平台的差异
4. **错误处理**: 为事件订阅添加错误处理
5. **性能优化**: 适当使用防抖和过滤

## 🔗 相关文档

- [RxJS 应用事件系统使用指南](../RXJS_EVENT_USAGE.md)
- [架构设计文档](../ARCHITECTURE.md)
- [重构总结](../REFACTORING-SUMMARY.md)
