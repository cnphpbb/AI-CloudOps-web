<template>
  <div>
    <a-card :loading="loading" :bordered="false" title="趋势详情">
      <a-descriptions bordered :column="2">
        <a-descriptions-item label="ID">{{ detail?.id }}</a-descriptions-item>
        <a-descriptions-item label="指标">{{ detail?.metric }}</a-descriptions-item>
        <a-descriptions-item label="预测小时数">{{ detail?.hours_ahead }}</a-descriptions-item>
        <a-descriptions-item label="创建时间">{{ detail?.created_at }}</a-descriptions-item>
      </a-descriptions>

      <a-card style="margin-top: 12px" title="趋势图">
        <EchartsUI ref="chartRef" height="360px" />
      </a-card>

      <a-row :gutter="16" style="margin-top: 12px">
        <a-col :span="8"><a-card><a-statistic title="最大值" :value="stats.max" /></a-card></a-col>
        <a-col :span="8"><a-card><a-statistic title="最小值" :value="stats.min" /></a-card></a-col>
        <a-col :span="8"><a-card><a-statistic title="平均值" :value="stats.avg" /></a-card></a-col>
      </a-row>

      <a-card style="margin-top: 12px" title="预测点">
        <a-table :data-source="points" :columns="pointColumns" :pagination="false" row-key="timestamp">
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'timestamp'">
              {{ formatTime(record.timestamp) }}
            </template>
          </template>
        </a-table>
      </a-card>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { getTrendDetailApi } from '#/api';
import { EchartsUI, useEcharts } from '@vben/plugins/echarts';
import type { EchartsUIType } from '@vben/plugins/echarts';

const route = useRoute();
const loading = ref(false);
const detail = ref<any | null>(null);
const chartRef = ref<EchartsUIType>();
const { renderEcharts } = useEcharts(chartRef);

const pointColumns = [
  { title: '时间', dataIndex: 'timestamp', key: 'timestamp', width: 220 },
  { title: '值', dataIndex: 'value', key: 'value' },
];

const points = computed(() => detail.value?.points || []);

const stats = computed(() => {
  const arr = points.value?.map((p: any) => Number(p.value)) || [];
  if (!arr.length) return { min: 0, max: 0, avg: 0 };
  const min = Math.min(...arr);
  const max = Math.max(...arr);
  const avg = Number((arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(4));
  return { min, max, avg };
});

function formatTime(ts: number) {
  try {
    const d = new Date(ts * 1000);
    return `${d.toISOString().slice(0, 19).replace('T', ' ')}`;
  } catch (e) {
    return String(ts);
  }
}

async function fetchDetail() {
  loading.value = true;
  try {
    const id = String(route.params.id);
    detail.value = await getTrendDetailApi(id);
    renderChart();
  } finally {
    loading.value = false;
  }
}

onMounted(fetchDetail);

function renderChart() {
  const data = (detail.value?.points || []).map((p: any) => [p.timestamp * 1000, p.value]);
  const options = {
    tooltip: { trigger: 'axis' },
    grid: { left: 40, right: 20, top: 30, bottom: 40 },
    xAxis: { type: 'time', boundaryGap: false },
    yAxis: { type: 'value', scale: true },
    series: [
      {
        type: 'line',
        name: '预测值',
        smooth: true,
        showSymbol: false,
        data,
      },
    ],
  } as any;
  renderEcharts(options);
}
</script>
