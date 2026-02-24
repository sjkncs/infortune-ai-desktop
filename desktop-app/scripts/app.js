/**
 * In Fortune AI桌面应用 - 应用逻辑
 */

// 应用状态
const AppState = {
  currentView: 'chat',
  chatHistory: [],
  currentChatId: null,
  pendingFiles: [],
  isRecording: false,
  selectedModel: 'gemini-2.5-flash-search',
  user: {
    name: '投资者',
    avatar: null
  }
};

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
  try { initializeApp(); } catch(e) { console.error('初始化失败:', e); }
  try { setupEventListeners(); } catch(e) { console.error('事件绑定失败:', e); }
  try { loadChatHistory(); } catch(e) { console.error('加载历史失败:', e); }
});

// 初始化应用
function initializeApp() {
  console.log('In Fortune AI Desktop App Initialized');
  
  // 加载用户信息和历史
  loadUserInfo();
  loadChatHistory();
  setupFileUpload();
  setupModelSelector();
  
  // 初始化市场视图
  if (typeof initMarket === 'function') {
    initMarket();
  }
  
  // 初始化策略回测
  if (typeof initStrategyBacktest === 'function') {
    initStrategyBacktest();
  }
  
  // 初始化股票分析
  if (typeof initStockAnalysis === 'function') {
    initStockAnalysis();
  }
  
  // 初始化投资组合
  if (typeof initPortfolio === 'function') {
    initPortfolio();
  }

  // 初始化自选分析
  if (typeof initZixuan === 'function') {
    initZixuan();
  }

  // 初始化指数分析
  if (typeof initZhishu === 'function') {
    initZhishu();
  }

  // 初始化ETF行情
  if (typeof initEtf === 'function') {
    initEtf();
  }

  // 初始化模式指示器
  initModeIndicator();
  
  // 设置默认视图
  switchView('chat');
}

// 设置事件监听
function setupEventListeners() {
  // 导航菜单
  document.querySelectorAll('.nav-menu .nav-item').forEach(item => {
    item.addEventListener('click', () => {
      const view = item.dataset.view;
      switchView(view);
      
      // 更新激活状态
      document.querySelectorAll('.nav-menu .nav-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
    });
  });

  // 新对话按钮
  const newChatBtn = document.querySelector('.new-chat-btn');
  if (newChatBtn) {
    newChatBtn.addEventListener('click', createNewChat);
  }

  // 输入框自动调整高度
  const messageInput = document.getElementById('messageInput');
  if (messageInput) {
    messageInput.addEventListener('input', autoResizeTextarea);
    messageInput.addEventListener('keydown', handleInputKeydown);
  }

  // 发送按钮
  const sendBtn = document.getElementById('sendBtn');
  if (sendBtn) {
    sendBtn.addEventListener('click', sendMessage);
  }

  // 附件按钮
  const attachBtn = document.querySelector('.attach-btn');
  if (attachBtn) {
    attachBtn.addEventListener('click', handleAttachment);
  }

  // 语音按钮
  const voiceBtn = document.querySelector('.voice-btn');
  if (voiceBtn) {
    voiceBtn.addEventListener('click', handleVoiceInput);
  }

  // 设置按钮
  const settingsBtn = document.querySelector('.settings-btn');
  if (settingsBtn) {
    settingsBtn.addEventListener('click', openSettings);
  }

  // 模型选择器
  const modelSelectorBtn = document.getElementById('modelSelectorBtn');
  if (modelSelectorBtn) {
    modelSelectorBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleModelDropdown();
    });
  }
  // 点击其他地方关闭下拉
  document.addEventListener('click', () => closeModelDropdown());

  // 底部工具栏按钮
  const realtimeDataBtn = document.getElementById('realtimeDataBtn');
  if (realtimeDataBtn) {
    realtimeDataBtn.addEventListener('click', () => handleToolbarAction('realtime'));
  }

  const technicalBtn = document.getElementById('technicalBtn');
  if (technicalBtn) {
    technicalBtn.addEventListener('click', () => handleToolbarAction('technical'));
  }

  const newsBtn = document.getElementById('newsBtn');
  if (newsBtn) {
    newsBtn.addEventListener('click', () => handleToolbarAction('news'));
  }

  // 个股搜索按钮
  const stockSearchBtn = document.querySelector('.search-btn');
  if (stockSearchBtn) {
    stockSearchBtn.addEventListener('click', handleStockSearch);
  }

  // 个股搜索输入框回车
  const stockInput = document.querySelector('.stock-input');
  if (stockInput) {
    stockInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        handleStockSearch();
      }
    });
  }

  // 快捷功能卡片
  document.querySelectorAll('.action-card').forEach(card => {
    card.addEventListener('click', () => {
      const action = card.dataset.action;
      const text = card.querySelector('span').textContent;
      handleQuickAction(action, text);
    });
  });

  // 功能标签
  document.querySelectorAll('.tag').forEach(tag => {
    tag.addEventListener('click', () => {
      const tagType = tag.dataset.tag;
      const text = tag.textContent.trim();
      handleTechnicalTag(tagType, text);
    });
  });
}

// 切换视图
function switchView(viewName) {
  AppState.currentView = viewName;
  
  // 隐藏所有视图
  document.querySelectorAll('.view-container').forEach(view => {
    view.classList.remove('active');
  });
  
  // 显示当前视图
  const targetView = document.getElementById(`${viewName}View`);
  if (targetView) {
    targetView.classList.add('active');
  }

  // 进入模式页面时自动刷新服务状态
  if (viewName === 'mode' && typeof refreshServiceStatus === 'function') {
    refreshServiceStatus();
  }
}

// 加载用户信息
function loadUserInfo() {
  const savedUser = localStorage.getItem('InFortune_user');
  if (savedUser) {
    AppState.user = JSON.parse(savedUser);
    updateUserDisplay();
  }
}

// 更新用户显示
function updateUserDisplay() {
  const usernameElement = document.querySelector('.username');
  if (usernameElement) {
    usernameElement.textContent = AppState.user.name;
  }
}

// 创建新对话
function createNewChat() {
  const chatId = Date.now().toString();
  AppState.currentChatId = chatId;
  
  // 显示欢迎屏幕
  showWelcomeScreen();
  
  // 添加到历史记录
  const newChat = {
    id: chatId,
    title: '新对话',
    time: new Date().toISOString(),
    messages: []
  };
  
  AppState.chatHistory.unshift(newChat);
  saveChatHistory();
  renderChatHistory();
}

// 显示欢迎屏幕
function showWelcomeScreen() {
  const welcomeScreen = document.getElementById('welcomeScreen');
  const chatArea = document.getElementById('chatArea');
  
  if (welcomeScreen) welcomeScreen.classList.remove('hidden');
  if (chatArea) chatArea.classList.add('hidden');
  
  // 清空消息
  const messagesContainer = document.getElementById('messagesContainer');
  if (messagesContainer) {
    messagesContainer.innerHTML = '';
  }
}

// 隐藏欢迎屏幕
function hideWelcomeScreen() {
  const welcomeScreen = document.getElementById('welcomeScreen');
  const chatArea = document.getElementById('chatArea');
  
  if (welcomeScreen) welcomeScreen.classList.add('hidden');
  if (chatArea) chatArea.classList.remove('hidden');
}

// 处理快捷功能
function handleQuickAction(action, text) {
  const actionMessages = {
    'market-overview': '请为我分析当前市场整体走势和主要指数表现',
    'stock-search': '我想查询股票信息，请问股票代码或名称是？',
    'technical-analysis': '请帮我进行技术分析，包括主要技术指标',
    'news-sentiment': '请分析最近的市场新闻和舆情',
    'ai-prediction': '请使用AI模型预测股票走势',
    'risk-analysis': '请评估当前市场风险和个股风险'
  };
  
  const messageInput = document.getElementById('messageInput');
  if (messageInput) {
    messageInput.value = actionMessages[action] || text;
    messageInput.focus();
  }
}

// 处理技术指标标签
function handleTechnicalTag(tagType, text) {
  const tagMessages = {
    'macd': '请分析MACD指标，包括DIF、DEA和MACD柱状图',
    'kdj': '请分析KDJ指标的K值、D值和J值',
    'ma': '请分析均线系统，包括5日、10日、20日均线',
    'volume': '请分析成交量变化和量价关系',
    'bollinger': '请分析布林带上轨、中轨和下轨',
    'rsi': '请分析RSI相对强弱指标',
    'support': '请找出当前的支撑位',
    'resistance': '请找出当前的压力位'
  };
  
  const messageInput = document.getElementById('messageInput');
  if (messageInput) {
    messageInput.value = tagMessages[tagType] || text;
    messageInput.focus();
  }
}

// 输入框自动调整高度
function autoResizeTextarea(e) {
  const textarea = e.target;
  textarea.style.height = 'auto';
  textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
}

// 处理输入键盘事件
function handleInputKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
}

// 加载对话历史
function loadChatHistory() {
  const saved = localStorage.getItem('InFortune_chat_history');
  if (saved) {
    AppState.chatHistory = JSON.parse(saved);
    renderChatHistory();
  }
}

// 保存对话历史
function saveChatHistory() {
  localStorage.setItem('InFortune_chat_history', JSON.stringify(AppState.chatHistory));
}

// 渲染对话历史（豆包/千问风格）
function renderChatHistory() {
  const container = document.getElementById('chatHistory');
  if (!container) return;
  
  container.innerHTML = '';
  
  AppState.chatHistory.forEach(chat => {
    const item = document.createElement('div');
    item.className = 'history-item';
    if (chat.id === AppState.currentChatId) {
      item.classList.add('active');
    }

    const msgCount = chat.messages ? chat.messages.length : 0;
    const lastMsg = chat.messages && chat.messages.length > 0
      ? chat.messages[chat.messages.length - 1] : null;
    const preview = lastMsg
      ? (lastMsg.content || '').replace(/[\n\r]+/g, ' ').substring(0, 30)
      : '暂无消息';
    
    item.innerHTML = `
      <div class="history-top-row">
        <div class="history-title">${escapeHistoryHtml(chat.title)}</div>
        ${msgCount > 0 ? `<span class="history-badge">${msgCount}</span>` : ''}
      </div>
      <div class="history-bottom-row">
        <div class="history-preview">${escapeHistoryHtml(preview)}</div>
        <div class="history-time">${formatTime(chat.time)}</div>
      </div>
      <button class="history-delete" title="删除对话"><i class="fas fa-trash-alt"></i></button>
    `;
    
    item.addEventListener('click', (e) => {
      if (e.target.closest('.history-delete')) return;
      loadChat(chat.id);
    });
    item.querySelector('.history-delete').addEventListener('click', (e) => {
      e.stopPropagation();
      deleteChat(chat.id);
    });
    container.appendChild(item);
  });
}

// 转义历史记录HTML
function escapeHistoryHtml(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

// 删除对话
function deleteChat(chatId) {
  AppState.chatHistory = AppState.chatHistory.filter(c => c.id !== chatId);
  if (AppState.currentChatId === chatId) {
    AppState.currentChatId = null;
    showWelcomeScreen();
  }
  saveChatHistory();
  renderChatHistory();
}

// 加载对话
function loadChat(chatId) {
  const chat = AppState.chatHistory.find(c => c.id === chatId);
  if (!chat) return;
  
  AppState.currentChatId = chatId;
  
  // 渲染消息
  const messagesContainer = document.getElementById('messagesContainer');
  if (messagesContainer) {
    messagesContainer.innerHTML = '';
    chat.messages.forEach(msg => {
      appendMessage(msg.role, msg.content, false);
    });
  }
  
  // 隐藏欢迎屏幕
  if (chat.messages.length > 0) {
    hideWelcomeScreen();
  }
  
  renderChatHistory();
}

// 格式化时间
function formatTime(isoString) {
  const date = new Date(isoString);
  const now = new Date();
  const diff = now - date;
  
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
  
  return date.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' });
}

// ========== 文件上传功能 ==========
function handleAttachment() {
  const fileInput = document.getElementById('fileInput');
  if (fileInput) fileInput.click();
}

function setupFileUpload() {
  const fileInput = document.getElementById('fileInput');
  if (!fileInput) return;
  fileInput.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => addPendingFile(file));
    fileInput.value = '';
  });

  // 支持拖拽上传到输入区域
  const inputContainer = document.querySelector('.input-container');
  if (inputContainer) {
    inputContainer.addEventListener('dragover', (e) => { e.preventDefault(); inputContainer.style.borderColor = 'var(--primary-color)'; });
    inputContainer.addEventListener('dragleave', () => { inputContainer.style.borderColor = ''; });
    inputContainer.addEventListener('drop', (e) => {
      e.preventDefault();
      inputContainer.style.borderColor = '';
      Array.from(e.dataTransfer.files).forEach(file => addPendingFile(file));
    });
  }
}

function addPendingFile(file) {
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    alert(`文件 "${file.name}" 超过10MB限制`);
    return;
  }
  AppState.pendingFiles.push(file);
  renderFilePreview();
}

function removePendingFile(index) {
  AppState.pendingFiles.splice(index, 1);
  renderFilePreview();
}

function renderFilePreview() {
  const area = document.getElementById('filePreviewArea');
  if (!area) return;
  area.innerHTML = '';
  if (AppState.pendingFiles.length === 0) {
    area.classList.remove('has-files');
    return;
  }
  area.classList.add('has-files');
  AppState.pendingFiles.forEach((file, idx) => {
    const isImage = file.type.startsWith('image/');
    const item = document.createElement('div');
    item.className = 'file-preview-item';
    if (isImage) {
      const img = document.createElement('img');
      img.src = URL.createObjectURL(file);
      item.appendChild(img);
    } else {
      const icon = document.createElement('i');
      icon.className = 'file-icon fas ' + getFileIcon(file.name);
      item.appendChild(icon);
    }
    const nameSpan = document.createElement('span');
    nameSpan.className = 'file-name';
    nameSpan.textContent = file.name;
    item.appendChild(nameSpan);
    const removeBtn = document.createElement('button');
    removeBtn.className = 'file-remove';
    removeBtn.innerHTML = '<i class="fas fa-times"></i>';
    removeBtn.addEventListener('click', () => removePendingFile(idx));
    item.appendChild(removeBtn);
    area.appendChild(item);
  });
}

function getFileIcon(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  const map = { pdf: 'fa-file-pdf', doc: 'fa-file-word', docx: 'fa-file-word', xls: 'fa-file-excel', xlsx: 'fa-file-excel', csv: 'fa-file-csv', txt: 'fa-file-alt', md: 'fa-file-alt' };
  return map[ext] || 'fa-file';
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + 'B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + 'KB';
  return (bytes / 1048576).toFixed(1) + 'MB';
}

// ========== 语音输入功能 ==========
let _speechRecognition = null;

function handleVoiceInput() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    alert('当前浏览器不支持语音输入，请使用Chrome或Edge。');
    return;
  }

  const voiceBtn = document.getElementById('voiceBtn');

  if (AppState.isRecording && _speechRecognition) {
    _speechRecognition.stop();
    return;
  }

  _speechRecognition = new SpeechRecognition();
  _speechRecognition.lang = 'zh-CN';
  _speechRecognition.continuous = false;
  _speechRecognition.interimResults = true;

  _speechRecognition.onstart = () => {
    AppState.isRecording = true;
    if (voiceBtn) voiceBtn.classList.add('recording');
  };

  _speechRecognition.onresult = (event) => {
    const messageInput = document.getElementById('messageInput');
    if (!messageInput) return;
    let transcript = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      transcript += event.results[i][0].transcript;
    }
    messageInput.value = transcript;
    messageInput.dispatchEvent(new Event('input'));
  };

  _speechRecognition.onend = () => {
    AppState.isRecording = false;
    if (voiceBtn) voiceBtn.classList.remove('recording');
    _speechRecognition = null;
  };

  _speechRecognition.onerror = (event) => {
    console.warn('语音识别错误:', event.error);
    AppState.isRecording = false;
    if (voiceBtn) voiceBtn.classList.remove('recording');
    _speechRecognition = null;
    if (event.error === 'not-allowed') {
      alert('请在系统设置中允许麦克风权限。');
    }
  };

  _speechRecognition.start();
}

// 打开设置视图
function openSettings() {
  switchView('settings');
  // 取消主导航高亮
  document.querySelectorAll('.nav-menu .nav-item').forEach(i => i.classList.remove('active'));
  // 初始化设置页面数据
  if (typeof initSettingsView === 'function') {
    initSettingsView();
  }
}

// 应用设置
function applySettings(settings) {
  // 应用主题色
  if (settings.themeColor) {
    document.documentElement.style.setProperty('--primary-color', settings.themeColor);
  }

  // 应用字体大小
  if (settings.fontSize) {
    document.documentElement.style.fontSize = settings.fontSize + 'px';
  }

  // 应用侧边栏宽度
  if (settings.sidebarWidth) {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
      sidebar.style.width = settings.sidebarWidth + 'px';
    }
  }

  // 应用动画设置
  if (settings.animations !== undefined) {
    document.documentElement.classList.toggle('no-animations', !settings.animations);
  }
}

// 处理工具栏操作
function handleToolbarAction(action) {
  const messageInput = document.getElementById('messageInput');
  const actions = {
    'realtime': '请提供最新的实时市场数据',
    'technical': '请进行技术指标分析',
    'news': '请分析最近的相关新闻和市场动态'
  };

  if (messageInput && actions[action]) {
    messageInput.value = actions[action];
    messageInput.focus();
  }
}

// 处理股票搜索
async function handleStockSearch() {
  const stockInput = document.querySelector('.stock-input');
  if (!stockInput) return;

  const query = stockInput.value.trim();
  if (!query) {
    alert('请输入股票代码或名称');
    return;
  }

  const resultsContainer = document.getElementById('stockSearchResults');
  if (resultsContainer) {
    resultsContainer.innerHTML = '<div class="loading-placeholder"><i class="fas fa-spinner fa-spin"></i> 搜索中...</div>';
  }

  try {
    const resp = await fetch(`${API_CONFIG.baseURL}/search?keyword=${encodeURIComponent(query)}`, {
      signal: AbortSignal.timeout(8000)
    });
    const data = await resp.json();

    if (data.success && data.data && data.data.length > 0) {
      renderStockSearchResults(data.data.slice(0, 15));
    } else {
      if (resultsContainer) {
        resultsContainer.innerHTML = '<div class="empty-placeholder"><i class="fas fa-search"></i><p>未找到匹配的股票，请尝试其他关键词</p></div>';
      }
    }
  } catch (err) {
    console.error('搜索失败:', err);
    if (resultsContainer) {
      resultsContainer.innerHTML = '<div class="empty-placeholder"><i class="fas fa-exclamation-triangle"></i><p>搜索服务暂不可用</p></div>';
    }
  }
}

// 渲染股票搜索结果
function renderStockSearchResults(results) {
  const container = document.getElementById('stockSearchResults');
  if (!container) return;

  let html = '<table class="zixuan-table"><thead><tr><th>代码</th><th>名称</th><th>市场</th><th>操作</th></tr></thead><tbody>';
  results.forEach(item => {
    const code = item['股票代码'] || item.code || '';
    const name = item['股票名称'] || item.name || '';
    const market = item['所在市场'] || item.market || '';
    html += `<tr class="stock-result-row" data-code="${code}" data-name="${name}">
      <td>${code}</td>
      <td>${name}</td>
      <td>${market}</td>
      <td>
        <button class="btn-sm btn-analyze" data-code="${code}" title="分析此股票"><i class="fas fa-chart-line"></i> 分析</button>
      </td>
    </tr>`;
  });
  html += '</tbody></table>';
  container.innerHTML = html;

  container.querySelectorAll('.btn-analyze').forEach(btn => {
    btn.addEventListener('click', () => {
      triggerStockAnalysis(btn.dataset.code);
    });
  });

  container.querySelectorAll('.stock-result-row').forEach(row => {
    row.addEventListener('dblclick', () => {
      triggerStockAnalysis(row.dataset.code);
    });
  });
}

// 触发个股分析（跳转到聊天并发送分析请求）
function triggerStockAnalysis(code) {
  if (!code) return;
  switchView('chat');
  document.querySelectorAll('.nav-menu .nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.view === 'chat');
  });

  const messageInput = document.getElementById('messageInput');
  if (messageInput) {
    messageInput.value = `分析 ${code}`;
    setTimeout(() => {
      sendMessage();
    }, 300);
  }
}

// 加载市场数据（委托给 market.js 的 fetchRealMarketData）
function loadMarketData() {
  if (typeof fetchRealMarketData === 'function') {
    fetchRealMarketData();
  }
}

// 初始化市场数据视图（market.js 已有完整的 initMarket，此处仅作兼容）
function initMarketView() {
  loadMarketData();
}

// ============================================
// 双模式系统 — 独立路由视图
// ============================================
let _currentAppMode = 'local';

function initModeIndicator() {
  const indicator = document.getElementById('modeIndicator');
  const isElectron = typeof window !== 'undefined' && window.electronAPI;

  if (!isElectron) {
    if (indicator) indicator.style.display = 'none';
    return;
  }

  // 获取当前模式
  window.electronAPI.getAppMode().then(mode => {
    _currentAppMode = mode;
    updateModeDisplay(indicator, mode);
    updateModeViewCards(mode);
  }).catch(() => {});

  // 底部指示器点击 → 跳转到模式视图
  if (indicator) {
    indicator.style.display = 'flex';
    indicator.style.cursor = 'pointer';
    indicator.addEventListener('click', () => {
      switchView('mode');
      document.querySelectorAll('.nav-menu .nav-item').forEach(i => {
        i.classList.toggle('active', i.dataset.view === 'mode');
      });
    });
  }

  // 模式视图按钮绑定
  const switchLocalBtn = document.getElementById('switchLocalBtn');
  const switchWebBtn = document.getElementById('switchWebBtn');
  const refreshBtn = document.getElementById('refreshServicesBtn');

  if (switchLocalBtn) switchLocalBtn.addEventListener('click', (e) => { e.stopPropagation(); switchToMode('local'); });
  if (switchWebBtn) switchWebBtn.addEventListener('click', (e) => { e.stopPropagation(); switchToMode('web'); });
  if (refreshBtn) refreshBtn.addEventListener('click', () => refreshServiceStatus());

  // 启动时检查一次服务，之后定期检查
  refreshServiceStatus();
  setInterval(refreshServiceStatus, 30000);
}

function updateModeViewCards(mode) {
  const localCard = document.getElementById('modeCardLocal');
  const webCard = document.getElementById('modeCardWeb');
  const localBadge = document.getElementById('localBadge');
  const webBadge = document.getElementById('webBadge');

  if (localCard) localCard.classList.toggle('active', mode === 'local');
  if (webCard) webCard.classList.toggle('active', mode === 'web');
  if (localBadge) localBadge.classList.toggle('hidden', mode !== 'local');
  if (webBadge) webBadge.classList.toggle('hidden', mode !== 'web');
}

async function switchToMode(targetMode) {
  if (targetMode === _currentAppMode) return;
  if (!window.electronAPI) return;

  try {
    const result = await window.electronAPI.switchMode(targetMode);
    if (result.success) {
      _currentAppMode = targetMode;
      updateModeDisplay(document.getElementById('modeIndicator'), targetMode);
      updateModeViewCards(targetMode);
    } else {
      alert(result.message || '切换失败');
    }
  } catch (e) {
    alert('切换失败: ' + e.message);
  }
}

async function refreshServiceStatus() {
  if (!window.electronAPI) return;

  setDotStatus('statusVite', 'checking');
  setDotStatus('statusAPI', 'checking');
  setDotStatus('statusML', 'checking');

  try {
    const status = await window.electronAPI.checkServices();
    setDotStatus('statusVite', status.viteDev ? 'online' : 'offline');
    setDotStatus('statusAPI', status.nodeAPI ? 'online' : 'offline');
    setDotStatus('statusML', status.mlService ? 'online' : 'offline');
    _currentAppMode = status.appMode;
    updateModeDisplay(document.getElementById('modeIndicator'), status.appMode);
    updateModeViewCards(status.appMode);
  } catch {
    setDotStatus('statusVite', 'offline');
    setDotStatus('statusAPI', 'offline');
    setDotStatus('statusML', 'offline');
  }
}

function setDotStatus(id, status) {
  const dot = document.getElementById(id);
  if (!dot) return;
  dot.className = 'status-dot ' + status;
}

function updateModeDisplay(indicator, mode) {
  if (!indicator) return;
  const icon = indicator.querySelector('i');
  const text = indicator.querySelector('span');
  if (mode === 'web') {
    icon.className = 'fas fa-globe';
    text.textContent = 'Web模式';
    indicator.title = '当前: Web模式';
  } else {
    icon.className = 'fas fa-desktop';
    text.textContent = '本地模式';
    indicator.title = '当前: 本地模式';
  }
}

// ==================== 模型选择器 ====================

function setupModelSelector() {
  // 从 localStorage 恢复已选模型
  if (typeof apiConfig !== 'undefined') {
    AppState.selectedModel = apiConfig.getSelectedModel();
  }
  renderModelDropdown();
  updateModelSelectorDisplay();
}

function renderModelDropdown() {
  const dropdown = document.getElementById('modelDropdown');
  if (!dropdown || typeof MODEL_CATALOG === 'undefined') return;

  const categories = {};
  MODEL_CATALOG.forEach(m => {
    if (!categories[m.category]) categories[m.category] = [];
    categories[m.category].push(m);
  });

  let html = '';
  for (const [cat, models] of Object.entries(categories)) {
    html += `<div class="model-dropdown-category"><i class="fas ${getCategoryIcon(cat)}"></i> ${cat}</div>`;
    models.forEach(m => {
      const isActive = m.id === AppState.selectedModel;
      html += `
        <div class="model-dropdown-item ${isActive ? 'active' : ''}" data-model-id="${m.id}">
          <div class="mdl-icon"><i class="fas ${m.icon}"></i></div>
          <div class="mdl-info">
            <div class="mdl-name">${m.name}</div>
            <div class="mdl-desc">${m.desc}</div>
          </div>
          <i class="fas fa-check mdl-check"></i>
        </div>`;
    });
  }
  dropdown.innerHTML = html;

  // 绑定点击事件
  dropdown.querySelectorAll('.model-dropdown-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      const modelId = item.dataset.modelId;
      selectModel(modelId);
    });
  });
}

function getCategoryIcon(cat) {
  const icons = { '对话': 'fa-comments', '搜索': 'fa-search', '工具': 'fa-wrench', 'GPT': 'fa-robot', '生图': 'fa-image' };
  return icons[cat] || 'fa-circle';
}

function selectModel(modelId) {
  AppState.selectedModel = modelId;
  if (typeof apiConfig !== 'undefined') {
    apiConfig.setSelectedModel(modelId);
  }
  updateModelSelectorDisplay();
  renderModelDropdown();
  closeModelDropdown();
  console.log('模型已切换:', modelId);
}

function updateModelSelectorDisplay() {
  const nameEl = document.getElementById('modelSelectorName');
  if (!nameEl || typeof MODEL_CATALOG === 'undefined') return;
  const model = MODEL_CATALOG.find(m => m.id === AppState.selectedModel);
  nameEl.textContent = model ? model.name : AppState.selectedModel;
}

function toggleModelDropdown() {
  const dropdown = document.getElementById('modelDropdown');
  const btn = document.getElementById('modelSelectorBtn');
  if (!dropdown) return;
  const isOpen = dropdown.classList.contains('show');
  if (isOpen) {
    closeModelDropdown();
  } else {
    dropdown.classList.add('show');
    if (btn) btn.classList.add('open');
  }
}

function closeModelDropdown() {
  const dropdown = document.getElementById('modelDropdown');
  const btn = document.getElementById('modelSelectorBtn');
  if (dropdown) dropdown.classList.remove('show');
  if (btn) btn.classList.remove('open');
}
