<template>
  <div>
    <h1>相关性分析详情</h1>
    <p>相关性分析详情页面 - Job ID: {{ $route.params.jobId }}</p>
  </div>
</template>

<script setup lang="ts">
// 相关性分析详情页面
// 对应API: /api/v1/rca/correlations/detail/{job_id} (GET)
// 对应API: /api/v1/rca/correlations/delete/{record_id} (DELETE)
</script>
