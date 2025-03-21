<template>
  <div class="model-message">
    <div class="message-content">
      <div class="message-text" v-html="renderedContent">
      </div>
      <span v-if="streaming" class="cursor"></span>
    </div>
    <div class="message-actions" v-if="!streaming">
      <el-tooltip content="复制" placement="top" :effect="'dark'" popper-class="custom-tooltip">
        <button class="action-btn" @click="copyContent"><el-icon><CopyDocument /></el-icon></button>
      </el-tooltip>
      <el-tooltip content="重新生成" placement="top" :effect="'dark'" popper-class="custom-tooltip" v-if="isLastMessage">
        <button class="action-btn" @click="regenerateContent"><el-icon><RefreshLeft /></el-icon></button>
      </el-tooltip>
    </div>
  </div>
</template>

<script>
import { CopyDocument, RefreshLeft } from '@element-plus/icons-vue';
import { ElTooltip, ElMessage } from 'element-plus';
import { marked } from 'marked';
import hljs from 'highlight.js';
import 'highlight.js/styles/github.css';

// 配置marked使用highlight.js
marked.setOptions({
  highlight: function(code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(code, { language: lang }).value;
      } catch (err) {
        console.error("Highlight.js error:", err);
      }
    }
    return hljs.highlightAuto(code).value;
  },
  breaks: true,
  langPrefix: 'language-'
});

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
    isLastMessage: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    renderedContent() {
      return this.content ? marked(this.content) : '';
    }
  },
  mounted() {
    this.$nextTick(() => {
      document.querySelectorAll('pre code').forEach((block) => {
        hljs.highlightBlock(block);
      });
    });
  },
  methods: {
    copyContent() {
      navigator.clipboard.writeText(this.content)
        .then(() => {
          ElMessage({
            message: '复制成功',
            type: 'success',
            duration: 2000,
            offset: 100,
            customClass: 'large-message'
          });
        })
        .catch(err => {
          console.error('复制失败:', err);
          ElMessage({
            message: '复制失败',
            type: 'error',
            duration: 2000,
            offset: 100,
            customClass: 'large-message'
          });
        });
    },
    regenerateContent() {
      this.$emit('regenerate');
    }
  }
};
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
  font-size: 25px;
  line-height: 2.2;
  .message-text {
    margin-top: 23px;
    // white-space: pre-wrap;
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

/* Markdown样式 */
.message-text {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
}

.message-text h1 {
  font-size: 2em;
  margin-top: 0.5em;
  margin-bottom: 0.5em;
  font-weight: 600;
  border-bottom: 1px solid #eaecef;
  padding-bottom: 0.3em;
}

.message-text h2 {
  font-size: 1.55em;
  margin-top: 0.5em;
  margin-bottom: 0.5em;
  font-weight: 600;
  border-bottom: 1px solid #eaecef;
  padding-bottom: 0.3em;
}

.message-text h3 {
  font-size: 1.45em;
  margin-top: 0.5em;
  margin-bottom: 0.5em;
  font-weight: 600;
}

.message-text h4 {
  font-size: 1.3em;
  margin-top: 0.5em;
  margin-bottom: 0.5em;
  font-weight: 600;
}

.message-text p {
  margin-top: 0.5em;
  margin-bottom: 0.5em;
}

.message-text pre {
  background-color: #f6f8fa;
  border-radius: 6px;
  padding: 16px;
  overflow: auto;
  font-family: SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace;
  /* font-size: 85%; */
  line-height: 1.45;
}

.message-text code {
  background-color: rgba(27, 31, 35, 0.05);
  border-radius: 3px;
  font-family: SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace;
  /* font-size: 85%; */
  margin: 0;
  padding: 0.2em 0.4em;
}

.message-text pre code {
  background-color: transparent;
  padding: 0;
}

.message-text blockquote {
  border-left: 0.25em solid #dfe2e5;
  color: #6a737d;
  padding: 0 1em;
  margin: 0 0 16px 0;
}

.message-text ul, .message-text ol {
  padding-left: 2em;
  margin-top: 0.5em;
  margin-bottom: 0.5em;
}

.message-text table {
  border-collapse: collapse;
  margin: 1em 0;
  overflow: auto;
  width: 100%;
}

.message-text table th, .message-text table td {
  border: 1px solid #dfe2e5;
  padding: 6px 13px;
}

.message-text table tr {
  background-color: #fff;
  border-top: 1px solid #c6cbd1;
}

.message-text table tr:nth-child(2n) {
  background-color: #f6f8fa;
}

.message-text img {
  max-width: 100%;
  box-sizing: content-box;
}

.message-text hr {
  height: 0.25em;
  padding: 0;
  margin: 24px 0;
  background-color: #e1e4e8;
  border: 0;
}

/* 确保highlight.js样式能正确应用 */
.message-text .hljs {
  display: block !important;
  overflow-x: auto !important;
  padding: 0 !important;
  background: transparent !important;
  color: #24292e !important;
}

/* 强制应用highlight.js的语法高亮样式 */
.message-text .hljs-keyword,
.message-text .hljs-selector-tag,
.message-text .hljs-subst {
  color: #d73a49 !important;
  font-weight: bold !important;
}
</style>