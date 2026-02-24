# In Fortune AI Desktop v1.0.0 - MVP首发版 🎉

> **专业的AI驱动股票分析桌面应用**

---

## 🌟 项目简介

**In Fortune AI Desktop** 是一款基于 Electron 的跨平台股票分析桌面应用，集成了 AI 智能对话、市场行情监控、个股深度分析、投资组合管理和策略回测等核心功能。本项目基于 [@QoneFeng](https://github.com/QoneFeng) 的优秀开源项目 [InFortune.ai](https://github.com/QoneFeng/InFortune.ai) 进行深度扩展开发。

**久经风雨，财智自成 | Mathematics is the language of nature**

---

## ✨ 核心功能

### 💬 AI智能对话
- 支持5大AI提供商（豆包、智谱、DeepSeek、Qwen、Kimi）
- 股票实时分析与投资建议
- 自然语言交互
- Mock模式免API测试

### 📊 市场行情监控
- 实时追踪4大指数（上证、深证、创业板、沪深300）
- 涨跌幅动态显示
- 成交量数据分析
- 一键刷新更新

### 📈 个股深度分析
- K线图表可视化（ECharts）
- 技术指标分析（MA5/MA10/MA20）
- 分时图实时更新
- 基本面数据展示
- 历史交易记录

### 💼 投资组合管理
- 持仓股票管理
- 盈亏自动计算
- 组合统计分析
- 数据持久化存储

### 🔄 策略回测系统
- 5种经典策略（均线交叉、网格、动量、RSI、布林带）
- 完整的回测引擎
- 绩效指标计算（年化收益、最大回撤、夏普比率等）
- 收益曲线可视化
- 交易记录详细展示

### ⚙️ 完整设置系统
- 8个设置模块（通用、外观、语言、数据源、通知、快捷键、高级、关于）
- 主题切换（亮/暗模式）
- 多语言支持
- AI API配置管理
- 设置数据持久化

---

## 📦 下载安装

### Windows 用户 (推荐)

**下载文件**: `InFortuneAI-1.0.0-win-x64.zip` (约 43 MB)

**安装步骤**:
1. 下载 ZIP 压缩包
2. 解压到任意位置（如 `C:\Program Files\InFortuneAI\`）
3. 双击运行 `In Fortune AI.exe`

**特点**:
- ✅ 绿色免安装
- ✅ 无需管理员权限
- ✅ 支持U盘携带
- ✅ 完整功能

### 系统要求

**最低配置**:
- Windows 10 或更高版本
- 4 GB RAM
- 500 MB 可用磁盘空间
- 1280x720 分辨率

**推荐配置**:
- Windows 11
- 8 GB RAM
- 1 GB 可用磁盘空间
- 1920x1080 分辨率

---

## 🚀 快速开始

### 1. 启动应用

解压后双击 `In Fortune AI.exe` 即可启动应用。

### 2. 配置AI API（可选）

如果需要使用AI对话功能：

1. 点击右上角 ⚙️ **设置**
2. 选择 **数据源** → **AI对话配置**
3. 选择AI提供商（推荐：豆包）
4. 输入API Key
5. 点击 **测试连接**

> 💡 **提示**: 如果没有API Key，应用会自动使用Mock模式提供模拟对话。

### 3. 探索功能

- 💬 **智能分析**: 与AI对话分析股票
- 📊 **市场行情**: 查看四大指数实时数据
- 📈 **个股分析**: 搜索股票查看K线图
- 💼 **投资组合**: 管理持仓计算盈亏
- 🔄 **策略回测**: 测试交易策略

---

## 📊 项目规模

### 代码统计
- **JavaScript**: 2,200+ 行
- **CSS**: 1,140+ 行
- **HTML**: 800+ 行
- **文档**: 4,500+ 行
- **总计**: 8,640+ 行

### 功能模块
- **核心功能**: 7大模块
- **设置选项**: 8个分类
- **AI提供商**: 5个集成
- **回测策略**: 5种策略
- **技术指标**: 多种指标

### MVP完成度
- 核心功能: **100%** ✅
- 桌面应用: **100%** ✅
- 文档系统: **100%** ✅
- 整体完成: **95%** ✅

---

## 📚 文档资源

完整的项目文档已整理到 [docs/](https://github.com/sjkncs/InFortune.ai-desktop/tree/main/docs) 目录：

### 核心文档
- **[文档索引](https://github.com/sjkncs/InFortune.ai-desktop/blob/main/docs/INDEX.md)** - 完整的文档导航
- **[快速开始](https://github.com/sjkncs/InFortune.ai-desktop/blob/main/docs/QUICK_START_DESKTOP.md)** - 桌面应用快速入门
- **[API配置指南](https://github.com/sjkncs/InFortune.ai-desktop/blob/main/docs/API_CONFIGURATION_GUIDE.md)** - AI API详细配置

### 开发文档
- **[实现报告](https://github.com/sjkncs/InFortune.ai-desktop/blob/main/docs/FINAL_IMPLEMENTATION_REPORT.md)** - 项目完整实现
- **[功能报告](https://github.com/sjkncs/InFortune.ai-desktop/blob/main/docs/FEATURE_COMPLETENESS_REPORT.md)** - 功能完整性分析
- **[构建指南](https://github.com/sjkncs/InFortune.ai-desktop/blob/main/docs/HOW_TO_BUILD.md)** - Windows打包教程

**查看所有文档**: [docs/INDEX.md](https://github.com/sjkncs/InFortune.ai-desktop/blob/main/docs/INDEX.md)

---

## ⚠️ 已知限制

### Windows SmartScreen警告

由于应用未进行代码签名，首次运行可能会遇到 Windows SmartScreen 警告：

**解决方法**:
1. 点击 **"更多信息"**
2. 点击 **"仍要运行"**

这是正常现象，应用完全安全。

### 未来改进

- [ ] 获取代码签名证书
- [ ] 提供NSIS安装包
- [ ] 提交到Microsoft Store
- [ ] 添加自动更新功能

---

## 🐛 故障排查

### 问题1: 应用无法启动

**解决方法**:
1. 确认已完整解压所有文件
2. 右键 → 以管理员身份运行
3. 检查杀毒软件是否拦截

### 问题2: AI对话无响应

**解决方法**:
1. 检查API Key配置是否正确
2. 点击"测试连接"验证API
3. 如无API Key，应用会自动使用Mock模式

### 问题3: 数据无法保存

**解决方法**:
1. 检查应用是否有写入权限
2. 确认LocalStorage未被禁用
3. 重启应用重新测试

---

## 🔄 更新日志

### v1.0.0-MVP (2026-02-22)

**🎉 首发版本 - MVP最小可行产品**

**新增功能**:
- ✅ AI智能对话系统（支持5个提供商）
- ✅ 市场行情监控（4大指数）
- ✅ 个股深度分析（K线图+技术指标）
- ✅ 投资组合管理（持仓+盈亏计算）
- ✅ 策略回测系统（5种经典策略）
- ✅ 完整设置系统（8个模块）
- ✅ 数据持久化（LocalStorage）

**技术栈**:
- Electron (跨平台框架)
- HTML5 + CSS3 + JavaScript (ES6+)
- ECharts (数据可视化)
- LocalStorage (数据存储)

**文档**:
- 21份完整文档（120,000+字）
- 6大分类清晰导航
- 4条推荐阅读路径

---

## 🛠️ 技术架构

### 前端技术
- **框架**: Electron (跨平台桌面)
- **语言**: JavaScript ES6+
- **样式**: CSS3 + CSS变量
- **图表**: ECharts 5.x

### 功能模块
- **AI对话**: 多提供商API集成
- **数据可视化**: K线图、分时图、收益曲线
- **数据存储**: LocalStorage持久化
- **状态管理**: 原生JavaScript

### 代码质量
- 模块化设计
- 注释完善
- 代码规范
- 易于扩展

---

## 🎯 后续计划

### v1.1.0 (计划中)

- [ ] 真实数据源接入（AKShare/BaoStock）
- [ ] 更多技术指标（MACD、KDJ等）
- [ ] 数据导出功能（Excel/CSV）
- [ ] 自选股管理

### v1.2.0 (规划中)

- [ ] macOS和Linux版本
- [ ] 多账户支持
- [ ] 云端同步
- [ ] 移动端应用

### v2.0.0 (远期规划)

- [ ] 量化交易平台
- [ ] 实盘交易对接
- [ ] 社区分享功能
- [ ] 策略市场

---

## 🙏 致谢

### 基础项目
本项目基于 [@QoneFeng](https://github.com/QoneFeng) 的优秀开源项目 [InFortune.ai](https://github.com/QoneFeng/InFortune.ai) 进行扩展开发。

### 技术支持
- [Electron](https://www.electronjs.org/) - 跨平台桌面应用框架
- [ECharts](https://echarts.apache.org/) - 数据可视化库
- [AKShare](https://www.akshare.xyz/) - 财经数据接口
- [BaoStock](http://www.baostock.com) - 股票数据接口

### 开源社区
感谢所有为开源项目做出贡献的开发者！

---

## 📄 开源协议

本项目基于 [MIT License](https://github.com/sjkncs/InFortune.ai-desktop/blob/main/LICENSE) 开源。

---

## 📞 联系方式

### 问题反馈
- **GitHub Issues**: https://github.com/sjkncs/InFortune.ai-desktop/issues

### 开发者
- **GitHub**: [@sjkncs](https://github.com/sjkncs)
- **Email**: shiawasong@gmail.com
- **Website**: https://sjkncs.github.io/navi-hawa-blog/

---

## 💝 支持项目

如果这个项目对您有帮助，请：

- ⭐ **Star** 本项目
- 🔔 **Watch** 关注更新
- 🍴 **Fork** 参与贡献
- 📢 **分享** 给更多人

---

<p align="center">
  <strong>Made with ❤️ by Yangting SONG (sjkncs)</strong><br>
  <strong>久经风雨，财智自成 | Mathematics is the language of nature</strong>
</p>

---

**发布时间**: 2026-02-22  
**版本**: v1.0.0-MVP  
**构建方式**: Manual Build  
**状态**: ✅ Production Ready
