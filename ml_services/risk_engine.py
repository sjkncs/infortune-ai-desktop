"""
Risk Engine - 量化风控引擎
解决问题: 项目完全缺少因子模型、风险度量、组合优化等量化核心模块

包含:
1. Fama-French 三因子模型
2. VaR / CVaR (Expected Shortfall)
3. 均值-方差组合优化 (Markowitz)
4. 风险预算 (Risk Parity)
5. 动态止损引擎
"""

import numpy as np
import pandas as pd
from scipy import stats
from scipy.optimize import minimize
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from loguru import logger
import warnings
warnings.filterwarnings('ignore')


# ============================================
# 数据结构
# ============================================

@dataclass
class RiskReport:
    """风险评估报告"""
    symbol: str
    date: str
    var_95: float = 0.0          # 95% VaR (日度)
    var_99: float = 0.0          # 99% VaR (日度)
    cvar_95: float = 0.0         # 95% CVaR (Expected Shortfall)
    cvar_99: float = 0.0
    sharpe_ratio: float = 0.0
    sortino_ratio: float = 0.0
    calmar_ratio: float = 0.0
    max_drawdown: float = 0.0
    max_drawdown_duration: int = 0  # 最大回撤持续天数
    annual_volatility: float = 0.0
    downside_volatility: float = 0.0
    beta: float = 0.0            # 相对大盘Beta
    alpha: float = 0.0           # Jensen's Alpha
    information_ratio: float = 0.0
    tail_ratio: float = 0.0      # 右尾/左尾比
    skewness: float = 0.0
    kurtosis: float = 0.0


@dataclass
class PortfolioAllocation:
    """组合配置结果"""
    weights: Dict[str, float]
    expected_return: float
    expected_volatility: float
    sharpe_ratio: float
    method: str


# ============================================
# 风险度量引擎
# ============================================

class RiskMetricsEngine:
    """
    风险度量计算引擎

    支持:
    - 参数法 VaR (正态分布假设)
    - 历史模拟法 VaR
    - Cornish-Fisher VaR (考虑偏度和峰度)
    - Monte Carlo VaR
    """

    TRADING_DAYS_PER_YEAR = 252
    RISK_FREE_RATE = 0.02  # 年化无风险利率 (可配置)

    def __init__(self, risk_free_rate: float = 0.02):
        self.RISK_FREE_RATE = risk_free_rate
        self.daily_rf = (1 + risk_free_rate) ** (1 / self.TRADING_DAYS_PER_YEAR) - 1

    def full_risk_report(
        self,
        returns: pd.Series,
        benchmark_returns: Optional[pd.Series] = None,
        symbol: str = "UNKNOWN"
    ) -> RiskReport:
        """生成完整风险评估报告"""

        report = RiskReport(
            symbol=symbol,
            date=datetime.now().strftime("%Y-%m-%d"),
        )

        if len(returns) < 20:
            logger.warning(f"Insufficient data for {symbol}: {len(returns)} records")
            return report

        # --- VaR & CVaR ---
        report.var_95 = self.historical_var(returns, 0.05)
        report.var_99 = self.historical_var(returns, 0.01)
        report.cvar_95 = self.expected_shortfall(returns, 0.05)
        report.cvar_99 = self.expected_shortfall(returns, 0.01)

        # --- 波动率 ---
        report.annual_volatility = float(returns.std() * np.sqrt(self.TRADING_DAYS_PER_YEAR))
        downside = returns[returns < 0]
        report.downside_volatility = float(
            downside.std() * np.sqrt(self.TRADING_DAYS_PER_YEAR)
        ) if len(downside) > 0 else 0.0

        # --- 比率指标 ---
        excess_returns = returns - self.daily_rf
        report.sharpe_ratio = self._annualized_ratio(excess_returns.mean(), returns.std())
        report.sortino_ratio = self._annualized_ratio(
            excess_returns.mean(),
            downside.std() if len(downside) > 0 else 1e-8
        )

        # --- 回撤分析 ---
        cum = (1 + returns).cumprod()
        peak = cum.cummax()
        drawdowns = (cum - peak) / peak
        report.max_drawdown = float(drawdowns.min())
        report.max_drawdown_duration = self._max_drawdown_duration(drawdowns)

        # Calmar Ratio
        annual_return = float((cum.iloc[-1] ** (self.TRADING_DAYS_PER_YEAR / len(returns))) - 1)
        report.calmar_ratio = (
            annual_return / abs(report.max_drawdown)
            if abs(report.max_drawdown) > 1e-8 else 0.0
        )

        # --- 分布特征 ---
        report.skewness = float(returns.skew())
        report.kurtosis = float(returns.kurtosis())
        report.tail_ratio = self._tail_ratio(returns)

        # --- Alpha / Beta (CAPM) ---
        if benchmark_returns is not None and len(benchmark_returns) >= 20:
            aligned = pd.DataFrame({
                'asset': returns, 'bench': benchmark_returns
            }).dropna()
            if len(aligned) >= 20:
                report.beta, report.alpha, report.information_ratio = (
                    self._capm_metrics(aligned['asset'], aligned['bench'])
                )

        return report

    # ---------- VaR Methods ----------

    @staticmethod
    def historical_var(returns: pd.Series, confidence: float = 0.05) -> float:
        """历史模拟法 VaR"""
        return float(np.percentile(returns, confidence * 100))

    @staticmethod
    def parametric_var(returns: pd.Series, confidence: float = 0.05) -> float:
        """参数法 VaR (正态假设)"""
        mu = returns.mean()
        sigma = returns.std()
        z = stats.norm.ppf(confidence)
        return float(mu + z * sigma)

    @staticmethod
    def cornish_fisher_var(returns: pd.Series, confidence: float = 0.05) -> float:
        """
        Cornish-Fisher VaR — 修正正态分布假设
        考虑偏度(skewness)和超额峰度(excess kurtosis)
        """
        mu = returns.mean()
        sigma = returns.std()
        s = returns.skew()
        k = returns.kurtosis()
        z = stats.norm.ppf(confidence)

        # Cornish-Fisher 展开
        z_cf = (z
                + (z**2 - 1) * s / 6
                + (z**3 - 3*z) * k / 24
                - (2*z**3 - 5*z) * s**2 / 36)

        return float(mu + z_cf * sigma)

    @staticmethod
    def monte_carlo_var(
        returns: pd.Series,
        confidence: float = 0.05,
        n_simulations: int = 10000,
        horizon: int = 1
    ) -> float:
        """Monte Carlo VaR"""
        mu = returns.mean()
        sigma = returns.std()
        simulated = np.random.normal(mu * horizon, sigma * np.sqrt(horizon), n_simulations)
        return float(np.percentile(simulated, confidence * 100))

    @staticmethod
    def expected_shortfall(returns: pd.Series, confidence: float = 0.05) -> float:
        """CVaR / Expected Shortfall"""
        var = np.percentile(returns, confidence * 100)
        tail = returns[returns <= var]
        return float(tail.mean()) if len(tail) > 0 else float(var)

    # ---------- Helper ----------

    def _annualized_ratio(self, mean_excess: float, std: float) -> float:
        if std < 1e-8:
            return 0.0
        return float(mean_excess / std * np.sqrt(self.TRADING_DAYS_PER_YEAR))

    @staticmethod
    def _max_drawdown_duration(drawdowns: pd.Series) -> int:
        is_dd = drawdowns < 0
        groups = (~is_dd).cumsum()
        if is_dd.sum() == 0:
            return 0
        return int(is_dd.groupby(groups).sum().max())

    @staticmethod
    def _tail_ratio(returns: pd.Series) -> float:
        p95 = np.percentile(returns, 95)
        p05 = np.percentile(returns, 5)
        return float(abs(p95 / p05)) if abs(p05) > 1e-8 else 0.0

    def _capm_metrics(
        self,
        asset_returns: pd.Series,
        benchmark_returns: pd.Series
    ) -> Tuple[float, float, float]:
        """CAPM: Beta, Alpha, Information Ratio"""
        cov_matrix = np.cov(asset_returns, benchmark_returns)
        beta = cov_matrix[0, 1] / cov_matrix[1, 1] if cov_matrix[1, 1] > 1e-12 else 0.0

        # Jensen's Alpha (annualized)
        asset_annual = float(asset_returns.mean() * self.TRADING_DAYS_PER_YEAR)
        bench_annual = float(benchmark_returns.mean() * self.TRADING_DAYS_PER_YEAR)
        alpha = asset_annual - (self.RISK_FREE_RATE + beta * (bench_annual - self.RISK_FREE_RATE))

        # Information Ratio
        active_returns = asset_returns - benchmark_returns
        tracking_error = active_returns.std() * np.sqrt(self.TRADING_DAYS_PER_YEAR)
        ir = float(active_returns.mean() * self.TRADING_DAYS_PER_YEAR / tracking_error) if tracking_error > 1e-8 else 0.0

        return float(beta), float(alpha), ir


# ============================================
# 组合优化引擎
# ============================================

class PortfolioOptimizer:
    """
    投资组合优化器

    方法:
    1. 均值-方差优化 (Markowitz)
    2. 最大夏普比率
    3. 最小方差
    4. 风险平价 (Risk Parity)
    5. 等权重 (Baseline)
    """

    def __init__(self, risk_free_rate: float = 0.02):
        self.rf = risk_free_rate
        self.daily_rf = (1 + risk_free_rate) ** (1 / 252) - 1

    def optimize(
        self,
        returns_df: pd.DataFrame,
        method: str = "max_sharpe",
        constraints: Optional[Dict] = None
    ) -> PortfolioAllocation:
        """
        统一优化入口

        Args:
            returns_df: DataFrame, columns = asset names, values = daily returns
            method: 'max_sharpe' | 'min_variance' | 'risk_parity' | 'equal_weight'
            constraints: {'max_weight': 0.3, 'min_weight': 0.02, 'sector_limits': {...}}
        """
        n_assets = returns_df.shape[1]
        mu = returns_df.mean().values * 252
        cov = returns_df.cov().values * 252
        symbols = returns_df.columns.tolist()

        if constraints is None:
            constraints = {}

        max_w = constraints.get('max_weight', 1.0)
        min_w = constraints.get('min_weight', 0.0)
        bounds = [(min_w, max_w)] * n_assets

        if method == "equal_weight":
            weights = np.ones(n_assets) / n_assets
        elif method == "min_variance":
            weights = self._min_variance(cov, bounds)
        elif method == "max_sharpe":
            weights = self._max_sharpe(mu, cov, bounds)
        elif method == "risk_parity":
            weights = self._risk_parity(cov)
        else:
            raise ValueError(f"Unknown method: {method}")

        # 计算组合指标
        port_return = float(weights @ mu)
        port_vol = float(np.sqrt(weights @ cov @ weights))
        port_sharpe = (port_return - self.rf) / port_vol if port_vol > 1e-8 else 0.0

        return PortfolioAllocation(
            weights=dict(zip(symbols, [round(w, 6) for w in weights])),
            expected_return=round(port_return, 6),
            expected_volatility=round(port_vol, 6),
            sharpe_ratio=round(port_sharpe, 4),
            method=method,
        )

    def efficient_frontier(
        self,
        returns_df: pd.DataFrame,
        n_points: int = 50
    ) -> List[Dict]:
        """生成有效前沿数据点"""
        mu = returns_df.mean().values * 252
        cov = returns_df.cov().values * 252
        n = len(mu)

        target_returns = np.linspace(mu.min(), mu.max(), n_points)
        frontier = []

        for target in target_returns:
            try:
                cons = [
                    {'type': 'eq', 'fun': lambda w: np.sum(w) - 1},
                    {'type': 'eq', 'fun': lambda w, t=target: w @ mu - t},
                ]
                bounds = [(0, 1)] * n
                w0 = np.ones(n) / n

                result = minimize(
                    lambda w: np.sqrt(w @ cov @ w),
                    w0, method='SLSQP', bounds=bounds, constraints=cons,
                    options={'maxiter': 1000}
                )

                if result.success:
                    vol = float(np.sqrt(result.x @ cov @ result.x))
                    frontier.append({
                        'return': round(float(target), 6),
                        'volatility': round(vol, 6),
                        'sharpe': round((float(target) - self.rf) / vol, 4) if vol > 1e-8 else 0,
                    })
            except Exception:
                continue

        return frontier

    # ---------- 优化方法实现 ----------

    @staticmethod
    def _min_variance(cov: np.ndarray, bounds: list) -> np.ndarray:
        n = cov.shape[0]
        w0 = np.ones(n) / n
        cons = [{'type': 'eq', 'fun': lambda w: np.sum(w) - 1}]

        result = minimize(
            lambda w: np.sqrt(w @ cov @ w),
            w0, method='SLSQP', bounds=bounds, constraints=cons,
            options={'maxiter': 1000}
        )
        return result.x if result.success else w0

    def _max_sharpe(self, mu: np.ndarray, cov: np.ndarray, bounds: list) -> np.ndarray:
        n = len(mu)
        w0 = np.ones(n) / n
        cons = [{'type': 'eq', 'fun': lambda w: np.sum(w) - 1}]

        def neg_sharpe(w):
            port_return = w @ mu
            port_vol = np.sqrt(w @ cov @ w)
            return -(port_return - self.rf) / port_vol if port_vol > 1e-8 else 0

        result = minimize(
            neg_sharpe, w0, method='SLSQP', bounds=bounds, constraints=cons,
            options={'maxiter': 1000}
        )
        return result.x if result.success else w0

    @staticmethod
    def _risk_parity(cov: np.ndarray) -> np.ndarray:
        """
        风险平价 (Risk Parity / Equal Risk Contribution)
        每个资产对组合总风险的贡献相等
        """
        n = cov.shape[0]
        w0 = np.ones(n) / n

        def risk_budget_objective(w):
            port_vol = np.sqrt(w @ cov @ w)
            marginal_risk = cov @ w
            risk_contrib = w * marginal_risk / port_vol
            target_risk = port_vol / n
            return np.sum((risk_contrib - target_risk) ** 2)

        cons = [{'type': 'eq', 'fun': lambda w: np.sum(w) - 1}]
        bounds = [(0.01, 1.0)] * n

        result = minimize(
            risk_budget_objective, w0, method='SLSQP',
            bounds=bounds, constraints=cons,
            options={'maxiter': 1000}
        )
        return result.x if result.success else w0


# ============================================
# Fama-French 三因子模型
# ============================================

class FamaFrenchModel:
    """
    Fama-French 三因子模型

    R_i - R_f = alpha + beta_mkt * (R_m - R_f) + beta_smb * SMB + beta_hml * HML + epsilon

    用途:
    - 评估基金/策略的超额收益来源
    - 检验选股能力 (alpha显著性)
    - 风格归因
    """

    def __init__(self):
        self.results = {}

    def fit(
        self,
        asset_returns: pd.Series,
        market_returns: pd.Series,
        smb: pd.Series,
        hml: pd.Series,
        risk_free: Optional[pd.Series] = None,
    ) -> Dict[str, Any]:
        """
        拟合三因子模型

        Args:
            asset_returns: 资产日收益率
            market_returns: 市场基准收益率
            smb: Small Minus Big (市值因子)
            hml: High Minus Low (价值因子)
            risk_free: 无风险利率 (可选)
        """
        # 对齐数据
        df = pd.DataFrame({
            'asset': asset_returns,
            'market': market_returns,
            'smb': smb,
            'hml': hml,
        }).dropna()

        if risk_free is not None:
            df['rf'] = risk_free.reindex(df.index).fillna(0)
        else:
            df['rf'] = 0.02 / 252

        # 超额收益
        df['excess_asset'] = df['asset'] - df['rf']
        df['excess_market'] = df['market'] - df['rf']

        # OLS 回归
        from numpy.linalg import lstsq

        X = np.column_stack([
            np.ones(len(df)),
            df['excess_market'].values,
            df['smb'].values,
            df['hml'].values,
        ])
        y = df['excess_asset'].values

        betas, residuals, _, _ = lstsq(X, y, rcond=None)

        # 预测和残差
        y_pred = X @ betas
        resid = y - y_pred
        n, k = X.shape

        # 统计检验
        mse = np.sum(resid ** 2) / (n - k)
        var_betas = mse * np.linalg.inv(X.T @ X).diagonal()
        se_betas = np.sqrt(var_betas)
        t_stats = betas / se_betas
        p_values = [2 * (1 - stats.t.cdf(abs(t), n - k)) for t in t_stats]

        # R-squared
        ss_res = np.sum(resid ** 2)
        ss_tot = np.sum((y - y.mean()) ** 2)
        r_squared = 1 - ss_res / ss_tot if ss_tot > 1e-12 else 0.0
        adj_r_squared = 1 - (1 - r_squared) * (n - 1) / (n - k - 1)

        factor_names = ['alpha', 'beta_mkt', 'beta_smb', 'beta_hml']

        self.results = {
            'factors': {
                name: {
                    'coefficient': round(float(betas[i]), 6),
                    'std_error': round(float(se_betas[i]), 6),
                    't_statistic': round(float(t_stats[i]), 4),
                    'p_value': round(float(p_values[i]), 6),
                    'significant': p_values[i] < 0.05,
                }
                for i, name in enumerate(factor_names)
            },
            'r_squared': round(r_squared, 6),
            'adj_r_squared': round(adj_r_squared, 6),
            'n_observations': n,
            'interpretation': self._interpret(betas, p_values),
        }

        return self.results

    @staticmethod
    def _interpret(betas: np.ndarray, p_values: list) -> str:
        parts = []

        # Alpha
        if p_values[0] < 0.05:
            if betas[0] > 0:
                parts.append(f"存在显著正Alpha({betas[0]*252*100:.2f}%年化)，表明有真正的选股能力")
            else:
                parts.append(f"存在显著负Alpha({betas[0]*252*100:.2f}%年化)，策略跑输基准")
        else:
            parts.append("Alpha不显著，超额收益可被因子解释")

        # Market Beta
        if p_values[1] < 0.05:
            if betas[1] > 1.1:
                parts.append("高Beta策略，杠杆化市场敞口")
            elif betas[1] < 0.9:
                parts.append("低Beta策略，防御性特征")

        # SMB
        if p_values[2] < 0.05:
            parts.append("小盘偏好" if betas[2] > 0 else "大盘偏好")

        # HML
        if p_values[3] < 0.05:
            parts.append("价值偏好" if betas[3] > 0 else "成长偏好")

        return "；".join(parts)

    def generate_synthetic_factors(
        self,
        stock_returns_df: pd.DataFrame,
        market_cap_series: Optional[pd.Series] = None,
        pb_ratio_series: Optional[pd.Series] = None,
    ) -> Tuple[pd.Series, pd.Series]:
        """
        当无法获取真实 FF 因子数据时，
        基于股票横截面数据构造近似的 SMB 和 HML 因子

        Args:
            stock_returns_df: 多只股票的收益率 DataFrame (columns=symbols)
            market_cap_series: 市值序列
            pb_ratio_series: 市净率序列
        """
        n_stocks = stock_returns_df.shape[1]
        half = n_stocks // 2

        if market_cap_series is not None:
            sorted_by_cap = market_cap_series.sort_values()
            small_stocks = sorted_by_cap.index[:half].tolist()
            big_stocks = sorted_by_cap.index[half:].tolist()
        else:
            cols = stock_returns_df.columns.tolist()
            np.random.shuffle(cols)
            small_stocks = cols[:half]
            big_stocks = cols[half:]

        smb = stock_returns_df[small_stocks].mean(axis=1) - stock_returns_df[big_stocks].mean(axis=1)

        if pb_ratio_series is not None:
            sorted_by_pb = pb_ratio_series.sort_values(ascending=False)
            value_stocks = sorted_by_pb.index[:half].tolist()
            growth_stocks = sorted_by_pb.index[half:].tolist()
        else:
            cols = stock_returns_df.columns.tolist()
            np.random.shuffle(cols)
            value_stocks = cols[:half]
            growth_stocks = cols[half:]

        hml = stock_returns_df[value_stocks].mean(axis=1) - stock_returns_df[growth_stocks].mean(axis=1)

        return smb, hml


# ============================================
# 动态止损引擎
# ============================================

class DynamicStopLoss:
    """
    动态止损策略

    支持:
    - 固定百分比止损
    - ATR 波动率自适应止损
    - 追踪止损 (Trailing Stop)
    - Chandelier Exit
    """

    @staticmethod
    def fixed_stop(entry_price: float, stop_pct: float = 0.05) -> float:
        """固定百分比止损"""
        return entry_price * (1 - stop_pct)

    @staticmethod
    def atr_stop(
        entry_price: float,
        atr: float,
        multiplier: float = 2.0
    ) -> float:
        """ATR 自适应止损"""
        return entry_price - multiplier * atr

    @staticmethod
    def trailing_stop(
        prices: pd.Series,
        trailing_pct: float = 0.05
    ) -> pd.Series:
        """追踪止损"""
        peak = prices.cummax()
        stop_level = peak * (1 - trailing_pct)
        return stop_level

    @staticmethod
    def chandelier_exit(
        high: pd.Series,
        low: pd.Series,
        close: pd.Series,
        period: int = 22,
        multiplier: float = 3.0
    ) -> pd.Series:
        """
        Chandelier Exit (吊灯止损)
        基于最高价和ATR动态计算止损位
        """
        # 计算ATR
        tr = pd.concat([
            high - low,
            (high - close.shift(1)).abs(),
            (low - close.shift(1)).abs()
        ], axis=1).max(axis=1)
        atr = tr.rolling(window=period).mean()

        highest_high = high.rolling(window=period).max()
        stop = highest_high - multiplier * atr
        return stop


# ============================================
# 使用示例 / 测试
# ============================================

if __name__ == "__main__":
    logger.info("Testing Risk Engine...")

    np.random.seed(42)

    # 生成模拟数据
    n_days = 500
    n_assets = 5
    symbols = ['000001.SZ', '000002.SZ', '600519.SH', '600036.SH', '000858.SZ']

    returns_df = pd.DataFrame(
        np.random.randn(n_days, n_assets) * 0.02,
        columns=symbols,
        index=pd.date_range('2022-01-01', periods=n_days, freq='B')
    )

    market_returns = returns_df.mean(axis=1)

    # 1. 风险度量
    engine = RiskMetricsEngine()
    for sym in symbols:
        report = engine.full_risk_report(returns_df[sym], market_returns, symbol=sym)
        logger.info(
            f"{sym}: Sharpe={report.sharpe_ratio:.3f}, "
            f"MaxDD={report.max_drawdown*100:.2f}%, "
            f"VaR95={report.var_95*100:.2f}%, "
            f"CVaR95={report.cvar_95*100:.2f}%"
        )

    # 2. 组合优化
    optimizer = PortfolioOptimizer()

    for method in ['equal_weight', 'min_variance', 'max_sharpe', 'risk_parity']:
        alloc = optimizer.optimize(returns_df, method=method)
        logger.info(
            f"[{method}] Return={alloc.expected_return*100:.2f}%, "
            f"Vol={alloc.expected_volatility*100:.2f}%, "
            f"Sharpe={alloc.sharpe_ratio:.3f}"
        )
        logger.info(f"  Weights: {alloc.weights}")

    # 3. 有效前沿
    frontier = optimizer.efficient_frontier(returns_df, n_points=20)
    logger.info(f"Efficient frontier: {len(frontier)} points generated")

    # 4. Fama-French
    ff = FamaFrenchModel()
    smb, hml = ff.generate_synthetic_factors(returns_df)
    result = ff.fit(
        returns_df[symbols[0]],
        market_returns,
        smb, hml
    )
    logger.info(f"FF3 Results: {json.dumps(result, indent=2, ensure_ascii=False)}")

    import json
    logger.info("Risk Engine tests complete!")
