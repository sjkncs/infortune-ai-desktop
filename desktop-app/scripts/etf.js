/**
 * ETF行情模块
 * ETF Market Data Module
 */

const EtfState = {
  data: [],
  filtered: [],
  sortBy: 'amount',
  searchQuery: '',
};

function initEtf() {
  console.log('初始化ETF行情模块...');
  setupEtfEvents();
  loadEtfData();
}

function setupEtfEvents() {
  const refreshBtn = document.getElementById('refreshEtfBtn');
  if (refreshBtn) refreshBtn.addEventListener('click', loadEtfData);

  const sortSelect = document.getElementById('etf-sort');
  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      EtfState.sortBy = sortSelect.value;
      applyEtfFilters();
    });
  }

  const searchInput = document.getElementById('etf-search-input');
  if (searchInput) {
    let debounce;
    searchInput.addEventListener('input', () => {
      clearTimeout(debounce);
      debounce = setTimeout(() => {
        EtfState.searchQuery = searchInput.value.trim().toLowerCase();
        applyEtfFilters();
      }, 300);
    });
  }
}

async function loadEtfData() {
  const container = document.getElementById('etfTableWrapper');
  if (!container) return;
  container.innerHTML = '<div class="loading-placeholder"><i class="fas fa-spinner fa-spin"></i> 加载ETF行情数据...</div>';

  try {
    // 尝试从ETF API获取数据 (优先akshare，回退到baostock)
    let data;
    try {
      const resp = await fetch('http://localhost:3001/api/etf/akshare', {
        signal: AbortSignal.timeout(15000)
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      data = await resp.json();
    } catch {
      const resp2 = await fetch('http://localhost:3001/api/etf?page=1&page_size=50', {
        signal: AbortSignal.timeout(15000)
      });
      if (!resp2.ok) throw new Error(`HTTP ${resp2.status}`);
      data = await resp2.json();
    }
    if (data && data.success && Array.isArray(data.data)) {
      EtfState.data = data.data.map(e => ({
        code: e.code || '',
        name: e.name || '',
        price: parseFloat(e.currentPrice || e.price || 0),
        change: parseFloat(e.changePercent || e.change || 0),
        volume: parseInt(e.volume || 0),
        amount: parseFloat(e.amount || e.turnover || 0),
      }));
    } else {
      EtfState.data = generateSampleEtfData();
    }
  } catch {
    console.warn('ETF API不可用，使用示例数据');
    EtfState.data = generateSampleEtfData();
  }

  applyEtfFilters();
}

function generateSampleEtfData() {
  const etfs = [
    { code: '510300', name: '沪深300ETF', price: 3.95, change: 1.28, volume: 285000000, amount: 1125000000 },
    { code: '510500', name: '中证500ETF', price: 5.82, change: 0.86, volume: 198000000, amount: 1152000000 },
    { code: '159915', name: '创业板ETF', price: 2.35, change: 1.72, volume: 320000000, amount: 752000000 },
    { code: '510050', name: '上证50ETF', price: 2.68, change: 0.75, volume: 156000000, amount: 418000000 },
    { code: '159919', name: '沪深300ETF', price: 3.96, change: 1.29, volume: 125000000, amount: 495000000 },
    { code: '512100', name: '中证1000ETF', price: 1.45, change: 2.11, volume: 245000000, amount: 355000000 },
    { code: '512880', name: '证券ETF', price: 0.98, change: 3.16, volume: 890000000, amount: 872000000 },
    { code: '515790', name: '光伏ETF', price: 0.72, change: -1.37, volume: 178000000, amount: 128000000 },
    { code: '512010', name: '医药ETF', price: 0.45, change: -0.66, volume: 267000000, amount: 120000000 },
    { code: '159941', name: '纳指ETF', price: 1.58, change: 0.64, volume: 89000000, amount: 141000000 },
    { code: '518880', name: '黄金ETF', price: 5.85, change: 0.34, volume: 45000000, amount: 263000000 },
    { code: '513100', name: '纳斯达克ETF', price: 1.62, change: 0.93, volume: 134000000, amount: 217000000 },
  ];
  // 添加随机波动
  return etfs.map(e => ({
    ...e,
    price: +(e.price * (1 + (Math.random() - 0.5) * 0.02)).toFixed(3),
    change: +(e.change + (Math.random() - 0.5) * 0.5).toFixed(2),
  }));
}

function applyEtfFilters() {
  let filtered = [...EtfState.data];

  // 搜索过滤
  if (EtfState.searchQuery) {
    filtered = filtered.filter(e =>
      (e.name || '').toLowerCase().includes(EtfState.searchQuery) ||
      (e.code || '').includes(EtfState.searchQuery)
    );
  }

  // 排序
  switch (EtfState.sortBy) {
    case 'amount':
      filtered.sort((a, b) => (b.amount || 0) - (a.amount || 0));
      break;
    case 'change':
      filtered.sort((a, b) => (b.change || 0) - (a.change || 0));
      break;
    case 'volume':
      filtered.sort((a, b) => (b.volume || 0) - (a.volume || 0));
      break;
  }

  EtfState.filtered = filtered;
  renderEtfTable(filtered);
}

function renderEtfTable(data) {
  const container = document.getElementById('etfTableWrapper');
  if (!container) return;

  if (data.length === 0) {
    container.innerHTML = '<div class="empty-placeholder">未找到匹配的ETF</div>';
    return;
  }

  let html = `
    <table class="etf-table">
      <thead>
        <tr>
          <th>代码</th>
          <th>名称</th>
          <th>最新价</th>
          <th>涨跌幅</th>
          <th>成交量</th>
          <th>成交额</th>
        </tr>
      </thead>
      <tbody>`;

  data.forEach(etf => {
    const changeClass = (etf.change || 0) >= 0 ? 'positive' : 'negative';
    const changeSymbol = (etf.change || 0) >= 0 ? '+' : '';
    html += `
      <tr>
        <td>${etf.code || ''}</td>
        <td>${etf.name || ''}</td>
        <td>¥${(etf.price || 0).toFixed(3)}</td>
        <td class="${changeClass}">${changeSymbol}${(etf.change || 0).toFixed(2)}%</td>
        <td>${formatEtfVolume(etf.volume || 0)}</td>
        <td>${formatEtfAmount(etf.amount || 0)}</td>
      </tr>`;
  });

  html += '</tbody></table>';
  html += `<div class="etf-footer">共 ${data.length} 只ETF</div>`;
  container.innerHTML = html;
}

function formatEtfVolume(vol) {
  if (vol >= 100000000) return (vol / 100000000).toFixed(2) + '亿';
  if (vol >= 10000) return (vol / 10000).toFixed(0) + '万';
  return vol.toString();
}

function formatEtfAmount(amt) {
  if (amt >= 100000000) return (amt / 100000000).toFixed(2) + '亿';
  if (amt >= 10000) return (amt / 10000).toFixed(0) + '万';
  return amt.toString();
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { initEtf };
}
