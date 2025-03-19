<template>
  <div class="chat-container">
    <!-- 添加左上角菜单按钮 -->
    <el-button class="menu-button" type="primary" circle @click="toggleDrawer">
      <el-icon><Menu /></el-icon>
    </el-button>

    <!-- 添加左侧抽屉 -->
    <el-drawer
      v-model="drawerVisible"
      title="历史聊天记录"
      direction="ltr"
      :size="drawerWidth"
      :modal="false"
      :with-header="true"
      :show-close="false"
      :append-to-body="false"
      :lock-scroll="false"
      :overlay="false"
      style="position: relative;"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      custom-class="chat-history-drawer"
      :z-index="1"
    >
      <div class="drawer-content">
        <!-- 抽屉内容将在这里添加 -->
        <p>历史聊天记录区域</p>
      </div>
    </el-drawer>
    <div class="chat-user" ref="chatUserRef">
      <div class="chat-history" ref="chatHistoryRef">
        <div v-for="message in chatStore.messages" :key="message.id">
          <UserMessage
            v-if="message.role === 'user'"
            :content="message.content"
          />
          <ModelMessage
            v-else
            :content="message.content"
            :streaming="message.streaming"
          />
        </div>
          

        <!-- 添加滚动到底部的按钮 -->
        <el-button
          v-show="showScrollButton"
          class="scroll-to-bottom-btn"
          type="primary"
          circle
          @click="smoothScrollToBottom"
        >
          <el-icon><Bottom /></el-icon>
        </el-button>
      </div>
      
        <InputBox
          @send-message="handleSendMessage"
          :loading="chatStore.loading"
          :style="inputBoxStyle"
          ref="inputBoxRef"
        />
    </div>
    <div class="input-box-container">
            <div class="no-box" :style="{ height: inputBoxHeight + 'px' }"></div>
          </div>
  </div>
</template>

<script>
import { ref, watch, onMounted, onUnmounted } from "vue";
import { useChatStore } from "../stores/chat";
import UserMessage from "../components/UserMessage.vue";
import ModelMessage from "../components/ModelMessage.vue";
import InputBox from "../components/InputBox.vue";
import { Bottom, Menu } from "@element-plus/icons-vue";

export default {
  name: "LLMChat",
  components: {
    UserMessage,
    ModelMessage,
    InputBox,
    Bottom,
    Menu,
  },
  setup() {
    const chatStore = useChatStore();
    const chatHistoryRef = ref(null);
    const userHasScrolled = ref(false);
    const showScrollButton = ref(false);
    const drawerVisible = ref(false); // 控制抽屉显示状态
    const chatUserRef = ref(null);
    const inputBoxStyle = ref({
      position: 'fixed',
      bottom: '0',
      left: '0',
      zIndex: '100',
      // width: '1200px',
      maxWidth: '1200px',
    });
    const drawerWidth = ref(500); // 存储抽屉宽度
    const inputBoxRef = ref(null);
    const inputBoxHeight = ref(280); // 默认高度

    // 更新输入框位置
    const updateInputBoxPosition = () => {
      if (chatUserRef.value) {
        // const rect = chatUserRef.value.getBoundingClientRect();
        // console.log(drawerWidth.value, inputBoxStyle.value.left);
        
        inputBoxStyle.value.left = drawerVisible.value?drawerWidth.value+'px':'0';
        // inputBoxStyle.value.width = `${rect.width}px`;
        // console.log(inputBoxStyle.value.left);

      }
    };

    // 监听 InputBox 高度变化
    const observeInputBoxHeight = () => {
      if (!inputBoxRef.value) return;
      
      const resizeObserver = new ResizeObserver(entries => {
        for (let entry of entries) {
          inputBoxHeight.value = entry.contentRect.height;
        }
      });
      
      resizeObserver.observe(inputBoxRef.value.$el);
      
      return resizeObserver;
    };



    // 滚动到底部的函数
    const scrollToBottom = () => {
      setTimeout(() => {
        console.log(chatHistoryRef.value.scrollTop);
        
        if (chatHistoryRef.value) {
          chatHistoryRef.value.scrollTop = chatHistoryRef.value.scrollHeight;
          console.log(chatHistoryRef.value.scrollHeight, chatHistoryRef.value.scrollTop);

          showScrollButton.value = false;
        }
      }, 100);
    };
    // 平滑滚动到底部的函数
    const smoothScrollToBottom = () => {
      if (chatHistoryRef.value) {
        // 使用平滑滚动
        chatHistoryRef.value.scrollTo({
          top: chatHistoryRef.value.scrollHeight,
          behavior: "smooth",
        });

        // 滚动完成后隐藏按钮
        setTimeout(() => {
          showScrollButton.value = false;
          userHasScrolled.value = false;
        }, 500); // 给滚动动画足够的时间
      }
    };

    // 监听用户滚动事件
    const handleScroll = () => {
      if (!chatHistoryRef.value) return;

      const { scrollTop, scrollHeight, clientHeight } = chatHistoryRef.value;
      // 如果用户向上滚动超过100px，标记为已滚动
      if (scrollHeight - scrollTop - clientHeight > 100) {
        userHasScrolled.value = true;
        showScrollButton.value = true;
      } else {
        // 如果滚动到接近底部，重置标记
        userHasScrolled.value = false;
        showScrollButton.value = false;
      }
    };

    // 监听消息变化，自动滚动到底部（除非用户已滚动）
    watch(
      [
        () => chatStore.messages.length,
        () =>
          chatStore.messages.length > 0
            ? chatStore.messages[chatStore.messages.length - 1].content
            : "",
      ],
      () => {
        if (!userHasScrolled.value) {
          scrollToBottom();
        }
      }
    );

    // 组件挂载时滚动到底部
    onMounted(() => {
      scrollToBottom();

      // 添加滚动事件监听
      if (chatHistoryRef.value) {
        chatHistoryRef.value.addEventListener("scroll", handleScroll);
      }

      // 监听窗口大小变化，更新输入框位置
      // updateInputBoxPosition();
      // window.addEventListener("resize", updateInputBoxPosition);

      // 初始化 InputBox 高度监听
      const observer = observeInputBoxHeight();
      
      // 清理函数
      onUnmounted(() => {
        if (observer) {
          observer.disconnect();
        }
      });
    });

    // 处理发送消息
    const handleSendMessage = async (message) => {
      // 发送消息时重置用户滚动状态，确保新消息可见
      userHasScrolled.value = false;
      await chatStore.sendMessageToLLM(message);
    };

    // 处理抽屉开关
    const toggleDrawer = () => {
      drawerVisible.value = !drawerVisible.value;
      // 等待过渡动画完成后更新输入框位置
      updateInputBoxPosition();
    };

    // // 监听抽屉状态变化
    // watch(drawerVisible, () => {
    //   setTimeout(updateInputBoxPosition, 300);
    // });

    return {
      chatStore,
      chatHistoryRef,
      handleSendMessage,
      scrollToBottom,
      smoothScrollToBottom,
      showScrollButton,
      drawerVisible,
      chatUserRef,
      inputBoxStyle,
      toggleDrawer,
      inputBoxRef,
      inputBoxHeight,
      drawerWidth
    };
  },
};
</script>

<style scoped lang="scss">
.chat-container {
  display: flex;
  flex-direction: column;
  max-width: 1200px;
  margin: 0 auto;
  background-color: rgb(252, 252, 252);
}

/* 左上角菜单按钮样式 */
.menu-button {
  position: fixed;
  top: 20px;
  z-index: 3001; /* 确保按钮在抽屉上方 */
  width: 45px;
  height: 45px;
  font-size: 20px;
  background-color: #f4f4f4;
  color: #333;
  border: none;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  left: v-bind('drawerVisible ? "260px" : "20px"');
  transform: v-bind('drawerVisible ? "translateX(0)" : "translateX(0)"');
}

:deep(.el-drawer__header) {
  margin-bottom: 20px;
  padding: 20px 60px 20px 20px; /* 为按钮留出空间 */
  border-bottom: 1px solid #eee;
  font-size: 18px;
  font-weight: bold;
  position: relative; /* 为按钮定位提供参考 */
}

/* 抽屉内容样式 */
.drawer-content {
  padding: 20px;
}

.chat-user {
  z-index: 100;
  width: 100%;
  position: relative;
}

/* 输入框容器样式 */
.input-box-container {
  width: 100%;
  transition: left 0.3s ease;
  .no-box {
    width: 100%;
  height: 280px;
  box-sizing: border-box;
  background-color: pink;
  }
}

.chat-history {
  flex: 1;
  min-height: calc(100vh - 320px);
  padding: 25px;
  display: flex;
  flex-direction: column;
  gap: 25px;
  margin-top: 40px;
  scrollbar-width: none;
  -ms-overflow-style: none;
  position: relative; /* 添加相对定位，作为滚动按钮的参考 */
  background-color: yellow;
}

.chat-history::-webkit-scrollbar {
  display: none;
}

/* 滚动到底部按钮样式 */
.scroll-to-bottom-btn {
  color: black;
  background-color: #f4f4f4;
  position: fixed;
  bottom: 260px; /* 位于输入框上方 */
  left: 48%;
  z-index: 3001;
  width: 55px;
  height: 55px;
  font-size: 35px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

:deep(.el-button--primary) {
  box-shadow: none;
  border: none;
}

/* 自定义抽屉样式 */
:deep(.chat-history-drawer) {
  background-color: #fff;
  box-shadow: 0 8px 10px -5px rgba(0, 0, 0, 0.1),
    0 16px 24px 2px rgba(0, 0, 0, 0.05), 0 6px 30px 5px rgba(0, 0, 0, 0.01);
}

:deep(.el-drawer__header) {
  margin-bottom: 20px;
  padding: 20px;
  border-bottom: 1px solid #eee;
  font-size: 18px;
  font-weight: bold;
}

:deep(.el-drawer__body) {
  padding: 0;
}

/* 添加内容区域的过渡效果 */
.chat-container {
  transition: padding-left 0.3s ease;
  padding-left: v-bind('drawerVisible ? drawerWidth+'px' : "0"');
}

/* 调整菜单按钮位置，使其在抽屉打开时也可见 */
.menu-button {
  transition: left 0.3s ease;
  left: v-bind('drawerVisible ? "310px" : "20px"');
}

:deep(.el-popup-parent--hidden) {
  overflow: none;
}

</style>