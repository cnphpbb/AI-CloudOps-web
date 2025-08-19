<template>
  <div>
    <a-card title="健康记录" :bordered="false">
      <template #extra>
        <a-space>
          <a-button @click="fetchData">刷新列表</a-button>
          <a-button type="primary" @click="handleAddRecord">新增记录</a-button>
        </a-space>
      </template>
      <a-form layout="inline" :model="q" @submit.prevent>
        <a-form-item label="状态"><a-input v-model:value="q.status" allow-clear /></a-form-item>
        <a-form-item>
          <a-space>
            <a-button type="primary" @click="handleSearch">查询</a-button>
            <a-button @click="handleReset">重置</a-button>
          </a-space>
        </a-form-item>
      </a-form>

      <!-- 状态统计图表 -->
      <a-row :gutter="16" style="margin-top: 16px">
        <a-col :xs="24" :lg="12">
          <a-card title="记录状态分布" class="chart-card">
            <EchartsUI ref="statusChartRef" height="250px" />
          </a-card>
        </a-col>
        <a-col :xs="24" :lg="12">
          <a-card title="记录趋势" class="chart-card">
            <EchartsUI ref="trendChartRef" height="250px" />
          </a-card>
        </a-col>
      </a-row>

      <a-table :columns="columns" :data-source="items" :loading="loading" :pagination="false" row-key="id" style="margin-top: 16px">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <a-tag :color="record.status === 'healthy' || record.status === 'ok' ? 'green' : (record.status === 'warning' ? 'orange' : 'red')">{{ record.status }}</a-tag>
          </template>
          <template v-else-if="column.key === 'uptime'">
            {{ formatUptime(record.uptime) }}
          </template>
          <template v-else-if="column.key === 'created_at'">
            {{ formatDateTime(record.created_at) }}
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

    <a-modal v-model:open="visible" title="新增健康记录" :confirm-loading="submitting" @ok="handleCreate">
      <a-form :model="form" label-col="{span:6}" wrapper-col="{span:16}">
        <a-form-item label="状态" required><a-input v-model:value="form.status" placeholder="ok/healthy/warn" /></a-form-item>
        <a-form-item label="组件(JSON)"><a-textarea v-model:value="componentsText" :rows="4" /></a-form-item>
        <a-form-item label="系统(JSON)"><a-textarea v-model:value="systemText" :rows="4" /></a-form-item>
        <a-form-item label="版本"><a-input v-model:value="form.version" /></a-form-item>
        <a-form-item label="Uptime"><a-input-number v-model:value="form.uptime" :min="0" style="width: 160px" /></a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { message } from 'ant-design-vue';
import { useRouter } from 'vue-router';
import { listHealthRecordsApi, createHealthRecordApi, deleteHealthRecordApi } from '#/api';
import type { HealthRecord, HealthRecordsListQuery, HealthSnapshotCreateReq } from '#/api';
import { EchartsUI, useEcharts } from '@vben/plugins/echarts';
import type { EchartsUIType } from '@vben/plugins/echarts';

const router = useRouter();
const loading = ref(false);
const items = ref<HealthRecord[]>([]);
const total = ref(0);
const q = reactive<HealthRecordsListQuery>({ page: 1, size: 10, status: undefined });

// 图表引用
const statusChartRef = ref<EchartsUIType>();
const trendChartRef = ref<EchartsUIType>();
const { renderEcharts: renderStatusChart } = useEcharts(statusChartRef);
const { renderEcharts: renderTrendChartEcharts } = useEcharts(trendChartRef);

const columns = [
  { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 120 },
  { title: '版本', dataIndex: 'version', key: 'version', width: 160 },
  { title: 'Uptime', dataIndex: 'uptime', key: 'uptime', width: 120 },
  { title: '创建时间', dataIndex: 'created_at', key: 'created_at', width: 200 },
  { title: '操作', key: 'actions', width: 160 },
];

const visible = ref(false);
const submitting = ref(false);
const form = reactive<HealthSnapshotCreateReq>({ status: '', components: null, system: null, version: '', uptime: null });
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

const componentsText = ref('');
const systemText = ref('');

// Extra buttons for card header
function handleAddRecord() {
  visible.value = true;
}

function parseJson(txt: string) { if (!txt) return null; try { return JSON.parse(txt); } catch { message.error('需为合法JSON'); return null; } }

async function fetchData() { 
  loading.value = true; 
  try { 
    const data = await listHealthRecordsApi({ ...q }); 
    items.value = data.items; 
    total.value = data.total;
    renderCharts();
  } finally { 
    loading.value = false; 
  } 
}
function handleSearch() { q.page = 1; fetchData(); }
function handleReset() { Object.assign(q, { page: 1, size: 10, status: undefined }); fetchData(); }
function onPageChange(p: number) { q.page = p; fetchData(); }
function onSizeChange(_: number, s: number) { q.size = s; q.page = 1; fetchData(); }
function goDetail(id: number) { router.push({ name: 'HealthRecordDetail', params: { id } }); }

async function handleCreate() {
  const components = parseJson(componentsText.value); if (componentsText.value && !components) return;
  const system = parseJson(systemText.value); if (systemText.value && !system) return;
  if (!form.status || !String(form.status).trim()) { message.error('请填写状态'); return; }
  submitting.value = true;
  try {
    await createHealthRecordApi({
      status: String(form.status).trim(),
      components,
      system,
      version: form.version && String(form.version).trim() ? String(form.version).trim() : null,
      uptime: form.uptime ?? null
    });
    message.success('创建成功');
    visible.value = false;
    fetchData();
  } finally { submitting.value = false; }
}

async function onDelete(id: number) { await deleteHealthRecordApi(id); message.success('已删除'); fetchData(); }

// 图表渲染函数
function renderCharts() {
  renderStatusDistribution();
  renderTrendChart();
}

function renderStatusDistribution() {
  // 统计状态分布
  const statusCount = { healthy: 0, warning: 0, error: 0 };
  items.value.forEach(item => {
    const status = item.status;
    if (status === 'healthy' || status === 'ok') {
      statusCount.healthy++;
    } else if (status === 'warning') {
      statusCount.warning++;
    } else {
      statusCount.error++;
    }
  });

  const data = [
    { value: statusCount.healthy, name: '健康', itemStyle: { color: '#52c41a' } },
    { value: statusCount.warning, name: '警告', itemStyle: { color: '#faad14' } },
    { value: statusCount.error, name: '异常', itemStyle: { color: '#ff4d4f' } }
  ].filter(item => item.value > 0);

  renderStatusChart({
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      data: data.map(item => item.name)
    },
    series: [
      {
        name: '记录状态',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['60%', '50%'],
        avoidLabelOverlap: false,
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: '16',
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: data
      }
    ]
  } as any);
}

function renderTrendChart() {
  // 按日期分组统计记录数量
  const dateMap = new Map<string, number>();
  items.value.forEach(item => {
    if (item.created_at) {
      try {
        const date = new Date(item.created_at);
        if (!isNaN(date.getTime())) {
          const dateStr = date.toISOString().split('T')[0];
          if (dateStr) {
            dateMap.set(dateStr, (dateMap.get(dateStr) || 0) + 1);
          }
        }
      } catch (error) {
        console.warn('Invalid date format:', item.created_at);
      }
    }
  });

  // 生成最近7天的数据
  const dates: string[] = [];
  const counts: number[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    try {
      const dateStr = date.toISOString().split('T')[0];
      const localDateStr = date.toLocaleDateString('zh-CN');
      if (dateStr && localDateStr) {
        dates.push(localDateStr);
        counts.push(dateMap.get(dateStr) || 0);
      }
    } catch (error) {
      console.warn('Date formatting error:', error);
    }
  }

  renderTrendChartEcharts({
    tooltip: {
      trigger: 'axis'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: dates
    },
    yAxis: {
      type: 'value',
      min: 0
    },
    series: [
      {
        name: '记录数量',
        type: 'line',
        data: counts,
        smooth: true,
        itemStyle: { color: '#1890ff' },
        areaStyle: { opacity: 0.3 }
      }
    ]
  } as any);
}

onMounted(fetchData);
</script>

<style scoped>
.chart-card {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.chart-card :deep(.ant-card-body) {
  padding: 20px;
}
</style>
