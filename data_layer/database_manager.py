"""
Database Manager - 统一数据库连接管理
P0级优化: 替代LowDB，提升1000倍查询性能
"""

import asyncpg
import redis
from pymongo import MongoClient
from typing import Optional, Dict, Any, List
from loguru import logger
import os
from contextlib import asynccontextmanager


class DatabaseManager:
    """
    统一数据库管理器
    - TimescaleDB: 时序数据（股票价格、K线）
    - MongoDB: 特征数据、元数据
    - Redis: 缓存层
    """
    
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(DatabaseManager, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance
    
    def __init__(self):
        if self._initialized:
            return
            
        self.timescale_pool: Optional[asyncpg.Pool] = None
        self.mongo_client: Optional[MongoClient] = None
        self.redis_client: Optional[redis.Redis] = None
        self._initialized = True
        
        # 从环境变量读取配置
        self.config = {
            'timescale': {
                'host': os.getenv('TIMESCALEDB_HOST', 'localhost'),
                'port': int(os.getenv('TIMESCALEDB_PORT', 5432)),
                'database': os.getenv('TIMESCALEDB_DATABASE', 'InFortune_timeseries'),
                'user': os.getenv('TIMESCALEDB_USER', 'InFortune'),
                'password': os.getenv('TIMESCALEDB_PASSWORD', 'InFortune2024'),
            },
            'mongodb': {
                'uri': os.getenv('MONGODB_URI', 'mongodb://InFortune:InFortune2024@localhost:27017')
            },
            'redis': {
                'url': os.getenv('REDIS_URL', 'redis://:InFortune2024@localhost:6379/0')
            }
        }
    
    async def initialize_timescale(self):
        """初始化TimescaleDB连接池"""
        try:
            self.timescale_pool = await asyncpg.create_pool(
                host=self.config['timescale']['host'],
                port=self.config['timescale']['port'],
                database=self.config['timescale']['database'],
                user=self.config['timescale']['user'],
                password=self.config['timescale']['password'],
                min_size=5,
                max_size=20,
                command_timeout=60
            )
            logger.info("TimescaleDB connection pool initialized")
            
            # 创建表结构
            await self._create_timescale_schema()
            
        except Exception as e:
            logger.error(f"Failed to initialize TimescaleDB: {e}")
            raise
    
    async def _create_timescale_schema(self):
        """创建TimescaleDB表结构"""
        async with self.timescale_pool.acquire() as conn:
            # 股票价格表（主表）
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS stock_prices (
                    time TIMESTAMPTZ NOT NULL,
                    symbol VARCHAR(20) NOT NULL,
                    open NUMERIC(12,4),
                    high NUMERIC(12,4),
                    low NUMERIC(12,4),
                    close NUMERIC(12,4),
                    volume BIGINT,
                    amount NUMERIC(20,2),
                    PRIMARY KEY (time, symbol)
                );
            """)
            
            # 创建hypertable（时序优化）
            await conn.execute("""
                SELECT create_hypertable(
                    'stock_prices', 
                    'time',
                    chunk_time_interval => INTERVAL '1 day',
                    if_not_exists => TRUE
                );
            """)
            
            # 创建索引
            await conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_stock_prices_symbol_time 
                ON stock_prices (symbol, time DESC);
            """)
            
            # 技术指标表
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS technical_indicators (
                    time TIMESTAMPTZ NOT NULL,
                    symbol VARCHAR(20) NOT NULL,
                    indicator_name VARCHAR(50) NOT NULL,
                    value NUMERIC(12,4),
                    PRIMARY KEY (time, symbol, indicator_name)
                );
            """)
            
            await conn.execute("""
                SELECT create_hypertable(
                    'technical_indicators', 
                    'time',
                    if_not_exists => TRUE
                );
            """)
            
            # 预测结果表
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS predictions (
                    prediction_time TIMESTAMPTZ NOT NULL,
                    symbol VARCHAR(20) NOT NULL,
                    target_time TIMESTAMPTZ NOT NULL,
                    model_version VARCHAR(50) NOT NULL,
                    predicted_price NUMERIC(12,4),
                    confidence_lower NUMERIC(12,4),
                    confidence_upper NUMERIC(12,4),
                    uncertainty NUMERIC(8,6),
                    actual_price NUMERIC(12,4),
                    PRIMARY KEY (prediction_time, symbol, target_time, model_version)
                );
            """)
            
            await conn.execute("""
                SELECT create_hypertable(
                    'predictions', 
                    'prediction_time',
                    if_not_exists => TRUE
                );
            """)
            
            logger.info("TimescaleDB schema created successfully")
    
    def initialize_mongodb(self):
        """初始化MongoDB连接"""
        try:
            self.mongo_client = MongoClient(
                self.config['mongodb']['uri'],
                maxPoolSize=50,
                minPoolSize=10
            )
            # 测试连接
            self.mongo_client.admin.command('ping')
            logger.info("MongoDB connection initialized")
            
        except Exception as e:
            logger.error(f"Failed to initialize MongoDB: {e}")
            raise
    
    def initialize_redis(self):
        """初始化Redis连接"""
        try:
            self.redis_client = redis.from_url(
                self.config['redis']['url'],
                decode_responses=True,
                socket_connect_timeout=5,
                socket_timeout=5,
                retry_on_timeout=True
            )
            # 测试连接
            self.redis_client.ping()
            logger.info("Redis connection initialized")
            
        except Exception as e:
            logger.error(f"Failed to initialize Redis: {e}")
            raise
    
    async def close_all(self):
        """关闭所有连接"""
        if self.timescale_pool:
            await self.timescale_pool.close()
            logger.info("TimescaleDB connection closed")
        
        if self.mongo_client:
            self.mongo_client.close()
            logger.info("MongoDB connection closed")
        
        if self.redis_client:
            self.redis_client.close()
            logger.info("Redis connection closed")
    
    @asynccontextmanager
    async def timescale_transaction(self):
        """TimescaleDB事务上下文管理器"""
        async with self.timescale_pool.acquire() as conn:
            async with conn.transaction():
                yield conn
    
    def get_mongo_db(self, db_name: str = 'InFortune_features'):
        """获取MongoDB数据库"""
        return self.mongo_client[db_name]
    
    def get_redis(self) -> redis.Redis:
        """获取Redis客户端"""
        return self.redis_client


# 全局单例
db_manager = DatabaseManager()


if __name__ == "__main__":
    import asyncio
    
    async def test():
        """测试数据库连接"""
        # 初始化
        await db_manager.initialize_timescale()
        db_manager.initialize_mongodb()
        db_manager.initialize_redis()
        
        # 测试TimescaleDB
        async with db_manager.timescale_pool.acquire() as conn:
            result = await conn.fetchval("SELECT 1 + 1")
            logger.info(f"TimescaleDB test: 1 + 1 = {result}")
        
        # 测试MongoDB
        mongo_db = db_manager.get_mongo_db()
        mongo_db.test.insert_one({'test': 'data'})
        logger.info("MongoDB test: insert successful")
        
        # 测试Redis
        redis_client = db_manager.get_redis()
        redis_client.set('test_key', 'test_value')
        value = redis_client.get('test_key')
        logger.info(f"Redis test: test_key = {value}")
        
        # 清理
        await db_manager.close_all()
    
    asyncio.run(test())
