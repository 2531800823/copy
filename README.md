# CopyApp

一个基于Electron的现代桌面应用程序，提供便捷的复制粘贴功能。

新功能

1. 顶部菜单栏自己做一个，
2. 可以把 tag 切换为菜单，更改横向还是纵向

## 功能特点

- 跨平台支持：Windows, macOS, Linux
- 便捷的复制粘贴管理
- 现代化的用户界面
- 支持快捷键操作

## 下载安装

### Windows 用户

1. 前往 [Releases](https://github.com/2531800823/copy/releases) 页面
2. 下载最新的 `CopyApp-Windows-x.x.x.exe` 安装文件
3. 运行安装程序，按照提示完成安装
4. 从开始菜单或桌面快捷方式启动应用

### macOS 用户

1. 前往 [Releases](https://github.com/2531800823/copy/releases) 页面
2. 下载最新的 `CopyApp-Mac-x.x.x.dmg` 安装文件（同时支持 Intel 和 Apple Silicon）
3. 打开 DMG 文件，将应用拖到 Applications 文件夹
4. 从应用程序列表中启动 CopyApp

### Linux 用户

1. 前往 [Releases](https://github.com/2531800823/copy/releases) 页面
2. 下载最新的 `CopyApp-Linux-x.x.x.AppImage` 文件
3. 添加执行权限：`chmod +x CopyApp-Linux-x.x.x.AppImage`
4. 运行应用：`./CopyApp-Linux-x.x.x.AppImage`

## 开发指南

本项目使用 pnpm 作为包管理器，采用 monorepo 结构组织代码。

### 项目结构

```
/packages
  /desktop - Electron 桌面应用
  /web     - Web 前端界面
  /server  - 后端服务（如果有）
```

### 本地开发

```bash
# 安装依赖
pnpm install

# 启动所有服务
pnpm start

# 或者单独启动某个服务
pnpm dev:web     # 启动前端服务
pnpm dev:desktop # 启动桌面应用
pnpm dev:server  # 启动后端服务（如果有）
```

### 构建应用

```bash
# 根据当前系统构建 Web 和桌面应用
pnpm build

# 分平台构建桌面安装包
pnpm build:desktop:win
pnpm build:desktop:mac
```

### GitHub 自动发布

推送 `v*` 版本标签后，GitHub Actions 会分别构建 Windows x64 和 macOS Universal 安装包；两个平台都成功后才会创建 GitHub Release：

```bash
git tag v0.1.2
git push origin v0.1.2
```

也可以在 GitHub 的 Actions 页面手动运行 `Build and Release`，并输入 `v1.2.3` 格式的版本号。

未配置 Apple 凭据时，CI 仍会生成未签名的 macOS 测试包，但 Gatekeeper 会限制普通用户直接打开，自动更新也不能作为正式发布能力使用。正式发布需要在仓库的 `Settings > Secrets and variables > Actions` 中配置：

- `MAC_CSC_LINK`：Developer ID Application 证书的 `.p12` Base64 内容
- `MAC_CSC_KEY_PASSWORD`：导出 `.p12` 时设置的密码
- `APPLE_ID`：Apple Developer 账号
- `APPLE_APP_SPECIFIC_PASSWORD`：Apple ID 的 App 专用密码
- `APPLE_TEAM_ID`：Apple Developer Team ID

凭据完整时，`electron-builder` 会在 macOS 构建中自动完成签名、公证和票据装订。

## 许可证

[MIT](LICENSE)

## 贡献指南

欢迎提交问题和贡献代码，请参阅 [CONTRIBUTING.md](CONTRIBUTING.md) 了解更多信息。
