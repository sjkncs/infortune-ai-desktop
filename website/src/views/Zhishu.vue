<template>
  <div class="py-8 px-4 sm:px-6 lg:px-8 w-full">
    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
      <div>
        <h1 class="text-2xl font-bold text-gray-100 flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
            <i class="fas fa-chart-bar text-primary"></i>
          </div>
          指数估值分析
        </h1>
        <p class="mt-2 text-gray-500">主要指数的估值分位及业绩展望，把握投资时机</p>
      </div>
      
      <div class="flex items-center gap-3 flex-wrap">
        <span class="text-sm text-gray-500">
          <i class="fas fa-clock mr-1"></i>
          更新时间: {{ updateTime }}
        </span>
        <button @click="exportExcel" class="btn btn-outline text-sm">
          <i class="fas fa-file-excel"></i>
          导出Excel
        </button>
        <button @click="refreshData" class="btn btn-primary text-sm" :disabled="loading">
          <i class="fas fa-sync-alt" :class="{ 'animate-spin': loading }"></i>
          刷新数据
        </button>
      </div>
    </div>

    <!-- Data Table -->
    <div class="card">
      <div class="overflow-x-auto">
        <table class="data-table">
          <thead>
            <tr>
              <th class="sticky left-0 bg-surface-light z-10">指数代码</th>
              <th class="sticky left-[100px] bg-surface-light z-10">指数名称</th>
              <th>指数类别</th>
              <th>当前价</th>
              <th>昨收价</th>
              <th>今年涨跌幅</th>
              <th>PE市盈率</th>
              <th>PE分位(10年)</th>
              <th>PB市净率</th>
              <th>PB分位(10年)</th>
              <th>股息率</th>
              <th>ROE</th>
              <th>营收同比</th>
              <th>净利润同比</th>
              <th>未来营收增长</th>
              <th>未来利润增长</th>
              <th>跟踪基金</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="20" class="text-center py-12">
                <div class="flex flex-col items-center gap-3">
                  <div class="loading-spinner w-8 h-8"></div>
                  <span class="text-gray-500">正在加载数据...</span>
                </div>
              </td>
            </tr>
            <tr v-else-if="valuationData.length === 0">
              <td colspan="20" class="text-center py-12 text-gray-500">
                <i class="fas fa-inbox text-4xl mb-3 block"></i>
                暂无数据
              </td>
            </tr>
            <tr v-else v-for="item in valuationData" :key="item.indexCode" class="group">
              <td class="sticky left-0 bg-surface-card group-hover:bg-surface-light font-mono text-primary">
                {{ item.indexCode || '--' }}
              </td>
              <td class="sticky left-[100px] bg-surface-card group-hover:bg-surface-light font-medium">
                {{ item.indexName || '--' }}
              </td>
              <td>
                <span class="tag tag-primary">{{ item.category || '--' }}</span>
              </td>
              <td class="font-mono" :class="getPriceClass(item.currentPrice, item.prevPrice)">
                <template v-if="loadingCodes.has(item.indexCode)">
                  <div class="flex items-center gap-2">
                    <div class="loading-spinner w-4 h-4"></div>
                    <span class="text-gray-400 text-xs">加载中</span>
                  </div>
                </template>
                <template v-else>
                  {{ formatValue(item.currentPrice, 2) }}
                </template>
              </td>
              <td class="font-mono text-gray-400">{{ formatValue(item.prevPrice, 2) }}</td>
              <td class="font-mono" :class="getChangeClass(item.ytdChange)">
                {{ formatChange(item.ytdChange) }}
              </td>
              <td class="font-mono">{{ formatValue(item.pe, 2) }}</td>
              <td>
                <div class="flex items-center gap-2" v-if="item.pePercentile !== null && item.pePercentile !== undefined">
                  <div class="w-16 h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      class="h-full rounded-full transition-all"
                      :class="getPercentileClass(item.pePercentile)"
                      :style="{ width: `${item.pePercentile}%` }"
                    ></div>
                  </div>
                  <span class="text-xs" :class="getPercentileTextClass(item.pePercentile)">
                    {{ item.pePercentile?.toFixed(1) }}%
                  </span>
                </div>
                <span v-else class="text-gray-500">--</span>
              </td>
              <td class="font-mono">{{ formatValue(item.pb, 2) }}</td>
              <td>
                <div class="flex items-center gap-2" v-if="item.pbPercentile !== null && item.pbPercentile !== undefined">
                  <div class="w-16 h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      class="h-full rounded-full transition-all"
                      :class="getPercentileClass(item.pbPercentile)"
                      :style="{ width: `${item.pbPercentile}%` }"
                    ></div>
                  </div>
                  <span class="text-xs" :class="getPercentileTextClass(item.pbPercentile)">
                    {{ item.pbPercentile?.toFixed(1) }}%
                  </span>
                </div>
                <span v-else class="text-gray-500">--</span>
              </td>
              <td class="font-mono text-warning">{{ formatPercent(item.dividend) }}</td>
              <td class="font-mono">{{ formatPercent(item.roe) }}</td>
              <td class="font-mono" :class="getChangeClass(item.revenueGrowth)">
                {{ formatChange(item.revenueGrowth) }}
              </td>
              <td class="font-mono" :class="getChangeClass(item.profitGrowth)">
                {{ formatChange(item.profitGrowth) }}
              </td>
              <td class="font-mono text-primary-light">{{ formatChange(item.futureRevenueGrowth) }}</td>
              <td class="font-mono text-primary-light">{{ formatChange(item.futureProfitGrowth) }}</td>
              <td class="font-mono text-gray-400">{{ item.trackingFund || '--' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Legend -->
    <div class="mt-6 card p-4">
      <h3 class="text-sm font-semibold text-gray-300 mb-3">估值分位说明</h3>
      <div class="flex flex-wrap gap-6 text-xs">
        <div class="flex items-center gap-2">
          <div class="w-4 h-4 rounded bg-success"></div>
          <span class="text-gray-400">0-30%: 低估区间，适合建仓</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-4 h-4 rounded bg-warning"></div>
          <span class="text-gray-400">30-70%: 正常区间，持有观望</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-4 h-4 rounded bg-danger"></div>
          <span class="text-gray-400">70-100%: 高估区间，谨慎操作</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useStockApi, type ValuationItem } from '@/composables/useStockApi'
import { usePageMeta } from '@/composables/usePageMeta'

// 使用页面元数据
usePageMeta()

const { getValuation, loading, loadingCodes } = useStockApi()

const valuationData = ref<ValuationItem[]>([])
const updateTime = ref('--')

const fetchData = () => {
  try {
    updateTime.value = '加载中...'

    // 获取数据，使用回调方式处理初始数据和更新
    // 初始数据会立即通过回调显示，实时数据在后台逐个更新
    getValuation(
      // 初始数据回调 - 立即显示数据库中的数据
      (initialItems) => {
        valuationData.value = initialItems
        updateTime.value = new Date().toLocaleString('zh-CN')
        console.log('初始数据已显示，共:', initialItems.length, '条')
      },
      // 单个更新回调 - 逐个更新实时数据
      (updatedItem, index) => {
        // 更新对应索引的数据（使用 splice 触发 Vue 响应式）
        if (index >= 0 && index < valuationData.value.length) {
          valuationData.value.splice(index, 1, updatedItem)
          console.log('指数数据已更新:', updatedItem.indexName)
        }
      }
    )
  } catch (error) {
    console.error('获取指数估值数据失败:', error)
    valuationData.value = []
    updateTime.value = '加载失败'
  }
}

const refreshData = () => {
  fetchData()
}

const clearCache = () => {
  localStorage.clear()
  fetchData()
}

const exportExcel = () => {
  alert('导出Excel功能开发中...')
}

const formatPrice = (price: number) => {
  return price?.toFixed(2) || '--'
}

// 格式化数值，空值显示"--"
const formatValue = (value: number | null | undefined, decimals: number = 2): string => {
  if (value === null || value === undefined || isNaN(value)) {
    return '--'
  }
  return value.toFixed(decimals)
}

// 格式化百分比变化，空值显示"--"
const formatChange = (value: number | null | undefined): string => {
  if (value === null || value === undefined || isNaN(value)) {
    return '--'
  }
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(2)}%`
}

// 格式化百分比，空值显示"--"
const formatPercent = (value: number | null | undefined, decimals: number = 2): string => {
  if (value === null || value === undefined || isNaN(value)) {
    return '--'
  }
  return `${value.toFixed(decimals)}%`
}

// 获取涨跌幅样式类
const getChangeClass = (value: number | null | undefined): string => {
  if (value === null || value === undefined || isNaN(value)) {
    return 'text-gray-500'
  }
  return value >= 0 ? 'text-up' : 'text-down'
}

const getPriceClass = (current: number | null, prev: number | null) => {
  if (current === null || prev === null) return 'text-gray-400'
  return current >= prev ? 'text-up' : 'text-down'
}

const getPercentileClass = (percentile: number) => {
  if (percentile <= 30) return 'bg-success'
  if (percentile <= 70) return 'bg-warning'
  return 'bg-danger'
}

const getPercentileTextClass = (percentile: number) => {
  if (percentile <= 30) return 'text-success'
  if (percentile <= 70) return 'text-warning'
  return 'text-danger'
}

onMounted(() => {
  fetchData()
})
</script>
