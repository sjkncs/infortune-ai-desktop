import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000
})

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    const data = response.data
    const url = response.config.url || ''

    // 只对 portfolio API 进行字段映射
    if (url.includes('/portfolio') && data.data && Array.isArray(data.data) && data.data.length > 0) {
      const firstItem = data.data[0]

      // 检查是否是中文字段名的数据
      if (firstItem['股票代码']) {
        console.log('Mapping Chinese field names to English, adding isLiquidated field')
        data.data = data.data.map((item: any) => ({
          code: item['股票代码'],
          name: item['股票名称'],
          market: item['所在市场'],
          category: item['股票类别'],
          industry: item['所属行业'],
          theme: item['核心主题'],
          style: item['投资风格'],
          sector: item['所属板块'],
          channel: item['购买渠道'],
          isLiquidated: item['是否清仓'] || '否',
          currentPrice: parseFloat(item['当前实时价']) || 0,
          prevPrice: parseFloat(item['昨日收盘价']) || 0,
          ma5: parseFloat(item['MA5']) || 0,
          ma10: parseFloat(item['MA10']) || 0,
          ma20: parseFloat(item['MA20']) || 0,
          ma30: parseFloat(item['MA30']) || 0,
          ma50: parseFloat(item['MA50']) || 0
        }))
      }
    }

    return data
  },
  (error) => {
    console.error('API Error:', error)
    return Promise.reject(error)
  }
)

export default api
