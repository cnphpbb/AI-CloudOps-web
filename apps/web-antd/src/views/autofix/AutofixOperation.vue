<template>
  <div>
    <a-card title="修复操作" :bordered="false">
      <a-form :model="fixForm" label-col="{span:6}" wrapper-col="{span:14}">
        <a-form-item label="命名空间"><a-input v-model:value="fixForm.namespace" placeholder="default" /></a-form-item>
        <a-form-item label="部署" required><a-input v-model:value="fixForm.deployment" /></a-form-item>
        <a-form-item label="问题列表"><a-select v-model:value="fixForm.issues" mode="tags" allow-clear style="width: 100%" /></a-form-item>
        <a-form-item label="自动审批"><a-switch v-model:checked="fixForm.auto_approve" /></a-form-item>
        <a-form-item>
          <a-button type="primary" @click="runFix" :loading="loadingFix">执行修复</a-button>
        </a-form-item>
      </a-form>
    </a-card>

    <a-card title="工作流启动" :bordered="false" style="margin-top: 12px">
      <a-form :model="wfForm" label-col="{span:6}" wrapper-col="{span:14}">
        <a-form-item label="类型"><a-input v-model:value="wfForm.workflow_type" placeholder="autofix" /></a-form-item>
        <a-form-item label="命名空间"><a-input v-model:value="wfForm.namespace" placeholder="default" /></a-form-item>
        <a-form-item label="目标"><a-input v-model:value="wfForm.target" placeholder="deployment/demo" /></a-form-item>
        <a-form-item>
          <a-button @click="runWorkflow" :loading="loadingWf">启动工作流</a-button>
        </a-form-item>
      </a-form>
    </a-card>

    <a-card title="通知发送" :bordered="false" style="margin-top: 12px">
      <a-form :model="notifyForm" label-col="{span:6}" wrapper-col="{span:14}">
        <a-form-item label="Webhook"><a-input v-model:value="notifyForm.webhook_url" placeholder="https://..." /></a-form-item>
        <a-form-item label="消息"><a-textarea v-model:value="notifyForm.message" :rows="4" /></a-form-item>
        <a-form-item>
          <a-button @click="sendNotify" :loading="loadingNotify">发送</a-button>
        </a-form-item>
      </a-form>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { message } from 'ant-design-vue';
import { autofixFixApi, autofixWorkflowApi, sendAutofixNotifyApi } from '#/api';

const fixForm = reactive({ namespace: 'default', deployment: '', issues: [] as string[], auto_approve: true });
const wfForm = reactive({ workflow_type: 'autofix', namespace: 'default', target: '' });
const notifyForm = reactive({ webhook_url: '', message: '' });

const loadingFix = ref(false);
const loadingWf = ref(false);
const loadingNotify = ref(false);

async function runFix() { if (!fixForm.deployment) { message.warning('请填写部署'); return; } loadingFix.value = true; try { const r = await autofixFixApi({ ...fixForm }); message.success((r as any)?.message || '已触发修复'); } finally { loadingFix.value = false; } }
async function runWorkflow() { loadingWf.value = true; try { const r = await autofixWorkflowApi({ ...wfForm }); message.success((r as any)?.message || '已触发工作流'); } finally { loadingWf.value = false; } }
async function sendNotify() { loadingNotify.value = true; try { const r = await sendAutofixNotifyApi({ ...notifyForm }); message.success((r as any)?.message || '已发送'); } finally { loadingNotify.value = false; } }
</script>
