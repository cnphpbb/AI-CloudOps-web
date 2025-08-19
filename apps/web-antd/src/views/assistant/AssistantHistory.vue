<template>
  <div>
    <a-card title="对话历史" :bordered="false">
      <a-form layout="inline" :model="q" @submit.prevent>
        <a-form-item label="SessionID"><a-input v-model:value="q.session_id" allow-clear /></a-form-item>
        <a-form-item label="模式">
          <a-select v-model:value="q.mode" allow-clear style="width: 140px">
            <a-select-option value="rag">rag</a-select-option>
            <a-select-option value="mcp">mcp</a-select-option>
            <a-select-option value="doc">doc</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="搜索"><a-input v-model:value="q.q" allow-clear /></a-form-item>
        <a-form-item>
          <a-space>
            <a-button type="primary" @click="handleSearch">查询</a-button>
            <a-button @click="handleReset">重置</a-button>
          </a-space>
        </a-form-item>
      </a-form>

      <a-table :columns="columns" :data-source="items" :loading="loading" :pagination="false" :scroll="{ x: 'max-content', y: 520 }" :sticky="{ offsetHeader: 0 }" row-key="id" style="margin-top: 12px">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'actions'">
            <a-space>
              <a-button type="link" @click="goDetail(record.id)">详情</a-button>
              <a-popconfirm title="确认删除？" @confirm="onDelete(record.id)"><a-button type="link" danger>删除</a-button></a-popconfirm>
            </a-space>
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
import { message } from 'ant-design-vue';
import { useRouter } from 'vue-router';
import { listAssistantHistoryApi, deleteAssistantHistoryApi } from '#/api';

const router = useRouter();
const loading = ref(false);
const items = ref<any[]>([]);
const total = ref(0);
const q = reactive({ page: 1, size: 10, session_id: undefined as string|undefined, mode: undefined as string|undefined, q: undefined as string|undefined, start: undefined as string|undefined, end: undefined as string|undefined });

const columns = [
  { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
  { title: 'SessionID', dataIndex: 'session_id', key: 'session_id', width: 200 },
  { title: '模式', dataIndex: 'mode', key: 'mode', width: 120 },
  { title: '问题', dataIndex: 'question', key: 'question' },
  { title: '创建时间', dataIndex: 'created_at', key: 'created_at', width: 200 },
  { title: '操作', key: 'actions', width: 160 },
];

async function fetchData() { loading.value = true; try { const data = await listAssistantHistoryApi({ ...q }); items.value = data.items; total.value = data.total; } finally { loading.value = false; } }

function handleSearch() { q.page = 1; fetchData(); }
function handleReset() { Object.assign(q, { page: 1, size: 10, session_id: undefined, mode: undefined, q: undefined, start: undefined, end: undefined }); fetchData(); }
function onPageChange(p: number) { q.page = p; fetchData(); }
function onSizeChange(_: number, s: number) { q.size = s; q.page = 1; fetchData(); }

function goDetail(id: number) { router.push({ name: 'AssistantHistoryDetail', params: { id } }); }
async function onDelete(id: number) { await deleteAssistantHistoryApi(id); message.success('已删除'); fetchData(); }

onMounted(fetchData);
</script>
