<template>
  <div>
    <a-card :loading="loading" :bordered="false" title="模型详情">
      <a-descriptions bordered :column="2">
        <a-descriptions-item label="ID">{{ detail?.id }}</a-descriptions-item>
        <a-descriptions-item label="名称">{{ detail?.name }}</a-descriptions-item>
        <a-descriptions-item label="版本">{{ detail?.version }}</a-descriptions-item>
        <a-descriptions-item label="状态">{{ detail?.status }}</a-descriptions-item>
      </a-descriptions>
      <a-card title="参数" style="margin-top: 12px">
        <pre style="white-space: pre-wrap">{{ pretty(detail?.parameters) }}</pre>
      </a-card>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { getModelDetailApi } from '#/api';

const route = useRoute();
const loading = ref(false);
const detail = ref<any | null>(null);

function pretty(data: any) {
  try {
    return JSON.stringify(data ?? {}, null, 2);
  } catch (e) {
    return String(data ?? '');
  }
}

async function fetchDetail() {
  loading.value = true;
  try {
    const id = String(route.params.id);
    detail.value = await getModelDetailApi(id);
  } finally {
    loading.value = false;
  }
}

onMounted(fetchDetail);
</script>
