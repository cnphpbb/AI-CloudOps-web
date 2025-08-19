<template>
  <div>
    <a-card :loading="loading" :bordered="false" title="健康记录详情" :extra="extra">
      <a-descriptions bordered :column="2">
        <a-descriptions-item label="ID">{{ detail?.id }}</a-descriptions-item>
        <a-descriptions-item label="状态">
          <a-tag :color="detail?.status === 'healthy' || detail?.status === 'ok' ? 'green' : (detail?.status === 'warning' ? 'orange' : 'red')">
            {{ detail?.status }}
          </a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="版本">{{ detail?.version ?? '-' }}</a-descriptions-item>
        <a-descriptions-item label="Uptime">{{ formatUptime(detail?.uptime) }}</a-descriptions-item>
        <a-descriptions-item label="创建时间">{{ formatDateTime(detail?.created_at) }}</a-descriptions-item>
        <a-descriptions-item v-if="detail?.updated_at" label="更新时间">{{ formatDateTime(detail?.updated_at) }}</a-descriptions-item>
      </a-descriptions>
      <a-card v-if="detail?.components" title="组件" style="margin-top: 12px"><pre style="white-space: pre-wrap">{{ pretty(detail?.components) }}</pre></a-card>
      <a-card v-if="detail?.system" title="系统" style="margin-top: 12px"><pre style="white-space: pre-wrap">{{ pretty(detail?.system) }}</pre></a-card>
    </a-card>

    <a-modal v-model:open="openEdit" title="编辑记录" :confirm-loading="saving" @ok="save">
      <a-form :model="form" label-col="{span:6}" wrapper-col="{span:16}">
        <a-form-item label="状态"><a-input v-model:value="form.status" /></a-form-item>
        <a-form-item label="组件(JSON)"><a-textarea v-model:value="componentsText" :rows="4" /></a-form-item>
        <a-form-item label="系统(JSON)"><a-textarea v-model:value="systemText" :rows="4" /></a-form-item>
        <a-form-item label="版本"><a-input v-model:value="form.version" /></a-form-item>
        <a-form-item label="Uptime"><a-input-number v-model:value="form.uptime" :min="0" style="width: 160px" /></a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, h, onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import { getHealthRecordApi, updateHealthRecordApi, deleteHealthRecordApi } from '#/api';
import type { HealthRecord, HealthSnapshotUpdateReq } from '#/api';

const route = useRoute();
const router = useRouter();
const loading = ref(false);
const detail = ref<HealthRecord | null>(null);

const openEdit = ref(false);
const saving = ref(false);
const form = reactive<HealthSnapshotUpdateReq>({ status: '', components: null, system: null, version: '', uptime: null });
const componentsText = ref('');
const systemText = ref('');

const extra = computed(() => [
  h('a-button', { onClick: fetchDetail }, '刷新'),
  h('a-button', { type: 'primary', onClick: () => openEdit.value = true }, '编辑'),
  h('a-popconfirm', { title: '确认删除？', onConfirm: onDelete }, 
    h('a-button', { danger: true }, '删除')
  )
]);

function pretty(v: any) { try { return JSON.stringify(v ?? {}, null, 2); } catch { return String(v ?? ''); } }
function parseJson(txt: string) { if (!txt) return null; try { return JSON.parse(txt); } catch { message.error('需为合法JSON'); return null; } }

function formatUptime(uptime?: number | null) {
  if (uptime == null) return '-';
  if (uptime < 1000) {
    const totalMinutes = Math.round(Number(uptime) * 60);
    const days = Math.floor(totalMinutes / (24 * 60));
    const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
    const minutes = totalMinutes % 60;
    if (days > 0) return `${days}天${hours}小时`;
    if (hours > 0) return `${hours}小时${minutes}分钟`;
    return `${minutes}分钟`;
  }
  const days = Math.floor(Number(uptime) / (24 * 3600));
  const hours = Math.floor((Number(uptime) % (24 * 3600)) / 3600);
  const minutes = Math.floor((Number(uptime) % 3600) / 60);
  if (days > 0) return `${days}天${hours}小时`;
  if (hours > 0) return `${hours}小时${minutes}分钟`;
  return `${minutes}分钟`;
}

function formatDateTime(ts?: string) {
  if (!ts) return '-';
  try { const d = new Date(ts); return isNaN(d.getTime()) ? ts : d.toLocaleString(); } catch { return ts; }
}

async function fetchDetail() { loading.value = true; try { const id = Number(route.params.id); detail.value = await getHealthRecordApi(id); form.status = detail.value?.status || ''; form.version = detail.value?.version || ''; form.uptime = detail.value?.uptime || null; componentsText.value = pretty(detail.value?.components || {}); systemText.value = pretty(detail.value?.system || {}); } finally { loading.value = false; } }

async function save() {
  const id = Number(route.params.id);
  const components = parseJson(componentsText.value); if (componentsText.value && !components) return;
  const system = parseJson(systemText.value); if (systemText.value && !system) return;
  saving.value = true;
  try { await updateHealthRecordApi(id, { status: form.status || null, components, system, version: form.version || null, uptime: form.uptime }); message.success('已保存'); openEdit.value = false; fetchDetail(); } finally { saving.value = false; }
}

async function onDelete() { const id = Number(route.params.id); await deleteHealthRecordApi(id); message.success('已删除'); router.back(); }

onMounted(fetchDetail);
</script>
