# 📡 API配置指南

**更新日期**: 2026-02-21  
**适用范围**: In Fortune AI桌面应用  
**状态**: ✅ **真实可用**

---

## 🎯 功能概述

In Fortune AI现已集成真实的AI API调用系统，支持多个主流AI提供商：

- **豆包AI** (字节跳动) - **推荐** ⭐
- **OpenAI** (GPT系列)
- **通义千问** (阿里云)
- **文心一言** (百度)
- **本地模拟** (测试用)

---

## 🚀 快速开始

### 方式1: 使用豆包AI（推荐）

#### 1. 获取API Key

1. **访问火山引擎控制台**
   - 网址: https://console.volcengine.com/ark
   
2. **创建API Key**
   - 登录后进入"API密钥管理"
   - 点击"创建API密钥"
   - 复制生成的API Key（格式类似: `ak-xxxxx`）

3. **获取模型ID**
   - 进入"在线推理"
   - 选择"接入点管理"
   - 找到你的模型端点ID（例如: `ep-20241220182157-9hlpb`）

#### 2. 配置应用

1. **打开设置页面**
   - 启动In Fortune AI应用
   - 点击右下角设置图标 ⚙️

2. **进入数据源设置**
   - 点击左侧"数据源"选项

3. **配置AI提供商**
   - 选择 "豆包AI（字节跳动）"
   - 粘贴API Key
   - 点击"测试连接"验证

4. **保存配置**
   - 配置自动保存到本地
   - 关闭设置页面

#### 3. 开始使用

- 返回主界面
- 在聊天框输入问题
- 系统自动调用豆包AI

---

### 方式2: 使用OpenAI

#### 1. 获取API Key

1. **访问OpenAI平台**
   - 网址: https://platform.openai.com/api-keys
   
2. **创建API Key**
   - 登录OpenAI账号
   - 点击"Create new secret key"
   - 复制API Key（格式: `sk-xxxxx`）

#### 2. 配置应用

```
设置 → 数据源 → AI提供商
选择: OpenAI
API Key: sk-xxxxx...
点击: 测试连接
```

---

### 方式3: 使用通义千问

#### 1. 获取API Key

1. **访问阿里云DashScope**
   - 网址: https://dashscope.console.aliyun.com/
   
2. **获取API Key**
   - 登录阿里云账号
   - 进入"API-KEY管理"
   - 创建并复制API Key

#### 2. 配置应用

```
设置 → 数据源 → AI提供商
选择: 通义千问（阿里云）
API Key: sk-xxxxx...
点击: 测试连接
```

---

### 方式4: 使用文心一言

#### 1. 获取API Key

1. **访问百度智能云**
   - 网址: https://console.bce.baidu.com/qianfan/
   
2. **创建应用**
   - 进入"应用接入"
   - 创建应用并获取API Key和Secret Key

#### 2. 配置应用

```
设置 → 数据源 → AI提供商
选择: 文心一言（百度）
API Key: 你的API Key
点击: 测试连接
```

---

## 🔧 配置文件位置

### API配置脚本

```
desktop-app/
├── scripts/
│   ├── api-config.js     ⭐ API提供商配置
│   ├── api-client.js     ⭐ API客户端实现
│   └── api.js            ⭐ 统一API入口
```

### 配置存储

- **位置**: LocalStorage
- **键名**: `InFortune_api_config`
- **数据**:
```json
{
  "provider": "doubao",
  "apiKey": "your-api-key",
  "custom": {}
}
```

---

## 📝 修改默认配置

### 更改默认提供商

编辑 `scripts/api-config.js`:

```javascript
class APIConfiguration {
  constructor() {
    this.currentProvider = 'doubao'; // 修改这里
    // ...
  }
}
```

### 更改默认模型

编辑 `scripts/api-config.js`:

```javascript
doubao: {
  // ...
  defaultModel: 'ep-20241220182157-9hlpb', // 修改这里
  // ...
}
```

### 添加自定义提供商

在 `API_PROVIDERS` 对象中添加:

```javascript
const API_PROVIDERS = {
  // ... 现有提供商
  
  // 自定义提供商
  custom: {
    name: '自定义AI',
    baseURL: 'https://your-api.com/v1',
    chatEndpoint: '/chat/completions',
    defaultModel: 'your-model',
    headers: {
      'Content-Type': 'application/json'
    },
    timeout: 60000,
    maxRetries: 3,
    streamSupport: true
  }
};
```

---

## 🔑 API Key 管理

### 安全性

✅ **API Key存储在本地** - 仅保存在您的电脑  
✅ **不会上传到服务器** - 完全本地化  
✅ **密码输入框** - 输入时隐藏显示  

⚠️ **注意事项**:
- 不要分享您的API Key
- 定期更换API Key
- 不要在公共电脑上保存

### 重置配置

1. 打开浏览器开发者工具（F12）
2. 进入Console
3. 输入:
```javascript
localStorage.removeItem('InFortune_api_config');
location.reload();
```

---

## 🧪 测试API连接

### 方式1: 在设置中测试

1. 打开设置 → 数据源
2. 配置API提供商和Key
3. 点击"测试连接"按钮
4. 查看测试结果

### 方式2: 控制台测试

```javascript
// 打开开发者工具Console
const client = getAPIClient();

// 测试连接
client.testConnection().then(result => {
  console.log(result);
});

// 发送测试消息
client.sendChatRequest([
  { role: 'user', content: '你好' }
]).then(response => {
  console.log(response.content);
});
```

---

## 📊 支持的功能

### 基础对话

✅ 单轮对话  
✅ 多轮对话（带历史）  
✅ 流式响应  
✅ 自动重试  
✅ 超时处理  
✅ 错误提示  

### 高级功能

✅ 多提供商切换  
✅ 自定义参数（temperature等）  
✅ Token使用统计  
✅ 请求队列管理  
✅ 降级到模拟响应  

---

## 🔍 故障排查

### 问题1: 连接失败

**症状**: 测试连接显示失败

**可能原因**:
- API Key错误
- 网络问题
- 提供商服务异常

**解决方案**:
1. 检查API Key是否正确
2. 确认网络连接正常
3. 尝试切换其他提供商
4. 查看Console错误信息

### 问题2: 响应慢

**症状**: 等待时间过长

**可能原因**:
- 网络延迟
- API服务器负载高
- 请求超时设置过长

**解决方案**:
1. 检查网络速度
2. 降低超时时间
3. 使用其他提供商

### 问题3: API Key无效

**症状**: 显示"API Key无效"

**解决方案**:
1. 重新获取API Key
2. 检查复制是否完整
3. 确认Key未过期
4. 联系提供商支持

---

## 💰 费用说明

### 豆包AI

- **计费方式**: 按Token计费
- **参考价格**: 详见火山引擎官网
- **免费额度**: 新用户可能有免费试用

### OpenAI

- **计费方式**: 按Token计费
- **参考价格**: 
  - GPT-3.5-turbo: $0.002/1K tokens
  - GPT-4: $0.03/1K tokens

### 通义千问

- **计费方式**: 按调用次数或Token
- **免费额度**: 有一定免费额度

### 文心一言

- **计费方式**: 按调用次数
- **免费额度**: 新用户免费试用

---

## 📚 相关文档

1. **API配置**: `scripts/api-config.js`
2. **API客户端**: `scripts/api-client.js`
3. **使用示例**: `scripts/api.js`
4. **设置界面**: `settings.html`

---

## 🎯 最佳实践

### 1. 选择合适的提供商

- **国内用户**: 推荐豆包/通义千问/文心一言
- **国际用户**: 推荐OpenAI
- **测试开发**: 使用Mock模式

### 2. 控制成本

- 设置合理的`maxTokens`
- 避免过长的对话历史
- 使用成本较低的模型

### 3. 保证体验

- 启用流式响应（实时显示）
- 设置合理的超时时间
- 添加错误重试机制

---

## 🆘 获取帮助

### 官方文档

- **豆包**: https://www.volcengine.com/docs/82379
- **OpenAI**: https://platform.openai.com/docs
- **通义千问**: https://help.aliyun.com/zh/dashscope/
- **文心一言**: https://cloud.baidu.com/doc/WENXINWORKSHOP/

### 技术支持

- 查看Console日志
- 检查网络请求
- 参考错误代码

---

## ✅ 验收检查

配置完成后，应该能够：

- [x] 在设置中选择AI提供商
- [x] 输入并保存API Key
- [x] 测试连接成功
- [x] 在主界面发送消息
- [x] 收到AI响应
- [x] 查看使用统计

---

**配置完成后，即可享受真实的AI对话体验！** 🎉

**文档更新**: 2026-02-21  
**作者**: Cascade  
**版本**: 1.0.0
