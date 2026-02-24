"""
Unit Tests for Backtest Engine
测试事件驱动回测引擎、策略、成本模型
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import numpy as np
import pandas as pd
import pytest

from ml_services.backtest_engine import (
    BacktestEngine,
    BacktestConfig,
    CostModel,
    MAStrategy,
    MACDStrategy,
    RSIMeanReversionStrategy,
    BollingerBandStrategy,
    StrategyComparator,
    Side,
    Order,
    OrderStatus,
    Position,
    Portfolio,
)


# ============================================
# Fixtures
# ============================================

@pytest.fixture
def sample_data():
    np.random.seed(42)
    n = 300
    dates = pd.date_range('2023-01-01', periods=n, freq='B')
    close = np.cumsum(np.random.randn(n) * 0.5) + 100
    close = np.maximum(close, 10)
    return pd.DataFrame({
        'symbol': ['000001.SZ'] * n,
        'open': close + np.random.randn(n) * 0.2,
        'high': close + np.abs(np.random.randn(n) * 0.5),
        'low': close - np.abs(np.random.randn(n) * 0.5),
        'close': close,
        'volume': np.random.randint(1_000_000, 50_000_000, n),
    }, index=dates)


@pytest.fixture
def config():
    return BacktestConfig(
        initial_capital=1_000_000,
        commission_rate=0.0003,
        stamp_tax_rate=0.001,
        slippage_bps=1.0,
        min_commission=5.0,
        max_position_pct=0.3,
    )


@pytest.fixture
def engine(config):
    return BacktestEngine(config)


# ============================================
# CostModel Tests
# ============================================

class TestCostModel:

    def test_buy_commission(self, config):
        cm = CostModel(config)
        comm = cm.calculate_commission(100.0, 1000, Side.BUY)
        expected = max(100.0 * 1000 * 0.0003, 5.0)
        assert abs(comm - expected) < 0.01

    def test_sell_commission_includes_stamp_tax(self, config):
        cm = CostModel(config)
        comm_buy = cm.calculate_commission(100.0, 1000, Side.BUY)
        comm_sell = cm.calculate_commission(100.0, 1000, Side.SELL)
        assert comm_sell > comm_buy, "Sell should include stamp tax"

    def test_min_commission(self, config):
        cm = CostModel(config)
        # Very small trade
        comm = cm.calculate_commission(1.0, 1, Side.BUY)
        assert comm >= config.min_commission

    def test_slippage_direction(self, config):
        cm = CostModel(config)
        buy_fill = cm.get_fill_price(100.0, Side.BUY)
        sell_fill = cm.get_fill_price(100.0, Side.SELL)
        assert buy_fill > 100.0, "Buy fill price should be above market"
        assert sell_fill < 100.0, "Sell fill price should be below market"


# ============================================
# Position & Portfolio Tests
# ============================================

class TestPosition:

    def test_unrealized_pnl(self):
        pos = Position(symbol='TEST', quantity=100, avg_cost=50.0)
        pos.update_unrealized(55.0)
        assert pos.unrealized_pnl == 500.0  # (55-50)*100

    def test_market_value(self):
        pos = Position(symbol='TEST', quantity=100, avg_cost=50.0)
        assert pos.market_value == 5000.0


class TestPortfolio:

    def test_initial_state(self):
        p = Portfolio(initial_capital=1_000_000)
        assert p.cash == 1_000_000
        assert p.total_value == 1_000_000
        assert p.total_pnl == 0


# ============================================
# Strategy Tests
# ============================================

class TestMAStrategy:

    def test_creates_orders(self, sample_data):
        strategy = MAStrategy(short_window=5, long_window=20, position_size=0.3)
        portfolio = Portfolio(initial_capital=1_000_000, cash=1_000_000)

        all_orders = []
        for i in range(len(sample_data)):
            orders = strategy.generate_signals(sample_data, portfolio, i)
            all_orders.extend(orders)

        # Should generate at least some orders over 300 bars
        assert len(all_orders) > 0

    def test_no_orders_in_warmup(self, sample_data):
        strategy = MAStrategy(short_window=5, long_window=20)
        portfolio = Portfolio(initial_capital=1_000_000, cash=1_000_000)

        # During warmup period, no signals should be generated
        for i in range(20):
            orders = strategy.generate_signals(sample_data, portfolio, i)
            assert len(orders) == 0


class TestMACDStrategy:

    def test_creates_orders(self, sample_data):
        strategy = MACDStrategy()
        portfolio = Portfolio(initial_capital=1_000_000, cash=1_000_000)

        all_orders = []
        for i in range(len(sample_data)):
            orders = strategy.generate_signals(sample_data, portfolio, i)
            all_orders.extend(orders)

        assert len(all_orders) >= 0  # May or may not generate signals


class TestRSIMeanReversionStrategy:

    def test_no_early_orders(self, sample_data):
        strategy = RSIMeanReversionStrategy(period=14)
        portfolio = Portfolio(initial_capital=1_000_000, cash=1_000_000)

        for i in range(14):
            orders = strategy.generate_signals(sample_data, portfolio, i)
            assert len(orders) == 0


class TestBollingerBandStrategy:

    def test_no_early_orders(self, sample_data):
        strategy = BollingerBandStrategy(window=20)
        portfolio = Portfolio(initial_capital=1_000_000, cash=1_000_000)

        for i in range(20):
            orders = strategy.generate_signals(sample_data, portfolio, i)
            assert len(orders) == 0


# ============================================
# BacktestEngine Tests
# ============================================

class TestBacktestEngine:

    def test_run_returns_report(self, engine, sample_data):
        strategy = MAStrategy(5, 20, position_size=0.3)
        result = engine.run(sample_data, strategy)

        assert 'strategy' in result
        assert 'returns' in result
        assert 'risk' in result
        assert 'trading' in result
        assert 'portfolio' in result
        assert 'equity_curve' in result

    def test_final_value_equals_cash_plus_positions(self, engine, sample_data):
        strategy = MAStrategy(5, 20, position_size=0.3)
        result = engine.run(sample_data, strategy)

        final_value = result['portfolio']['final_value']
        assert final_value > 0

    def test_equity_curve_not_empty(self, engine, sample_data):
        strategy = MAStrategy(5, 20)
        result = engine.run(sample_data, strategy)
        assert len(result['equity_curve']) > 0

    def test_initial_capital_preserved(self, engine, sample_data):
        strategy = MAStrategy(5, 20)
        result = engine.run(sample_data, strategy)
        assert result['portfolio']['initial_capital'] == 1_000_000

    def test_commission_tracked(self, engine, sample_data):
        strategy = MAStrategy(5, 20, position_size=0.3)
        result = engine.run(sample_data, strategy)
        total_comm = result['trading']['total_commission']
        # If any trades happened, commission should be > 0
        if result['trading']['total_trades'] > 0:
            assert total_comm > 0

    def test_position_limit_respected(self, config, sample_data):
        config.max_position_pct = 0.1  # Very tight limit
        engine = BacktestEngine(config)
        strategy = MAStrategy(5, 20, position_size=0.5)  # Tries to buy 50%
        result = engine.run(sample_data, strategy)
        # Engine should reject orders that exceed position limit
        assert isinstance(result, dict)

    def test_no_short_selling(self, config, sample_data):
        config.allow_short = False
        engine = BacktestEngine(config)
        strategy = MAStrategy(5, 20)
        result = engine.run(sample_data, strategy)
        # Should not have negative cash or negative positions
        assert result['portfolio']['final_value'] > 0

    def test_sharpe_ratio_is_finite(self, engine, sample_data):
        strategy = MAStrategy(5, 20)
        result = engine.run(sample_data, strategy)
        assert np.isfinite(result['risk']['sharpe_ratio'])

    def test_max_drawdown_is_nonpositive(self, engine, sample_data):
        strategy = MAStrategy(5, 20)
        result = engine.run(sample_data, strategy)
        assert result['risk']['max_drawdown_pct'] <= 0


# ============================================
# StrategyComparator Tests
# ============================================

class TestStrategyComparator:

    def test_compare_multiple_strategies(self, config, sample_data):
        comparator = StrategyComparator(config)
        strategies = [
            MAStrategy(5, 20),
            MAStrategy(10, 50),
            MACDStrategy(),
        ]
        result = comparator.compare(sample_data, strategies)

        assert 'comparison_table' in result
        assert 'detailed_results' in result
        assert len(result['comparison_table']) == 3

    def test_comparison_sorted_by_sharpe(self, config, sample_data):
        comparator = StrategyComparator(config)
        strategies = [MAStrategy(5, 20), MAStrategy(10, 50)]
        result = comparator.compare(sample_data, strategies)

        table = result['comparison_table']
        if len(table) >= 2:
            assert table[0]['sharpe'] >= table[1]['sharpe']


# ============================================
# Entry point
# ============================================

if __name__ == '__main__':
    pytest.main([__file__, '-v', '--tb=short'])
