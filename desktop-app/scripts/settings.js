/**
 * 设置界面逻辑
 * Settings Page Logic
 */

// 设置状态
const SettingsState = {
  currentSection: 'general',
  settings: {},
  initialized: false
};

// 供 app.js 的 openSettings() 调用
function initSettingsView() {
  if (!SettingsState.initialized) {
    loadSettings();
    setupSettingsEventListeners();
    SettingsState.initialized = true;
  } else {
    loadSettings();
  }
}

// 页面加载时仅加载并应用已保存的设置（不绑定事件）
document.addEventListener('DOMContentLoaded', () => {
  try {
    loadSettings();
    applySettingsToApp();
  } catch (e) {
    console.warn('设置加载失败:', e);
  }
});

// 加载设置
function loadSettings() {
  const savedSettings = localStorage.getItem('InFortune_settings');
  if (savedSettings) {
    SettingsState.settings = JSON.parse(savedSettings);
  } else {
    // 默认设置
    SettingsState.settings = {
      autoLaunch: false,
      minimizeToTray: true,
      saveHistory: true,
      historyDays: 30,
      theme: 'light',
      themeColor: '#6366f1',
      fontSize: 14,
      inputHeight: 80,
      lineHeight: 1.6,
      sidebarWidth: 260,
      animations: true,
      language: 'zh-CN',
      autoTranslate: false,
      apiUrl: 'http://localhost:3001/api',
      refreshRate: 30,
      realtimeData: true,
      desktopNotif: true,
      soundNotif: false,
      priceAlert: true,
      devMode: false,
      hwAccel: true
    };
  }

  // 应用设置到UI
  applySettingsToUI();
}

// 保存设置
function saveSettings() {
  localStorage.setItem('InFortune_settings', JSON.stringify(SettingsState.settings));
  applySettingsToApp();
}

// 应用设置到UI
function applySettingsToUI() {
  const settings = SettingsState.settings;

  // 通用设置
  document.getElementById('autoLaunch').checked = settings.autoLaunch;
  document.getElementById('minimizeToTray').checked = settings.minimizeToTray;
  document.getElementById('saveHistory').checked = settings.saveHistory;
  document.getElementById('historyDays').value = settings.historyDays;

  // 外观设置
  document.querySelectorAll('.theme-option').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.theme === settings.theme);
  });

  document.querySelectorAll('.color-option:not(.custom)').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.color === settings.themeColor);
  });

  document.getElementById('fontSize').value = settings.fontSize;
  document.getElementById('fontSizeValue').textContent = settings.fontSize + 'px';

  document.getElementById('inputHeight').value = settings.inputHeight;
  document.getElementById('inputHeightValue').textContent = settings.inputHeight + 'px';

  document.getElementById('lineHeight').value = settings.lineHeight;
  
  document.getElementById('sidebarWidth').value = settings.sidebarWidth;
  document.getElementById('sidebarWidthValue').textContent = settings.sidebarWidth + 'px';

  document.getElementById('animations').checked = settings.animations;

  // 语言设置
  document.querySelectorAll('.language-option').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === settings.language);
  });
  document.getElementById('autoTranslate').checked = settings.autoTranslate;

  // AI API配置
  if (typeof apiConfig !== 'undefined') {
    document.getElementById('aiProvider').value = apiConfig.currentProvider;
    document.getElementById('apiKey').value = apiConfig.apiKey;
  }
  
  // 数据源设置
  document.getElementById('apiUrl').value = settings.apiUrl;
  document.getElementById('refreshRate').value = settings.refreshRate;
  document.getElementById('realtimeData').checked = settings.realtimeData;

  // 通知设置
  document.getElementById('desktopNotif').checked = settings.desktopNotif;
  document.getElementById('soundNotif').checked = settings.soundNotif;
  document.getElementById('priceAlert').checked = settings.priceAlert;

  // 高级设置
  document.getElementById('devMode').checked = settings.devMode;
  document.getElementById('hwAccel').checked = settings.hwAccel;
}

// 应用设置到应用（内联模式，直接修改当前页面）
function applySettingsToApp() {
  const settings = SettingsState.settings;
  if (!settings) return;

  if (settings.themeColor) {
    document.documentElement.style.setProperty('--primary-color', settings.themeColor);
  }
  if (settings.fontSize) {
    document.documentElement.style.fontSize = settings.fontSize + 'px';
  }
  if (typeof applySettings === 'function') {
    applySettings(settings);
  }
}

// 设置事件监听（内联视图版）
function setupSettingsEventListeners() {
  // 返回按钮 → 切回聊天视图
  document.getElementById('backBtn').addEventListener('click', () => {
    if (typeof switchView === 'function') {
      switchView('chat');
      document.querySelectorAll('.nav-menu .nav-item').forEach(i => {
        i.classList.toggle('active', i.dataset.view === 'chat');
      });
    }
  });

  // 恢复默认按钮
  document.getElementById('resetBtn').addEventListener('click', () => {
    if (confirm('确定要恢复所有默认设置吗？')) {
      localStorage.removeItem('InFortune_settings');
      SettingsState.initialized = false;
      loadSettings();
      applySettingsToApp();
    }
  });

  // 侧边栏导航（使用 settings-nav-item 类避免与主导航冲突）
  document.querySelectorAll('.settings-nav .settings-nav-item').forEach(item => {
    item.addEventListener('click', () => {
      switchSection(item.dataset.section);
    });
  });

  // 通用设置
  document.getElementById('autoLaunch').addEventListener('change', (e) => {
    SettingsState.settings.autoLaunch = e.target.checked;
    saveSettings();
  });

  document.getElementById('minimizeToTray').addEventListener('change', (e) => {
    SettingsState.settings.minimizeToTray = e.target.checked;
    saveSettings();
  });

  document.getElementById('saveHistory').addEventListener('change', (e) => {
    SettingsState.settings.saveHistory = e.target.checked;
    saveSettings();
  });

  document.getElementById('historyDays').addEventListener('change', (e) => {
    SettingsState.settings.historyDays = parseInt(e.target.value);
    saveSettings();
  });

  // 主题选择
  document.querySelectorAll('.theme-option').forEach(btn => {
    btn.addEventListener('click', () => {
      SettingsState.settings.theme = btn.dataset.theme;
      document.querySelectorAll('.theme-option').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      saveSettings();
    });
  });

  // 颜色选择
  document.querySelectorAll('.color-option:not(.custom)').forEach(btn => {
    btn.addEventListener('click', () => {
      SettingsState.settings.themeColor = btn.dataset.color;
      document.querySelectorAll('.color-option').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      saveSettings();
    });
  });

  // 自定义颜色
  document.querySelector('.color-option.custom').addEventListener('click', () => {
    document.getElementById('customColor').click();
  });

  document.getElementById('customColor').addEventListener('change', (e) => {
    SettingsState.settings.themeColor = e.target.value;
    document.querySelectorAll('.color-option').forEach(b => b.classList.remove('active'));
    document.querySelector('.color-option.custom').classList.add('active');
    saveSettings();
  });

  // 字体大小
  document.getElementById('fontSize').addEventListener('input', (e) => {
    const value = e.target.value;
    document.getElementById('fontSizeValue').textContent = value + 'px';
    SettingsState.settings.fontSize = parseInt(value);
    saveSettings();
  });

  // 输入框高度
  document.getElementById('inputHeight').addEventListener('input', (e) => {
    const value = e.target.value;
    document.getElementById('inputHeightValue').textContent = value + 'px';
    SettingsState.settings.inputHeight = parseInt(value);
    saveSettings();
  });

  // 行间距
  document.getElementById('lineHeight').addEventListener('change', (e) => {
    SettingsState.settings.lineHeight = parseFloat(e.target.value);
    saveSettings();
  });

  // 侧边栏宽度
  document.getElementById('sidebarWidth').addEventListener('input', (e) => {
    const value = e.target.value;
    document.getElementById('sidebarWidthValue').textContent = value + 'px';
    SettingsState.settings.sidebarWidth = parseInt(value);
    saveSettings();
  });

  // 动画效果
  document.getElementById('animations').addEventListener('change', (e) => {
    SettingsState.settings.animations = e.target.checked;
    saveSettings();
  });

  // 语言选择
  document.querySelectorAll('.language-option').forEach(btn => {
    btn.addEventListener('click', () => {
      SettingsState.settings.language = btn.dataset.lang;
      document.querySelectorAll('.language-option').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      saveSettings();
      if (typeof I18N !== 'undefined') {
        I18N.applyLanguage(btn.dataset.lang);
      }
    });
  });

  document.getElementById('autoTranslate').addEventListener('change', (e) => {
    SettingsState.settings.autoTranslate = e.target.checked;
    saveSettings();
  });

  // AI API配置
  if (typeof apiConfig !== 'undefined') {
    document.getElementById('aiProvider').addEventListener('change', (e) => {
      apiConfig.setProvider(e.target.value);
      console.log('AI提供商已更改:', e.target.value);
    });

    document.getElementById('apiKey').addEventListener('change', (e) => {
      apiConfig.setAPIKey(e.target.value);
      console.log('API Key已更新');
    });

    // 测试API连接
    const testBtn = document.getElementById('testAPIBtn');
    if (testBtn) {
      testBtn.addEventListener('click', async () => {
        const statusItem = document.getElementById('apiStatusItem');
        const statusDiv = document.getElementById('apiStatus');
        
        statusItem.style.display = 'flex';
        statusDiv.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 正在测试连接...';
        statusDiv.className = 'api-status testing';
        
        try {
          const client = getAPIClient();
          const result = await client.testConnection();
          
          if (result.success) {
            statusDiv.innerHTML = `<i class="fas fa-check-circle"></i> 连接成功！`;
            statusDiv.className = 'api-status success';
          } else {
            statusDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> 连接失败: ${result.message}`;
            statusDiv.className = 'api-status error';
          }
        } catch (error) {
          statusDiv.innerHTML = `<i class="fas fa-times-circle"></i> 测试失败: ${error.message}`;
          statusDiv.className = 'api-status error';
        }
      });
    }
  }
  
  // 数据源设置
  document.getElementById('apiUrl').addEventListener('change', (e) => {
    SettingsState.settings.apiUrl = e.target.value;
    saveSettings();
  });

  document.getElementById('refreshRate').addEventListener('change', (e) => {
    SettingsState.settings.refreshRate = parseInt(e.target.value);
    saveSettings();
  });

  document.getElementById('realtimeData').addEventListener('change', (e) => {
    SettingsState.settings.realtimeData = e.target.checked;
    saveSettings();
  });

  // 通知设置
  document.getElementById('desktopNotif').addEventListener('change', (e) => {
    SettingsState.settings.desktopNotif = e.target.checked;
    saveSettings();
  });

  document.getElementById('soundNotif').addEventListener('change', (e) => {
    SettingsState.settings.soundNotif = e.target.checked;
    saveSettings();
  });

  document.getElementById('priceAlert').addEventListener('change', (e) => {
    SettingsState.settings.priceAlert = e.target.checked;
    saveSettings();
  });

  // 高级设置
  document.getElementById('devMode').addEventListener('change', (e) => {
    SettingsState.settings.devMode = e.target.checked;
    saveSettings();
    alert('开发者模式将在重启应用后生效');
  });

  document.getElementById('hwAccel').addEventListener('change', (e) => {
    SettingsState.settings.hwAccel = e.target.checked;
    saveSettings();
    alert('硬件加速设置将在重启应用后生效');
  });

  // 清除缓存
  document.getElementById('clearCache').addEventListener('click', () => {
    if (confirm('确定要清除所有缓存吗？')) {
      localStorage.clear();
      alert('缓存已清除，应用将重新加载');
      location.reload();
    }
  });

  // 导出数据
  document.getElementById('exportData').addEventListener('click', () => {
    const data = {
      settings: SettingsState.settings,
      history: JSON.parse(localStorage.getItem('InFortune_chat_history') || '[]'),
      exportDate: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `infortune-ai-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });
}

// 切换设置区域
function switchSection(sectionName) {
  console.log('切换到设置区域:', sectionName);
  SettingsState.currentSection = sectionName;

  // 更新导航
  document.querySelectorAll('.settings-nav .settings-nav-item').forEach(item => {
    const isActive = item.dataset.section === sectionName;
    if (isActive) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  // 更新内容
  document.querySelectorAll('.settings-section').forEach(section => {
    const isActive = section.id === sectionName;
    if (isActive) {
      section.classList.add('active');
      console.log('显示区域:', section.id);
    } else {
      section.classList.remove('active');
    }
  });
}
