<template>
  <div class="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
    <!-- Stock Header -->
    <div class="card mb-6">
      <div class="p-6">
        <div class="flex flex-col lg:flex-row justify-between gap-6">
          <!-- Left: Stock Info -->
          <div class="flex-1">
            <div class="flex items-center gap-4 mb-4">
              <h1 class="text-3xl font-bold text-gray-100">{{ stockData.name || '--' }}</h1>
              <span class="text-lg font-mono text-primary">{{ stockData.code || route.params.code }}</span>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-sm">
              <div>
                <span class="text-gray-500 block">总股本</span>
                <span class="text-gray-200 font-mono">{{ stockData.totalShares || '--' }}</span>
              </div>
              <div>
                <span class="text-gray-500 block">流通股</span>
                <span class="text-gray-200 font-mono">{{ stockData.floatShares || '--' }}</span>
              </div>
              <div>
                <span class="text-gray-500 block">总市值</span>
                <span class="text-gray-200 font-mono">{{ stockData.totalMarketValue || '--' }}</span>
              </div>
              <div>
                <span class="text-gray-500 block">流通市值</span>
                <span class="text-gray-200 font-mono">{{ stockData.floatMarketValue || '--' }}</span>
              </div>
              <div>
                <span class="text-gray-500 block">行业</span>
                <span class="text-gray-200">{{ stockData.industry || '--' }}</span>
              </div>
              <div>
                <span class="text-gray-500 block">上市时间</span>
                <span class="text-gray-200">{{ formatDate(stockData.listingDate) }}</span>
              </div>
            </div>
          </div>
          
          <!-- Right: Price -->
          <div class="text-center lg:text-right">
            <div 
              class="text-4xl font-bold font-mono mb-2"
              :class="priceChangeClass"
            >
              {{ formatPrice(stockData.currentPrice) }}
            </div>
            <div class="flex items-center justify-center lg:justify-end gap-4 text-sm">
              <span :class="priceChangeClass" class="font-mono">
                {{ priceChangeText }}
              </span>
              <span :class="priceChangeClass" class="font-mono">
                {{ priceChangePercentText }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Left Column -->
      <div class="lg:col-span-2 space-y-6">
        <!-- K-Line Chart -->
        <div class="card">
          <div class="card-header">
            <h3 class="text-lg font-semibold text-gray-200 flex items-center gap-2">
              <i class="fas fa-chart-area text-primary"></i>
              K线图
            </h3>
            <div class="flex gap-1">
              <button
                v-for="range in timeRanges"
                :key="range.value"
                @click="activeRange = range.value"
                class="px-3 py-1.5 text-xs rounded transition-colors"
                :class="activeRange === range.value 
                  ? 'bg-primary text-white' 
                  : 'text-gray-400 hover:bg-gray-700'"
              >
                {{ range.label }}
              </button>
            </div>
          </div>
          <div class="card-body">
            <div ref="chartRef" class="h-[400px]"></div>
            
            <!-- MA Indicators Toggle -->
            <div class="flex flex-wrap gap-4 mt-4 pt-4 border-t border-gray-700">
              <label 
                v-for="ma in maIndicators" 
                :key="ma.key"
                class="flex items-center gap-2 text-sm cursor-pointer"
              >
                <input 
                  type="checkbox" 
                  v-model="ma.show"
                  class="w-4 h-4 rounded bg-gray-700 border-gray-600 text-primary focus:ring-primary"
                />
                <span :style="{ color: ma.color }">{{ ma.label }}</span>
              </label>
            </div>
          </div>
        </div>

        <!-- AI 智能分析 -->
        <div class="card">
          <div class="card-header flex justify-between items-center">
            <h3 class="text-lg font-semibold text-gray-200 flex items-center gap-2">
              <i class="fas fa-robot text-primary"></i>
              AI 智能分析
              <span v-if="aiAnalysisData?.confidence_level" class="text-xs px-2 py-0.5 bg-primary/20 text-primary rounded">
                置信度: {{ aiAnalysisData.confidence_level }}
              </span>
            </h3>
            <button 
              @click="refreshAiAnalysisData"
              :disabled="aiLoading"
              class="text-xs px-3 py-1.5 bg-primary/20 hover:bg-primary/30 text-primary rounded transition-colors flex items-center gap-1"
            >
              <i class="fas" :class="aiLoading ? 'fa-spinner fa-spin' : 'fa-sync'"></i>
              {{ aiLoading ? '分析中...' : '刷新分析' }}
            </button>
          </div>
          <div class="card-body space-y-4">
            <!-- 核心结论 -->
            <div class="p-4 bg-surface-light rounded-lg">
              <div class="flex items-center justify-between mb-3">
                <h4 class="text-sm font-semibold text-gray-300">核心结论</h4>
                <span 
                  class="text-sm font-bold"
                  :class="getSignalColorClass(aiAnalysisData?.dashboard?.core_conclusion?.signal_type)"
                >
                  {{ aiAnalysisData?.dashboard?.core_conclusion?.signal_type || '分析中...' }}
                </span>
              </div>
              <p class="text-gray-200 text-base font-medium mb-2">
                {{ aiAnalysisData?.dashboard?.core_conclusion?.one_sentence || '正在分析中，请稍候...' }}
              </p>
              <p class="text-xs text-gray-500">
                时间敏感度: {{ aiAnalysisData?.dashboard?.core_conclusion?.time_sensitivity || '分析中' }}
              </p>
            </div>

            <!-- 持仓建议 -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="p-4 bg-surface-light rounded-lg border border-gray-700">
                <h4 class="text-xs font-semibold text-gray-500 mb-2">
                  <i class="fas fa-user-slash mr-1"></i>空仓者建议
                </h4>
                <p class="text-sm text-gray-300">
                  {{ aiAnalysisData?.dashboard?.core_conclusion?.position_advice?.no_position || '等待分析结果...' }}
                </p>
              </div>
              <div class="p-4 bg-surface-light rounded-lg border border-gray-700">
                <h4 class="text-xs font-semibold text-gray-500 mb-2">
                  <i class="fas fa-user-check mr-1"></i>持仓者建议
                </h4>
                <p class="text-sm text-gray-300">
                  {{ aiAnalysisData?.dashboard?.core_conclusion?.position_advice?.has_position || '等待分析结果...' }}
                </p>
              </div>
            </div>

            <!-- 狙击点位 -->
            <div class="p-4 bg-surface-light rounded-lg">
              <h4 class="text-sm font-semibold text-gray-300 mb-3">
                <i class="fas fa-crosshairs mr-2 text-primary"></i>狙击点位
              </h4>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div class="text-center p-3 bg-success/10 rounded-lg">
                  <span class="text-gray-500 block text-xs mb-1">理想买入</span>
                  <span class="text-success font-mono font-bold">
                    {{ formatSniperPoint(aiAnalysisData?.dashboard?.sniper_points?.ideal_buy) }}
                  </span>
                </div>
                <div class="text-center p-3 bg-primary/10 rounded-lg">
                  <span class="text-gray-500 block text-xs mb-1">次优买入</span>
                  <span class="text-primary font-mono font-bold">
                    {{ formatSniperPoint(aiAnalysisData?.dashboard?.sniper_points?.secondary_buy) }}
                  </span>
                </div>
                <div class="text-center p-3 bg-warning/10 rounded-lg">
                  <span class="text-gray-500 block text-xs mb-1">止损位</span>
                  <span class="text-warning font-mono font-bold">
                    {{ formatSniperPoint(aiAnalysisData?.dashboard?.sniper_points?.stop_loss) }}
                  </span>
                </div>
                <div class="text-center p-3 bg-info/10 rounded-lg">
                  <span class="text-gray-500 block text-xs mb-1">目标位</span>
                  <span class="text-info font-mono font-bold">
                    {{ formatSniperPoint(aiAnalysisData?.dashboard?.sniper_points?.take_profit) }}
                  </span>
                </div>
              </div>
            </div>

            <!-- 技术指标摘要 -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm" v-if="aiAnalysisData?.technical">
              <div class="p-3 bg-surface-light rounded-lg text-center">
                <span class="text-gray-500 block text-xs">趋势状态</span>
                <span class="font-medium" :class="trendColorClass">{{ aiAnalysisData.technical.trend_status || '--' }}</span>
              </div>
              <div class="p-3 bg-surface-light rounded-lg text-center">
                <span class="text-gray-500 block text-xs">MACD</span>
                <span class="font-medium text-gray-200">{{ aiAnalysisData.technical.macd_status || '--' }}</span>
              </div>
              <div class="p-3 bg-surface-light rounded-lg text-center">
                <span class="text-gray-500 block text-xs">RSI</span>
                <span class="font-medium text-gray-200">{{ aiAnalysisData.technical.rsi_status || '--' }}</span>
              </div>
              <div class="p-3 bg-surface-light rounded-lg text-center">
                <span class="text-gray-500 block text-xs">乖离率</span>
                <span class="font-mono" :class="getBiasColor(aiAnalysisData.technical.bias_ma5)">
                  {{ aiAnalysisData.technical.bias_ma5?.toFixed ? aiAnalysisData.technical.bias_ma5.toFixed(2) : '--' }}%
                </span>
              </div>
            </div>

            <!-- 舆情情报 -->
            <div v-if="aiAnalysisData?.intelligence?.risk_alerts?.length || aiAnalysisData?.intelligence?.positive_catalysts?.length" class="space-y-3">
              <div v-if="aiAnalysisData.intelligence.risk_alerts?.length" class="p-3 bg-danger/10 border border-danger/30 rounded-lg">
                <h4 class="text-xs font-semibold text-danger mb-2">
                  <i class="fas fa-exclamation-triangle mr-1"></i>风险警报
                </h4>
                <ul class="text-xs text-gray-300 space-y-1">
                  <li v-for="(risk, idx) in aiAnalysisData.intelligence.risk_alerts" :key="idx" class="flex items-start gap-2">
                    <span class="text-danger mt-0.5">•</span>
                    <span>{{ risk }}</span>
                  </li>
                </ul>
              </div>
              <div v-if="aiAnalysisData.intelligence.positive_catalysts?.length" class="p-3 bg-success/10 border border-success/30 rounded-lg">
                <h4 class="text-xs font-semibold text-success mb-2">
                  <i class="fas fa-arrow-trend-up mr-1"></i>利好催化
                </h4>
                <ul class="text-xs text-gray-300 space-y-1">
                  <li v-for="(catalyst, idx) in aiAnalysisData.intelligence.positive_catalysts" :key="idx" class="flex items-start gap-2">
                    <span class="text-success mt-0.5">•</span>
                    <span>{{ catalyst }}</span>
                  </li>
                </ul>
              </div>
              <div v-if="aiAnalysisData.intelligence.latest_news" class="p-3 bg-surface-light rounded-lg">
                <h4 class="text-xs font-semibold text-gray-500 mb-1">
                  <i class="fas fa-newspaper mr-1"></i>最新动态
                </h4>
                <p class="text-xs text-gray-300">{{ aiAnalysisData.intelligence.latest_news }}</p>
              </div>
            </div>

            <!-- 综合分析 -->
            <div v-if="aiAnalysisData?.analysis_summary" class="p-4 bg-surface-light rounded-lg">
              <h4 class="text-sm font-semibold text-gray-300 mb-2">综合分析</h4>
              <p class="text-sm text-gray-400 leading-relaxed">{{ aiAnalysisData.analysis_summary }}</p>
              <p v-if="aiAnalysisData.key_points" class="text-xs text-gray-500 mt-2">
                <span class="font-medium">核心看点:</span> {{ aiAnalysisData.key_points }}
              </p>
            </div>

            <!-- 风险提示 -->
            <div v-if="aiAnalysisData?.risk_warning" class="p-3 bg-warning/10 border border-warning/30 rounded-lg">
              <p class="text-xs text-warning">
                <i class="fas fa-info-circle mr-1"></i>
                <span class="font-medium">风险提示:</span> {{ aiAnalysisData.risk_warning }}
              </p>
            </div>
          </div>
        </div>

        <!-- Capital Flow -->
        <div class="card">
          <div class="card-header">
            <h3 class="text-lg font-semibold text-gray-200 flex items-center gap-2">
              <i class="fas fa-chart-line text-primary"></i>
              资金流向
            </h3>
          </div>
          <div class="card-body">
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div class="p-4 bg-surface-light rounded-lg">
                <span class="text-gray-500 block mb-1">主力净流入</span>
                <span class="text-xl font-bold font-mono" :class="getCapitalFlowColor(stockData.mainNetInflow)">
                  {{ stockData.mainNetInflow || '--' }}
                </span>
              </div>
              <div class="p-4 bg-surface-light rounded-lg">
                <span class="text-gray-500 block mb-1">大宗流入</span>
                <span class="text-xl font-bold font-mono" :class="getCapitalFlowColor(stockData.blockInflow)">
                  {{ stockData.blockInflow || '--' }}
                </span>
              </div>
              <div class="p-4 bg-surface-light rounded-lg">
                <span class="text-gray-500 block mb-1">散户净流入</span>
                <span class="text-xl font-bold font-mono" :class="getCapitalFlowColor(stockData.retailNetInflow)">
                  {{ stockData.retailNetInflow || '--' }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Operation Suggestions -->
        <div class="card">
          <div class="card-header">
            <h3 class="text-lg font-semibold text-gray-200 flex items-center gap-2">
              <i class="fas fa-hand-pointer text-primary"></i>
              操作建议
            </h3>
          </div>
          <div class="card-body">
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div class="p-4 bg-success/10 border border-success/30 rounded-lg">
                <div class="flex items-center justify-between mb-3">
                  <span class="text-success text-sm font-medium">
                    <i class="fas fa-arrow-down mr-2"></i>建议买入价
                  </span>
                </div>
                <div class="text-2xl font-bold font-mono text-success mb-2">
                  {{ formatPrice(buyPrice) }}
                </div>
                <p class="text-xs text-gray-500 leading-relaxed">
                  回调5-8%时分批买入，建议在市场调整时分批次建仓
                </p>
              </div>
              
              <div class="p-4 bg-primary/10 border border-primary/30 rounded-lg">
                <div class="flex items-center justify-between mb-3">
                  <span class="text-primary text-sm font-medium">
                    <i class="fas fa-arrow-up mr-2"></i>建议止盈价
                  </span>
                </div>
                <div class="text-2xl font-bold font-mono text-primary mb-2">
                  {{ formatPrice(sellPrice) }}
                </div>
                <p class="text-xs text-gray-500 leading-relaxed">
                  上涨20%后部分止盈，可先卖出1/3仓位锁定利润
                </p>
              </div>
              
              <div class="p-4 bg-danger/10 border border-danger/30 rounded-lg">
                <div class="flex items-center justify-between mb-3">
                  <span class="text-danger text-sm font-medium">
                    <i class="fas fa-times-circle mr-2"></i>建议止损价
                  </span>
                </div>
                <div class="text-2xl font-bold font-mono text-danger mb-2">
                  {{ formatPrice(stopPrice) }}
                </div>
                <p class="text-xs text-gray-500 leading-relaxed">
                  下跌15%时止损，严格执行止损纪律
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Sidebar -->
      <div class="space-y-6">
        <!-- Market Depth -->
        <div class="card">
          <div class="card-header">
            <h3 class="text-sm font-semibold text-gray-200 flex items-center gap-2">
              <i class="fas fa-info-circle text-primary"></i>
              买卖盘口
            </h3>
          </div>
          <div class="card-body p-0">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-gray-700">
                  <th class="py-2 px-3 text-left text-gray-500 font-normal">买卖五档</th>
                  <th class="py-2 px-3 text-right text-gray-500 font-normal">委托数量</th>
                </tr>
              </thead>
              <tbody>
                <!-- Sell Orders -->
                <tr v-for="i in 5" :key="`sell-${i}`" class="border-b border-gray-800">
                  <td class="py-2 px-3 font-mono text-success">
                    {{ formatPrice(stockData[`ask${6-i}`]) }}
                  </td>
                  <td class="py-2 px-3 font-mono text-right text-gray-400">
                    {{ stockData[`ask${6-i}Vol`] || '--' }}
                  </td>
                </tr>
                <!-- Buy Orders -->
                <tr v-for="i in 5" :key="`buy-${i}`" class="border-b border-gray-800">
                  <td class="py-2 px-3 font-mono text-danger">
                    {{ formatPrice(stockData[`bid${i}`]) }}
                  </td>
                  <td class="py-2 px-3 font-mono text-right text-gray-400">
                    {{ stockData[`bid${i}Vol`] || '--' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Trade Summary -->
        <div class="card">
          <div class="card-header">
            <h3 class="text-sm font-semibold text-gray-200">成交概况</h3>
          </div>
          <div class="card-body">
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span class="text-gray-500 block">最新</span>
                <span class="font-mono" :class="priceChangeClass">{{ formatPrice(stockData.currentPrice) }}</span>
              </div>
              <div>
                <span class="text-gray-500 block">涨幅</span>
                <span class="font-mono" :class="priceChangeClass">{{ priceChangePercentText }}</span>
              </div>
              <div>
                <span class="text-gray-500 block">均价</span>
                <span class="font-mono text-gray-200">{{ formatPrice(stockData.avgPrice) }}</span>
              </div>
              <div>
                <span class="text-gray-500 block">总手</span>
                <span class="font-mono text-gray-200">{{ stockData.volume || '--' }}</span>
              </div>
              <div>
                <span class="text-gray-500 block">金额</span>
                <span class="font-mono text-gray-200">{{ stockData.turnover || '--' }}</span>
              </div>
              <div>
                <span class="text-gray-500 block">昨收</span>
                <span class="font-mono text-gray-400">{{ formatPrice(stockData.prevPrice) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Daily Range -->
        <div class="card">
          <div class="card-header">
            <h3 class="text-sm font-semibold text-gray-200">当日区间</h3>
          </div>
          <div class="card-body">
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span class="text-gray-500 block">今开</span>
                <span class="font-mono text-gray-200">{{ formatPrice(stockData.openPrice) }}</span>
              </div>
              <div>
                <span class="text-gray-500 block">最高</span>
                <span class="font-mono text-danger">{{ formatPrice(stockData.highPrice) }}</span>
              </div>
              <div>
                <span class="text-gray-500 block">最低</span>
                <span class="font-mono text-success">{{ formatPrice(stockData.lowPrice) }}</span>
              </div>
              <div>
                <span class="text-gray-500 block">涨停</span>
                <span class="font-mono text-danger">{{ formatPrice(stockData.limitUp) }}</span>
              </div>
              <div>
                <span class="text-gray-500 block">跌停</span>
                <span class="font-mono text-success">{{ formatPrice(stockData.limitDown) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Derived Indicators -->
        <div class="card">
          <div class="card-header">
            <h3 class="text-sm font-semibold text-gray-200">衍生指标</h3>
          </div>
          <div class="card-body">
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span class="text-gray-500 block">换手率</span>
                <span class="font-mono text-gray-200">{{ stockData.turnoverRate || '--' }}</span>
              </div>
              <div>
                <span class="text-gray-500 block">量比</span>
                <span class="font-mono text-gray-200">{{ stockData.volumeRatio || '--' }}</span>
              </div>
              <div>
                <span class="text-gray-500 block">市盈率</span>
                <span class="font-mono text-gray-200">{{ stockData.pe || '--' }}</span>
              </div>
              <div>
                <span class="text-gray-500 block">市净率</span>
                <span class="font-mono text-gray-200">{{ stockData.pb || '--' }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Back to Top -->
    <button
      v-show="showBackTop"
      @click="scrollToTop"
      class="fixed bottom-8 right-8 w-12 h-12 bg-primary text-white rounded-full shadow-glow flex items-center justify-center hover:bg-primary-dark transition-all"
    >
      <i class="fas fa-arrow-up"></i>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import * as echarts from 'echarts'
import { useStockApi } from '@/composables/useStockApi'
import { usePageMeta } from '@/composables/usePageMeta'
import { useAiAnalysis, AiAnalysisResult } from '@/composables/useAiAnalysis'

const route = useRoute()
const { getStockDetail, getKlineData, loading } = useStockApi()
const { 
  loading: aiLoading, 
  analysisData: aiAnalysisData,
  fetchAiAnalysis, 
  refreshAiAnalysis,
  getSignalColorClass,
  scoreColorClass,
  trendColorClass
} = useAiAnalysis()

const stockData = ref<any>({})
const klineData = ref<any[]>([])
const chartRef = ref<HTMLDivElement | null>(null)
const showBackTop = ref(false)

// 使用页面元数据 - 根据股票信息动态生成
usePageMeta(() => {
  const code = route.params.code as string
  const stockName = stockData.value.name
  if (stockName) {
    return {
      title: `${stockName}(${code}) - In Fortune AI`,
      description: `查看${stockName}(${code})的K线图表、买卖盘口、投资建议等详细分析，实时掌握股票动态`,
      keywords: `${code},${stockName},股票详情,K线图,投资建议,In Fortune AI`,
      openGraph: {
        title: `${stockName}(${code}) - In Fortune AI`,
        description: `查看${stockName}(${code})的K线图表、买卖盘口、投资建议等详细分析`,
        type: 'article',
      },
    }
  }
  return {}
})

let chart: echarts.ECharts | null = null

const timeRanges = [
  { label: '5分钟', value: '5m' },
  { label: '15分钟', value: '15m' },
  { label: '30分钟', value: '30m' },
  { label: '60分钟', value: '60m' },
  { label: '日K', value: '1d' },
  { label: '周K', value: '1w' },
  { label: '月K', value: '1m' }
]

const activeRange = ref('1d')

const maIndicators = ref([
  { key: 'ma5', label: 'MA5', color: '#f59e0b', show: true },
  { key: 'ma10', label: 'MA10', color: '#10b981', show: true },
  { key: 'ma20', label: 'MA20', color: '#6366f1', show: true },
  { key: 'ma30', label: 'MA30', color: '#ec4899', show: false },
  { key: 'ma50', label: 'MA50', color: '#8b5cf6', show: false }
])

const priceChange = computed(() => {
  const current = typeof stockData.value.currentPrice === 'string' ? parseFloat(stockData.value.currentPrice) : stockData.value.currentPrice || 0
  const prev = typeof stockData.value.prevPrice === 'string' ? parseFloat(stockData.value.prevPrice) : stockData.value.prevPrice || 0
  return current - prev
})

const priceChangePercent = computed(() => {
  const prev = typeof stockData.value.prevPrice === 'string' ? parseFloat(stockData.value.prevPrice) : stockData.value.prevPrice || 0
  if (prev === 0) return 0
  return (priceChange.value / prev * 100)
})

const priceChangeClass = computed(() => {
  if (priceChange.value > 0) return 'text-danger'
  if (priceChange.value < 0) return 'text-success'
  return 'text-gray-400'
})

const priceChangeText = computed(() => {
  const val = priceChange.value
  const sign = val >= 0 ? '+' : ''
  return `${sign}${parseFloat(val.toFixed(4))}`
})

const priceChangePercentText = computed(() => {
  const val = priceChangePercent.value
  const sign = val >= 0 ? '+' : ''
  return `${sign}${parseFloat(val.toFixed(4))}%`
})

const buyPrice = computed(() => {
  const current = typeof stockData.value.currentPrice === 'string' ? parseFloat(stockData.value.currentPrice) : stockData.value.currentPrice || 0
  return current * 0.93 // 回调7%
})

const sellPrice = computed(() => {
  const current = typeof stockData.value.currentPrice === 'string' ? parseFloat(stockData.value.currentPrice) : stockData.value.currentPrice || 0
  return current * 1.2 // 上涨20%
})

const stopPrice = computed(() => {
  const current = typeof stockData.value.currentPrice === 'string' ? parseFloat(stockData.value.currentPrice) : stockData.value.currentPrice || 0
  return current * 0.85 // 下跌15%
})

const formatPrice = (price: number | string) => {
  if (!price) return '--'
  const num = typeof price === 'string' ? parseFloat(price) : price
  return parseFloat(num.toFixed(4)).toString()
}

const formatDate = (dateStr: string) => {
  if (!dateStr || dateStr === '--') return '--'
  const str = dateStr.toString()
  if (str.length === 8) {
    return `${str.slice(0, 4)}-${str.slice(4, 6)}-${str.slice(6, 8)}`
  }
  return dateStr
}

const getCapitalFlowColor = (value: string) => {
  if (!value || value === '--') return 'text-gray-400'
  return value.includes('万') || value.includes('亿') ? 'text-danger' : 'text-success'
}

const initChart = () => {
  if (!chartRef.value) return
  
  chart = echarts.init(chartRef.value, 'dark')
  updateChart()
  
  window.addEventListener('resize', () => {
    chart?.resize()
  })
}

const updateChart = () => {
  if (!chart || klineData.value.length === 0) return

  const dates = klineData.value.map(d => d.date)
  const ohlc = klineData.value.map(d => [d.open, d.close, d.low, d.high])
  const volumes = klineData.value.map(d => d.volume)

  // 计算均线
  const calculateMA = (data: any[], period: number) => {
    const result: (number | null)[] = []
    for (let i = 0; i < data.length; i++) {
      if (i < period - 1) {
        result.push(null)
      } else {
        let sum = 0
        for (let j = 0; j < period; j++) {
          sum += data[i - j].close
        }
        result.push(+(sum / period).toFixed(2))
      }
    }
    return result
  }

  const ma5 = calculateMA(klineData.value, 5)
  const ma10 = calculateMA(klineData.value, 10)
  const ma20 = calculateMA(klineData.value, 20)

  const option: echarts.EChartsOption = {
    backgroundColor: 'transparent',
    animation: false,
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' },
      backgroundColor: 'rgba(30, 30, 50, 0.9)',
      borderColor: '#374151',
      textStyle: { color: '#e5e7eb' }
    },
    grid: [
      { left: '10%', right: '8%', top: '10%', height: '50%' },
      { left: '10%', right: '8%', top: '68%', height: '20%' }
    ],
    xAxis: [
      {
        type: 'category',
        data: dates,
        boundaryGap: false,
        axisLine: { lineStyle: { color: '#374151' } },
        axisLabel: { color: '#9ca3af' }
      },
      {
        type: 'category',
        gridIndex: 1,
        data: dates,
        boundaryGap: false,
        axisLine: { lineStyle: { color: '#374151' } },
        axisLabel: { show: false }
      }
    ],
    yAxis: [
      {
        scale: true,
        splitLine: { lineStyle: { color: '#374151', type: 'dashed' } },
        axisLine: { lineStyle: { color: '#374151' } },
        axisLabel: { color: '#9ca3af' }
      },
      {
        scale: true,
        gridIndex: 1,
        splitNumber: 2,
        axisLabel: { show: false },
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { show: false }
      }
    ],
    series: [
      {
        name: 'K线',
        type: 'candlestick',
        data: ohlc,
        itemStyle: {
          color: '#ef4444',
          color0: '#10b981',
          borderColor: '#ef4444',
          borderColor0: '#10b981'
        }
      },
      {
        name: 'MA5',
        type: 'line',
        data: ma5,
        smooth: true,
        lineStyle: { width: 1, color: '#f59e0b' },
        symbol: 'none'
      },
      {
        name: 'MA10',
        type: 'line',
        data: ma10,
        smooth: true,
        lineStyle: { width: 1, color: '#10b981' },
        symbol: 'none'
      },
      {
        name: 'MA20',
        type: 'line',
        data: ma20,
        smooth: true,
        lineStyle: { width: 1, color: '#6366f1' },
        symbol: 'none'
      },
      {
        name: '成交量',
        type: 'bar',
        xAxisIndex: 1,
        yAxisIndex: 1,
        data: volumes,
        itemStyle: {
          color: (params: any) => {
            const idx = params.dataIndex
            return klineData.value[idx].close >= klineData.value[idx].open ? '#ef4444' : '#10b981'
          }
        }
      }
    ]
  }

  chart.setOption(option)
}

const fetchData = async () => {
  const code = route.params.code as string
  stockData.value = await getStockDetail(code)
  klineData.value = await getKlineData(code, activeRange.value)
  updateChart()
  
  // 获取 AI 分析数据
  await fetchAiAnalysis(code)
}

const refreshAiAnalysisData = async () => {
  const code = route.params.code as string
  await refreshAiAnalysis(code)
}

const formatSniperPoint = (point?: string): string => {
  if (!point) return '--'
  return point
}

const getBiasColor = (bias?: number): string => {
  if (bias === undefined || bias === null) return 'text-gray-400'
  if (Math.abs(bias) < 2) return 'text-success'
  if (Math.abs(bias) < 5) return 'text-warning'
  return 'text-danger'
}

const handleScroll = () => {
  showBackTop.value = window.scrollY > 300
}

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

watch(activeRange, () => {
  fetchData()
})

onMounted(() => {
  fetchData()
  initChart()
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  chart?.dispose()
})
</script>
