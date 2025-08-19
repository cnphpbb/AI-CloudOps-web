<template>
  <div>
    <a-card title="服务管理" :bordered="false">
      <a-space>
        <a-button type="primary" @click="onRefreshModel" :loading="loadingRefresh">刷新模型</a-button>
        <a-button danger @click="onReinitialize" :loading="loadingInit">重新初始化服务</a-button>
      </a-space>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { message } from 'ant-design-vue';
import { refreshModelApi, reinitializePredictionServiceApi } from '#/api';

const loadingRefresh = ref(false);
const loadingInit = ref(false);

async function onRefreshModel() {
  loadingRefresh.value = true;
  try {
    const res = await refreshModelApi();
    if ((res as any)?.success) message.success('模型刷新成功');
    else message.info((res as any)?.message || '已触发刷新');
  } finally {
    loadingRefresh.value = false;
  }
}

async function onReinitialize() {
  loadingInit.value = true;
  try {
    const res = await reinitializePredictionServiceApi();
    if ((res as any)?.success) message.success('服务已重新初始化');
    else message.info((res as any)?.message || '已触发重新初始化');
  } finally {
    loadingInit.value = false;
  }
}
</script>
