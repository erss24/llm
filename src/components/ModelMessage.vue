<template>
  <div class="model-message">
    <div class="message-content">
      <div class="message-text" >
        {{ content }}
        <span v-if="streaming" class="cursor"></span>
      </div>
    </div>
    <div class="message-actions" v-if="!streaming">
      <el-tooltip content="复制" placement="top" :effect="'dark'" popper-class="custom-tooltip">
        <button class="action-btn" @click="copyContent"><el-icon><CopyDocument /></el-icon></button>
      </el-tooltip>
      <el-tooltip content="重新生成" placement="top" :effect="'dark'" popper-class="custom-tooltip">
        <button class="action-btn"><el-icon><RefreshLeft /></el-icon></button>
      </el-tooltip>
    </div>
  </div>
</template>

<script>
import { CopyDocument, RefreshLeft } from '@element-plus/icons-vue'
import { ElTooltip, ElMessage } from 'element-plus'

export default {
  name: 'ModelMessage',
  components: {
    CopyDocument,
    RefreshLeft,
    ElTooltip
  },
  props: {
    content: {
      type: String,
      default: ''
    },
    streaming: {
      type: Boolean,
      default: false
    },
    // loading: {
    //   type: Boolean,
    //   default: false,
    // },
  },
  methods: {
    copyContent() {
      // 复制内容到剪贴板
      navigator.clipboard.writeText(this.content)
        .then(() => {
          // 复制成功后显示提示
          ElMessage({
            message: '复制成功',
            type: 'success',
            duration: 2000
          });
        })
        .catch(err => {
          console.error('复制失败:', err);
          ElMessage({
            message: '复制失败',
            type: 'error',
            duration: 2000
          });
        });
    }
  }
}
</script>

<style scoped lang="scss">
.model-message {
  display: flex;
  flex-direction: column;
  padding: 0 25px;
  border-radius: 14px;
  max-width: calc(100% - 60px);
  margin: 10px 20px;
  align-self: flex-start;
  // background-color: pink;
}

.message-content {
  /* margin-bottom: 15px; */
  font-size: 23px;
  line-height: 1.8;
  .message-text {
    margin-top: 23px;
  white-space: pre-wrap;
  word-break: break-word;
  margin-bottom: 0;
  }
}

.cursor {
  display: inline-block;
  width: 8px;
  height: 16px;
  background-color: #000;
  margin-left: 2px;
  animation: blink 1s infinite;
}

@keyframes blink {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}

.message-actions {
  display: flex;
  gap: 5px;
  margin-top: 24px;
}

.action-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 24px;
  padding: 10px;
}

@media (max-width: 768px) {
  .model-message {
    max-width: 90%;
  }
}
</style>

<style>
/* 全局样式，不使用 scoped */
.custom-tooltip {
  font-size: 19px !important; /* 增大提示文字大小 */
  padding: 8px 12px !important; /* 增加内边距使提示框更大 */
}
</style>