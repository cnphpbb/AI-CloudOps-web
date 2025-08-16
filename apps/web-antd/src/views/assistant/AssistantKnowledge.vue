<template>
  <div>
    <h1>知识库管理</h1>
    <p>AI助手知识库管理页面</p>
  </div>
</template>

<script setup lang="ts">
// 知识库管理页面
// 对应API: /api/v1/assistant/knowledge/list (GET) - 获取知识列表
// 对应API: /api/v1/assistant/knowledge/create (POST) - 创建知识（添加到向量库并落库）
// 对应API: /api/v1/assistant/knowledge/refresh (POST) - 触发知识库刷新为异步后台任务
// 支持参数: page, size, title
</script>
