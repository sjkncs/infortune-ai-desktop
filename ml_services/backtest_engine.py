"""
Event-Driven Backtest Engine - 事件驱动回测引擎
解决问题: desktop-app/scripts/strategy.js 仅在前端模拟回测,
          scripts/phase4_reinforcement_learning.py 标注为"占位实现"

设计目标:
1. 真正的事件驱动架构 (非向量化)
2. 精确的成本模型 (手续费/滑点/印花税)
3. 支持多策略对比
4. 输出完整的绩效归因报告
5. 暴露为FastAPI端点供Desktop/Web调用
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Callable, Any, Tuple
from dataclasses import dataclass, field
from enum import Enum
from datetime import datetime
from abc import ABC, abstractmethod
from loguru import logger
from collections import defaultdict
import json


# ============================================
# 核心数据结构
# ============================================

class Side(Enum):
    BUY = "BUY"
    SELL = "SELL"


class OrderStatus(Enum):
    PENDING = "PENDING"
    FILLED = "FILLED"
    CANCELLED = "CANCELLED"
    REJECTED = "REJECTED"


@dataclass
class Order:
    symbol: str
    side: Side
    quantity: int
    order_type: str = "MARKET"          # MARKET | LIMIT
    limit_price: Optional[float] = None
    timestamp: Optional[datetime] = None
    status: OrderStatus = OrderStatus.PENDING
    fill_price: float = 0.0
    commission: float = 0.0
    slippage: float = 0.0


@dataclass
class Position:
    symbol: str
    quantity: int = 0
    avg_cost: float = 0.0
    unrealized_pnl: float = 0.0
    realized_pnl: float = 0.0

    @property
    def market_value(self) -> float:
        return self.quantity * self.avg_cost

    def update_unrealized(self, current_price: float):
        self.unrealized_pnl = (current_price - self.avg_cost) * self.quantity


@dataclass
class Portfolio:
    initial_capital: float = 1_000_000.0
    cash: float = 1_000_000.0
    positions: Dict[str, Position] = field(default_factory=dict)
    total_commission: float = 0.0
    total_slippage: float = 0.0
    trade_count: int = 0

    @property
    def total_value(self) -> float:
        pos_value = sum(
            p.quantity * p.avg_cost + p.unrealized_pnl
            for p in self.positions.values()
        )
        return self.cash + pos_value

    @property
    def total_pnl(self) -> float:
        return self.total_value - self.initial_capital


@dataclass
class BacktestConfig:
    initial_capital: float = 1_000_000.0
    commission_rate: float = 0.0003     # 万三手续费
    stamp_tax_rate: float = 0.001       # 千一印花税 (仅卖出)
    slippage_bps: float = 1.0           # 1个基点滑点
    min_commission: float = 5.0         # 最低5元手续费
    max_position_pct: float = 0.25      # 单只最大25%仓位
    allow_short: bool = False           # A股不允许做空


# ============================================
# 成本模型
# ============================================

class CostModel:
    """精确的A股交易成本模型"""

    def __init__(self, config: BacktestConfig):
        self.config = config

    def calculate_commission(self, price: float, quantity: int, side: Side) -> float:
        """计算手续费"""
        turnover = price * quantity
        commission = turnover * self.config.commission_rate

        # 卖出加收印花税
        if side == Side.SELL:
            commission += turnover * self.config.stamp_tax_rate

        return max(commission, self.config.min_commission)

    def calculate_slippage(self, price: float, side: Side) -> float:
        """计算滑点"""
        slip = price * self.config.slippage_bps / 10000
        return slip if side == Side.BUY else -slip

    def get_fill_price(self, price: float, side: Side) -> float:
        """考虑滑点的成交价"""
        slippage = self.calculate_slippage(price, side)
        return price + slippage


# ============================================
# 策略基类
# ============================================

class Strategy(ABC):
    """策略抽象基类"""

    def __init__(self, name: str = "BaseStrategy"):
        self.name = name
        self.params: Dict[str, Any] = {}

    @abstractmethod
    def generate_signals(
        self,
        data: pd.DataFrame,
        portfolio: Portfolio,
        current_idx: int
    ) -> List[Order]:
        """
        生成交易信号

        Args:
            data: 完整的历史数据 (到当前时间点)
            portfolio: 当前组合状态
            current_idx: 当前数据行索引

        Returns:
            List of Order objects
        """
        pass


# ============================================
# 内置策略
# ============================================

class MAStrategy(Strategy):
    """均线交叉策略"""

    def __init__(self, short_window: int = 5, long_window: int = 20,
                 position_size: float = 0.1):
        super().__init__(name=f"MA({short_window},{long_window})")
        self.params = {
            'short_window': short_window,
            'long_window': long_window,
            'position_size': position_size,
        }

    def generate_signals(self, data: pd.DataFrame, portfolio: Portfolio,
                         current_idx: int) -> List[Order]:
        orders = []
        if current_idx < self.params['long_window'] + 1:
            return orders

        symbol = data['symbol'].iloc[current_idx] if 'symbol' in data.columns else 'UNKNOWN'
        close = data['close'].iloc[:current_idx + 1]

        ma_short = close.rolling(self.params['short_window']).mean()
        ma_long = close.rolling(self.params['long_window']).mean()

        # 金叉买入
        if (ma_short.iloc[-1] > ma_long.iloc[-1] and
                ma_short.iloc[-2] <= ma_long.iloc[-2]):
            size = int(portfolio.cash * self.params['position_size'] / close.iloc[-1] / 100) * 100
            if size >= 100:
                orders.append(Order(
                    symbol=symbol,
                    side=Side.BUY,
                    quantity=size,
                    timestamp=data.index[current_idx] if isinstance(data.index, pd.DatetimeIndex) else None,
                ))

        # 死叉卖出
        elif (ma_short.iloc[-1] < ma_long.iloc[-1] and
              ma_short.iloc[-2] >= ma_long.iloc[-2]):
            pos = portfolio.positions.get(symbol)
            if pos and pos.quantity > 0:
                orders.append(Order(
                    symbol=symbol,
                    side=Side.SELL,
                    quantity=pos.quantity,
                    timestamp=data.index[current_idx] if isinstance(data.index, pd.DatetimeIndex) else None,
                ))

        return orders


class MACDStrategy(Strategy):
    """MACD策略"""

    def __init__(self, fast: int = 12, slow: int = 26, signal: int = 9,
                 position_size: float = 0.15):
        super().__init__(name=f"MACD({fast},{slow},{signal})")
        self.params = {
            'fast': fast, 'slow': slow, 'signal': signal,
            'position_size': position_size,
        }

    def generate_signals(self, data: pd.DataFrame, portfolio: Portfolio,
                         current_idx: int) -> List[Order]:
        orders = []
        if current_idx < self.params['slow'] + self.params['signal'] + 1:
            return orders

        symbol = data['symbol'].iloc[current_idx] if 'symbol' in data.columns else 'UNKNOWN'
        close = data['close'].iloc[:current_idx + 1]

        ema_fast = close.ewm(span=self.params['fast'], adjust=False).mean()
        ema_slow = close.ewm(span=self.params['slow'], adjust=False).mean()
        macd_line = ema_fast - ema_slow
        signal_line = macd_line.ewm(span=self.params['signal'], adjust=False).mean()
        histogram = macd_line - signal_line

        # MACD金叉
        if histogram.iloc[-1] > 0 and histogram.iloc[-2] <= 0:
            size = int(portfolio.cash * self.params['position_size'] / close.iloc[-1] / 100) * 100
            if size >= 100:
                orders.append(Order(symbol=symbol, side=Side.BUY, quantity=size))

        # MACD死叉
        elif histogram.iloc[-1] < 0 and histogram.iloc[-2] >= 0:
            pos = portfolio.positions.get(symbol)
            if pos and pos.quantity > 0:
                orders.append(Order(symbol=symbol, side=Side.SELL, quantity=pos.quantity))

        return orders


class RSIMeanReversionStrategy(Strategy):
    """RSI均值回归策略"""

    def __init__(self, period: int = 14, oversold: float = 30.0,
                 overbought: float = 70.0, position_size: float = 0.1):
        super().__init__(name=f"RSI_MR({period},{oversold},{overbought})")
        self.params = {
            'period': period, 'oversold': oversold,
            'overbought': overbought, 'position_size': position_size,
        }

    def generate_signals(self, data: pd.DataFrame, portfolio: Portfolio,
                         current_idx: int) -> List[Order]:
        orders = []
        if current_idx < self.params['period'] + 1:
            return orders

        symbol = data['symbol'].iloc[current_idx] if 'symbol' in data.columns else 'UNKNOWN'
        close = data['close'].iloc[:current_idx + 1]

        delta = close.diff()
        gain = delta.where(delta > 0, 0).rolling(self.params['period']).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(self.params['period']).mean()
        rs = gain / loss.replace(0, 1e-8)
        rsi = 100 - 100 / (1 + rs)

        current_rsi = rsi.iloc[-1]
        prev_rsi = rsi.iloc[-2]

        # 超卖反弹买入
        if current_rsi > self.params['oversold'] and prev_rsi <= self.params['oversold']:
            size = int(portfolio.cash * self.params['position_size'] / close.iloc[-1] / 100) * 100
            if size >= 100:
                orders.append(Order(symbol=symbol, side=Side.BUY, quantity=size))

        # 超买回落卖出
        elif current_rsi < self.params['overbought'] and prev_rsi >= self.params['overbought']:
            pos = portfolio.positions.get(symbol)
            if pos and pos.quantity > 0:
                orders.append(Order(symbol=symbol, side=Side.SELL, quantity=pos.quantity))

        return orders


class BollingerBandStrategy(Strategy):
    """布林带策略"""

    def __init__(self, window: int = 20, num_std: float = 2.0,
                 position_size: float = 0.1):
        super().__init__(name=f"BB({window},{num_std})")
        self.params = {
            'window': window, 'num_std': num_std,
            'position_size': position_size,
        }

    def generate_signals(self, data: pd.DataFrame, portfolio: Portfolio,
                         current_idx: int) -> List[Order]:
        orders = []
        if current_idx < self.params['window'] + 1:
            return orders

        symbol = data['symbol'].iloc[current_idx] if 'symbol' in data.columns else 'UNKNOWN'
        close = data['close'].iloc[:current_idx + 1]

        sma = close.rolling(self.params['window']).mean()
        std = close.rolling(self.params['window']).std()
        upper = sma + self.params['num_std'] * std
        lower = sma - self.params['num_std'] * std

        price = close.iloc[-1]
        prev_price = close.iloc[-2]

        # 触及下轨买入
        if price > lower.iloc[-1] and prev_price <= lower.iloc[-2]:
            size = int(portfolio.cash * self.params['position_size'] / price / 100) * 100
            if size >= 100:
                orders.append(Order(symbol=symbol, side=Side.BUY, quantity=size))

        # 触及上轨卖出
        elif price < upper.iloc[-1] and prev_price >= upper.iloc[-2]:
            pos = portfolio.positions.get(symbol)
            if pos and pos.quantity > 0:
                orders.append(Order(symbol=symbol, side=Side.SELL, quantity=pos.quantity))

        return orders


# ============================================
# 回测引擎
# ============================================

class BacktestEngine:
    """
    事件驱动回测引擎

    核心循环:
    for each bar:
        1. 更新市场数据
        2. 策略生成信号
        3. 执行订单 (含成本模型)
        4. 更新组合状态
        5. 记录快照
    """

    def __init__(self, config: Optional[BacktestConfig] = None):
        self.config = config or BacktestConfig()
        self.cost_model = CostModel(self.config)
        self.portfolio = Portfolio(
            initial_capital=self.config.initial_capital,
            cash=self.config.initial_capital,
        )
        self.history: List[Dict] = []
        self.trades: List[Dict] = []
        self.orders_log: List[Dict] = []

    def run(self, data: pd.DataFrame, strategy: Strategy) -> Dict[str, Any]:
        """
        执行回测

        Args:
            data: OHLCV数据, columns至少包含 ['open','high','low','close','volume']
            strategy: 策略实例

        Returns:
            完整的回测结果报告
        """
        logger.info(f"Starting backtest: {strategy.name}, {len(data)} bars")

        self._reset()

        for i in range(len(data)):
            current_bar = data.iloc[i]
            current_price = float(current_bar['close'])

            # 更新持仓未实现盈亏
            for pos in self.portfolio.positions.values():
                pos.update_unrealized(current_price)

            # 策略生成信号
            orders = strategy.generate_signals(data, self.portfolio, i)

            # 执行订单
            for order in orders:
                self._execute_order(order, current_bar)

            # 记录快照
            self.history.append({
                'date': data.index[i] if isinstance(data.index, pd.DatetimeIndex) else i,
                'close': current_price,
                'portfolio_value': self.portfolio.total_value,
                'cash': self.portfolio.cash,
                'positions_value': self.portfolio.total_value - self.portfolio.cash,
                'trade_count': self.portfolio.trade_count,
            })

        # 生成报告
        report = self._generate_report(strategy)
        logger.info(f"Backtest complete: {strategy.name}")

        return report

    def _reset(self):
        self.portfolio = Portfolio(
            initial_capital=self.config.initial_capital,
            cash=self.config.initial_capital,
        )
        self.history = []
        self.trades = []
        self.orders_log = []

    def _execute_order(self, order: Order, bar: pd.Series):
        """执行单个订单"""
        price = float(bar['close'])
        fill_price = self.cost_model.get_fill_price(price, order.side)
        commission = self.cost_model.calculate_commission(fill_price, order.quantity, order.side)
        slippage_cost = abs(fill_price - price) * order.quantity

        # 检查约束
        if order.side == Side.BUY:
            total_cost = fill_price * order.quantity + commission
            if total_cost > self.portfolio.cash:
                order.status = OrderStatus.REJECTED
                self.orders_log.append({'order': order.__dict__, 'reason': 'Insufficient cash'})
                return

            # 单只仓位限制
            pos_value = fill_price * order.quantity
            if pos_value / self.portfolio.total_value > self.config.max_position_pct:
                order.status = OrderStatus.REJECTED
                self.orders_log.append({'order': order.__dict__, 'reason': 'Position limit exceeded'})
                return

            # 执行买入
            self.portfolio.cash -= total_cost

            if order.symbol not in self.portfolio.positions:
                self.portfolio.positions[order.symbol] = Position(symbol=order.symbol)

            pos = self.portfolio.positions[order.symbol]
            total_quantity = pos.quantity + order.quantity
            pos.avg_cost = (
                (pos.avg_cost * pos.quantity + fill_price * order.quantity) / total_quantity
                if total_quantity > 0 else fill_price
            )
            pos.quantity = total_quantity

        elif order.side == Side.SELL:
            if not self.config.allow_short:
                pos = self.portfolio.positions.get(order.symbol)
                if not pos or pos.quantity < order.quantity:
                    order.status = OrderStatus.REJECTED
                    self.orders_log.append({'order': order.__dict__, 'reason': 'Insufficient position'})
                    return

            # 执行卖出
            pos = self.portfolio.positions[order.symbol]
            proceeds = fill_price * order.quantity - commission
            self.portfolio.cash += proceeds

            realized_pnl = (fill_price - pos.avg_cost) * order.quantity
            pos.realized_pnl += realized_pnl
            pos.quantity -= order.quantity

            if pos.quantity == 0:
                del self.portfolio.positions[order.symbol]

        # 更新订单状态和统计
        order.status = OrderStatus.FILLED
        order.fill_price = fill_price
        order.commission = commission
        order.slippage = slippage_cost

        self.portfolio.total_commission += commission
        self.portfolio.total_slippage += slippage_cost
        self.portfolio.trade_count += 1

        self.trades.append({
            'symbol': order.symbol,
            'side': order.side.value,
            'quantity': order.quantity,
            'price': round(fill_price, 4),
            'commission': round(commission, 2),
            'slippage': round(slippage_cost, 2),
        })

    def _generate_report(self, strategy: Strategy) -> Dict[str, Any]:
        """生成完整的回测报告"""
        df = pd.DataFrame(self.history)

        if len(df) < 2:
            return {'error': 'Insufficient data for report'}

        df['daily_return'] = df['portfolio_value'].pct_change()
        returns = df['daily_return'].dropna()

        # 基准收益 (买入持有)
        df['benchmark_return'] = df['close'].pct_change()
        benchmark_returns = df['benchmark_return'].dropna()

        # 组合净值
        df['nav'] = df['portfolio_value'] / self.config.initial_capital

        # 累积收益
        total_return = (df['portfolio_value'].iloc[-1] / self.config.initial_capital) - 1
        benchmark_total = (df['close'].iloc[-1] / df['close'].iloc[0]) - 1

        # 年化收益
        n_days = len(df)
        annual_return = (1 + total_return) ** (252 / max(n_days, 1)) - 1

        # 波动率
        annual_vol = float(returns.std() * np.sqrt(252)) if len(returns) > 0 else 0
        sharpe = (annual_return - 0.02) / annual_vol if annual_vol > 1e-8 else 0

        # 最大回撤
        cum = (1 + returns).cumprod()
        peak = cum.cummax()
        dd = (cum - peak) / peak
        max_drawdown = float(dd.min())

        # 胜率
        winning_trades = [t for t in self.trades if t['side'] == 'SELL']
        if winning_trades:
            # 简化计算
            win_count = sum(1 for t in self.trades if t['side'] == 'SELL')
        else:
            win_count = 0

        # Sortino
        downside = returns[returns < 0]
        sortino = (
            (annual_return - 0.02) / (float(downside.std() * np.sqrt(252)))
            if len(downside) > 0 and downside.std() > 1e-8 else 0
        )

        # Calmar
        calmar = annual_return / abs(max_drawdown) if abs(max_drawdown) > 1e-8 else 0

        report = {
            'strategy': strategy.name,
            'params': strategy.params,
            'period': {
                'start': str(df['date'].iloc[0]),
                'end': str(df['date'].iloc[-1]),
                'trading_days': n_days,
            },
            'returns': {
                'total_return_pct': round(total_return * 100, 4),
                'annual_return_pct': round(annual_return * 100, 4),
                'benchmark_return_pct': round(benchmark_total * 100, 4),
                'excess_return_pct': round((total_return - benchmark_total) * 100, 4),
            },
            'risk': {
                'annual_volatility_pct': round(annual_vol * 100, 4),
                'max_drawdown_pct': round(max_drawdown * 100, 4),
                'sharpe_ratio': round(sharpe, 4),
                'sortino_ratio': round(sortino, 4),
                'calmar_ratio': round(calmar, 4),
            },
            'trading': {
                'total_trades': self.portfolio.trade_count,
                'total_commission': round(self.portfolio.total_commission, 2),
                'total_slippage': round(self.portfolio.total_slippage, 2),
                'cost_drag_pct': round(
                    (self.portfolio.total_commission + self.portfolio.total_slippage)
                    / self.config.initial_capital * 100, 4
                ),
            },
            'portfolio': {
                'final_value': round(self.portfolio.total_value, 2),
                'final_cash': round(self.portfolio.cash, 2),
                'initial_capital': self.config.initial_capital,
            },
            'equity_curve': [
                {'date': str(h['date']), 'value': round(h['portfolio_value'], 2)}
                for h in self.history[::max(1, len(self.history) // 200)]  # 最多200个点
            ],
            'trades_log': self.trades[-50:],  # 最近50笔交易
        }

        return report


# ============================================
# 策略对比器
# ============================================

class StrategyComparator:
    """多策略对比框架"""

    def __init__(self, config: Optional[BacktestConfig] = None):
        self.config = config or BacktestConfig()
        self.results: Dict[str, Dict] = {}

    def compare(
        self,
        data: pd.DataFrame,
        strategies: List[Strategy]
    ) -> Dict[str, Any]:
        """运行多个策略并对比结果"""
        for strategy in strategies:
            engine = BacktestEngine(self.config)
            result = engine.run(data, strategy)
            self.results[strategy.name] = result

        # 生成对比表
        comparison = []
        for name, result in self.results.items():
            if 'error' in result:
                continue
            comparison.append({
                'strategy': name,
                'total_return': result['returns']['total_return_pct'],
                'annual_return': result['returns']['annual_return_pct'],
                'sharpe': result['risk']['sharpe_ratio'],
                'max_drawdown': result['risk']['max_drawdown_pct'],
                'sortino': result['risk']['sortino_ratio'],
                'total_trades': result['trading']['total_trades'],
                'cost_drag': result['trading']['cost_drag_pct'],
            })

        return {
            'comparison_table': sorted(comparison, key=lambda x: x['sharpe'], reverse=True),
            'detailed_results': self.results,
        }


# ============================================
# 使用示例
# ============================================

if __name__ == "__main__":
    logger.info("Testing Backtest Engine...")

    # 生成模拟数据
    np.random.seed(42)
    n = 500
    dates = pd.date_range('2023-01-01', periods=n, freq='B')
    close = np.cumsum(np.random.randn(n) * 0.5) + 100
    close = np.maximum(close, 10)

    data = pd.DataFrame({
        'symbol': ['000001.SZ'] * n,
        'open': close + np.random.randn(n) * 0.2,
        'high': close + np.abs(np.random.randn(n) * 0.5),
        'low': close - np.abs(np.random.randn(n) * 0.5),
        'close': close,
        'volume': np.random.randint(1_000_000, 50_000_000, n),
    }, index=dates)

    # 单策略回测
    config = BacktestConfig(initial_capital=1_000_000)
    engine = BacktestEngine(config)

    ma_strategy = MAStrategy(short_window=5, long_window=20, position_size=0.3)
    result = engine.run(data, ma_strategy)

    logger.info(f"Strategy: {result['strategy']}")
    logger.info(f"Total Return: {result['returns']['total_return_pct']:.2f}%")
    logger.info(f"Sharpe Ratio: {result['risk']['sharpe_ratio']:.3f}")
    logger.info(f"Max Drawdown: {result['risk']['max_drawdown_pct']:.2f}%")
    logger.info(f"Total Trades: {result['trading']['total_trades']}")

    # 多策略对比
    comparator = StrategyComparator(config)
    strategies = [
        MAStrategy(5, 20),
        MAStrategy(10, 50),
        MACDStrategy(),
        RSIMeanReversionStrategy(),
        BollingerBandStrategy(),
    ]

    comp_result = comparator.compare(data, strategies)
    logger.info("\n=== Strategy Comparison ===")
    for row in comp_result['comparison_table']:
        logger.info(
            f"{row['strategy']:30s} | Return={row['total_return']:+8.2f}% | "
            f"Sharpe={row['sharpe']:+6.3f} | MaxDD={row['max_drawdown']:+8.2f}%"
        )

    logger.info("Backtest Engine tests complete!")
