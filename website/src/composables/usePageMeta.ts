import { useHead } from '@vueuse/head'
import { watch } from 'vue'
import { useRoute } from 'vue-router'
import type { PageMeta } from '@/types/meta'
import { defaultSiteMeta, defaultPageMeta } from '@/types/meta'

/**
 * 页面元数据管理 Composable
 */
export function usePageMeta(customMeta?: Partial<PageMeta> | (() => Partial<PageMeta>)) {
  const route = useRoute()

  /**
   * 获取当前页面的完整元数据
   */
  const getFullMeta = (): PageMeta => {
    // 从路由配置获取基础元数据
    const routeMeta = {
      title: route.meta.title as string || defaultSiteMeta.siteTitle,
      description: route.meta.description as string || defaultPageMeta.description,
      keywords: route.meta.keywords as string || defaultPageMeta.keywords,
      openGraph: route.meta.openGraph,
    }

    // 合并自定义元数据
    const metaFromCustom = typeof customMeta === 'function' ? customMeta() : customMeta

    // 自定义元数据优先级最高，会覆盖其他元数据
    return {
      title: metaFromCustom?.title || routeMeta.title,
      description: metaFromCustom?.description || routeMeta.description,
      keywords: metaFromCustom?.keywords || routeMeta.keywords,
      openGraph: {
        ...routeMeta.openGraph,
        ...metaFromCustom?.openGraph,
        image: metaFromCustom?.openGraph?.image || routeMeta.openGraph?.image,
        type: metaFromCustom?.openGraph?.type || routeMeta.openGraph?.type || 'website',
      },
      twitter: {
        ...routeMeta.twitter,
        ...metaFromCustom?.twitter,
        card: metaFromCustom?.twitter?.card || routeMeta.twitter?.card || 'summary_large_image',
        image: metaFromCustom?.twitter?.image || metaFromCustom?.openGraph?.image || routeMeta.twitter?.image,
      },
    }
  }

  /**
   * 设置页面元数据
   */
  const setMeta = (meta: PageMeta) => {
    const title = meta.title || defaultSiteMeta.siteTitle
    const description = meta.description || defaultPageMeta.description
    const keywords = meta.keywords || defaultPageMeta.keywords
    const og = meta.openGraph || {}
    const twitter = meta.twitter || {}
    const currentUrl = window.location.href

    console.log('设置页面元数据:', { title, description, keywords })

    useHead({
      title,
      meta: [
        // 基础 SEO 标签
        { name: 'description', content: description },
        { name: 'keywords', content: keywords },

        // Open Graph 标签
        { property: 'og:title', content: og.title || title },
        { property: 'og:description', content: og.description || description },
        { property: 'og:type', content: og.type || 'website' },
        { property: 'og:url', content: currentUrl },
        { property: 'og:image', content: og.image || defaultSiteMeta.ogImage },
        { property: 'og:site_name', content: defaultSiteMeta.siteName },

        // Twitter Card 标签
        { name: 'twitter:card', content: twitter.card || 'summary_large_image' },
        { name: 'twitter:title', content: twitter.title || og.title || title },
        { name: 'twitter:description', content: twitter.description || og.description || description },
        { name: 'twitter:image', content: twitter.image || og.image || defaultSiteMeta.ogImage },

        // 其他标签
        { name: 'author', content: defaultSiteMeta.siteName },
      ],
      link: [
        {
          rel: 'canonical',
          href: currentUrl,
        },
      ],
    })
  }

  /**
   * 初始化元数据
   */
  const initMeta = () => {
    const meta = getFullMeta()
    setMeta(meta)
  }

  // 立即初始化
  initMeta()

  // 如果 customMeta 是函数（响应式的），监听变化
  if (typeof customMeta === 'function') {
    watch(
      () => customMeta(),
      (newMeta) => {
        console.log('自定义元数据变化:', newMeta)
        initMeta()
      },
      { deep: true }
    )
  }

  return {
    setMeta,
    initMeta,
  }
}

/**
 * 简化版：仅更新页面标题和描述
 */
export function useSimplePageMeta(title: string, description?: string) {
  return usePageMeta({ title, description })
}
