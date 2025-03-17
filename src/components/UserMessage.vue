<template>
  <div class="user-message">
    <div class="message-content">
      <div class="message-text">{{ content }}</div>
    </div>
    <div class="message-actions">
      <button class="action-btn"><el-icon><CopyDocument /></el-icon></button>
      <button class="action-btn"><el-icon><EditPen /></el-icon></button>
    </div>
  </div>
</template>

<script>
import { CopyDocument, EditPen } from '@element-plus/icons-vue'

export default {
  name: 'UserMessage',
  components: {
    CopyDocument,
    EditPen
  },
  props: {
    content: {
      type: String,
      default: ''
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