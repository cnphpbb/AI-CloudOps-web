<template>
  <div>
    <a-card title="问题诊断" :bordered="false">
      <a-form :model="form" label-col="{span:6}" wrapper-col="{span:14}">
        <a-form-item label="命名空间"><a-input v-model:value="form.namespace" placeholder="default" /></a-form-item>
        <a-form-item label="部署"><a-input v-model:value="form.deployment" placeholder="可选：指定部署" /></a-form-item>
        <a-form-item>
          <a-button type="primary" @click="run" :loading="loading">开始诊断</a-button>
        </a-form-item>
      </a-form>
      <a-card v-if="resp" style="margin-top: 12px" title="诊断结果">
        <pre style="white-space: pre-wrap">{{ pretty(resp) }}</pre>
      </a-card>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { autofixDiagnoseApi } from '#/api';

const form = reactive({ namespace: 'default', deployment: '' });
const resp = ref<any | null>(null);
const loading = ref(false);

function pretty(v: any) { try { return JSON.stringify(v ?? {}, null, 2); } catch { return String(v ?? ''); } }

async function run() { loading.value = true; try { resp.value = await autofixDiagnoseApi({ namespace: form.namespace || null, deployment: form.deployment || null }); } finally { loading.value = false; } }
</script>
