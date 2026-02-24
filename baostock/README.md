# BaoStock API Service - 完整版

基于 [BaoStock](http://baostock.com) 的股票数据 HTTP API 服务，使用 FastAPI 框架构建。

**包含 BaoStock 所有可用接口！**

## 特点

- ✅ 无需注册，免费使用 BaoStock 数据
- ✅ **包含所有 BaoStock 接口**（30+个接口）
- ✅ 提供 A 股股票、指数的历史 K 线数据
- ✅ 提供完整的季频财务数据（6大类）
- ✅ 提供宏观经济数据
- ✅ 提供成分股数据（上证50、沪深300、中证500）
- ✅ RESTful API 设计，自动生成 Swagger 文档
- ✅ 内置数据缓存机制（5分钟缓存）

## 环境要求

- Python >= 3.8
- pip >= 21.0

## 快速开始

### 1. 安装依赖

```bash
cd baostock
pip install -r requirements.txt
```

**依赖包说明：**
| 包名 | 版本 | 说明 |
|------|------|------|
| baostock | >=0.8.8 | 核心金融数据接口库 |
| fastapi | >=0.104.0 | Web 框架 |
| uvicorn | >=0.24.0 | ASGI 服务器 |
| pydantic | >=2.5.0 | 数据验证 |
| pandas | >=2.0.0 | 数据处理 |
| python-multipart | >=0.0.6 | 表单解析 |

### 2. 启动服务

```bash
# 方式一：使用启动脚本（推荐）
python start.py

# 方式二：直接启动
uvicorn app:app --host 0.0.0.0 --port 8001 --reload

# 方式三：使用启动脚本文件
# Windows
start-baostock.bat

# Linux/Mac
./start-baostock.sh
```

服务启动后访问：
- API 文档：http://localhost:8001/docs
- 备用文档：http://localhost:8001/redoc
- 健康检查：http://localhost:8001/

## 📚 完整 API 列表

### 1. 基础数据接口

| 接口 | 方法 | 描述 | 参数 |
|------|------|------|------|
| `/api/stock/list` | GET | 获取A股股票列表（支持行业筛选、分页） | `page`, `page_size`, `industry` |
| `/api/stock/basic/{code}` | GET | 获取证券基本资料（IPO日期、类型、状态等） | `code` - 股票代码 |
| `/api/stock/industry` | GET | 获取行业分类数据 | 无 |

**使用示例：**
```bash
# 获取第一页股票（每页20条）
curl "http://localhost:8001/api/stock/list?page=1&page_size=20"

# 按行业筛选
curl "http://localhost:8001/api/stock/list?industry=银行"

# 获取证券基本资料
curl "http://localhost:8001/api/stock/basic/sh.600000"
```

### 2. K线数据接口

| 接口 | 方法 | 描述 | 参数 |
|------|------|------|------|
| `/api/kline/stock/{code}` | GET | 获取股票历史K线数据 | `code`, `start_date`, `end_date`, `frequency`, `adjustflag` |
| `/api/kline/index/{code}` | GET | 获取指数K线数据 | `code`, `start_date`, `end_date`, `frequency` |
| `/api/kline/trade-dates` | GET | 获取交易日历 | `start_date`, `end_date` |
| `/api/kline/query` | GET | 通用K线查询接口 | 同上 |

**K线频率参数（frequency）：**
| 参数值 | 说明 |
|--------|------|
| `d` | 日K线（默认） |
| `w` | 周K线 |
| `m` | 月K线 |
| `y` | 年K线 |
| `5` | 5分钟K线 |
| `15` | 15分钟K线 |
| `30` | 30分钟K线 |
| `60` | 60分钟K线 |

**复权标志（adjustflag）：**
| 参数值 | 说明 |
|--------|------|
| `1` | 后复权 |
| `2` | 前复权（默认） |
| `3` | 不复权 |

**使用示例：**
```bash
# 获取浦发银行日K线（不复权）
curl "http://localhost:8001/api/kline/stock/sh.600000?start_date=2023-01-01&end_date=2023-12-31"

# 获取前复权周K线
curl "http://localhost:8001/api/kline/stock/sh.600000?frequency=w&adjustflag=2"

# 获取5分钟K线
curl "http://localhost:8001/api/kline/stock/sh.600000?frequency=5"

# 获取指数K线（上证指数）
curl "http://localhost:8001/api/kline/index/sh.000001?start_date=2023-01-01"

# 获取交易日历
curl "http://localhost:8001/api/kline/trade-dates?start_date=2023-01-01&end_date=2023-12-31"
```

### 3. 季频财务数据接口 (2007年至今)

| 接口 | 方法 | 描述 | 参数 |
|------|------|------|------|
| `/api/finance/profit/{code}` | GET | **盈利能力** - ROE、净利率、毛利率、净利润等 | `code`, `year`, `quarter` |
| `/api/finance/operation/{code}` | GET | **营运能力** - 应收账款周转率、存货周转率等 | `code`, `year`, `quarter` |
| `/api/finance/growth/{code}` | GET | **成长能力** - 净资产/资产/利润同比增长率 | `code`, `year`, `quarter` |
| `/api/finance/balance/{code}` | GET | **偿债能力** - 流动比率、速动比率、资产负债率等 | `code`, `year`, `quarter` |
| `/api/finance/cash-flow/{code}` | GET | **现金流量** - 现金流各项指标 | `code`, `year`, `quarter` |
| `/api/finance/dupont/{code}` | GET | **杜邦指数** - ROE分解指标 | `code`, `year`, `quarter` |

**参数说明：**
- `year` - 年份，如：2023（可选，默认最新）
- `quarter` - 季度，1-4（可选，默认最新）

**使用示例：**
```bash
# 获取盈利能力数据（最新季度）
curl "http://localhost:8001/api/finance/profit/sh.600000"

# 获取指定年份季度数据
curl "http://localhost:8001/api/finance/profit/sh.600000?year=2023&quarter=3"

# 获取成长能力数据
curl "http://localhost:8001/api/finance/growth/sh.600000"

# 获取偿债能力数据
curl "http://localhost:8001/api/finance/balance/sh.600000"
```

### 4. 宏观经济数据接口

| 接口 | 方法 | 描述 | 参数 |
|------|------|------|------|
| `/api/macro/deposit-rate` | GET | 存款利率 | `start_date`, `end_date` |
| `/api/macro/loan-rate` | GET | 贷款利率 | `start_date`, `end_date` |
| `/api/macro/required-reserve-ratio` | GET | 存款准备金率 | `start_date`, `end_date` |
| `/api/macro/money-supply` | GET | 货币供应量（同比） | `start_date`, `end_date` |
| `/api/macro/money-supply-month` | GET | 货币供应量（月度） | `start_date`, `end_date` |

**使用示例：**
```bash
# 获取存款利率
curl "http://localhost:8001/api/macro/deposit-rate?start_date=2023-01-01&end_date=2023-12-31"

# 获取货币供应量
curl "http://localhost:8001/api/macro/money-supply?start_date=2023-01-01&end_date=2023-12-31"
```

### 5. 成分股接口

| 接口 | 方法 | 描述 | 参数 |
|------|------|------|------|
| `/api/constituent/sz50` | GET | 上证50成分股列表 | `date`（可选） |
| `/api/constituent/hs300` | GET | 沪深300成分股列表 | `date`（可选） |
| `/api/constituent/zz500` | GET | 中证500成分股列表 | `date`（可选） |

**使用示例：**
```bash
# 获取沪深300成分股
curl "http://localhost:8001/api/constituent/hs300"

# 获取指定日期的上证50成分股
curl "http://localhost:8001/api/constituent/sz50?date=2023-12-31"
```

### 6. 其他数据接口

| 接口 | 方法 | 描述 | 参数 |
|------|------|------|------|
| `/api/other/adjust-factor/{code}` | GET | 复权因子数据 | `code`, `start_date`, `end_date` |
| `/api/other/dividend/{code}` | GET | 除权除息信息 (1990年至今) | `code`, `start_date`, `end_date` |
| `/api/other/performance-express/{code}` | GET | 季频业绩快报 (2006年至今) | `code`, `start_date`, `end_date` |
| `/api/other/forecast/{code}` | GET | 季频业绩预告 (2006年至今) | `code`, `start_date`, `end_date` |

### 7. 指数列表

| 接口 | 方法 | 描述 |
|------|------|------|
| `/api/index/list` | GET | 获取常见指数列表（上证指数、沪深300等） |

**使用示例：**
```bash
curl "http://localhost:8001/api/index/list"
```

## 股票代码格式

BaoStock 使用统一的代码格式：`交易所.代码`

| 交易所 | 前缀 | 示例 |
|--------|------|------|
| 上海证券交易所 | `sh.` | `sh.600000` (浦发银行) |
| 深圳证券交易所 | `sz.` | `sz.000001` (平安银行) |

**常见指数代码：**
- `sh.000001` - 上证指数
- `sh.000300` - 沪深300
- `sh.000016` - 上证50
- `sh.000905` - 中证500
- `sz.399001` - 深证成指
- `sz.399006` - 创业板指

## 财务数据字段说明

### 盈利能力 (profit)

| 字段 | 说明 |
|------|------|
| `roeAvg` | 净资产收益率(平均) |
| `npMargin` | 销售净利率 |
| `gpMargin` | 销售毛利率 |
| `netProfit` | 净利润 |
| `epsTTM` | 每股收益 |
| `mbRevenue` | 主营营业收入 |

### 营运能力 (operation)

| 字段 | 说明 |
|------|------|
| `NRTurnRatio` | 应收账款周转率 |
| `NRTurnDays` | 应收账款周转天数 |
| `INVTurnRatio` | 存货周转率 |
| `AssetTurnRatio` | 总资产周转率 |

### 成长能力 (growth)

| 字段 | 说明 |
|------|------|
| `YOYEquity` | 净资产同比增长率 |
| `YOYAsset` | 总资产同比增长率 |
| `YOYOPI` | 营业收入同比增长率 |
| `YOYNetProfit` | 净利润同比增长率 |

### 偿债能力 (balance)

| 字段 | 说明 |
|------|------|
| `currentRatio` | 流动比率 |
| `quickRatio` | 速动比率 |
| `liabilityToAsset` | 资产负债率 |

## Python 调用示例

```python
import requests

# 获取股票K线数据
params = {
    "start_date": "2023-01-01",
    "end_date": "2023-12-31",
    "frequency": "d",  # 日K线
    "adjustflag": "2"  # 前复权
}
response = requests.get("http://localhost:8001/api/kline/stock/sh.600000", params=params)
data = response.json()
print(data)

# 获取财务数据 - 成长能力
response = requests.get("http://localhost:8001/api/finance/growth/sh.600000?year=2023&quarter=3")
growth_data = response.json()
print(growth_data)

# 获取成分股
response = requests.get("http://localhost:8001/api/constituent/hs300")
hs300 = response.json()
print(f"沪深300成分股数量: {hs300['data']['count']}")
```

## 返回数据结构

### 成功响应

```json
{
    "success": true,
    "message": "",
    "data": {
        // 具体数据内容
    }
}
```

### 错误响应

```json
{
    "success": false,
    "message": "错误信息",
    "data": null
}
```

## 技术栈

- Python 3.8+
- FastAPI - Web框架
- BaoStock - 金融数据接口
- Pandas - 数据处理
- Uvicorn - ASGI服务器

## 数据缓存说明

服务内置了内存缓存机制（默认5分钟TTL）：
- 股票列表数据会被缓存，减少重复请求
- K线数据在一定时间内会复用缓存结果
- 缓存自动过期，保证数据新鲜度

## 注意事项

1. **无需注册**：BaoStock 无需账号即可使用
2. **请求频率**：建议合理控制请求频率，避免对服务器造成压力
3. **数据更新**：财务数据按季度更新，行情数据为日频
4. **仅供学习**：数据仅供学习和研究使用

## 许可证

本项目仅供学习研究使用，数据来源于 BaoStock，请遵守相关使用条款。

## BaoStock 官方资源

- 官网：http://www.baostock.com
- Python API文档：http://baostock.com/baostock/index.php/Python_API文档
