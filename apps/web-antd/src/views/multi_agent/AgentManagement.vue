<template>
  <div>
    <a-card title="智能体管理" :bordered="false">
      <a-form layout="inline" :model="q" @submit.prevent>
        <a-form-item label="搜索">
          <a-input v-model:value="q.search" placeholder="按名称/类型搜索" allow-clear />
        </a-form-item>
        <a-form-item>
          <a-space>
            <a-button type="primary" @click="handleSearch">查询</a-button>
            <a-button @click="handleReset">重置</a-button>
          </a-space>
        </a-form-item>
      </a-form>

      <a-table :columns="columns" :data-source="items" :loading="loading" :pagination="false" :scroll="{ x: 'max-content', y: 520 }" :sticky="{ offsetHeader: 0 }" row-key="id" style="margin-top: 12px">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <a-badge :status="statusBadge(record.status)" :text="record.status" />
          </template>
        </template>
      </a-table>

      <div style="margin-top: 12px; text-align: right">
        <a-pagination :current="q.page" :page-size="q.size" :total="total" show-size-changer @change="onPageChange" @showSizeChange="onSizeChange" />
      </div>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { listAgentsApi } from '#/api';

const loading = ref(false);
const items = ref<any[]>([]);
const total = ref(0);
const q = reactive({ page: 1, size: 10, search: undefined as string|undefined });

const columns = [
  { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
  { title: '名称', dataIndex: 'name', key: 'name' },
  { title: '类型', dataIndex: 'type', key: 'type', width: 180 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 160 },
  { title: '创建时间', dataIndex: 'created_at', key: 'created_at', width: 200 },
];

function statusBadge(v: string) {
  if (v === 'ready' || v === 'running') return 'success';
  if (v === 'failed' || v === 'error') return 'error';
  if (v === 'pending') return 'processing';
  return 'default';
}

async function fetchData() {
  loading.value = true;
  try {
    const data = await listAgentsApi({ page: q.page, size: q.size, search: q.search });
    items.value = data.items;
    total.value = data.total;
  } finally {
    loading.value = false;
  }
}

function handleSearch() { q.page = 1; fetchData(); }
function handleReset() { Object.assign(q, { page: 1, size: 10, search: undefined }); fetchData(); }
function onPageChange(p: number) { q.page = p; fetchData(); }
function onSizeChange(_: number, s: number) { q.size = s; q.page = 1; fetchData(); }

onMounted(fetchData);
</script>
