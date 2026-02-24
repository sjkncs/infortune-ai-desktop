import axios from 'axios'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import path from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 加载 .env
dotenv.config({ path: path.resolve(__dirname, '../.env') })

const AI_API_BASE_URL = process.env.AI_API_BASE_URL || 'https://hiapi.online/v1'
const AI_API_KEY = process.env.AI_API_KEY || ''
const AI_MODEL = process.env.AI_MODEL || 'gemini-3-flash-no'

// 缓存（避免重复调用）
const analysisCache = new Map()
const CACHE_TTL = 10 * 60 * 1000 // 10分钟

class AiAnalysisService {

  /**
   * 生成股票AI分析
   */
  async analyzeStock(stockCode, stockData = {}, useCache = true) {
    const cacheKey = `ai_analysis_${stockCode}`

    if (useCache) {
      const cached = analysisCache.get(cacheKey)
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data
      }
    }

    if (!AI_API_KEY) {
      console.warn('AI_API_KEY 未配置，使用模拟数据')
      return this._getMockAnalysis(stockCode, stockData)
    }

    try {
      const prompt = this._buildAnalysisPrompt(stockCode, stockData)
      const result = await this._callAiApi(prompt)
      const parsed = this._parseAiResponse(result, stockCode, stockData)

      analysisCache.set(cacheKey, { data: parsed, timestamp: Date.now() })
      return parsed
    } catch (err) {
      console.error('AI分析失败:', err.message)
      return this._getMockAnalysis(stockCode, stockData)
    }
  }

  /**
   * 刷新分析（强制不用缓存）
   */
  async refreshAnalysis(stockCode, stockData = {}) {
    return this.analyzeStock(stockCode, stockData, false)
  }

  /**
   * 构建分析提示词
   */
  _buildAnalysisPrompt(stockCode, stockData) {
    const name = stockData.name || stockCode
    const price = stockData.currentPrice || stockData.price || '--'
    const change = stockData.changePercent || stockData.changePct || '--'
    const volume = stockData.volume || '--'
    const turnover = stockData.amount || stockData.turnover || '--'
    const high = stockData.high || '--'
    const low = stockData.low || '--'
    const open = stockData.open || '--'
    const prevClose = stockData.prevPrice || stockData.prevClose || '--'
    const ma5 = stockData.ma5 || '--'
    const ma10 = stockData.ma10 || '--'
    const ma20 = stockData.ma20 || '--'

    return `你是一位资深A股分析师，请对以下股票进行专业分析。

股票信息：
- 代码: ${stockCode}
- 名称: ${name}
- 当前价: ${price}
- 涨跌幅: ${change}%
- 今开: ${open}
- 昨收: ${prevClose}
- 最高: ${high}
- 最低: ${low}
- 成交量: ${volume}
- 成交额: ${turnover}
- MA5: ${ma5}
- MA10: ${ma10}
- MA20: ${ma20}

请严格按照以下JSON格式返回分析结果（不要添加任何markdown标记或额外文字，只返回纯JSON）：

{
  "stock_code": "${stockCode}",
  "stock_name": "${name}",
  "sentiment_score": <0-100的整数，反映综合情绪评分>,
  "trend_prediction": "<看多/看空/震荡>",
  "operation_advice": "<强烈买入/买入/持有观望/减仓/卖出>",
  "confidence_level": "<高/中/低>",
  "dashboard": {
    "core_conclusion": {
      "one_sentence": "<一句话核心结论>",
      "signal_type": "<💚强烈买入/🟢买入信号/🟡持有观望/⚪观望/🟠减仓信号/🔴卖出信号/❌强烈卖出>",
      "time_sensitivity": "<时间敏感度，如：本周内/近期/中长期>",
      "position_advice": {
        "no_position": "<空仓者操作建议>",
        "has_position": "<持仓者操作建议>"
      }
    },
    "sniper_points": {
      "ideal_buy": "<理想买入价位及理由>",
      "secondary_buy": "<次优买入价位及理由>",
      "stop_loss": "<止损价位及理由>",
      "take_profit": "<目标价位及理由>"
    }
  },
  "technical": {
    "ma5": ${ma5 !== '--' ? ma5 : 'null'},
    "ma10": ${ma10 !== '--' ? ma10 : 'null'},
    "ma20": ${ma20 !== '--' ? ma20 : 'null'},
    "bias_ma5": <MA5乖离率数值>,
    "macd_status": "<金叉/死叉/零轴上/零轴下>",
    "rsi_status": "<超买/强势/中性/弱势/超卖>",
    "trend_status": "<多头排列/空头排列/交叉缠绕>"
  },
  "intelligence": {
    "risk_alerts": ["<风险提示1>", "<风险提示2>"],
    "positive_catalysts": ["<利好因素1>", "<利好因素2>"],
    "latest_news": "<最新相关消息或行业动态>"
  },
  "analysis_summary": "<综合分析摘要，100字左右>",
  "key_points": "<关键看点>",
  "risk_warning": "<风险提示>"
}`
  }

  /**
   * 调用 AI API (OpenAI兼容格式)
   */
  async _callAiApi(prompt) {
    const response = await axios.post(
      `${AI_API_BASE_URL}/chat/completions`,
      {
        model: AI_MODEL,
        messages: [
          {
            role: 'system',
            content: '你是一位专业的A股分析师。请严格按照用户要求的JSON格式返回分析结果，不要添加任何markdown代码块标记、注释或额外文字。只返回纯JSON。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 4000
      },
      {
        headers: {
          'Authorization': `Bearer ${AI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 60000
      }
    )

    const content = response.data?.choices?.[0]?.message?.content
    if (!content) {
      throw new Error('AI API 返回内容为空')
    }
    return content
  }

  /**
   * 解析AI返回的JSON
   */
  _parseAiResponse(rawText, stockCode, stockData) {
    // 去除可能的 markdown 代码块标记
    let cleaned = rawText.trim()
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.slice(7)
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.slice(3)
    }
    if (cleaned.endsWith('```')) {
      cleaned = cleaned.slice(0, -3)
    }
    cleaned = cleaned.trim()

    try {
      const parsed = JSON.parse(cleaned)
      parsed.stock_code = stockCode
      parsed.created_at = new Date().toISOString()
      return parsed
    } catch (e) {
      console.warn('AI返回内容解析失败，尝试提取JSON:', e.message)
      // 尝试从文本中提取JSON
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0])
          parsed.stock_code = stockCode
          parsed.created_at = new Date().toISOString()
          return parsed
        } catch (e2) {
          console.error('JSON提取也失败:', e2.message)
        }
      }
      // 回退到模拟数据
      return this._getMockAnalysis(stockCode, stockData)
    }
  }

  /**
   * 模拟分析数据（降级方案）
   */
  _getMockAnalysis(stockCode, stockData = {}) {
    const name = stockData.name || stockCode
    const price = parseFloat(stockData.currentPrice || stockData.price || 100)

    return {
      stock_code: stockCode,
      stock_name: name,
      sentiment_score: 65,
      trend_prediction: '震荡',
      operation_advice: '持有观望',
      confidence_level: '中',
      dashboard: {
        core_conclusion: {
          one_sentence: `${name}当前处于震荡整理阶段，等待方向选择`,
          signal_type: '🟡持有观望',
          time_sensitivity: '近期',
          position_advice: {
            no_position: '建议观望，等待明确信号后再入场',
            has_position: '持有为主，注意设置止损位'
          }
        },
        sniper_points: {
          ideal_buy: `${(price * 0.95).toFixed(2)}元（回调5%支撑位）`,
          secondary_buy: `${(price * 0.90).toFixed(2)}元（回调10%强支撑）`,
          stop_loss: `${(price * 0.88).toFixed(2)}元（跌破12%止损）`,
          take_profit: `${(price * 1.15).toFixed(2)}元（上涨15%目标位）`
        }
      },
      technical: {
        ma5: stockData.ma5 || null,
        ma10: stockData.ma10 || null,
        ma20: stockData.ma20 || null,
        bias_ma5: 0,
        macd_status: '零轴附近',
        rsi_status: '中性',
        trend_status: '交叉缠绕'
      },
      intelligence: {
        risk_alerts: ['AI分析服务暂时不可用，当前为模拟数据'],
        positive_catalysts: [],
        latest_news: '暂无最新消息'
      },
      analysis_summary: `${name}当前处于震荡整理阶段，建议关注量能变化和均线支撑情况。`,
      key_points: '关注成交量变化及均线支撑',
      risk_warning: '此为模拟分析结果，仅供参考，不构成投资建议。',
      created_at: new Date().toISOString()
    }
  }
}

const aiService = new AiAnalysisService()
export default aiService
