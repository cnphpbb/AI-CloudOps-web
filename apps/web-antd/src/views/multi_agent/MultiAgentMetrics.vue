<template>
  <div>
    <a-card :bordered="false" title="性能指标" :loading="loading">
      <a-row :gutter="16">
        <a-col :span="6"><a-card><a-statistic title="总工作流" :value="metrics.total_workflows || 0" /></a-card></a-col>
        <a-col :span="6"><a-card><a-statistic title="成功工作流" :value="metrics.success_workflows || 0" /></a-card></a-col>
        <a-col :span="6"><a-card><a-statistic title="失败工作流" :value="metrics.failed_workflows || 0" /></a-card></a-col>
        <a-col :span="6"><a-card><a-statistic title="平均耗时(s)" :value="metrics.avg_duration_s || 0" /></a-card></a-col>
      </a-row>
      <a-row :gutter="16" style="margin-top: 12px">
        <a-col :span="12">
          <a-card title="成功/失败趋势">
            <EchartsUI ref="chartRef1" height="320px" />
          </a-card>
        </a-col>
        <a-col :span="12">
          <a-card title="耗时分布">
            <EchartsUI ref="chartRef2" height="320px" />
          </a-card>
        </a-col>
      </a-row>
      <a-card title="原始指标" style="margin-top: 12px"><pre style="white-space: pre-wrap">{{ pretty(metrics) }}</pre></a-card>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { multiAgentMetricsDetailApi } from '#/api';
import { EchartsUI, useEcharts } from '@vben/plugins/echarts';
import type { EchartsUIType } from '@vben/plugins/echarts';

const loading = ref(false);
const metrics = ref<Record<string, any>>({});
const chartRef1 = ref<EchartsUIType>();
const chartRef2 = ref<EchartsUIType>();
const { renderEcharts: render1 } = useEcharts(chartRef1);
const { renderEcharts: render2 } = useEcharts(chartRef2);

function pretty(v: any) { try { return JSON.stringify(v ?? {}, null, 2); } catch { return String(v ?? ''); } }

async function fetchData() { loading.value = true; try { metrics.value = await multiAgentMetricsDetailApi(); renderCharts(); } finally { loading.value = false; } }

onMounted(fetchData);

function renderCharts() {
  const x = Array.from({ length: 12 }).map((_, i) => i + 1);
  const suc = x.map(() => Number(metrics.value?.success_workflows ?? 0));
  const fail = x.map(() => Number(metrics.value?.failed_workflows ?? 0));
  render1({
    tooltip: { trigger: 'axis' },
    legend: { data: ['成功', '失败'] },
    grid: { left: 40, right: 20, top: 30, bottom: 40 },
    xAxis: { type: 'category', data: x.map((i) => `T${i}`) },
    yAxis: { type: 'value' },
    series: [
      { type: 'bar', name: '成功', data: suc },
      { type: 'bar', name: '失败', data: fail },
    ],
  } as any);

  const dur = [
    { value: Number(metrics.value?.p50_duration_s ?? 0), name: 'P50' },
    { value: Number(metrics.value?.p90_duration_s ?? 0), name: 'P90' },
    { value: Number(metrics.value?.p99_duration_s ?? 0), name: 'P99' },
  ];
  render2({
    tooltip: { trigger: 'item' },
    legend: { top: 'top' },
    series: [{ type: 'pie', radius: ['40%', '70%'], avoidLabelOverlap: false, data: dur }],
  } as any);
}
</script>
