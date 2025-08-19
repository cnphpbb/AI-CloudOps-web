<template>
  <div class="timeline-management">
    <a-page-header
      title="时间线管理"
      sub-title="事件时间线分析与管理中心"
      class="page-header"
    >
      <template #extra>
        <a-space>
          <a-button @click="loadTimelines" :loading="loading">
            <template #icon><reload-outlined /></template>
            刷新
          </a-button>
          <a-button type="primary" @click="showCreateModal">
            <template #icon><plus-outlined /></template>
            创建时间线
          </a-button>
        </a-space>
      </template>
    </a-page-header>

    <!-- 统计概览 -->
    <a-row :gutter="24" class="stats-overview">
      <a-col :span="6">
        <a-card class="stats-card">
          <a-statistic
            title="总时间线数"
            :value="total"
            class="stat-item"
          >
            <template #prefix>
              <clock-circle-outlined style="color: #1890ff" />
            </template>
          </a-statistic>
        </a-card>
      </a-col>
      <a-col :span="6">
        <a-card class="stats-card">
          <a-statistic
            title="运行中"
            :value="getStatusCount('running')"
            class="stat-item"
          >
            <template #prefix>
              <sync-outlined style="color: #52c41a" />
            </template>
          </a-statistic>
        </a-card>
      </a-col>
      <a-col :span="6">
        <a-card class="stats-card">
          <a-statistic
            title="已完成"
            :value="getStatusCount('completed')"
            class="stat-item"
          >
            <template #prefix>
              <check-circle-outlined style="color: #722ed1" />
            </template>
          </a-statistic>
        </a-card>
      </a-col>
      <a-col :span="6">
        <a-card class="stats-card">
          <a-statistic
            title="失败任务"
            :value="getStatusCount('failed')"
            class="stat-item"
          >
            <template #prefix>
              <exclamation-circle-outlined style="color: #ff4d4f" />
            </template>
          </a-statistic>
        </a-card>
      </a-col>
    </a-row>

    <!-- 筛选器 -->
    <a-card title="筛选条件" class="filters-card">
      <template #extra>
        <filter-outlined />
      </template>
      
      <a-row :gutter="16">
        <a-col :span="6">
          <a-form-item label="状态">
            <a-select 
              v-model:value="filters.status" 
              placeholder="选择状态"
              allow-clear
              @change="loadTimelines"
              style="width: 100%"
            >
              <a-select-option value="">全部状态</a-select-option>
              <a-select-option value="pending">等待中</a-select-option>
              <a-select-option value="running">运行中</a-select-option>
              <a-select-option value="completed">已完成</a-select-option>
              <a-select-option value="failed">失败</a-select-option>
            </a-select>
          </a-form-item>
        </a-col>
        <a-col :span="6">
          <a-form-item label="命名空间">
            <a-input
              v-model:value="filters.namespace"
              placeholder="输入命名空间"
              allow-clear
              @change="loadTimelines"
            >
              <template #prefix><database-outlined /></template>
            </a-input>
          </a-form-item>
        </a-col>
        <a-col :span="6">
          <a-form-item label="时间范围">
            <a-range-picker
              v-model:value="dateRange"
              format="YYYY-MM-DD"
              placeholder="[开始时间, 结束时间]"
              @change="loadTimelines"
              style="width: 100%"
            />
          </a-form-item>
        </a-col>
        <a-col :span="6">
          <a-form-item label="搜索">
            <a-input-search
              v-model:value="searchQuery"
              placeholder="搜索任务ID或描述"
              @search="loadTimelines"
              allow-clear
            />
          </a-form-item>
        </a-col>
      </a-row>
    </a-card>

    <!-- 时间线列表 -->
    <a-card title="时间线列表" class="timelines-card">
      <template #extra>
        <a-space>
          <a-radio-group v-model:value="viewMode" button-style="solid">
            <a-radio-button value="grid">
              <template #icon><appstore-outlined /></template>
              卡片视图
            </a-radio-button>
            <a-radio-button value="table">
              <template #icon><table-outlined /></template>
              表格视图
            </a-radio-button>
          </a-radio-group>
        </a-space>
      </template>
      
      <!-- 卡片视图 -->
      <div v-if="viewMode === 'grid'" class="timelines-grid">
        <a-row :gutter="[16, 16]">
          <a-col 
            v-for="timeline in timelines" 
            :key="timeline.job_id" 
            :span="8"
          >
            <a-card 
              class="timeline-card" 
              :class="getTimelineCardClass(timeline.status)"
              hoverable
            >
              <template #title>
                <a-space>
                  <component :is="getStatusIcon(timeline.status)" :style="{ color: getStatusColor(timeline.status) }" />
                  时间线分析
                </a-space>
              </template>
              <template #extra>
                <a-tag :color="getStatusColor(timeline.status)">
                  {{ formatStatus(timeline.status) }}
                </a-tag>
              </template>
              
              <div class="timeline-content">
                <!-- 任务ID -->
                <div class="timeline-id-section">
                  <a-typography-text type="secondary" class="id-label">
                    任务ID：
                  </a-typography-text>
                  <a-typography-text code class="id-value">
                    {{ timeline.job_id }}
                  </a-typography-text>
                </div>
                
                <!-- 进度显示 -->
                <div class="progress-section">
                  <a-typography-text type="secondary" class="progress-label">
                    执行进度：{{ timeline.progress || 0 }}%
                  </a-typography-text>
                  <a-progress 
                    :percent="timeline.progress || 0" 
                    :stroke-color="getProgressColor(timeline.status)"
                    size="small"
                    class="timeline-progress"
                  />
                </div>
                
                <!-- 基本信息 -->
                <a-descriptions :column="1" size="small" class="timeline-info">
                  <a-descriptions-item label="开始时间">
                    <calendar-outlined class="info-icon" />
                    {{ formatDate(timeline.start_time) }}
                  </a-descriptions-item>
                  <a-descriptions-item v-if="timeline.end_time" label="结束时间">
                    <calendar-outlined class="info-icon" />
                    {{ formatDate(timeline.end_time) }}
                  </a-descriptions-item>
                  <a-descriptions-item label="持续时间">
                    <clock-circle-outlined class="info-icon" />
                    {{ getDuration(timeline.start_time, timeline.end_time) }}
                  </a-descriptions-item>
                </a-descriptions>
                
                <!-- 结果预览 -->
                <div v-if="timeline.results" class="result-preview">
                  <a-alert
                    :message="`根因分析结果（置信度：${timeline.results.confidence}%）`"
                    :description="timeline.results.root_cause"
                    type="info"
                    size="small"
                    class="result-alert"
                  />
                </div>
                
                <!-- 操作按钮 -->
                <div class="timeline-actions">
                  <a-space>
                    <a-button type="primary" size="small" @click="viewDetail(timeline.job_id)">
                      <template #icon><eye-outlined /></template>
                      查看详情
                    </a-button>
                    <a-popconfirm
                      title="确定要删除这个时间线吗？"
                      @confirm="deleteTimeline(timeline.job_id)"
                      ok-text="确定"
                      cancel-text="取消"
                    >
                      <a-button danger size="small">
                        <template #icon><delete-outlined /></template>
                        删除
                      </a-button>
                    </a-popconfirm>
                  </a-space>
                </div>
              </div>
            </a-card>
          </a-col>
        </a-row>
      </div>
      
      <!-- 表格视图 -->
      <div v-else>
        <a-table
          :columns="columns"
          :data-source="timelines"
          :loading="loading"
          :pagination="{
            current: currentPage,
            pageSize: pageSize,
            total: total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total: number, range: [number, number]) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条数据`
          }"
          row-key="job_id"
          @change="handleTableChange"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'job_id'">
              <a-typography-text strong>{{ record.job_id }}</a-typography-text>
            </template>
            
            <template v-else-if="column.key === 'status'">
              <a-tag :color="getStatusColor(record.status)">
                <component :is="getStatusIcon(record.status)" />
                {{ formatStatus(record.status) }}
              </a-tag>
            </template>
            
            <template v-else-if="column.key === 'progress'">
              <a-progress 
                :percent="record.progress || 0" 
                :stroke-color="getProgressColor(record.status)"
                size="small"
              />
            </template>
            
            <template v-else-if="column.key === 'duration'">
              {{ getDuration(record.start_time, record.end_time) }}
            </template>
            
            <template v-else-if="column.key === 'confidence'">
              <a-tag v-if="record.results" color="processing">
                {{ record.results.confidence }}%
              </a-tag>
              <span v-else>-</span>
            </template>
            
            <template v-else-if="column.key === 'actions'">
              <a-space>
                <a-button type="primary" size="small" @click="viewDetail(record.job_id)">
                  <template #icon><eye-outlined /></template>
                  详情
                </a-button>
                <a-popconfirm
                  title="确定要删除这个时间线吗？"
                  @confirm="deleteTimeline(record.job_id)"
                  ok-text="确定"
                  cancel-text="取消"
                >
                  <a-button danger size="small">
                    <template #icon><delete-outlined /></template>
                    删除
                  </a-button>
                </a-popconfirm>
              </a-space>
            </template>
          </template>
        </a-table>
      </div>
      
      <!-- 空状态 -->
      <div v-if="!loading && timelines.length === 0" class="empty-state">
        <a-empty description="暂无时间线分析">
          <template #image>
            <clock-circle-outlined style="font-size: 64px; color: #d9d9d9" />
          </template>
          <template #description>
            <span>暂无时间线分析，点击上方按钮创建新的时间线分析</span>
          </template>
          <a-button type="primary" @click="showCreateModal">
            创建时间线分析
          </a-button>
        </a-empty>
      </div>
    </a-card>

    <!-- 创建时间线模态框 -->
    <a-modal
      v-model:open="createModalVisible"
      title="创建时间线分析"
      @ok="createTimeline"
      @cancel="resetForm"
      :confirm-loading="creating"
      width="600px"
    >
      <a-form
        ref="createFormRef"
        :model="newTimeline"
        layout="vertical"
        :rules="formRules"
      >
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="开始时间" name="start_time">
              <a-date-picker
                v-model:value="newTimeline.start_time"
                show-time
                format="YYYY-MM-DD HH:mm:ss"
                placeholder="选择开始时间"
                style="width: 100%"
              />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="结束时间" name="end_time">
              <a-date-picker
                v-model:value="newTimeline.end_time"
                show-time
                format="YYYY-MM-DD HH:mm:ss"
                placeholder="选择结束时间"
                style="width: 100%"
              />
            </a-form-item>
          </a-col>
        </a-row>
        
        <a-form-item label="事件数据（JSON格式）" name="events">
          <a-textarea
            v-model:value="eventsJson"
            placeholder='[{"timestamp": "2024-01-01T00:00:00", "type": "alert", "description": "High CPU"}]'
            :rows="6"
          />
          <a-typography-text type="secondary" class="form-hint">
            <info-circle-outlined /> 请输入JSON格式的事件数据，包含时间戳、类型和描述
          </a-typography-text>
        </a-form-item>
        
        <a-form-item label="命名空间">
          <a-input
            v-model:value="newTimeline.namespace"
            placeholder="可选，指定分析的命名空间"
          >
            <template #prefix><database-outlined /></template>
          </a-input>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import dayjs, { type Dayjs } from 'dayjs';
import {
  ReloadOutlined,
  PlusOutlined,
  ClockCircleOutlined,
  SyncOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  FilterOutlined,
  DatabaseOutlined,
  AppstoreOutlined,
  TableOutlined,
  CalendarOutlined,
  EyeOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
  LoadingOutlined
} from '@ant-design/icons-vue';
import { 
  createTimelineApi, 
  listTimelinesApi, 
  deleteTimelineRecordApi 
} from '#/api/core/rca';
import type { TimelineCreateReq, RCAJobDetail, PaginatedListReq } from '#/api/core/rca';
import type { TableColumnsType } from 'ant-design-vue';

const router = useRouter();
const timelines = ref<RCAJobDetail[]>([]);
const currentPage = ref(1);
const pageSize = ref(12);
const total = ref(0);
const loading = ref(false);
const creating = ref(false);
const createModalVisible = ref(false);
const viewMode = ref('grid');
const dateRange = ref<[Dayjs, Dayjs] | undefined>();
const searchQuery = ref('');
const eventsJson = ref('');
const createFormRef = ref();

const filters = ref<PaginatedListReq>({
  status: '',
  namespace: ''
});

const newTimeline = ref<{
  start_time: Dayjs | null;
  end_time: Dayjs | null;
  namespace: string;
  events: any[];
}>({
  start_time: null,
  end_time: null,
  namespace: '',
  events: []
});

const formRules = {
  start_time: [{ required: true, message: '请选择开始时间' }],
  end_time: [{ required: true, message: '请选择结束时间' }]
};

const columns: TableColumnsType = [
  {
    title: '任务ID',
    dataIndex: 'job_id',
    key: 'job_id',
    width: 200,
    fixed: 'left'
  },
  {
    title: '状态',
    key: 'status',
    width: 100
  },
  {
    title: '进度',
    key: 'progress',
    width: 120
  },
  {
    title: '开始时间',
    dataIndex: 'start_time',
    key: 'start_time',
    width: 180,
    customRender: ({ text }) => formatDate(text)
  },
  {
    title: '持续时间',
    key: 'duration',
    width: 100
  },
  {
    title: '置信度',
    key: 'confidence',
    width: 100
  },
  {
    title: '操作',
    key: 'actions',
    width: 200,
    fixed: 'right'
  }
];

const getStatusCount = (status: string) => {
  return timelines.value.filter(timeline => timeline.status === status).length;
};

const loadTimelines = async () => {
  loading.value = true;
  try {
    const params: any = {
      ...filters.value,
      page: currentPage.value,
      size: pageSize.value
    };
    
    if (searchQuery.value) {
      params.search = searchQuery.value;
    }
    
    const response = await listTimelinesApi(params);
    timelines.value = response.items || [];
    total.value = response.total;
  } catch (error) {
    console.error('Failed to load timelines:', error);
    message.error('加载时间线列表失败');
  } finally {
    loading.value = false;
  }
};

const showCreateModal = () => {
  const now = dayjs();
  const yesterday = now.subtract(1, 'day');
  
  newTimeline.value = {
    start_time: yesterday,
    end_time: now,
    namespace: '',
    events: []
  };
  eventsJson.value = '';
  createModalVisible.value = true;
};

const createTimeline = async () => {
  try {
    await createFormRef.value.validate();
    
    creating.value = true;
    
    let events = [];
    if (eventsJson.value) {
      try {
        events = JSON.parse(eventsJson.value);
      } catch (e) {
        message.error('事件数据JSON格式无效');
        return;
      }
    }
    
    const requestData: TimelineCreateReq = {
      start_time: newTimeline.value.start_time?.format('YYYY-MM-DD HH:mm:ss') || '',
      end_time: newTimeline.value.end_time?.format('YYYY-MM-DD HH:mm:ss') || '',
      events
    };
    
    await createTimelineApi(requestData);
    
    message.success('时间线分析创建成功');
    createModalVisible.value = false;
    resetForm();
    await loadTimelines();
  } catch (error) {
    console.error('Failed to create timeline:', error);
    message.error('创建时间线分析失败');
  } finally {
    creating.value = false;
  }
};

const viewDetail = (recordId: string) => {
  router.push(`/rca/timeline/${recordId}`);
};

const deleteTimeline = async (recordId: string) => {
  try {
    await deleteTimelineRecordApi(Number(recordId));
    message.success('时间线删除成功');
    await loadTimelines();
  } catch (error) {
    console.error('Failed to delete timeline:', error);
    message.error('删除时间线失败');
  }
};

const resetForm = () => {
  createFormRef.value?.resetFields();
  eventsJson.value = '';
};

const formatDate = (date: string) => {
  if (!date) return '-';
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss');
};

const getDuration = (startTime: string, endTime?: string) => {
  if (!startTime) return '-';
  
  const start = dayjs(startTime);
  const end = endTime ? dayjs(endTime) : dayjs();
  const duration = end.diff(start, 'minute');
  
  if (duration < 60) {
    return `${duration} 分钟`;
  } else {
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    return `${hours} 小时 ${minutes} 分钟`;
  }
};

const getStatusColor = (status: string) => {
  const colorMap = {
    pending: 'warning',
    running: 'processing',
    completed: 'success',
    failed: 'error'
  };
  return colorMap[status as keyof typeof colorMap] || 'default';
};

const getStatusIcon = (status: string) => {
  const iconMap = {
    pending: ClockCircleOutlined,
    running: LoadingOutlined,
    completed: CheckCircleOutlined,
    failed: ExclamationCircleOutlined
  };
  return iconMap[status as keyof typeof iconMap] || ClockCircleOutlined;
};

const getProgressColor = (status: string) => {
  const colorMap = {
    pending: '#faad14',
    running: '#1890ff',
    completed: '#52c41a',
    failed: '#ff4d4f'
  };
  return colorMap[status as keyof typeof colorMap] || '#d9d9d9';
};

const getTimelineCardClass = (status: string) => {
  return {
    'timeline-pending': status === 'pending',
    'timeline-running': status === 'running',
    'timeline-completed': status === 'completed',
    'timeline-failed': status === 'failed'
  };
};

const formatStatus = (status: string) => {
  const statusMap = {
    pending: '等待中',
    running: '运行中',
    completed: '已完成',
    failed: '失败'
  };
  return statusMap[status as keyof typeof statusMap] || status;
};

const handleTableChange = (pagination: any) => {
  currentPage.value = pagination.current;
  pageSize.value = pagination.pageSize;
  loadTimelines();
};

watch(
  () => [filters.value.status, filters.value.namespace],
  () => {
    currentPage.value = 1;
    loadTimelines();
  }
);

onMounted(() => {
  loadTimelines();
});
</script>

<style scoped>
.timeline-management {
  padding: 24px;
  background: #f5f7fa;
  min-height: 100vh;
}

.page-header {
  background: white;
  margin-bottom: 24px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.stats-overview {
  margin-bottom: 24px;
}

.stats-card {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: transform 0.3s;
}

.stats-card:hover {
  transform: translateY(-2px);
}

.stat-item {
  text-align: center;
}

.filters-card,
.timelines-card {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border-radius: 8px;
  margin-bottom: 24px;
}

.timelines-grid {
  margin-top: 16px;
}

.timeline-card {
  border-radius: 8px;
  transition: all 0.3s;
  position: relative;
  overflow: hidden;
}

.timeline-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.timeline-pending {
  border-left: 4px solid #faad14;
}

.timeline-running {
  border-left: 4px solid #1890ff;
}

.timeline-completed {
  border-left: 4px solid #52c41a;
}

.timeline-failed {
  border-left: 4px solid #ff4d4f;
}

.timeline-content {
  padding-top: 16px;
}

.timeline-id-section {
  margin-bottom: 16px;
  padding: 8px 12px;
  background: #f5f5f5;
  border-radius: 4px;
}

.id-label {
  font-size: 12px;
  margin-right: 8px;
}

.id-value {
  font-size: 13px;
}

.progress-section {
  margin-bottom: 16px;
}

.progress-label {
  margin-bottom: 8px;
  font-size: 13px;
}

.timeline-progress {
  margin-bottom: 8px;
}

.timeline-info {
  margin-bottom: 16px;
}

.info-icon {
  margin-right: 6px;
  color: #8c8c8c;
}

.result-preview {
  margin-bottom: 16px;
}

.result-alert {
  margin: 0;
}

.timeline-actions {
  display: flex;
  justify-content: center;
}

.empty-state {
  padding: 40px;
  text-align: center;
}

.form-hint {
  display: block;
  margin-top: 4px;
  font-size: 12px;
}

:deep(.ant-card-head-title) {
  font-weight: 600;
  color: #262626;
}

:deep(.ant-statistic-title) {
  font-size: 14px;
  margin-bottom: 8px;
  color: #8c8c8c;
}

:deep(.ant-statistic-content) {
  font-size: 24px;
  font-weight: 600;
}

:deep(.ant-descriptions-item-label) {
  font-weight: 500;
  color: #595959;
}

:deep(.ant-page-header) {
  padding: 16px 24px;
}

:deep(.ant-form-item-label > label) {
  font-weight: 500;
}

:deep(.ant-table-thead > tr > th) {
  background: #fafafa;
  font-weight: 600;
  color: #262626;
}

:deep(.ant-table-tbody > tr:hover > td) {
  background: #f5f7fa;
}

@media (max-width: 768px) {
  .timeline-management {
    padding: 16px;
  }
  
  .stats-card,
  .timeline-card {
    margin-bottom: 16px;
  }
  
  .filters-card .ant-col {
    margin-bottom: 16px;
  }
  
  .timelines-grid .ant-col {
    span: 12 !important;
  }
}

@media (max-width: 576px) {
  .timelines-grid .ant-col {
    span: 24 !important;
  }
}
</style>
