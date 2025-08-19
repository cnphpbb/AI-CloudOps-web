<template>
  <div>
    <a-card title="修复记录" :bordered="false" :extra="extra">
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

      <a-table :columns="columns" :data-source="items" :loading="loading" :pagination="false" :scroll="{ x: 'max-content', y: 520 }" :sticky="{ offsetHeader: 0 }" row-key="id" style="margin-top: 12px">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <a-tag :color="record.status === 'success' ? 'green' : 'red'">{{ record.status }}</a-tag>
          </template>
          <template v-else-if="column.key === 'actions'">
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

    <a-modal v-model:open="visible" title="新建修复记录" :confirm-loading="submitting" @ok="handleCreate">
      <a-form :model="form" label-col="{span:6}" wrapper-col="{span:16}">
        <a-form-item label="部署" required><a-input v-model:value="form.deployment" /></a-form-item>
        <a-form-item label="命名空间"><a-input v-model:value="form.namespace" placeholder="default" /></a-form-item>
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
import { message } from 'ant-design-vue';
import { useRouter } from 'vue-router';
import { listAutofixRecordsApi, createAutofixRecordApi, deleteAutofixRecordApi } from '#/api';

const router = useRouter();
const loading = ref(false);
const items = ref<any[]>([]);
const total = ref(0);
const q = reactive({ page: 1, size: 10, namespace: undefined as string|undefined, status: undefined as string|undefined, search: undefined as string|undefined });

const columns = [
  { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
  { title: '部署', dataIndex: 'deployment', key: 'deployment' },
  { title: '命名空间', dataIndex: 'namespace', key: 'namespace', width: 160 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 120 },
  { title: '创建时间', dataIndex: 'created_at', key: 'created_at', width: 200 },
  { title: '操作', key: 'actions', width: 160 },
];

const visible = ref(false);
const submitting = ref(false);
const form = reactive({ deployment: '', namespace: 'default', status: 'success', actions: '', error_message: '' });

const extra = (
  <a-space>
    <a-button onClick={fetchData}>刷新列表</a-button>
    <a-button type="primary" onClick={() => visible.value = true}>新建记录</a-button>
  </a-space>
);

async function fetchData() { loading.value = true; try { const data = await listAutofixRecordsApi({ ...q }); items.value = data.items; total.value = data.total; } finally { loading.value = false; } }

function handleSearch() { q.page = 1; fetchData(); }
function handleReset() { Object.assign(q, { page: 1, size: 10, namespace: undefined, status: undefined, search: undefined }); fetchData(); }
function onPageChange(p: number) { q.page = p; fetchData(); }
function onSizeChange(_: number, s: number) { q.size = s; q.page = 1; fetchData(); }

function goDetail(id: number) { router.push({ name: 'AutofixRecordDetail', params: { id } }); }

async function handleCreate() { submitting.value = true; try { await createAutofixRecordApi({ ...form }); message.success('创建成功'); visible.value = false; fetchData(); } finally { submitting.value = false; } }
async function onDelete(id: number) { await deleteAutofixRecordApi(id); message.success('已删除'); fetchData(); }

onMounted(fetchData);
</script>
