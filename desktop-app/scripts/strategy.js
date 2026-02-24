/**
 * 策略回测模块
 * Strategy Backtest Module
 */

// 回测配置
let backtestConfig = {
  stock: '',
  startDate: '',
  endDate: '',
  initialCapital: 100000,
  commissionRate: 0.0003,
  strategyType: 'ma',
  params: {}
};

// 回测结果
let backtestResult = null;

// 初始化策略回测功能
function initStrategyBacktest() {
  console.log('初始化策略回测功能');
  
  // 设置默认日期（最近一年）
  const endDate = new Date();
  const startDate = new Date();
  startDate.setFullYear(endDate.getFullYear() - 1);
  
  document.getElementById('start-date').valueAsDate = startDate;
  document.getElementById('end-date').valueAsDate = endDate;
  
  // 绑定事件
  setupBacktestEvents();
}

// 设置事件监听
function setupBacktestEvents() {
  // 开始回测按钮
  const runBtn = document.getElementById('runBacktestBtn');
  if (runBtn) {
    runBtn.addEventListener('click', runBacktest);
  }
  
  // 重置按钮
  const resetBtn = document.getElementById('resetBacktestBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', resetBacktest);
  }
  
  // 策略类型改变
  const strategySelect = document.getElementById('strategy-type');
  if (strategySelect) {
    strategySelect.addEventListener('change', updateStrategyParams);
  }
}

// 更新策略参数表单
function updateStrategyParams() {
  const strategyType = document.getElementById('strategy-type').value;
  const paramsContainer = document.getElementById('strategyParams');
  
  let paramsHTML = '';
  
  switch (strategyType) {
    case 'ma':
      paramsHTML = `
        <div class="form-group">
          <label>短期均线</label>
          <input type="number" id="param-short" value="5" class="form-input">
        </div>
        <div class="form-group">
          <label>长期均线</label>
          <input type="number" id="param-long" value="20" class="form-input">
        </div>
      `;
      break;
      
    case 'macd':
      paramsHTML = `
        <div class="form-group">
          <label>快线周期</label>
          <input type="number" id="param-fast" value="12" class="form-input">
        </div>
        <div class="form-group">
          <label>慢线周期</label>
          <input type="number" id="param-slow" value="26" class="form-input">
        </div>
        <div class="form-group">
          <label>信号线周期</label>
          <input type="number" id="param-signal" value="9" class="form-input">
        </div>
      `;
      break;
      
    case 'kdj':
      paramsHTML = `
        <div class="form-group">
          <label>K值周期</label>
          <input type="number" id="param-k" value="9" class="form-input">
        </div>
        <div class="form-group">
          <label>超买线</label>
          <input type="number" id="param-overbought" value="80" class="form-input">
        </div>
        <div class="form-group">
          <label>超卖线</label>
          <input type="number" id="param-oversold" value="20" class="form-input">
        </div>
      `;
      break;
      
    case 'rsi':
      paramsHTML = `
        <div class="form-group">
          <label>RSI周期</label>
          <input type="number" id="param-period" value="14" class="form-input">
        </div>
        <div class="form-group">
          <label>超买线</label>
          <input type="number" id="param-overbought" value="70" class="form-input">
        </div>
        <div class="form-group">
          <label>超卖线</label>
          <input type="number" id="param-oversold" value="30" class="form-input">
        </div>
      `;
      break;
      
    case 'bollinger':
      paramsHTML = `
        <div class="form-group">
          <label>均线周期</label>
          <input type="number" id="param-period" value="20" class="form-input">
        </div>
        <div class="form-group">
          <label>标准差倍数</label>
          <input type="number" id="param-std" value="2" step="0.1" class="form-input">
        </div>
      `;
      break;
  }
  
  paramsContainer.innerHTML = paramsHTML;
}

// 开始回测
async function runBacktest() {
  console.log('开始执行回测');
  
  // 获取配置
  backtestConfig.stock = document.getElementById('backtest-stock').value.trim();
  backtestConfig.startDate = document.getElementById('start-date').value;
  backtestConfig.endDate = document.getElementById('end-date').value;
  backtestConfig.initialCapital = parseFloat(document.getElementById('initial-capital').value);
  backtestConfig.commissionRate = parseFloat(document.getElementById('commission-rate').value) / 100;
  backtestConfig.strategyType = document.getElementById('strategy-type').value;
  
  // 验证输入
  if (!backtestConfig.stock) {
    alert('请输入股票代码');
    return;
  }
  
  if (!backtestConfig.startDate || !backtestConfig.endDate) {
    alert('请选择回测日期范围');
    return;
  }
  
  // 获取策略参数
  backtestConfig.params = getStrategyParams(backtestConfig.strategyType);
  
  // 显示加载状态
  showBacktestLoading();
  
  try {
    // --- 调用真实回测 API ---
    const apiResult = await callBacktestAPI(backtestConfig);
    
    if (apiResult && apiResult.success) {
      // 转换 API 结果为内部格式
      backtestResult = convertAPIResult(apiResult.data, backtestConfig);
      displayBacktestResults(backtestResult);
    } else {
      // API 失败时降级到本地回测
      console.warn('回测API调用失败，降级到本地回测:', apiResult?.message);
      await runLocalBacktest();
    }
    
  } catch (error) {
    console.error('回测API调用异常，降级到本地回测:', error.message);
    await runLocalBacktest();
  }
}

// 调用回测API
async function callBacktestAPI(config) {
  const payload = {
    symbol: config.stock,
    strategy: config.strategyType,
    startDate: config.startDate,
    endDate: config.endDate,
    initialCapital: config.initialCapital,
    params: config.params
  };

  // 优先使用 Electron IPC 桥接
  if (typeof window !== 'undefined' && window.electronAPI) {
    return await window.electronAPI.runBacktest(payload);
  }

  // HTTP 回退
  const resp = await fetch('http://localhost:3001/api/backtest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(60000)
  });
  return await resp.json();
}

// 转换API返回结果为内部显示格式
function convertAPIResult(apiData, config) {
  return {
    config: config,
    trades: (apiData.trades_log || []).map(t => ({
      date: t.date,
      action: t.side === 'BUY' ? 'buy' : 'sell',
      price: t.price,
      shares: t.quantity,
      amount: t.price * t.quantity,
      commission: t.commission || 0,
      returnRate: t.pnl ? (t.pnl / (t.price * t.quantity) * 100) : 0
    })),
    equity: (apiData.equity_curve || []).map(p => ({
      date: p.date,
      value: p.value
    })),
    metrics: {
      totalReturn: apiData.returns?.total_return_pct || 0,
      annualReturn: apiData.returns?.annual_return_pct || 0,
      maxDrawdown: Math.abs(apiData.risk?.max_drawdown_pct || 0),
      sharpeRatio: apiData.risk?.sharpe_ratio || 0,
      winRate: 0, // API可扩展
      tradeCount: apiData.trading?.total_trades || 0
    }
  };
}

// 本地回测降级方案
async function runLocalBacktest() {
  try {
    const historyData = await generateMockHistoryData(
      backtestConfig.stock,
      backtestConfig.startDate,
      backtestConfig.endDate
    );
    backtestResult = executeBacktest(historyData, backtestConfig);
    displayBacktestResults(backtestResult);
  } catch (error) {
    console.error('本地回测也失败:', error);
    alert('回测执行失败: ' + error.message);
    hideBacktestLoading();
  }
}

// 获取策略参数
function getStrategyParams(strategyType) {
  const params = {};
  
  switch (strategyType) {
    case 'ma':
      params.short = parseInt(document.getElementById('param-short')?.value || 5);
      params.long = parseInt(document.getElementById('param-long')?.value || 20);
      break;
      
    case 'macd':
      params.fast = parseInt(document.getElementById('param-fast')?.value || 12);
      params.slow = parseInt(document.getElementById('param-slow')?.value || 26);
      params.signal = parseInt(document.getElementById('param-signal')?.value || 9);
      break;
      
    case 'kdj':
      params.k = parseInt(document.getElementById('param-k')?.value || 9);
      params.overbought = parseInt(document.getElementById('param-overbought')?.value || 80);
      params.oversold = parseInt(document.getElementById('param-oversold')?.value || 20);
      break;
      
    case 'rsi':
      params.period = parseInt(document.getElementById('param-period')?.value || 14);
      params.overbought = parseInt(document.getElementById('param-overbought')?.value || 70);
      params.oversold = parseInt(document.getElementById('param-oversold')?.value || 30);
      break;
      
    case 'bollinger':
      params.period = parseInt(document.getElementById('param-period')?.value || 20);
      params.std = parseFloat(document.getElementById('param-std')?.value || 2);
      break;
  }
  
  return params;
}

// 生成模拟历史数据
async function generateMockHistoryData(stock, startDate, endDate) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const data = [];
      const start = new Date(startDate);
      const end = new Date(endDate);
      const days = Math.floor((end - start) / (1000 * 60 * 60 * 24));
      
      let basePrice = 10 + Math.random() * 90;
      
      for (let i = 0; i <= days; i++) {
        const date = new Date(start);
        date.setDate(date.getDate() + i);
        
        // 跳过周末
        if (date.getDay() === 0 || date.getDay() === 6) continue;
        
        // 生成价格（随机游走）
        const change = (Math.random() - 0.48) * basePrice * 0.03;
        basePrice = Math.max(basePrice + change, 1);
        
        const open = basePrice * (1 + (Math.random() - 0.5) * 0.02);
        const close = basePrice;
        const high = Math.max(open, close) * (1 + Math.random() * 0.03);
        const low = Math.min(open, close) * (1 - Math.random() * 0.03);
        const volume = Math.floor(1000000 + Math.random() * 5000000);
        
        data.push({
          date: date.toISOString().split('T')[0],
          open: parseFloat(open.toFixed(2)),
          high: parseFloat(high.toFixed(2)),
          low: parseFloat(low.toFixed(2)),
          close: parseFloat(close.toFixed(2)),
          volume: volume
        });
      }
      
      resolve(data);
    }, 500);
  });
}

// 执行回测
function executeBacktest(historyData, config) {
  console.log('执行回测，数据条数:', historyData.length);
  
  const result = {
    config: config,
    trades: [],
    equity: [],
    metrics: {}
  };
  
  // 计算技术指标
  const indicators = calculateIndicators(historyData, config);
  
  // 模拟交易
  let cash = config.initialCapital;
  let position = 0;
  let positionPrice = 0;
  
  historyData.forEach((bar, index) => {
    // 根据策略生成信号
    const signal = generateSignal(indicators, index, config);
    
    const equity = cash + position * bar.close;
    result.equity.push({
      date: bar.date,
      value: equity
    });
    
    if (signal === 'buy' && position === 0) {
      // 买入
      const commission = cash * config.commissionRate;
      const shares = Math.floor((cash - commission) / bar.close / 100) * 100;
      
      if (shares > 0) {
        position = shares;
        positionPrice = bar.close;
        const cost = shares * bar.close + commission;
        cash -= cost;
        
        result.trades.push({
          date: bar.date,
          action: 'buy',
          price: bar.close,
          shares: shares,
          amount: cost,
          commission: commission,
          returnRate: 0
        });
      }
    } else if (signal === 'sell' && position > 0) {
      // 卖出
      const revenue = position * bar.close;
      const commission = revenue * config.commissionRate;
      const profit = revenue - position * positionPrice;
      const returnRate = (profit / (position * positionPrice)) * 100;
      
      cash += revenue - commission;
      
      result.trades.push({
        date: bar.date,
        action: 'sell',
        price: bar.close,
        shares: position,
        amount: revenue,
        commission: commission,
        returnRate: returnRate
      });
      
      position = 0;
      positionPrice = 0;
    }
  });
  
  // 计算绩效指标
  result.metrics = calculateMetrics(result, config.initialCapital);
  
  return result;
}

// 计算技术指标
function calculateIndicators(data, config) {
  const closes = data.map(d => d.close);
  const indicators = {};
  
  if (config.strategyType === 'ma') {
    indicators.shortMA = calculateMA(closes, config.params.short);
    indicators.longMA = calculateMA(closes, config.params.long);
  }
  
  return indicators;
}

// 计算移动平均线
function calculateMA(data, period) {
  const ma = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      ma.push(null);
    } else {
      const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      ma.push(sum / period);
    }
  }
  return ma;
}

// 生成交易信号
function generateSignal(indicators, index, config) {
  if (config.strategyType === 'ma') {
    const shortMA = indicators.shortMA[index];
    const longMA = indicators.longMA[index];
    const prevShortMA = indicators.shortMA[index - 1];
    const prevLongMA = indicators.longMA[index - 1];
    
    if (shortMA && longMA && prevShortMA && prevLongMA) {
      // 金叉买入
      if (prevShortMA <= prevLongMA && shortMA > longMA) {
        return 'buy';
      }
      // 死叉卖出
      if (prevShortMA >= prevLongMA && shortMA < longMA) {
        return 'sell';
      }
    }
  }
  
  return 'hold';
}

// 计算绩效指标
function calculateMetrics(result, initialCapital) {
  const finalEquity = result.equity[result.equity.length - 1].value;
  const totalReturn = ((finalEquity - initialCapital) / initialCapital) * 100;
  
  // 计算年化收益率
  const days = result.equity.length;
  const years = days / 252; // 交易日
  const annualReturn = (Math.pow(finalEquity / initialCapital, 1 / years) - 1) * 100;
  
  // 计算最大回撤
  let maxDrawdown = 0;
  let peak = initialCapital;
  result.equity.forEach(point => {
    if (point.value > peak) peak = point.value;
    const drawdown = ((peak - point.value) / peak) * 100;
    if (drawdown > maxDrawdown) maxDrawdown = drawdown;
  });
  
  // 计算胜率
  const trades = result.trades.filter(t => t.action === 'sell');
  const winTrades = trades.filter(t => t.returnRate > 0).length;
  const winRate = trades.length > 0 ? (winTrades / trades.length) * 100 : 0;
  
  // 计算夏普比率（简化版）
  const returns = [];
  for (let i = 1; i < result.equity.length; i++) {
    const dailyReturn = (result.equity[i].value - result.equity[i-1].value) / result.equity[i-1].value;
    returns.push(dailyReturn);
  }
  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
  const stdDev = Math.sqrt(variance);
  const sharpeRatio = stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(252) : 0;
  
  return {
    totalReturn,
    annualReturn,
    maxDrawdown,
    sharpeRatio,
    winRate,
    tradeCount: trades.length
  };
}

// 显示回测结果
function displayBacktestResults(result) {
  // 隐藏加载，显示结果
  hideBacktestLoading();
  document.getElementById('backtestResults').style.display = 'block';
  
  // 更新指标
  const metrics = result.metrics;
  document.getElementById('totalReturn').textContent = 
    (metrics.totalReturn >= 0 ? '+' : '') + metrics.totalReturn.toFixed(2) + '%';
  document.getElementById('totalReturn').className = 
    'metric-value ' + (metrics.totalReturn >= 0 ? 'positive' : 'negative');
    
  document.getElementById('annualReturn').textContent = 
    (metrics.annualReturn >= 0 ? '+' : '') + metrics.annualReturn.toFixed(2) + '%';
  document.getElementById('annualReturn').className = 
    'metric-value ' + (metrics.annualReturn >= 0 ? 'positive' : 'negative');
    
  document.getElementById('maxDrawdown').textContent = 
    '-' + metrics.maxDrawdown.toFixed(2) + '%';
  document.getElementById('sharpeRatio').textContent = 
    metrics.sharpeRatio.toFixed(2);
  document.getElementById('winRate').textContent = 
    metrics.winRate.toFixed(1) + '%';
  document.getElementById('tradeCount').textContent = 
    metrics.tradeCount;
  
  // 绘制收益曲线
  drawEquityCurve(result.equity);
  
  // 显示交易记录
  displayTradeHistory(result.trades);
  
  // 滚动到结果区域
  document.getElementById('backtestResults').scrollIntoView({ behavior: 'smooth' });
}

// 绘制收益曲线
function drawEquityCurve(equity) {
  const canvas = document.getElementById('equityCurve');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  
  // 清空画布
  ctx.clearRect(0, 0, width, height);
  
  // 设置样式
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, width, height);
  
  // 计算缩放
  const values = equity.map(e => e.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const valueRange = maxValue - minValue;
  
  const padding = 40;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;
  
  // 绘制网格
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 5; i++) {
    const y = padding + (chartHeight / 5) * i;
    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(width - padding, y);
    ctx.stroke();
    
    // 绘制Y轴标签
    const value = maxValue - (valueRange / 5) * i;
    ctx.fillStyle = '#64748b';
    ctx.font = '12px Arial';
    ctx.textAlign = 'right';
    ctx.fillText('¥' + value.toFixed(0), padding - 5, y + 4);
  }
  
  // 绘制曲线
  ctx.strokeStyle = '#3b82f6';
  ctx.lineWidth = 2;
  ctx.beginPath();
  
  equity.forEach((point, index) => {
    const x = padding + (chartWidth / (equity.length - 1)) * index;
    const y = padding + chartHeight - ((point.value - minValue) / valueRange) * chartHeight;
    
    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  
  ctx.stroke();
  
  // 填充渐变
  ctx.lineTo(width - padding, height - padding);
  ctx.lineTo(padding, height - padding);
  ctx.closePath();
  
  const gradient = ctx.createLinearGradient(0, padding, 0, height - padding);
  gradient.addColorStop(0, 'rgba(59, 130, 246, 0.3)');
  gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');
  ctx.fillStyle = gradient;
  ctx.fill();
}

// 显示交易记录
function displayTradeHistory(trades) {
  const tbody = document.getElementById('tradeTableBody');
  if (!tbody) return;
  
  if (trades.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #94a3b8;">暂无交易记录</td></tr>';
    return;
  }
  
  tbody.innerHTML = trades.map(trade => {
    const actionClass = trade.action === 'buy' ? 'trade-action-buy' : 'trade-action-sell';
    const profitClass = trade.returnRate > 0 ? 'positive' : trade.returnRate < 0 ? 'negative' : '';
    
    return `
      <tr>
        <td>${trade.date}</td>
        <td class="${actionClass}">${trade.action === 'buy' ? '买入' : '卖出'}</td>
        <td>¥${trade.price.toFixed(2)}</td>
        <td>${trade.shares}</td>
        <td>¥${trade.amount.toFixed(2)}</td>
        <td>¥${trade.commission.toFixed(2)}</td>
        <td class="trade-profit ${profitClass}">
          ${trade.returnRate !== 0 ? (trade.returnRate > 0 ? '+' : '') + trade.returnRate.toFixed(2) + '%' : '-'}
        </td>
      </tr>
    `;
  }).join('');
}

// 显示加载状态
function showBacktestLoading() {
  const resultsDiv = document.getElementById('backtestResults');
  resultsDiv.style.display = 'block';
  resultsDiv.innerHTML = `
    <div class="backtest-loading">
      <div class="loading-spinner"></div>
      <div class="loading-text">正在执行回测，请稍候...</div>
    </div>
  `;
}

// 隐藏加载状态
function hideBacktestLoading() {
  const resultsDiv = document.getElementById('backtestResults');
  resultsDiv.innerHTML = '';
}

// 重置回测
function resetBacktest() {
  document.getElementById('backtest-stock').value = '';
  document.getElementById('backtestResults').style.display = 'none';
  backtestResult = null;
}

// 导出给全局使用
if (typeof window !== 'undefined') {
  window.initStrategyBacktest = initStrategyBacktest;
}
