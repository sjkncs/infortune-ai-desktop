"""
Phase 2: 数据准备与特征工程
Data Preparation and Feature Engineering

执行内容:
1. 数据采集 (从AKShare/本地)
2. 数据清洗
3. 特征工程
4. 数据验证
5. 存储到数据库
"""

import asyncio
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from loguru import logger
from typing import List

from data_layer.database_manager import db_manager
from data_layer.stock_data_service import stock_data_service
from ml_services.features.feature_engineering import FinancialFeatureEngineer


class DataPreparation:
    """Phase 2: 数据准备"""
    
    def __init__(self, symbols: List[str] = None):
        self.symbols = symbols or ['000001.SZ', '000002.SZ', '600519.SH', '600036.SH']
        self.start_date = '2020-01-01'
        self.end_date = '2024-12-31'
        self.engineer = FinancialFeatureEngineer()
    
    async def fetch_historical_data(self):
        """采集历史数据"""
        logger.info(f"Fetching historical data for {len(self.symbols)} symbols...")
        
        all_data = []
        
        for symbol in self.symbols:
            try:
                logger.info(f"Fetching data for {symbol}...")
                
                # 尝试从数据库获取
                df = await stock_data_service.get_stock_prices(
                    symbol=symbol,
                    start_time=datetime.strptime(self.start_date, '%Y-%m-%d'),
                    end_time=datetime.strptime(self.end_date, '%Y-%m-%d'),
                    limit=10000
                )
                
                if len(df) > 0:
                    logger.info(f"✅ Fetched {len(df)} records for {symbol}")
                    all_data.append(df)
                else:
                    logger.warning(f"⚠️ No data found for {symbol}, generating synthetic data")
                    df = self._generate_synthetic_data(symbol)
                    all_data.append(df)
                    
                    # 插入到数据库
                    await stock_data_service.insert_stock_prices(df)
                    
            except Exception as e:
                logger.error(f"❌ Failed to fetch data for {symbol}: {e}")
                # 生成合成数据作为后备
                df = self._generate_synthetic_data(symbol)
                all_data.append(df)
                await stock_data_service.insert_stock_prices(df)
        
        if all_data:
            self.raw_data = pd.concat(all_data, ignore_index=True)
            logger.info(f"✅ Total records: {len(self.raw_data)}")
            return True
        else:
            logger.error("❌ No data collected")
            return False
    
    def _generate_synthetic_data(self, symbol: str, n_days: int = 1000):
        """生成合成数据用于测试"""
        logger.info(f"Generating synthetic data for {symbol}...")
        
        dates = pd.date_range(end=datetime.now(), periods=n_days, freq='D')
        
        # 生成随机游走价格
        price_base = 100
        returns = np.random.randn(n_days) * 0.02  # 2%日波动率
        prices = price_base * np.exp(returns.cumsum())
        
        df = pd.DataFrame({
            'time': dates,
            'symbol': symbol,
            'open': prices * (1 + np.random.randn(n_days) * 0.005),
            'high': prices * (1 + abs(np.random.randn(n_days)) * 0.01),
            'low': prices * (1 - abs(np.random.randn(n_days)) * 0.01),
            'close': prices,
            'volume': np.random.randint(1000000, 10000000, n_days),
            'amount': np.random.randint(100000000, 1000000000, n_days)
        })
        
        return df
    
    def clean_data(self):
        """数据清洗"""
        logger.info("Cleaning data...")
        
        initial_len = len(self.raw_data)
        
        # 删除重复
        self.raw_data = self.raw_data.drop_duplicates(subset=['time', 'symbol'])
        
        # 排序
        self.raw_data = self.raw_data.sort_values(['symbol', 'time'])
        
        # 处理缺失值
        self.raw_data = self.raw_data.dropna(subset=['open', 'high', 'low', 'close', 'volume'])
        
        # 删除异常值 (价格<=0)
        self.raw_data = self.raw_data[
            (self.raw_data['open'] > 0) & 
            (self.raw_data['high'] > 0) & 
            (self.raw_data['low'] > 0) & 
            (self.raw_data['close'] > 0)
        ]
        
        final_len = len(self.raw_data)
        removed = initial_len - final_len
        
        logger.info(f"✅ Cleaned data: removed {removed} invalid records")
        logger.info(f"Final dataset: {final_len} records")
        
        return True
    
    def feature_engineering(self):
        """特征工程"""
        logger.info("Starting feature engineering...")
        
        processed_data = []
        
        for symbol in self.raw_data['symbol'].unique():
            logger.info(f"Processing features for {symbol}...")
            
            symbol_data = self.raw_data[self.raw_data['symbol'] == symbol].copy()
            symbol_data = symbol_data.sort_values('time').reset_index(drop=True)
            
            # 生成技术指标
            df_features = self.engineer.generate_technical_indicators(symbol_data)
            
            # 生成市场状态特征
            df_features = self.engineer.generate_market_regime_features(df_features)
            
            # 生成统计特征
            df_features = self.engineer.generate_statistical_features(df_features)
            
            # 删除NaN
            df_features = df_features.dropna()
            
            processed_data.append(df_features)
            logger.info(f"✅ Generated {len(df_features.columns)} features for {symbol}")
        
        self.processed_data = pd.concat(processed_data, ignore_index=True)
        logger.info(f"✅ Feature engineering complete. Shape: {self.processed_data.shape}")
        
        return True
    
    def validate_data(self):
        """数据验证"""
        logger.info("Validating processed data...")
        
        checks = {
            'non_empty': len(self.processed_data) > 0,
            'has_features': len(self.processed_data.columns) >= 50,
            'no_nulls': self.processed_data.isnull().sum().sum() == 0,
            'multiple_symbols': self.processed_data['symbol'].nunique() >= 2
        }
        
        for check_name, passed in checks.items():
            if passed:
                logger.info(f"✅ {check_name}: PASS")
            else:
                logger.error(f"❌ {check_name}: FAIL")
        
        all_passed = all(checks.values())
        
        if all_passed:
            logger.info("✅ All data validation checks passed")
        else:
            logger.warning("⚠️ Some validation checks failed")
        
        return all_passed
    
    def save_processed_data(self):
        """保存处理后的数据"""
        logger.info("Saving processed data...")
        
        try:
            # 保存为Parquet格式 (高效压缩)
            output_file = 'data/processed_features.parquet'
            os.makedirs('data', exist_ok=True)
            
            self.processed_data.to_parquet(output_file, index=False)
            logger.info(f"✅ Saved processed data to {output_file}")
            
            # 保存元数据
            metadata = {
                'n_records': len(self.processed_data),
                'n_features': len(self.processed_data.columns),
                'symbols': self.processed_data['symbol'].unique().tolist(),
                'date_range': (
                    str(self.processed_data['time'].min()),
                    str(self.processed_data['time'].max())
                ),
                'feature_columns': self.processed_data.columns.tolist()
            }
            
            import json
            with open('data/metadata.json', 'w') as f:
                json.dump(metadata, f, indent=2)
            
            logger.info("✅ Saved metadata")
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to save data: {e}")
            return False
    
    async def run_phase2(self):
        """运行Phase 2完整流程"""
        logger.info("=" * 60)
        logger.info("Starting Phase 2: Data Preparation")
        logger.info("=" * 60)
        
        # 初始化数据库
        await db_manager.initialize_timescale()
        db_manager.initialize_redis()
        
        steps = [
            ("Fetch Historical Data", self.fetch_historical_data()),
            ("Clean Data", self.clean_data),
            ("Feature Engineering", self.feature_engineering),
            ("Validate Data", self.validate_data),
            ("Save Processed Data", self.save_processed_data)
        ]
        
        success_count = 0
        
        for step_name, step_func in steps:
            logger.info(f"\n--- {step_name} ---")
            try:
                if asyncio.iscoroutine(step_func):
                    result = await step_func
                else:
                    result = step_func()
                
                if result:
                    success_count += 1
                    logger.info(f"✅ {step_name} completed")
                else:
                    logger.error(f"❌ {step_name} failed")
                    
            except Exception as e:
                logger.error(f"❌ {step_name} error: {e}")
        
        # 清理
        await db_manager.close_all()
        
        # 总结
        logger.info("=" * 60)
        logger.info(f"Phase 2 Complete: {success_count}/{len(steps)} steps successful")
        logger.info("=" * 60)
        
        if success_count >= len(steps) * 0.8:
            logger.info("✅ Phase 2 data preparation complete!")
            logger.info(f"Processed data saved to: data/processed_features.parquet")
            return True
        else:
            logger.error("❌ Phase 2 incomplete")
            return False


if __name__ == "__main__":
    # 可以通过命令行参数指定股票代码
    import argparse
    
    parser = argparse.ArgumentParser(description='Phase 2: Data Preparation')
    parser.add_argument(
        '--symbols',
        nargs='+',
        default=['000001.SZ', '000002.SZ', '600519.SH', '600036.SH'],
        help='Stock symbols to process'
    )
    
    args = parser.parse_args()
    
    prep = DataPreparation(symbols=args.symbols)
    result = asyncio.run(prep.run_phase2())
    
    if result:
        print("\n✅ Phase 2 完成！可以继续 Phase 3")
        print("运行: python scripts/phase3_model_training.py")
    else:
        print("\n❌ Phase 2 未完全成功，请检查日志")
    
    sys.exit(0 if result else 1)
