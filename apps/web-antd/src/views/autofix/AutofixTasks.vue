<template>
  <div>
    <a-card title="任务管理" :bordered="false">
      <a-form :model="form" label-col="{span:6}" wrapper-col="{span:14}">
        <a-form-item label="部署" required><a-input v-model:value="form.deployment" /></a-form-item>
        <a-form-item label="命名空间"><a-input v-model:value="form.namespace" placeholder="default" /></a-form-item>
        <a-form-item label="事件"><a-input v-model:value="form.event" placeholder="告警/自定义事件" /></a-form-item>
        <a-form-item label="强制执行"><a-switch v-model:checked="form.force" /></a-form-item>
        <a-form-item label="自动重启"><a-switch v-model:checked="form.auto_restart" /></a-form-item>
        <a-form-item>
          <a-button type="primary" @click="create" :loading="loading">创建任务</a-button>
        </a-form-item>
      </a-form>
      <a-card v-if="resp" style="margin-top: 12px" title="创建结果"><pre style="white-space: pre-wrap">{{ pretty(resp) }}</pre></a-card>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { message } from 'ant-design-vue';
import { createAutofixApi } from '#/api';

const form = reactive({ deployment: '', namespace: 'default', event: '', force: false, auto_restart: true });
const loading = ref(false);
const resp = ref<any | null>(null);

function pretty(v: any) { try { return JSON.stringify(v ?? {}, null, 2); } catch { return String(v ?? ''); } }

async function create() {
  if (!form.deployment || !form.event) { message.warning('请填写部署与事件'); return; }
  loading.value = true;
  try { resp.value = await createAutofixApi({ ...form }); message.success('已创建'); } finally { loading.value = false; }
}
</script>
