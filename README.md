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
2. 下载最新的 `CopyApp-Windows-x.x.x-Setup.exe` 安装文件
3. 运行安装程序，按照提示完成安装
4. 从开始菜单或桌面快捷方式启动应用

### macOS 用户

1. 前往 [Releases](https://github.com/2531800823/copy/releases) 页面
2. 下载最新的 `CopyApp-Mac-x.x.x-Installer.dmg` 安装文件
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
# 构建所有服务
pnpm build

# 或者单独构建桌面应用
pnpm build:desktop
```

## 许可证

[MIT](LICENSE)

## 贡献指南

欢迎提交问题和贡献代码，请参阅 [CONTRIBUTING.md](CONTRIBUTING.md) 了解更多信息。
