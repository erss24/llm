/**
 * LLM服务 - 处理与后端API的通信
 */
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

// 创建一个全局的AbortController实例
let abortController = null;

// 生成唯一的会话ID
const sessionId = 'session_' + Date.now();

/**
 * 中断当前正在进行的请求
 */
export function abortCurrentRequest() {
  if (abortController) {
    abortController.abort();
    abortController = null;
    
    // 通知后端中止请求
    fetch(`${API_BASE_URL}/abort`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ sessionId })
    }).catch(error => {
      console.error('中止请求时出错:', error);
    });
  }
}

/**
 * 创建聊天完成请求
 * @param {Array} messages - 聊天消息历史
 * @param {Function} onUpdate - 流式响应更新回调
 * @param {Function} onThinking - 思考过程更新回调（可选）
 * @returns {Promise} 完成的响应
 */
export async function createChatCompletion(messages, onUpdate, onThinking) {
  // 创建新的AbortController
  abortController = new AbortController();
  const signal = abortController.signal;
  
  try {
    // 发送请求到后端API
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        sessionId
      }),
      signal // 添加AbortController的signal
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let fullResponse = '';
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      
      // 处理缓冲区中的数据行
      const lines = buffer.split('\n');
      buffer = lines.pop(); // 保留最后一个可能不完整的行
      
      for (const line of lines) {
        if (line.trim() === '') continue;
        if (line.trim() === 'data: [DONE]') continue;
        
        try {
          // 移除"data: "前缀并解析JSON
          if (line.startsWith('data: ')) {
            const jsonStr = line.replace(/^data: /, '').trim();
            const data = JSON.parse(jsonStr);
            
            // 根据类型处理不同的内容
            if (data.type === 'content') {
              fullResponse = data.content;
              onUpdate(fullResponse);
            } else if (data.type === 'thinking' && onThinking) {
              onThinking(data.content);
            } else if (data.type === 'error') {
              console.error('服务器返回错误:', data.error);
              throw new Error(data.error);
            }
          }
        } catch (e) {
          console.error('解析流式响应时出错:', e, line);
        }
      }
    }
    
    return fullResponse;
  } catch (error) {
    // 检查是否是因为中断导致的错误
    if (error.name === 'AbortError') {
      return ''; // 返回空字符串表示请求被中断
    }
    console.error('调用LLM API时出错:', error);
    throw error;
  } finally {
    // 清理AbortController
    abortController = null;
  }
}

/**
 * 检查并处理未完成的流式消息
 * 在页面加载时调用此函数，检查是否有未完成的流式消息
 * @param {Function} completeCallback - 完成回调函数，用于标记消息为已完成
 */
export function checkIncompleteStreaming(completeCallback) {
  // 检查是否有未完成的流式消息
  const isStreaming = localStorage.getItem('isStreaming') === 'true';
  const lastStreamingMessageIndex = parseInt(localStorage.getItem('lastStreamingMessageIndex'));
  
  // 如果有未完成的流式消息，则标记为已完成
  if (isStreaming && lastStreamingMessageIndex >= 0) {
    completeCallback(lastStreamingMessageIndex);
  }
}