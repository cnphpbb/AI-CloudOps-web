<template>
  <div class="markdown-renderer" v-html="renderedContent"></div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

interface Props {
  content: string;
}

const props = withDefaults(defineProps<Props>(), {
  content: ''
});

// 简单的 Markdown 渲染器
const renderedContent = computed(() => {
  if (!props.content) return '';

  let html = props.content;

  // 转义 HTML 特殊字符
  html = html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  // 处理代码块
  html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
    return `<pre class="code-block"><code class="language-${lang || 'text'}">${code.trim()}</code></pre>`;
  });

  // 处理行内代码
  html = html.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');

  // 处理标题
  html = html.replace(/^### (.*$)/gim, '<h3 class="h3">$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2 class="h2">$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1 class="h1">$1</h1>');

  // 处理粗体
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="bold">$1</strong>');

  // 处理斜体
  html = html.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');

  // 处理链接
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="link" target="_blank" rel="noopener noreferrer">$1</a>');

  // 处理无序列表
  html = html.replace(/^[\s]*[\-\*\+][\s]+(.*$)/gim, '<li class="list-item">$1</li>');
  html = html.replace(/(<li class="list-item">.*<\/li>)/s, '<ul class="list">$1</ul>');

  // 处理有序列表
  html = html.replace(/^[\s]*\d+\.[\s]+(.*$)/gim, '<li class="ordered-list-item">$1</li>');
  html = html.replace(/(<li class="ordered-list-item">.*<\/li>)/s, '<ol class="ordered-list">$1</ol>');

  // 处理换行
  html = html.replace(/\n\n/g, '</p><p class="paragraph">');
  html = html.replace(/\n/g, '<br>');

  // 包装段落
  if (html && !html.startsWith('<')) {
    html = `<p class="paragraph">${html}</p>`;
  }

  // 处理引用
  html = html.replace(/^&gt;[\s]+(.*$)/gim, '<blockquote class="blockquote">$1</blockquote>');

  // 处理分隔线
  html = html.replace(/^[\s]*---[\s]*$/gim, '<hr class="divider">');

  return html;
});
</script>

<style scoped>
.markdown-renderer {
  line-height: 1.6;
  color: #333;
  font-size: 14px;
}

/* 标题样式 */
.markdown-renderer :deep(.h1) {
  font-size: 24px;
  font-weight: bold;
  margin: 20px 0 16px 0;
  color: #1a1a1a;
  border-bottom: 2px solid #1890ff;
  padding-bottom: 8px;
}

.markdown-renderer :deep(.h2) {
  font-size: 20px;
  font-weight: bold;
  margin: 18px 0 14px 0;
  color: #1a1a1a;
  border-bottom: 1px solid #e8e8e8;
  padding-bottom: 6px;
}

.markdown-renderer :deep(.h3) {
  font-size: 16px;
  font-weight: bold;
  margin: 16px 0 12px 0;
  color: #1a1a1a;
}

/* 段落样式 */
.markdown-renderer :deep(.paragraph) {
  margin: 8px 0;
  line-height: 1.7;
}

/* 列表样式 */
.markdown-renderer :deep(.list) {
  margin: 12px 0;
  padding-left: 20px;
  list-style-type: disc;
}

.markdown-renderer :deep(.ordered-list) {
  margin: 12px 0;
  padding-left: 20px;
  list-style-type: decimal;
}

.markdown-renderer :deep(.list-item),
.markdown-renderer :deep(.ordered-list-item) {
  margin: 4px 0;
  line-height: 1.6;
}

/* 代码样式 */
.markdown-renderer :deep(.code-block) {
  background-color: #f6f8fa;
  border: 1px solid #e1e4e8;
  border-radius: 6px;
  padding: 16px;
  margin: 16px 0;
  overflow-x: auto;
  font-family: 'SFMono-Regular', 'Consolas', 'Liberation Mono', 'Menlo', monospace;
  font-size: 13px;
  line-height: 1.45;
}

.markdown-renderer :deep(.code-block code) {
  background: none;
  padding: 0;
  border: none;
  font-size: inherit;
}

.markdown-renderer :deep(.inline-code) {
  background-color: #f1f3f4;
  border: 1px solid #e8eaed;
  border-radius: 3px;
  padding: 2px 4px;
  font-family: 'SFMono-Regular', 'Consolas', 'Liberation Mono', 'Menlo', monospace;
  font-size: 12px;
  color: #d73a49;
}

/* 链接样式 */
.markdown-renderer :deep(.link) {
  color: #1890ff;
  text-decoration: none;
  border-bottom: 1px solid transparent;
  transition: all 0.2s ease;
}

.markdown-renderer :deep(.link:hover) {
  color: #40a9ff;
  border-bottom-color: #40a9ff;
}

/* 粗体和斜体 */
.markdown-renderer :deep(.bold) {
  font-weight: 600;
  color: #1a1a1a;
}

.markdown-renderer :deep(.italic) {
  font-style: italic;
  color: #666;
}

/* 引用样式 */
.markdown-renderer :deep(.blockquote) {
  margin: 16px 0;
  padding: 8px 16px;
  background-color: #f8f9fa;
  border-left: 4px solid #1890ff;
  color: #666;
  font-style: italic;
}

/* 分隔线样式 */
.markdown-renderer :deep(.divider) {
  margin: 24px 0;
  border: none;
  height: 1px;
  background-color: #e8e8e8;
}

/* 表格样式（如果需要） */
.markdown-renderer :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 16px 0;
  font-size: 13px;
}

.markdown-renderer :deep(th),
.markdown-renderer :deep(td) {
  border: 1px solid #e8e8e8;
  padding: 8px 12px;
  text-align: left;
}

.markdown-renderer :deep(th) {
  background-color: #f6f8fa;
  font-weight: 600;
  color: #1a1a1a;
}

.markdown-renderer :deep(tr:nth-child(even)) {
  background-color: #f9f9f9;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .markdown-renderer {
    font-size: 13px;
  }

  .markdown-renderer :deep(.h1) {
    font-size: 20px;
  }

  .markdown-renderer :deep(.h2) {
    font-size: 18px;
  }

  .markdown-renderer :deep(.h3) {
    font-size: 16px;
  }

  .markdown-renderer :deep(.code-block) {
    padding: 12px;
    font-size: 12px;
  }

  .markdown-renderer :deep(.list),
  .markdown-renderer :deep(.ordered-list) {
    padding-left: 16px;
  }
}

/* 滚动条样式 */
.markdown-renderer :deep(.code-block)::-webkit-scrollbar {
  height: 6px;
}

.markdown-renderer :deep(.code-block)::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.markdown-renderer :deep(.code-block)::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.markdown-renderer :deep(.code-block)::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 打印样式 */
@media print {
  .markdown-renderer :deep(.link) {
    color: #000 !important;
    text-decoration: underline !important;
  }

  .markdown-renderer :deep(.code-block) {
    background-color: #f9f9f9 !important;
    border: 1px solid #ccc !important;
  }
}
</style>
