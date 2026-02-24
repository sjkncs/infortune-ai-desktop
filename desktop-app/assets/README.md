# Desktop App Assets

此目录用于存放桌面应用的资源文件。

## 🎨 需要的图标文件

### 1. icon.png
- **用途**: 应用主图标
- **尺寸**: 256x256 或 512x512 (推荐)
- **格式**: PNG，带透明背景
- **位置**: `assets/icon.png`
- **引用**: `main.js:21`

### 2. icon.ico
- **用途**: Windows 应用图标
- **尺寸**: 多尺寸 (16x16, 32x32, 48x48, 256x256)
- **格式**: ICO
- **位置**: `assets/icon.ico`
- **引用**: `package.json:52` (electron-builder配置)

### 3. tray-icon.png
- **用途**: 系统托盘图标
- **尺寸**: 16x16 或 22x22 (小图标)
- **格式**: PNG，带透明背景
- **位置**: `assets/tray-icon.png`
- **引用**: `main.js:77`

---

## 🛠️ 快速创建图标方案

### 方案1: 从现有图标复制

如果 `website/public/img/` 中有现成的图标：

```bash
# 复制并重命名
copy ..\website\public\img\logo.png icon.png
copy ..\website\public\img\LOGO_ico.png tray-icon.png
```

### 方案2: 在线工具生成

推荐使用以下在线工具：

1. **PNG 转 ICO**:
   - https://www.icoconverter.com/
   - https://convertio.co/zh/png-ico/

2. **生成应用图标**:
   - https://www.canva.com/
   - https://www.figma.com/

3. **AI 生成图标**:
   - https://www.iconai.co/
   - https://icon.kitchen/

### 方案3: 使用 Node.js 脚本生成

创建一个简单的纯色占位符图标：

```javascript
// 安装依赖: npm install sharp
const sharp = require('sharp');

// 创建 256x256 蓝色图标
sharp({
  create: {
    width: 256,
    height: 256,
    channels: 4,
    background: { r: 41, g: 128, b: 185, alpha: 1 }
  }
})
.png()
.toFile('icon.png');

// 创建 22x22 托盘图标
sharp({
  create: {
    width: 22,
    height: 22,
    channels: 4,
    background: { r: 41, g: 128, b: 185, alpha: 1 }
  }
})
.png()
.toFile('tray-icon.png');
```

---

## 🎨 设计建议

### 图标设计规范

1. **简洁**: 避免过多细节，尤其是小尺寸图标
2. **识别性强**: 在多个应用中能快速识别
3. **品牌一致**: 与应用主题和品牌色保持一致
4. **适配性好**: 在亮色/暗色背景下都清晰

### In Fortune AI 建议配色

基于项目主题（股票分析），建议使用：

- **主色**: 蓝色系 (#2980b9, #3498db) - 专业、稳重
- **辅色**: 绿色 (#27ae60) - 涨势
- **点缀**: 红色 (#e74c3c) - 跌势
- **中性**: 深灰 (#34495e) - 背景

### 图标元素建议

可以包含以下元素：
- 📈 K线图
- 💹 上升趋势箭头
- 🧠 AI/智能符号
- 💰 金融相关符号
- In Fortune 文字/字母缩写

---

## ✅ 验证图标

创建完图标后，验证是否正常：

```bash
# 启动应用查看
npm start

# 检查图标是否显示
# 1. 窗口标题栏图标
# 2. 任务栏图标
# 3. 系统托盘图标
```

---

## 📦 图标资源推荐

### 免费图标库

1. **Icons8**: https://icons8.com/
2. **Flaticon**: https://www.flaticon.com/
3. **IconFinder**: https://www.iconfinder.com/
4. **Material Icons**: https://fonts.google.com/icons

### 注意事项

⚠️ 使用第三方图标时请：
- 检查许可证
- 遵守使用条款
- 考虑商业使用限制

---

## 🚀 临时解决方案

如果暂时没有图标，可以注释掉 `main.js` 中的图标引用：

```javascript
// 注释掉 icon 配置
// icon: path.join(__dirname, 'assets/icon.png'),

// 注释掉托盘图标
// tray = new Tray(path.join(__dirname, 'assets/tray-icon.png'));
```

应用仍能正常运行，只是没有自定义图标。
