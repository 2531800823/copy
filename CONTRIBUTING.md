# 贡献指南

感谢您对 CopyApp 项目的关注！我们欢迎各种形式的贡献，无论是报告 Bug、提出新功能建议，还是提交代码。

## 如何贡献

### 报告 Bug

如果您发现了 Bug，请通过 GitHub Issues 报告，并尽可能详细地描述问题及复现步骤。

1. 检查 [Issues](https://github.com/yourusername/copy/issues) 列表，确保问题尚未被报告
2. 使用 Bug 报告模板创建新的 Issue
3. 提供详细的复现步骤、期望行为和实际行为
4. 如果可能，附上错误截图或日志

### 功能建议

如果您有新的功能建议，欢迎通过 GitHub Issues 提出：

1. 使用功能请求模板创建新的 Issue
2. 清晰描述您期望的功能及其解决的问题
3. 如果可能，提供功能的设计草图或实现思路

### 提交代码

我们欢迎通过 Pull Request 提交代码：

1. Fork 本仓库
2. 创建您的特性分支：`git checkout -b feature/amazing-feature`
3. 提交您的更改：`git commit -m 'Add some amazing feature'`
4. 推送到分支：`git push origin feature/amazing-feature`
5. 提交 Pull Request

## 开发指南

### 环境设置

```bash
# 克隆仓库
git clone https://github.com/yourusername/copy.git
cd copy

# 安装依赖
pnpm install

# 启动开发服务
pnpm start
```

### 代码规范

- 遵循项目既有的代码风格
- 确保代码通过 ESLint 检查
- 为新功能添加测试（如果适用）
- 保持提交信息清晰明了

### 分支策略

- `main`: 主分支，保持稳定
- `develop`: 开发分支，新功能合并到此分支
- `feature/*`: 特性分支，用于开发新功能
- `fix/*`: 修复分支，用于修复 Bug

## 发布流程

项目使用以下版本管理策略：

- 主版本号：不兼容的 API 变更
- 次版本号：向后兼容的功能新增
- 修订版本号：向后兼容的问题修正

感谢您的贡献！ 