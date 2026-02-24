import { ref } from 'vue'
import api from '@/api'
import axios from 'axios'

// BaoStock API 基础地址
const BAOSTOCK_API_BASE = 'http://localhost:8001'

export interface StockItem {
  code: string
  name?: string
  code_name?: string
  type?: string
  market?: string
  price?: number
  change?: number
  pe?: number
  ma5?: number
  ma20?: number
}

export interface PortfolioItem {
  code: string
  name: string
  market: string
  category: string
  industry: string
  theme: string
  style: string
  sector: string
  channel: string
  isLiquidated: string
  currentPrice: number
  prevPrice: number
  ma5: number
  ma10: number
  ma20: number
  ma30: number
  ma50: number
}

export interface ValuationItem {
  indexCode: string
  indexName: string
  category: string
  currentPrice: number | null
  prevPrice: number | null
  ytdChange: number | null
  pe: number | null
  pePercentile: number | null
  pb: number | null
  pbPercentile: number | null
  dividend: number | null
  roe: number | null
  revenueGrowth: number | null
  profitGrowth: number | null
  futureRevenueGrowth: number | null
  futureProfitGrowth: number | null
  trackingFund: string
}

export function useStockApi() {
  const loading = ref(false)
  const error = ref<string | null>(null)

// 搜索股票/基金/指数
const searchStocks = async (keyword: string, type: 'stock' | 'fund' | 'index' = 'stock'): Promise<StockItem[]> => {
  loading.value = true
  error.value = null
  try {
    // 优先尝试使用baostock接口进行联想搜索
    if (keyword && keyword.length >= 1) {
      try {
        const response = await axios.get(`${BAOSTOCK_API_BASE}/api/stock/list`)
        if (response.data?.success && response.data?.data?.stocks) {
          const allStocks = response.data.data.stocks
          
          // 过滤股票数据，根据类型和关键词进行匹配
          const filteredStocks = allStocks.filter((stock: any) => {
            const code = stock.code || ''
            const name = stock.code_name || ''
            
            // 根据类型过滤
            if (type === 'stock') {
              // 股票类型：sh. 或 sz. 开头的代码
              if (!code.startsWith('sh.') && !code.startsWith('sz.')) {
                return false
              }
            } else if (type === 'index') {
              // 指数类型：排除 sh. 和 sz. 开头的代码
              if (code.startsWith('sh.') || code.startsWith('sz.')) {
                return false
              }
            }
            // 基金类型暂时不做特殊过滤
            
            // 关键词匹配：支持代码和名称模糊匹配
            return code.includes(keyword) || name.includes(keyword)
          })
          
          // 转换为前端需要的格式（baostock接口只返回code、code_name、tradeStatus）
          const result: StockItem[] = filteredStocks.slice(0, 20).map((stock: any) => ({
            code: stock.code.replace('.', ''),
            code_name: stock.code_name || ''
          }))
          
          return result
        }
      } catch (e) {
        console.warn('baostock接口搜索失败，使用默认搜索:', e)
      }
    }
    
    // 如果baostock接口失败或没有数据，使用East Money搜索
    const response = await api.get('/search', {
      params: { keyword, type }
    })
    const rawData = response.data || []
    // 标准化字段名：East Money返回 code/name，统一添加 code_name 字段
    return rawData.map((item: any) => ({
      ...item,
      code: item.code || item['股票代码'] || '',
      name: item.name || item['股票名称'] || '',
      code_name: item.code_name || item.name || item['股票名称'] || ''
    }))
  } catch (e: any) {
    error.value = e.message
    // 返回模拟数据用于演示
    return getMockSearchResults(keyword, type)
  } finally {
    loading.value = false
  }
}

  // 获取自选持仓数据
  const getPortfolio = async (market?: string): Promise<PortfolioItem[]> => {
    loading.value = true
    error.value = null
    try {
      const response = await api.get('/portfolio', {
        params: { market }
      })
      console.log('API响应:', response)
      // 响应拦截器已将中文字段名映射为英文字段名并返回 data 数组
      const rawData = response.data || []
      console.log('原始数据 rawData:', rawData)
      if (rawData.length === 0) {
        console.warn('rawData 为空，返回模拟数据')
        return getMockPortfolio()
      }
      return rawData.map((item: any) => ({
        code: item['股票代码'] || item.code || '',
        name: item['股票名称'] || item.name || '',
        market: item['所在市场'] || item.market || '',
        category: item['股票类别'] || item.category || '',
        industry: item['所属行业'] || item.industry || '',
        theme: item['核心主题'] || item.theme || '',
        style: item['投资风格'] || item.style || '',
        sector: item['所属板块'] || item.sector || '',
        channel: item['购买渠道'] || item.channel || '',
        isLiquidated: item['是否清仓'] || item.isLiquidated || '否',
        currentPrice: parseFloat(item['当前实时价']) || parseFloat(item.currentPrice) || 0,
        prevPrice: parseFloat(item['昨日收盘价']) || parseFloat(item.prevPrice) || 0,
        ma5: parseFloat(item['MA5']) || parseFloat(item.ma5) || 0,
        ma10: parseFloat(item['MA10']) || parseFloat(item.ma10) || 0,
        ma20: parseFloat(item['MA20']) || parseFloat(item.ma20) || 0,
        ma30: parseFloat(item['MA30']) || parseFloat(item.ma30) || 0,
        ma50: parseFloat(item['MA50']) || parseFloat(item.ma50) || 0
      }))
    } catch (e: any) {
      error.value = e.message
      return getMockPortfolio()
    } finally {
      loading.value = false
    }
  }

  // 获取股票列表数据（stocks）
  const getStocks = async (market?: string): Promise<PortfolioItem[]> => {
    loading.value = true
    error.value = null
    try {
      const response = await api.get('/stocks', {
        params: { market }
      })
      // 将后端中文字段名映射为前端英文字段名
      const rawData = response.data || []
      return rawData.map((item: any) => ({
        code: item['股票代码'] || item.code || '',
        name: item['股票名称'] || item.name || '',
        market: item['所在市场'] || item.market || '',
        category: item['股票类别'] || item.category || '',
        industry: item['所属行业'] || item.industry || '',
        theme: item['核心主题'] || item.theme || '',
        style: item['投资风格'] || item.style || '',
        sector: item['所属板块'] || item.sector || '',
        channel: item['购买渠道'] || item.channel || '',
        currentPrice: parseFloat(item['当前实时价']) || item.currentPrice || 0,
        prevPrice: parseFloat(item['昨日收盘价']) || item.prevPrice || 0,
        ma5: parseFloat(item['MA5']) || item.ma5 || 0,
        ma10: parseFloat(item['MA10']) || item.ma10 || 0,
        ma20: parseFloat(item['MA20']) || item.ma20 || 0,
        ma30: parseFloat(item['MA30']) || item.ma30 || 0,
        ma50: parseFloat(item['MA50']) || item.ma50 || 0
      }))
    } catch (e: any) {
      error.value = e.message
      return getMockPortfolio()
    } finally {
      loading.value = false
    }
  }

  // 加载状态 - 记录正在加载的指数代码
  const loadingCodes = ref<Set<string>>(new Set())

  // 获取指数估值数据 - 先返回初始数据，再逐个异步更新
  const getValuation = async (
    onInitialData?: (items: ValuationItem[]) => void,
    onItemUpdated?: (item: ValuationItem, index: number) => void
  ): Promise<ValuationItem[]> => {
    error.value = null
    loadingCodes.value.clear()

    try {
      // 1. 先从后端 API 获取数据库中的指数列表
      console.log('[Valuation] 开始从数据库获取指数列表...')
      const dbResponse = await api.get('/valuation')
      const dbData = dbResponse.data || []

      console.log('[Valuation] 数据库返回数据条数:', dbData.length)

      if (!Array.isArray(dbData) || dbData.length === 0) {
        console.warn('数据库中没有估值数据')
        return []
      }

      // 2. 立即构建初始数据（从数据库）
      const initialResults: ValuationItem[] = dbData.map((item: any) => createValuationItemFromDb(item, null))
      console.log('[Valuation] 初始数据已构建，共:', initialResults.length, '条')

      // 立即返回/显示初始数据
      onInitialData?.(initialResults)

      // 3. 在后台逐个异步获取实时数据并更新（不阻塞）
      const updateRealtimeData = async () => {
        const today = new Date()
        const startDate = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate()).toISOString().split('T')[0]
        const endDate = today.toISOString().split('T')[0]

        // 使用 for...of 实现串行请求（一个一个来）
        for (let i = 0; i < dbData.length; i++) {
          const item = dbData[i]
          const indexCode = item['跟踪指数']

          if (!indexCode) continue

          // 标记该指数正在加载
          loadingCodes.value.add(indexCode)

          // 将代码格式转换为 baostock 格式 (如 000001.SH -> sh.000001)
          const bsCode = convertToBaoStockCode(indexCode)
          if (!bsCode) {
            loadingCodes.value.delete(indexCode)
            continue
          }

          try {
            console.log(`[BaoStock] 获取 ${indexCode} (${bsCode}) 数据...`)

            // 使用 stock 接口查询指数
            const klineRes = await axios.get(`${BAOSTOCK_API_BASE}/api/kline/stock/${bsCode}`, {
              params: {
                start_date: startDate,
                end_date: endDate,
                frequency: 'd',
                adjustflag: '3',
                fields: 'date,code,open,high,low,close,preclose,volume,amount,turn,pctChg,peTTM,pbMRQ,psTTM,pcfNcfTTM'
              },
              timeout: 10000
            })

            console.log(`[BaoStock] ${indexCode} 响应:`, klineRes.data?.success, '数据条数:', klineRes.data?.data?.kline_data?.length)

            if (klineRes.data?.success && klineRes.data?.data?.kline_data?.length > 0) {
              const klineData = klineRes.data.data.kline_data
              const latest = klineData[klineData.length - 1]
              const prev = klineData.length > 1 ? klineData[klineData.length - 2] : latest
              const yearStart = klineData[0]

              console.log(`[BaoStock] ${indexCode} 最新数据:`, { close: latest.close, peTTM: latest.peTTM, pbMRQ: latest.pbMRQ })

              // 计算今年涨跌幅
              const ytdChange = yearStart?.close ? ((latest.close - yearStart.close) / yearStart.close * 100) : null

              // 提取估值数据
              const peTTM = latest.peTTM || null
              const pbMRQ = latest.pbMRQ || null

              // 计算PE、PB分位数（基于一年的数据）
              const peValues = klineData.map((d: any) => d.peTTM).filter((v: any) => v && v > 0 && !isNaN(v))
              const pbValues = klineData.map((d: any) => d.pbMRQ).filter((v: any) => v && v > 0 && !isNaN(v))

              const pePercentile = peTTM && peValues.length > 0 ? calculatePercentile(peValues, peTTM) : null
              const pbPercentile = pbMRQ && pbValues.length > 0 ? calculatePercentile(pbValues, pbMRQ) : null

              // 构建更新后的数据
              const updatedItem: ValuationItem = {
                indexCode: indexCode,
                indexName: item['指数名称'] || '',
                category: item['指数类别'] || '',
                currentPrice: latest.close ?? null,
                prevPrice: prev.close ?? null,
                ytdChange: ytdChange,
                pe: peTTM,
                pePercentile: pePercentile,
                pb: pbMRQ,
                pbPercentile: pbPercentile,
                dividend: item['股息率'] ? parseFloat(item['股息率']) : null,
                roe: item['ROE盈利能力'] ? parseFloat(item['ROE盈利能力']) : null,
                revenueGrowth: item['Q2营收同比'] ? parseFloat(item['Q2营收同比']) : null,
                profitGrowth: item['Q2净利润同比'] ? parseFloat(item['Q2净利润同比']) : null,
                futureRevenueGrowth: item['未来2年营收复合增长率'] ? parseFloat(item['未来2年营收复合增长率']) : null,
                futureProfitGrowth: item['未来2年净利润复合增长率'] ? parseFloat(item['未来2年净利润复合增长率']) : null,
                trackingFund: item['跟踪的指数基金'] || ''
              }

              // 更新初始结果数组
              initialResults[i] = updatedItem

              console.log(`[BaoStock] ${indexCode} 更新完成，通知页面`)

              // 通知页面更新这一行
              onItemUpdated?.(updatedItem, i)
            } else {
              console.warn(`[BaoStock] ${indexCode} 没有返回数据`)
            }
          } catch (err: any) {
            console.warn(`[BaoStock] 获取 ${indexCode} 实时数据失败:`, err.message || err)
          } finally {
            loadingCodes.value.delete(indexCode)
          }
        }

        console.log('[Valuation] 所有实时数据更新完成')
      }

      // 启动后台更新（不 await，让它异步执行）
      updateRealtimeData()

      // 立即返回初始结果
      return initialResults
    } catch (e: any) {
      error.value = e.message
      console.error('获取指数估值数据失败:', e)
      return []
    }
  }

  // 从数据库数据创建 ValuationItem（当实时数据获取失败时使用）
  const createValuationItemFromDb = (item: any, realtimeData: any): ValuationItem => {
    const hasRealtime = realtimeData && realtimeData.close
    return {
      indexCode: item['跟踪指数'] || '',
      indexName: item['指数名称'] || '',
      category: item['指数类别'] || '',
      currentPrice: hasRealtime ? realtimeData.close : (item['当前价格'] ? parseFloat(item['当前价格']) : null),
      prevPrice: hasRealtime ? realtimeData.preclose : (item['昨日价格'] ? parseFloat(item['昨日价格']) : null),
      ytdChange: item['今年涨跌幅'] ? parseFloat(item['今年涨跌幅']) : null,
      pe: item['TTM_PE市盈率'] ? parseFloat(item['TTM_PE市盈率']) : null,
      pePercentile: item['PE百分位_10年'] ? parseFloat(item['PE百分位_10年']) : null,
      pb: item['TTM_PB市净率'] ? parseFloat(item['TTM_PB市净率']) : null,
      pbPercentile: item['PB百分位_10年'] ? parseFloat(item['PB百分位_10年']) : null,
      dividend: item['股息率'] ? parseFloat(item['股息率']) : null,
      roe: item['ROE盈利能力'] ? parseFloat(item['ROE盈利能力']) : null,
      revenueGrowth: item['Q2营收同比'] ? parseFloat(item['Q2营收同比']) : null,
      profitGrowth: item['Q2净利润同比'] ? parseFloat(item['Q2净利润同比']) : null,
      futureRevenueGrowth: item['未来2年营收复合增长率'] ? parseFloat(item['未来2年营收复合增长率']) : null,
      futureProfitGrowth: item['未来2年净利润复合增长率'] ? parseFloat(item['未来2年净利润复合增长率']) : null,
      trackingFund: item['跟踪的指数基金'] || ''
    }
  }

  // 将代码转换为 BaoStock 格式
  const convertToBaoStockCode = (code: string): string | null => {
    // 格式: 000001.SH -> sh.000001
    // 格式: 399006.SZ -> sz.399006
    const match = code.match(/^(\d+)\.(SH|SZ|CSI|CNI|GI|SI)$/i)
    if (!match) return null

    const [, num, exchange] = match
    const exchangeMap: Record<string, string> = {
      'SH': 'sh',
      'SZ': 'sz',
      'CSI': 'sh', // CSI 指数一般在上交所
      'CNI': 'sz', // CNI 指数一般在深交所
      'GI': 'sh',
      'SI': 'sh'
    }
    const prefix = exchangeMap[exchange.toUpperCase()]
    if (!prefix) return null

    return `${prefix}.${num}`
  }

  // 计算分位数
  const calculatePercentile = (values: number[], current: number): number => {
    if (!current || values.length === 0) return 0
    const sorted = [...values].sort((a, b) => a - b)
    const position = sorted.findIndex(v => v >= current)
    if (position === -1) return 100
    return (position / sorted.length) * 100
  }

  // 创建空的估值数据项
  const createEmptyValuationItem = (index: { code: string, name: string, category: string, fund: string }): ValuationItem => ({
    indexCode: index.code.replace('sh.', '').replace('sz.', ''),
    indexName: index.name,
    category: index.category,
    currentPrice: null,
    prevPrice: null,
    ytdChange: null,
    pe: null,
    pePercentile: null,
    pb: null,
    pbPercentile: null,
    dividend: null,
    roe: null,
    revenueGrowth: null,
    profitGrowth: null,
    futureRevenueGrowth: null,
    futureProfitGrowth: null,
    trackingFund: index.fund
  })

  // 获取股票详情
  const getStockDetail = async (code: string) => {
    loading.value = true
    error.value = null
    try {
      const response = await api.get(`/stock/${code}`)
      // 响应拦截器返回的是 { success: true, data: {...} }
      return response.data?.data || response.data
    } catch (e: any) {
      error.value = e.message
      return getMockStockDetail(code)
    } finally {
      loading.value = false
    }
  }

  // 获取K线数据
  const getKlineData = async (code: string, period: string = '1d') => {
    loading.value = true
    try {
      const response = await api.get(`/stock/${code}/kline`, {
        params: { period }
      })
      return response.data || []
    } catch (e: any) {
      return getMockKlineData()
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    loadingCodes,
    searchStocks,
    getPortfolio,
    getStocks,
    getValuation,
    getStockDetail,
    getKlineData
  }
}

// 模拟数据函数
function getMockSearchResults(keyword: string, type: string): StockItem[] {
  const mockData: StockItem[] = [
    { code: '000001', name: '平安银行', type: '股票', market: '深圳', price: 12.35, change: 1.23 },
    { code: '600036', name: '招商银行', type: '股票', market: '上海', price: 35.68, change: -0.56 },
    { code: '000002', name: '万科A', type: '股票', market: '深圳', price: 8.92, change: 2.15 },
    { code: '600519', name: '贵州茅台', type: '股票', market: '上海', price: 1680.00, change: 0.35 },
    { code: '000858', name: '五粮液', type: '股票', market: '深圳', price: 145.20, change: -1.02 }
  ]
  
  return mockData.filter(item => 
    item.code.includes(keyword) || item.name.includes(keyword)
  )
}

function getMockPortfolio(): PortfolioItem[] {
  return [
    {
      code: "sh588000",
      name: "科创50ETF",
      market: "A股",
      category: "ETF",
      industry: "科技",
      theme: "科创板",
      style: "成长",
      sector: "科创板",
      channel: "东方财富",
      isLiquidated: "否",
      currentPrice: 0,
      prevPrice: 0,
      ma5: 0,
      ma10: 0,
      ma20: 0,
      ma30: 0,
      ma50: 0
    },
    {
      code: "sh513180",
      name: "恒生科技指数ETF",
      market: "A股",
      category: "ETF",
      industry: "科技",
      theme: "港股科技",
      style: "成长",
      sector: "港股",
      channel: "东方财富",
      isLiquidated: "否",
      currentPrice: 0,
      prevPrice: 0,
      ma5: 0,
      ma10: 0,
      ma20: 0,
      ma30: 0,
      ma50: 0
    },
    {
      code: "hk03690",
      name: "美团-W",
      market: "港股",
      category: "个股",
      industry: "互联网",
      theme: "本地生活/科技",
      style: "成长",
      sector: "港股",
      channel: "富途牛牛",
      isLiquidated: "否",
      currentPrice: 0,
      prevPrice: 0,
      ma5: 0,
      ma10: 0,
      ma20: 0,
      ma30: 0,
      ma50: 0
    }
  ]
}

function getMockValuation(): ValuationItem[] {
  return [
    {
      indexCode: '000300', indexName: '沪深300', category: '宽基指数',
      currentPrice: 3856.25, prevPrice: 3842.10, ytdChange: 5.23,
      pe: 12.35, pePercentile: 35.6, pb: 1.28, pbPercentile: 28.5,
      dividend: 2.85, roe: 11.2, revenueGrowth: 8.5, profitGrowth: 12.3,
      futureRevenueGrowth: 9.2, futureProfitGrowth: 15.6,
      trackingFund: '510300'
    },
    {
      indexCode: '000905', indexName: '中证500', category: '宽基指数',
      currentPrice: 5623.18, prevPrice: 5598.45, ytdChange: 8.56,
      pe: 22.15, pePercentile: 45.2, pb: 1.85, pbPercentile: 38.6,
      dividend: 1.52, roe: 8.5, revenueGrowth: 12.3, profitGrowth: 18.5,
      futureRevenueGrowth: 14.5, futureProfitGrowth: 22.3,
      trackingFund: '510500'
    },
    {
      indexCode: '399006', indexName: '创业板指', category: '宽基指数',
      currentPrice: 2156.78, prevPrice: 2189.32, ytdChange: -3.25,
      pe: 35.68, pePercentile: 25.8, pb: 3.25, pbPercentile: 22.3,
      dividend: 0.85, roe: 9.8, revenueGrowth: 15.6, profitGrowth: 25.8,
      futureRevenueGrowth: 18.2, futureProfitGrowth: 28.5,
      trackingFund: '159915'
    }
  ]
}

function getMockStockDetail(code: string) {
  return {
    code,
    name: code === '000001' ? '平安银行' : '招商银行',
    currentPrice: 12.35,
    prevPrice: 12.20,
    openPrice: 12.25,
    highPrice: 12.58,
    lowPrice: 12.15,
    volume: '125.6万',
    turnover: '15.5亿',
    totalShares: 194.52,
    floatShares: 193.85,
    totalMarketValue: 2402.35,
    floatMarketValue: 2393.74,
    industry: '银行',
    listingDate: '19910403',
    pe: 5.23,
    pb: 0.68,
    limitUp: 13.42,
    limitDown: 10.98,
    turnoverRate: 0.65,
    volumeRatio: 1.23,
    bid1: 12.34, bid1Vol: 1520,
    bid2: 12.33, bid2Vol: 2350,
    bid3: 12.32, bid3Vol: 1860,
    bid4: 12.31, bid4Vol: 3200,
    bid5: 12.30, bid5Vol: 4580,
    ask1: 12.35, ask1Vol: 1280,
    ask2: 12.36, ask2Vol: 1950,
    ask3: 12.37, ask3Vol: 2680,
    ask4: 12.38, ask4Vol: 1560,
    ask5: 12.39, ask5Vol: 3250
  }
}

function getMockKlineData() {
  const data = []
  let basePrice = 12.0
  const now = Date.now()
  
  for (let i = 60; i >= 0; i--) {
    const date = new Date(now - i * 24 * 60 * 60 * 1000)
    const variation = (Math.random() - 0.5) * 0.5
    const open = basePrice + variation
    const close = open + (Math.random() - 0.5) * 0.3
    const high = Math.max(open, close) + Math.random() * 0.2
    const low = Math.min(open, close) - Math.random() * 0.2
    
    data.push({
      date: date.toISOString().split('T')[0],
      open: +open.toFixed(2),
      close: +close.toFixed(2),
      high: +high.toFixed(2),
      low: +low.toFixed(2),
      volume: Math.floor(Math.random() * 1000000) + 500000
    })
    
    basePrice = close
  }
  
  return data
}
