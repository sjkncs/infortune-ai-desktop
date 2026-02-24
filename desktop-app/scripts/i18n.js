/**
 * 轻量国际化模块
 * Lightweight i18n Module
 */

const I18N = {
  currentLang: 'zh-CN',

  translations: {
    'zh-CN': {}, // 默认语言，直接使用 HTML 中的文本

    'zh-TW': {
      // 導航
      'nav.chat': '智能分析',
      'nav.market': '市場行情',
      'nav.stock': '個股分析',
      'nav.zixuan': '自選分析',
      'nav.portfolio': '持倉分析',
      'nav.zhishu': '指數分析',
      'nav.etf': 'ETF行情',
      'nav.strategy': '策略回測',
      'nav.mode': '模式切換',
      // 側邊欄
      'sidebar.username': '投資者',
      'sidebar.status': '在線',
      'sidebar.history': '歷史對話',
      'sidebar.newchat': '新對話',
      'sidebar.localmode': '本地模式',
      'sidebar.settings': '設置',
      // 歡迎頁
      'welcome.title': '你好，投資者！',
      'welcome.subtitle': '久財AI — 專業的智能股票分析與投資決策助手',
      'welcome.market': '市場概覽',
      'welcome.search': '股票查詢',
      'welcome.technical': '技術分析',
      'welcome.news': '新聞輿情',
      'welcome.ai': 'AI預測',
      'welcome.risk': '風險評估',
      // 功能標籤
      'tag.macd': 'MACD分析',
      'tag.kdj': 'KDJ指標',
      'tag.ma': '均線系統',
      'tag.volume': '成交量分析',
      'tag.bollinger': '布林帶',
      'tag.rsi': 'RSI強弱',
      'tag.support': '支撐位',
      'tag.resistance': '壓力位',
      // 輸入
      'input.placeholder': '請輸入您的問題，例如：分析一下貴州茅台的走勢',
      'input.send': '發送',
      // 設置頁
      'settings.title': '設置',
      'settings.back': '返回',
      'settings.reset': '恢復默認',
      'settings.nav.general': '通用',
      'settings.nav.appearance': '外觀',
      'settings.nav.language': '語言',
      'settings.nav.ai': 'AI配置',
      'settings.nav.data': '數據源',
      'settings.nav.notification': '通知',
      'settings.nav.shortcut': '快捷鍵',
      'settings.nav.advanced': '高級',
      'settings.nav.about': '關於',
      'settings.general.title': '通用設置',
      'settings.general.autolaunch': '開機自啟動',
      'settings.general.autolaunch.desc': '系統啟動時自動打開久財AI',
      'settings.general.tray': '最小化到托盤',
      'settings.general.tray.desc': '關閉窗口時最小化到系統托盤',
      'settings.general.history': '保存聊天記錄',
      'settings.general.history.desc': '自動保存對話歷史',
      'settings.general.historydays': '歷史保留天數',
      'settings.appearance.title': '外觀設置',
      'settings.appearance.theme': '主題模式',
      'settings.appearance.theme.light': '淺色',
      'settings.appearance.theme.dark': '深色',
      'settings.appearance.theme.auto': '跟隨系統',
      'settings.appearance.color': '主題色',
      'settings.appearance.color.custom': '自定義',
      'settings.appearance.fontsize': '字體大小',
      'settings.appearance.inputheight': '輸入框高度',
      'settings.appearance.lineheight': '行間距',
      'settings.appearance.sidebarwidth': '側邊欄寬度',
      'settings.appearance.animations': '動畫效果',
      'settings.appearance.animations.desc': '啟用界面動畫和過渡效果',
      'settings.language.title': '語言設置',
      'settings.language.select': '界面語言',
      'settings.language.select.desc': '選擇應用界面的顯示語言',
      'settings.language.auto': '自動翻譯',
      'settings.language.auto.desc': '自動翻譯AI回復為當前語言',
      'settings.ai.title': 'AI配置',
      'settings.ai.provider': 'AI提供商',
      'settings.ai.apikey': 'API Key',
      'settings.ai.apikey.desc': '您的API密鑰（安全存儲在本地）',
      'settings.ai.test': '測試連接',
      'settings.data.title': '數據源設置',
      'settings.data.apiurl': 'API地址',
      'settings.data.apiurl.desc': '後端API服務地址（股票數據）',
      'settings.data.refresh': '刷新頻率',
      'settings.data.refresh.desc': '數據自動刷新間隔（秒）',
      'settings.data.realtime': '實時數據',
      'settings.data.realtime.desc': '啟用WebSocket實時數據推送',
      'settings.notification.title': '通知設置',
      'settings.notification.desktop': '桌面通知',
      'settings.notification.desktop.desc': '啟用系統桌面通知',
      'settings.notification.sound': '聲音提醒',
      'settings.notification.sound.desc': '通知時播放提示音',
      'settings.notification.price': '價格提醒',
      'settings.notification.price.desc': '股票價格達到設定值時提醒',
      'settings.shortcut.title': '快捷鍵設置',
      'settings.shortcut.desc': '快捷鍵功能開發中，敬請期待...',
      'settings.advanced.title': '高級設置',
      'settings.advanced.devmode': '開發者模式',
      'settings.advanced.devmode.desc': '啟用開發者工具和調試信息',
      'settings.advanced.hwaccel': '硬件加速',
      'settings.advanced.hwaccel.desc': '使用GPU加速渲染（需重啟）',
      'settings.advanced.clearcache': '清除緩存',
      'settings.advanced.clearcache.desc': '清除所有本地緩存數據',
      'settings.advanced.clearcache.btn': '清除',
      'settings.advanced.export': '導出數據',
      'settings.advanced.export.desc': '導出設置和聊天記錄',
      'settings.advanced.export.btn': '導出',
      'settings.about.title': '關於',
    },

    'en-US': {
      // Navigation
      'nav.chat': 'AI Chat',
      'nav.market': 'Market',
      'nav.stock': 'Stocks',
      'nav.zixuan': 'Watchlist',
      'nav.portfolio': 'Portfolio',
      'nav.zhishu': 'Indices',
      'nav.etf': 'ETF',
      'nav.strategy': 'Backtest',
      'nav.mode': 'Mode',
      // Sidebar
      'sidebar.username': 'Investor',
      'sidebar.status': 'Online',
      'sidebar.history': 'Chat History',
      'sidebar.newchat': 'New Chat',
      'sidebar.localmode': 'Local Mode',
      'sidebar.settings': 'Settings',
      // Welcome
      'welcome.title': 'Hello, Investor!',
      'welcome.subtitle': 'InFortune AI — Your Smart Stock Analysis & Investment Assistant',
      'welcome.market': 'Market Overview',
      'welcome.search': 'Stock Search',
      'welcome.technical': 'Technical Analysis',
      'welcome.news': 'News Sentiment',
      'welcome.ai': 'AI Prediction',
      'welcome.risk': 'Risk Assessment',
      // Tags
      'tag.macd': 'MACD',
      'tag.kdj': 'KDJ',
      'tag.ma': 'Moving Avg',
      'tag.volume': 'Volume',
      'tag.bollinger': 'Bollinger',
      'tag.rsi': 'RSI',
      'tag.support': 'Support',
      'tag.resistance': 'Resistance',
      // Input
      'input.placeholder': 'Ask a question, e.g.: Analyze the trend of Kweichow Moutai',
      'input.send': 'Send',
      // Settings
      'settings.title': 'Settings',
      'settings.back': 'Back',
      'settings.reset': 'Reset Defaults',
      'settings.nav.general': 'General',
      'settings.nav.appearance': 'Appearance',
      'settings.nav.language': 'Language',
      'settings.nav.ai': 'AI Config',
      'settings.nav.data': 'Data Source',
      'settings.nav.notification': 'Notifications',
      'settings.nav.shortcut': 'Shortcuts',
      'settings.nav.advanced': 'Advanced',
      'settings.nav.about': 'About',
      'settings.general.title': 'General Settings',
      'settings.general.autolaunch': 'Launch at Startup',
      'settings.general.autolaunch.desc': 'Automatically open InFortune AI when system starts',
      'settings.general.tray': 'Minimize to Tray',
      'settings.general.tray.desc': 'Minimize to system tray when closing window',
      'settings.general.history': 'Save Chat History',
      'settings.general.history.desc': 'Automatically save conversation history',
      'settings.general.historydays': 'History Retention (days)',
      'settings.appearance.title': 'Appearance',
      'settings.appearance.theme': 'Theme',
      'settings.appearance.theme.light': 'Light',
      'settings.appearance.theme.dark': 'Dark',
      'settings.appearance.theme.auto': 'System',
      'settings.appearance.color': 'Accent Color',
      'settings.appearance.color.custom': 'Custom',
      'settings.appearance.fontsize': 'Font Size',
      'settings.appearance.inputheight': 'Input Height',
      'settings.appearance.lineheight': 'Line Height',
      'settings.appearance.sidebarwidth': 'Sidebar Width',
      'settings.appearance.animations': 'Animations',
      'settings.appearance.animations.desc': 'Enable UI animations and transitions',
      'settings.language.title': 'Language',
      'settings.language.select': 'Interface Language',
      'settings.language.select.desc': 'Select the display language for the app',
      'settings.language.auto': 'Auto Translate',
      'settings.language.auto.desc': 'Automatically translate AI responses to current language',
      'settings.ai.title': 'AI Configuration',
      'settings.ai.provider': 'AI Provider',
      'settings.ai.apikey': 'API Key',
      'settings.ai.apikey.desc': 'Your API key (stored securely on local device)',
      'settings.ai.test': 'Test Connection',
      'settings.data.title': 'Data Source',
      'settings.data.apiurl': 'API URL',
      'settings.data.apiurl.desc': 'Backend API service address (stock data)',
      'settings.data.refresh': 'Refresh Rate',
      'settings.data.refresh.desc': 'Auto refresh interval (seconds)',
      'settings.data.realtime': 'Real-time Data',
      'settings.data.realtime.desc': 'Enable WebSocket real-time data push',
      'settings.notification.title': 'Notifications',
      'settings.notification.desktop': 'Desktop Notifications',
      'settings.notification.desktop.desc': 'Enable system desktop notifications',
      'settings.notification.sound': 'Sound Alert',
      'settings.notification.sound.desc': 'Play a sound when notification arrives',
      'settings.notification.price': 'Price Alert',
      'settings.notification.price.desc': 'Alert when stock price reaches a set value',
      'settings.shortcut.title': 'Keyboard Shortcuts',
      'settings.shortcut.desc': 'Keyboard shortcuts coming soon...',
      'settings.advanced.title': 'Advanced',
      'settings.advanced.devmode': 'Developer Mode',
      'settings.advanced.devmode.desc': 'Enable developer tools and debug info',
      'settings.advanced.hwaccel': 'Hardware Acceleration',
      'settings.advanced.hwaccel.desc': 'Use GPU accelerated rendering (requires restart)',
      'settings.advanced.clearcache': 'Clear Cache',
      'settings.advanced.clearcache.desc': 'Clear all local cached data',
      'settings.advanced.clearcache.btn': 'Clear',
      'settings.advanced.export': 'Export Data',
      'settings.advanced.export.desc': 'Export settings and chat history',
      'settings.advanced.export.btn': 'Export',
      'settings.about.title': 'About',
    },

    'ja-JP': {
      // ナビゲーション
      'nav.chat': 'AI分析',
      'nav.market': 'マーケット',
      'nav.stock': '個別株分析',
      'nav.zixuan': 'ウォッチリスト',
      'nav.portfolio': 'ポートフォリオ',
      'nav.zhishu': '指数分析',
      'nav.etf': 'ETF',
      'nav.strategy': 'バックテスト',
      'nav.mode': 'モード切替',
      // サイドバー
      'sidebar.username': '投資家',
      'sidebar.status': 'オンライン',
      'sidebar.history': '履歴',
      'sidebar.newchat': '新規チャット',
      'sidebar.localmode': 'ローカルモード',
      'sidebar.settings': '設定',
      // ウェルカム
      'welcome.title': 'こんにちは、投資家さん！',
      'welcome.subtitle': '久財AI — スマート株式分析＆投資アシスタント',
      'welcome.market': '市場概要',
      'welcome.search': '銘柄検索',
      'welcome.technical': 'テクニカル分析',
      'welcome.news': 'ニュース',
      'welcome.ai': 'AI予測',
      'welcome.risk': 'リスク評価',
      // タグ
      'tag.macd': 'MACD',
      'tag.kdj': 'KDJ',
      'tag.ma': '移動平均',
      'tag.volume': '出来高',
      'tag.bollinger': 'ボリンジャー',
      'tag.rsi': 'RSI',
      'tag.support': 'サポート',
      'tag.resistance': 'レジスタンス',
      // 入力
      'input.placeholder': '質問を入力してください（例：貴州茅台のトレンドを分析）',
      'input.send': '送信',
      // 設定
      'settings.title': '設定',
      'settings.back': '戻る',
      'settings.reset': 'デフォルトに戻す',
      'settings.nav.general': '一般',
      'settings.nav.appearance': '外観',
      'settings.nav.language': '言語',
      'settings.nav.ai': 'AI設定',
      'settings.nav.data': 'データソース',
      'settings.nav.notification': '通知',
      'settings.nav.shortcut': 'ショートカット',
      'settings.nav.advanced': '詳細設定',
      'settings.nav.about': '情報',
      'settings.general.title': '一般設定',
      'settings.general.autolaunch': '自動起動',
      'settings.general.autolaunch.desc': 'システム起動時に自動的に開く',
      'settings.general.tray': 'トレイに最小化',
      'settings.general.tray.desc': 'ウィンドウを閉じるとシステムトレイに格納',
      'settings.general.history': 'チャット履歴を保存',
      'settings.general.history.desc': '会話履歴を自動保存',
      'settings.general.historydays': '履歴保持日数',
      'settings.appearance.title': '外観設定',
      'settings.appearance.theme': 'テーマ',
      'settings.appearance.theme.light': 'ライト',
      'settings.appearance.theme.dark': 'ダーク',
      'settings.appearance.theme.auto': 'システム',
      'settings.appearance.color': 'テーマカラー',
      'settings.appearance.color.custom': 'カスタム',
      'settings.appearance.fontsize': 'フォントサイズ',
      'settings.appearance.inputheight': '入力欄の高さ',
      'settings.appearance.lineheight': '行間',
      'settings.appearance.sidebarwidth': 'サイドバー幅',
      'settings.appearance.animations': 'アニメーション',
      'settings.appearance.animations.desc': 'UIアニメーションとトランジションを有効化',
      'settings.language.title': '言語設定',
      'settings.language.select': 'インターフェース言語',
      'settings.language.select.desc': 'アプリの表示言語を選択',
      'settings.language.auto': '自動翻訳',
      'settings.language.auto.desc': 'AI応答を現在の言語に自動翻訳',
      'settings.ai.title': 'AI設定',
      'settings.ai.provider': 'AIプロバイダー',
      'settings.ai.apikey': 'APIキー',
      'settings.ai.apikey.desc': 'APIキー（ローカルに安全に保存）',
      'settings.ai.test': '接続テスト',
      'settings.data.title': 'データソース設定',
      'settings.data.apiurl': 'APIアドレス',
      'settings.data.apiurl.desc': 'バックエンドAPIサービスアドレス',
      'settings.data.refresh': '更新頻度',
      'settings.data.refresh.desc': '自動更新間隔（秒）',
      'settings.data.realtime': 'リアルタイムデータ',
      'settings.data.realtime.desc': 'WebSocketリアルタイムデータを有効化',
      'settings.notification.title': '通知設定',
      'settings.notification.desktop': 'デスクトップ通知',
      'settings.notification.desktop.desc': 'システム通知を有効化',
      'settings.notification.sound': 'サウンド通知',
      'settings.notification.sound.desc': '通知音を再生',
      'settings.notification.price': '価格アラート',
      'settings.notification.price.desc': '株価が設定値に達したら通知',
      'settings.shortcut.title': 'ショートカットキー',
      'settings.shortcut.desc': 'ショートカットキー機能は開発中です...',
      'settings.advanced.title': '詳細設定',
      'settings.advanced.devmode': '開発者モード',
      'settings.advanced.devmode.desc': '開発者ツールとデバッグ情報を有効化',
      'settings.advanced.hwaccel': 'ハードウェアアクセラレーション',
      'settings.advanced.hwaccel.desc': 'GPU加速レンダリング（再起動が必要）',
      'settings.advanced.clearcache': 'キャッシュクリア',
      'settings.advanced.clearcache.desc': 'ローカルキャッシュデータを全て削除',
      'settings.advanced.clearcache.btn': 'クリア',
      'settings.advanced.export': 'データエクスポート',
      'settings.advanced.export.desc': '設定とチャット履歴をエクスポート',
      'settings.advanced.export.btn': 'エクスポート',
      'settings.about.title': '情報',
    }
  },

  /**
   * 获取翻译文本
   */
  t(key) {
    const lang = this.currentLang;
    if (lang === 'zh-CN') return null; // 默认语言直接用HTML原文
    const dict = this.translations[lang];
    return dict ? (dict[key] || null) : null;
  },

  /**
   * 应用语言到页面
   */
  applyLanguage(lang) {
    if (!lang) lang = this.currentLang;
    this.currentLang = lang;
    document.documentElement.lang = lang;

    // 如果是默认中文，恢复所有 data-i18n 元素的原始文本
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      // 保存原始文本（首次运行时）
      if (!el.hasAttribute('data-i18n-original')) {
        el.setAttribute('data-i18n-original', el.textContent);
      }
      if (lang === 'zh-CN') {
        el.textContent = el.getAttribute('data-i18n-original');
      } else {
        const translated = this.t(key);
        if (translated) el.textContent = translated;
      }
    });

    // 翻译 placeholder
    document.querySelectorAll('[data-i18n-ph]').forEach(el => {
      const key = el.getAttribute('data-i18n-ph');
      if (!el.hasAttribute('data-i18n-ph-original')) {
        el.setAttribute('data-i18n-ph-original', el.placeholder);
      }
      if (lang === 'zh-CN') {
        el.placeholder = el.getAttribute('data-i18n-ph-original');
      } else {
        const translated = this.t(key);
        if (translated) el.placeholder = translated;
      }
    });

    // 翻译 title 属性
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.getAttribute('data-i18n-title');
      if (!el.hasAttribute('data-i18n-title-original')) {
        el.setAttribute('data-i18n-title-original', el.title);
      }
      if (lang === 'zh-CN') {
        el.title = el.getAttribute('data-i18n-title-original');
      } else {
        const translated = this.t(key);
        if (translated) el.title = translated;
      }
    });

    console.log('[i18n] 语言已切换:', lang);
  },

  /**
   * 初始化：从 localStorage 读取语言设置并应用
   */
  init() {
    try {
      const saved = localStorage.getItem('InFortune_settings');
      if (saved) {
        const settings = JSON.parse(saved);
        if (settings.language) {
          this.currentLang = settings.language;
        }
      }
    } catch (e) {
      console.warn('[i18n] 读取语言设置失败:', e);
    }
    if (this.currentLang !== 'zh-CN') {
      this.applyLanguage(this.currentLang);
    }
  }
};

// 页面加载后自动初始化 i18n
document.addEventListener('DOMContentLoaded', () => {
  I18N.init();
});
