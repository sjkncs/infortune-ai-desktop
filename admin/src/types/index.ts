// 股票基础数据 - 兼容中英文两种字段名（与 Portfolio 一致）
export interface Stock {
  // 中文字段名
  '股票代码'?: string
  '股票名称'?: string
  '所在市场'?: string
  '股票类别'?: string
  '所属行业'?: string
  '核心主题'?: string
  '投资风格'?: string
  '所属板块'?: string
  '购买渠道'?: string
  '当前实时价'?: string
  '昨日收盘价'?: string
  'MA5'?: string
  'MA10'?: string
  'MA20'?: string
  'MA30'?: string
  'MA50'?: string
  // 英文字段名
  'code'?: string
  'name'?: string
  'market'?: string
  'category'?: string
  'industry'?: string
  'theme'?: string
  'style'?: string
  'sector'?: string
  'channel'?: string
  'currentPrice'?: number | string
  'prevPrice'?: number | string
  'ma5'?: number | string
  'ma10'?: number | string
  'ma20'?: number | string
  'ma30'?: number | string
  'ma50'?: number | string
}

// 自选持仓 - 兼容中英文两种字段名
export interface Portfolio {
  // 中文字段名
  '股票代码'?: string
  '股票名称'?: string
  '所在市场'?: string
  '股票类别'?: string
  '所属行业'?: string
  '核心主题'?: string
  '投资风格'?: string
  '所属板块'?: string
  '购买渠道'?: string
  '是否清仓'?: string
  '当前实时价'?: string
  '昨日收盘价'?: string
  'MA5'?: string
  'MA10'?: string
  'MA20'?: string
  'MA30'?: string
  'MA50'?: string
  // 英文字段名
  'code'?: string
  'name'?: string
  'market'?: string
  'category'?: string
  'industry'?: string
  'theme'?: string
  'style'?: string
  'sector'?: string
  'channel'?: string
  'isLiquidated'?: string
  'currentPrice'?: number | string
  'prevPrice'?: number | string
  'ma5'?: number | string
  'ma10'?: number | string
  'ma20'?: number | string
  'ma30'?: number | string
  'ma50'?: number | string
}

// 指数估值
export interface Valuation {
  '跟踪指数': string
  '指数名称': string
  '指数类别': string
  '当前价格': number | null
  '昨日价格': number | null
  '今年涨跌幅': number | null
  'TTM_PE市盈率': number | null
  'PE百分位_10年': number | null
  'TTM_PB市净率': number | null
  'PB百分位_10年': number | null
  '股息率': number | null
  'ROE盈利能力': number | null
  'Q2营收同比': number | null
  'Q2净利润同比': number | null
  '未来2年营收复合增长率': number | null
  '未来2年净利润复合增长率': number | null
  '跟踪的指数基金': string
}

// API 响应
export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  updateTime?: string
}

// 导航菜单
export interface NavItem {
  name: string
  path: string
  icon: string
  label: string
}

// 用户
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

// 服务信息
export interface ServiceInfo {
  id: string
  name: string
  description: string
  port: number
  directory: string
  startCommand: string
  startArgs: string[]
  healthEndpoint: string
  type: 'python' | 'node'
  status: 'running' | 'stopped' | 'error' | 'starting'
  url?: string
  pid?: number | null
  error?: string
}
