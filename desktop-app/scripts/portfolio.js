/**
 * 投资组合模块
 * Portfolio Management Module
 */

// 投资组合状态
const PortfolioState = {
  holdings: [],
  totalValue: 0,
  totalCost: 0,
  totalProfit: 0
};

// 初始化投资组合模块
function initPortfolio() {
  console.log('初始化投资组合模块...');
  loadPortfolioData();
  setupPortfolioEventListeners();
  renderPortfolio();
  // 自动刷新持仓实时价格
  refreshPortfolioPrices();
}

// 从后端API获取持仓股票的实时价格
async function refreshPortfolioPrices() {
  if (PortfolioState.holdings.length === 0) return;

  let updated = false;
  for (const holding of PortfolioState.holdings) {
    try {
      const code = holding.code;
      // 智能添加前缀
      let fullCode = code;
      if (/^\d{6}$/.test(code)) {
        fullCode = (code.startsWith('6') || code.startsWith('5')) ? `sh${code}` : `sz${code}`;
      }
      const resp = await fetch(`http://localhost:3001/api/stock/${fullCode}`, {
        signal: AbortSignal.timeout(8000)
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      if (data.success && data.data && data.data.currentPrice) {
        holding.currentPrice = parseFloat(data.data.currentPrice);
        if (data.data.name) holding.name = data.data.name;
        updated = true;
      }
    } catch (err) {
      console.warn(`获取${holding.code}实时价格失败:`, err.message);
    }
  }

  if (updated) {
    calculatePortfolioTotals();
    renderPortfolio();
    savePortfolioData();
    console.log('✅ 持仓实时价格已更新');
  }
}

// 加载投资组合数据
function loadPortfolioData() {
  const savedData = localStorage.getItem('InFortune_portfolio');
  if (savedData) {
    try {
      PortfolioState.holdings = JSON.parse(savedData);
      calculatePortfolioTotals();
    } catch (error) {
      console.error('加载投资组合数据失败:', error);
      PortfolioState.holdings = [];
    }
  }
}

// 保存投资组合数据
function savePortfolioData() {
  localStorage.setItem('InFortune_portfolio', JSON.stringify(PortfolioState.holdings));
  calculatePortfolioTotals();
  renderPortfolio();
}

// 计算投资组合总计
function calculatePortfolioTotals() {
  let totalValue = 0;
  let totalCost = 0;
  
  PortfolioState.holdings.forEach(holding => {
    const currentValue = holding.currentPrice * holding.quantity;
    const cost = holding.costPrice * holding.quantity;
    totalValue += currentValue;
    totalCost += cost;
  });
  
  PortfolioState.totalValue = totalValue;
  PortfolioState.totalCost = totalCost;
  PortfolioState.totalProfit = totalValue - totalCost;
}

// ============================================
// 组合风险分析 (调用ML风控引擎)
// ============================================

async function analyzePortfolioRisk() {
  if (PortfolioState.holdings.length === 0) {
    alert('请先添加持仓');
    return;
  }

  const container = document.querySelector('#portfolioView .portfolio-management');
  if (!container) return;

  // 显示加载
  let riskDiv = container.querySelector('.portfolio-risk-analysis');
  if (!riskDiv) {
    riskDiv = document.createElement('div');
    riskDiv.className = 'portfolio-risk-analysis';
    container.appendChild(riskDiv);
  }
  riskDiv.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> 正在调用风控引擎分析组合风险...</div>';

  try {
    // 为每只持仓股票调用ML分析
    const analyses = [];
    for (const holding of PortfolioState.holdings) {
      try {
        let result;
        if (typeof window !== 'undefined' && window.electronAPI) {
          result = await window.electronAPI.analyzeStock(holding.code, 'risk');
        } else {
          const resp = await fetch('http://localhost:3001/api/ml/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ symbol: holding.code, analysis_type: 'risk' }),
            signal: AbortSignal.timeout(15000)
          });
          result = await resp.json();
        }
        if (result && result.success) {
          analyses.push({ holding, risk: result.results.risk || {} });
        } else {
          analyses.push({ holding, risk: {} });
        }
      } catch {
        analyses.push({ holding, risk: {} });
      }
    }

    renderPortfolioRiskAnalysis(riskDiv, analyses);

  } catch (err) {
    riskDiv.innerHTML = `<div class="error-message">风险分析失败: ${err.message}</div>`;
  }
}

function renderPortfolioRiskAnalysis(container, analyses) {
  // 计算组合级别的加权风险指标
  let totalValue = 0;
  analyses.forEach(a => {
    totalValue += a.holding.currentPrice * a.holding.quantity;
  });

  let weightedSharpe = 0;
  let weightedVaR = 0;
  let weightedVol = 0;
  let maxDD = 0;

  analyses.forEach(a => {
    const weight = (a.holding.currentPrice * a.holding.quantity) / (totalValue || 1);
    const r = a.risk;
    weightedSharpe += (r.sharpe_ratio || 0) * weight;
    weightedVaR += (r.VaR_95 || 0) * weight;
    weightedVol += (r.annual_volatility || 0) * weight;
    if ((r.max_drawdown || 0) < maxDD) maxDD = r.max_drawdown;
  });

  let html = `
    <h3><i class="fas fa-shield-alt"></i> 组合风险分析 <span class="ml-badge">✨ ML风控引擎</span></h3>
    <div class="risk-summary-grid">
      <div class="risk-metric-card">
        <div class="risk-metric-label">加权夏普比率</div>
        <div class="risk-metric-value">${weightedSharpe.toFixed(4)}</div>
      </div>
      <div class="risk-metric-card">
        <div class="risk-metric-label">加权VaR(95%)</div>
        <div class="risk-metric-value">${weightedVaR.toFixed(4)}%</div>
      </div>
      <div class="risk-metric-card">
        <div class="risk-metric-label">加权年化波动率</div>
        <div class="risk-metric-value">${weightedVol.toFixed(4)}%</div>
      </div>
      <div class="risk-metric-card negative">
        <div class="risk-metric-label">最大回撤(最差持仓)</div>
        <div class="risk-metric-value">${maxDD.toFixed(4)}%</div>
      </div>
    </div>

    <h4>个股风险明细</h4>
    <table class="risk-detail-table">
      <thead>
        <tr>
          <th>股票</th>
          <th>权重</th>
          <th>夏普</th>
          <th>Sortino</th>
          <th>VaR(95%)</th>
          <th>最大回撤</th>
          <th>年化波动</th>
        </tr>
      </thead>
      <tbody>
  `;

  analyses.forEach(a => {
    const weight = ((a.holding.currentPrice * a.holding.quantity) / (totalValue || 1) * 100).toFixed(1);
    const r = a.risk;
    html += `
      <tr>
        <td>${a.holding.name} (${a.holding.code})</td>
        <td>${weight}%</td>
        <td>${(r.sharpe_ratio || 0).toFixed(3)}</td>
        <td>${(r.sortino_ratio || 0).toFixed(3)}</td>
        <td>${(r.VaR_95 || 0).toFixed(3)}%</td>
        <td>${(r.max_drawdown || 0).toFixed(3)}%</td>
        <td>${(r.annual_volatility || 0).toFixed(3)}%</td>
      </tr>`;
  });

  html += `
      </tbody>
    </table>
    <p class="risk-disclaimer">⚠️ 风险指标基于历史数据计算，不代表未来表现。数据来源: ML推理服务 (VaR/CVaR/Sharpe引擎)</p>
  `;

  container.innerHTML = html;
}

// 设置事件监听
function setupPortfolioEventListeners() {
  const addBtn = document.getElementById('addHoldingBtn');
  if (addBtn) {
    addBtn.removeEventListener('click', showAddHoldingDialog);
    addBtn.addEventListener('click', showAddHoldingDialog);
  }

  const refreshBtn = document.getElementById('refreshPortfolioBtn');
  if (refreshBtn) {
    refreshBtn.removeEventListener('click', refreshPortfolioPrices);
    refreshBtn.addEventListener('click', refreshPortfolioPrices);
  }

  // 风险分析按钮
  const riskBtn = document.getElementById('analyzeRiskBtn');
  if (riskBtn) {
    riskBtn.addEventListener('click', analyzePortfolioRisk);
  }
}

// 渲染投资组合
function renderPortfolio() {
  // 更新顶部摘要卡片
  const totalValueEl = document.getElementById('portfolioTotalValue');
  const totalProfitEl = document.getElementById('portfolioTotalProfit');
  const totalReturnEl = document.getElementById('portfolioTotalReturn');
  const countEl = document.getElementById('portfolioCount');
  const profitPercent = PortfolioState.totalCost > 0 ? (PortfolioState.totalProfit / PortfolioState.totalCost * 100) : 0;

  if (totalValueEl) totalValueEl.textContent = `¥${PortfolioState.totalValue.toFixed(2)}`;
  if (totalProfitEl) {
    totalProfitEl.textContent = `${PortfolioState.totalProfit >= 0 ? '+' : ''}¥${PortfolioState.totalProfit.toFixed(2)}`;
    totalProfitEl.className = `metric-value ${PortfolioState.totalProfit >= 0 ? 'positive' : 'negative'}`;
  }
  if (totalReturnEl) {
    totalReturnEl.textContent = `${profitPercent >= 0 ? '+' : ''}${profitPercent.toFixed(2)}%`;
    totalReturnEl.className = `metric-value ${profitPercent >= 0 ? 'positive' : 'negative'}`;
  }
  if (countEl) countEl.textContent = PortfolioState.holdings.length;

  // 更新持仓列表
  const holdingsContainer = document.getElementById('portfolioHoldings');
  if (!holdingsContainer) return;

  if (PortfolioState.holdings.length === 0) {
    holdingsContainer.innerHTML = `
      <div class="empty-placeholder">
        <i class="fas fa-inbox"></i>
        <p>暂无持仓数据，点击"添加持仓"开始管理</p>
      </div>
    `;
  } else {
    holdingsContainer.innerHTML = `
      <table class="holdings-table">
        <thead>
          <tr>
            <th>股票代码</th>
            <th>股票名称</th>
            <th>持仓数量</th>
            <th>成本价</th>
            <th>现价</th>
            <th>市值</th>
            <th>盈亏</th>
            <th>盈亏比例</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          ${PortfolioState.holdings.map(holding => renderHoldingRow(holding)).join('')}
        </tbody>
      </table>
    `;
  }

  // 绑定删除按钮
  holdingsContainer.querySelectorAll('.delete-holding-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const code = e.currentTarget.dataset.code;
      deleteHolding(code);
    });
  });
}

// 渲染持仓行
function renderHoldingRow(holding) {
  const currentValue = holding.currentPrice * holding.quantity;
  const cost = holding.costPrice * holding.quantity;
  const profit = currentValue - cost;
  const profitPercent = (profit / cost) * 100;
  const profitClass = profit >= 0 ? 'positive' : 'negative';
  
  return `
    <tr>
      <td>${holding.code}</td>
      <td>${holding.name}</td>
      <td>${holding.quantity}</td>
      <td>¥${holding.costPrice.toFixed(2)}</td>
      <td>¥${holding.currentPrice.toFixed(2)}</td>
      <td>¥${currentValue.toFixed(2)}</td>
      <td class="${profitClass}">¥${profit.toFixed(2)}</td>
      <td class="${profitClass}">${profitPercent >= 0 ? '+' : ''}${profitPercent.toFixed(2)}%</td>
      <td>
        <button class="delete-holding-btn" data-code="${holding.code}" title="删除">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    </tr>
  `;
}

// 显示添加持仓对话框
function showAddHoldingDialog() {
  const dialogHTML = `
    <div class="modal-overlay" id="addHoldingModal">
      <div class="modal-dialog">
        <div class="modal-header">
          <h3><i class="fas fa-plus-circle"></i> 添加持仓</h3>
          <button class="modal-close" onclick="closeAddHoldingDialog()">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <form id="addHoldingForm">
            <div class="form-group">
              <label>股票代码</label>
              <input type="text" id="holdingCode" required placeholder="例如: 600519">
            </div>
            <div class="form-group">
              <label>股票名称</label>
              <input type="text" id="holdingName" required placeholder="例如: 贵州茅台">
            </div>
            <div class="form-group">
              <label>持仓数量</label>
              <input type="number" id="holdingQuantity" required placeholder="例如: 100" min="1">
            </div>
            <div class="form-group">
              <label>成本价</label>
              <input type="number" id="holdingCostPrice" required placeholder="例如: 1650.50" step="0.01" min="0">
            </div>
            <div class="form-group">
              <label>现价</label>
              <input type="number" id="holdingCurrentPrice" required placeholder="例如: 1685.50" step="0.01" min="0">
            </div>
            <div class="form-actions">
              <button type="button" class="btn-secondary" onclick="closeAddHoldingDialog()">取消</button>
              <button type="submit" class="btn-primary">添加</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', dialogHTML);
  
  const form = document.getElementById('addHoldingForm');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    addHolding();
  });
}

// 关闭添加持仓对话框
function closeAddHoldingDialog() {
  const modal = document.getElementById('addHoldingModal');
  if (modal) {
    modal.remove();
  }
}

// 添加持仓
function addHolding() {
  const code = document.getElementById('holdingCode').value.trim();
  const name = document.getElementById('holdingName').value.trim();
  const quantity = parseInt(document.getElementById('holdingQuantity').value);
  const costPrice = parseFloat(document.getElementById('holdingCostPrice').value);
  const currentPrice = parseFloat(document.getElementById('holdingCurrentPrice').value);
  
  // 检查是否已存在
  const existingIndex = PortfolioState.holdings.findIndex(h => h.code === code);
  
  const holding = {
    code,
    name,
    quantity,
    costPrice,
    currentPrice,
    addedDate: new Date().toISOString()
  };
  
  if (existingIndex >= 0) {
    // 更新现有持仓
    PortfolioState.holdings[existingIndex] = holding;
  } else {
    // 添加新持仓
    PortfolioState.holdings.push(holding);
  }
  
  savePortfolioData();
  closeAddHoldingDialog();
}

// 删除持仓
function deleteHolding(code) {
  if (confirm('确定要删除这个持仓吗？')) {
    PortfolioState.holdings = PortfolioState.holdings.filter(h => h.code !== code);
    savePortfolioData();
  }
}

// 导出初始化函数
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { initPortfolio };
}
