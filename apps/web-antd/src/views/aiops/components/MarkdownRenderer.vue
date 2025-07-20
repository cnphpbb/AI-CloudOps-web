<template>
  <div class="markdown-renderer" v-html="renderedHtml"></div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

interface Props {
  content: string;
}

const props = defineProps<Props>();

// 配置 marked 选项（修复 headerIds 报错，移除不支持的 headerIds/mangle）
marked.setOptions({
  breaks: true,
  gfm: true
});

// 渲染 Markdown 内容
const renderedHtml = computed(() => {
  if (!props.content) return '';
  try {
    // 先用 marked 解析 Markdown
    const html = marked.parse(props.content) as string;
    // 然后用 DOMPurify 清理 HTML 防止 XSS
    return DOMPurify.sanitize(html);
  } catch (error) {
    console.error('Markdown 渲染失败:', error);
    return `<p>渲染失败: ${props.content}</p>`;
  }
});
</script>

<style scoped>
.markdown-renderer {
  line-height: 1.6;
  color: #333;
}

/* Markdown 内容样式 */
.markdown-renderer :deep(h1) {
  font-size: 1.8em;
  font-weight: bold;
  margin: 20px 0 10px 0;
  padding-bottom: 8px;
  border-bottom: 2px solid #1890ff;
  color: #1890ff;
}

.markdown-renderer :deep(h2) {
  font-size: 1.5em;
  font-weight: bold;
  margin: 18px 0 8px 0;
  color: #1890ff;
}

.markdown-renderer :deep(h3) {
  font-size: 1.3em;
  font-weight: bold;
  margin: 16px 0 6px 0;
  color: #1890ff;
}

.markdown-renderer :deep(h4) {
  font-size: 1.1em;
  font-weight: bold;
  margin: 14px 0 4px 0;
  color: #1890ff;
}

.markdown-renderer :deep(p) {
  margin: 8px 0;
  text-align: justify;
}

.markdown-renderer :deep(ul),
.markdown-renderer :deep(ol) {
  margin: 10px 0;
  padding-left: 20px;
}

.markdown-renderer :deep(li) {
  margin: 4px 0;
}

.markdown-renderer :deep(blockquote) {
  margin: 10px 0;
  padding: 10px 15px;
  background-color: #f6f8fa;
  border-left: 4px solid #1890ff;
  color: #666;
}

.markdown-renderer :deep(code) {
  background-color: #f1f3f4;
  padding: 2px 4px;
  border-radius: 3px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.9em;
}

.markdown-renderer :deep(pre) {
  background-color: #f6f8fa;
  padding: 15px;
  border-radius: 6px;
  overflow-x: auto;
  margin: 10px 0;
}

.markdown-renderer :deep(pre code) {
  background-color: transparent;
  padding: 0;
}

.markdown-renderer :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 15px 0;
}

.markdown-renderer :deep(th),
.markdown-renderer :deep(td) {
  border: 1px solid #ddd;
  padding: 8px 12px;
  text-align: left;
}

.markdown-renderer :deep(th) {
  background-color: #f5f5f5;
  font-weight: bold;
}

.markdown-renderer :deep(a) {
  color: #1890ff;
  text-decoration: none;
}

.markdown-renderer :deep(a:hover) {
  text-decoration: underline;
}

.markdown-renderer :deep(strong) {
  font-weight: bold;
  color: #d73027;
}

.markdown-renderer :deep(em) {
  font-style: italic;
}

.markdown-renderer :deep(hr) {
  border: none;
  border-top: 1px solid #ddd;
  margin: 20px 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .markdown-renderer :deep(h1) {
    font-size: 1.5em;
  }
  
  .markdown-renderer :deep(h2) {
    font-size: 1.3em;
  }
  
  .markdown-renderer :deep(h3) {
    font-size: 1.2em;
  }
  
  .markdown-renderer :deep(table) {
    font-size: 0.9em;
  }
  
  .markdown-renderer :deep(th),
  .markdown-renderer :deep(td) {
    padding: 6px 8px;
  }
}
</style>
