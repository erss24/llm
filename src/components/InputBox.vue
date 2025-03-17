<template>
  <div class="input-container">
    <div class="input-box">
      <el-input
      placeholder="有问题，尽管问，shift+enter换行"
      class="input-textarea"
      type="textarea"
        v-model="inputMessage"
        @keydown.enter.prevent="handleSend"
        :autosize="{ minRows: 2, maxRows: 6 }"
        ref="textareaRef"
        
      />
      <div class="input-actions">
        <el-button type="info" plain size="large" style="margin-left: 15px"
          >深度思考</el-button
        >
        <div class="send-actions">
          <!-- <button
            class="send-btn"
            title="发送"
            @click="handleSend"
            :disabled="!canSend || loading"
            :loading="loading"
          >
            <el-icon><Position /></el-icon>
          </button> -->
          <el-button type="primary"
          class="send-btn"
          title="发送"
          circle
          @click="handleSend"
          :disabled="!canSend || loading"
          :loading="loading">
          <template #default>
            <el-icon v-if="!loading"><Position /></el-icon>
          </template>
          </el-button>
        </div>
      </div>
    </div>
    <div class="disclaimer">所有内容均由AI生成仅供参考</div>
  </div>
</template>

<script>
import { Position } from "@element-plus/icons-vue";
import { ref, computed } from "vue";

export default {
  name: "InputBox",
  components: {
    Position,
  },
  props: {
    loading: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["send-message"],
  setup(props, { emit }) {
    const inputMessage = ref("");
    const textareaRef = ref(null);

    const canSend = computed(() => inputMessage.value.trim().length > 0);

    const handleSend = () => {
      if (!canSend.value || props.loading) return;

      const message = inputMessage.value.trim();
      emit("send-message", message);
      inputMessage.value = "";

      // // 重置textarea高度为初始值100px
      // nextTick(() => {
      //   if (textareaRef.value) {
      //     textareaRef.value.style.height = "100px";
      //   }
      // });
    };

    // 自动调整textarea高度，但不超过180px
    // watch(inputMessage, () => {
    //   nextTick(() => {
    //     if (textareaRef.value) {
    //       textareaRef.value.style.height = "100px";
    //       const scrollHeight = Math.min(textareaRef.value.scrollHeight, 180);
    //       textareaRef.value.style.height = `${scrollHeight}px`;
    //     }
    //   });
    // });

    return {
      inputMessage,
      textareaRef,
      canSend,
      handleSend,
    };
  },
};
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
  width: 100%;
 
  
  padding: 10px 0 15px;
  border: none;
  resize: none;
  font-family: inherit;
  font-size: 23px;
  line-height: 1.5;
  
  box-shadow:none;
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
  padding:10px;
  height: 50px;
  /* background-color: #f5f5f5; */
}

:deep(.el-textarea__inner) {
  box-shadow: none;
  resize: none;
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
</style>