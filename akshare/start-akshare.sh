#!/bin/bash

echo "=========================================="
echo "   AKShare Python API 服务启动脚本"
echo "=========================================="
echo ""

cd "$(dirname "$0")/akshare"

# 检查虚拟环境
if [ -d "venv" ]; then
    echo "[1/3] 正在激活虚拟环境..."
    source venv/bin/activate
else
    echo "[1/3] 虚拟环境不存在，正在创建..."
    python3 -m venv venv
    source venv/bin/activate
    echo "[2/3] 正在安装依赖..."
    pip install -r requirements.txt
fi

echo ""
echo "[3/3] 正在启动 AKShare API 服务..."
echo ""
echo "=========================================="
echo "  服务地址: http://localhost:8000"
echo "  API 文档: http://localhost:8000/docs"
echo "=========================================="
echo ""
echo "按 Ctrl+C 停止服务"
echo ""

python start.py
