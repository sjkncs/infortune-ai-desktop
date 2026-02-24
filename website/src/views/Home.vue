<template>
  <div class="min-h-[calc(100vh-200px)]">
    <!-- Hero Section -->
    <section class="relative py-20 overflow-hidden" style="z-index: 100;">
      <!-- Background Gradient -->
      <div class="absolute inset-0 bg-gradient-to-br from-surface via-surface-light to-surface opacity-80"></div>
      <div class="absolute top-20 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl"></div>
      <div class="absolute bottom-10 right-1/4 w-64 h-64 bg-primary/5 rounded-full blur-2xl"></div>
      
      <div class="relative max-w-4xl mx-auto px-4 text-center">
        <!-- Logo & Title -->
        <div class="mb-8 animate-fade-in">
          <div class="w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center">
            <img 
              src="/img/LOGO_ico.png" 
              alt="In Fortune AI" 
              class="w-full h-full object-contain"
            />
          </div>
          <h1 class="text-4xl md:text-5xl font-bold mb-4">
            <span class="text-gradient">In Fortune AI</span>
          </h1>
          <p class="text-xl text-gray-400">久经风雨，财智自成</p>
        </div>

        <!-- Search Tabs -->
        <div class="flex justify-center gap-2 mb-6">
          <button
            v-for="tab in searchTabs"
            :key="tab.type"
            @click="activeTab = tab.type"
            class="px-6 py-2.5 rounded-lg font-medium transition-all duration-200"
            :class="activeTab === tab.type 
              ? 'bg-primary text-white shadow-glow' 
              : 'bg-gray-800 text-gray-400 hover:text-gray-200'"
          >
            <i :class="tab.icon" class="mr-2"></i>
            {{ tab.label }}
          </button>
        </div>

        <!-- Search Input -->
        <div ref="searchInputRef" class="relative max-w-2xl mx-auto mb-8 isolate" style="z-index: 9999;">
          <div class="relative">
            <input
              v-model="searchQuery"
              type="text"
              :placeholder="searchPlaceholder"
              class="w-full px-6 py-4 pl-14 bg-gray-800/80 border border-gray-700 rounded-xl text-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              @input="handleSearchInput"
              @keyup.enter="handleSearch"
              @focus="showSuggestions = true"
            />
            <i class="fas fa-search absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 text-lg"></i>
            <button
              v-if="searchQuery"
              @click="clearSearch"
              class="absolute right-16 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
            >
              <i class="fas fa-times"></i>
            </button>
            <button
              @click="handleSearch"
              class="absolute right-3 top-1/2 -translate-y-1/2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
            >
              搜索
            </button>
          </div>

          <!-- Search Suggestions -->
          <teleport to="body">
            <transition name="fade">
              <div
                v-if="showSuggestions && suggestions.length > 0"
                data-suggestions
                class="fixed bg-gray-800 border border-gray-700 rounded-xl shadow-2xl"
                style="z-index: 2147483647;"
                :style="suggestionStyle"
              >
                <ul class="max-h-60 overflow-y-auto">
                  <li
                    v-for="item in suggestions"
                    :key="item.code"
                    @click="selectSuggestion(item)"
                    class="px-4 py-3 flex items-center justify-between hover:bg-gray-700/50 cursor-pointer transition-colors"
                  >
                    <div class="flex items-center gap-3">
                      <span class="text-primary font-mono">{{ item.code }}</span>
                      <span class="text-gray-200">{{ item.code_name }}</span>
                    </div>
                  </li>
                </ul>
              </div>
            </transition>
          </teleport>
        </div>

        <!-- Search Tips -->
        <p class="text-sm text-gray-500">
          支持模糊查询，如："腾讯"、"000001"、"茅台"、"科技"
        </p>
      </div>
    </section>

    <!-- Search Results -->
    <section v-if="searchResults.length > 0" class="py-8 px-4">
      <div class="max-w-7xl mx-auto">
        <div class="card">
          <div class="card-header">
            <h3 class="text-lg font-semibold text-gray-200">
              <i class="fas fa-list-ul mr-2 text-primary"></i>
              查询结果
            </h3>
            <span class="text-sm text-gray-500">共 {{ searchResults.length }} 条</span>
          </div>
          <div class="overflow-x-auto">
            <table class="data-table">
              <thead>
                <tr>
                  <th>代码</th>
                  <th>名称</th>
                  <th>类型</th>
                  <th>市场</th>
                  <th>当前价格</th>
                  <th>涨跌幅</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in searchResults" :key="item.code">
                  <td class="font-mono text-primary">{{ item.code }}</td>
                  <td class="font-medium text-gray-200">{{ item.name }}</td>
                  <td>
                    <span class="tag tag-primary">{{ item.type }}</span>
                  </td>
                  <td class="text-gray-400">{{ item.market }}</td>
                  <td class="font-mono">{{ item.price || '--' }}</td>
                  <td>
                    <span 
                      v-if="item.change" 
                      :class="item.change >= 0 ? 'text-up' : 'text-down'"
                      class="font-mono"
                    >
                      {{ item.change >= 0 ? '+' : '' }}{{ item.change }}%
                    </span>
                    <span v-else class="text-gray-500">--</span>
                  </td>
                  <td>
                    <router-link 
                      :to="`/stock/${item.code}`"
                      class="btn btn-ghost text-sm"
                    >
                      <i class="fas fa-chart-line"></i>
                      查看详情
                    </router-link>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section v-else class="py-16 px-4 -z-10">
      <div class="max-w-6xl mx-auto">
        <h2 class="text-2xl font-bold text-center text-gray-200 mb-12">核心功能</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <router-link 
            v-for="feature in features" 
            :key="feature.path"
            :to="feature.path"
            class="card p-6 group hover:border-primary/50 transition-all duration-300 hover:-translate-y-1 -z-10"
          >
            <div class="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
              <i :class="feature.icon" class="text-2xl text-primary"></i>
            </div>
            <h3 class="text-lg font-semibold text-gray-200 mb-2">{{ feature.title }}</h3>
            <p class="text-sm text-gray-500 leading-relaxed">{{ feature.description }}</p>
          </router-link>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useStockApi } from '@/composables/useStockApi'
import { usePageMeta } from '@/composables/usePageMeta'

// 使用页面元数据
usePageMeta()

const router = useRouter()
const { searchStocks } = useStockApi()

const activeTab = ref<'stock' | 'fund' | 'index'>('stock')
const searchQuery = ref('')
const showSuggestions = ref(false)
const suggestions = ref<any[]>([])
const searchResults = ref<any[]>([])
const isSearching = ref(false)
const searchInputRef = ref<HTMLElement | null>(null)

// 计算搜索提示框的位置
const suggestionStyle = computed(() => {
  if (!searchInputRef.value) return {}
  const rect = searchInputRef.value.getBoundingClientRect()
  return {
    top: `${rect.bottom + 8}px`,
    left: `${rect.left}px`,
    width: `${rect.width}px`
  }
})

const searchTabs = [
  { type: 'stock' as const, label: '股票', icon: 'fas fa-chart-line' },
  { type: 'fund' as const, label: '基金', icon: 'fas fa-wallet' },
  { type: 'index' as const, label: '指数', icon: 'fas fa-chart-bar' }
]

const features = [
  {
    title: '自选持仓分析',
    description: '全面分析您的自选持仓，包含市场分布、均线数据、实时价格等多维度分析',
    icon: 'fas fa-briefcase',
    path: '/zixuan'
  },
  {
    title: '指数估值分析',
    description: '国内主要指数的PE/PB估值分位，帮助判断市场位置，把握投资时机',
    icon: 'fas fa-chart-bar',
    path: '/zhishu'
  },
  {
    title: '投资详情分析',
    description: 'K线图表、买卖盘口、投资建议、操作策略等全方位股票详情分析',
    icon: 'fas fa-search-dollar',
    path: '/stock/000001'
  }
]

const searchPlaceholder = computed(() => {
  const placeholders = {
    stock: '请输入股票代码或股票名称...',
    fund: '请输入基金代码或基金名称...',
    index: '请输入指数代码或指数名称...'
  }
  return placeholders[activeTab.value]
})

let searchTimeout: number | null = null

const handleSearchInput = () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  
  if (searchQuery.value.length >= 1) {
    searchTimeout = window.setTimeout(async () => {
      try {
        const data = await searchStocks(searchQuery.value, activeTab.value)
        // 过滤掉没有名称的搜索结果，并限制显示数量
        suggestions.value = data.filter(item => item.code_name && item.code_name.trim() !== '').slice(0, 8)
        showSuggestions.value = suggestions.value.length > 0
      } catch (error) {
        console.error('Search suggestions error:', error)
        suggestions.value = []
        showSuggestions.value = false
      }
    }, 300)
  } else {
    suggestions.value = []
    showSuggestions.value = false
  }
}

const handleSearch = async () => {
  if (!searchQuery.value.trim()) return
  
  isSearching.value = true
  showSuggestions.value = false
  
  try {
    const data = await searchStocks(searchQuery.value, activeTab.value)
    searchResults.value = data
  } catch (error) {
    console.error('Search error:', error)
  } finally {
    isSearching.value = false
  }
}

const selectSuggestion = (item: any) => {
  router.push(`/stock/${item.code}`)
  showSuggestions.value = false
  searchQuery.value = ''
}

const clearSearch = () => {
  searchQuery.value = ''
  suggestions.value = []
  showSuggestions.value = false
  searchResults.value = []
}

// 点击外部关闭建议框
document.addEventListener('click', (e: MouseEvent) => {
  const target = e.target as HTMLElement
  // 检查点击是否在搜索框内或提示框内
  const isClickInsideSearch = searchInputRef.value?.contains(target)
  const isClickInsideSuggestions = target.closest('[data-suggestions]')
  if (!isClickInsideSearch && !isClickInsideSuggestions) {
    showSuggestions.value = false
  }
})

// 滚动时关闭建议框
window.addEventListener('scroll', () => {
  showSuggestions.value = false
}, { passive: true })
</script>
