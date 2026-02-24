import type { PageMeta } from '@/types/meta'
import { defaultPageMeta, defaultSiteMeta } from '@/types/meta'

/**
 * 各页面元数据配置
 */
export const pageMetaConfig: Record<string, PageMeta> = {
  // 首页
  home: {
    title: defaultSiteMeta.siteTitle,
    description: defaultSiteMeta.siteDescription,
    keywords: defaultSiteMeta.siteKeywords,
    openGraph: {
      title: defaultSiteMeta.siteTitle,
      description: defaultSiteMeta.siteDescription,
      image: defaultSiteMeta.ogImage,
      type: 'website',
    },
  },

  // 自选分析
  zixuan: {
    title: '自选分析 - In Fortune AI',
    description: '查看您的自选股票列表，实时监控股票价格变化，智能分析持仓表现，提供个性化的投资建议',
    keywords: '自选股,持仓分析,股票监控,投资组合,In Fortune AI',
    openGraph: {
      title: '自选分析 - In Fortune AI',
      description: '查看您的自选股票列表，实时监控股票价格变化，智能分析持仓表现',
      type: 'website',
    },
  },

  // 指数分析
  zhishu: {
    title: '指数分析 - In Fortune AI',
    description: '全面分析各大指数估值水平，包括PE、PB、股息率等关键指标，帮助您判断市场投资价值',
    keywords: '指数估值,PE分析,PB分析,股息率,市场估值,In Fortune AI',
    openGraph: {
      title: '指数分析 - In Fortune AI',
      description: '全面分析各大指数估值水平，包括PE、PB、股息率等关键指标',
      type: 'website',
    },
  },

  // 股票详情
  stockDetail: {
    title: '投资详情 - In Fortune AI',
    description: '查看股票的K线图表、买卖盘口、投资建议等详细分析，助您做出明智的投资决策',
    keywords: '股票详情,K线图,买卖盘口,投资建议,技术分析,In Fortune AI',
    openGraph: {
      title: '投资详情 - In Fortune AI',
      description: '查看股票的K线图表、买卖盘口、投资建议等详细分析',
      type: 'article',
    },
  },
}

/**
 * 根据路由名称获取页面元数据
 */
export function getPageMetaByRoute(routeName: string): PageMeta {
  const config = pageMetaConfig[routeName]
  if (!config) {
    return {
      title: defaultSiteMeta.siteTitle,
      ...defaultPageMeta,
    }
  }

  return {
    title: config.title,
    description: config.description || defaultPageMeta.description,
    keywords: config.keywords || defaultPageMeta.keywords,
    openGraph: {
      ...defaultPageMeta.openGraph,
      ...config.openGraph,
    },
    twitter: {
      ...defaultPageMeta.twitter,
      title: config.openGraph?.title || config.title,
      description: config.openGraph?.description || config.description,
      image: config.openGraph?.image,
    },
  }
}

/**
 * 根据股票代码生成动态元数据
 */
export function getStockDetailMeta(stockCode: string, stockName?: string): PageMeta {
  const displayName = stockName || stockCode
  return {
    title: `${displayName}(${stockCode}) - In Fortune AI`,
    description: `查看${displayName}(${stockCode})的K线图表、买卖盘口、投资建议等详细分析，实时掌握股票动态`,
    keywords: `${stockCode},${displayName},股票详情,K线图,投资建议,In Fortune AI`,
    openGraph: {
      title: `${displayName}(${stockCode}) - In Fortune AI`,
      description: `查看${displayName}(${stockCode})的K线图表、买卖盘口、投资建议等详细分析`,
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${displayName}(${stockCode}) - In Fortune AI`,
      description: `查看${displayName}(${stockCode})的K线图表、买卖盘口、投资建议等详细分析`,
    },
  }
}
