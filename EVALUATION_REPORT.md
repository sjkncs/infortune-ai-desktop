# In Fortune AI Desktop — 量化金融工程评估报告

> 评估人角色: 量化金融专业工程师  
> 评估日期: 2026-02-22  

---

## 一、项目总体评分

| 维度 | 得分(10分制) | 说明 |
|:----:|:----:|:-----|
| **架构完整度** | 6.5 | 多层架构清晰，但层间耦合松散，大量占位代码 |
| **集成度** | 4.0 | 前后端/数据服务基本跑通，但ML→API→Desktop链路**断裂** |
| **创新性** | 5.5 | 有HMM市场状态、集成学习、MC Dropout等概念，但均停留在骨架 |
| **工程质量** | 4.0 | 安全隐患、无测试覆盖、硬编码密码、无CI/CD |
| **量化专业度** | 4.5 | 特征工程较全面，但缺少风险模型、因子模型、真实回测引擎 |
| **可运行度** | 3.5 | Desktop端AI为模拟响应，ML Pipeline依赖Docker未搭建，无法端到端运行 |

**综合评分: 4.7 / 10**

---

## 二、集成度分析 (Integration Assessment)

### 2.1 当前集成现状

```
Desktop(Electron) ──?──> Node.js(Express) ──✓──> AKShare(FastAPI)
       │                      │                      │
       │                      ├──✓──> BaoStock(FastAPI)
       │                      │
       ✗ AI API(模拟)          ✗ ML Service未连接
       ✗ 策略回测(前端模拟)     ✗ data_layer未使用
       ✗ Portfolio(占位)       ✗ Feature Store未搭建
```

### 2.2 关键断裂点

1. **ML Pipeline ↔ API层完全断裂**: `ml_services/`、`data_layer/`、`scripts/` 中的Python代码与Node.js后端**没有任何调用关系**。`ensemble_model.py` 定义了模型但无推理服务暴露。

2. **Desktop AI对话是100%模拟**: `desktop-app/scripts/api.js` 的 `simulateAIResponse()` 返回硬编码文本，未接入任何LLM或ML模型。

3. **策略回测前后端脱节**: `desktop-app/scripts/strategy.js` 在前端模拟MA/MACD回测，`scripts/phase4_reinforcement_learning.py` 有RL骨架但**注释为"占位实现"**，两者无连接。

4. **Docker Compose不可运行**: `docker-compose.research.yml` 引用了 `./infrastructure/mlflow`、`./services/ml_training_service` 等不存在的目录。

5. **数据库层未实际使用**: `data_layer/database_manager.py` 连接TimescaleDB/MongoDB/Redis，但Node.js后端仍使用LowDB(JSON文件)。

### 2.3 真正跑通的链路

- ✅ Web前端 → Node.js → AKShare/BaoStock 获取实时行情
- ✅ 管理后台 → Node.js → LowDB CRUD
- ✅ Desktop基本UI框架 + 设置系统
- ❌ 其他所有"高级功能"均未真正集成

---

## 三、创新性分析 (Innovation Assessment)

### 3.1 已声明的创新点

| 声明 | 实际状态 | 评价 |
|:-----|:------:|:-----|
| HMM市场状态识别 | 有代码骨架 | 仅fit+predict，无在线更新、无状态持久化 |
| Attention-LSTM + Transformer集成 | 有模型定义 | 无预训练模型、无推理端点、无A/B测试 |
| Monte Carlo Dropout不确定性量化 | 有函数 | 未接入任何服务，从未被调用 |
| Meta-learner自适应权重 | 有代码 | 权重学习逻辑正确但从未在真实数据上验证 |
| MLflow实验跟踪 | 有集成代码 | MLflow服务未搭建，无法实际运行 |
| Feast Feature Store | 仅在docker-compose中声明 | 无任何代码实现 |

### 3.2 缺失的关键创新

- **无因子模型(Factor Model)** — 量化核心：Fama-French、Barra风险因子
- **无风险度量** — 缺VaR/CVaR/Expected Shortfall
- **无订单簿/微观结构分析**
- **无事件驱动回测** — 仅有简单向量化回测
- **无实时流处理** — 行情数据全部轮询，无WebSocket/SSE

---

## 四、具体优化建议 (共8项，附真实代码)

### 优化1: 构建真实的ML推理服务，打通Desktop→ML链路
### 优化2: 实现真正的因子模型和风险引擎
### 优化3: 构建事件驱动回测引擎替代前端模拟
### 优化4: 添加WebSocket实时行情推送
### 优化5: 修复Electron安全问题
### 优化6: 统一数据层，替换LowDB
### 优化7: 添加量化风控模块(VaR/CVaR)
### 优化8: 构建真实的AI对话服务

**详细代码实现见项目中对应的新增文件。**

---

## 五、优先级路线图

```
Phase 1 (Week 1-2): 修复安全问题 + 打通ML推理服务
Phase 2 (Week 3-4): 因子模型 + 风险引擎 + 事件驱动回测
Phase 3 (Week 5-6): WebSocket实时推送 + 统一数据层
Phase 4 (Week 7-8): AI对话真实接入 + 端到端测试
```
