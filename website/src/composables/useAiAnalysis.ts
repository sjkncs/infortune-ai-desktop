import { ref, computed } from 'vue'
import axios from 'axios'

// AI 分析服务基础地址
type AnalysisType = 'basic' | 'advanced'

interface SniperPoints {
  ideal_buy?: string
  secondary_buy?: string
  stop_loss?: string
  take_profit?: string
}

interface PositionAdvice {
  no_position: string
  has_position: string
}

interface CoreConclusion {
  one_sentence: string
  signal_type: string
  time_sensitivity: string
  position_advice: PositionAdvice
}

interface Dashboard {
  core_conclusion: CoreConclusion
  sniper_points: SniperPoints
}

interface TechnicalIndicators {
  ma5?: number
  ma10?: number
  ma20?: number
  bias_ma5?: number
  macd_status?: string
  rsi_status?: string
  trend_status?: string
}

interface Intelligence {
  risk_alerts: string[]
  positive_catalysts: string[]
  latest_news?: string
}

export interface AiAnalysisResult {
  stock_code: string
  stock_name?: string
  sentiment_score: number
  trend_prediction: string
  operation_advice: string
  confidence_level: string
  dashboard: Dashboard
  technical: TechnicalIndicators
  intelligence: Intelligence
  analysis_summary?: string
  key_points?: string
  risk_warning?: string
  created_at?: string
}

export function useAiAnalysis() {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const analysisData = ref<AiAnalysisResult | null>(null)

  // API 基础地址 - 通过 Vite 代理访问
  // 开发环境: /api/stocks -> http://localhost:8000
  // 生产环境: 使用相对路径
  const AI_API_BASE = ''  // 使用相对路径，通过 Vite 代理

  // 信号颜色映射
  const signalColorMap: Record<string, string> = {
    '💚强烈买入': 'text-emerald-400',
    '🟢买入信号': 'text-success',
    '🟡持有观望': 'text-warning',
    '⚪观望': 'text-gray-400',
    '🟠减仓信号': 'text-orange-400',
    '🔴卖出信号': 'text-danger',
    '❌强烈卖出': 'text-red-500',
  }

  // 操作建议颜色
  const adviceColorClass = computed(() => {
    const advice = analysisData.value?.operation_advice || ''
    if (advice.includes('买入') || advice.includes('强烈')) return 'text-success'
    if (advice.includes('卖出') || advice.includes('减仓')) return 'text-danger'
    return 'text-warning'
  })

  // 评分颜色
  const scoreColorClass = computed(() => {
    const score = analysisData.value?.sentiment_score || 50
    if (score >= 80) return 'text-emerald-400'
    if (score >= 60) return 'text-success'
    if (score >= 40) return 'text-warning'
    return 'text-danger'
  })

  // 趋势预测颜色
  const trendColorClass = computed(() => {
    const trend = analysisData.value?.trend_prediction || ''
    if (trend.includes('看多') || trend.includes('强烈')) return 'text-success'
    if (trend.includes('看空') || trend.includes('卖出')) return 'text-danger'
    return 'text-warning'
  })

  // 获取 AI 分析
  const fetchAiAnalysis = async (code: string, useCache: boolean = true): Promise<AiAnalysisResult | null> => {
    loading.value = true
    error.value = null
    
    try {
      const response = await axios.get(`${AI_API_BASE}/api/v1/stocks/${code}/ai-analysis`, {
        params: { use_cache: useCache },
        timeout: 30000
      })
      
      analysisData.value = response.data
      return response.data
    } catch (e: any) {
      console.error('获取AI分析失败:', e)
      error.value = e.message || '获取AI分析失败'
      // 返回模拟数据作为降级方案
      return getMockAiAnalysis(code)
    } finally {
      loading.value = false
    }
  }

  // 刷新 AI 分析
  const refreshAiAnalysis = async (code: string): Promise<AiAnalysisResult | null> => {
    loading.value = true
    error.value = null
    
    try {
      const response = await axios.post(`${AI_API_BASE}/api/v1/stocks/${code}/ai-analysis/refresh`, {}, {
        timeout: 60000  // AI 分析可能需要更长时间
      })
      
      analysisData.value = response.data
      return response.data
    } catch (e: any) {
      console.error('刷新AI分析失败:', e)
      error.value = e.message || '刷新AI分析失败'
      return getMockAiAnalysis(code)
    } finally {
      loading.value = false
    }
  }

  // 获取信号颜色类
  const getSignalColorClass = (signalType: string): string => {
    return signalColorMap[signalType] || 'text-gray-400'
  }

  // 格式化狙击点位
  const formatSniperPoint = (point?: string): string => {
    if (!point) return '--'
    return point
  }

  return {
    loading,
    error,
    analysisData,
    adviceColorClass,
    scoreColorClass,
    trendColorClass,
    fetchAiAnalysis,
    refreshAiAnalysis,
    getSignalColorClass,
    formatSniperPoint
  }
}

// 模拟数据（降级方案）
function getMockAiAnalysis(code: string): AiAnalysisResult {
  return {
    stock_code: code,
    stock_name: code === '000001' ? '平安银行' : '贵州茅台',
    sentiment_score: 75,
    trend_prediction: '看多',
    operation_advice: '买入',
    confidence_level: '高',
    dashboard: {
      core_conclusion: {
        one_sentence: '多头排列确立，可在MA5附近介入',
        signal_type: '🟢买入信号',
        time_sensitivity: '本周内',
        position_advice: {
          no_position: '等待回踩MA5后分批建仓',
          has_position: '继续持有，可适量加仓'
        }
      },
      sniper_points: {
        ideal_buy: '12.35元（MA5附近）',
        secondary_buy: '12.20元（MA10附近）',
        stop_loss: '11.80元（跌破MA20止损）',
        take_profit: '13.50元（目标位）'
      }
    },
    technical: {
      ma5: 12.35,
      ma10: 12.20,
      ma20: 11.80,
      bias_ma5: 0.84,
      macd_status: '金叉',
      rsi_status: '强势',
      trend_status: '多头排列'
    },
    intelligence: {
      risk_alerts: [],
      positive_catalysts: ['业绩预增', '行业景气度提升'],
      latest_news: '公司发布业绩预告，Q4营收同比增长15%'
    },
    analysis_summary: '技术面多头排列，基本面稳健',
    key_points: 'MA5支撑有效，量能配合',
    risk_warning: '注意大盘系统性风险',
    created_at: new Date().toISOString()
  }
}
