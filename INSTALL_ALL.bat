@echo off
chcp 65001 >nul
echo ========================================
echo   In Fortune AI - 一键安装所有依赖
echo   JiuCai AI - Install All Dependencies
echo ========================================
echo.

echo [1/4] 安装 Desktop App 依赖...
cd desktop-app
if exist node_modules (
    echo ✓ Desktop App 依赖已存在，跳过
) else (
    echo 正在安装...
    call npm install
    if %errorlevel% neq 0 (
        echo ✗ Desktop App 依赖安装失败
        pause
        exit /b 1
    )
    echo ✓ Desktop App 依赖安装完成
)
cd ..
echo.

echo [2/4] 安装 Website 依赖...
cd website
if exist node_modules (
    echo ✓ Website 依赖已存在，跳过
) else (
    echo 正在安装...
    call npm install
    if %errorlevel% neq 0 (
        echo ✗ Website 依赖安装失败
        pause
        exit /b 1
    )
    echo ✓ Website 依赖安装完成
)
cd ..
echo.

echo [3/4] 安装 Admin 依赖...
cd admin
if exist node_modules (
    echo ✓ Admin 依赖已存在，跳过
) else (
    echo 正在安装...
    call npm install
    if %errorlevel% neq 0 (
        echo ✗ Admin 依赖安装失败
        pause
        exit /b 1
    )
    echo ✓ Admin 依赖安装完成
)
cd ..
echo.

echo [4/4] 检查 Python 环境...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ✗ Python 未安装或未添加到 PATH
    echo   请访问 https://www.python.org/ 下载安装
) else (
    echo ✓ Python 环境正常
    echo.
    echo 提示: Python 依赖需要手动安装
    echo   cd akshare ^&^& pip install -r requirements.txt
    echo   cd baostock ^&^& pip install -r requirements.txt
)
echo.

echo ========================================
echo 安装完成！
echo ========================================
echo.
echo 下一步:
echo   1. 创建应用图标 (desktop-app/assets/)
echo   2. 配置环境变量 (参考 .env.example)
echo   3. 启动应用: cd desktop-app ^&^& npm start
echo.
pause
