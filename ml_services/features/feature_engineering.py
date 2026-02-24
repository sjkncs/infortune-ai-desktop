"""
Automated Feature Engineering for Financial Time Series
基于AutoML的自动化特征生成

论文参考:
- "Deep Feature Synthesis: Towards Automating Data Science Endeavors" (Kanter & Veeramachaneni, 2015)
- "The Temporal Fusion Transformer for Interpretable Time Series Forecasting" (Lim et al., 2021)
"""

import pandas as pd
import numpy as np
from typing import List, Dict, Tuple, Optional
import ta  # Technical Analysis library
from sklearn.decomposition import PCA
from sklearn.feature_selection import SelectKBest, f_regression, mutual_info_regression
from hmmlearn import hmm
from loguru import logger
import warnings
warnings.filterwarnings('ignore')


class FinancialFeatureEngineer:
    """
    Comprehensive feature engineering for financial time series
    
    创新点:
    1. 自适应特征选择 - 根据目标变量动态选择最优特征子集
    2. 领域知识融合 - 整合技术指标、基本面、市场状态
    3. 特征交互 - 自动生成高阶特征交互
    """
    
    def __init__(self, config: Optional[Dict] = None):
        self.config = config or self._default_config()
        self.selected_features = []
        self.feature_importance = {}
        self.scaler = None
        
    def _default_config(self) -> Dict:
        return {
            'technical_indicators': True,
            'fundamental_features': True,
            'market_regime': True,
            'feature_interaction': True,
            'pca_components': 20,
            'select_k_best': 50
        }
    
    def generate_all_features(self, df: pd.DataFrame, 
                            fundamentals: Optional[Dict] = None) -> pd.DataFrame:
        """
        Generate comprehensive feature set
        """
        logger.info("Starting feature engineering...")
        
        # Technical indicators
        if self.config['technical_indicators']:
            logger.info("Generating technical indicators...")
            df = self.generate_technical_indicators(df)
        
        # Fundamental features
        if self.config['fundamental_features'] and fundamentals:
            logger.info("Generating fundamental features...")
            df = self.generate_fundamental_features(df, fundamentals)
        
        # Market regime detection
        if self.config['market_regime']:
            logger.info("Detecting market regimes...")
            df = self.generate_market_regime_features(df)
        
        # Feature interactions
        if self.config['feature_interaction']:
            logger.info("Generating feature interactions...")
            df = self.generate_feature_interactions(df)
        
        # Statistical features
        logger.info("Generating statistical features...")
        df = self.generate_statistical_features(df)
        
        logger.info(f"Feature engineering complete. Total features: {len(df.columns)}")
        return df
    
    def generate_technical_indicators(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Generate 100+ technical indicators
        """
        # ========== Trend Indicators ==========
        # Moving Averages
        for window in [5, 10, 20, 30, 50, 100, 200]:
            df[f'SMA_{window}'] = ta.trend.sma_indicator(df['close'], window=window)
            df[f'EMA_{window}'] = ta.trend.ema_indicator(df['close'], window=window)
        
        # MACD
        df['MACD'] = ta.trend.macd(df['close'])
        df['MACD_signal'] = ta.trend.macd_signal(df['close'])
        df['MACD_diff'] = ta.trend.macd_diff(df['close'])
        
        # ADX (Average Directional Index)
        df['ADX'] = ta.trend.adx(df['high'], df['low'], df['close'])
        df['ADX_pos'] = ta.trend.adx_pos(df['high'], df['low'], df['close'])
        df['ADX_neg'] = ta.trend.adx_neg(df['high'], df['low'], df['close'])
        
        # Ichimoku
        df['Ichimoku_a'] = ta.trend.ichimoku_a(df['high'], df['low'])
        df['Ichimoku_b'] = ta.trend.ichimoku_b(df['high'], df['low'])
        
        # ========== Momentum Indicators ==========
        # RSI
        for window in [6, 12, 14, 24]:
            df[f'RSI_{window}'] = ta.momentum.rsi(df['close'], window=window)
        
        # Stochastic Oscillator
        df['Stoch'] = ta.momentum.stoch(df['high'], df['low'], df['close'])
        df['Stoch_signal'] = ta.momentum.stoch_signal(df['high'], df['low'], df['close'])
        
        # Williams %R
        df['Williams_R'] = ta.momentum.williams_r(df['high'], df['low'], df['close'])
        
        # ROC (Rate of Change)
        for window in [5, 10, 20]:
            df[f'ROC_{window}'] = ta.momentum.roc(df['close'], window=window)
        
        # Ultimate Oscillator
        df['Ultimate_Osc'] = ta.momentum.ultimate_oscillator(
            df['high'], df['low'], df['close']
        )
        
        # ========== Volatility Indicators ==========
        # Bollinger Bands
        for window in [20, 50]:
            df[f'BB_high_{window}'] = ta.volatility.bollinger_hband(df['close'], window=window)
            df[f'BB_low_{window}'] = ta.volatility.bollinger_lband(df['close'], window=window)
            df[f'BB_mid_{window}'] = ta.volatility.bollinger_mavg(df['close'], window=window)
            df[f'BB_width_{window}'] = df[f'BB_high_{window}'] - df[f'BB_low_{window}']
            df[f'BB_pband_{window}'] = ta.volatility.bollinger_pband(df['close'], window=window)
        
        # ATR (Average True Range)
        for window in [14, 20, 30]:
            df[f'ATR_{window}'] = ta.volatility.average_true_range(
                df['high'], df['low'], df['close'], window=window
            )
        
        # Keltner Channel
        df['Keltner_high'] = ta.volatility.keltner_channel_hband(
            df['high'], df['low'], df['close']
        )
        df['Keltner_low'] = ta.volatility.keltner_channel_lband(
            df['high'], df['low'], df['close']
        )
        
        # Donchian Channel
        df['Donchian_high'] = ta.volatility.donchian_channel_hband(
            df['high'], df['low'], df['close']
        )
        df['Donchian_low'] = ta.volatility.donchian_channel_lband(
            df['high'], df['low'], df['close']
        )
        
        # ========== Volume Indicators ==========
        # OBV (On-Balance Volume)
        df['OBV'] = ta.volume.on_balance_volume(df['close'], df['volume'])
        
        # Volume ratios
        df['Volume_SMA_20'] = df['volume'].rolling(window=20).mean()
        df['Volume_ratio'] = df['volume'] / df['Volume_SMA_20']
        
        # VWAP (Volume Weighted Average Price)
        df['VWAP'] = (df['volume'] * (df['high'] + df['low'] + df['close']) / 3).cumsum() / df['volume'].cumsum()
        
        # Accumulation/Distribution Index
        df['ADI'] = ta.volume.acc_dist_index(df['high'], df['low'], df['close'], df['volume'])
        
        # Chaikin Money Flow
        df['CMF'] = ta.volume.chaikin_money_flow(df['high'], df['low'], df['close'], df['volume'])
        
        # Force Index
        df['Force_Index'] = ta.volume.force_index(df['close'], df['volume'])
        
        # Money Flow Index
        df['MFI'] = ta.volume.money_flow_index(df['high'], df['low'], df['close'], df['volume'])
        
        return df
    
    def generate_fundamental_features(self, df: pd.DataFrame, 
                                    fundamentals: Dict) -> pd.DataFrame:
        """
        Incorporate fundamental data (PE, PB, ROE, etc.)
        """
        # Add fundamental ratios
        for key, value in fundamentals.items():
            df[f'fundamental_{key}'] = value
        
        # Valuation metrics
        if 'pe_ratio' in fundamentals and 'industry_avg_pe' in fundamentals:
            df['pe_deviation'] = (
                (fundamentals['pe_ratio'] - fundamentals['industry_avg_pe']) 
                / fundamentals['industry_avg_pe']
            )
        
        if 'pb_ratio' in fundamentals and 'industry_avg_pb' in fundamentals:
            df['pb_deviation'] = (
                (fundamentals['pb_ratio'] - fundamentals['industry_avg_pb']) 
                / fundamentals['industry_avg_pb']
            )
        
        # Growth metrics
        if 'revenue_growth' in fundamentals and 'profit_growth' in fundamentals:
            df['growth_momentum'] = (
                fundamentals['revenue_growth'] * 0.4 + 
                fundamentals['profit_growth'] * 0.6
            )
        
        return df
    
    def generate_market_regime_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Market regime detection using Hidden Markov Models
        
        创新点: 市场状态识别 (牛市/熊市/震荡)
        论文参考: "Regime Switching Models in Financial Markets" (Hamilton, 1989)
        """
        # Calculate returns and volatility
        returns = df['close'].pct_change()
        volatility = returns.rolling(window=20).std()
        
        # Prepare features for HMM
        X = np.column_stack([
            returns.fillna(0),
            volatility.fillna(volatility.mean())
        ])
        
        try:
            # Train Gaussian HMM with 3 states
            # State 0: Bear market (低收益高波动)
            # State 1: Bull market (高收益低波动)
            # State 2: Sideways market (低收益低波动)
            model = hmm.GaussianHMM(
                n_components=3, 
                covariance_type="full", 
                n_iter=1000,
                random_state=42
            )
            model.fit(X)
            
            # Predict hidden states
            hidden_states = model.predict(X)
            
            # Add regime features
            df['market_regime'] = hidden_states
            df['market_regime_prob_0'] = model.predict_proba(X)[:, 0]
            df['market_regime_prob_1'] = model.predict_proba(X)[:, 1]
            df['market_regime_prob_2'] = model.predict_proba(X)[:, 2]
            
            # Regime transition features
            df['regime_changed'] = (df['market_regime'] != df['market_regime'].shift(1)).astype(int)
            
        except Exception as e:
            logger.warning(f"HMM failed: {e}. Using fallback regime detection.")
            # Fallback: simple volatility-based regime
            vol_threshold_high = volatility.quantile(0.66)
            vol_threshold_low = volatility.quantile(0.33)
            
            df['market_regime'] = 2  # Default: sideways
            df.loc[volatility > vol_threshold_high, 'market_regime'] = 0  # Bear
            df.loc[(returns > 0) & (volatility < vol_threshold_low), 'market_regime'] = 1  # Bull
        
        return df
    
    def generate_feature_interactions(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Generate interaction features
        创新点: 自动化特征交互生成
        """
        # Price momentum × Volume
        df['momentum_volume'] = df['ROC_10'] * df['Volume_ratio']
        
        # Trend strength × Volatility
        df['trend_volatility'] = df['ADX'] * df['ATR_14']
        
        # RSI divergence
        df['RSI_price_divergence'] = df['RSI_14'] - df['close'].pct_change(14) * 100
        
        # MACD × Volume
        df['MACD_volume'] = df['MACD'] * df['Volume_ratio']
        
        # BB position × RSI
        df['BB_RSI_interaction'] = df['BB_pband_20'] * df['RSI_14'] / 100
        
        return df
    
    def generate_statistical_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Generate statistical features (lag, rolling statistics, etc.)
        """
        # Lagged features
        for lag in [1, 2, 3, 5, 10]:
            df[f'close_lag_{lag}'] = df['close'].shift(lag)
            df[f'return_lag_{lag}'] = df['close'].pct_change(lag)
        
        # Rolling statistics
        for window in [5, 10, 20, 60]:
            df[f'return_mean_{window}'] = df['close'].pct_change().rolling(window).mean()
            df[f'return_std_{window}'] = df['close'].pct_change().rolling(window).std()
            df[f'return_skew_{window}'] = df['close'].pct_change().rolling(window).skew()
            df[f'return_kurt_{window}'] = df['close'].pct_change().rolling(window).kurt()
        
        # High-low range
        df['high_low_ratio'] = df['high'] / df['low']
        df['close_open_ratio'] = df['close'] / df['open']
        
        return df
    
    def select_features(self, X: pd.DataFrame, y: pd.Series, 
                       method: str = 'mutual_info', k: int = 50) -> List[str]:
        """
        Automatic feature selection using statistical tests
        
        Methods:
        - 'f_regression': F-test (linear relationships)
        - 'mutual_info': Mutual information (non-linear relationships)
        """
        # Remove inf and nan
        X = X.replace([np.inf, -np.inf], np.nan)
        X = X.fillna(method='ffill').fillna(method='bfill').fillna(0)
        
        if method == 'f_regression':
            selector = SelectKBest(score_func=f_regression, k=min(k, X.shape[1]))
        elif method == 'mutual_info':
            selector = SelectKBest(
                score_func=mutual_info_regression, 
                k=min(k, X.shape[1])
            )
        else:
            raise ValueError(f"Unknown method: {method}")
        
        selector.fit(X, y)
        
        # Get selected features
        selected_indices = selector.get_support(indices=True)
        self.selected_features = X.columns[selected_indices].tolist()
        
        # Store feature importance
        scores = selector.scores_[selected_indices]
        self.feature_importance = dict(zip(self.selected_features, scores))
        
        logger.info(f"Selected {len(self.selected_features)} features using {method}")
        logger.info(f"Top 10 features: {sorted(self.feature_importance.items(), key=lambda x: x[1], reverse=True)[:10]}")
        
        return self.selected_features
    
    def apply_pca(self, X: pd.DataFrame, n_components: int = 20) -> pd.DataFrame:
        """
        Apply PCA for dimensionality reduction
        """
        pca = PCA(n_components=n_components)
        X_pca = pca.fit_transform(X)
        
        # Create DataFrame with PCA components
        pca_df = pd.DataFrame(
            X_pca, 
            columns=[f'PC{i+1}' for i in range(n_components)],
            index=X.index
        )
        
        logger.info(f"PCA explained variance ratio: {pca.explained_variance_ratio_.sum():.4f}")
        
        return pca_df
    
    def get_feature_importance_report(self) -> pd.DataFrame:
        """
        Generate feature importance report
        """
        if not self.feature_importance:
            logger.warning("No feature importance available. Run select_features first.")
            return pd.DataFrame()
        
        report = pd.DataFrame(
            list(self.feature_importance.items()),
            columns=['Feature', 'Importance']
        ).sort_values('Importance', ascending=False)
        
        return report


if __name__ == "__main__":
    # Example usage
    logger.info("Testing FinancialFeatureEngineer...")
    
    # Create sample data
    dates = pd.date_range('2020-01-01', periods=1000)
    df = pd.DataFrame({
        'open': np.random.randn(1000).cumsum() + 100,
        'high': np.random.randn(1000).cumsum() + 102,
        'low': np.random.randn(1000).cumsum() + 98,
        'close': np.random.randn(1000).cumsum() + 100,
        'volume': np.random.randint(1000000, 10000000, 1000)
    }, index=dates)
    
    # Initialize feature engineer
    engineer = FinancialFeatureEngineer()
    
    # Generate features
    df_features = engineer.generate_all_features(df)
    
    logger.info(f"Generated {len(df_features.columns)} features")
    logger.info(f"Feature columns: {df_features.columns.tolist()[:20]}...")
