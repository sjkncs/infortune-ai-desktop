# In Fortune AI桌面应用
# InFortune AI Desktop Application

现代化的Windows桌面应用，UI设计对标阿里千问和豆包。

---

## 📦 快速开始

### 安装依赖

```bash
cd desktop-app
npm install
```

### 开发模式

```bash
npm run dev
```

### 打包应用

```bash
# 打包Windows 64位版本
npm run build:win

# 打包Windows 32位版本
npm run build:win32

# 打包所有版本
npm run build:all
```

打包后的文件在 `dist/` 目录下。

---

## 🎨 界面特性

### 设计风格
- 📱 现代化UI设计，对标阿里千问和豆包
- 🎯 简洁直观的交互体验
- 🌈 舒适的配色方案
- ⚡ 流畅的动画效果

### 核心功能
- 💬 智能对话：AI驱动的股票分析助手
- 📊 实时行情：股票数据实时更新
- 📈 技术分析：专业的技术指标分析
- 💡 投资建议：智能投资策略推荐
- 📜 历史记录：对话历史本地保存

---

## 🏗️ 项目结构

```
desktop-app/
├── main.js                 # Electron主进程
├── index.html              # 应用主页面
├── package.json            # 项目配置
├── assets/                 # 资源文件
│   ├── icon.ico            # 应用图标
│   ├── icon.png
│   └── tray-icon.png       # 托盘图标
├── styles/                 # 样式文件
│   ├── main.css            # 主样式
│   └── chat.css            # 聊天样式
└── scripts/                # JavaScript脚本
    ├── app.js              # 应用逻辑
    ├── chat.js             # 聊天功能
    └── api.js              # API接口
```

---

## 🔧 配置说明

### API配置

编辑 `scripts/api.js` 修改API地址：

```javascript
const API_CONFIG = {
  baseURL: 'http://localhost:3001/api',  // 修改为实际API地址
  timeout: 30000
};
```

### 应用图标

将图标文件放在 `assets/` 目录：
- `icon.ico` - Windows图标（256x256）
- `icon.png` - 通用图标
- `tray-icon.png` - 系统托盘图标（16x16 或 32x32）

---

## 📝 使用说明

### 基本操作

1. **新建对话**
   - 点击左侧边栏的"+"按钮
   - 或使用快捷键 `Ctrl+N`

2. **发送消息**
   - 输入消息后点击发送按钮
   - 或按 `Enter` 键发送
   - `Shift+Enter` 换行

3. **历史记录**
   - 左侧边栏显示所有对话历史
   - 点击历史记录可切换对话
   - 对话自动保存到本地

4. **快捷功能**
   - 使用欢迎页面的快捷卡片
   - 点击功能标签快速输入

### 系统托盘

- 右键托盘图标显示菜单
- 双击托盘图标显示/隐藏窗口
- 关闭窗口时最小化到托盘

---

## 🚀 功能开发

### 集成后端API

修改 `scripts/api.js` 中的 `callAIAPI` 函数：

```javascript
async function callAIAPI(message) {
  const response = await fetch(`${API_CONFIG.baseURL}/chat`, {
    method: 'POST',
    headers: API_CONFIG.headers,
    body: JSON.stringify({
      message: message,
      chatId: AppState.currentChatId
    })
  });
  
  const data = await response.json();
  return data.response;
}
```

### 添加新功能

1. 在 `index.html` 添加UI元素
2. 在 `styles/` 添加样式
3. 在 `scripts/` 添加逻辑代码

---

## 📦 打包配置

### Windows安装程序

编辑 `package.json` 的 `build` 配置：

```json
"build": {
  "appId": "com.InFortune.ai.desktop",
  "productName": "In Fortune AI",
  "win": {
    "target": "nsis",
    "icon": "assets/icon.ico"
  },
  "nsis": {
    "oneClick": false,
    "allowToChangeInstallationDirectory": true
  }
}
```

### 便携版

```bash
npm run build:win
```

生成的便携版在 `dist/` 目录，可直接运行。

---

## 🐛 故障排除

### 应用无法启动

1. 检查Node.js版本（需要 14.0+）
2. 重新安装依赖：`npm install`
3. 清除缓存：`npm cache clean --force`

### 打包失败

1. 确保所有依赖已安装
2. 检查 `package.json` 配置
3. 确保图标文件存在

### API调用失败

1. 检查后端服务是否运行
2. 确认API地址配置正确
3. 查看控制台错误信息

---

## 📚 技术栈

- **Electron** - 跨平台桌面应用框架
- **原生JavaScript** - 无框架依赖，轻量高效
- **CSS3** - 现代化样式
- **Font Awesome** - 图标库

---

## 🤝 贡献指南

欢迎提交Issue和Pull Request！

---

## 📄 许可证

MIT License

---

## 📧 联系方式

如有问题或建议，请联系：
- GitHub Issues
- Email: support@InFortune.ai

---

**祝使用愉快！**
