"""
AKShare HTTP API Service - 完整版
基于 AKShare 的股票数据 API 服务

提供 A股、港股、美股、指数、ETF 等多市场数据
支持多平台数据源：东方财富、新浪、腾讯、雪球

当东方财富接口受限时，可自动或手动切换到其他平台
"""

from fastapi import FastAPI, HTTPException, Query, Path
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Literal
from datetime import datetime, timedelta
from enum import Enum
import akshare as ak
import pandas as pd
import uvicorn

# ==================== Pydantic 模型定义 ====================

class APIResponse(BaseModel):
    """通用API响应模型"""
    success: bool = Field(..., description="请求是否成功")
    message: str = Field(default="", description="响应消息")
    data: Any = Field(default=None, description="响应数据")
    source: str = Field(default="", description="数据来源")
    updateTime: str = Field(default="", description="数据更新时间")

class PaginationInfo(BaseModel):
    """分页信息模型"""
    page: int = Field(..., description="当前页码")
    page_size: int = Field(..., description="每页数量")
    total: int = Field(..., description="总记录数")
    total_pages: int = Field(..., description="总页数")

class ErrorResponse(BaseModel):
    """错误响应模型"""
    detail: str = Field(..., description="错误详情")

class PeriodEnum(str, Enum):
    """数据周期枚举"""
    daily = "daily"
    weekly = "weekly"
    monthly = "monthly"

class DataSourceEnum(str, Enum):
    """数据源枚举"""
    eastmoney = "eastmoney"  # 东方财富（默认）
    sina = "sina"            # 新浪财经
    tx = "tx"                # 腾讯财经

# ==================== FastAPI 应用初始化 ====================

tags_metadata = [
    {"name": "📊 系统", "description": "API信息和健康检查"},
    {"name": "🇨🇳 A股数据", "description": "A股实时行情、历史数据、股票列表"},
    {"name": "🇭🇰 港股数据", "description": "港股实时行情、历史数据"},
    {"name": "🇺🇸 美股数据", "description": "美股实时行情、历史数据"},
    {"name": "📈 指数数据", "description": "A股指数实时行情、历史数据"},
    {"name": "💼 ETF数据", "description": "场内ETF实时行情、历史数据"},
]

app = FastAPI(
    title="AKShare Stock API - In Fortune AI完整版",
    description="""
    # In Fortune AI - 股票数据 API 服务（完整版）
    
    基于 AKShare 的专业股票数据接口，提供多市场、多平台数据服务。
    
    ## 主要功能
    
    - 🇨🇳 **A股数据** - 实时行情、历史数据、股票列表（东财/新浪/腾讯）
    - 🇭🇰 **港股数据** - 港股实时行情、历史数据
    - 🇺🇸 **美股数据** - 美股实时行情、历史数据
    - 📈 **指数数据** - A股主要指数行情
    - 💼 **ETF数据** - 场内基金实时行情
    
    ## 多平台支持
    
    当东方财富接口受限时，可切换到其他平台：
    - `eastmoney` - 东方财富（默认，数据最全）
    - `sina` - 新浪财经（稳定，速度快）
    - `tx` - 腾讯财经（备用）
    
    ## 使用限制
    - 仅供学习和研究使用
    """,
    version="2.0.0",
    openapi_tags=tags_metadata,
    docs_url="/docs",
    redoc_url="/redoc",
)

# 配置 CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==================== 工具函数 ====================

def get_now_time():
    """获取当前时间字符串"""
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")

def dataframe_to_dict(df):
    """DataFrame转换为字典列表"""
    if df is None or df.empty:
        return []
    return df.to_dict('records')

# ==================== API 路由 ====================

@app.get("/", tags=["📊 系统"], summary="API信息")
async def root():
    """获取API基本信息和可用接口列表"""
    return {
        "message": "AKShare Stock API Service - 完整版",
        "version": "2.0.0",
        "docs": "/docs",
        "endpoints": {
            "A股数据": [
                "/api/a/stock/realtime/{symbol}",
                "/api/a/stock/history/{symbol}",
                "/api/a/stock/list",
                "/api/a/stock/search"
            ],
            "港股数据": [
                "/api/hk/stock/realtime/{symbol}",
                "/api/hk/stock/history/{symbol}",
                "/api/hk/stock/list"
            ],
            "美股数据": [
                "/api/us/stock/realtime/{symbol}",
                "/api/us/stock/history/{symbol}",
                "/api/us/stock/list"
            ],
            "指数数据": [
                "/api/index/realtime",
                "/api/index/history/{symbol}"
            ],
            "ETF数据": [
                "/api/etf/realtime",
                "/api/etf/history/{symbol}",
                "/api/etf/list"
            ]
        }
    }

# ==================== A股数据接口 ====================

@app.get("/api/a/stock/realtime/{symbol}", response_model=APIResponse, tags=["🇨🇳 A股数据"], summary="A股实时行情")
async def get_a_stock_realtime(
    symbol: str = Path(..., description="股票代码，如：000001", min_length=6, max_length=6, pattern="^\d{6}$"),
    source: DataSourceEnum = Query(DataSourceEnum.eastmoney, description="数据源")
):
    """
    获取A股实时行情数据
    
    **多平台支持：**
    - `eastmoney` - 东方财富（默认，数据最全，有15分钟延迟）
    - `sina` - 新浪财经（速度快，实时性较好）
    """
    try:
        if source == DataSourceEnum.eastmoney:
            # 东方财富接口
            df = ak.stock_zh_a_spot_em()
            stock_data = df[df['代码'] == symbol]
            if stock_data.empty:
                raise HTTPException(status_code=404, detail=f"股票 {symbol} 未找到")
            data = stock_data.iloc[0].to_dict()
        elif source == DataSourceEnum.sina:
            # 新浪财经接口
            df = ak.stock_zh_a_spot()
            # 新浪代码格式：sh000001 或 sz000001
            prefix = "sh" if symbol.startswith('6') else "sz"
            sina_code = f"{prefix}{symbol}"
            stock_data = df[df['code'] == sina_code]
            if stock_data.empty:
                raise HTTPException(status_code=404, detail=f"股票 {symbol} 未找到")
            data = stock_data.iloc[0].to_dict()
        else:
            raise HTTPException(status_code=400, detail=f"不支持的数据源: {source}")
        
        return APIResponse(
            success=True,
            data=data,
            source=source.value,
            updateTime=get_now_time()
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取数据失败: {str(e)}")


@app.get("/api/a/stock/history/{symbol}", response_model=APIResponse, tags=["🇨🇳 A股数据"], summary="A股历史数据")
async def get_a_stock_history(
    symbol: str = Path(..., description="股票代码，如：000001", min_length=6, max_length=6),
    period: PeriodEnum = Query(PeriodEnum.daily, description="数据周期"),
    start_date: Optional[str] = Query(None, description="开始日期 YYYYMMDD"),
    end_date: Optional[str] = Query(None, description="结束日期 YYYYMMDD"),
    adjust: str = Query("qfq", description="复权类型：qfq-前复权, hfq-后复权, 空-不复权"),
    source: DataSourceEnum = Query(DataSourceEnum.eastmoney, description="数据源")
):
    """
    获取A股历史K线数据
    
    **多平台支持：**
    - `eastmoney` - 东方财富（数据完整，含各种指标）
    - `sina` - 新浪财经（速度快）
    """
    try:
        period_map = {"daily": "daily", "weekly": "weekly", "monthly": "monthly"}
        
        if source == DataSourceEnum.eastmoney:
            # 东方财富接口
            df = ak.stock_zh_a_hist(
                symbol=symbol,
                period=period_map[period],
                start_date=start_date,
                end_date=end_date,
                adjust=adjust
            )
        elif source == DataSourceEnum.sina:
            # 新浪财经接口
            prefix = "sh" if symbol.startswith('6') else "sz"
            sina_symbol = f"{prefix}{symbol}"
            df = ak.stock_zh_a_daily(
                symbol=sina_symbol,
                start_date=start_date,
                end_date=end_date,
                adjust=adjust
            )
        elif source == DataSourceEnum.tx:
            # 腾讯财经接口
            prefix = "sh" if symbol.startswith('6') else "sz"
            tx_symbol = f"{prefix}{symbol}"
            df = ak.stock_zh_a_hist_tx(
                symbol=tx_symbol,
                start_date=start_date,
                end_date=end_date,
                adjust=adjust
            )
        else:
            raise HTTPException(status_code=400, detail=f"不支持的数据源: {source}")
        
        data_list = dataframe_to_dict(df)
        
        return APIResponse(
            success=True,
            data={
                "symbol": symbol,
                "period": period,
                "count": len(data_list),
                "history": data_list
            },
            source=source.value,
            updateTime=get_now_time()
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取数据失败: {str(e)}")


@app.get("/api/a/stock/list", response_model=APIResponse, tags=["🇨🇳 A股数据"], summary="A股股票列表")
async def get_a_stock_list(
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(100, ge=1, le=500, description="每页数量"),
    source: DataSourceEnum = Query(DataSourceEnum.eastmoney, description="数据源")
):
    """
    获取A股全部股票列表（含实时行情）
    
    **数据源：**
    - `eastmoney` - 东方财富（数据最全）
    - `sina` - 新浪财经（速度快）
    """
    try:
        if source == DataSourceEnum.eastmoney:
            df = ak.stock_zh_a_spot_em()
        elif source == DataSourceEnum.sina:
            df = ak.stock_zh_a_spot()
        else:
            raise HTTPException(status_code=400, detail=f"不支持的数据源: {source}")
        
        total = len(df)
        start_idx = (page - 1) * page_size
        end_idx = start_idx + page_size
        page_data = df.iloc[start_idx:end_idx]
        
        return APIResponse(
            success=True,
            data={
                "list": dataframe_to_dict(page_data),
                "pagination": {
                    "page": page,
                    "page_size": page_size,
                    "total": total,
                    "total_pages": (total + page_size - 1) // page_size
                }
            },
            source=source.value,
            updateTime=get_now_time()
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取数据失败: {str(e)}")


@app.get("/api/a/stock/search", response_model=APIResponse, tags=["🇨🇳 A股数据"], summary="A股股票搜索")
async def search_a_stock(
    keyword: str = Query(..., min_length=1, max_length=20, description="搜索关键词"),
    source: DataSourceEnum = Query(DataSourceEnum.eastmoney, description="数据源")
):
    """
    根据代码或名称搜索A股股票
    
    支持模糊匹配，最多返回20条结果
    """
    try:
        if source == DataSourceEnum.eastmoney:
            df = ak.stock_zh_a_spot_em()
            mask = (
                df['名称'].str.contains(keyword, case=False, na=False) |
                df['代码'].str.contains(keyword, case=False, na=False)
            )
        elif source == DataSourceEnum.sina:
            df = ak.stock_zh_a_spot()
            mask = (
                df['name'].str.contains(keyword, case=False, na=False) |
                df['code'].str.contains(keyword, case=False, na=False)
            )
        else:
            raise HTTPException(status_code=400, detail=f"不支持的数据源: {source}")
        
        result = df[mask].head(20)
        
        return APIResponse(
            success=True,
            data={
                "keyword": keyword,
                "count": len(result),
                "results": dataframe_to_dict(result)
            },
            source=source.value,
            updateTime=get_now_time()
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"搜索失败: {str(e)}")


# ==================== 港股数据接口 ====================

@app.get("/api/hk/stock/realtime/{symbol}", response_model=APIResponse, tags=["🇭🇰 港股数据"], summary="港股实时行情")
async def get_hk_stock_realtime(
    symbol: str = Path(..., description="港股代码，如：00700", pattern="^\d{5}$")
):
    """
    获取港股实时行情数据（东方财富）
    
    示例代码：00700(腾讯控股)、09988(阿里巴巴)
    """
    try:
        df = ak.stock_hk_spot_em()
        stock_data = df[df['代码'] == symbol]
        
        if stock_data.empty:
            raise HTTPException(status_code=404, detail=f"港股 {symbol} 未找到")
        
        return APIResponse(
            success=True,
            data=stock_data.iloc[0].to_dict(),
            source="eastmoney",
            updateTime=get_now_time()
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取数据失败: {str(e)}")


@app.get("/api/hk/stock/history/{symbol}", response_model=APIResponse, tags=["🇭🇰 港股数据"], summary="港股历史数据")
async def get_hk_stock_history(
    symbol: str = Path(..., description="港股代码，如：00700"),
    period: PeriodEnum = Query(PeriodEnum.daily, description="数据周期"),
    start_date: Optional[str] = Query(None, description="开始日期 YYYYMMDD"),
    end_date: Optional[str] = Query(None, description="结束日期 YYYYMMDD"),
    adjust: str = Query("qfq", description="复权类型")
):
    """
    获取港股历史K线数据（东方财富）
    
    自动返回前复权数据，方便策略回测
    """
    try:
        period_map = {"daily": "daily", "weekly": "weekly", "monthly": "monthly"}
        
        df = ak.stock_hk_hist(
            symbol=symbol,
            period=period_map[period],
            start_date=start_date,
            end_date=end_date,
            adjust=adjust
        )
        
        return APIResponse(
            success=True,
            data={
                "symbol": symbol,
                "period": period,
                "count": len(df),
                "history": dataframe_to_dict(df)
            },
            source="eastmoney",
            updateTime=get_now_time()
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取数据失败: {str(e)}")


@app.get("/api/hk/stock/list", response_model=APIResponse, tags=["🇭🇰 港股数据"], summary="港股股票列表")
async def get_hk_stock_list(
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(100, ge=1, le=500, description="每页数量")
):
    """获取港股全部股票列表（含实时行情）"""
    try:
        df = ak.stock_hk_spot_em()
        
        total = len(df)
        start_idx = (page - 1) * page_size
        end_idx = start_idx + page_size
        page_data = df.iloc[start_idx:end_idx]
        
        return APIResponse(
            success=True,
            data={
                "list": dataframe_to_dict(page_data),
                "pagination": {
                    "page": page,
                    "page_size": page_size,
                    "total": total,
                    "total_pages": (total + page_size - 1) // page_size
                }
            },
            source="eastmoney",
            updateTime=get_now_time()
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取数据失败: {str(e)}")


# ==================== 美股数据接口 ====================

@app.get("/api/us/stock/realtime/{symbol}", response_model=APIResponse, tags=["🇺🇸 美股数据"], summary="美股实时行情")
async def get_us_stock_realtime(
    symbol: str = Path(..., description="美股代码，如：AAPL", pattern="^[A-Z]{1,5}$")
):
    """
    获取美股实时行情数据（东方财富）
    
    示例代码：AAPL(苹果)、TSLA(特斯拉)、BABA(阿里巴巴)
    """
    try:
        df = ak.stock_us_spot_em()
        stock_data = df[df['代码'] == symbol]
        
        if stock_data.empty:
            raise HTTPException(status_code=404, detail=f"美股 {symbol} 未找到")
        
        return APIResponse(
            success=True,
            data=stock_data.iloc[0].to_dict(),
            source="eastmoney",
            updateTime=get_now_time()
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取数据失败: {str(e)}")


@app.get("/api/us/stock/history/{symbol}", response_model=APIResponse, tags=["🇺🇸 美股数据"], summary="美股历史数据")
async def get_us_stock_history(
    symbol: str = Path(..., description="美股代码，如：AAPL"),
    period: PeriodEnum = Query(PeriodEnum.daily, description="数据周期"),
    start_date: Optional[str] = Query(None, description="开始日期 YYYYMMDD"),
    end_date: Optional[str] = Query(None, description="结束日期 YYYYMMDD"),
    adjust: str = Query("qfq", description="复权类型")
):
    """
    获取美股历史K线数据（东方财富）
    
    自动返回前复权数据，方便策略回测
    """
    try:
        period_map = {"daily": "daily", "weekly": "weekly", "monthly": "monthly"}
        
        df = ak.stock_us_hist(
            symbol=symbol,
            period=period_map[period],
            start_date=start_date,
            end_date=end_date,
            adjust=adjust
        )
        
        return APIResponse(
            success=True,
            data={
                "symbol": symbol,
                "period": period,
                "count": len(df),
                "history": dataframe_to_dict(df)
            },
            source="eastmoney",
            updateTime=get_now_time()
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取数据失败: {str(e)}")


@app.get("/api/us/stock/list", response_model=APIResponse, tags=["🇺🇸 美股数据"], summary="美股股票列表")
async def get_us_stock_list(
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(100, ge=1, le=500, description="每页数量")
):
    """获取美股全部股票列表（含实时行情）"""
    try:
        df = ak.stock_us_spot_em()
        
        total = len(df)
        start_idx = (page - 1) * page_size
        end_idx = start_idx + page_size
        page_data = df.iloc[start_idx:end_idx]
        
        return APIResponse(
            success=True,
            data={
                "list": dataframe_to_dict(page_data),
                "pagination": {
                    "page": page,
                    "page_size": page_size,
                    "total": total,
                    "total_pages": (total + page_size - 1) // page_size
                }
            },
            source="eastmoney",
            updateTime=get_now_time()
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取数据失败: {str(e)}")


# ==================== 指数数据接口 ====================

@app.get("/api/index/realtime", response_model=APIResponse, tags=["📈 指数数据"], summary="指数实时行情")
async def get_index_realtime(
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(100, ge=1, le=500, description="每页数量")
):
    """
    获取A股指数实时行情数据
    
    包含上证指数、深证成指、沪深300、创业板指等全部A股指数
    """
    try:
        df = ak.stock_zh_index_spot_em()
        
        total = len(df)
        start_idx = (page - 1) * page_size
        end_idx = start_idx + page_size
        page_data = df.iloc[start_idx:end_idx]
        
        return APIResponse(
            success=True,
            data={
                "list": dataframe_to_dict(page_data),
                "pagination": {
                    "page": page,
                    "page_size": page_size,
                    "total": total,
                    "total_pages": (total + page_size - 1) // page_size
                }
            },
            source="eastmoney",
            updateTime=get_now_time()
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取数据失败: {str(e)}")


@app.get("/api/index/history/{symbol}", response_model=APIResponse, tags=["📈 指数数据"], summary="指数历史数据")
async def get_index_history(
    symbol: str = Path(..., description="指数代码，如：000001（上证指数）"),
    period: PeriodEnum = Query(PeriodEnum.daily, description="数据周期"),
    start_date: Optional[str] = Query(None, description="开始日期 YYYYMMDD"),
    end_date: Optional[str] = Query(None, description="结束日期 YYYYMMDD")
):
    """
    获取A股指数历史K线数据
    
    常见指数代码：
    - 000001 - 上证指数
    - 000300 - 沪深300
    - 000016 - 上证50
    - 000905 - 中证500
    - 399001 - 深证成指
    - 399006 - 创业板指
    """
    try:
        period_map = {"daily": "daily", "weekly": "weekly", "monthly": "monthly"}
        
        df = ak.stock_zh_index_hist_csindex(
            symbol=symbol,
            start_date=start_date,
            end_date=end_date
        )
        
        return APIResponse(
            success=True,
            data={
                "symbol": symbol,
                "period": period,
                "count": len(df),
                "history": dataframe_to_dict(df)
            },
            source="csindex",
            updateTime=get_now_time()
        )
    except Exception as e:
        # 如果中证指数接口失败，尝试东方财富接口
        try:
            df = ak.stock_zh_index_daily_em(symbol=symbol)
            return APIResponse(
                success=True,
                data={
                    "symbol": symbol,
                    "period": period,
                    "count": len(df),
                    "history": dataframe_to_dict(df)
                },
                source="eastmoney",
                updateTime=get_now_time()
            )
        except:
            raise HTTPException(status_code=500, detail=f"获取数据失败: {str(e)}")


# ==================== ETF数据接口 ====================

@app.get("/api/etf/realtime", response_model=APIResponse, tags=["💼 ETF数据"], summary="ETF实时行情")
async def get_etf_realtime(
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(100, ge=1, le=500, description="每页数量")
):
    """
    获取场内ETF实时行情数据
    
    包含沪深交易所全部交易型开放式指数基金
    """
    try:
        df = ak.fund_etf_spot_em()
        
        total = len(df)
        start_idx = (page - 1) * page_size
        end_idx = start_idx + page_size
        page_data = df.iloc[start_idx:end_idx]
        
        return APIResponse(
            success=True,
            data={
                "list": dataframe_to_dict(page_data),
                "pagination": {
                    "page": page,
                    "page_size": page_size,
                    "total": total,
                    "total_pages": (total + page_size - 1) // page_size
                }
            },
            source="eastmoney",
            updateTime=get_now_time()
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取数据失败: {str(e)}")


@app.get("/api/etf/history/{symbol}", response_model=APIResponse, tags=["💼 ETF数据"], summary="ETF历史数据")
async def get_etf_history(
    symbol: str = Path(..., description="ETF代码，如：510300", min_length=6, max_length=6),
    period: PeriodEnum = Query(PeriodEnum.daily, description="数据周期"),
    start_date: Optional[str] = Query(None, description="开始日期 YYYYMMDD"),
    end_date: Optional[str] = Query(None, description="结束日期 YYYYMMDD"),
    adjust: str = Query("qfq", description="复权类型")
):
    """
    获取ETF历史K线数据
    
    常见ETF代码：
    - 510300 - 沪深300ETF
    - 510050 - 上证50ETF
    - 159915 - 创业板ETF
    - 512000 - 券商ETF
    """
    try:
        period_map = {"daily": "daily", "weekly": "weekly", "monthly": "monthly"}
        
        df = ak.fund_etf_hist_em(
            symbol=symbol,
            period=period_map[period],
            start_date=start_date,
            end_date=end_date,
            adjust=adjust
        )
        
        return APIResponse(
            success=True,
            data={
                "symbol": symbol,
                "period": period,
                "count": len(df),
                "history": dataframe_to_dict(df)
            },
            source="eastmoney",
            updateTime=get_now_time()
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取数据失败: {str(e)}")


@app.get("/api/etf/list", response_model=APIResponse, tags=["💼 ETF数据"], summary="ETF列表")
async def get_etf_list(
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(100, ge=1, le=500, description="每页数量")
):
    """获取场内ETF基金列表（含实时行情）"""
    try:
        df = ak.fund_etf_spot_em()
        
        total = len(df)
        start_idx = (page - 1) * page_size
        end_idx = start_idx + page_size
        page_data = df.iloc[start_idx:end_idx]
        
        return APIResponse(
            success=True,
            data={
                "list": dataframe_to_dict(page_data),
                "pagination": {
                    "page": page,
                    "page_size": page_size,
                    "total": total,
                    "total_pages": (total + page_size - 1) // page_size
                }
            },
            source="eastmoney",
            updateTime=get_now_time()
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取数据失败: {str(e)}")


# ==================== 启动服务 ====================

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
