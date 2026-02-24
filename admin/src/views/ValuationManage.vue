<template>
  <div class="h-full flex flex-col gap-6">
    <!-- 页面标题 -->
    <div>
      <h2 class="text-2xl font-bold text-gray-900">指数管理</h2>
      <p class="text-gray-500 mt-1">管理指数估值数据</p>
    </div>

    <!-- 统计信息 -->
    <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
      <div class="bg-white rounded-lg shadow-sm p-4">
        <p class="text-sm text-gray-500">宽基指数</p>
        <p class="text-2xl font-bold text-blue-600">{{ categoryCount['主要宽基指数'] || 0 }}</p>
      </div>
      <div class="bg-white rounded-lg shadow-sm p-4">
        <p class="text-sm text-gray-500">消费行业</p>
        <p class="text-2xl font-bold text-green-600">{{ categoryCount['消费'] || 0 }}</p>
      </div>
      <div class="bg-white rounded-lg shadow-sm p-4">
        <p class="text-sm text-gray-500">周期行业</p>
        <p class="text-2xl font-bold text-orange-600">{{ categoryCount['周期'] || 0 }}</p>
      </div>
      <div class="bg-white rounded-lg shadow-sm p-4">
        <p class="text-sm text-gray-500">TMT科技</p>
        <p class="text-2xl font-bold text-purple-600">{{ categoryCount['TMT科技'] || 0 }}</p>
      </div>
      <div class="bg-white rounded-lg shadow-sm p-4">
        <p class="text-sm text-gray-500">医药/制造</p>
        <p class="text-2xl font-bold text-red-600">{{ (categoryCount['医药'] || 0) + (categoryCount['制造'] || 0) }}</p>
      </div>
    </div>

    <!-- 分类筛选 -->
    <div class="bg-white rounded-xl shadow-sm p-4">
      <div class="flex gap-4 flex-wrap">
        <div class="flex-1 min-w-[200px]">
          <input
            v-model="searchKeyword"
            type="text"
            placeholder="搜索指数名称或代码..."
            class="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary-500"
          />
        </div>
        <select v-model="filterCategory" class="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary-500">
          <option value="">全部分类</option>
          <option value="主要宽基指数">主要宽基指数</option>
          <option value="消费">消费</option>
          <option value="周期">周期</option>
          <option value="TMT科技">TMT科技</option>
          <option value="医药">医药</option>
          <option value="制造">制造</option>
          <option value="金融地产">金融地产</option>
          <option value="其他">其他</option>
        </select>
      </div>
    </div>

    <!-- 估值说明 -->
    <div class="bg-blue-50 rounded-xl p-4 shrink-0">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
        <div>
          <p class="font-medium mb-1">PE百分位</p>
          <p class="text-xs">低于 30%：低估（绿色）| 30%-70%：合理（黄色）| 高于 70%：高估（红色）</p>
        </div>
        <div>
          <p class="font-medium mb-1">指标说明</p>
          <p class="text-xs">TTM_PE：滚动市盈率 | TTM_PB：滚动市净率 | ROE：净资产收益率</p>
        </div>
      </div>
    </div>

    <!-- 估值列表 -->
    <div class="flex-1 bg-white rounded-xl shadow-sm overflow-hidden flex flex-col">
      <div class="flex-1 overflow-auto">
        <table class="admin-table">
          <thead class="sticky top-0 bg-white">
            <tr>
              <th>跟踪指数</th>
              <th>指数名称</th>
              <th>分类</th>
              <th>当前价格</th>
              <th>TTM_PE</th>
              <th>PE百分位</th>
              <th>TTM_PB</th>
              <th>PB百分位</th>
              <th>股息率</th>
              <th>ROE</th>
              <th>跟踪基金</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in filteredValuation" :key="item['跟踪指数']">
              <td class="font-mono text-sm">{{ item['跟踪指数'] }}</td>
              <td class="font-medium">{{ item['指数名称'] }}</td>
              <td>
                <span class="px-2 py-1 text-xs rounded-full" :class="getCategoryClass(item['指数类别'])">
                  {{ item['指数类别'] }}
                </span>
              </td>
              <td>{{ item['当前价格']?.toFixed(2) || '-' }}</td>
              <td :class="getPEClass(item['TTM_PE市盈率'])">{{ item['TTM_PE市盈率']?.toFixed(2) || '-' }}</td>
              <td>
                <div class="flex items-center">
                  <div class="w-16 h-2 bg-gray-200 rounded-full mr-2">
                    <div
                      class="h-full rounded-full"
                      :class="getPercentClass(item['PE百分位_10年'])"
                      :style="{ width: `${(item['PE百分位_10年'] || 0) * 100}%` }"
                    ></div>
                  </div>
                  <span class="text-xs">{{ item['PE百分位_10年'] !== null ? (item['PE百分位_10年'] * 100).toFixed(1) + '%' : '-' }}</span>
                </div>
              </td>
              <td>{{ item['TTM_PB市净率']?.toFixed(2) || '-' }}</td>
              <td>
                <div class="flex items-center">
                  <div class="w-16 h-2 bg-gray-200 rounded-full mr-2">
                    <div
                      class="h-full rounded-full"
                      :class="getPercentClass(item['PB百分位_10年'])"
                      :style="{ width: `${(item['PB百分位_10年'] || 0) * 100}%` }"
                    ></div>
                  </div>
                  <span class="text-xs">{{ item['PB百分位_10年'] !== null ? (item['PB百分位_10年'] * 100).toFixed(1) + '%' : '-' }}</span>
                </div>
              </td>
              <td>{{ item['股息率'] ? (item['股息率'] * 100).toFixed(2) + '%' : '-' }}</td>
              <td>{{ item['ROE盈利能力'] ? (item['ROE盈利能力'] * 100).toFixed(2) + '%' : '-' }}</td>
              <td class="text-sm">{{ item['跟踪的指数基金'] }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="filteredValuation.length === 0" class="py-12 text-center text-gray-500">
        暂无数据
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { getValuation } from '@/api'
import type { Valuation } from '@/types'

const valuation = ref<Valuation[]>([])
const searchKeyword = ref('')
const filterCategory = ref('')

const filteredValuation = computed(() => {
  let result = valuation.value
  if (searchKeyword.value) {
    const kw = searchKeyword.value.toLowerCase()
    result = result.filter(item =>
      item['指数名称'].includes(kw) ||
      item['跟踪指数'].toLowerCase().includes(kw)
    )
  }
  if (filterCategory.value) {
    result = result.filter(item => item['指数类别'] === filterCategory.value)
  }
  return result
})

const categoryCount = computed(() => {
  const counts: Record<string, number> = {}
  valuation.value.forEach(item => {
    const cat = item['指数类别']
    counts[cat] = (counts[cat] || 0) + 1
  })
  return counts
})

const getCategoryClass = (category: string) => {
  const classes: Record<string, string> = {
    '主要宽基指数': 'bg-blue-100 text-blue-700',
    '消费': 'bg-green-100 text-green-700',
    '周期': 'bg-orange-100 text-orange-700',
    'TMT科技': 'bg-purple-100 text-purple-700',
    '医药': 'bg-red-100 text-red-700',
    '制造': 'bg-indigo-100 text-indigo-700',
    '金融地产': 'bg-yellow-100 text-yellow-700',
    '其他': 'bg-gray-100 text-gray-700',
  }
  return classes[category] || 'bg-gray-100 text-gray-700'
}

const getPEClass = (pe: number | null) => {
  if (pe === null) return 'text-gray-400'
  if (pe < 15) return 'text-green-600'
  if (pe > 30) return 'text-red-600'
  return 'text-yellow-600'
}

const getPercentClass = (percent: number | null) => {
  if (percent === null) return 'bg-gray-300'
  if (percent < 0.3) return 'bg-green-500'
  if (percent > 0.7) return 'bg-red-500'
  return 'bg-yellow-500'
}

const loadValuation = async () => {
  const res = await getValuation()
  valuation.value = res.data || []
}

onMounted(() => {
  loadValuation()
})
</script>
