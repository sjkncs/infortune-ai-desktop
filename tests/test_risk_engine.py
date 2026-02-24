"""
Unit Tests for Risk Engine
测试风险度量、组合优化、Fama-French三因子模型
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import numpy as np
import pandas as pd
import pytest

from ml_services.risk_engine import (
    RiskMetricsEngine,
    PortfolioOptimizer,
    FamaFrenchModel,
    DynamicStopLoss,
    RiskReport,
    PortfolioAllocation,
)


# ============================================
# Fixtures
# ============================================

@pytest.fixture
def sample_returns():
    np.random.seed(42)
    return pd.Series(np.random.randn(500) * 0.02, name='returns')


@pytest.fixture
def multi_asset_returns():
    np.random.seed(42)
    n = 500
    symbols = ['A', 'B', 'C', 'D', 'E']
    data = np.random.randn(n, 5) * 0.02
    return pd.DataFrame(data, columns=symbols,
                        index=pd.date_range('2022-01-01', periods=n, freq='B'))


@pytest.fixture
def benchmark_returns(sample_returns):
    np.random.seed(99)
    return pd.Series(np.random.randn(len(sample_returns)) * 0.015, name='benchmark')


@pytest.fixture
def engine():
    return RiskMetricsEngine(risk_free_rate=0.02)


@pytest.fixture
def optimizer():
    return PortfolioOptimizer(risk_free_rate=0.02)


# ============================================
# RiskMetricsEngine Tests
# ============================================

class TestRiskMetricsEngine:

    def test_full_risk_report_returns_valid_object(self, engine, sample_returns):
        report = engine.full_risk_report(sample_returns, symbol='TEST')
        assert isinstance(report, RiskReport)
        assert report.symbol == 'TEST'
        assert report.date != ''

    def test_var_95_is_negative(self, engine, sample_returns):
        report = engine.full_risk_report(sample_returns)
        assert report.var_95 < 0, "VaR(95%) should be negative for typical returns"

    def test_var_99_more_extreme_than_95(self, engine, sample_returns):
        report = engine.full_risk_report(sample_returns)
        assert report.var_99 <= report.var_95, "VaR(99%) should be <= VaR(95%)"

    def test_cvar_more_extreme_than_var(self, engine, sample_returns):
        report = engine.full_risk_report(sample_returns)
        assert report.cvar_95 <= report.var_95, "CVaR should be <= VaR"

    def test_max_drawdown_is_negative_or_zero(self, engine, sample_returns):
        report = engine.full_risk_report(sample_returns)
        assert report.max_drawdown <= 0

    def test_annual_volatility_positive(self, engine, sample_returns):
        report = engine.full_risk_report(sample_returns)
        assert report.annual_volatility > 0

    def test_sharpe_ratio_finite(self, engine, sample_returns):
        report = engine.full_risk_report(sample_returns)
        assert np.isfinite(report.sharpe_ratio)

    def test_with_benchmark(self, engine, sample_returns, benchmark_returns):
        report = engine.full_risk_report(sample_returns, benchmark_returns)
        assert np.isfinite(report.beta)
        assert np.isfinite(report.alpha)

    def test_insufficient_data(self, engine):
        short_returns = pd.Series([0.01, -0.01, 0.005])
        report = engine.full_risk_report(short_returns)
        # Should return a default report without error
        assert isinstance(report, RiskReport)

    def test_historical_var(self, engine, sample_returns):
        var = engine.historical_var(sample_returns, 0.05)
        assert isinstance(var, float)
        assert var < 0

    def test_parametric_var(self, engine, sample_returns):
        var = engine.parametric_var(sample_returns, 0.05)
        assert isinstance(var, float)

    def test_cornish_fisher_var(self, engine, sample_returns):
        var = engine.cornish_fisher_var(sample_returns, 0.05)
        assert isinstance(var, float)

    def test_monte_carlo_var(self, engine, sample_returns):
        var = engine.monte_carlo_var(sample_returns, 0.05, n_simulations=5000)
        assert isinstance(var, float)
        assert var < 0

    def test_expected_shortfall(self, engine, sample_returns):
        es = engine.expected_shortfall(sample_returns, 0.05)
        assert isinstance(es, float)
        assert es < 0

    def test_tail_ratio(self, engine, sample_returns):
        tr = engine._tail_ratio(sample_returns)
        assert tr > 0

    def test_skewness_kurtosis(self, engine, sample_returns):
        report = engine.full_risk_report(sample_returns)
        assert np.isfinite(report.skewness)
        assert np.isfinite(report.kurtosis)


# ============================================
# PortfolioOptimizer Tests
# ============================================

class TestPortfolioOptimizer:

    def test_equal_weight(self, optimizer, multi_asset_returns):
        alloc = optimizer.optimize(multi_asset_returns, method='equal_weight')
        assert isinstance(alloc, PortfolioAllocation)
        weights = list(alloc.weights.values())
        assert abs(sum(weights) - 1.0) < 1e-6
        assert all(abs(w - 0.2) < 1e-6 for w in weights)

    def test_min_variance(self, optimizer, multi_asset_returns):
        alloc = optimizer.optimize(multi_asset_returns, method='min_variance')
        weights = list(alloc.weights.values())
        assert abs(sum(weights) - 1.0) < 1e-4
        assert all(w >= -0.01 for w in weights)  # small numerical tolerance

    def test_max_sharpe(self, optimizer, multi_asset_returns):
        alloc = optimizer.optimize(multi_asset_returns, method='max_sharpe')
        weights = list(alloc.weights.values())
        assert abs(sum(weights) - 1.0) < 1e-4
        assert np.isfinite(alloc.sharpe_ratio)

    def test_risk_parity(self, optimizer, multi_asset_returns):
        alloc = optimizer.optimize(multi_asset_returns, method='risk_parity')
        weights = list(alloc.weights.values())
        assert abs(sum(weights) - 1.0) < 1e-4
        assert all(w > 0 for w in weights)

    def test_max_weight_constraint(self, optimizer, multi_asset_returns):
        alloc = optimizer.optimize(
            multi_asset_returns, method='max_sharpe',
            constraints={'max_weight': 0.3, 'min_weight': 0.05}
        )
        weights = list(alloc.weights.values())
        assert all(w <= 0.31 for w in weights)  # small tolerance

    def test_efficient_frontier(self, optimizer, multi_asset_returns):
        frontier = optimizer.efficient_frontier(multi_asset_returns, n_points=10)
        assert len(frontier) > 0
        for point in frontier:
            assert 'return' in point
            assert 'volatility' in point
            assert point['volatility'] >= 0

    def test_unknown_method_raises(self, optimizer, multi_asset_returns):
        with pytest.raises(ValueError):
            optimizer.optimize(multi_asset_returns, method='invalid_method')


# ============================================
# FamaFrenchModel Tests
# ============================================

class TestFamaFrenchModel:

    def test_fit_returns_valid_results(self, multi_asset_returns):
        ff = FamaFrenchModel()
        market = multi_asset_returns.mean(axis=1)
        smb, hml = ff.generate_synthetic_factors(multi_asset_returns)

        result = ff.fit(
            multi_asset_returns['A'], market, smb, hml
        )

        assert 'factors' in result
        assert 'alpha' in result['factors']
        assert 'beta_mkt' in result['factors']
        assert 'beta_smb' in result['factors']
        assert 'beta_hml' in result['factors']
        assert 'r_squared' in result
        assert 0 <= result['r_squared'] <= 1.0

    def test_factor_coefficients_are_finite(self, multi_asset_returns):
        ff = FamaFrenchModel()
        market = multi_asset_returns.mean(axis=1)
        smb, hml = ff.generate_synthetic_factors(multi_asset_returns)

        result = ff.fit(multi_asset_returns['A'], market, smb, hml)

        for factor_name, factor_data in result['factors'].items():
            assert np.isfinite(factor_data['coefficient']), f"{factor_name} coefficient not finite"
            assert np.isfinite(factor_data['t_statistic']), f"{factor_name} t-stat not finite"
            assert 0 <= factor_data['p_value'] <= 1.0, f"{factor_name} p-value out of range"

    def test_synthetic_factors_shape(self, multi_asset_returns):
        ff = FamaFrenchModel()
        smb, hml = ff.generate_synthetic_factors(multi_asset_returns)
        assert len(smb) == len(multi_asset_returns)
        assert len(hml) == len(multi_asset_returns)

    def test_interpretation_nonempty(self, multi_asset_returns):
        ff = FamaFrenchModel()
        market = multi_asset_returns.mean(axis=1)
        smb, hml = ff.generate_synthetic_factors(multi_asset_returns)
        result = ff.fit(multi_asset_returns['A'], market, smb, hml)
        assert isinstance(result['interpretation'], str)
        assert len(result['interpretation']) > 0


# ============================================
# DynamicStopLoss Tests
# ============================================

class TestDynamicStopLoss:

    def test_fixed_stop(self):
        stop = DynamicStopLoss.fixed_stop(100.0, 0.05)
        assert stop == 95.0

    def test_atr_stop(self):
        stop = DynamicStopLoss.atr_stop(100.0, atr=2.0, multiplier=2.0)
        assert stop == 96.0

    def test_trailing_stop(self):
        prices = pd.Series([100, 102, 101, 105, 103, 106])
        stops = DynamicStopLoss.trailing_stop(prices, trailing_pct=0.05)
        assert len(stops) == len(prices)
        # Stop should never decrease
        for i in range(1, len(stops)):
            assert stops.iloc[i] >= stops.iloc[i - 1]

    def test_chandelier_exit(self):
        np.random.seed(42)
        n = 50
        high = pd.Series(np.cumsum(np.random.randn(n) * 0.5) + 110)
        low = high - np.abs(np.random.randn(n) * 0.5)
        close = (high + low) / 2
        stops = DynamicStopLoss.chandelier_exit(high, low, close, period=22)
        assert len(stops) == n
        # First 21 values should be NaN (not enough data for period=22)
        assert stops.iloc[:21].isna().all()
        assert stops.iloc[21:].notna().all()


# ============================================
# Entry point
# ============================================

if __name__ == '__main__':
    pytest.main([__file__, '-v', '--tb=short'])
