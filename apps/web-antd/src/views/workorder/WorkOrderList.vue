<template>
  <div>
    <div class="search-filters">
      <a-input v-model:value="searchText" placeholder="请输入工单标题或描述" style="width: 200px; margin-right: 16px;" />
      <a-button type="primary" @click="handleSearch">搜索</a-button>
    </div>
    <a-table :columns="columns" :data-source="filteredData">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'status'">
          <a-tag :color="getStatusColor(record.status)">
            {{ record.status }}
          </a-tag>
        </template>
        <template v-else-if="column.key === 'priority'">
          <a-tag :color="getPriorityColor(record.priority)">
            {{ record.priority }}
          </a-tag>
        </template>
        <template v-else-if="column.key === 'action'">
          <a-button type="link" @click="goToDetail(record.id)">查看详情</a-button>
        </template>
      </template>
    </a-table>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const searchText = ref('');
const filteredData = ref<WorkOrderItem[]>([]);

interface WorkOrderItem {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  createTime: string;
  creator: string;
}

const columns = [
  {
    title: '工单编号',
    dataIndex: 'id',
    key: 'id',
  },
  {
    title: '标题',
    dataIndex: 'title',
    key: 'title',
  },
  {
    title: '描述',
    dataIndex: 'description',
    key: 'description',
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
  },
  {
    title: '优先级',
    dataIndex: 'priority',
    key: 'priority',
  },
  {
    title: '创建时间',
    dataIndex: 'createTime',
    key: 'createTime',
  },
  {
    title: '创建人',
    dataIndex: 'creator',
    key: 'creator',
  },
  {
    title: '操作',
    key: 'action',
  },
];

const mockData: WorkOrderItem[] = [
  {
    id: 'WO-2025001',
    title: '服务器CPU使用率过高',
    description: '生产环境主机CPU使用率持续超过90%',
    status: '处理中',
    priority: '高',
    createTime: '2025-12-01 10:00:00',
    creator: '张工'
  },
  {
    id: 'WO-2025002',
    title: '数据库连接异常',
    description: '应用程序无法连接到主数据库',
    status: '待处理',
    priority: '紧急',
    createTime: '2025-12-01 11:30:00',
    creator: '李工'
  },
  {
    id: 'WO-2025003',
    title: '网络延迟问题',
    description: '用户反馈系统访问缓慢',
    status: '已完成',
    priority: '中',
    createTime: '2025-12-01 14:20:00',
    creator: '王工'
  }
];

const getStatusColor = (status: string) => {
  const colorMap: Record<string, string> = {
    '待处理': 'orange',
    '处理中': 'blue',
    '已完成': 'green'
  };
  return colorMap[status] || 'default';
};

const getPriorityColor = (priority: string) => {
  const colorMap: Record<string, string> = {
    '紧急': 'red',
    '高': 'orange',
    '中': 'blue',
    '低': 'green'
  };
  return colorMap[priority] || 'default';
};

const handleSearch = () => {
  if (searchText.value.trim() === '') {
    filteredData.value = mockData;
  } else {
    filteredData.value = mockData.filter(item =>
      item.title.includes(searchText.value) ||
      item.description.includes(searchText.value)
    );
  }
};

const goToDetail = (id: string) => {
  router.push(`/workorder_detail`);
  message.success('正在跳转到工单详情页面');
};

onMounted(() => {
  filteredData.value = mockData;
});
</script>

<style scoped lang="less">
.search-filters {
  padding: 12px;
  display: flex;
  align-items: center;
  border-radius: 4px;
  padding: 12px;
}
</style>
