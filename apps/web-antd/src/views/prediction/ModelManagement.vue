<template>
  <div>
    <a-card title="模型管理" :bordered="false" :extra="extra">
      <a-table :columns="columns" :data-source="items" :loading="loading" row-key="id" />
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import { listModelsApi, refreshModelApi } from '#/api';

const router = useRouter();
const loading = ref(false);
const items = ref<any[]>([]);

const columns = [
  { title: 'ID', dataIndex: 'id', key: 'id', width: 160 },
  { title: '名称', dataIndex: 'name', key: 'name' },
  { title: '版本', dataIndex: 'version', key: 'version', width: 140 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 140 },
  {
    title: '操作', key: 'actions', width: 140,
    customRender: ({ record }: any) => {
      return (
        <a-space>
          <a-button type="link" onClick={() => goDetail(record.id)}>详情</a-button>
        </a-space>
      );
    },
  },
];

const extra = computed(() => (
  <a-space>
    <a-button onClick={fetchData}>刷新列表</a-button>
    <a-button type="primary" onClick={onRefreshModel}>刷新模型</a-button>
  </a-space>
));

function goDetail(id: string) {
  router.push({ name: 'ModelDetail', params: { id } });
}

async function onRefreshModel() {
  const res = await refreshModelApi();
  if ((res as any)?.success) message.success('模型刷新成功');
  else message.info((res as any)?.message || '已触发刷新');
}

async function fetchData() {
  loading.value = true;
  try {
    items.value = await listModelsApi();
  } finally {
    loading.value = false;
  }
}

onMounted(fetchData);
</script>
