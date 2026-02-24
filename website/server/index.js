import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import axios from 'axios'
import crypto from 'crypto'
import db from './db.js'
import usersDb from './users-db.js'
import { initDatabase } from './init-db.js'
import stockService from './stock-service.js'
import akshareService from './akshare-service.js'
import serviceManager from './service-manager.js'
import { SERVER_CONFIG } from '../config/server.config.js'
import { createServer } from 'http'
import realtimeService from './websocket-service.js'
import aiService from './ai-service.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = SERVER_CONFIG.API_PORT

// 中间件
app.use(cors())
app.use(express.json())

// analysis-service.js 已被删除，相关功能已移除

// 静态文件服务 - 用于访问分析报告
app.use('/analysis', express.static(path.join(__dirname, 'analysis')))

// 初始化数据库（在启动时执行）
initDatabase().then(() => {
  console.log('✅ 数据库已连接')
}).catch(err => {
  console.error('❌ 数据库连接失败:', err)
})

// API 路由

// 搜索股票
app.get('/api/search', async (req, res) => {
  const { keyword, type } = req.query

  await db.read()
  
  // 如果没有关键词，返回所有 stocks
  if (!keyword) {
    return res.json({ success: true, data: db.data.stocks })
  }

  // 支持中英文字段名搜索（db.json 使用中文字段名）
  const kw = keyword.toLowerCase()
  const localResults = db.data.stocks.filter(stock => {
    const code = stock['股票代码'] || stock.code || ''
    const name = stock['股票名称'] || stock.name || ''
    return code.toLowerCase().includes(kw) || name.toLowerCase().includes(kw)
  })

  // 如果本地有结果，直接返回
  if (localResults.length > 0) {
    return res.json({ success: true, data: localResults, source: 'local' })
  }

  // 本地无结果时，尝试东方财富搜索建议API
  try {
    const emResults = await stockService.searchStocks(keyword)
    if (emResults && emResults.length > 0) {
      return res.json({ success: true, data: emResults, source: 'eastmoney' })
    }
  } catch (e) {
    console.warn('东方财富搜索失败:', e.message)
  }

  // 东方财富也无结果时，尝试 AKShare（如果可用）
  try {
    const akResult = await akshareService.searchStock(keyword)
    if (akResult && akResult.data && akResult.data.length > 0) {
      const formatted = akResult.data.slice(0, 20).map(item => ({
        code: item['代码'] || item.code || '',
        name: item['名称'] || item.name || '',
        type: item['类型'] || type || '股票',
        market: item['市场'] || 'A股',
      }))
      return res.json({ success: true, data: formatted, source: 'akshare' })
    }
  } catch (e) {
    // AKShare 不可用，忽略
  }

  // 都没有结果
  res.json({ success: true, data: [], source: 'none' })
})

// 获取自选持仓（含实时价格和MA数据）
app.get('/api/portfolio', async (req, res) => {
  const { market } = req.query

  await db.read()
  let portfolio = db.data.portfolio
  if (market && market !== 'all') {
    const marketMap = {
      'a-share': ['A股'],
      'hk-share': ['港股'],
      'us-share': ['美股'],
      'fund': ['基金', '场外基金']
    }
    const markets = marketMap[market] || []
    // 兼容中文字段名和英文字段名
    portfolio = db.data.portfolio.filter(item => {
      const itemMarket = item.market || item['所在市场'] || ''
      return markets.some(m => itemMarket.includes(m))
    })
  }

  try {
    // 并行获取所有股票的价格和MA数据
    const pricePromises = portfolio.map(async (stock) => {
      const stockCode = stock.code || stock['股票代码']
      
      try {
        const priceData = await stockService.getStockPrice(stockCode)
        const maData = await stockService.getMAData(stockCode)

        // 如果获取到新数据且不为空，则使用新数据，否则保留原数据
        return {
          ...stock,
          当前实时价: priceData.currentPrice || stock['当前实时价'],
          昨日收盘价: priceData.prevClose || stock['昨日收盘价'],
          MA5: maData.MA5 || stock['MA5'],
          MA10: maData.MA10 || stock['MA10'],
          MA20: maData.MA20 || stock['MA20'],
          MA30: maData.MA30 || stock['MA30'],
          MA50: maData.MA50 || stock['MA50']
        }
      } catch (error) {
        console.warn(`获取${stockCode}价格数据失败，保留原数据:`, error.message)
        // API调用失败时，返回原始数据
        return stock
      }
    })

    const updatedPortfolio = await Promise.all(pricePromises)

    res.json({
      success: true,
      data: updatedPortfolio,
      updateTime: new Date().toLocaleString()
    })
  } catch (error) {
    console.error('获取投资组合数据失败:', error)
    res.json({ success: true, data: portfolio })
  }
})

import fs from 'fs'

// 更新 init-db.js 中的 portfolio 数据
async function updateInitDbPortfolio(portfolio) {
  try {
    const initDbPath = path.join(__dirname, 'init-db.js')
    let content = fs.readFileSync(initDbPath, 'utf8')

    // 将数据格式化为 JS 对象字符串（使用中文字段名格式）
    const portfolioStr = JSON.stringify(portfolio, null, 2)
      // 将英文字段名转换为中文字段名
      .replace(/"code":/g, '"股票代码":')
      .replace(/"name":/g, '"股票名称":')
      .replace(/"market":/g, '"所在市场":')
      .replace(/"category":/g, '"股票类别":')
      .replace(/"industry":/g, '"所属行业":')
      .replace(/"theme":/g, '"核心主题":')
      .replace(/"style":/g, '"投资风格":')
      .replace(/"sector":/g, '"所属板块":')
      .replace(/"channel":/g, '"购买渠道":')
      .replace(/"currentPrice":/g, '"当前实时价":')
      .replace(/"prevPrice":/g, '"昨日收盘价":')
      .replace(/"ma5":/g, '"MA5":')
      .replace(/"ma10":/g, '"MA10":')
      .replace(/"ma20":/g, '"MA20":')
      .replace(/"ma30":/g, '"MA30":')
      .replace(/"ma50":/g, '"MA50":')

    // 替换 init-db.js 中的 portfolio 数组
    // 查找 db.data.portfolio = [ ... ] 的模式
    const regex = /(if \(!db\.data\.portfolio \|\| db\.data\.portfolio\.length === 0\) \{[\s\S]*?db\.data\.portfolio = )\[[\s\S]*?\](\s*hasChanges)/

    if (regex.test(content)) {
      content = content.replace(regex, `$1${portfolioStr}$2`)
      fs.writeFileSync(initDbPath, content, 'utf8')
      console.log('✅ init-db.js 已更新')
    } else {
      console.log('⚠️ 无法找到 init-db.js 中的 portfolio 定义位置')
    }
  } catch (e) {
    console.error('更新 init-db.js 失败:', e)
  }
}

// 更新 init-db.js 中的 stocks 数据
async function updateInitDbStocks(stocks) {
  try {
    const initDbPath = path.join(__dirname, 'init-db.js')
    let content = fs.readFileSync(initDbPath, 'utf8')

    // 将数据格式化为 JS 对象字符串（使用中文字段名格式）
    const stocksStr = JSON.stringify(stocks, null, 2)
      // 将英文字段名转换为中文字段名
      .replace(/"code":/g, '"股票代码":')
      .replace(/"name":/g, '"股票名称":')
      .replace(/"market":/g, '"所在市场":')
      .replace(/"category":/g, '"股票类别":')
      .replace(/"industry":/g, '"所属行业":')
      .replace(/"theme":/g, '"核心主题":')
      .replace(/"style":/g, '"投资风格":')
      .replace(/"sector":/g, '"所属板块":')
      .replace(/"channel":/g, '"购买渠道":')
      .replace(/"currentPrice":/g, '"当前实时价":')
      .replace(/"prevPrice":/g, '"昨日收盘价":')
      .replace(/"ma5":/g, '"MA5":')
      .replace(/"ma10":/g, '"MA10":')
      .replace(/"ma20":/g, '"MA20":')
      .replace(/"ma30":/g, '"MA30":')
      .replace(/"ma50":/g, '"MA50":')

    // 替换 init-db.js 中的 stocks 数组
    // 查找 db.data.stocks = [ ... ] 的模式
    const regex = /(if \(!db\.data\.stocks \|\| db\.data\.stocks\.length === 0\) \{[\s\S]*?db\.data\.stocks = )\[[\s\S]*?\](\s*hasChanges)/

    if (regex.test(content)) {
      content = content.replace(regex, `$1${stocksStr}$2`)
      fs.writeFileSync(initDbPath, content, 'utf8')
      console.log('✅ init-db.js stocks 数据已更新')
    } else {
      console.log('⚠️ 无法找到 init-db.js 中的 stocks 定义位置')
    }
  } catch (e) {
    console.error('更新 init-db.js stocks 数据失败:', e)
  }
}

// 保存自选持仓数据到本地 db.json
app.post('/api/save-portfolio', async (req, res) => {
  const { portfolio } = req.body

  if (!portfolio) {
    return res.status(400).json({ success: false, message: '缺少 portfolio 数据' })
  }

  try {
    await db.read()
    // 覆盖本地数据库中的 portfolio 字段
    db.data.portfolio = portfolio
    await db.write()

    // 同时更新 init-db.js
    await updateInitDbPortfolio(portfolio)

    res.json({ success: true, data: db.data.portfolio })
  } catch (e) {
    console.error('保存 portfolio 数据失败:', e)
    res.status(500).json({ success: false, message: '保存失败' })
  }
})

// 保存 stocks 数据到本地 db.json
app.post('/api/save-stocks', async (req, res) => {
  const { stocks } = req.body

  if (!stocks) {
    return res.status(400).json({ success: false, message: '缺少 stocks 数据' })
  }

  try {
    await db.read()
    // 将英文字段名转换为中文字段名以匹配数据库格式
    const convertedStocks = stocks.map(stock => ({
      '股票代码': stock.code || stock['股票代码'] || '',
      '股票名称': stock.name || stock['股票名称'] || '',
      '所在市场': stock.market || stock['所在市场'] || '',
      '股票类别': stock.category || stock['股票类别'] || '',
      '所属行业': stock.industry || stock['所属行业'] || '',
      '核心主题': stock.theme || stock['核心主题'] || '',
      '投资风格': stock.style || stock['投资风格'] || '',
      '所属板块': stock.sector || stock['所属板块'] || '',
      '购买渠道': stock.channel || stock['购买渠道'] || '',
      '当前实时价': stock.currentPrice?.toString() || stock['当前实时价'] || '',
      '昨日收盘价': stock.prevPrice?.toString() || stock['昨日收盘价'] || '',
      'MA5': stock.ma5?.toString() || stock['MA5'] || '',
      'MA10': stock.ma10?.toString() || stock['MA10'] || '',
      'MA20': stock.ma20?.toString() || stock['MA20'] || '',
      'MA30': stock.ma30?.toString() || stock['MA30'] || '',
      'MA50': stock.ma50?.toString() || stock['MA50'] || ''
    }))
    
    // 覆盖本地数据库中的 stocks 字段
    db.data.stocks = convertedStocks
    await db.write()

    // 同时更新 init-db.js
    await updateInitDbStocks(stocks)

    res.json({ success: true, data: db.data.stocks })
  } catch (e) {
    console.error('保存 stocks 数据失败:', e)
    res.status(500).json({ success: false, message: '保存失败' })
  }
})

// 获取指数估值
app.get('/api/valuation', async (_, res) => {
  await db.read()
  res.json({ success: true, data: db.data.valuation })
})

// 获取股票列表（stocks数据，含实时价格和MA数据）
app.get('/api/stocks', async (req, res) => {
  const { market } = req.query

  await db.read()
  let stocks = db.data.stocks
  if (market && market !== 'all') {
    const marketMap = {
      'a-share': ['A股'],
      'hk-share': ['港股'],
      'us-share': ['美股'],
      'fund': ['基金', '场外基金']
    }
    const markets = marketMap[market] || []
    // 兼容中文字段名和英文字段名
    stocks = db.data.stocks.filter(item => {
      const itemMarket = item.market || item['所在市场'] || ''
      return markets.some(m => itemMarket.includes(m))
    })
  }

  try {
    // 并行获取所有股票的价格和MA数据
    const pricePromises = stocks.map(async (stock) => {
      const stockCode = stock.code || stock['股票代码']
      
      try {
        const priceData = await stockService.getStockPrice(stockCode)
        const maData = await stockService.getMAData(stockCode)

        // 如果获取到新数据且不为空，则使用新数据，否则保留原数据
        return {
          ...stock,
          当前实时价: priceData.currentPrice || stock['当前实时价'],
          昨日收盘价: priceData.prevClose || stock['昨日收盘价'],
          MA5: maData.MA5 || stock['MA5'],
          MA10: maData.MA10 || stock['MA10'],
          MA20: maData.MA20 || stock['MA20'],
          MA30: maData.MA30 || stock['MA30'],
          MA50: maData.MA50 || stock['MA50']
        }
      } catch (error) {
        console.warn(`获取${stockCode}价格数据失败，保留原数据:`, error.message)
        // API调用失败时，返回原始数据
        return stock
      }
    })

    const updatedStocks = await Promise.all(pricePromises)

    res.json({
      success: true,
      data: updatedStocks,
      updateTime: new Date().toLocaleString()
    })
  } catch (error) {
    console.error('获取股票列表数据失败:', error)
    res.json({ success: true, data: stocks })
  }
})

// 获取股票详情
app.get('/api/stock/:code', async (req, res) => {
  const { code } = req.params

  try {
    // 调用 stock-service 获取实时数据
    const detail = await stockService.getStockDetail(code)

    if (detail) {
      res.json({ success: true, data: detail })
    } else {
      // 如果获取失败，从数据库读取基础信息并返回默认数据
      await db.read()
      const stock = db.data.stocks.find(s => s.code === code)

      const fallbackDetail = {
        code,
        name: stock?.name || `股票${code}`,
        currentPrice: stock?.price || 0,
        prevPrice: stock?.price ? stock.price * 0.99 : 0,
        openPrice: stock?.price ? stock.price * 1.01 : 0,
        highPrice: stock?.price ? stock.price * 1.03 : 0,
        lowPrice: stock?.price ? stock.price * 0.98 : 0,
        volume: '--',
        turnover: '--',
        totalShares: 0,
        floatShares: 0,
        totalMarketValue: 0,
        floatMarketValue: 0,
        industry: '--',
        listingDate: '--',
        pe: 0,
        pb: 0,
        limitUp: stock?.price ? stock.price * 1.1 : 0,
        limitDown: stock?.price ? stock.price * 0.9 : 0,
        turnoverRate: 0,
        volumeRatio: 0,
        avgPrice: stock?.price || 0,
        bid1: 0, bid1Vol: 0,
        bid2: 0, bid2Vol: 0,
        bid3: 0, bid3Vol: 0,
        bid4: 0, bid4Vol: 0,
        bid5: 0, bid5Vol: 0,
        ask1: 0, ask1Vol: 0,
        ask2: 0, ask2Vol: 0,
        ask3: 0, ask3Vol: 0,
        ask4: 0, ask4Vol: 0,
        ask5: 0, ask5Vol: 0
      }

      res.json({ success: true, data: fallbackDetail })
    }
  } catch (error) {
    console.error('获取股票详情失败:', error)
    res.status(500).json({ success: false, message: '获取股票详情失败' })
  }
})

// 获取K线数据
app.get('/api/stock/:code/kline', async (req, res) => {
  const { code } = req.params
  const { period = '1d' } = req.query

  try {
    // 调用 stock-service 获取K线数据
    const klineData = await stockService.getKlineData(code, period)

    if (klineData && klineData.length > 0) {
      res.json({ success: true, data: klineData })
    } else {
      // 如果获取失败，返回空数组
      res.json({ success: true, data: [] })
    }
  } catch (error) {
    console.error('获取K线数据失败:', error)
    res.status(500).json({ success: false, message: '获取K线数据失败' })
  }
})

// 获取单只股票/指数实时行情（桌面端 zhishu.js / zixuan.js 调用）
app.get('/api/stock/:code/realtime', async (req, res) => {
  const { code } = req.params

  try {
    const detail = await stockService.getStockDetail(code)

    if (detail) {
      const currentPrice = parseFloat(detail.currentPrice || 0)
      const prevPrice = parseFloat(detail.prevPrice || detail.prevClose || currentPrice)
      const changePct = prevPrice > 0 ? ((currentPrice - prevPrice) / prevPrice * 100) : 0

      res.json({
        success: true,
        data: {
          code: detail.code || code,
          name: detail.name || code,
          currentPrice,
          price: currentPrice,
          prevClose: prevPrice,
          changePercent: parseFloat(changePct.toFixed(2)),
          changePct: parseFloat(changePct.toFixed(2)),
          openPrice: detail.openPrice || 0,
          highPrice: detail.highPrice || 0,
          lowPrice: detail.lowPrice || 0,
          volume: detail.volume || 0,
          turnover: detail.turnover || 0,
          pe: detail.pe || null,
          peRatio: detail.pe || null,
          pb: detail.pb || null,
          pbRatio: detail.pb || null,
          updateTime: new Date().toISOString()
        }
      })
    } else {
      res.json({ success: false, message: `无法获取 ${code} 的实时数据` })
    }
  } catch (error) {
    console.error(`获取${code}实时行情失败:`, error.message)
    res.status(500).json({ success: false, message: error.message })
  }
})

// 批量获取指数实时行情（桌面端 zhishu.js 调用，1次请求替代N次）
app.get('/api/indices/realtime', async (req, res) => {
  const { codes } = req.query  // 逗号分隔，如 sh000001,sz399001,...
  if (!codes) {
    return res.status(400).json({ success: false, message: '缺少 codes 参数' })
  }

  const codeList = codes.split(',').map(c => c.trim()).filter(Boolean)

  try {
    const results = await Promise.allSettled(
      codeList.map(code => stockService.getStockDetail(code))
    )

    const indices = results.map((r, i) => {
      const code = codeList[i]
      if (r.status === 'fulfilled' && r.value) {
        const d = r.value
        const currentPrice = parseFloat(d.currentPrice || 0)
        const prevPrice = parseFloat(d.prevPrice || d.prevClose || currentPrice)
        const changePct = prevPrice > 0 ? ((currentPrice - prevPrice) / prevPrice * 100) : 0

        return {
          code,
          name: d.name || code,
          currentPrice,
          price: currentPrice,
          prevClose: prevPrice,
          changePercent: parseFloat(changePct.toFixed(2)),
          pe: d.pe || null,
          pb: d.pb || null,
          volume: d.volume || 0,
          turnover: d.turnover || 0,
          updateTime: new Date().toISOString()
        }
      }
      return { code, name: code, currentPrice: 0, price: 0, changePercent: 0, pe: null, pb: null }
    })

    res.json({ success: true, data: indices, timestamp: new Date().toISOString() })
  } catch (error) {
    console.error('批量获取指数行情失败:', error.message)
    res.status(500).json({ success: false, message: error.message })
  }
})

// ============================================
// AI 智能分析 API (对接 hiapi.online)
// ============================================

// 获取AI分析（GET - 前端 useAiAnalysis 调用此接口）
app.get('/api/v1/stocks/:code/ai-analysis', async (req, res) => {
  const { code } = req.params
  const { use_cache } = req.query
  const useCache = use_cache !== 'false'

  try {
    // 先获取股票实时数据作为分析上下文
    let stockData = {}
    try {
      stockData = await stockService.getStockDetail(code) || {}
    } catch (e) {
      console.warn('获取股票数据失败，AI分析将使用有限信息:', e.message)
    }

    const result = await aiService.analyzeStock(code, stockData, useCache)
    res.json(result)
  } catch (error) {
    console.error('AI分析失败:', error)
    res.status(500).json({ error: 'AI分析服务暂时不可用', message: error.message })
  }
})

// 刷新AI分析（POST - 强制重新分析）
app.post('/api/v1/stocks/:code/ai-analysis/refresh', async (req, res) => {
  const { code } = req.params

  try {
    let stockData = {}
    try {
      stockData = await stockService.getStockDetail(code) || {}
    } catch (e) {
      console.warn('获取股票数据失败:', e.message)
    }

    const result = await aiService.refreshAnalysis(code, stockData)
    res.json(result)
  } catch (error) {
    console.error('AI刷新分析失败:', error)
    res.status(500).json({ error: 'AI分析服务暂时不可用', message: error.message })
  }
})

// 添加股票到数据库
app.post('/api/stocks', async (req, res) => {
  const { code, name, type, market, price, change } = req.body

  if (!code || !name || !price) {
    return res.status(400).json({ success: false, message: '缺少必要字段' })
  }

  await db.read()

  // 检查股票是否已存在
  const existingStock = db.data.stocks.find(s => s.code === code)
  if (existingStock) {
    return res.status(400).json({ success: false, message: '股票已存在' })
  }

  const newStock = {
    code,
    name,
    type: type || '股票',
    market: market || '深圳',
    price: parseFloat(price),
    change: parseFloat(change || 0)
  }

  db.data.stocks.push(newStock)
  await db.write()

  res.json({ success: true, data: newStock })
})

// 更新股票价格
app.put('/api/stocks/:code', async (req, res) => {
  const { code } = req.params
  const { price, change } = req.body

  await db.read()

  const stockIndex = db.data.stocks.findIndex(s => s.code === code)
  if (stockIndex === -1) {
    return res.status(404).json({ success: false, message: '股票不存在' })
  }

  if (price !== undefined) {
    db.data.stocks[stockIndex].price = parseFloat(price)
  }
  if (change !== undefined) {
    db.data.stocks[stockIndex].change = parseFloat(change)
  }

  await db.write()

  res.json({ success: true, data: db.data.stocks[stockIndex] })
})

// 删除股票
app.delete('/api/stocks/:code', async (req, res) => {
  const { code } = req.params

  await db.read()

  const stockIndex = db.data.stocks.findIndex(s => s.code === code)
  if (stockIndex === -1) {
    return res.status(404).json({ success: false, message: '股票不存在' })
  }

  db.data.stocks.splice(stockIndex, 1)
  await db.write()

  res.json({ success: true, message: '股票已删除' })
})

// 获取ETF数据（使用BaoStock接口）
app.get('/api/etf', async (req, res) => {
  try {
    const { page = 1, page_size = 20 } = req.query
    
    // 调用BaoStock接口
    const baostockUrl = process.env.BAOSTOCK_API_URL || 'http://127.0.0.1:8001'
    const response = await axios.get(`${baostockUrl}/api/etf/list`, {
      params: {
        page: parseInt(page),
        page_size: parseInt(page_size),
        include_quote: true
      },
      timeout: 10000
    })

    // 检查BaoStock接口响应
    if (response.data && response.data.success) {
      // 转换数据格式以兼容前端
      const formattedEtfs = response.data.data.etfs.map(etf => {
        const quote = etf.quote || {}
        return {
          code: etf.code,
          name: etf.code_name,
          ipoDate: etf.ipoDate,
          outDate: etf.outDate,
          type: etf.type,
          status: etf.status,
          quote: {
            date: quote.date,
            open: quote.open,
            high: quote.high,
            low: quote.low,
            close: quote.close,
            preclose: quote.preclose,
            volume: quote.volume,
            amount: quote.amount,
            pctChg: quote.pctChg
          },
          currentPrice: quote.close || 0,
          changeAmount: quote.close && quote.preclose ? quote.close - quote.preclose : 0,
          changePercent: quote.pctChg || 0,
          volume: quote.volume || 0,
          turnover: quote.amount || 0,
          openPrice: quote.open || 0,
          highPrice: quote.high || 0,
          lowPrice: quote.low || 0,
          prevClose: quote.preclose || 0
        }
      })

      res.json({
        success: true,
        data: formattedEtfs,
        total: response.data.data.total,
        page: response.data.data.page,
        page_size: response.data.data.page_size,
        total_pages: response.data.data.total_pages,
        updateTime: new Date().toISOString(),
        source: 'baostock',
        type: response.data.type || '实时API数据'
      })
    } else {
      throw new Error('BaoStock接口返回数据格式错误')
    }
  } catch (error) {
    console.error('调用BaoStock ETF接口失败:', error.message)
    
    res.status(500).json({
      success: false,
      message: '获取ETF数据失败，请检查BaoStock服务是否启动',
      error: error.message
    })
  }
})

// 市场概览（桌面版 market.js 调用）
app.get('/api/market/overview', async (_, res) => {
  const codes = ['sh000001', 'sz399001', 'sz399006', 'sh000300']
  try {
    const results = await Promise.allSettled(
      codes.map(c => stockService.getStockDetail(c))
    )
    const indices = results.map((r, i) => {
      if (r.status === 'fulfilled' && r.value) {
        const d = r.value
        const price = parseFloat(d.currentPrice || 0)
        const prev = parseFloat(d.prevPrice || d.prevClose || price)
        const change = prev > 0 ? ((price - prev) / prev * 100) : 0
        return {
          code: codes[i],
          name: d.name || codes[i],
          value: price,
          price: price,
          change: change.toFixed(2),
          changePercent: change.toFixed(2),
          volume: d.volume || d.amount || 0
        }
      }
      return { code: codes[i], name: codes[i], value: 0, price: 0, change: '0', changePercent: '0', volume: 0 }
    })
    res.json({ success: true, indices, timestamp: new Date().toISOString() })
  } catch (err) {
    res.json({ success: false, message: err.message })
  }
})

// 通用AI对话（桌面版 chat 调用，支持前端传入 model 参数）
app.post('/api/chat', async (req, res) => {
  const { message, history = [], model: requestModel } = req.body
  if (!message) return res.json({ success: false, message: '消息不能为空' })

  const AI_API_BASE_URL = process.env.AI_API_BASE_URL || 'https://hiapi.online/v1'
  const AI_API_KEY = process.env.AI_API_KEY || ''
  const AI_MODEL = requestModel || process.env.AI_MODEL || 'gemini-2.5-flash-search'

  if (!AI_API_KEY) {
    return res.json({ success: true, content: '请先配置AI API密钥（AI_API_KEY）。', model: 'local' })
  }

  try {
    const today = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })
    const isImageModel = AI_MODEL.includes('image-preview')
    const systemPrompt = isImageModel
      ? `You are an image generation assistant. Today is ${today}. Generate images based on user descriptions. Use English internally for better results.`
      : `你是In Fortune AI智能助手，专注于A股市场分析、股票投资建议和金融知识解答。今天是${today}。请用专业但易懂的方式回答用户问题。回答中可以使用Markdown格式。如果涉及股票数据，请提醒用户数据可能有延迟，建议以实际交易所数据为准。`

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-10),
      { role: 'user', content: message }
    ]

    console.log(`[Chat] 使用模型: ${AI_MODEL}`)
    const response = await axios.post(
      `${AI_API_BASE_URL}/chat/completions`,
      { model: AI_MODEL, messages, temperature: 0.7, max_tokens: 8000 },
      {
        headers: { 'Authorization': `Bearer ${AI_API_KEY}`, 'Content-Type': 'application/json' },
        timeout: 60000
      }
    )

    const content = response.data?.choices?.[0]?.message?.content || '抱歉，AI暂时无法回复。'
    res.json({ success: true, content, model: AI_MODEL })
  } catch (err) {
    console.error('Chat API error:', err.message)
    res.json({ success: false, message: 'AI服务调用失败: ' + err.message })
  }
})

// 健康检查
app.get('/api/health', (_, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// ==================== AKShare Python API 路由 ====================

// 检查 Python API 服务状态
app.get('/api/akshare/status', async (_, res) => {
  try {
    const isHealthy = await akshareService.healthCheck()
    res.json({
      success: true,
      status: isHealthy ? 'connected' : 'disconnected',
      pythonApiUrl: process.env.PYTHON_API_URL || 'http://localhost:8000'
    })
  } catch (error) {
    res.json({ success: false, status: 'error', message: error.message })
  }
})

// 使用 Python API 获取 ETF 列表（替代原有接口）
app.get('/api/etf/akshare', async (_, res) => {
  try {
    const etfData = await akshareService.getETFList(1, 200)

    // 转换数据格式以兼容前端
    const formattedData = etfData.data.map(item => ({
      code: item['代码'],
      name: item['名称'],
      currentPrice: parseFloat(item['最新价']) || 0,
      changeAmount: parseFloat(item['涨跌额']) || 0,
      changePercent: parseFloat(item['涨跌幅']) || 0,
      volume: parseFloat(item['成交量']) || 0,
      turnover: parseFloat(item['成交额']) || 0,
      openPrice: parseFloat(item['开盘价']) || 0,
      highPrice: parseFloat(item['最高价']) || 0,
      lowPrice: parseFloat(item['最低价']) || 0,
      prevClose: parseFloat(item['昨收']) || 0
    }))

    res.json({
      success: true,
      data: formattedData,
      updateTime: etfData.updateTime,
      source: 'akshare'
    })
  } catch (error) {
    console.error('从 AKShare 获取ETF数据失败:', error.message)
    // 如果 Python API 失败，回退到原有方式
    try {
      const etfData = await stockService.getETFData()
      res.json({ success: true, ...etfData, source: 'fallback' })
    } catch (fallbackError) {
      res.json({ success: true, data: [], updateTime: new Date().toLocaleString('zh-CN') })
    }
  }
})

// 使用 Python API 搜索股票
app.get('/api/stocks/search/akshare', async (req, res) => {
  const { keyword } = req.query

  if (!keyword) {
    return res.json({ success: true, data: [] })
  }

  try {
    const result = await akshareService.searchStock(keyword)

    // 转换数据格式
    const formattedData = result.data.map(item => ({
      code: item['代码'] || item.code || '',
      name: item['名称'] || item.name || '',
      market: item['市场类型'] || item.market || 'A股',
      currentPrice: parseFloat(item['最新价'] || item.currentPrice || 0),
      changePercent: parseFloat(item['涨跌幅'] || item.changePercent || 0)
    }))

    res.json({ success: true, data: formattedData, source: 'akshare' })
  } catch (error) {
    console.error('从 AKShare 搜索股票失败:', error.message)
    // 回退到本地数据库搜索
    await db.read()
    const results = db.data.stocks.filter(stock =>
      stock.code.includes(keyword) || stock.name.includes(keyword)
    )
    res.json({ success: true, data: results, source: 'local' })
  }
})

// 使用 Python API 获取股票实时行情
app.get('/api/stocks/realtime/:code', async (req, res) => {
  const { code } = req.params

  try {
    const result = await akshareService.getStockRealtime(code)
    res.json({ success: true, data: result.data, source: 'akshare' })
  } catch (error) {
    console.error('从 AKShare 获取实时行情失败:', error.message)
    res.status(500).json({ success: false, message: error.message })
  }
})

// analysis-service.js 已被删除，相关API路由已移除

// ==================== 用户管理 API ====================

// MD5 加密函数
function md5(str) {
  return crypto.createHash('md5').update(str).digest('hex')
}

// 生成唯一ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

// 获取当前时间字符串
function getCurrentTime() {
  const now = new Date()
  return now.getFullYear() + '-' + 
    String(now.getMonth() + 1).padStart(2, '0') + '-' + 
    String(now.getDate()).padStart(2, '0') + ' ' + 
    String(now.getHours()).padStart(2, '0') + ':' + 
    String(now.getMinutes()).padStart(2, '0') + ':' + 
    String(now.getSeconds()).padStart(2, '0')
}

// 登录接口
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body
    
    if (!username || !password) {
      return res.status(400).json({ success: false, message: '用户名和密码不能为空' })
    }
    
    await usersDb.read()
    const users = usersDb.data || []
    
    const user = users.find(u => u.username === username)
    if (!user) {
      return res.status(401).json({ success: false, message: '用户名或密码错误' })
    }
    
    const encryptedPassword = md5(password)
    if (user.password !== encryptedPassword) {
      return res.status(401).json({ success: false, message: '用户名或密码错误' })
    }
    
    if (user.status === 'disabled') {
      return res.status(403).json({ success: false, message: '账号已被禁用，请联系管理员' })
    }
    
    // 更新最后登录时间
    user.lastLoginAt = getCurrentTime()
    user.lastLoginIp = req.ip || req.connection.remoteAddress
    await usersDb.write()
    
    // 返回用户信息（不包含密码）
    const { password: _, ...userWithoutPassword } = user
    
    res.json({ 
      success: true, 
      message: '登录成功',
      data: userWithoutPassword
    })
  } catch (error) {
    console.error('[Auth] 登录失败:', error)
    res.status(500).json({ success: false, message: '登录失败，请稍后重试' })
  }
})

// 获取当前登录用户信息
app.get('/api/auth/me', async (req, res) => {
  try {
    // 这里可以实现基于 token 的验证
    // 简化版：暂时返回空，前端从 localStorage 获取
    res.json({ success: true, data: null })
  } catch (error) {
    console.error('[Auth] 获取用户信息失败:', error)
    res.status(500).json({ success: false, message: '获取用户信息失败' })
  }
})

// 获取所有用户列表
app.get('/api/users', async (req, res) => {
  try {
    await usersDb.read()
    const users = usersDb.data || []
    
    // 返回用户信息（不包含密码）
    const usersWithoutPassword = users.map(user => {
      const { password, ...userWithoutPassword } = user
      return userWithoutPassword
    })
    
    res.json({ success: true, data: usersWithoutPassword })
  } catch (error) {
    console.error('[Users] 获取用户列表失败:', error)
    res.status(500).json({ success: false, message: '获取用户列表失败' })
  }
})

// 获取单个用户详情
app.get('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params
    await usersDb.read()
    const users = usersDb.data || []
    
    const user = users.find(u => u.id === id)
    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' })
    }
    
    const { password, ...userWithoutPassword } = user
    res.json({ success: true, data: userWithoutPassword })
  } catch (error) {
    console.error('[Users] 获取用户详情失败:', error)
    res.status(500).json({ success: false, message: '获取用户详情失败' })
  }
})

// 创建用户
app.post('/api/users', async (req, res) => {
  try {
    const { username, password, nickname, email, phone, roles, status, createdBy } = req.body
    
    if (!username || !password) {
      return res.status(400).json({ success: false, message: '用户名和密码不能为空' })
    }
    
    await usersDb.read()
    const users = usersDb.data || []
    
    // 检查用户名是否已存在
    if (users.find(u => u.username === username)) {
      return res.status(400).json({ success: false, message: '用户名已存在' })
    }
    
    const now = getCurrentTime()
    const newUser = {
      id: generateId(),
      username,
      password: md5(password),
      nickname: nickname || username,
      avatar: '',
      email: email || '',
      phone: phone || '',
      status: status || 'enabled',
      roles: roles || ['普通用户'],
      createdAt: now,
      createdBy: createdBy || 'system',
      updatedAt: now,
      updatedBy: createdBy || 'system',
      lastLoginAt: '',
      lastLoginIp: ''
    }
    
    users.push(newUser)
    await usersDb.write()
    
    const { password: _, ...userWithoutPassword } = newUser
    res.json({ success: true, message: '用户创建成功', data: userWithoutPassword })
  } catch (error) {
    console.error('[Users] 创建用户失败:', error)
    res.status(500).json({ success: false, message: '创建用户失败' })
  }
})

// 更新用户
app.put('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { username, password, nickname, email, phone, roles, status, updatedBy } = req.body
    
    await usersDb.read()
    const users = usersDb.data || []
    
    const userIndex = users.findIndex(u => u.id === id)
    if (userIndex === -1) {
      return res.status(404).json({ success: false, message: '用户不存在' })
    }
    
    const user = users[userIndex]
    
    // 如果修改用户名，检查是否与其他用户冲突
    if (username && username !== user.username) {
      if (users.find(u => u.username === username && u.id !== id)) {
        return res.status(400).json({ success: false, message: '用户名已存在' })
      }
      user.username = username
    }
    
    // 更新其他字段
    if (password) user.password = md5(password)
    if (nickname !== undefined) user.nickname = nickname
    if (email !== undefined) user.email = email
    if (phone !== undefined) user.phone = phone
    if (roles) user.roles = roles
    if (status) user.status = status
    
    user.updatedAt = getCurrentTime()
    user.updatedBy = updatedBy || 'system'
    
    await usersDb.write()
    
    const { password: _, ...userWithoutPassword } = user
    res.json({ success: true, message: '用户更新成功', data: userWithoutPassword })
  } catch (error) {
    console.error('[Users] 更新用户失败:', error)
    res.status(500).json({ success: false, message: '更新用户失败' })
  }
})

// 删除用户
app.delete('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params
    
    await usersDb.read()
    const users = usersDb.data || []
    
    const userIndex = users.findIndex(u => u.id === id)
    if (userIndex === -1) {
      return res.status(404).json({ success: false, message: '用户不存在' })
    }
    
    // 不允许删除 admin 用户
    if (users[userIndex].username === 'admin') {
      return res.status(403).json({ success: false, message: '不能删除系统管理员账号' })
    }
    
    users.splice(userIndex, 1)
    await usersDb.write()
    
    res.json({ success: true, message: '用户删除成功' })
  } catch (error) {
    console.error('[Users] 删除用户失败:', error)
    res.status(500).json({ success: false, message: '删除用户失败' })
  }
})

// 启用/禁用用户
app.patch('/api/users/:id/status', async (req, res) => {
  try {
    const { id } = req.params
    const { status, updatedBy } = req.body
    
    if (!status || !['enabled', 'disabled'].includes(status)) {
      return res.status(400).json({ success: false, message: '状态值无效' })
    }
    
    await usersDb.read()
    const users = usersDb.data || []
    
    const userIndex = users.findIndex(u => u.id === id)
    if (userIndex === -1) {
      return res.status(404).json({ success: false, message: '用户不存在' })
    }
    
    // 不允许禁用 admin 用户
    if (users[userIndex].username === 'admin' && status === 'disabled') {
      return res.status(403).json({ success: false, message: '不能禁用系统管理员账号' })
    }
    
    users[userIndex].status = status
    users[userIndex].updatedAt = getCurrentTime()
    users[userIndex].updatedBy = updatedBy || 'system'
    
    await usersDb.write()
    
    const { password, ...userWithoutPassword } = users[userIndex]
    res.json({ 
      success: true, 
      message: status === 'enabled' ? '用户已启用' : '用户已禁用',
      data: userWithoutPassword
    })
  } catch (error) {
    console.error('[Users] 更新用户状态失败:', error)
    res.status(500).json({ success: false, message: '更新用户状态失败' })
  }
})

// 角色枚举值
app.get('/api/users/roles/enums', async (req, res) => {
  try {
    const roles = [
      { value: '系统管理员', label: '系统管理员' },
      { value: '普通用户', label: '普通用户' },
      { value: '数据分析师', label: '数据分析师' },
      { value: '财务管理员', label: '财务管理员' },
      { value: '运营人员', label: '运营人员' }
    ]
    res.json({ success: true, data: roles })
  } catch (error) {
    console.error('[Users] 获取角色枚举失败:', error)
    res.status(500).json({ success: false, message: '获取角色枚举失败' })
  }
})

// ==================== 服务管理 API ====================

// 获取所有服务状态
app.get('/api/services', async (_, res) => {
  try {
    const services = await serviceManager.getAllServiceStatus();
    res.json({ success: true, data: services });
  } catch (error) {
    console.error('[ServiceManager] 获取服务状态失败:', error);
    res.status(500).json({ success: false, message: '获取服务状态失败' });
  }
});

// 获取单个服务状态
app.get('/api/services/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const status = await serviceManager.checkServiceStatus(id);
    res.json({ success: true, data: status });
  } catch (error) {
    console.error('[ServiceManager] 获取服务状态失败:', error);
    res.status(500).json({ success: false, message: '获取服务状态失败' });
  }
});

// 启动服务
app.post('/api/services/:id/start', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await serviceManager.startService(id);
    res.json(result);
  } catch (error) {
    console.error('[ServiceManager] 启动服务失败:', error);
    res.status(500).json({ success: false, message: '启动服务失败' });
  }
});

// 停止服务
app.post('/api/services/:id/stop', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await serviceManager.stopService(id);
    res.json(result);
  } catch (error) {
    console.error('[ServiceManager] 停止服务失败:', error);
    res.status(500).json({ success: false, message: '停止服务失败' });
  }
});

// 重启服务
app.post('/api/services/:id/restart', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await serviceManager.restartService(id);
    res.json(result);
  } catch (error) {
    console.error('[ServiceManager] 重启服务失败:', error);
    res.status(500).json({ success: false, message: '重启服务失败' });
  }
});

// ============================================
// 回测 API (代理到 Python ML 回测引擎)
// ============================================

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8002'

// POST /api/backtest - 运行策略回测
app.post('/api/backtest', async (req, res) => {
  try {
    const {
      symbol = '000001.SZ',
      strategy = 'ma',
      startDate,
      endDate,
      initialCapital = 1000000,
      params = {}
    } = req.body

    // 1) 获取历史数据
    const cleanSymbol = symbol.replace(/^(sh|sz)/, '')
    let historyData = []

    try {
      const akResp = await axios.get(`http://localhost:8000/api/a/stock/history/${cleanSymbol}`, {
        params: { period: 'daily', limit: 500 },
        timeout: 15000
      })
      if (akResp.data?.success && akResp.data?.data) {
        historyData = akResp.data.data
      }
    } catch (akErr) {
      console.warn('[Backtest] AKShare fetch failed, using synthetic data:', akErr.message)
    }

    // 如果无法获取真实数据，生成模拟数据用于演示
    if (historyData.length < 60) {
      console.log('[Backtest] Generating synthetic data for demo...')
      const n = 500
      let close = 100
      historyData = []
      const baseDate = new Date('2023-01-01')
      for (let i = 0; i < n; i++) {
        close = close * (1 + (Math.random() - 0.48) * 0.03)
        close = Math.max(close, 10)
        const d = new Date(baseDate)
        d.setDate(d.getDate() + i)
        historyData.push({
          date: d.toISOString().split('T')[0],
          open: +(close * (1 + (Math.random() - 0.5) * 0.01)).toFixed(2),
          high: +(close * (1 + Math.random() * 0.02)).toFixed(2),
          low: +(close * (1 - Math.random() * 0.02)).toFixed(2),
          close: +close.toFixed(2),
          volume: Math.floor(Math.random() * 50000000 + 1000000),
        })
      }
    }

    // 2) 在 Node.js 端执行简化版回测 (不依赖 Python)
    const result = runSimpleBacktest(historyData, strategy, params, initialCapital)

    res.json({
      success: true,
      data: result,
      meta: { symbol, strategy, dataPoints: historyData.length }
    })

  } catch (error) {
    console.error('[Backtest] Error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// 内置简化回测引擎 (Node.js版)
function runSimpleBacktest(data, strategyType, params, initialCapital) {
  const cash = { value: initialCapital }
  let shares = 0
  let avgCost = 0
  const trades = []
  const equityCurve = []
  let totalCommission = 0
  const commissionRate = 0.0003
  const stampTax = 0.001

  // 预计算指标
  const closes = data.map(d => d.close)
  const smaShort = rollingMean(closes, params.shortWindow || 5)
  const smaLong = rollingMean(closes, params.longWindow || 20)

  for (let i = 1; i < data.length; i++) {
    const price = data[i].close
    let signal = 0

    switch (strategyType) {
      case 'ma':
        if (smaShort[i] > smaLong[i] && smaShort[i - 1] <= smaLong[i - 1]) signal = 1
        if (smaShort[i] < smaLong[i] && smaShort[i - 1] >= smaLong[i - 1]) signal = -1
        break
      case 'macd': {
        const emaFast = ema(closes.slice(0, i + 1), params.fast || 12)
        const emaSlow = ema(closes.slice(0, i + 1), params.slow || 26)
        const macdLine = emaFast - emaSlow
        const emaFastPrev = ema(closes.slice(0, i), params.fast || 12)
        const emaSlowPrev = ema(closes.slice(0, i), params.slow || 26)
        const macdPrev = emaFastPrev - emaSlowPrev
        if (macdLine > 0 && macdPrev <= 0) signal = 1
        if (macdLine < 0 && macdPrev >= 0) signal = -1
        break
      }
      case 'rsi': {
        const rsiVal = calcRSI(closes.slice(0, i + 1), params.period || 14)
        const rsiPrev = calcRSI(closes.slice(0, i), params.period || 14)
        if (rsiVal > (params.oversold || 30) && rsiPrev <= (params.oversold || 30)) signal = 1
        if (rsiVal < (params.overbought || 70) && rsiPrev >= (params.overbought || 70)) signal = -1
        break
      }
      default:
        if (smaShort[i] > smaLong[i] && smaShort[i - 1] <= smaLong[i - 1]) signal = 1
        if (smaShort[i] < smaLong[i] && smaShort[i - 1] >= smaLong[i - 1]) signal = -1
    }

    // 执行交易
    if (signal === 1 && shares === 0) {
      const size = Math.floor(cash.value * 0.95 / price / 100) * 100
      if (size >= 100) {
        const commission = Math.max(price * size * commissionRate, 5)
        cash.value -= price * size + commission
        shares = size
        avgCost = price
        totalCommission += commission
        trades.push({ date: data[i].date, side: 'BUY', price, quantity: size, commission: +commission.toFixed(2) })
      }
    } else if (signal === -1 && shares > 0) {
      const commission = Math.max(price * shares * commissionRate, 5) + price * shares * stampTax
      cash.value += price * shares - commission
      totalCommission += commission
      trades.push({ date: data[i].date, side: 'SELL', price, quantity: shares, commission: +commission.toFixed(2), pnl: +((price - avgCost) * shares).toFixed(2) })
      shares = 0
      avgCost = 0
    }

    const portfolioValue = cash.value + shares * price
    if (i % Math.max(1, Math.floor(data.length / 200)) === 0 || i === data.length - 1) {
      equityCurve.push({ date: data[i].date, value: +portfolioValue.toFixed(2) })
    }
  }

  // 计算最终指标
  const finalValue = cash.value + shares * closes[closes.length - 1]
  const totalReturn = (finalValue / initialCapital - 1) * 100
  const dailyReturns = []
  for (let i = 1; i < equityCurve.length; i++) {
    dailyReturns.push(equityCurve[i].value / equityCurve[i - 1].value - 1)
  }
  const avgReturn = dailyReturns.reduce((a, b) => a + b, 0) / (dailyReturns.length || 1)
  const stdReturn = Math.sqrt(dailyReturns.reduce((a, b) => a + (b - avgReturn) ** 2, 0) / (dailyReturns.length || 1))
  const sharpe = stdReturn > 0 ? (avgReturn / stdReturn * Math.sqrt(252)) : 0

  let maxDD = 0
  let peak = equityCurve[0]?.value || initialCapital
  for (const pt of equityCurve) {
    if (pt.value > peak) peak = pt.value
    const dd = (pt.value - peak) / peak
    if (dd < maxDD) maxDD = dd
  }

  return {
    strategy: strategyType,
    params,
    returns: {
      total_return_pct: +totalReturn.toFixed(4),
      annual_return_pct: +(totalReturn / (data.length / 252)).toFixed(4),
      benchmark_return_pct: +((closes[closes.length - 1] / closes[0] - 1) * 100).toFixed(4),
    },
    risk: {
      sharpe_ratio: +sharpe.toFixed(4),
      max_drawdown_pct: +(maxDD * 100).toFixed(4),
      annual_volatility_pct: +(stdReturn * Math.sqrt(252) * 100).toFixed(4),
    },
    trading: {
      total_trades: trades.length,
      total_commission: +totalCommission.toFixed(2),
    },
    portfolio: {
      initial_capital: initialCapital,
      final_value: +finalValue.toFixed(2),
    },
    equity_curve: equityCurve,
    trades_log: trades.slice(-50),
  }
}

// 辅助函数
function rollingMean(arr, window) {
  const result = new Array(arr.length).fill(NaN)
  for (let i = window - 1; i < arr.length; i++) {
    let sum = 0
    for (let j = i - window + 1; j <= i; j++) sum += arr[j]
    result[i] = sum / window
  }
  return result
}

function ema(arr, span) {
  if (arr.length === 0) return 0
  const k = 2 / (span + 1)
  let val = arr[0]
  for (let i = 1; i < arr.length; i++) val = arr[i] * k + val * (1 - k)
  return val
}

function calcRSI(arr, period) {
  if (arr.length < period + 1) return 50
  let gains = 0, losses = 0
  for (let i = arr.length - period; i < arr.length; i++) {
    const diff = arr[i] - arr[i - 1]
    if (diff > 0) gains += diff; else losses -= diff
  }
  gains /= period
  losses /= period
  if (losses === 0) return 100
  const rs = gains / losses
  return 100 - 100 / (1 + rs)
}

// ============================================
// ML 推理代理 (转发到 Python inference_service)
// ============================================

// POST /api/ml/predict - 股票价格预测
app.post('/api/ml/predict', async (req, res) => {
  try {
    const resp = await axios.post(`${ML_SERVICE_URL}/predict`, req.body, { timeout: 30000 })
    res.json(resp.data)
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      res.status(503).json({ success: false, message: 'ML推理服务未启动，请运行: python -m ml_services.inference_service' })
    } else {
      res.status(500).json({ success: false, message: error.message })
    }
  }
})

// POST /api/ml/analyze - 综合股票分析
app.post('/api/ml/analyze', async (req, res) => {
  try {
    const resp = await axios.post(`${ML_SERVICE_URL}/analyze`, req.body, { timeout: 30000 })
    res.json(resp.data)
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      res.status(503).json({ success: false, message: 'ML推理服务未启动' })
    } else {
      res.status(500).json({ success: false, message: error.message })
    }
  }
})

// GET /api/ml/health - ML服务健康检查
app.get('/api/ml/health', async (req, res) => {
  try {
    const resp = await axios.get(`${ML_SERVICE_URL}/health`, { timeout: 5000 })
    res.json(resp.data)
  } catch (error) {
    res.json({ status: 'offline', message: 'ML推理服务未启动' })
  }
})

// ============================================
// 静态文件服务 - Vue 前端 (生产模式)
// ============================================
const distPath = path.join(__dirname, '..', 'dist')
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath))
  // Vue Router HTML5 History 模式: 所有非 /api 路径返回 index.html
  app.get(/^\/(?!api).*/, (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'))
  })
  console.log('📦 生产模式: 已加载 Vue 前端 (dist/)')
} else {
  // 开发模式: API Landing Page
  app.get('/', (req, res) => {
    res.json({
      service: 'In Fortune AI API Server',
      status: 'running',
      mode: 'development',
      hint: '前端请访问 Vite 开发服务器 http://localhost:5173',
      endpoints: {
        health: '/api/health',
        search: '/api/search?keyword=',
        backtest: 'POST /api/backtest',
        ml_health: '/api/ml/health',
        ml_predict: 'POST /api/ml/predict',
        ml_analyze: 'POST /api/ml/analyze',
        ws: 'ws://localhost:' + PORT + '/ws',
      }
    })
  })
}

// ============================================
// 启动服务器 (HTTP + WebSocket)
// ============================================
const httpServer = createServer(app)

// 初始化 WebSocket 服务
try {
  realtimeService.init(httpServer)
  console.log('✅ WebSocket 实时推送服务已启动')
} catch (wsErr) {
  console.warn('⚠️ WebSocket 服务启动失败(非致命):', wsErr.message)
}

// WebSocket 统计端点
app.get('/api/ws/stats', (req, res) => {
  try {
    res.json({ success: true, data: realtimeService.getStats() })
  } catch (e) {
    res.json({ success: true, data: { totalClients: 0, channels: {} } })
  }
})

httpServer.listen(PORT, () => {
  console.log(`🚀 In Fortune AI API服务器运行在 http://localhost:${PORT}`)
  console.log(`📊 API文档: http://localhost:${PORT}/api/health`)
  console.log(`🔌 WebSocket: ws://localhost:${PORT}/ws`)
  console.log(`🤖 ML代理: http://localhost:${PORT}/api/ml/health`)
  console.log(`📈 回测API: POST http://localhost:${PORT}/api/backtest`)
})
