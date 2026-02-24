"""
Phase 3: 模型训练与评估
Model Training and Evaluation

执行内容:
1. 加载处理后的数据
2. 训练集成学习模型
3. 超参数优化
4. 模型评估
5. 保存最佳模型
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import torch
from torch.utils.data import DataLoader
import pandas as pd
import numpy as np
from loguru import logger
import mlflow
import mlflow.pytorch
from pathlib import Path

from ml_services.forecasting.ensemble_model import (
    EnsembleStockPredictor,
    StockDataset
)


class ModelTraining:
    """Phase 3: 模型训练"""
    
    def __init__(self, config_path: str = 'configs/train_config.yaml'):
        import yaml
        
        with open(config_path, 'r', encoding='utf-8') as f:
            self.config = yaml.safe_load(f)
        
        self.model_config = self.config['model']
        self.training_config = self.config['training']
        
        logger.info(f"Loaded config from {config_path}")
    
    def load_processed_data(self):
        """加载处理后的数据"""
        logger.info("Loading processed data...")
        
        data_file = 'data/processed_features.parquet'
        
        if not os.path.exists(data_file):
            logger.error(f"❌ Data file not found: {data_file}")
            logger.info("Please run Phase 2 first: python scripts/phase2_data_preparation.py")
            return False
        
        self.data = pd.read_parquet(data_file)
        logger.info(f"✅ Loaded {len(self.data)} records with {len(self.data.columns)} features")
        
        return True
    
    def prepare_datasets(self):
        """准备训练/验证/测试数据集"""
        logger.info("Preparing datasets...")
        
        # 数据分割
        train_ratio = self.training_config.get('train_ratio', 0.7)
        val_ratio = self.training_config.get('val_ratio', 0.15)
        
        n_total = len(self.data)
        n_train = int(n_total * train_ratio)
        n_val = int(n_total * val_ratio)
        
        train_data = self.data.iloc[:n_train]
        val_data = self.data.iloc[n_train:n_train+n_val]
        test_data = self.data.iloc[n_train+n_val:]
        
        logger.info(f"Train: {len(train_data)}, Val: {len(val_data)}, Test: {len(test_data)}")
        
        # 特征列
        exclude_cols = ['time', 'symbol', 'close']
        feature_cols = [col for col in self.data.columns if col not in exclude_cols]
        
        logger.info(f"Using {len(feature_cols)} features")
        
        # 转换为numpy
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
            num_workers=0  # Windows兼容
        )
        
        self.val_loader = DataLoader(
            val_dataset,
            batch_size=batch_size,
            shuffle=False,
            num_workers=0
        )
        
        self.test_loader = DataLoader(
            test_dataset,
            batch_size=batch_size,
            shuffle=False,
            num_workers=0
        )
        
        logger.info("✅ Datasets prepared")
        return True
    
    def train_model(self):
        """训练模型"""
        logger.info("Starting model training...")
        
        # 配置MLflow
        mlflow.set_tracking_uri(self.config.get('mlflow_uri', 'http://localhost:5000'))
        mlflow.set_experiment(self.config.get('experiment_name', 'InFortune_phase3'))
        
        # 更新模型配置
        self.model_config['input_size'] = self.data.shape[1] - 3
        
        # 初始化模型
        predictor = EnsembleStockPredictor(self.model_config)
        
        # 训练
        try:
            best_val_loss = predictor.train(
                train_loader=self.train_loader,
                val_loader=self.val_loader,
                epochs=self.training_config.get('epochs', 50),  # 默认50轮以加快速度
                patience=self.training_config.get('patience', 10)
            )
            
            logger.info(f"✅ Training complete. Best val loss: {best_val_loss:.6f}")
            
            self.predictor = predictor
            self.best_val_loss = best_val_loss
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Training failed: {e}")
            return False
    
    def evaluate_model(self):
        """评估模型"""
        logger.info("Evaluating model on test set...")
        
        try:
            test_loss, test_metrics = self.predictor._validate(
                self.test_loader,
                torch.nn.MSELoss()
            )
            
            logger.info(f"Test Loss: {test_loss:.6f}")
            logger.info(f"Test RMSE: {test_metrics['rmse']:.6f}")
            logger.info(f"Test MAE: {test_metrics['mae']:.6f}")
            logger.info(f"Test MAPE: {test_metrics['mape']:.2f}%")
            
            # 记录到MLflow
            mlflow.log_metrics({
                'test_loss': test_loss,
                'test_rmse': test_metrics['rmse'],
                'test_mae': test_metrics['mae'],
                'test_mape': test_metrics['mape']
            })
            
            self.test_metrics = test_metrics
            
            logger.info("✅ Model evaluation complete")
            return True
            
        except Exception as e:
            logger.error(f"❌ Evaluation failed: {e}")
            return False
    
    def save_model(self):
        """保存模型"""
        logger.info("Saving trained model...")
        
        try:
            output_dir = Path(self.config.get('output_dir', './outputs'))
            output_dir.mkdir(parents=True, exist_ok=True)
            
            model_path = output_dir / 'phase3_best_model.pt'
            self.predictor.save_models(str(model_path))
            
            logger.info(f"✅ Model saved to {model_path}")
            
            # 保存训练报告
            report = {
                'best_val_loss': float(self.best_val_loss),
                'test_metrics': {k: float(v) for k, v in self.test_metrics.items()},
                'model_config': self.model_config,
                'training_config': self.training_config
            }
            
            import json
            report_path = output_dir / 'training_report.json'
            with open(report_path, 'w') as f:
                json.dump(report, f, indent=2)
            
            logger.info(f"✅ Training report saved to {report_path}")
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to save model: {e}")
            return False
    
    def run_phase3(self):
        """运行Phase 3完整流程"""
        logger.info("=" * 60)
        logger.info("Starting Phase 3: Model Training")
        logger.info("=" * 60)
        
        steps = [
            ("Load Processed Data", self.load_processed_data),
            ("Prepare Datasets", self.prepare_datasets),
            ("Train Model", self.train_model),
            ("Evaluate Model", self.evaluate_model),
            ("Save Model", self.save_model)
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
                    break  # 停止后续步骤
                    
            except Exception as e:
                logger.error(f"❌ {step_name} error: {e}")
                import traceback
                traceback.print_exc()
                break
        
        # 总结
        logger.info("=" * 60)
        logger.info(f"Phase 3 Complete: {success_count}/{len(steps)} steps successful")
        logger.info("=" * 60)
        
        if success_count == len(steps):
            logger.info("✅ Phase 3 model training complete!")
            logger.info(f"Best model saved to: outputs/phase3_best_model.pt")
            return True
        else:
            logger.error("❌ Phase 3 incomplete")
            return False


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Phase 3: Model Training')
    parser.add_argument(
        '--config',
        type=str,
        default='configs/train_config.yaml',
        help='Path to config file'
    )
    
    args = parser.parse_args()
    
    training = ModelTraining(config_path=args.config)
    result = training.run_phase3()
    
    if result:
        print("\n✅ Phase 3 完成！可以继续 Phase 4")
        print("运行: python scripts/phase4_reinforcement_learning.py")
    else:
        print("\n❌ Phase 3 未完全成功，请检查日志")
    
    sys.exit(0 if result else 1)
