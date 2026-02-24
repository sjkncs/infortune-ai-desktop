import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { usePageMeta } from '@/composables/usePageMeta'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue'),
    meta: {
      title: 'In Fortune AI - 久经风雨，财智自成',
      description: 'In Fortune AI - 专业的股票分析工具，提供自选持仓分析、指数估值分析、投资详情等功能',
      keywords: '股票分析,基金分析,指数估值,投资建议,In Fortune'
    }
  },
  {
    path: '/zixuan',
    name: 'Zixuan',
    component: () => import('@/views/Zixuan.vue'),
    meta: {
      title: '自选分析 - In Fortune AI',
      description: '查看您的自选股票列表，实时监控股票价格变化，智能分析持仓表现，提供个性化的投资建议',
      keywords: '自选股,持仓分析,股票监控,投资组合,In Fortune AI'
    }
  },
  {
    path: '/chicang',
    name: 'Chicang',
    component: () => import('@/views/Chicang.vue'),
    meta: {
      title: '持仓分析 - In Fortune AI',
      description: '查看您的持仓股票列表，实时监控股票价格变化，智能分析持仓表现',
      keywords: '持仓,股票监控,投资组合,In Fortune AI'
    }
  },
  {
    path: '/zhishu',
    name: 'Zhishu',
    component: () => import('@/views/Zhishu.vue'),
    meta: {
      title: '指数分析 - In Fortune AI',
      description: '全面分析各大指数估值水平，包括PE、PB、股息率等关键指标，帮助您判断市场投资价值',
      keywords: '指数估值,PE分析,PB分析,股息率,市场估值,In Fortune AI'
    }
  },
  {
    path: '/etf',
    name: 'ETF',
    component: () => import('@/views/ETF.vue'),
    meta: {
      title: 'ETF行情 - In Fortune AI',
      description: '实时查看A股市场全部ETF基金行情数据，包括最新价、涨跌幅、成交量、成交额等关键指标',
      keywords: 'ETF行情,基金行情,实时数据,ETF列表,In Fortune AI'
    }
  },
  {
    path: '/stock/:code',
    name: 'StockDetail',
    component: () => import('@/views/StockDetail.vue'),
    meta: {
      title: '投资详情 - In Fortune AI',
      description: '查看股票的K线图表、买卖盘口、投资建议等详细分析，助您做出明智的投资决策',
      keywords: '股票详情,K线图,买卖盘口,投资建议,技术分析,In Fortune AI'
    }
  },
  // 404 页面 - 匹配所有未定义的路由
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue'),
    meta: {
      title: '页面未找到 - In Fortune AI',
      description: '您访问的页面不存在',
      keywords: '404,页面未找到,In Fortune AI'
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  }
})

// 路由守卫 - 更新页面元数据
router.beforeEach((to, _from, next) => {
  // 设置文档标题
  const title = (to.meta.title as string) || 'In Fortune AI - 久经风雨，财智自成'
  document.title = title

  next()
})

export default router
