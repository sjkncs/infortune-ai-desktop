"""
AKShare API 服务启动脚本
"""
import uvicorn

if __name__ == "__main__":
    print("正在启动 AKShare API 服务...")
    print("API 文档地址: http://localhost:8000/docs")
    print("API 地址: http://localhost:8000")
    
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=8000,
        reload=True,  # 开发模式，代码修改后自动重启
        log_level="info"
    )
