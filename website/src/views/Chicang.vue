<template>
  <div class="py-8 px-4 sm:px-6 lg:px-8 w-full">
    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
      <div>
        <h1 class="text-2xl font-bold text-gray-100 flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
            <i class="fas fa-briefcase text-primary"></i>
          </div>
          持仓分析
        </h1>
        <p class="mt-2 text-gray-500">全面分析您的自选持仓，实时追踪市场动态</p>
      </div>

      <div class="flex items-center gap-3 flex-wrap">
        <span class="text-sm text-gray-500">
          <i class="fas fa-clock mr-1"></i>
          更新时间: {{ updateTime }}
        </span>
        <button @click="exportExcel" class="btn btn-outline text-sm" :disabled="exporting || filteredData.length === 0">
          <i class="fas fa-file-excel" :class="{ 'animate-pulse': exporting }"></i>
          {{ exporting ? '导出中...' : '导出Excel' }}
        </button>
        <button @click="saveData" class="btn btn-outline text-sm" :disabled="saving || exporting || filteredData.length === 0">
          <i class="fas fa-save" :class="{ 'animate-spin': saving }"></i>
          {{ saving ? '保存中...' : '保存数据' }}
        </button>
        <button @click="refreshData" class="btn btn-primary text-sm" :disabled="loading">
          <i class="fas fa-sync-alt" :class="{ 'animate-spin': loading }"></i>
          刷新数据
        </button>
      </div>
    </div>

    <!-- Filter Section - Clustered Search -->
    <div class="card mb-6 hidden">
      <div class="p-4">


        <!-- Active Filters -->
        <div v-if="Object.keys(activeFilters).some(key => activeFilters[key].length > 0)" class="mb-4">
          <div class="flex flex-wrap gap-2">
            <div v-for="(filters, field) in activeFilters" :key="field">
              <div v-for="value in filters" :key="value" class="flex items-center gap-1">
                <span class="tag tag-primary flex items-center gap-1">
                  {{ getFieldLabel(field) }}: {{ value }}
                  <button @click="removeFilter(field, value)" class="hover:text-red-400">
                    <i class="fas fa-times text-xs"></i>
                  </button>
                </span>
              </div>
            </div>
            <button @click="clearAllFilters" class="tag tag-outline text-sm">
              <i class="fas fa-times mr-1"></i>清除全部
            </button>
          </div>
        </div>

        <!-- Filter Categories - Same Line Layout with Expand Button on Right Side -->
        <div class="space-y-3">
          <!-- 所在市场 -->
          <div class="filter-category-row flex items-start gap-3">
            <h3 class="text-sm font-medium text-gray-400 whitespace-nowrap pt-1">所在市场</h3>
            <div class="flex-1 min-w-0 flex items-center gap-3">
              <div
                ref="marketContainer"
                :class="[
                  'flex flex-wrap gap-1',
                  !expandedCategories.market && showExpandButton('market') ? 'max-h-8 overflow-hidden' : ''
                ]"
              >
                <button
                  v-for="option in filterOptions.market"
                  :key="option.value"
                  @click="toggleFilter('market', option.value)"
                  :class="[
                    'tag',
                    activeFilters.market?.includes(option.value) ? 'tag-primary' : 'tag-outline',
                    'cursor-pointer hover:opacity-80 transition-opacity'
                  ]"
                >
                  {{ option.value }} <span class="text-gray-500 ml-1">({{ option.count }})</span>
                </button>
              </div>
              <button
                v-if="showExpandButton('market')"
                @click="toggleExpand('market')"
                class="text-xs text-primary hover:text-primary-light transition-colors whitespace-nowrap"
              >
                {{ expandedCategories.market ? '收起' : '展开' }}
              </button>
            </div>
          </div>

          <!-- 股票类别 -->
          <div class="filter-category-row flex items-start gap-3">
            <h3 class="text-sm font-medium text-gray-400 whitespace-nowrap pt-1">股票类别</h3>
            <div class="flex-1 min-w-0 flex items-center gap-3">
              <div
                ref="categoryContainer"
                :class="[
                  'flex flex-wrap gap-1',
                  !expandedCategories.category && showExpandButton('category') ? 'max-h-8 overflow-hidden' : ''
                ]"
              >
                <button
                  v-for="option in filterOptions.category"
                  :key="option.value"
                  @click="toggleFilter('category', option.value)"
                  :class="[
                    'tag',
                    activeFilters.category?.includes(option.value) ? 'tag-primary' : 'tag-outline',
                    'cursor-pointer hover:opacity-80 transition-opacity'
                  ]"
                >
                  {{ option.value }} <span class="text-gray-500 ml-1">({{ option.count }})</span>
                </button>
              </div>
              <button
                v-if="showExpandButton('category')"
                @click="toggleExpand('category')"
                class="text-xs text-primary hover:text-primary-light transition-colors whitespace-nowrap"
              >
                {{ expandedCategories.category ? '收起' : '展开' }}
              </button>
            </div>
          </div>

          <!-- 所属行业 -->
          <div class="filter-category-row flex items-start gap-3">
            <h3 class="text-sm font-medium text-gray-400 whitespace-nowrap pt-1">所属行业</h3>
            <div class="flex-1 min-w-0 flex items-center gap-3">
              <div
                ref="industryContainer"
                :class="[
                  'flex flex-wrap gap-1',
                  !expandedCategories.industry && showExpandButton('industry') ? 'max-h-8 overflow-hidden' : ''
                ]"
              >
                <button
                  v-for="option in filterOptions.industry"
                  :key="option.value"
                  @click="toggleFilter('industry', option.value)"
                  :class="[
                    'tag',
                    activeFilters.industry?.includes(option.value) ? 'tag-primary' : 'tag-outline',
                    'cursor-pointer hover:opacity-80 transition-opacity'
                  ]"
                >
                  {{ option.value }} <span class="text-gray-500 ml-1">({{ option.count }})</span>
                </button>
              </div>
              <button
                v-if="showExpandButton('industry')"
                @click="toggleExpand('industry')"
                class="text-xs text-primary hover:text-primary-light transition-colors whitespace-nowrap"
              >
                {{ expandedCategories.industry ? '收起' : '展开' }}
              </button>
            </div>
          </div>

          <!-- 核心主题 -->
          <div class="filter-category-row flex items-start gap-3">
            <h3 class="text-sm font-medium text-gray-400 whitespace-nowrap pt-1">核心主题</h3>
            <div class="flex-1 min-w-0 flex items-center gap-3">
              <div
                ref="themeContainer"
                :class="[
                  'flex flex-wrap gap-1',
                  !expandedCategories.theme && showExpandButton('theme') ? 'max-h-8 overflow-hidden' : ''
                ]"
              >
                <button
                  v-for="option in filterOptions.theme"
                  :key="option.value"
                  @click="toggleFilter('theme', option.value)"
                  :class="[
                    'tag',
                    activeFilters.theme?.includes(option.value) ? 'tag-primary' : 'tag-outline',
                    'cursor-pointer hover:opacity-80 transition-opacity'
                  ]"
                >
                  {{ option.value }} <span class="text-gray-500 ml-1">({{ option.count }})</span>
                </button>
              </div>
              <button
                v-if="showExpandButton('theme')"
                @click="toggleExpand('theme')"
                class="text-xs text-primary hover:text-primary-light transition-colors whitespace-nowrap"
              >
                {{ expandedCategories.theme ? '收起' : '展开' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Data Table -->
    <div class="card">
      <div class="overflow-x-auto">
        <table class="data-table">
          <thead>
            <tr>
              <th class="sticky left-0 bg-surface-light z-10 w-24">股票代码</th>
              <th class="sticky left-[96px] bg-surface-light z-10 min-w-[160px] max-w-[240px]">股票名称</th>
              <th>所在市场</th>
              <th>股票类别</th>
              <th>所属行业</th>
              <th>核心主题</th>
              <th>投资风格</th>
              <th>所属板块</th>
              <th>状态</th>
              <th class="whitespace-nowrap">当前价</th>
              <th class="whitespace-nowrap">昨收价</th>
              <th class="whitespace-nowrap">涨跌幅</th>
              <th class="whitespace-nowrap">MA5</th>
              <th class="whitespace-nowrap">MA10</th>
              <th class="whitespace-nowrap">MA20</th>
              <th class="whitespace-nowrap">MA30</th>
              <th class="whitespace-nowrap">MA50</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="17" class="text-center py-12">
                <div class="flex flex-col items-center gap-3">
                  <div class="loading-spinner w-8 h-8"></div>
                  <span class="text-gray-500">正在加载数据...</span>
                </div>
              </td>
            </tr>
            <tr v-else-if="filteredData.length === 0">
              <td colspan="17" class="text-center py-12 text-gray-500">
                <i class="fas fa-inbox text-4xl mb-3 block"></i>
                暂无数据
              </td>
            </tr>
            <tr v-else v-for="item in filteredData" :key="item.code" class="group">
              <td class="sticky left-0 bg-surface-card group-hover:bg-surface-light font-mono text-primary w-24 whitespace-nowrap">
                {{ item.code }}
              </td>
              <td class="sticky left-[96px] bg-surface-card group-hover:bg-surface-light font-medium min-w-[160px] max-w-[240px]">
                <router-link
                  :to="`/stock/${item.code}`"
                  class="text-primary hover:text-primary-light transition-colors block cursor-pointer break-words"
                  :title="item.name"
                  @click.stop
                >
                  {{ item.name }}
                </router-link>
              </td>
              <td class="whitespace-nowrap">
                <span class="tag" :class="getMarketTagClass(item.market)">{{ item.market }}</span>
              </td>
              <td class="text-gray-400 whitespace-nowrap">{{ item.category }}</td>
              <td class="text-gray-400 whitespace-nowrap">{{ item.industry }}</td>
              <td class="whitespace-nowrap">
                <span class="tag tag-primary">{{ item.theme }}</span>
              </td>
              <td class="text-gray-400 whitespace-nowrap">{{ item.style }}</td>
              <td class="text-gray-400 whitespace-nowrap">{{ item.sector }}</td>
              <td class="whitespace-nowrap">
                <span class="tag" :class="getLiquidatedClass(item.isLiquidated)">
                  {{ item.isLiquidated === '是' ? '已清仓' : '持仓中' }}
                </span>
              </td>
              <td class="font-mono whitespace-nowrap" :class="getPriceClass(item.currentPrice, item.prevPrice)">
                {{ formatPrice(item.currentPrice) }}
              </td>
              <td class="font-mono text-gray-400 whitespace-nowrap">{{ formatPrice(item.prevPrice) }}</td>
              <td class="whitespace-nowrap">
                <span class="tag font-mono" :class="getChangeTagClass(item.currentPrice, item.prevPrice)">{{ formatChange(item.currentPrice, item.prevPrice) }}</span>
              </td>
              <td class="font-mono whitespace-nowrap" :class="getMaClass(item.currentPrice, item.ma5)">
                {{ formatPrice(item.ma5) }}
              </td>
              <td class="font-mono whitespace-nowrap" :class="getMaClass(item.currentPrice, item.ma10)">
                {{ formatPrice(item.ma10) }}
              </td>
              <td class="font-mono whitespace-nowrap" :class="getMaClass(item.currentPrice, item.ma20)">
                {{ formatPrice(item.ma20) }}
              </td>
              <td class="font-mono whitespace-nowrap" :class="getMaClass(item.currentPrice, item.ma30)">
                {{ formatPrice(item.ma30) }}
              </td>
              <td class="font-mono whitespace-nowrap" :class="getMaClass(item.currentPrice, item.ma50)">
                {{ formatPrice(item.ma50) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
// @ts-ignore
import * as XLSX from 'xlsx'
import { useStockApi, type PortfolioItem } from '@/composables/useStockApi'
import { usePageMeta } from '@/composables/usePageMeta'

// 使用页面元数据
usePageMeta()

const { getPortfolio, loading } = useStockApi()
const saving = ref(false)

const portfolioData = ref<PortfolioItem[]>([])
const updateTime = ref('--')
const exporting = ref(false)

// Filter state
const activeFilters = ref<Record<string, string[]>>({
  market: [],
  category: [],
  industry: [],
  theme: []
})

// Filter options with counts
const filterOptions = ref<Record<string, Array<{value: string, count: number}>>>({
  market: [],
  category: [],
  industry: [],
  theme: []
})

// Expand/collapse state
const expandedCategories = ref<Record<string, boolean>>({
  market: false,
  category: false,
  industry: false,
  theme: false
})

// Track if expand button should be shown for each category
const showExpandButtons = ref<Record<string, boolean>>({
  market: false,
  category: false,
  industry: false,
  theme: false
})

// Window width for responsive layout
const windowWidth = ref(window.innerWidth)

// Refs for filter containers
const marketContainer = ref<HTMLElement | null>(null)
const categoryContainer = ref<HTMLElement | null>(null)
const industryContainer = ref<HTMLElement | null>(null)
const themeContainer = ref<HTMLElement | null>(null)



// Filtered data based on active filters
const filteredData = computed(() => {
  console.log('filteredData computed, portfolioData length:', portfolioData.value.length)
  if (!portfolioData.value.length) {
    console.log('portfolioData empty, returning empty array')
    return []
  }

  const filtered = portfolioData.value.filter(item => {
    // Check each filter field
    for (const [field, selectedValues] of Object.entries(activeFilters.value)) {
      if (selectedValues.length > 0) {
        const itemValue = item[field as keyof PortfolioItem] as string
        if (!selectedValues.includes(itemValue)) {
          return false
        }
      }
    }
    return true
  })
  console.log('filtered result length:', filtered.length)
  return filtered
})

const fetchData = async () => {
  try {
    console.log('开始获取数据...')
    const data = await getPortfolio()
    console.log('获取到的数据:', data)
    portfolioData.value = data
    updateTime.value = new Date().toLocaleString('zh-CN')
    updateFilterOptions()
    console.log('数据加载完成，portfolioData长度:', portfolioData.value.length)
  } catch (error) {
    console.error('获取数据失败:', error)
    portfolioData.value = []
    updateTime.value = '加载失败'
  }
}

const refreshData = () => {
  fetchData()
}

const saveData = async () => {
  if (filteredData.value.length === 0) {
    alert('暂无数据可以保存')
    return
  }
  saving.value = true
  try {
    // 获取最新的自选持仓数据（带实时价格/MA）
    const latest = await getPortfolio()
    const res = await fetch('/api/save-portfolio', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ portfolio: latest })
    })
    const data = await res.json()
    if (data?.success) {
      alert('数据已保存到服务器 db.json')
    } else {
      alert('保存失败，请重试')
    }
  } catch (e) {
    console.error('保存数据失败:', e)
    alert('保存数据时发生错误')
  } finally {
    saving.value = false
  }
}

// Update filter options based on current data
const updateFilterOptions = () => {
  if (!portfolioData.value.length) return

  const fields = ['market', 'category', 'industry', 'theme']

  fields.forEach(field => {
    const counts: Record<string, number> = {}

    portfolioData.value.forEach(item => {
      const value = item[field as keyof PortfolioItem] as string
      if (value && value.trim()) {
        counts[value] = (counts[value] || 0) + 1
      }
    })

    filterOptions.value[field] = Object.entries(counts)
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count)
  })

  // Update expand button visibility after filter options are updated
  updateExpandButtonVisibility()
}

// Update window width on resize
const updateWindowWidth = () => {
  windowWidth.value = window.innerWidth
}

// Toggle filter selection
const toggleFilter = (field: string, value: string) => {
  const currentFilters = [...(activeFilters.value[field] || [])]
  const index = currentFilters.indexOf(value)

  if (index > -1) {
    currentFilters.splice(index, 1)
  } else {
    currentFilters.push(value)
  }

  activeFilters.value[field] = currentFilters
}

// Remove specific filter
const removeFilter = (field: string, value: string) => {
  const currentFilters = [...(activeFilters.value[field] || [])]
  const index = currentFilters.indexOf(value)

  if (index > -1) {
    currentFilters.splice(index, 1)
    activeFilters.value[field] = currentFilters
  }
}

// Clear all filters
const clearAllFilters = () => {
  activeFilters.value = {
    market: [],
    category: [],
    industry: [],
    theme: []
  }
}

// Get field label for display
const getFieldLabel = (field: string) => {
  const labels: Record<string, string> = {
    market: '所在市场',
    category: '股票类别',
    industry: '所属行业',
    theme: '核心主题'
  }
  return labels[field] || field
}

// Toggle expand/collapse for a category
const toggleExpand = (category: string) => {
  expandedCategories.value[category] = !expandedCategories.value[category]
}

// Check if expand button should be shown for a category
const showExpandButton = (category: string) => {
  return showExpandButtons.value[category] || false
}

// Update expand button visibility based on container height
const updateExpandButtonVisibility = () => {
  const containers = {
    market: marketContainer.value,
    category: categoryContainer.value,
    industry: industryContainer.value,
    theme: themeContainer.value
  }

  // Wait for next tick to ensure DOM is updated
  setTimeout(() => {
    try {
      Object.entries(containers).forEach(([category, container]) => {
        if (container && filterOptions.value[category]?.length > 0) {
          // Check if content height exceeds 1 line (approx 32px per line)
          const needsExpand = container.scrollHeight > 32
          showExpandButtons.value[category] = needsExpand
        } else {
          showExpandButtons.value[category] = false
        }
      })
    } catch (err) {
      console.error('updateExpandButtonVisibility error:', err)
    }
  }, 100)
}



const exportExcel = () => {
  if (filteredData.value.length === 0) {
    alert('暂无数据可导出')
    return
  }

  exporting.value = true

  try {
    // 准备Excel数据
    const excelData = filteredData.value.map(item => {
      const change = item.currentPrice && item.prevPrice
        ? ((item.currentPrice - item.prevPrice) / item.prevPrice * 100).toFixed(2) + '%'
        : '--'

      return {
        '股票代码': item.code,
        '股票名称': item.name,
        '所在市场': item.market,
        '股票类别': item.category,
        '所属行业': item.industry,
        '核心主题': item.theme,
        '投资风格': item.style,
        '所属板块': item.sector,
        '购买渠道': item.channel,
        '状态': item.isLiquidated === '是' ? '已清仓' : '持仓中',
        '当前价': item.currentPrice ? item.currentPrice.toFixed(4) : '--',
        '昨收价': item.prevPrice ? item.prevPrice.toFixed(4) : '--',
        '涨跌幅': change,
        'MA5': item.ma5 ? item.ma5.toFixed(4) : '--',
        'MA10': item.ma10 ? item.ma10.toFixed(4) : '--',
        'MA20': item.ma20 ? item.ma20.toFixed(4) : '--',
        'MA30': item.ma30 ? item.ma30.toFixed(4) : '--',
        'MA50': item.ma50 ? item.ma50.toFixed(4) : '--'
      }
    })

    // 创建工作簿
    const wb = XLSX.utils.book_new()

    // 创建工作表
    const ws = XLSX.utils.json_to_sheet(excelData)

    // 设置列宽
    const colWidths = [
      { wch: 12 }, // 股票代码
      { wch: 20 }, // 股票名称
      { wch: 12 }, // 所在市场
      { wch: 12 }, // 股票类别
      { wch: 12 }, // 所属行业
      { wch: 15 }, // 核心主题
      { wch: 12 }, // 投资风格
      { wch: 15 }, // 所属板块
      { wch: 12 }, // 购买渠道
      { wch: 10 }, // 状态
      { wch: 12 }, // 当前价
      { wch: 12 }, // 昨收价
      { wch: 12 }, // 涨跌幅
      { wch: 12 }, // MA5
      { wch: 12 }, // MA10
      { wch: 12 }, // MA20
      { wch: 12 }, // MA30
      { wch: 12 }  // MA50
    ]
    ws['!cols'] = colWidths

    // 添加工作表到工作簿
    XLSX.utils.book_append_sheet(wb, ws, '自选持仓')

    // 生成文件名（包含当前时间和筛选信息）
    const now = new Date()
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '')
    const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '')

    // 获取当前筛选条件
    const filterLabels: string[] = []
    Object.entries(activeFilters.value).forEach(([field, values]) => {
      if (values.length > 0) {
        const fieldLabel = getFieldLabel(field)
        filterLabels.push(`${fieldLabel}(${values.join(',')})`)
      }
    })

    const filterStr = filterLabels.length > 0 ? filterLabels.join('_') : '全部'
    const fileName = `持仓分析${filterStr}_${dateStr}_${timeStr}.xlsx`

    // 导出文件
    XLSX.writeFile(wb, fileName)

    // 导出成功提示
    setTimeout(() => {
      exporting.value = false
      // 可以添加成功提示，比如使用 toast 组件
      console.log(`Excel文件已导出: ${fileName}`)
    }, 500)
  } catch (error) {
    exporting.value = false
    console.error('导出Excel失败:', error)
    alert('导出Excel失败，请稍后重试')
  }
}

const formatPrice = (price: number) => {
  if (!price) return '--'
  return parseFloat(price.toFixed(4)).toString()
}

const formatChange = (current: number, prev: number) => {
  if (!current || !prev) return '--'
  const change = ((current - prev) / prev * 100).toFixed(2)
  return current >= prev ? `+${change}%` : `${change}%`
}

const getPriceClass = (current: number, prev: number) => {
  if (!current || !prev) return 'text-gray-400'
  return current >= prev ? 'text-up' : 'text-down'
}

const getMaClass = (current: number, ma: number) => {
  if (!current || !ma) return 'text-gray-400'
  return current >= ma ? 'text-up' : 'text-down'
}

const getMarketTagClass = (market: string) => {
  if (market.includes('A股') || market.includes('深圳') || market.includes('上海')) {
    return 'tag-primary'
  }
  if (market.includes('港股')) return 'tag-warning'
  if (market.includes('美股')) return 'tag-success'
  return 'bg-gray-700 text-gray-300'
}

const getLiquidatedClass = (isLiquidated: string | undefined) => {
  return isLiquidated === '是' ? 'bg-gray-700 text-gray-400' : 'tag-success'
}

const getChangeTagClass = (current: number, prev: number) => {
  if (!current || !prev) return 'tag-outline'
  const change = (current - prev) / prev * 100
  return change >= 0 ? 'tag-danger' : 'tag-success'
}

onMounted(() => {
  fetchData()
  window.addEventListener('resize', updateWindowWidth)
})

// Cleanup on unmount
onUnmounted(() => {
  window.removeEventListener('resize', updateWindowWidth)
})
</script>
