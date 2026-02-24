@echo off
chcp 65001 >nul
echo ========================================
echo   In Fortune AI - 启动所有服务
echo   JiuCai AI - Start All Services
echo ========================================
echo.
echo 此脚本将同时启动：
echo   [1] Desktop App (桌面应用)
echo   [2] Website (Web端)
echo   [3] AkShare API (数据服务)
echo.
echo 警告: 这将打开多个终端窗口
echo.
pause
echo.

echo 正在启动服务...
echo.

REM 启动 Desktop App
start "In Fortune AI - Desktop App" cmd /k "cd desktop-app && npm start"

REM 等待1秒
timeout /t 1 /nobreak >nul

REM 启动 Website
start "In Fortune AI - Website" cmd /k "cd website && npm run dev"

REM 等待1秒
timeout /t 1 /nobreak >nul

REM 启动 AkShare 服务
start "In Fortune AI - AkShare API" cmd /k "cd akshare && python app.py"

echo.
echo ========================================
echo 所有服务已在独立窗口中启动！
echo ========================================
echo.
echo 访问地址:
echo   Desktop App: 将自动打开窗口
echo   Website: http://localhost:5173
echo   AkShare API: http://localhost:8001
echo.
echo 按任意键关闭此窗口...
pause >nul
