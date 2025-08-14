/**
 * 用户实体类型定义
 */

export interface User {
  /** 用户ID */
  id: string;
  /** 用户名 */
  username: string;
  /** 邮箱 */
  email: string;
  /** 头像URL */
  avatar?: string;
  /** 创建时间 */
  createdAt: string;
  /** 更新时间 */
  updatedAt: string;
}

/**
 * 分页响应数据结构
 */
export interface PaginationResponse<T = any> {
  /** 数据列表 */
  items: T[];
  /** 总数据量 */
  total: number;
  /** 当前页码 */
  page: number;
  /** 每页数据量 */
  pageSize: number;
  /** 总页数 */
  totalPages: number;
}

/**
 * 标准API响应格式
 */
export interface ApiResponse<T = any> {
  /** 请求是否成功 */
  success: boolean;
  /** 响应数据 */
  data: T;
  /** 响应消息 */
  message?: string;
  /** 响应状态码 */
  code?: number;
  /** 时间戳 */
  timestamp?: string;
}
