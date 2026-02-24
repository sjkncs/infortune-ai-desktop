# ⚡ 快速开始指南
# Quick Start Guide

5分钟让你的In Fortune AI系统运行起来！

---

## 🎯 目标

本指南将帮助你：
- ✅ 安装所有依赖
- ✅ 启动基础设施
- ✅ 运行第一个实验
- ✅ 查看MLflow结果

**预计时间:** 5-10分钟

---

## 📋 前置要求

### 必需
- Python 3.11+
- pip

### 可选（推荐）
- Docker Desktop
- NVIDIA GPU (训练加速)

---

## 🚀 步骤1: 安装依赖

```bash
# 进入项目目录
cd InFortune.ai-main

# 安装Python依赖
pip install -r requirements-research.txt
```

**验证安装:**
```bash
python -c "import torch; print(f'PyTorch {torch.__version__} installed')"
python -c "import mlflow; print(f'MLflow {mlflow.__version__} installed')"
```

---

## 🐳 步骤2: 启动基础设施（可选）

如果你已安装Docker：

```bash
# 启动所有服务
docker-compose -f docker-compose.research.yml up -d

# 等待30秒让服务初始化
# 检查服务状态
docker-compose -f docker-compose.research.yml ps
```

**服务清单:**
- TimescaleDB (端口 5432)
- MongoDB (端口 27017)
- Redis (端口 6379)
- MLflow (端口 5000)

如果没有Docker，脚本会自动使用本地配置。

---

## 🎬 步骤3: 运行第一个实验

### 方法A: 运行完整Pipeline（推荐）

```bash
python scripts/run_all_phases.py
```

这将执行：
1. Phase 1: 基础设施检查
2. Phase 2: 数据准备
3. Phase 3: 模型训练
4. Phase 4: 回测评估
5. Phase 5: 系统集成
6. Phase 6: 论文准备

### 方法B: 逐步执行

```bash
# Phase 1: 基础设施
python scripts/phase1_infrastructure_setup.py

# Phase 2: 数据准备
python scripts/phase2_data_preparation.py

# Phase 3: 模型训练
python scripts/phase3_model_training.py

# 查看结果
ls outputs/
```

---

## 📊 步骤4: 查看结果

### MLflow实验结果

```bash
# 启动MLflow UI
mlflow ui --port 5000

# 浏览器访问
http://localhost:5000
```

在MLflow界面你可以看到：
- 训练曲线
- 模型参数
- 评估指标
- 模型对比

### 输出文件

```bash
# 查看输出目录
ls -R outputs/

# 主要输出:
# - outputs/phase3_best_model.pt         # 训练好的模型
# - outputs/training_report.json         # 训练报告
# - outputs/phase4_backtest_results.png  # 回测图表
# - outputs/final_report.json            # 最终报告
```

---

## 🎨 步骤5: 查看可视化

### 回测结果图表

```python
# 在Python中查看
from PIL import Image
import matplotlib.pyplot as plt

img = Image.open('outputs/phase4_backtest_results.png')
plt.figure(figsize=(12, 8))
plt.imshow(img)
plt.axis('off')
plt.show()
```

### 性能指标

```python
import json

# 读取训练报告
with open('outputs/training_report.json', 'r') as f:
    report = json.load(f)
    print("Test Metrics:")
    for metric, value in report['test_metrics'].items():
        print(f"  {metric}: {value:.4f}")

# 读取回测指标
with open('outputs/phase4_metrics.json', 'r') as f:
    backtest = json.load(f)
    print("\nBacktest Metrics:")
    for metric, value in backtest.items():
        print(f"  {metric}: {value}")
```

---

## ✅ 验证清单

运行完成后，确认以下文件存在：

```bash
# 数据
[ ] data/processed_features.parquet
[ ] data/metadata.json

# 模型
[ ] outputs/phase3_best_model.pt
[ ] outputs/training_report.json

# 回测
[ ] outputs/phase4_metrics.json
[ ] outputs/phase4_backtest_results.png

# 论文
[ ] paper/paper_outline.md
[ ] paper/submission_checklist.md

# 文档
[ ] outputs/project_summary.json
[ ] outputs/final_report.json
```

---

## 🔧 常见问题

### Q1: 安装依赖时出错

**A:** 尝试升级pip
```bash
python -m pip install --upgrade pip
pip install -r requirements-research.txt
```

### Q2: Docker服务启动失败

**A:** 不影响使用，脚本会自动使用本地配置
```bash
# 检查Docker是否运行
docker ps

# 如果需要，手动启动
docker-compose -f docker-compose.research.yml up -d
```

### Q3: 训练太慢

**A:** 减少训练轮数
```yaml
# 编辑 configs/train_config.yaml
training:
  epochs: 20  # 从100减少到20
  batch_size: 32  # 减小batch size
```

### Q4: 内存不足

**A:** 减少数据量
```python
# 编辑 scripts/phase2_data_preparation.py
# 只使用1-2个股票
symbols = ['000001.SZ']  # 只用一个
```

---

## 📚 下一步

### 学习更多
1. **[OPTIMIZATION_SUMMARY.md](OPTIMIZATION_SUMMARY.md)** - 了解优化方案
2. **[IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md)** - 深入实施指南
3. **[RESEARCH_OPTIMIZATION_PLAN.md](RESEARCH_OPTIMIZATION_PLAN.md)** - 完整技术方案

### 进行实验
```bash
# 修改配置
vi configs/train_config.yaml

# 重新训练
python scripts/phase3_model_training.py

# 查看MLflow对比
mlflow ui --port 5000
```

### 准备论文
```bash
# 运行完整实验
python scripts/run_all_phases.py

# 查看论文材料
ls paper/
cat paper/paper_outline.md
cat paper/submission_checklist.md
```

---

## 🆘 获取帮助

### 文档
- **[README.md](README.md)** - 文档导航
- **[PHASE_OPTIMIZATION_COMPLETE.md](PHASE_OPTIMIZATION_COMPLETE.md)** - 故障排除

### 社区
- GitHub Issues
- 技术论坛
- Email联系

---

## 🎉 完成！

恭喜！你已经：
- ✅ 安装了所有依赖
- ✅ 运行了第一个实验
- ✅ 查看了实验结果

**现在你可以:**
1. 修改配置进行更多实验
2. 阅读详细文档深入学习
3. 准备论文撰写

---

**继续探索:** [OPTIMIZATION_SUMMARY.md](OPTIMIZATION_SUMMARY.md)
