<template>
  <div>
    <h1>知识详情</h1>
    <p>知识库详情页面 - ID: {{ $route.params.id }}</p>
  </div>
</template>

<script setup lang="ts">
// 知识详情页面
// 对应API: /api/v1/assistant/knowledge/detail/{id} (GET) - 获取知识详情
// 对应API: /api/v1/assistant/knowledge/update/{id} (PUT) - 更新知识
// 对应API: /api/v1/assistant/knowledge/delete/{id} (DELETE) - 删除知识（软删除）
</script>
