<template>
  <div class="model-message">
    <!-- 思考过程区域 -->
    <div v-if="showThinking && thinkingContent" class="thinking-content">
      <div class="thinking-header">
        <el-icon><Loading /></el-icon>
        <span>思考过程</span>
      </div>
      <div class="thinking-text" v-html="renderedThinking"></div>
    </div>
    
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
import { CopyDocument, RefreshLeft, Loading } from '@element-plus/icons-vue';
import { ElTooltip, ElMessage } from 'element-plus';
import { marked } from 'marked';
import hljs from 'highlight.js';
import 'highlight.js/styles/github.css';
import 'highlight.js/lib/languages/xml';
import 'highlight.js/lib/languages/javascript';
import 'highlight.js/lib/languages/css';
import 'highlight.js/lib/languages/typescript';
import { useChatStore } from '../stores/chat';
import { computed } from 'vue';

// 注册Vue语言支持（通过组合HTML、JS和CSS）
hljs.registerLanguage('vue', function(hljs) {
  return {
    subLanguage: ['xml', 'javascript', 'css', 'typescript'],
    contains: [
      hljs.COMMENT(
        '/\\*',
        '\\*/',
        {
          relevance: 0,
          contains: [
            {
              className: 'doctag',
              begin: '@[A-Za-z]+',
              contains: [
                {
                  className: 'type',
                  begin: '\\{',
                  end: '\\}',
                  relevance: 0
                },
                {
                  className: 'variable',
                  begin: '[A-Za-z$_][0-9A-Za-z$_]*(?=\\s*(-)|$)',
                  relevance: 0
                },
                {
                  begin: /[\[\]]/, end: /[\[\]]/, 
                  relevance: 0,
                  contains: [
                    {
                      className: 'type',
                      begin: '\\{',
                      end: '\\}',
                      relevance: 0
                    },
                    {
                      className: 'variable',
                      begin: '[A-Za-z$_][0-9A-Za-z$_]*(?=\\s*(-)|$)',
                      relevance: 0
                    }
                  ]
                }
              ]
            }
          ]
        }
      )
    ]
  };
});

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
    Loading,
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
  setup() {
    const chatStore = useChatStore();
    
    // 获取思考过程内容和状态
    const thinkingContent = computed(() => chatStore.thinkingContent);
    const showThinking = computed(() => chatStore.isThinking);
    
    return {
      thinkingContent,
      showThinking
    };
  },
  computed: {
    renderedContent() {
      if ((!this.content || this.content.trim() === '') && !this.streaming) {
        return '<div class="error-message">数据错误，请重新生成</div>';
      }
      return marked(this.content);
    },
    renderedThinking() {
      if (!this.thinkingContent) return '';
      return marked(this.thinkingContent);
    }
  },
  mounted() {
    this.$nextTick(() => {
      this.applyHighlight();
    });
  },
  updated() {
    // 当内容更新且不再流式传输时，应用代码高亮
    if (!this.streaming) {
      this.$nextTick(() => {
        this.applyHighlight();
      });
    }
  },
  methods: {
    applyHighlight() {
      // 查找所有代码块并应用高亮
      document.querySelectorAll('.message-text pre code, .thinking-text pre code').forEach((block) => {
        if (!block.classList.contains('hljs-highlighted')) {
          hljs.highlightElement(block);
          // 添加标记，避免重复高亮
          block.classList.add('hljs-highlighted');
        }
      });
    },
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

.thinking-content {
  background-color: #f5f7fa;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 15px;
  margin-top: 24px;
  border-left: 4px solid #409eff;
  
  .thinking-header {
    display: flex;
    align-items: center;
    margin-bottom: 10px;
    color: #409eff;
    font-weight: bold;
    font-size: 20px;
    
    .el-icon {
      margin-right: 8px;
      animation: spin 2s linear infinite;
    }
  }
  
  .thinking-text {
    font-size: 20px;
    line-height: 1.8;
    color: #606266;
    white-space: pre-wrap;
    word-break: break-word;
  }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
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
.message-text, .thinking-text {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
}

.message-text h1, .thinking-text h1 {
  font-size: 2em;
  margin-top: 0.5em;
  margin-bottom: 0.5em;
  font-weight: 600;
  border-bottom: 1px solid #eaecef;
  padding-bottom: 0.3em;
}

.message-text h2, .thinking-text h2 {
  font-size: 1.55em;
  margin-top: 0.5em;
  margin-bottom: 0.5em;
  font-weight: 600;
  border-bottom: 1px solid #eaecef;
  padding-bottom: 0.3em;
}

.message-text h3, .thinking-text h3 {
  font-size: 1.45em;
  margin-top: 0.5em;
  margin-bottom: 0.5em;
  font-weight: 600;
}

.message-text h4, .thinking-text h4 {
  font-size: 1.3em;
  margin-top: 0.5em;
  margin-bottom: 0.5em;
  font-weight: 600;
}

.message-text p, .thinking-text p {
  margin: 0;
}

.message-text pre, .thinking-text pre {
  background-color: #f6f8fa;
  border-radius: 6px;
  padding: 16px;
  overflow: auto;
  font-family: SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace;
  /* font-size: 85%; */
  line-height: 1.45;
}

.message-text code, .thinking-text code {
  background-color: rgba(27, 31, 35, 0.05);
  border-radius: 3px;
  font-family: SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace;
  /* font-size: 85%; */
  margin: 0;
  padding: 0.2em 0.4em;
}

.message-text pre code, .thinking-text pre code {
  background-color: transparent;
  padding: 0;
}

.message-text blockquote, .thinking-text blockquote {
  border-left: 0.25em solid #dfe2e5;
  color: #6a737d;
  padding: 0 1em;
  margin: 0 0 16px 0;
}

.message-text ul, .message-text ol, .thinking-text ul, .thinking-text ol {
  padding-left: 2em;
  margin-top: 0.5em;
  margin-bottom: 0.5em;
}

.message-text table, .thinking-text table {
  border-collapse: collapse;
  margin: 1em 0;
  overflow: auto;
  width: 100%;
}

.message-text table th, .message-text table td, .thinking-text table th, .thinking-text table td {
  border: 1px solid #dfe2e5;
  padding: 6px 13px;
}

.message-text table tr, .thinking-text table tr {
  background-color: #fff;
  border-top: 1px solid #c6cbd1;
}

.message-text table tr:nth-child(2n), .thinking-text table tr:nth-child(2n) {
  background-color: #f6f8fa;
}

.message-text img, .thinking-text img {
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