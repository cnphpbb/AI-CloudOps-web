<template>
  <div class="rca-records">
    <a-card :bordered="false" class="header-card">
      <template #title>
        <div class="page-header">
          <div class="header-left">
            <database-outlined class="page-icon" />
            <h1>RCA 记录</h1>
          </div>
          <a-button type="primary" @click="refreshRecords" :loading="loading">
            <template #icon><reload-outlined /></template>
            刷新
          </a-button>
        </div>
      </template>
      
      <div class="filters-section">
        <a-row :gutter="16">
          <a-col :span="8">
            <a-input-search
              v-model:value="filters.search"
              placeholder="搜索记录..."
              allow-clear
              @search="debounceSearch"
              @change="debounceSearch"
            >
              <template #prefix><search-outlined /></template>
            </a-input-search>
          </a-col>
          <a-col :span="4">
            <a-select
              v-model:value="filters.status"
              placeholder="状态"
              allow-clear
              @change="loadRecords"
              style="width: 100%"
            >
              <a-select-option value="">全部状态</a-select-option>
              <a-select-option value="pending">等待中</a-select-option>
              <a-select-option value="running">运行中</a-select-option>
              <a-select-option value="completed">已完成</a-select-option>
              <a-select-option value="failed">失败</a-select-option>
            </a-select>
          </a-col>
          <a-col :span="4">
            <a-select
              v-model:value="filters.record_type"
              placeholder="分析类型"
              allow-clear
              @change="loadRecords"
              style="width: 100%"
            >
              <a-select-option value="">全部类型</a-select-option>
              <a-select-option value="anomaly_detection">异常检测</a-select-option>
              <a-select-option value="correlation_analysis">相关性分析</a-select-option>
              <a-select-option value="topology_analysis">拓扑分析</a-select-option>
              <a-select-option value="timeline_analysis">时间线分析</a-select-option>
            </a-select>
          </a-col>
          <a-col :span="4">
            <a-input
              v-model:value="filters.namespace"
              placeholder="命名空间"
              allow-clear
              @change="loadRecords"
            >
              <template #prefix><cluster-outlined /></template>
            </a-input>
          </a-col>
          <a-col :span="4">
            <a-input
              v-model:value="filters.job_id"
              placeholder="任务ID"
              allow-clear
              @change="loadRecords"
            >
              <template #prefix><number-outlined /></template>
            </a-input>
          </a-col>
        </a-row>
      </div>
    </a-card>

    <a-card :bordered="false" class="table-card">
      <a-table
        :columns="columns"
        :data-source="records"
        :loading="loading"
        :pagination="{
          current: currentPage,
          pageSize: pageSize,
          total: total,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total: number, range: [number, number]) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条数据`,
          onChange: handlePageChange,
          onShowSizeChange: handlePageSizeChange
        }"
        :scroll="{ x: 1200 }"
        row-key="id"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'record_type'">
            <a-tag :color="getTypeColor(record.record_type)" class="type-tag">
              <component :is="getTypeIcon(record.record_type)" class="tag-icon" />
              {{ formatRecordType(record.record_type) }}
            </a-tag>
          </template>
          
          <template v-else-if="column.key === 'status'">
            <a-tag :color="getStatusColor(record.status)" class="status-tag">
              <component :is="getStatusIcon(record.status)" class="tag-icon" />
              {{ formatStatus(record.status) }}
            </a-tag>
          </template>
          
          <template v-else-if="column.key === 'time_range'">
            <div class="time-range">
              <div>{{ formatDate(record.start_time) }}</div>
              <div class="time-separator">至</div>
              <div>{{ formatDate(record.end_time) }}</div>
            </div>
          </template>
          
          <template v-else-if="column.key === 'summary'">
            <a-tooltip :title="record.summary" placement="topLeft">
              <div class="summary-text">{{ record.summary || '-' }}</div>
            </a-tooltip>
          </template>
          
          <template v-else-if="column.key === 'created_at'">
            <div class="created-time">
              <calendar-outlined class="time-icon" />
              {{ formatDate(record.created_at) }}
            </div>
          </template>
          
          <template v-else-if="column.key === 'actions'">
            <a-space>
              <a-button type="primary" size="small" @click="viewDetail(record.id)">
                <template #icon><eye-outlined /></template>
                查看
              </a-button>
              <a-popconfirm
                title="确定要删除这条记录吗？"
                ok-text="确定"
                cancel-text="取消"
                @confirm="deleteRecord(record.id)"
              >
                <a-button type="primary" danger size="small">
                  <template #icon><delete-outlined /></template>
                  删除
                </a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import {
  DatabaseOutlined,
  ReloadOutlined,
  SearchOutlined,
  ClusterOutlined,
  NumberOutlined,
  EyeOutlined,
  DeleteOutlined,
  CalendarOutlined,
  ExperimentOutlined,
  PartitionOutlined,
  NodeIndexOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  LoadingOutlined,
  CloseCircleOutlined
} from '@ant-design/icons-vue';
import { listRcaRecordsApi, deleteRcaRecordApi } from '#/api/core/rca';
import type { RCARecordEntity, ListRcaRecordsReq } from '#/api/core/rca';
import type { TableColumnsType } from 'ant-design-vue';

const router = useRouter();
const records = ref<RCARecordEntity[]>([]);
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);
const loading = ref(false);

const filters = ref<ListRcaRecordsReq>({
  search: '',
  status: '',
  record_type: '',
  namespace: '',
  job_id: ''
});


let searchTimeout: any = null;

const debounceSearch = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    loadRecords();
  }, 500);
};

const loadRecords = async () => {
  loading.value = true;
  try {
    const response = await listRcaRecordsApi({
      ...filters.value,
      page: currentPage.value,
      size: pageSize.value
    });
    records.value = response.items || [];
    total.value = response.total;
  } catch (error) {
    console.error('Failed to load records:', error);
    message.error('加载记录失败，请重试');
  } finally {
    loading.value = false;
  }
};

const viewDetail = (id: number) => {
  router.push(`/rca/records/${id}`);
};

const deleteRecord = async (id: number) => {
  try {
    await deleteRcaRecordApi(id);
    message.success('删除成功');
    await loadRecords();
  } catch (error) {
    console.error('Failed to delete record:', error);
    message.error('删除失败，请重试');
  }
};

const refreshRecords = () => {
  loadRecords();
};

const handlePageChange = (page: number, size: number) => {
  currentPage.value = page;
  pageSize.value = size;
  loadRecords();
};

const handlePageSizeChange = (_current: number, size: number) => {
  currentPage.value = 1;
  pageSize.value = size;
  loadRecords();
};

const formatDate = (date: string | undefined) => {
  if (!date) return '-';
  return new Date(date).toLocaleString();
};

const formatRecordType = (type: string | undefined) => {
  const typeMap = {
    'anomaly_detection': '异常检测',
    'correlation_analysis': '相关性分析',
    'topology_analysis': '拓扑分析',
    'timeline_analysis': '时间线分析'
  };
  return typeMap[type as keyof typeof typeMap] || type || '-';
};

const formatStatus = (status: string | undefined) => {
  const statusMap = {
    'pending': '等待中',
    'running': '运行中',
    'completed': '已完成',
    'failed': '失败'
  };
  return statusMap[status as keyof typeof statusMap] || status || '-';
};

const getTypeColor = (type: string | undefined) => {
  const colorMap = {
    'anomaly_detection': 'blue',
    'correlation_analysis': 'purple',
    'topology_analysis': 'green',
    'timeline_analysis': 'orange'
  };
  return colorMap[type as keyof typeof colorMap] || 'default';
};

const getStatusColor = (status: string | undefined) => {
  const colorMap = {
    'pending': 'warning',
    'running': 'processing',
    'completed': 'success',
    'failed': 'error'
  };
  return colorMap[status as keyof typeof colorMap] || 'default';
};

const getTypeIcon = (type: string | undefined) => {
  const iconMap = {
    'anomaly_detection': ExperimentOutlined,
    'correlation_analysis': PartitionOutlined,
    'topology_analysis': NodeIndexOutlined,
    'timeline_analysis': ClockCircleOutlined
  };
  return iconMap[type as keyof typeof iconMap] || ExperimentOutlined;
};

const getStatusIcon = (status: string | undefined) => {
  const iconMap = {
    'pending': ClockCircleOutlined,
    'running': LoadingOutlined,
    'completed': CheckCircleOutlined,
    'failed': CloseCircleOutlined
  };
  return iconMap[status as keyof typeof iconMap] || ExclamationCircleOutlined;
};

const columns: TableColumnsType = [
  {
    title: 'ID',
    dataIndex: 'id',
    key: 'id',
    width: 80,
    fixed: 'left'
  },
  {
    title: '分析类型',
    dataIndex: 'record_type',
    key: 'record_type',
    width: 140
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 120
  },
  {
    title: '命名空间',
    dataIndex: 'namespace',
    key: 'namespace',
    width: 120,
    customRender: ({ text }) => text || '-'
  },
  {
    title: '时间范围',
    key: 'time_range',
    width: 200
  },
  {
    title: '摘要',
    dataIndex: 'summary',
    key: 'summary',
    width: 200,
    ellipsis: true
  },
  {
    title: '创建时间',
    dataIndex: 'created_at',
    key: 'created_at',
    width: 180
  },
  {
    title: '操作',
    key: 'actions',
    width: 160,
    fixed: 'right'
  }
];

onMounted(() => {
  loadRecords();
});
</script>

<style scoped>
.rca-records {
  padding: 24px;
  background: #f5f7fa;
  min-height: 100vh;
}

.header-card {
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.page-icon {
  font-size: 24px;
  color: #1677ff;
}

.page-header h1 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #262626;
}

.filters-section {
  margin-top: 16px;
}

.table-card {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.type-tag,
.status-tag {
  border-radius: 6px;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.tag-icon {
  font-size: 12px;
}

.time-range {
  font-size: 12px;
  line-height: 1.4;
}

.time-separator {
  color: #8c8c8c;
  margin: 2px 0;
}

.summary-text {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.created-time {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #595959;
}

.time-icon {
  font-size: 12px;
  color: #8c8c8c;
}

:deep(.ant-table-thead > tr > th) {
  background: #fafafa;
  font-weight: 600;
  color: #262626;
}

:deep(.ant-table-tbody > tr:hover > td) {
  background: #f5f7fa;
}

:deep(.ant-pagination) {
  margin-top: 16px;
  text-align: right;
}

:deep(.ant-card-head-title) {
  padding: 0;
}

:deep(.ant-input-search .ant-input-group .ant-input-affix-wrapper:not(.ant-input-affix-wrapper-disabled):hover) {
  border-color: #1677ff;
}

:deep(.ant-select:not(.ant-select-disabled):hover .ant-select-selector) {
  border-color: #1677ff;
}

@media (max-width: 768px) {
  .rca-records {
    padding: 16px;
  }
  
  .filters-section .ant-row {
    flex-direction: column;
    gap: 12px;
  }
  
  .filters-section .ant-col {
    width: 100% !important;
  }
}
</style>
