<template>
  <div class="h-full flex flex-col gap-6">
    <!-- 页面标题和操作 -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-gray-900">自选管理</h2>
        <p class="text-gray-500 mt-1">管理股票基础数据</p>
      </div>
      <button
        @click="showAddModal = true"
        class="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
      >
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
        </svg>
        添加股票
      </button>
    </div>

    <!-- 统计信息 -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div class="bg-white rounded-lg shadow-sm p-4">
        <p class="text-sm text-gray-500">总股票数</p>
        <p class="text-2xl font-bold text-gray-900">{{ stocks.length }}</p>
      </div>
      <div class="bg-white rounded-lg shadow-sm p-4">
        <p class="text-sm text-gray-500">A股</p>
        <p class="text-2xl font-bold text-blue-600">{{ aShareCount }}</p>
      </div>
      <div class="bg-white rounded-lg shadow-sm p-4">
        <p class="text-sm text-gray-500">港股</p>
        <p class="text-2xl font-bold text-purple-600">{{ hkShareCount }}</p>
      </div>
      <div class="bg-white rounded-lg shadow-sm p-4">
        <p class="text-sm text-gray-500">美股</p>
        <p class="text-2xl font-bold text-orange-600">{{ usShareCount }}</p>
      </div>
    </div>

    <!-- 搜索和筛选 -->
    <div class="bg-white rounded-xl shadow-sm p-4">
      <div class="flex gap-4">
        <div class="flex-1">
          <div class="relative">
            <input
              v-model="searchKeyword"
              type="text"
              placeholder="搜索股票代码或名称..."
              class="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary-500"
              @input="handleSearch"
            />
            <svg class="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>
        </div>
        <select
          v-model="filterMarket"
          class="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary-500"
        >
          <option value="">全部市场</option>
          <option value="A股">A股</option>
          <option value="港股">港股</option>
          <option value="美股">美股</option>
          <option value="场外基金">场外基金</option>
        </select>
        <select
          v-model="filterStyle"
          class="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary-500"
        >
          <option value="">全部风格</option>
          <option value="成长">成长</option>
          <option value="价值">价值</option>
          <option value="稳健">稳健</option>
          <option value="周期">周期</option>
          <option value="防御">防御</option>
          <option value="消费">消费</option>
          <option value="量化">量化</option>
        </select>
      </div>
    </div>

    <!-- 股票列表 -->
    <div class="flex-1 bg-white rounded-xl shadow-sm overflow-hidden flex flex-col">
      <div class="flex-1 overflow-auto">
        <table class="admin-table">
          <thead class="sticky top-0 bg-white">
            <tr>
              <th>股票代码</th>
              <th>股票名称</th>
              <th>市场</th>
              <th>类别</th>
              <th>行业</th>
              <th>核心主题</th>
              <th>投资风格</th>
              <th>所属板块</th>
              <th>购买渠道</th>
              <th class="text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="stock in filteredStocks" :key="getField(stock, 'code')">
              <td class="font-mono font-medium">{{ getField(stock, 'code') }}</td>
              <td>{{ getField(stock, 'name') }}</td>
              <td>
                <span class="px-2 py-1 text-xs rounded-full" :class="getMarketClass(getField(stock, 'market'))">
                  {{ getField(stock, 'market') }}
                </span>
              </td>
              <td>{{ getField(stock, 'category') }}</td>
              <td>{{ getField(stock, 'industry') }}</td>
              <td>{{ getField(stock, 'theme') }}</td>
              <td>
                <span class="px-2 py-1 text-xs rounded-full" :class="getStyleClass(getField(stock, 'style'))">
                  {{ getField(stock, 'style') }}
                </span>
              </td>
              <td>{{ getField(stock, 'sector') }}</td>
              <td>{{ getField(stock, 'channel') }}</td>
              <td class="text-right">
                <button @click="editStock(stock)" class="text-primary-600 hover:text-primary-700 mr-3">
                  编辑
                </button>
                <button @click="deleteStock(getField(stock, 'code'))" class="text-red-600 hover:text-red-700">
                  删除
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="filteredStocks.length === 0" class="py-12 text-center text-gray-500">
        暂无数据
      </div>
    </div>

    <!-- 添加/编辑模态框 -->
    <div v-if="showAddModal || showEditModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto py-10">
      <div class="bg-white rounded-xl w-full max-w-2xl mx-4 my-auto">
        <div class="p-6 border-b border-gray-100">
          <h3 class="text-lg font-semibold">{{ showEditModal ? '编辑股票' : '添加股票' }}</h3>
        </div>
        <div class="p-6">
          <div class="grid grid-cols-2 gap-4">
            <div class="form-group">
              <label class="form-label">股票代码 <span class="text-red-500">*</span></label>
              <input v-model="form['股票代码']" type="text" class="form-input" placeholder="如: sh588000" />
            </div>
            <div class="form-group">
              <label class="form-label">股票名称 <span class="text-red-500">*</span></label>
              <input v-model="form['股票名称']" type="text" class="form-input" placeholder="如: 科创50ETF" />
            </div>
            <div class="form-group">
              <label class="form-label">所在市场 <span class="text-red-500">*</span></label>
              <select v-model="form['所在市场']" class="form-select">
                <option value="A股">A股</option>
                <option value="港股">港股</option>
                <option value="美股">美股</option>
                <option value="场外基金">场外基金</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">股票类别 <span class="text-red-500">*</span></label>
              <select v-model="form['股票类别']" class="form-select">
                <option value="ETF">ETF</option>
                <option value="个股">个股</option>
                <option value="宽基指数">宽基指数</option>
                <option value="行业主题">行业主题</option>
                <option value="主动管理">主动管理</option>
                <option value="债券基金">债券基金</option>
                <option value="跨境指数">跨境指数</option>
                <option value="策略指数">策略指数</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">所属行业</label>
              <input v-model="form['所属行业']" type="text" class="form-input" placeholder="如: 科技" />
            </div>
            <div class="form-group">
              <label class="form-label">核心主题</label>
              <input v-model="form['核心主题']" type="text" class="form-input" placeholder="如: 科创板" />
            </div>
            <div class="form-group">
              <label class="form-label">投资风格</label>
              <select v-model="form['投资风格']" class="form-select">
                <option value="成长">成长</option>
                <option value="价值">价值</option>
                <option value="稳健">稳健</option>
                <option value="周期">周期</option>
                <option value="防御">防御</option>
                <option value="消费">消费</option>
                <option value="量化">量化</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">所属板块</label>
              <input v-model="form['所属板块']" type="text" class="form-input" placeholder="如: 科创板" />
            </div>
            <div class="form-group col-span-2">
              <label class="form-label">购买渠道</label>
              <select v-model="form['购买渠道']" class="form-select">
                <option value="东方财富">东方财富</option>
                <option value="富途牛牛">富途牛牛</option>
                <option value="支付宝">支付宝</option>
                <option value="富国基金">富国基金</option>
                <option value="广发基金">广发基金</option>
              </select>
            </div>
          </div>
        </div>
        <div class="p-6 border-t border-gray-100 flex justify-end gap-3">
          <button @click="closeModal" class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            取消
          </button>
          <button @click="saveStock" class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
            保存
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { getStocks, addStock, updateStock, deleteStock as deleteStockApi } from '@/api'
import type { Stock } from '@/types'

const stocks = ref<Stock[]>([])
const searchKeyword = ref('')
const filterMarket = ref('')
const filterStyle = ref('')
const showAddModal = ref(false)
const showEditModal = ref(false)
const editingCode = ref('')

const form = ref<Partial<Stock>>({
  '股票代码': '',
  '股票名称': '',
  '所在市场': 'A股',
  '股票类别': 'ETF',
  '所属行业': '',
  '核心主题': '',
  '投资风格': '成长',
  '所属板块': '',
  '购买渠道': '东方财富',
  '当前实时价': '',
  '昨日收盘价': '',
  'MA5': '',
  'MA10': '',
  'MA20': '',
  'MA30': '',
  'MA50': '',
})

// 辅助函数：获取字段值（兼容中英文）
const getField = (stock: Stock, field: string): string => {
  const cnMap: Record<string, string> = {
    code: '股票代码',
    name: '股票名称',
    market: '所在市场',
    category: '股票类别',
    industry: '所属行业',
    theme: '核心主题',
    style: '投资风格',
    sector: '所属板块',
    channel: '购买渠道',
  }
  return (stock[field as keyof Stock] as string) || (stock[cnMap[field] as keyof Stock] as string) || ''
}

const filteredStocks = computed(() => {
  let result = stocks.value
  if (searchKeyword.value) {
    const kw = searchKeyword.value.toLowerCase()
    result = result.filter(s => {
      const code = getField(s, 'code').toLowerCase()
      const name = getField(s, 'name')
      return code.includes(kw) || name.includes(kw)
    })
  }
  if (filterMarket.value) {
    result = result.filter(s => getField(s, 'market') === filterMarket.value)
  }
  if (filterStyle.value) {
    result = result.filter(s => getField(s, 'style') === filterStyle.value)
  }
  return result
})

// 统计各市场股票数量
const aShareCount = computed(() => stocks.value.filter(s => getField(s, 'market') === 'A股').length)
const hkShareCount = computed(() => stocks.value.filter(s => getField(s, 'market') === '港股').length)
const usShareCount = computed(() => stocks.value.filter(s => getField(s, 'market') === '美股').length)

const getMarketClass = (market: string) => {
  const classes: Record<string, string> = {
    'A股': 'bg-blue-100 text-blue-700',
    '港股': 'bg-purple-100 text-purple-700',
    '美股': 'bg-orange-100 text-orange-700',
    '场外基金': 'bg-green-100 text-green-700',
  }
  return classes[market] || 'bg-gray-100 text-gray-700'
}

const getStyleClass = (style: string) => {
  const classes: Record<string, string> = {
    '成长': 'bg-green-100 text-green-700',
    '价值': 'bg-blue-100 text-blue-700',
    '稳健': 'bg-yellow-100 text-yellow-700',
    '周期': 'bg-red-100 text-red-700',
    '防御': 'bg-gray-100 text-gray-700',
  }
  return classes[style] || 'bg-gray-100 text-gray-700'
}

const loadStocks = async () => {
  try {
    const res = await getStocks()
    stocks.value = res.data || []
  } catch (error) {
    console.error('加载股票数据失败:', error)
  }
}

const handleSearch = () => {
  // 搜索逻辑已在 computed 中处理
}

const editStock = (stock: Stock) => {
  editingCode.value = getField(stock, 'code')
  // 转换为中文表单
  form.value = {
    '股票代码': getField(stock, 'code'),
    '股票名称': getField(stock, 'name'),
    '所在市场': getField(stock, 'market') || 'A股',
    '股票类别': getField(stock, 'category') || 'ETF',
    '所属行业': getField(stock, 'industry'),
    '核心主题': getField(stock, 'theme'),
    '投资风格': getField(stock, 'style') || '成长',
    '所属板块': getField(stock, 'sector'),
    '购买渠道': getField(stock, 'channel') || '东方财富',
    '当前实时价': stock['当前实时价'] || '',
    '昨日收盘价': stock['昨日收盘价'] || '',
    'MA5': stock['MA5'] || '',
    'MA10': stock['MA10'] || '',
    'MA20': stock['MA20'] || '',
    'MA30': stock['MA30'] || '',
    'MA50': stock['MA50'] || '',
  }
  showEditModal.value = true
}

const saveStock = async () => {
  if (!form.value['股票代码'] || !form.value['股票名称']) {
    alert('请填写股票代码和名称')
    return
  }

  try {
    // 构造保存的数据（使用中文字段名）
    const stockData = {
      '股票代码': form.value['股票代码'] || '',
      '股票名称': form.value['股票名称'] || '',
      '所在市场': form.value['所在市场'] || 'A股',
      '股票类别': form.value['股票类别'] || 'ETF',
      '所属行业': form.value['所属行业'] || '',
      '核心主题': form.value['核心主题'] || '',
      '投资风格': form.value['投资风格'] || '成长',
      '所属板块': form.value['所属板块'] || '',
      '购买渠道': form.value['购买渠道'] || '东方财富',
    }

    if (showEditModal.value) {
      await updateStock(editingCode.value, stockData)
    } else {
      await addStock(stockData)
    }
    await loadStocks()
    closeModal()
  } catch (error) {
    console.error('保存股票失败:', error)
    alert('保存失败')
  }
}

const deleteStock = async (code: string) => {
  if (!confirm('确定要删除这只股票吗？')) return

  try {
    await deleteStockApi(code)
    await loadStocks()
  } catch (error) {
    console.error('删除股票失败:', error)
    alert('删除失败')
  }
}

const closeModal = () => {
  showAddModal.value = false
  showEditModal.value = false
  editingCode.value = ''
  form.value = {
    '股票代码': '',
    '股票名称': '',
    '所在市场': 'A股',
    '股票类别': 'ETF',
    '所属行业': '',
    '核心主题': '',
    '投资风格': '成长',
    '所属板块': '',
    '购买渠道': '东方财富',
    '当前实时价': '',
    '昨日收盘价': '',
    'MA5': '',
    'MA10': '',
    'MA20': '',
    'MA30': '',
    'MA50': '',
  }
}

onMounted(() => {
  loadStocks()
})
</script>
