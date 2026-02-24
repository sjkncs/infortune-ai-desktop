<template>
  <div class="h-full flex flex-col">
    <!-- 页面标题和操作按钮 -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-2xl font-bold text-gray-900">用户管理</h2>
        <p class="text-sm text-gray-600 mt-1">管理系统用户账号，支持新增、编辑、启用/禁用等操作</p>
      </div>
      <button
        @click="openCreateModal"
        class="inline-flex items-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
      >
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        新增用户
      </button>
    </div>

    <!-- 搜索和筛选 -->
    <div class="bg-white rounded-lg shadow-sm p-4 mb-6">
      <div class="flex flex-wrap gap-4">
        <div class="flex-1 min-w-[200px]">
          <div class="relative">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="搜索用户名、昵称..."
              class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <svg class="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
        <select
          v-model="statusFilter"
          class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          <option value="">全部状态</option>
          <option value="enabled">启用</option>
          <option value="disabled">禁用</option>
        </select>
      </div>
    </div>

    <!-- 用户列表 -->
    <div class="bg-white rounded-lg shadow-sm flex-1 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">用户信息</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">角色</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">创建时间</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">最后登录</th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="user in filteredUsers" :key="user.id" class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-medium">
                    {{ user.nickname?.charAt(0) || user.username?.charAt(0) || 'U' }}
                  </div>
                  <div class="ml-4">
                    <div class="text-sm font-medium text-gray-900">{{ user.nickname || user.username }}</div>
                    <div class="text-sm text-gray-500">{{ user.username }}</div>
                    <div v-if="user.email" class="text-xs text-gray-400">{{ user.email }}</div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex flex-wrap gap-1">
                  <span 
                    v-for="role in user.roles" 
                    :key="role"
                    :class="[
                      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                      role === '系统管理员' ? 'bg-purple-100 text-purple-800' : 
                      role === '数据分析师' ? 'bg-blue-100 text-blue-800' :
                      role === '财务管理员' ? 'bg-green-100 text-green-800' :
                      role === '运营人员' ? 'bg-orange-100 text-orange-800' :
                      'bg-gray-100 text-gray-800'
                    ]"
                  >
                    {{ role }}
                  </span>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <button
                  @click="toggleUserStatus(user)"
                  :class="[
                    'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors',
                    user.status === 'enabled' 
                      ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                      : 'bg-red-100 text-red-800 hover:bg-red-200'
                  ]"
                >
                  <span 
                    :class="[
                      'w-2 h-2 rounded-full mr-2',
                      user.status === 'enabled' ? 'bg-green-500' : 'bg-red-500'
                    ]"
                  ></span>
                  {{ user.status === 'enabled' ? '启用' : '禁用' }}
                </button>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ user.createdAt }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ user.lastLoginAt || '从未登录' }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div class="flex items-center justify-end space-x-2">
                  <button
                    @click="openEditModal(user)"
                    class="text-primary-600 hover:text-primary-900 p-1 rounded hover:bg-primary-50 transition-colors"
                    title="编辑"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    v-if="user.username !== 'admin'"
                    @click="confirmDelete(user)"
                    class="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors"
                    title="删除"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <!-- 空状态 -->
      <div v-if="filteredUsers.length === 0" class="text-center py-12">
        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <h3 class="mt-2 text-sm font-medium text-gray-900">暂无用户</h3>
        <p class="mt-1 text-sm text-gray-500">请尝试调整搜索条件或添加新用户</p>
      </div>
    </div>

    <!-- 用户表单弹窗 -->
    <div v-if="showModal" class="fixed inset-0 z-50 overflow-y-auto">
      <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" @click="closeModal"></div>
        <span class="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
        <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full">
          <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div class="sm:flex sm:items-start">
              <div class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-primary-100 sm:mx-0 sm:h-10 sm:w-10">
                <svg class="h-6 w-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <h3 class="text-lg leading-6 font-medium text-gray-900">
                  {{ isEditing ? '编辑用户' : '新增用户' }}
                </h3>
                <div class="mt-4 space-y-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700">用户名 <span class="text-red-500">*</span></label>
                    <input
                      v-model="formData.username"
                      type="text"
                      :disabled="isEditing"
                      class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm disabled:bg-gray-100"
                      placeholder="请输入用户名"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700">
                      密码 <span v-if="!isEditing" class="text-red-500">*</span>
                      <span v-else class="text-gray-500">(不修改请留空)</span>
                    </label>
                    <input
                      v-model="formData.password"
                      type="password"
                      class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      :placeholder="isEditing ? '不修改请留空' : '请输入密码'"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700">昵称</label>
                    <input
                      v-model="formData.nickname"
                      type="text"
                      class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      placeholder="请输入昵称"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700">邮箱</label>
                    <input
                      v-model="formData.email"
                      type="email"
                      class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      placeholder="请输入邮箱"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700">手机号</label>
                    <input
                      v-model="formData.phone"
                      type="tel"
                      class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      placeholder="请输入手机号"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700">角色 <span class="text-red-500">*</span></label>
                    <div class="mt-2 space-y-2">
                      <label v-for="role in roleOptions" :key="role.value" class="inline-flex items-center mr-4">
                        <input
                          v-model="formData.roles"
                          type="checkbox"
                          :value="role.value"
                          class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <span class="ml-2 text-sm text-gray-700">{{ role.label }}</span>
                      </label>
                    </div>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700">状态</label>
                    <select
                      v-model="formData.status"
                      class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    >
                      <option value="enabled">启用</option>
                      <option value="disabled">禁用</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              @click="saveUser"
              :disabled="saving"
              class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
            >
              {{ saving ? '保存中...' : '保存' }}
            </button>
            <button
              @click="closeModal"
              class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              取消
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 删除确认弹窗 -->
    <div v-if="showDeleteModal" class="fixed inset-0 z-50 overflow-y-auto">
      <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" @click="showDeleteModal = false"></div>
        <span class="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
        <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full">
          <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div class="sm:flex sm:items-start">
              <div class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                <svg class="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3 class="text-lg leading-6 font-medium text-gray-900">确认删除</h3>
                <div class="mt-2">
                  <p class="text-sm text-gray-500">
                    确定要删除用户 "{{ userToDelete?.nickname || userToDelete?.username }}" 吗？此操作无法撤销。
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              @click="deleteUser"
              :disabled="deleting"
              class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
            >
              {{ deleting ? '删除中...' : '删除' }}
            </button>
            <button
              @click="showDeleteModal = false"
              class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              取消
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { getUsers, createUser, updateUser, deleteUser as deleteUserApi, updateUserStatus, getRoleEnums } from '@/api'
import { useUserStore } from '@/stores/user'
import type { User } from '@/types'

const userStore = useUserStore()

// 数据
const users = ref<User[]>([])
const roleOptions = ref<{ value: string; label: string }[]>([])
const searchQuery = ref('')
const statusFilter = ref('')

// 弹窗状态
const showModal = ref(false)
const showDeleteModal = ref(false)
const isEditing = ref(false)
const saving = ref(false)
const deleting = ref(false)
const userToDelete = ref<User | null>(null)

// 表单数据
const formData = ref({
  id: '',
  username: '',
  password: '',
  nickname: '',
  email: '',
  phone: '',
  roles: [] as string[],
  status: 'enabled' as 'enabled' | 'disabled'
})

// 计算属性：过滤后的用户列表
const filteredUsers = computed(() => {
  return users.value.filter(user => {
    const matchesSearch = !searchQuery.value || 
      user.username.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      user.nickname?.toLowerCase().includes(searchQuery.value.toLowerCase())
    
    const matchesStatus = !statusFilter.value || user.status === statusFilter.value
    
    return matchesSearch && matchesStatus
  })
})

// 获取用户列表
async function fetchUsers() {
  try {
    const response = await getUsers()
    if (response.success) {
      users.value = response.data
    }
  } catch (error) {
    console.error('获取用户列表失败:', error)
    alert('获取用户列表失败')
  }
}

// 获取角色选项
async function fetchRoles() {
  try {
    const response = await getRoleEnums()
    if (response.success) {
      roleOptions.value = response.data
    }
  } catch (error) {
    console.error('获取角色选项失败:', error)
  }
}

// 打开新增弹窗
function openCreateModal() {
  isEditing.value = false
  formData.value = {
    id: '',
    username: '',
    password: '',
    nickname: '',
    email: '',
    phone: '',
    roles: ['普通用户'],
    status: 'enabled'
  }
  showModal.value = true
}

// 打开编辑弹窗
function openEditModal(user: User) {
  isEditing.value = true
  formData.value = {
    id: user.id,
    username: user.username,
    password: '',
    nickname: user.nickname || '',
    email: user.email || '',
    phone: user.phone || '',
    roles: [...user.roles],
    status: user.status
  }
  showModal.value = true
}

// 关闭弹窗
function closeModal() {
  showModal.value = false
}

// 保存用户
async function saveUser() {
  // 表单验证
  if (!formData.value.username) {
    alert('请输入用户名')
    return
  }
  if (!isEditing.value && !formData.value.password) {
    alert('请输入密码')
    return
  }
  if (formData.value.roles.length === 0) {
    alert('请至少选择一个角色')
    return
  }

  saving.value = true
  
  try {
    const currentUser = userStore.user
    const payload = {
      ...formData.value,
      createdBy: currentUser?.username || 'system',
      updatedBy: currentUser?.username || 'system'
    }

    if (isEditing.value) {
      const response = await updateUser(formData.value.id, payload)
      if (response.success) {
        alert('用户更新成功')
        closeModal()
        fetchUsers()
      } else {
        alert(response.message || '更新失败')
      }
    } else {
      const response = await createUser(payload as any)
      if (response.success) {
        alert('用户创建成功')
        closeModal()
        fetchUsers()
      } else {
        alert(response.message || '创建失败')
      }
    }
  } catch (error: any) {
    console.error('保存用户失败:', error)
    alert(error.response?.data?.message || '保存失败')
  } finally {
    saving.value = false
  }
}

// 切换用户状态
async function toggleUserStatus(user: User) {
  const newStatus = user.status === 'enabled' ? 'disabled' : 'enabled'
  const actionText = newStatus === 'enabled' ? '启用' : '禁用'
  
  if (!confirm(`确定要${actionText}用户 "${user.nickname || user.username}" 吗？`)) {
    return
  }

  try {
    const currentUser = userStore.user
    const response = await updateUserStatus(user.id, newStatus, currentUser?.username || 'system')
    
    if (response.success) {
      alert(`${actionText}成功`)
      fetchUsers()
    } else {
      alert(response.message || '操作失败')
    }
  } catch (error: any) {
    console.error('切换用户状态失败:', error)
    alert(error.response?.data?.message || '操作失败')
  }
}

// 确认删除
function confirmDelete(user: User) {
  userToDelete.value = user
  showDeleteModal.value = true
}

// 删除用户
async function deleteUser() {
  if (!userToDelete.value) return
  
  deleting.value = true
  
  try {
    const response = await deleteUserApi(userToDelete.value.id)
    
    if (response.success) {
      alert('删除成功')
      showDeleteModal.value = false
      userToDelete.value = null
      fetchUsers()
    } else {
      alert(response.message || '删除失败')
    }
  } catch (error: any) {
    console.error('删除用户失败:', error)
    alert(error.response?.data?.message || '删除失败')
  } finally {
    deleting.value = false
  }
}

onMounted(() => {
  fetchUsers()
  fetchRoles()
})
</script>
