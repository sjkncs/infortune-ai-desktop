/**
 * 指数估值分析模块
 * Index Valuation Analysis Module
 */

const ZhishuState = {
  indices: [],
};

// 主要宽基指数及其代码
const INDEX_LIST = [
  { code: '000001', name: '上证指数', market: 'sh' },
  { code: '399001', name: '深证成指', market: 'sz' },
  { code: '399006', name: '创业板指', market: 'sz' },
  { code: '000300', name: '沪深300', market: 'sh' },
  { code: '000905', name: '中证500', market: 'sh' },
  { code: '000852', name: '中证1000', market: 'sh' },
  { code: '399673', name: '创业板50', market: 'sz' },
  { code: '000016', name: '上证50', market: 'sh' },
];

function initZhishu() {
  console.log('初始化指数估值分析模块...');
  loadZhishuData();
  setupZhishuEvents();
}

function setupZhishuEvents() {
  const refreshBtn = document.getElementById('refreshZhishuBtn');
  if (refreshBtn) refreshBtn.addEventListener('click', loadZhishuData);
}

async function loadZhishuData() {
  const container = document.getElementById('zhishuGrid');
  if (!container) return;
  container.innerHTML = '<div class="loading-placeholder"><i class="fas fa-spinner fa-spin"></i> 加载指数估值数据...</div>';

  // 批量获取所有指数行情（1次请求替代8次）
  let batchData = null;
  try {
    const codes = INDEX_LIST.map(idx => idx.market + idx.code).join(',');
    const resp = await fetch(`http://localhost:3001/api/indices/realtime?codes=${codes}`, {
      signal: AbortSignal.timeout(15000)
    });
    if (resp.ok) {
      const json = await resp.json();
      if (json.success && Array.isArray(json.data)) {
        batchData = json.data;
      }
    }
  } catch {
    console.warn('[zhishu] 批量接口不可用，回退到单个请求');
  }

  // 组装结果
  const results = INDEX_LIST.map((idx, i) => {
    const result = { ...idx, price: 0, changePercent: 0, pe: null, pb: null, valuation: '未知' };
    const d = batchData ? batchData[i] : null;
    if (d) {
      result.price = parseFloat(d.currentPrice || d.price || 0);
      result.changePercent = parseFloat(d.changePercent || d.changePct || 0);
      result.pe = parseFloat(d.pe || d.peRatio || 0) || null;
      result.pb = parseFloat(d.pb || d.pbRatio || 0) || null;
    }
    // 估值判断 (基于PE百分位简化逻辑)
    if (result.pe) {
      if (result.pe < 12) result.valuation = '低估';
      else if (result.pe < 18) result.valuation = '适中';
      else if (result.pe < 30) result.valuation = '偏高';
      else result.valuation = '高估';
    }
    return result;
  });

  // 如果批量接口失败，逐个回退
  if (!batchData) {
    for (let i = 0; i < results.length; i++) {
      await fetchSingleIndex(results[i]);
    }
  }

  ZhishuState.indices = results;
  renderZhishuGrid(container, results);
}

async function fetchSingleIndex(result) {
  try {
    const resp = await fetch(`http://localhost:3001/api/stock/${result.market}${result.code}/realtime`, {
      signal: AbortSignal.timeout(8000)
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();
    if (data.success && data.data) {
      result.price = parseFloat(data.data.currentPrice || data.data.price || 0);
      result.changePercent = parseFloat(data.data.changePercent || data.data.changePct || 0);
      result.pe = parseFloat(data.data.pe || data.data.peRatio || 0) || null;
      result.pb = parseFloat(data.data.pb || data.data.pbRatio || 0) || null;
    }
  } catch {
    // 使用默认值
  }
  // 估值判断
  if (result.pe) {
    if (result.pe < 12) result.valuation = '低估';
    else if (result.pe < 18) result.valuation = '适中';
    else if (result.pe < 30) result.valuation = '偏高';
    else result.valuation = '高估';
  }
}

function renderZhishuGrid(container, indices) {
  if (!indices.length) {
    container.innerHTML = '<div class="empty-placeholder">暂无指数数据</div>';
    return;
  }

  let html = '<div class="zhishu-cards">';
  indices.forEach(idx => {
    const changeClass = idx.changePercent >= 0 ? 'positive' : 'negative';
    const changeSymbol = idx.changePercent >= 0 ? '+' : '';
    const valuationClass = idx.valuation === '低估' ? 'val-low' : idx.valuation === '高估' ? 'val-high' : idx.valuation === '偏高' ? 'val-medium-high' : 'val-normal';

    html += `
      <div class="zhishu-card">
        <div class="zhishu-card-header">
          <span class="zhishu-name">${idx.name}</span>
          <span class="zhishu-code">${idx.code}</span>
        </div>
        <div class="zhishu-card-price">
          <span class="zhishu-price ${changeClass}">${idx.price > 0 ? idx.price.toFixed(2) : '--'}</span>
          <span class="zhishu-change ${changeClass}">${idx.price > 0 ? changeSymbol + idx.changePercent.toFixed(2) + '%' : '--'}</span>
        </div>
        <div class="zhishu-card-metrics">
          <div class="zhishu-metric">
            <span class="label">PE</span>
            <span class="value">${idx.pe ? idx.pe.toFixed(2) : '--'}</span>
          </div>
          <div class="zhishu-metric">
            <span class="label">PB</span>
            <span class="value">${idx.pb ? idx.pb.toFixed(2) : '--'}</span>
          </div>
          <div class="zhishu-metric">
            <span class="label">估值</span>
            <span class="value ${valuationClass}">${idx.valuation}</span>
          </div>
        </div>
        ${idx.risk ? `
        <div class="zhishu-card-risk">
          <span title="夏普比率">Sharpe: ${(idx.risk.sharpe_ratio || 0).toFixed(2)}</span>
          <span title="年化波动率">Vol: ${(idx.risk.annual_volatility || 0).toFixed(1)}%</span>
          ${idx.regime ? `<span title="市场状态">${idx.regime.label || ''}</span>` : ''}
        </div>` : ''}
      </div>`;
  });
  html += '</div>';
  container.innerHTML = html;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { initZhishu };
}
