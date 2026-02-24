# ⚡ In Fortune AI桌面应用 - 快速启动指南

## 🎉 恭喜！桌面应用已创建完成

我已经为你创建了一个完整的Windows桌面应用，UI设计对标阿里千问和豆包。

---

## 📦 立即开始

### 1. 进入应用目录

```bash
cd desktop-app
```

### 2. 安装依赖

```bash
npm install
```

如果还没有安装Node.js，请先从 https://nodejs.org/ 下载安装。

### 3. 启动应用（开发模式）

```bash
npm run dev
```

应用将立即启动，你可以看到：
- ✅ 现代化的UI界面
- ✅ 智能对话功能
- ✅ 历史记录管理
- ✅ 系统托盘集成

### 4. 打包为安装程序

```bash
# Windows 64位版本
npm run build:win
```

打包完成后，在 `dist/` 目录可以找到：
- `InFortuneAI-1.0.0-x64.exe` - 安装程序
- `InFortuneAI-1.0.0-x64-portable.exe` - 便携版

---

## 🎨 界面预览

应用包含以下界面元素：

### 左侧边栏
- 👤 用户头像和信息
- 📱 导航菜单（智能对话、AI助手、云端、文档）
- 📜 对话历史列表
- ⚙️ 设置按钮

### 主内容区
- 🌟 欢迎屏幕（类似豆包/千问）
- 💬 对话区域
- ⌨️ 智能输入框
- 📎 附件和语音按钮

### 快捷功能
- 超详细文件
- 上网搜索
- AI众筹AI
- 多个功能标签

---

## 🔧 准备图标（可选）

应用需要以下图标文件（放在 `desktop-app/assets/` 目录）：

1. **icon.ico** - Windows图标
   - 尺寸: 256x256 像素
   - 格式: ICO

2. **icon.png** - 通用图标
   - 尺寸: 512x512 像素
   - 格式: PNG

3. **tray-icon.png** - 托盘图标
   - 尺寸: 32x32 像素
   - 格式: PNG

**快速获取图标:**
- 使用项目logo
- 在线工具: https://www.icoconverter.com/
- 或使用任何图片编辑软件

**暂时没有图标？** 没关系！应用使用Font Awesome图标作为默认显示。

---

## 🚀 功能特性

### 已实现 ✅

- [x] 现代化UI设计（对标阿里千问/豆包）
- [x] 智能对话界面
- [x] 对话历史管理
- [x] 本地数据存储
- [x] 系统托盘集成
- [x] 消息格式化（支持Markdown）
- [x] 加载动画效果
- [x] 快捷功能卡片
- [x] 响应式布局
- [x] 窗口控制

### 待集成 ⏳

- [ ] 后端API对接
- [ ] 实时股票数据
- [ ] 图表可视化
- [ ] 文件上传
- [ ] 语音输入
- [ ] 主题切换

---

## 🔗 集成后端API

当前应用使用模拟数据，要集成真实API：

### 1. 启动后端服务

```bash
# 在项目根目录
cd website
npm run dev

# 或启动Python服务
cd akshare
python app.py
```

### 2. 修改API配置

编辑 `desktop-app/scripts/api.js`：

```javascript
const API_CONFIG = {
  baseURL: 'http://localhost:3001/api',  // 你的API地址
  timeout: 30000
};
```

### 3. 测试连接

启动应用，发送消息，查看是否成功连接。

---

## 📝 使用技巧

### 发送消息
- 输入消息后按 `Enter` 发送
- `Shift + Enter` 换行
- 点击发送按钮

### 管理对话
- 点击"+"创建新对话
- 左侧列表查看历史
- 点击历史记录切换对话

### 系统托盘
- 关闭窗口会最小化到托盘
- 右键托盘图标显示菜单
- 双击托盘图标显示/隐藏

---

## 🎯 文件结构

```
desktop-app/
├── main.js                 # Electron主进程
├── index.html              # 应用界面
├── package.json            # 项目配置
├── styles/
│   ├── main.css            # 主样式（现代化设计）
│   └── chat.css            # 聊天界面
├── scripts/
│   ├── app.js              # 应用逻辑
│   ├── chat.js             # 聊天功能
│   └── api.js              # API接口
└── assets/
    └── (图标文件)
```

---

## 🐛 常见问题

### Q: 应用无法启动？
**A:** 确保已安装Node.js 14.0+，然后运行 `npm install`

### Q: 打包失败？
**A:** 检查：
1. 所有依赖已安装
2. package.json 配置正确
3. 有足够的磁盘空间

### Q: 界面显示不正常？
**A:** 
1. 清除缓存重新启动
2. 检查浏览器控制台错误
3. 确保CSS文件加载成功

### Q: API调用失败？
**A:**
1. 确认后端服务运行中
2. 检查API地址配置
3. 查看网络请求日志

---

## 📚 详细文档

- **使用文档:** `desktop-app/README.md`
- **构建指南:** `BUILD_DESKTOP_APP.md`
- **项目文档:** `docs/` 目录

---

## 🎨 自定义修改

### 修改应用名称

编辑 `package.json`:
```json
{
  "name": "infortune-ai-desktop",
  "productName": "In Fortune AI",
  "description": "智能股票分析桌面应用"
}
```

### 修改窗口大小

编辑 `main.js`:
```javascript
width: 1400,    // 宽度
height: 900,    // 高度
```

### 修改颜色主题

编辑 `styles/main.css`:
```css
:root {
  --primary-color: #6366f1;  // 主色调
  --bg-primary: #ffffff;      // 背景色
  /* ... */
}
```

---

## 💡 下一步建议

1. **立即体验**
   ```bash
   cd desktop-app
   npm install
   npm run dev
   ```

2. **集成API**
   - 修改 `scripts/api.js`
   - 连接后端服务
   - 测试功能

3. **打包分发**
   ```bash
   npm run build:win
   ```

4. **持续优化**
   - 添加更多功能
   - 优化用户体验
   - 收集用户反馈

---

## 🎊 总结

你现在拥有：
- ✅ 完整的桌面应用代码
- ✅ 现代化UI设计
- ✅ 打包配置
- ✅ 详细文档

**立即开始使用：**
```bash
cd desktop-app && npm install && npm run dev
```

---

**祝你使用愉快！** 🚀

如有问题，查看：
- `desktop-app/README.md` - 详细使用说明
- `BUILD_DESKTOP_APP.md` - 完整构建指南
