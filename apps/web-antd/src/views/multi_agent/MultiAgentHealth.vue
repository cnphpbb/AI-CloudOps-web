<template>
  <div>
    <a-card :bordered="false" title="多智能体服务健康" :loading="loading">
      <a-result :status="resultStatus" :title="titleText" :sub-title="'系统状态：' + (detail?.status || '-')" />
      <a-card v-if="detail?.details" title="详情" style="margin-top: 12px">
        <pre style="white-space: pre-wrap">{{ pretty(detail?.details) }}</pre>
      </a-card>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { multiAgentHealthDetailApi } from '#/api';

const loading = ref(false);
const detail = ref<any | null>(null);

const resultStatus = computed(() => (detail.value?.status === 'ok' || detail.value?.status === 'healthy') ? 'success' : 'warning');
const titleText = computed(() => (detail.value?.status === 'ok' || detail.value?.status === 'healthy') ? '服务正常' : '注意：服务可能异常');

function pretty(v: any) { try { return JSON.stringify(v ?? {}, null, 2); } catch { return String(v ?? ''); } }

async function fetchData() {
  loading.value = true;
  try { detail.value = await multiAgentHealthDetailApi(); } finally { loading.value = false; }
}

onMounted(fetchData);
</script>
