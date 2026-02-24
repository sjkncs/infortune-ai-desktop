import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'
import MainLayout from '@/layouts/MainLayout.vue'
import Dashboard from '@/views/Dashboard.vue'
import StockManage from '@/views/StockManage.vue'
import PortfolioManage from '@/views/PortfolioManage.vue'
import ValuationManage from '@/views/ValuationManage.vue'
import MetaConfig from '@/views/MetaConfig.vue'
import Login from '@/views/Login.vue'
import UserManage from '@/views/UserManage.vue'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { public: true }
  },
  {
    path: '/',
    component: MainLayout,
    children: [
      { path: '', name: 'Dashboard', component: Dashboard },
      { path: 'stocks', name: 'StockManage', component: StockManage },
      { path: 'portfolio', name: 'PortfolioManage', component: PortfolioManage },
      { path: 'valuation', name: 'ValuationManage', component: ValuationManage },
      { path: 'meta-config', name: 'MetaConfig', component: MetaConfig },
      { path: 'users', name: 'UserManage', component: UserManage },
    ],
  },
  // 404 页面 - 匹配所有未定义的路由
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue'),
    meta: { public: true }
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  userStore.initUser()

  // 如果访问登录页且已登录，跳转到首页
  if (to.name === 'Login' && userStore.isLoggedIn) {
    next('/')
    return
  }

  // 如果访问需要登录的页面且未登录，跳转到登录页
  if (!to.meta.public && !userStore.isLoggedIn) {
    next('/login')
    return
  }

  next()
})

export default router
