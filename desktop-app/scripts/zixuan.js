/**
 * 自选分析模块
 * Watchlist Analysis Module
 */

const ZixuanState = {
  watchlist: [],
  searchResults: [],
};

function initZixuan() {
  console.log('初始化自选分析模块...');
  loadWatchlist();
  setupZixuanEvents();
}

function setupZixuanEvents() {
  const addBtn = document.getElementById('addZixuanBtn');
  if (addBtn) addBtn.addEventListener('click', showZixuanSearch);

  const refreshBtn = document.getElementById('refreshZixuanBtn');
  if (refreshBtn) refreshBtn.addEventListener('click', refreshZixuanData);

  const searchInput = document.getElementById('zixuan-search-input');
  if (searchInput) {
    let debounce;
    searchInput.addEventListener('input', () => {
      clearTimeout(debounce);
      debounce = setTimeout(() => searchZixuanStock(searchInput.value.trim()), 400);
    });
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') searchZixuanStock(searchInput.value.trim());
    });
  }
}

function loadWatchlist() {
  const saved = localStorage.getItem('InFortune_zixuan');
  if (saved) {
    ZixuanState.watchlist = JSON.parse(saved);
  } else {
    ZixuanState.watchlist = [
      { code: '600519', name: '贵州茅台' },
      { code: '000858', name: '五粮液' },
      { code: '601318', name: '中国平安' },
      { code: '000001', name: '平安银行' },
    ];
  }
  renderWatchlist();
}

function saveWatchlist() {
  localStorage.setItem('InFortune_zixuan', JSON.stringify(ZixuanState.watchlist));
}

async function refreshZixuanData() {
  const container = document.getElementById('zixuanList');
  if (!container) return;
  container.innerHTML = '<div class="loading-placeholder"><i class="fas fa-spinner fa-spin"></i> 刷新自选数据...</div>';

  for (const item of ZixuanState.watchlist) {
    try {
      const prefix = item.code.startsWith('6') ? 'sh' : 'sz';
      const resp = await fetch(`http://localhost:3001/api/stock/${prefix}${item.code}/realtime`, {
        signal: AbortSignal.timeout(8000)
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      if (data.success && data.data) {
        item.price = parseFloat(data.data.currentPrice || data.data.price || 0);
        item.changePercent = parseFloat(data.data.changePercent || data.data.changePct || 0);
        item.volume = parseInt(data.data.volume || 0);
      }
    } catch {
      // keep existing data
    }
  }
  renderWatchlist();
}

function renderWatchlist() {
  const container = document.getElementById('zixuanList');
  if (!container) return;

  if (ZixuanState.watchlist.length === 0) {
    container.innerHTML = '<div class="empty-placeholder"><i class="fas fa-star"></i><p>暂无自选股票，请搜索添加</p></div>';
    return;
  }

  let html = '<table class="zixuan-table"><thead><tr><th>代码</th><th>名称</th><th>现价</th><th>涨跌幅</th><th>操作</th></tr></thead><tbody>';
  ZixuanState.watchlist.forEach((item, idx) => {
    const changeClass = (item.changePercent || 0) >= 0 ? 'positive' : 'negative';
    const changeSymbol = (item.changePercent || 0) >= 0 ? '+' : '';
    html += `<tr>
      <td>${item.code}</td>
      <td>${item.name}</td>
      <td>${item.price ? '¥' + item.price.toFixed(2) : '--'}</td>
      <td class="${changeClass}">${item.changePercent != null ? changeSymbol + item.changePercent.toFixed(2) + '%' : '--'}</td>
      <td>
        <button class="btn-sm btn-analyze" data-code="${item.code}" title="ML分析"><i class="fas fa-chart-line"></i></button>
        <button class="btn-sm btn-remove" data-idx="${idx}" title="移除"><i class="fas fa-times"></i></button>
      </td>
    </tr>`;
  });
  html += '</tbody></table>';
  container.innerHTML = html;

  // bind analyze buttons
  container.querySelectorAll('.btn-analyze').forEach(btn => {
    btn.addEventListener('click', () => analyzeZixuanStock(btn.dataset.code));
  });
  container.querySelectorAll('.btn-remove').forEach(btn => {
    btn.addEventListener('click', () => removeFromWatchlist(parseInt(btn.dataset.idx)));
  });
}

async function searchZixuanStock(query) {
  if (!query) return;
  try {
    const resp = await fetch(`http://localhost:3001/api/search?keyword=${encodeURIComponent(query)}`, {
      signal: AbortSignal.timeout(5000)
    });
    const data = await resp.json();
    if (data.success && data.data) {
      showSearchResults(data.data.slice(0, 10));
    }
  } catch {
    // silent
  }
}

function showSearchResults(results) {
  const container = document.getElementById('zixuanList');
  if (!container || results.length === 0) return;

  let html = '<div class="search-results-header">搜索结果 (点击添加到自选)</div>';
  html += '<table class="zixuan-table"><thead><tr><th>代码</th><th>名称</th><th>操作</th></tr></thead><tbody>';
  results.forEach(item => {
    const code = item['股票代码'] || item.code || '';
    const name = item['股票名称'] || item.name || '';
    const exists = ZixuanState.watchlist.some(w => w.code === code);
    html += `<tr>
      <td>${code}</td>
      <td>${name}</td>
      <td>${exists ? '<span class="text-muted">已添加</span>' : `<button class="btn-sm btn-add" data-code="${code}" data-name="${name}"><i class="fas fa-plus"></i> 添加</button>`}</td>
    </tr>`;
  });
  html += '</tbody></table>';

  const resultDiv = document.createElement('div');
  resultDiv.className = 'zixuan-search-results';
  resultDiv.innerHTML = html;

  const existing = container.querySelector('.zixuan-search-results');
  if (existing) existing.remove();
  container.prepend(resultDiv);

  resultDiv.querySelectorAll('.btn-add').forEach(btn => {
    btn.addEventListener('click', () => {
      addToWatchlist(btn.dataset.code, btn.dataset.name);
      btn.outerHTML = '<span class="text-muted">已添加</span>';
    });
  });
}

function addToWatchlist(code, name) {
  if (ZixuanState.watchlist.some(w => w.code === code)) return;
  ZixuanState.watchlist.push({ code, name });
  saveWatchlist();
}

function removeFromWatchlist(idx) {
  ZixuanState.watchlist.splice(idx, 1);
  saveWatchlist();
  renderWatchlist();
}

function showZixuanSearch() {
  const input = document.getElementById('zixuan-search-input');
  if (input) input.focus();
}

async function analyzeZixuanStock(code) {
  // Switch to stock view and trigger analysis
  if (typeof switchView === 'function') {
    switchView('stock');
    document.querySelectorAll('.nav-menu .nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.view === 'stock');
    });
  }
  const stockInput = document.querySelector('.stock-input');
  if (stockInput) {
    stockInput.value = code;
    if (typeof handleStockSearch === 'function') {
      handleStockSearch();
    }
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { initZixuan };
}
