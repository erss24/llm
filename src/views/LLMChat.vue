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
import { ref, watch } from 'vue'
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
    
    // 监听消息变化，自动滚动到底部
    watch(
      // 同时监听消息数组长度和最后一条消息的内容
      [
        () => chatStore.messages.length,
        () => chatStore.messages.length > 0 ? chatStore.messages[chatStore.messages.length - 1].content : ''
      ],
      () => {
        setTimeout(() => {
          if (chatHistoryRef.value) {
            chatHistoryRef.value.scrollTop = chatHistoryRef.value.scrollHeight
          }
        }, 100) // 减少延迟时间以使滚动更加及时
      }
    )
    
    // 处理发送消息
    const handleSendMessage = async (message) => {
      // 使用新的sendMessageToLLM方法
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