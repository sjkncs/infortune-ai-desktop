import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login as loginApi, getCurrentUser } from '@/api'

export interface User {
  id: string
  username: string
  nickname: string
  avatar: string
  email: string
  phone: string
  status: 'enabled' | 'disabled'
  roles: string[]
  createdAt: string
  createdBy: string
  updatedAt: string
  updatedBy: string
  lastLoginAt: string
  lastLoginIp: string
}

export const useUserStore = defineStore('user', () => {
  // State
  const user = ref<User | null>(null)
  const loading = ref(false)
  const error = ref('')

  // Getters
  const isLoggedIn = computed(() => !!user.value)
  const isAdmin = computed(() => user.value?.roles.includes('系统管理员') || false)
  const username = computed(() => user.value?.username || '')
  const nickname = computed(() => user.value?.nickname || '')

  // Actions
  async function login(username: string, password: string) {
    loading.value = true
    error.value = ''
    
    try {
      const response = await loginApi(username, password)
      
      if (response.success) {
        user.value = response.data
        // 保存用户信息到 localStorage
        localStorage.setItem('admin_user', JSON.stringify(response.data))
        return { success: true }
      } else {
        error.value = response.message || '登录失败'
        return { success: false, message: error.value }
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || '登录失败，请检查网络连接'
      return { success: false, message: error.value }
    } finally {
      loading.value = false
    }
  }

  function logout() {
    user.value = null
    localStorage.removeItem('admin_user')
  }

  function initUser() {
    const savedUser = localStorage.getItem('admin_user')
    if (savedUser) {
      try {
        user.value = JSON.parse(savedUser)
      } catch (e) {
        console.error('解析用户信息失败:', e)
        localStorage.removeItem('admin_user')
      }
    }
  }

  return {
    user,
    loading,
    error,
    isLoggedIn,
    isAdmin,
    username,
    nickname,
    login,
    logout,
    initUser
  }
})
