<template>
  <div class="space-y-6">
    <!-- Toast 通知容器 -->
    <div class="fixed top-4 right-4 z-50 space-y-2">
      <transition-group name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="flex items-center px-4 py-3 rounded-lg shadow-lg max-w-md transform transition-all duration-300"
          :class="getToastClass(toast.type)"
        >
          <svg
            v-if="toast.type === 'success'"
            class="w-5 h-5 mr-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <svg
            v-else-if="toast.type === 'error'"
            class="w-5 h-5 mr-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <svg
            v-else-if="toast.type === 'info'"
            class="w-5 h-5 mr-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <span class="text-sm font-medium flex-1">{{ toast.message }}</span>
          <button
            @click="removeToast(toast.id)"
            class="ml-3 text-current opacity-60 hover:opacity-100"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
      </transition-group>
    </div>

    <!-- 统计卡片 -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div class="bg-white rounded-xl shadow-sm p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500 mb-1">股票总数</p>
            <p class="text-2xl font-bold text-gray-900">{{ stats.stockCount }}</p>
          </div>
          <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
            </svg>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-sm p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500 mb-1">持仓数量</p>
            <p class="text-2xl font-bold text-gray-900">{{ stats.portfolioCount }}</p>
          </div>
          <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
            </svg>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-sm p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500 mb-1">估值指数</p>
            <p class="text-2xl font-bold text-gray-900">{{ stats.valuationCount }}</p>
          </div>
          <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"></path>
            </svg>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-sm p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500 mb-1">最后更新</p>
            <p class="text-lg font-bold text-gray-900">{{ stats.lastUpdate }}</p>
          </div>
          <div class="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
        </div>
      </div>
    </div>

    <!-- 快捷操作和系统状态 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 快捷操作 -->
      <div class="bg-white rounded-xl shadow-sm p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">快捷操作</h3>
        <div class="grid grid-cols-2 gap-4">
          <router-link
            to="/stocks"
            class="flex items-center p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
          >
            <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
              <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
              </svg>
            </div>
            <div>
              <p class="font-medium text-gray-900">添加股票</p>
              <p class="text-sm text-gray-500">新增股票数据</p>
            </div>
          </router-link>

          <router-link
            to="/portfolio"
            class="flex items-center p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
          >
            <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
              <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
              </svg>
            </div>
            <div>
              <p class="font-medium text-gray-900">编辑持仓</p>
              <p class="text-sm text-gray-500">管理自选股</p>
            </div>
          </router-link>

          <router-link
            to="/valuation"
            class="flex items-center p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
          >
            <div class="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
              <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
            </div>
            <div>
              <p class="font-medium text-gray-900">更新估值</p>
              <p class="text-sm text-gray-500">修改指数数据</p>
            </div>
          </router-link>

          <router-link
            to="/meta-config"
            class="flex items-center p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
          >
            <div class="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
              <svg class="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
              </svg>
            </div>
            <div>
              <p class="font-medium text-gray-900">页面配置</p>
              <p class="text-sm text-gray-500">SEO 元数据设置</p>
            </div>
          </router-link>
        </div>
      </div>

      <!-- 系统状态 - 应用服务管理 -->
      <div class="bg-white rounded-xl shadow-sm p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-900">系统状态</h3>
          <button
            @click="refreshServiceStatus"
            :disabled="serviceLoading"
            class="flex items-center px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
          >
            <svg
              class="w-4 h-4 mr-1"
              :class="{ 'animate-spin': serviceLoading }"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            {{ serviceLoading ? '刷新中' : '刷新' }}
          </button>
        </div>
        
        <!-- 应用服务列表 -->
        <div class="space-y-3">
          <div
            v-for="service in services"
            :key="service.id"
            class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
          >
            <div class="flex items-center">
              <div
                class="w-8 h-8 rounded-lg flex items-center justify-center mr-3"
                :class="getServiceIconClass(service.id)"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path v-if="service.id === 'akshare'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                  <path v-else-if="service.id === 'baostock'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                  <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path>
                </svg>
              </div>
              <div>
                <p class="text-sm font-medium text-gray-900">{{ service.name }}</p>
                <p class="text-xs text-gray-500">端口 {{ service.port }}</p>
              </div>
            </div>
            
            <div class="flex items-center space-x-2">
              <span
                class="px-2 py-1 text-xs font-medium rounded-full"
                :class="getStatusClass(service.status)"
              >
                {{ getStatusText(service.status) }}
              </span>
              
              <!-- 操作按钮组 -->
              <div class="flex space-x-1">
                <button
                  v-if="service.status !== 'running'"
                  @click="handleStart(service.id)"
                  :disabled="actionLoading[service.id]"
                  class="p-1.5 text-green-600 hover:bg-green-100 rounded transition-colors disabled:opacity-50"
                  title="启动"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </button>
                
                <button
                  v-if="service.status === 'running'"
                  @click="handleStop(service.id)"
                  :disabled="actionLoading[service.id]"
                  class="p-1.5 text-red-600 hover:bg-red-100 rounded transition-colors disabled:opacity-50"
                  title="停止"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"></path>
                  </svg>
                </button>
                
                <button
                  @click="handleRestart(service.id)"
                  :disabled="actionLoading[service.id]"
                  class="p-1.5 text-blue-600 hover:bg-blue-100 rounded transition-colors disabled:opacity-50"
                  title="重启"
                >
                  <svg
                    class="w-4 h-4"
                    :class="{ 'animate-spin': actionLoading[service.id] }"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 批量操作 -->
        <div class="mt-4 pt-4 border-t border-gray-200">
          <div class="flex space-x-2">
            <button
              @click="handleStartAll"
              :disabled="batchLoading"
              class="flex-1 flex items-center justify-center px-3 py-2 text-sm bg-green-50 text-green-700 rounded-lg hover:bg-green-100 disabled:opacity-50 transition-colors"
            >
              <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              启动全部
            </button>
            
            <button
              @click="handleStopAll"
              :disabled="batchLoading"
              class="flex-1 flex items-center justify-center px-3 py-2 text-sm bg-red-50 text-red-700 rounded-lg hover:bg-red-100 disabled:opacity-50 transition-colors"
            >
              <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"></path>
              </svg>
              停止全部
            </button>
            
            <button
              @click="handleRestartAll"
              :disabled="batchLoading"
              class="flex-1 flex items-center justify-center px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 disabled:opacity-50 transition-colors"
            >
              <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
              </svg>
              重启全部
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getStocks, getPortfolio, getValuation, getServices, startService, stopService, restartService } from '@/api'
import type { Stock, Portfolio, Valuation, ServiceInfo } from '@/types'

// Toast 通知系统
interface Toast {
  id: number
  message: string
  type: 'success' | 'error' | 'info'
}

const toasts = ref<Toast[]>([])
let toastIdCounter = 0

const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
  const id = ++toastIdCounter
  toasts.value.push({ id, message, type })
  
  setTimeout(() => {
    removeToast(id)
  }, 3000)
}

const removeToast = (id: number) => {
  const index = toasts.value.findIndex(t => t.id === id)
  if (index > -1) {
    toasts.value.splice(index, 1)
  }
}

const getToastClass = (type: string) => {
  const classes: Record<string, string> = {
    success: 'bg-green-50 border border-green-200 text-green-800',
    error: 'bg-red-50 border border-red-200 text-red-800',
    info: 'bg-blue-50 border border-blue-200 text-blue-800'
  }
  return classes[type] || classes.info
}

// 统计数据
const stats = ref({
  stockCount: 0,
  portfolioCount: 0,
  valuationCount: 0,
  lastUpdate: '--',
})

// 服务管理
const services = ref<ServiceInfo[]>([])
const serviceLoading = ref(false)
const batchLoading = ref(false)
const actionLoading = ref<Record<string, boolean>>({})

// 获取服务图标样式
const getServiceIconClass = (id: string) => {
  const classes: Record<string, string> = {
    akshare: 'bg-yellow-100 text-yellow-600',
    baostock: 'bg-purple-100 text-purple-600',
    website: 'bg-blue-100 text-blue-600'
  }
  return classes[id] || 'bg-gray-100 text-gray-600'
}

// 获取状态样式
const getStatusClass = (status: string) => {
  const classes: Record<string, string> = {
    running: 'bg-green-100 text-green-700',
    stopped: 'bg-gray-100 text-gray-600',
    error: 'bg-red-100 text-red-700',
    starting: 'bg-yellow-100 text-yellow-700'
  }
  return classes[status] || 'bg-gray-100 text-gray-600'
}

// 获取状态文本
const getStatusText = (status: string) => {
  const texts: Record<string, string> = {
    running: '运行中',
    stopped: '已停止',
    error: '检测失败',
    starting: '启动中'
  }
  return texts[status] || status
}

// 加载统计数据
const loadData = async () => {
  try {
    const [stocksRes, portfolioRes, valuationRes] = await Promise.all([
      getStocks(),
      getPortfolio(),
      getValuation(),
    ])

    stats.value.stockCount = stocksRes.data?.length || 0
    stats.value.portfolioCount = portfolioRes.data?.length || 0
    stats.value.valuationCount = valuationRes.data?.length || 0
    stats.value.lastUpdate = new Date().toLocaleDateString('zh-CN')
  } catch (error) {
    console.error('加载数据失败:', error)
  }
}

// 刷新服务状态
const refreshServiceStatus = async () => {
  serviceLoading.value = true
  try {
    const res = await getServices()
    if (res.success && res.data) {
      services.value = Object.values(res.data)
    } else {
      services.value = getDefaultServices()
    }
  } catch (error) {
    console.error('获取服务状态失败:', error)
    services.value = getDefaultServices()
  } finally {
    serviceLoading.value = false
  }
}

// 获取默认服务列表
const getDefaultServices = (): ServiceInfo[] => {
  return [
    {
      id: 'akshare',
      name: 'AKShare 数据服务',
      description: 'Python 实时行情数据服务',
      port: 8000,
      directory: 'akshare',
      startCommand: 'python',
      startArgs: ['start.py'],
      healthEndpoint: '/docs',
      type: 'python',
      status: 'stopped'
    },
    {
      id: 'baostock',
      name: 'BaoStock 数据服务',
      description: 'Python 财务数据服务',
      port: 8001,
      directory: 'baostock',
      startCommand: 'python',
      startArgs: ['start.py'],
      healthEndpoint: '/docs',
      type: 'python',
      status: 'stopped'
    },
    {
      id: 'website',
      name: 'Website 前端服务',
      description: '用户前端开发服务器',
      port: 5173,
      directory: 'website',
      startCommand: 'npm',
      startArgs: ['run', 'dev'],
      healthEndpoint: '/',
      type: 'node',
      status: 'stopped'
    }
  ]
}

// 启动服务
const handleStart = async (id: string) => {
  actionLoading.value[id] = true
  try {
    const res = await startService(id)
    if (res.success) {
      showToast(`${getServiceName(id)} 启动成功`, 'success')
      await refreshServiceStatus()
    } else {
      showToast(`${getServiceName(id)} 启动失败: ${res.message}`, 'error')
    }
  } catch (error) {
    console.error('启动服务失败:', error)
    showToast('启动服务失败', 'error')
  } finally {
    actionLoading.value[id] = false
  }
}

// 停止服务
const handleStop = async (id: string) => {
  actionLoading.value[id] = true
  try {
    const res = await stopService(id)
    if (res.success) {
      showToast(`${getServiceName(id)} 已停止`, 'success')
      await refreshServiceStatus()
    } else {
      showToast(`${getServiceName(id)} 停止失败: ${res.message}`, 'error')
    }
  } catch (error) {
    console.error('停止服务失败:', error)
    showToast('停止服务失败', 'error')
  } finally {
    actionLoading.value[id] = false
  }
}

// 重启服务
const handleRestart = async (id: string) => {
  actionLoading.value[id] = true
  try {
    const res = await restartService(id)
    if (res.success) {
      showToast(`${getServiceName(id)} 重启成功`, 'success')
      await refreshServiceStatus()
    } else {
      showToast(`${getServiceName(id)} 重启失败: ${res.message}`, 'error')
    }
  } catch (error) {
    console.error('重启服务失败:', error)
    showToast('重启服务失败', 'error')
  } finally {
    actionLoading.value[id] = false
  }
}

// 获取服务名称
const getServiceName = (id: string) => {
  const service = services.value.find(s => s.id === id)
  return service?.name || id
}

// 批量启动全部
const handleStartAll = async () => {
  batchLoading.value = true
  try {
    const stoppedServices = services.value.filter(s => s.status !== 'running')
    for (const service of stoppedServices) {
      await handleStart(service.id)
    }
  } finally {
    batchLoading.value = false
  }
}

// 批量停止全部
const handleStopAll = async () => {
  batchLoading.value = true
  try {
    const runningServices = services.value.filter(s => s.status === 'running')
    for (const service of runningServices) {
      await handleStop(service.id)
    }
  } finally {
    batchLoading.value = false
  }
}

// 批量重启全部
const handleRestartAll = async () => {
  batchLoading.value = true
  try {
    for (const service of services.value) {
      await handleRestart(service.id)
    }
  } finally {
    batchLoading.value = false
  }
}

onMounted(() => {
  loadData()
  refreshServiceStatus()
})
</script>

<style scoped>
/* Toast 动画 */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
</style>
