<template>
  <div>
    <a-card :loading="loading" :bordered="false" title="修复记录详情">
      <template #extra>
        <a-space>
          <a-button @click="fetchDetail">刷新</a-button>
          <a-button type="primary" @click="openEdit = true">编辑</a-button>
          <a-popconfirm title="确认删除？" @confirm="onDelete"><a-button danger>删除</a-button></a-popconfirm>
        </a-space>
      </template>
      <a-descriptions bordered :column="2">
        <a-descriptions-item label="ID">{{ detail?.id }}</a-descriptions-item>
        <a-descriptions-item label="部署">{{ detail?.deployment }}</a-descriptions-item>
        <a-descriptions-item label="命名空间">{{ detail?.namespace }}</a-descriptions-item>
        <a-descriptions-item label="状态">{{ detail?.status }}</a-descriptions-item>
        <a-descriptions-item label="创建时间">{{ detail?.created_at }}</a-descriptions-item>
        <a-descriptions-item v-if="detail?.updated_at" label="更新时间">{{ detail?.updated_at }}</a-descriptions-item>
      </a-descriptions>
      <a-card title="动作" style="margin-top: 12px"><pre style="white-space: pre-wrap">{{ detail?.actions }}</pre></a-card>
      <a-card v-if="detail?.error_message" title="错误" style="margin-top: 12px"><pre style="white-space: pre-wrap">{{ detail?.error_message }}</pre></a-card>
    </a-card>

    <a-modal v-model:open="openEdit" title="编辑记录" :confirm-loading="saving" @ok="save">
      <a-form :model="form" label-col="{span:6}" wrapper-col="{span:16}">
        <a-form-item label="部署"><a-input v-model:value="form.deployment" /></a-form-item>
        <a-form-item label="命名空间"><a-input v-model:value="form.namespace" /></a-form-item>
        <a-form-item label="状态">
          <a-select v-model:value="form.status" allow-clear>
            <a-select-option value="success">success</a-select-option>
            <a-select-option value="failed">failed</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="动作"><a-input v-model:value="form.actions" /></a-form-item>
        <a-form-item label="错误"><a-input v-model:value="form.error_message" /></a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import { getAutofixRecordApi, updateAutofixRecordApi, deleteAutofixRecordApi } from '#/api';

const route = useRoute();
const router = useRouter();
const loading = ref(false);
const detail = ref<any | null>(null);

const openEdit = ref(false);
const saving = ref(false);
const form = reactive({ deployment: '', namespace: '', status: 'success', actions: '', error_message: '' });

async function fetchDetail() {
  loading.value = true;
  try {
    const id = Number(route.params.id);
    detail.value = await getAutofixRecordApi(id);
    form.deployment = detail.value?.deployment || '';
    form.namespace = detail.value?.namespace || '';
    form.status = detail.value?.status || 'success';
    form.actions = detail.value?.actions || '';
    form.error_message = detail.value?.error_message || '';
  } finally { loading.value = false; }
}

async function save() {
  const id = Number(route.params.id);
  saving.value = true;
  try { await updateAutofixRecordApi(id, { ...form }); message.success('已保存'); openEdit.value = false; fetchDetail(); } finally { saving.value = false; }
}

async function onDelete() { const id = Number(route.params.id); await deleteAutofixRecordApi(id); message.success('已删除'); router.back(); }

onMounted(fetchDetail);
</script>
