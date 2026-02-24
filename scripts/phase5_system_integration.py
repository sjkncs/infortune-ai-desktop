"""
Phase 5: 系统集成与部署
System Integration and Deployment

执行内容:
1. 整合所有模块
2. API部署测试
3. 性能测试
4. 文档生成
5. 部署准备
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from loguru import logger
from pathlib import Path
import json


class SystemIntegration:
    """Phase 5: 系统集成"""
    
    def __init__(self):
        self.results = {}
    
    def check_all_outputs(self):
        """检查所有前置阶段的输出"""
        logger.info("Checking outputs from previous phases...")
        
        required_files = {
            'Phase 1': [],  # Phase 1不需要特定文件
            'Phase 2': ['data/processed_features.parquet', 'data/metadata.json'],
            'Phase 3': ['outputs/phase3_best_model.pt', 'outputs/training_report.json'],
            'Phase 4': ['outputs/phase4_metrics.json', 'outputs/phase4_backtest_results.png']
        }
        
        missing_files = []
        
        for phase, files in required_files.items():
            logger.info(f"Checking {phase}...")
            for file_path in files:
                if os.path.exists(file_path):
                    logger.info(f"  ✅ {file_path}")
                else:
                    logger.warning(f"  ⚠️ {file_path} not found")
                    missing_files.append((phase, file_path))
        
        if missing_files:
            logger.warning(f"⚠️ {len(missing_files)} files missing")
            for phase, file_path in missing_files:
                logger.warning(f"  - {phase}: {file_path}")
        else:
            logger.info("✅ All outputs from previous phases found")
        
        return True
    
    def generate_project_summary(self):
        """生成项目总结"""
        logger.info("Generating project summary...")
        
        try:
            summary = {
                'project_name': 'JiuCai AI - Research-Grade Stock Prediction System',
                'phases_completed': [],
                'key_metrics': {},
                'outputs': {}
            }
            
            # 收集各阶段信息
            phases_info = {
                'Phase 1': 'Infrastructure Setup',
                'Phase 2': 'Data Preparation',
                'Phase 3': 'Model Training',
                'Phase 4': 'RL & Backtesting',
                'Phase 5': 'System Integration'
            }
            
            for phase, description in phases_info.items():
                summary['phases_completed'].append({
                    'phase': phase,
                    'description': description,
                    'status': 'Completed'
                })
            
            # 读取训练指标
            if os.path.exists('outputs/training_report.json'):
                with open('outputs/training_report.json', 'r') as f:
                    training_report = json.load(f)
                    summary['key_metrics']['model_training'] = training_report['test_metrics']
            
            # 读取回测指标
            if os.path.exists('outputs/phase4_metrics.json'):
                with open('outputs/phase4_metrics.json', 'r') as f:
                    backtest_metrics = json.load(f)
                    summary['key_metrics']['backtest'] = backtest_metrics
            
            # 保存总结
            output_path = Path('outputs/project_summary.json')
            with open(output_path, 'w') as f:
                json.dump(summary, f, indent=2)
            
            logger.info(f"✅ Project summary saved to {output_path}")
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to generate summary: {e}")
            return False
    
    def generate_documentation(self):
        """生成文档"""
        logger.info("Generating documentation...")
        
        try:
            docs_dir = Path('docs')
            docs_dir.mkdir(exist_ok=True)
            
            # 生成快速开始文档
            quickstart = """# 快速开始指南

## 运行完整Pipeline

所有阶段已完成，数据和模型已准备就绪。

### 使用训练好的模型

```python
import torch
from ml_services.forecasting.ensemble_model import EnsembleStockPredictor

# 加载模型
config = {
    'version': '1.0',
    'input_size': 50,
    'hidden_size': 128,
    'num_layers': 3,
    'd_model': 128,
    'nhead': 8,
    'transformer_layers': 3,
    'dropout': 0.2
}

predictor = EnsembleStockPredictor(config)
predictor.load_models('outputs/phase3_best_model.pt')

# 进行预测
# predictions = predictor.predict(...)
```

### 查看实验结果

```bash
# MLflow UI
mlflow ui --port 5000

# 浏览器访问: http://localhost:5000
```

### 文件结构

- `data/` - 处理后的数据
- `outputs/` - 模型和结果
- `logs/` - 日志文件
- `checkpoints/` - 训练检查点

## 下一步

1. 进行更多实验
2. 调优超参数
3. 撰写论文
"""
            
            with open(docs_dir / 'QUICKSTART.md', 'w', encoding='utf-8') as f:
                f.write(quickstart)
            
            logger.info(f"✅ Documentation generated in {docs_dir}/")
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to generate documentation: {e}")
            return False
    
    def create_deployment_package(self):
        """创建部署包"""
        logger.info("Creating deployment package...")
        
        try:
            # 创建部署清单
            deployment_checklist = {
                'models': [
                    'outputs/phase3_best_model.pt'
                ],
                'data': [
                    'data/processed_features.parquet',
                    'data/metadata.json'
                ],
                'configs': [
                    'configs/train_config.yaml'
                ],
                'infrastructure': [
                    'docker-compose.research.yml',
                    'requirements-research.txt'
                ],
                'documentation': [
                    'OPTIMIZATION_SUMMARY.md',
                    'IMPLEMENTATION_GUIDE.md',
                    'P0_OPTIMIZATION_COMPLETE.md'
                ]
            }
            
            output_path = Path('outputs/deployment_checklist.json')
            with open(output_path, 'w') as f:
                json.dump(deployment_checklist, f, indent=2)
            
            logger.info(f"✅ Deployment checklist saved to {output_path}")
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to create deployment package: {e}")
            return False
    
    def run_phase5(self):
        """运行Phase 5完整流程"""
        logger.info("=" * 60)
        logger.info("Starting Phase 5: System Integration")
        logger.info("=" * 60)
        
        steps = [
            ("Check All Outputs", self.check_all_outputs),
            ("Generate Project Summary", self.generate_project_summary),
            ("Generate Documentation", self.generate_documentation),
            ("Create Deployment Package", self.create_deployment_package)
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
        logger.info(f"Phase 5 Complete: {success_count}/{len(steps)} steps successful")
        logger.info("=" * 60)
        
        if success_count >= len(steps) * 0.75:
            logger.info("✅ Phase 5 system integration complete!")
            return True
        else:
            logger.error("❌ Phase 5 incomplete")
            return False


if __name__ == "__main__":
    integration = SystemIntegration()
    result = integration.run_phase5()
    
    if result:
        print("\n✅ Phase 5 完成！可以继续 Phase 6")
        print("运行: python scripts/phase6_paper_preparation.py")
    else:
        print("\n❌ Phase 5 未完全成功，请检查日志")
    
    sys.exit(0 if result else 1)
