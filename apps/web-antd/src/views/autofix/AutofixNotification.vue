<template>
  <div>
    <a-card title="通知管理" :bordered="false">
      <a-form :model="form" label-col="{span:6}" wrapper-col="{span:14}">
        <a-form-item label="Webhook"><a-input v-model:value="form.webhook_url" placeholder="https://..." /></a-form-item>
        <a-form-item label="消息"><a-textarea v-model:value="form.message" :rows="4" /></a-form-item>
        <a-form-item>
          <a-button type="primary" @click="send" :loading="loading">发送通知</a-button>
        </a-form-item>
      </a-form>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { message } from 'ant-design-vue';
import { sendAutofixNotifyApi } from '#/api';

const form = reactive({ webhook_url: '', message: '' });
const loading = ref(false);

async function send() { loading.value = true; try { const r = await sendAutofixNotifyApi({ ...form }); message.success((r as any)?.message || '已发送'); } finally { loading.value = false; } }
</script>
