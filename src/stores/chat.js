import { defineStore } from 'pinia'
import { createChatCompletion, abortCurrentRequest } from '../services/llmService'

export const useChatStore = defineStore('chat', {
  state: () => ({
    messages: JSON.parse(localStorage.getItem('chatMessages')) || [],
    streaming: localStorage.getItem('isStreaming') === 'true' || false,
    loading: false,     // 表示是否正在加载的状态标志
    lastStreamingMessageIndex: parseInt(localStorage.getItem('lastStreamingMessageIndex')) || -1, // 最后一条流式消息的索引
  }),

  actions: {
    /**
     * 添加用户消息到消息列表
     * @param {string} content - 用户发送的消息内容
     */
    addUserMessage(content) {
      this.messages.push({
        role: 'user',                 // 消息角色，这里是用户
        content,                           // 消息内容
        timestamp: new Date().toISOString() // 消息时间戳，采用 ISO 格式
      })
    },

    /**
     * 添加模型（助手）消息到消息列表，并返回该消息的索引
     * @param {string} content - 助手发送的消息内容
     * @returns {number} 新添加消息的索引
     */
    addModelMessage(content, thinkingContent) {
      // 添加助手消息，并设置 streaming 标志为 true 表示消息正在流式传输
      this.messages.push({
        role: 'assistant',                 // 消息角色，这里是助手
        thinkingContent,                   // 思考过程内容
        content,                           // 消息内容
        timestamp: new Date().toISOString(), // 消息时间戳
        streaming: true,                   // 标记消息是否正在流式传输
        error: ''                          // 添加error属性，初始为空字符串
      })
      const messageIndex = this.messages.length - 1
      // 保存最后一条流式消息的索引
      this.lastStreamingMessageIndex = messageIndex
      localStorage.setItem('lastStreamingMessageIndex', messageIndex.toString())
      // 更新全局streaming状态
      this.streaming = true
      localStorage.setItem('isStreaming', 'true')
      // 保存消息到localStorage
      localStorage.setItem('chatMessages', JSON.stringify(this.messages))
      return messageIndex // 返回新添加消息的索引
    },

    /**
     * 更新指定索引处的助手消息内容
     * @param {number} index - 要更新的消息的索引
     * @param {string} content - 新的消息内容
     */
    updateModelMessage(index, content) {
      // 检查索引是否在有效范围内
      if (index >= 0 && index < this.messages.length) {
        this.messages[index].content = content // 更新消息内容
        // 每次更新时保存到localStorage
        localStorage.setItem('chatMessages', JSON.stringify(this.messages))
      }
    },

    /**
     * 更新思考过程内容
     * @param {string} content - 新的思考过程内容
     */
    updateThinkingContent(index, thinkingContent) {
      this.messages[index].thinkingContent = thinkingContent // 更新思考消息内容
      // 每次更新时保存到localStorage
      localStorage.setItem('chatMessages', JSON.stringify(this.messages))
    },


    /**
     * 标记指定索引处的助手消息为已完成（停止流式传输）
     * @param {number} index - 要标记的消息的索引
     */
    setMessageComplete(index, content='') {
      // 检查索引是否在有效范围内
      if (index >= 0 && index < this.messages.length) {
        if(content) {
          this.messages[index].content = content // 更新消息内容
        }
        this.messages[index].streaming = false // 将 streaming 标志设为 false
        // 重置全局streaming状态和最后流式消息索引
        this.streaming = false
        this.lastStreamingMessageIndex = -1
        localStorage.setItem('isStreaming', 'false')
        localStorage.setItem('lastStreamingMessageIndex', '-1')
        // 保存更新后的消息到localStorage
        localStorage.setItem('chatMessages', JSON.stringify(this.messages))
      }
    },

    /**
     * 停止当前正在生成的消息
     * 当用户点击停止按钮时调用此函数
     */
    stopGeneration() {
      // 中断当前正在进行的API请求
      abortCurrentRequest();

      // 检查是否有正在流式传输的消息
      if (this.streaming && this.lastStreamingMessageIndex >= 0) {
        // 标记当前正在流式传输的消息为已完成
        this.setMessageComplete(this.lastStreamingMessageIndex, this.messages[this.lastStreamingMessageIndex].content+'\n\n你已中止生成。');
        // 设置加载状态为false
        this.setLoading(false);
      }
    },

    /**
     * 设置加载状态
     * @param {boolean} status - 加载状态（true 或 false）
     */
    setLoading(status) {
      this.loading = status // 更新 loading 状态
    },

    /**
     * 发送消息到LLM并处理响应
     * @param {string} userMessage - 用户发送的消息
     * @param {string} modelType - 模型类型，默认为'qwen-plus'
     * @param {boolean} isDeepThinking - 是否启用深度思考模式，默认为false
     * @returns {Promise<void>}
     */
    async sendMessageToLLM(userMessage, modelType = 'qwen-plus', isDeepThinking = false) {
      // 添加用户消息
      this.addUserMessage(userMessage)

      // 设置加载状态
      this.setLoading(true)

      try {
        // 添加一个空的模型消息，准备接收流式响应
        const messageIndex = this.addModelMessage('')

        // 准备发送给API的消息历史
        const messageHistory = this.messages.map(msg => ({
          role: msg.role,
          content: msg.content
        }))

        // 调用LLM API并处理流式响应
        await createChatCompletion(
          messageHistory,
          (updatedContent) => {
            this.updateModelMessage(messageIndex, updatedContent)
          },
          (thinkingContent) => {
            this.updateThinkingContent(messageIndex, thinkingContent)
          },
          modelType,      // 传递模型类型参数
          isDeepThinking // 传递深度思考状态参数
        )

        // 设置消息完成状态
        this.setMessageComplete(messageIndex)
      } catch (error) {
        console.error('发送消息到LLM时出错:', error)
        // 更新错误消息
        if (this.messages[this.messages.length - 1]) {
          this.messages[this.messages.length - 1].error = '抱歉，生成回答时出现错误，请重试。'
          this.setMessageComplete(this.messages.length - 1)
        }
      } finally {
        this.setLoading(false)
      }
    },

    /**
     * 重新生成最后一条助手消息
     * @param {string} modelType - 模型类型，默认为'qwen-plus'
     * @param {boolean} isDeepThinking - 是否启用深度思考模式，默认为false
     * @returns {Promise<void>}
     */
    async regenerateLastMessage(modelType = 'qwen-plus', isDeepThinking = false) {
      // 查找最后一条助手消息的索引
      let lastAssistantIndex = -1
      for (let i = this.messages.length - 1; i >= 0; i--) {
        if (this.messages[i].role === 'assistant') {
          lastAssistantIndex = i
          break
        }
      }

      // 查找最后一条用户消息的内容
      let lastUserMessage = ''
      let lastUserMessageIndex = -1
      for (let i = lastAssistantIndex - 1; i >= 0; i--) {
        if (this.messages[i].role === 'user') {
          lastUserMessageIndex = i
          lastUserMessage = this.messages[i].content
          break
        }
      }

      // 如果找到了最后一条助手消息和用户消息
      if (lastAssistantIndex !== -1 && lastUserMessage) {
        // 删除最后一条助手消息
        this.messages.splice(lastAssistantIndex, 1)
        this.messages.splice(lastUserMessageIndex, 1)
        // 重新发送用户的最后一条消息，并传递模型类型和深度思考状态
        await this.sendMessageToLLM(lastUserMessage, modelType, isDeepThinking)
      }
    },

    /**
     * 判断指定索引的消息是否为最后一条助手消息
     * @param {number} index - 要检查的消息索引
     * @returns {boolean} 是否为最后一条助手消息
     */
    isLastModelMessage(index) {
      // 如果索引无效，返回false
      if (index < 0 || index >= this.messages.length) {
        return false
      }

      // 从当前索引向后查找，检查是否还有其他助手消息
      for (let i = index + 1; i < this.messages.length; i++) {
        if (this.messages[i].role === 'assistant') {
          return false // 如果找到更靠后的助手消息，则当前消息不是最后一条
        }
      }

      return this.messages[index].role === 'assistant' // 确认当前消息是助手消息
    },

    /**
     * 清空聊天历史记录
     * 当用户点击清空按钮时调用此函数
     */
    clearChatHistory() {
      // 如果正在生成消息，先停止生成
      if (this.streaming) {
        this.stopGeneration();
      }

      // 清空消息数组
      this.messages = [];

      // 重置状态
      this.streaming = false;
      this.loading = false;
      this.lastStreamingMessageIndex = -1;
      this.thinkingContent = '';

      // 清除localStorage中的相关数据
      localStorage.removeItem('chatMessages');
      localStorage.setItem('isStreaming', 'false');
      localStorage.setItem('lastStreamingMessageIndex', '-1');
    },
  },

  // 添加持久化配置
  persist: {
    // 启用持久化
    enabled: true,
    // 使用localStorage存储
    storage: localStorage,
    // 指定需要持久化的状态
    paths: ['messages', 'streaming', 'lastStreamingMessageIndex']
  }
})