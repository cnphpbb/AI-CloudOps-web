<template>
  <div class="system-health">
    <!-- 状态概览卡片 -->
    <a-row :gutter="[16, 16]" class="status-overview">
      <a-col :xs="24" :sm="8">
        <a-card class="status-card" :loading="loading">
          <a-statistic
            title="系统状态"
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
            title="CPU使用率"
            :value="cpuUsage"
            suffix="%"
            :value-style="{ color: cpuColor }"
          />
          <a-progress 
            :percent="cpuUsage" 
            :stroke-color="cpuColor"
            :show-info="false"
            size="small"
          />
        </a-card>
      </a-col>
      <a-col :xs="24" :sm="8">
        <a-card class="status-card" :loading="loading">
          <a-statistic
            title="内存使用率"
            :value="memUsage"
            suffix="%"
            :value-style="{ color: memColor }"
          />
          <a-progress 
            :percent="memUsage" 
            :stroke-color="memColor"
            :show-info="false"
            size="small"
          />
        </a-card>
      </a-col>
    </a-row>

    <!-- 图表展示区域 -->
    <a-row :gutter="[16, 16]" style="margin-top: 16px">
      <a-col :xs="24" :lg="14">
        <a-card title="系统负载趋势" class="chart-card">
          <EchartsUI ref="chartRef" height="350px" />
        </a-card>
      </a-col>
      <a-col :xs="24" :lg="10">
        <a-card title="资源使用分布" class="chart-card">
          <EchartsUI ref="pieChartRef" height="350px" />
        </a-card>
      </a-col>
    </a-row>

    <!-- 详细信息 -->
    <a-row :gutter="[16, 16]" style="margin-top: 16px">
      <a-col :xs="24" :md="12">
        <a-card title="系统信息" class="info-card">
          <a-descriptions bordered size="small" :column="1">
            <a-descriptions-item label="系统版本">{{ detail?.version || 'N/A' }}</a-descriptions-item>
            <a-descriptions-item label="运行时间">{{ uptimeDisplay }}</a-descriptions-item>
          </a-descriptions>
        </a-card>
      </a-col>
      <a-col :xs="24" :md="12">
        <a-card title="组件状态" class="info-card">
          <div v-if="components.length > 0">
            <div v-for="comp in components" :key="comp.name" class="component-item">
              <div class="component-info">
                <span class="component-name">{{ comp.name }}</span>
                <a-tag :color="comp.color" size="small">{{ comp.status }}</a-tag>
              </div>
              <a-progress 
                v-if="comp.health !== undefined"
                :percent="comp.health" 
                size="small"
                :stroke-color="comp.color"
                :show-info="false"
              />
            </div>
          </div>
          <a-empty v-else description="暂无组件数据" />
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref } from 'vue';
import { healthDetailApi } from '#/api';
import { EchartsUI, useEcharts } from '@vben/plugins/echarts';
import type { EchartsUIType } from '@vben/plugins/echarts';

// 定义接口类型以匹配API返回结构
interface HealthDetail {
  status: string;
  components?: Record<string, any>;
  system?: Record<string, any>;
  version?: string;
  uptime?: number;
}

const loading = ref(false);
const detail = ref<HealthDetail | null>(null);
const chartRef = ref<EchartsUIType>();
const pieChartRef = ref<EchartsUIType>();
const { renderEcharts } = useEcharts(chartRef);
const { renderEcharts: renderPieChart } = useEcharts(pieChartRef);

// 状态相关计算属性
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
  if (status === 'ok' || status === 'healthy') return '系统正常运行';
  if (status === 'warning') return '系统运行异常';
  return '系统状态未知';
});

// CPU和内存使用率（兼容嵌套与扁平结构）
const cpuUsage = computed(() => {
  const sys = (detail.value as any)?.system ?? {};
  const nested = sys?.cpu?.usage_percent;
  const flat = sys?.cpu_usage;
  const usage = typeof nested === 'number' ? nested : flat;
  return Math.round(Number(usage ?? 0));
});

const memUsage = computed(() => {
  const sys = (detail.value as any)?.system ?? {};
  const nested = sys?.memory?.usage_percent;
  const flat = sys?.mem_usage ?? sys?.memory_usage;
  const usage = typeof nested === 'number' ? nested : flat;
  return Math.round(Number(usage ?? 0));
});

const cpuColor = computed(() => {
  if (cpuUsage.value < 60) return '#52c41a';
  if (cpuUsage.value < 80) return '#faad14';
  return '#ff4d4f';
});

const memColor = computed(() => {
  if (memUsage.value < 60) return '#52c41a';
  if (memUsage.value < 80) return '#faad14';
  return '#ff4d4f';
});

const uptimeDisplay = computed(() => {
  const uptime = (detail.value as any)?.uptime;
  if (uptime == null) return 'N/A';
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
});

// 组件状态（支持布尔与对象结构）
const components = computed(() => {
  const comps = (detail.value as any)?.components;
  if (!comps) return [] as Array<{ name: string; status: string; color: string; health?: number }>;
  return Object.entries(comps).map(([name, comp]: [string, any]) => {
    let status: string = 'unknown';
    let healthPercent: number | undefined;
    if (typeof comp === 'boolean') {
      status = comp ? 'healthy' : 'error';
    } else if (comp && typeof comp === 'object') {
      status = comp.status || (comp.healthy === true || comp.ok === true ? 'healthy' : 'unknown');
      const raw = (comp.health ?? comp.percent ?? undefined) as number | undefined;
      healthPercent = typeof raw === 'number' ? Math.max(0, Math.min(100, Math.round(raw))) : undefined;
    }
    let color = '#d9d9d9';
    if (status === 'healthy' || status === 'ok') color = '#52c41a';
    else if (status === 'warning') color = '#faad14';
    else if (status === 'error') color = '#ff4d4f';
    return { name, status, color, health: healthPercent };
  });
});

async function fetchData() {
  loading.value = true;
  try {
    detail.value = await healthDetailApi();
    renderCharts();
  } finally {
    loading.value = false;
  }
}

function renderCharts() {
  renderTrendChart();
  renderResourcePieChart();
}

function renderTrendChart() {
  // 使用健康详情接口返回的趋势数据（若提供）
  const trend = detail.value?.system?.trend || detail.value?.system?.history;
  const times: string[] | undefined = trend?.times || trend?.time;
  const cpu: number[] | undefined = trend?.cpu;
  const mem: number[] | undefined = trend?.memory || trend?.mem;
  const diskIO: number[] | undefined = trend?.disk_io || trend?.diskIO;
  const networkIO: number[] | undefined = trend?.network_io || trend?.net_io;

  if (!times || (!cpu && !mem && !diskIO && !networkIO)) {
    renderEcharts({
      title: { text: '暂无趋势数据', left: 'center', top: 'center' },
    } as any);
    return;
  }
  
  renderEcharts({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' }
    },
    legend: {
      data: ['CPU使用率', '内存使用率', '磁盘IO', '网络IO']
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: { type: 'category', boundaryGap: false, data: times },
    yAxis: {
      type: 'value',
      min: 0,
      max: 100,
      axisLabel: {
        formatter: '{value}%'
      }
    },
    series: [
      cpu && { name: 'CPU使用率', type: 'line', smooth: true, data: cpu, itemStyle: { color: '#1890ff' }, areaStyle: { opacity: 0.3 } },
      mem && { name: '内存使用率', type: 'line', smooth: true, data: mem, itemStyle: { color: '#52c41a' }, areaStyle: { opacity: 0.3 } },
      diskIO && { name: '磁盘IO', type: 'line', smooth: true, data: diskIO, itemStyle: { color: '#faad14' } },
      networkIO && { name: '网络IO', type: 'line', smooth: true, data: networkIO, itemStyle: { color: '#722ed1' } },
    ].filter(Boolean)
  } as any);
}

function renderResourcePieChart() {
  const data = [
    { value: cpuUsage.value, name: 'CPU使用', itemStyle: { color: cpuColor.value } },
    { value: 100 - cpuUsage.value, name: 'CPU空闲', itemStyle: { color: '#f0f0f0' } }
  ];
  
  renderPieChart({
    title: {
      text: `CPU: ${cpuUsage.value}%`,
      left: 'center',
      top: '40%',
      textStyle: {
        fontSize: 16,
        fontWeight: 'bold'
      }
    },
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c}% ({d}%)'
    },
    series: [
      {
        name: 'CPU使用率',
        type: 'pie',
        radius: ['60%', '80%'],
        center: ['50%', '60%'],
        avoidLabelOverlap: false,
        label: {
          show: false
        },
        labelLine: {
          show: false
        },
        data: data
      }
    ]
  } as any);
}

// 定时刷新数据
let refreshTimer: NodeJS.Timeout;

onMounted(() => {
  fetchData();
  
  // 每30秒刷新一次数据
  refreshTimer = setInterval(fetchData, 30000);
});

onBeforeUnmount(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer);
  }
});
</script>

<style scoped>
.system-health {
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

.status-indicator {
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

.component-item {
  margin-bottom: 12px;
  padding: 8px;
  background: #fafafa;
  border-radius: 6px;
}

.component-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.component-name {
  font-weight: 500;
  color: #333;
}
</style>
