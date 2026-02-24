<template>
  <div class="space-y-6">
    <!-- 页面标题 -->
    <div>
      <h2 class="text-2xl font-bold text-gray-900">页面配置</h2>
      <p class="text-gray-500 mt-1">管理网站页面元数据和 SEO 配置</p>
    </div>

    <!-- 自动检测提示 -->
    <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
      <svg class="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
      </svg>
      <div>
        <p class="text-sm text-blue-800 font-medium">自动识别页面</p>
        <p class="text-sm text-blue-600 mt-1">
          已自动从 website 项目路由配置中识别 {{ detectedPages.length }} 个页面。
          新增页面时，只需在代码中更新 <code class="bg-blue-100 px-1 py-0.5 rounded">websiteRoutes</code> 数组即可自动显示在此处。
        </p>
      </div>
    </div>

    <!-- 页面列表 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div
        v-for="page in detectedPages"
        :key="page.key"
        class="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
      >
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center">
            <div class="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center mr-3">
              <svg class="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
            </div>
            <div>
              <h3 class="font-semibold text-gray-900">{{ page.name }}</h3>
              <p class="text-sm text-gray-500">{{ page.key }} <span class="text-gray-300">|</span> {{ page.path }}</p>
            </div>
          </div>
          <button
            @click="editConfig(page.key)"
            class="text-primary-600 hover:text-primary-700 text-sm font-medium"
          >
            编辑
          </button>
        </div>

        <div class="space-y-3" v-if="pageConfigs[page.key]">
          <div>
            <p class="text-xs text-gray-500 mb-1">页面标题</p>
            <p class="text-sm text-gray-900 truncate">{{ pageConfigs[page.key]?.title }}</p>
          </div>
          <div>
            <p class="text-xs text-gray-500 mb-1">描述</p>
            <p class="text-sm text-gray-700 line-clamp-2">{{ pageConfigs[page.key]?.description }}</p>
          </div>
          <div>
            <p class="text-xs text-gray-500 mb-1">关键词</p>
            <div class="flex flex-wrap gap-1">
              <span
                v-for="kw in pageConfigs[page.key]?.keywords?.split(',')"
                :key="kw"
                class="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
              >
                {{ kw.trim() }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 编辑模态框 -->
    <div v-if="showEditModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto py-10">
      <div class="bg-white rounded-xl w-full max-w-2xl mx-4 my-auto">
        <div class="p-6 border-b border-gray-100">
          <h3 class="text-lg font-semibold">编辑页面配置 - {{ getPageDisplayName(editingKey) }}</h3>
          <p class="text-sm text-gray-500 mt-1">路由: {{ editingKey }}</p>
        </div>
        <div class="p-6 space-y-4">
          <div class="form-group">
            <label class="form-label">页面标题</label>
            <input v-model="editForm.title" type="text" class="form-input" placeholder="页面标题" />
          </div>
          <div class="form-group">
            <label class="form-label">页面描述</label>
            <textarea
              v-model="editForm.description"
              rows="3"
              class="form-input resize-none"
              placeholder="页面描述"
            ></textarea>
          </div>
          <div class="form-group">
            <label class="form-label">关键词（用逗号分隔）</label>
            <input v-model="editForm.keywords" type="text" class="form-input" placeholder="关键词1, 关键词2, 关键词3" />
          </div>
          <div class="form-group">
            <label class="form-label">OG 标题</label>
            <input v-model="editForm.openGraph.title" type="text" class="form-input" placeholder="社交媒体分享标题" />
          </div>
          <div class="form-group">
            <label class="form-label">OG 描述</label>
            <textarea
              v-model="editForm.openGraph.description"
              rows="2"
              class="form-input resize-none"
              placeholder="社交媒体分享描述"
            ></textarea>
          </div>
          <div class="form-group">
            <label class="form-label">OG 图片 URL</label>
            <input v-model="editForm.openGraph.image" type="text" class="form-input" placeholder="https://example.com/image.png" />
          </div>
          <div class="form-group">
            <label class="form-label">OG 类型</label>
            <select v-model="editForm.openGraph.type" class="form-select">
              <option value="website">website</option>
              <option value="article">article</option>
            </select>
          </div>
        </div>
        <div class="p-6 border-t border-gray-100 flex justify-end gap-3">
          <button @click="showEditModal = false" class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            取消
          </button>
          <button @click="saveConfig" class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
            保存
          </button>
        </div>
      </div>
    </div>

    <!-- 代码预览 -->
    <div class="bg-gray-900 rounded-xl p-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-white">配置文件预览</h3>
        <span class="text-xs text-gray-400">只读模式，请直接编辑上方卡片</span>
      </div>
      <pre class="text-sm text-green-400 overflow-x-auto"><code>{{ configCode }}</code></pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

interface PageMeta {
  title: string
  description: string
  keywords: string
  openGraph: {
    title: string
    description: string
    image: string
    type: string
  }
}

interface RouteInfo {
  name: string
  path: string
  meta?: {
    title?: string
    description?: string
    keywords?: string
  }
}

// 从 website 项目路由配置中读取的路由信息
// 当新增页面时，只需更新这个数组即可
const websiteRoutes: RouteInfo[] = [
  {
    name: 'Home',
    path: '/',
    meta: {
      title: 'In Fortune AI - 久经风雨，财智自成',
      description: 'In Fortune AI - 专业的股票分析工具，提供自选持仓分析、指数估值分析、投资详情等功能',
      keywords: '股票分析,基金分析,指数估值,投资建议,In Fortune'
    }
  },
  {
    name: 'Zixuan',
    path: '/zixuan',
    meta: {
      title: '自选分析 - In Fortune AI',
      description: '查看您的自选股票列表，实时监控股票价格变化，智能分析持仓表现，提供个性化的投资建议',
      keywords: '自选股,持仓分析,股票监控,投资组合,In Fortune AI'
    }
  },
  {
    name: 'Chicang',
    path: '/chicang',
    meta: {
      title: '持仓分析 - In Fortune AI',
      description: '查看您的持仓股票列表，实时监控股票价格变化，智能分析持仓表现',
      keywords: '持仓,股票监控,投资组合,In Fortune AI'
    }
  },
  {
    name: 'Zhishu',
    path: '/zhishu',
    meta: {
      title: '指数分析 - In Fortune AI',
      description: '全面分析各大指数估值水平，包括PE、PB、股息率等关键指标，帮助您判断市场投资价值',
      keywords: '指数估值,PE分析,PB分析,股息率,市场估值,In Fortune AI'
    }
  },
  {
    name: 'QuotationCenter',
    path: '/quotation',
    meta: {
      title: '行情中心 - In Fortune AI',
      description: '实时查看A股市场全部ETF基金行情数据，包括最新价、涨跌幅、成交量、成交额等关键指标',
      keywords: 'ETF行情,基金行情,实时数据,行情中心,In Fortune AI'
    }
  },
  {
    name: 'StockDetail',
    path: '/stock/:code',
    meta: {
      title: '投资详情 - In Fortune AI',
      description: '查看股票的K线图表、买卖盘口、投资建议等详细分析，助您做出明智的投资决策',
      keywords: '股票详情,K线图,买卖盘口,投资建议,技术分析,In Fortune AI'
    }
  }
]

// 页面名称映射 - 自动生成 + 自定义映射
const nameMapping: Record<string, string> = {
  home: '首页',
  zixuan: '自选分析',
  chicang: '持仓分析',
  zhishu: '指数分析',
  quotationcenter: '行情中心',
  stockdetail: '股票详情',
  about: '关于我们',
  contact: '联系我们',
  help: '帮助中心',
  settings: '系统设置',
  login: '登录',
  register: '注册',
  profile: '个人中心',
  dashboard: '仪表盘',
  analysis: '数据分析',
  report: '报表中心',
  news: '资讯中心',
  notification: '消息通知',
}

// 将路由名称转换为 key（全小写）
const getPageKey = (routeName: string): string => {
  return routeName.toLowerCase()
}

// 将 key 转换为中文名称
const getPageNameByKey = (key: string): string => {
  return nameMapping[key] || key
}

// 将路由名称转换为中文名称
const getPageName = (routeName: string): string => {
  const key = getPageKey(routeName)
  return getPageNameByKey(key)
}

// 生成默认配置
const generateDefaultConfig = (route: RouteInfo): PageMeta => {
  const title = route.meta?.title || `${route.name} - In Fortune AI`
  const description = route.meta?.description || `In Fortune AI${getPageName(route.name)}页面，提供专业的股票分析服务`
  const keywords = route.meta?.keywords || '股票分析,投资理财,In Fortune AI'
  
  return {
    title,
    description,
    keywords,
    openGraph: {
      title,
      description,
      image: '/og-image.png',
      type: route.name.toLowerCase().includes('detail') || route.name.toLowerCase().includes('article') ? 'article' : 'website',
    },
  }
}

// 从 localStorage 加载保存的配置
const loadSavedConfigs = (): Record<string, PageMeta> => {
  try {
    const saved = localStorage.getItem('pageMetaConfigs')
    return saved ? JSON.parse(saved) : {}
  } catch {
    return {}
  }
}

// 保存配置到 localStorage
const saveConfigsToStorage = (configs: Record<string, PageMeta>) => {
  try {
    localStorage.setItem('pageMetaConfigs', JSON.stringify(configs))
  } catch (e) {
    console.error('Failed to save configs:', e)
  }
}

// 初始化页面配置 - 合并自动生成的默认配置和用户保存的配置
const initializePageConfigs = (): Record<string, PageMeta> => {
  const savedConfigs = loadSavedConfigs()
  const configs: Record<string, PageMeta> = {}
  
  // 为每个路由生成配置
  websiteRoutes.forEach(route => {
    const key = getPageKey(route.name)
    // 优先使用保存的配置，否则使用默认配置
    configs[key] = savedConfigs[key] || generateDefaultConfig(route)
  })
  
  // 合并可能存在的额外保存的配置（处理已删除的路由）
  Object.keys(savedConfigs).forEach(key => {
    if (!configs[key]) {
      configs[key] = savedConfigs[key]
    }
  })
  
  return configs
}

const pageConfigs = ref<Record<string, PageMeta>>({})
const detectedPages = computed(() => {
  return websiteRoutes.map(route => ({
    key: getPageKey(route.name),
    name: getPageName(route.name),
    routeName: route.name,
    path: route.path,
  }))
})

onMounted(() => {
  pageConfigs.value = initializePageConfigs()
})

// 获取页面显示名称的工具函数（用于模板）
const getPageDisplayName = (key: string): string => {
  const page = detectedPages.value.find(p => p.key === key)
  return page?.name || getPageNameByKey(key)
}

const showEditModal = ref(false)
const editingKey = ref('')
const editForm = ref<PageMeta>({
  title: '',
  description: '',
  keywords: '',
  openGraph: {
    title: '',
    description: '',
    image: '',
    type: 'website',
  },
})

const configCode = computed(() => {
  return `// meta.config.ts
export const pageMetaConfig = ${JSON.stringify(pageConfigs.value, null, 2)}`
})

const editConfig = (key: string) => {
  editingKey.value = key
  editForm.value = JSON.parse(JSON.stringify(pageConfigs.value[key]))
  showEditModal.value = true
}

const saveConfig = () => {
  pageConfigs.value[editingKey.value] = JSON.parse(JSON.stringify(editForm.value))
  saveConfigsToStorage(pageConfigs.value)
  showEditModal.value = false
}
</script>
