<template>
  <div class="correlation-analysis">
    <a-page-header
      title="相关性分析"
      sub-title="指标间的相关性和交叉相关性分析工具"
      class="page-header"
    >
      <template #extra>
        <a-space>
          <a-button @click="loadStandardJobs" :loading="loadingJobs">
            <template #icon><reload-outlined /></template>
            刷新任务
          </a-button>
          <a-button type="primary" @click="showQuickStartModal">
            <template #icon><question-circle-outlined /></template>
            快速入门
          </a-button>
        </a-space>
      </template>
    </a-page-header>

    <!-- 分析类型选择 -->
    <a-card class="analysis-type-card">
      <a-tabs v-model:activeKey="activeTab" type="card" class="analysis-tabs">
        <a-tab-pane key="standard" tab="标准相关性分析">
          <template #tab>
            <a-space>
              <partition-outlined />
              标准相关性分析
            </a-space>
          </template>
        </a-tab-pane>
        <a-tab-pane key="cross" tab="交叉相关性分析">
          <template #tab>
            <a-space>
              <node-index-outlined />
              交叉相关性分析
            </a-space>
          </template>
        </a-tab-pane>
      </a-tabs>
    </a-card>

    <!-- 标准相关性分析 -->
    <div v-if="activeTab === 'standard'" class="analysis-section">
      <a-card title="标准相关性分析配置" class="config-card">
        <template #title>
          <a-space>
            <partition-outlined />
            标准相关性分析配置
          </a-space>
        </template>
        <template #extra>
          <a-tag color="processing">高级分析</a-tag>
        </template>
        
        <a-form
          ref="standardFormRef"
          :model="standardParams"
          layout="vertical"
          @finish="runStandardCorrelation"
          :rules="standardFormRules"
        >
          <a-row :gutter="24">
            <a-col :span="12">
              <a-form-item label="开始时间" name="start_time">
                <a-date-picker
                  v-model:value="standardParams.start_time"
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
                  v-model:value="standardParams.end_time"
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
              <a-form-item label="目标指标" name="target_metric">
                <a-select
                  v-model:value="standardParams.target_metric"
                  placeholder="选择目标指标"
                  allow-clear
                  show-search
                  style="width: 100%"
                >
                  <a-select-option 
                    v-for="metric in availableMetrics" 
                    :key="metric" 
                    :value="metric"
                  >
                    <a-space>
                      <line-chart-outlined />
                      {{ metric }}
                    </a-space>
                  </a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item label="命名空间">
                <a-input
                  v-model:value="standardParams.namespace"
                  placeholder="可选，指定分析的命名空间"
                >
                  <template #prefix><database-outlined /></template>
                </a-input>
              </a-form-item>
            </a-col>
          </a-row>
          
          <a-form-item label="选择相关指标">
            <div class="metrics-selection-section">
              <a-typography-text type="secondary" class="selection-hint">
                选择需要分析相关性的指标，至少选择 2 个指标
              </a-typography-text>
              <a-checkbox-group v-model:value="selectedStandardMetrics" class="metrics-checkbox-group">
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
              <a-button type="primary" html-type="submit" :loading="standardLoading" size="large">
                <template #icon>
                  <thunderbolt-outlined v-if="!standardLoading" />
                  <loading-outlined v-else />
                </template>
                {{ standardLoading ? '分析中...' : '开始分析' }}
              </a-button>
              <a-button @click="resetStandardForm">
                <template #icon><redo-outlined /></template>
                重置
              </a-button>
            </a-space>
          </a-form-item>
        </a-form>
      </a-card>

      <!-- 标准相关性任务列表 -->
      <a-card title="最近的分析任务" class="jobs-card" v-if="standardJobs.length > 0">
        <template #title>
          <a-space>
            <history-outlined />
            最近的分析任务
          </a-space>
        </template>
        <template #extra>
          <a-tag color="blue">{{ standardJobs.length }} 个任务</a-tag>
        </template>
        
        <a-row :gutter="[16, 16]">
          <a-col 
            v-for="job in standardJobs" 
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
                  <a-button type="primary" size="small" @click="viewCorrelationDetail(job.job_id)">
                    <template #icon><eye-outlined /></template>
                    查看详情
                  </a-button>
                </div>
              </div>
            </a-card>
          </a-col>
        </a-row>
      </a-card>
    </div>

    <!-- 交叉相关性分析 -->
    <div v-if="activeTab === 'cross'" class="analysis-section">
      <a-card title="交叉相关性分析配置" class="config-card">
        <template #title>
          <a-space>
            <node-index-outlined />
            交叉相关性分析配置
          </a-space>
        </template>
        <template #extra>
          <a-tag color="purple">专业分析</a-tag>
        </template>
        
        <a-form
          ref="crossFormRef"
          :model="crossParams"
          layout="vertical"
          @finish="runCrossCorrelation"
          :rules="crossFormRules"
        >
          <a-row :gutter="24">
            <a-col :span="12">
              <a-form-item label="开始时间" name="start_time">
                <a-date-picker
                  v-model:value="crossParams.start_time"
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
                  v-model:value="crossParams.end_time"
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
                  v-model:value="crossParams.max_lags"
                  :min="1"
                  :max="100"
                  placeholder="10"
                  style="width: 100%"
                />
                <a-typography-text type="secondary" class="form-hint">
                  <info-circle-outlined /> 分析中考虑的最大时间滞后
                </a-typography-text>
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item label="命名空间">
                <a-input
                  v-model:value="crossParams.namespace"
                  placeholder="可选，指定分析的命名空间"
                >
                  <template #prefix><database-outlined /></template>
                </a-input>
              </a-form-item>
            </a-col>
          </a-row>
          
          <a-form-item label="选择分析指标">
            <div class="metrics-selection-section">
              <a-typography-text type="secondary" class="selection-hint">
                选择需要进行交叉相关性分析的指标，至少选择 2 个指标
              </a-typography-text>
              <a-checkbox-group v-model:value="selectedCrossMetrics" class="metrics-checkbox-group">
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
              <a-button type="primary" html-type="submit" :loading="crossLoading" size="large">
                <template #icon>
                  <thunderbolt-outlined v-if="!crossLoading" />
                  <loading-outlined v-else />
                </template>
                {{ crossLoading ? '分析中...' : '开始分析' }}
              </a-button>
              <a-button @click="resetCrossForm">
                <template #icon><redo-outlined /></template>
                重置
              </a-button>
            </a-space>
          </a-form-item>
        </a-form>
      </a-card>

      <!-- 交叉相关性任务列表 -->
      <a-card title="最近的交叉相关性任务" class="jobs-card" v-if="crossJobs.length > 0">
        <template #title>
          <a-space>
            <history-outlined />
            最近的交叉相关性任务
          </a-space>
        </template>
        <template #extra>
          <a-tag color="purple">{{ crossJobs.length }} 个任务</a-tag>
        </template>
        
        <a-row :gutter="[16, 16]">
          <a-col 
            v-for="job in crossJobs" 
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
                  <a-button type="primary" size="small" @click="viewCrossCorrelationDetail(job.job_id)">
                    <template #icon><eye-outlined /></template>
                    查看详情
                  </a-button>
                </div>
              </div>
            </a-card>
          </a-col>
        </a-row>
      </a-card>
    </div>

    <!-- 快速入门模态框 -->
    <a-modal
      v-model:open="quickStartModalVisible"
      title="相关性分析快速入门"
      width="600px"
      :footer="null"
    >
      <div class="quick-start-content">
        <a-descriptions title="分析类型说明" :column="1" bordered>
          <a-descriptions-item label="标准相关性分析">
            计算多个指标之间的相关系数，帮助发现指标间的关联性
          </a-descriptions-item>
          <a-descriptions-item label="交叉相关性分析">
            分析不同时间滞后下指标间的相关性，可发现因果关系
          </a-descriptions-item>
        </a-descriptions>
        
        <a-divider />
        
        <a-steps direction="vertical" size="small">
          <a-step title="选择分析类型" description="根据需要选择标准相关性或交叉相关性分析" />
          <a-step title="配置参数" description="设置时间范围、目标指标和其他分析参数" />
          <a-step title="选择指标" description="选择需要分析的指标，至少选择 2 个" />
          <a-step title="开始分析" description="点击开始分析，等待结果并查看详情" />
        </a-steps>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import dayjs, { type Dayjs } from 'dayjs';
import {
  ReloadOutlined,
  QuestionCircleOutlined,
  PartitionOutlined,
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
  createCorrelationAnalysisApi, 
  listCorrelationJobsApi,
  createCrossCorrelationApi,
  listCrossCorrelationJobsApi,
  listAvailableMetricsApi 
} from '#/api/core/rca';
import type { 
  CorrelationAnalysisReq, 
  CrossCorrelationReq, 
  RCAJobDetail 
} from '#/api/core/rca';

const router = useRouter();
const activeTab = ref<'standard' | 'cross'>('standard');
const loadingJobs = ref(false);
const quickStartModalVisible = ref(false);
const standardFormRef = ref();
const crossFormRef = ref();

// Standard correlation state
const standardParams = ref<{
  start_time: Dayjs | null;
  end_time: Dayjs | null;
  target_metric: string;
  namespace: string;
}>({
  start_time: null,
  end_time: null,
  target_metric: '',
  namespace: ''
});
const selectedStandardMetrics = ref<string[]>([]);
const standardJobs = ref<RCAJobDetail[]>([]);
const standardLoading = ref(false);

// Cross-correlation state
const crossParams = ref<{
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
const selectedCrossMetrics = ref<string[]>([]);
const crossJobs = ref<RCAJobDetail[]>([]);
const crossLoading = ref(false);

// Shared state
const availableMetrics = ref<string[]>([]);

// Form rules
const standardFormRules = {
  start_time: [{ required: true, message: '请选择开始时间' }],
  end_time: [{ required: true, message: '请选择结束时间' }],
  target_metric: [{ required: true, message: '请选择目标指标' }]
};

const crossFormRules = {
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
  } catch (error) {
    console.error('Failed to load metrics:', error);
    // Fallback metrics
    availableMetrics.value = ['cpu', 'memory', 'network', 'disk_io', 'response_time', 'error_rate'];
  }
};

const loadStandardJobs = async () => {
  loadingJobs.value = true;
  try {
    const response = await listCorrelationJobsApi({ page: 1, size: 6 });
    standardJobs.value = response.items || [];
  } catch (error) {
    console.error('Failed to load standard correlation jobs:', error);
    message.error('加载相关性分析任务失败');
  } finally {
    loadingJobs.value = false;
  }
};

const loadCrossJobs = async () => {
  try {
    const response = await listCrossCorrelationJobsApi({ page: 1, size: 6 });
    crossJobs.value = response.items || [];
  } catch (error) {
    console.error('Failed to load cross-correlation jobs:', error);
    message.error('加载交叉相关性分析任务失败');
  }
};

const runStandardCorrelation = async () => {
  if (selectedStandardMetrics.value.length < 2) {
    message.error('至少需要选择 2 个指标进行相关性分析');
    return;
  }
  
  standardLoading.value = true;
  try {
    const requestData: CorrelationAnalysisReq = {
      start_time: standardParams.value.start_time?.format('YYYY-MM-DD HH:mm:ss') || '',
      end_time: standardParams.value.end_time?.format('YYYY-MM-DD HH:mm:ss') || '',
      target_metric: standardParams.value.target_metric,
      metrics: selectedStandardMetrics.value,
      namespace: standardParams.value.namespace
    };
    
    await createCorrelationAnalysisApi(requestData);
    message.success('相关性分析任务已创建');
    await loadStandardJobs();
    selectedStandardMetrics.value = [];
  } catch (error) {
    console.error('Failed to run standard correlation:', error);
    message.error('创建相关性分析任务失败');
  } finally {
    standardLoading.value = false;
  }
};

const runCrossCorrelation = async () => {
  if (selectedCrossMetrics.value.length < 2) {
    message.error('至少需要选择 2 个指标进行交叉相关性分析');
    return;
  }
  
  crossLoading.value = true;
  try {
    const requestData: CrossCorrelationReq = {
      start_time: crossParams.value.start_time?.format('YYYY-MM-DD HH:mm:ss') || '',
      end_time: crossParams.value.end_time?.format('YYYY-MM-DD HH:mm:ss') || '',
      max_lags: crossParams.value.max_lags,
      metrics: selectedCrossMetrics.value,
      namespace: crossParams.value.namespace
    };
    
    await createCrossCorrelationApi(requestData);
    message.success('交叉相关性分析任务已创建');
    await loadCrossJobs();
    selectedCrossMetrics.value = [];
  } catch (error) {
    console.error('Failed to run cross-correlation:', error);
    message.error('创建交叉相关性分析任务失败');
  } finally {
    crossLoading.value = false;
  }
};

const resetStandardForm = () => {
  standardFormRef.value?.resetFields();
  selectedStandardMetrics.value = [];
  const now = dayjs();
  const yesterday = now.subtract(24, 'hour');
  standardParams.value.start_time = yesterday;
  standardParams.value.end_time = now;
};

const resetCrossForm = () => {
  crossFormRef.value?.resetFields();
  selectedCrossMetrics.value = [];
  const now = dayjs();
  const yesterday = now.subtract(24, 'hour');
  crossParams.value.start_time = yesterday;
  crossParams.value.end_time = now;
  crossParams.value.max_lags = 10;
};

const viewCorrelationDetail = (jobId: string) => {
  router.push(`/rca/correlation/${jobId}`);
};

const viewCrossCorrelationDetail = (jobId: string) => {
  router.push(`/rca/cross-correlation/${jobId}`);
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

watch(activeTab, (newTab) => {
  if (newTab === 'cross') {
    loadCrossJobs();
  } else {
    loadStandardJobs();
  }
});

onMounted(() => {
  loadAvailableMetrics();
  loadStandardJobs();
  
  // Set default time range
  const now = dayjs();
  const yesterday = now.subtract(24, 'hour');
  
  standardParams.value.start_time = yesterday;
  standardParams.value.end_time = now;
  crossParams.value.start_time = yesterday;
  crossParams.value.end_time = now;
});
</script>

<style scoped>
.correlation-analysis {
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

.analysis-type-card {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border-radius: 8px;
  margin-bottom: 24px;
}

.analysis-tabs {
  margin: -16px -24px -24px -24px;
}

.analysis-section {
  animation: fadeIn 0.3s;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.config-card,
.jobs-card {
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

:deep(.ant-tabs-tab) {
  padding: 12px 24px;
}

:deep(.ant-tabs-content-holder) {
  padding: 24px;
}

@media (max-width: 768px) {
  .correlation-analysis {
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
