<template>
  <div>
    <a-card title="修复历史" :bordered="false">
      <a-form layout="inline" :model="q" @submit.prevent>
        <a-form-item label="命名空间"><a-input v-model:value="q.namespace" allow-clear /></a-form-item>
        <a-form-item label="状态"><a-select v-model:value="q.status" allow-clear style="width: 160px">
          <a-select-option value="success">success</a-select-option>
          <a-select-option value="failed">failed</a-select-option>
        </a-select></a-form-item>
        <a-form-item label="搜索"><a-input v-model:value="q.search" allow-clear /></a-form-item>
        <a-form-item>
          <a-space>
            <a-button type="primary" @click="handleSearch">查询</a-button>
            <a-button @click="handleReset">重置</a-button>
          </a-space>
        </a-form-item>
      </a-form>

      <a-table :columns="columns" :data-source="items" :loading="loading" :pagination="false" row-key="id" style="margin-top: 12px" />

      <div style="margin-top: 12px; text-align: right">
        <a-pagination :current="q.page" :page-size="q.size" :total="total" show-size-changer @change="onPageChange" @showSizeChange="onSizeChange" />
      </div>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { listAutofixHistoryApi } from '#/api';

const loading = ref(false);
const items = ref<any[]>([]);
const total = ref(0);
const q = reactive({ page: 1, size: 10, search: undefined as string|undefined, namespace: undefined as string|undefined, status: undefined as string|undefined, start: undefined as string|undefined, end: undefined as string|undefined });

const columns = [
  { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
  { title: '部署', dataIndex: 'deployment', key: 'deployment' },
  { title: '命名空间', dataIndex: 'namespace', key: 'namespace', width: 160 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 120 },
  { title: '创建时间', dataIndex: 'created_at', key: 'created_at', width: 200 },
];

async function fetchData() { loading.value = true; try { const data = await listAutofixHistoryApi({ ...q }); items.value = data.items; total.value = data.total; } finally { loading.value = false; } }

function handleSearch() { q.page = 1; fetchData(); }
function handleReset() { Object.assign(q, { page: 1, size: 10, search: undefined, namespace: undefined, status: undefined, start: undefined, end: undefined }); fetchData(); }
function onPageChange(p: number) { q.page = p; fetchData(); }
function onSizeChange(_: number, s: number) { q.size = s; q.page = 1; fetchData(); }

onMounted(fetchData);
</script>
