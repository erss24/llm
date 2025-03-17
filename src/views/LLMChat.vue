<template>
  <div class="chat-container">
    <div class="chat-history" ref="chatHistoryRef">
      <div v-for="message in chatStore.messages" :key="message.id">
        <UserMessage v-if="message.role === 'user'" :content="message.content" />
        <ModelMessage v-else :content="message.content" :streaming="message.streaming" />
      </div>
    </div>
    <InputBox @send-message="handleSendMessage" :loading="chatStore.loading" />
  </div>
</template>

<script>
import { ref, watch, onMounted } from 'vue'
import { useChatStore } from '../stores/chat'
import UserMessage from '../components/UserMessage.vue'
import ModelMessage from '../components/ModelMessage.vue'
import InputBox from '../components/InputBox.vue'

export default {
  name: 'LLMChat',
  components: {
    UserMessage,
    ModelMessage,
    InputBox
  },
  setup() {
    const chatStore = useChatStore()
    const chatHistoryRef = ref(null)
    const userHasScrolled = ref(false)
    
    // 滚动到底部的函数
    const scrollToBottom = () => {
      setTimeout(() => {
        if (chatHistoryRef.value) {
          chatHistoryRef.value.scrollTop = chatHistoryRef.value.scrollHeight
        }
      }, 100)
    }
    
    // 监听用户滚动事件
    const handleScroll = () => {
      if (!chatHistoryRef.value) return
      
      const { scrollTop, scrollHeight, clientHeight } = chatHistoryRef.value
      // 如果用户向上滚动超过100px，标记为已滚动
      if (scrollHeight - scrollTop - clientHeight > 100) {
        userHasScrolled.value = true
      } else {
        // 如果滚动到接近底部，重置标记
        userHasScrolled.value = false
      }
    }
    
    // 监听消息变化，自动滚动到底部（除非用户已滚动）
    watch(
      [
        () => chatStore.messages.length,
        () => chatStore.messages.length > 0 ? chatStore.messages[chatStore.messages.length - 1].content : ''
      ],
      () => {
        if (!userHasScrolled.value) {
          scrollToBottom()
        }
      }
    )
    
    // 组件挂载时滚动到底部
    onMounted(() => {
      scrollToBottom()
      
      // 添加滚动事件监听
      if (chatHistoryRef.value) {
        chatHistoryRef.value.addEventListener('scroll', handleScroll)
      }
    })
    
    // 处理发送消息
    const handleSendMessage = async (message) => {
      // 发送消息时重置用户滚动状态，确保新消息可见
      userHasScrolled.value = false
      await chatStore.sendMessageToLLM(message)
    }
    
    return {
      chatStore,
      chatHistoryRef,
      handleSendMessage
    }
  }
}
</script>

<style scoped>
.chat-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  background-color: #ffffff;
}

.chat-history {
  flex: 1;
  overflow-y: auto;
  padding: 25px;
  padding-bottom: 280px;
  display: flex;
  flex-direction: column;
  gap: 25px;
  margin-top: 40px;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.chat-history::-webkit-scrollbar {
  display: none;
}

</style>