/**
 * API客户端模块
 * API Client for making requests
 */

// API请求类
class APIClient {
  constructor(config) {
    this.config = config;
    this.requestQueue = [];
    this.isProcessing = false;
  }
  
  /**
   * 发送聊天请求
   * @param {Array} messages - 消息历史
   * @param {Object} options - 可选配置
   * @returns {Promise} 返回AI响应
   */
  async sendChatRequest(messages, options = {}) {
    // 验证配置
    if (!this.config.isValid() && this.config.currentProvider !== 'mock') {
      throw new Error('API配置不完整，请先设置API Key');
    }
    
    const providerConfig = this.config.getProviderConfig();
    const url = this.config.getEndpointURL(providerConfig.chatEndpoint);
    const headers = this.config.getHeaders();
    
    // 构建请求体（适配不同提供商）
    const requestBody = this.buildRequestBody(messages, options);
    
    try {
      const response = await this.fetchWithRetry(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(requestBody)
      }, providerConfig.maxRetries);
      
      return await this.parseResponse(response);
    } catch (error) {
      console.error('API请求失败:', error);
      throw this.handleError(error);
    }
  }
  
  /**
   * 构建请求体（适配不同AI提供商）
   */
  buildRequestBody(messages, options) {
    const providerConfig = this.config.getProviderConfig();
    const provider = this.config.currentProvider;
    
    // 豆包格式
    if (provider === 'doubao') {
      return {
        model: options.model || providerConfig.defaultModel,
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 2000,
        top_p: options.topP || 0.9,
        stream: options.stream || false
      };
    }
    
    // OpenAI格式
    if (provider === 'openai') {
      return {
        model: options.model || providerConfig.defaultModel,
        messages: messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 2000,
        top_p: options.topP || 1,
        stream: options.stream || false
      };
    }
    
    // 通义千问格式
    if (provider === 'qwen') {
      return {
        model: options.model || providerConfig.defaultModel,
        input: {
          messages: messages
        },
        parameters: {
          temperature: options.temperature || 0.7,
          max_tokens: options.maxTokens || 2000,
          top_p: options.topP || 0.8
        }
      };
    }
    
    // 文心一言格式
    if (provider === 'wenxin') {
      return {
        messages: messages,
        temperature: options.temperature || 0.7,
        max_output_tokens: options.maxTokens || 2000,
        top_p: options.topP || 0.8
      };
    }
    
    // Mock格式（开发测试）
    if (provider === 'mock') {
      return {
        message: messages[messages.length - 1].content,
        history: messages.slice(0, -1)
      };
    }
    
    // 默认格式
    return {
      model: providerConfig.defaultModel,
      messages: messages
    };
  }
  
  /**
   * 解析响应（适配不同提供商）
   */
  async parseResponse(response) {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    const provider = this.config.currentProvider;
    
    // 豆包响应格式
    if (provider === 'doubao') {
      return {
        content: data.choices[0]?.message?.content || '',
        model: data.model,
        usage: data.usage,
        finishReason: data.choices[0]?.finish_reason
      };
    }
    
    // OpenAI响应格式
    if (provider === 'openai') {
      return {
        content: data.choices[0]?.message?.content || '',
        model: data.model,
        usage: data.usage,
        finishReason: data.choices[0]?.finish_reason
      };
    }
    
    // 通义千问响应格式
    if (provider === 'qwen') {
      return {
        content: data.output?.text || '',
        model: data.model,
        usage: data.usage,
        finishReason: data.output?.finish_reason
      };
    }
    
    // 文心一言响应格式
    if (provider === 'wenxin') {
      return {
        content: data.result || '',
        usage: data.usage,
        finishReason: data.finish_reason
      };
    }
    
    // Mock响应
    if (provider === 'mock') {
      return {
        content: data.response || '这是一个模拟响应',
        model: 'mock',
        usage: { total_tokens: 0 }
      };
    }
    
    // 默认格式
    return {
      content: data.choices?.[0]?.message?.content || data.response || '',
      model: data.model,
      usage: data.usage
    };
  }
  
  /**
   * 带重试的fetch请求
   */
  async fetchWithRetry(url, options, maxRetries = 3) {
    let lastError;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.config.getProviderConfig().timeout);
        
        const response = await fetch(url, {
          ...options,
          signal: controller.signal
        });
        
        clearTimeout(timeout);
        return response;
        
      } catch (error) {
        lastError = error;
        console.warn(`请求失败，重试 ${i + 1}/${maxRetries}:`, error.message);
        
        // 如果是最后一次重试，抛出错误
        if (i === maxRetries - 1) {
          throw error;
        }
        
        // 指数退避
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
      }
    }
    
    throw lastError;
  }
  
  /**
   * 错误处理
   */
  handleError(error) {
    if (error.name === 'AbortError') {
      return new Error('请求超时，请稍后重试');
    }
    
    if (error.message.includes('401')) {
      return new Error('API Key无效，请检查配置');
    }
    
    if (error.message.includes('429')) {
      return new Error('请求过于频繁，请稍后重试');
    }
    
    if (error.message.includes('500')) {
      return new Error('服务器错误，请稍后重试');
    }
    
    if (error.message.includes('Failed to fetch')) {
      return new Error('网络连接失败，请检查网络设置');
    }
    
    return error;
  }
  
  /**
   * 流式响应（SSE）
   */
  async sendStreamRequest(messages, onChunk, options = {}) {
    if (!this.config.getProviderConfig().streamSupport) {
      throw new Error('当前提供商不支持流式响应');
    }
    
    const providerConfig = this.config.getProviderConfig();
    const url = this.config.getEndpointURL(providerConfig.chatEndpoint);
    const headers = this.config.getHeaders();
    
    const requestBody = this.buildRequestBody(messages, {
      ...options,
      stream: true
    });
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            
            try {
              const parsed = JSON.parse(data);
              const content = this.extractStreamContent(parsed);
              if (content) {
                onChunk(content);
              }
            } catch (e) {
              console.warn('解析流数据失败:', e);
            }
          }
        }
      }
      
    } catch (error) {
      throw this.handleError(error);
    }
  }
  
  /**
   * 从流式响应中提取内容
   */
  extractStreamContent(data) {
    const provider = this.config.currentProvider;
    
    if (provider === 'doubao' || provider === 'openai') {
      return data.choices?.[0]?.delta?.content || '';
    }
    
    if (provider === 'qwen') {
      return data.output?.text || '';
    }
    
    if (provider === 'wenxin') {
      return data.result || '';
    }
    
    return '';
  }
  
  /**
   * 获取可用模型列表
   */
  async getModels() {
    const providerConfig = this.config.getProviderConfig();
    const url = this.config.getEndpointURL(providerConfig.modelEndpoint);
    const headers = this.config.getHeaders();
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: headers
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      return data.data || data.models || [];
      
    } catch (error) {
      console.error('获取模型列表失败:', error);
      return [];
    }
  }
  
  /**
   * 测试API连接
   */
  async testConnection() {
    try {
      const testMessages = [
        { role: 'user', content: '你好' }
      ];
      
      const response = await this.sendChatRequest(testMessages);
      return {
        success: true,
        message: '连接成功',
        response: response.content
      };
      
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }
}

// 创建全局API客户端实例
let apiClient = null;

function getAPIClient() {
  if (!apiClient && typeof apiConfig !== 'undefined') {
    apiClient = new APIClient(apiConfig);
  }
  return apiClient;
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    APIClient,
    getAPIClient
  };
}
