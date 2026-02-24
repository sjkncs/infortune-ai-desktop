import fs from 'fs'
import db from './server/db.js'

async function updatePortfolioPrices() {
  try {
    // 读取旧项目的缓存数据
    const oldCachePath = '../laoInFortune/src/data/cache/portfolio.json'
    const oldCacheData = JSON.parse(fs.readFileSync(oldCachePath, 'utf8'))
    
    console.log('读取旧项目缓存数据:', oldCacheData.data.length, '条记录')
    
    // 读取新项目的数据库
    await db.read()
    
    // 创建股票代码到价格数据的映射
    const priceMap = new Map()
    oldCacheData.data.forEach(item => {
      const code = item['股票代码']
      priceMap.set(code, {
        当前实时价: item['当前实时价'],
        昨日收盘价: item['昨日收盘价'],
        MA5: item['MA5'],
        MA10: item['MA10'],
        MA20: item['MA20'],
        MA30: item['MA30'],
        MA50: item['MA50']
      })
    })
    
    console.log('价格映射创建完成，共', priceMap.size, '个股票的价格数据')
    
    // 更新新项目的数据库
    let updatedCount = 0
    db.data.portfolio.forEach(stock => {
      const code = stock['股票代码'] || stock.code
      const priceData = priceMap.get(code)
      
      if (priceData) {
        stock['当前实时价'] = priceData['当前实时价']
        stock['昨日收盘价'] = priceData['昨日收盘价']
        stock['MA5'] = priceData['MA5']
        stock['MA10'] = priceData['MA10']
        stock['MA20'] = priceData['MA20']
        stock['MA30'] = priceData['MA30']
        stock['MA50'] = priceData['MA50']
        updatedCount++
        console.log(`更新 ${code}: 当前价=${priceData['当前实时价']}, 昨收=${priceData['昨日收盘价']}`)
      }
    })
    
    // 保存更新后的数据库
    await db.write()
    
    console.log(`\n✅ 数据库更新完成！`)
    console.log(`总共更新了 ${updatedCount} 条记录`)
    
    // 显示A股股票的更新结果
    console.log('\n=== A股股票价格更新结果 ===')
    const aStocks = db.data.portfolio.filter(item => 
      (item['所在市场'] === 'A股' || item.market === 'A股') && 
      (item['当前实时价'] && item['当前实时价'] !== '')
    )
    
    aStocks.forEach(stock => {
      const code = stock['股票代码'] || stock.code
      const name = stock['股票名称'] || stock.name
      const currentPrice = stock['当前实时价']
      const prevPrice = stock['昨日收盘价']
      console.log(`${code} ${name}: 当前价=${currentPrice}, 昨收价=${prevPrice}`)
    })
    
  } catch (error) {
    console.error('更新数据库失败:', error)
  }
}

updatePortfolioPrices()