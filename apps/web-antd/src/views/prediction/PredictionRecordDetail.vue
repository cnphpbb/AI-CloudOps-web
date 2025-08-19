<template>
  <div>
    <a-card :loading="loading" :bordered="false" title="记录详情">
      <a-descriptions bordered :column="2">
        <a-descriptions-item label="ID">{{ detail?.id }}</a-descriptions-item>
        <a-descriptions-item label="指标">{{ detail?.metric }}</a-descriptions-item>
        <a-descriptions-item label="模型版本">{{ detail?.model_version }}</a-descriptions-item>
        <a-descriptions-item label="类型">{{ detail?.prediction_type }}</a-descriptions-item>
        <a-descriptions-item label="创建时间">{{ detail?.created_at }}</a-descriptions-item>
      </a-descriptions>

      <a-card style="margin-top: 12px" title="预测结果">
        <pre style="white-space: pre-wrap">{{ pretty(detail?.result) }}</pre>
      </a-card>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { getPredictionRecordApi } from '#/api';

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
    const id = Number(route.params.id);
    detail.value = await getPredictionRecordApi(id);
  } finally {
    loading.value = false;
  }
}

onMounted(fetchDetail);
</script>

<template>
  <div>
    <h1>预测记录详情</h1>
    <p>预测记录详情页面 - ID: {{ $route.params.id }}</p>
  </div>
</template>

<script setup lang="ts">
// 预测记录详情页面
// 对应API: /api/v1/predict/record/detail/{record_id} (GET)
// 对应API: /api/v1/predict/record/delete/{record_id} (DELETE)
</script>
