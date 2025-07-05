# 常用语管理工具

这是一个基于React和TypeScript开发的常用语管理工具，用于快速存储、搜索和使用常用语句和代码片段。

## 功能特性

- 分类管理：支持按不同分类管理常用语
- 拖拽排序：拖拽调整常用语显示顺序
- 快速搜索：模糊搜索快速找到需要的内容
- 一键复制：点击即可复制内容到剪贴板
- 标签系统：支持给常用语添加标签，方便分类和筛选
- 响应式设计：适配不同屏幕大小

## 技术栈

- React 19
- TypeScript
- Zustand (状态管理)
- Less (样式)
- DND Kit (拖拽功能)
- Fuse.js (模糊搜索)

## 开发

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

## 项目结构

```
src/
  ├── assets/        # 静态资源
  ├── components/    # 组件
  │   ├── AddCardDialog/  # 添加卡片对话框
  │   ├── Card/      # 卡片组件
  │   ├── CardList/  # 卡片列表组件
  │   ├── CategoryTabs/ # 分类标签组件
  │   └── SearchBar/ # 搜索组件
  ├── pages/         # 页面
  ├── store/         # 状态管理
  ├── styles/        # 全局样式
  ├── types/         # 类型定义
  ├── utils/         # 工具函数
  ├── App.tsx        # 应用组件
  └── main.tsx       # 入口文件
```
