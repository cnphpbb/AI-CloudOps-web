<template>
  <div class="rca-container">
    <div class="header">
      <h1 class="title">智能运维根因分析</h1>
      <div class="actions">
        <a-select v-model:value="timeRange" style="width: 150px" class="time-selector" @change="handleTimeRangeChange">
          <a-select-option value="30">最近30分钟</a-select-option>
          <a-select-option value="60">最近1小时</a-select-option>
          <a-select-option value="360">最近6小时</a-select-option>
          <a-select-option value="1440">最近24小时</a-select-option>
        </a-select>
        <a-button type="primary" class="refresh-btn" @click="refreshData" :loading="loading">
          <template #icon><sync-outlined /></template>
          刷新
        </a-button>
      </div>
    </div>

    <!-- 配置和健康状态 -->
    <div class="dashboard">
      <div class="status-cards">
        <a-card class="status-card" :loading="healthLoading">
          <template #title>
            <check-circle-outlined /> 服务状态
          </template>
          <div class="status-content">
            <a-tag :color="healthStatus.status === 'healthy' ? 'green' : 'orange'">
              {{ healthStatus.status === 'healthy' ? '正常' : '降级' }}
            </a-tag>
            <div class="component-status">
              <div class="component">
                <span>Prometheus:</span>
                <a-tag :color="healthStatus.components?.prometheus ? 'green' : 'red'" size="small">
                  {{ healthStatus.components?.prometheus ? '正常' : '异常' }}
                </a-tag>
              </div>
              <div class="component">
                <span>LLM:</span>
                <a-tag :color="healthStatus.components?.llm ? 'green' : 'red'" size="small">
                  {{ healthStatus.components?.llm ? '正常' : '异常' }}
                </a-tag>
              </div>
            </div>
          </div>
        </a-card>

        <a-card class="status-card" :loading="configLoading">
          <template #title>
            <setting-outlined /> 配置信息
          </template>
          <div class="config-content">
            <div class="config-item">
              <span>异常检测阈值:</span>
              <a-input-number v-model:value="config.anomaly_threshold" :min="0.1" :max="1" :step="0.1" size="small"
                @change="updateConfig" />
            </div>
            <div class="config-item">
              <span>相关性阈值:</span>
              <a-input-number v-model:value="config.correlation_threshold" :min="0.1" :max="1" :step="0.1" size="small"
                @change="updateConfig" />
            </div>
          </div>
        </a-card>

        <a-card class="status-card" :loading="metricsLoading">
          <template #title>
            <bar-chart-outlined /> 可用指标
          </template>
          <div class="metrics-content">
            <div class="metric-count">
              总数: {{ availableMetrics.default_metrics?.length || 0 }}
            </div>
            <div class="metric-categories">
              <a-tag v-for="category in Object.keys(availableMetrics.categories || {})" :key="category" size="small">
                {{ category }}
              </a-tag>
            </div>
          </div>
        </a-card>
      </div>

      <!-- 根因分析控制面板 -->
      <a-card title="根因分析" class="analysis-card">
        <div class="analysis-form">
          <a-row :gutter="16">
            <a-col :span="8">
              <div class="form-item">
                <label>开始时间:</label>
                <a-date-picker v-model:value="analysisForm.startTime" show-time format="YYYY-MM-DD HH:mm:ss"
                  style="width: 100%" />
              </div>
            </a-col>
            <a-col :span="8">
              <div class="form-item">
                <label>结束时间:</label>
                <a-date-picker v-model:value="analysisForm.endTime" show-time format="YYYY-MM-DD HH:mm:ss"
                  style="width: 100%" />
              </div>
            </a-col>
            <a-col :span="8">
              <div class="form-item">
                <label>分析指标:</label>
                <a-select v-model:value="analysisForm.selectedMetrics" mode="multiple" placeholder="选择监控指标"
                  style="width: 100%" :options="metricOptions" />
              </div>
            </a-col>
          </a-row>
          <div class="form-actions">
            <a-button type="primary" @click="performRootCauseAnalysis" :loading="analysisLoading">
              <template #icon><experiment-outlined /></template>
              执行根因分析
            </a-button>
            <a-button @click="resetAnalysisForm">重置</a-button>
          </div>
        </div>
      </a-card>

      <!-- 事件分析面板 -->
      <a-card title="事件分析" class="incident-card">
        <div class="incident-form">
          <a-row :gutter="16">
            <a-col :span="12">
              <div class="form-item">
                <label>受影响服务:</label>
                <a-select v-model:value="incidentForm.affectedServices" mode="tags" placeholder="输入服务名称"
                  style="width: 100%" />
              </div>
            </a-col>
            <a-col :span="12">
              <div class="form-item">
                <label>症状描述:</label>
                <a-select v-model:value="incidentForm.symptoms" mode="tags" placeholder="描述症状" style="width: 100%" />
              </div>
            </a-col>
          </a-row>
          <div class="form-actions">
            <a-button type="primary" @click="analyzeIncident" :loading="incidentLoading">
              <template #icon><bug-outlined /></template>
              分析事件
            </a-button>
          </div>
        </div>
      </a-card>

      <!-- 分析结果展示 -->
      <a-card title="分析结果" class="results-card" v-if="analysisResult || incidentResult">
        <a-tabs v-model:activeKey="activeResultTab">
          <a-tab-pane key="rca" tab="根因分析结果" v-if="analysisResult">
            <div class="rca-results">
              <!-- 异常检测结果 -->
              <div class="result-section" v-if="analysisResult.anomalies">
                <h3>异常检测结果</h3>
                <a-table :dataSource="anomaliesTableData" :columns="anomaliesColumns" :pagination="false"
                  size="small" />
              </div>

              <!-- 根因候选 -->
              <div class="result-section" v-if="analysisResult.root_cause_candidates">
                <h3>根因候选</h3>
                <a-list :dataSource="analysisResult.root_cause_candidates" item-layout="vertical">
                  <template #renderItem="{ item, index }">
                    <a-list-item>
                      <template #extra>
                        <div class="confidence-score">
                          置信度: {{ (item.confidence * 100).toFixed(1) }}%
                        </div>
                      </template>
                      <a-list-item-meta>
                        <template #title>
                          <a-tag color="blue">候选 {{ index + 1 }}</a-tag>
                          {{ item.metric }}
                        </template>
                        <template #description>
                          <div class="candidate-details">
                            <p><strong>异常类型:</strong> {{ item.anomaly_type }}</p>
                            <p><strong>相关指标:</strong> {{ item.correlated_metrics?.join(', ') || '无' }}</p>
                            <p><strong>建议:</strong> {{ item.recommendation || '暂无建议' }}</p>
                          </div>
                        </template>
                      </a-list-item-meta>
                    </a-list-item>
                  </template>
                </a-list>
              </div>

              <!-- 相关性分析 -->
              <div class="result-section" v-if="analysisResult.correlation_analysis">
                <h3>相关性分析</h3>
                <div ref="correlationChartRef" class="correlation-chart"></div>
              </div>

              <!-- AI分析总结 -->
              <div class="result-section" v-if="analysisResult.ai_analysis">
                <h3>AI分析总结</h3>
                <a-alert :message="analysisResult.ai_analysis.summary"
                  :description="analysisResult.ai_analysis.recommendations?.join('\n')" type="info" show-icon />
              </div>
            </div>
          </a-tab-pane>

          <a-tab-pane key="incident" tab="事件分析结果" v-if="incidentResult">
            <div class="incident-results">
              <a-result :status="incidentResult.error ? 'error' : 'success'"
                :title="incidentResult.error ? '分析失败' : '事件分析完成'" :sub-title="incidentResult.error || '已完成事件根因分析'">
                <template #extra v-if="!incidentResult.error">
                  <div class="incident-summary">
                    <p>{{ incidentResult.summary || '分析结果详情请查看具体报告' }}</p>
                  </div>
                </template>
              </a-result>
            </div>
          </a-tab-pane>
        </a-tabs>
      </a-card>
    </div>

    <!-- 操作反馈弹窗 -->
    <a-modal v-model:visible="feedbackModalVisible" :title="feedbackTitle" @ok="closeFeedbackModal">
      <p>{{ feedbackMessage }}</p>
    </a-modal>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, reactive, computed } from 'vue';
import {
  SyncOutlined,
  CheckCircleOutlined,
  SettingOutlined,
  BarChartOutlined,
  ExperimentOutlined,
  BugOutlined
} from '@ant-design/icons-vue';
import * as echarts from 'echarts';
import dayjs, { Dayjs } from 'dayjs';
import { message } from 'ant-design-vue';
import {
  getRCAHealthApi,
  getRCAConfigApi,
  getAvailableMetricsApi,
  updateRCAConfigApi,
  executeRCAApi,
  analyzeIncidentApi,
  type RCARequest,
  type RCAResponse,
  type IncidentRequest
} from '#/api/core/ai';

// 类型定义
interface HealthStatus {
  status: string;
  components: {
    prometheus: boolean;
    llm: boolean;
    detector: boolean;
    correlator: boolean;
  };
  timestamp: string;
  config: {
    anomaly_threshold: number;
    correlation_threshold: number;
  };
}

interface Config {
  anomaly_threshold: number;
  correlation_threshold: number;
}

interface AvailableMetrics {
  default_metrics: string[];
  categories: Record<string, string[]>;
  config: {
    default_time_range: number;
    max_time_range: number;
    anomaly_threshold: number;
    correlation_threshold: number;
  };
}

interface RCAResult {
  anomalies: Record<string, any>;
  root_cause_candidates: Array<{
    metric: string;
    confidence: number;
    anomaly_type: string;
    correlated_metrics: string[];
    recommendation: string;
  }>;
  correlation_analysis: any;
  ai_analysis: {
    summary: string;
    recommendations: string[];
  };
  error?: string;
}

// 响应式数据
const timeRange = ref('60');
const loading = ref(false);
const healthLoading = ref(false);
const configLoading = ref(false);
const metricsLoading = ref(false);
const analysisLoading = ref(false);
const incidentLoading = ref(false);

const healthStatus = ref<HealthStatus>({
  status: 'unknown',
  components: {
    prometheus: false,
    llm: false,
    detector: false,
    correlator: false
  },
  timestamp: '',
  config: {
    anomaly_threshold: 0.8,
    correlation_threshold: 0.7
  }
});

const config = ref<Config>({
  anomaly_threshold: 0.8,
  correlation_threshold: 0.7
});

const availableMetrics = ref<AvailableMetrics>({
  default_metrics: [],
  categories: {},
  config: {
    default_time_range: 60,
    max_time_range: 1440,
    anomaly_threshold: 0.8,
    correlation_threshold: 0.7
  }
});

// 分析表单
const analysisForm = reactive({
  startTime: ref<Dayjs | null>(null),
  endTime: ref<Dayjs | null>(null),
  selectedMetrics: [] as string[]
});

// 事件分析表单
const incidentForm = reactive({
  affectedServices: [] as string[],
  symptoms: [] as string[]
});

// 结果数据
const analysisResult = ref<RCAResult | null>(null);
const incidentResult = ref<any>(null);
const activeResultTab = ref('rca');

// 反馈弹窗
const feedbackModalVisible = ref(false);
const feedbackTitle = ref('');
const feedbackMessage = ref('');

// 图表引用
const correlationChartRef = ref(null);

// 计算属性
const metricOptions = computed(() => {
  const options: Array<{ label: string, value: string }> = [];

  // 添加默认指标
  availableMetrics.value.default_metrics?.forEach(metric => {
    options.push({ label: metric, value: metric });
  });

  // 添加分类指标
  Object.entries(availableMetrics.value.categories || {}).forEach(([category, metrics]) => {
    metrics.forEach(metric => {
      if (!options.find(option => option.value === metric)) {
        options.push({ label: `${category}: ${metric}`, value: metric });
      }
    });
  });

  return options;
});

// 异常检测结果表格数据
const anomaliesTableData = computed(() => {
  if (!analysisResult.value?.anomalies) return [];

  return Object.entries(analysisResult.value.anomalies).map(([metric, data]: [string, any]) => ({
    key: metric,
    metric,
    anomaly_score: data.anomaly_score?.toFixed(3) || 'N/A',
    detection_method: data.detection_method || 'unknown',
    timestamp: data.timestamp || 'N/A'
  }));
});

// 异常检测表格列定义
const anomaliesColumns = [
  { title: '指标名称', dataIndex: 'metric', key: 'metric' },
  { title: '异常分数', dataIndex: 'anomaly_score', key: 'anomaly_score' },
  { title: '检测方法', dataIndex: 'detection_method', key: 'detection_method' },
  { title: '时间戳', dataIndex: 'timestamp', key: 'timestamp' }
];

// API调用函数
const fetchHealthStatus = async () => {
  try {
    healthLoading.value = true;
    const response = await getRCAHealthApi();
    healthStatus.value = response as unknown as HealthStatus;
    config.value.anomaly_threshold = response.config.anomaly_threshold;
    config.value.correlation_threshold = response.config.correlation_threshold;
  } catch (error) {
    console.error('获取健康状态失败:', error);
    message.error('获取健康状态失败');
  } finally {
    healthLoading.value = false;
  }
};

const fetchConfig = async () => {
  try {
    configLoading.value = true;
    const response = await getRCAConfigApi();
    config.value.anomaly_threshold = response.anomaly_detection.threshold;
    config.value.correlation_threshold = response.correlation_analysis.threshold;
  } catch (error) {
    console.error('获取配置失败:', error);
    message.error('获取配置失败');
  } finally {
    configLoading.value = false;
  }
};

const fetchAvailableMetrics = async () => {
  try {
    metricsLoading.value = true;
    const response = await getAvailableMetricsApi();
    availableMetrics.value = response as unknown as AvailableMetrics;

    // 设置默认选中的指标
    if (response.default_metrics?.length > 0) {
      analysisForm.selectedMetrics = response.default_metrics.slice(0, 5);
    }
  } catch (error) {
    console.error('获取可用指标失败:', error);
    message.error('获取可用指标失败');
  } finally {
    metricsLoading.value = false;
  }
};

const updateConfig = async () => {
  try {
    await updateRCAConfigApi({
      anomaly_threshold: config.value.anomaly_threshold,
      correlation_threshold: config.value.correlation_threshold
    });
    message.success('配置更新成功');
  } catch (error) {
    console.error('更新配置失败:', error);
    message.error('更新配置失败');
  }
};

const performRootCauseAnalysis = async () => {
  if (!analysisForm.startTime || !analysisForm.endTime) {
    message.warning('请选择分析时间范围');
    return;
  }

  if (analysisForm.selectedMetrics.length === 0) {
    message.warning('请选择至少一个监控指标');
    return;
  }

  try {
    analysisLoading.value = true;

    const requestData: RCARequest = {
      start_time: analysisForm.startTime.toISOString(),
      end_time: analysisForm.endTime.toISOString(),
      metrics: analysisForm.selectedMetrics
    };

    const response = await executeRCAApi(requestData);

    if (response.error) {
      message.error(`分析失败: ${response.error}`);
      return;
    }

    analysisResult.value = response as RCAResponse;
    activeResultTab.value = 'rca';
    message.success('根因分析完成');

    // 渲染相关性图表
    setTimeout(() => {
      renderCorrelationChart();
    }, 100);

  } catch (error: any) {
    console.error('根因分析失败:', error);
    message.error(`根因分析失败: ${error.response?.data?.error || error.message}`);
  } finally {
    analysisLoading.value = false;
  }
};

const analyzeIncident = async () => {
  if (incidentForm.affectedServices.length === 0) {
    message.warning('请输入受影响的服务');
    return;
  }

  if (incidentForm.symptoms.length === 0) {
    message.warning('请描述症状');
    return;
  }

  try {
    incidentLoading.value = true;

    const requestData: IncidentRequest = {
      start_time: analysisForm.startTime?.toISOString(),
      end_time: analysisForm.endTime?.toISOString(),
      affected_services: incidentForm.affectedServices,
      symptoms: incidentForm.symptoms
    };

    const response = await analyzeIncidentApi(requestData);

    incidentResult.value = response;
    activeResultTab.value = 'incident';
    message.success('事件分析完成');

  } catch (error: any) {
    console.error('事件分析失败:', error);
    message.error(`事件分析失败: ${error.response?.data?.error || error.message}`);
    incidentResult.value = { error: error.response?.data?.error || error.message };
    activeResultTab.value = 'incident';
  } finally {
    incidentLoading.value = false;
  }
};

// 渲染相关性图表
const renderCorrelationChart = () => {
  const chartDom = correlationChartRef.value;
  if (!chartDom || !analysisResult.value?.correlation_analysis) return;

  const myChart = echarts.init(chartDom);

  // 处理相关性数据为热力图格式
  const correlationData = analysisResult.value.correlation_analysis;
  const metrics = Object.keys(correlationData);
  const data: Array<[number, number, number]> = [];

  metrics.forEach((metric1, i) => {
    metrics.forEach((metric2, j) => {
      const value = correlationData[metric1]?.[metric2] || 0;
      data.push([i, j, Math.abs(value)]);
    });
  });

  const option = {
    tooltip: {
      position: 'top',
      formatter: (params: any) => {
        const [x, y, value] = params.data;
        return `${metrics[x]} vs ${metrics[y]}<br/>相关性: ${value.toFixed(3)}`;
      }
    },
    grid: {
      height: '70%',
      top: '10%'
    },
    xAxis: {
      type: 'category',
      data: metrics,
      splitArea: {
        show: true
      },
      axisLabel: {
        interval: 0,
        rotate: 45
      }
    },
    yAxis: {
      type: 'category',
      data: metrics,
      splitArea: {
        show: true
      }
    },
    visualMap: {
      min: 0,
      max: 1,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: '10%',
      inRange: {
        color: ['#313695', '#4575b4', '#74add1', '#abd9e9', '#e0f3f8', '#ffffcc', '#fee090', '#fdae61', '#f46d43', '#d73027', '#a50026']
      }
    },
    series: [{
      name: '相关性',
      type: 'heatmap',
      data: data,
      label: {
        show: true,
        formatter: (params: any) => params.data[2].toFixed(2)
      },
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      }
    }]
  };

  myChart.setOption(option);

  window.addEventListener('resize', () => {
    myChart.resize();
  });
};

// 工具函数
const handleTimeRangeChange = () => {
  const now = dayjs();
  const minutes = parseInt(timeRange.value);

  analysisForm.endTime = now;
  analysisForm.startTime = now.subtract(minutes, 'minute');
};

const resetAnalysisForm = () => {
  analysisForm.startTime = null;
  analysisForm.endTime = null;
  analysisForm.selectedMetrics = [];
  analysisResult.value = null;
};

const refreshData = async () => {
  loading.value = true;
  try {
    await Promise.all([
      fetchHealthStatus(),
      fetchConfig(),
      fetchAvailableMetrics()
    ]);
  } catch (error) {
    message.error('刷新数据失败');
  } finally {
    loading.value = false;
  }
};

const closeFeedbackModal = () => {
  feedbackModalVisible.value = false;
};

// 组件挂载时初始化
onMounted(() => {
  handleTimeRangeChange(); // 设置默认时间范围
  refreshData();
});
</script>

<style scoped>
.rca-container {
  padding: 20px;
  min-height: 100vh;
  background-color: var(--ant-background-color-light);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.title {
  font-size: 24px;
  font-weight: bold;
  margin: 0;
  background: linear-gradient(90deg, #1890ff, #52c41a);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.actions {
  display: flex;
  gap: 12px;
}

.dashboard {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.status-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.status-card {
  border-radius: 8px;
  transition: all 0.3s ease;
}

.status-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.status-content,
.config-content,
.metrics-content {
  padding: 10px 0;
}

.component-status {
  margin-top: 10px;
}

.component {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
}

.config-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.config-item span {
  flex: 1;
}

.metric-count {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 10px;
}

.metric-categories {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.analysis-card,
.incident-card,
.results-card {
  border-radius: 8px;
  transition: all 0.3s ease;
}

.analysis-card:hover,
.incident-card:hover,
.results-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.analysis-form,
.incident-form {
  padding: 10px 0;
}

.form-item {
  margin-bottom: 16px;
}

.form-item label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

.rca-results,
.incident-results {
  padding: 10px 0;
}

.result-section {
  margin-bottom: 30px;
}

.result-section h3 {
  margin-bottom: 15px;
  color: var(--ant-heading-color);
  border-bottom: 2px solid #1890ff;
  padding-bottom: 5px;
}

.confidence-score {
  font-weight: bold;
  color: #1890ff;
}

.candidate-details p {
  margin-bottom: 5px;
}

.correlation-chart {
  height: 400px;
  border: 1px solid var(--ant-border-color);
  border-radius: 4px;
}

.incident-summary {
  text-align: left;
  max-width: 600px;
  margin: 0 auto;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .status-cards {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .status-cards {
    grid-template-columns: 1fr;
  }

  .header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .actions {
    width: 100%;
    justify-content: space-between;
  }
}

/* 加载动画 */
.ant-card-loading .ant-card-body {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 400% 100%;
  animation: loading 1.5s ease infinite;
}

@keyframes loading {
  0% {
    background-position: 200% 0;
  }

  100% {
    background-position: -200% 0;
  }
}
</style>
