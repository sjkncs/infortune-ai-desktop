<template>
  <div class="h-full flex flex-col gap-6">
    <!-- 页面标题 -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-gray-900">持仓管理</h2>
        <p class="text-gray-500 mt-1">管理自选股持仓数据</p>
      </div>
      <div class="flex gap-3">
        <button
          v-if="hasChanges"
          @click="saveChanges"
          :disabled="saving"
          class="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
        >
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
          {{ saving ? '保存中...' : '保存更改' }}
        </button>
        <button
          @click="showAddModal = true"
          class="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
          </svg>
          添加持仓
        </button>
      </div>
    </div>

    <!-- 统计信息 -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div class="bg-white rounded-lg shadow-sm p-4">
        <p class="text-sm text-gray-500">总持仓数</p>
        <p class="text-2xl font-bold text-gray-900">{{ portfolio.length }}</p>
      </div>
      <div class="bg-white rounded-lg shadow-sm p-4">
        <p class="text-sm text-gray-500">A股持仓</p>
        <p class="text-2xl font-bold text-blue-600">{{ aShareCount }}</p>
      </div>
      <div class="bg-white rounded-lg shadow-sm p-4">
        <p class="text-sm text-gray-500">港股持仓</p>
        <p class="text-2xl font-bold text-purple-600">{{ hkShareCount }}</p>
      </div>
      <div class="bg-white rounded-lg shadow-sm p-4">
        <p class="text-sm text-gray-500">美股持仓</p>
        <p class="text-2xl font-bold text-orange-600">{{ usShareCount }}</p>
      </div>
    </div>

    <!-- 筛选 -->
    <div class="bg-white rounded-xl shadow-sm p-4">
      <div class="flex gap-4 flex-wrap">
        <div class="flex-1 min-w-[200px]">
          <input
            v-model="searchKeyword"
            type="text"
            placeholder="搜索股票代码或名称..."
            class="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary-500"
          />
        </div>
        <select v-model="filterMarket" class="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary-500">
          <option value="">全部市场</option>
          <option value="A股">A股</option>
          <option value="港股">港股</option>
          <option value="美股">美股</option>
          <option value="场外基金">场外基金</option>
        </select>
        <select v-model="filterStyle" class="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary-500">
          <option value="">全部风格</option>
          <option value="成长">成长</option>
          <option value="价值">价值</option>
          <option value="稳健">稳健</option>
          <option value="周期">周期</option>
        </select>
      </div>
    </div>

    <!-- 持仓列表 -->
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
              <th>状态</th>
              <th class="text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in filteredPortfolio" :key="getField(item, 'code')">
              <td class="font-mono font-medium">{{ getField(item, 'code') }}</td>
              <td>{{ getField(item, 'name') }}</td>
              <td>
                <span class="px-2 py-1 text-xs rounded-full" :class="getMarketClass(getField(item, 'market'))">
                  {{ getField(item, 'market') }}
                </span>
              </td>
              <td>{{ getField(item, 'category') }}</td>
              <td>{{ getField(item, 'industry') }}</td>
              <td>{{ getField(item, 'theme') }}</td>
              <td>
                <span class="px-2 py-1 text-xs rounded-full" :class="getStyleClass(getField(item, 'style'))">
                  {{ getField(item, 'style') }}
                </span>
              </td>
              <td>{{ getField(item, 'sector') }}</td>
              <td>{{ getField(item, 'channel') }}</td>
              <td>
                <span class="px-2 py-1 text-xs rounded-full" :class="getLiquidatedClass(item['是否清仓'])">
                  {{ item['是否清仓'] === '是' ? '已清仓' : '持仓中' }}
                </span>
              </td>
              <td class="text-right">
                <button @click="editItem(index)" class="text-primary-600 hover:text-primary-700 mr-3">
                  编辑
                </button>
                <button @click="deleteItem(index)" class="text-red-600 hover:text-red-700">
                  删除
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="filteredPortfolio.length === 0" class="py-12 text-center text-gray-500">
        暂无数据
      </div>
    </div>

    <!-- 添加/编辑模态框 -->
    <div v-if="showAddModal || showEditModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto py-10">
      <div class="bg-white rounded-xl w-full max-w-2xl mx-4 my-auto">
        <div class="p-6 border-b border-gray-100">
          <h3 class="text-lg font-semibold">{{ showEditModal ? '编辑持仓' : '添加持仓' }}</h3>
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
            <div class="form-group">
              <label class="form-label">购买渠道</label>
              <select v-model="form['购买渠道']" class="form-select">
                <option value="东方财富">东方财富</option>
                <option value="富途牛牛">富途牛牛</option>
                <option value="支付宝">支付宝</option>
                <option value="富国基金">富国基金</option>
                <option value="广发基金">广发基金</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">是否清仓</label>
              <select v-model="form['是否清仓']" class="form-select">
                <option value="否">否</option>
                <option value="是">是</option>
              </select>
            </div>
          </div>
        </div>
        <div class="p-6 border-t border-gray-100 flex justify-end gap-3">
          <button @click="closeModal" class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            取消
          </button>
          <button @click="saveItem" class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
            保存
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { getPortfolio, savePortfolio } from '@/api'
import type { Portfolio } from '@/types'

const portfolio = ref<Portfolio[]>([])
const originalPortfolio = ref<Portfolio[]>([])
const searchKeyword = ref('')
const filterMarket = ref('')
const filterStyle = ref('')
const showAddModal = ref(false)
const showEditModal = ref(false)
const saving = ref(false)
const editIndex = ref(-1)

const form = ref<Partial<Portfolio>>({
  '股票代码': '',
  '股票名称': '',
  '所在市场': 'A股',
  '股票类别': 'ETF',
  '所属行业': '',
  '核心主题': '',
  '投资风格': '成长',
  '所属板块': '',
  '购买渠道': '东方财富',
  '是否清仓': '否',
  '当前实时价': '',
  '昨日收盘价': '',
  'MA5': '',
  'MA10': '',
  'MA20': '',
  'MA30': '',
  'MA50': '',
})

const hasChanges = computed(() => {
  return JSON.stringify(portfolio.value) !== JSON.stringify(originalPortfolio.value)
})

// 辅助函数：获取字段值（兼容中英文）
const getField = (item: Portfolio, field: string): string => {
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
    isLiquidated: '是否清仓',
  }
  return (item[field as keyof Portfolio] as string) || (item[cnMap[field] as keyof Portfolio] as string) || ''
}

const getLiquidatedClass = (isLiquidated: string | undefined) => {
  return isLiquidated === '是' ? 'bg-gray-100 text-gray-500' : 'bg-green-100 text-green-700'
}

const filteredPortfolio = computed(() => {
  let result = portfolio.value
  if (searchKeyword.value) {
    const kw = searchKeyword.value.toLowerCase()
    result = result.filter(item => {
      const code = getField(item, 'code').toLowerCase()
      const name = getField(item, 'name')
      return code.includes(kw) || name.includes(kw)
    })
  }
  if (filterMarket.value) {
    result = result.filter(item => getField(item, 'market') === filterMarket.value)
  }
  if (filterStyle.value) {
    result = result.filter(item => getField(item, 'style') === filterStyle.value)
  }
  return result
})

const aShareCount = computed(() => portfolio.value.filter(p => getField(p, 'market') === 'A股').length)
const hkShareCount = computed(() => portfolio.value.filter(p => getField(p, 'market') === '港股').length)
const usShareCount = computed(() => portfolio.value.filter(p => getField(p, 'market') === '美股').length)

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

const loadPortfolio = async () => {
  const res = await getPortfolio()
  portfolio.value = res.data || []
  originalPortfolio.value = JSON.parse(JSON.stringify(res.data || []))
}

const closeModal = () => {
  showAddModal.value = false
  showEditModal.value = false
  editIndex.value = -1
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
    '是否清仓': '否',
    '当前实时价': '',
    '昨日收盘价': '',
    'MA5': '',
    'MA10': '',
    'MA20': '',
    'MA30': '',
    'MA50': '',
  }
}

const editItem = (index: number) => {
  editIndex.value = index
  const item = portfolio.value[index]
  // 转换为中文表单
  form.value = {
    '股票代码': getField(item, 'code'),
    '股票名称': getField(item, 'name'),
    '所在市场': getField(item, 'market') || 'A股',
    '股票类别': getField(item, 'category') || 'ETF',
    '所属行业': getField(item, 'industry'),
    '核心主题': getField(item, 'theme'),
    '投资风格': getField(item, 'style') || '成长',
    '所属板块': getField(item, 'sector'),
    '购买渠道': getField(item, 'channel') || '东方财富',
    '是否清仓': item['是否清仓'] || '否',
    '当前实时价': '',
    '昨日收盘价': '',
    'MA5': '',
    'MA10': '',
    'MA20': '',
    'MA30': '',
    'MA50': '',
  }
  showEditModal.value = true
}

const deleteItem = (index: number) => {
  if (confirm('确定要删除这条记录吗？')) {
    portfolio.value.splice(index, 1)
  }
}

// 检测数据使用的字段格式（中文或英文）
const detectFieldFormat = (): 'chinese' | 'english' => {
  if (originalPortfolio.value.length === 0) return 'chinese'
  const firstItem = originalPortfolio.value[0]
  return '股票代码' in firstItem ? 'chinese' : 'english'
}

const saveItem = () => {
  if (!form.value['股票代码'] || !form.value['股票名称']) {
    alert('请填写必填项')
    return
  }

  // 根据原始数据格式决定使用中文还是英文字段
  const format = detectFieldFormat()
  
  let newItem: Portfolio
  if (format === 'chinese') {
    newItem = {
      '股票代码': form.value['股票代码'] || '',
      '股票名称': form.value['股票名称'] || '',
      '所在市场': form.value['所在市场'] || 'A股',
      '股票类别': form.value['股票类别'] || 'ETF',
      '所属行业': form.value['所属行业'] || '',
      '核心主题': form.value['核心主题'] || '',
      '投资风格': form.value['投资风格'] || '成长',
      '所属板块': form.value['所属板块'] || '',
      '购买渠道': form.value['购买渠道'] || '东方财富',
      '是否清仓': form.value['是否清仓'] || '否',
      '当前实时价': '',
      '昨日收盘价': '',
      'MA5': '',
      'MA10': '',
      'MA20': '',
      'MA30': '',
      'MA50': '',
    }
  } else {
    newItem = {
      'code': form.value['股票代码'] || '',
      'name': form.value['股票名称'] || '',
      'market': form.value['所在市场'] || 'A股',
      'category': form.value['股票类别'] || 'ETF',
      'industry': form.value['所属行业'] || '',
      'theme': form.value['核心主题'] || '',
      'style': form.value['投资风格'] || '成长',
      'sector': form.value['所属板块'] || '',
      'channel': form.value['购买渠道'] || '东方财富',
      'isLiquidated': form.value['是否清仓'] || '否',
      'currentPrice': '',
      'prevPrice': '',
      'ma5': '',
      'ma10': '',
      'ma20': '',
      'ma30': '',
      'ma50': '',
    }
  }

  if (showEditModal.value && editIndex.value >= 0) {
    portfolio.value[editIndex.value] = newItem
  } else {
    portfolio.value.push(newItem)
  }

  closeModal()
}

const saveChanges = async () => {
  saving.value = true
  try {
    await savePortfolio(portfolio.value)
    originalPortfolio.value = JSON.parse(JSON.stringify(portfolio.value))
    alert('保存成功')
  } catch (error) {
    alert('保存失败')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadPortfolio()
})
</script>
