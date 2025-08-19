<template>
  <div class="rca-container">
    <div class="header">
      <h1 class="title">智能运维根因分析</h1>
      <div class="actions">
        <a-select 
          v-model:value="timeRange" 
          style="width: 150px" 
          class="time-selector" 
          @change="handleTimeRangeChange"
        >
          <a-select-option value="30">最近30分钟</a-select-option>
          <a-select-option value="60">最近1小时</a-select-option>
          <a-select-option value="360">最近6小时</a-select-option>
          <a-select-option value="1440">最近24小时</a-select-option>
        </a-select>
        <a-button 
          type="primary" 
          class="refresh-btn" 
          @click="refreshData" 
          :loading="loading"
        >
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
            <a-tag :color="getStatusColor(healthStatus.status)">
              {{ getStatusText(healthStatus.status) }}
            </a-tag>
            <div class="component-status">
              <div v-for="(status, component) in healthStatus.components" :key="component" class="component">
                <span>{{ getComponentName(component) }}:</span>
                <a-tag :color="status ? 'green' : 'red'" size="small">
                  {{ status ? '正常' : '异常' }}
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
              <a-input-number 
                v-model:value="config.anomaly_threshold" 
                :min="0.1" 
                :max="1" 
                :step="0.1" 
                size="small"
                @change="handleConfigChange"
              />
            </div>
            <div class="config-item">
              <span>相关性阈值:</span>
              <a-input-number 
                v-model:value="config.correlation_threshold" 
                :min="0.1" 
                :max="1" 
                :step="0.1" 
                size="small"
                @change="handleConfigChange"
              />
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
              <a-tag 
                v-for="category in Object.keys(availableMetrics.categories || {})" 
                :key="category" 
                size="small"
              >
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
                <a-date-picker 
                  v-model:value="analysisForm.startTime" 
                  show-time 
                  format="YYYY-MM-DD HH:mm:ss"
                  style="width: 100%" 
                  :disabled-date="disabledStartDate"
                />
              </div>
            </a-col>
            <a-col :span="8">
              <div class="form-item">
                <label>结束时间:</label>
                <a-date-picker 
                  v-model:value="analysisForm.endTime" 
                  show-time 
                  format="YYYY-MM-DD HH:mm:ss"
                  style="width: 100%" 
                  :disabled-date="disabledEndDate"
                />
              </div>
            </a-col>
            <a-col :span="8">
              <div class="form-item">
                <label>分析指标:</label>
                <a-select 
                  v-model:value="analysisForm.selectedMetrics" 
                  mode="multiple" 
                  placeholder="选择监控指标"
                  style="width: 100%" 
                  :options="metricOptions"
                  :filter-option="filterMetricOption"
                  show-search
                />
              </div>
            </a-col>
          </a-row>
          <div class="form-actions">
            <a-button 
              type="primary" 
              @click="performRootCauseAnalysis" 
              :loading="analysisLoading"
              :disabled="!canPerformAnalysis"
            >
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
                <a-select 
                  v-model:value="incidentForm.affectedServices" 
                  mode="tags" 
                  placeholder="输入服务名称"
                  style="width: 100%" 
                />
              </div>
            </a-col>
            <a-col :span="12">
              <div class="form-item">
                <label>症状描述:</label>
                <a-select 
                  v-model:value="incidentForm.symptoms" 
                  mode="tags" 
                  placeholder="描述症状" 
                  style="width: 100%" 
                />
              </div>
            </a-col>
          </a-row>
          <div class="form-actions">
            <a-button 
              type="primary" 
              @click="analyzeIncident" 
              :loading="incidentLoading"
              :disabled="!canPerformIncidentAnalysis"
            >
              <template #icon><bug-outlined /></template>
              分析事件
            </a-button>
          </div>
        </div>
      </a-card>

      <!-- 分析结果展示 -->
      <a-card title="分析结果" class="results-card" v-if="hasResults">
        <a-tabs v-model:activeKey="activeResultTab">
          <a-tab-pane key="rca" tab="根因分析结果" v-if="analysisResult">
            <div class="rca-results">
              <!-- 分析概览 -->
              <div class="result-section">
                <h3>分析概览</h3>
                <a-row :gutter="16">
                  <a-col :span="6">
                    <a-statistic title="分析状态" :value="analysisResult.status" />
                  </a-col>
                  <a-col :span="6">
                    <a-statistic title="总指标数" :value="analysisResult.statistics?.total_metrics || 0" />
                  </a-col>
                  <a-col :span="6">
                    <a-statistic title="异常指标数" :value="analysisResult.statistics?.anomalous_metrics || 0" />
                  </a-col>
                  <a-col :span="6">
                    <a-statistic title="分析时长" :value="analysisResult.statistics?.analysis_duration || 0" suffix="秒" />
                  </a-col>
                </a-row>
                <div class="time-range-info">
                  <p><strong>分析时间范围:</strong> {{ formatTimeRange(analysisResult.time_range) }}</p>
                  <p><strong>分析完成时间:</strong> {{ analysisResult.analysis_time }}</p>
                </div>
              </div>

              <!-- AI 总结 -->
              <div class="result-section" v-if="analysisResult.summary">
                <h3>AI 分析总结</h3>
                <div class="markdown-summary">
                  <markdown-renderer :content="analysisResult.summary" />
                </div>
              </div>

              <!-- 异常检测结果 -->
              <div class="result-section" v-if="hasAnomalies">
                <h3>异常检测结果</h3>
                <a-table 
                  :dataSource="anomaliesTableData" 
                  :columns="anomaliesColumns" 
                  :pagination="{ pageSize: 10 }"
                  size="small" 
                />
              </div>

              <!-- 根因候选 -->
              <div class="result-section" v-if="hasRootCauseCandidates">
                <h3>根因候选</h3>
                <a-list :dataSource="analysisResult.root_cause_candidates" item-layout="vertical">
                  <template #renderItem="{ item, index }">
                    <a-list-item>
                      <template #extra>
                        <div class="candidate-stats">
                          <div class="confidence-score">
                            置信度: {{ formatPercentage(item.confidence) }}
                          </div>
                          <div class="anomaly-count">
                            异常次数: {{ item.anomaly_count }}
                          </div>
                        </div>
                      </template>
                      <a-list-item-meta>
                        <template #title>
                          <a-tag color="blue">候选 {{ index + 1 }}</a-tag>
                          {{ item.metric }}
                        </template>
                        <template #description>
                          <div class="candidate-details">
                            <p><strong>描述:</strong> {{ item.description || '暂无描述' }}</p>
                            <p><strong>首次出现:</strong> {{ item.first_occurrence }}</p>
                            <p><strong>相关指标:</strong> {{ formatRelatedMetrics(item.related_metrics) }}</p>
                          </div>
                        </template>
                      </a-list-item-meta>
                    </a-list-item>
                  </template>
                </a-list>
              </div>

              <!-- 相关性分析 -->
              <div class="result-section" v-if="hasCorrelations">
                <h3>相关性分析</h3>
                <div ref="correlationChartRef" class="correlation-chart"></div>
              </div>

              <!-- 分析指标列表 -->
              <div class="result-section" v-if="hasAnalyzedMetrics">
                <h3>已分析指标</h3>
                <div class="metrics-list">
                  <a-tag 
                    v-for="metric in analysisResult.metrics_analyzed" 
                    :key="metric" 
                    class="metric-tag"
                  >
                    {{ metric }}
                  </a-tag>
                </div>
              </div>

              <!-- 错误信息 -->
              <div class="result-section" v-if="analysisResult.error">
                <h3>错误信息</h3>
                <a-alert :message="analysisResult.error" type="error" show-icon />
              </div>
            </div>
          </a-tab-pane>

          <a-tab-pane key="incident" tab="事件分析结果" v-if="incidentResult">
            <div class="incident-results">
              <a-result 
                :status="incidentResult.error ? 'error' : 'success'"
                :title="incidentResult.error ? '分析失败' : '事件分析完成'" 
                :sub-title="incidentResult.error || '已完成事件根因分析'"
              >
                <template #extra v-if="!incidentResult.error">
                  <div class="incident-summary">
                    <markdown-renderer :content="incidentResult.summary || '分析结果详情请查看具体报告'" />
                  </div>
                </template>
              </a-result>
            </div>
          </a-tab-pane>
        </a-tabs>
      </a-card>
    </div>

    <!-- 操作反馈弹窗 -->
    <a-modal 
      v-model:visible="feedbackModalVisible" 
      :title="feedbackTitle" 
      @ok="closeFeedbackModal"
      @cancel="closeFeedbackModal"
    >
      <p>{{ feedbackMessage }}</p>
    </a-modal>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, reactive, computed, nextTick, watch } from 'vue';
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
  type IncidentRequest,
  type RCAResponse,
  type RCAHealthResponse,
  type MetricsResponse
} from '#/api/core/ai';

// 导入 MarkdownRenderer 组件
import MarkdownRenderer from './components/MarkdownRenderer.vue';

// 响应式数据
const timeRange = ref('60');
const loading = ref(false);
const healthLoading = ref(false);
const configLoading = ref(false);
const metricsLoading = ref(false);
const analysisLoading = ref(false);
const incidentLoading = ref(false);

const healthStatus = ref<RCAHealthResponse>({
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

const config = ref({
  anomaly_threshold: 0.8,
  correlation_threshold: 0.7
});

const availableMetrics = ref<MetricsResponse>({
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
const analysisResult = ref<RCAResponse | null>(null);
const incidentResult = ref<any>(null);
const activeResultTab = ref('rca');

// 反馈弹窗
const feedbackModalVisible = ref(false);
const feedbackTitle = ref('');
const feedbackMessage = ref('');

// 图表引用
const correlationChartRef = ref<HTMLElement | null>(null);

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

const hasResults = computed(() => {
  return analysisResult.value || incidentResult.value;
});

const hasAnomalies = computed(() => {
  return analysisResult.value?.anomalies && Object.keys(analysisResult.value.anomalies).length > 0;
});

const hasRootCauseCandidates = computed(() => {
  return analysisResult.value?.root_cause_candidates && analysisResult.value.root_cause_candidates.length > 0;
});

const hasCorrelations = computed(() => {
  return analysisResult.value?.correlations && Object.keys(analysisResult.value.correlations).length > 0;
});

const hasAnalyzedMetrics = computed(() => {
  return analysisResult.value?.metrics_analyzed && analysisResult.value.metrics_analyzed.length > 0;
});

const canPerformAnalysis = computed(() => {
  return analysisForm.startTime && 
         analysisForm.endTime && 
         analysisForm.selectedMetrics.length > 0 &&
         !analysisLoading.value;
});

const canPerformIncidentAnalysis = computed(() => {
  return incidentForm.affectedServices.length > 0 && 
         incidentForm.symptoms.length > 0 &&
         !incidentLoading.value;
});

const anomaliesTableData = computed(() => {
  if (!analysisResult.value?.anomalies) return [];

  return Object.entries(analysisResult.value.anomalies).map(([metric, data]) => ({
    key: metric,
    metric,
    avg_score: data.avg_score?.toFixed(3) || 'N/A',
    max_score: data.max_score?.toFixed(3) || 'N/A',
    count: data.count || 0,
    first_occurrence: data.first_occurrence || 'N/A',
    last_occurrence: data.last_occurrence || 'N/A',
    detection_methods: Object.keys(data.detection_methods || {}).join(', ') || 'N/A'
  }));
});

const anomaliesColumns = [
  { title: '指标名称', dataIndex: 'metric', key: 'metric', width: 200, ellipsis: true },
  { title: '平均分数', dataIndex: 'avg_score', key: 'avg_score', width: 100 },
  { title: '最高分数', dataIndex: 'max_score', key: 'max_score', width: 100 },
  { title: '异常次数', dataIndex: 'count', key: 'count', width: 100 },
  { title: '检测方法', dataIndex: 'detection_methods', key: 'detection_methods', width: 150, ellipsis: true },
  { title: '首次发现', dataIndex: 'first_occurrence', key: 'first_occurrence', width: 180 },
  { title: '最后发现', dataIndex: 'last_occurrence', key: 'last_occurrence', width: 180 }
];

// 工具函数
const getStatusColor = (status: string) => {
  switch (status) {
    case 'healthy': return 'green';
    case 'degraded': return 'orange';
    case 'unhealthy': return 'red';
    default: return 'default';
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'healthy': return '正常';
    case 'degraded': return '降级';
    case 'unhealthy': return '异常';
    default: return '未知';
  }
};

const getComponentName = (component: string) => {
  const nameMap: Record<string, string> = {
    prometheus: 'Prometheus',
    llm: 'LLM',
    detector: '检测器',
    correlator: '关联器'
  };
  return nameMap[component] || component;
};

const formatPercentage = (value: number) => {
  return `${(value * 100).toFixed(1)}%`;
};

const formatTimeRange = (timeRange: any) => {
  if (!timeRange) return '未知';
  return `${timeRange.start} - ${timeRange.end}`;
};

const formatRelatedMetrics = (metrics: string[] | undefined) => {
  return metrics?.join(', ') || '无';
};

const filterMetricOption = (input: string, option: any) => {
  return option.label.toLowerCase().includes(input.toLowerCase());
};

// 时间选择器的禁用日期函数
const disabledStartDate = (current: Dayjs) => {
  return current && current > dayjs().endOf('day');
};

const disabledEndDate = (current: Dayjs) => {
  return current && (current > dayjs().endOf('day') || 
    (analysisForm.startTime && current < analysisForm.startTime));
};

// API调用函数
const fetchHealthStatus = async () => {
  try {
    healthLoading.value = true;
    const response = await getRCAHealthApi();
    healthStatus.value = response;
    config.value.anomaly_threshold = response.config.anomaly_threshold;
    config.value.correlation_threshold = response.config.correlation_threshold;
  } catch (error: any) {
    console.error('获取健康状态失败:', error);
    message.error(`获取健康状态失败: ${error.message || '未知错误'}`);
  } finally {
    healthLoading.value = false;
  }
};

const fetchConfig = async () => {
  try {
    configLoading.value = true;
    const response = await getRCAConfigApi();
    config.value.anomaly_threshold = response.anomaly_detection?.threshold || 0.8;
    config.value.correlation_threshold = response.correlation_analysis?.threshold || 0.7;
  } catch (error: any) {
    console.error('获取配置失败:', error);
    message.error(`获取配置失败: ${error.message || '未知错误'}`);
  } finally {
    configLoading.value = false;
  }
};

const fetchAvailableMetrics = async () => {
  try {
    metricsLoading.value = true;
    const response = await getAvailableMetricsApi();
    availableMetrics.value = response;

    // 设置默认选中的指标
    if (response.default_metrics?.length > 0) {
      analysisForm.selectedMetrics = response.default_metrics.slice(0, 5);
    }
  } catch (error: any) {
    console.error('获取可用指标失败:', error);
    message.error(`获取可用指标失败: ${error.message || '未知错误'}`);
  } finally {
    metricsLoading.value = false;
  }
};

const handleConfigChange = async () => {
  try {
    await updateRCAConfigApi({
      anomaly_threshold: config.value.anomaly_threshold,
      correlation_threshold: config.value.correlation_threshold
    });
    message.success('配置更新成功');
  } catch (error: any) {
    console.error('更新配置失败:', error);
    message.error(`更新配置失败: ${error.message || '未知错误'}`);
  }
};

const performRootCauseAnalysis = async () => {
  if (!canPerformAnalysis.value) {
    message.warning('请检查分析参数');
    return;
  }

  try {
    analysisLoading.value = true;

    // 处理时间
    let start = new Date(analysisForm.startTime!.toISOString());
    let end = new Date(analysisForm.endTime!.toISOString());
    
    start.setSeconds(0, 0);
    end.setSeconds(0, 0);

    // 确保时间顺序正确
    if (start > end) {
      [start, end] = [end, start];
    }

    const requestData: RCARequest = {
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      metrics: analysisForm.selectedMetrics
    };

    const response = await executeRCAApi(requestData);

    if (response.error) {
      message.error(`分析失败: ${response.error}`);
      return;
    }

    analysisResult.value = response;
    activeResultTab.value = 'rca';
    message.success('根因分析完成');

    // 渲染相关性图表
    await nextTick();
    setTimeout(renderCorrelationChart, 100);
  } catch (error: any) {
    console.error('根因分析失败:', error);
    const errorMsg = error.response?.data?.error || error.message || '未知错误';
    message.error(`根因分析失败: ${errorMsg}`);
  } finally {
    analysisLoading.value = false;
  }
};

const analyzeIncident = async () => {
  if (!canPerformIncidentAnalysis.value) {
    message.warning('请检查事件参数');
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
    const errorMsg = error.response?.data?.error || error.message || '未知错误';
    message.error(`事件分析失败: ${errorMsg}`);
    incidentResult.value = { error: errorMsg };
    activeResultTab.value = 'incident';
  } finally {
    incidentLoading.value = false;
  }
};

const renderCorrelationChart = () => {
  const chartDom = correlationChartRef.value;
  if (!chartDom || !hasCorrelations.value) return;

  try {
    const myChart = echarts.init(chartDom);

    const correlations = analysisResult.value!.correlations;
    const metrics = Object.keys(correlations);
    const data: Array<[number, number, number]> = [];

    // 构建相关性矩阵数据
    metrics.forEach((metric1, i) => {
      metrics.forEach((metric2, j) => {
        let correlation = 0;

        if (correlations[metric1]) {
          const correlationPair = correlations[metric1].find(([m, _]) => m === metric2);
          if (correlationPair) {
            correlation = correlationPair[1];
          }
        }

        data.push([i, j, Math.abs(correlation)]);
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

    // 响应窗口大小变化
    const resizeHandler = () => myChart.resize();
    window.addEventListener('resize', resizeHandler);

    // 组件卸载时清理
    const cleanup = () => {
      window.removeEventListener('resize', resizeHandler);
      myChart.dispose();
    };

    return cleanup;
  } catch (error) {
    console.error('渲染相关性图表失败:', error);
  }
};

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
  incidentResult.value = null;
};

const refreshData = async () => {
  loading.value = true;
  try {
    await Promise.all([
      fetchHealthStatus(),
      fetchConfig(),
      fetchAvailableMetrics()
    ]);
    message.success('数据刷新成功');
  } catch (error) {
    message.error('刷新数据失败');
  } finally {
    loading.value = false;
  }
};

const closeFeedbackModal = () => {
  feedbackModalVisible.value = false;
};

// 监听相关性数据变化，重新渲染图表
watch(() => analysisResult.value?.correlations, () => {
  if (hasCorrelations.value) {
    nextTick(() => {
      setTimeout(renderCorrelationChart, 100);
    });
  }
}, { deep: true });

// 组件挂载时初始化
onMounted(() => {
  handleTimeRangeChange();
  refreshData();
});
</script>

<style scoped>
.rca-container {
  padding: 20px;
  min-height: 100vh;
  background-color: var(--ant-background-color-light, #fafafa);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--ant-border-color, #d9d9d9);
}

.title {
  font-size: 24px;
  font-weight: bold;
  margin: 0;
  background: linear-gradient(90deg, #1890ff, #52c41a);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.dashboard {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.status-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
}

.status-card {
  border-radius: 8px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.status-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
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
  margin-bottom: 8px;
  padding: 4px 0;
}

.config-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  gap: 8px;
}

.config-item span {
  flex: 1;
  font-weight: 500;
}

.metric-count {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 10px;
  color: var(--ant-primary-color, #1890ff);
}

.metric-categories {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.analysis-card,
.incident-card,
.results-card {
  border-radius: 8px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.analysis-card:hover,
.incident-card:hover,
.results-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
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
  margin-bottom: 8px;
  font-weight: 500;
  color: var(--ant-text-color, rgba(0, 0, 0, 0.85));
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid var(--ant-border-color, #f0f0f0);
}

.rca-results,
.incident-results {
  padding: 10px 0;
}

.result-section {
  margin-bottom: 32px;
  padding: 16px;
  background-color: #fafafa;
  border-radius: 8px;
}

.result-section h3 {
  margin-bottom: 16px;
  color: var(--ant-heading-color, rgba(0, 0, 0, 0.85));
  border-bottom: 2px solid #1890ff;
  padding-bottom: 8px;
  font-size: 16px;
  font-weight: 600;
}

.time-range-info {
  margin-top: 16px;
  padding: 12px;
  background-color: #f0f8ff;
  border: 1px solid #d4edda;
  border-radius: 6px;
}

.time-range-info p {
  margin-bottom: 6px;
  font-size: 14px;
}

.markdown-summary {
  background-color: #ffffff;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  padding: 20px;
  margin: 10px 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  max-height: 400px;
  overflow-y: auto;
}

.markdown-summary:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.candidate-stats {
  text-align: right;
  min-width: 120px;
}

.confidence-score {
  font-weight: bold;
  color: #1890ff;
  margin-bottom: 6px;
  font-size: 14px;
}

.anomaly-count {
  font-size: 12px;
  color: #666;
}

.candidate-details p {
  margin-bottom: 6px;
  font-size: 14px;
  line-height: 1.4;
}

.correlation-chart {
  height: 400px;
  border: 1px solid var(--ant-border-color, #d9d9d9);
  border-radius: 6px;
  background-color: #ffffff;
}

.metrics-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  max-height: 200px;
  overflow-y: auto;
  padding: 8px;
  background-color: #ffffff;
  border-radius: 6px;
}

.metric-tag {
  margin-bottom: 6px;
  font-size: 12px;
}

.incident-summary {
  text-align: left;
  max-width: 100%;
  margin: 0;
  padding: 16px;
  background-color: #fafafa;
  border-radius: 6px;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .status-cards {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .rca-container {
    padding: 12px;
  }

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

  .title {
    font-size: 20px;
  }

  .form-actions {
    flex-direction: column;
  }

  .correlation-chart {
    height: 300px;
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

/* 滚动条样式 */
.markdown-summary::-webkit-scrollbar,
.metrics-list::-webkit-scrollbar {
  width: 6px;
}

.markdown-summary::-webkit-scrollbar-track,
.metrics-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.markdown-summary::-webkit-scrollbar-thumb,
.metrics-list::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.markdown-summary::-webkit-scrollbar-thumb:hover,
.metrics-list::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 表格样式优化 */
:deep(.ant-table-thead > tr > th) {
  background-color: #fafafa;
  font-weight: 600;
}

:deep(.ant-table-tbody > tr:hover > td) {
  background-color: #f5f9ff;
}

/* 统计数据样式 */
:deep(.ant-statistic-title) {
  font-size: 14px;
  color: #666;
  margin-bottom: 4px;
}

:deep(.ant-statistic-content) {
  font-size: 20px;
  font-weight: 600;
  color: #1890ff;
}
</style>
