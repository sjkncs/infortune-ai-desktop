"""
ML Inference Service - 模型推理服务
打通 ML Pipeline → FastAPI → Desktop/Web 的完整链路

解决问题: ensemble_model.py 定义了模型但无推理端点暴露,
          desktop-app 的 AI 对话完全是模拟响应
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any
from datetime import datetime, timedelta
from contextlib import asynccontextmanager
import numpy as np
import pandas as pd
from loguru import logger
from pathlib import Path
import json
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# ============================================
# 可选依赖 — torch / ensemble_model / feature_engineering
# 缺失时服务以 lightweight 模式运行
# ============================================
TORCH_AVAILABLE = False
ENSEMBLE_AVAILABLE = False
FEATURE_AVAILABLE = False

try:
    import torch
    TORCH_AVAILABLE = True
except ImportError:
    logger.warning("torch not installed — running in lightweight mode")

try:
    from ml_services.forecasting.ensemble_model import EnsembleStockPredictor
    ENSEMBLE_AVAILABLE = True
except ImportError:
    EnsembleStockPredictor = None
    logger.warning("ensemble_model not available")

try:
    from ml_services.features.feature_engineering import FinancialFeatureEngineer
    FEATURE_AVAILABLE = True
except ImportError:
    FinancialFeatureEngineer = None
    logger.warning("feature_engineering not available")


# ============================================
# Pydantic 请求/响应模型
# ============================================

class PredictionRequest(BaseModel):
    symbol: str = Field(..., description="股票代码, e.g. '000001.SZ'")
    horizon: int = Field(default=5, ge=1, le=30, description="预测天数")
    include_uncertainty: bool = Field(default=True, description="是否包含不确定性量化")

class PredictionResult(BaseModel):
    symbol: str
    prediction_date: str
    target_date: str
    predicted_price: float
    confidence_lower: float
    confidence_upper: float
    uncertainty: float
    model_version: str

class PredictionResponse(BaseModel):
    success: bool
    symbol: str
    predictions: List[PredictionResult]
    model_info: Dict[str, Any]
    generated_at: str

class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    device: str
    model_version: str
    uptime_seconds: float

class AnalysisRequest(BaseModel):
    symbol: str = Field(..., description="股票代码")
    analysis_type: str = Field(
        default="comprehensive",
        description="分析类型: comprehensive | technical | fundamental | risk"
    )

class AnalysisResponse(BaseModel):
    success: bool
    symbol: str
    analysis_type: str
    results: Dict[str, Any]
    generated_at: str


# ============================================
# 全局状态管理
# ============================================

class ModelManager:
    """模型生命周期管理器"""

    def __init__(self):
        self.predictor = None
        self.feature_engineer = None
        self.model_version: str = "not_loaded"
        self.device: str = "cpu"
        self.start_time: datetime = datetime.now()
        self._loaded = False
        self.lightweight_mode = False

    def load_model(self, model_path: str = None):
        """加载预训练模型，若依赖缺失则进入 lightweight 模式"""
        # --- lightweight 模式：仅用 numpy/pandas/scipy ---
        if not TORCH_AVAILABLE or not ENSEMBLE_AVAILABLE:
            logger.info("Entering lightweight mode (no torch/ensemble)")
            self.lightweight_mode = True
            self.model_version = "lightweight_v1.0"
            self._loaded = True
            logger.info("Model manager initialized in lightweight mode")
            return

        try:
            config = {
                'version': '1.0',
                'input_size': 50,
                'hidden_size': 128,
                'num_layers': 3,
                'd_model': 128,
                'nhead': 8,
                'transformer_layers': 3,
                'dropout': 0.2,
                'learning_rate': 0.001,
                'weight_decay': 1e-5,
                'sequence_length': 60,
            }

            self.predictor = EnsembleStockPredictor(config)
            self.device = str(self.predictor.device)

            if model_path and Path(model_path).exists():
                self.predictor.load_models(model_path)
                self.model_version = "pretrained_v1.0"
                logger.info(f"Loaded pretrained model from {model_path}")
            else:
                self.model_version = "default_v1.0"
                logger.warning("No pretrained model found, using random initialization")

            if FEATURE_AVAILABLE:
                self.feature_engineer = FinancialFeatureEngineer(config={
                    'technical_indicators': True,
                    'fundamental_features': False,
                    'market_regime': True,
                    'feature_interaction': True,
                    'select_k_best': 50,
                })

            self._loaded = True
            logger.info(f"Model manager initialized. Device: {self.device}")

        except Exception as e:
            logger.warning(f"Full model load failed ({e}), falling back to lightweight")
            self.lightweight_mode = True
            self.model_version = "lightweight_v1.0"
            self._loaded = True

    @property
    def is_loaded(self) -> bool:
        return self._loaded


model_manager = ModelManager()


# ============================================
# FastAPI 应用
# ============================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    logger.info("Starting ML Inference Service...")
    model_path = os.getenv("MODEL_PATH", "outputs/final_model.pt")
    model_manager.load_model(model_path)
    yield
    logger.info("Shutting down ML Inference Service...")


app = FastAPI(
    title="In Fortune AI - ML Inference Service",
    description="模型推理服务: 股票价格预测 + 技术分析 + 风险评估",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================
# API 端点
# ============================================

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """健康检查"""
    return HealthResponse(
        status="healthy" if model_manager.is_loaded else "degraded",
        model_loaded=model_manager.is_loaded,
        device=model_manager.device,
        model_version=model_manager.model_version,
        uptime_seconds=(datetime.now() - model_manager.start_time).total_seconds(),
    )


@app.post("/predict", response_model=PredictionResponse)
async def predict_stock_price(req: PredictionRequest):
    """
    股票价格预测 — 核心推理端点

    Full 模式: Ensemble (Attention-LSTM + Transformer) + MC Dropout
    Lightweight 模式: 统计时间序列预测 (均值回归 + 波动率建模)
    """
    if not model_manager.is_loaded:
        raise HTTPException(status_code=503, detail="Model not loaded")

    try:
        historical_data = await _fetch_stock_history(req.symbol, days=120)
        if historical_data is None or len(historical_data) < 30:
            raise HTTPException(status_code=400, detail=f"Insufficient data for {req.symbol}")

        predictions = []
        now = datetime.now()
        last_close = float(historical_data['close'].iloc[-1])
        returns = historical_data['close'].pct_change().dropna()

        # --- Lightweight 模式: 统计预测 ---
        if model_manager.lightweight_mode:
            mu = float(returns.mean())
            sigma = float(returns.std())
            for day in range(1, req.horizon + 1):
                drift = mu * day
                vol = sigma * np.sqrt(day)
                predicted_price = last_close * (1 + drift)
                ci_lower = last_close * (1 + drift - 1.96 * vol)
                ci_upper = last_close * (1 + drift + 1.96 * vol)
                target_date = now + timedelta(days=day)
                predictions.append(PredictionResult(
                    symbol=req.symbol,
                    prediction_date=now.strftime("%Y-%m-%d %H:%M:%S"),
                    target_date=target_date.strftime("%Y-%m-%d"),
                    predicted_price=round(predicted_price, 2),
                    confidence_lower=round(ci_lower, 2),
                    confidence_upper=round(ci_upper, 2),
                    uncertainty=round(vol, 6),
                    model_version=model_manager.model_version,
                ))
        else:
            # --- Full 模式: Ensemble 推理 ---
            df_features = model_manager.feature_engineer.generate_all_features(historical_data.copy())
            df_features = df_features.dropna()
            if len(df_features) < 60:
                raise HTTPException(status_code=400, detail="Insufficient data after feature engineering")

            exclude_cols = ['time', 'symbol']
            feature_cols = [c for c in df_features.columns if c not in exclude_cols]
            data_array = df_features[feature_cols].tail(60).values.astype(np.float32)

            from sklearn.preprocessing import RobustScaler
            scaler = RobustScaler()
            data_scaled = scaler.fit_transform(data_array)
            input_tensor = torch.FloatTensor(data_scaled).unsqueeze(0)

            for day in range(1, req.horizon + 1):
                if req.include_uncertainty:
                    mean_pred, std_pred, ci_lower, ci_upper = (
                        model_manager.predictor.predict_with_uncertainty(input_tensor, n_samples=50)
                    )
                else:
                    model_manager.predictor.models['lstm_attn'].eval()
                    model_manager.predictor.models['transformer'].eval()
                    with torch.no_grad():
                        preds = []
                        for name, model in model_manager.predictor.models.items():
                            if name == 'lstm_attn':
                                p, _ = model(input_tensor.to(model_manager.predictor.device))
                            else:
                                p = model(input_tensor.to(model_manager.predictor.device))
                            preds.append(p.item())
                        mean_pred = np.mean(preds)
                        std_pred = 0.0
                        ci_lower = mean_pred
                        ci_upper = mean_pred

                predicted_return = mean_pred * 0.01
                predicted_price = last_close * (1 + predicted_return)
                lower_price = last_close * (1 + (ci_lower * 0.01))
                upper_price = last_close * (1 + (ci_upper * 0.01))
                target_date = now + timedelta(days=day)

                predictions.append(PredictionResult(
                    symbol=req.symbol,
                    prediction_date=now.strftime("%Y-%m-%d %H:%M:%S"),
                    target_date=target_date.strftime("%Y-%m-%d"),
                    predicted_price=round(predicted_price, 2),
                    confidence_lower=round(lower_price, 2),
                    confidence_upper=round(upper_price, 2),
                    uncertainty=round(abs(std_pred), 6),
                    model_version=model_manager.model_version,
                ))

        return PredictionResponse(
            success=True,
            symbol=req.symbol,
            predictions=predictions,
            model_info={
                "model_type": "Statistical(lightweight)" if model_manager.lightweight_mode else "Ensemble(AttentionLSTM + Transformer)",
                "uncertainty_method": "GBM confidence interval" if model_manager.lightweight_mode else ("Monte Carlo Dropout" if req.include_uncertainty else "None"),
                "device": model_manager.device,
                "version": model_manager.model_version,
            },
            generated_at=now.isoformat(),
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Prediction failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/analyze", response_model=AnalysisResponse)
async def analyze_stock(req: AnalysisRequest):
    """
    综合股票分析 — 技术面 + 市场状态 + 风险指标

    Full 模式: 使用 FinancialFeatureEngineer + HMM 市场状态检测
    Lightweight 模式: 使用 pandas 内置计算技术指标
    """
    if not model_manager.is_loaded:
        raise HTTPException(status_code=503, detail="Model not loaded")

    try:
        historical = await _fetch_stock_history(req.symbol, days=250)
        if historical is None or len(historical) < 30:
            raise HTTPException(status_code=400, detail="Insufficient data")

        results = {}

        # --- 技术分析 ---
        if req.analysis_type in ("comprehensive", "technical"):
            if model_manager.lightweight_mode or not FEATURE_AVAILABLE:
                results["technical"] = _lightweight_technical(historical)
            else:
                df = model_manager.feature_engineer.generate_technical_indicators(
                    historical.copy()
                )
                latest = df.iloc[-1]
                results["technical"] = {
                    "MACD": {
                        "macd": _safe_float(latest.get("MACD")),
                        "signal": _safe_float(latest.get("MACD_signal")),
                        "histogram": _safe_float(latest.get("MACD_diff")),
                        "interpretation": "金叉" if _safe_float(latest.get("MACD", 0)) > _safe_float(latest.get("MACD_signal", 0)) else "死叉",
                    },
                    "RSI_14": {
                        "value": _safe_float(latest.get("RSI_14")),
                        "interpretation": _rsi_interpretation(_safe_float(latest.get("RSI_14", 50))),
                    },
                    "Bollinger": {
                        "upper": _safe_float(latest.get("BB_high_20")),
                        "middle": _safe_float(latest.get("BB_mid_20")),
                        "lower": _safe_float(latest.get("BB_low_20")),
                        "position": _safe_float(latest.get("BB_pband_20")),
                    },
                    "ADX": _safe_float(latest.get("ADX")),
                    "ATR_14": _safe_float(latest.get("ATR_14")),
                    "MFI": _safe_float(latest.get("MFI")),
                    "SMA_20": _safe_float(latest.get("SMA_20")),
                    "SMA_50": _safe_float(latest.get("SMA_50")),
                    "EMA_20": _safe_float(latest.get("EMA_20")),
                }

        # --- 风险分析 ---
        if req.analysis_type in ("comprehensive", "risk"):
            returns = historical['close'].pct_change().dropna()
            results["risk"] = _calculate_risk_metrics(returns)

        # --- 市场状态 ---
        if req.analysis_type in ("comprehensive", "technical"):
            if model_manager.lightweight_mode or not FEATURE_AVAILABLE:
                results["market_regime"] = _lightweight_regime(historical)
            else:
                try:
                    df_regime = model_manager.feature_engineer.generate_market_regime_features(
                        historical.copy()
                    )
                    regime = int(df_regime['market_regime'].iloc[-1])
                    regime_map = {0: "熊市(高波动)", 1: "牛市(低波动)", 2: "震荡市"}
                    results["market_regime"] = {
                        "state": regime,
                        "label": regime_map.get(regime, "未知"),
                    }
                except Exception as e:
                    logger.warning(f"Market regime detection failed: {e}")
                    results["market_regime"] = _lightweight_regime(historical)

        return AnalysisResponse(
            success=True,
            symbol=req.symbol,
            analysis_type=req.analysis_type,
            results=results,
            generated_at=datetime.now().isoformat(),
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Analysis failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# Lightweight 分析函数 (纯 numpy/pandas)
# ============================================

def _lightweight_technical(df: pd.DataFrame) -> dict:
    """纯 pandas 计算技术指标，不依赖 ta / feature_engineering"""
    close = df['close'].astype(float)
    high = df['high'].astype(float) if 'high' in df.columns else close
    low = df['low'].astype(float) if 'low' in df.columns else close

    # SMA
    sma20 = close.rolling(20).mean()
    sma50 = close.rolling(50).mean()

    # EMA
    ema12 = close.ewm(span=12).mean()
    ema26 = close.ewm(span=26).mean()
    ema20 = close.ewm(span=20).mean()

    # MACD
    macd_line = ema12 - ema26
    signal_line = macd_line.ewm(span=9).mean()
    macd_val = _safe_float(macd_line.iloc[-1])
    signal_val = _safe_float(signal_line.iloc[-1])

    # RSI(14)
    delta = close.diff()
    gain = delta.clip(lower=0).rolling(14).mean()
    loss = (-delta.clip(upper=0)).rolling(14).mean()
    rs = gain / loss.replace(0, 1e-10)
    rsi_14 = 100 - (100 / (1 + rs))
    rsi_val = _safe_float(rsi_14.iloc[-1])

    # Bollinger Bands
    bb_mid = sma20
    bb_std = close.rolling(20).std()
    bb_upper = bb_mid + 2 * bb_std
    bb_lower = bb_mid - 2 * bb_std

    # ATR(14)
    tr = pd.concat([
        high - low,
        (high - close.shift(1)).abs(),
        (low - close.shift(1)).abs()
    ], axis=1).max(axis=1)
    atr_14 = tr.rolling(14).mean()

    # ADX(14) — simplified
    plus_dm = (high.diff()).clip(lower=0)
    minus_dm = (-low.diff()).clip(lower=0)
    plus_di = 100 * (plus_dm.rolling(14).mean() / atr_14.replace(0, 1e-10))
    minus_di = 100 * (minus_dm.rolling(14).mean() / atr_14.replace(0, 1e-10))
    dx = 100 * ((plus_di - minus_di).abs() / (plus_di + minus_di).replace(0, 1e-10))
    adx = dx.rolling(14).mean()

    return {
        "MACD": {
            "macd": macd_val,
            "signal": signal_val,
            "histogram": _safe_float(macd_val - signal_val),
            "interpretation": "金叉" if macd_val > signal_val else "死叉",
        },
        "RSI_14": {
            "value": rsi_val,
            "interpretation": _rsi_interpretation(rsi_val),
        },
        "Bollinger": {
            "upper": _safe_float(bb_upper.iloc[-1]),
            "middle": _safe_float(bb_mid.iloc[-1]),
            "lower": _safe_float(bb_lower.iloc[-1]),
        },
        "ADX": _safe_float(adx.iloc[-1]),
        "ATR_14": _safe_float(atr_14.iloc[-1]),
        "SMA_20": _safe_float(sma20.iloc[-1]),
        "SMA_50": _safe_float(sma50.iloc[-1]),
        "EMA_20": _safe_float(ema20.iloc[-1]),
    }


def _lightweight_regime(df: pd.DataFrame) -> dict:
    """简单波动率分类替代 HMM"""
    returns = df['close'].astype(float).pct_change().dropna()
    recent_vol = float(returns.tail(20).std()) if len(returns) >= 20 else 0.02
    recent_ret = float(returns.tail(20).mean()) if len(returns) >= 20 else 0.0

    if recent_ret > 0.001 and recent_vol < 0.025:
        label = "牛市(低波动)"
        state = 1
    elif recent_ret < -0.001 and recent_vol > 0.02:
        label = "熊市(高波动)"
        state = 0
    else:
        label = "震荡市"
        state = 2

    return {"state": state, "label": label}


# ============================================
# 辅助函数
# ============================================

async def _fetch_stock_history(symbol: str, days: int = 120) -> Optional[pd.DataFrame]:
    """
    从AKShare服务获取历史数据
    生产环境应替换为 TimescaleDB 查询
    """
    import httpx

    akshare_url = os.getenv("AKSHARE_API_URL", "http://localhost:8000")
    clean_symbol = symbol.replace(".SZ", "").replace(".SH", "")

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(
                f"{akshare_url}/api/a/stock/history/{clean_symbol}",
                params={"period": "daily", "limit": days},
            )
            if resp.status_code == 200:
                data = resp.json()
                if data.get("success") and data.get("data"):
                    df = pd.DataFrame(data["data"])
                    for col in ['open', 'high', 'low', 'close', 'volume']:
                        if col in df.columns:
                            df[col] = pd.to_numeric(df[col], errors='coerce')
                    return df
    except Exception as e:
        logger.warning(f"Failed to fetch from AKShare: {e}")

    # Fallback: 生成模拟数据用于开发测试
    logger.warning(f"Using synthetic data for {symbol}")
    np.random.seed(hash(symbol) % 2**31)
    n = days
    dates = pd.date_range(end=datetime.now(), periods=n, freq='B')
    close = np.cumsum(np.random.randn(n) * 0.5) + 100
    close = np.abs(close)

    return pd.DataFrame({
        'time': dates,
        'open': close + np.random.randn(n) * 0.3,
        'high': close + np.abs(np.random.randn(n) * 0.5),
        'low': close - np.abs(np.random.randn(n) * 0.5),
        'close': close,
        'volume': np.random.randint(1_000_000, 50_000_000, n),
    })


def _safe_float(val, default=0.0) -> float:
    try:
        v = float(val)
        return round(v, 4) if not (np.isnan(v) or np.isinf(v)) else default
    except (TypeError, ValueError):
        return default


def _rsi_interpretation(rsi: float) -> str:
    if rsi > 80:
        return "极度超买，注意回调风险"
    elif rsi > 70:
        return "超买区域，谨慎追高"
    elif rsi > 50:
        return "偏强运行"
    elif rsi > 30:
        return "偏弱运行"
    elif rsi > 20:
        return "超卖区域，关注反弹机会"
    else:
        return "极度超卖，可能迎来反弹"


def _calculate_risk_metrics(returns: pd.Series) -> Dict[str, Any]:
    """计算风险指标: VaR, CVaR, Sharpe, Max Drawdown"""
    if len(returns) < 10:
        return {}

    # VaR (95% and 99%)
    var_95 = float(np.percentile(returns, 5))
    var_99 = float(np.percentile(returns, 1))

    # CVaR (Expected Shortfall)
    cvar_95 = float(returns[returns <= var_95].mean()) if len(returns[returns <= var_95]) > 0 else var_95

    # Sharpe Ratio (assuming 0 risk-free rate)
    sharpe = float(returns.mean() / returns.std() * np.sqrt(252)) if returns.std() > 0 else 0.0

    # Max Drawdown
    cum_returns = (1 + returns).cumprod()
    peak = cum_returns.cummax()
    drawdown = (cum_returns - peak) / peak
    max_drawdown = float(drawdown.min())

    # Annualized volatility
    annual_vol = float(returns.std() * np.sqrt(252))

    # Sortino Ratio (downside deviation)
    downside_returns = returns[returns < 0]
    downside_std = float(downside_returns.std()) if len(downside_returns) > 0 else 1e-8
    sortino = float(returns.mean() / downside_std * np.sqrt(252))

    return {
        "VaR_95": round(var_95 * 100, 4),
        "VaR_99": round(var_99 * 100, 4),
        "CVaR_95": round(cvar_95 * 100, 4),
        "sharpe_ratio": round(sharpe, 4),
        "sortino_ratio": round(sortino, 4),
        "max_drawdown": round(max_drawdown * 100, 4),
        "annual_volatility": round(annual_vol * 100, 4),
        "interpretation": _risk_interpretation(sharpe, max_drawdown, annual_vol),
    }


def _risk_interpretation(sharpe: float, max_dd: float, vol: float) -> str:
    parts = []
    if sharpe > 1.5:
        parts.append("风险调整收益优秀")
    elif sharpe > 0.5:
        parts.append("风险调整收益一般")
    else:
        parts.append("风险调整收益较差")

    if abs(max_dd) > 0.3:
        parts.append("历史最大回撤较大，需注意风控")
    if vol > 0.4:
        parts.append("波动率偏高")

    return "；".join(parts)


# ============================================
# 启动入口
# ============================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "ml_services.inference_service:app",
        host="0.0.0.0",
        port=8002,
        reload=True,
        log_level="info",
    )
