@echo off
chcp 65001 >nul
echo 🚀 正在启动 BaoStock API 服务...
cd /d "%~dp0"
python start.py
pause
