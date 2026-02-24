# AKShare Stock API - In Fortune AI完整版

基于 [AKShare](https://www.akshare.xyz/) 的股票数据 HTTP API 服务，提供多市场、多平台数据支持。

## 特点

- ✅ **多市场支持** - A股、港股、美股、指数、ETF
- ✅ **多平台数据源** - 东方财富、新浪财经、腾讯财经
- ✅ **自动容错** - 当主数据源失败时可切换备用源
- ✅ **RESTful API** - 自动生成 Swagger/ReDoc 文档
- ✅ **中文导航** - 接口名称和分类全部中文化

## 环境要求

- Python >= 3.8
- pip >= 21.0

## 快速开始

### 1. 安装依赖

```bash
cd akshare
pip install -r requirements.txt
```

**依赖包说明：**
| 包名 | 版本 | 说明 |
|------|------|------|
| akshare | >=1.11.0 | 核心财经数据接口库 |
| aktools | >=0.0.83 | AKShare 工具库 |
| fastapi | >=0.104.0 | Web 框架 |
| uvicorn | >=0.24.0 | ASGI 服务器 |
| pydantic | >=2.5.0 | 数据验证 |
| python-multipart | >=0.0.6 | 表单解析 |

### 2. 启动服务

```bash
# 方式一：使用启动脚本（推荐）
python start.py

# 方式二：直接启动
uvicorn app:app --host 0.0.0.0 --port 8000 --reload

# 方式三：使用启动脚本文件
# Windows
start-akshare.bat

# Linux/Mac
./start-akshare.sh
```

服务启动后访问：
- API 文档：http://localhost:8000/docs
- ReDoc 文档：http://localhost:8000/redoc
- 健康检查：http://localhost:8000/

## 📚 完整 API 列表

### 🇨🇳 A股数据接口

| 接口 | 方法 | 描述 | 数据源 |
|------|------|------|--------|
| `/api/a/stock/realtime/{symbol}` | GET | A股实时行情 | 东财/新浪 |
| `/api/a/stock/history/{symbol}` | GET | A股历史K线 | 东财/新浪 |
| `/api/a/stock/list` | GET | A股股票列表 | 东财/新浪 |
| `/api/a/stock/search` | GET | A股股票搜索 | 东财/新浪 |

**参数说明：**
- `symbol` - 6位股票代码，如：000001（平安银行）
- `source` - 数据源：`eastmoney`(默认) / `sina`
- `period` - 周期：`daily`(默认) / `weekly` / `monthly`
- `start_date` - 开始日期，格式：YYYYMMDD
- `end_date` - 结束日期，格式：YYYYMMDD

**使用示例：**
```bash
# 获取平安银行实时行情（东方财富）
curl "http://localhost:8000/api/a/stock/realtime/000001?source=eastmoney"

# 获取实时行情（新浪财经）
curl "http://localhost:8000/api/a/stock/realtime/000001?source=sina"

# 获取历史数据
curl "http://localhost:8000/api/a/stock/history/000001?period=daily&start_date=20240101"

# 搜索股票
curl "http://localhost:8000/api/a/stock/search?keyword=平安"
```

### 🇭🇰 港股数据接口

| 接口 | 方法 | 描述 |
|------|------|------|
| `/api/hk/stock/realtime/{symbol}` | GET | 港股实时行情 |
| `/api/hk/stock/history/{symbol}` | GET | 港股历史K线 |
| `/api/hk/stock/list` | GET | 港股股票列表 |

**使用示例：**
```bash
# 获取腾讯控股实时行情
curl "http://localhost:8000/api/hk/stock/realtime/00700"

# 获取阿里巴巴历史数据
curl "http://localhost:8000/api/hk/stock/history/09988?period=daily"
```

### 🇺🇸 美股数据接口

| 接口 | 方法 | 描述 |
|------|------|------|
| `/api/us/stock/realtime/{symbol}` | GET | 美股实时行情 |
| `/api/us/stock/history/{symbol}` | GET | 美股历史K线 |
| `/api/us/stock/list` | GET | 美股股票列表 |

**使用示例：**
```bash
# 获取苹果股票实时行情
curl "http://localhost:8000/api/us/stock/realtime/AAPL"

# 获取特斯拉历史数据
curl "http://localhost:8000/api/us/stock/history/TSLA?period=daily"
```

### 📈 指数数据接口

| 接口 | 方法 | 描述 |
|------|------|------|
| `/api/index/realtime` | GET | 指数实时行情（全部） |
| `/api/index/history/{symbol}` | GET | 指数历史K线 |

**常见指数代码：**
- `000001` - 上证指数
- `000300` - 沪深300
- `000016` - 上证50
- `000905` - 中证500
- `399001` - 深证成指
- `399006` - 创业板指

**使用示例：**
```bash
# 获取全部指数行情
curl "http://localhost:8000/api/index/realtime"

# 获取上证指数历史数据
curl "http://localhost:8000/api/index/history/000001?period=daily"
```

### 💼 ETF数据接口

| 接口 | 方法 | 描述 |
|------|------|------|
| `/api/etf/realtime` | GET | ETF实时行情（全部） |
| `/api/etf/history/{symbol}` | GET | ETF历史K线 |
| `/api/etf/list` | GET | ETF基金列表 |

**常见ETF代码：**
- `510300` - 沪深300ETF
- `510050` - 上证50ETF
- `159915` - 创业板ETF
- `512000` - 券商ETF

**使用示例：**
```bash
# 获取全部ETF行情
curl "http://localhost:8000/api/etf/realtime"

# 获取沪深300ETF历史数据
curl "http://localhost:8000/api/etf/history/510300?period=daily"
```

## 🔌 数据源说明

### 东方财富（eastmoney）- 默认

**优点：**
- 数据最全，字段丰富
- 包含各种财务指标
- 无需处理复权（接口自动处理）

**缺点：**
- 有15分钟延迟
- 频繁请求可能被封IP

### 新浪财经（sina）

**优点：**
- 速度快，稳定性好
- 实时性较好
- 不容易被封

**缺点：**
- 数据字段较少
- 需要手动处理复权

## 🔧 数据源切换示例

当东方财富接口受限时，切换到新浪财经：

```python
import requests

# 尝试东方财富
try:
    response = requests.get("http://localhost:8000/api/a/stock/realtime/000001?source=eastmoney")
    data = response.json()
    if not data['success']:
        raise Exception("东财接口失败")
except:
    # 切换到新浪财经
    response = requests.get("http://localhost:8000/api/a/stock/realtime/000001?source=sina")
    data = response.json()

print(data)
```

## 📊 返回数据结构

### 实时行情返回字段（东方财富）

```json
{
    "success": true,
    "data": {
        "代码": "000001",
        "名称": "平安银行",
        "最新价": 10.58,
        "涨跌幅": 1.25,
        "涨跌额": 0.13,
        "成交量": 1258320,
        "成交额": 1331202560,
        "振幅": 2.01,
        "最高": 10.65,
        "最低": 10.44,
        "今开": 10.45,
        "昨收": 10.45,
        "量比": 1.25,
        "换手率": 0.65,
        "市盈率-动态": 4.85,
        "市净率": 0.58,
        "总市值": 205300000000,
        "流通市值": 205300000000
    },
    "source": "eastmoney",
    "updateTime": "2024-01-15 14:30:25"
}
```

### 历史数据返回字段

```json
{
    "success": true,
    "data": {
        "symbol": "000001",
        "period": "daily",
        "count": 100,
        "history": [
            {
                "日期": "2024-01-02",
                "开盘": 10.25,
                "收盘": 10.45,
                "最高": 10.58,
                "最低": 10.18,
                "成交量": 1258320,
                "成交额": 1331202560,
                "振幅": 3.85,
                "涨跌幅": 1.95,
                "涨跌额": 0.20,
                "换手率": 0.65
            }
        ]
    },
    "source": "eastmoney",
    "updateTime": "2024-01-15 14:30:25"
}
```

## 📝 参数说明

### 股票代码格式

| 市场 | 代码格式 | 示例 |
|------|----------|------|
| A股 | 6位数字 | `000001`（平安银行） |
| 港股 | 5位数字 | `00700`（腾讯控股） |
| 美股 | 大写字母 | `AAPL`（苹果公司） |
| 指数 | 6位数字 | `000001`（上证指数） |
| ETF | 6位数字 | `510300`（沪深300ETF） |

### 数据周期（period）

- `daily` - 日线（默认）
- `weekly` - 周线
- `monthly` - 月线

### 复权类型（adjust）

- `qfq` - 前复权（默认）
- `hfq` - 后复权
- `` - 不复权

## ⚠️ 注意事项

1. **请求频率限制**：建议每秒不超过 10 次请求
2. **数据延迟**：东方财富数据有15分钟延迟
3. **网络限制**：某些网络环境可能无法访问东方财富，可切换到新浪
4. **仅供学习**：数据仅供学习和研究使用

## 🔗 相关链接

- [AKShare 官方文档](https://www.akshare.xyz/)
- [AKShare GitHub](https://github.com/akfamily/akshare)
- [FastAPI 文档](https://fastapi.tiangolo.com/)

## 📜 许可证

MIT License - 仅供学习和研究使用
