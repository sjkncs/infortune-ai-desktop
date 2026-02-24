/**
 * AKShare Python API 服务对接模块
 * 用于与 Python 后端的 AKShare API 通信
 */

import axios from 'axios'

// Python API 基础地址
const PYTHON_API_BASE = process.env.PYTHON_API_URL || 'http://localhost:8000'

class AKShareService {
  constructor() {
    this.baseURL = PYTHON_API_BASE
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }

  /**
   * 获取股票实时行情
   * @param {string} symbol - 股票代码
   * @returns {Promise<Object>}
   */
  async getStockRealtime(symbol) {
    try {
      const response = await this.client.get(`/api/stock/realtime/${symbol}`)
      return response.data
    } catch (error) {
      console.error('获取股票实时行情失败:', error.message)
      throw error
    }
  }

  /**
   * 获取股票列表
   * @param {number} page - 页码
   * @param {number} pageSize - 每页数量
   * @returns {Promise<Object>}
   */
  async getStockList(page = 1, pageSize = 100) {
    try {
      const response = await this.client.get('/api/stock/list', {
        params: { page, page_size: pageSize }
      })
      return response.data
    } catch (error) {
      console.error('获取股票列表失败:', error.message)
      throw error
    }
  }

  /**
   * 获取场内基金（ETF）列表
   * @param {number} page - 页码
   * @param {number} pageSize - 每页数量
   * @returns {Promise<Object>}
   */
  async getETFList(page = 1, pageSize = 200) {
    try {
      const response = await this.client.get('/api/akshare/etf', {
        params: { page, page_size: pageSize }
      })
      return response.data
    } catch (error) {
      console.error('获取ETF列表失败:', error.message)
      throw error
    }
  }

  /**
   * 获取股票历史数据
   * @param {string} symbol - 股票代码
   * @param {string} period - 周期（daily/weekly/monthly）
   * @param {string} startDate - 开始日期（YYYYMMDD）
   * @param {string} endDate - 结束日期（YYYYMMDD）
   * @returns {Promise<Object>}
   */
  async getStockHistory(symbol, period = 'daily', startDate = null, endDate = null) {
    try {
      const params = { period }
      if (startDate) params.start_date = startDate
      if (endDate) params.end_date = endDate

      const response = await this.client.get(`/api/stock/history/${symbol}`, { params })
      return response.data
    } catch (error) {
      console.error('获取股票历史数据失败:', error.message)
      throw error
    }
  }

  /**
   * 搜索股票
   * @param {string} keyword - 搜索关键词
   * @returns {Promise<Object>}
   */
  async searchStock(keyword) {
    try {
      const response = await this.client.get('/api/stock/search', {
        params: { keyword }
      })
      return response.data
    } catch (error) {
      console.error('搜索股票失败:', error.message)
      throw error
    }
  }

  /**
   * 检查 Python API 服务是否可用
   * @returns {Promise<boolean>}
   */
  async healthCheck() {
    try {
      const response = await this.client.get('/', { timeout: 3000 })
      return response.status === 200
    } catch (error) {
      return false
    }
  }
}

// 导出单例
export default new AKShareService()