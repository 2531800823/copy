/**
 * API 服务层 - 统一管理后端请求
 */

/** API 基础配置 */
const API_BASE_URL = '/api';

/**
 * HTTP 请求配置类型
 */
interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
}

/**
 * API 响应类型
 */
interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  code?: number;
}

/**
 * 通用请求方法
 */
async function request<T = any>(
  url: string,
  config: RequestConfig = {}
): Promise<ApiResponse<T>> {
  const { method = 'GET', headers = {}, body } = config;

  try {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'include', // 支持 cookies
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('API request failed:', error);
    return {
      success: false,
      data: null as T,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * API 服务对象
 */
export const apiService = {
  /** GET 请求 */
  get: <T = any>(url: string, headers?: Record<string, string>) =>
    request<T>(url, { method: 'GET', headers }),

  /** POST 请求 */
  post: <T = any>(url: string, body?: any, headers?: Record<string, string>) =>
    request<T>(url, { method: 'POST', body, headers }),

  /** PUT 请求 */
  put: <T = any>(url: string, body?: any, headers?: Record<string, string>) =>
    request<T>(url, { method: 'PUT', body, headers }),

  /** DELETE 请求 */
  delete: <T = any>(url: string, headers?: Record<string, string>) =>
    request<T>(url, { method: 'DELETE', headers }),

  /** PATCH 请求 */
  patch: <T = any>(url: string, body?: any, headers?: Record<string, string>) =>
    request<T>(url, { method: 'PATCH', body, headers }),
};

/**
 * 具体业务 API
 */
export const api = {
  /** 获取健康检查 */
  getHealth: () => apiService.get('/'),
  
  /** 用户相关接口 */
  user: {
    /** 获取用户列表（支持分页和搜索） */
    getList: (params?: {
      page?: number;
      pageSize?: number;
      username?: string;
      email?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    }) => {
      const queryString = params ? new URLSearchParams(
        Object.entries(params).reduce((acc, [key, value]) => {
          if (value !== undefined && value !== null) {
            acc[key] = String(value);
          }
          return acc;
        }, {} as Record<string, string>)
      ).toString() : '';
      
      return apiService.get(`/users${queryString ? `?${queryString}` : ''}`);
    },
    
    /** 根据ID获取用户信息 */
    getById: (id: string) => apiService.get(`/users/${id}`),
    
    /** 创建用户 */
    create: (userData: {
      username: string;
      email: string;
      password: string;
      avatar?: string;
    }) => apiService.post('/users', userData),
    
    /** 更新用户信息 */
    update: (id: string, userData: {
      username?: string;
      email?: string;
      avatar?: string;
    }) => apiService.patch(`/users/${id}`, userData),
    
    /** 删除用户 */
    delete: (id: string) => apiService.delete(`/users/${id}`),
    
    /** 批量删除用户 */
    batchDelete: (ids: string[]) => 
      request('/users/batch', { method: 'DELETE', body: { ids } }),
  },
};
