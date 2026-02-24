<template>
  <div class="py-8 px-4 sm:px-6 lg:px-8 w-full">
    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
      <div>
        <h1 class="text-2xl font-bold text-gray-100 flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
            <i class="fas fa-chart-line text-primary"></i>
          </div>
          ETF列表
        </h1>
        <p class="mt-2 text-gray-500">展示A股市场全部ETF基金实时行情数据</p>
      </div>

      <div class="flex items-center gap-3 flex-wrap">
        <span class="text-sm text-gray-500">
          <i class="fas fa-clock mr-1"></i>
          更新时间: {{ updateTime }}
        </span>
        <button 
          @click="fetchETFData" 
          :disabled="loading"
          class="btn btn-primary text-sm"
        >
          <i class="fas fa-sync-alt" :class="{ 'animate-spin': loading }"></i>
          刷新数据
        </button>
      </div>
    </div>

    <!-- 数据表格 -->
    <div>
      <!-- 搜索条件和统计信息 -->
      <div class="card mb-6 p-4">
        <div class="flex items-center justify-between gap-4 flex-wrap">
          <!-- 左侧：搜索输入框 -->
          <div class="flex items-center gap-3 flex-wrap">
            <div class="flex items-center gap-2">
              <label class="text-sm text-gray-400 whitespace-nowrap">代码:</label>
              <input
                v-model="codeFilter"
                type="text"
                placeholder="输入ETF代码"
                class="input input-sm w-32"
              />
            </div>
            <div class="flex items-center gap-2">
              <label class="text-sm text-gray-400 whitespace-nowrap">名称:</label>
              <input
                v-model="nameFilter"
                type="text"
                placeholder="输入ETF名称关键词"
                class="input input-sm w-48"
              />
            </div>
            <button
              v-if="codeFilter || nameFilter"
              @click="clearFilters"
              class="tag tag-outline cursor-pointer hover:opacity-80 transition-opacity"
            >
              <i class="fas fa-times mr-1"></i>清除筛选
            </button>
          </div>

          <!-- 右侧：统计信息 -->
          <div class="flex items-center gap-4 text-sm text-gray-400 whitespace-nowrap">
            <span>
              共 <span class="text-primary font-semibold">{{ totalItems }}</span> 只ETF基金
            </span>
            <span>
              第 {{ currentPage }} / {{ totalPages }} 页
            </span>
            <span v-if="totalItems > pageSize" class="text-xs text-gray-500">
              (每页{{ pageSize }}条)
            </span>
          </div>
        </div>
      </div>

      <!-- ETF列表表格 -->
      <div class="card p-0">
        <div class="overflow-x-auto">
          <table class="data-table">
            <thead>
              <tr>
                <th class="sticky left-0 bg-surface-light z-10 w-24">ETF代码</th>
                <th class="sticky left-[96px] bg-surface-light z-10 min-w-[160px] max-w-[240px]">ETF名称</th>
                <th class="whitespace-nowrap">最新价</th>
                <th class="whitespace-nowrap cursor-pointer hover:text-primary transition-colors" @click="toggleSort('changeAmount')">
                  涨跌额
                  <i class="fas ml-1 text-xs" :class="getSortIconClass('changeAmount')"></i>
                </th>
                <th class="whitespace-nowrap cursor-pointer hover:text-primary transition-colors" @click="toggleSort('changePercent')">
                  涨跌幅
                  <i class="fas ml-1 text-xs" :class="getSortIconClass('changePercent')"></i>
                </th>
                <th class="whitespace-nowrap">成交量(万)</th>
                <th class="whitespace-nowrap">成交额(亿)</th>
                <th class="whitespace-nowrap">开盘价</th>
                <th class="whitespace-nowrap">最高价</th>
                <th class="whitespace-nowrap">最低价</th>
                <th class="whitespace-nowrap">昨收</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loading">
                <td colspan="11" class="text-center py-12">
                  <div class="flex flex-col items-center gap-3">
                    <div class="loading-spinner w-8 h-8"></div>
                    <span class="text-gray-500">正在加载数据...</span>
                  </div>
                </td>
              </tr>
              <tr v-else-if="etfData.length === 0">
                <td colspan="11" class="text-center py-12 text-gray-500">
                  <i class="fas fa-inbox text-4xl mb-3 block"></i>
                  暂无数据
                </td>
              </tr>
              <tr v-else v-for="etf in paginatedData" :key="etf.code" class="group">
                <td class="sticky left-0 bg-surface-card group-hover:bg-surface-light font-mono text-primary w-24 whitespace-nowrap">
                  {{ etf.code }}
                </td>
                <td class="sticky left-[96px] bg-surface-card group-hover:bg-surface-light font-medium min-w-[160px] max-w-[240px]">
                  <router-link
                    :to="`/stock/${etf.code}`"
                    class="text-primary hover:text-primary-light transition-colors block cursor-pointer break-words"
                    :title="etf.name"
                    @click.stop
                  >
                    {{ etf.name }}
                  </router-link>
                </td>
                <td class="font-mono whitespace-nowrap" :class="getChangeClass(etf.changeAmount)">{{ formatPrice(etf.currentPrice) }}</td>
                <td class="whitespace-nowrap">
                  <span :class="getChangeClass(etf.changeAmount)" class="font-mono">
                    {{ formatChange(etf.changeAmount) }}
                  </span>
                </td>
                <td class="whitespace-nowrap">
                  <span :class="getChangeClass(etf.changePercent)" class="font-mono">
                    {{ formatPercent(etf.changePercent) }}
                  </span>
                </td>
                <td class="font-mono whitespace-nowrap">{{ formatVolume(etf.volume) }}</td>
                <td class="font-mono whitespace-nowrap">{{ formatAmount(etf.turnover) }}</td>
                <td class="font-mono whitespace-nowrap text-gray-400">{{ formatPrice(etf.openPrice) }}</td>
                <td class="font-mono whitespace-nowrap text-gray-400">{{ formatPrice(etf.highPrice) }}</td>
                <td class="font-mono whitespace-nowrap text-gray-400">{{ formatPrice(etf.lowPrice) }}</td>
                <td class="font-mono whitespace-nowrap text-gray-400">{{ formatPrice(etf.prevClose) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 分页控件 -->
      <div v-if="totalItems > 0" class="mt-6 flex justify-center">
        <div class="flex items-center gap-1.5 text-sm">
          <!-- 上一页 -->
          <button 
            class="px-3 py-2 rounded-lg border border-gray-600 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-400"
            :disabled="currentPage === 1 || loading"
            @click="currentPage--"
          >
            <i class="fas fa-chevron-left"></i>
          </button>
          
          <!-- 页码按钮 -->
          <template v-for="(page, index) in visiblePages" :key="index">
            <!-- 省略号 -->
            <span v-if="page === '...'" class="px-2 py-2 text-gray-500">...</span>
            <!-- 页码按钮 -->
            <button 
              v-else
              class="min-w-[36px] px-3 py-2 rounded-lg border transition-colors"
              :class="currentPage === page 
                ? 'bg-primary text-white border-primary' 
                : 'border-gray-600 text-gray-400 hover:bg-gray-700'"
              :disabled="loading"
              @click="currentPage = page as number"
            >
              {{ page }}
            </button>
          </template>
          
          <!-- 下一页 -->
          <button 
            class="px-3 py-2 rounded-lg border border-gray-600 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-400"
            :disabled="currentPage === totalPages || loading"
            @click="currentPage++"
          >
            <i class="fas fa-chevron-right"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- 回到顶部按钮 -->
    <button 
      v-if="showScrollToTop"
      @click="scrollToTop"
      class="fixed bottom-8 right-8 w-12 h-12 bg-primary hover:bg-primary-dark rounded-full flex items-center justify-center text-white shadow-lg transition-all duration-300 z-50"
      :class="{ 'opacity-0 scale-0': !showScrollToTop, 'opacity-100 scale-100': showScrollToTop }"
    >
      <i class="fas fa-arrow-up"></i>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { usePageMeta } from '@/composables/usePageMeta'
import api from '@/api'

// 使用页面元数据
usePageMeta()

interface ETFItem {
  code: string
  name: string
  currentPrice: number
  changeAmount: number
  changePercent: number
  volume: number
  turnover: number
  openPrice: number
  highPrice: number
  lowPrice: number
  prevClose: number
}

const loading = ref(false)
const etfData = ref<ETFItem[]>([])
const updateTime = ref('')
const currentPage = ref(1)
const pageSize = ref(50)
const totalItems = ref(0)
const totalPages = ref(1)
const backendTotal = ref(0)  // 后端返回的总记录数
const backendTotalPages = ref(1)  // 后端返回的总页数

// 筛选条件
const codeFilter = ref('')
const nameFilter = ref('')

// 回到顶部功能
const showScrollToTop = ref(false)

// 滚动事件监听
const handleScroll = () => {
  showScrollToTop.value = window.scrollY > 300
}

// 滚动到顶部
const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  })
}

// 排序状态
const sortField = ref<string>('')
const sortOrder = ref<'asc' | 'desc'>('desc')

// 切换排序
const toggleSort = (field: string) => {
  if (sortField.value === field) {
    // 如果已经是当前排序字段，切换排序方向
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    // 如果是新的排序字段，默认降序
    sortField.value = field
    sortOrder.value = 'desc'
  }
}

// 获取排序图标样式
const getSortIconClass = (field: string) => {
  if (sortField.value !== field) {
    return 'fa-sort text-gray-600'
  }
  return sortOrder.value === 'asc' ? 'fa-sort-up text-primary' : 'fa-sort-down text-primary'
}

// 筛选并排序后的数据
const filteredData = computed(() => {
  if (!etfData.value.length) return []

  let result = etfData.value.filter(item => {
    // 代码筛选 - 精确匹配
    if (codeFilter.value && !item.code.includes(codeFilter.value)) {
      return false
    }

    // 名称筛选 - 模糊匹配
    if (nameFilter.value && !item.name.includes(nameFilter.value)) {
      return false
    }

    return true
  })

  // 应用排序
  if (sortField.value) {
    result = [...result].sort((a, b) => {
      const aVal = a[sortField.value as keyof ETFItem] as number
      const bVal = b[sortField.value as keyof ETFItem] as number
      if (sortOrder.value === 'asc') {
        return aVal - bVal
      } else {
        return bVal - aVal
      }
    })
  }

  return result
})

// 计算当前页显示的数据（后端已分页，前端只做筛选，不再切片）
const paginatedData = computed(() => {
  return filteredData.value
})

// 生成分页页码数组（支持省略号）
const visiblePages = computed(() => {
  const pages: (number | string)[] = []
  const total = totalPages.value
  const current = currentPage.value

  if (total <= 7) {
    // 如果总页数少于7页，显示所有页码
    for (let i = 1; i <= total; i++) {
      pages.push(i)
    }
  } else {
    // 总页数超过7页，需要显示省略号
    if (current <= 3) {
      // 当前页在前3页：显示 1 2 3 4 5 ... total
      for (let i = 1; i <= 5; i++) {
        pages.push(i)
      }
      pages.push('...')
      pages.push(total)
    } else if (current >= total - 2) {
      // 当前页在后3页：显示 1 ... total-4 total-3 total-2 total-1 total
      pages.push(1)
      pages.push('...')
      for (let i = total - 4; i <= total; i++) {
        pages.push(i)
      }
    } else {
      // 当前页在中间：显示 1 ... current-1 current current+1 ... total
      pages.push(1)
      pages.push('...')
      for (let i = current - 1; i <= current + 1; i++) {
        pages.push(i)
      }
      pages.push('...')
      pages.push(total)
    }
  }

  return pages
})

// 更新分页信息（有筛选时用本地计数，无筛选时用后端计数）
const updatePagination = () => {
  if (codeFilter.value || nameFilter.value) {
    // 有筛选条件时，使用筛选后的数量
    totalItems.value = filteredData.value.length
    totalPages.value = Math.ceil(totalItems.value / pageSize.value)
  } else {
    // 无筛选条件时，使用后端返回的总数
    totalItems.value = backendTotal.value
    totalPages.value = backendTotalPages.value
  }
}

// 监听筛选条件变化，重置到第一页并更新分页
watch([codeFilter, nameFilter], () => {
  currentPage.value = 1
  updatePagination()
})

// 监听筛选数据变化，更新总数
watch(filteredData, () => {
  updatePagination()
})

// 清除筛选条件
const clearFilters = () => {
  codeFilter.value = ''
  nameFilter.value = ''
  // 恢复后端返回的分页信息
  totalItems.value = backendTotal.value
  totalPages.value = backendTotalPages.value
}

// 获取涨跌样式
const getChangeClass = (value: number) => {
  if (value > 0) return 'text-down'
  if (value < 0) return 'text-up'
  return 'text-gray-400'
}

// 格式化价格
const formatPrice = (price: number) => {
  if (!price) return '--'
  return price.toFixed(3)
}

// 格式化涨跌额
const formatChange = (change: number) => {
  if (!change && change !== 0) return '--'
  return change > 0 ? `+${change.toFixed(3)}` : change.toFixed(3)
}

// 格式化涨跌幅
const formatPercent = (percent: number) => {
  if (!percent && percent !== 0) return '--'
  return percent > 0 ? `+${percent.toFixed(2)}%` : `${percent.toFixed(2)}%`
}

// 格式化成交量（转换为万手）
const formatVolume = (volume: number) => {
  if (!volume) return '--'
  return (volume / 10000).toFixed(2)
}

// 格式化成交额（转换为万元）
const formatAmount = (amount: number) => {
  if (!amount) return '--'
  if (amount >= 10000) {
    return (amount / 10000).toFixed(2) + '亿'
  }
  return amount.toFixed(2) + '万'
}

// 获取ETF数据
const fetchETFData = async () => {
  loading.value = true
  try {
    const response = await api.get('/etf/list', {
      params: {
        page: currentPage.value,
        page_size: pageSize.value
      }
    })

    console.log('ETF API Response:', response)

    if (response.success && response.data) {
      // 适配后端返回的数据结构（etfs数组）
      const rawList = response.data.etfs || []
      console.log('Raw ETF list:', rawList)
      console.log('First item:', rawList[0])

      // 将后端字段映射为前端字段
      etfData.value = rawList.map((item: any) => {
        const quote = item['quote'] || {}
        const preclose = quote['preclose'] || 0
        const close = quote['close'] || 0
        // 处理代码格式：sh.510010 -> sh510010
        const rawCode = item['code'] || ''
        const code = rawCode.replace(/\./g, '')
        return {
          code: code,
          name: item['code_name'] || '',
          currentPrice: close,
          changeAmount: preclose > 0 ? close - preclose : 0,
          changePercent: quote['pctChg'] || 0,
          volume: quote['volume'] || 0,
          turnover: quote['amount'] || 0,
          openPrice: quote['open'] || 0,
          highPrice: quote['high'] || 0,
          lowPrice: quote['low'] || 0,
          prevClose: preclose
        }
      })

      console.log('Mapped ETF data:', etfData.value)

      // 保存后端返回的分页信息
      backendTotal.value = response.data.total || rawList.length
      backendTotalPages.value = response.data.total_pages || Math.ceil(backendTotal.value / pageSize.value)

      // 根据是否有筛选条件设置显示的分页信息
      if (codeFilter.value || nameFilter.value) {
        totalItems.value = etfData.value.length
        totalPages.value = Math.ceil(totalItems.value / pageSize.value)
      } else {
        totalItems.value = backendTotal.value
        totalPages.value = backendTotalPages.value
      }

      updateTime.value = response.updateTime || new Date().toLocaleString('zh-CN')
    } else {
      console.warn('API response invalid:', response)
      etfData.value = []
      totalItems.value = 0
      totalPages.value = 1
    }
  } catch (error) {
    console.error('获取ETF数据失败:', error)
    etfData.value = []
    totalItems.value = 0
    totalPages.value = 1
  } finally {
    loading.value = false
  }
}

// 监听页码变化，自动获取数据
watch(currentPage, () => {
  fetchETFData()
  // 滚动到顶部
  window.scrollTo({ top: 0, behavior: 'smooth' })
})



onMounted(() => {
  fetchETFData()
  // 添加滚动事件监听
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  // 清理滚动事件监听
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped>
.text-up {
  @apply text-green-400;
}

.text-down {
  @apply text-red-400;
}

.data-table {
  @apply w-full text-sm text-left;
}

.data-table th {
  @apply px-4 py-3 bg-gray-800 font-medium text-gray-300 border-b border-gray-700 whitespace-nowrap;
}

.data-table td {
  @apply px-4 py-3 border-b border-gray-800;
}

.data-table tr:last-child td {
  @apply border-b-0;
}

.btn {
  @apply px-4 py-2 rounded-lg font-medium transition-all duration-200;
}

.btn-primary {
  @apply bg-primary text-white hover:bg-primary-dark;
}

.btn:disabled {
  @apply opacity-50 cursor-not-allowed;
}

.card {
  @apply bg-gray-800/50 rounded-xl border border-gray-700/50;
}

.tag {
  @apply px-2 py-1 rounded text-xs font-medium transition-colors;
}

.tag-outline {
  @apply border border-gray-600 text-gray-400 hover:border-gray-500 hover:text-gray-300;
}

.tag-primary {
  @apply bg-primary text-white;
}
</style>