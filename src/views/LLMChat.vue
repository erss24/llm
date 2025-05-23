
<template>
  <div class="chat-container" :style="chatContainerStyle">
    <!-- 添加左上角菜单按钮 -->
    <el-button
      class="menu-button"
      v-if="!isTemporaryChat"
      type="primary"
      circle
      @click="toggleDrawer"
    >
      <el-icon><Menu /></el-icon>
    </el-button>

    <!-- 添加清空历史记录按钮 -->
    <el-tooltip
      :disabled="!hasMessages"
      content="清空历史记录"
      placement="right"
      effect="dark"
      v-if="hasMessages"
      popper-class="custom-tooltip"
    >
      <el-button
        class="clear-history-button"
        type="primary"
        @click="handleClearHistory"
      >
        <el-icon><ChatDotRound /></el-icon>
        <span> 开启新对话</span>
      </el-button>
    </el-tooltip>

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
      style="position: relative"
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
        <!-- 当有消息时显示聊天内容 -->
        <div v-if="chatStore.messages.length > 0">
          <div v-for="(message, index) in chatStore.messages" :key="message.id">
            <UserMessage
              v-if="message.role === 'user'"
              :content="message.content"
              @edit-message="handleEditMessage"
            />
            <ModelMessage
              v-else
              :content="message.content"
              :thinkingContent="message.thinkingContent"
              :streaming="message.streaming"
              :is-last-message="chatStore.isLastModelMessage(index)"
              :error="message.error"
              @regenerate="handleRegenerateMessage"
            />
          </div>
        </div>

        <!-- 当没有消息时显示初始页面 -->
        <div v-else class="welcome-container">
          <div class="welcome-content">
            <div class="welcome-header">
              <h1>欢迎使用 AI 聊天助手</h1>
              <p class="welcome-subtitle">有问题，尽管问！我随时为您提供帮助</p>
            </div>

            <div class="welcome-examples">
              <h2>您可以这样问我：</h2>
              <div class="example-cards">
                <div
                  class="example-card"
                  @click="handleEditMessage('简单介绍韩山师范学院')"
                >
                  <div class="example-icon">
                    <el-icon><School /></el-icon>
                  </div>
                  <div class="example-text">简单介绍韩山师范学院</div>
                </div>
                <div
                  class="example-card"
                  @click="handleEditMessage('潮州旅游攻略')"
                >
                  <div class="example-icon">
                    <el-icon><Document /></el-icon>
                  </div>
                  <div class="example-text">潮州旅游攻略</div>
                </div>
                <div
                  class="example-card"
                  @click="handleEditMessage('韩师附近有什么好玩的')"
                >
                  <div class="example-icon">
                    <el-icon><Lightning /></el-icon>
                  </div>
                  <div class="example-text">韩师附近有什么好玩的</div>
                </div>
                <div
                  class="example-card"
                  @click="
                    handleEditMessage(
                      '韩师美食推荐'
                    )
                  "
                >
                  <div class="example-icon">
                    <el-icon><KnifeFork /></el-icon>
                  </div>
                  <div class="example-text">
                    韩师美食推荐
                  </div>
                </div>
              </div>
            </div>
          </div>
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
        @stop-generation="handleStopGeneration"
        @model-change="handleModelChange"
        @deep-thinking-change="handleDeepThinkingChange"
        :loading="chatStore.loading"
        :style="inputBoxStyle"
        ref="inputBoxRef"
      />
    </div>
    <div class="input-box-container">
      <div class="no-box" :style="{ height: inputBoxHeight + 18.75 + 'px' }"></div>
    </div>
  </div>
</template>

<script setup>
defineOptions({
  name: 'ModelPage'
})

import { ref, watch, onMounted, onUnmounted, computed } from "vue";
import { useChatStore } from "../stores/chat";
import UserMessage from "../components/UserMessage.vue";
import ModelMessage from "../components/ModelMessage.vue";
import InputBox from "../components/InputBox.vue";
import {
  Bottom,
  Menu,
  School,
  Document,
  Lightning,
  KnifeFork,
  ChatDotRound,
} from "@element-plus/icons-vue";
import { ElNotification } from "element-plus"; // 确保导入ElNotification
import { checkIncompleteStreaming } from "../services/llmService";

const chatStore = useChatStore();
const chatHistoryRef = ref(null);
const userHasScrolled = ref(false);
const showScrollButton = ref(false);
const drawerVisible = ref(false); // 控制抽屉显示状态
const chatUserRef = ref(null);
//是否开启临时对话
const isTemporaryChat = ref(true);
const inputBoxStyle = ref({
  position: "fixed",
  bottom: "0",
  left: "0",
  zIndex: "100",
  // width: '1200px',
  maxWidth: "865px",
});
const chatContainerStyle = ref({
  marginLeft: "0",
});
const drawerWidth = ref(500); // 存储抽屉宽度
const inputBoxRef = ref(null);
const inputBoxHeight = ref(280); // 默认高度
const hasMessages = computed(() => {
  return chatStore.messages.length > 0;
});

// 存储通知实例的数组
const notifications = ref([]);

// 更新输入框位置
const updateInputBoxPosition = () => {
  if (chatUserRef.value) {
    inputBoxStyle.value.left = drawerVisible.value
      ? drawerWidth.value + "px"
      : "0";
    chatContainerStyle.value.marginLeft = drawerVisible.value
      ? inputBoxStyle.value.left
      : "0";
  }
};

// 监听 InputBox 高度变化
const observeInputBoxHeight = () => {
  if (!inputBoxRef.value) return;
  const resizeObserver = new ResizeObserver((entries) => {
    // 检查是否在底部
    const isAtBottom = isScrolledToBottom();
    for (let entry of entries) {
      inputBoxHeight.value = entry.contentRect.height;
      // console.log(inputBoxHeight.value);
    }
    // 如果之前在底部，高度变化后保持在底部
    if (isAtBottom) {
      scrollToBottom();
    }
  });
  // smoothScrollToBottom();
  resizeObserver.observe(inputBoxRef.value.$el);

  return resizeObserver;
};

// 检查是否滚动到底部
const isScrolledToBottom = () => {
  if (!chatUserRef.value) return true;

  const { scrollTop, scrollHeight, clientHeight } = chatUserRef.value;
  // 如果距离底部小于20px，认为是在底部
  return scrollHeight - scrollTop - clientHeight < 20;
};

// 滚动到底部的函数
const scrollToBottom = () => {
  setTimeout(() => {
    if (chatHistoryRef.value) {
      chatUserRef.value.scrollTop = chatUserRef.value.scrollHeight;
      showScrollButton.value = false;
    }
  }, 100);
};

// 平滑滚动到底部的函数
const smoothScrollToBottom = () => {
  if (chatHistoryRef.value) {
    // 使用平滑滚动
    chatUserRef.value.scrollTo({
      top: chatUserRef.value.scrollHeight,
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
  const { scrollTop, scrollHeight, clientHeight } = chatUserRef.value;
  // 如果用户向上滚动超过100px，标记为已滚动


  if (scrollHeight - scrollTop - clientHeight > 30) {
    // console.log(scrollHeight - scrollTop - clientHeight);
    userHasScrolled.value = true;
    showScrollButton.value = true;
  } else {
    // 如果滚动到接近底部，重置标记
    userHasScrolled.value = false;
    showScrollButton.value = false;
  }
};

// 添加状态变量存储当前选择的模型类型和深度思考状态
const selectedModelType = ref('qwen-plus'); // 默认使用通义千问
const isDeepThinking = ref(false); // 默认不启用深度思考

// 处理模型选择变化
const handleModelChange = (modelName) => {
  // 根据下拉菜单选择的名称映射到实际的模型类型
  let modelType;
  if (modelName === '通义千问') {
    modelType = 'qwen-plus';
  } else if (modelName === 'deepseek(满血)') {
    modelType = 'deepseek-v3';
  } else {
    modelType = 'qwen-plus'; // 默认使用通义千问
  }

  // 存储当前选择的模型类型
  selectedModelType.value = modelType;
  // console.log('模型已切换为:', modelType);
};

// 处理深度思考状态变化
const handleDeepThinkingChange = (isDeep) => {
  isDeepThinking.value = isDeep;
  // console.log('深度思考模式:', isDeep ? '已开启' : '已关闭');
};

// 监听消息变化，自动滚动到底部（除非用户已滚动）
watch(
  [
    () => chatStore.messages.length,
    () =>
      chatStore.messages.length > 0
        ? chatStore.messages[chatStore.messages.length - 1].content
        : "",
    () => chatStore.messages.length > 0
        ? chatStore.messages[chatStore.messages.length - 1].thinkingContent
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
  // 设置 html 样式
  document.documentElement.style.height = "100vh";
  document.documentElement.style.overflow = "hidden";

  // 检查是否有未完成的流式消息
  checkIncompleteStreaming((messageIndex) => {
    chatStore.setMessageComplete(messageIndex);
  });

  scrollToBottom();
  // 添加滚动事件监听
  if (chatHistoryRef.value) {
    chatUserRef.value.addEventListener("scroll", handleScroll);
  }

  // 初始化 InputBox 高度监听
  const observer = observeInputBoxHeight();

  // 弹出提示信息
  setTimeout(() => {
    // 创建并保存通知实例
    const notification1 = ElNotification({
      title: "温馨提示",
      duration: 0,
      customClass: "chat-notification", // 添加自定义类名
      position: "top-left", // 设置位置
      offset: 200, // 设置距离顶部的偏移量
      dangerouslyUseHTMLString: true, // 允许使用HTML内容
      message: `<div class="notification-content">当前为临时对话，如有需要请自行复制保存，以免数据丢失！</div>`, // 使用HTML内容
    });

    const notification2 = ElNotification({
      title: "模型建议",
      duration: 0,
      customClass: "chat-notification", // 添加自定义类名
      position: "top-left", // 设置位置
      offset: 330, // 设置距离顶部的偏移量
      dangerouslyUseHTMLString: true, // 允许使用HTML内容
      message: `<div class="notification-content">建议使用通义千问模型，响应深度更快哦！</div>`, // 使用HTML内容
    });

    // 将通知实例添加到数组中
    notifications.value.push(notification1, notification2);
  }, 100);

  // 清理函数
  onUnmounted(() => {
    // 修改这里：使用 closeAll 方法立即关闭所有通知，不显示动画
    ElNotification.closeAll(true); // 传入 true 表示立即关闭，不显示动画

    // 清空通知数组
    notifications.value = [];

    // 移除滚动事件监听
    if (chatUserRef.value) {
      chatUserRef.value.removeEventListener("scroll", handleScroll);
    }

    // 断开ResizeObserver连接
    if (observer) {
      observer.disconnect();
    }

    // 恢复html样式
    document.documentElement.style.height = "";
    document.documentElement.style.overflow = "";
  });
});

// 处理发送消息
const handleSendMessage = (message) => {
  // 发送消息到LLM，并传递当前选择的模型类型和深度思考状态
  chatStore.sendMessageToLLM(message, selectedModelType.value, isDeepThinking.value);
  // 滚动到底部
  scrollToBottom();
};

// 处理重新生成消息
const handleRegenerateMessage = async () => {
  // 重置用户滚动状态，确保新消息可见
  userHasScrolled.value = false;
  // 调用store中的重新生成方法
  await chatStore.regenerateLastMessage(selectedModelType.value, isDeepThinking.value);
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

// 处理编辑消息
const handleEditMessage = (content) => {
  // 将内容设置到输入框
  if (inputBoxRef.value) {
    inputBoxRef.value.setInputContent(content);
    // 聚焦输入框
    setTimeout(() => {
      inputBoxRef.value.focus();
    }, 100);
  }
};

// 处理停止生成消息
const handleStopGeneration = () => {
  // 调用store中的stopGeneration方法
  chatStore.stopGeneration();
  smoothScrollToBottom();
};

// 处理清空历史记录
const handleClearHistory = () => {
  // 调用store中的clearChatHistory方法
  chatStore.clearChatHistory();
  // 滚动到底部
  scrollToBottom();
};
</script>

<style scoped lang="scss">
.chat-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  margin: 0 auto;
  background-color: rgb(252, 252, 252);
  /* 添加内容区域的过渡效果 */
  transition: all 0.3s ease;
}

/* 左上角菜单按钮样式 */
.menu-button {
  position: fixed;
  top: 15px;
  z-index: 3001; /* 确保按钮在抽屉上方 */
  width: 33.75px;
  height: 33.75px;
  font-size: 15px;
  background-color: #f4f4f4;
  color: #333;
  border: none;
  box-shadow: 0 1.5px 9px 0 rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  left: v-bind('drawerVisible ? "195px" : "15px"');
  transform: v-bind('drawerVisible ? "translateX(0)" : "translateX(0)"');
}

/* 清空历史记录按钮样式 */
.clear-history-button {
  position: fixed;
  top: 112.5px;
  left: 90px;
  z-index: 3001;
  height: 45px;
  font-size: 22.5px;
  background-color: rgba(144, 147, 153, 0.3);
  color: black;
  border: none;
  box-shadow: 0 1.5px 9px 0 rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  span {
    font-size: 16.5px;
  }
}

:deep(.el-drawer__header) {
  margin-bottom: 15px;
  padding: 15px 45px 15px 15px; /* 为按钮留出空间 */
  border-bottom: 1px solid #eee;
  font-size: 13.5px;
  font-weight: bold;
  position: relative; /* 为按钮定位提供参考 */
}

/* 抽屉内容样式 */
.drawer-content {
  padding: 15px;
}

.chat-user {
  width: 100%;
  z-index: 100;
  position: relative;
  overflow: auto;
}

/* 输入框容器样式 */
.input-box-container {
  width: 100%;
  flex-grow: 1;
  transition: left 0.3s ease;
  .no-box {
    width: 100%;
    box-sizing: border-box;
  }
}

.chat-history {
  height: calc(100vh - 240px);
  flex-shrink: 1;
  padding: 18.75px;
  display: flex;
  flex-direction: column;
  gap: 18.75px;
  scrollbar-width: none;
  position: relative; /* 添加相对定位，作为滚动按钮的参考 */
  max-width: 900px;
  margin: 0 auto;
}

.chat-history::-webkit-scrollbar {
  display: none;
}

/* 欢迎页面样式 */
.welcome-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 15px;
  text-align: center;
  animation: fadeIn 0.5s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(15px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.welcome-content {
  max-width: 690px;
  width: 100%;
  background-color: white;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.05);
}

.welcome-header {
  margin-bottom: 30px;
}

.welcome-header h1 {
  font-size: 33.75px;
  font-weight: bold;
  color: #333;
  margin-bottom: 12px;
  background: linear-gradient(90deg, #4af7eb, #de2ef6);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.welcome-subtitle {
  font-size: 13.5px;
  color: #666;
  line-height: 1.5;
}

.welcome-examples {
  margin-top: 15px;
}

.welcome-examples h2 {
  font-size: 22.5px;
  color: #444;
  margin-bottom: 18px;
  font-weight: 600;
}

.example-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(225px, 1fr));
  gap: 15px;
  margin-top: 15px;
}

.example-card {
  display: flex;
  align-items: center;
  padding: 12px 15px;
  background-color: #f8f9fa;
  border-radius: 9px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid #eee;
}

.example-card:hover {
  background-color: #f0f7ff;
  transform: translateY(-2.25px);
  box-shadow: 0 4.5px 9px rgba(0, 0, 0, 0.08);
  border-color: #d0e3ff;
}

.example-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  background-color: #e6f0ff;
  border-radius: 50%;
  margin-right: 12px;
  color: #4a6cf7;
  font-size: 26.25px;
}

.example-text {
  flex: 1;
  font-size: 16.5px;
  color: #555;
  text-align: left;
  line-height: 1.4;
}

/* 滚动到底部按钮样式 */
.scroll-to-bottom-btn {
  color: black;
  background-color: #f4f4f4;
  position: fixed;
  bottom: v-bind(
    'inputBoxHeight + 45 + "px"'
  ); /* 动态调整位置，始终位于输入框上方 */
  left: 48%;
  z-index: 3001;
  width: 41.25px;
  height: 41.25px;
  font-size: 26.25px;
  box-shadow: 0 1.5px 9px 0 rgba(0, 0, 0, 0.1);
}

:deep(.el-button--primary) {
  box-shadow: none;
  border: none;
}

/* 自定义抽屉样式 */
:deep(.chat-history-drawer) {
  background-color: #fff;
  box-shadow: 0 6px 7.5px -3.75px rgba(0, 0, 0, 0.1),
    0 12px 18px 1.5px rgba(0, 0, 0, 0.05), 0 4.5px 22.5px 3.75px rgba(0, 0, 0, 0.01);
}

:deep(.el-drawer__header) {
  margin-bottom: 15px;
  padding: 15px;
  border-bottom: 1px solid #eee;
  font-size: 13.5px;
  font-weight: bold;
}

:deep(.el-drawer__body) {
  padding: 0;
}

/* 调整菜单按钮位置，使其在抽屉打开时也可见 */
.menu-button {
  transition: left 0.3s ease;
  left: v-bind('drawerVisible ? "232.5px" : "15px"');
}

:deep(.el-popup-parent--hidden) {
  overflow: none;
}
</style>

<!-- 添加全局样式 -->
<style>
/* 自定义通知框样式 */
.chat-notification {
  width: 262.5px !important; /* 设置宽度 */
  padding: 12px 12px 0 12px !important; /* 增加内边距 */
  border-radius: 6px !important; /* 圆角 */
  z-index: 9999 !important;
  position: fixed !important;
  left: 12px;
  transition: all 0.3s ease;
}

.el-notification {
    --el-notification-width: 247.5px;
    --el-notification-padding: 10.5px 19.5px 10.5px 9.75px;
    --el-notification-radius: 6px;
    --el-notification-shadow: var(--el-box-shadow-light);
    --el-notification-border-color: var(--el-border-color-lighter);
    --el-notification-icon-size: 18px;
    --el-notification-close-font-size: var(--el-message-close-size, 12px);
    --el-notification-group-margin-left: 9.75px;
    --el-notification-group-margin-right: 6px;
    --el-notification-content-font-size: var(--el-font-size-base);
    --el-notification-content-color: var(--el-text-color-regular);
    --el-notification-title-font-size: 12px;
    --el-notification-title-color: var(--el-text-color-primary);
    --el-notification-close-color: var(--el-text-color-secondary);
    --el-notification-close-hover-color: var(--el-text-color-regular);
    background-color: var(--el-bg-color-overlay);
    border: 1px solid var(--el-notification-border-color);
    border-radius: var(--el-notification-radius);
    box-shadow: var(--el-notification-shadow);
    box-sizing: border-box;
    display: flex;
    overflow: hidden;
    overflow-wrap: break-word;
    padding: var(--el-notification-padding);
    position: fixed;
    transition: opacity var(--el-transition-duration), transform var(--el-transition-duration), left var(--el-transition-duration), right var(--el-transition-duration), top .4s, bottom var(--el-transition-duration);
    width: var(--el-notification-width);
    z-index: 9999;
}

/* 标题样式 */
.chat-notification .el-notification__title {
  font-size: 15px !important; /* 标题字体大小 */
  font-weight: bold !important; /* 标题加粗 */
  margin-bottom: 7.5px !important; /* 标题下方间距 */
  color: #000000 !important; /* 标题颜色 */
}

/* 内容样式 */
.notification-content {
  font-size: 15.75px !important; /* 内容字体大小 */
  line-height: 1.5 !important; /* 行高 */
  color: #666 !important; /* 内容颜色 */
}

/* 图标样式 */
.chat-notification .el-notification__icon {
  font-size: 18px !important; /* 图标大小 */
  margin-right: 11.25px !important; /* 图标右侧间距 */
}

/* 关闭按钮样式 */
.chat-notification .el-notification__closeBtn {
  font-size: 18px !important; /* 关闭按钮大小 */
  left: 220px !important;
  bottom: 72px !important;
}
</style>


