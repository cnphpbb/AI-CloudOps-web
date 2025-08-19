<template>
  <div class="correlation-detail">
    <a-page-header
      class="page-header"
      :title="`相关性分析详情 - ${jobId}`"
      sub-title="指标间相关性分析结果与洞察"
      @back="goBack"
    >
      <template #extra>
        <a-space>
          <a-button @click="loadCorrelationDetail" :loading="loading">
            <template #icon><reload-outlined /></template>
            刷新
          </a-button>
          <a-button type="primary" @click="exportResults" v-if="correlationDetail">
            <template #icon><download-outlined /></template>
            导出结果
          </a-button>
        </a-space>
      </template>
    </a-page-header>

    <div v-if="loading && !correlationDetail" class="loading-container">
      <a-spin size="large">
        <template #indicator>
          <loading-outlined style="font-size: 24px" spin />
        </template>
        <div class="loading-text">正在加载相关性分析详情...</div>
      </a-spin>
    </div>

    <div v-else-if="correlationDetail" class="detail-content">
      <!-- 分析概览 -->
      <a-card class="overview-card">
        <template #title>
          <a-space>
            <partition-outlined />
            分析概览
          </a-space>
        </template>
        
        <a-descriptions :column="3" bordered>
          <a-descriptions-item label="任务ID">
            <a-typography-text code>{{ jobId }}</a-typography-text>
          </a-descriptions-item>
          <a-descriptions-item label="目标指标">
            <a-tag color="processing">
              <line-chart-outlined />
              {{ correlationDetail.target_metric || '全部指标' }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="分析周期">
            <calendar-outlined class="period-icon" />
            {{ formatPeriod(correlationDetail.analysis_period) }}
          </a-descriptions-item>
          <a-descriptions-item label="相关指标数量">
            <a-badge :count="correlationDetail.correlations.correlations.length" show-zero>
              <bar-chart-outlined style="font-size: 16px" />
            </a-badge>
          </a-descriptions-item>
          <a-descriptions-item label="显著相关性">
            <a-tag color="success" v-if="significantCount > 0">
              {{ significantCount }} 个
            </a-tag>
            <a-tag color="default" v-else>无</a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="强相关性">
            <a-tag color="warning" v-if="strongCorrelations > 0">
              {{ strongCorrelations }} 个
            </a-tag>
            <a-tag color="default" v-else>无</a-tag>
          </a-descriptions-item>
        </a-descriptions>
      </a-card>

      <!-- 统计概览 -->
      <a-card title="统计概览" class="statistics-card">
        <template #title>
          <a-space>
            <pie-chart-outlined />
            统计概览
          </a-space>
        </template>
        
        <a-row :gutter="24">
          <a-col :span="6">
            <a-card size="small" class="stat-item" hoverable>
              <a-statistic
                title="显著相关性"
                :value="significantCount"
                suffix="个"
                class="stat-significant"
              >
                <template #prefix>
                  <check-circle-outlined style="color: #52c41a" />
                </template>
              </a-statistic>
            </a-card>
          </a-col>
          <a-col :span="6">
            <a-card size="small" class="stat-item" hoverable>
              <a-statistic
                title="强相关性"
                :value="strongCorrelations"
                suffix="个"
                class="stat-strong"
              >
                <template #prefix>
                  <thunder-outlined style="color: #fa8c16" />
                </template>
              </a-statistic>
              <a-typography-text type="secondary" class="stat-note">
                |r| > 0.7
              </a-typography-text>
            </a-card>
          </a-col>
          <a-col :span="6">
            <a-card size="small" class="stat-item" hoverable>
              <a-statistic
                title="平均相关系数"
                :value="averageCorrelation"
                :precision="3"
                class="stat-average"
              >
                <template #prefix>
                  <function-outlined style="color: #722ed1" />
                </template>
              </a-statistic>
            </a-card>
          </a-col>
          <a-col :span="6">
            <a-card size="small" class="stat-item" hoverable>
              <a-statistic
                title="最大相关系数"
                :value="maxCorrelation"
                :precision="3"
                class="stat-max"
              >
                <template #prefix>
                  <rise-outlined style="color: #1890ff" />
                </template>
              </a-statistic>
            </a-card>
          </a-col>
        </a-row>
      </a-card>

      <!-- 相关性结果 -->
      <a-card title="相关性分析结果" class="correlations-card">
        <template #title>
          <a-space>
            <radar-chart-outlined />
            相关性分析结果
          </a-space>
        </template>
        <template #extra>
          <a-select v-model:value="sortBy" style="width: 120px">
            <a-select-option value="correlation">按相关性</a-select-option>
            <a-select-option value="significance">按显著性</a-select-option>
            <a-select-option value="name">按名称</a-select-option>
          </a-select>
        </template>
        
        <div class="correlation-matrix">
          <div 
            v-for="result in sortedCorrelations" 
            :key="result.metric_name" 
            class="correlation-item"
          >
            <a-card 
              size="small" 
              class="metric-correlation-card"
              :class="getCorrelationCardClass(result.correlation_coefficient)"
            >
              <template #title>
                <a-space>
                  <line-chart-outlined />
                  <span class="metric-name">{{ result.metric_name }}</span>
                </a-space>
              </template>
              <template #extra>
                <a-tag 
                  :color="getCorrelationColor(result.correlation_coefficient)"
                  class="correlation-tag"
                >
                  {{ result.correlation_coefficient.toFixed(3) }}
                </a-tag>
              </template>
              
              <div class="correlation-content">
                <!-- 相关性显示条 -->
                <div class="correlation-bar-container">
                  <div class="correlation-bar">
                    <div class="bar-background">
                      <div class="bar-negative"></div>
                      <div class="bar-positive"></div>
                    </div>
                    <div 
                      class="bar-indicator" 
                      :style="{left: getIndicatorPosition(result.correlation_coefficient) + '%'}"
                      :class="getCorrelationClass(result.correlation_coefficient)"
                    ></div>
                  </div>
                  <div class="bar-labels">
                    <span class="label-negative">-1</span>
                    <span class="label-zero">0</span>
                    <span class="label-positive">+1</span>
                  </div>
                </div>
                
                <!-- 统计信息 -->
                <a-descriptions :column="1" size="small" class="correlation-stats">
                  <a-descriptions-item label="P-Value">
                    <a-typography-text code>{{ result.p_value.toFixed(4) }}</a-typography-text>
                  </a-descriptions-item>
                  <a-descriptions-item label="显著性">
                    <a-tag 
                      :color="result.significance ? 'success' : 'default'"
                      size="small"
                    >
                      <component :is="result.significance ? CheckCircleOutlined : MinusCircleOutlined" />
                      {{ result.significance ? '显著' : '不显著' }}
                    </a-tag>
                  </a-descriptions-item>
                  <a-descriptions-item label="趋势">
                    <a-tag 
                      :color="getTrendColor(result.trend)"
                      size="small"
                      class="trend-tag"
                    >
                      <component :is="getTrendIcon(result.trend)" />
                      {{ formatTrend(result.trend) }}
                    </a-tag>
                  </a-descriptions-item>
                </a-descriptions>
                
                <!-- 相关性强度指示 -->
                <div class="strength-indicator">
                  <a-typography-text type="secondary" class="strength-label">
                    相关性强度：
                  </a-typography-text>
                  <a-tag :color="getStrengthColor(result.correlation_coefficient)">
                    {{ getStrengthText(result.correlation_coefficient) }}
                  </a-tag>
                </div>
              </div>
            </a-card>
          </div>
        </div>
      </a-card>

      <!-- 洞察分析 -->
      <a-card title="洞察分析" class="insights-card">
        <template #title>
          <a-space>
            <bulb-outlined />
            洞察分析
          </a-space>
        </template>
        
        <a-list 
          :data-source="generateInsights()" 
          class="insights-list"
        >
          <template #renderItem="{ item, index }">
            <a-list-item>
              <a-list-item-meta>
                <template #avatar>
                  <a-avatar 
                    :style="{
                      backgroundColor: getInsightColor(index),
                      color: 'white'
                    }"
                    size="small"
                  >
                    {{ index + 1 }}
                  </a-avatar>
                </template>
                <template #title>
                  <a-typography-text>
                    洞察 {{ index + 1 }}
                  </a-typography-text>
                </template>
                <template #description>
                  <a-typography-paragraph class="insight-text">
                    {{ item }}
                  </a-typography-paragraph>
                </template>
              </a-list-item-meta>
            </a-list-item>
          </template>
        </a-list>
        
        <a-empty v-if="generateInsights().length === 0" description="暂无重要洞察" />
      </a-card>
    </div>

    <div v-else class="no-data">
      <a-empty description="未找到相关性分析结果">
        <template #image>
          <partition-outlined style="font-size: 64px; color: #d9d9d9" />
        </template>
        <a-button type="primary" @click="goBack">
          返回列表
        </a-button>
      </a-empty>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import dayjs from 'dayjs';
import {
  ReloadOutlined,
  DownloadOutlined,
  LoadingOutlined,
  PartitionOutlined,
  LineChartOutlined,
  CalendarOutlined,
  BarChartOutlined,
  PieChartOutlined,
  CheckCircleOutlined,
  MinusCircleOutlined,
  FunctionOutlined,
  RiseOutlined,
  RadarChartOutlined,
  BulbOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  MinusOutlined
} from '@ant-design/icons-vue';
import { getCorrelationDetailApi } from '#/api/core/rca';
import type { CorrelationAnalysisEntity } from '#/api/core/rca';

const route = useRoute();
const router = useRouter();
const jobId = ref(route.params.id as string);
const correlationDetail = ref<CorrelationAnalysisEntity | null>(null);
const loading = ref(false);
const sortBy = ref('correlation');

const significantCount = computed(() => {
  if (!correlationDetail.value) return 0;
  return correlationDetail.value.correlations.correlations.filter(c => c.significance).length;
});

const strongCorrelations = computed(() => {
  if (!correlationDetail.value) return 0;
  return correlationDetail.value.correlations.correlations.filter(c => Math.abs(c.correlation_coefficient) > 0.7).length;
});

const averageCorrelation = computed(() => {
  if (!correlationDetail.value || correlationDetail.value.correlations.correlations.length === 0) return 0;
  const sum = correlationDetail.value.correlations.correlations.reduce((acc, c) => acc + Math.abs(c.correlation_coefficient), 0);
  return sum / correlationDetail.value.correlations.correlations.length;
});

const maxCorrelation = computed(() => {
  if (!correlationDetail.value || correlationDetail.value.correlations.correlations.length === 0) return 0;
  const max = Math.max(...correlationDetail.value.correlations.correlations.map(c => Math.abs(c.correlation_coefficient)));
  return max;
});

const sortedCorrelations = computed(() => {
  if (!correlationDetail.value) return [];
  
  const correlations = [...correlationDetail.value.correlations.correlations];
  
  switch (sortBy.value) {
    case 'correlation':
      return correlations.sort((a, b) => Math.abs(b.correlation_coefficient) - Math.abs(a.correlation_coefficient));
    case 'significance':
      return correlations.sort((a, b) => {
        if (a.significance && !b.significance) return -1;
        if (!a.significance && b.significance) return 1;
        return Math.abs(b.correlation_coefficient) - Math.abs(a.correlation_coefficient);
      });
    case 'name':
      return correlations.sort((a, b) => a.metric_name.localeCompare(b.metric_name));
    default:
      return correlations;
  }
});

const loadCorrelationDetail = async () => {
  loading.value = true;
  try {
    const response = await getCorrelationDetailApi(jobId.value);
    correlationDetail.value = response.data || null;
  } catch (error) {
    console.error('Failed to load correlation detail:', error);
    message.error('加载相关性分析详情失败');
  } finally {
    loading.value = false;
  }
};

const exportResults = () => {
  if (!correlationDetail.value) return;
  
  const data = {
    job_id: jobId.value,
    analysis_period: correlationDetail.value.analysis_period,
    target_metric: correlationDetail.value.target_metric,
    correlations: correlationDetail.value.correlations.correlations,
    summary: {
      significant_count: significantCount.value,
      strong_correlations: strongCorrelations.value,
      average_correlation: averageCorrelation.value,
      max_correlation: maxCorrelation.value
    },
    insights: generateInsights(),
    export_time: new Date().toISOString()
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `correlation-analysis-${jobId.value}-${dayjs().format('YYYY-MM-DD-HH-mm')}.json`;
  a.click();
  URL.revokeObjectURL(url);
  
  message.success('相关性分析结果已导出');
};

const goBack = () => {
  router.back();
};

const formatPeriod = (period: Record<string, string>) => {
  if (!period.start || !period.end) return 'N/A';
  const start = dayjs(period.start).format('YYYY-MM-DD HH:mm');
  const end = dayjs(period.end).format('YYYY-MM-DD HH:mm');
  return `${start} ~ ${end}`;
};

const getCorrelationClass = (coefficient: number) => {
  const abs = Math.abs(coefficient);
  if (abs > 0.7) return 'strong';
  if (abs > 0.4) return 'moderate';
  return 'weak';
};

const getCorrelationColor = (coefficient: number) => {
  const abs = Math.abs(coefficient);
  if (abs > 0.7) return 'error';
  if (abs > 0.4) return 'warning';
  return 'default';
};

const getCorrelationCardClass = (coefficient: number) => {
  const abs = Math.abs(coefficient);
  if (abs > 0.7) return 'correlation-strong';
  if (abs > 0.4) return 'correlation-moderate';
  return 'correlation-weak';
};

const getIndicatorPosition = (coefficient: number) => {
  // Map from [-1, 1] to [0, 100]
  return (coefficient + 1) * 50;
};

const getStrengthColor = (coefficient: number) => {
  const abs = Math.abs(coefficient);
  if (abs > 0.7) return 'error';
  if (abs > 0.4) return 'warning';
  return 'default';
};

const getStrengthText = (coefficient: number) => {
  const abs = Math.abs(coefficient);
  if (abs > 0.7) return '强相关';
  if (abs > 0.4) return '中等相关';
  return '弱相关';
};

const getTrendColor = (trend: string) => {
  const trendLower = trend.toLowerCase();
  if (trendLower === 'positive') return 'success';
  if (trendLower === 'negative') return 'error';
  return 'default';
};

const getTrendIcon = (trend: string) => {
  const trendLower = trend.toLowerCase();
  if (trendLower === 'positive') return ArrowUpOutlined;
  if (trendLower === 'negative') return ArrowDownOutlined;
  return MinusOutlined;
};

const formatTrend = (trend: string) => {
  const trendMap = {
    'positive': '正相关',
    'negative': '负相关',
    'neutral': '无相关'
  };
  return trendMap[trend.toLowerCase() as keyof typeof trendMap] || trend;
};

const getInsightColor = (index: number) => {
  const colors = ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1'];
  return colors[index % colors.length];
};

const generateInsights = () => {
  if (!correlationDetail.value) return [];
  
  const insights: string[] = [];
  const correlations = correlationDetail.value.correlations.correlations;
  
  if (correlations.length === 0) return insights;
  
  // Find strongest positive correlation
  const strongestPositive = correlations.reduce((max, c) => 
    c.correlation_coefficient > max.correlation_coefficient ? c : max
  );
  
  if (strongestPositive && strongestPositive.correlation_coefficient > 0.5) {
    insights.push(`${strongestPositive.metric_name} 与目标指标具有最强的正相关性（${strongestPositive.correlation_coefficient.toFixed(3)}），表明它们具有相同的变化趋势。`);
  }
  
  // Find strongest negative correlation
  const strongestNegative = correlations.reduce((min, c) => 
    c.correlation_coefficient < min.correlation_coefficient ? c : min
  );
  
  if (strongestNegative && strongestNegative.correlation_coefficient < -0.5) {
    insights.push(`${strongestNegative.metric_name} 与目标指标具有最强的负相关性（${strongestNegative.correlation_coefficient.toFixed(3)}），表明它们具有相反的变化趋势。`);
  }
  
  // Count metrics with no significant correlation
  const nonSignificant = correlations.filter(c => !c.significance).length;
  if (nonSignificant > 0) {
    insights.push(`有 ${nonSignificant} 个指标与目标指标之间没有统计上显著的相关性，可能不适合作为预测因子。`);
  }
  
  // Identify clustering of correlations
  const highPositive = correlations.filter(c => c.correlation_coefficient > 0.7).length;
  if (highPositive > 2) {
    insights.push(`有 ${highPositive} 个指标与目标指标具有强正相关性，说明它们在系统中可能具有类似的作用机制。`);
  }
  
  // Average correlation insight
  if (averageCorrelation.value > 0.6) {
    insights.push(`平均相关系数达到 ${averageCorrelation.value.toFixed(3)}，表明整体相关性较强，大部分指标都与目标指标有一定的相关性。`);
  } else if (averageCorrelation.value < 0.3) {
    insights.push(`平均相关系数仅为 ${averageCorrelation.value.toFixed(3)}，说明大部分指标与目标指标的相关性较弱，需要进一步分析其他影响因素。`);
  }
  
  return insights;
};

onMounted(() => {
  loadCorrelationDetail();
});
</script>

<style scoped>
.correlation-detail {
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
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.overview-card,
.statistics-card,
.correlations-card,
.insights-card {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border-radius: 8px;
}

.period-icon {
  margin-right: 6px;
  color: #8c8c8c;
}

.stat-item {
  text-align: center;
  transition: transform 0.3s;
}

.stat-item:hover {
  transform: translateY(-2px);
}

.stat-note {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  text-align: center;
}

.correlation-matrix {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 16px;
}

.metric-correlation-card {
  transition: all 0.3s;
  border-radius: 6px;
}

.metric-correlation-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.correlation-strong {
  border-left: 4px solid #ff4d4f;
}

.correlation-moderate {
  border-left: 4px solid #faad14;
}

.correlation-weak {
  border-left: 4px solid #d9d9d9;
}

.metric-name {
  font-weight: 500;
  color: #262626;
}

.correlation-tag {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-weight: 700;
}

.correlation-content {
  padding-top: 16px;
}

.correlation-bar-container {
  margin-bottom: 16px;
}

.correlation-bar {
  position: relative;
  height: 20px;
  margin-bottom: 8px;
  border-radius: 10px;
  overflow: hidden;
}

.bar-background {
  display: flex;
  height: 100%;
}

.bar-negative {
  flex: 1;
  background: linear-gradient(to right, #ff7875, #ffaaa5);
}

.bar-positive {
  flex: 1;
  background: linear-gradient(to left, #73d13d, #95de64);
}

.bar-indicator {
  position: absolute;
  top: -2px;
  width: 4px;
  height: 24px;
  background: #262626;
  transform: translateX(-50%);
  border-radius: 2px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

.bar-indicator.strong {
  background: #ff4d4f;
  box-shadow: 0 1px 3px rgba(255, 77, 79, 0.3);
}

.bar-indicator.moderate {
  background: #faad14;
  box-shadow: 0 1px 3px rgba(250, 173, 20, 0.3);
}

.bar-indicator.weak {
  background: #8c8c8c;
  box-shadow: 0 1px 3px rgba(140, 140, 140, 0.3);
}

.bar-labels {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #8c8c8c;
}

.label-negative {
  color: #ff4d4f;
}

.label-positive {
  color: #52c41a;
}

.label-zero {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}

.correlation-stats {
  margin-bottom: 16px;
}

.strength-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
}

.strength-label {
  font-size: 13px;
}

.trend-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.insights-list {
  max-height: 400px;
  overflow-y: auto;
}

.insight-text {
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
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

:deep(.ant-statistic-title) {
  font-size: 14px;
  margin-bottom: 8px;
  color: #8c8c8c;
}

:deep(.ant-statistic-content) {
  font-size: 20px;
  font-weight: 600;
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
  .correlation-detail {
    padding: 16px;
  }
  
  .statistics-card .ant-col {
    margin-bottom: 16px;
  }
  
  .correlation-matrix {
    grid-template-columns: 1fr;
  }
  
  .overview-card .ant-descriptions {
    column: 1;
  }
}
</style>
