"""
Phase 1: 基础设施搭建与验证
Infrastructure Setup and Validation

执行内容:
1. 验证Docker服务
2. 初始化数据库
3. 创建表结构和索引
4. 配置MLflow
5. 健康检查
"""

import asyncio
import subprocess
import time
from loguru import logger
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from data_layer.database_manager import db_manager


class InfrastructureSetup:
    """基础设施搭建"""
    
    def __init__(self):
        self.services = {
            'timescaledb': 5432,
            'mongodb': 27017,
            'redis': 6379,
            'mlflow': 5000
        }
    
    def check_docker(self):
        """检查Docker是否运行"""
        logger.info("Checking Docker status...")
        
        try:
            result = subprocess.run(
                ['docker', 'ps'],
                capture_output=True,
                text=True,
                timeout=10
            )
            
            if result.returncode == 0:
                logger.info("✅ Docker is running")
                return True
            else:
                logger.error("❌ Docker is not running")
                return False
                
        except Exception as e:
            logger.error(f"❌ Failed to check Docker: {e}")
            return False
    
    def start_services(self):
        """启动Docker服务"""
        logger.info("Starting Docker services...")
        
        try:
            # 检查docker-compose文件是否存在
            compose_file = 'docker-compose.research.yml'
            if not os.path.exists(compose_file):
                logger.warning(f"⚠️ {compose_file} not found, skipping service start")
                return False
            
            result = subprocess.run(
                ['docker-compose', '-f', compose_file, 'up', '-d'],
                capture_output=True,
                text=True,
                timeout=120
            )
            
            if result.returncode == 0:
                logger.info("✅ Services started successfully")
                logger.info("Waiting 30 seconds for services to initialize...")
                time.sleep(30)
                return True
            else:
                logger.error(f"❌ Failed to start services: {result.stderr}")
                return False
                
        except Exception as e:
            logger.error(f"❌ Exception while starting services: {e}")
            return False
    
    def check_service_health(self, service: str, port: int):
        """检查服务健康状态"""
        import socket
        
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(5)
            result = sock.connect_ex(('localhost', port))
            sock.close()
            
            if result == 0:
                logger.info(f"✅ {service} is healthy (port {port})")
                return True
            else:
                logger.error(f"❌ {service} is not responding (port {port})")
                return False
                
        except Exception as e:
            logger.error(f"❌ Failed to check {service}: {e}")
            return False
    
    async def initialize_databases(self):
        """初始化数据库"""
        logger.info("Initializing databases...")
        
        try:
            # 初始化TimescaleDB
            logger.info("Initializing TimescaleDB...")
            await db_manager.initialize_timescale()
            logger.info("✅ TimescaleDB initialized")
            
            # 初始化MongoDB
            logger.info("Initializing MongoDB...")
            db_manager.initialize_mongodb()
            logger.info("✅ MongoDB initialized")
            
            # 初始化Redis
            logger.info("Initializing Redis...")
            db_manager.initialize_redis()
            logger.info("✅ Redis initialized")
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize databases: {e}")
            return False
    
    async def create_sample_data(self):
        """创建示例数据用于测试"""
        logger.info("Creating sample data...")
        
        try:
            import pandas as pd
            import numpy as np
            from datetime import datetime, timedelta
            from data_layer.stock_data_service import stock_data_service
            
            # 生成测试数据
            dates = [datetime.now() - timedelta(days=i) for i in range(100, 0, -1)]
            
            test_stocks = ['000001.SZ', '000002.SZ', '600519.SH']
            
            for symbol in test_stocks:
                df = pd.DataFrame({
                    'time': dates,
                    'symbol': [symbol] * 100,
                    'open': np.random.randn(100).cumsum() + 100,
                    'high': np.random.randn(100).cumsum() + 102,
                    'low': np.random.randn(100).cumsum() + 98,
                    'close': np.random.randn(100).cumsum() + 100,
                    'volume': np.random.randint(1000000, 10000000, 100),
                    'amount': np.random.randint(100000000, 1000000000, 100)
                })
                
                await stock_data_service.insert_stock_prices(df)
                logger.info(f"✅ Created sample data for {symbol}")
            
            logger.info("✅ Sample data created successfully")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to create sample data: {e}")
            return False
    
    def create_directories(self):
        """创建必要的目录"""
        logger.info("Creating project directories...")
        
        directories = [
            'outputs',
            'checkpoints',
            'logs',
            'data',
            'experiments',
            'models'
        ]
        
        for dir_name in directories:
            os.makedirs(dir_name, exist_ok=True)
            logger.info(f"✅ Created directory: {dir_name}/")
        
        return True
    
    async def run_phase1(self):
        """运行Phase 1完整流程"""
        logger.info("=" * 60)
        logger.info("Starting Phase 1: Infrastructure Setup")
        logger.info("=" * 60)
        
        success_count = 0
        total_steps = 7
        
        # Step 1: 检查Docker
        if self.check_docker():
            success_count += 1
        else:
            logger.warning("⚠️ Docker not available, some features may not work")
        
        # Step 2: 启动服务
        if self.start_services():
            success_count += 1
            
            # Step 3: 检查服务健康
            for service, port in self.services.items():
                if self.check_service_health(service, port):
                    success_count += 1
        else:
            logger.warning("⚠️ Services not started, will use local configuration")
        
        # Step 4: 创建目录
        if self.create_directories():
            success_count += 1
        
        # Step 5: 初始化数据库
        if await self.initialize_databases():
            success_count += 1
        
        # Step 6: 创建示例数据
        if await self.create_sample_data():
            success_count += 1
        
        # 清理
        await db_manager.close_all()
        
        # 总结
        logger.info("=" * 60)
        logger.info(f"Phase 1 Complete: {success_count}/{total_steps} steps successful")
        logger.info("=" * 60)
        
        if success_count >= total_steps * 0.8:  # 80%成功率
            logger.info("✅ Phase 1 infrastructure setup complete!")
            return True
        else:
            logger.error("❌ Phase 1 setup incomplete, please check errors above")
            return False


if __name__ == "__main__":
    setup = InfrastructureSetup()
    result = asyncio.run(setup.run_phase1())
    
    if result:
        print("\n✅ Phase 1 完成！可以继续 Phase 2")
        print("运行: python scripts/phase2_data_preparation.py")
    else:
        print("\n❌ Phase 1 未完全成功，请检查日志")
    
    sys.exit(0 if result else 1)
