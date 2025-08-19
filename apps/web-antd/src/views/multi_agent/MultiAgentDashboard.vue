<template>
  <div>
    <a-card :bordered="false" title="多智能体总览" :loading="loading">
      <a-row :gutter="16">
        <a-col :span="6"><a-card><a-statistic title="活跃智能体" :value="metrics.active_agents || 0" /></a-card></a-col>
        <a-col :span="6"><a-card><a-statistic title="运行任务" :value="metrics.running_tasks || 0" /></a-card></a-col>
        <a-col :span="6"><a-card><a-statistic title="成功率(%)" :value="metrics.success_rate || 0" /></a-card></a-col>
        <a-col :span="6"><a-card><a-statistic title="平均延迟(ms)" :value="metrics.avg_latency_ms || 0" /></a-card></a-col>
      </a-row>

      <a-row :gutter="16" style="margin-top: 12px">
        <a-col :span="14">
          <a-card title="近况趋势">
            <EchartsUI ref="chartRef" height="320px" />
          </a-card>
        </a-col>
        <a-col :span="10">
          <a-card title="系统状态">
            <pre style="white-space: pre-wrap">{{ pretty(status) }}</pre>
          </a-card>
        </a-col>
      </a-row>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { multiAgentStatusDetailApi, multiAgentMetricsDetailApi } from '#/api';
import { EchartsUI, useEcharts } from '@vben/plugins/echarts';
import type { EchartsUIType } from '@vben/plugins/echarts';

const loading = ref(false);
const status = ref<Record<string, any>>({});
const metrics = ref<Record<string, any>>({});
const chartRef = ref<EchartsUIType>();
const { renderEcharts } = useEcharts(chartRef);

function pretty(v: any) { try { return JSON.stringify(v ?? {}, null, 2); } catch { return String(v ?? ''); } }

async function fetchAll() {
  loading.value = true;
  try {
    const [s, m] = await Promise.all([
      multiAgentStatusDetailApi(),
      multiAgentMetricsDetailApi(),
    ]);
    status.value = s;
    metrics.value = m;
    renderChart();
  } finally { loading.value = false; }
}

onMounted(fetchAll);

function renderChart() {
  const x = Array.from({ length: 12 }).map((_, i) => i + 1);
  const ok = x.map((i) => Number(metrics.value?.success_rate ?? 0));
  const rt = x.map((i) => Number(metrics.value?.avg_latency_ms ?? 0));
  const options = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['成功率(%)', '平均延迟(ms)'] },
    grid: { left: 40, right: 20, top: 30, bottom: 40 },
    xAxis: { type: 'category', data: x.map((i) => `T${i}`) },
    yAxis: [{ type: 'value', name: '%', position: 'left' }, { type: 'value', name: 'ms', position: 'right' }],
    series: [
      { type: 'line', name: '成功率(%)', smooth: true, yAxisIndex: 0, data: ok },
      { type: 'bar', name: '平均延迟(ms)', yAxisIndex: 1, data: rt },
    ],
  } as any;
  renderEcharts(options);
}
</script>
