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

<script setup>
import { CopyDocument, EditPen } from '@element-plus/icons-vue'
import { ElTooltip, ElMessage } from 'element-plus'

// 定义props
const props = defineProps({
  content: {
    type: String,
    default: ''
  }
})

// 定义emit
const emit = defineEmits(['edit-message'])

// 方法
const copyContent = () => {
  // 复制内容到剪贴板
  navigator.clipboard.writeText(props.content)
    .then(() => {
      // 复制成功后显示提示
      ElMessage({
        message: '复制成功',
        type: 'success',
        duration: 2000,
        offset: 100, // 设置距离顶部的距离为100px
        customClass: 'large-message' // 添加自定义类名
      })
    })
    .catch(err => {
      console.error('复制失败:', err)
      ElMessage({
        message: '复制失败',
        type: 'error',
        duration: 2000,
        offset: 100, // 设置距离顶部的距离为100px
        customClass: 'large-message' // 添加自定义类名
      })
    })
}

const editContent = () => {
  // 发射编辑事件，将内容传递给父组件
  emit('edit-message', props.content)
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
  font-size: 25px;
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
/* 增大消息提示的样式 */
.large-message {
  min-width: 180px !important;
  padding: 12px 20px !important;
}

/* 明确定位消息文本 */
.large-message .el-message__content {
  font-size: 24px !important;
  /* font-weight: bold !important; */
  line-height: 1.5 !important;
}

/* 调整消息图标大小 */
.large-message .el-message__icon {
  font-size: 30px !important;
  margin-right: 8px !important;
}
</style>