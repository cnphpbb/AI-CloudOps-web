<template>
  <div>
    <a-card :bordered="false" title="协调器状态" :loading="loading">
      <pre style="white-space: pre-wrap">{{ pretty(detail) }}</pre>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { getCoordinatorStatusDetailApi } from '#/api';

const loading = ref(false);
const detail = ref<Record<string, any>>({});

function pretty(v: any) { try { return JSON.stringify(v ?? {}, null, 2); } catch { return String(v ?? ''); } }

async function fetchData() { loading.value = true; try { detail.value = await getCoordinatorStatusDetailApi(); } finally { loading.value = false; } }

onMounted(fetchData);
</script>
