<template>
  <div>
    <a-card :bordered="false" title="预测服务健康" :loading="loading">
      <a-result :status="statusType" :title="statusTitle" :sub-title="'服务状态：' + (detail?.status || '-')" />
      <a-card title="详情" v-if="detail?.details">
        <pre style="white-space: pre-wrap">{{ pretty(detail?.details) }}</pre>
      </a-card>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { predictHealthApi } from '#/api';

const loading = ref(false);
const detail = ref<any | null>(null);

function pretty(v: any) {
  try { return JSON.stringify(v ?? {}, null, 2); } catch { return String(v ?? ''); }
}

const statusType = computed(() => (detail.value?.status === 'ok' || detail.value?.status === 'healthy') ? 'success' : 'warning');
const statusTitle = computed(() => (detail.value?.status === 'ok' || detail.value?.status === 'healthy') ? '服务正常' : '注意：服务可能异常');

async function fetchData() {
  loading.value = true;
  try {
    detail.value = await predictHealthApi();
  } finally {
    loading.value = false;
  }
}

onMounted(fetchData);
</script>
