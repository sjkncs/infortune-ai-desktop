/**
 * 页面元数据类型定义
 */
export interface PageMeta {
  /** 页面标题 */
  title: string
  /** 页面描述 */
  description: string
  /** 页面关键词 */
  keywords?: string
  /** Open Graph 标签 */
  openGraph?: {
    title?: string
    description?: string
    image?: string
    type?: 'website' | 'article' | 'profile'
  }
  /** Twitter Card 标签 */
  twitter?: {
    card?: 'summary' | 'summary_large_image' | 'app' | 'player'
    title?: string
    description?: string
    image?: string
  }
}

/**
 * 网站默认元数据配置
 */
export const defaultSiteMeta = {
  siteName: 'In Fortune AI',
  siteTitle: 'In Fortune AI - 久经风雨，财智自成',
  siteDescription: 'In Fortune AI - 专业的股票分析工具，提供自选持仓分析、指数估值分析、投资详情等功能',
  siteKeywords: '股票分析,基金分析,指数估值,投资建议,In Fortune',
  siteUrl: import.meta.env.VITE_SITE_URL || 'https://InFortune.ai',
  ogImage: '/og-image.png',
  twitterCard: 'summary_large_image' as const,
}

/**
 * 页面元数据默认值
 */
export const defaultPageMeta: Omit<PageMeta, 'title'> = {
  description: defaultSiteMeta.siteDescription,
  keywords: defaultSiteMeta.siteKeywords,
  openGraph: {
    title: defaultSiteMeta.siteTitle,
    description: defaultSiteMeta.siteDescription,
    image: defaultSiteMeta.ogImage,
    type: 'website',
  },
  twitter: {
    card: defaultSiteMeta.twitterCard,
    title: defaultSiteMeta.siteTitle,
    description: defaultSiteMeta.siteDescription,
    image: defaultSiteMeta.ogImage,
  },
}

/**
 * 路由元数据扩展
 */
declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    description?: string
    keywords?: string
    openGraph?: {
      title?: string
      description?: string
      image?: string
      type?: 'website' | 'article' | 'profile'
    }
  }
}
