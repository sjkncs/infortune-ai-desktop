<div align="center">

![Header](https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=12,14,18,20,24&height=300&section=header&text=In Fortune AI%20Desktop&fontSize=70&fontAlignY=35&desc=Professional%20Stock%20Analysis%20%26%20AI%20Assistant&descSize=25&descAlignY=55&animation=twinkling)

<p align="center">
  <strong>🌟 久经风雨，财智自成 | Mathematics is the language of nature 🌟</strong>
</p>

<p align="center">
  <a href="#-项目简介">项目简介</a> •
  <a href="#-核心功能">核心功能</a> •
  <a href="#-desktop-app">桌面应用</a> •
  <a href="#-技术架构">技术架构</a> •
  <a href="#-快速开始">快速开始</a> •
  <a href="#-api文档">API文档</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Vue-3.4+-42b883?style=for-the-badge&logo=vue.js&logoColor=white" alt="Vue">
  <img src="https://img.shields.io/badge/TypeScript-5.3+-3178c6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Electron-Latest-47848f?style=for-the-badge&logo=electron&logoColor=white" alt="Electron">
  <img src="https://img.shields.io/badge/Python-3.11+-3776ab?style=for-the-badge&logo=python&logoColor=white" alt="Python">
  <img src="https://img.shields.io/badge/FastAPI-0.104+-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI">
</p>

<p align="center">
  <img src="https://img.shields.io/badge/AI-Powered-FF6B6B?style=for-the-badge" alt="AI">
  <img src="https://img.shields.io/badge/Stock-Analysis-4ECDC4?style=for-the-badge" alt="Stock">
  <img src="https://img.shields.io/badge/Desktop-App-95E1D3?style=for-the-badge" alt="Desktop">
</p>

</div>

---

## 📖 项目简介

**In Fortune AI Desktop** 是一款专业的**AI驱动股票分析系统**，包含**Web端**和**桌面客户端**两个版本。本项目基于 [@QoneFeng](https://github.com/QoneFeng) 的优秀开源项目 [InFortune.ai](https://github.com/QoneFeng/InFortune.ai) 进行深度扩展，新增了功能完整的 **Electron 桌面应用**，提供更加原生、流畅的用户体验。

### 🎯 项目愿景

> **久经风雨，财智自成** - 为投资者提供全面、准确、智能的市场分析工具

### ✨ 核心亮点

- 🖥️ **跨平台桌面应用** - 基于Electron的原生体验
- 🤖 **AI智能分析** - 深度学习驱动的股票分析
- 📊 **多市场支持** - A股、港股、美股全覆盖
- 💼 **智能组合管理** - 自动化投资组合优化
- 📈 **实时行情追踪** - 毫秒级数据更新
- 🎨 **现代化UI** - 优雅、直观的界面设计
- 🔧 **高度可定制** - 丰富的个性化设置

---

## 🙏 致谢原作者

本项目基于 [@QoneFeng](https://github.com/QoneFeng) 的原创项目 **[InFortune.ai](https://github.com/QoneFeng/InFortune.ai)** 进行扩展开发。

### 原项目核心功能

原作者 QoneFeng 构建了一个完整的全栈股票分析系统，包括：

#### 🌐 Web端功能
- 📊 **多市场实时行情** - A股、港股、美股、场外基金、ETF实时数据
- 💼 **智能持仓管理** - 自选持仓分析，市场分布、行业分类、多维度筛选
- 📈 **技术分析工具** - MA5/10/20/30/50均线、K线图表、涨跌幅分析
- 🔍 **智能搜索系统** - 股票代码、名称模糊查询，实时搜索建议
- 💹 **指数估值分析** - PE/PB估值分位、业绩预测、投资建议评分
- 🎛️ **管理后台** - 股票/持仓/估值数据的增删改查管理
- 📱 **响应式设计** - 现代化UI，支持桌面端和移动端
- 🚀 **多数据源容错** - 东方财富/新浪财经/腾讯财经自动切换
- 📤 **数据导出** - 支持Excel导出持仓数据

#### 🏗️ 技术架构
- **前端**: Vue 3 + TypeScript + Vite + TailwindCSS
- **后端**: Node.js + Express + LowDB
- **数据服务**: Python + FastAPI + AKShare + BaoStock
- **可视化**: ECharts 5.5+

**感谢 QoneFeng 的杰出工作，为本项目奠定了坚实的基础！** 🎉

---

## 🖥️ Desktop App - 全新桌面应用

在原项目基础上，我们开发了功能完整的 **Electron 桌面客户端**，提供更加原生、高效的用户体验。

### 🎨 桌面应用特性

#### ✅ 核心功能模块

##### 1. **智能分析 (AI Chat)**
<div align="center">

| 功能 | 说明 |
|:----:|:-----|
| 🤖 **AI对话分析** | 自然语言交互，智能理解投资意图 |
| 💬 **多轮对话** | 支持上下文理解，连续深度分析 |
| 📝 **历史记录** | 自动保存对话，便于回顾查阅 |
| 🎯 **快捷功能** | 6大快捷卡片：市场概览、股票查询、技术分析、新闻舆情、AI预测、风险评估 |
| 📊 **技术标签** | 8种技术指标：MACD、KDJ、均线系统、成交量、布林带、RSI、支撑位、压力位 |

</div>

##### 2. **市场行情 (Market View)**
<div align="center">

| 指数 | 功能特点 |
|:----:|:--------|
| 📈 **上证指数** | 实时价格、涨跌幅、成交量 |
| 📊 **深证成指** | 市场动态、资金流向 |
| 🚀 **创业板指** | 技术走势、板块热度 |
| 💹 **沪深300** | 估值分析、投资建议 |

**自动刷新**: 支持 5/10/30/60/300 秒可选间隔

</div>

##### 3. **个股分析 (Stock Analysis)**
- 🔍 **智能搜索** - 支持股票代码、名称模糊搜索
- ⚡ **快速查询** - Enter键 / 搜索按钮触发
- 🎯 **自动分析** - 搜索后自动切换到AI分析视图
- 📊 **多维数据** - 基本面、技术面、最新动态一网打尽

##### 4. **投资组合 (Portfolio)**
- 💼 持仓管理（待集成后端API）
- 📊 收益统计
- 🎯 资产配置建议

##### 5. **策略回测 (Strategy Backtest)**
- 💡 策略设计工具（待集成）
- 📈 历史数据回测
- 📊 性能指标评估

---

### ⚙️ 设置系统 (Settings)

桌面应用提供了**功能完整、美观统一的设置界面**：

<div align="center">

#### 🎛️ 8大设置模块

| 模块 | 功能说明 |
|:----:|:--------|
| 🔧 **通用设置** | 启动选项、托盘设置、历史记录管理 |
| 🎨 **外观设置** | 主题模式(浅色/深色/自动)、6种主题色、字体大小、输入框高度、行间距、侧边栏宽度、动画效果 |
| 🌍 **语言设置** | 简体中文/繁體中文/English/日本語、自动翻译 |
| 📡 **数据源设置** | API服务器配置、刷新频率(5/10/30/60/300秒)、实时数据开关 |
| 🔔 **通知设置** | 桌面通知、声音提示、价格预警 |
| ⌨️ **快捷键设置** | 全局快捷键配置、自定义按键绑定 |
| 🔬 **高级设置** | 开发者模式、硬件加速、缓存清理、数据导出 |
| ℹ️ **关于** | 应用信息、版本号、官网链接、文档链接、GitHub链接 |

</div>

#### 🎨 外观定制

<div align="center">

| 设置项 | 可选范围 |
|:------:|:--------|
| 🎨 **主题色** | 蓝色、紫色、绿色、橙色、红色、粉色 + 自定义颜色 |
| 📏 **字体大小** | 12px - 20px（滑块调节） |
| 📝 **输入框高度** | 60px - 200px（滑块调节） |
| 📊 **行间距** | 紧凑(1.4) / 标准(1.6) / 舒适(1.8) / 宽松(2.0) |
| 📐 **侧边栏宽度** | 200px - 400px（滑块调节） |
| ✨ **动画效果** | 开启 / 关闭 |

</div>

---

### 🔄 路由系统

桌面应用实现了**完整的功能路由**，共 **47个路由节点**：

<details>
<summary><b>📋 点击查看完整路由列表</b></summary>

#### 主导航路由 (5个)
- `chat` - 智能分析
- `market` - 市场行情
- `stock` - 个股分析
- `portfolio` - 投资组合
- `strategy` - 策略回测

#### 快捷功能路由 (6个)
- 市场概览
- 股票查询
- 技术分析
- 新闻舆情
- AI预测
- 风险评估

#### 技术指标路由 (8个)
- MACD分析
- KDJ指标
- 均线系统
- 成交量分析
- 布林带
- RSI强弱
- 支撑位
- 压力位

#### 工具栏路由 (3个)
- 实时数据
- 技术指标
- 相关新闻

#### 设置页面路由 (8个)
- 通用、外观、语言、数据源、通知、快捷键、高级、关于

#### 其他功能路由 (17个)
- 对话管理、消息发送、股票搜索、数据刷新等

</details>

---

### 🛠️ 桌面应用技术栈

<div align="center">

| 技术 | 版本 | 用途 |
|:----:|:----:|:-----|
| **Electron** | Latest | 跨平台桌面应用框架 |
| **HTML5** | - | 界面结构 |
| **CSS3** | - | 样式设计（使用CSS变量主题系统） |
| **JavaScript** | ES6+ | 业务逻辑 |
| **LocalStorage** | - | 本地数据存储 |
| **IPC通信** | - | 主进程与渲染进程通信 |

</div>

---

### 📦 桌面应用文件结构

```
desktop-app/
├── 📄 main.js                    # Electron主进程
├── 📄 preload.js                 # 预加载脚本
├── 📄 package.json               # 依赖配置
├── 📄 index.html                 # 主窗口页面
├── 📄 settings.html              # 设置窗口页面
├── 📄 installer.nsh              # NSIS安装脚本
│
├── 📁 scripts/                   # JavaScript模块
│   ├── app.js                    # 主应用逻辑
│   ├── api.js                    # API接口封装
│   └── settings.js               # 设置页面逻辑
│
├── 📁 styles/                    # 样式文件
│   ├── main.css                  # 主样式
│   ├── views.css                 # 视图样式
│   └── settings.css              # 设置页面样式
│
├── 📁 assets/                    # 资源文件
│   ├── icon.ico                  # Windows图标
│   ├── icon.png                  # macOS/Linux图标
│   └── tray-icon.png             # 托盘图标
│
└── 📄 QUICK_START_DESKTOP.md     # 桌面应用快速开始指南
```

---

### 🚀 桌面应用启动

#### 开发模式

```bash
cd desktop-app
npm install
npm start
```

#### 打包发布

```bash
# Windows
npm run build:win

# macOS
npm run build:mac

# Linux
npm run build:linux

# 全平台
npm run build:all
```

#### 安装包位置

打包完成后，安装包位于 `desktop-app/dist/` 目录：
- Windows: `infortune-ai-Setup-1.0.0.exe`
- macOS: `infortune-ai-1.0.0.dmg`
- Linux: `infortune-ai-1.0.0.AppImage`

---

### 📸 桌面应用界面预览

<div align="center">

#### 🎨 主界面 - 智能分析
- 💬 AI对话窗口
- 🎯 6大快捷功能卡片
- 🏷️ 8种技术指标标签
- 📝 历史记录管理

#### 📊 市场行情视图
- 📈 四大主要指数实时展示
- 🔄 自动刷新（5/10/30/60/300秒可选）
- 📊 涨跌幅动态显示
- 💰 成交额统计

#### ⚙️ 设置界面
- 🎨 8大设置模块
- 🌈 6种预设主题色
- 🌓 深色/浅色模式切换
- 📏 界面布局自定义

> 💡 **提示**: 实际截图将在后续版本中添加

</div>

---

## 🏗️ Web端技术架构

### 整体架构

<div align="center">

| 层级 | 技术栈 | 端口 | 功能描述 |
|:----:|:------:|:----:|:--------|
| **Desktop App** | Electron + HTML/CSS/JS | - | 原生桌面应用 |
| **用户前端** | Vue 3 + TypeScript + Vite | 5173 | Web界面 |
| **管理后台** | Vue 3 + TypeScript + Vite | 5174 | 数据管理 |
| **Node.js 后端** | Express + LowDB | 3001 | API服务 |
| **Python 数据服务** | FastAPI + AKShare | 8000 | 实时行情 |
| **Python 财务服务** | FastAPI + BaoStock | 8001 | 财务数据 |

</div>

### 前端技术栈

<div align="center">

| 技术 | 版本 | 用途 |
|:----:|:----:|:-----|
| **Vue** | 3.4+ | 渐进式JavaScript框架 |
| **TypeScript** | 5.3+ | 静态类型检查 |
| **Vite** | 5.0+ | 下一代构建工具 |
| **TailwindCSS** | 3.4+ | 实用优先CSS框架 |
| **Vue Router** | 4.2+ | 官方路由管理器 |
| **Pinia** | 2.1+ | 新一代状态管理 |
| **ECharts** | 5.5+ | 强大的数据可视化库 |
| **Axios** | 1.6+ | Promise based HTTP客户端 |
| **Day.js** | 1.11+ | 轻量级日期处理库 |
| **XLSX** | 0.18+ | Excel数据处理 |

</div>

---

## 🚀 快速开始

### 环境要求

- **Node.js** >= 18.0.0
- **Python** >= 3.11
- **npm** >= 9.0.0

### 1. 克隆项目

```bash
git clone https://github.com/sjkncs/InFortune.ai-desktop.git
cd InFortune.ai-desktop
```

### 2. 启动桌面应用

```bash
cd desktop-app
npm install
npm start
```

### 3. 启动Web端（可选）

#### 安装依赖

```bash
# 用户前端
cd website
npm install

# 管理后台
cd ../admin
npm install

# Python数据服务
cd ../akshare
pip install -r requirements.txt

cd ../baostock
pip install -r requirements.txt
```

#### 启动服务

需要在不同终端中启动以下服务：

```bash
# 终端 1 - AKShare数据服务
cd akshare
python start.py
# http://localhost:8000

# 终端 2 - BaoStock数据服务
cd baostock
python start.py
# http://localhost:8001

# 终端 3 - Node.js后端
cd website
npm run server
# http://localhost:3001

# 终端 4 - 用户前端
cd website
npm run dev
# http://localhost:5173

# 终端 5 - 管理后台
cd admin
npm run dev
# http://localhost:5174
```

---

## 📚 API文档

### 服务端口说明

<div align="center">

| 服务 | 端口 | 文档 |
|:----:|:----:|:----:|
| Desktop App | - | [QUICK_START_DESKTOP.md](desktop-app/QUICK_START_DESKTOP.md) |
| 用户前端 | 5173 | - |
| 管理后台 | 5174 | - |
| Node.js后端 | 3001 | - |
| AKShare服务 | 8000 | http://localhost:8000/docs |
| BaoStock服务 | 8001 | http://localhost:8001/docs |

</div>

### 主要API接口

<details>
<summary><b>📋 Node.js API (端口: 3001)</b></summary>

| 接口 | 方法 | 说明 |
|:-----|:----:|:-----|
| `/api/search` | GET | 搜索股票（代码/名称模糊查询） |
| `/api/stocks` | GET | 获取股票列表（含实时价格和MA数据） |
| `/api/portfolio` | GET | 获取自选持仓（含实时价格和MA数据） |
| `/api/save-portfolio` | POST | 保存持仓数据 |
| `/api/save-stocks` | POST | 保存股票列表 |
| `/api/valuation` | GET | 获取指数估值（PE/PB估值分位） |
| `/api/stock/:code` | GET | 获取股票详情（盘口、市值、估值指标） |
| `/api/stock/:code/kline` | GET | 获取K线数据（支持多周期） |
| `/api/etf` | GET | 获取ETF列表（含实时行情） |
| `/api/health` | GET | 健康检查 |

</details>

<details>
<summary><b>📊 AKShare API (端口: 8000)</b></summary>

#### A股数据

| 接口 | 说明 |
|:-----|:-----|
| `/api/a/stock/realtime/{symbol}` | A股实时行情 |
| `/api/a/stock/history/{symbol}` | A股历史K线 |
| `/api/a/stock/list` | A股股票列表 |
| `/api/a/stock/search` | A股股票搜索 |

#### 多市场支持

- 港股: `/api/hk/stock/*`
- 美股: `/api/us/stock/*`
- ETF: `/api/etf/*`
- 指数: `/api/index/*`

</details>

<details>
<summary><b>💰 BaoStock API (端口: 8001)</b></summary>

#### 财务数据（2007年至今）

| 接口 | 说明 |
|:-----|:-----|
| `/api/finance/profit/{code}` | 盈利能力（ROE、净利率、毛利率） |
| `/api/finance/operation/{code}` | 营运能力（周转率） |
| `/api/finance/growth/{code}` | 成长能力（增长率） |
| `/api/finance/balance/{code}` | 偿债能力（流动比率、资产负债率） |
| `/api/finance/cash-flow/{code}` | 现金流量 |
| `/api/finance/dupont/{code}` | 杜邦指数 |

#### 宏观经济数据

| 接口 | 说明 |
|:-----|:-----|
| `/api/macro/deposit-rate` | 存款利率 |
| `/api/macro/loan-rate` | 贷款利率 |
| `/api/macro/required-reserve-ratio` | 存款准备金率 |
| `/api/macro/money-supply` | 货币供应量 |

</details>

---

## 📁 完整项目结构

```
InFortune.ai-desktop/
├── 📁 desktop-app/              # 🆕 Electron桌面应用
│   ├── main.js
│   ├── index.html
│   ├── settings.html
│   ├── 📁 scripts/
│   ├── 📁 styles/
│   ├── 📁 assets/
│   ├── package.json
│   └── QUICK_START_DESKTOP.md
│
├── 📁 website/                  # 用户前端 + Node.js后端
│   ├── 📁 src/                  # Vue前端源码
│   │   ├── 📁 api/
│   │   ├── 📁 components/
│   │   ├── 📁 views/
│   │   │   ├── Home.vue
│   │   │   ├── Zixuan.vue
│   │   │   ├── QuotationCenter.vue
│   │   │   ├── Zhishu.vue
│   │   │   └── StockDetail.vue
│   │   ├── 📁 router/
│   │   ├── 📁 types/
│   │   └── main.ts
│   ├── 📁 server/               # Node.js后端
│   │   ├── index.js
│   │   ├── stock-service.js
│   │   ├── akshare-service.js
│   │   └── 📁 data/
│   │       └── db.json
│   ├── package.json
│   └── vite.config.ts
│
├── 📁 admin/                    # 管理后台
│   ├── 📁 src/
│   │   ├── 📁 views/
│   │   │   ├── Dashboard.vue
│   │   │   ├── StockManage.vue
│   │   │   ├── PortfolioManage.vue
│   │   │   └── ValuationManage.vue
│   │   └── main.ts
│   └── package.json
│
├── 📁 akshare/                  # AKShare Python数据服务
│   ├── app.py
│   ├── start.py
│   ├── requirements.txt
│   └── README.md
│
├── 📁 baostock/                 # BaoStock Python数据服务
│   ├── app.py
│   ├── start.py
│   ├── requirements.txt
│   └── README.md
│
├── 📁 data/                     # 数据目录
├── 📁 logs/                     # 日志目录
├── .gitignore
└── README.md                    # 本文件
```

---

## 🎯 核心功能对比

<div align="center">

| 功能 | Web端 | Desktop App | 说明 |
|:----:|:----:|:-----------:|:-----|
| 📊 实时行情 | ✅ | ✅ | 多市场实时数据 |
| 💼 持仓管理 | ✅ | ⏳ | 桌面版待集成后端 |
| 📈 技术分析 | ✅ | ✅ | K线、指标分析 |
| 🔍 智能搜索 | ✅ | ✅ | 模糊查询、实时建议 |
| 💹 指数估值 | ✅ | ⏳ | PE/PB分位分析 |
| 🎛️ 管理后台 | ✅ | ❌ | Web专属功能 |
| 🤖 AI对话 | ⏳ | ✅ | **桌面版独有** |
| 🎨 主题定制 | ⏳ | ✅ | **桌面版独有** |
| 📱 托盘功能 | ❌ | ✅ | **桌面版独有** |
| 🔔 桌面通知 | ❌ | ✅ | **桌面版独有** |
| ⌨️ 快捷键 | ❌ | ✅ | **桌面版独有** |

</div>

---

## 📝 更新日志

### v2.0.0 (2024-02) - 桌面应用版本 🎉

#### 🆕 新增功能
- ✨ **Electron桌面应用** - 完整的跨平台桌面客户端
- 🤖 **AI智能对话** - 自然语言股票分析助手
- 🎨 **设置系统** - 8大设置模块，高度可定制
- 🎯 **快捷功能** - 6大快捷卡片 + 8种技术指标标签
- 📊 **市场行情视图** - 四大指数实时监控
- 🔍 **智能股票搜索** - 快速查询并自动分析
- 🔄 **自动数据刷新** - 可配置刷新间隔
- 💾 **本地数据存储** - LocalStorage持久化
- 📱 **系统托盘** - 最小化到托盘（规划中）
- 🔔 **桌面通知** - 价格预警提醒（规划中）

#### 🎨 界面改进
- 现代化渐变色设计
- 6种预设主题色 + 自定义颜色
- 深色/浅色/自动主题切换
- 流畅的过渡动画效果
- 响应式布局设计

#### 📚 文档完善
- 桌面应用快速开始指南
- 完整的功能路由文档
- 详细的API接口说明

### v1.1.0 (2024-01) - 原项目版本

- ✨ 新增管理后台
- 🎛️ 股票/持仓/估值数据管理功能
- 🔧 页面元数据配置功能

### v1.0.0 (2023-12) - 原项目初始版本

- 📊 自选持仓管理
- 📈 实时行情展示
- 💹 指数估值分析
- 🔍 智能搜索功能
- 🐍 集成AKShare + BaoStock

---

## 🛠️ 开发指南

### 环境变量配置

创建 `.env` 文件：

```env
# Node.js后端端口
API_PORT=3001
FRONTEND_PORT=5173
ADMIN_PORT=5174

# Python数据服务URL
PYTHON_API_URL=http://localhost:8000
BAOSTOCK_API_URL=http://localhost:8001
```

### 数据库说明

项目使用 **LowDB** (JSON文件存储)：

- `website/server/data/db.json` - 主数据库
  - `stocks` - 股票列表
  - `portfolio` - 自选持仓
  - `valuation` - 指数估值
  - `etfs` - ETF列表

### 脚本命令

```bash
# 桌面应用
cd desktop-app
npm run start         # 开发模式
npm run build:win     # Windows打包
npm run build:mac     # macOS打包
npm run build:linux   # Linux打包

# 用户前端
cd website
npm run dev           # 启动开发服务器
npm run server        # 启动Node后端
npm run build         # 构建生产版本

# 管理后台
cd admin
npm run dev           # 启动开发服务器
npm run build         # 构建生产版本
```

---

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

---

## 📄 开源协议

本项目基于 [MIT](LICENSE) 协议开源。

---

## 🙏 特别致谢

### 原作者
- 👨‍💻 [@QoneFeng](https://github.com/QoneFeng) - 感谢提供优秀的基础项目 [InFortune.ai](https://github.com/QoneFeng/InFortune.ai)

### 技术栈
- [Electron](https://www.electronjs.org/) - 跨平台桌面应用框架
- [Vue.js](https://vuejs.org/) - 渐进式JavaScript框架
- [AKShare](https://www.akshare.xyz/) - 专业财经数据接口
- [BaoStock](http://www.baostock.com) - 免费股票数据接口
- [FastAPI](https://fastapi.tiangolo.com/) - 现代Python Web框架
- [Tailwind CSS](https://tailwindcss.com/) - 实用优先CSS框架
- [ECharts](https://echarts.apache.org/) - 强大的数据可视化库

---

## 📚 文档中心

完整的项目文档已整理到 **[docs/](docs/)** 目录，包含20份详细文档：

### 📖 核心文档

- **[文档索引 INDEX.md](docs/INDEX.md)** - 完整的文档导航和查找指南
- **[快速开始 QUICK_START_DESKTOP.md](docs/QUICK_START_DESKTOP.md)** - 桌面应用快速入门
- **[Release发布指南 RELEASE_GUIDE.md](docs/RELEASE_GUIDE.md)** - GitHub Release完整流程

### 🎯 按需查找

| 需求 | 推荐文档 |
|------|----------|
| **使用应用** | [快速开始](docs/QUICK_START_DESKTOP.md) · [测试指南](docs/QUICK_TEST_GUIDE.md) · [API配置](docs/API_CONFIGURATION_GUIDE.md) |
| **开发贡献** | [实现报告](docs/FINAL_IMPLEMENTATION_REPORT.md) · [构建指南](docs/BUILD_DESKTOP_APP.md) · [打包教程](docs/HOW_TO_BUILD.md) |
| **项目发布** | [Release指南](docs/RELEASE_GUIDE.md) · [检查清单](docs/FINAL_RELEASE_CHECKLIST.md) · [发布说明](docs/RELEASE_NOTES_v1.0.0.md) |
| **功能了解** | [功能报告](docs/FEATURE_COMPLETENESS_REPORT.md) · [策略回测](docs/STRATEGY_BACKTEST_COMPLETE.md) · [API总结](docs/API_IMPLEMENTATION_SUMMARY.md) |

**查看完整文档**: [docs/INDEX.md](docs/INDEX.md) 📚

---

## 📞 联系方式

- **GitHub**: [@sjkncs](https://github.com/sjkncs)
- **Email**: shiawasong@gmail.com
- **Website**: https://sjkncs.github.io/navi-hawa-blog/

---

<div align="center">

![Footer](https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=12,14,18,20,24&height=150&section=footer)

<p>
  <strong>Made with ❤️ by Yangting SONG (sjkncs)</strong>
</p>

<p>
  <strong>久经风雨，财智自成 | Mathematics is the language of nature</strong>
</p>

<p>
  <img src="https://img.shields.io/badge/⭐-Star%20on%20GitHub-yellow?style=for-the-badge" alt="Star">
  <img src="https://img.shields.io/badge/🔔-Watch%20Updates-blue?style=for-the-badge" alt="Watch">
  <img src="https://img.shields.io/badge/🍴-Fork%20&%20Contribute-green?style=for-the-badge" alt="Fork">
</p>

</div>
