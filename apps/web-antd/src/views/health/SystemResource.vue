<template>
  <div class="system-resource">
    <!-- 资源使用概览卡片 -->
    <a-row :gutter="[16, 16]" class="resource-overview">
      <a-col :xs="24" :sm="6">
        <a-card class="resource-card" :loading="loading">
          <a-statistic
            title="CPU使用率"
            :value="cpuUsage"
            suffix="%"
            :value-style="{ color: cpuColor, fontSize: '20px', fontWeight: 'bold' }"
          />
          <a-progress 
            :percent="cpuUsage" 
            :stroke-color="cpuColor"
            :show-info="false"
            size="small"
            style="margin-top: 8px"
          />
        </a-card>
      </a-col>
      <a-col :xs="24" :sm="6">
        <a-card class="resource-card" :loading="loading">
          <a-statistic
            title="内存使用率"
            :value="memoryUsage"
            suffix="%"
            :value-style="{ color: memoryColor, fontSize: '20px', fontWeight: 'bold' }"
          />
          <a-progress 
            :percent="memoryUsage" 
            :stroke-color="memoryColor"
            :show-info="false"
            size="small"
            style="margin-top: 8px"
          />
        </a-card>
      </a-col>
      <a-col :xs="24" :sm="6">
        <a-card class="resource-card" :loading="loading">
          <a-statistic
            title="磁盘使用率"
            :value="diskUsage"
            suffix="%"
            :value-style="{ color: diskColor, fontSize: '20px', fontWeight: 'bold' }"
          />
          <a-progress 
            :percent="diskUsage" 
            :stroke-color="diskColor"
            :show-info="false"
            size="small"
            style="margin-top: 8px"
          />
        </a-card>
      </a-col>
      <a-col :xs="24" :sm="6">
        <a-card class="resource-card" :loading="loading">
          <a-statistic
            title="网络流量"
            :value="networkTraffic"
            suffix="MB/s"
            :value-style="{ color: '#722ed1', fontSize: '20px', fontWeight: 'bold' }"
          />
          <div class="network-info">
            <a-tag color="blue">上行: {{ networkIn }}MB/s</a-tag>
            <a-tag color="green">下行: {{ networkOut }}MB/s</a-tag>
          </div>
        </a-card>
      </a-col>
    </a-row>

    <!-- 图表展示区域 -->
    <a-row :gutter="[16, 16]" style="margin-top: 16px">
      <a-col :xs="24" :lg="14">
        <a-card title="系统资源趋势" class="chart-card">
          <EchartsUI ref="chartRef1" height="350px" />
        </a-card>
      </a-col>
      <a-col :xs="24" :lg="10">
        <a-card title="资源使用分布" class="chart-card">
          <EchartsUI ref="pieChartRef" height="350px" />
        </a-card>
      </a-col>
    </a-row>

    <!-- 网络和磁盘IO -->
    <a-row :gutter="[16, 16]" style="margin-top: 16px">
      <a-col :xs="24" :lg="12">
        <a-card title="网络流量统计" class="chart-card">
          <EchartsUI ref="chartRef2" height="300px" />
        </a-card>
      </a-col>
      <a-col :xs="24" :lg="12">
        <a-card title="磁盘IO性能" class="chart-card">
          <EchartsUI ref="diskIORef" height="300px" />
        </a-card>
      </a-col>
    </a-row>

    <!-- 详细信息 -->
    <a-row :gutter="[16, 16]" style="margin-top: 16px">
      <a-col :xs="24" :md="12">
        <a-card title="系统信息" class="info-card">
          <a-descriptions bordered size="small" :column="1">
            <a-descriptions-item label="操作系统">{{ systemInfo.os }}</a-descriptions-item>
            <a-descriptions-item label="内核版本">{{ systemInfo.kernel }}</a-descriptions-item>
            <a-descriptions-item label="CPU型号">{{ systemInfo.cpuModel }}</a-descriptions-item>
            <a-descriptions-item label="CPU核心数">{{ systemInfo.cpuCores }}核</a-descriptions-item>
            <a-descriptions-item label="总内存">{{ systemInfo.totalMemory }}GB</a-descriptions-item>
            <a-descriptions-item label="总磁盘空间">{{ systemInfo.totalDisk }}GB</a-descriptions-item>
          </a-descriptions>
        </a-card>
      </a-col>
      <a-col :xs="24" :md="12">
        <a-card title="资源警告" class="info-card">
          <div v-if="warnings.length > 0" class="warnings-list">
            <div v-for="(warning, index) in warnings" :key="index" class="warning-item">
              <a-alert
                :message="warning.title"
                :description="warning.description"
                :type="warning.type"
                size="small"
                show-icon
              />
            </div>
          </div>
          <a-empty v-else description="系统运行正常，无警告" />
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

const loading = ref(false);
const detail = ref<any | null>(null);

const chartRef1 = ref<EchartsUIType>();
const chartRef2 = ref<EchartsUIType>();
const pieChartRef = ref<EchartsUIType>();
const diskIORef = ref<EchartsUIType>();

const { renderEcharts: render1 } = useEcharts(chartRef1);
const { renderEcharts: render2 } = useEcharts(chartRef2);
const { renderEcharts: renderPie } = useEcharts(pieChartRef);
const { renderEcharts: renderDiskIO } = useEcharts(diskIORef);

// 计算属性（兼容新老结构）
const cpuUsage = computed(() => {
  const sys = (detail.value as any)?.system ?? {};
  const nested = sys?.cpu?.usage_percent;
  const flat = sys?.cpu_usage;
  const legacyTop = (detail.value as any)?.cpu;
  const usage = typeof nested === 'number' ? nested : typeof flat === 'number' ? flat : legacyTop;
  return Math.round(Number(usage ?? 0));
});

const memoryUsage = computed(() => {
  const sys = (detail.value as any)?.system ?? {};
  const nested = sys?.memory?.usage_percent;
  const flat = sys?.mem_usage ?? sys?.memory_usage;
  const legacyTop = (detail.value as any)?.memory;
  const usage = typeof nested === 'number' ? nested : typeof flat === 'number' ? flat : legacyTop;
  return Math.round(Number(usage ?? 0));
});

const diskUsage = computed(() => {
  const sys = (detail.value as any)?.system ?? {};
  const nested = sys?.disk?.usage_percent;
  const flat = sys?.disk_usage;
  const legacyTop = (detail.value as any)?.disk;
  const usage = typeof nested === 'number' ? nested : typeof flat === 'number' ? flat : legacyTop;
  return Math.round(Number(usage ?? 0));
});

const networkIn = computed(() => {
  const sys = (detail.value as any)?.system ?? {};
  const v = (sys?.network?.in ?? (detail.value as any)?.net_in ?? (detail.value as any)?.network?.in);
  return Math.round(Number(v ?? 0) * 10) / 10;
});

const networkOut = computed(() => {
  const sys = (detail.value as any)?.system ?? {};
  const v = (sys?.network?.out ?? (detail.value as any)?.net_out ?? (detail.value as any)?.network?.out);
  return Math.round(Number(v ?? 0) * 10) / 10;
});

const networkTraffic = computed(() => {
  return Math.round((networkIn.value + networkOut.value) * 10) / 10;
});

// 颜色计算
const cpuColor = computed(() => {
  if (cpuUsage.value < 60) return '#52c41a';
  if (cpuUsage.value < 80) return '#faad14';
  return '#ff4d4f';
});

const memoryColor = computed(() => {
  if (memoryUsage.value < 60) return '#52c41a';
  if (memoryUsage.value < 80) return '#faad14';
  return '#ff4d4f';
});

const diskColor = computed(() => {
  if (diskUsage.value < 60) return '#52c41a';
  if (diskUsage.value < 80) return '#faad14';
  return '#ff4d4f';
});

// 系统信息（兼容新老结构）
const systemInfo = computed(() => {
  const sys = (detail.value as any)?.system ?? {};
  const cpuModel = sys?.cpu?.model ?? sys?.cpu_model ?? '-';
  const cpuCores = sys?.cpu?.count ?? sys?.cpu_cores ?? 0;
  const totalMemory = sys?.memory?.total_gb ?? sys?.total_memory ?? 0;
  const totalDisk = sys?.disk?.total_gb ?? sys?.total_disk ?? 0;
  return {
    os: sys?.os ?? '-',
    kernel: sys?.kernel ?? '-',
    cpuModel,
    cpuCores,
    totalMemory,
    totalDisk
  };
});

// 警告信息
const warnings = computed(() => {
  const warns = [];
  if (cpuUsage.value > 80) {
    warns.push({
      title: 'CPU使用率过高',
      description: `当前CPU使用率为 ${cpuUsage.value}%，建议检查系统负载`,
      type: 'warning'
    });
  }
  if (memoryUsage.value > 85) {
    warns.push({
      title: '内存使用率过高',
      description: `当前内存使用率为 ${memoryUsage.value}%，建议释放部分内存`,
      type: 'error'
    });
  }
  if (diskUsage.value > 90) {
    warns.push({
      title: '磁盘空间不足',
      description: `当前磁盘使用率为 ${diskUsage.value}%，建议清理磁盘空间`,
      type: 'error'
    });
  }
  return warns;
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
  renderPieChart();
  renderNetworkChart();
  renderDiskIOChart();
}

function renderTrendChart() {
  // 使用真实趋势数据（若接口提供）
  const sys = (detail.value as any)?.system ?? {};
  const trend = sys?.trend || sys?.history || (detail.value as any)?.trend || (detail.value as any)?.history;
  const times: string[] | undefined = trend?.times || trend?.time;
  const cpu: number[] | undefined = trend?.cpu;
  const memory: number[] | undefined = trend?.memory || trend?.mem;
  const disk: number[] | undefined = trend?.disk || trend?.disk_usage;

  if (!times || (!cpu && !memory && !disk)) {
    render1({ title: { text: '暂无趋势数据', left: 'center', top: 'center' } } as any);
    return;
  }

  render1({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' }
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
      memory && { name: '内存使用率', type: 'line', smooth: true, data: memory, itemStyle: { color: '#52c41a' }, areaStyle: { opacity: 0.3 } },
      disk && { name: '磁盘使用率', type: 'line', smooth: true, data: disk, itemStyle: { color: '#faad14' } },
    ].filter(Boolean)
  } as any);
}

function renderPieChart() {
  const data = [
    { value: cpuUsage.value, name: 'CPU', itemStyle: { color: cpuColor.value } },
    { value: memoryUsage.value, name: '内存', itemStyle: { color: memoryColor.value } },
    { value: diskUsage.value, name: '磁盘', itemStyle: { color: diskColor.value } }
  ];

  renderPie({
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c}% ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      data: data.map(item => item.name)
    },
    series: [
      {
        name: '资源使用率',
        type: 'pie',
        radius: '70%',
        center: ['60%', '50%'],
        avoidLabelOverlap: false,
        label: {
          show: true,
          position: 'outside',
          formatter: '{b}: {c}%'
        },
        labelLine: {
          show: true
        },
        data: data
      }
    ]
  } as any);
}

function renderNetworkChart() {
  const sys = (detail.value as any)?.system ?? {};
  const netTrend = sys?.network?.trend || (detail.value as any)?.network_trend || (detail.value as any)?.network?.trend;
  const times: string[] | undefined = netTrend?.times || netTrend?.time;
  const netInData: number[] | undefined = netTrend?.in;
  const netOutData: number[] | undefined = netTrend?.out;

  if (!times || (!netInData && !netOutData)) {
    render2({ title: { text: '暂无网络数据', left: 'center', top: 'center' } } as any);
    return;
  }

  render2({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    legend: {
      data: ['网络接收', '网络发送']
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: { type: 'category', data: times },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: '{value} MB/s'
      }
    },
    series: [
      netInData && { name: '网络接收', type: 'bar', data: netInData, itemStyle: { color: '#1890ff' } },
      netOutData && { name: '网络发送', type: 'bar', data: netOutData, itemStyle: { color: '#52c41a' } },
    ].filter(Boolean)
  } as any);
}

function renderDiskIOChart() {
  const sys = (detail.value as any)?.system ?? {};
  const ioTrend = sys?.disk?.trend || (detail.value as any)?.disk_trend || (detail.value as any)?.disk?.trend;
  const times: string[] | undefined = ioTrend?.times || ioTrend?.time;
  const readData: number[] | undefined = ioTrend?.read;
  const writeData: number[] | undefined = ioTrend?.write;

  if (!times || (!readData && !writeData)) {
    renderDiskIO({ title: { text: '暂无磁盘IO数据', left: 'center', top: 'center' } } as any);
    return;
  }

  renderDiskIO({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' }
    },
    legend: {
      data: ['磁盘读取', '磁盘写入']
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
      axisLabel: {
        formatter: '{value} MB/s'
      }
    },
    series: [
      readData && { name: '磁盘读取', type: 'line', smooth: true, data: readData, itemStyle: { color: '#722ed1' }, areaStyle: { opacity: 0.3 } },
      writeData && { name: '磁盘写入', type: 'line', smooth: true, data: writeData, itemStyle: { color: '#eb2f96' }, areaStyle: { opacity: 0.3 } },
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
.system-resource {
  padding: 16px;
  background: #f5f5f5;
  min-height: calc(100vh - 140px);
}

.resource-overview .resource-card {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.resource-overview .resource-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.network-info {
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

.warnings-list {
  max-height: 300px;
  overflow-y: auto;
}

.warning-item {
  margin-bottom: 8px;
}

.warning-item:last-child {
  margin-bottom: 0;
}
</style>
