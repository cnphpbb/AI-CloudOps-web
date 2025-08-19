<template>
  <div>
    <a-card :loading="loading" :bordered="false" title="知识详情" :extra="extra">
      <a-descriptions bordered :column="2">
        <a-descriptions-item label="ID">{{ detail?.id }}</a-descriptions-item>
        <a-descriptions-item label="标题">{{ detail?.title }}</a-descriptions-item>
        <a-descriptions-item label="创建时间">{{ detail?.created_at }}</a-descriptions-item>
        <a-descriptions-item v-if="detail?.updated_at" label="更新时间">{{ detail?.updated_at }}</a-descriptions-item>
      </a-descriptions>
      <a-card title="内容" style="margin-top: 12px"><pre style="white-space: pre-wrap">{{ detail?.content }}</pre></a-card>
      <a-card title="元数据" style="margin-top: 12px"><pre style="white-space: pre-wrap">{{ pretty(detail?.metadata) }}</pre></a-card>
    </a-card>

    <a-modal v-model:open="openEdit" title="编辑知识" :confirm-loading="saving" @ok="save">
      <a-form :model="form" label-col="{span:6}" wrapper-col="{span:16}">
        <a-form-item label="标题"><a-input v-model:value="form.title" /></a-form-item>
        <a-form-item label="内容"><a-textarea v-model:value="form.content" :rows="6" /></a-form-item>
        <a-form-item label="元数据(JSON)"><a-textarea v-model:value="metadataText" :rows="4" /></a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import { getAssistantKnowledgeDetailApi, assistantKnowledgeUpdateApi, deleteAssistantKnowledgeApi } from '#/api';

const route = useRoute();
const router = useRouter();
const loading = ref(false);
const detail = ref<any | null>(null);

const openEdit = ref(false);
const saving = ref(false);
const form = reactive({ title: '', content: '', metadata: null as Record<string, any>|null });
const metadataText = ref('');

const extra = computed(() => (
  <a-space>
    <a-button onClick={fetchDetail}>刷新</a-button>
    <a-button type="primary" onClick={() => openEdit.value = true}>编辑</a-button>
    <a-popconfirm title="确认删除？" onConfirm={onDelete}><a-button danger>删除</a-button></a-popconfirm>
  </a-space>
));

function pretty(v: any) { try { return JSON.stringify(v ?? {}, null, 2); } catch { return String(v ?? ''); } }
function parseMeta() { if (!metadataText.value) return null; try { return JSON.parse(metadataText.value); } catch { message.error('元数据需为合法JSON'); return null; } }

async function fetchDetail() {
  loading.value = true;
  try {
    const id = Number(route.params.id);
    detail.value = await getAssistantKnowledgeDetailApi(id);
    form.title = detail.value?.title || '';
    form.content = detail.value?.content || '';
    metadataText.value = pretty(detail.value?.metadata || {});
  } finally { loading.value = false; }
}

async function save() {
  const id = Number(route.params.id);
  const meta = parseMeta(); if (metadataText.value && !meta) return;
  saving.value = true;
  try { await assistantKnowledgeUpdateApi(id, { title: form.title || null, content: form.content || null, metadata: meta }); message.success('已保存'); openEdit.value = false; fetchDetail(); } finally { saving.value = false; }
}

async function onDelete() { const id = Number(route.params.id); await deleteAssistantKnowledgeApi(id); message.success('已删除'); router.back(); }

onMounted(fetchDetail);
</script>
