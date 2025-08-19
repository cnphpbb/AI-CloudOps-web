<template>
  <div>
    <a-card title="趋势预测" :bordered="false">
      <a-form layout="inline" :model="query" @submit.prevent="handleSearch">
        <a-form-item label="指标">
          <a-input v-model:value="query.metric" placeholder="metric" allow-clear />
        </a-form-item>
        <a-form-item label="预测小时数">
          <a-input-number v-model:value="query.hours_ahead" :min="1" :max="168" style="width: 140px" />
        </a-form-item>
        <a-form-item label="当前QPS">
          <a-input-number v-model:value="query.current_qps" :min="0" style="width: 140px" />
        </a-form-item>
        <a-form-item label="使用Prometheus">
          <a-switch v-model:checked="query.use_prom" />
        </a-form-item>
        <a-form-item label="选择器">
          <a-input v-model:value="query.selector" placeholder="service=demo" allow-clear />
        </a-form-item>
        <a-form-item label="窗口">
          <a-input v-model:value="query.window" placeholder="1m" style="width: 120px" />
        </a-form-item>
        <a-form-item>
          <a-space>
            <a-button type="primary" @click="handleSearch">查询</a-button>
            <a-button @click="handleReset">重置</a-button>
          </a-space>
        </a-form-item>
      </a-form>

      <a-table :columns="columns" :data-source="items" :loading="loading" :pagination="false" row-key="id" style="margin-top: 12px">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'actions'">
            <a-space>
              <a-button type="link" @click="goDetail(record.id)">详情</a-button>
            </a-space>
          </template>
        </template>
      </a-table>

      <div style="margin-top: 12px; text-align: right">
        <a-pagination
          :current="page"
          :page-size="size"
          :total="total"
          show-size-changer
          @change="onPageChange"
          @showSizeChange="onSizeChange"
        />
      </div>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { listTrendsApi } from '#/api';

interface TrendQuery {
  hours_ahead?: number;
  current_qps?: number | null;
  use_prom?: boolean;
  metric?: string | null;
  selector?: string | null;
  window?: string | null;
}

const router = useRouter();
const loading = ref(false);
const items = ref<any[]>([]);
const total = ref(0);
const page = ref(1);
const size = ref(10);
const query = reactive<TrendQuery>({ hours_ahead: 24, current_qps: null, use_prom: false, metric: null, selector: null, window: '1m' });

const columns = [
  { title: 'ID', dataIndex: 'id', key: 'id', width: 160 },
  { title: '指标', dataIndex: 'metric', key: 'metric' },
  { title: '预测小时数', dataIndex: 'hours_ahead', key: 'hours_ahead', width: 120 },
  { title: '创建时间', dataIndex: 'created_at', key: 'created_at', width: 200 },
  { title: '操作', key: 'actions', width: 120 },
];

async function fetchData() {
  loading.value = true;
  try {
    const data = await listTrendsApi({
      hours_ahead: query.hours_ahead,
      current_qps: query.current_qps,
      use_prom: query.use_prom,
      metric: query.metric,
      selector: query.selector,
      window: query.window,
    } as any);
    items.value = data.items;
    total.value = data.total;
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  page.value = 1;
  fetchData();
}

function handleReset() {
  page.value = 1;
  size.value = 10;
  Object.assign(query, { hours_ahead: 24, current_qps: null, use_prom: false, metric: null, selector: null, window: '1m' });
  fetchData();
}

function onPageChange(p: number) {
  page.value = p;
  fetchData();
}

function onSizeChange(_: number, s: number) {
  size.value = s;
  page.value = 1;
  fetchData();
}

function goDetail(id: string) {
  router.push({ name: 'TrendDetail', params: { id } });
}

onMounted(fetchData);
</script>
