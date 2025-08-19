<template>
  <div>
    <a-card title="任务执行" :bordered="false">
      <a-form :model="form" label-col="{span:6}" wrapper-col="{span:14}">
        <a-form-item label="任务类型" required>
          <a-input v-model:value="form.task_type" placeholder="analysis/repair/..." />
        </a-form-item>
        <a-form-item label="优先级">
          <a-select v-model:value="form.priority" allow-clear>
            <a-select-option value="low">low</a-select-option>
            <a-select-option value="medium">medium</a-select-option>
            <a-select-option value="high">high</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="参数(JSON)">
          <a-textarea v-model:value="parametersText" :rows="5" placeholder='{"key":"value"}' />
        </a-form-item>
        <a-form-item>
          <a-space>
            <a-button type="primary" @click="onExecute" :loading="loading">执行</a-button>
            <a-button @click="reset">重置</a-button>
          </a-space>
        </a-form-item>
      </a-form>
      <a-card v-if="resp" style="margin-top: 12px" title="执行结果">
        <pre style="white-space: pre-wrap">{{ pretty(resp) }}</pre>
      </a-card>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { message } from 'ant-design-vue';
import { multiAgentExecuteApi } from '#/api';

const form = reactive({ task_type: '', priority: undefined as string|undefined, parameters: null as Record<string, any>|null });
const parametersText = ref('');
const loading = ref(false);
const resp = ref<any | null>(null);

function parseParams() {
  if (!parametersText.value) return null;
  try { return JSON.parse(parametersText.value); } catch { message.error('参数需为合法JSON'); return null; }
}

function reset() {
  form.task_type = '';
  form.priority = undefined;
  parametersText.value = '';
  resp.value = null;
}

function pretty(v: any) { try { return JSON.stringify(v ?? {}, null, 2); } catch { return String(v ?? ''); } }

async function onExecute() {
  if (!form.task_type) { message.warning('请填写任务类型'); return; }
  const params = parseParams();
  if (parametersText.value && !params) return;
  loading.value = true;
  try {
    resp.value = await multiAgentExecuteApi({ task_type: form.task_type, priority: form.priority || null, parameters: params });
    message.success('已发起执行');
  } finally {
    loading.value = false;
  }
}
</script>
