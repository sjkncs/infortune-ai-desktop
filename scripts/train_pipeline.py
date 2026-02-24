"""
Training Pipeline - 端到端训练流程
P0级优化: 完整的模型训练管道
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import torch
from torch.utils.data import DataLoader
import mlflow
import mlflow.pytorch
from loguru import logger
import yaml
from pathlib import Path
import asyncio

from ml_services.forecasting.ensemble_model import (
    EnsembleStockPredictor,
    StockDataset
)
from ml_services.features.feature_engineering import FinancialFeatureEngineer
from data_layer.database_manager import db_manager
from data_layer.stock_data_service import stock_data_service


class TrainingPipeline:
    """
    端到端训练Pipeline
    
    流程:
    1. 数据加载
    2. 特征工程
    3. 模型训练
    4. 评估和保存
    5. MLflow记录
    """
    
    def __init__(self, config_path: str):
        with open(config_path, 'r', encoding='utf-8') as f:
            self.config = yaml.safe_load(f)
        
        self.model_config = self.config['model']
        self.training_config = self.config['training']
        self.data_config = self.config['data']
        
        logger.info(f"Loaded config from {config_path}")
    
    async def load_data(self):
        """加载训练数据"""
        logger.info("Loading training data...")
        
        symbols = self.data_config['symbols']
        start_date = self.data_config['start_date']
        end_date = self.data_config['end_date']
        
        all_data = []
        for symbol in symbols:
            df = await stock_data_service.get_stock_prices(
                symbol=symbol,
                start_time=start_date,
                end_time=end_date,
                limit=10000
            )
            
            if len(df) > 0:
                all_data.append(df)
                logger.info(f"Loaded {len(df)} records for {symbol}")
        
        if not all_data:
            raise ValueError("No data loaded!")
        
        import pandas as pd
        self.raw_data = pd.concat(all_data, ignore_index=True)
        logger.info(f"Total records loaded: {len(self.raw_data)}")
        
        return self.raw_data
    
    def feature_engineering(self):
        """特征工程"""
        logger.info("Starting feature engineering...")
        
        engineer = FinancialFeatureEngineer(config={
            'technical_indicators': True,
            'fundamental_features': False,  # 暂不使用基本面
            'market_regime': True,
            'feature_interaction': True,
            'select_k_best': self.data_config.get('n_features', 50)
        })
        
        # 按symbol分组处理
        symbols = self.raw_data['symbol'].unique()
        processed_data = []
        
        for symbol in symbols:
            symbol_data = self.raw_data[self.raw_data['symbol'] == symbol].copy()
            symbol_data = symbol_data.sort_values('time')
            
            # 生成特征
            df_features = engineer.generate_all_features(symbol_data)
            
            # 删除NaN行
            df_features = df_features.dropna()
            
            processed_data.append(df_features)
            logger.info(f"Generated {len(df_features.columns)} features for {symbol}")
        
        import pandas as pd
        self.processed_data = pd.concat(processed_data, ignore_index=True)
        logger.info(f"Feature engineering complete. Shape: {self.processed_data.shape}")
        
        return self.processed_data
    
    def prepare_datasets(self):
        """准备训练/验证/测试集"""
        logger.info("Preparing datasets...")
        
        # 数据分割
        train_ratio = self.training_config.get('train_ratio', 0.7)
        val_ratio = self.training_config.get('val_ratio', 0.15)
        
        n_total = len(self.processed_data)
        n_train = int(n_total * train_ratio)
        n_val = int(n_total * val_ratio)
        
        train_data = self.processed_data.iloc[:n_train]
        val_data = self.processed_data.iloc[n_train:n_train+n_val]
        test_data = self.processed_data.iloc[n_train+n_val:]
        
        logger.info(f"Train: {len(train_data)}, Val: {len(val_data)}, Test: {len(test_data)}")
        
        # 特征列（排除目标和元数据列）
        exclude_cols = ['time', 'symbol', 'close']  # close是目标变量
        feature_cols = [col for col in train_data.columns if col not in exclude_cols]
        
        # 转换为numpy数组
        import numpy as np
        X_train = train_data[feature_cols].values.astype(np.float32)
        y_train = train_data['close'].values.astype(np.float32)
        
        X_val = val_data[feature_cols].values.astype(np.float32)
        y_val = val_data['close'].values.astype(np.float32)
        
        X_test = test_data[feature_cols].values.astype(np.float32)
        y_test = test_data['close'].values.astype(np.float32)
        
        # 创建Dataset
        sequence_length = self.model_config.get('sequence_length', 60)
        
        train_dataset = StockDataset(X_train, sequence_length)
        val_dataset = StockDataset(X_val, sequence_length)
        test_dataset = StockDataset(X_test, sequence_length)
        
        # 创建DataLoader
        batch_size = self.training_config.get('batch_size', 64)
        
        self.train_loader = DataLoader(
            train_dataset,
            batch_size=batch_size,
            shuffle=True,
            num_workers=2
        )
        
        self.val_loader = DataLoader(
            val_dataset,
            batch_size=batch_size,
            shuffle=False,
            num_workers=2
        )
        
        self.test_loader = DataLoader(
            test_dataset,
            batch_size=batch_size,
            shuffle=False,
            num_workers=2
        )
        
        logger.info("Datasets prepared")
    
    def train(self):
        """训练模型"""
        logger.info("Starting model training...")
        
        # 配置MLflow
        mlflow.set_tracking_uri(self.config.get('mlflow_uri', 'http://localhost:5000'))
        mlflow.set_experiment(self.config.get('experiment_name', 'InFortune_stock_prediction'))
        
        # 更新模型配置
        self.model_config['input_size'] = self.processed_data.shape[1] - 3  # 减去time, symbol, close
        
        # 初始化模型
        predictor = EnsembleStockPredictor(self.model_config)
        
        # 训练
        best_val_loss = predictor.train(
            train_loader=self.train_loader,
            val_loader=self.val_loader,
            epochs=self.training_config.get('epochs', 100),
            patience=self.training_config.get('patience', 10)
        )
        
        logger.info(f"Training complete. Best val loss: {best_val_loss:.6f}")
        
        return predictor, best_val_loss
    
    def evaluate(self, predictor):
        """评估模型"""
        logger.info("Evaluating model...")
        
        # 使用测试集评估
        test_loss, test_metrics = predictor._validate(
            self.test_loader,
            torch.nn.MSELoss()
        )
        
        logger.info(f"Test Loss: {test_loss:.6f}")
        logger.info(f"Test Metrics: {test_metrics}")
        
        # 记录到MLflow
        mlflow.log_metrics({
            'test_loss': test_loss,
            'test_rmse': test_metrics['rmse'],
            'test_mae': test_metrics['mae'],
            'test_mape': test_metrics['mape']
        })
        
        return test_metrics
    
    async def run(self):
        """运行完整的训练Pipeline"""
        try:
            # 1. 初始化数据库
            logger.info("Initializing database connections...")
            await db_manager.initialize_timescale()
            db_manager.initialize_redis()
            
            # 2. 加载数据
            await self.load_data()
            
            # 3. 特征工程
            self.feature_engineering()
            
            # 4. 准备数据集
            self.prepare_datasets()
            
            # 5. 训练模型
            predictor, best_val_loss = self.train()
            
            # 6. 评估模型
            test_metrics = self.evaluate(predictor)
            
            # 7. 保存最终模型
            output_dir = Path(self.config.get('output_dir', './outputs'))
            output_dir.mkdir(parents=True, exist_ok=True)
            
            model_path = output_dir / 'final_model.pt'
            predictor.save_models(str(model_path))
            logger.info(f"Final model saved to {model_path}")
            
            # 8. 清理
            await db_manager.close_all()
            
            logger.info("Training pipeline complete!")
            
            return {
                'best_val_loss': best_val_loss,
                'test_metrics': test_metrics,
                'model_path': str(model_path)
            }
            
        except Exception as e:
            logger.error(f"Training pipeline failed: {e}")
            raise
        finally:
            await db_manager.close_all()


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Train stock prediction model')
    parser.add_argument(
        '--config',
        type=str,
        default='configs/train_config.yaml',
        help='Path to config file'
    )
    
    args = parser.parse_args()
    
    pipeline = TrainingPipeline(args.config)
    asyncio.run(pipeline.run())
