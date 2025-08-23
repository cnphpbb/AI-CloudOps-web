<template>
  <div class="rca-analysis">
    <div class="page-header">
      <h1 class="page-title">
        <PartitionOutlined class="title-icon" />
        根因分析
      </h1>
      <div class="header-actions">
        <a-button @click="resetForm">
          <ClearOutlined />
          重置
        </a-button>
        <a-button type="primary" @click="startAnalysis" :loading="analyzing" :disabled="!isFormValid">
          <PlayCircleOutlined />
          开始分析
        </a-button>
      </div>
    </div>

    <a-row :gutter="[24, 24]">
      <a-col :xs="24" :lg="8">
        <a-card title="分析配置" class="config-card">
          <a-form :model="formData" layout="vertical">
            <a-form-item label="Kubernetes命名空间" name="namespace" required>
              <a-input
                v-model:value="formData.namespace"
                placeholder="输入要分析的K8s命名空间"
                :status="!formData.namespace ? 'warning' : ''"
              />
              <div v-if="!formData.namespace" class="form-error">
                请输入Kubernetes命名空间
              </div>
            </a-form-item>

            <a-form-item label="分析时间窗口" name="timeWindowHours">
              <a-slider
                v-model:value="formData.timeWindowHours"
                :min="0.5"
                :max="24"
                :marks="timeMarks"
                :step="0.5"
                :tipFormatter="(value: number) => `${value}小时`"
              />
            </a-form-item>

            <a-form-item label="要分析的Prometheus指标" name="metrics">
              <a-select
                v-model:value="formData.metrics"
                mode="multiple"
                placeholder="选择要分析的指标"
                :loading="loadingMetrics"
                :options="availableMetrics"
                show-search
                :filter-option="filterMetrics"
                max-tag-count="responsive"
              />
              <a-button size="small" @click="loadAvailableMetrics" :loading="loadingMetrics" style="margin-top: 8px;">
                <ReloadOutlined />
                刷新指标列表
              </a-button>
            </a-form-item>

            <a-collapse ghost>
              <a-collapse-panel key="advanced" header="高级选项">
                <a-form-item name="includeEvents">
                  <a-checkbox v-model:checked="formData.includeEvents">
                    包含Kubernetes事件分析
                  </a-checkbox>
                </a-form-item>

                <a-form-item name="includeLogs">
                  <a-checkbox v-model:checked="formData.includeLogs">
                    包含日志分析
                  </a-checkbox>
                </a-form-item>

                <a-form-item name="enableAiInsights">
                  <a-checkbox v-model:checked="formData.enableAiInsights">
                    启用AI洞察
                  </a-checkbox>
                </a-form-item>

                <a-form-item label="分析深度" name="analysisDepth">
                  <a-radio-group v-model:value="formData.analysisDepth" button-style="solid">
                    <a-radio-button value="shallow">简单</a-radio-button>
                    <a-radio-button value="normal">标准</a-radio-button>
                    <a-radio-button value="deep">深度</a-radio-button>
                  </a-radio-group>
                </a-form-item>
              </a-collapse-panel>
            </a-collapse>
          </a-form>
        </a-card>
      </a-col>

      <a-col :xs="24" :lg="16">
        <a-card title="根因分析结果" class="result-card" v-if="analysisResult">
          <template #extra>
            <a-space>
              <a-tag color="processing">{{ analysisResult.analysis_id }}</a-tag>
              <a-tag :color="getConfidenceColor(analysisResult.confidence_score)">
                置信度: {{ ((analysisResult.confidence_score || 0) * 100).toFixed(1) }}%
              </a-tag>
              <a-tag :color="analysisResult.status === 'completed' ? 'green' : 'orange'">
                {{ getAnalysisStatusText(analysisResult.status) }}
              </a-tag>
              <a-button size="small" @click="exportResult">
                <DownloadOutlined />
                导出
              </a-button>
            </a-space>
          </template>
          
          <a-tabs v-model:activeKey="activeResultTab" @change="onResultTabChange">
            <a-tab-pane key="root-causes" tab="根因分析">
              <div class="root-causes-section">
                <div class="analysis-info" v-if="analysisResult">
                  <div class="info-item">
                    <span class="info-label">命名空间:</span>
                    <a-tag color="blue">{{ analysisResult.namespace }}</a-tag>
                  </div>
                  <div class="info-item">
                    <span class="info-label">分析时间:</span>
                    <span>{{ formatTime(analysisResult.timestamp) }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">时间窗口:</span>
                    <span>{{ analysisResult.time_window_hours }}小时</span>
                  </div>
                </div>
                
                <a-divider />
                
                <div v-if="analysisResult.root_causes?.length" class="root-causes-list">
                  <div 
                    v-for="(cause, index) in analysisResult.root_causes" 
                    :key="index" 
                    class="root-cause-item"
                  >
                    <div class="cause-header">
                      <div class="cause-type">
                        <component :is="getCauseTypeIcon(getRootCauseType(cause))" />
                        <span>{{ getRootCauseType(cause) }}</span>
                      </div>
                      <a-tag :color="getConfidenceColor(getRootCauseConfidence(cause))">
                        {{ (getRootCauseConfidence(cause) * 100).toFixed(1) }}%
                      </a-tag>
                    </div>
                    <div class="cause-description">{{ getRootCauseDescription(cause) }}</div>
                    <div class="cause-evidence" v-if="getRootCauseEvidence(cause)">
                      <div class="evidence-title">证据:</div>
                      <div class="evidence-content">{{ JSON.stringify(getRootCauseEvidence(cause), null, 2) }}</div>
                    </div>
                    <div class="cause-recommendations" v-if="getRootCauseRecommendations(cause)?.length">
                      <div class="recommendations-title">建议:</div>
                      <ul class="recommendations-list">
                        <li v-for="rec in getRootCauseRecommendations(cause)" :key="rec">{{ rec }}</li>
                      </ul>
                    </div>
                  </div>
                </div>
                <a-empty v-else description="未发现明确的根因">
                  <template #image>
                    <SearchOutlined style="font-size: 48px; color: #bfbfbf;" />
                  </template>
                </a-empty>
              </div>
            </a-tab-pane>

            <a-tab-pane key="anomalies" tab="异常检测">
              <div v-if="getAnomaliesData().length > 0" class="anomalies-section">
                <div ref="anomalyChartRef" class="chart-container"></div>
                <div class="anomalies-table">
                  <h4>异常详情</h4>
                  <a-table 
                    :dataSource="getAnomaliesData()"
                    :columns="anomalyColumns"
                    :pagination="false"
                    size="small"
                    row-key="name"
                  >
                    <template #bodyCell="{ column, record }">
                      <template v-if="column.key === 'score'">
                        <a-progress 
                          :percent="record.score * 100" 
                          :stroke-color="getAnomalyColor(record.score)"
                          size="small"
                        />
                      </template>
                      <template v-if="column.key === 'timestamp'">
                        {{ formatTime(record.timestamp) }}
                      </template>
                    </template>
                  </a-table>
                </div>
              </div>
              <a-empty v-else description="未检测到异常数据">
                <template #image>
                  <SearchOutlined style="font-size: 48px; color: #bfbfbf;" />
                </template>
              </a-empty>
            </a-tab-pane>

            <a-tab-pane key="correlations" tab="关联分析">
              <div class="correlations-section">
                <div v-if="analysisResult.correlations?.length" class="correlations-list">
                  <div 
                    v-for="(correlation, index) in analysisResult.correlations" 
                    :key="index" 
                    class="correlation-item"
                  >
                    <div class="correlation-header">
                      <div class="correlation-type">{{ getCorrelationType(correlation) }}</div>
                      <a-tag :color="getConfidenceColor(getCorrelationConfidence(correlation))">
                        置信度: {{ (getCorrelationConfidence(correlation) * 100).toFixed(1) }}%
                      </a-tag>
                    </div>
                    <div class="correlation-evidence" v-if="getCorrelationEvidence(correlation)?.length">
                      <div class="evidence-title">证据:</div>
                      <ul class="evidence-list">
                        <li v-for="evidence in getCorrelationEvidence(correlation)" :key="evidence">{{ evidence }}</li>
                      </ul>
                    </div>
                    <div class="correlation-timeline" v-if="getCorrelationTimeline(correlation)?.length">
                      <div class="timeline-title">时间线:</div>
                      <div class="timeline-content">
                        <div 
                          v-for="(event, eventIndex) in getCorrelationTimeline(correlation)" 
                          :key="eventIndex"
                          class="timeline-event"
                        >
                          <span class="event-time">{{ formatTime(event.timestamp) }}</span>
                          <span class="event-description">{{ event.description || event.message || JSON.stringify(event) }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <a-empty v-else description="未发现明显的关联性">
                  <template #image>
                    <NodeIndexOutlined style="font-size: 48px; color: #bfbfbf;" />
                  </template>
                </a-empty>
              </div>
            </a-tab-pane>

            <a-tab-pane key="timeline" tab="事件时间线">
              <div v-if="getTimelineEvents()?.length" class="timeline-section">
                <div ref="timelineChartRef" class="chart-container"></div>
                <div class="timeline-details">
                  <h4>时间线详情</h4>
                  <div class="timeline-events">
                    <div 
                      v-for="(event, index) in getTimelineEvents()" 
                      :key="index"
                      class="timeline-event-detail"
                    >
                      <div class="event-timestamp">{{ formatTime(event.timestamp) }}</div>
                      <div class="event-content">{{ event.description || event.message || JSON.stringify(event) }}</div>
                    </div>
                  </div>
                </div>
              </div>
              <a-empty v-else description="暂无时间线数据">
                <template #image>
                  <ClockCircleOutlined style="font-size: 48px; color: #bfbfbf;" />
                </template>
              </a-empty>
            </a-tab-pane>
          </a-tabs>
        </a-card>

        <a-card v-else class="empty-result-card">
          <a-empty description="暂无分析结果">
            <template #image>
              <PartitionOutlined style="font-size: 64px; color: #bfbfbf;" />
            </template>
            <a-button type="primary" @click="startAnalysis" :loading="analyzing" :disabled="!isFormValid">
              开始根因分析
            </a-button>
          </a-empty>
        </a-card>

        <a-card title="修复建议" class="recommendations-card" v-if="getRecommendations()?.length">
          <div class="recommendations-list">
            <div 
              v-for="(rec, index) in getRecommendations()" 
              :key="index" 
              class="recommendation-item"
            >
              <div class="rec-icon">
                <BulbOutlined />
              </div>
              <div class="rec-content">
                <div class="rec-text">{{ rec }}</div>
              </div>
            </div>
          </div>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick, onUnmounted } from 'vue';
import * as echarts from 'echarts';
import { message } from 'ant-design-vue';
import {
  PartitionOutlined,
  ClearOutlined,
  PlayCircleOutlined,
  DownloadOutlined,
  SearchOutlined,
  NodeIndexOutlined,
  ReloadOutlined,
  BulbOutlined,
  ClockCircleOutlined
} from '@ant-design/icons-vue';
import {
  analyzeRootCause,
  getAllPrometheusMetrics,
  type RCAAnalyzeRequest,
  type RCAAnalysisResponse
} from '#/api/core/rca';

const analyzing = ref(false);
const loadingMetrics = ref(false);
const activeResultTab = ref('root-causes');
const analysisResult = ref<RCAAnalysisResponse | null>(null);
const availableMetrics = ref<Array<{label: string, value: string}>>([]);

const anomalyChartRef = ref<HTMLElement>();
const timelineChartRef = ref<HTMLElement>();
let anomalyChart: echarts.ECharts | null = null;
let timelineChart: echarts.ECharts | null = null;

const formData = reactive({
  namespace: '',
  timeWindowHours: 1,
  metrics: [] as string[],
  includeEvents: true,
  includeLogs: true,
  enableAiInsights: true,
  analysisDepth: 'normal'
});

const timeMarks = {
  0.5: '30m',
  1: '1h',
  3: '3h',
  6: '6h',
  12: '12h',
  24: '24h'
};


const anomalyColumns = [
  {
    title: '异常项',
    dataIndex: 'name',
    key: 'name',
    width: 200
  },
  {
    title: '异常分数',
    dataIndex: 'score',
    key: 'score',
    width: 150
  },
  {
    title: '时间戳',
    dataIndex: 'timestamp',
    key: 'timestamp',
    width: 180
  },
  {
    title: '描述',
    dataIndex: 'description',
    key: 'description'
  }
];


const isFormValid = computed(() => {
  return formData.namespace.trim() !== '' && formData.timeWindowHours > 0;
});

const loadAvailableMetrics = async () => {
  loadingMetrics.value = true;
  try {
    const response = await getAllPrometheusMetrics();
    const metrics = response.items || [];
    availableMetrics.value = metrics.map((metric: string) => ({
      label: metric,
      value: metric
    }));
    message.success('指标列表已更新');
  } catch (error) {
    console.error('获取指标列表失败:', error);
    message.error('获取指标列表失败');
  } finally {
    loadingMetrics.value = false;
  }
};

const filterMetrics = (input: string, option: any) => {
  return option.label.toLowerCase().includes(input.toLowerCase());
};

const startAnalysis = async () => {
  if (!isFormValid.value) {
    message.warning('请填写完整的分析参数');
    return;
  }

  analyzing.value = true;
  try {
    const request: RCAAnalyzeRequest = {
      namespace: formData.namespace,
      time_window_hours: formData.timeWindowHours,
      metrics: formData.metrics.length > 0 ? formData.metrics : undefined
    };

    const response = await analyzeRootCause(request);
    analysisResult.value = response;
    
    await nextTick();
    initCharts();
    message.success('根因分析完成');
  } catch (error) {
    console.error('根因分析失败:', error);
    message.error('根因分析失败，请检查输入参数');
  } finally {
    analyzing.value = false;
  }
};

const initCharts = () => {
  initAnomalyChart();
  initTimelineChart();
};


const getAnomaliesData = () => {
  if (!analysisResult.value || !analysisResult.value.anomalies) return [];
  
  const anomalies = analysisResult.value.anomalies;
  if (typeof anomalies === 'object' && anomalies !== null) {
    return Object.entries(anomalies).map(([key, value]: [string, any]) => ({
      name: key,
      score: value.anomaly_score || value.score || 0,
      timestamp: value.timestamp || new Date().toISOString(),
      description: value.description || value.reason || '无描述'
    }));
  }
  return [];
};


const getAnomalyColor = (score: number) => {
  if (score > 0.8) return '#ff4d4f';
  if (score > 0.6) return '#faad14';
  if (score > 0.3) return '#1890ff';
  return '#52c41a';
};

const initAnomalyChart = () => {
  if (!anomalyChartRef.value) return;

  anomalyChart = echarts.init(anomalyChartRef.value);

  const anomalyData = getAnomaliesData();
  if (anomalyData.length === 0) {

    const option = {
      title: {
        text: '暂无异常数据',
        left: 'center',
        top: 'middle',
        textStyle: {
          color: '#bfbfbf',
          fontSize: 16
        }
      },
      grid: { left: 0, right: 0, top: 10, bottom: 0 },
      xAxis: { type: 'category', show: false, data: [] },
      yAxis: { type: 'value', show: false },
      series: []
    };
    anomalyChart.setOption(option);
    return;
  }

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' }
    },
    legend: {
      data: ['异常分数'],
      textStyle: { color: 'var(--ant-text-color)' }
    },
    grid: {
      left: '10%',
      right: '5%',
      top: '15%',
      bottom: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: anomalyData.map(item => formatTimeForChart(item.timestamp)),
      axisLine: { lineStyle: { color: 'var(--ant-border-color)' } },
      axisLabel: {
        rotate: 45,
        interval: 0
      }
    },
    yAxis: {
      type: 'value',
      name: '异常分数',
      min: 0,
      max: 1,
      axisLine: { lineStyle: { color: 'var(--ant-border-color)' } },
      splitLine: { lineStyle: { color: 'var(--ant-border-color-split)' } }
    },
    series: [
      {
        name: '异常分数',
        type: 'line',
        data: anomalyData.map(item => item.score),
        smooth: true,
        lineStyle: { width: 3, color: '#ff4d4f' },
        areaStyle: { opacity: 0.2, color: '#ff4d4f' },
        markLine: {
          data: [{
            type: 'average',
            name: '平均值'
          }]
        }
      }
    ]
  };

  anomalyChart.setOption(option);
  

  setTimeout(() => {
    anomalyChart?.resize();
  }, 100);
};

const initTimelineChart = () => {
  if (!timelineChartRef.value || !analysisResult.value) return;

  timelineChart = echarts.init(timelineChartRef.value);

  const timelineEvents = getTimelineEvents();
  const timelineData = timelineEvents.map((event: any, index: number) => ({
    name: event.event_type || event.type || `事件${index + 1}`,
    value: [
      formatTimeForChart(event.timestamp),
      index,
      event.severity || 'info',
      event.description || event.message || ''
    ]
  }));

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        const data = params.value;
        return `时间: ${data[0]}<br/>事件: ${params.name}<br/>描述: ${data[3]}`;
      }
    },
    grid: {
      left: '10%',
      right: '5%',
      top: '15%',
      bottom: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: timelineEvents.map((event: any) => formatTimeForChart(event.timestamp)),
      axisLine: { lineStyle: { color: 'var(--ant-border-color)' } },
      axisLabel: {
        rotate: 45,
        interval: 0
      }
    },
    yAxis: {
      type: 'value',
      name: '事件序列',
      axisLine: { lineStyle: { color: 'var(--ant-border-color)' } },
      splitLine: { lineStyle: { color: 'var(--ant-border-color-split)' } }
    },
    series: [
      {
        name: '事件时间线',
        type: 'scatter',
        data: timelineData,
        symbolSize: (data: any) => {
          const severity = data[2];
          switch (severity) {
            case 'critical': return 20;
            case 'warning': return 15;
            default: return 10;
          }
        },
        itemStyle: {
          color: (params: any) => {
            const severity = params.value[2];
            switch (severity) {
              case 'critical': return '#ff4d4f';
              case 'warning': return '#faad14';
              default: return '#1890ff';
            }
          }
        }
      }
    ]
  };

  timelineChart.setOption(option);
  

  setTimeout(() => {
    timelineChart?.resize();
  }, 100);
};

const onResultTabChange = (key: string) => {
  activeResultTab.value = key;
  nextTick(() => {
    switch (key) {
      case 'anomalies':
        setTimeout(() => {
          initAnomalyChart();
        }, 50);
        break;
      case 'timeline':
        setTimeout(() => {
          initTimelineChart();
        }, 50);
        break;
    }
  });
};

const getConfidenceColor = (confidence?: number) => {
  if (!confidence) return 'default';
  if (confidence > 0.8) return 'green';
  if (confidence > 0.6) return 'orange';
  return 'red';
};

const getCauseTypeIcon = (causeType: string) => {
  switch (causeType.toLowerCase()) {
    case 'resource': 
    case 'network': 
    case 'application': 
    case 'configuration': 
    default: 
      return 'SearchOutlined';
  }
};


const getRootCauseType = (cause: Record<string, any>) => {
  return cause.cause_type || cause.type || '未知类型';
};

const getRootCauseConfidence = (cause: Record<string, any>) => {
  return cause.confidence || 0;
};

const getRootCauseDescription = (cause: Record<string, any>) => {
  return cause.description || '无描述信息';
};

const getRootCauseEvidence = (cause: Record<string, any>) => {
  return cause.evidence;
};

const getRootCauseRecommendations = (cause: Record<string, any>) => {
  return cause.recommendations || [];
};


const getCorrelationType = (correlation: Record<string, any>) => {
  return correlation.correlation_type || correlation.type || '未知关联类型';
};

const getCorrelationConfidence = (correlation: Record<string, any>) => {
  return correlation.confidence || 0;
};

const getCorrelationEvidence = (correlation: Record<string, any>) => {
  return correlation.evidence || [];
};

const getCorrelationTimeline = (correlation: Record<string, any>) => {
  return correlation.timeline || [];
};


const getTimelineEvents = () => {
  if (!analysisResult.value) return [];
  
  const timelineEvents: any[] = [];
  if (analysisResult.value.correlations) {
    analysisResult.value.correlations.forEach((correlation: any) => {
      if (correlation.timeline && Array.isArray(correlation.timeline)) {
        timelineEvents.push(...correlation.timeline);
      }
    });
  }
  
  // 从根因分析的证据中提取事件
  if (analysisResult.value.root_causes) {
    analysisResult.value.root_causes.forEach((cause: any) => {
      if (cause.evidence && cause.evidence.events && Array.isArray(cause.evidence.events)) {
        timelineEvents.push(...cause.evidence.events.map((event: any) => ({
          ...event,
          event_type: event.reason || 'Event',
          description: event.message || event.reason || 'Unknown event'
        })));
      }
    });
  }
  
  return timelineEvents;
};

// 分析状态文本
const getAnalysisStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    'completed': '已完成',
    'running': '运行中',
    'failed': '失败',
    'pending': '等待中'
  };
  return statusMap[status] || status;
};

// 获取修复建议
const getRecommendations = () => {
  if (!analysisResult.value || !analysisResult.value.recommendations) return [];
  
  const recommendations = analysisResult.value.recommendations;
  if (Array.isArray(recommendations)) {
    return recommendations.flatMap((rec: any) => {
      if (typeof rec === 'string') {
        try {
          // 尝试解析JSON字符串
          const parsed = JSON.parse(rec);
          return Array.isArray(parsed) ? parsed : [rec];
        } catch {
          return [rec];
        }
      }
      return Array.isArray(rec) ? rec : [rec];
    });
  }
  
  return [];
};

// 时间转换工具函数：UTC转北京时间
const convertToBeijingTime = (utcTimestamp: string | Date): Date => {
  const date = typeof utcTimestamp === 'string' ? new Date(utcTimestamp) : utcTimestamp;
  // 北京时间 = UTC时间 + 8小时
  return new Date(date.getTime() + 8 * 60 * 60 * 1000);
};

const formatTime = (timestamp?: string) => {
  if (!timestamp) return '未知';
  const beijingTime = convertToBeijingTime(timestamp);
  return beijingTime.toLocaleString('zh-CN', { 
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

const formatTimeForChart = (timestamp: string | Date): string => {
  const beijingTime = convertToBeijingTime(timestamp);
  return beijingTime.toLocaleTimeString('zh-CN', {
    timeZone: 'Asia/Shanghai',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const resetForm = () => {
  Object.assign(formData, {
    namespace: '',
    timeWindowHours: 1,
    metrics: [],
    includeEvents: true,
    includeLogs: true,
    enableAiInsights: true,
    analysisDepth: 'normal'
  });
  analysisResult.value = null;
  message.success('表单已重置');
};

const exportResult = () => {
  if (!analysisResult.value) return;
  
  const data = JSON.stringify(analysisResult.value, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `rca-analysis-result-${Date.now()}.json`;
  link.click();
  
  URL.revokeObjectURL(url);
  message.success('分析结果已导出');
};

// 图表resize处理函数
const handleResize = () => {
  if (anomalyChart) {
    anomalyChart.resize();
  }
  if (timelineChart) {
    timelineChart.resize();
  }
};

onMounted(() => {
  loadAvailableMetrics();
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  anomalyChart?.dispose();
  timelineChart?.dispose();
  window.removeEventListener('resize', handleResize);
});
</script>

<style scoped>
.rca-analysis {
  padding: 24px;
  background-color: var(--ant-background-color-light, #fafafa);
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--ant-border-color, #d9d9d9);
}

.page-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 24px;
  font-weight: bold;
  margin: 0;
  background: linear-gradient(90deg, #fa541c, #ff7875);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.title-icon {
  font-size: 28px;
  color: #fa541c;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.config-card,
.result-card,
.empty-result-card,
.recommendations-card {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;
}

.form-error {
  color: #ff4d4f;
  font-size: 12px;
  margin-top: 4px;
  line-height: 1.4;
}

.chart-container {
  height: 400px;
  width: 100%;
  overflow: hidden;
  position: relative;
}

.empty-result-card {
  text-align: center;
  padding: 48px 24px;
}

.root-causes-section {
  max-height: 500px;
  overflow-y: auto;
}

.root-causes-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.root-cause-item {
  padding: 16px;
  border: 1px solid var(--ant-border-color-split);
  border-radius: 8px;
  transition: all 0.3s;
}

.root-cause-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.cause-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.cause-type {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: var(--ant-text-color);
}

.cause-description {
  margin-bottom: 12px;
  color: var(--ant-text-color);
  line-height: 1.5;
}

.cause-components {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.components-label {
  font-size: 12px;
  color: var(--ant-text-color-secondary);
}

.anomalies-section {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.anomalies-table h4 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--ant-text-color);
}

.correlations-section {
  max-height: 500px;
  overflow-y: auto;
}

.correlations-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.correlation-item {
  padding: 16px;
  border: 1px solid var(--ant-border-color-split);
  border-radius: 8px;
}

.correlation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.correlation-type {
  font-size: 16px;
  font-weight: 600;
  color: var(--ant-text-color);
}

.correlation-evidence {
  color: var(--ant-text-color);
}

.evidence-title {
  font-weight: 500;
  margin-bottom: 8px;
}

.evidence-list {
  margin: 0;
  padding-left: 20px;
}

.evidence-list li {
  margin-bottom: 4px;
  line-height: 1.4;
}

.recommendations-list {
  max-height: 300px;
  overflow-y: auto;
}

.recommendation-item {
  display: flex;
  gap: 16px;
  padding: 16px 0;
  border-bottom: 1px solid var(--ant-border-color-split);
}

.recommendation-item:last-child {
  border-bottom: none;
}

.rec-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  background: linear-gradient(135deg, #faad14, #ffc53d);
  color: white;
}

.rec-content {
  flex: 1;
}

.rec-text {
  font-size: 14px;
  line-height: 1.5;
  color: var(--ant-text-color);
}

/* 分析信息样式 */
.analysis-info {
  display: flex;
  gap: 24px;
  margin-bottom: 16px;
  padding: 16px;
  background-color: var(--ant-background-color-light);
  border-radius: 8px;
}

.analysis-info .info-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.analysis-info .info-label {
  font-weight: 500;
  color: var(--ant-text-color-secondary);
}

/* 证据和建议样式 */
.cause-evidence,
.cause-recommendations {
  margin-top: 12px;
  padding: 12px;
  background-color: var(--ant-background-color-light);
  border-radius: 6px;
  border-left: 3px solid #1890ff;
}

.evidence-title,
.recommendations-title {
  font-weight: 600;
  color: var(--ant-text-color);
  margin-bottom: 8px;
}

.evidence-content {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 12px;
  color: var(--ant-text-color-secondary);
  background-color: #f6f8fa;
  padding: 8px;
  border-radius: 4px;
  overflow-x: auto;
}

.recommendations-list {
  margin: 0;
  padding-left: 20px;
}

.recommendations-list li {
  margin-bottom: 4px;
  line-height: 1.4;
}

/* 关联分析时间线样式 */
.correlation-timeline {
  margin-top: 12px;
  padding: 12px;
  background-color: var(--ant-background-color-light);
  border-radius: 6px;
  border-left: 3px solid #52c41a;
}

.timeline-title {
  font-weight: 600;
  color: var(--ant-text-color);
  margin-bottom: 8px;
}

.timeline-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.timeline-event {
  display: flex;
  gap: 12px;
  padding: 8px;
  background-color: white;
  border-radius: 4px;
  border: 1px solid var(--ant-border-color-split);
}

.event-time {
  font-size: 12px;
  color: var(--ant-text-color-secondary);
  white-space: nowrap;
  min-width: 120px;
}

.event-description {
  font-size: 14px;
  color: var(--ant-text-color);
}

/* 时间线详情样式 */
.timeline-section {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.timeline-details h4 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--ant-text-color);
}

.timeline-events {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 300px;
  overflow-y: auto;
}

.timeline-event-detail {
  display: flex;
  gap: 16px;
  padding: 12px;
  border: 1px solid var(--ant-border-color-split);
  border-radius: 6px;
  background-color: var(--ant-background-color-light);
}

.event-timestamp {
  font-size: 12px;
  color: var(--ant-text-color-secondary);
  white-space: nowrap;
  min-width: 140px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

.event-content {
  font-size: 14px;
  color: var(--ant-text-color);
  line-height: 1.4;
}

@media (max-width: 1200px) {
  .rca-analysis :deep(.ant-col-lg-8) {
    margin-bottom: 24px;
  }
}

@media (max-width: 768px) {
  .rca-analysis {
    padding: 16px;
  }
  
  .page-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  
  .header-actions {
    justify-content: center;
  }
  
  .chart-container {
    height: 300px;
  }
  
  .analysis-info {
    flex-direction: column;
    gap: 12px;
  }
  
  .timeline-event,
  .timeline-event-detail {
    flex-direction: column;
    gap: 8px;
  }
  
  .event-time,
  .event-timestamp {
    min-width: auto;
  }
}
</style>
