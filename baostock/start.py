"""
BaoStock API 服务启动脚本
"""
import uvicorn
import sys

if __name__ == "__main__":
    # 默认在8001端口启动，避免与akshare冲突
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8001
    
    print(f"🚀 正在启动 BaoStock API 服务...")
    print(f"📡 服务地址: http://localhost:{port}")
    print(f"📚 API文档: http://localhost:{port}/docs")
    print(f"📖 备用文档: http://localhost:{port}/redoc")
    print("=" * 50)
    
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=port,
        reload=True,
        log_level="info"
    )
