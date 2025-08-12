/**
 * RxJS 应用事件系统简单使用示例
 *
 * 这个示例展示了如何使用重构后的应用事件管理器
 * 注意：这是一个演示文件，实际使用时需要根据你的项目结构调整导入路径
 */

/**
 * 注意：这个示例中我们直接在演示函数中模拟事件管理器
 * 实际使用时，你会从 MainApplication 中获取真正的 ElectronNativeEventManager
 */

/**
 * 完整的应用事件处理示例
 */
function demonstrateAppEvents() {
  console.log('🎯 开始演示应用事件系统')

  // 1. 基础事件监听
  console.log('\n📌 1. 基础事件监听示例：')

  // 模拟获取应用事件管理器
  const appEventManager = {
    // 模拟应用准备就绪事件流
    appReady$: {
      subscribe: (callback) => {
        setTimeout(() => {
          console.log('  ✅ 应用准备就绪')
          callback()
        }, 500)
        return { unsubscribe: () => console.log('  🔌 已取消订阅 appReady$') }
      },
    },

    // 模拟应用退出前事件流
    appBeforeQuit$: {
      subscribe: (callback) => {
        setTimeout(() => {
          console.log('  🛑 应用即将退出')
          callback()
        }, 5000)
        return { unsubscribe: () => console.log('  🔌 已取消订阅 appBeforeQuit$') }
      },
    },

    // 模拟所有窗口关闭事件流
    appWindowAllClosed$: {
      subscribe: (callback) => {
        setTimeout(() => {
          console.log('  🪟 所有窗口已关闭')
          callback()
        }, 3000)
        return { unsubscribe: () => console.log('  🔌 已取消订阅 appWindowAllClosed$') }
      },
    },

    // 模拟应用激活事件流
    appActivate$: {
      subscribe: (callback) => {
        setTimeout(() => {
          console.log('  🔆 应用被激活 (macOS)')
          callback()
        }, 2000)
        return { unsubscribe: () => console.log('  🔌 已取消订阅 appActivate$') }
      },
    },

    // 模拟合并的所有应用事件流
    allAppEvents$: {
      subscribe: (callback) => {
        const events = [
          { type: 'app:ready', timestamp: Date.now() + 500 },
          { type: 'app:activate', timestamp: Date.now() + 2000 },
          { type: 'app:window-all-closed', timestamp: Date.now() + 3000 },
          { type: 'app:before-quit', timestamp: Date.now() + 5000 },
        ];

        events.forEach((event) => {
          setTimeout(() => {
            console.log(`  📊 所有事件流: ${event.type}`)
            callback(event)
          }, event.timestamp - Date.now())
        });

        return { unsubscribe: () => console.log('  🔌 已取消订阅 allAppEvents$') }
      },
    },

    // 模拟过滤事件流方法
    getFilteredEventStream: (...eventTypes) => ({
      subscribe: (callback) => {
        console.log(`  🔍 过滤事件类型: ${eventTypes.join(', ')}`)
        const filteredEvents = [
          { type: 'app:ready', timestamp: Date.now() + 500 },
          { type: 'app:before-quit', timestamp: Date.now() + 5000 },
        ].filter(event => eventTypes.includes(event.type))

        filteredEvents.forEach((event) => {
          setTimeout(() => {
            console.log(`  ⭐ 重要事件: ${event.type}`)
            callback(event)
          }, event.timestamp - Date.now())
        });

        return { unsubscribe: () => console.log('  🔌 已取消订阅过滤事件流') }
      },
    }),

    // 模拟防抖事件流方法
    getDebouncedAppEvents$: debounceMs => ({
      subscribe: (callback) => {
        console.log(`  ⏱️  防抖时间: ${debounceMs}ms`)
        setTimeout(() => {
          console.log('  🔄 防抖事件触发')
          callback({ type: 'app:ready', timestamp: Date.now() })
        }, 1000)
        return { unsubscribe: () => console.log('  🔌 已取消订阅防抖事件流') }
      },
    }),

    // 模拟传统的 on 方法（向后兼容）
    on: (eventName, handler) => {
      console.log(`  📡 传统方式监听: ${eventName}`)
      setTimeout(() => {
        console.log(`  📡 传统方式触发: ${eventName}`)
        handler()
      }, 1500)
      return { unsubscribe: () => console.log(`  🔌 已取消传统订阅: ${eventName}`) }
    },

    // 模拟一次性的 once 方法
    once: (eventName, handler) => {
      console.log(`  🎯 一次性监听: ${eventName}`)
      setTimeout(() => {
        console.log(`  🎯 一次性触发: ${eventName}`)
        handler()
      }, 2500)
      return { unsubscribe: () => console.log(`  🔌 已取消一次性订阅: ${eventName}`) }
    },
  };

  // 存储订阅，便于清理
  const subscriptions = []

  // 1. 基础应用事件监听
  console.log('  🎧 订阅应用准备就绪事件...')
  const readySub = appEventManager.appReady$.subscribe(() => {
    console.log('  💡 处理应用启动逻辑：创建主窗口、初始化功能等')
  });
  subscriptions.push(readySub)

  console.log('  🎧 订阅应用退出前事件...')
  const beforeQuitSub = appEventManager.appBeforeQuit$.subscribe(() => {
    console.log('  💾 处理应用退出逻辑：保存数据、清理资源等')
  });
  subscriptions.push(beforeQuitSub)

  console.log('  🎧 订阅所有窗口关闭事件...')
  const allClosedSub = appEventManager.appWindowAllClosed$.subscribe(() => {
    if (process.platform !== 'darwin') {
      console.log('  🖥️  非 macOS 平台：准备退出应用')
    }
    else {
      console.log('  🍎 macOS 平台：保持应用运行，等待重新激活')
    }
  })
  subscriptions.push(allClosedSub)

  console.log('  🎧 订阅应用激活事件...')
  const activateSub = appEventManager.appActivate$.subscribe(() => {
    console.log('  🔄 处理应用激活逻辑：检查并创建窗口')
  });
  subscriptions.push(activateSub)

  // 2. 高级 RxJS 操作符使用示例
  setTimeout(() => {
    console.log('\n📌 2. 高级 RxJS 操作符示例：')

    // 防抖事件流
    console.log('  🎧 订阅防抖应用事件流...')
    const debouncedSub = appEventManager.getDebouncedAppEvents$(300).subscribe((event) => {
      console.log(`  ⚡ 防抖处理: ${event.type}`)
    });
    subscriptions.push(debouncedSub)

    // 过滤特定事件
    console.log('  🎧 订阅过滤的重要事件流...')
    const filteredSub = appEventManager.getFilteredEventStream(
      'app:ready',
      'app:before-quit',
    ).subscribe((event) => {
      console.log(`  🎯 重要事件处理: ${event.type}`)
    });
    subscriptions.push(filteredSub)

    // 监听所有应用事件
    console.log('  🎧 订阅所有应用事件流...')
    const allEventsSub = appEventManager.allAppEvents$.subscribe((event) => {
      console.log(`  📈 事件统计: ${event.type} at ${new Date(event.timestamp).toLocaleTimeString()}`)
    });
    subscriptions.push(allEventsSub)
  }, 100)

  // 3. 向后兼容的传统方式
  setTimeout(() => {
    console.log('\n📌 3. 向后兼容的传统事件监听：')

    // 传统方式监听
    console.log('  🎧 使用传统 on 方法...')
    const traditionalSub = appEventManager.on('app:ready', () => {
      console.log('  📞 传统方式处理应用准备就绪')
    });
    subscriptions.push(traditionalSub)

    // 一次性监听
    console.log('  🎧 使用 once 方法...')
    const onceSub = appEventManager.once('app:activate', () => {
      console.log('  🎯 一次性处理应用激活')
    });
    subscriptions.push(onceSub)
  }, 200)

  // 4. 实际应用场景示例
  setTimeout(() => {
    console.log('\n📌 4. 实际应用场景示例：')

    // 应用初始化流程
    console.log('  🎧 设置应用初始化流程...')
    appEventManager.appReady$.subscribe(() => {
      console.log('  🔧 应用初始化：')
      console.log('    - 创建主窗口')
      console.log('    - 设置应用菜单')
      console.log('    - 注册全局快捷键')
      console.log('    - 初始化服务')
    });

    // 应用退出流程
    appEventManager.appBeforeQuit$.subscribe(() => {
      console.log('  🧹 应用清理：')
      console.log('    - 保存用户数据')
      console.log('    - 关闭数据库连接')
      console.log('    - 清理临时文件')
      console.log('    - 取消所有订阅')
    });

    // macOS 特有的应用激活处理
    if (process.platform === 'darwin') {
      appEventManager.appActivate$.subscribe(() => {
        console.log('  🍎 macOS 应用激活：')
        console.log('    - 检查是否有可见窗口')
        console.log('    - 如果没有窗口，创建新窗口')
        console.log('    - 将应用窗口置于前台')
      });
    }
  }, 300)

  // 5. 窗口事件的正确处理方式
  setTimeout(() => {
    console.log('\n📌 5. 窗口事件处理示例（直接在窗口上监听）：')

    // 模拟创建窗口并监听窗口事件
    console.log('  🪟 创建主窗口并设置事件监听...')

    const mockWindow = {
      on: (eventName, handler) => {
        console.log(`    🎧 窗口监听: ${eventName}`)
        // 模拟窗口事件
        setTimeout(() => {
          console.log(`    🪟 窗口事件触发: ${eventName}`)
          handler()
        }, Math.random() * 2000)
      },

      webContents: {
        on: (eventName, handler) => {
          console.log(`    🎧 页面监听: ${eventName}`)
          setTimeout(() => {
            console.log(`    📄 页面事件触发: ${eventName}`)
            handler()
          }, Math.random() * 1500)
        },
      },
    };

    // 直接在窗口上监听事件（推荐方式）
    mockWindow.on('closed', () => {
      console.log('    ✨ 处理窗口关闭：清理窗口引用')
    });

    mockWindow.on('focus', () => {
      console.log('    ✨ 处理窗口获得焦点：更新UI状态')
    });

    mockWindow.on('blur', () => {
      console.log('    ✨ 处理窗口失去焦点：暂停某些操作')
    });

    mockWindow.webContents.on('did-finish-load', () => {
      console.log('    ✨ 处理页面加载完成：显示窗口、隐藏加载动画')
    });

    mockWindow.webContents.on('did-fail-load', () => {
      console.log('    ✨ 处理页面加载失败：显示错误页面')
    });
  }, 400)

  // 6. 清理示例
  setTimeout(() => {
    console.log('\n📌 6. 资源清理示例：')
    console.log('  🧹 开始清理所有事件订阅...')

    subscriptions.forEach((sub, index) => {
      setTimeout(() => {
        if (sub && sub.unsubscribe) {
          sub.unsubscribe()
        }
      }, index * 100)
    });

    setTimeout(() => {
      console.log('  ✅ 所有订阅已清理完成')
      console.log('\n🎉 应用事件系统演示完成！')
      console.log('\n💡 关键要点总结：')
      console.log('   1. 应用级别事件由 ElectronNativeEventManager 统一管理')
      console.log('   2. 窗口事件直接在具体窗口实例上监听')
      console.log('   3. 使用 RxJS 流可以轻松组合、过滤和变换事件')
      console.log('   4. 记得在组件销毁时取消订阅，避免内存泄漏')
      console.log('   5. 向后兼容传统的 on/once 方法')
    }, subscriptions.length * 100 + 500)
  }, 7000)
}

// 启动演示
console.log('🚀 启动 RxJS 应用事件系统演示...')
demonstrateAppEvents()

// 导出演示函数供其他地方使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { demonstrateAppEvents }
}
