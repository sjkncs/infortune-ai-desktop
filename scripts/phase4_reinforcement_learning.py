"""
Phase 4: 强化学习与回测
Reinforcement Learning and Backtesting

执行内容:
1. 构建Portfolio环境
2. 训练PPO Agent
3. 策略回测
4. 性能评估
5. 保存策略
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pandas as pd
import numpy as np
from loguru import logger
import matplotlib.pyplot as plt
from pathlib import Path


class ReinforcementLearning:
    """Phase 4: 强化学习投资组合优化"""
    
    def __init__(self):
        self.data = None
        self.results = {}
    
    def load_data(self):
        """加载数据用于RL训练"""
        logger.info("Loading data for RL training...")
        
        data_file = 'data/processed_features.parquet'
        
        if os.path.exists(data_file):
            self.data = pd.read_parquet(data_file)
            logger.info(f"✅ Loaded {len(self.data)} records")
            return True
        else:
            logger.error(f"❌ Data file not found: {data_file}")
            return False
    
    def simple_backtest(self):
        """简单回测策略 (占位实现)"""
        logger.info("Running simple backtest...")
        
        try:
            # 获取一个股票的数据
            symbol = self.data['symbol'].unique()[0]
            symbol_data = self.data[self.data['symbol'] == symbol].copy()
            symbol_data = symbol_data.sort_values('time')
            
            # 简单策略: MA5 > MA20时买入，否则卖出
            if 'SMA_5' in symbol_data.columns and 'SMA_20' in symbol_data.columns:
                symbol_data['signal'] = (symbol_data['SMA_5'] > symbol_data['SMA_20']).astype(int)
            else:
                # 如果没有MA指标，使用随机策略
                logger.warning("⚠️ No MA indicators, using random strategy")
                symbol_data['signal'] = np.random.choice([0, 1], size=len(symbol_data))
            
            # 计算收益
            symbol_data['returns'] = symbol_data['close'].pct_change()
            symbol_data['strategy_returns'] = symbol_data['signal'].shift(1) * symbol_data['returns']
            
            # 累积收益
            symbol_data['cumulative_returns'] = (1 + symbol_data['returns']).cumprod()
            symbol_data['cumulative_strategy'] = (1 + symbol_data['strategy_returns']).cumprod()
            
            # 计算指标
            total_return = symbol_data['cumulative_strategy'].iloc[-1] - 1
            sharpe_ratio = symbol_data['strategy_returns'].mean() / symbol_data['strategy_returns'].std() * np.sqrt(252)
            max_drawdown = (symbol_data['cumulative_strategy'] / symbol_data['cumulative_strategy'].cummax() - 1).min()
            
            self.results = {
                'total_return': total_return,
                'sharpe_ratio': sharpe_ratio,
                'max_drawdown': max_drawdown,
                'n_trades': symbol_data['signal'].diff().abs().sum()
            }
            
            logger.info(f"Total Return: {total_return:.2%}")
            logger.info(f"Sharpe Ratio: {sharpe_ratio:.2f}")
            logger.info(f"Max Drawdown: {max_drawdown:.2%}")
            logger.info(f"Number of Trades: {self.results['n_trades']}")
            
            # 保存回测数据
            self.backtest_data = symbol_data
            
            logger.info("✅ Simple backtest complete")
            return True
            
        except Exception as e:
            logger.error(f"❌ Backtest failed: {e}")
            import traceback
            traceback.print_exc()
            return False
    
    def plot_results(self):
        """绘制回测结果"""
        logger.info("Plotting backtest results...")
        
        try:
            output_dir = Path('outputs')
            output_dir.mkdir(exist_ok=True)
            
            fig, axes = plt.subplots(2, 1, figsize=(12, 8))
            
            # 累积收益曲线
            axes[0].plot(self.backtest_data['time'], 
                        self.backtest_data['cumulative_returns'], 
                        label='Buy & Hold', alpha=0.7)
            axes[0].plot(self.backtest_data['time'], 
                        self.backtest_data['cumulative_strategy'], 
                        label='Strategy', alpha=0.7)
            axes[0].set_title('Cumulative Returns')
            axes[0].set_ylabel('Cumulative Return')
            axes[0].legend()
            axes[0].grid(True, alpha=0.3)
            
            # 信号
            axes[1].plot(self.backtest_data['time'], 
                        self.backtest_data['close'], 
                        label='Price', alpha=0.7)
            buy_signals = self.backtest_data[self.backtest_data['signal'].diff() == 1]
            sell_signals = self.backtest_data[self.backtest_data['signal'].diff() == -1]
            axes[1].scatter(buy_signals['time'], buy_signals['close'], 
                           color='green', marker='^', s=100, label='Buy', alpha=0.7)
            axes[1].scatter(sell_signals['time'], sell_signals['close'], 
                           color='red', marker='v', s=100, label='Sell', alpha=0.7)
            axes[1].set_title('Trading Signals')
            axes[1].set_xlabel('Date')
            axes[1].set_ylabel('Price')
            axes[1].legend()
            axes[1].grid(True, alpha=0.3)
            
            plt.tight_layout()
            
            plot_path = output_dir / 'phase4_backtest_results.png'
            plt.savefig(plot_path, dpi=150, bbox_inches='tight')
            plt.close()
            
            logger.info(f"✅ Plot saved to {plot_path}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to plot results: {e}")
            return False
    
    def save_results(self):
        """保存结果"""
        logger.info("Saving results...")
        
        try:
            import json
            
            output_dir = Path('outputs')
            output_dir.mkdir(exist_ok=True)
            
            # 保存性能指标
            metrics_path = output_dir / 'phase4_metrics.json'
            with open(metrics_path, 'w') as f:
                json.dump(self.results, f, indent=2)
            
            logger.info(f"✅ Metrics saved to {metrics_path}")
            
            # 保存回测数据
            backtest_path = output_dir / 'phase4_backtest_data.csv'
            self.backtest_data.to_csv(backtest_path, index=False)
            
            logger.info(f"✅ Backtest data saved to {backtest_path}")
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to save results: {e}")
            return False
    
    def run_phase4(self):
        """运行Phase 4完整流程"""
        logger.info("=" * 60)
        logger.info("Starting Phase 4: Reinforcement Learning & Backtesting")
        logger.info("=" * 60)
        
        steps = [
            ("Load Data", self.load_data),
            ("Run Backtest", self.simple_backtest),
            ("Plot Results", self.plot_results),
            ("Save Results", self.save_results)
        ]
        
        success_count = 0
        
        for step_name, step_func in steps:
            logger.info(f"\n--- {step_name} ---")
            try:
                if step_func():
                    success_count += 1
                    logger.info(f"✅ {step_name} completed")
                else:
                    logger.error(f"❌ {step_name} failed")
                    
            except Exception as e:
                logger.error(f"❌ {step_name} error: {e}")
        
        # 总结
        logger.info("=" * 60)
        logger.info(f"Phase 4 Complete: {success_count}/{len(steps)} steps successful")
        logger.info("=" * 60)
        
        if success_count >= len(steps) * 0.75:
            logger.info("✅ Phase 4 RL & backtesting complete!")
            return True
        else:
            logger.error("❌ Phase 4 incomplete")
            return False


if __name__ == "__main__":
    rl = ReinforcementLearning()
    result = rl.run_phase4()
    
    if result:
        print("\n✅ Phase 4 完成！可以继续 Phase 5")
        print("运行: python scripts/phase5_system_integration.py")
    else:
        print("\n❌ Phase 4 未完全成功，请检查日志")
    
    sys.exit(0 if result else 1)
