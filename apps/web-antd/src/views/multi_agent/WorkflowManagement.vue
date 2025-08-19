<template>
  <div>
    <a-card title="工作流管理" :bordered="false">
      <a-form layout="inline" :model="q" @submit.prevent>
        <a-form-item label="命名空间">
          <a-input v-model:value="q.namespace" placeholder="default" allow-clear />
        </a-form-item>
        <a-form-item label="状态">
          <a-select v-model:value="q.status" allow-clear style="width: 160px">
            <a-select-option value="pending">pending</a-select-option>
            <a-select-option value="running">running</a-select-option>
            <a-select-option value="success">success</a-select-option>
            <a-select-option value="failed">failed</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="搜索">
          <a-input v-model:value="q.search" placeholder="关键字" allow-clear />
        </a-form-item>
        <a-form-item>
          <a-space>
            <a-button type="primary" @click="handleSearch">查询</a-button>
            <a-button @click="handleReset">重置</a-button>
            <a-button type="dashed" @click="openCreate">新建记录</a-button>
          </a-space>
        </a-form-item>
      </a-form>

      <a-table :columns="columns" :data-source="items" :loading="loading" :pagination="false" row-key="id" style="margin-top: 12px">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <a-tag :color="statusColor(record.status)">{{ record.status }}</a-tag>
          </template>
          <template v-else-if="column.key === 'actions'">
            <a-space>
              <a-button type="link" @click="goDetail(record.id)">详情</a-button>
              <a-popconfirm title="确认删除？" @confirm="onDelete(record.id)">
                <a-button type="link" danger>删除</a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>

      <div style="margin-top: 12px; text-align: right">
        <a-pagination
          :current="q.page"
          :page-size="q.size"
          :total="total"
          show-size-changer
          @change="onPageChange"
          @showSizeChange="onSizeChange"
        />
      </div>
    </a-card>

    <a-modal v-model:open="visible" title="新建工作流记录" :confirm-loading="submitting" @ok="handleCreate">
      <a-form :model="form" label-col="{span:6}" wrapper-col="{span:16}">
        <a-form-item label="工作流ID" required>
          <a-input v-model:value="form.workflow_id" placeholder="workflow-xxx" />
        </a-form-item>
        <a-form-item label="状态" required>
          <a-select v-model:value="form.status">
            <a-select-option value="pending">pending</a-select-option>
            <a-select-option value="running">running</a-select-option>
            <a-select-option value="success">success</a-select-option>
            <a-select-option value="failed">failed</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="命名空间">
          <a-input v-model:value="form.namespace" placeholder="default" />
        </a-form-item>
        <a-form-item label="目标">
          <a-input v-model:value="form.target" placeholder="deployment/demo" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import { listWorkflowRecordsApi, createWorkflowRecordApi, deleteWorkflowRecordApi } from '#/api';

const router = useRouter();
const loading = ref(false);
const items = ref<any[]>([]);
const total = ref(0);

const q = reactive({ page: 1, size: 10, namespace: undefined as string|undefined, status: undefined as string|undefined, search: undefined as string|undefined });

const columns = [
  { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
  { title: '工作流ID', dataIndex: 'workflow_id', key: 'workflow_id', width: 180 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 120 },
  { title: '命名空间', dataIndex: 'namespace', key: 'namespace', width: 160 },
  { title: '目标', dataIndex: 'target', key: 'target' },
  { title: '创建时间', dataIndex: 'created_at', key: 'created_at', width: 200 },
  { title: '操作', key: 'actions', width: 160 },
];

function statusColor(v: string) {
  if (v === 'success') return 'green';
  if (v === 'failed') return 'red';
  if (v === 'running') return 'blue';
  return 'default';
}

async function fetchData() {
  loading.value = true;
  try {
    const data = await listWorkflowRecordsApi({
      page: q.page,
      size: q.size,
      namespace: q.namespace,
      status: q.status,
      search: q.search,
    });
    items.value = data.items;
    total.value = data.total;
  } finally {
    loading.value = false;
  }
}

function handleSearch() { q.page = 1; fetchData(); }
function handleReset() { Object.assign(q, { page: 1, size: 10, namespace: undefined, status: undefined, search: undefined }); fetchData(); }
function onPageChange(p: number) { q.page = p; fetchData(); }
function onSizeChange(_: number, s: number) { q.size = s; q.page = 1; fetchData(); }

function goDetail(recordId: number) { router.push({ name: 'WorkflowDetail', params: { recordId } }); }

const visible = ref(false);
const submitting = ref(false);
const form = reactive({ workflow_id: '', status: 'pending', namespace: 'default', target: '' });

function openCreate() { visible.value = true; }

async function handleCreate() {
  if (!form.workflow_id || !form.status) {
    message.warning('请填写必填项');
    return;
  }
  submitting.value = true;
  try {
    await createWorkflowRecordApi({ ...form });
    message.success('创建成功');
    visible.value = false;
    fetchData();
  } finally {
    submitting.value = false;
  }
}

async function onDelete(id: number) {
  await deleteWorkflowRecordApi(id);
  message.success('已删除');
  fetchData();
}

onMounted(fetchData);
</script>
