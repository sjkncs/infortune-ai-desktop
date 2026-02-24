/**
 * In Fortune AI桌面应用 - 主进程
 * JiuCai AI Desktop App - Main Process
 *
 * 双模式架构:
 *   1. Web模式 — 加载 Vue 前端 (localhost:5173 开发 / localhost:3001 生产)
 *   2. 本地模式 — 回退到内置 index.html (离线可用)
 */

const { app, BrowserWindow, ipcMain, Menu, Tray, shell, dialog } = require('electron');
const path = require('path');
const http = require('http');

let mainWindow;
let tray;

// ============================================
// 服务端口配置
// ============================================
const SERVICES = {
  nodeAPI:   process.env.NODE_API_URL   || 'http://localhost:3001',
  mlService: process.env.ML_SERVICE_URL || 'http://localhost:8002',
  viteDev:   process.env.VITE_DEV_URL   || 'http://localhost:5173',
};

// 运行模式: 'web' | 'local'
let appMode = 'local';

// ============================================
// 服务健康检查
// ============================================
function checkService(url, timeoutMs = 3000) {
  return new Promise((resolve) => {
    const req = http.get(url, { timeout: timeoutMs }, (res) => {
      resolve(res.statusCode >= 200 && res.statusCode < 500);
      res.resume();
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => { req.destroy(); resolve(false); });
  });
}

async function detectBestMode() {
  // 默认使用本地模式（完整的AI对话、设置等原生功能）
  // Web模式仅在用户通过设置手动切换时启用
  return { mode: 'local', url: null };
}

// 检测可用的Web服务（供手动切换时调用）
async function detectWebService() {
  if (await checkService(SERVICES.viteDev)) return { available: true, url: SERVICES.viteDev };
  if (await checkService(SERVICES.nodeAPI)) return { available: true, url: SERVICES.nodeAPI };
  return { available: false, url: null };
}

// ============================================
// 应用菜单 (Windows下必须显式设置才能正常使用键盘输入/IME)
// ============================================
function setupApplicationMenu() {
  const isMac = process.platform === 'darwin';
  const template = [
    ...(isMac ? [{ role: 'appMenu' }] : []),
    { role: 'fileMenu' },
    { role: 'editMenu' },
    { role: 'viewMenu' },
    { role: 'windowMenu' },
  ];
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// ============================================
// 创建主窗口
// ============================================
async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 600,
    frame: true,
    backgroundColor: '#0f0f1a',
    icon: path.join(__dirname, 'assets/icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: true,
      sandbox: false,
    },
    titleBarStyle: 'default',
    show: false,
  });

  // 设置CSP头部 (仅本地模式需要严格CSP，Web模式由服务器控制)
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    if (appMode === 'local') {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Content-Security-Policy': [
            "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; font-src 'self' https://cdnjs.cloudflare.com; img-src 'self' data: blob: https:; connect-src 'self' http://localhost:* http://127.0.0.1:* ws://localhost:* https://push2.eastmoney.com https://hiapi.online;"
          ]
        }
      });
    } else {
      callback({ responseHeaders: details.responseHeaders });
    }
  });

  // 外部链接在系统浏览器中打开
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) shell.openExternal(url);
    return { action: 'deny' };
  });

  // 加载应用 (双模式)
  const { mode, url } = await detectBestMode();
  appMode = mode;

  if (mode === 'web' && url) {
    console.log(`[Desktop] Web模式: 加载 ${url}`);
    mainWindow.loadURL(url);
    mainWindow.webContents.once('did-finish-load', () => {
      injectLocalModeButton();
    });
  } else {
    console.log('[Desktop] 本地模式: 加载 index.html');
    mainWindow.loadFile('index.html');
  }

  // 窗口准备好后显示并聚焦
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  // 页面加载完成后确保webContents获得焦点
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.focus();
  });

  // 开发工具
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }

  // 窗口关闭事件 — 最小化到托盘
  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
    return false;
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // 创建系统托盘
  createTray();
}

// 创建系统托盘
function createTray() {
  tray = new Tray(path.join(__dirname, 'assets/tray-icon.png'));
  
  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示窗口',
      click: () => {
        mainWindow.show();
      }
    },
    {
      label: '退出',
      click: () => {
        app.isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setToolTip('In Fortune AI');
  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
    }
  });
}

// 应用准备就绪
app.whenReady().then(() => {
  setupApplicationMenu();
  createWindow();
});

// 所有窗口关闭
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// 激活应用
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC通信处理
ipcMain.handle('minimize-window', () => {
  mainWindow.minimize();
});

ipcMain.handle('maximize-window', () => {
  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow.maximize();
  }
});

ipcMain.handle('close-window', () => {
  mainWindow.hide();
});

ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('get-app-mode', () => {
  return appMode;
});

ipcMain.handle('switch-mode', async (event, targetMode) => {
  if (targetMode === 'web') {
    const { available, url } = await detectWebService();
    if (available && url) {
      appMode = 'web';
      mainWindow.loadURL(url);
      // 页面加载完成后注入浮动按钮
      mainWindow.webContents.once('did-finish-load', () => {
        injectLocalModeButton();
      });
      return { success: true, mode: 'web', url };
    }
    return { success: false, message: 'Web服务不可用，请先启动网站服务' };
  } else {
    appMode = 'local';
    mainWindow.loadFile('index.html');
    return { success: true, mode: 'local' };
  }
});

function injectLocalModeButton() {
  if (!mainWindow || appMode !== 'web') return;
  mainWindow.webContents.executeJavaScript(`
    (function() {
      if (document.getElementById('__backToLocal')) return;
      var btn = document.createElement('div');
      btn.id = '__backToLocal';
      btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg> <span>本地模式</span>';
      btn.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:99999;background:linear-gradient(135deg,#FC5531,#E04020);color:#fff;border:none;border-radius:12px;padding:10px 18px;font-size:13px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:8px;box-shadow:0 4px 20px rgba(252,85,49,0.4);transition:all 0.2s;font-family:-apple-system,BlinkMacSystemFont,sans-serif;';
      btn.onmouseenter = function() { btn.style.transform='translateY(-2px)'; btn.style.boxShadow='0 8px 28px rgba(252,85,49,0.5)'; };
      btn.onmouseleave = function() { btn.style.transform=''; btn.style.boxShadow='0 4px 20px rgba(252,85,49,0.4)'; };
      btn.onclick = function() {
        if (window.electronAPI && window.electronAPI.switchMode) {
          window.electronAPI.switchMode('local');
        }
      };
      document.body.appendChild(btn);
    })();
  `).catch(() => {});
}

ipcMain.handle('reload-app', () => {
  mainWindow.reload();
});

// ============================================
// 服务健康检查 IPC
// ============================================
ipcMain.handle('check-services', async () => {
  const [nodeAPI, mlService, viteDev] = await Promise.all([
    checkService(SERVICES.nodeAPI),
    checkService(SERVICES.mlService),
    checkService(SERVICES.viteDev),
  ]);
  return { nodeAPI, mlService, viteDev, appMode };
});

// ============================================
// 通用 HTTP 代理 (供扩展模块使用)
// ============================================
ipcMain.handle('http-request', async (event, { url, method, body, timeout }) => {
  return new Promise((resolve) => {
    try {
      const parsed = new URL(url);
      // 安全限制: 仅允许访问本地服务
      if (!['localhost', '127.0.0.1'].includes(parsed.hostname)) {
        resolve({ success: false, error: '仅允许访问本地服务' });
        return;
      }
      const postData = body ? JSON.stringify(body) : null;
      const options = {
        hostname: parsed.hostname,
        port: parsed.port,
        path: parsed.pathname + parsed.search,
        method: method || 'GET',
        headers: postData ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData) } : {},
        timeout: timeout || 15000,
      };
      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try { resolve({ success: true, status: res.statusCode, data: JSON.parse(data) }); }
          catch { resolve({ success: true, status: res.statusCode, data }); }
        });
      });
      req.on('error', (e) => resolve({ success: false, error: e.message }));
      req.on('timeout', () => { req.destroy(); resolve({ success: false, error: 'timeout' }); });
      if (postData) req.write(postData);
      req.end();
    } catch (e) {
      resolve({ success: false, error: e.message });
    }
  });
});

// ============================================
// ML推理服务代理 (安全的主进程代理)
// ============================================

function proxyToMLService(endpoint, body) {
  const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8002';
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, ML_SERVICE_URL);
    const postData = JSON.stringify(body);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
      timeout: 30000,
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error('Invalid JSON response from ML service'));
        }
      });
    });

    req.on('error', (e) => reject(e));
    req.on('timeout', () => { req.destroy(); reject(new Error('ML service timeout')); });
    req.write(postData);
    req.end();
  });
}

ipcMain.handle('predict-stock', async (event, { symbol, horizon }) => {
  try {
    return await proxyToMLService('/predict', {
      symbol,
      horizon: horizon || 5,
      include_uncertainty: true,
    });
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('analyze-stock', async (event, { symbol, analysisType }) => {
  try {
    return await proxyToMLService('/analyze', {
      symbol,
      analysis_type: analysisType || 'comprehensive',
    });
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('run-backtest', async (event, params) => {
  try {
    const NODE_API = process.env.NODE_API_URL || 'http://localhost:3001';
    return await new Promise((resolve, reject) => {
      const postData = JSON.stringify(params);
      const url = new URL('/api/backtest', NODE_API);
      const options = {
        hostname: url.hostname, port: url.port, path: url.pathname,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData) },
        timeout: 60000,
      };
      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
        });
      });
      req.on('error', reject);
      req.on('timeout', () => { req.destroy(); reject(new Error('Backtest service timeout')); });
      req.write(postData);
      req.end();
    });
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('show-notification', (event, { title, body }) => {
  const { Notification } = require('electron');
  if (Notification.isSupported()) {
    new Notification({ title, body }).show();
  }
});

ipcMain.handle('get-setting', (event, key) => {
  // 可扩展为 electron-store
  return null;
});

ipcMain.handle('set-setting', (event, key, value) => {
  return true;
});

ipcMain.handle('get-all-settings', () => {
  return {};
});
