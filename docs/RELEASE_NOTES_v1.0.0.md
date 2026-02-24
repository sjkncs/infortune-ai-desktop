# 📦 In Fortune AI Desktop v1.0.0-MVP 发布说明

## 🎉 发布信息

- **版本**: v1.0.0-MVP
- **发布日期**: 2026-02-22
- **打包状态**: ✅ 成功生成发布文件
- **文件位置**: `desktop-app/dist/`

---

## 📥 下载文件

### 生成的发布文件

| 文件名 | 大小 | 说明 | 推荐 |
|--------|------|------|------|
| **InFortuneAI-1.0.0-win-x64.zip** | 43 MB | 完整压缩包（含所有依赖） | ⭐ 推荐 |
| **InFortuneAI-1.0.0-Portable.exe** | 169 MB | 便携版启动器（需完整包） | - |

---

## 💾 安装说明

### 方法1: 使用ZIP压缩包（推荐）✨

**适用于**: 所有Windows用户

**步骤**:
1. 下载 `InFortuneAI-1.0.0-win-x64.zip`
2. 解压到任意位置（如 `C:\Program Files\InFortuneAI\`）
3. 双击运行 `In Fortune AI.exe`

**优点**:
- ✅ 无需安装
- ✅ 绿色便携
- ✅ 可复制到U盘
- ✅ 无管理员权限要求

---

### 方法2: 便携版EXE（仅启动器）

**注意**: 此文件需要配合完整的应用文件才能运行

**步骤**:
1. 先解压 `InFortuneAI-1.0.0-win-x64.zip`
2. 将 `InFortuneAI-1.0.0-Portable.exe` 复制到解压目录
3. 运行 `InFortuneAI-1.0.0-Portable.exe`

---

## 🚀 快速开始

### 1. 启动应用

解压后双击 `In Fortune AI.exe` 即可启动

### 2. 首次使用

#### 可选：配置AI API

1. 点击右上角 ⚙️ **设置**
2. 选择 **数据源** → **AI对话配置**
3. 选择AI提供商（推荐：豆包）
4. 输入API Key
5. 点击 **测试连接**

#### 如果没有API Key

应用会自动使用 **Mock模式**，提供模拟对话功能。

### 3. 探索功能

- 💬 **智能分析**: 与AI对话分析股票
- 📊 **市场行情**: 查看四大指数实时数据
- 📈 **个股分析**: 搜索股票，查看K线图
- 💼 **投资组合**: 管理持仓，计算盈亏
- 🔄 **策略回测**: 测试交易策略

---

## ⚠️ 已知限制

### 打包说明

由于Windows代码签名工具权限问题，本次采用以下发布方式：

- ✅ **已生成**: ZIP压缩包（完整可用）
- ✅ **已生成**: 便携版EXE
- ❌ **未生成**: NSIS安装包（需要代码签名）

### 影响

- 首次运行可能触发Windows SmartScreen警告
- 需要点击 "更多信息" → "仍要运行"
- 这是正常现象（未签名的应用）

### 解决方案（未来版本）

- 获取代码签名证书
- 或提交到Microsoft Store

---

## 🔍 文件说明

### ZIP包内容

解压后包含以下文件：

```
InFortuneAI/
├── In Fortune AI.exe           # 主程序
├── resources/           # 资源文件
│   └── app.asar        # 应用代码
├── locales/            # 语言包
├── *.dll               # 依赖库
├── *.pak               # Chromium资源
└── ...                 # 其他依赖文件
```

**总大小**: 约 170 MB

---

## 📋 系统要求

### 最低要求

- **操作系统**: Windows 10 或更高版本
- **处理器**: Intel Core i3 或同等处理器
- **内存**: 4 GB RAM
- **磁盘空间**: 500 MB 可用空间
- **显示器**: 1280x720 或更高分辨率

### 推荐配置

- **操作系统**: Windows 11
- **处理器**: Intel Core i5 或更高
- **内存**: 8 GB RAM或更高
- **磁盘空间**: 1 GB 可用空间
- **显示器**: 1920x1080 或更高分辨率

---

## 🐛 故障排查

### 问题1: 无法启动

**现象**: 双击无反应或闪退

**解决**:
1. 确认已完整解压所有文件
2. 右键 → 以管理员身份运行
3. 检查是否有杀毒软件拦截

### 问题2: SmartScreen警告

**现象**: Windows显示"已阻止应用启动"

**解决**:
1. 点击 "更多信息"
2. 点击 "仍要运行"
3. 或在Windows Defender中添加信任

### 问题3: 缺少DLL文件

**现象**: 提示缺少某个.dll文件

**解决**:
1. 重新完整解压ZIP包
2. 确保所有文件都在同一目录
3. 安装 Visual C++ Redistributable

---

## 📞 获取帮助

### 文档资源

- 📖 [完整README](../README.md)
- 🔧 [API配置指南](../API_CONFIGURATION_GUIDE.md)
- 📦 [打包指南](../HOW_TO_BUILD.md)
- 🚀 [Release指南](../RELEASE_GUIDE.md)

### 问题反馈

- **GitHub Issues**: https://github.com/sjkncs/InFortune.ai-desktop/issues
- **Email**: shiawasong@gmail.com

---

## 🎯 下一步

### 创建GitHub Release

1. 访问: https://github.com/sjkncs/InFortune.ai-desktop/releases/new
2. 填写信息:
   - **Tag**: `v1.0.0-MVP`
   - **Title**: `In Fortune AI Desktop v1.0.0 - MVP首发版 🎉`
3. 上传文件:
   - `InFortuneAI-1.0.0-win-x64.zip`
   - `InFortuneAI-1.0.0-Portable.exe`（可选）
4. 添加描述（参考 RELEASE_GUIDE.md）
5. 点击 **Publish release**

---

## ✅ 验收标准

- [x] 应用可正常启动
- [x] 所有核心功能可用
- [x] ZIP包完整可解压
- [x] 文件大小合理（< 200MB）
- [x] 发布文档完善

---

## 📈 版本历史

### v1.0.0-MVP (2026-02-22)

**首发版本** - MVP最小可行产品

**核心功能**:
- ✅ AI智能对话系统
- ✅ 市场行情监控（4大指数）
- ✅ 个股深度分析（K线图+技术指标）
- ✅ 投资组合管理
- ✅ 策略回测系统（5种策略）
- ✅ 完整设置系统（8个模块）
- ✅ API集成（5个提供商）

**代码统计**:
- JavaScript: 2200+ 行
- CSS: 1140+ 行
- 文档: 4000+ 行

**MVP完成度**: 95%

---

## 🙏 致谢

感谢 [@QoneFeng](https://github.com/QoneFeng) 的优秀开源项目 [InFortune.ai](https://github.com/QoneFeng/InFortune.ai)

---

## 📄 开源协议

本项目基于 [MIT License](../LICENSE) 开源

---

<p align="center">
  <strong>Made with ❤️ by Yangting SONG (sjkncs)</strong><br>
  <strong>久经风雨，财智自成</strong>
</p>

---

**发布时间**: 2026-02-22 13:25  
**构建方式**: Manual Build (代码签名问题workaround)  
**状态**: ✅ Ready for Release
