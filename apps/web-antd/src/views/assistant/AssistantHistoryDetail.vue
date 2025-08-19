<template>
  <div>
    <a-card :loading="loading" :bordered="false" title="历史详情" :extra="extra">
      <a-descriptions bordered :column="2">
        <a-descriptions-item label="ID">{{ detail?.id }}</a-descriptions-item>
        <a-descriptions-item label="SessionID">{{ detail?.session_id }}</a-descriptions-item>
        <a-descriptions-item label="模式">{{ detail?.mode }}</a-descriptions-item>
        <a-descriptions-item label="创建时间">{{ detail?.created_at }}</a-descriptions-item>
      </a-descriptions>
      <a-card title="问题" style="margin-top: 12px"><pre style="white-space: pre-wrap">{{ detail?.question }}</pre></a-card>
      <a-card title="答案" style="margin-top: 12px"><pre style="white-space: pre-wrap">{{ detail?.answer }}</pre></a-card>
      <a-card v-if="detail?.context" title="上下文" style="margin-top: 12px"><pre style="white-space: pre-wrap">{{ pretty(detail?.context) }}</pre></a-card>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import { getAssistantHistoryDetailApi, deleteAssistantHistoryApi } from '#/api';

const route = useRoute();
const router = useRouter();
const loading = ref(false);
const detail = ref<any | null>(null);

const extra = computed(() => (
  <a-space>
    <a-button onClick={fetchDetail}>刷新</a-button>
    <a-popconfirm title="确认删除？" onConfirm={onDelete}><a-button danger>删除</a-button></a-popconfirm>
  </a-space>
));

function pretty(v: any) { try { return JSON.stringify(v ?? {}, null, 2); } catch { return String(v ?? ''); } }

async function fetchDetail() { loading.value = true; try { const id = Number(route.params.id); detail.value = await getAssistantHistoryDetailApi(id); } finally { loading.value = false; } }

async function onDelete() { const id = Number(route.params.id); await deleteAssistantHistoryApi(id); message.success('已删除'); router.back(); }

onMounted(fetchDetail);
</script>
