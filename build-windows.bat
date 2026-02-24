@echo off
chcp 65001 >nul
echo ========================================
echo In Fortune AI Desktop Windows打包工具
echo ========================================
echo.
echo 📦 开始打包...
echo.

cd desktop-app

echo [1/3] 检查依赖...
if not exist "node_modules" (
    echo 正在安装依赖...
    call npm install
) else (
    echo ✅ 依赖已安装
)

echo.
echo [2/3] 开始打包 Windows 应用...
echo ⏳ 预计耗时: 5-10 分钟
echo 📥 首次打包需要下载 Electron (~150MB)
echo.

call npm run build:win

echo.
if errorlevel 1 (
    echo ❌ 打包失败！请检查错误信息
    pause
    exit /b 1
)

echo ========================================
echo ✅ 打包完成！
echo ========================================
echo.
echo 📁 安装包位置:
echo    desktop-app\dist\In Fortune AI Setup 1.0.0.exe
echo.
echo 📊 文件大小: 约 150-180 MB
echo.
echo 🎯 下一步:
echo    1. 测试安装包
echo    2. 创建 GitHub Release
echo    3. 上传安装包
echo.
echo 📚 详细说明请查看: RELEASE_GUIDE.md
echo.

pause
