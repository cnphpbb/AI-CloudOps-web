<template>
  <div>
    <h1>工作流管理</h1>
    <p>多智能体工作流管理页面</p>
  </div>
</template>

<script setup lang="ts">
// 工作流管理页面
// 对应API: /api/v1/multi-agent/workflows/list (GET) - 获取多智能体工作流执行记录列表，支持按命名空间、状态筛选和分页查询
// 对应API: /api/v1/multi-agent/workflows/create (POST) - 创建新的多智能体工作流执行记录
// 支持参数: page, size, namespace, status, search
</script>
