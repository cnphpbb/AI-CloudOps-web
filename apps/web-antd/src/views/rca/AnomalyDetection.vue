<template>
  <div class="anomaly-detection">
    <a-page-header
      title="异常检测"
      sub-title="基于机器学习的智能异常检测系统"
      class="page-header"
    >
      <template #extra>
        <a-space>
          <a-button @click="loadAvailableMetrics">
            <template #icon><reload-outlined /></template>
            刷新指标
          </a-button>
        </a-space>
      </template>
    </a-page-header>

    <a-card title="配置检测参数" class="detection-form-card">
      <template #extra>
        <setting-outlined />
      </template>
      
      <a-form
        :model="detectionParams"
        layout="vertical"
        @finish="runDetection"
        class="detection-form"
      >
        <a-row :gutter="24">
          <a-col :span="12">
            <a-form-item 
              label="开始时间" 
              name="start_time" 
              :rules="[{ required: true, message: '请选择开始时间' }]"
            >
              <a-date-picker
                v-model:value="detectionParams.start_time"
                show-time
                format="YYYY-MM-DD HH:mm:ss"
                placeholder="选择开始时间"
                style="width: 100%"
              />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item 
              label="结束时间" 
              name="end_time" 
              :rules="[{ required: true, message: '请选择结束时间' }]"
            >
              <a-date-picker
                v-model:value="detectionParams.end_time"
                show-time
                format="YYYY-MM-DD HH:mm:ss"
                placeholder="选择结束时间"
                style="width: 100%"
              />
            </a-form-item>
          </a-col>
        </a-row>

        <a-form-item label="敏感度设置">
          <div class="sensitivity-section">
            <a-row align="middle" :gutter="16">
              <a-col flex="auto">
                <a-slider
                  v-model:value="detectionParams.sensitivity"
                  :min="0.1"
                  :max="1"
                  :step="0.1"
                  :marks="{
                    0.1: '低',
                    0.5: '中',
                    1.0: '高'
                  }"
                />
              </a-col>
              <a-col flex="80px">
                <a-input-number
                  v-model:value="detectionParams.sensitivity"
                  :min="0.1"
                  :max="1"
                  :step="0.1"
                  size="small"
                  style="width: 100%"
                />
              </a-col>
            </a-row>
            <a-typography-text type="secondary" class="sensitivity-tip">
              <info-circle-outlined /> 高敏感度会检测出更多异常，但可能增加误报率
            </a-typography-text>
          </div>
        </a-form-item>

        <a-form-item label="选择待分析指标">
          <a-checkbox-group v-model:value="selectedMetrics" class="metrics-selection">
            <a-row :gutter="[16, 16]">
              <a-col 
                v-for="metric in availableMetrics" 
                :key="metric" 
                :span="6"
              >
                <a-checkbox :value="metric" class="metric-checkbox">
                  <line-chart-outlined class="metric-icon" />
                  {{ metric }}
                </a-checkbox>
              </a-col>
            </a-row>
          </a-checkbox-group>
        </a-form-item>

        <a-form-item>
          <a-space>
            <a-button type="primary" html-type="submit" :loading="loading" size="large">
              <template #icon>
                <search-outlined v-if="!loading" />
                <loading-outlined v-else />
              </template>
              {{ loading ? '检测中...' : '开始检测' }}
            </a-button>
            <a-button @click="resetForm">
              <template #icon><redo-outlined /></template>
              重置
            </a-button>
          </a-space>
        </a-form-item>
      </a-form>
    </a-card>

    <div v-if="detectionResult" class="results-section">
      <a-card title="检测结果概览" class="results-overview">
        <template #extra>
          <a-space>
            <a-button type="primary" @click="exportResults" size="small">
              <template #icon><download-outlined /></template>
              导出结果
            </a-button>
          </a-space>
        </template>
        
        <a-row :gutter="24">
          <a-col :span="8">
            <a-statistic
              title="检测到异常"
              :value="detectionResult.anomalies.anomalies.length"
              suffix="个"
              class="summary-statistic"
            >
              <template #prefix>
                <warning-outlined style="color: #faad14" />
              </template>
            </a-statistic>
          </a-col>
          <a-col :span="8">
            <a-statistic
              title="敏感度设置"
              :value="detectionResult.sensitivity || 0.5"
              :precision="1"
              class="summary-statistic"
            >
              <template #prefix>
                <dashboard-outlined style="color: #1890ff" />
              </template>
            </a-statistic>
          </a-col>
          <a-col :span="8">
            <a-statistic
              title="分析时间范围"
              :value="getDateRange()"
              class="summary-statistic"
            >
              <template #prefix>
                <calendar-outlined style="color: #52c41a" />
              </template>
            </a-statistic>
          </a-col>
        </a-row>
      </a-card>

      <a-card title="异常时间线" class="timeline-card">
        <template #extra>
          <clock-circle-outlined />
        </template>
        
        <a-timeline class="anomaly-timeline" v-if="detectionResult.anomalies.anomalies.length > 0">
          <a-timeline-item 
            v-for="(anomaly, index) in detectionResult.anomalies.anomalies" 
            :key="index"
            :color="getSeverityColor(anomaly.severity)"
          >
            <template #dot>
              <component :is="getSeverityIcon(anomaly.severity)" />
            </template>
            
            <div class="timeline-content">
              <div class="timeline-header">
                <a-space>
                  <a-typography-text strong>{{ anomaly.metric_name }}</a-typography-text>
                  <a-tag :color="getSeverityColor(anomaly.severity)" size="small">
                    {{ formatSeverity(anomaly.severity) }}
                  </a-tag>
                </a-space>
                <a-typography-text type="secondary" class="timeline-time">
                  {{ formatTime(anomaly.timestamp) }}
                </a-typography-text>
              </div>
              
              <div class="anomaly-details">
                <a-descriptions size="small" :column="3" class="details-desc">
                  <a-descriptions-item label="实际值">
                    <a-typography-text code>{{ anomaly.value.toFixed(2) }}</a-typography-text>
                  </a-descriptions-item>
                  <a-descriptions-item label="预期值">
                    <a-typography-text code>{{ anomaly.expected_value.toFixed(2) }}</a-typography-text>
                  </a-descriptions-item>
                  <a-descriptions-item label="偏差">
                    <a-typography-text type="danger" code>{{ anomaly.deviation.toFixed(2) }}%</a-typography-text>
                  </a-descriptions-item>
                </a-descriptions>
              </div>
            </div>
          </a-timeline-item>
        </a-timeline>
        
        <a-empty v-else description="未检测到异常" />
      </a-card>

      <a-card title="异常分布图" class="chart-card">
        <template #extra>
          <bar-chart-outlined />
        </template>
        
        <div class="chart-container">
          <canvas ref="chartCanvas" v-if="detectionResult.anomalies.anomalies.length > 0"></canvas>
          <a-empty v-else description="暂无数据" />
        </div>
      </a-card>
    </div>

    <div v-if="error" class="error-section">
      <a-alert
        :message="error"
        type="error"
        show-icon
        closable
        @close="error = ''"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue';
import dayjs, { type Dayjs } from 'dayjs';
import { message } from 'ant-design-vue';
import {
  ReloadOutlined,
  SettingOutlined,
  SearchOutlined,
  LoadingOutlined,
  RedoOutlined,
  InfoCircleOutlined,
  LineChartOutlined,
  DownloadOutlined,
  WarningOutlined,
  DashboardOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  BarChartOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons-vue';
import { createAnomalyDetectionApi, listAvailableMetricsApi } from '#/api/core/rca';
import type { AnomalyDetectionReq, AnomalyDetectionEntity } from '#/api/core/rca';

const detectionParams = ref<{
  start_time: Dayjs | null;
  end_time: Dayjs | null;
  sensitivity: number;
  metrics?: string[];
}>({
  start_time: null,
  end_time: null,
  sensitivity: 0.5,
  metrics: []
});

const availableMetrics = ref<string[]>(['cpu', 'memory', 'network', 'disk_io', 'response_time', 'error_rate']);
const selectedMetrics = ref<string[]>([]);
const detectionResult = ref<AnomalyDetectionEntity | null>(null);
const loading = ref(false);
const error = ref('');
const chartCanvas = ref<HTMLCanvasElement | null>(null);

const loadAvailableMetrics = async () => {
  try {
    const response = await listAvailableMetricsApi();
    if (response.data?.available_metrics) {
      availableMetrics.value = response.data.available_metrics;
    }
  } catch (err) {
    console.error('Failed to load metrics:', err);
  }
};

const runDetection = async () => {
  if (!detectionParams.value.start_time || !detectionParams.value.end_time) {
    message.error('请选择开始和结束时间');
    return;
  }

  loading.value = true;
  error.value = '';
  
  try {
    const requestData: AnomalyDetectionReq = {
      start_time: detectionParams.value.start_time.format('YYYY-MM-DD HH:mm:ss'),
      end_time: detectionParams.value.end_time.format('YYYY-MM-DD HH:mm:ss'),
      sensitivity: detectionParams.value.sensitivity,
      metrics: selectedMetrics.value.length > 0 ? selectedMetrics.value : undefined
    };
    
    const response = await createAnomalyDetectionApi(requestData);
    detectionResult.value = response.data || null;
    
    message.success(`检测完成，发现 ${detectionResult.value?.anomalies.anomalies.length || 0} 个异常`);
    
    await nextTick();
    drawChart();
  } catch (err) {
    error.value = '异常检测失败，请检查参数后重试';
    message.error('异常检测失败');
    console.error('Detection error:', err);
  } finally {
    loading.value = false;
  }
};

const drawChart = () => {
  if (!chartCanvas.value || !detectionResult.value) return;

  const ctx = chartCanvas.value.getContext('2d');
  if (!ctx) return;

  const anomalies = detectionResult.value.anomalies.anomalies;
  const metricCounts: Record<string, number> = {};
  
  anomalies.forEach(a => {
    metricCounts[a.metric_name] = (metricCounts[a.metric_name] || 0) + 1;
  });

  const labels = Object.keys(metricCounts);
  const data = Object.values(metricCounts);
  
  // Simple bar chart drawing
  const width = chartCanvas.value.width = 600;
  const height = chartCanvas.value.height = 300;
  const barWidth = width / labels.length * 0.7;
  const maxValue = Math.max(...data);
  
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = '#1976d2';
  
  labels.forEach((label, i) => {
    // 防御性编程，确保 data[i] 不为 undefined
    const value = data?.[i] ?? 0;
    const barHeight = (value / (maxValue || 1)) * (height - 40);
    const x = i * (width / labels.length) + (width / labels.length - barWidth) / 2;
    const y = height - barHeight - 20;

    ctx.fillRect(x, y, barWidth, barHeight);

    // 绘制标签
    ctx.fillStyle = '#333';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(label ?? '', x + barWidth / 2, height - 5);
    ctx.fillText(value.toString(), x + barWidth / 2, y - 5);
    ctx.fillStyle = '#1976d2';
  });
};

const formatTime = (timestamp: string) => {
  return new Date(timestamp).toLocaleString();
};

const getDateRange = () => {
  if (!detectionResult.value) return '';
  const period = detectionResult.value.detection_period;
  if (!period.start || !period.end) return '';
  
  const start = new Date(period.start).toLocaleDateString();
  const end = new Date(period.end).toLocaleDateString();
  return start === end ? start : `${start} - ${end}`;
};

watch(selectedMetrics, (newVal) => {
  detectionParams.value.metrics = newVal;
});

const resetForm = () => {
  const now = dayjs();
  const yesterday = now.subtract(24, 'hour');
  
  detectionParams.value = {
    start_time: yesterday,
    end_time: now,
    sensitivity: 0.5,
    metrics: []
  };
  selectedMetrics.value = [];
  detectionResult.value = null;
  error.value = '';
};

const exportResults = () => {
  if (!detectionResult.value) return;
  
  const data = {
    detection_period: detectionResult.value.detection_period,
    sensitivity: detectionResult.value.sensitivity,
    anomalies: detectionResult.value.anomalies.anomalies
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `anomaly-detection-${dayjs().format('YYYY-MM-DD-HH-mm')}.json`;
  a.click();
  URL.revokeObjectURL(url);
  
  message.success('结果已导出');
};

const getSeverityColor = (severity: string) => {
  const colorMap = {
    'high': 'red',
    'medium': 'orange', 
    'low': 'blue'
  };
  return colorMap[severity as keyof typeof colorMap] || 'default';
};

const getSeverityIcon = (severity: string) => {
  const iconMap = {
    'high': ExclamationCircleOutlined,
    'medium': WarningOutlined,
    'low': CheckCircleOutlined
  };
  return iconMap[severity as keyof typeof iconMap] || ExclamationCircleOutlined;
};

const formatSeverity = (severity: string) => {
  const severityMap = {
    'high': '高',
    'medium': '中',
    'low': '低'
  };
  return severityMap[severity as keyof typeof severityMap] || severity;
};

onMounted(() => {
  loadAvailableMetrics();
  resetForm();
});
</script>

<style scoped>
.anomaly-detection {
  padding: 24px;
  background: #f5f7fa;
  min-height: 100vh;
}

.page-header {
  background: white;
  margin-bottom: 16px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.detection-form-card {
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.detection-form {
  margin-top: 16px;
}

.sensitivity-section {
  padding: 16px;
  background: #fafafa;
  border-radius: 6px;
}

.sensitivity-tip {
  display: block;
  margin-top: 8px;
  font-size: 12px;
}

.metrics-selection {
  background: #fafafa;
  padding: 16px;
  border-radius: 6px;
}

.metric-checkbox {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background: white;
  border-radius: 4px;
  border: 1px solid #d9d9d9;
  transition: all 0.3s;
}

.metric-checkbox:hover {
  border-color: #1677ff;
  box-shadow: 0 2px 4px rgba(22, 119, 255, 0.1);
}

.metric-icon {
  margin-right: 6px;
  color: #1677ff;
}

.results-section {
  margin-top: 16px;
}

.results-overview {
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.summary-statistic {
  text-align: center;
}

.timeline-card {
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.anomaly-timeline {
  max-height: 500px;
  overflow-y: auto;
}

.timeline-content {
  padding: 12px;
  background: #fafafa;
  border-radius: 6px;
  margin-top: 8px;
}

.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.timeline-time {
  font-size: 12px;
}

.anomaly-details {
  margin-top: 8px;
}

.details-desc {
  background: white;
  padding: 8px;
  border-radius: 4px;
}

.chart-card {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.chart-container {
  min-height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.error-section {
  margin-top: 16px;
}

:deep(.ant-form-item-label) {
  font-weight: 500;
}

:deep(.ant-statistic-title) {
  font-size: 14px;
  margin-bottom: 8px;
}

:deep(.ant-statistic-content) {
  font-size: 24px;
  font-weight: 600;
}

:deep(.ant-timeline-item-content) {
  margin-left: 20px;
}

:deep(.ant-card-head-title) {
  font-weight: 600;
}

@media (max-width: 768px) {
  .anomaly-detection {
    padding: 16px;
  }
  
  .results-overview .ant-col,
  .detection-form .ant-col {
    margin-bottom: 16px;
  }
  
  .metrics-selection .ant-col {
    span: 12 !important;
  }
}
</style>
