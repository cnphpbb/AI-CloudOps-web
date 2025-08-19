<template>
  <div class="analysis-task-detail">
    <a-page-header
      class="page-header"
      :title="`分析任务详情 - ${jobId}`"
      sub-title="根因分析任务的执行详情与结果展示"
      @back="goBack"
    >
      <template #extra>
        <a-space>
          <a-button @click="refreshDetail" :loading="loading">
            <template #icon><reload-outlined /></template>
            刷新状态
          </a-button>
          <a-button type="primary" @click="exportResults" v-if="taskDetail?.data?.results">
            <template #icon><download-outlined /></template>
            导出结果
          </a-button>
        </a-space>
      </template>
    </a-page-header>

    <div v-if="loading && !taskDetail" class="loading-container">
      <a-spin size="large">
        <template #indicator>
          <loading-outlined style="font-size: 24px" spin />
        </template>
        <div class="loading-text">正在加载任务详情...</div>
      </a-spin>
    </div>

    <div v-else-if="taskDetail" class="detail-content">
      <!-- 任务概览 -->
      <a-card class="task-overview-card">
        <template #title>
          <a-space>
            <apartment-outlined />
            任务概览
          </a-space>
        </template>
        <template #extra>
          <a-tag :color="getStatusColor(taskDetail.data.status)" class="status-tag">
            <component :is="getStatusIcon(taskDetail.data.status)" />
            {{ formatStatus(taskDetail.data.status) }}
          </a-tag>
        </template>
        
        <a-row :gutter="24">
          <a-col :span="8">
            <div class="overview-item">
              <div class="overview-label">任务ID</div>
              <div class="overview-value">
                <a-typography-text code>{{ taskDetail.data.job_id }}</a-typography-text>
              </div>
            </div>
          </a-col>
          <a-col :span="8">
            <div class="overview-item">
              <div class="overview-label">执行进度</div>
              <div class="overview-value">
                <a-progress 
                  :percent="taskDetail.data.progress || 0" 
                  :stroke-color="getProgressColor(taskDetail.data.status)"
                  :show-info="true"
                  class="task-progress"
                />
              </div>
            </div>
          </a-col>
          <a-col :span="8">
            <div class="overview-item">
              <div class="overview-label">持续时间</div>
              <div class="overview-value">
                <clock-circle-outlined class="time-icon" />
                {{ getDuration(taskDetail.data.start_time, taskDetail.data.end_time) }}
              </div>
            </div>
          </a-col>
        </a-row>
        
        <a-divider />
        
        <a-descriptions :column="3" size="small">
          <a-descriptions-item label="开始时间">
            <calendar-outlined class="desc-icon" />
            {{ formatDate(taskDetail.data.start_time) }}
          </a-descriptions-item>
          <a-descriptions-item label="结束时间" v-if="taskDetail.data.end_time">
            <calendar-outlined class="desc-icon" />
            {{ formatDate(taskDetail.data.end_time) }}
          </a-descriptions-item>
        </a-descriptions>
      </a-card>

      <!-- 分析结果 -->
      <div v-if="taskDetail.data.results" class="results-section">
        <!-- 根因分析结果 -->
        <a-card title="根因分析结果" class="result-card root-cause-card">
          <template #title>
            <a-space>
              <experiment-outlined />
              根因分析结果
            </a-space>
          </template>
          <template #extra>
            <a-tag color="processing" class="confidence-tag">
              <dashboard-outlined />
              置信度：{{ taskDetail.data.results.confidence }}%
            </a-tag>
          </template>
          
          <a-alert
            :message="`分析结论（置信度：${taskDetail.data.results.confidence}%）`"
            :description="taskDetail.data.results.root_cause"
            type="info"
            show-icon
            class="root-cause-alert"
          />
        </a-card>
        
        <!-- 证据链 -->
        <a-card title="证据链" class="result-card evidence-card">
          <template #title>
            <a-space>
              <file-search-outlined />
              证据链
            </a-space>
          </template>
          
          <a-timeline class="evidence-timeline">
            <a-timeline-item 
              v-for="(evidence, index) in taskDetail.data.results.evidence" 
              :key="index"
              :color="index === 0 ? 'red' : 'blue'"
            >
              <template #dot>
                <check-circle-outlined v-if="index === 0" style="color: #ff4d4f" />
                <info-circle-outlined v-else style="color: #1890ff" />
              </template>
              
              <div class="evidence-content">
                <a-typography-text strong>证据 {{ index + 1 }}</a-typography-text>
                <p class="evidence-text">{{ evidence }}</p>
              </div>
            </a-timeline-item>
          </a-timeline>
        </a-card>
        
        <!-- 受影响组件 -->
        <a-card title="受影响组件" class="result-card components-card">
          <template #title>
            <a-space>
              <api-outlined />
              受影响组件
            </a-space>
          </template>
          
          <a-row :gutter="[16, 16]" class="components-grid">
            <a-col 
              v-for="component in taskDetail.data.results.affected_components" 
              :key="component" 
              :span="6"
            >
              <a-card size="small" class="component-item" hoverable>
                <template #cover>
                  <div class="component-icon-container">
                    <tool-outlined class="component-icon" />
                  </div>
                </template>
                <a-card-meta>
                  <template #title>
                    <a-typography-text ellipsis>{{ component }}</a-typography-text>
                  </template>
                  <template #description>
                    <a-tag color="volcano" size="small">受影响</a-tag>
                  </template>
                </a-card-meta>
              </a-card>
            </a-col>
          </a-row>
        </a-card>
        
        <!-- 修复建议 -->
        <a-card title="修复建议" class="result-card recommendations-card">
          <template #title>
            <a-space>
              <bulb-outlined />
              修复建议
            </a-space>
          </template>
          
          <a-list 
            :data-source="taskDetail.data.results.recommendations.map((rec, index) => ({ 
              recommendation: rec, 
              index, 
              priority: getPriority(index) 
            }))" 
            class="recommendations-list"
          >
            <template #renderItem="{ item }">
              <a-list-item>
                <a-list-item-meta>
                  <template #avatar>
                    <a-avatar 
                      :style="{
                        backgroundColor: getPriorityColor(item.priority),
                        color: 'white'
                      }"
                    >
                      {{ item.index + 1 }}
                    </a-avatar>
                  </template>
                  <template #title>
                    <a-space>
                      <span>建议 {{ item.index + 1 }}</span>
                      <a-tag :color="getPriorityTagColor(item.priority)" size="small">
                        {{ item.priority }}
                      </a-tag>
                    </a-space>
                  </template>
                  <template #description>
                    <a-typography-paragraph 
                      :ellipsis="{ rows: 2, expandable: true }" 
                      class="recommendation-text"
                    >
                      {{ item.recommendation }}
                    </a-typography-paragraph>
                  </template>
                </a-list-item-meta>
              </a-list-item>
            </template>
          </a-list>
        </a-card>
      </div>

      <!-- 运行中状态 -->
      <div v-else-if="taskDetail.data.status === 'running'" class="running-state">
        <a-card class="state-card">
          <div class="state-content">
            <a-spin size="large" class="state-spinner">
              <template #indicator>
                <sync-outlined style="font-size: 32px" spin />
              </template>
            </a-spin>
            <h3 class="state-title">分析任务正在执行中...</h3>
            <p class="state-description">
              系统正在对指定时间范围内的数据进行深度分析，请耐心等待分析完成。
            </p>
            <a-progress 
              :percent="taskDetail.data.progress || 0" 
              :stroke-color="getProgressColor(taskDetail.data.status)"
              class="running-progress"
            />
            <div class="state-actions">
              <a-button type="primary" @click="refreshDetail" :loading="loading">
                <template #icon><reload-outlined /></template>
                刷新状态
              </a-button>
            </div>
          </div>
        </a-card>
      </div>

      <!-- 失败状态 -->
      <div v-else-if="taskDetail.data.status === 'failed'" class="error-state">
        <a-card class="state-card error-card">
          <div class="state-content">
            <exclamation-circle-outlined class="error-icon" />
            <h3 class="state-title">分析任务执行失败</h3>
            <p class="state-description">
              分析任务在执行过程中遇到错误，请检查日志获取更多信息。
            </p>
            <a-alert
              message="执行失败"
              description="请联系系统管理员或查看详细日志信息进行排查。"
              type="error"
              show-icon
              class="error-alert"
            />
            <div class="state-actions">
              <a-space>
                <a-button @click="refreshDetail">
                  <template #icon><reload-outlined /></template>
                  重新检查
                </a-button>
                <a-button type="primary" danger @click="retryTask">
                  <template #icon><redo-outlined /></template>
                  重试任务
                </a-button>
              </a-space>
            </div>
          </div>
        </a-card>
      </div>

      <!-- 等待状态 -->
      <div v-else-if="taskDetail.data.status === 'pending'" class="pending-state">
        <a-card class="state-card">
          <div class="state-content">
            <clock-circle-outlined class="pending-icon" />
            <h3 class="state-title">任务等待执行</h3>
            <p class="state-description">
              分析任务已创建并在队列中等待执行，系统将按顺序处理任务。
            </p>
            <div class="state-actions">
              <a-button type="primary" @click="refreshDetail">
                <template #icon><reload-outlined /></template>
                检查状态
              </a-button>
            </div>
          </div>
        </a-card>
      </div>
    </div>

    <div v-else class="no-data">
      <a-empty description="未找到任务详情">
        <template #image>
          <apartment-outlined style="font-size: 64px; color: #d9d9d9" />
        </template>
        <a-button type="primary" @click="goBack">
          返回任务列表
        </a-button>
      </a-empty>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import dayjs from 'dayjs';
import {
  ReloadOutlined,
  DownloadOutlined,
  LoadingOutlined,
  ApartmentOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  ExperimentOutlined,
  DashboardOutlined,
  FileSearchOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  ApiOutlined,
  ToolOutlined,
  BulbOutlined,
  SyncOutlined,
  ExclamationCircleOutlined,
  RedoOutlined
} from '@ant-design/icons-vue';
import { getRcaAnalysisDetailApi } from '#/api/core/rca';
import type { RCAJobDetailEntity } from '#/api/core/rca';

const route = useRoute();
const router = useRouter();
const jobId = ref(route.params.id as string);
const taskDetail = ref<RCAJobDetailEntity | null>(null);
const loading = ref(false);

const loadTaskDetail = async () => {
  loading.value = true;
  try {
    const response = await getRcaAnalysisDetailApi(jobId.value);
    taskDetail.value = response.data || null;
  } catch (error) {
    console.error('Failed to load task detail:', error);
    message.error('加载任务详情失败，请重试');
  } finally {
    loading.value = false;
  }
};

const refreshDetail = () => {
  loadTaskDetail();
};

const goBack = () => {
  router.back();
};

const retryTask = () => {
  message.info('重试功能开发中...');
};

const exportResults = () => {
  if (!taskDetail.value?.data?.results) return;
  
  const data = {
    job_id: taskDetail.value.data.job_id,
    analysis_results: taskDetail.value.data.results,
    export_time: new Date().toISOString()
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `analysis-result-${jobId.value}-${dayjs().format('YYYY-MM-DD-HH-mm')}.json`;
  a.click();
  URL.revokeObjectURL(url);
  
  message.success('分析结果已导出');
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

const formatStatus = (status: string) => {
  const statusMap = {
    pending: '等待中',
    running: '运行中',
    completed: '已完成',
    failed: '失败'
  };
  return statusMap[status as keyof typeof statusMap] || status;
};

const getPriority = (index: number) => {
  if (index === 0) return '高优先级';
  if (index === 1) return '中优先级';
  return '低优先级';
};

const getPriorityColor = (priority: string) => {
  const colorMap: Record<'高优先级' | '中优先级' | '低优先级', string> = {
    '高优先级': '#ff4d4f',
    '中优先级': '#faad14',
    '低优先级': '#52c41a'
  };
  return colorMap[priority as keyof typeof colorMap] || '#1890ff';
};

const getPriorityTagColor = (priority: string) => {
  const colorMap: Record<'高优先级' | '中优先级' | '低优先级', string> = {
    '高优先级': 'error',
    '中优先级': 'warning',
    '低优先级': 'success'
  };
  return colorMap[priority as keyof typeof colorMap] || 'default';
};

onMounted(() => {
  loadTaskDetail();
});
</script>

<style scoped>
.analysis-task-detail {
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

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 400px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.loading-text {
  margin-top: 16px;
  color: #666;
}

.detail-content {
  width: 100%;
}

.task-overview-card {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border-radius: 8px;
  margin-bottom: 24px;
}

.status-tag {
  font-size: 14px;
  padding: 4px 12px;
}

.overview-item {
  text-align: center;
  padding: 16px 0;
}

.overview-label {
  font-size: 14px;
  color: #8c8c8c;
  margin-bottom: 8px;
}

.overview-value {
  font-size: 16px;
  font-weight: 600;
  color: #262626;
}

.task-progress {
  margin-top: 8px;
}

.time-icon,
.desc-icon {
  margin-right: 6px;
  color: #8c8c8c;
}

.results-section {
  margin-top: 24px;
}

.result-card {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border-radius: 8px;
  margin-bottom: 24px;
}

.root-cause-card {
  border: 1px solid #e6f7ff;
}

.confidence-tag {
  font-size: 14px;
}

.root-cause-alert {
  margin: 0;
}

.evidence-card {
  border: 1px solid #f6ffed;
}

.evidence-timeline {
  margin-top: 16px;
}

.evidence-content {
  padding: 12px;
  background: #fafafa;
  border-radius: 6px;
  margin-top: 8px;
}

.evidence-text {
  margin: 8px 0 0 0;
  line-height: 1.6;
  color: #595959;
}

.components-card {
  border: 1px solid #fff7e6;
}

.components-grid {
  margin-top: 16px;
}

.component-item {
  border-radius: 6px;
  transition: all 0.3s;
}

.component-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.component-icon-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 60px;
  background: #fafafa;
}

.component-icon {
  font-size: 24px;
  color: #fa8c16;
}

.recommendations-card {
  border: 1px solid #f6ffed;
}

.recommendations-list {
  margin-top: 16px;
}

.recommendation-text {
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
}

.state-card {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border-radius: 8px;
}

.error-card {
  border: 1px solid #ffccc7;
}

.state-content {
  text-align: center;
  padding: 40px;
}

.state-spinner {
  margin-bottom: 24px;
}

.state-title {
  margin: 16px 0 8px 0;
  font-size: 18px;
  font-weight: 600;
  color: #262626;
}

.state-description {
  margin-bottom: 24px;
  color: #8c8c8c;
  line-height: 1.6;
}

.running-progress {
  margin-bottom: 24px;
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
}

.state-actions {
  margin-top: 24px;
}

.error-icon {
  font-size: 48px;
  color: #ff4d4f;
  margin-bottom: 16px;
}

.pending-icon {
  font-size: 48px;
  color: #faad14;
  margin-bottom: 16px;
}

.error-alert {
  margin: 16px 0;
}

.no-data {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 400px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

:deep(.ant-card-head-title) {
  font-weight: 600;
  color: #262626;
}

:deep(.ant-descriptions-item-label) {
  font-weight: 500;
  color: #595959;
}

:deep(.ant-timeline-item-content) {
  margin-left: 20px;
}

:deep(.ant-list-item-meta-title) {
  margin-bottom: 4px;
}

:deep(.ant-list-item-meta-description) {
  color: #595959;
}

:deep(.ant-page-header) {
  padding: 16px 24px;
}

@media (max-width: 768px) {
  .analysis-task-detail {
    padding: 16px;
  }
  
  .task-overview-card .ant-col,
  .components-grid .ant-col {
    margin-bottom: 16px;
  }
  
  .state-content {
    padding: 24px 16px;
  }
}
</style>
