"""
BaoStock HTTP API Service
基于 BaoStock 官方Python API的完整API服务

根据 BaoStock 官方文档 (http://www.baostock.com) 重新实现
"""

from baostock.data.resultset import ResultData
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, Any, Literal
from datetime import datetime, timedelta
from enum import Enum
import baostock as bs
import uvicorn
import logging
import json
import os
import requests

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ==================== BaoStock 登录 ====================

class BaoStockClient:
    """BaoStock 客户端封装"""
    _instance = None
    _logged_in = False
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def login(self):
        """登录 BaoStock"""
        if not self._logged_in:
            lg = bs.login()
            if lg.error_code != '0':
                logger.error(f"BaoStock 登录失败: {lg.error_msg}")
                return False
            self._logged_in = True
            logger.info(f"BaoStock 登录成功")
        return True
    
    def logout(self):
        """登出 BaoStock"""
        if self._logged_in:
            bs.logout()
            self._logged_in = False
            logger.info("BaoStock 已登出")

# 创建全局客户端实例
bs_client = BaoStockClient()

# ==================== Pydantic 模型定义 ====================

class Frequency(str, Enum):
    """K线频率"""
    DAY = "d"           # 日K线
    WEEK = "w"          # 周K线
    MONTH = "m"         # 月K线
    MIN5 = "5"          # 5分钟
    MIN15 = "15"        # 15分钟
    MIN30 = "30"        # 30分钟
    MIN60 = "60"        # 60分钟

class APIResponse(BaseModel):
    """通用API响应模型"""
    success: bool = Field(..., description="请求是否成功")
    message: str = Field(default="", description="响应消息")
    type: str = Field(default="", description="数据来源类型")
    data: Any = Field(default=None, description="响应数据")

# ==================== FastAPI 应用 ====================

# 定义中文标签元数据
tags_metadata = [
    {"name": "基础数据", "description": "证券基本资料、证券代码查询"},
    {"name": "K线数据", "description": "历史行情数据、指数K线"},
    {"name": "财务数据", "description": "季频财务数据（盈利能力、营运能力等）"},
    {"name": "宏观数据", "description": "宏观经济数据"},
    {"name": "板块数据", "description": "行业分类、指数成分股"},
    {"name": "其他数据", "description": "除权除息、复权因子、公司报告"},
]

app = FastAPI(
    title="BaoStock API Service",
    description="基于 BaoStock 官方Python API的完整API服务",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_tags=tags_metadata
)

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==================== 启动和关闭事件 ====================

@app.on_event("startup")
async def startup_event():
    """应用启动时登录 BaoStock"""
    logger.info("正在启动 BaoStock API 服务...")
    if not bs_client.login():
        logger.error("BaoStock 登录失败，部分功能可能无法使用")

@app.on_event("shutdown")
async def shutdown_event():
    """应用关闭时登出 BaoStock"""
    logger.info("正在关闭 BaoStock API 服务...")
    bs_client.logout()

# ==================== 工具函数 ====================

def get_default_dates(days: int = 365) -> tuple:
    """获取默认日期范围"""
    end_date = datetime.now().strftime("%Y-%m-%d")
    start_date = (datetime.now() - timedelta(days=days)).strftime("%Y-%m-%d")
    return start_date, end_date

def get_default_year_quarter() -> tuple:
    """获取默认年份和季度"""
    now = datetime.now()
    year = now.year
    month = now.month
    quarter = (month - 1) // 3 or 4
    if quarter == 4 and month < 4:
        year -= 1
    return year, quarter

def convert_to_float(value):
    """将字符串转换为浮点数，处理空值"""
    if value and value != "":
        try:
            return float(value)
        except (ValueError, TypeError):
            return None
    return None

def convert_to_int(value):
    """将字符串转换为整数，处理空值"""
    if value and value != "":
        try:
            return int(float(value))
        except (ValueError, TypeError):
            return None
    return None

def save_stocks_to_database(stocks_data, query_date=None):
    """将股票列表数据保存到baostock/data/stock_list.json文件"""
    try:
        # 确保data目录存在
        data_dir = "data"
        if not os.path.exists(data_dir):
            os.makedirs(data_dir)
        
        # 构建要保存的数据格式
        save_data = {
            "stocks": stocks_data,
            "query_date": query_date or datetime.now().strftime("%Y-%m-%d"),
            "update_time": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "count": len(stocks_data)
        }
        
        # 保存到stock_list.json文件
        filepath = os.path.join(data_dir, "stock_list.json")
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(save_data, f, ensure_ascii=False, indent=2)
        
        logger.info(f"✅ 成功保存股票数据到 {filepath}，共{len(stocks_data)}条记录")
        logger.info(f"📅 查询日期: {save_data['query_date']}")
        logger.info(f"⏰ 更新时间: {save_data['update_time']}")
        
        return True
            
    except Exception as e:
        logger.error(f"保存股票数据到文件时出错: {str(e)}")
    
    return False

def save_etfs_to_database(etfs_data, query_date=None):
    """将ETF列表数据保存到baostock/data/etf_list.json文件"""
    try:
        # 确保data目录存在
        data_dir = "data"
        if not os.path.exists(data_dir):
            os.makedirs(data_dir)
        
        # 构建要保存的数据格式
        save_data = {
            "etfs": etfs_data,
            "query_date": query_date or datetime.now().strftime("%Y-%m-%d"),
            "update_time": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "count": len(etfs_data)
        }
        
        # 保存到etf_list.json文件
        filepath = os.path.join(data_dir, "etf_list.json")
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(save_data, f, ensure_ascii=False, indent=2)
        
        logger.info(f"✅ 成功保存ETF数据到 {filepath}，共{len(etfs_data)}条记录")
        logger.info(f"📅 查询日期: {save_data['query_date']}")
        logger.info(f"⏰ 更新时间: {save_data['update_time']}")
        
        return True
    
    except Exception as e:
        logger.error(f"保存ETF数据失败: {str(e)}")
        return False

def get_etfs_from_local_file():
    """从本地文件获取ETF数据"""
    try:
        filepath = "data/etf_list.json"
        if not os.path.exists(filepath):
            return None
        
        with open(filepath, 'r', encoding='utf-8') as f:
            file_data = json.load(f)
        
        # 检查文件内容是否有效
        if not file_data or not isinstance(file_data, dict):
            return None
        
        etfs = file_data.get('etfs', [])
        if not etfs or not isinstance(etfs, list) or len(etfs) == 0:
            return None
        
        return etfs
        
    except Exception as e:
        logger.warning(f"读取本地ETF数据文件失败: {str(e)}")
        return None

async def save_etfs_to_database_async(etfs_data, query_date=None):
    """异步保存ETF数据到数据库"""
    import asyncio
    await asyncio.sleep(0)  # 让出控制权
    save_etfs_to_database(etfs_data, query_date)

async def update_etf_quote_in_cache(etf_code, quote_data):
    """异步更新缓存文件中特定ETF的行情数据"""
    try:
        # 读取当前缓存文件
        filepath = "data/etf_list.json"
        if not os.path.exists(filepath):
            return
        
        with open(filepath, 'r', encoding='utf-8') as f:
            file_data = json.load(f)
        
        # 查找并更新对应的ETF行情数据
        etfs = file_data.get('etfs', [])
        updated = False
        for etf in etfs:
            if etf.get("code") == etf_code:
                etf["quote"] = quote_data
                updated = True
                break
        
        if updated:
            # 更新文件更新时间
            file_data['update_time'] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            
            # 保存更新后的文件
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(file_data, f, ensure_ascii=False, indent=2)
            
            logger.info(f"✅ 已更新ETF {etf_code} 的行情数据到缓存文件")
        
    except Exception as e:
        logger.warning(f"更新ETF {etf_code} 行情数据到缓存失败: {str(e)}")

def save_stocks_to_local_file(stocks_data, query_date=None):
    """将股票列表数据保存到本地JSON文件作为备份"""
    try:
        backup_dir = "stock_data_backup"
        if not os.path.exists(backup_dir):
            os.makedirs(backup_dir)
        
        date_str = query_date or datetime.now().strftime("%Y-%m-%d")
        filename = f"stocks_{date_str}.json"
        filepath = os.path.join(backup_dir, filename)
        
        backup_data = {
            "stocks": stocks_data,
            "query_date": date_str,
            "update_time": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "count": len(stocks_data)
        }
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(backup_data, f, ensure_ascii=False, indent=2)
        
        logger.info(f"股票数据已备份到本地文件: {filepath}")
        return True
        
    except Exception as e:
        logger.error(f"保存股票数据到本地文件失败: {str(e)}")
        return False

# ==================== 根路由 ====================

@app.get("/")
async def root():
    """根路由，返回API信息"""
    return {
        "service": "BaoStock API Service",
        "version": "1.0.0",
        "docs": "/docs",
        "redoc": "/redoc"
    }

# ==================== 1. 基础数据接口 ====================

@app.get("/api/stock/basic", response_model=APIResponse, tags=["基础数据"], summary="获取证券基本资料")
async def get_stock_basic(
    code: Optional[str] = Query(None, description="股票代码，如 sh.600000"),
    code_name: Optional[str] = Query(None, description="股票名称，支持模糊查询")
):
    """
    获取证券基本资料
    
    基于 BaoStock query_stock_basic() 接口
    
    官方文档：query_stock_basic(code=None, code_name=None) 获取证券基本资料
    - code: 证券代码
    - code_name: 证券名称
    - ipoDate: 上市日期
    - outDate: 退市日期
    - type: 证券类型（1:股票，2:指数，3:其它，4:可转债，5:ETF）
    - status: 上市状态（1:上市，0:退市）
    """
    try:
        rs = bs.query_stock_basic(code=code, code_name=code_name)
        if rs.error_code != '0':
            raise HTTPException(status_code=500, detail=f"获取证券基本资料失败: {rs.error_msg}")
        
        data = []
        while (rs.error_code == '0') & rs.next():
            row = rs.get_row_data()
            data.append({
                "code": row[0],
                "code_name": row[1],
                "ipoDate": row[2],
                "outDate": row[3] if len(row) > 3 else None,
                "type": row[4] if len(row) > 4 else None,
                "status": row[5] if len(row) > 5 else None
            })
        
        return APIResponse(success=True, data={"count": len(data), "stocks": data})
    except Exception as e:
        logger.error(f"获取证券基本资料失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"获取证券基本资料失败: {str(e)}")



@app.get("/api/etf/list", response_model=APIResponse, tags=["基础数据"], summary="获取ETF列表")
async def get_etf_list(
    page: int = Query(1, ge=1, description="页码，从1开始"),
    page_size: int = Query(100, ge=1, le=200, description="每页数量，最大200"),
    include_quote: bool = Query(True, description="是否包含实时行情数据"),
    save_to_db: bool = Query(True, description="是否保存到数据库")
):
    """
    获取ETF列表（支持分页）
    
    基于 BaoStock query_stock_basic() 接口，通过code_name="ETF"模糊搜索获取ETF数据
    
    返回字段：
    - code: 证券代码
    - code_name: 证券名称
    - ipoDate: 上市日期
    - outDate: 退市日期
    - type: 证券类型（1:股票，2:指数，3:其它，4:可转债，5:ETF）
    - status: 上市状态（1:上市，0:退市）
    - quote: 实时行情数据（可选）
    """
    try:
        # 首先尝试从本地文件获取数据
        local_etfs = get_etfs_from_local_file()
        
        if local_etfs:
            # 如果本地文件有数据，直接返回
            logger.info(f"使用本地文件数据，共{len(local_etfs)}条记录")
            
            total = len(local_etfs)
            start_idx = (page - 1) * page_size
            end_idx = start_idx + page_size
            paginated_etfs = local_etfs[start_idx:end_idx]
            
            # 如果需要实时行情数据，为当前页的ETF获取行情
            if include_quote and paginated_etfs:
                today = datetime.now().strftime("%Y-%m-%d")
                for etf in paginated_etfs:
                    # 先检查缓存中是否有quote数据，如果有且日期是今天，则直接使用
                    if etf.get("quote") and etf["quote"].get("date") == today:
                        # 使用缓存中的今日行情数据
                        logger.info(f"使用缓存行情数据: {etf['code']}")
                        continue
                    
                    # 如果没有今日行情或需要更新，则重新获取
                    try:
                        # 获取最新行情数据
                        quote_rs = bs.query_history_k_data_plus(
                            etf["code"],
                            "date,code,open,high,low,close,preclose,volume,amount,pctChg",
                            start_date=today,
                            end_date=today,
                            frequency="d",
                            adjustflag="3"
                        )
                        
                        if quote_rs.error_code == '0' and quote_rs.next():
                            row = quote_rs.get_row_data()
                            etf["quote"] = {
                                "date": row[0],
                                "open": convert_to_float(row[2]),
                                "high": convert_to_float(row[3]),
                                "low": convert_to_float(row[4]),
                                "close": convert_to_float(row[5]),
                                "preclose": convert_to_float(row[6]),
                                "volume": convert_to_int(row[7]),
                                "amount": convert_to_float(row[8]),
                                "pctChg": convert_to_float(row[9])
                            }
                            # 异步更新缓存文件中的行情数据
                            import asyncio
                            asyncio.create_task(update_etf_quote_in_cache(etf["code"], etf["quote"]))
                        else:
                            # 如果获取失败，保留缓存中的历史行情数据
                            if not etf.get("quote"):
                                etf["quote"] = None
                            else:
                                # 保留缓存中的历史行情数据，但添加过期标记
                                logger.info(f"使用缓存历史行情数据: {etf['code']}")
                    except Exception as e:
                        logger.warning(f"获取ETF {etf['code']} 行情失败: {str(e)}")
                        # 获取失败时保留缓存中的历史行情数据
                        if not etf.get("quote"):
                            etf["quote"] = None
                        else:
                            # 保留缓存中的历史行情数据
                            logger.info(f"使用缓存历史行情数据: {etf['code']}")
            
            return APIResponse(
                success=True, 
                message="获取ETF列表成功",
                type="本地文件数据",
                data={
                    "total": total,
                    "page": page,
                    "page_size": page_size,
                    "total_pages": (total + page_size - 1) // page_size,
                    "etfs": paginated_etfs
                }
            )
        
        # 如果本地文件没有数据，实时调用API
        rs = bs.query_stock_basic(code_name="ETF")
        if rs.error_code != '0':
            raise HTTPException(status_code=500, detail=f"获取ETF列表失败: {rs.error_msg}")
        
        etf_list = []
        while (rs.error_code == '0') & rs.next():
            row = rs.get_row_data()
            etf_list.append({
                "code": row[0],
                "code_name": row[1],
                "ipoDate": row[2],
                "outDate": row[3] if len(row) > 3 else None,
                "type": row[4] if len(row) > 4 else None,
                "status": row[5] if len(row) > 5 else None
            })
        
        total = len(etf_list)
        
        # 分页处理
        start_idx = (page - 1) * page_size
        end_idx = start_idx + page_size
        paginated_etfs = etf_list[start_idx:end_idx]
        
        # 如果需要实时行情数据，批量获取
        if include_quote and paginated_etfs:
            # 获取今天的日期
            today = datetime.now().strftime("%Y-%m-%d")
            
            for etf in paginated_etfs:
                try:
                    # 获取最新行情数据
                    quote_rs = bs.query_history_k_data_plus(
                        etf["code"],
                        "date,code,open,high,low,close,preclose,volume,amount,pctChg",
                        start_date=today,
                        end_date=today,
                        frequency="d",
                        adjustflag="3"
                    )
                    
                    if quote_rs.error_code == '0' and quote_rs.next():
                        row = quote_rs.get_row_data()
                        etf["quote"] = {
                            "date": row[0],
                            "open": convert_to_float(row[2]),
                            "high": convert_to_float(row[3]),
                            "low": convert_to_float(row[4]),
                            "close": convert_to_float(row[5]),
                            "preclose": convert_to_float(row[6]),
                            "volume": convert_to_int(row[7]),
                            "amount": convert_to_float(row[8]),
                            "pctChg": convert_to_float(row[9])
                        }
                    else:
                        # 尝试获取最近一个交易日的数据
                        yesterday = (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d")
                        quote_rs = bs.query_history_k_data_plus(
                            etf["code"],
                            "date,code,open,high,low,close,preclose,volume,amount,pctChg",
                            start_date=yesterday,
                            end_date=today,
                            frequency="d",
                            adjustflag="3"
                        )
                        if quote_rs.error_code == '0':
                            data_rows = []
                            while quote_rs.next():
                                data_rows.append(quote_rs.get_row_data())
                            if data_rows:
                                latest = data_rows[-1]
                                etf["quote"] = {
                                    "date": latest[0],
                                    "open": convert_to_float(latest[2]),
                                    "high": convert_to_float(latest[3]),
                                    "low": convert_to_float(latest[4]),
                                    "close": convert_to_float(latest[5]),
                                    "preclose": convert_to_float(latest[6]),
                                    "volume": convert_to_int(latest[7]),
                                    "amount": convert_to_float(latest[8]),
                                    "pctChg": convert_to_float(latest[9])
                                }
                except Exception as e:
                    logger.warning(f"获取ETF {etf['code']} 行情失败: {str(e)}")
                    etf["quote"] = None
        
        # 如果启用了数据库保存，异步保存数据
        if save_to_db and etf_list:
            import asyncio
            asyncio.create_task(save_etfs_to_database_async(etf_list))
        
        return APIResponse(
            success=True, 
            message="获取ETF列表成功",
            type="实时API数据",
            data={
                "total": total,
                "page": page,
                "page_size": page_size,
                "total_pages": (total + page_size - 1) // page_size,
                "etfs": paginated_etfs
            }
        )
    except Exception as e:
        logger.error(f"获取ETF列表失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"获取ETF列表失败: {str(e)}")

@app.get("/api/stock/list", response_model=APIResponse, tags=["基础数据"], summary="获取证券代码列表")
async def get_stock_list(
    date: Optional[str] = Query(None, description="查询日期 YYYY-MM-DD（默认今日）"),
    save_to_db: bool = Query(True, description="是否保存到数据库")
):
    """
    获取证券代码列表
    
    基于 BaoStock query_all_stock() 接口
    
    官方文档：query_all_stock(day=None) 获取指定日期所有证券列表
    - code: 证券代码
    - code_name: 证券名称
    - tradeStatus: 交易状态(1:正常交易 0:停牌)
    """
    try:
        # 首先尝试从本地文件获取数据
        local_stocks = get_stocks_from_local_file()
        
        if local_stocks:
            # 如果本地文件有数据，直接返回
            logger.info(f"使用本地文件数据，共{len(local_stocks)}条记录")
            return APIResponse(success=True, message="获取证券列表成功", type="本地文件数据", data={"count": len(local_stocks), "stocks": local_stocks})
        
        # 如果没有传入日期，获取上一个交易日
        query_date = date
        if query_date is None:
            previous_trading_day = get_previous_trading_day()
            if previous_trading_day:
                query_date = previous_trading_day
                logger.info(f"未传入日期，使用上一个交易日: {query_date}")
            else:
                logger.warning("无法获取上一个交易日，使用今日日期")
                query_date = datetime.now().strftime("%Y-%m-%d")
        
        # 如果本地文件没有数据，实时调用API
        rs = bs.query_all_stock(day=query_date)
        if rs.error_code != '0':
            raise HTTPException(status_code=500, detail=f"获取证券列表失败: {rs.error_msg}")
        
        data = []
        while (rs.error_code == '0') & rs.next():
            row = rs.get_row_data()
            data.append({
                "code": row[0],
                "tradeStatus": row[1] if len(row) > 1 else "",
                "code_name": row[2] if len(row) > 2 else ""
            })
        
        # 如果启用了数据库保存，异步保存数据
        if save_to_db and data:
            import asyncio
            asyncio.create_task(save_stocks_to_database_async(data, query_date))
        
        return APIResponse(success=True, message="获取证券列表成功", type="实时API数据", data={"count": len(data), "stocks": data, "query_date": query_date})
    except Exception as e:
        logger.error(f"获取证券列表失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"获取证券列表失败: {str(e)}")

def get_stocks_from_local_file():
    """从本地文件获取股票数据"""
    try:
        filepath = "data/stock_list.json"
        if not os.path.exists(filepath):
            return None
        
        with open(filepath, 'r', encoding='utf-8') as f:
            file_data = json.load(f)
        
        # 检查文件内容是否有效
        if not file_data or not isinstance(file_data, dict):
            return None
        
        stocks = file_data.get('stocks', [])
        if not stocks or not isinstance(stocks, list) or len(stocks) == 0:
            return None
        
        return stocks
        
    except Exception as e:
        logger.warning(f"读取本地股票数据文件失败: {str(e)}")
        return None

async def save_stocks_to_database_async(stocks_data, query_date=None):
    """异步保存股票数据到数据库"""
    import asyncio
    await asyncio.sleep(0)  # 让出控制权
    save_stocks_to_database(stocks_data, query_date)

def get_previous_trading_day():
    """获取上一个交易日"""
    try:
        # 获取最近7天的交易日历
        end_date = datetime.now().strftime("%Y-%m-%d")
        start_date = (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d")
        
        rs = bs.query_trade_dates(start_date=start_date, end_date=end_date)
        if rs.error_code != '0':
            logger.warning(f"获取交易日历失败: {rs.error_msg}")
            return None
        
        # 获取所有交易日并排序
        trading_days = []
        while (rs.error_code == '0') & rs.next():
            row = rs.get_row_data()
            if row[1] == '1':  # 交易日
                trading_days.append(row[0])
        
        # 按日期排序，获取最后一个交易日（上一个交易日）
        if trading_days:
            trading_days.sort(reverse=True)
            # 排除今天（如果今天是交易日），取下一个交易日
            today = datetime.now().strftime("%Y-%m-%d")
            if trading_days[0] == today:
                if len(trading_days) > 1:
                    return trading_days[1]
                else:
                    return today
            else:
                return trading_days[0]
        
        logger.warning("在最近7天内未找到交易日")
        return None
        
    except Exception as e:
        logger.error(f"获取上一个交易日失败: {str(e)}")
        return None

# ==================== 2. K线数据接口 ====================

@app.get("/api/kline/history", response_model=APIResponse, tags=["K线数据"], summary="获取历史K线数据")
async def get_history_kline(
    code: str = Query(..., description="股票代码，如 sh.600000"),
    start_date: Optional[str] = Query(None, description="开始日期 YYYY-MM-DD"),
    end_date: Optional[str] = Query(None, description="结束日期 YYYY-MM-DD"),
    frequency: Frequency = Query(Frequency.DAY, description="K线频率"),
    adjustflag: str = Query("3", description="复权类型(1:后复权 2:前复权 3:不复权)"),
    fields: Optional[str] = Query(None, description="查询字段，逗号分隔")
):
    """
    获取历史K线数据
    
    基于 BaoStock query_history_k_data_plus() 接口
    
    官方文档：query_history_k_data_plus() 获取历史K线数据
    - 支持日K、周K、月K以及分钟级K线数据
    - 支持前复权、后复权、不复权
    - 支持自定义查询字段
    
    常用字段：
    - date,code,open,high,low,close,volume,amount,adjustflag
    - preclose,volume,amount,turn,tradestatus,pctChg,peTTM,pbMRQ,psTTM
    """
    if end_date is None:
        end_date = datetime.now().strftime("%Y-%m-%d")
    if start_date is None:
        start_date = (datetime.now() - timedelta(days=365)).strftime("%Y-%m-%d")
    
    if fields is None:
        fields = "date,code,open,high,low,close,volume,amount,adjustflag"
    
    try:
        rs = bs.query_history_k_data_plus(
            code, 
            fields, 
            start_date=start_date, 
            end_date=end_date,
            frequency=frequency.value, 
            adjustflag=adjustflag
        )
        
        if rs.error_code != '0':
            raise HTTPException(status_code=500, detail=f"获取K线数据失败: {rs.error_msg}")
        
        data = []
        field_list = [f.strip() for f in fields.split(",")]
        
        while (rs.error_code == '0') & rs.next():
            row = rs.get_row_data()
            item = {}
            for i, field in enumerate(field_list):
                if i < len(row):
                    val = row[i]
                    # 根据字段类型进行数据转换
                    if field in ['open', 'high', 'low', 'close', 'preclose', 'amount', 'turn', 'pctChg', 'peTTM', 'pbMRQ', 'psTTM', 'pcfNcfTTM']:
                        val = convert_to_float(val)
                    elif field in ['volume']:
                        val = convert_to_int(val)
                    elif field == 'tradestatus':
                        val = convert_to_int(val)
                    item[field] = val
            data.append(item)
        
        return APIResponse(success=True, data={
            "code": code, 
            "frequency": frequency.value, 
            "adjustflag": adjustflag,
            "start_date": start_date, 
            "end_date": end_date, 
            "count": len(data), 
            "kline_data": data,
            "fields": field_list
        })
    except Exception as e:
        logger.error(f"获取K线数据失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"获取K线数据失败: {str(e)}")

# ==================== 3. 财务数据接口 ====================

@app.get("/api/finance/profit", response_model=APIResponse, tags=["财务数据"], summary="季频盈利能力数据")
async def get_profit_data(
    code: str = Query(..., description="股票代码"),
    year: Optional[int] = Query(None, description="年份"),
    quarter: Optional[int] = Query(None, ge=1, le=4, description="季度(1-4)")
):
    """
    季频盈利能力数据 (2007年至今)
    
    基于 BaoStock query_profit_data() 接口
    
    包括ROE、净利率、毛利率、净利润等指标
    """
    if year is None or quarter is None:
        year, quarter = get_default_year_quarter()
    
    try:
        rs = bs.query_profit_data(code=code, year=year, quarter=quarter)
        if rs.error_code != '0':
            raise HTTPException(status_code=500, detail=f"获取盈利数据失败: {rs.error_msg}")
        
        data = []
        while (rs.error_code == '0') & rs.next():
            row = rs.get_row_data()
            data.append({
                "code": row[0], "pubDate": row[1], "statDate": row[2],
                "roeAvg": convert_to_float(row[3]),  # 净资产收益率(平均)
                "npMargin": convert_to_float(row[4]),  # 销售净利率
                "gpMargin": convert_to_float(row[5]),  # 销售毛利率
                "netProfit": convert_to_float(row[6]),  # 净利润
                "epsTTM": convert_to_float(row[7]),  # 每股收益
                "mbRevenue": convert_to_float(row[8]),  # 主营营业收入
                "totalShare": convert_to_float(row[9]),  # 总股本
                "liqaShare": convert_to_float(row[10])  # 流通股本
            })
        
        return APIResponse(success=True, data={"code": code, "year": year, "quarter": quarter, "profit_data": data})
    except Exception as e:
        logger.error(f"获取盈利数据失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"获取盈利数据失败: {str(e)}")

@app.get("/api/finance/operation", response_model=APIResponse, tags=["财务数据"], summary="季频营运能力数据")
async def get_operation_data(
    code: str = Query(..., description="股票代码"),
    year: Optional[int] = Query(None, description="年份"),
    quarter: Optional[int] = Query(None, ge=1, le=4, description="季度(1-4)")
):
    """
    季频营运能力数据 (2007年至今)
    
    基于 BaoStock query_operation_data() 接口
    
    包括应收账款周转率、存货周转率、总资产周转率等
    """
    if year is None or quarter is None:
        year, quarter = get_default_year_quarter()
    
    try:
        rs = bs.query_operation_data(code=code, year=year, quarter=quarter)
        if rs.error_code != '0':
            raise HTTPException(status_code=500, detail=f"获取营运数据失败: {rs.error_msg}")
        
        data = []
        while (rs.error_code == '0') & rs.next():
            row = rs.get_row_data()
            data.append({
                "code": row[0], "pubDate": row[1], "statDate": row[2],
                "NRTurnRatio": convert_to_float(row[3]),  # 应收账款周转率
                "NRTurnDays": convert_to_float(row[4]),  # 应收账款周转天数
                "INVTurnRatio": convert_to_float(row[5]),  # 存货周转率
                "INVTurnDays": convert_to_float(row[6]),  # 存货周转天数
                "CATurnRatio": convert_to_float(row[7]),  # 流动资产周转率
                "AssetTurnRatio": convert_to_float(row[8])  # 总资产周转率
            })
        
        return APIResponse(success=True, data={"code": code, "year": year, "quarter": quarter, "operation_data": data})
    except Exception as e:
        logger.error(f"获取营运数据失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"获取营运数据失败: {str(e)}")

@app.get("/api/finance/growth", response_model=APIResponse, tags=["财务数据"], summary="季频成长能力数据")
async def get_growth_data(
    code: str = Query(..., description="股票代码"),
    year: Optional[int] = Query(None, description="年份"),
    quarter: Optional[int] = Query(None, ge=1, le=4, description="季度(1-4)")
):
    """
    季频成长能力数据 (2007年至今)
    
    基于 BaoStock query_growth_data() 接口
    
    包括净资产同比增长率、总资产同比增长率、净利润同比增长率等
    """
    if year is None or quarter is None:
        year, quarter = get_default_year_quarter()
    
    try:
        rs = bs.query_growth_data(code=code, year=year, quarter=quarter)
        if rs.error_code != '0':
            raise HTTPException(status_code=500, detail=f"获取成长数据失败: {rs.error_msg}")
        
        data = []
        while (rs.error_code == '0') & rs.next():
            row = rs.get_row_data()
            data.append({
                "code": row[0], "pubDate": row[1], "statDate": row[2],
                "YOYEquity": convert_to_float(row[3]),  # 净资产同比增长率
                "YOYAsset": convert_to_float(row[4]),  # 总资产同比增长率
                "YOYNI": convert_to_float(row[5]),  # 净利润同比增长率
                "YOYEPSBasic": convert_to_float(row[6]),  # 基本每股收益同比增长率
                "YOYPNI": convert_to_float(row[7])  # 归属母公司股东净利润同比增长率
            })
        
        return APIResponse(success=True, data={"code": code, "year": year, "quarter": quarter, "growth_data": data})
    except Exception as e:
        logger.error(f"获取成长数据失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"获取成长数据失败: {str(e)}")

@app.get("/api/finance/balance", response_model=APIResponse, tags=["财务数据"], summary="季频偿债能力数据")
async def get_balance_data(
    code: str = Query(..., description="股票代码"),
    year: Optional[int] = Query(None, description="年份"),
    quarter: Optional[int] = Query(None, ge=1, le=4, description="季度(1-4)")
):
    """
    季频偿债能力数据 (2007年至今)
    
    基于 BaoStock query_balance_data() 接口
    
    包括流动比率、速动比率、资产负债率等
    """
    if year is None or quarter is None:
        year, quarter = get_default_year_quarter()
    
    try:
        rs = bs.query_balance_data(code=code, year=year, quarter=quarter)
        if rs.error_code != '0':
            raise HTTPException(status_code=500, detail=f"获取偿债数据失败: {rs.error_msg}")
        
        data = []
        while (rs.error_code == '0') & rs.next():
            row = rs.get_row_data()
            data.append({
                "code": row[0], "pubDate": row[1], "statDate": row[2],
                "currentRatio": convert_to_float(row[3]),  # 流动比率
                "quickRatio": convert_to_float(row[4]),  # 速动比率
                "cashRatio": convert_to_float(row[5]),  # 现金比率
                "YOYLiability": convert_to_float(row[6]),  # 总负债同比增长率
                "liabilityToAsset": convert_to_float(row[7]),  # 资产负债率
                "assetToEquity": convert_to_float(row[8])  # 权益乘数
            })
        
        return APIResponse(success=True, data={"code": code, "year": year, "quarter": quarter, "balance_data": data})
    except Exception as e:
        logger.error(f"获取偿债数据失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"获取偿债数据失败: {str(e)}")

@app.get("/api/finance/cash-flow", response_model=APIResponse, tags=["财务数据"], summary="季频现金流量数据")
async def get_cash_flow_data(
    code: str = Query(..., description="股票代码"),
    year: Optional[int] = Query(None, description="年份"),
    quarter: Optional[int] = Query(None, ge=1, le=4, description="季度(1-4)")
):
    """
    季频现金流量数据 (2007年至今)
    
    基于 BaoStock query_cash_flow_data() 接口
    
    包括流动资产占比、非流动资产占比、经营性现金流量等
    """
    if year is None or quarter is None:
        year, quarter = get_default_year_quarter()
    
    try:
        rs = bs.query_cash_flow_data(code=code, year=year, quarter=quarter)
        if rs.error_code != '0':
            raise HTTPException(status_code=500, detail=f"获取现金流量数据失败: {rs.error_msg}")
        
        data = []
        while (rs.error_code == '0') & rs.next():
            row = rs.get_row_data()
            data.append({
                "code": row[0], "pubDate": row[1], "statDate": row[2],
                "CAToAsset": convert_to_float(row[3]),  # 流动资产除以总资产
                "NCAToAsset": convert_to_float(row[4]),  # 非流动资产除以总资产
                "tangibleAssetToAsset": convert_to_float(row[5]),  # 有形资产除以总资产
                "ebitToInterest": convert_to_float(row[6]),  # 已获利息倍数
                "CFOToOR": convert_to_float(row[7]),  # 经营活动产生的现金流量净额除以营业收入
                "CFOToNP": convert_to_float(row[8]),  # 经营性现金净流量除以净利润
                "CFOToGr": convert_to_float(row[9])  # 经营性现金净流量除以营业总收入
            })
        
        return APIResponse(success=True, data={"code": code, "year": year, "quarter": quarter, "cash_flow_data": data})
    except Exception as e:
        logger.error(f"获取现金流量数据失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"获取现金流量数据失败: {str(e)}")

@app.get("/api/finance/dupont", response_model=APIResponse, tags=["财务数据"], summary="季频杜邦指数数据")
async def get_dupont_data(
    code: str = Query(..., description="股票代码"),
    year: Optional[int] = Query(None, description="年份"),
    quarter: Optional[int] = Query(None, ge=1, le=4, description="季度(1-4)")
):
    """
    季频杜邦指数数据 (2007年至今)
    
    基于 BaoStock query_dupont_data() 接口
    
    包括杜邦分析相关的各项指标
    """
    if year is None or quarter is None:
        year, quarter = get_default_year_quarter()
    
    try:
        rs = bs.query_dupont_data(code=code, year=year, quarter=quarter)
        if rs.error_code != '0':
            raise HTTPException(status_code=500, detail=f"获取杜邦数据失败: {rs.error_msg}")
        
        data = []
        while (rs.error_code == '0') & rs.next():
            row = rs.get_row_data()
            data.append({
                "code": row[0], "pubDate": row[1], "statDate": row[2],
                "dupontROE": convert_to_float(row[3]),  # 净资产收益率
                "dupontAssetStoEquity": convert_to_float(row[4]),  # 权益乘数
                "dupontAssetTurn": convert_to_float(row[5]),  # 总资产周转率
                "dupontPnitoni": convert_to_float(row[6]),  # 归属母公司股东的净利润/净利润
                "dupontNitogr": convert_to_float(row[7]),  # 净利润/营业总收入
                "dupontTaxBurden": convert_to_float(row[8]),  # 净利润/利润总额
                "dupontIntburden": convert_to_float(row[9]),  # 利润总额/息税前利润
                "dupontEbittogr": convert_to_float(row[10])  # 息税前利润/营业总收入
            })
        
        return APIResponse(success=True, data={"code": code, "year": year, "quarter": quarter, "dupont_data": data})
    except Exception as e:
        logger.error(f"获取杜邦数据失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"获取杜邦数据失败: {str(e)}")

# ==================== 4. 宏观数据接口 ====================

@app.get("/api/macro/deposit-rate", response_model=APIResponse, tags=["宏观数据"], summary="存款利率数据")
async def get_deposit_rate(
    start_date: str = Query(..., description="开始日期 YYYY-MM-DD"),
    end_date: str = Query(..., description="结束日期 YYYY-MM-DD")
):
    """
    存款利率数据
    
    基于 BaoStock query_deposit_rate_data() 接口
    
    查询指定日期范围内的存款利率变化
    """
    try:
        rs = bs.query_deposit_rate_data(start_date=start_date, end_date=end_date)
        if rs.error_code != '0':
            raise HTTPException(status_code=500, detail=f"获取存款利率失败: {rs.error_msg}")
        
        data = []
        while (rs.error_code == '0') & rs.next():
            row = rs.get_row_data()
            data.append({
                "pubDate": row[0],
                "demandDepositRate": convert_to_float(row[1]),
                "fixedDepositRate3Month": convert_to_float(row[2]),
                "fixedDepositRate6Month": convert_to_float(row[3]),
                "fixedDepositRate1Year": convert_to_float(row[4]),
                "fixedDepositRate2Year": convert_to_float(row[5]),
                "fixedDepositRate3Year": convert_to_float(row[6]),
                "fixedDepositRate5Year": convert_to_float(row[7]),
                "installmentFixedDepositRate1Year": convert_to_float(row[8]),
                "installmentFixedDepositRate3Year": convert_to_float(row[9]),
                "installmentFixedDepositRate5Year": convert_to_float(row[10])
            })
        
        return APIResponse(success=True, data={"start_date": start_date, "end_date": end_date, "rates": data})
    except Exception as e:
        logger.error(f"获取存款利率失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"获取存款利率失败: {str(e)}")

@app.get("/api/macro/loan-rate", response_model=APIResponse, tags=["宏观数据"], summary="贷款利率数据")
async def get_loan_rate(
    start_date: str = Query(..., description="开始日期 YYYY-MM-DD"),
    end_date: str = Query(..., description="结束日期 YYYY-MM-DD")
):
    """
    贷款利率数据
    
    基于 BaoStock query_loan_rate_data() 接口
    
    查询指定日期范围内的贷款利率变化
    """
    try:
        rs = bs.query_loan_rate_data(start_date=start_date, end_date=end_date)
        if rs.error_code != '0':
            raise HTTPException(status_code=500, detail=f"获取贷款利率失败: {rs.error_msg}")
        
        data = []
        while (rs.error_code == '0') & rs.next():
            row = rs.get_row_data()
            data.append({
                "pubDate": row[0],
                "loanRate6Month": convert_to_float(row[1]),
                "loanRate6MonthTo1Year": convert_to_float(row[2]),
                "loanRate1YearTo3Year": convert_to_float(row[3]),
                "loanRate3YearTo5Year": convert_to_float(row[4]),
                "loanRateAbove5Year": convert_to_float(row[5]),
                "mortgateRateBelow5Year": convert_to_float(row[6]),
                "mortgateRateAbove5Year": convert_to_float(row[7])
            })
        
        return APIResponse(success=True, data={"start_date": start_date, "end_date": end_date, "rates": data})
    except Exception as e:
        logger.error(f"获取贷款利率失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"获取贷款利率失败: {str(e)}")

@app.get("/api/macro/money-supply", response_model=APIResponse, tags=["宏观数据"], summary="货币供应量数据")
async def get_money_supply(
    start_date: str = Query(..., description="开始日期 YYYY-MM"),
    end_date: str = Query(..., description="结束日期 YYYY-MM")
):
    """
    货币供应量数据
    
    基于 BaoStock query_money_supply_data_month() 接口
    
    M0、M1、M2货币供应量同比数据
    """
    try:
        rs = bs.query_money_supply_data_month(start_date=start_date, end_date=end_date)
        if rs.error_code != '0':
            raise HTTPException(status_code=500, detail=f"获取货币供应量失败: {rs.error_msg}")
        
        data = []
        while (rs.error_code == '0') & rs.next():
            row = rs.get_row_data()
            data.append({
                "statYear": int(row[0]) if row[0] else None,
                "statMonth": int(row[1]) if row[1] else None,
                "m0Month": convert_to_float(row[2]),
                "m0YOY": convert_to_float(row[3]),
                "m0ChainRelative": convert_to_float(row[4]),
                "m1Month": convert_to_float(row[5]),
                "m1YOY": convert_to_float(row[6]),
                "m1ChainRelative": convert_to_float(row[7]),
                "m2Month": convert_to_float(row[8]),
                "m2YOY": convert_to_float(row[9]),
                "m2ChainRelative": convert_to_float(row[10])
            })
        
        return APIResponse(success=True, data={"start_date": start_date, "end_date": end_date, "supply": data})
    except Exception as e:
        logger.error(f"获取货币供应量失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"获取货币供应量失败: {str(e)}")

# ==================== 5. 板块数据接口 ====================

@app.get("/api/sector/industry", response_model=APIResponse, tags=["板块数据"], summary="行业分类数据")
async def get_stock_industry(
    code: Optional[str] = Query(None, description="股票代码，为空则返回所有行业分类")
):
    """
    行业分类数据
    
    基于 BaoStock query_stock_industry() 接口
    
    获取股票的所属行业和行业分类
    """
    try:
        rs = bs.query_stock_industry(code=code) if code else bs.query_stock_industry()
        if rs.error_code != '0':
            raise HTTPException(status_code=500, detail=f"获取行业分类失败: {rs.error_msg}")
        
        data = []
        while (rs.error_code == '0') & rs.next():
            row = rs.get_row_data()
            data.append({
                "updateDate": row[0],
                "code": row[1],
                "code_name": row[2],
                "industry": row[3],
                "industryClassification": row[4]
            })
        
        return APIResponse(success=True, data={"count": len(data), "industries": data})
    except Exception as e:
        logger.error(f"获取行业分类失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"获取行业分类失败: {str(e)}")

@app.get("/api/sector/sz50", response_model=APIResponse, tags=["板块数据"], summary="上证50成分股")
async def get_sz50_stocks():
    """
    上证50成分股
    
    基于 BaoStock query_sz50_stocks() 接口
    
    获取上证50指数成分股列表
    """
    try:
        rs = bs.query_sz50_stocks()
        if rs.error_code != '0':
            raise HTTPException(status_code=500, detail=f"获取上证50失败: {rs.error_msg}")
        
        data = []
        while (rs.error_code == '0') & rs.next():
            row = rs.get_row_data()
            data.append({
                "updateDate": row[0],
                "code": row[1],
                "code_name": row[2]
            })
        
        return APIResponse(success=True, data={"count": len(data), "stocks": data})
    except Exception as e:
        logger.error(f"获取上证50失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"获取上证50失败: {str(e)}")

@app.get("/api/sector/hs300", response_model=APIResponse, tags=["板块数据"], summary="沪深300成分股")
async def get_hs300_stocks():
    """
    沪深300成分股
    
    基于 BaoStock query_hs300_stocks() 接口
    
    获取沪深300指数成分股列表
    """
    try:
        rs = bs.query_hs300_stocks()
        if rs.error_code != '0':
            raise HTTPException(status_code=500, detail=f"获取沪深300失败: {rs.error_msg}")
        
        data = []
        while (rs.error_code == '0') & rs.next():
            row = rs.get_row_data()
            data.append({
                "updateDate": row[0],
                "code": row[1],
                "code_name": row[2]
            })
        
        return APIResponse(success=True, data={"count": len(data), "stocks": data})
    except Exception as e:
        logger.error(f"获取沪深300失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"获取沪深300失败: {str(e)}")

@app.get("/api/sector/zz500", response_model=APIResponse, tags=["板块数据"], summary="中证500成分股")
async def get_zz500_stocks():
    """
    中证500成分股
    
    基于 BaoStock query_zz500_stocks() 接口
    
    获取中证500指数成分股列表
    """
    try:
        rs = bs.query_zz500_stocks()
        if rs.error_code != '0':
            raise HTTPException(status_code=500, detail=f"获取中证500失败: {rs.error_msg}")
        
        data = []
        while (rs.error_code == '0') & rs.next():
            row = rs.get_row_data()
            data.append({
                "updateDate": row[0],
                "code": row[1],
                "code_name": row[2]
            })
        
        return APIResponse(success=True, data={"count": len(data), "stocks": data})
    except Exception as e:
        logger.error(f"获取中证500失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"获取中证500失败: {str(e)}")

# ==================== 6. 其他数据接口 ====================

@app.get("/api/other/trade-dates", response_model=APIResponse, tags=["其他数据"], summary="交易日历")
async def get_trade_dates(
    start_date: str = Query(..., description="开始日期 YYYY-MM-DD"),
    end_date: str = Query(..., description="结束日期 YYYY-MM-DD")
):
    """
    交易日历
    
    基于 BaoStock query_trade_dates() 接口
    
    查询指定日期范围内的交易日和非交易日
    """
    try:
        rs = bs.query_trade_dates(start_date=start_date, end_date=end_date)
        if rs.error_code != '0':
            raise HTTPException(status_code=500, detail=f"获取交易日历失败: {rs.error_msg}")
        
        data = []
        while (rs.error_code == '0') & rs.next():
            row = rs.get_row_data()
            data.append({
                "calendar_date": row[0],
                "is_trading_day": int(row[1]) if row[1] else None
            })
        
        return APIResponse(success=True, data={"start_date": start_date, "end_date": end_date, "dates": data})
    except Exception as e:
        logger.error(f"获取交易日历失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"获取交易日历失败: {str(e)}")

@app.get("/api/other/adjust-factor", response_model=APIResponse, tags=["其他数据"], summary="复权因子数据")
async def get_adjust_factor(
    code: str = Query(..., description="股票代码"),
    start_date: Optional[str] = Query(None, description="开始日期"),
    end_date: Optional[str] = Query(None, description="结束日期")
):
    """
    复权因子数据
    
    基于 BaoStock query_adjust_factor() 接口
    
    查询股票的前复权和后复权因子
    """
    if end_date is None:
        end_date = datetime.now().strftime("%Y-%m-%d")
    if start_date is None:
        start_date = (datetime.now() - timedelta(days=365)).strftime("%Y-%m-%d")
    
    try:
        rs = bs.query_adjust_factor(code=code, start_date=start_date, end_date=end_date)
        if rs.error_code != '0':
            raise HTTPException(status_code=500, detail=f"获取复权因子失败: {rs.error_msg}")
        
        data = []
        while (rs.error_code == '0') & rs.next():
            row = rs.get_row_data()
            data.append({
                "code": row[0],
                "dividOperateDate": row[1],
                "foreAdjustFactor": convert_to_float(row[2]),
                "backAdjustFactor": convert_to_float(row[3]),
                "adjustFactor": convert_to_float(row[4])
            })
        
        return APIResponse(success=True, data={"code": code, "factors": data})
    except Exception as e:
        logger.error(f"获取复权因子失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"获取复权因子失败: {str(e)}")

@app.get("/api/other/dividend", response_model=APIResponse, tags=["其他数据"], summary="除权除息信息")
async def get_dividend_data(
    code: str = Query(..., description="股票代码"),
    year: str = Query(..., description="年份"),
    year_type: str = Query("report", description="年份类别: report(预案公告年份) 或 operate(除权除息年份)")
):
    """
    除权除息信息
    
    基于 BaoStock query_dividend_data() 接口
    
    查询股票的除权除息信息
    """
    try:
        rs = bs.query_dividend_data(code=code, year=year, yearType=year_type)
        if rs.error_code != '0':
            raise HTTPException(status_code=500, detail=f"获取除权除息信息失败: {rs.error_msg}")
        
        data = []
        while (rs.error_code == '0') & rs.next():
            row = rs.get_row_data()
            data.append({
                "code": row[0],
                "dividPreNoticeDate": row[1],
                "dividAgmPumDate": row[2],
                "dividPlanAnnounceDate": row[3],
                "dividPlanDate": row[4],
                "dividRegistDate": row[5],
                "dividOperateDate": row[6],
                "dividPayDate": row[7],
                "dividStockMarketDate": row[8],
                "dividCashPsBeforeTax": convert_to_float(row[9]),
                "dividCashPsAfterTax": convert_to_float(row[10]),
                "dividStocksPs": convert_to_float(row[11]),
                "dividCashStock": row[12],
                "dividReserveToStockPs": convert_to_float(row[13])
            })
        
        return APIResponse(success=True, data={"code": code, "year": year, "dividend_data": data})
    except Exception as e:
        logger.error(f"获取除权除息信息失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"获取除权除息信息失败: {str(e)}")

@app.get("/api/other/performance-express", response_model=APIResponse, tags=["其他数据"], summary="公司业绩快报")
async def get_performance_express_report(
    code: str = Query(..., description="股票代码"),
    start_date: str = Query(..., description="开始日期 YYYY-MM-DD"),
    end_date: str = Query(..., description="结束日期 YYYY-MM-DD")
):
    """
    公司业绩快报
    
    基于 BaoStock query_performance_express_report() 接口
    
    查询公司业绩快报信息
    """
    try:
        rs = bs.query_performance_express_report(code=code, start_date=start_date, end_date=end_date)
        if rs.error_code != '0':
            raise HTTPException(status_code=500, detail=f"获取业绩快报失败: {rs.error_msg}")
        
        data = []
        while (rs.error_code == '0') & rs.next():
            row = rs.get_row_data()
            data.append({
                "code": row[0],
                "performanceExpPubDate": row[1],
                "performanceExpStatDate": row[2],
                "performanceExpUpdateDate": row[3],
                "performanceExpressTotalAsset": convert_to_float(row[4]),
                "performanceExpressNetAsset": convert_to_float(row[5]),
                "performanceExpressEPSChgPct": convert_to_float(row[6]),
                "performanceExpressROEWa": convert_to_float(row[7]),
                "performanceExpressEPSDiluted": convert_to_float(row[8]),
                "performanceExpressGRYOY": convert_to_float(row[9]),
                "performanceExpressOPYOY": convert_to_float(row[10])
            })
        
        return APIResponse(success=True, data={"code": code, "performance_data": data})
    except Exception as e:
        logger.error(f"获取业绩快报失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"获取业绩快报失败: {str(e)}")

@app.get("/api/other/forecast", response_model=APIResponse, tags=["其他数据"], summary="公司业绩预告")
async def get_forecast_report(
    code: str = Query(..., description="股票代码"),
    start_date: str = Query(..., description="开始日期 YYYY-MM-DD"),
    end_date: str = Query(..., description="结束日期 YYYY-MM-DD")
):
    """
    公司业绩预告
    
    基于 BaoStock query_forecast_report() 接口
    
    查询公司业绩预告信息
    """
    try:
        rs = bs.query_forecast_report(code=code, start_date=start_date, end_date=end_date)
        if rs.error_code != '0':
            raise HTTPException(status_code=500, detail=f"获取业绩预告失败: {rs.error_msg}")
        
        data = []
        while (rs.error_code == '0') & rs.next():
            row = rs.get_row_data()
            data.append({
                "code": row[0],
                "profitForcastExpPubDate": row[1],
                "profitForcastExpStatDate": row[2],
                "profitForcastType": row[3],
                "profitForcastAbstract": row[4],
                "profitForcastChgPctUp": convert_to_float(row[5]),
                "profitForcastChgPctDwn": convert_to_float(row[6])
            })
        
        return APIResponse(success=True, data={"code": code, "forecast_data": data})
    except Exception as e:
        logger.error(f"获取业绩预告失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"获取业绩预告失败: {str(e)}")

# ==================== 主程序入口 ====================

if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8001, reload=True, log_level="info")