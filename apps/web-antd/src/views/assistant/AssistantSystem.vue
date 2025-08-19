<template>
  <div>
    <a-card title="系统管理" :bordered="false">
      <a-space>
        <a-button @click="onClearCache" :loading="loadingClear">清除缓存</a-button>
        <a-button danger @click="onReinit" :loading="loadingInit">重新初始化</a-button>
      </a-space>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { message } from 'ant-design-vue';
import { assistantCacheClearApi, reinitializeAssistantApi } from '#/api';

const loadingClear = ref(false);
const loadingInit = ref(false);

async function onClearCache() { loadingClear.value = true; try { const r = await assistantCacheClearApi(); message.success((r as any)?.message || '已清理'); } finally { loadingClear.value = false; } }
async function onReinit() { loadingInit.value = true; try { const r = await reinitializeAssistantApi(); message.success((r as any)?.message || '已初始化'); } finally { loadingInit.value = false; } }
</script>
