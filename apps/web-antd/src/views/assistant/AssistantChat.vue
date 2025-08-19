<template>
  <div>
    <a-card title="智能对话" :bordered="false">
      <a-form :model="form" label-col="{span:4}" wrapper-col="{span:16}">
        <a-form-item label="SessionID"><a-input v-model:value="form.session_id" placeholder="可留空自动会话" /></a-form-item>
        <a-form-item label="模式">
          <a-segmented v-model:value="form.mode" :options="[{label:'RAG',value:1},{label:'MCP',value:2}]" />
        </a-form-item>
        <a-form-item label="问题" required>
          <a-textarea v-model:value="form.query" :rows="4" placeholder="请输入你的问题..." />
        </a-form-item>
        <a-form-item>
          <a-space>
            <a-button type="primary" @click="ask" :loading="loading">发送</a-button>
            <a-button @click="reset">重置</a-button>
          </a-space>
        </a-form-item>
      </a-form>
      <a-card v-if="resp" style="margin-top: 12px" title="回答">
        <p style="white-space: pre-wrap">{{ resp?.answer }}</p>
        <a-card v-if="resp?.sources?.length" style="margin-top: 12px" title="参考来源">
          <ul>
            <li v-for="(s, i) in resp?.sources" :key="i">
              <a :href="s.url" target="_blank">{{ s.title }}</a>
              <div style="color: var(--text-3)">{{ s.snippet }}</div>
            </li>
          </ul>
        </a-card>
      </a-card>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { message } from 'ant-design-vue';
import { assistantChatApi } from '#/api';

const form = reactive({ query: '', session_id: '', mode: 1 as 1|2 });
const loading = ref(false);
const resp = ref<any | null>(null);

function reset() { form.query = ''; resp.value = null; }

async function ask() {
  if (!form.query) { message.warning('请输入问题'); return; }
  loading.value = true;
  try {
    resp.value = await assistantChatApi({ query: form.query, session_id: form.session_id || null, mode: form.mode });
  } finally { loading.value = false; }
}
</script>
