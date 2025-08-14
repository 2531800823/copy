/**
 * API 相关类型定义
 */

/** 通用 API 响应格式 */
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  code?: number;
  timestamp?: string;
}

/** 分页查询参数 */
export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/** 分页响应数据 */
export interface PaginationResponse<T = any> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** 用户相关类型 */
export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserDto {
  username: string;
  email: string;
  password: string;
}

export interface UpdateUserDto {
  username?: string;
  email?: string;
  avatar?: string;
}

/** 错误响应类型 */
export interface ApiError {
  message: string;
  error: string;
  statusCode: number;
  timestamp: string;
  path: string;
}
