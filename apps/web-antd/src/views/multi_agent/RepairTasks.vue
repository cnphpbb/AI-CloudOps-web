<template>
  <div>
    <a-card title="修复任务" :bordered="false">
      <a-form :model="form" label-col="{span:6}" wrapper-col="{span:14}">
        <a-form-item label="命名空间">
          <a-input v-model:value="form.namespace" placeholder="default" />
        </a-form-item>
        <a-form-item label="部署">
          <a-input v-model:value="form.deployment" placeholder="demo-deploy" />
        </a-form-item>
        <a-form-item label="操作">
          <a-space>
            <a-button type="primary" @click="createSingle" :loading="loadingSingle">创建单个修复</a-button>
            <a-button @click="createAll" :loading="loadingAll">创建批量修复（命名空间内）</a-button>
          </a-space>
        </a-form-item>
      </a-form>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { message } from 'ant-design-vue';
import { createDeploymentRepairApi, createAllRepairsApi } from '#/api';

const form = reactive({ namespace: 'default', deployment: '' });
const loadingSingle = ref(false);
const loadingAll = ref(false);

async function createSingle() {
  if (!form.deployment) {
    message.warning('请填写部署名');
    return;
  }
  loadingSingle.value = true;
  try {
    const res = await createDeploymentRepairApi({ deployment: form.deployment, namespace: form.namespace || null });
    if ((res as any)?.success) message.success('已发起修复');
    else message.info((res as any)?.message || '已触发修复');
  } finally {
    loadingSingle.value = false;
  }
}

async function createAll() {
  loadingAll.value = true;
  try {
    const res = await createAllRepairsApi({ namespace: form.namespace || null });
    if ((res as any)?.success) message.success('已发起批量修复');
    else message.info((res as any)?.message || '已触发批量修复');
  } finally {
    loadingAll.value = false;
  }
}
</script>
