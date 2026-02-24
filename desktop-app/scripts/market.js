/**
 * 市场行情模块
 * Market Data Module
 */

// 市场数据状态
const MarketState = {
  indices: [],
  sectors: [],
  topGainers: [],
  topLosers: [],
  updateInterval: null,
  refreshRate: 5000, // 5秒刷新一次
  isRealtime: true
};

// 初始化市场模块
function initMarket() {
  console.log('初始化市场行情模块...');
  loadMarketSettings();
  loadInitialMarketData();
  setupMarketEventListeners();
  
  if (MarketState.isRealtime) {
    startAutoRefresh();
  }
}

// 加载市场设置
function loadMarketSettings() {
  const settings = JSON.parse(localStorage.getItem('InFortune_settings') || '{}');
  MarketState.refreshRate = (settings.refreshRate || 30) * 1000;
  MarketState.isRealtime = settings.realtimeData !== false;
}

// 加载初始市场数据
async function loadInitialMarketData() {
  // 设置默认数据（防止API失败时页面空白）
  MarketState.indices = [
    { code: '000001', name: '上证指数', price: 0, change: 0, changePercent: 0, volume: 0, lastUpdate: Date.now() },
    { code: '399001', name: '深证成指', price: 0, change: 0, changePercent: 0, volume: 0, lastUpdate: Date.now() },
    { code: '399006', name: '创业板指', price: 0, change: 0, changePercent: 0, volume: 0, lastUpdate: Date.now() },
    { code: '000300', name: '沪深300', price: 0, change: 0, changePercent: 0, volume: 0, lastUpdate: Date.now() }
  ];
  MarketState.sectors = [
    { name: '人工智能', change: 0, stocks: 156 },
    { name: '新能源车', change: 0, stocks: 234 },
    { name: '芯片半导体', change: 0, stocks: 189 },
    { name: '医药生物', change: 0, stocks: 267 },
    { name: '房地产', change: 0, stocks: 145 }
  ];
  updateMarketDisplay();

  // 尝试从真实API获取数据
  await fetchRealMarketData();

  // 尝试连接WebSocket实时推送
  connectMarketWebSocket();
}

// 更新市场显示
function updateMarketDisplay() {
  updateIndicesDisplay();
  updateSectorsDisplay();
}

// 更新指数显示
function updateIndicesDisplay() {
  const container = document.querySelector('.market-indicators');
  if (!container) return;
  
  container.innerHTML = MarketState.indices.map(index => {
    const changeClass = index.change >= 0 ? 'positive' : 'negative';
    const changeSymbol = index.change >= 0 ? '+' : '';
    
    return `
      <div class="indicator-card ${changeClass}" data-code="${index.code}">
        <div class="indicator-label">${index.name}</div>
        <div class="indicator-value">${index.price.toFixed(2)}</div>
        <div class="indicator-change ${changeClass}">
          ${changeSymbol}${index.changePercent.toFixed(2)}%
        </div>
        <div class="indicator-volume">成交额: ${formatVolume(index.volume)}</div>
      </div>
    `;
  }).join('');
}

// 更新板块显示
function updateSectorsDisplay() {
  const sectorsContainer = document.querySelector('.market-sectors');
  if (!sectorsContainer) return;
  
  sectorsContainer.innerHTML = `
    <h3><i class="fas fa-chart-pie"></i> 热门板块</h3>
    <div class="sectors-list">
      ${MarketState.sectors.map(sector => {
        const changeClass = sector.change >= 0 ? 'positive' : 'negative';
        const changeSymbol = sector.change >= 0 ? '+' : '';
        return `
          <div class="sector-item">
            <span class="sector-name">${sector.name}</span>
            <span class="sector-stocks">${sector.stocks}只</span>
            <span class="sector-change ${changeClass}">
              ${changeSymbol}${sector.change.toFixed(2)}%
            </span>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

// 格式化成交量
function formatVolume(volume) {
  if (volume >= 100000000) {
    return (volume / 100000000).toFixed(0) + '亿';
  } else if (volume >= 10000) {
    return (volume / 10000).toFixed(0) + '万';
  }
  return volume.toString();
}

// 从API获取真实市场数据（多源容错）
async function fetchRealMarketData() {
  // 源1: 后端代理
  try {
    const resp = await fetch('http://localhost:3001/api/market/overview', { signal: AbortSignal.timeout(5000) });
    if (resp.ok) {
      const data = await resp.json();
      if (data.success !== false && data.indices) {
        applyMarketIndices(data.indices, 'backend');
        return;
      }
    }
  } catch (e) { console.warn('后端市场API不可用:', e.message); }

  // 源2: BaoStock直连 (port 8001)
  try {
    const ok = await fetchFromBaoStock();
    if (ok) return;
  } catch (e) { console.warn('BaoStock不可用:', e.message); }

  // 源3: 东方财富免费API
  try {
    const ok = await fetchFromEastMoney();
    if (ok) return;
  } catch (e) { console.warn('东方财富API不可用:', e.message); }

  console.warn('所有市场数据源均不可用');
}

// 统一应用指数数据
function applyMarketIndices(indices, source) {
  indices.forEach(apiIdx => {
    const code = (apiIdx.code || '').replace(/^(sh|sz|\.SH|\.SZ)/gi, '').replace(/\./g, '');
    const local = MarketState.indices.find(i => i.code === code);
    if (local) {
      local.price = parseFloat(apiIdx.value || apiIdx.price || apiIdx.close || 0);
      local.changePercent = parseFloat(apiIdx.change || apiIdx.changePercent || apiIdx.pctChg || 0);
      local.change = local.price * local.changePercent / 100;
      if (apiIdx.volume) local.volume = parseFloat(apiIdx.volume);
      if (apiIdx.amount) local.volume = parseFloat(apiIdx.amount);
      local.lastUpdate = Date.now();
    }
  });
  updateMarketDisplay();
  console.log(`✅ 市场数据已从 ${source} 加载`);
}

// BaoStock直连获取指数K线（最新一天）
async function fetchFromBaoStock() {
  const BAOSTOCK_URL = 'http://127.0.0.1:8001';
  const codeMap = [
    { local: '000001', bs: 'sh.000001', name: '上证指数' },
    { local: '399001', bs: 'sz.399001', name: '深证成指' },
    { local: '399006', bs: 'sz.399006', name: '创业板指' },
    { local: '000300', bs: 'sh.000300', name: '沪深300' }
  ];

  const today = new Date().toISOString().split('T')[0];
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
  let updated = 0;

  for (const idx of codeMap) {
    try {
      const resp = await fetch(
        `${BAOSTOCK_URL}/api/kline/history?code=${idx.bs}&start_date=${weekAgo}&end_date=${today}&frequency=d&fields=date,code,open,high,low,close,preclose,volume,amount,pctChg`,
        { signal: AbortSignal.timeout(5000) }
      );
      if (!resp.ok) continue;
      const data = await resp.json();
      if (data.success && data.data?.kline_data?.length > 0) {
        const latest = data.data.kline_data[data.data.kline_data.length - 1];
        const local = MarketState.indices.find(i => i.code === idx.local);
        if (local && latest.close) {
          local.price = parseFloat(latest.close);
          local.changePercent = parseFloat(latest.pctChg || 0);
          local.change = latest.preclose ? local.price - parseFloat(latest.preclose) : 0;
          local.volume = parseFloat(latest.amount || latest.volume || 0);
          local.lastUpdate = Date.now();
          updated++;
        }
      }
    } catch { /* skip this index */ }
  }

  if (updated > 0) {
    updateMarketDisplay();
    console.log(`✅ BaoStock: ${updated}个指数数据已更新`);
    return true;
  }
  return false;
}

// 东方财富免费API获取实时指数
async function fetchFromEastMoney() {
  const secids = [
    { secid: '1.000001', local: '000001' },
    { secid: '0.399001', local: '399001' },
    { secid: '0.399006', local: '399006' },
    { secid: '1.000300', local: '000300' }
  ];
  const ids = secids.map(s => s.secid).join(',');
  const url = `https://push2.eastmoney.com/api/qt/ulist.np/get?fltt=2&fields=f2,f3,f4,f6,f12,f14&secids=${ids}`;

  const resp = await fetch(url, {
    signal: AbortSignal.timeout(5000),
    headers: { 'Referer': 'https://quote.eastmoney.com/' }
  });
  if (!resp.ok) return false;
  const data = await resp.json();

  if (data.data && data.data.diff) {
    let updated = 0;
    data.data.diff.forEach(item => {
      const code = item.f12;
      const match = secids.find(s => s.local === code);
      if (!match) return;
      const local = MarketState.indices.find(i => i.code === code);
      if (local && item.f2) {
        local.price = parseFloat(item.f2);
        local.changePercent = parseFloat(item.f3 || 0);
        local.change = parseFloat(item.f4 || 0);
        local.volume = parseFloat(item.f6 || 0);
        local.lastUpdate = Date.now();
        updated++;
      }
    });
    if (updated > 0) {
      updateMarketDisplay();
      console.log(`✅ 东方财富: ${updated}个指数数据已更新`);
      return true;
    }
  }
  return false;
}

// WebSocket实时连接
let _marketWs = null;
let _wsReconnectTimer = null;

function connectMarketWebSocket() {
  if (_marketWs && _marketWs.readyState === WebSocket.OPEN) return;

  try {
    const wsUrl = 'ws://localhost:3001/ws';
    _marketWs = new WebSocket(wsUrl);

    _marketWs.onopen = () => {
      console.log('✅ WebSocket已连接，订阅市场指数');
      _marketWs.send(JSON.stringify({ type: 'subscribe', channel: 'market:index' }));
    };

    _marketWs.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'data' && msg.channel === 'market:index' && msg.data) {
          handleWebSocketMarketData(msg.data);
        }
      } catch (e) {
        // ignore parse errors
      }
    };

    _marketWs.onclose = () => {
      console.log('WebSocket断开，5秒后重连...');
      _wsReconnectTimer = setTimeout(connectMarketWebSocket, 5000);
    };

    _marketWs.onerror = () => {
      // onclose will handle reconnect
    };
  } catch (err) {
    console.warn('WebSocket连接失败:', err.message);
  }
}

function handleWebSocketMarketData(wsData) {
  if (!Array.isArray(wsData)) return;
  wsData.forEach(item => {
    const code = (item.code || '').replace(/^(sh|sz)/, '');
    const local = MarketState.indices.find(i => i.code === code);
    if (local && item.currentPrice) {
      local.price = parseFloat(item.currentPrice);
      if (item.prevClose) {
        const prev = parseFloat(item.prevClose);
        local.change = local.price - prev;
        local.changePercent = prev > 0 ? (local.change / prev) * 100 : 0;
      }
      local.lastUpdate = Date.now();
    }
  });
  animateMarketUpdate();
  updateMarketDisplay();
}

// 模拟数据更新（作WebSocket不可用时的回退）
function simulateMarketUpdate() {
  // 如果WebSocket已连接，不需要模拟更新
  if (_marketWs && _marketWs.readyState === WebSocket.OPEN) {
    return;
  }

  // 先尝试从API拉取（fetchRealMarketData内部已调用updateMarketDisplay）
  fetchRealMarketData().catch(() => {
    // API也失败时，使用模拟波动
    MarketState.indices = MarketState.indices.map(index => {
      if (index.price === 0) {
        // 还没有真实数据，设置一个初始值
        index.price = index.code === '000001' ? 3125 : index.code === '399001' ? 10234 : index.code === '399006' ? 2456 : 3825;
      }
      const changePercent = (Math.random() - 0.5) * 0.6;
      const priceChange = index.price * (changePercent / 100);
      const newPrice = index.price + priceChange;
      const basePrice = newPrice / (1 + (index.changePercent || 0) / 100 || 1);
      const newChange = newPrice - basePrice;
      const newChangePercent = (newChange / basePrice) * 100;
      const volumeChange = (Math.random() - 0.5) * 0.1;
      const newVolume = (index.volume || 200000000000) * (1 + volumeChange);

      return {
        ...index,
        price: newPrice,
        change: newChange,
        changePercent: newChangePercent,
        volume: newVolume,
        lastUpdate: Date.now()
      };
    });

    MarketState.sectors = MarketState.sectors.map(sector => {
      const changeAdjust = (Math.random() - 0.5) * 0.2;
      return { ...sector, change: sector.change + changeAdjust };
    });

    animateMarketUpdate();
    updateMarketDisplay();
  });
}

// 动画效果
function animateMarketUpdate() {
  const cards = document.querySelectorAll('.indicator-card');
  cards.forEach(card => {
    card.classList.add('updating');
    setTimeout(() => {
      card.classList.remove('updating');
    }, 300);
  });
}

// 开始自动刷新
function startAutoRefresh() {
  if (MarketState.updateInterval) {
    clearInterval(MarketState.updateInterval);
  }
  
  MarketState.updateInterval = setInterval(() => {
    simulateMarketUpdate();
  }, MarketState.refreshRate);
  
  if (!MarketState._refreshLoggedOnce) {
    console.log(`市场数据自动刷新已启动，间隔: ${MarketState.refreshRate / 1000}秒`);
    MarketState._refreshLoggedOnce = true;
  }
}

// 停止自动刷新
function stopAutoRefresh() {
  if (MarketState.updateInterval) {
    clearInterval(MarketState.updateInterval);
    MarketState.updateInterval = null;
    MarketState._refreshLoggedOnce = false;
  }
}

// 设置事件监听
function setupMarketEventListeners() {
  // 监听刷新率设置变化
  window.addEventListener('storage', (e) => {
    if (e.key === 'InFortune_settings') {
      loadMarketSettings();
      if (MarketState.isRealtime) {
        startAutoRefresh();
      } else {
        stopAutoRefresh();
      }
    }
  });
  
  // 监听页面可见性
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopAutoRefresh();
    } else if (MarketState.isRealtime) {
      startAutoRefresh();
      simulateMarketUpdate(); // 立即更新一次
    }
  });
}

// 手动刷新
function refreshMarketData() {
  console.log('手动刷新市场数据...');
  simulateMarketUpdate();
  
  // 显示刷新提示
  const container = document.querySelector('.market-overview');
  if (container) {
    const toast = document.createElement('div');
    toast.className = 'refresh-toast';
    toast.innerHTML = '<i class="fas fa-sync-alt"></i> 数据已刷新';
    container.appendChild(toast);
    
    setTimeout(() => {
      toast.remove();
    }, 2000);
  }
}

// 获取指数详情
function getIndexDetail(code) {
  return MarketState.indices.find(index => index.code === code);
}

// 切换实时更新
function toggleRealtimeUpdate(enabled) {
  MarketState.isRealtime = enabled;
  
  if (enabled) {
    startAutoRefresh();
  } else {
    stopAutoRefresh();
  }
  
  // 保存设置
  const settings = JSON.parse(localStorage.getItem('InFortune_settings') || '{}');
  settings.realtimeData = enabled;
  localStorage.setItem('InFortune_settings', JSON.stringify(settings));
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    initMarket,
    refreshMarketData,
    toggleRealtimeUpdate,
    getIndexDetail
  };
}
