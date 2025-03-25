import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createLLMChatCompletion } from './services/llmService.js';

// 获取当前文件的目录路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 加载环境变量
dotenv.config({ path: join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());

// 全局变量存储当前活跃的请求控制器
let activeRequestControllers = new Map();

// 路由
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, sessionId, modelType, isDeepThinking } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: '无效的消息格式' });
    }

    // 设置响应头，启用流式传输
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // 创建AbortController用于取消请求
    const controller = new AbortController();
    
    // 如果提供了会话ID，存储控制器以便后续可以中止
    if (sessionId) {
      // 如果已存在相同会话的请求，先中止它
      if (activeRequestControllers.has(sessionId)) {
        activeRequestControllers.get(sessionId).abort();
      }
      activeRequestControllers.set(sessionId, controller);
    }

    // 调用LLM服务
    await createLLMChatCompletion(
      messages,
      // 流式更新回调
      (content) => {
        res.write(`data: ${JSON.stringify({ type: 'content', content })}\n\n`);
      },
      // 思考过程回调
      (thinkingContent) => {
        res.write(`data: ${JSON.stringify({ type: 'thinking', content: thinkingContent })}\n\n`);
      },
      controller.signal,
      modelType || 'qwen-plus', // 传递模型类型参数，默认为qwen-plus
      isDeepThinking || false    // 传递深度思考状态参数，默认为false
    );

    // 发送完成信号
    res.write(`data: [DONE]\n\n`);
    res.end();

    // 请求完成后，从活跃控制器映射中移除
    if (sessionId) {
      activeRequestControllers.delete(sessionId);
    }
  } catch (error) {
    console.error('处理聊天请求时出错:', error);
    // 如果响应尚未发送，则发送错误响应
    if (!res.headersSent) {
      res.status(500).json({ error: '处理请求时出错' });
    } else {
      // 如果已经开始流式响应，则发送错误事件
      res.write(`data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`);
      res.end();
    }
  }
});

// 中止请求的路由
app.post('/api/abort', (req, res) => {
  const { sessionId } = req.body;
  
  if (!sessionId) {
    return res.status(400).json({ error: '缺少会话ID' });
  }
  
  if (activeRequestControllers.has(sessionId)) {
    activeRequestControllers.get(sessionId).abort();
    activeRequestControllers.delete(sessionId);
    return res.json({ success: true, message: '请求已中止' });
  }
  
  return res.status(404).json({ error: '未找到活跃的请求' });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});