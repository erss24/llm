/**
 * LLM服务 - 处理与DashScope API的通信
 * 后端实现，保护API密钥
 */
import axios from 'axios';

const API_BASE_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1';

/**
 * 创建聊天完成请求
 * @param {Array} messages - 聊天消息历史
 * @param {Function} onUpdate - 流式响应更新回调
 * @param {Function} onThinking - 思考过程更新回调（可选）
 * @param {AbortSignal} signal - 用于中止请求的信号
 * @returns {Promise} 完成的响应
 */
export async function createLLMChatCompletion(messages, onUpdate, onThinking, signal) {
  try {
    // 从环境变量获取API密钥
    const API_KEY = process.env.DASHSCOPE_API_KEY;
    
    if (!API_KEY) {
      throw new Error('API密钥未配置');
    }
    
    const response = await fetch(`${API_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-r1',
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        stream: true
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
    let thinkingContent = '';
    let isThinking = false;

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
            
            if (json.choices && json.choices[0].delta && (json.choices[0].delta.content || json.choices[0].delta.reasoning_content)) {
              const content = json.choices[0].delta.content;
              const reasoning_content = json.choices[0].delta.reasoning_content;
              
              // 检测思考过程的开始和结束
              if (reasoning_content && !isThinking) {
                isThinking = true;
                thinkingContent = '';
                continue;
              } else if (content && isThinking) {
                isThinking = false;
                continue;
              }
              
              // 根据当前状态更新不同的内容
              if (isThinking) {
                thinkingContent += reasoning_content;
                if (onThinking) {
                  onThinking(thinkingContent);
                }
              } else if (content) {
                fullResponse += content;
                onUpdate(fullResponse);
              }
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
  }
}