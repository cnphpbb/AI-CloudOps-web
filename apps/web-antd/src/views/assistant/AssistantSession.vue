<template>
  <div>
    <a-card title="会话管理" :bordered="false">
      <a-form :model="form" label-col="{span:6}" wrapper-col="{span:14}">
        <a-form-item label="SessionID"><a-input v-model:value="form.session_id" placeholder="可留空自动生成" /></a-form-item>
        <a-form-item>
          <a-space>
            <a-button type="primary" @click="create" :loading="loading">创建会话</a-button>
            <a-button @click="reset">重置</a-button>
          </a-space>
        </a-form-item>
      </a-form>
      <a-card v-if="created" style="margin-top: 12px" title="创建结果"><pre style="white-space: pre-wrap">{{ pretty(created) }}</pre></a-card>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { message } from 'ant-design-vue';
import { assistantSessionCreateApi } from '#/api';

const form = reactive({ session_id: '' });
const created = ref<any | null>(null);
const loading = ref(false);

function pretty(v: any) { try { return JSON.stringify(v ?? {}, null, 2); } catch { return String(v ?? ''); } }
function reset() { form.session_id = ''; created.value = null; }

async function create() {
  loading.value = true;
  try {
    created.value = await assistantSessionCreateApi({ session_id: form.session_id || null });
    message.success('创建成功');
  } finally { loading.value = false; }
}
</script>
