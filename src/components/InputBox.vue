<template>
  <div class="input-container">
    <div class="input-box">
      <el-input
        placeholder="有问题，尽管问，shift+enter换行"
        class="input-textarea"
        type="textarea"
        v-model="inputMessage"
        @keydown.enter="handleKeyDown"
        :autosize="{ minRows: 2, maxRows: 6 }"
        ref="textareaRef"
      />
      <div class="input-actions">
        <div class="left">
          <el-dropdown @command="handleModelChange">
            <el-button type="primary">
              {{ selectedModel }}<el-icon class="el-icon--right"><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item 
                  command="qwq-plus" 
                  :class="{ 'active-model': selectedModel === 'qwq-plus' }" 
                  style="font-size: 20px; line-height: 28px;">qwq-plus</el-dropdown-item>
                <el-dropdown-item 
                  command="deepseek-r1" 
                  :class="{ 'active-model': selectedModel === 'deepseek-r1' }" 
                  style="font-size: 20px; line-height: 28px;">deepseek-r1</el-dropdown-item>
                <el-dropdown-item 
                  command="deepseek-v3" 
                  :class="{ 'active-model': selectedModel === 'deepseek-v3' }" 
                  style="font-size: 20px; line-height: 28px;">deepseek-v3</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <el-button 
                    type="info" 
                    size="large" 
                    :class="{ 'deep-thinking-active': isDeepThinking }"
                    style="margin-left: 20px; font-size: 20px; line-height: 28px;
                     background-color: rgba(144, 147, 153, 0.3); color: black; border: none;"
                    @click="toggleDeepThinking"
                  >深度思考</el-button>
        </div>
        <div class="right">
          <div class="send-actions">
            <el-button
              type="primary"
              class="send-btn"
              :title="!loading ? '发送' : '点击停止生成'"
              circle
              @click="!loading ? handleSend() : handleStopSend()"
              :disabled="!canSend && !loading"
            >
              <template #default>
                <el-icon v-if="!loading"><Position /></el-icon>
                <el-icon v-else><CaretRight /></el-icon>
              </template>
            </el-button>
          </div>
        </div>
      </div>
    </div>
    <div class="disclaimer">所有内容均由AI生成仅供参考</div>
  </div>
</template>

<script>
import { Position, ArrowDown, CaretRight } from "@element-plus/icons-vue";
import { ref, computed } from "vue";

export default {
  name: "InputBox",
  components: {
    Position,
    ArrowDown,
    CaretRight,
  },
  props: {
    loading: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["send-message", "model-change", "deep-thinking-change", "stop-generation"],
  setup(props, { emit }) {
    const inputMessage = ref("");
    const textareaRef = ref(null);
    const selectedModel = ref("qwq-plus"); // 默认选中的模型
    const isDeepThinking = ref(false); // 添加深度思考状态

    const canSend = computed(() => inputMessage.value.trim().length > 0);

    const handleSend = () => {
      if (!canSend.value || props.loading) return;

      const message = inputMessage.value.trim();
      emit("send-message", message);
      inputMessage.value = "";
    };

    // 处理模型选择变化
    const handleModelChange = (command) => {
      selectedModel.value = command;
      emit("model-change", command); // 可选：向父组件发送模型变更事件
    };

    // 处理停止发送按钮点击
    const handleStopSend = () => {
      // console.log('停止生成');
      emit("stop-generation"); // 发送停止生成事件
    };

    // 处理深度思考按钮点击
    const toggleDeepThinking = () => {
      isDeepThinking.value = !isDeepThinking.value;
      emit("deep-thinking-change", isDeepThinking.value); // 可选：通知父组件状态变化
    };
    
    // 处理键盘事件
    const handleKeyDown = (e) => {
      // 如果按下了shift键+enter，不阻止默认行为，允许换行
      if (e.shiftKey) {
        return;
      }
      
      // 如果只按下enter键，阻止默认行为并发送消息
      e.preventDefault();
      handleSend();
    };

    return {
      inputMessage,
      textareaRef,
      canSend,
      handleSend,
      handleKeyDown,
      selectedModel,
      handleModelChange,
      isDeepThinking,
      toggleDeepThinking,
      handleStopSend,
    };
  },
  methods: {
    setInputContent(content) {
      // 根据你的输入框实现来设置内容
      
      this.inputMessage = content; // 假设你的输入内容存储在 inputContent 变量中
    },
    focus() {
      // 聚焦输入框
      this.$refs.textareaRef.focus();
      
      // 将光标定位到文本的最后面
      const textarea = this.$refs.textareaRef.textarea;
      if (textarea) {
        const length = this.inputMessage.length;
        setTimeout(() => {
          textarea.setSelectionRange(length, length);
        }, 0);
      }
    }
  }
}
</script>

<style scoped lang="scss">
.input-container {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  /* border-top: 1px solid #e0e0e0; */
  padding: 10px 10px 15px;
  background-color: #ffffff;
  max-width: 1200px;
  margin: 0 auto;
  transition: all 0.3s ease;
}

.input-box {
  display: flex;
  flex-direction: column;
  border: 1px solid #e0e0e0;
  border-radius: 24px;
  overflow: hidden;
  margin-bottom: 8px;
}

.input-textarea {
  padding: 10px 0 15px;
  font-family: inherit;
  font-size: 23px;
  line-height: 1.5;
}

.input-box .el-textarea__inner {
  color: rebeccapurple;
  border: none !important;
  box-shadow: none !important;
  outline: none !important;
}

.input-box .el-textarea__inner:focus {
  border: none !important;
  box-shadow: none !important;
  outline: none !important;
}

.input-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  height: 50px;
  /* background-color: #f5f5f5; */
  .left {
    margin-left: 20px;
  }
}

:deep(.el-textarea__inner) {
  box-shadow: none;
  resize: none;
  color:#000;
  padding: 5px 24px;
}

.send-actions {
  display: flex;
  gap: 5px;
  align-items: center;
  margin-right: 20px;
}

.send-btn {
  background-color: #010e01;
  color: white;
  border: none;
  width: 45px;
  height: 45px;
  cursor: pointer;
  font-size: 35px;
  display: flex;
  flex-direction: column;
}

.send-btn:hover {
  background-color: #010e01;
  opacity: 0.5;
}

:deep(.el-loading-spinner) {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

:deep(.el-loading-spinner .circular) {
  width: 24px;
  height: 24px;
}
.disclaimer {
  text-align: center;
  color: #666;
  font-size: 15px;
}

@media (max-width: 768px) {
  .input-actions {
    /* flex-direction: column; */
    gap: 10px;
    align-items: flex-start;
  }
}

.el-button {
  height: 40px;
}

:deep(.el-dropdown .el-button--primary) {
  background-color: #fff;
  color: black;
  font-size: 20px;
  background-color: rgba(144, 147, 153, 0.3);
  --el-button-hover-border-color: #000;
}

:deep(.el-dropdown-menu--large .el-dropdown-menu__item) {
  font-size: 20px;
  line-height: 28px;
}

:deep(.active-model) {
  color: black;
  font-weight: bold;
  background-color: rgba(144, 147, 153, 0.3);
}

// 可选：添加鼠标悬停效果
:deep(.el-dropdown__popper:hover) {
  background-color: rgba(144, 147, 153, 0.1) !important;
}

// 深度思考按钮激活样式
.deep-thinking-active {
  // font-weight: bold !important;
  border: 2px solid #000 !important;
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.2);
  background-color: rgba(144, 147, 153, 0.5) !important;
}

/* 全局修改文本域的滚动条样式 */
.el-textarea__inner::-webkit-scrollbar {
  width: 3px; /* 滚动条宽度 */
}

.el-textarea__inner::-webkit-scrollbar-track {
  background: #f1f1f1; /* 滚动条轨道背景 */
  border-radius: 4px; /* 圆角 */
}

.el-textarea__inner::-webkit-scrollbar-thumb {
  background: #888; /* 滚动条滑块颜色 */
  border-radius: 4px; /* 圆角 */
}

.el-textarea__inner::-webkit-scrollbar-thumb:hover {
  background: #555; /* 滚动条滑块悬停颜色 */
}
</style>