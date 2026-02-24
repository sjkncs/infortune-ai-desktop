# 📊 In Fortune AI - 久经风雨，财智自成

<div align="center">

![In Fortune AI](https://img.shields.io/badge/In Fortune AI-股票分析-blue)
![Vue](https://img.shields.io/badge/Vue-3.4+-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-blue)
![Vite](https://img.shields.io/badge/Vite-5.0+-yellow)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4+-cyan)

**🚀 基于Vue3 + TypeScript构建的现代化股票分析平台**

[在线演示](#) · [功能介绍](#-核心功能) · [快速开始](#-快速开始) · [API文档](#-api文档)

</div>

## 📋 项目简介

In Fortune AI是一款专业的股票分析工具，提供实时股票数据查询、自选持仓分析、指数估值分析等功能。采用现代化的技术栈，为投资者提供全面、准确、及时的市场分析工具。

### ✨ 主要特性

- 🎯 **智能搜索** - 支持股票、基金、指数的模糊查询和实时搜索建议
- 📈 **持仓分析** - 全面的自选持仓分析，包含市场分布、均线数据、实时价格等多维度分析
- 💹 **指数估值** - 国内主要指数的PE/PB估值分位，帮助判断市场位置
- 📊 **K线图表** - 专业的K线图表展示，支持多种时间周期
- 🎨 **现代UI** - 基于TailwindCSS的响应式设计，支持深色主题
- ⚡ **高性能** - 基于Vite的快速开发和构建体验

## 🛠️ 技术栈

### 前端框架
- **Vue 3.4+** - 渐进式JavaScript框架
- **TypeScript 5.3+** - JavaScript的超集，提供静态类型检查
- **Vite 5.0+** - 下一代前端构建工具
- **Vue Router 4.2+** - Vue.js官方路由管理器
- **Pinia 2.1+** - Vue的状态管理库

### UI与样式
- **TailwindCSS 3.4+** - 实用优先的CSS框架
- **PostCSS 8.4+** - CSS转换工具
- **Autoprefixer 10.4+** - CSS前缀自动补全

### 数据可视化
- **ECharts 5.5+** - 企业级数据可视化图表库
- **vue-echarts 6.6+** - Vue.js的ECharts组件封装

### 工具库
- **Axios 1.6+** - HTTP客户端
- **@vueuse/core 10.7+** - Vue组合式API工具集
- **Day.js 1.11+** - 轻量级日期处理库

## 🚀 快速开始

### 环境要求

- Node.js >= 16.0.0
- npm >= 8.0.0 或 yarn >= 1.22.0

### 安装依赖

```bash
# 克隆项目
git clone https://github.com/your-username/infortune-ai.git
cd infortune-ai

# 安装依赖
npm install
```

### 开发环境

```bash
# 启动前端开发服务器
npm run dev

# 启动后端API服务器（需要先启动后端服务）
npm run server

# 同时启动前后端服务
npm run start
```

访问 [http://localhost:5173](http://localhost:5173) 查看应用

### 构建部署

```bash
# 构建生产版本
npm run build

# 预览生产版本
npm run preview
```

## 📁 项目结构

```
infortune-ai/
├── public/                 # 静态资源
│   └── favicon.ico        # 网站图标
├── src/                   # 源代码
│   ├── api/              # API接口
│   │   └── index.ts      # Axios配置
│   ├── components/       # 公共组件
│   │   └── layout/       # 布局组件
│   ├── composables/      # 组合式API
│   │   └── useStockApi.ts # 股票数据API
│   ├── router/           # 路由配置
│   │   └── index.ts      # Vue Router配置
│   ├── styles/           # 样式文件
│   │   └── index.css     # TailwindCSS样式
│   ├── views/            # 页面组件
│   │   ├── Home.vue      # 首页
│   │   ├── Zixuan.vue    # 自选分析
│   │   ├── Zhishu.vue    # 指数分析
│   │   └── StockDetail.vue # 股票详情
│   ├── App.vue           # 根组件
│   ├── main.ts           # 应用入口
│   └── vite-env.d.ts     # Vite类型声明
├── server/               # 后端服务
│   └── index.js         # Express服务器
├── package.json          # 项目配置
├── vite.config.ts       # Vite配置
├── tailwind.config.js   # TailwindCSS配置
├── tsconfig.json        # TypeScript配置
└── README.md           # 项目文档
```

## 🎯 核心功能

### 1. 智能搜索
- 支持股票代码、名称的模糊查询
- 实时搜索建议和自动补全
- 支持股票、基金、指数三种类型切换

### 2. 自选持仓分析
- 多维度持仓数据分析
- 市场分布统计
- 均线数据对比
- 实时价格监控
- 支持数据导出

### 3. 指数估值分析
- 主要指数PE/PB估值分位
- 业绩增长预测
- 投资建议评分
- 跟踪基金推荐

### 4. 股票详情分析
- 实时价格数据
- K线图表展示
- 买卖盘口数据
- 技术指标分析

## 📊 数据接口

### 股票搜索
```typescript
// 搜索股票/基金/指数
GET /api/search?keyword=腾讯&type=stock

// 响应数据
interface StockItem {
  code: string;        // 股票代码
  name: string;        // 股票名称
  type: string;        // 类型
  market: string;      // 市场
  price?: number;      // 当前价格
  change?: number;     // 涨跌幅
}
```

### 自选持仓
```typescript
// 获取自选持仓数据
GET /api/portfolio?market=a-share

// 响应数据
interface PortfolioItem {
  code: string;
  name: string;
  market: string;
  category: string;
  industry: string;
  currentPrice: number;
  prevPrice: number;
  ma5: number;
  ma10: number;
  ma20: number;
  // ... 更多字段
}
```

### 指数估值
```typescript
// 获取指数估值数据
GET /api/valuation

// 响应数据
interface ValuationItem {
  indexCode: string;
  indexName: string;
  pe: number;
  pePercentile: number;
  pb: number;
  pbPercentile: number;
  basicAdvice: string;
  enhancedAdvice: string;
  score: number;
  // ... 更多字段
}
```

## 🎨 UI组件

### 卡片组件
```vue
<div class="card">
  <div class="card-header">
    <h3>标题</h3>
  </div>
  <div class="card-body">
    内容
  </div>
</div>
```

### 按钮组件
```vue
<button class="btn btn-primary">主要按钮</button>
<button class="btn btn-outline">边框按钮</button>
<button class="btn btn-ghost">幽灵按钮</button>
```

### 标签组件
```vue
<span class="tag tag-primary">主要</span>
<span class="tag tag-success">成功</span>
<span class="tag tag-warning">警告</span>
<span class="tag tag-danger">危险</span>
```

## 🔧 配置说明

### Vite配置
```typescript
// vite.config.ts
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
})
```

### TailwindCSS配置
```javascript
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#3b82f6',
        surface: '#1f2937',
        // ... 更多自定义颜色
      }
    }
  }
}
```

## 🚀 部署指南

### Docker部署
```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 5173
CMD ["npm", "run", "preview"]
```

### Nginx配置
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 🤝 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

### 开发规范
- 使用 TypeScript 进行类型检查
- 遵循 Vue 3 组合式API规范
- 使用 TailwindCSS 进行样式开发
- 提交信息遵循 [Conventional Commits](https://conventionalcommits.org/) 规范

## 📝 更新日志

### v1.0.0 (2024-01-27)
- ✨ 初始版本发布
- 🎯 实现股票搜索功能
- 📈 添加自选持仓分析
- 💹 完成指数估值分析
- 🎨 设计响应式UI界面

## 📄 许可证

本项目采用 [MIT](LICENSE) 许可证

## 🙏 致谢

- [Vue.js](https://vuejs.org/) - 渐进式JavaScript框架
- [Vite](https://vitejs.dev/) - 下一代前端构建工具
- [TailwindCSS](https://tailwindcss.com/) - 实用优先的CSS框架
- [ECharts](https://echarts.apache.org/) - 企业级数据可视化图表库

## 📞 联系方式

- 项目主页：[https://github.com/your-username/infortune-ai](https://github.com/your-username/infortune-ai)
- 问题反馈：[Issues](https://github.com/your-username/infortune-ai/issues)
- 邮箱：your-email@example.com

---

<div align="center">

**⭐ 如果这个项目对你有帮助，请给它一个星标！**

Made with ❤️ by [In Fortune AI团队](https://github.com/your-username)

</div>