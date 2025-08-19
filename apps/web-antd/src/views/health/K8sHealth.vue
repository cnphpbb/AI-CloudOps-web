<template>
  <div class="k8s-health">
    <!-- 集群状态概览 -->
    <a-row :gutter="[16, 16]" class="status-overview">
      <a-col :xs="24" :sm="8">
        <a-card class="status-card" :loading="loading">
          <a-statistic
            title="集群状态"
            :value="detail?.status || 'unknown'"
            :value-style="{ color: statusColor, fontSize: '24px', fontWeight: 'bold' }"
          />
          <div class="status-indicator">
            <a-badge :status="badgeStatus" :text="statusText" />
          </div>
        </a-card>
      </a-col>
      <a-col :xs="24" :sm="8">
        <a-card class="status-card" :loading="loading">
          <a-statistic
            title="节点数量"
            :value="nodeCount"
            suffix="个"
            :value-style="{ color: '#1890ff' }"
          />
          <div class="node-status">
            <a-tag color="success">就绪: {{ readyNodes }}</a-tag>
            <a-tag color="warning">未就绪: {{ notReadyNodes }}</a-tag>
          </div>
        </a-card>
      </a-col>
      <a-col :xs="24" :sm="8">
        <a-card class="status-card" :loading="loading">
          <a-statistic
            title="Pod数量"
            :value="podCount"
            suffix="个"
            :value-style="{ color: '#52c41a' }"
          />
          <div class="pod-status">
            <a-tag color="success">运行中: {{ runningPods }}</a-tag>
            <a-tag color="error">异常: {{ failedPods }}</a-tag>
          </div>
        </a-card>
      </a-col>
    </a-row>

    <!-- 图表展示区域 -->
    <a-row :gutter="[16, 16]" style="margin-top: 16px">
      <a-col :xs="24" :lg="12">
        <a-card title="节点资源使用率" class="chart-card">
          <EchartsUI ref="nodeResourceRef" height="300px" />
        </a-card>
      </a-col>
      <a-col :xs="24" :lg="12">
        <a-card title="Pod状态分布" class="chart-card">
          <EchartsUI ref="podStatusRef" height="300px" />
        </a-card>
      </a-col>
    </a-row>

    <!-- 命名空间资源 -->
    <a-row :gutter="[16, 16]" style="margin-top: 16px">
      <a-col :xs="24">
        <a-card title="命名空间资源使用" class="chart-card">
          <EchartsUI ref="namespaceRef" height="350px" />
        </a-card>
      </a-col>
    </a-row>

    <!-- 详细信息 -->
    <a-row :gutter="[16, 16]" style="margin-top: 16px">
      <a-col :xs="24" :md="12">
        <a-card title="集群信息" class="info-card">
          <a-descriptions bordered size="small" :column="1">
            <a-descriptions-item label="Kubernetes版本">{{ clusterVersion }}</a-descriptions-item>
            <a-descriptions-item label="API服务器">{{ apiServerStatus }}</a-descriptions-item>
            <a-descriptions-item label="etcd状态">{{ etcdStatus }}</a-descriptions-item>
            <a-descriptions-item label="控制器管理器">{{ controllerStatus }}</a-descriptions-item>
            <a-descriptions-item label="调度器">{{ schedulerStatus }}</a-descriptions-item>
          </a-descriptions>
        </a-card>
      </a-col>
      <a-col :xs="24" :md="12">
        <a-card title="最近事件" class="info-card">
          <div v-if="recentEvents.length > 0" class="events-list">
            <div v-for="(event, index) in recentEvents" :key="index" class="event-item">
              <div class="event-header">
                <a-tag :color="event.type === 'Normal' ? 'blue' : 'red'" size="small">
                  {{ event.type }}
                </a-tag>
                <span class="event-time">{{ event.time }}</span>
              </div>
              <div class="event-content">{{ event.message }}</div>
            </div>
          </div>
          <a-empty v-else description="暂无事件" />
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref } from 'vue';
import { k8sHealthApi } from '#/api';
import { EchartsUI, useEcharts } from '@vben/plugins/echarts';
import type { EchartsUIType } from '@vben/plugins/echarts';

const loading = ref(false);
const detail = ref<any | null>(null);

const nodeResourceRef = ref<EchartsUIType>();
const podStatusRef = ref<EchartsUIType>();
const namespaceRef = ref<EchartsUIType>();

const { renderEcharts: renderNodeResource } = useEcharts(nodeResourceRef);
const { renderEcharts: renderPodStatus } = useEcharts(podStatusRef);
const { renderEcharts: renderNamespace } = useEcharts(namespaceRef);

// 状态计算属性
const statusColor = computed(() => {
  const status = detail.value?.status;
  if (status === 'ok' || status === 'healthy') return '#52c41a';
  if (status === 'warning') return '#faad14';
  return '#ff4d4f';
});

const badgeStatus = computed(() => {
  const status = detail.value?.status;
  if (status === 'ok' || status === 'healthy') return 'success';
  if (status === 'warning') return 'warning';
  return 'error';
});

const statusText = computed(() => {
  const status = detail.value?.status;
  if (status === 'ok' || status === 'healthy') return '集群运行正常';
  if (status === 'warning') return '集群存在警告';
  return '集群状态异常';
});

// 集群数据（使用接口返回）
const nodeCount = computed(() => Number(detail.value?.details?.nodes?.total ?? 0));
const readyNodes = computed(() => Number(detail.value?.details?.nodes?.ready ?? 0));
const notReadyNodes = computed(() => nodeCount.value - readyNodes.value);

const podCount = computed(() => Number(detail.value?.details?.pods?.total ?? 0));
const runningPods = computed(() => Number(detail.value?.details?.pods?.running ?? 0));
const failedPods = computed(() => Number(detail.value?.details?.pods?.failed ?? 0));

const clusterVersion = computed(() => detail.value?.details?.version ?? '-');
const apiServerStatus = computed(() => detail.value?.details?.apiServer ?? '-');
const etcdStatus = computed(() => detail.value?.details?.etcd ?? '-');
const controllerStatus = computed(() => detail.value?.details?.controller ?? '-');
const schedulerStatus = computed(() => detail.value?.details?.scheduler ?? '-');

// 最近事件（接口返回），若无则空
const recentEvents = computed(() => detail.value?.details?.events ?? []);

async function fetchData() {
  loading.value = true;
  try {
    detail.value = await k8sHealthApi();
    renderCharts();
  } finally {
    loading.value = false;
  }
}

function renderCharts() {
  renderNodeResourceChart();
  renderPodStatusChart();
  renderNamespaceChart();
}

function renderNodeResourceChart() {
  const nodesData = (detail.value as any)?.details?.nodes;
  const nodes: string[] | undefined = nodesData?.names || nodesData?.list?.map((n: any) => n.name);
  const cpuData: number[] | undefined = nodesData?.cpu || nodesData?.list?.map((n: any) => Number(n.cpu));
  const memoryData: number[] | undefined = nodesData?.memory || nodesData?.list?.map((n: any) => Number(n.memory));
  const diskData: number[] | undefined = nodesData?.disk || nodesData?.list?.map((n: any) => Number(n.disk));

  if (!nodes || (!cpuData && !memoryData && !diskData)) {
    renderNodeResource({ title: { text: '暂无节点资源数据', left: 'center', top: 'center' } } as any);
    return;
  }

  renderNodeResource({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    legend: {
      data: ['CPU使用率', '内存使用率', '磁盘使用率']
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: { type: 'category', data: nodes },
    yAxis: {
      type: 'value',
      min: 0,
      max: 100,
      axisLabel: {
        formatter: '{value}%'
      }
    },
    series: [
      cpuData && { name: 'CPU使用率', type: 'bar', data: cpuData, itemStyle: { color: '#1890ff' } },
      memoryData && { name: '内存使用率', type: 'bar', data: memoryData, itemStyle: { color: '#52c41a' } },
      diskData && { name: '磁盘使用率', type: 'bar', data: diskData, itemStyle: { color: '#faad14' } },
    ].filter(Boolean)
  } as any);
}

function renderPodStatusChart() {
  const data = [
    { value: runningPods.value, name: '运行中', itemStyle: { color: '#52c41a' } },
    { value: Number((detail.value as any)?.details?.pods?.pending ?? 0), name: '等待中', itemStyle: { color: '#faad14' } },
    { value: failedPods.value, name: '失败', itemStyle: { color: '#ff4d4f' } },
  ].filter(item => Number(item.value) > 0);

  renderPodStatus({
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: { orient: 'vertical', left: 'left', data: data.map(item => item.name) },
    series: [
      {
        name: 'Pod状态',
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
            fontSize: '20',
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

function renderNamespaceChart() {
  const ns = (detail.value as any)?.details?.namespaces;
  const namespaces: string[] | undefined = ns?.names || ns?.list?.map((n: any) => n.name);
  const cpuRequests: number[] | undefined = ns?.cpu_requests || ns?.list?.map((n: any) => Number(n.cpu_requests));
  const memoryRequests: number[] | undefined = ns?.memory_requests || ns?.list?.map((n: any) => Number(n.memory_requests));
  const podCounts: number[] | undefined = ns?.pod_counts || ns?.list?.map((n: any) => Number(n.pod_counts));

  if (!namespaces || (!cpuRequests && !memoryRequests && !podCounts)) {
    renderNamespace({ title: { text: '暂无命名空间数据', left: 'center', top: 'center' } } as any);
    return;
  }

  renderNamespace({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' }
    },
    legend: {
      data: ['CPU请求(cores)', '内存请求(MB)', 'Pod数量']
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: { type: 'category', data: namespaces, axisLabel: { rotate: 45 } },
    yAxis: [
      {
        type: 'value',
        name: 'CPU/内存',
        position: 'left'
      },
      {
        type: 'value',
        name: 'Pod数量',
        position: 'right'
      }
    ],
    series: [
      cpuRequests && { name: 'CPU请求(cores)', type: 'bar', data: cpuRequests, itemStyle: { color: '#1890ff' } },
      memoryRequests && { name: '内存请求(MB)', type: 'bar', data: memoryRequests, itemStyle: { color: '#52c41a' } },
      podCounts && { name: 'Pod数量', type: 'line', yAxisIndex: 1, data: podCounts, itemStyle: { color: '#722ed1' } },
    ].filter(Boolean)
  } as any);
}

// 定时刷新
let refreshTimer: NodeJS.Timeout;

onMounted(() => {
  fetchData();
  refreshTimer = setInterval(fetchData, 30000);
});

onBeforeUnmount(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer);
  }
});
</script>

<style scoped>
.k8s-health {
  padding: 16px;
  background: #f5f5f5;
  min-height: calc(100vh - 140px);
}

.status-overview .status-card {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.status-overview .status-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.status-indicator, .node-status, .pod-status {
  margin-top: 8px;
}

.chart-card, .info-card {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.chart-card :deep(.ant-card-body) {
  padding: 20px;
}

.info-card :deep(.ant-descriptions-bordered .ant-descriptions-item-label) {
  background: #fafafa;
  font-weight: 500;
}

.events-list {
  max-height: 300px;
  overflow-y: auto;
}

.event-item {
  margin-bottom: 12px;
  padding: 8px;
  background: #fafafa;
  border-radius: 6px;
  border-left: 3px solid #d9d9d9;
}

.event-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.event-time {
  font-size: 12px;
  color: #999;
}

.event-content {
  font-size: 14px;
  color: #666;
  line-height: 1.4;
}
</style>
