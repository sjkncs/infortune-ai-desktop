# 🖥️ In Fortune AI桌面应用 - 构建指南
# Desktop Application Build Guide

完整的Windows桌面应用打包指南

---

## ✅ 已完成的工作

### 📁 创建的文件

1. **核心文件**
   - ✅ `desktop-app/package.json` - 项目配置
   - ✅ `desktop-app/main.js` - Electron主进程
   - ✅ `desktop-app/index.html` - 应用界面
   - ✅ `desktop-app/README.md` - 使用文档

2. **样式文件**
   - ✅ `desktop-app/styles/main.css` - 主样式
   - ✅ `desktop-app/styles/chat.css` - 聊天界面样式

3. **脚本文件**
   - ✅ `desktop-app/scripts/app.js` - 应用逻辑
   - ✅ `desktop-app/scripts/chat.js` - 聊天功能
   - ✅ `desktop-app/scripts/api.js` - API接口

---

## 🚀 构建步骤

### Step 1: 安装依赖

```bash
cd desktop-app
npm install
```

这将安装：
- Electron (桌面应用框架)
- Electron Builder (打包工具)
- Axios (HTTP客户端)
- Marked (Markdown渲染)

### Step 2: 准备图标

需要准备以下图标文件并放到 `desktop-app/assets/` 目录：

```
assets/
├── icon.ico      # Windows图标 (256x256)
├── icon.png      # 通用图标 (512x512)
└── tray-icon.png # 托盘图标 (32x32)
```

**快速生成图标:**

使用在线工具或命令：
- https://www.icoconverter.com/ (在线转换)
- 或使用ImageMagick: `convert logo.png -resize 256x256 icon.ico`

### Step 3: 开发模式测试

```bash
npm run dev
```

这将启动应用并打开开发者工具，用于测试和调试。

### Step 4: 打包应用

```bash
# Windows 64位版本（推荐）
npm run build:win

# Windows 32位版本
npm run build:win32

# 同时打包两个版本
npm run build:all
```

打包完成后，文件位于 `dist/` 目录：
- `InFortuneAI-1.0.0-x64.exe` - 64位安装程序
- `InFortuneAI-1.0.0-x64-portable.exe` - 64位便携版
- `InFortuneAI-1.0.0-ia32.exe` - 32位安装程序

---

## 🎨 界面特性

### 设计对标
- ✅ 阿里千问风格
- ✅ 豆包UI设计
- ✅ 现代化交互

### 主要界面
1. **左侧边栏**
   - 用户信息
   - 导航菜单（智能对话、AI助手、云端、文档）
   - 对话历史列表
   - 设置按钮

2. **主内容区**
   - 欢迎屏幕（带快捷功能卡片）
   - 对话区域
   - 输入框（支持附件、语音）

3. **交互功能**
   - 实时对话
   - 打字动画
   - 消息格式化（Markdown支持）
   - 历史记录保存

---

## 📝 功能清单

### 已实现功能 ✅

- [x] 现代化UI界面
- [x] 用户对话功能
- [x] 历史记录管理
- [x] 本地数据存储
- [x] 系统托盘集成
- [x] 窗口控制（最小化、关闭）
- [x] 消息格式化显示
- [x] 加载动画
- [x] 快捷功能卡片
- [x] 响应式布局

### 待集成功能 ⏳

- [ ] 后端API对接
- [ ] 股票数据实时更新
- [ ] 图表可视化
- [ ] 文件上传功能
- [ ] 语音输入
- [ ] 主题切换（亮/暗）
- [ ] 自动更新
- [ ] 快捷键支持

---

## 🔧 配置说明

### 修改应用信息

编辑 `package.json`：

```json
{
  "name": "infortune-ai-desktop",
  "version": "1.0.0",
  "description": "In Fortune AI - 智能股票分析桌面应用",
  "author": "InFortune AI Team"
}
```

### 修改API地址

编辑 `scripts/api.js`：

```javascript
const API_CONFIG = {
  baseURL: 'http://localhost:3001/api',  // 改为实际API地址
  timeout: 30000
};
```

### 自定义窗口大小

编辑 `main.js`：

```javascript
mainWindow = new BrowserWindow({
  width: 1400,        // 宽度
  height: 900,        // 高度
  minWidth: 1000,     // 最小宽度
  minHeight: 600      // 最小高度
});
```

---

## 🎯 集成后端API

### 1. 修改API调用

将 `scripts/api.js` 中的模拟API替换为真实API：

```javascript
async function callAIAPI(message) {
  const response = await fetch(`${API_CONFIG.baseURL}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`  // 如需认证
    },
    body: JSON.stringify({
      message: message,
      chatId: AppState.currentChatId,
      context: getConversationContext()
    })
  });
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }
  
  const data = await response.json();
  return data.response;
}
```

### 2. 启动后端服务

确保后端服务正在运行：

```bash
# 在项目根目录
cd website
npm run dev

# 或启动Python服务
cd akshare
python app.py
```

### 3. 测试连接

在应用中发送消息，检查：
1. 网络请求是否成功
2. 响应数据格式是否正确
3. 错误处理是否生效

---

## 📦 分发应用

### 安装程序版本

双击 `InFortuneAI-1.0.0-x64.exe` 即可安装，会：
- 安装到指定目录
- 创建桌面快捷方式
- 创建开始菜单项
- 支持卸载

### 便携版

`InFortuneAI-1.0.0-x64-portable.exe` 是便携版：
- 无需安装
- 可放在U盘
- 双击即可运行
- 数据保存在同目录

---

## 🐛 常见问题

### Q1: 打包时报错 "Cannot find module 'electron'"

**解决:**
```bash
npm install electron --save-dev
```

### Q2: 应用启动后白屏

**解决:**
1. 检查 `index.html` 路径是否正确
2. 打开开发者工具查看错误
3. 确认所有资源文件存在

### Q3: 图标不显示

**解决:**
1. 确保图标文件在 `assets/` 目录
2. 检查 `package.json` 中的图标路径
3. 重新打包应用

### Q4: API调用失败

**解决:**
1. 检查后端服务是否运行
2. 确认API地址配置正确
3. 检查CORS设置
4. 查看控制台网络请求

---

## 📊 性能优化

### 1. 减小打包体积

在 `package.json` 添加：

```json
"build": {
  "files": [
    "**/*",
    "!docs/**/*",
    "!scripts/**/*",
    "!ml_services/**/*"
  ]
}
```

### 2. 启用代码压缩

```json
"build": {
  "asar": true,
  "compression": "maximum"
}
```

### 3. 优化启动速度

- 延迟加载非关键资源
- 使用本地缓存
- 减少初始化操作

---

## 🎉 完成

现在你有一个功能完整的Windows桌面应用！

**下一步:**
1. 集成真实的后端API
2. 添加更多功能
3. 优化用户体验
4. 收集用户反馈
5. 持续迭代改进

---

**祝构建顺利！** 🚀
