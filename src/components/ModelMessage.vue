<template>
  <div class="model-message">
    <!-- 思考过程区域 -->
    <div v-if="thinkingContent" class="thinking-content">
      <div class="thinking-header">
        <el-icon class="loading" v-if="!content"><Loading /></el-icon>
        <span>思考过程 </span>
        <el-icon v-if="showArrow" class="arrow" @click="toggleArrow"><ArrowDown /></el-icon>
        <el-icon v-else class="arrow" @click="toggleArrow"><ArrowRight /></el-icon>
      </div>
      <div v-if="showArrow" class="thinking-text" v-html="renderedThinking"></div>
    </div>

    <!-- 错误消息区域 -->
    <div v-if="error" class="error-content">
      <div class="error-text">
        <el-icon><Warning /></el-icon>
        <span>{{ error }}</span>
      </div>
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

<script setup>
import { CopyDocument, RefreshLeft, Loading, ArrowDown, ArrowRight, Warning } from '@element-plus/icons-vue';
import { ElTooltip, ElMessage } from 'element-plus';
import { marked } from 'marked';
import hljs from 'highlight.js';
import { ref, computed, nextTick, onMounted, onUpdated } from 'vue';
import 'highlight.js/styles/github.css';
import 'highlight.js/lib/languages/xml';
import 'highlight.js/lib/languages/javascript';
import 'highlight.js/lib/languages/css';
import 'highlight.js/lib/languages/typescript';

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
                  begin: /[[\]]/, end: /[[\]]/,
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

// 定义props
const props = defineProps({
  content: {
    type: String,
    default: ''
  },
  thinkingContent: {
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
  },
  error: {
    type: String,
    default: ''
  }
});

// 定义emit
const emit = defineEmits(['regenerate']);

// 响应式状态
const showArrow = ref(true);

// 计算属性
const renderedContent = computed(() => {
  if ((!props.content || props.content.trim() === '') && !props.streaming) {
    return '<div class="error-message">数据错误，请重新生成</div>';
  }
  return marked(props.content);
});

const renderedThinking = computed(() => {
  if (!props.thinkingContent) return '';
  return marked(props.thinkingContent);
});

// 方法
const applyHighlight = () => {
  // 查找所有代码块并应用高亮
  document.querySelectorAll('.message-text pre code, .thinking-text pre code').forEach((block) => {
    if (!block.classList.contains('hljs-highlighted')) {
      hljs.highlightElement(block);
      // 添加标记，避免重复高亮
      block.classList.add('hljs-highlighted');
    }
  });
};

const copyContent = () => {
  navigator.clipboard.writeText(props.content)
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
};

const regenerateContent = () => {
  emit('regenerate');
};

const toggleArrow = () => {
  showArrow.value = !showArrow.value;
};

// 生命周期钩子
onMounted(() => {
  nextTick(() => {
    applyHighlight();
  });
});

onUpdated(() => {
  // 当内容更新且不再流式传输时，应用代码高亮
  if (!props.streaming) {
    nextTick(() => {
      applyHighlight();
    });
  }
});
</script>

<style scoped lang="scss">
.model-message {
  display: flex;
  flex-direction: column;
  padding: 0 18.75px;
  border-radius: 10.5px;
  max-width: calc(100% - 45px);
  margin: 18.75px 15px;
  align-self: flex-start;
  // background-color: pink;
}

.thinking-content {
  background-color: rgba(144, 147, 153, 0.05);
  border-radius: 6px;
  margin-bottom: 11.25px;
  margin-top: 18px;
  border-left: 3px solid rgba(144, 147, 153, 0.8);

  .thinking-header {
    display: flex;
    align-items: center;
    color: black;
    font-weight: bold;
    font-size: 15px;
    background-color: rgba(144, 147, 153, 0.1);
    line-height: 2.5em;
    padding-left: 7.5px;
    .loading {
      margin-right: 6px;
      animation: spin 2s linear infinite;
    }
    .arrow {
      font-size: 18px;
      margin-left: 13.5px;
      cursor: pointer;
    }
  }

  .thinking-text {
    margin-top: 15px;
    font-size: 15px;
    margin-left: 21px;
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
  font-size: 18.75px;
  line-height: 2.2;
  .message-text {
    word-break: break-word;
    margin-bottom: 0;
  }
}

.cursor {
  display: inline-block;
  width: 6px;
  height: 12px;
  background-color: #000;
  margin-left: 1.5px;
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
  gap: 3.75px;
  margin-top: 18px;
}

.action-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 18px;
  padding: 7.5px;
}

@media (max-width: 768px) {
  .model-message {
    max-width: 90%;
  }
}
</style>

<style lang="scss">
/* 全局样式，不使用 scoped */
.custom-tooltip {
  font-size: 14.25px !important; /* 增大提示文字大小 */
  padding: 6px 9px !important; /* 增加内边距使提示框更大 */
}

/* 增大消息提示的样式 */
.large-message {
  position: fixed!important;
  display: flex!important;
  justify-content: space-between!important;
  left: 700px;
  background-color: rgb(219, 220, 222);
  border-radius: 10.5px!important;
  margin: 0 auto;
  min-width: 135px !important;
  padding: 9px 15px !important;
}

/* 明确定位消息文本 */
.large-message .el-message__content {
  font-size: 18px !important;
  /* font-weight: bold !important; */
  line-height: 1.5 !important;
}

/* 调整消息图标大小 */
.large-message .el-message__icon {
  font-size: 22.5px !important;
  margin-right: 6px !important;
}

/* Markdown样式 */
.message-text, .thinking-text {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
}

.message-text h1, .thinking-text h1 {
  font-size: 1.5em;
  margin-top: 0.5em;
  margin-bottom: 0.5em;
  font-weight: 600;
  border-bottom: 1px solid #eaecef;
  padding-bottom: 0.3em;
}

.message-text h2, .thinking-text h2 {
  font-size: 1.16em;
  margin-top: 0.5em;
  margin-bottom: 0.5em;
  font-weight: 600;
  border-bottom: 1px solid #eaecef;
  padding-bottom: 0.3em;
}

.message-text h3, .thinking-text h3 {
  font-size: 1.09em;
  margin-top: 0.5em;
  margin-bottom: 0.5em;
  font-weight: 600;
}

.message-text h4, .thinking-text h4 {
  font-size: 0.975em;
  margin-top: 0.5em;
  margin-bottom: 0.5em;
  font-weight: 600;
}

.message-text p, .thinking-text p {
  margin: 0;
}

.message-text pre, .thinking-text pre {
  background-color: #f6f8fa;
  border-radius: 4.5px;
  padding: 12px;
  overflow: auto;
  font-family: SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace;
  /* font-size: 85%; */
  line-height: 1.45;
}

.message-text code, .thinking-text code {
  background-color: rgba(27, 31, 35, 0.05);
  border-radius: 2.25px;
  font-family: SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace;
  /* font-size: 85%; */
  margin: 0;
  padding: 0.15em 0.3em;
}

.message-text pre code, .thinking-text pre code {
  background-color: transparent;
  padding: 0;
}

.message-text blockquote, .thinking-text blockquote {
  border-left: 0.19em solid #dfe2e5;
  color: #6a737d;
  padding: 0 0.75em;
  margin: 0 0 12px 0;
}

.message-text ul, .message-text ol, .thinking-text ul, .thinking-text ol {
  padding-left: 1.5em;
  margin-top: 0.5em;
  margin-bottom: 0.5em;
}

.message-text table, .thinking-text table {
  border-collapse: collapse;
  margin: 0.75em 0;
  overflow: auto;
  width: 100%;
}

.message-text table th, .message-text table td, .thinking-text table th, .thinking-text table td {
  border: 1px solid #dfe2e5;
  padding: 4.5px 9.75px;
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
  height: 0.19em;
  padding: 0;
  margin: 18px 0;
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

.error-content {
  background-color: rgba(245, 108, 108, 0.1);
  border-radius: 6px;
  margin-bottom: 11.25px;
  margin-top: 18px;
  border-left: 3px solid #f56c6c;
  padding: 12px;

  .error-text {
    display: flex;
    align-items: center;
    color: #f56c6c;
    font-size: 15px;
    gap: 8px;

    .el-icon {
      font-size: 18px;
    }
  }
}
</style>