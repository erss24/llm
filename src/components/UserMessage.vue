<template>
  <div class="user-message">
    <div class="message-content">
      <div class="message-text">{{ content }}</div>
    </div>
    <div class="message-actions">
      <el-tooltip content="复制" placement="top" :effect="'dark'" popper-class="custom-tooltip">
        <button class="action-btn" @click="copyContent"><el-icon><CopyDocument /></el-icon></button>
      </el-tooltip>
      <el-tooltip content="编辑" placement="top" :effect="'dark'" popper-class="custom-tooltip">
        <button class="action-btn" @click="editContent"><el-icon><EditPen /></el-icon></button>
      </el-tooltip>
    </div>
  </div>
</template>

<script>
import { CopyDocument, EditPen } from '@element-plus/icons-vue'
import { ElTooltip, ElMessage } from 'element-plus'

export default {
  name: 'UserMessage',
  components: {
    CopyDocument,
    EditPen,
    ElTooltip
  },
  props: {
    content: {
      type: String,
      default: ''
    }
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
    },
    editContent() {
      // 发射编辑事件，将内容传递给父组件
      this.$emit('edit-message', this.content);
    }
  }
}
</script>

<style scoped lang="scss">
.user-message {
  display: flex;
  flex-direction: column;
  padding: 0 20px;
  border-radius: 14px;
  width: fit-content;
  max-width: 75%;
  margin-left: auto;
  background-color: #e1f5fe;
  border: 1px solid #b3e5fc;
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

.message-actions {
  display: flex;
  gap: 5px;
  align-self: flex-end;
}

.action-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 24px;
  padding: 8px;
}

@media (max-width: 768px) {
  .user-message {
    max-width: 80%;
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