# 🚀 接口Demo启动指南

我已经为您创建了一个完整的前后端接口通信示例，包含用户管理的完整CRUD功能。

## 📋 已创建的文件

### 后端文件 (NestJS)
```
packages/server/src/
├── dto/user.dto.ts              # 用户数据传输对象
├── entities/user.entity.ts      # 用户实体类型定义
├── services/user.service.ts     # 用户业务逻辑服务
├── controllers/user.controller.ts # 用户控制器
└── app.module.ts               # 更新：注册新的服务和控制器
```

### 前端文件 (React)
```
packages/web/src/
├── services/api.ts             # 更新：添加用户相关API调用
├── components/UserManagement/  # 用户管理组件
│   ├── UserManagement.tsx     # 主组件
│   ├── UserManagement.module.less # 样式文件
│   └── index.ts              # 导出文件
└── examples/ApiDemo.md        # 详细使用文档
```

## 🎯 功能特性

### ✅ 后端功能
- **RESTful API设计** - 标准的REST接口
- **用户CRUD操作** - 创建、读取、更新、删除用户
- **分页查询** - 支持分页和搜索
- **批量操作** - 支持批量删除
- **统一响应格式** - 标准化的API响应
- **错误处理** - 完善的错误处理机制

### ✅ 前端功能
- **用户列表展示** - 表格形式展示用户信息
- **分页功能** - 前后翻页，显示总页数
- **搜索筛选** - 按用户名和邮箱搜索
- **创建用户** - 模态框形式创建新用户
- **编辑用户** - 模态框形式编辑用户信息
- **删除用户** - 单个删除和批量删除
- **响应式设计** - 适配移动端和桌面端

## 🚀 如何运行

### 1. 启动开发环境
```bash
# 在项目根目录执行
npm run dev
```

这个命令会同时启动：
- **后端服务** (NestJS): http://localhost:3000
- **前端服务** (React): http://localhost:5173

### 2. 在前端页面中使用组件
在您的React页面中导入并使用用户管理组件：

```tsx
import UserManagement from '@/components/UserManagement';

function App() {
  return (
    <div>
      <h1>我的应用</h1>
      <UserManagement />
    </div>
  );
}
```

## 📡 API接口列表

### 用户管理接口
| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/users` | 获取用户列表 (支持分页和搜索) |
| GET | `/users/:id` | 获取单个用户信息 |
| POST | `/users` | 创建新用户 |
| PATCH | `/users/:id` | 更新用户信息 |
| DELETE | `/users/:id` | 删除用户 |
| DELETE | `/users/batch` | 批量删除用户 |

### 使用示例
```typescript
import { api } from '@/services/api';

// 获取用户列表
const response = await api.user.getList({
  page: 1,
  pageSize: 10,
  username: 'admin'
});

// 创建用户
await api.user.create({
  username: 'newuser',
  email: 'newuser@example.com',
  password: '123456'
});
```

## 🎨 界面展示

用户管理界面包含：
- **顶部工具栏** - 搜索框和操作按钮
- **用户列表表格** - 显示用户信息，支持选择
- **分页组件** - 页码导航
- **创建/编辑模态框** - 表单输入界面

## 🔧 技术细节

### 后端架构
- **Controller层** - 处理HTTP请求
- **Service层** - 业务逻辑处理
- **DTO层** - 数据传输对象验证
- **Entity层** - 数据模型定义

### 前端架构
- **组件化设计** - 可复用的用户管理组件
- **状态管理** - React Hooks管理组件状态
- **类型安全** - TypeScript确保类型安全
- **样式模块化** - Less模块化样式

## 🛠 扩展建议

1. **数据库集成** - 将内存存储替换为真实数据库
2. **身份验证** - 添加JWT认证机制
3. **文件上传** - 支持头像上传功能
4. **数据缓存** - 添加Redis缓存
5. **API文档** - 集成Swagger文档

## 📚 详细文档

更多详细信息请查看：`packages/web/src/examples/ApiDemo.md`

## 🎉 开始使用

现在您可以：
1. 运行 `npm run dev` 启动项目
2. 在浏览器中访问前端页面
3. 试用用户管理功能
4. 基于这个示例开发您自己的功能

祝您开发愉快！🚀
