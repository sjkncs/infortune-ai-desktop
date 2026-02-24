# 🔨 快速打包指南

## 📦 Windows打包（当前系统）

### 方法1: 使用npm命令（推荐）

```bash
cd desktop-app
npm install
npm run build:win
```

**等待时间**: 约5-10分钟

**输出位置**: `desktop-app/dist/infortune-ai-Setup-1.0.0.exe`

---

### 方法2: 一键打包脚本

创建一个批处理文件 `build-windows.bat`:

```batch
@echo off
echo ========================================
echo In Fortune AI Desktop Windows打包工具
echo ========================================
echo.

cd desktop-app

echo [1/3] 安装依赖...
call npm install

echo.
echo [2/3] 开始打包...
call npm run build:win

echo.
echo [3/3] 打包完成！
echo.
echo 安装包位置: desktop-app\dist\infortune-ai-Setup-1.0.0.exe
echo.

pause
```

**使用方法**:
1. 将上面的代码保存为 `build-windows.bat`
2. 双击运行
3. 等待完成

---

## 🎯 快速验证

### 检查package.json

确认版本号正确：

```bash
cd desktop-app
type package.json | findstr "version"
```

应该显示: `"version": "1.0.0",`

---

### 测试打包结果

1. 找到生成的exe文件: `desktop-app\dist\infortune-ai-Setup-1.0.0.exe`
2. 双击安装测试
3. 运行应用确认功能正常

---

## 📋 打包前检查清单

- [ ] 已安装Node.js（检查: `node --version`）
- [ ] 已安装npm（检查: `npm --version`）
- [ ] package.json版本号正确
- [ ] 应用本地测试正常（`npm start`）
- [ ] 磁盘空间充足（至少3GB）

---

## ⚠️ 常见问题

### 问题1: 打包失败

**错误**: `electron-builder: command not found`

**解决**:
```bash
cd desktop-app
npm install --save-dev electron-builder
```

### 问题2: 打包很慢

**原因**: 需要下载Electron二进制文件（~150MB）

**解决**: 
- 等待首次下载完成
- 后续打包会使用缓存，速度更快

### 问题3: 杀毒软件误报

**现象**: 打包的exe被杀毒软件拦截

**解决**:
- 这是正常现象（未签名的exe）
- 添加到白名单
- 或获取代码签名证书

---

## 🚀 打包其他平台（参考）

### macOS打包（需要在Mac上）

```bash
cd desktop-app
npm install
npm run build:mac
```

**输出**: `infortune-ai-1.0.0.dmg`

### Linux打包（需要在Linux上或WSL）

```bash
cd desktop-app
npm install
npm run build:linux
```

**输出**: `infortune-ai-1.0.0.AppImage`

---

## 📤 打包完成后

### 下一步

1. **测试安装包** - 在干净的Windows系统上测试
2. **准备Release** - 按照 `RELEASE_GUIDE.md` 的说明
3. **上传到GitHub** - 创建Release并上传exe文件

### Release步骤

```bash
# 1. 访问
https://github.com/sjkncs/InFortune.ai-desktop/releases/new

# 2. 填写
Tag: v1.0.0-MVP
Title: In Fortune AI Desktop v1.0.0 - MVP首发版 🎉

# 3. 上传
拖拽 infortune-ai-Setup-1.0.0.exe 到附件区

# 4. 发布
点击 "Publish release"
```

---

## 💡 提示

- ✅ 首次打包会较慢，耐心等待
- ✅ 打包成功后文件约150MB
- ✅ 可以同时生成便携版和安装版
- ✅ 建议在虚拟机中测试安装包

---

**准备就绪？开始打包吧！** 🚀
