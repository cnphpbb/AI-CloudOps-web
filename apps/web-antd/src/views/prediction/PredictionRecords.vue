<template>
  <div>
    <a-card title="预测记录" :bordered="false">
      <a-form layout="inline" :model="query" @submit.prevent="handleSearch">
        <a-form-item label="指标">
          <a-input v-model:value="query.metric" placeholder="metric" allow-clear />
        </a-form-item>
        <a-form-item label="模型版本">
          <a-input v-model:value="query.model_version" placeholder="version" allow-clear />
        </a-form-item>
        <a-form-item label="类型">
          <a-select v-model:value="query.prediction_type" placeholder="选择类型" allow-clear style="width: 160px">
            <a-select-option value="trend">趋势</a-select-option>
            <a-select-option value="point">点预测</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item>
          <a-space>
            <a-button type="primary" @click="handleSearch">查询</a-button>
            <a-button @click="handleReset">重置</a-button>
          </a-space>
        </a-form-item>
      </a-form>

      <a-table
        :columns="columns"
        :data-source="items"
        :loading="loading"
        :pagination="false"
        :scroll="{ x: 'max-content', y: 520 }"
        :sticky="{ offsetHeader: 0 }"
        row-key="id"
        style="margin-top: 12px"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'prediction_type'">
            <a-tag color="blue">{{ record.prediction_type }}</a-tag>
          </template>
          <template v-else-if="column.key === 'actions'">
            <a-space>
              <a-button type="link" @click="goDetail(record.id)">详情</a-button>
              <a-popconfirm title="确认删除该记录？" @confirm="onDelete(record.id)">
                <a-button type="link" danger>删除</a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>

      <div style="margin-top: 12px; text-align: right">
        <a-pagination
          :current="query.page"
          :page-size="query.size"
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
import { message } from 'ant-design-vue';
import { listPredictionRecordsApi, deletePredictionRecordApi } from '#/api';

interface QueryState {
  page: number;
  size: number;
  metric?: string;
  model_version?: string;
  prediction_type?: string;
}

const router = useRouter();
const loading = ref(false);
const items = ref<any[]>([]);
const total = ref(0);
const query = reactive<QueryState>({ page: 1, size: 10, metric: undefined, model_version: undefined, prediction_type: undefined });

const columns = [
  { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
  { title: '指标', dataIndex: 'metric', key: 'metric' },
  { title: '模型版本', dataIndex: 'model_version', key: 'model_version' },
  { title: '类型', dataIndex: 'prediction_type', key: 'prediction_type', width: 120 },
  { title: '创建时间', dataIndex: 'created_at', key: 'created_at', width: 200 },
  { title: '操作', key: 'actions', width: 160 },
];

async function fetchData() {
  loading.value = true;
  try {
    const data = await listPredictionRecordsApi({
      page: query.page,
      size: query.size,
      metric: query.metric || undefined,
      model_version: query.model_version || undefined,
      prediction_type: query.prediction_type || undefined,
    });
    items.value = data.items;
    total.value = data.total;
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  query.page = 1;
  fetchData();
}

function handleReset() {
  query.metric = undefined;
  query.model_version = undefined;
  query.prediction_type = undefined;
  query.page = 1;
  query.size = 10;
  fetchData();
}

function onPageChange(page: number) {
  query.page = page;
  fetchData();
}

function onSizeChange(_: number, pageSize: number) {
  query.size = pageSize;
  query.page = 1;
  fetchData();
}

function goDetail(id: number) {
  router.push({ name: 'PredictionRecordDetail', params: { id } });
}

async function onDelete(id: number) {
  await deletePredictionRecordApi(id);
  message.success('已删除');
  fetchData();
}

onMounted(fetchData);
</script>
