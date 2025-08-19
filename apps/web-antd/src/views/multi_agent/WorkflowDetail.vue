<template>
  <div>
    <a-card :loading="loading" :bordered="false" title="工作流详情" :extra="extra">
      <a-descriptions bordered :column="2">
        <a-descriptions-item label="ID">{{ detail?.id }}</a-descriptions-item>
        <a-descriptions-item label="工作流ID">{{ detail?.workflow_id }}</a-descriptions-item>
        <a-descriptions-item label="状态">{{ detail?.status }}</a-descriptions-item>
        <a-descriptions-item label="命名空间">{{ detail?.namespace }}</a-descriptions-item>
        <a-descriptions-item label="目标">{{ detail?.target }}</a-descriptions-item>
        <a-descriptions-item label="创建时间">{{ detail?.created_at }}</a-descriptions-item>
        <a-descriptions-item v-if="detail?.updated_at" label="更新时间">{{ detail?.updated_at }}</a-descriptions-item>
      </a-descriptions>

      <a-card style="margin-top: 12px" title="详情JSON">
        <pre style="white-space: pre-wrap">{{ pretty(detail?.details) }}</pre>
      </a-card>
    </a-card>

    <a-modal v-model:open="openEdit" title="编辑工作流记录" :confirm-loading="saving" @ok="save">
      <a-form :model="form" label-col="{span:6}" wrapper-col="{span:16}">
        <a-form-item label="状态">
          <a-select v-model:value="form.status">
            <a-select-option value="pending">pending</a-select-option>
            <a-select-option value="running">running</a-select-option>
            <a-select-option value="success">success</a-select-option>
            <a-select-option value="failed">failed</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="命名空间">
          <a-input v-model:value="form.namespace" />
        </a-form-item>
        <a-form-item label="目标">
          <a-input v-model:value="form.target" />
        </a-form-item>
        <a-form-item label="详情(JSON)">
          <a-textarea v-model:value="detailsText" :rows="6" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import { getWorkflowRecordDetailApi, updateWorkflowRecordApi, deleteWorkflowRecordApi } from '#/api';

const route = useRoute();
const router = useRouter();
const loading = ref(false);
const detail = ref<any | null>(null);

const openEdit = ref(false);
const saving = ref(false);
const form = reactive({ status: '', namespace: '', target: '', details: null as Record<string, any>|null });
const detailsText = ref('');

const extra = computed(() => (
  <a-space>
    <a-button onClick={fetchDetail}>刷新</a-button>
    <a-button type="primary" onClick={() => openEdit.value = true}>编辑</a-button>
    <a-popconfirm title="确认删除？" onConfirm={onDelete}><a-button danger>删除</a-button></a-popconfirm>
  </a-space>
));

function pretty(v: any) { try { return JSON.stringify(v ?? {}, null, 2); } catch { return String(v ?? ''); } }
function parseDetails() { if (!detailsText.value) return null; try { return JSON.parse(detailsText.value); } catch { message.error('详情需为合法JSON'); return null; } }

async function fetchDetail() {
  loading.value = true;
  try {
    const recordId = Number(route.params.recordId);
    detail.value = await getWorkflowRecordDetailApi(recordId);
    form.status = detail.value?.status || '';
    form.namespace = detail.value?.namespace || '';
    form.target = detail.value?.target || '';
    detailsText.value = pretty(detail.value?.details || {});
  } finally { loading.value = false; }
}

async function save() {
  const recordId = Number(route.params.recordId);
  const details = parseDetails();
  if (detailsText.value && !details) return;
  saving.value = true;
  try {
    await updateWorkflowRecordApi(recordId, { status: form.status || null, namespace: form.namespace || null, target: form.target || null, details });
    message.success('已保存');
    openEdit.value = false;
    fetchDetail();
  } finally { saving.value = false; }
}

async function onDelete() {
  const recordId = Number(route.params.recordId);
  await deleteWorkflowRecordApi(recordId);
  message.success('已删除');
  router.back();
}

onMounted(fetchDetail);
</script>
