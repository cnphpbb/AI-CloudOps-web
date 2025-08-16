<template>
  <div>
    <h1>历史详情</h1>
    <p>对话历史详情页面 - ID: {{ $route.params.id }}</p>
  </div>
</template>

<script setup lang="ts">
// 历史详情页面
// 对应API: /api/v1/assistant/history/detail/{id} (GET) - 获取历史记录详情
// 对应API: /api/v1/assistant/history/delete/{id} (DELETE) - 删除历史记录（软删除）
</script>
