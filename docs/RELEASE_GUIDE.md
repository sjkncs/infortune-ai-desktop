# 📦 GitHub Release 发布指南

## 🎯 Release v1.0.0-MVP 准备清单

### ✅ 已完成项目
- [x] 核心功能实现完成（95% MVP）
- [x] 代码已提交到GitHub
- [x] README已更新
- [x] 文档已完善

---

## 📋 Release 发布步骤

### 1. 打包桌面应用

首先需要构建桌面应用的安装包：

```bash
cd desktop-app
npm install
npm run build:win    # Windows
npm run build:mac    # macOS (需要在macOS上执行)
npm run build:linux  # Linux
```

**生成的文件位置**: `desktop-app/dist/`

**预期文件**:
- Windows: `infortune-ai-Setup-1.0.0.exe` (~150MB)
- macOS: `infortune-ai-1.0.0.dmg` (~170MB)
- Linux: `infortune-ai-1.0.0.AppImage` (~160MB)

---

### 2. 创建GitHub Release

#### 步骤 1: 访问Release页面

1. 打开仓库: https://github.com/sjkncs/InFortune.ai-desktop
2. 点击右侧的 **"Releases"**
3. 点击 **"Create a new release"** 或 **"Draft a new release"**

#### 步骤 2: 填写Release信息

**Tag version**: `v1.0.0-MVP`
- 格式说明: `v主版本号.次版本号.修订号-标签`
- 示例: v1.0.0-MVP, v1.0.1-beta, v2.0.0

**Release title**: `In Fortune AI Desktop v1.0.0 - MVP首发版 🎉`

**描述 (Description)**: 使用下面提供的模板

---

### 3. Release描述模板

复制以下内容到Release描述框：

```markdown
# 🎊 In Fortune AI Desktop v1.0.0 - MVP首发版

**发布日期**: 2026-02-21  
**版本类型**: MVP (最小可行产品)  
**项目地址**: https://github.com/sjkncs/InFortune.ai-desktop

---

## 🌟 项目简介

In Fortune AI Desktop 是一款**AI驱动的智能股票分析桌面应用**，为投资者提供全面、准确、智能的市场分析工具。

**核心理念**: 久经风雨，财智自成 | Mathematics is the language of nature

---

## ✨ 核心功能

### 1. 🤖 AI智能分析
- 自然语言股票对话
- 多轮上下文理解
- 6大快捷功能卡片
- 8种技术指标标签
- 对话历史管理

### 2. 📊 市场行情监控
- 4大主要指数实时追踪（上证/深证/创业板/沪深300）
- 自动刷新机制（5/10/30/60/300秒可选）
- 涨跌幅动态显示
- 热门板块分析
- 成交额统计

### 3. 📈 个股深度分析
- 智能搜索（代码/名称模糊查询）
- K线图表展示（30天历史）
- 技术指标计算（MA5/MA10/MA20/RSI）
- 基本信息展示
- 自动AI分析

### 4. 💼 投资组合管理
- 持仓添加/编辑/删除
- 自动盈亏计算
- 投资组合摘要（市值/成本/收益）
- 持仓明细表格
- LocalStorage数据持久化

### 5. 🔄 策略回测系统
- 5种经典策略（均线/MACD/KDJ/RSI/布林带）
- 回测执行引擎
- 6项绩效指标（总收益率/年化收益/最大回撤等）
- 收益曲线图表
- 交易记录明细

### 6. ⚙️ 完整设置系统
- 🎨 外观定制（6种主题色、深色/浅色模式）
- 🌍 多语言支持（中文/英文/日文）
- 📡 数据源配置（API服务器、刷新频率）
- 🔔 通知设置（桌面通知、价格预警）
- ⌨️ 快捷键管理
- 🔬 高级选项

### 7. 🚀 真实AI API集成
- 支持5个AI提供商（豆包/OpenAI/通义千问/文心一言/Mock）
- API Key安全本地存储
- 测试连接功能
- 自动重试机制
- 智能降级（无配置时使用Mock）

---

## 📊 项目规模

### 代码统计
- **JavaScript**: 2200+ 行
- **CSS**: 1140+ 行
- **文档**: 4000+ 行
- **总计**: 7340+ 行代码

### 文件清单
- **新增JavaScript模块**: 7个
- **新增CSS样式**: 4个
- **新增文档**: 8个
- **总文件数**: 40+ 个

### 功能完成度
- **MVP完成度**: 95%
- **核心功能**: 100%
- **文档完整性**: 100%

---

## 💾 安装说明

### Windows 用户

1. 下载 `infortune-ai-Setup-1.0.0.exe`
2. 双击运行安装程序
3. 按照安装向导完成安装
4. 启动应用

### macOS 用户

1. 下载 `infortune-ai-1.0.0.dmg`
2. 双击打开DMG文件
3. 拖拽应用到Applications文件夹
4. 启动应用

### Linux 用户

1. 下载 `infortune-ai-1.0.0.AppImage`
2. 添加执行权限: `chmod +x infortune-ai-1.0.0.AppImage`
3. 运行: `./infortune-ai-1.0.0.AppImage`

---

## 🎯 快速开始

### 首次使用

1. **启动应用** - 双击图标打开
2. **配置AI API（可选）**:
   - 打开设置 → 数据源 → AI对话配置
   - 选择AI提供商（推荐豆包）
   - 输入API Key
   - 点击测试连接
3. **开始使用**:
   - 智能分析: 与AI对话，分析股票
   - 市场行情: 查看实时指数和板块
   - 个股分析: 搜索股票，查看K线图
   - 投资组合: 管理持仓，计算盈亏
   - 策略回测: 测试交易策略

### 示例操作

**AI对话示例**:
```
你: "分析一下茅台股票"
AI: [提供专业分析]

你: "推荐几只优质股票"
AI: [给出推荐和理由]
```

**搜索股票**:
- 输入 `600519` 或 `茅台`
- 按Enter键搜索
- 查看K线图和技术指标

**添加持仓**:
- 点击"投资组合"
- 点击"添加持仓"
- 填写股票信息
- 自动计算盈亏

---

## 📚 文档资源

### 用户文档
- [API配置指南](API_CONFIGURATION_GUIDE.md) - 详细的AI API配置教程
- [快速测试指南](QUICK_TEST_GUIDE.md) - 功能测试方法
- [策略回测指南](desktop-app/STRATEGY_BACKTEST_GUIDE.md) - 策略回测使用说明

### 技术文档
- [功能完整性报告](FEATURE_COMPLETENESS_REPORT.md) - 功能实现情况
- [API实现总结](API_IMPLEMENTATION_SUMMARY.md) - API系统技术细节
- [最终实现报告](FINAL_IMPLEMENTATION_REPORT.md) - 完整项目总结

---

## 🐛 已知限制

### 数据限制
- ⚠️ 股票数据为模拟生成（暂未接入真实数据源）
- ⚠️ 仅内置2只示例股票
- ⚠️ 技术指标采用简化算法

### 功能限制
- ⚠️ AI功能需要配置API Key
- ⚠️ 暂不支持数据批量导入导出
- ⚠️ 无实时推送通知

### 平台限制
- ⚠️ 仅支持Windows、macOS、Linux桌面端
- ⚠️ 需要Node.js环境（打包后的应用无需）

---

## 🔄 后续计划

### v1.1.0 (计划中)
- [ ] 接入真实股票数据源（AKShare/BaoStock）
- [ ] 支持更多股票和市场
- [ ] 增强技术指标计算
- [ ] 批量数据导入导出

### v1.2.0 (计划中)
- [ ] 收益曲线图表
- [ ] 资产分布饼图
- [ ] 多策略对比
- [ ] 智能推荐系统

### v2.0.0 (远期)
- [ ] 多账户管理
- [ ] 云端数据同步
- [ ] 移动端App
- [ ] 社区功能

---

## 🙏 致谢

### 原项目
感谢 [@QoneFeng](https://github.com/QoneFeng) 的优秀开源项目 [InFortune.ai](https://github.com/QoneFeng/InFortune.ai)，为本项目提供了坚实基础。

### 技术栈
- [Electron](https://www.electronjs.org/) - 跨平台桌面应用框架
- [AKShare](https://www.akshare.xyz/) - 财经数据接口
- [BaoStock](http://www.baostock.com) - 股票数据接口
- [Vue.js](https://vuejs.org/) - 渐进式JavaScript框架
- [FastAPI](https://fastapi.tiangolo.com/) - Python Web框架

---

## 📞 反馈与支持

### 问题反馈
- **GitHub Issues**: https://github.com/sjkncs/InFortune.ai-desktop/issues
- **Email**: shiawasong@gmail.com

### 贡献代码
欢迎提交Pull Request！

1. Fork本仓库
2. 创建特性分支
3. 提交更改
4. 创建Pull Request

---

## 📄 开源协议

本项目基于 [MIT License](LICENSE) 开源。

---

## ⭐ 支持项目

如果您觉得这个项目对您有帮助，请：
- ⭐ Star本仓库
- 🔔 Watch获取更新
- 🍴 Fork参与贡献
- 📢 分享给更多人

---

<p align="center">
  <strong>Made with ❤️ by Yangting SONG (sjkncs)</strong><br>
  <strong>久经风雨，财智自成 | Mathematics is the language of nature</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Version-1.0.0--MVP-blue?style=for-the-badge" alt="Version">
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License">
  <img src="https://img.shields.io/badge/Platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey?style=for-the-badge" alt="Platform">
</p>
```

---

### 4. 上传安装包

在Release页面的 **"Attach binaries"** 区域，拖拽或选择以下文件：

#### 必需文件（如果已构建）:
- [ ] `infortune-ai-Setup-1.0.0.exe` (Windows安装包)
- [ ] `infortune-ai-1.0.0.dmg` (macOS安装包)  
- [ ] `infortune-ai-1.0.0.AppImage` (Linux安装包)

#### 可选文件:
- [ ] `CHANGELOG.md` (更新日志)
- [ ] `源代码.zip` (GitHub自动生成)
- [ ] `源代码.tar.gz` (GitHub自动生成)

---

### 5. 发布设置

#### 选项说明:

- [x] **Set as the latest release** - 设为最新版本
- [ ] **Set as a pre-release** - 设为预发布版本（如果是测试版勾选）
- [ ] **Create a discussion for this release** - 创建讨论话题（可选）

---

### 6. 发布

点击 **"Publish release"** 按钮完成发布！

---

## 📝 当前情况说明

### ⚠️ 如果没有安装包

如果当前无法构建安装包，可以：

**方案1: 仅发布源代码**
- 不上传安装包文件
- 在描述中说明用户需要自行构建
- 提供构建命令

**方案2: 标记为Pre-release**
- 勾选 "Set as a pre-release"
- 说明这是源码发布版本
- 后续补充安装包

**方案3: 延后发布**
- 先构建所有平台的安装包
- 再创建正式Release

---

## 🔨 构建安装包注意事项

### Windows打包

```bash
cd desktop-app
npm install
npm run build:win
```

**要求**:
- Windows系统
- 已安装Node.js

**输出**: `desktop-app/dist/infortune-ai-Setup-1.0.0.exe`

### macOS打包

```bash
cd desktop-app
npm install
npm run build:mac
```

**要求**:
- macOS系统
- 已安装Node.js
- 可能需要Apple开发者证书（代码签名）

**输出**: `desktop-app/dist/infortune-ai-1.0.0.dmg`

### Linux打包

```bash
cd desktop-app
npm install
npm run build:linux
```

**要求**:
- Linux系统（或WSL）
- 已安装Node.js

**输出**: `desktop-app/dist/infortune-ai-1.0.0.AppImage`

---

## 🎯 推荐发布流程

### 第一步: 检查package.json

确认 `desktop-app/package.json` 中的版本号：

```json
{
  "name": "infortune-ai-desktop",
  "version": "1.0.0",
  "description": "In Fortune AI - 智能股票分析助手",
  ...
}
```

### 第二步: 本地测试

```bash
cd desktop-app
npm start  # 测试应用是否正常运行
```

### 第三步: 构建安装包

```bash
npm run build:win    # Windows
# npm run build:mac  # macOS（需要在Mac上）
# npm run build:linux # Linux（需要在Linux上）
```

### 第四步: 测试安装包

安装并运行构建好的安装包，确保功能正常。

### 第五步: 创建Release

按照上面的步骤创建GitHub Release并上传安装包。

---

## ✅ 发布前检查清单

- [x] 代码已提交到GitHub主分支
- [x] README已更新
- [x] 版本号已更新
- [ ] 安装包已构建
- [ ] 安装包已测试
- [ ] Release描述已准备
- [ ] 文档链接已确认

---

## 🚀 发布后工作

### 1. 宣传推广
- [ ] 在README中添加下载链接
- [ ] 更新项目描述
- [ ] 社交媒体分享

### 2. 收集反馈
- [ ] 监控GitHub Issues
- [ ] 记录用户反馈
- [ ] 规划下一版本

### 3. 维护更新
- [ ] 修复Bug
- [ ] 添加新功能
- [ ] 定期发布更新

---

## 📞 需要帮助？

如有疑问，请：
- 查看 [GitHub Release文档](https://docs.github.com/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository)
- 提交 Issue
- 发送邮件: shiawasong@gmail.com

---

**祝发布顺利！** 🎉
