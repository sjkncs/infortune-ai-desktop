/**
 * Preload Script - 安全的 IPC 桥接层
 * 
 * 解决问题: main.js 中 nodeIntegration: true + contextIsolation: false
 *           是严重的安全漏洞，任何XSS都能获得完整的Node.js权限。
 * 
 * 修复方案: 启用 contextIsolation, 通过 contextBridge 暴露安全API
 */

const { contextBridge, ipcRenderer } = require('electron')

// ============================================
// 安全暴露的 API
// ============================================

contextBridge.exposeInMainWorld('electronAPI', {
  // --- 窗口控制 ---
  minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
  maximizeWindow: () => ipcRenderer.invoke('maximize-window'),
  closeWindow: () => ipcRenderer.invoke('close-window'),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),

  // --- 应用模式 (双模式架构) ---
  getAppMode: () => ipcRenderer.invoke('get-app-mode'),
  switchMode: (mode) => ipcRenderer.invoke('switch-mode', mode),
  reloadApp: () => ipcRenderer.invoke('reload-app'),

  // --- 服务健康检查 ---
  checkServices: () => ipcRenderer.invoke('check-services'),

  // --- 设置存储 (安全的本地存储) ---
  getSetting: (key) => ipcRenderer.invoke('get-setting', key),
  setSetting: (key, value) => ipcRenderer.invoke('set-setting', key, value),
  getAllSettings: () => ipcRenderer.invoke('get-all-settings'),

  // --- ML推理服务调用 (通过主进程代理) ---
  predictStock: (symbol, horizon) => ipcRenderer.invoke('predict-stock', { symbol, horizon }),
  analyzeStock: (symbol, analysisType) => ipcRenderer.invoke('analyze-stock', { symbol, analysisType }),

  // --- 回测服务 ---
  runBacktest: (params) => ipcRenderer.invoke('run-backtest', params),

  // --- 通用 HTTP 代理 (可扩展，仅限 localhost) ---
  httpRequest: (opts) => ipcRenderer.invoke('http-request', opts),

  // --- 实时数据 ---
  onMarketData: (callback) => {
    const subscription = (_event, data) => callback(data)
    ipcRenderer.on('market-data-update', subscription)
    return () => ipcRenderer.removeListener('market-data-update', subscription)
  },

  onStockAlert: (callback) => {
    const subscription = (_event, data) => callback(data)
    ipcRenderer.on('stock-alert', subscription)
    return () => ipcRenderer.removeListener('stock-alert', subscription)
  },

  // --- 系统通知 ---
  showNotification: (title, body) => ipcRenderer.invoke('show-notification', { title, body }),

  // --- 文件操作 (受限) ---
  exportData: (format, data) => ipcRenderer.invoke('export-data', { format, data }),

  // --- 平台信息 ---
  platform: process.platform,
  isDesktop: true,
})
