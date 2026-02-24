# 网站元数据配置说明

## 概述

本项目已实现统一的元数据管理系统，支持全局默认配置和页面级自定义配置，为 SEO 和社交媒体分享提供完整的元数据支持。

## 架构说明

### 1. 核心文件

- **`src/types/meta.ts`** - 元数据类型定义和默认配置
- **`src/config/meta.config.ts`** - 各页面元数据配置
- **`src/composables/usePageMeta.ts`** - 元数据管理 composable

### 2. 元数据类型

完整的元数据包括：
- `title` - 页面标题
- `description` - 页面描述（SEO）
- `keywords` - 页面关键词（SEO）
- `openGraph` - Open Graph 标签（社交媒体分享）
- `twitter` - Twitter Card 标签（Twitter 分享）

### 3. 默认配置

全局默认配置定义在 `src/types/meta.ts`：

```typescript
export const defaultSiteMeta = {
  siteName: 'In Fortune AI',
  siteTitle: 'In Fortune AI - 久经风雨，财智自成',
  siteDescription: 'In Fortune AI - 专业的股票分析工具，提供自选持仓分析、指数估值分析、投资详情等功能',
  siteKeywords: '股票分析,基金分析,指数估值,投资建议,In Fortune',
  siteUrl: 'https://InFortune.ai',  // 可通过 VITE_SITE_URL 环境变量配置
  ogImage: '/og-image.png',
  twitterCard: 'summary_large_image',
}
```

## 使用方式

### 1. 在组件中使用

#### 方式一：使用路由自动配置（推荐）

只需在组件中调用 `usePageMeta()`，会自动根据路由配置设置元数据：

```vue
<script setup lang="ts">
import { usePageMeta } from '@/composables/usePageMeta'

// 自动使用路由配置的元数据
usePageMeta()
</script>
```

#### 方式二：自定义部分元数据

```vue
<script setup lang="ts">
import { usePageMeta } from '@/composables/usePageMeta'

// 覆盖路由配置中的部分字段
usePageMeta({
  title: '自定义标题',
  description: '自定义描述',
})
</script>
```

#### 方式三：动态元数据（响应式）

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { usePageMeta } from '@/composables/usePageMeta'

const stockName = ref('')

// 使用函数形式，会自动监听变化
usePageMeta(() => ({
  title: stockName.value ? `${stockName.value} - In Fortune AI` : 'In Fortune AI',
  description: stockName.value ? `查看${stockName.value}的详细信息` : '默认描述',
}))
</script>
```

### 2. 在路由中配置

路由配置文件 `src/router/index.ts` 中定义各路由的元数据：

```typescript
{
  path: '/zixuan',
  name: 'Zixuan',
  component: () => import('@/views/Zixuan.vue'),
  meta: {
    title: '自选分析 - In Fortune AI',
    description: '查看您的自选股票列表，实时监控股票价格变化...',
    keywords: '自选股,持仓分析,股票监控,投资组合,In Fortune AI'
  }
}
```

### 3. 添加新页面元数据

在 `src/config/meta.config.ts` 中添加：

```typescript
export const pageMetaConfig: Record<string, PageMeta> = {
  // 现有配置...

  // 新增页面
  newPage: {
    title: '新页面 - In Fortune AI',
    description: '页面描述...',
    keywords: '关键词1,关键词2',
    openGraph: {
      title: '新页面 - In Fortune AI',
      description: '页面描述...',
      image: '/custom-image.png',
      type: 'website',
    },
  },
}
```

## 环境变量配置

在 `.env` 文件中配置站点 URL：

```env
VITE_SITE_URL=https://your-domain.com
```

## 元数据生成规则

1. **优先级**：组件自定义 > 路由配置 > 全局默认
2. **继承机制**：未配置的字段会从父级继承
3. **动态更新**：使用函数形式的 customMeta 会自动监听变化并更新

## SEO 优化建议

1. 每个页面应该有独特的 title 和 description
2. title 建议 50-60 字符
3. description 建议 150-160 字符
4. 为每个页面准备合适的 OG 图片（推荐 1200x630px）
5. 重要页面使用 canonical 防止重复内容

## 技术实现

- 使用 `@vueuse/head` 进行动态元数据管理
- 通过 Vue Router 的 meta 字段存储配置
- 响应式更新，支持路由切换和动态内容变化
- 支持 Open Graph 和 Twitter Card 协议

## 示例

查看现有页面实现：
- `src/views/Home.vue` - 首页（使用路由默认配置）
- `src/views/StockDetail.vue` - 股票详情页（动态元数据）
