/**
 * API接口模块 - 统一API调用入口
 * 集成多个AI提供商：豆包、OpenAI、通义千问、文心一言
 * 集成ML推理服务：预测、分析、风控
 */

// API配置
const API_CONFIG = {
  baseURL: 'http://localhost:3001/api',
  mlURL: 'http://localhost:3001/api/ml',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
};

// ML服务状态缓存
let _mlServiceOnline = null;
let _mlCheckTime = 0;

// 获取API客户端实例
function getClient() {
  return typeof getAPIClient === 'function' ? getAPIClient() : null;
}

// 检查ML推理服务是否在线
async function isMLServiceOnline() {
  if (_mlServiceOnline !== null && Date.now() - _mlCheckTime < 30000) {
    return _mlServiceOnline;
  }
  try {
    const resp = await fetch(`${API_CONFIG.mlURL}/health`, { signal: AbortSignal.timeout(3000) });
    const data = await resp.json();
    _mlServiceOnline = data.status !== 'offline';
  } catch {
    _mlServiceOnline = false;
  }
  _mlCheckTime = Date.now();
  return _mlServiceOnline;
}

// 调用AI API（主入口函数）
async function callAIAPI(message, options = {}) {
  try {
    // --- 优先级 1: 如果消息明确涉及股票分析/预测，调用ML推理服务 ---
    const mlResult = await tryMLAnalysis(message);
    if (mlResult) {
      return mlResult;
    }

    // --- 获取当前选中的模型 ---
    const selectedModel = (typeof AppState !== 'undefined' && AppState.selectedModel)
      ? AppState.selectedModel
      : (typeof apiConfig !== 'undefined' ? apiConfig.getSelectedModel() : 'gemini-2.5-flash-search');

    // --- 优先级 2: 通过后端 /api/chat 调用AI (hiapi.online) ---
    try {
      const chatHistory = getConversationContext();
      const resp = await fetch(`${API_CONFIG.baseURL}/chat`, {
        method: 'POST',
        headers: API_CONFIG.headers,
        body: JSON.stringify({ message, history: chatHistory, model: selectedModel }),
        signal: AbortSignal.timeout(60000)
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      if (data.success && data.content) {
        console.log('✅ 后端AI响应成功, model:', data.model);
        return data.content;
      }
    } catch (chatErr) {
      console.warn('后端AI聊天失败，尝试AI提供商:', chatErr.message);
    }

    // --- 优先级 3: 使用已配置的AI提供商（豆包/OpenAI/通义千问等） ---
    const client = getClient();
    if (client && typeof apiConfig !== 'undefined' && (apiConfig.isValid() || apiConfig.currentProvider === 'mock')) {
      console.log('使用AI提供商:', apiConfig.currentProvider, '模型:', selectedModel);
      const messages = options.history || [];
      messages.push({ role: 'user', content: message });
      const response = await client.sendChatRequest(messages, { ...options, model: selectedModel });
      return response.content;
    }

    // --- 优先级 4: 降级到本地智能响应 ---
    console.log('AI提供商未配置，使用本地智能响应');
    return generateLocalResponse(message);

  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// 尝试ML推理服务分析（返回null表示不适用）
async function tryMLAnalysis(message) {
  // 提取股票代码
  const symbolMatch = message.match(/(\d{6})/);
  const hasAnalysisIntent = /分析|技术|指标|预测|诊断|评估|K线|走势|趋势|风险/.test(message);
  const hasPredictIntent = /预测|预判|明天|未来|目标价|涨跌/.test(message);

  if (!symbolMatch && !hasAnalysisIntent) return null;

  const symbol = symbolMatch ? symbolMatch[1] : null;
  if (!symbol) return null;

  // 检查是否通过 Electron preload 桥接
  const useElectron = typeof window !== 'undefined' && window.electronAPI;

  try {
    let analysisText = '';

    // --- 综合分析 ---
    if (hasAnalysisIntent) {
      let result;
      if (useElectron) {
        result = await window.electronAPI.analyzeStock(symbol, 'comprehensive');
      } else {
        const resp = await fetch(`${API_CONFIG.mlURL}/analyze`, {
          method: 'POST',
          headers: API_CONFIG.headers,
          body: JSON.stringify({ symbol, analysis_type: 'comprehensive' }),
          signal: AbortSignal.timeout(API_CONFIG.timeout)
        });
        result = await resp.json();
      }

      if (result && result.success) {
        analysisText += formatAnalysisResult(symbol, result.results);
      }
    }

    // --- 价格预测 ---
    if (hasPredictIntent) {
      let result;
      if (useElectron) {
        result = await window.electronAPI.predictStock(symbol, 5);
      } else {
        const resp = await fetch(`${API_CONFIG.mlURL}/predict`, {
          method: 'POST',
          headers: API_CONFIG.headers,
          body: JSON.stringify({ symbol, horizon: 5, include_uncertainty: true }),
          signal: AbortSignal.timeout(API_CONFIG.timeout)
        });
        result = await resp.json();
      }

      if (result && result.success) {
        analysisText += formatPredictionResult(symbol, result);
      }
    }

    if (analysisText) {
      return analysisText;
    }
  } catch (err) {
    console.warn('ML分析服务调用失败，降级到本地响应:', err.message);
  }

  return null;
}

// 格式化分析结果为Markdown文本
function formatAnalysisResult(symbol, results) {
  let text = `**${symbol} 综合分析报告** (ML推理服务)\n\n`;

  if (results.technical) {
    const t = results.technical;
    text += `**技术指标：**\n`;
    if (t.MACD) {
      text += `- MACD: ${t.MACD.macd} / 信号线: ${t.MACD.signal} → ${t.MACD.interpretation}\n`;
    }
    if (t.RSI_14) {
      text += `- RSI(14): ${t.RSI_14.value} → ${t.RSI_14.interpretation}\n`;
    }
    if (t.Bollinger) {
      text += `- 布林带: 上轨${t.Bollinger.upper} / 中轨${t.Bollinger.middle} / 下轨${t.Bollinger.lower}\n`;
    }
    if (t.ADX) text += `- ADX: ${t.ADX}\n`;
    if (t.SMA_20) text += `- SMA20: ${t.SMA_20} | SMA50: ${t.SMA_50 || 'N/A'}\n`;
    text += '\n';
  }

  if (results.risk) {
    const r = results.risk;
    text += `**风险指标：**\n`;
    text += `- VaR(95%): ${r.VaR_95}% | CVaR(95%): ${r.CVaR_95}%\n`;
    text += `- 夏普比率: ${r.sharpe_ratio} | Sortino: ${r.sortino_ratio}\n`;
    text += `- 最大回撤: ${r.max_drawdown}% | 年化波动率: ${r.annual_volatility}%\n`;
    if (r.interpretation) text += `- 评价: ${r.interpretation}\n`;
    text += '\n';
  }

  if (results.market_regime) {
    text += `**市场状态识别(HMM)：** ${results.market_regime.label}\n\n`;
  }

  text += `> 数据来源: ML推理服务 (Ensemble: AttentionLSTM + Transformer)\n`;
  text += `> ⚠️ 以上分析仅供参考，不构成投资建议\n\n`;
  return text;
}

// 格式化预测结果
function formatPredictionResult(symbol, result) {
  let text = `**${symbol} 价格预测** (${result.model_info?.uncertainty_method || 'Ensemble'})\n\n`;
  text += `| 目标日期 | 预测价格 | 置信区间 | 不确定性 |\n`;
  text += `|:------:|:------:|:------:|:------:|\n`;

  if (result.predictions) {
    result.predictions.forEach(p => {
      text += `| ${p.target_date} | ¥${p.predicted_price} | ¥${p.confidence_lower}~¥${p.confidence_upper} | ${p.uncertainty} |\n`;
    });
  }

  text += `\n> 模型: ${result.model_info?.model_type || 'Unknown'} | 版本: ${result.model_info?.version || 'N/A'}\n`;
  text += `> ⚠️ 预测结果仅供参考，市场有风险\n\n`;
  return text;
}

// 本地智能响应（无需外部服务）
function generateLocalResponse(message) {
  if (message.includes('股票') || message.includes('行情') || message.includes('涨跌')) {
    return `我可以帮您分析股票。请提供**股票代码**（如 600519），我将调用ML推理服务进行：\n\n` +
      `- 📊 **技术分析** — MACD/RSI/布林带/ADX等指标\n` +
      `- � **价格预测** — Ensemble模型 + 不确定性量化\n` +
      `- ⚠️ **风险评估** — VaR/CVaR/最大回撤/夏普比率\n` +
      `- 🏷️ **市场状态** — HMM隐马尔可夫模型识别\n\n` +
      `例如输入: "分析 600519" 或 "预测 000001 未来走势"`;
  }

  if (message.includes('技术分析') || message.includes('指标') || message.includes('K线')) {
    return `请提供股票代码，我将调用ML推理服务为您生成基于真实数据的技术分析：\n\n` +
      `- MACD（趋势跟踪）\n- RSI（超买超卖）\n- 布林带（波动通道）\n- ADX（趋势强度）\n- ATR（波动率）\n\n` +
      `例如: "技术分析 600519"`;
  }

  if (message.includes('回测') || message.includes('策略')) {
    return `您可以在**策略回测**页面进行策略回测，支持以下策略：\n\n` +
      `- **均线交叉(MA)** — 金叉买入、死叉卖出\n` +
      `- **MACD** — 柱状线翻正/翻负\n` +
      `- **RSI均值回归** — 超卖买入、超买卖出\n` +
      `- **布林带** — 触及下轨买入、上轨卖出\n\n` +
      `回测引擎包含真实的A股成本模型（万三佣金+千一印花税+滑点）。\n` +
      `请切换到「策略回测」标签页开始使用。`;
  }

  if (message.includes('建议') || message.includes('买入') || message.includes('卖出')) {
    return `⚠️ **重要提示：** 以下内容仅供参考，不构成投资建议。\n\n` +
      `要获得基于数据的分析，请提供股票代码，我将为您：\n\n` +
      `1. 运行**技术面分析**（MACD/RSI/布林带）\n` +
      `2. 计算**风险指标**（VaR/夏普比率/最大回撤）\n` +
      `3. 识别**市场状态**（牛市/熊市/震荡市）\n` +
      `4. 生成**价格预测**（含置信区间）\n\n` +
      `例如: "分析 600519 给出建议"`;
  }

  return `您好！我是In Fortune AI智能助手，集成了专业的量化分析引擎。\n\n` +
    `**我的能力：**\n` +
    `- 📊 **股票分析** — 输入股票代码获取ML驱动的技术/风险分析\n` +
    `- 🔮 **价格预测** — Ensemble(LSTM+Transformer)模型预测\n` +
    `- 📈 **策略回测** — 事件驱动回测引擎，精确成本模型\n` +
    `- ⚡ **实时行情** — WebSocket推送大盘/个股实时数据\n` +
    `- �️ **风险管理** — VaR/CVaR/Fama-French三因子分析\n\n` +
    `**快速开始：** 输入 "分析 600519" 或 "预测 000001"\n\n` +
    `> 提示: 请在设置中配置AI提供商(豆包/OpenAI等)以启用自然语言对话`;
}

// 获取对话上下文
function getConversationContext() {
  const chat = AppState.chatHistory.find(c => c.id === AppState.currentChatId);
  if (!chat) return [];
  
  // 返回最近5条消息作为上下文
  return chat.messages.slice(-5).map(msg => ({
    role: msg.role,
    content: msg.content
  }));
}

// 获取股票实时数据
async function getStockData(symbol) {
  try {
    const response = await fetch(`${API_CONFIG.baseURL}/stocks/${symbol}`);
    if (!response.ok) throw new Error('Failed to fetch stock data');
    return await response.json();
  } catch (error) {
    console.error('Error fetching stock data:', error);
    return null;
  }
}

// 获取技术指标
async function getTechnicalIndicators(symbol) {
  try {
    const response = await fetch(`${API_CONFIG.baseURL}/indicators/${symbol}`);
    if (!response.ok) throw new Error('Failed to fetch indicators');
    return await response.json();
  } catch (error) {
    console.error('Error fetching indicators:', error);
    return null;
  }
}

// 获取市场概览数据
async function getMarketOverview() {
  try {
    const response = await fetch(`${API_CONFIG.baseURL}/market/overview`);
    if (!response.ok) throw new Error('Failed to fetch market data');
    return await response.json();
  } catch (error) {
    console.error('Error fetching market data:', error);
    return null;
  }
}

// 搜索股票
async function searchStock(query) {
  try {
    const response = await fetch(`${API_CONFIG.baseURL}/search?keyword=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error('Failed to search stock');
    return await response.json();
  } catch (error) {
    console.error('Error searching stock:', error);
    // 返回模拟搜索结果
    return {
      results: [
        { symbol: '600519', name: '贵州茅台', market: 'sh' },
        { symbol: '000858', name: '五粮液', market: 'sz' },
        { symbol: '600036', name: '招商银行', market: 'sh' }
      ]
    };
  }
}
