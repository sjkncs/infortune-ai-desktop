"""
Multi-Model Ensemble for Stock Price Prediction
基于Stacking/Voting的集成学习框架

论文参考:
- "A Dual-Stage Attention-Based Recurrent Neural Network for Time Series Prediction" (Chen et al., 2017)
- "Temporal Fusion Transformers for Interpretable Multi-horizon Time Series Forecasting" (Lim et al., 2021)
"""

import torch
import torch.nn as nn
from torch.utils.data import DataLoader, Dataset
import pandas as pd
import numpy as np
from sklearn.preprocessing import RobustScaler
from typing import Dict, List, Tuple, Optional
import mlflow
import mlflow.pytorch
from loguru import logger


class StockDataset(Dataset):
    """Stock time series dataset"""
    
    def __init__(self, data: np.ndarray, sequence_length: int = 60):
        self.data = data
        self.sequence_length = sequence_length
        
    def __len__(self):
        return len(self.data) - self.sequence_length
    
    def __getitem__(self, idx):
        x = self.data[idx:idx+self.sequence_length]
        y = self.data[idx+self.sequence_length, 0]  # Predict close price
        return torch.FloatTensor(x), torch.FloatTensor([y])


class AttentionLSTM(nn.Module):
    """
    LSTM with Self-Attention Mechanism
    
    创新点:
    1. 双向LSTM捕捉时序依赖
    2. Multi-head attention机制增强特征提取
    3. Residual connection缓解梯度消失
    """
    
    def __init__(self, input_size: int, hidden_size: int, num_layers: int, dropout: float = 0.2):
        super(AttentionLSTM, self).__init__()
        self.hidden_size = hidden_size
        self.num_layers = num_layers
        
        # Bidirectional LSTM
        self.lstm = nn.LSTM(
            input_size, 
            hidden_size, 
            num_layers, 
            batch_first=True,
            dropout=dropout if num_layers > 1 else 0,
            bidirectional=True
        )
        
        # Multi-head Self-attention
        self.attention = nn.MultiheadAttention(
            embed_dim=hidden_size * 2,  # *2 for bidirectional
            num_heads=8,
            dropout=dropout,
            batch_first=True
        )
        
        # Layer normalization
        self.layer_norm = nn.LayerNorm(hidden_size * 2)
        
        # Prediction head
        self.fc = nn.Sequential(
            nn.Linear(hidden_size * 2, hidden_size),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(hidden_size, hidden_size // 2),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(hidden_size // 2, 1)
        )
        
    def forward(self, x):
        # LSTM layer
        lstm_out, (hidden, cell) = self.lstm(x)
        
        # Self-attention with residual connection
        attn_out, attn_weights = self.attention(lstm_out, lstm_out, lstm_out)
        attn_out = self.layer_norm(attn_out + lstm_out)  # Residual
        
        # Take last time step
        out = self.fc(attn_out[:, -1, :])
        
        return out, attn_weights


class TransformerForecaster(nn.Module):
    """
    Temporal Fusion Transformer for Multi-Horizon Forecasting
    
    参考论文: Lim et al., 2021
    创新点:
    1. 位置编码捕捉时间信息
    2. Multi-scale temporal patterns
    3. 可解释性注意力权重
    """
    
    def __init__(self, input_size: int = 10, d_model: int = 128, nhead: int = 8, 
                 num_layers: int = 3, dropout: float = 0.1):
        super(TransformerForecaster, self).__init__()
        
        # Input projection
        self.embedding = nn.Linear(input_size, d_model)
        
        # Positional encoding
        self.pos_encoder = PositionalEncoding(d_model, dropout)
        
        # Transformer encoder
        encoder_layer = nn.TransformerEncoderLayer(
            d_model=d_model,
            nhead=nhead,
            dim_feedforward=d_model * 4,
            dropout=dropout,
            activation='gelu',
            batch_first=True
        )
        self.transformer = nn.TransformerEncoder(encoder_layer, num_layers=num_layers)
        
        # Prediction head
        self.fc = nn.Sequential(
            nn.Linear(d_model, d_model // 2),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(d_model // 2, 1)
        )
        
    def forward(self, x):
        # Input embedding
        x = self.embedding(x)
        x = self.pos_encoder(x)
        
        # Transformer encoding
        x = self.transformer(x)
        
        # Prediction
        out = self.fc(x[:, -1, :])
        
        return out


class PositionalEncoding(nn.Module):
    """Positional encoding for Transformer"""
    
    def __init__(self, d_model: int, dropout: float = 0.1, max_len: int = 5000):
        super(PositionalEncoding, self).__init__()
        self.dropout = nn.Dropout(p=dropout)
        
        position = torch.arange(max_len).unsqueeze(1)
        div_term = torch.exp(torch.arange(0, d_model, 2) * (-np.log(10000.0) / d_model))
        
        pe = torch.zeros(max_len, 1, d_model)
        pe[:, 0, 0::2] = torch.sin(position * div_term)
        pe[:, 0, 1::2] = torch.cos(position * div_term)
        
        self.register_buffer('pe', pe)
        
    def forward(self, x):
        x = x + self.pe[:x.size(1)].transpose(0, 1)
        return self.dropout(x)


class EnsembleStockPredictor:
    """
    Ensemble Learning Framework combining multiple models
    
    创新点:
    1. Meta-learner自适应权重分配
    2. Monte Carlo Dropout不确定性量化
    3. MLflow实验跟踪
    """
    
    def __init__(self, config: Dict):
        self.config = config
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        logger.info(f"Using device: {self.device}")
        
        # Initialize base models
        self.models = {
            'lstm_attn': AttentionLSTM(
                input_size=config['input_size'],
                hidden_size=config['hidden_size'],
                num_layers=config['num_layers'],
                dropout=config['dropout']
            ).to(self.device),
            
            'transformer': TransformerForecaster(
                input_size=config['input_size'],
                d_model=config['d_model'],
                nhead=config['nhead'],
                num_layers=config['transformer_layers'],
                dropout=config['dropout']
            ).to(self.device)
        }
        
        # Meta-learner for ensemble weights
        self.meta_learner = nn.Sequential(
            nn.Linear(len(self.models), 64),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(64, len(self.models)),
            nn.Softmax(dim=-1)
        ).to(self.device)
        
        self.scaler = RobustScaler()
        self.best_val_loss = float('inf')
        
    def train(self, train_loader: DataLoader, val_loader: DataLoader, 
             epochs: int = 100, patience: int = 10):
        """
        Training with MLflow experiment tracking and early stopping
        """
        with mlflow.start_run(run_name=f"ensemble_v{self.config['version']}"):
            # Log hyperparameters
            mlflow.log_params(self.config)
            
            # Initialize optimizers
            optimizers = {
                name: torch.optim.AdamW(
                    model.parameters(), 
                    lr=self.config['learning_rate'],
                    weight_decay=self.config['weight_decay']
                )
                for name, model in self.models.items()
            }
            
            meta_optimizer = torch.optim.AdamW(
                self.meta_learner.parameters(),
                lr=self.config['learning_rate'] * 0.1
            )
            
            # Loss function
            criterion = nn.MSELoss()
            
            # Early stopping
            patience_counter = 0
            
            for epoch in range(epochs):
                # Training phase
                train_losses = self._train_epoch(
                    train_loader, optimizers, meta_optimizer, criterion
                )
                
                # Validation phase
                val_loss, val_metrics = self._validate(val_loader, criterion)
                
                # Log metrics
                mlflow.log_metrics({
                    'train_loss_avg': np.mean(list(train_losses.values())),
                    'val_loss': val_loss,
                    'val_rmse': val_metrics['rmse'],
                    'val_mape': val_metrics['mape'],
                    **{f'train_loss_{k}': v for k, v in train_losses.items()}
                }, step=epoch)
                
                logger.info(f"Epoch {epoch+1}/{epochs} - "
                           f"Train Loss: {np.mean(list(train_losses.values())):.6f}, "
                           f"Val Loss: {val_loss:.6f}, "
                           f"Val RMSE: {val_metrics['rmse']:.6f}")
                
                # Save best model
                if val_loss < self.best_val_loss:
                    self.best_val_loss = val_loss
                    self.save_models(f"checkpoints/best_epoch_{epoch}.pt")
                    patience_counter = 0
                    logger.info(f"New best model saved! Val Loss: {val_loss:.6f}")
                else:
                    patience_counter += 1
                
                # Early stopping
                if patience_counter >= patience:
                    logger.info(f"Early stopping at epoch {epoch+1}")
                    break
                    
            return self.best_val_loss
    
    def _train_epoch(self, train_loader: DataLoader, optimizers: Dict, 
                    meta_optimizer: torch.optim.Optimizer, 
                    criterion: nn.Module) -> Dict[str, float]:
        """Train for one epoch"""
        for model in self.models.values():
            model.train()
        self.meta_learner.train()
        
        epoch_losses = {name: 0.0 for name in self.models.keys()}
        
        for batch_x, batch_y in train_loader:
            batch_x = batch_x.to(self.device)
            batch_y = batch_y.to(self.device)
            
            # Train each base model
            predictions = []
            for name, model in self.models.items():
                optimizers[name].zero_grad()
                
                if name == 'lstm_attn':
                    pred, _ = model(batch_x)
                else:
                    pred = model(batch_x)
                
                loss = criterion(pred, batch_y)
                loss.backward()
                
                # Gradient clipping
                torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
                
                optimizers[name].step()
                
                epoch_losses[name] += loss.item()
                predictions.append(pred.detach())
            
            # Train meta-learner
            meta_optimizer.zero_grad()
            
            predictions_tensor = torch.stack(predictions, dim=-1).squeeze(1)
            weights = self.meta_learner(predictions_tensor)
            
            ensemble_pred = (predictions_tensor * weights).sum(dim=-1, keepdim=True)
            meta_loss = criterion(ensemble_pred, batch_y)
            
            meta_loss.backward()
            meta_optimizer.step()
        
        # Average losses
        for name in epoch_losses:
            epoch_losses[name] /= len(train_loader)
        
        return epoch_losses
    
    def _validate(self, val_loader: DataLoader, 
                 criterion: nn.Module) -> Tuple[float, Dict]:
        """Validation phase"""
        for model in self.models.values():
            model.eval()
        self.meta_learner.eval()
        
        val_loss = 0.0
        all_predictions = []
        all_targets = []
        
        with torch.no_grad():
            for batch_x, batch_y in val_loader:
                batch_x = batch_x.to(self.device)
                batch_y = batch_y.to(self.device)
                
                predictions = []
                for name, model in self.models.items():
                    if name == 'lstm_attn':
                        pred, _ = model(batch_x)
                    else:
                        pred = model(batch_x)
                    predictions.append(pred)
                
                predictions_tensor = torch.stack(predictions, dim=-1).squeeze(1)
                weights = self.meta_learner(predictions_tensor)
                ensemble_pred = (predictions_tensor * weights).sum(dim=-1, keepdim=True)
                
                loss = criterion(ensemble_pred, batch_y)
                val_loss += loss.item()
                
                all_predictions.extend(ensemble_pred.cpu().numpy())
                all_targets.extend(batch_y.cpu().numpy())
        
        val_loss /= len(val_loader)
        
        # Calculate additional metrics
        predictions_np = np.array(all_predictions)
        targets_np = np.array(all_targets)
        
        metrics = {
            'rmse': np.sqrt(np.mean((predictions_np - targets_np) ** 2)),
            'mae': np.mean(np.abs(predictions_np - targets_np)),
            'mape': np.mean(np.abs((targets_np - predictions_np) / targets_np)) * 100
        }
        
        return val_loss, metrics
    
    def predict_with_uncertainty(self, x: torch.Tensor, 
                                n_samples: int = 100) -> Tuple[float, float]:
        """
        Monte Carlo Dropout for uncertainty estimation
        
        创新点: 提供预测区间,量化模型不确定性
        论文参考: Gal & Ghahramani, 2016
        """
        x = x.to(self.device)
        predictions = []
        
        # Enable dropout during inference
        for model in self.models.values():
            model.train()  # Keep dropout active
        
        for _ in range(n_samples):
            with torch.no_grad():
                ensemble_pred = []
                
                for name, model in self.models.items():
                    if name == 'lstm_attn':
                        pred, _ = model(x)
                    else:
                        pred = model(x)
                    ensemble_pred.append(pred.item())
                
                # Weighted average
                pred_tensor = torch.tensor(ensemble_pred).to(self.device)
                weights = self.meta_learner(pred_tensor)
                final_pred = (pred_tensor * weights).sum().item()
                
                predictions.append(final_pred)
        
        # Calculate statistics
        mean_pred = np.mean(predictions)
        std_pred = np.std(predictions)
        
        # 95% confidence interval
        ci_lower = mean_pred - 1.96 * std_pred
        ci_upper = mean_pred + 1.96 * std_pred
        
        return mean_pred, std_pred, ci_lower, ci_upper
    
    def save_models(self, path: str):
        """Save all models"""
        checkpoint = {
            'models': {name: model.state_dict() for name, model in self.models.items()},
            'meta_learner': self.meta_learner.state_dict(),
            'config': self.config,
            'best_val_loss': self.best_val_loss
        }
        torch.save(checkpoint, path)
        logger.info(f"Models saved to {path}")
    
    def load_models(self, path: str):
        """Load models from checkpoint"""
        checkpoint = torch.load(path, map_location=self.device)
        
        for name, model in self.models.items():
            model.load_state_dict(checkpoint['models'][name])
        
        self.meta_learner.load_state_dict(checkpoint['meta_learner'])
        self.best_val_loss = checkpoint['best_val_loss']
        
        logger.info(f"Models loaded from {path}")


if __name__ == "__main__":
    # Example usage
    config = {
        'version': '1.0',
        'input_size': 10,
        'hidden_size': 128,
        'num_layers': 3,
        'd_model': 128,
        'nhead': 8,
        'transformer_layers': 3,
        'dropout': 0.2,
        'learning_rate': 0.001,
        'weight_decay': 1e-5,
        'sequence_length': 60
    }
    
    # Initialize predictor
    predictor = EnsembleStockPredictor(config)
    
    logger.info("Ensemble Stock Predictor initialized successfully!")
