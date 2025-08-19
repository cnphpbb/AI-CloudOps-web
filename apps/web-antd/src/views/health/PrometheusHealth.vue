<template>
  <div class="prometheus-health">
    <!-- 状态概览 -->
    <a-row :gutter="[16, 16]" class="status-overview">
      <a-col :xs="24" :sm="6">
        <a-card class="status-card" :loading="loading">
          <a-statistic
            title="Prometheus状态"
            :value="detail?.status || 'unknown'"
            :value-style="{ color: statusColor, fontSize: '24px', fontWeight: 'bold' }"
          />
          <div class="status-indicator">
            <a-badge :status="badgeStatus" :text="statusText" />
          </div>
        </a-card>
      </a-col>
      <a-col :xs="24" :sm="6">
        <a-card class="status-card" :loading="loading">
          <a-statistic
            title="活跃目标"
            :value="activeTargets"
            suffix="个"
            :value-style="{ color: '#1890ff' }"
          />
          <div class="metric-info">
            <a-tag color="success">正常: {{ healthyTargets }}</a-tag>
            <a-tag color="error">异常: {{ unhealthyTargets }}</a-tag>
          </div>
        </a-card>
      </a-col>
      <a-col :xs="24" :sm="6">
        <a-card class="status-card" :loading="loading">
          <a-statistic
            title="指标数量"
            :value="metricsCount"
            suffix="个"
            :value-style="{ color: '#52c41a' }"
          />
          <div class="metric-info">
            <span class="metric-rate">采集频率: {{ scrapeInterval }}</span>
          </div>
        </a-card>
      </a-col>
      <a-col :xs="24" :sm="6">
        <a-card class="status-card" :loading="loading">
          <a-statistic
            title="存储空间"
            :value="storageUsage"
            suffix="GB"
            :value-style="{ color: '#722ed1' }"
          />
          <div class="metric-info">
            <a-progress 
              :percent="storagePercent" 
              size="small"
              :stroke-color="storageColor"
              :show-info="false"
            />
          </div>
        </a-card>
      </a-col>
    </a-row>

    <!-- 图表展示区域 -->
    <a-row :gutter="[16, 16]" style="margin-top: 16px">
      <a-col :xs="24" :lg="12">
        <a-card title="查询性能" class="chart-card">
          <EchartsUI ref="queryPerformanceRef" height="300px" />
        </a-card>
      </a-col>
      <a-col :xs="24" :lg="12">
        <a-card title="目标状态分布" class="chart-card">
          <EchartsUI ref="targetStatusRef" height="300px" />
        </a-card>
      </a-col>
    </a-row>

    <!-- 监控指标趋势 -->
    <a-row :gutter="[16, 16]" style="margin-top: 16px">
      <a-col :xs="24">
        <a-card title="监控指标趋势" class="chart-card">
          <EchartsUI ref="metricsTrendRef" height="350px" />
        </a-card>
      </a-col>
    </a-row>

    <!-- 详细信息 -->
    <a-row :gutter="[16, 16]" style="margin-top: 16px">
      <a-col :xs="24" :md="12">
        <a-card title="服务信息" class="info-card">
          <a-descriptions bordered size="small" :column="1">
            <a-descriptions-item label="版本">{{ prometheusVersion }}</a-descriptions-item>
            <a-descriptions-item label="运行时间">{{ uptimeDisplay }}</a-descriptions-item>
            <a-descriptions-item label="配置文件">{{ configFile }}</a-descriptions-item>
            <a-descriptions-item label="存储引擎">{{ storageEngine }}</a-descriptions-item>
            <a-descriptions-item label="保留时间">{{ retentionTime }}</a-descriptions-item>
          </a-descriptions>
        </a-card>
      </a-col>
      <a-col :xs="24" :md="12">
        <a-card title="活跃规则" class="info-card">
          <div v-if="activeRules.length > 0" class="rules-list">
            <div v-for="(rule, index) in activeRules" :key="index" class="rule-item">
              <div class="rule-header">
                <span class="rule-name">{{ rule.name }}</span>
                <a-tag :color="rule.type === 'alerting' ? 'red' : 'blue'" size="small">
                  {{ rule.type }}
                </a-tag>
              </div>
              <div class="rule-content">{{ rule.expr }}</div>
              <div class="rule-status">
                状态: <a-tag :color="rule.health === 'ok' ? 'green' : 'red'" size="small">{{ rule.health }}</a-tag>
              </div>
            </div>
          </div>
          <a-empty v-else description="暂无活跃规则" />
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref } from 'vue';
import { prometheusHealthApi } from '#/api';
import { EchartsUI, useEcharts } from '@vben/plugins/echarts';
import type { EchartsUIType } from '@vben/plugins/echarts';

const loading = ref(false);
const detail = ref<any | null>(null);

const queryPerformanceRef = ref<EchartsUIType>();
const targetStatusRef = ref<EchartsUIType>();
const metricsTrendRef = ref<EchartsUIType>();

const { renderEcharts: renderQueryPerformance } = useEcharts(queryPerformanceRef);
const { renderEcharts: renderTargetStatus } = useEcharts(targetStatusRef);
const { renderEcharts: renderMetricsTrend } = useEcharts(metricsTrendRef);

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
  if (status === 'ok' || status === 'healthy') return 'Prometheus运行正常';
  if (status === 'warning') return 'Prometheus存在警告';
  return 'Prometheus状态异常';
});

// 监控数据（接口返回）
const activeTargets = computed(() => Number(detail.value?.details?.targets?.total ?? 0));
const healthyTargets = computed(() => Number(detail.value?.details?.targets?.healthy ?? 0));
const unhealthyTargets = computed(() => activeTargets.value - healthyTargets.value);

const metricsCount = computed(() => Number(detail.value?.details?.metrics?.count ?? 0));
const storageUsage = computed(() => Number(detail.value?.details?.storage?.used ?? 0));
const storageTotal = computed(() => Number(detail.value?.details?.storage?.total ?? 0));
const storagePercent = computed(() => {
  const total = storageTotal.value;
  if (!total || total <= 0) return 0;
  return Math.round((storageUsage.value / total) * 100);
});

const storageColor = computed(() => {
  if (storagePercent.value < 60) return '#52c41a';
  if (storagePercent.value < 80) return '#faad14';
  return '#ff4d4f';
});

const prometheusVersion = computed(() => detail.value?.details?.version ?? '-');
const configFile = computed(() => detail.value?.details?.config ?? '-');
const storageEngine = computed(() => detail.value?.details?.storage?.engine ?? '-');
const retentionTime = computed(() => detail.value?.details?.retention ?? '-');
const scrapeInterval = computed(() => detail.value?.details?.scrape_interval ?? '-');

const uptimeDisplay = computed(() => {
  const uptime = Number(detail.value?.details?.uptime ?? 0);
  const days = Math.floor(uptime / (24 * 3600));
  const hours = Math.floor((uptime % (24 * 3600)) / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  
  if (days > 0) return `${days}天${hours}小时`;
  if (hours > 0) return `${hours}小时${minutes}分钟`;
  return `${minutes}分钟`;
});

// 活跃规则（接口返回）
const activeRules = computed(() => detail.value?.details?.rules ?? []);

async function fetchData() {
  loading.value = true;
  try {
    detail.value = await prometheusHealthApi();
    renderCharts();
  } finally {
    loading.value = false;
  }
}

function renderCharts() {
  renderQueryPerformanceChart();
  renderTargetStatusChart();
  renderMetricsTrendChart();
}

function renderQueryPerformanceChart() {
  const perf = (detail.value as any)?.details?.performance;
  const times: string[] | undefined = perf?.times || perf?.time;
  const queryDuration: number[] | undefined = perf?.duration_ms || perf?.duration;
  const queryRate: number[] | undefined = perf?.qps || perf?.rate;

  if (!times || (!queryDuration && !queryRate)) {
    renderQueryPerformance({ title: { text: '暂无查询性能数据', left: 'center', top: 'center' } } as any);
    return;
  }

  renderQueryPerformance({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' }
    },
    legend: {
      data: ['查询耗时(ms)', '查询频率(qps)']
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: { type: 'category', boundaryGap: false, data: times },
    yAxis: [
      {
        type: 'value',
        name: '耗时(ms)',
        position: 'left'
      },
      {
        type: 'value',
        name: '频率(qps)',
        position: 'right'
      }
    ],
    series: [
      queryDuration && { name: '查询耗时(ms)', type: 'line', data: queryDuration, smooth: true, itemStyle: { color: '#1890ff' }, areaStyle: { opacity: 0.3 } },
      queryRate && { name: '查询频率(qps)', type: 'line', yAxisIndex: 1, data: queryRate, smooth: true, itemStyle: { color: '#52c41a' } },
    ].filter(Boolean)
  } as any);
}

function renderTargetStatusChart() {
  const data = [
    { value: healthyTargets.value, name: '健康', itemStyle: { color: '#52c41a' } },
    { value: unhealthyTargets.value, name: '异常', itemStyle: { color: '#ff4d4f' } },
  ].filter(item => Number(item.value) > 0);

  renderTargetStatus({
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: { orient: 'vertical', left: 'left', data: data.map(item => item.name) },
    series: [
      {
        name: '目标状态',
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

function renderMetricsTrendChart() {
  const trend = (detail.value as any)?.details?.metrics_trend || (detail.value as any)?.details?.trend;
  const hours: string[] | undefined = trend?.times || trend?.time;
  const sampleRate: number[] | undefined = trend?.sample_rate;
  const ruleEvaluations: number[] | undefined = trend?.rule_evaluations;
  const alertsActive: number[] | undefined = trend?.alerts_active;

  if (!hours || (!sampleRate && !ruleEvaluations && !alertsActive)) {
    renderMetricsTrend({ title: { text: '暂无指标趋势数据', left: 'center', top: 'center' } } as any);
    return;
  }

  renderMetricsTrend({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' }
    },
    legend: {
      data: ['样本采集率(/s)', '规则评估数', '活跃告警数']
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: { type: 'category', boundaryGap: false, data: hours },
    yAxis: [
      {
        type: 'value',
        name: '采集率/评估数',
        position: 'left'
      },
      {
        type: 'value',
        name: '告警数',
        position: 'right',
        max: 10
      }
    ],
    series: [
      sampleRate && { name: '样本采集率(/s)', type: 'line', data: sampleRate, smooth: true, itemStyle: { color: '#1890ff' }, areaStyle: { opacity: 0.3 } },
      ruleEvaluations && { name: '规则评估数', type: 'line', data: ruleEvaluations, smooth: true, itemStyle: { color: '#52c41a' } },
      alertsActive && { name: '活跃告警数', type: 'bar', yAxisIndex: 1, data: alertsActive, itemStyle: { color: '#ff4d4f' } },
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
.prometheus-health {
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

.status-indicator, .metric-info {
  margin-top: 8px;
}

.metric-rate {
  font-size: 12px;
  color: #666;
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

.rules-list {
  max-height: 300px;
  overflow-y: auto;
}

.rule-item {
  margin-bottom: 12px;
  padding: 12px;
  background: #fafafa;
  border-radius: 6px;
  border-left: 3px solid #1890ff;
}

.rule-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.rule-name {
  font-weight: 500;
  color: #333;
}

.rule-content {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 12px;
  color: #666;
  background: #f6f6f6;
  padding: 4px 8px;
  border-radius: 4px;
  margin-bottom: 6px;
}

.rule-status {
  font-size: 12px;
  color: #999;
}
</style>
