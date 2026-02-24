/**
 * 聊天功能模块
 */

// 发送消息
async function sendMessage() {
  const messageInput = document.getElementById('messageInput');
  const message = messageInput.value.trim();
  const files = AppState.pendingFiles.slice();
  
  if (!message && files.length === 0) return;
  
  // 确保有当前对话（必须在hideWelcomeScreen之前，避免createNewChat重新显示欢迎屏幕）
  if (!AppState.currentChatId) {
    const chatId = Date.now().toString();
    AppState.currentChatId = chatId;
    AppState.chatHistory.unshift({
      id: chatId,
      title: '新对话',
      time: new Date().toISOString(),
      messages: []
    });
    saveChatHistory();
    renderChatHistory();
  }
  
  // 隐藏欢迎屏幕
  hideWelcomeScreen();
  
  // 清空输入框和文件
  messageInput.value = '';
  messageInput.style.height = 'auto';
  AppState.pendingFiles = [];
  renderFilePreview();
  
  // 构建附件信息
  const attachments = files.map(f => ({
    name: f.name,
    size: f.size,
    type: f.type,
    dataUrl: f.type.startsWith('image/') ? URL.createObjectURL(f) : null
  }));
  
  // 显示用户消息
  appendMessage('user', message || '⁨', attachments);
  
  // 保存到历史（不存dataUrl，只存元数据）
  const storedAttachments = files.map(f => ({ name: f.name, size: f.size, type: f.type }));
  saveMessageToHistory('user', message || `[文件] ${files.map(f=>f.name).join(', ')}`, storedAttachments);
  
  // 构建AI发送消息
  let aiMessage = message || '';
  if (files.length > 0) {
    const fileDesc = files.map(f => `文件: ${f.name} (${formatFileSize(f.size)})`).join('\n');
    aiMessage = aiMessage ? `${aiMessage}\n\n附件:\n${fileDesc}` : fileDesc;
  }
  
  // 显示加载动画
  showTypingIndicator();
  
  try {
    // 调用AI接口
    const response = await callAIAPI(aiMessage);
    
    // 移除加载动画
    removeTypingIndicator();
    
    // 显示AI回复
    appendMessage('assistant', response);
    
    // 保存到历史
    saveMessageToHistory('assistant', response);
    
    // 更新对话标题（第一条消息）
    updateChatTitle(message || files[0]?.name || '新对话');
    
  } catch (error) {
    removeTypingIndicator();
    appendMessage('assistant', '抱歉，我遇到了一些问题。请稍后再试。');
    console.error('AI API Error:', error);
  }
}

// 添加消息到界面
function appendMessage(role, content, attachments = null, animate = true) {
  const messagesContainer = document.getElementById('messagesContainer');
  if (!messagesContainer) return;
  
  // 兼容旧调用: appendMessage(role, content, false)
  if (typeof attachments === 'boolean') {
    animate = attachments;
    attachments = null;
  }
  
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${role}`;
  if (animate) {
    messageDiv.classList.add('fade-in');
  }
  
  const avatar = role === 'assistant' 
    ? '<i class="fas fa-robot"></i>' 
    : '<i class="fas fa-user"></i>';
  
  // 构建附件HTML
  let attachHtml = '';
  if (attachments && attachments.length > 0) {
    attachHtml = '<div class="message-attachments">';
    attachments.forEach(att => {
      if (att.type && att.type.startsWith('image/') && att.dataUrl) {
        attachHtml += `<div class="msg-attachment"><img src="${att.dataUrl}" alt="${escapeHtml(att.name)}"></div>`;
      } else {
        const icon = typeof getFileIcon === 'function' ? getFileIcon(att.name) : 'fa-file';
        const size = typeof formatFileSize === 'function' ? formatFileSize(att.size) : '';
        attachHtml += `<div class="msg-attachment"><i class="att-icon fas ${icon}"></i><span class="att-name">${escapeHtml(att.name)}</span><span class="att-size">${size}</span></div>`;
      }
    });
    attachHtml += '</div>';
  }
  
  const textContent = content && content !== '\u2068' ? formatMessage(content) : '';
  
  messageDiv.innerHTML = `
    <div class="message-avatar">
      ${avatar}
    </div>
    <div class="message-content">
      ${attachHtml}
      ${textContent ? `<div class="message-bubble">${textContent}</div>` : ''}
      <div class="message-time">${getCurrentTime()}</div>
    </div>
  `;
  
  messagesContainer.appendChild(messageDiv);
  
  // 滚动到底部
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// 格式化消息内容
function formatMessage(content) {
  // 处理换行
  let formatted = content.replace(/\n/g, '<br>');
  
  // 处理代码块
  formatted = formatted.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
    return `<pre><code class="language-${lang || 'text'}">${escapeHtml(code.trim())}</code></pre>`;
  });
  
  // 处理行内代码
  formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');
  
  // 处理粗体
  formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  
  // 处理链接
  formatted = formatted.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
  
  return formatted;
}

// HTML转义
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

// 获取当前时间
function getCurrentTime() {
  const now = new Date();
  return now.toLocaleTimeString('zh-CN', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
}

// 显示加载动画
function showTypingIndicator() {
  const messagesContainer = document.getElementById('messagesContainer');
  if (!messagesContainer) return;
  
  const indicator = document.createElement('div');
  indicator.className = 'message assistant typing-message';
  indicator.innerHTML = `
    <div class="message-avatar">
      <i class="fas fa-robot"></i>
    </div>
    <div class="message-content">
      <div class="message-bubble">
        <div class="typing-indicator">
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
        </div>
      </div>
    </div>
  `;
  
  messagesContainer.appendChild(indicator);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// 移除加载动画
function removeTypingIndicator() {
  const indicator = document.querySelector('.typing-message');
  if (indicator) {
    indicator.remove();
  }
}

// 保存消息到历史
function saveMessageToHistory(role, content, attachments = null) {
  // 静默创建对话数据，不触发UI变化（避免showWelcomeScreen清空消息）
  if (!AppState.currentChatId) {
    const chatId = Date.now().toString();
    AppState.currentChatId = chatId;
    AppState.chatHistory.unshift({
      id: chatId,
      title: '新对话',
      time: new Date().toISOString(),
      messages: []
    });
  }
  
  const chat = AppState.chatHistory.find(c => c.id === AppState.currentChatId);
  if (chat) {
    const msg = { role, content, time: new Date().toISOString() };
    if (attachments && attachments.length > 0) {
      msg.attachments = attachments;
    }
    chat.messages.push(msg);
    chat.time = msg.time;
    saveChatHistory();
    renderChatHistory();
  }
}

// 更新对话标题
function updateChatTitle(firstMessage) {
  const chat = AppState.chatHistory.find(c => c.id === AppState.currentChatId);
  if (chat && chat.messages.length === 1) {
    // 使用第一条消息的前20个字符作为标题
    chat.title = firstMessage.substring(0, 20) + (firstMessage.length > 20 ? '...' : '');
    saveChatHistory();
    renderChatHistory();
  }
}
