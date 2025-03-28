# LLM Chat 应用

一个基于Vue 3和Express的聊天应用，集成了阿里云DashScope API，支持与大型语言模型进行对话交互。

## 功能特点

- 基于通义千问等大型语言模型的智能对话
- 支持流式响应，实时显示AI回复
- 支持深度思考模式，展示AI的推理过程
- 支持多种模型选择（通义千问、DeepSeek等）
- 聊天历史记录持久化存储
- 响应式设计，适配不同设备

## 技术栈

### 前端
- Vue 3 - 渐进式JavaScript框架
- Vite - 现代前端构建工具
- Pinia - Vue的状态管理库
- Element Plus - 基于Vue 3的组件库
- Vue Router - Vue.js的官方路由
- Axios - 基于Promise的HTTP客户端
- Marked & Highlight.js - Markdown渲染和代码高亮

### 后端
- Node.js - JavaScript运行时
- Express - Web应用框架
- Dotenv - 环境变量管理
- Cors - 跨域资源共享

## 安装指南

### 前提条件
- Node.js 16.x 或更高版本
- npm 或 pnpm 包管理器
- 阿里云DashScope API密钥

### 安装步骤

1. 克隆仓库
```bash
git clone https://github.com/yourusername/llm-chat.git
cd llm-chat
```

2. 安装前端依赖
```bash
pnpm install  # 或 npm install
```

3. 安装后端依赖
```bash
cd server
pnpm install  # 或 npm install
cd ..
```

4. 配置环境变量
   - 在`server`目录下创建`.env`文件
   - 添加以下内容（替换为你的API密钥）：
   ```
   DASHSCOPE_API_KEY=your_api_key_here
   PORT=3000
   ```

## 运行应用

1. 启动后端服务器
```bash
cd server
pnpm start  # 或 npm start
```

2. 在另一个终端窗口启动前端开发服务器
```bash
# 在项目根目录下
pnpm dev  # 或 npm run dev
```

3. 在浏览器中访问应用：http://localhost:5173

## 部署

详细的部署指南请参考 [DEPLOYMENT.md](DEPLOYMENT.md) 文件。

## 环境变量配置

### 必需的环境变量
- `DASHSCOPE_API_KEY`: 阿里云DashScope API密钥，用于访问LLM服务

### 可选的环境变量
- `PORT`: 后端服务器端口号，默认为3000

## 许可证

[MIT](LICENSE)
