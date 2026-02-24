/**
 * API配置管理模块
 * API Configuration Management
 */

// ==================== 模型目录 ====================
const MODEL_CATALOG = [
  // --- 对话模型 ---
  { id: 'gemini-3-flash',    name: 'Gemini 3 Flash',      category: '对话',   desc: '性价比最高，价格约为2.5pro一半', icon: 'fa-bolt' },
  { id: 'gemini-2.5-pro',    name: 'Gemini 2.5 Pro',      category: '对话',   desc: '100w上下文，默认返回思维链，带搜索', icon: 'fa-brain' },
  { id: 'gemini-3-pro',      name: 'Gemini 3 Pro',        category: '对话',   desc: '最新pro模型，价格稍高', icon: 'fa-star' },
  { id: 'gemini-2.5-flash',  name: 'Gemini 2.5 Flash',    category: '对话',   desc: '快速响应模型', icon: 'fa-bolt' },
  // --- 带搜索功能 ---
  { id: 'gemini-3-pro-search',    name: 'Gemini 3 Pro Search',    category: '搜索', desc: '可直接搜索实时信息', icon: 'fa-search' },
  { id: 'gemini-2.5-pro-search',  name: 'Gemini 2.5 Pro Search',  category: '搜索', desc: '可直接搜索实时信息', icon: 'fa-search' },
  { id: 'gemini-2.5-flash-search',name: 'Gemini 2.5 Flash Search',category: '搜索', desc: '快速搜索模型', icon: 'fa-search' },
  { id: 'gemini-3-flash-search',  name: 'Gemini 3 Flash Search',  category: '搜索', desc: '快速搜索模型', icon: 'fa-search' },
  // --- 工具调用模型 ---
  { id: 'gemini-3-pro-no',      name: 'Gemini 3 Pro (Tool)',      category: '工具', desc: '关闭搜索，可自定义工具', icon: 'fa-wrench' },
  { id: 'gemini-2.5-pro-no',    name: 'Gemini 2.5 Pro (Tool)',    category: '工具', desc: '关闭搜索，可自定义工具', icon: 'fa-wrench' },
  { id: 'gemini-2.5-flash-no',  name: 'Gemini 2.5 Flash (Tool)', category: '工具', desc: '关闭搜索，可自定义工具', icon: 'fa-wrench' },
  { id: 'gemini-3-flash-no',    name: 'Gemini 3 Flash (Tool)',   category: '工具', desc: '关闭搜索，可自定义工具', icon: 'fa-wrench' },
  // --- GPT / Grok ---
  { id: 'gpt-5',     name: 'GPT-5',     category: 'GPT',  desc: 'OpenAI最新旗舰模型', icon: 'fa-robot' },
  { id: 'gpt-4o',    name: 'GPT-4o',    category: 'GPT',  desc: 'OpenAI多模态模型', icon: 'fa-robot' },
  { id: 'gpt-5.2',   name: 'GPT-5.2',   category: 'GPT',  desc: 'OpenAI进阶版', icon: 'fa-robot' },
  { id: 'grok-4',    name: 'Grok-4',    category: 'GPT',  desc: 'xAI Grok模型', icon: 'fa-meteor' },
  // --- 生图模型 ---
  { id: 'gemini-2.5-flash-image-preview', name: 'Gemini Flash 生图', category: '生图', desc: '约4分一次，建议英文提示词', icon: 'fa-image' },
  { id: 'gemini-3-pro-image-preview',     name: 'Gemini Pro 生图',   category: '生图', desc: '高质量生图，约三毛一次', icon: 'fa-image' },
];

// API提供商配置
const API_PROVIDERS = {
  // 豆包 (字节跳动)
  doubao: {
    name: '豆包AI',
    baseURL: 'https://ark.cn-beijing.volces.com/api/v3',
    chatEndpoint: '/chat/completions',
    modelEndpoint: '/models',
    defaultModel: 'ep-20241220182157-9hlpb', // 替换为你的模型ID
    headers: {
      'Content-Type': 'application/json'
    },
    timeout: 60000,
    maxRetries: 3,
    streamSupport: true
  },
  
  // OpenAI
  openai: {
    name: 'OpenAI',
    baseURL: 'https://api.openai.com/v1',
    chatEndpoint: '/chat/completions',
    modelEndpoint: '/models',
    defaultModel: 'gpt-3.5-turbo',
    headers: {
      'Content-Type': 'application/json'
    },
    timeout: 60000,
    maxRetries: 3,
    streamSupport: true
  },
  
  // 通义千问 (阿里云)
  qwen: {
    name: '通义千问',
    baseURL: 'https://dashscope.aliyuncs.com/api/v1',
    chatEndpoint: '/services/aigc/text-generation/generation',
    modelEndpoint: '/models',
    defaultModel: 'qwen-plus',
    headers: {
      'Content-Type': 'application/json'
    },
    timeout: 60000,
    maxRetries: 3,
    streamSupport: true
  },
  
  // 文心一言 (百度)
  wenxin: {
    name: '文心一言',
    baseURL: 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1',
    chatEndpoint: '/wenxinworkshop/chat/completions',
    modelEndpoint: '/wenxinworkshop/models',
    defaultModel: 'ERNIE-Bot',
    headers: {
      'Content-Type': 'application/json'
    },
    timeout: 60000,
    maxRetries: 3,
    streamSupport: true
  },
  
  // hiapi.online (In Fortune AI默认)
  hiapi: {
    name: 'HiAPI (多模型)',
    baseURL: 'https://hiapi.online/v1',
    chatEndpoint: '/chat/completions',
    modelEndpoint: '/models',
    defaultModel: 'gemini-2.5-flash-search',
    headers: {
      'Content-Type': 'application/json'
    },
    timeout: 60000,
    maxRetries: 3,
    streamSupport: true
  },

  // 后端代理 (推荐 - 通过Node.js后端转发，无需客户端配置API Key)
  backend: {
    name: '后端代理(推荐)',
    baseURL: 'http://localhost:3001/api',
    chatEndpoint: '/chat',
    modelEndpoint: '/health',
    defaultModel: 'backend-proxy',
    headers: {
      'Content-Type': 'application/json'
    },
    timeout: 65000,
    maxRetries: 1,
    streamSupport: false
  },

  // 本地Mock (开发测试用)
  mock: {
    name: '本地模拟',
    baseURL: 'http://localhost:3001/api',
    chatEndpoint: '/chat',
    modelEndpoint: '/models',
    defaultModel: 'mock-model',
    headers: {
      'Content-Type': 'application/json'
    },
    timeout: 5000,
    maxRetries: 1,
    streamSupport: false
  }
};

// 当前API配置类
class APIConfiguration {
  constructor() {
    this.currentProvider = 'doubao'; // 默认使用豆包
    this.apiKey = '';
    this.customConfig = {};
    this.loadConfig();
  }
  
  // 从LocalStorage加载配置
  loadConfig() {
    try {
      const saved = localStorage.getItem('InFortune_api_config');
      if (saved) {
        const config = JSON.parse(saved);
        this.currentProvider = config.provider || 'doubao';
        this.apiKey = config.apiKey || '';
        this.customConfig = config.custom || {};
      }
    } catch (error) {
      console.error('加载API配置失败:', error);
    }
  }
  
  // 保存配置到LocalStorage
  saveConfig() {
    try {
      const config = {
        provider: this.currentProvider,
        apiKey: this.apiKey,
        custom: this.customConfig
      };
      localStorage.setItem('InFortune_api_config', JSON.stringify(config));
    } catch (error) {
      console.error('保存API配置失败:', error);
    }
  }
  
  // 设置API提供商
  setProvider(provider) {
    if (!API_PROVIDERS[provider]) {
      throw new Error(`不支持的API提供商: ${provider}`);
    }
    this.currentProvider = provider;
    this.saveConfig();
  }
  
  // 设置API Key
  setAPIKey(key) {
    this.apiKey = key;
    this.saveConfig();
  }
  
  // 获取/设置当前选中的模型
  getSelectedModel() {
    try {
      return localStorage.getItem('InFortune_selected_model') || 'gemini-2.5-flash-search';
    } catch { return 'gemini-2.5-flash-search'; }
  }
  
  setSelectedModel(modelId) {
    try { localStorage.setItem('InFortune_selected_model', modelId); } catch {}
  }
  
  // 获取模型目录
  getModelCatalog() {
    return MODEL_CATALOG;
  }
  
  // 按分类获取模型
  getModelsByCategory() {
    const cats = {};
    MODEL_CATALOG.forEach(m => {
      if (!cats[m.category]) cats[m.category] = [];
      cats[m.category].push(m);
    });
    return cats;
  }
  
  // 获取当前提供商配置
  getProviderConfig() {
    return API_PROVIDERS[this.currentProvider];
  }
  
  // 获取完整的请求URL
  getEndpointURL(endpoint) {
    const config = this.getProviderConfig();
    return `${config.baseURL}${endpoint}`;
  }
  
  // 获取请求头
  getHeaders() {
    const config = this.getProviderConfig();
    const headers = { ...config.headers };
    
    // 添加API Key
    if (this.apiKey) {
      if (this.currentProvider === 'doubao') {
        headers['Authorization'] = `Bearer ${this.apiKey}`;
      } else if (this.currentProvider === 'openai') {
        headers['Authorization'] = `Bearer ${this.apiKey}`;
      } else if (this.currentProvider === 'qwen') {
        headers['Authorization'] = `Bearer ${this.apiKey}`;
      } else if (this.currentProvider === 'wenxin') {
        // 百度的认证方式不同，需要在URL中添加access_token
        // 这里简化处理
        headers['Authorization'] = `Bearer ${this.apiKey}`;
      }
    }
    
    return headers;
  }
  
  // 验证配置是否完整
  isValid() {
    if (this.currentProvider === 'mock') {
      return true; // Mock模式不需要API Key
    }
    return !!this.apiKey;
  }
  
  // 获取所有可用的提供商
  getAvailableProviders() {
    return Object.keys(API_PROVIDERS).map(key => ({
      id: key,
      name: API_PROVIDERS[key].name,
      current: key === this.currentProvider
    }));
  }
}

// 创建全局配置实例
const apiConfig = new APIConfiguration();

// 导出配置和提供商信息
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    API_PROVIDERS,
    APIConfiguration,
    apiConfig
  };
}
