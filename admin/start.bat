@echo off
chcp 65001 >nul
echo ==========================================
echo    In Fortune AI 管理后台启动脚本
echo ==========================================
echo.

REM 检查 website 后端是否运行
echo [1/2] 正在检查后端服务...
curl -s http://localhost:3001/api/health >nul 2>&1
if errorlevel 1 (
    echo [!] 警告: 未检测到后端服务运行
    echo     请先启动 website 后端: cd ../website && npm run server
    echo.
    choice /C YN /M "是否继续启动管理后台"
    if errorlevel 2 exit /b 1
) else (
    echo [✓] 后端服务运行正常
)

echo.
echo [2/2] 正在启动管理后台...
echo     访问地址: http://localhost:5174
echo.

npm run dev
