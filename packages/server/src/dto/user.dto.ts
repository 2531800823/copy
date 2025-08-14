/**
 * 用户相关的数据传输对象 (DTO)
 * 注意：这里使用简化的验证，生产环境建议安装 class-validator 包
 */

/**
 * 创建用户的 DTO
 */
export class CreateUserDto {
  /** 用户名 */
  username: string;

  /** 邮箱 */
  email: string;

  /** 密码 */
  password: string;

  /** 头像URL (可选) */
  avatar?: string;
}

/**
 * 更新用户的 DTO
 */
export class UpdateUserDto {
  /** 用户名 (可选) */
  username?: string;

  /** 邮箱 (可选) */
  email?: string;

  /** 头像URL (可选) */
  avatar?: string;
}

/**
 * 查询用户的 DTO
 */
export class QueryUserDto {
  /** 用户名搜索 (可选) */
  username?: string;

  /** 邮箱搜索 (可选) */
  email?: string;

  /** 页码 */
  page?: number = 1;

  /** 每页数量 */
  pageSize?: number = 10;

  /** 排序字段 */
  sortBy?: string = 'createdAt';

  /** 排序方向 */
  sortOrder?: 'asc' | 'desc' = 'desc';
}
