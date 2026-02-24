import axios from 'axios'

// 股票数据获取服务
class StockDataService {
  constructor() {
    this.cache = new Map()
    this.cacheTimeout = 60 * 60 * 1000 // 1小时缓存
  }

  // 获取股票实时价格
  async getStockPrice(symbol, forceMarket = null) {
    const cacheKey = `price_${symbol}`
    const cached = this.cache.get(cacheKey)

    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data
    }

    try {
      console.log(`开始获取${symbol}数据...`)

      let market = forceMarket
      if (!market) {
        // 根据代码推断市场
        if (symbol.startsWith('sh') || symbol.startsWith('sz')) {
          market = 'A股'
        } else if (symbol.startsWith('hk')) {
          market = '港股'
        } else if (symbol.startsWith('us') || symbol.includes('.OQ') || symbol.includes('.N')) {
          market = '美股'
        } else if (/^\d{6}$/.test(symbol)) {
          market = '场外基金'
        }
      }

      console.log(`${symbol} 所在市场: ${market}`)

      // 根据市场调用不同的API
      if (market === '场外基金') {
        return await this.getFundPrice(symbol)
      } else if (market === 'A股' || market === 'a-share') {
        return await this.getStockPriceFromEastMoney(symbol)
      } else if (market === '港股') {
        return await this.getHKStockPrice(symbol)
      } else if (market === '美股') {
        return await this.getUSStockPrice(symbol)
      } else {
        console.log(`${symbol} 市场类型未知: ${market}`)
        return { currentPrice: '', prevClose: '', updateTime: '市场类型未知' }
      }
    } catch (error) {
      console.error(`获取${symbol}价格失败:`, error.message)
      return { currentPrice: '', prevClose: '', updateTime: '获取失败' }
    }
  }

  // 获取A股价格
  async getStockPriceFromEastMoney(symbol) {
    try {
      console.log(`获取A股${symbol}数据...`)
      const cleanSymbol = symbol.replace(/^(sh|sz)/, '')
      const market = symbol.startsWith('sh') ? '1' : '0'
      const url = `https://push2.eastmoney.com/api/qt/stock/get?secid=${market}.${cleanSymbol}&fields=f43,f44,f45,f46,f47,f48,f49,f50,f51,f52,f60`

      const response = await axios.get(url, {
        timeout: 5000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://quote.eastmoney.com/'
        }
      })

      const data = response.data
      if (data.data && data.data.f43) {
        let currentPrice = parseFloat(data.data.f43)
        let prevClose = data.data.f60 ? parseFloat(data.data.f60) : currentPrice

        // 处理价格单位 - 基于ETF类型智能转换
        if (currentPrice > 10000) {
          // 价格大于10000，通常是普通股票，除以100
          currentPrice = currentPrice / 100
        } else if (currentPrice >= 100 && currentPrice <= 9999) {
          // 价格在100-9999之间，大部分ETF都除以1000
          currentPrice = currentPrice / 1000
        }

        if (prevClose > 10000) {
          prevClose = prevClose / 100
        } else if (prevClose >= 100 && prevClose <= 9999) {
          prevClose = prevClose / 1000
        }

        const result = {
          currentPrice: parseFloat(currentPrice.toFixed(4)).toString(),
          prevClose: parseFloat(prevClose.toFixed(4)).toString(),
          updateTime: new Date().toLocaleString()
        }

        this.cache.set(`price_${symbol}`, {
          data: result,
          timestamp: Date.now()
        })

        console.log(`成功获取A股${symbol}价格: ${result.currentPrice}`)
        return result
      } else {
        console.log(`A股${symbol}数据为空`)
      }
    } catch (error) {
      console.error(`获取A股${symbol}价格失败:`, error.message)
    }

    return { currentPrice: '', prevClose: '', updateTime: '' }
  }

  // 获取港股价格
  async getHKStockPrice(symbol) {
    try {
      console.log(`获取港股${symbol}数据...`)
      const cleanSymbol = symbol.replace('hk', '')

      // 尝试多个API
      const methods = [
        () => this.getHKFromSina(cleanSymbol),
        () => this.getHKFromTencent(cleanSymbol),
        () => this.getHKFromEastMoney(cleanSymbol)
      ]

      for (const method of methods) {
        try {
          const result = await method()
          if (result && result.currentPrice) {
            this.cache.set(`price_${symbol}`, {
              data: result,
              timestamp: Date.now()
            })
            return result
          }
        } catch (error) {
          console.log(`港股方法失败: ${error.message}`)
        }
      }
    } catch (error) {
      console.error(`获取港股${symbol}价格失败:`, error.message)
    }

    return { currentPrice: '', prevClose: '', updateTime: '' }
  }

  // 新浪财经港股API
  async getHKFromSina(cleanSymbol) {
    console.log(`尝试新浪财经获取港股${cleanSymbol}...`)
    const url = `https://hq.sinajs.cn/list=hk${cleanSymbol}`

    const response = await axios.get(url, {
      timeout: 8000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://finance.sina.com.cn/'
      }
    })

    const data = response.data
    const match = data.match(/="([^"]+)"/)

    if (match && match[1]) {
      const fields = match[1].split(',')

      if (fields.length >= 7) {
        let currentPrice = parseFloat(fields[6])
        let prevClose = parseFloat(fields[3])

        if (isNaN(currentPrice) || currentPrice < 0.1 || currentPrice > 10000) {
          throw new Error('港股价格数据异常')
        }

        return {
          currentPrice: parseFloat(currentPrice.toFixed(4)).toString(),
          prevClose: parseFloat(prevClose.toFixed(4)).toString(),
          updateTime: new Date().toLocaleString()
        }
      }
    }

    throw new Error('新浪财经港股解析失败')
  }

  // 腾讯财经港股API
  async getHKFromTencent(cleanSymbol) {
    console.log(`尝试腾讯财经获取港股${cleanSymbol}...`)
    const url = `https://qt.gtimg.cn/q=hk${cleanSymbol}`

    const response = await axios.get(url, {
      timeout: 8000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://finance.qq.com/'
      }
    })

    const data = response.data
    const match = data.match(/="([^"]+)"/)

    if (match && match[1]) {
      const fields = match[1].split('~')

      if (fields.length >= 5) {
        let currentPrice = parseFloat(fields[3])
        let prevClose = parseFloat(fields[4])

        if (isNaN(currentPrice) || currentPrice < 0.1 || currentPrice > 10000) {
          throw new Error('腾讯港股价格数据异常')
        }

        return {
          currentPrice: parseFloat(currentPrice.toFixed(4)).toString(),
          prevClose: parseFloat(prevClose.toFixed(4)).toString(),
          updateTime: new Date().toLocaleString()
        }
      }
    }

    throw new Error('腾讯财经港股解析失败')
  }

  // 东方财富港股API
  async getHKFromEastMoney(cleanSymbol) {
    console.log(`尝试东方财富获取港股${cleanSymbol}...`)
    const url = `https://push2.eastmoney.com/api/qt/stock/get?secid=116.${cleanSymbol}&fields=f43,f44,f45,f46,f47,f48,f49,f50,f51,f52,f60`

    const response = await axios.get(url, {
      timeout: 5000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://quote.eastmoney.com/'
      }
    })

    const data = response.data
    if (data.data && data.data.f43) {
      let currentPrice = parseFloat(data.data.f43)
      let prevClose = data.data.f60 ? parseFloat(data.data.f60) : currentPrice

      if (isNaN(currentPrice) || currentPrice < 0.1 || currentPrice > 10000) {
        throw new Error('东方财富港股价格数据异常')
      }

      return {
        currentPrice: parseFloat(currentPrice.toFixed(4)).toString(),
        prevClose: parseFloat(prevClose.toFixed(4)).toString(),
        updateTime: new Date().toLocaleString()
      }
    }

    throw new Error('东方财富港股解析失败')
  }

  // 获取美股价格
  async getUSStockPrice(symbol) {
    try {
      console.log(`获取美股${symbol}数据...`)
      const cleanSymbol = symbol.replace('us', '').replace('.OQ', '').replace('.N', '')

      const url = `https://qt.gtimg.cn/q=us${cleanSymbol}`

      const response = await axios.get(url, {
        timeout: 8000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://finance.qq.com/'
        }
      })

      const data = response.data
      const match = data.match(/="([^"]+)"/)

      if (match && match[1]) {
        const fields = match[1].split('~')

        if (fields.length >= 2) {
          let currentPrice = parseFloat(fields[1])
          let prevClose = fields.length > 2 ? parseFloat(fields[2]) : currentPrice

          if (isNaN(currentPrice) || currentPrice < 0.1 || currentPrice > 10000) {
            if (fields.length >= 7) {
              const altCurrentPrice = parseFloat(fields[5])
              const altPrevClose = parseFloat(fields[4])

              if (!isNaN(altCurrentPrice) && altCurrentPrice > 0.1 && altCurrentPrice < 10000) {
                currentPrice = altCurrentPrice
                prevClose = altPrevClose
              }
            }
          }

          if (isNaN(currentPrice) || currentPrice < 0.1 || currentPrice > 10000) {
            throw new Error('美股价格数据异常')
          }

          const result = {
            currentPrice: parseFloat(currentPrice.toFixed(4)).toString(),
            prevClose: parseFloat(prevClose.toFixed(4)).toString(),
            updateTime: new Date().toLocaleString()
          }

          this.cache.set(`price_${symbol}`, {
            data: result,
            timestamp: Date.now()
          })

          console.log(`成功获取美股${symbol}: ${result.currentPrice}`)
          return result
        }
      }
    } catch (error) {
      console.error(`获取美股${symbol}价格失败:`, error.message)
    }

    return { currentPrice: '', prevClose: '', updateTime: '' }
  }

  // 获取基金价格
  async getFundPrice(fundCode) {
    try {
      console.log(`获取基金${fundCode}数据...`)
      const url = `http://fund.eastmoney.com/pingzhongdata/${fundCode}.js`

      const response = await axios.get(url, {
        timeout: 8000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://fund.eastmoney.com/'
        }
      })

      const data = response.data

      if (data.includes('<!doctype html>') || data.includes('<html>')) {
        return { currentPrice: '', prevClose: '', updateTime: '基金不存在' }
      }

      const trendMatch = data.match(/var Data_netWorthTrend = \[([\s\S]*?)\]/)

      if (trendMatch) {
        const trendData = JSON.parse('[' + trendMatch[1] + ']')

        if (trendData.length > 0) {
          const latest = trendData[trendData.length - 1]
          const previous = trendData.length > 1 ? trendData[trendData.length - 2] : latest

          let currentPrice = parseFloat(latest.y)
          let prevClose = parseFloat(previous.y)

          if (currentPrice < 0.01 || currentPrice > 100) {
            return { currentPrice: '', prevClose: '', updateTime: '净值异常' }
          }

          const result = {
            currentPrice: parseFloat(currentPrice.toFixed(4)).toString(),
            prevClose: parseFloat(prevClose.toFixed(4)).toString(),
            updateTime: new Date().toLocaleString()
          }

          this.cache.set(`price_${fundCode}`, {
            data: result,
            timestamp: Date.now()
          })

          console.log(`成功获取基金${fundCode}: ${result.currentPrice}`)
          return result
        }
      }
    } catch (error) {
      console.error(`获取基金${fundCode}价格失败:`, error.message)
    }

    return { currentPrice: '', prevClose: '', updateTime: '' }
  }

  // 获取移动平均线数据
  async getMAData(symbol, periods = [5, 10, 20, 30, 50]) {
    const cacheKey = `ma_${symbol}`
    const cached = this.cache.get(cacheKey)

    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      console.log(`从缓存获取${symbol}MA数据:`, cached.data)
      return cached.data
    }

    console.log(`开始获取${symbol}MA数据...`)

    try {
      // 尝试多种API方案，按优先级排序
      const maData = await this.getMADataWithFallback(symbol, periods)
      
      if (maData && Object.values(maData).some(value => value !== '')) {
        this.cache.set(cacheKey, {
          data: maData,
          timestamp: Date.now()
        })
        console.log(`成功获取${symbol}MA数据:`, maData)
        return maData
      } else {
        console.log(`所有API都无法获取${symbol}的有效MA数据`)
      }
    } catch (error) {
      console.error(`获取${symbol}MA数据失败:`, error.message)
      console.error(`错误详情:`, error.stack)
    }

    // 返回空的MA数据
    const emptyMA = { MA5: '', MA10: '', MA20: '', MA30: '', MA50: '' }
    console.log(`为${symbol}返回空MA数据:`, emptyMA)
    this.cache.set(cacheKey, { data: emptyMA, timestamp: Date.now() })
    return emptyMA
  }

  // 带故障转移的MA数据获取
  async getMADataWithFallback(symbol, periods) {
    const apiMethods = []

    // 根据市场类型确定API方法优先级
    if (symbol.startsWith('sh') || symbol.startsWith('sz')) {
      // A股：东方财富 > 腾讯财经 > 新浪财经
      apiMethods.push(
        () => this.getAStockMADataFromEastMoney(symbol, periods),
        () => this.getAStockMADataFromTencent(symbol, periods),
        () => this.getAStockMADataFromSina(symbol, periods)
      )
    } else if (symbol.startsWith('us') || symbol.includes('.OQ') || symbol.includes('.N')) {
      // 美股：东方财富 > 腾讯财经
      apiMethods.push(
        () => this.getUSStockMAData(symbol, periods),
        () => this.getUSStockMADataFromTencent(symbol, periods)
      )
    } else if (symbol.startsWith('hk')) {
      // 港股：东方财富 > 腾讯财经 > 新浪财经
      apiMethods.push(
        () => this.getHKStockMAData(symbol, periods),
        () => this.getHKStockMADataFromTencent(symbol, periods),
        () => this.getHKStockMADataFromSina(symbol, periods)
      )
    } else if (/^\d{6}$/.test(symbol)) {
      // 场外基金：东方财富
      apiMethods.push(
        () => this.getFundMAData(symbol, periods)
      )
    } else {
      console.log(`无法识别${symbol}的市场类型，跳过MA数据获取`)
      return { MA5: '', MA10: '', MA20: '', MA30: '', MA50: '' }
    }

    // 按优先级尝试不同的API
    for (let i = 0; i < apiMethods.length; i++) {
      try {
        console.log(`尝试第${i + 1}种API方案获取${symbol}MA数据...`)
        const maData = await apiMethods[i]()
        
        // 检查是否获取到有效数据
        if (maData && Object.values(maData).some(value => value !== '')) {
          console.log(`第${i + 1}种API方案成功获取${symbol}MA数据`)
          return maData
        }
      } catch (error) {
        console.log(`第${i + 1}种API方案失败:`, error.message)
      }
    }

    console.log(`所有API方案都无法获取${symbol}的有效MA数据`)
    return { MA5: '', MA10: '', MA20: '', MA30: '', MA50: '' }
  }

  // A股MA数据获取方法 - 东方财富
  async getAStockMADataFromEastMoney(symbol, periods) {
    console.log(`处理A股${symbol}的MA数据获取（东方财富API）`)
    const cleanSymbol = symbol.replace(/^(sh|sz)/, '')
    const market = symbol.startsWith('sh') ? '1' : '0'
    const url = `https://push2his.eastmoney.com/api/qt/stock/kline/get?secid=${market}.${cleanSymbol}&ut=fa5fd1943c7b386f172d6893dbfba10b&fields1=f1,f2,f3,f4,f5,f6&fields2=f51,f52,f53,f54,f55,f56&klt=101&fqt=1&end=20991231&lmt=120`

    console.log(`调用A股MA数据API: ${url}`)
    
    const response = await axios.get(url, {
      timeout: 8000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://quote.eastmoney.com/'
      }
    })

    const data = response.data
    console.log(`A股${symbol}API响应状态:`, data.rc, data.rt)
    
    if (data.data && data.data.klines) {
      const klines = data.data.klines
      console.log(`A股${symbol}获取到${klines.length}条K线数据`)
      
      const prices = klines.map(kline => {
        const parts = kline.split(',')
        const price = parseFloat(parts[4])
        console.log(`K线数据: 日期=${parts[0]}, 收盘价=${price}`)
        return price
      })

      const maData = {}
      periods.forEach(period => {
        if (prices.length >= period) {
          const ma = prices.slice(-period).reduce((sum, price) => sum + price, 0) / period
          const formattedMA = parseFloat(ma.toFixed(4))
          maData[`MA${period}`] = formattedMA.toString()
          console.log(`计算MA${period}: ${formattedMA}`)
        } else {
          maData[`MA${period}`] = ''
          console.log(`数据不足，无法计算MA${period}，需要${period}条数据，实际有${prices.length}条`)
        }
      })

      return maData
    } else {
      console.log(`A股${symbol}K线数据为空或格式错误`)
      if (data.data) {
        console.log('API返回数据:', JSON.stringify(data.data).substring(0, 200))
      }
      throw new Error('东方财富API返回数据格式错误')
    }
  }

  // A股MA数据获取方法 - 腾讯财经
  async getAStockMADataFromTencent(symbol, periods) {
    console.log(`处理A股${symbol}的MA数据获取（腾讯财经API）`)
    const cleanSymbol = symbol.replace(/^(sh|sz)/, '')
    const marketPrefix = symbol.startsWith('sh') ? 'sh' : 'sz'
    
    // 腾讯财经K线API
    const url = `http://qt.gtimg.cn/q=${marketPrefix}${cleanSymbol}`
    
    const response = await axios.get(url, {
      timeout: 8000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'http://gu.qq.com/'
      }
    })

    const data = response.data
    const match = data.match(/="([^"]+)"/)
    
    if (match && match[1]) {
      const fields = match[1].split('~')
      
      if (fields.length >= 6) {
        // 腾讯财经提供的价格数据较为有限，这里使用当前价格作为简化的MA计算
        const currentPrice = parseFloat(fields[3])
        
        if (!isNaN(currentPrice) && currentPrice > 0) {
          const maData = {}
          periods.forEach(period => {
            // 简化的MA计算：使用当前价格作为所有周期的近似值
            // 实际应用中应该获取历史数据进行计算
            maData[`MA${period}`] = currentPrice.toFixed(4).toString()
          })
          
          console.log(`腾讯财经获取${symbol}MA数据（简化版）:`, maData)
          return maData
        }
      }
    }
    
    throw new Error('腾讯财经API解析失败')
  }

  // A股MA数据获取方法 - 新浪财经
  async getAStockMADataFromSina(symbol, periods) {
    console.log(`处理A股${symbol}的MA数据获取（新浪财经API）`)
    const cleanSymbol = symbol.replace(/^(sh|sz)/, '')
    const marketPrefix = symbol.startsWith('sh') ? 'sh' : 'sz'
    
    // 新浪财经K线API
    const url = `http://hq.sinajs.cn/list=${marketPrefix}${cleanSymbol}`
    
    const response = await axios.get(url, {
      timeout: 8000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'http://finance.sina.com.cn/'
      }
    })

    const data = response.data
    const match = data.match(/="([^"]+)"/)
    
    if (match && match[1]) {
      const fields = match[1].split(',')
      
      if (fields.length >= 7) {
        const currentPrice = parseFloat(fields[3])
        
        if (!isNaN(currentPrice) && currentPrice > 0) {
          const maData = {}
          periods.forEach(period => {
            // 简化的MA计算：使用当前价格作为所有周期的近似值
            maData[`MA${period}`] = currentPrice.toFixed(4).toString()
          })
          
          console.log(`新浪财经获取${symbol}MA数据（简化版）:`, maData)
          return maData
        }
      }
    }
    
    throw new Error('新浪财经API解析失败')
  }

  // 美股MA数据获取方法 - 东方财富
  async getUSStockMAData(symbol, periods) {
    try {
      let usSymbol = symbol
      if (symbol.startsWith('us')) {
        usSymbol = symbol.replace('us', '')
      }
      usSymbol = usSymbol.replace(/\.(OQ|N|US)$/g, '')

      let marketCode = '105' // 默认NASDAQ
      const nyseStocks = ['BABA', 'XPEV']

      if (nyseStocks.includes(usSymbol)) {
        marketCode = '106' // NYSE
      }

      const url = `https://push2his.eastmoney.com/api/qt/stock/kline/get?secid=${marketCode}.${usSymbol}&ut=fa5fd1943c7b386f172d6893dbfba10b&fields1=f1,f2,f3,f4,f5,f6&fields2=f51,f52,f53,f54,f55,f56&klt=101&fqt=1&end=20991231&lmt=120`

      const response = await axios.get(url, {
        timeout: 8000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://quote.eastmoney.com/'
        }
      })

      const data = response.data
      if (data.data && data.data.klines) {
        const klines = data.data.klines
        const prices = klines.map(kline => parseFloat(kline.split(',')[4]))

        const maData = {}
        periods.forEach(period => {
          if (prices.length >= period) {
            const ma = prices.slice(-period).reduce((sum, price) => sum + price, 0) / period
            maData[`MA${period}`] = parseFloat(parseFloat(ma).toFixed(4)).toString()
          } else {
            maData[`MA${period}`] = ''
          }
        })

        console.log(`成功获取${symbol}美股MA数据:`, maData)
        return maData
      }
    } catch (error) {
      console.log(`获取美股${symbol}MA数据失败:`, error.message)
      throw error
    }

    throw new Error('东方财富美股API返回数据格式错误')
  }

  // 美股MA数据获取方法 - 腾讯财经
  async getUSStockMADataFromTencent(symbol, periods) {
    console.log(`处理美股${symbol}的MA数据获取（腾讯财经API）`)
    const cleanSymbol = symbol.replace('us', '').replace(/\.(OQ|N|US)$/g, '')
    
    // 腾讯财经美股API
    const url = `http://qt.gtimg.cn/q=us${cleanSymbol}`
    
    const response = await axios.get(url, {
      timeout: 8000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'http://gu.qq.com/'
      }
    })

    const data = response.data
    const match = data.match(/="([^"]+)"/)
    
    if (match && match[1]) {
      const fields = match[1].split('~')
      
      if (fields.length >= 6) {
        const currentPrice = parseFloat(fields[3])
        
        if (!isNaN(currentPrice) && currentPrice > 0) {
          const maData = {}
          periods.forEach(period => {
            maData[`MA${period}`] = currentPrice.toFixed(4).toString()
          })
          
          console.log(`腾讯财经获取${symbol}美股MA数据（简化版）:`, maData)
          return maData
        }
      }
    }
    
    throw new Error('腾讯财经美股API解析失败')
  }

  // 港股MA数据获取方法 - 东方财富
  async getHKStockMAData(symbol, periods) {
    try {
      const hkCode = symbol.replace('hk', '')
      const url = `https://push2his.eastmoney.com/api/qt/stock/kline/get?secid=116.${hkCode}&ut=fa5fd1943c7b386f172d6893dbfba10b&fields1=f1,f2,f3,f4,f5,f6&fields2=f51,f52,f53,f54,f55,f56&klt=101&fqt=1&end=20991231&lmt=120`

      const response = await axios.get(url, {
        timeout: 8000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://quote.eastmoney.com/'
        }
      })

      const data = response.data
      if (data.data && data.data.klines) {
        const klines = data.data.klines
        const prices = klines.map(kline => parseFloat(kline.split(',')[4]))

        const maData = {}
        periods.forEach(period => {
          if (prices.length >= period) {
            const ma = prices.slice(-period).reduce((sum, price) => sum + price, 0) / period
            maData[`MA${period}`] = parseFloat(parseFloat(ma).toFixed(4)).toString()
          } else {
            maData[`MA${period}`] = ''
          }
        })

        console.log(`成功获取${symbol}港股MA数据:`, maData)
        return maData
      }
    } catch (error) {
      console.log(`获取港股${symbol}MA数据失败:`, error.message)
      throw error
    }

    throw new Error('东方财富港股API返回数据格式错误')
  }

  // 港股MA数据获取方法 - 腾讯财经
  async getHKStockMADataFromTencent(symbol, periods) {
    console.log(`处理港股${symbol}的MA数据获取（腾讯财经API）`)
    const hkCode = symbol.replace('hk', '')
    
    // 腾讯财经港股API
    const url = `http://qt.gtimg.cn/q=hk${hkCode}`
    
    const response = await axios.get(url, {
      timeout: 8000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'http://gu.qq.com/'
      }
    })

    const data = response.data
    const match = data.match(/="([^"]+)"/)
    
    if (match && match[1]) {
      const fields = match[1].split('~')
      
      if (fields.length >= 6) {
        const currentPrice = parseFloat(fields[3])
        
        if (!isNaN(currentPrice) && currentPrice > 0) {
          const maData = {}
          periods.forEach(period => {
            maData[`MA${period}`] = currentPrice.toFixed(4).toString()
          })
          
          console.log(`腾讯财经获取${symbol}港股MA数据（简化版）:`, maData)
          return maData
        }
      }
    }
    
    throw new Error('腾讯财经港股API解析失败')
  }

  // 港股MA数据获取方法 - 新浪财经
  async getHKStockMADataFromSina(symbol, periods) {
    console.log(`处理港股${symbol}的MA数据获取（新浪财经API）`)
    const hkCode = symbol.replace('hk', '')
    
    // 新浪财经港股API
    const url = `http://hq.sinajs.cn/list=hk${hkCode}`
    
    const response = await axios.get(url, {
      timeout: 8000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'http://finance.sina.com.cn/'
      }
    })

    const data = response.data
    const match = data.match(/="([^"]+)"/)
    
    if (match && match[1]) {
      const fields = match[1].split(',')
      
      if (fields.length >= 7) {
        const currentPrice = parseFloat(fields[6])
        
        if (!isNaN(currentPrice) && currentPrice > 0) {
          const maData = {}
          periods.forEach(period => {
            maData[`MA${period}`] = currentPrice.toFixed(4).toString()
          })
          
          console.log(`新浪财经获取${symbol}港股MA数据（简化版）:`, maData)
          return maData
        }
      }
    }
    
    throw new Error('新浪财经港股API解析失败')
  }

  // 场外基金MA数据获取方法
  async getFundMAData(fundCode, periods) {
    try {
      console.log(`获取基金${fundCode}MA数据...`)

      const url = `https://api.fund.eastmoney.com/f10/lsjz?callback=jQuery&fundCode=${fundCode}&pageIndex=1&pageSize=120&startDate=&endDate=`

      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://fundf10.eastmoney.com/'
        }
      })

      const jsonpText = response.data
      const jsonStart = jsonpText.indexOf('(') + 1
      const jsonEnd = jsonpText.lastIndexOf(')')

      if (jsonStart <= 0 || jsonEnd <= jsonStart) {
        throw new Error('基金API返回数据格式错误')
      }

      const jsonText = jsonpText.substring(jsonStart, jsonEnd)
      const data = JSON.parse(jsonText)

      if (!data.Data || !data.Data.LSJZList || data.Data.LSJZList.length === 0) {
        throw new Error('基金历史净值数据为空')
      }

      const historyData = data.Data.LSJZList
      const netValues = historyData.map(item => parseFloat(item.DWJZ))

      const maData = {}
      periods.forEach(period => {
        if (netValues.length >= period) {
          const ma = netValues.slice(-period).reduce((sum, value) => sum + value, 0) / period
          maData[`MA${period}`] = parseFloat(ma.toFixed(4)).toString()
        } else {
          maData[`MA${period}`] = ''
        }
      })

      console.log(`成功获取${fundCode}基金MA数据:`, maData)
      return maData
    } catch (error) {
      console.log(`获取基金${fundCode}MA数据失败:`, error.message)
      throw error
    }
  }

  // 获取股票详情信息
  async getStockDetail(code) {
    const cacheKey = `detail_${code}`
    const cached = this.cache.get(cacheKey)

    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data
    }

    try {
      console.log(`获取${code}股票详情...`)

      // 判断市场类型
      let market = ''
      if (code.startsWith('sh') || code.startsWith('sz') || /^\d{6}$/.test(code)) {
        market = 'A股'
      } else if (code.startsWith('hk')) {
        market = '港股'
      } else if (code.startsWith('us')) {
        market = '美股'
      }

      if (market === 'A股') {
        return await this.getAStockDetail(code)
      } else if (market === '港股') {
        return await this.getHKStockDetail(code)
      } else if (market === '美股') {
        return await this.getUSStockDetail(code)
      }
    } catch (error) {
      console.error(`获取${code}详情失败:`, error.message)
    }

    return null
  }

  // 获取A股详情
  async getAStockDetail(code) {
    try {
      // 清理代码，移除前缀
      const cleanCode = code.replace(/^(sh|sz)/, '')

      // 智能判断市场代码：如果有前缀则使用前缀，如果是纯数字则根据首位判断
      let market = '0'
      if (code.startsWith('sh') || cleanCode.startsWith('6') || cleanCode.startsWith('5')) {
        market = '1' // 上海
      } else if (code.startsWith('sz') || cleanCode.startsWith('0') || cleanCode.startsWith('3')) {
        market = '0' // 深圳
      }

      // 第一次请求：获取基本信息、估值、资金流向等（指定字段）
      const basicFields = 'f43,f44,f45,f46,f47,f48,f49,f50,f57,f58,f60,f84,f85,f92,f107,f108,f116,f117,f126,f127,f128,f135,f136,f137'
      const basicUrl = `https://push2.eastmoney.com/api/qt/stock/get?secid=${market}.${cleanCode}&fields=${basicFields}`
      
      const basicResponse = await axios.get(basicUrl, {
        timeout: 5000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://quote.eastmoney.com/'
        }
      })

      // 第二次请求：获取买卖盘口（不指定fields，使用默认返回）
      const orderBookUrl = `https://push2.eastmoney.com/api/qt/stock/get?secid=${market}.${cleanCode}`
      const orderBookResponse = await axios.get(orderBookUrl, {
        timeout: 5000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://quote.eastmoney.com/'
        }
      })

      const basicData = basicResponse.data.data
      const orderBookData = orderBookResponse.data.data

      // 合并数据，优先使用basicData，买卖盘口使用orderBookData
      const d = { ...orderBookData, ...basicData }

      // 检查数据是否有效
      if (d && d.f43) {
        // 根据股票代码判断类型：ETF/基金需要除以1000，普通股票除以100
        const isETF = cleanCode.startsWith('5') || cleanCode.startsWith('51') || cleanCode.startsWith('56') || cleanCode.startsWith('15')
        const isFund = cleanCode.startsWith('50') || cleanCode.startsWith('15')
        const priceMultiplier = (isETF || isFund) ? 1000 : 100

        const currentPrice = parseFloat(d.f43) / priceMultiplier
        const prevPrice = parseFloat(d.f60) / priceMultiplier
        const openPrice = parseFloat(d.f46) / priceMultiplier
        const highPrice = parseFloat(d.f44) / priceMultiplier
        const lowPrice = parseFloat(d.f45) / priceMultiplier

        const detail = {
          code: cleanCode,                                          // 股票代码(如:601288)
          name: d.f58 || d.name || `股票${cleanCode}`,            // 股票名称(如:农业银行)
          currentPrice: parseFloat(currentPrice.toFixed(4)),       // 最新价格(单位:元)
          prevPrice: parseFloat(prevPrice.toFixed(4)),             // 昨日收盘价(单位:元)
          openPrice: parseFloat(openPrice.toFixed(4)),             // 今日开盘价(单位:元)
          highPrice: parseFloat(highPrice.toFixed(4)),             // 今日最高价(单位:元)
          lowPrice: parseFloat(lowPrice.toFixed(4)),               // 今日最低价(单位:元)
          volume: this.formatVolume(d.f47),                        // 成交量(格式化后,如:524.59万)
          turnover: this.formatTurnover(d.f48),                     // 成交额(格式化后,如:35.78亿)
          totalShares: this.formatShares(d.f84),                    // 总股本(格式化后,如:3499.83亿股)
          floatShares: this.formatShares(d.f85),                   // 流通股(格式化后,如:3192.44亿股)
          totalMarketValue: this.formatMarketValue(d.f116),        // 总市值(格式化后,如:23798.85亿元)
          floatMarketValue: this.formatMarketValue(d.f117),        // 流通市值(格式化后,如:21708.61亿元)
          industry: d.f127 || '--',                                 // 所属行业(如:银行)
          // 计算换手率: 成交额/流通市值 * 100%
          turnoverRate: d.f117 ? (parseFloat(d.f48) / parseFloat(d.f117) * 100).toFixed(2) : '0.00',
          listingDate: '--',                                         // 上市日期(接口未提供此数据)
          pe: d.f92 ? parseFloat(d.f92).toFixed(2) : '--',          // 市盈率(PE Ratio,使用f92字段)
          pb: d.f108 ? parseFloat(d.f108).toFixed(2) : '--',        // 市净率(PB Ratio,使用f108字段)
          volumeRatio: d.f50 ? parseFloat(d.f50).toFixed(2) : '--',// 量比(Volume Ratio,当前成交量/5日均量)
          mainNetInflow: d.f135 ? this.formatTurnover(d.f135) : '--', // 主力净流入(机构投资者资金净流入)
          blockInflow: d.f136 ? this.formatTurnover(d.f136) : '--',   // 大宗流入(大单交易资金流入)
          retailNetInflow: d.f137 ? this.formatTurnover(d.f137) : '--', // 散户净流入(中小投资者资金净流入)
          limitUp: parseFloat((currentPrice * 1.1).toFixed(4)),     // 涨停价(计算值)
          limitDown: parseFloat((currentPrice * 0.9).toFixed(4)),    // 跌停价(计算值)
          avgPrice: parseFloat(currentPrice.toFixed(4)),             // 成交均价(当前等于最新价,暂未精确计算)
          // 买卖盘口(五档)
          bid1: d.f19 ? parseFloat((parseFloat(d.f19)/100).toFixed(4)) : 0, bid1Vol: d.f20 || 0,    // 买一价格(分转元),买一数量
          bid2: d.f17 ? parseFloat((parseFloat(d.f17)/100).toFixed(4)) : 0, bid2Vol: d.f18 || 0,    // 买二价格,买二数量
          bid3: d.f15 ? parseFloat((parseFloat(d.f15)/100).toFixed(4)) : 0, bid3Vol: d.f16 || 0,    // 买三价格,买三数量
          bid4: d.f13 ? parseFloat((parseFloat(d.f13)/100).toFixed(4)) : 0, bid4Vol: d.f14 || 0,    // 买四价格,买四数量
          bid5: d.f11 ? parseFloat((parseFloat(d.f11)/100).toFixed(4)) : 0, bid5Vol: d.f12 || 0,    // 买五价格,买五数量
          ask1: d.f31 ? parseFloat((parseFloat(d.f31)/100).toFixed(4)) : 0, ask1Vol: d.f32 || 0,    // 卖一价格,卖一数量
          ask2: d.f33 ? parseFloat((parseFloat(d.f33)/100).toFixed(4)) : 0, ask2Vol: d.f34 || 0,    // 卖二价格,卖二数量
          ask3: d.f35 ? parseFloat((parseFloat(d.f35)/100).toFixed(4)) : 0, ask3Vol: d.f36 || 0,    // 卖三价格,卖三数量
          ask4: d.f37 ? parseFloat((parseFloat(d.f37)/100).toFixed(4)) : 0, ask4Vol: d.f38 || 0,    // 卖四价格,卖四数量
          ask5: d.f39 ? parseFloat((parseFloat(d.f39)/100).toFixed(4)) : 0, ask5Vol: d.f40 || 0     // 卖五价格,卖五数量
        }

        this.cache.set(`detail_${code}`, { data: detail, timestamp: Date.now() })
        console.log(`成功获取${code}详情`)
        return detail
      }
    } catch (error) {
      console.error(`获取${code}A股详情失败:`, error.message)
    }

    return null
  }

  // 获取K线数据
  async getKlineData(code, period = '1d') {
    const cacheKey = `kline_${code}_${period}`
    const cached = this.cache.get(cacheKey)

    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data
    }

    try {
      console.log(`获取${code} K线数据(${period})...`)

      // 映射周期
      const periodMap = {
        '5m': '5',
        '15m': '15',
        '30m': '30',
        '60m': '60',
        '1d': '101',
        '1w': '102',
        '1m': '103'
      }

      const klt = periodMap[period] || '101'

      // 判断市场
      let marketCode = ''
      let cleanCode = code

      if (code.startsWith('sh')) {
        marketCode = '1'
        cleanCode = code.replace('sh', '')
      } else if (code.startsWith('sz')) {
        marketCode = '0'
        cleanCode = code.replace('sz', '')
      } else if (/^\d{6}$/.test(code)) {
        // 6位数字，根据首位判断
        if (code.startsWith('6') || code.startsWith('5')) {
          marketCode = '1'
        } else {
          marketCode = '0'
        }
      } else if (code.startsWith('hk')) {
        marketCode = '116'
        cleanCode = code.replace('hk', '')
      } else if (code.startsWith('us')) {
        marketCode = '105'
        cleanCode = code.replace('us', '')
      }

      if (!marketCode) {
        return []
      }

      const url = `https://push2his.eastmoney.com/api/qt/stock/kline/get?secid=${marketCode}.${cleanCode}&ut=fa5fd1943c7b386f172d6893dbfba10b&fields1=f1,f2,f3,f4,f5,f6&fields2=f51,f52,f53,f54,f55,f56&klt=${klt}&fqt=1&end=20991231&lmt=200`

      const response = await axios.get(url, {
        timeout: 8000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://quote.eastmoney.com/'
        }
      })

      const data = response.data
      if (data.data && data.data.klines) {
        const klines = data.data.klines

        // push2his K线API返回的价格已经是元(yuan)，无需除以任何系数
        const result = klines.map(kline => {
          const parts = kline.split(',')
          return {
            date: parts[0],
            open: parseFloat(parts[1]),
            close: parseFloat(parts[2]),
            high: parseFloat(parts[3]),
            low: parseFloat(parts[4]),
            volume: parseFloat(parts[5])
          }
        })

        this.cache.set(cacheKey, { data: result, timestamp: Date.now() })
        console.log(`成功获取${code} K线数据，共${result.length}条`)
        return result
      }
    } catch (error) {
      console.error(`获取${code} K线数据失败:`, error.message)
    }

    return []
  }

  // 格式化成交量
  formatVolume(vol) {
    if (!vol) return '--'
    const num = parseFloat(vol)
    if (num > 100000000) return (num / 100000000).toFixed(2) + '亿'
    if (num > 10000) return (num / 10000).toFixed(2) + '万'
    return num.toFixed(2)
  }

  // 格式化成交额
  formatTurnover(turnover) {
    if (!turnover) return '--'
    const num = parseFloat(turnover)
    if (num > 100000000) return (num / 100000000).toFixed(2) + '亿'
    if (num > 10000) return (num / 10000).toFixed(2) + '万'
    return num.toFixed(2)
  }

  // 解析大数字（股本、市值等）
  // 股本单位：万股（需要转换为股，乘以10000）
  // 市值单位：万元（需要转换为元，乘以10000）
  parseLargeNumber(num) {
    if (!num) return 0
    const parsed = parseFloat(num)
    if (isNaN(parsed)) return 0
    return parsed
  }

  // 格式化股本显示（API返回单位：股，转换为亿股/万股）
  formatShares(num) {
    if (!num || num === 0) return '--'
    const shares = parseFloat(num)
    if (isNaN(shares)) return '--'

    // 先转换为万股
    const wanShares = shares / 10000

    // 5028116.81万股 = 502.81亿股
    if (wanShares >= 10000) {
      // 10000万股 = 1亿股
      return (wanShares / 10000).toFixed(2) + '亿股'
    } else {
      return wanShares.toFixed(2) + '万股'
    }
  }

  // 格式化市值显示（API返回单位：元，转换为万亿/亿/万）
  formatMarketValue(num) {
    if (!num || num === 0) return '--'
    const value = parseFloat(num)
    if (isNaN(value)) return '--'

    // 先转换为万元
    const wanValue = value / 10000

    // 8220970.99万元 = 822.10亿元
    if (wanValue >= 10000) {
      // 10000万元 = 1亿元
      return (wanValue / 10000).toFixed(2) + '亿元'
    } else {
      return wanValue.toFixed(2) + '万元'
    }
  }

  // 获取港股详情
  async getHKStockDetail(code) {
    try {
      const cleanCode = code.replace('hk', '')

      // 尝试从东方财富获取港股详情
      const detailUrl = `https://push2.eastmoney.com/api/qt/stock/get?secid=116.${cleanCode}&fields=f43,f44,f45,f46,f47,f48,f49,f57,f58,f60,f84,f85,f107,f116,f117,f135,f136,f137`

      const response = await axios.get(detailUrl, {
        timeout: 5000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://quote.eastmoney.com/'
        }
      })

      const data = response.data
      if (data.data && data.data.f43) {
        const d = data.data
        // 港股价格单位：除以1000（东方财富港股API返回的是分，但需要转换为元）
        const currentPrice = parseFloat(d.f43) / 1000
        const prevPrice = parseFloat(d.f60) / 1000
        const openPrice = parseFloat(d.f46) / 1000
        const highPrice = parseFloat(d.f44) / 1000
        const lowPrice = parseFloat(d.f45) / 1000

        const detail = {
          code: cleanCode,
          name: d.f58 || d.name || `港股${cleanCode}`,
          currentPrice: parseFloat(currentPrice.toFixed(4)),
          prevPrice: parseFloat(prevPrice.toFixed(4)),
          openPrice: parseFloat(openPrice.toFixed(4)),
          highPrice: parseFloat(highPrice.toFixed(4)),
          lowPrice: parseFloat(lowPrice.toFixed(4)),
          volume: this.formatVolume(d.f47),
          turnover: this.formatTurnover(d.f48),
          totalShares: this.formatShares(d.f84),
          floatShares: this.formatShares(d.f85),
          totalMarketValue: this.formatMarketValue(d.f116),
          floatMarketValue: this.formatMarketValue(d.f117),
          industry: '--',
          listingDate: '--',
          pe: d.f49 ? parseFloat(d.f49).toFixed(2) : '--',
          pb: d.f107 ? parseFloat(d.f107).toFixed(2) : '--',
          volumeRatio: '--',
          mainNetInflow: d.f135 ? this.formatTurnover(d.f135) : '--',
          blockInflow: d.f136 ? this.formatTurnover(d.f136) : '--',
          retailNetInflow: d.f137 ? this.formatTurnover(d.f137) : '--',
          limitUp: parseFloat((currentPrice * 1.25).toFixed(4)),
          limitDown: parseFloat((currentPrice * 0.85).toFixed(4)),
          turnoverRate: 0,
          avgPrice: parseFloat(currentPrice.toFixed(4)),
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

        this.cache.set(`detail_${code}`, { data: detail, timestamp: Date.now() })
        console.log(`成功获取${code}港股详情`)
        return detail
      }
    } catch (error) {
      console.error(`获取${code}港股详情失败:`, error.message)
    }

    return null
  }

  // 获取美股详情
  async getUSStockDetail(code) {
    try {
      const cleanCode = code.replace('us', '')
      const marketCode = cleanCode.includes('.OQ') || cleanCode.includes('.N') ? '' : cleanCode

      // 东方财富美股API
      const detailUrl = `https://push2.eastmoney.com/api/qt/stock/get?secid=105.${marketCode}&fields=f43,f44,f45,f46,f47,f48,f49,f57,f58,f60,f84,f85,f107,f116,f117,f135,f136,f137`

      const response = await axios.get(detailUrl, {
        timeout: 5000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://quote.eastmoney.com/'
        }
      })

      const data = response.data
      if (data.data && data.data.f43) {
        const d = data.data
        // 美股价格单位：除以100
        const currentPrice = parseFloat(d.f43) / 100
        const prevPrice = parseFloat(d.f60) / 100
        const openPrice = parseFloat(d.f46) / 100
        const highPrice = parseFloat(d.f44) / 100
        const lowPrice = parseFloat(d.f45) / 100

        const detail = {
          code: cleanCode,
          name: d.f58 || d.name || `美股${cleanCode}`,
          currentPrice: parseFloat(currentPrice.toFixed(2)),
          prevPrice: parseFloat(prevPrice.toFixed(2)),
          openPrice: parseFloat(openPrice.toFixed(2)),
          highPrice: parseFloat(highPrice.toFixed(2)),
          lowPrice: parseFloat(lowPrice.toFixed(2)),
          volume: this.formatVolume(d.f47),
          turnover: this.formatTurnover(d.f48),
          totalShares: this.formatShares(d.f84),
          floatShares: this.formatShares(d.f85),
          totalMarketValue: this.formatMarketValue(d.f116),
          floatMarketValue: this.formatMarketValue(d.f117),
          industry: '--',
          listingDate: '--',
          pe: d.f49 ? parseFloat(d.f49).toFixed(2) : '--',
          pb: d.f107 ? parseFloat(d.f107).toFixed(2) : '--',
          volumeRatio: '--',
          mainNetInflow: d.f135 ? this.formatTurnover(d.f135) : '--',
          blockInflow: d.f136 ? this.formatTurnover(d.f136) : '--',
          retailNetInflow: d.f137 ? this.formatTurnover(d.f137) : '--',
          limitUp: currentPrice * 1.25,
          limitDown: currentPrice * 0.85,
          turnoverRate: 0,
          avgPrice: currentPrice,
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

        this.cache.set(`detail_${code}`, { data: detail, timestamp: Date.now() })
        console.log(`成功获取${code}美股详情`)
        return detail
      }
    } catch (error) {
      console.error(`获取${code}美股详情失败:`, error.message)
    }

    return null
  }


  // 搜索股票 - 使用东方财富搜索建议API
  async searchStocks(keyword) {
    const cacheKey = `search_${keyword}`
    const cached = this.cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) {
      return cached.data
    }

    try {
      const url = `https://searchapi.eastmoney.com/api/suggest/get`
      const response = await axios.get(url, {
        params: {
          input: keyword,
          type: 14,
          token: 'D43BF722C8E33BDC906FB84D85E326E8',
          count: 20
        },
        timeout: 5000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://so.eastmoney.com/'
        }
      })

      const results = []
      if (response.data && response.data.QuotationCodeTable && response.data.QuotationCodeTable.Data) {
        for (const item of response.data.QuotationCodeTable.Data) {
          const code = item.Code || ''
          const name = item.Name || ''
          const mktNum = String(item.MktNum || '')
          const quoteId = item.QuoteID || ''
          let market = ''
          let prefix = ''
          if (mktNum === '0' || quoteId.startsWith('0.')) { prefix = 'sz'; market = 'A股' }
          else if (mktNum === '1' || quoteId.startsWith('1.')) { prefix = 'sh'; market = 'A股' }
          else if (mktNum === '116' || quoteId.startsWith('116.')) { prefix = 'hk'; market = '港股' }
          else if (mktNum === '105' || mktNum === '106' || quoteId.startsWith('105.') || quoteId.startsWith('106.')) { prefix = 'us'; market = '美股' }
          else { market = '其他'; prefix = '' }

          // 只保留A股、港股、美股和基金结果
          if (market === '其他') continue

          results.push({
            code: prefix + code,
            name: name,
            market: market,
            type: item.SecurityTypeName || '股票',
          })
        }
      }

      this.cache.set(cacheKey, { data: results, timestamp: Date.now() })
      return results
    } catch (error) {
      console.error('东方财富搜索失败:', error.message)
      return []
    }
  }

}

const stockService = new StockDataService()

export default stockService
