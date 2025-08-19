<template>
  <div>
    <a-card title="知识库管理" :bordered="false" :extra="extra">
      <a-form layout="inline" :model="q" @submit.prevent>
        <a-form-item label="标题"><a-input v-model:value="q.title" allow-clear /></a-form-item>
        <a-form-item>
          <a-space>
            <a-button type="primary" @click="handleSearch">查询</a-button>
            <a-button @click="handleReset">重置</a-button>
          </a-space>
        </a-form-item>
      </a-form>

      <a-table :columns="columns" :data-source="items" :loading="loading" :pagination="false" row-key="id" style="margin-top: 12px">
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

    <a-modal v-model:open="visible" title="新增知识" :confirm-loading="submitting" @ok="handleCreate">
      <a-form :model="form" label-col="{span:6}" wrapper-col="{span:16}">
        <a-form-item label="标题" required><a-input v-model:value="form.title" /></a-form-item>
        <a-form-item label="内容" required><a-textarea v-model:value="form.content" :rows="6" /></a-form-item>
        <a-form-item label="元数据(JSON)"><a-textarea v-model:value="metadataText" :rows="4" /></a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { message } from 'ant-design-vue';
import { useRouter } from 'vue-router';
import { listAssistantKnowledgeApi, assistantKnowledgeCreateApi, assistantKnowledgeRefreshApi, deleteAssistantKnowledgeApi } from '#/api';

const router = useRouter();
const loading = ref(false);
const items = ref<any[]>([]);
const total = ref(0);
const q = reactive({ page: 1, size: 10, title: undefined as string|undefined });

const columns = [
  { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
  { title: '标题', dataIndex: 'title', key: 'title' },
  { title: '创建时间', dataIndex: 'created_at', key: 'created_at', width: 200 },
  { title: '操作', key: 'actions', width: 160 },
];

const extra = computed(() => (
  <a-space>
    <a-button onClick={fetchData}>刷新列表</a-button>
    <a-button type="primary" onClick={() => visible.value = true}>新增知识</a-button>
    <a-popconfirm title="确认刷新知识库？" onConfirm={onRefresh}><a-button>刷新索引</a-button></a-popconfirm>
  </a-space>
));

function handleSearch() { q.page = 1; fetchData(); }
function handleReset() { Object.assign(q, { page: 1, size: 10, title: undefined }); fetchData(); }
function onPageChange(p: number) { q.page = p; fetchData(); }
function onSizeChange(_: number, s: number) { q.size = s; q.page = 1; fetchData(); }

function goDetail(id: number) { router.push({ name: 'AssistantKnowledgeDetail', params: { id } }); }

async function onDelete(id: number) { await deleteAssistantKnowledgeApi(id); message.success('已删除'); fetchData(); }

const visible = ref(false);
const submitting = ref(false);
const form = reactive({ title: '', content: '', metadata: null as Record<string, any>|null });
const metadataText = ref('');

async function onRefresh() { const r = await assistantKnowledgeRefreshApi(); message.success((r as any)?.message || '已触发刷新'); }

function parseMeta() { if (!metadataText.value) return null; try { return JSON.parse(metadataText.value); } catch { message.error('元数据需为合法JSON'); return null; } }

async function handleCreate() {
  if (!form.title || !form.content) { message.warning('请填写标题与内容'); return; }
  const meta = parseMeta(); if (metadataText.value && !meta) return;
  submitting.value = true;
  try { await assistantKnowledgeCreateApi({ title: form.title, content: form.content, metadata: meta }); message.success('已新增'); visible.value = false; fetchData(); }
  finally { submitting.value = false; }
}

async function fetchData() { loading.value = true; try { const data = await listAssistantKnowledgeApi({ ...q }); items.value = data.items; total.value = data.total; } finally { loading.value = false; } }

onMounted(fetchData);
</script>
