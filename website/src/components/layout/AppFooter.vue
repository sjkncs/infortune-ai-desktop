<template>
  <footer class="bg-gray-900 border-t border-gray-700/50 mt-auto">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <!-- Brand -->
        <div>
          <div class="flex items-center gap-3 mb-4">
            <div class="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
              <i class="fas fa-chart-line text-white"></i>
            </div>
            <div>
              <h3 class="text-lg font-bold text-gradient">In Fortune AI</h3>
              <p class="text-xs text-gray-500">久经风雨，财智自成</p>
            </div>
          </div>
          <p class="text-sm text-gray-500 leading-relaxed">
            提供专业的自选持仓分析、指数估值分析、投资建议等功能，助力您的投资决策。
          </p>
        </div>

        <!-- Quick Links -->
        <div>
          <h4 class="text-sm font-semibold text-gray-300 mb-4">快速链接</h4>
          <ul class="space-y-2">
            <li v-for="link in quickLinks" :key="link.path">
              <router-link 
                :to="link.path" 
                class="text-sm text-gray-500 hover:text-primary transition-colors"
              >
                {{ link.name }}
              </router-link>
            </li>
          </ul>
        </div>

        <!-- Contact -->
        <div>
          <h4 class="text-sm font-semibold text-gray-300 mb-4">联系我们</h4>
          <ul class="space-y-2 text-sm text-gray-500">
            <li class="flex items-center gap-2">
              <i class="fas fa-envelope text-primary"></i>
              <a href="mailto:support@InFortune.ai" class="hover:text-primary transition-colors">support@InFortune.ai</a>
            </li>
            <li class="flex items-center gap-2">
              <i class="fab fa-github text-primary"></i>
              <a href="https://github.com/sjkncs" target="_blank" rel="noopener noreferrer" class="hover:text-primary transition-colors">GitHub</a>
            </li>
          </ul>
        </div>
      </div>

      <!-- Bottom -->
      <div class="mt-8 pt-6 border-t border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-4">
        <p class="text-xs text-gray-600">
          © {{ currentYear }} In Fortune AI. 保留所有权利.
        </p>
        <p class="text-xs text-gray-600">
          数据仅供参考，不构成投资建议
        </p>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
const currentYear = new Date().getFullYear()

const quickLinks = [
  { name: '首页', path: '/' },
  { name: '自选分析', path: '/zixuan' },
  { name: '持仓分析', path: '/chicang' },
  { name: '指数分析', path: '/zhishu' }
]
</script>
