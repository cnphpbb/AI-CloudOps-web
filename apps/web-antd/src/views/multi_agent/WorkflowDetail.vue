<template>
  <div>
    <h1>工作流详情</h1>
    <p>工作流详情页面 - Record ID: {{ $route.params.recordId }}</p>
  </div>
</template>

<script setup lang="ts">
// 工作流详情页面
// 对应API: /api/v1/multi-agent/workflows/detail/{record_id} (GET) - 根据记录ID获取指定工作流记录的详细信息
// 对应API: /api/v1/multi-agent/workflows/update/{record_id} (PUT) - 更新指定ID的工作流记录信息
// 对应API: /api/v1/multi-agent/workflows/delete/{record_id} (DELETE) - 软删除指定ID的工作流记录
</script>
