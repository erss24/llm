import { defineStore } from 'pinia'
import { createChatCompletion } from '../services/llmService'

export const useChatStore = defineStore('chat', {
  state: () => ({
    messages: [],      // 存储聊天消息的数组
    loading: false     // 表示是否正在加载的状态标志
  }),
  
  actions: {
    /**
     * 添加用户消息到消息列表
     * @param {string} content - 用户发送的消息内容
     */
    addUserMessage(content) {
      this.messages.push({
        role: 'user',                      // 消息角色，这里是用户
        content,                           // 消息内容
        timestamp: new Date().toISOString() // 消息时间戳，采用 ISO 格式
      })
    },
    
    /**
     * 添加模型（助手）消息到消息列表，并返回该消息的索引
     * @param {string} content - 助手发送的消息内容
     * @returns {number} 新添加消息的索引
     */
    addModelMessage(content) {
      // 添加助手消息，并设置 streaming 标志为 true 表示消息正在流式传输
      this.messages.push({
        role: 'assistant',                 // 消息角色，这里是助手
        content,                           // 消息内容
        timestamp: new Date().toISOString(), // 消息时间戳
        streaming: true                    // 标记消息是否正在流式传输
      })
      return this.messages.length - 1 // 返回新添加消息的索引
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
      }
    },
    
    /**
     * 标记指定索引处的助手消息为已完成（停止流式传输）
     * @param {number} index - 要标记的消息的索引
     */
    setMessageComplete(index) {
      // 检查索引是否在有效范围内
      if (index >= 0 && index < this.messages.length) {
        this.messages[index].streaming = false // 将 streaming 标志设为 false
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
     * @returns {Promise<void>}
     */
    async sendMessageToLLM(userMessage) {
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
          }
        )
        
        // 设置消息完成状态
        this.setMessageComplete(messageIndex)
      } catch (error) {
        console.error('发送消息到LLM时出错:', error)
      } finally {
        this.setLoading(false)
      }
    }
  },
  
  // 添加持久化配置
  persist: {
    // 启用持久化
    enabled: true,
    // 使用localStorage存储
    storage: localStorage,
    // 指定需要持久化的状态
    paths: ['messages']
  }
})