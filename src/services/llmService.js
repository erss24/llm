/**
 * LLM服务 - 处理与DashScope API的通信
 */
import axios from 'axios';

const API_BASE_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1';
const API_KEY = import.meta.env.VITE_DASHSCOPE_API_KEY;

/**
 * 创建聊天完成请求
 * @param {Array} messages - 聊天消息历史
 * @param {Function} onUpdate - 流式响应更新回调
 * @returns {Promise} 完成的响应
 */
export async function createChatCompletion(messages, onUpdate) {
  // console.log('API_KEY:', API_KEY);
  try {
    const response = await fetch(`${API_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: 'qwq-32b',
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        stream: true
      })
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
            const json = JSON.parse(jsonStr);
            
            if (json.choices && json.choices[0].delta && json.choices[0].delta.content) {
              const content = json.choices[0].delta.content;
              fullResponse += content;
              onUpdate(fullResponse);
            }
          }
        } catch (e) {
          console.error('解析流式响应时出错:', e, line);
        }
      }
    }
    
    return fullResponse;
  } catch (error) {
    console.error('调用LLM API时出错:', error);
    throw error;
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
  console.log(lastStreamingMessageIndex, isStreaming, JSON.parse(localStorage.getItem('chat')));
  if (isStreaming && lastStreamingMessageIndex >= 0) {
    console.log('检测到未完成的流式消息，正在标记为已完成...');
    completeCallback(lastStreamingMessageIndex);
  }
}