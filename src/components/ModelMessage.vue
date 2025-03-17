<template>
  <div class="model-message">
    <div class="message-content">
      <div class="message-text">
        {{ content }}
        <span v-if="streaming" class="cursor"></span>
      </div>
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
  name: 'ModelMessage',
  components: {
    CopyDocument,
    EditPen
  },
  props: {
    content: {
      type: String,
      default: ''
    },
    streaming: {
      type: Boolean,
      default: false
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
  background-color: pink;
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
  .model-message {
    max-width: 90%;
  }
}
</style>