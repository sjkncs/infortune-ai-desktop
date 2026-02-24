<template>
  <div class="min-h-screen flex items-center justify-center relative overflow-hidden">
    <!-- 背景 -->
    <div class="absolute inset-0 bg-gradient-to-br from-surface via-surface-light to-surface"></div>
    <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl"></div>
    <div class="absolute bottom-1/4 right-1/4 w-64 h-64 bg-primary/5 rounded-full blur-2xl"></div>
    
    <div class="relative text-center">
      <!-- Logo -->
      <div class="mb-8">
        <div class="w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center">
          <img 
            src="/img/LOGO_ico.png" 
            alt="In Fortune AI" 
            class="w-full h-full object-contain opacity-50"
          />
        </div>
      </div>
      
      <div class="text-9xl font-bold mb-4">
        <span class="text-gradient">404</span>
      </div>
      <h1 class="text-3xl font-bold mb-4 text-gray-200">页面未找到</h1>
      <p class="text-lg text-gray-400 mb-8">抱歉，您访问的页面不存在或已被移除</p>
      <div>
        <router-link 
          to="/" 
          class="inline-flex items-center px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark transition-colors shadow-glow"
        >
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          返回首页
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 404 页面组件
</script>
