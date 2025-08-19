<template>
  <div class="cross-correlation-analysis">
    <a-page-header
      title="跨时滞相关分析"
      sub-title="分析不同时间滞后下指标间的相关性和因果关系"
      class="page-header"
      @back="goBack"
    >
      <template #extra>
        <a-space>
          <a-button @click="loadRecentJobs" :loading="loadingJobs">
            <template #icon><reload-outlined /></template>
            刷新任务
          </a-button>
          <a-button type="primary" @click="showQuickStartModal">
            <template #icon><question-circle-outlined /></template>
            使用指南
          </a-button>
        </a-space>
      </template>
    </a-page-header>

    <!-- 分析配置 -->
    <a-card title="跨时滞相关分析配置" class="config-card">
      <template #title>
        <a-space>
          <node-index-outlined />
          跨时滞相关分析配置
        </a-space>
      </template>
      <template #extra>
        <a-tag color="purple">专业分析</a-tag>
      </template>
      
      <a-form
        ref="analysisFormRef"
        :model="formData"
        layout="vertical"
        @finish="runAnalysis"
        :rules="formRules"
      >
        <a-row :gutter="24">
          <a-col :span="12">
            <a-form-item label="开始时间" name="start_time">
              <a-date-picker
                v-model:value="formData.start_time"
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
                v-model:value="formData.end_time"
                show-time
                format="YYYY-MM-DD HH:mm:ss"
                placeholder="选择结束时间"
                style="width: 100%"
              />
            </a-form-item>
          </a-col>
        </a-row>
        
        <a-row :gutter="24">
          <a-col :span="12">
            <a-form-item label="最大滞后步数" name="max_lags">
              <a-input-number
                v-model:value="formData.max_lags"
                :min="1"
                :max="100"
                placeholder="10"
                style="width: 100%"
              />
              <a-typography-text type="secondary" class="form-hint">
                <info-circle-outlined /> 分析中考虑的最大时间滞后步数
              </a-typography-text>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="命名空间">
              <a-input
                v-model:value="formData.namespace"
                placeholder="可选，指定分析的命名空间"
              >
                <template #prefix><database-outlined /></template>
              </a-input>
            </a-form-item>
          </a-col>
        </a-row>
        
        <a-form-item label="选择分析指标" name="metrics">
          <div class="metrics-selection-section">
            <a-typography-text type="secondary" class="selection-hint">
              选择需要进行跨时滞相关分析的指标，至少选择 2 个指标
            </a-typography-text>
            <a-checkbox-group v-model:value="selectedMetrics" class="metrics-checkbox-group">
              <a-row :gutter="[16, 16]">
                <a-col 
                  v-for="metric in availableMetrics" 
                  :key="metric" 
                  :span="6"
                >
                  <a-checkbox :value="metric" class="metric-checkbox">
                    <a-space>
                      <line-chart-outlined class="metric-icon" />
                      {{ metric }}
                    </a-space>
                  </a-checkbox>
                </a-col>
              </a-row>
            </a-checkbox-group>
          </div>
        </a-form-item>
        
        <a-form-item>
          <a-space>
            <a-button type="primary" html-type="submit" :loading="loading" size="large">
              <template #icon>
                <thunderbolt-outlined v-if="!loading" />
                <loading-outlined v-else />
              </template>
              {{ loading ? '分析中...' : '开始分析' }}
            </a-button>
            <a-button @click="resetForm">
              <template #icon><redo-outlined /></template>
              重置表单
            </a-button>
          </a-space>
          <div v-if="selectedMetrics.length < 2" class="warning-hint">
            <a-alert
              message="请至少选择 2 个指标"
              type="warning"
              show-icon
              banner
              class="metric-warning"
            />
          </div>
        </a-form-item>
      </a-form>
    </a-card>

    <!-- 最近任务列表 -->
    <a-card title="最近的跨时滞相关分析任务" class="jobs-card" v-if="recentJobs.length > 0">
      <template #title>
        <a-space>
          <history-outlined />
          最近的跨时滞相关分析任务
        </a-space>
      </template>
      <template #extra>
        <a-tag color="purple">{{ recentJobs.length }} 个任务</a-tag>
      </template>
      
      <a-row :gutter="[16, 16]">
        <a-col 
          v-for="job in recentJobs" 
          :key="job.job_id" 
          :span="8"
        >
          <a-card 
            size="small" 
            class="job-card"
            :class="getJobCardClass(job.status)"
            hoverable
          >
            <template #title>
              <a-space>
                <component :is="getStatusIcon(job.status)" :style="{ color: getStatusColor(job.status) }" />
                <a-typography-text ellipsis style="max-width: 120px">
                  {{ job.job_id }}
                </a-typography-text>
              </a-space>
            </template>
            <template #extra>
              <a-tag :color="getStatusColor(job.status)" size="small">
                {{ formatStatus(job.status) }}
              </a-tag>
            </template>
            
            <div class="job-content">
              <div class="progress-section">
                <a-typography-text type="secondary" class="progress-label">
                  执行进度：{{ job.progress || 0 }}%
                </a-typography-text>
                <a-progress 
                  :percent="job.progress || 0" 
                  :stroke-color="getProgressColor(job.status)"
                  size="small"
                />
              </div>
              
              <a-descriptions :column="1" size="small" class="job-info">
                <a-descriptions-item label="开始时间">
                  <calendar-outlined class="info-icon" />
                  {{ formatDate(job.start_time) }}
                </a-descriptions-item>
                <a-descriptions-item label="持续时间">
                  <clock-circle-outlined class="info-icon" />
                  {{ getDuration(job.start_time, job.end_time) }}
                </a-descriptions-item>
              </a-descriptions>
              
              <div class="job-actions">
                <a-button type="primary" size="small" @click="viewJobDetail(job.job_id)">
                  <template #icon><eye-outlined /></template>
                  查看详情
                </a-button>
              </div>
            </div>
          </a-card>
        </a-col>
      </a-row>
    </a-card>

    <!-- 空状态 -->
    <a-card v-if="!loadingJobs && recentJobs.length === 0" class="empty-state-card">
      <a-empty description="暂无跨时滞相关分析任务">
        <template #image>
          <node-index-outlined style="font-size: 64px; color: #d9d9d9" />
        </template>
        <template #description>
          <span>暂无跨时滞相关分析任务，点击上方开始分析按钮创建新的分析任务</span>
        </template>
      </a-empty>
    </a-card>

    <!-- 使用指南模态框 -->
    <a-modal
      v-model:open="quickStartModalVisible"
      title="跨时滞相关分析使用指南"
      width="600px"
      :footer="null"
    >
      <div class="quick-start-content">
        <a-descriptions title="分析说明" :column="1" bordered>
          <a-descriptions-item label="跨时滞相关分析">
            分析不同时间滞后下指标间的相关性，可发现因果关系和延迟影响
          </a-descriptions-item>
          <a-descriptions-item label="最大滞后步数">
            定义分析中考虑的最大时间滞后，通常设置为预期的最大延迟时间
          </a-descriptions-item>
          <a-descriptions-item label="应用场景">
            系统性能分析、故障传播路径分析、依赖关系发现等
          </a-descriptions-item>
        </a-descriptions>
        
        <a-divider />
        
        <a-steps direction="vertical" size="small">
          <a-step title="配置时间范围" description="设置分析的起始和结束时间" />
          <a-step title="设置滞后参数" description="配置最大滞后步数和命名空间" />
          <a-step title="选择指标" description="选择需要分析的指标，至少选择 2 个" />
          <a-step title="开始分析" description="提交分析任务并查看结果" />
        </a-steps>
      </div>
    </a-modal>

    <!-- 错误提示 -->
    <a-alert
      v-if="error"
      :message="error"
      type="error"
      show-icon
      closable
      class="error-alert"
      @close="error = ''"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import dayjs, { Dayjs } from 'dayjs';
import {
  ReloadOutlined,
  QuestionCircleOutlined,
  NodeIndexOutlined,
  LineChartOutlined,
  DatabaseOutlined,
  ThunderboltOutlined,
  LoadingOutlined,
  RedoOutlined,
  HistoryOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons-vue';
import { 
  createCrossCorrelationApi, 
  listCrossCorrelationJobsApi,
  listAvailableMetricsApi 
} from '#/api/core/rca';
import type { CrossCorrelationReq, RCAJobDetail } from '#/api/core/rca';

const router = useRouter();
const loading = ref(false);
const loadingJobs = ref(false);
const error = ref('');
const quickStartModalVisible = ref(false);
const analysisFormRef = ref();

// 表单数据
const formData = ref<{
  start_time: Dayjs | null;
  end_time: Dayjs | null;
  max_lags: number;
  namespace: string;
}>({
  start_time: null,
  end_time: null,
  max_lags: 10,
  namespace: ''
});

// 其他状态
const availableMetrics = ref<string[]>([]);
const selectedMetrics = ref<string[]>([]);
const recentJobs = ref<RCAJobDetail[]>([]);

// 表单规则
const formRules = {
  start_time: [{ required: true, message: '请选择开始时间' }],
  end_time: [{ required: true, message: '请选择结束时间' }],
  max_lags: [{ required: true, message: '请输入最大滞后步数' }]
};

const loadAvailableMetrics = async () => {
  try {
    const response = await listAvailableMetricsApi();
    if (response.data?.available_metrics) {
      availableMetrics.value = response.data.available_metrics;
    }
  } catch (err) {
    console.error('Failed to load metrics:', err);
    // Fallback metrics
    availableMetrics.value = [
      'cpu', 'memory', 'network', 'disk_io', 
      'response_time', 'error_rate', 'throughput', 'latency'
    ];
  }
};

const loadRecentJobs = async () => {
  loadingJobs.value = true;
  try {
    const response = await listCrossCorrelationJobsApi({
      page: 1,
      size: 6
    });
    recentJobs.value = response.items || [];
  } catch (err) {
    console.error('Failed to load recent jobs:', err);
    message.error('加载跨时滞相关分析任务失败');
  } finally {
    loadingJobs.value = false;
  }
};

const runAnalysis = async () => {
  if (selectedMetrics.value.length < 2) {
    message.error('至少需要选择 2 个指标进行跨时滞相关分析');
    return;
  }
  
  loading.value = true;
  error.value = '';
  
  try {
    const requestData: CrossCorrelationReq = {
      start_time: formData.value.start_time?.format('YYYY-MM-DD HH:mm:ss') || '',
      end_time: formData.value.end_time?.format('YYYY-MM-DD HH:mm:ss') || '',
      max_lags: formData.value.max_lags,
      namespace: formData.value.namespace,
      metrics: selectedMetrics.value
    };

    await createCrossCorrelationApi(requestData);
    message.success('跨时滞相关分析任务已创建');
    
    // 刷新任务列表
    await loadRecentJobs();
    
    // 清空选择的指标
    selectedMetrics.value = [];
  } catch (err) {
    console.error('Analysis error:', err);
    message.error('创建跨时滞相关分析任务失败');
  } finally {
    loading.value = false;
  }
};

const resetForm = () => {
  analysisFormRef.value?.resetFields();
  selectedMetrics.value = [];
  const now = dayjs();
  const weekAgo = now.subtract(7, 'day');
  formData.value.start_time = weekAgo;
  formData.value.end_time = now;
  formData.value.max_lags = 10;
};

const viewJobDetail = (jobId: string) => {
  router.push(`/rca/cross-correlation/${jobId}`);
};

const goBack = () => {
  router.back();
};

const showQuickStartModal = () => {
  quickStartModalVisible.value = true;
};

const formatDate = (date: string) => {
  if (!date) return '-';
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss');
};

const getDuration = (start: string, end?: string) => {
  if (!start) return '-';
  
  const startTime = dayjs(start);
  const endTime = end ? dayjs(end) : dayjs();
  const duration = endTime.diff(startTime, 'minute');
  
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

const getJobCardClass = (status: string) => {
  return {
    'job-pending': status === 'pending',
    'job-running': status === 'running',
    'job-completed': status === 'completed',
    'job-failed': status === 'failed'
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

onMounted(() => {
  loadAvailableMetrics();
  loadRecentJobs();
  
  // 设置默认时间范围（最近7天）
  const now = dayjs();
  const weekAgo = now.subtract(7, 'day');
  
  formData.value.start_time = weekAgo;
  formData.value.end_time = now;
});
</script>

<style scoped>
.cross-correlation-analysis {
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

.config-card,
.jobs-card,
.empty-state-card {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border-radius: 8px;
  margin-bottom: 24px;
}

.metrics-selection-section {
  padding: 16px;
  background: #fafafa;
  border-radius: 6px;
  border: 1px dashed #d9d9d9;
}

.selection-hint {
  display: block;
  margin-bottom: 16px;
  font-size: 13px;
}

.metrics-checkbox-group {
  margin-top: 8px;
}

.metric-checkbox {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background: white;
  border-radius: 4px;
  border: 1px solid #d9d9d9;
  transition: all 0.3s;
  width: 100%;
}

.metric-checkbox:hover {
  border-color: #1677ff;
  box-shadow: 0 2px 4px rgba(22, 119, 255, 0.1);
}

.metric-icon {
  color: #1677ff;
  margin-right: 6px;
}

.form-hint {
  display: block;
  margin-top: 4px;
  font-size: 12px;
}

.warning-hint {
  margin-top: 16px;
}

.metric-warning {
  margin: 0;
}

.job-card {
  border-radius: 8px;
  transition: all 0.3s;
  position: relative;
  overflow: hidden;
}

.job-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.job-pending {
  border-left: 4px solid #faad14;
}

.job-running {
  border-left: 4px solid #1890ff;
}

.job-completed {
  border-left: 4px solid #52c41a;
}

.job-failed {
  border-left: 4px solid #ff4d4f;
}

.job-content {
  padding-top: 16px;
}

.progress-section {
  margin-bottom: 16px;
}

.progress-label {
  margin-bottom: 8px;
  font-size: 13px;
}

.job-info {
  margin-bottom: 16px;
}

.info-icon {
  margin-right: 6px;
  color: #8c8c8c;
}

.job-actions {
  display: flex;
  justify-content: center;
}

.quick-start-content {
  padding: 16px 0;
}

.error-alert {
  margin-top: 24px;
}

:deep(.ant-card-head-title) {
  font-weight: 600;
  color: #262626;
}

:deep(.ant-form-item-label > label) {
  font-weight: 500;
}

:deep(.ant-descriptions-item-label) {
  font-weight: 500;
  color: #595959;
}

:deep(.ant-page-header) {
  padding: 16px 24px;
}

@media (max-width: 768px) {
  .cross-correlation-analysis {
    padding: 16px;
  }
  
  .config-card .ant-col,
  .jobs-card .ant-col {
    margin-bottom: 16px;
  }
  
  .metrics-checkbox-group .ant-col {
    span: 12 !important;
  }
}

@media (max-width: 576px) {
  .metrics-checkbox-group .ant-col {
    span: 24 !important;
  }
  
  .jobs-card .ant-col {
    span: 24 !important;
  }
}
</style>
