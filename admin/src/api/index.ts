import axios from 'axios'
import type { ApiResponse, Stock, Portfolio, Valuation, ServiceInfo, User } from '@/types'

const api = axios.create({
  baseURL: '/api',
  timeout: 60000,  // 增加超时时间，因为服务启动可能需要较长时间
})

// 错误处理拦截器
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API Error:', error)
    return Promise.reject(error)
  }
)

// ==================== 股票管理 ====================

// 获取所有股票
export const getStocks = (): Promise<ApiResponse<Stock[]>> => {
  return api.get('/stocks?market=all')
}

// 搜索股票
export const searchStocks = (keyword: string): Promise<ApiResponse<Stock[]>> => {
  return api.get(`/search?keyword=${encodeURIComponent(keyword)}`)
}

// 添加股票
export const addStock = (stock: Omit<Stock, 'change'>): Promise<ApiResponse<Stock>> => {
  return api.post('/stocks', stock)
}

// 更新股票
export const updateStock = (code: string, data: Partial<Stock>): Promise<ApiResponse<Stock>> => {
  return api.put(`/stocks/${code}`, data)
}

// 删除股票
export const deleteStock = (code: string): Promise<ApiResponse<void>> => {
  return api.delete(`/stocks/${code}`)
}

// ==================== 持仓管理 ====================

// 获取所有持仓
export const getPortfolio = (): Promise<ApiResponse<Portfolio[]>> => {
  return api.get('/portfolio?market=all')
}

// 保存持仓
export const savePortfolio = (portfolio: Portfolio[]): Promise<ApiResponse<Portfolio[]>> => {
  return api.post('/save-portfolio', { portfolio })
}

// ==================== 估值管理 ====================

// 获取所有估值数据
export const getValuation = (): Promise<ApiResponse<Valuation[]>> => {
  return api.get('/valuation')
}

// ==================== 系统 ====================

// 健康检查
export const healthCheck = (): Promise<ApiResponse<{ status: string; timestamp: string }>> => {
  return api.get('/health')
}

// ==================== 服务管理 ====================

// 获取所有服务状态
export const getServices = (): Promise<ApiResponse<Record<string, ServiceInfo>>> => {
  return api.get('/services')
}

// 获取单个服务状态
export const getServiceStatus = (id: string): Promise<ApiResponse<{ running: boolean; port?: number; url?: string; error?: string }>> => {
  return api.get(`/services/${id}/status`)
}

// 启动服务
export const startService = (id: string): Promise<ApiResponse<{ pid?: number; port?: number; url?: string }>> => {
  return api.post(`/services/${id}/start`)
}

// 停止服务
export const stopService = (id: string): Promise<ApiResponse<void>> => {
  return api.post(`/services/${id}/stop`)
}

// 重启服务
export const restartService = (id: string): Promise<ApiResponse<{ pid?: number; port?: number; url?: string }>> => {
  return api.post(`/services/${id}/restart`)
}

// ==================== 用户认证 ====================

// 登录
export const login = (username: string, password: string): Promise<ApiResponse<User>> => {
  return api.post('/auth/login', { username, password })
}

// 获取当前用户信息
export const getCurrentUser = (): Promise<ApiResponse<User>> => {
  return api.get('/auth/me')
}

// ==================== 用户管理 ====================

// 获取所有用户
export const getUsers = (): Promise<ApiResponse<User[]>> => {
  return api.get('/users')
}

// 获取单个用户
export const getUser = (id: string): Promise<ApiResponse<User>> => {
  return api.get(`/users/${id}`)
}

// 创建用户
export const createUser = (data: Partial<User> & { password: string; createdBy?: string }): Promise<ApiResponse<User>> => {
  return api.post('/users', data)
}

// 更新用户
export const updateUser = (id: string, data: Partial<User> & { updatedBy?: string }): Promise<ApiResponse<User>> => {
  return api.put(`/users/${id}`, data)
}

// 删除用户
export const deleteUser = (id: string): Promise<ApiResponse<void>> => {
  return api.delete(`/users/${id}`)
}

// 更新用户状态
export const updateUserStatus = (id: string, status: 'enabled' | 'disabled', updatedBy?: string): Promise<ApiResponse<User>> => {
  return api.patch(`/users/${id}/status`, { status, updatedBy })
}

// 获取角色枚举
export const getRoleEnums = (): Promise<ApiResponse<{ value: string; label: string }[]>> => {
  return api.get('/users/roles/enums')
}

export default api
