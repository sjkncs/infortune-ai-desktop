<template>
  <header class="bg-gray-900 border-b border-gray-700/50 sticky top-0 z-50 backdrop-blur-surface">
    <div class="mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        <!-- Logo -->
        <router-link to="/" class="flex items-center gap-3 group">
          <img 
            src="/img/LOGO_ico.png" 
            alt="In Fortune AI" 
            class="h-10 w-10 object-contain"
          />
          <div class="hidden sm:block">
            <h1 class="text-xl font-bold text-gradient">In Fortune AI</h1>
            <p class="text-xs text-gray-500">久经风雨，财智自成</p>
          </div>
        </router-link>

        <!-- Navigation -->
        <nav class="hidden md:flex items-center gap-1">
          <router-link 
            v-for="item in navItems" 
            :key="item.path"
            :to="item.path"
            class="nav-link"
            :class="{ 'active': isActive(item.path) }"
          >
            <i :class="item.icon"></i>
            <span>{{ item.name }}</span>
          </router-link>
        </nav>

        <!-- Search -->
        <div class="flex items-center gap-4">
          <div class="relative hidden sm:block">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="搜索股票/基金..."
              class="w-48 lg:w-64 px-4 py-2 pl-10 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all"
              @keyup.enter="handleSearch"
              @input="onSearchInput"
              @blur="hideSuggestions"
            />
            <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"></i>
            <!-- Search Suggestions Dropdown -->
            <div
              v-if="showSuggestions && suggestions.length > 0"
              class="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 max-h-80 overflow-y-auto"
            >
              <div
                v-for="(item, idx) in suggestions"
                :key="idx"
                class="flex items-center justify-between px-4 py-2.5 hover:bg-gray-700 cursor-pointer transition-colors text-sm"
                @mousedown.prevent="selectSuggestion(item)"
              >
                <div>
                  <span class="text-gray-200 font-medium">{{ item['股票名称'] || item.name }}</span>
                  <span class="text-gray-500 ml-2 font-mono text-xs">{{ item['股票代码'] || item.code }}</span>
                </div>
                <span class="text-gray-500 text-xs">{{ item.market || item['所在市场'] || '' }}</span>
              </div>
            </div>
          </div>

          <!-- Mobile Menu Button -->
          <button 
            @click="mobileMenuOpen = !mobileMenuOpen"
            class="md:hidden p-2 text-gray-400 hover:text-gray-200"
          >
            <i :class="mobileMenuOpen ? 'fas fa-times' : 'fas fa-bars'"></i>
          </button>
        </div>
      </div>

      <!-- Mobile Navigation -->
      <transition name="slide">
        <div v-if="mobileMenuOpen" class="md:hidden py-4 border-t border-gray-700/50">
          <router-link 
            v-for="item in navItems" 
            :key="item.path"
            :to="item.path"
            class="flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
            @click="mobileMenuOpen = false"
          >
            <i :class="item.icon"></i>
            <span>{{ item.name }}</span>
          </router-link>
        </div>
      </transition>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/api'

const route = useRoute()
const router = useRouter()

const searchQuery = ref('')
const mobileMenuOpen = ref(false)
const suggestions = ref<any[]>([])
const showSuggestions = ref(false)
let debounceTimer: ReturnType<typeof setTimeout> | null = null

const navItems = [
  { name: '首页', path: '/', icon: 'fas fa-home' },
  { name: '自选分析', path: '/zixuan', icon: 'fas fa-briefcase' },
  { name: '持仓分析', path: '/chicang', icon: 'fas fa-layer-group' },
  { name: '指数分析', path: '/zhishu', icon: 'fas fa-chart-bar' },
  { name: 'ETF行情', path: '/etf', icon: 'fas fa-chart-line' }
]

const isActive = (path: string) => {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}

const onSearchInput = () => {
  if (debounceTimer) clearTimeout(debounceTimer)
  const q = searchQuery.value.trim()
  if (!q) {
    suggestions.value = []
    showSuggestions.value = false
    return
  }
  debounceTimer = setTimeout(async () => {
    try {
      const res = await api.get('/search', { params: { keyword: q } })
      const data = res.data || res
      if (data.success !== false && data.data && data.data.length > 0) {
        suggestions.value = data.data.slice(0, 8)
        showSuggestions.value = true
      } else {
        suggestions.value = []
        showSuggestions.value = false
      }
    } catch {
      suggestions.value = []
      showSuggestions.value = false
    }
  }, 300)
}

const selectSuggestion = (item: any) => {
  const code = item['股票代码'] || item.code || ''
  if (code) {
    router.push(`/stock/${code}`)
  }
  searchQuery.value = ''
  showSuggestions.value = false
}

const handleSearch = async () => {
  const q = searchQuery.value.trim()
  if (!q) return

  // 如果是纯数字或带sh/sz/hk前缀，直接跳转
  if (/^(sh|sz|hk|us)?\d{5,6}$/.test(q)) {
    router.push(`/stock/${q}`)
    searchQuery.value = ''
    showSuggestions.value = false
    return
  }

  // 否则先搜索获取真实股票代码
  try {
    const res = await api.get('/search', { params: { keyword: q } })
    const data = res.data || res
    if (data.success !== false && data.data && data.data.length > 0) {
      const first = data.data[0]
      const code = first['股票代码'] || first.code || ''
      if (code) {
        router.push(`/stock/${code}`)
        searchQuery.value = ''
        showSuggestions.value = false
        return
      }
    }
  } catch { /* ignore */ }

  // 如果搜索也没结果，用原始输入跳转
  router.push(`/stock/${q}`)
  searchQuery.value = ''
  showSuggestions.value = false
}

const hideSuggestions = () => {
  setTimeout(() => { showSuggestions.value = false }, 200)
}
</script>

<style scoped>
.nav-link {
  @apply flex items-center gap-2 px-4 py-2 text-gray-400 rounded-lg transition-all duration-200;
}

.nav-link:hover {
  @apply text-gray-200 bg-gray-800;
}

.nav-link.active {
  @apply text-primary bg-primary/10;
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
