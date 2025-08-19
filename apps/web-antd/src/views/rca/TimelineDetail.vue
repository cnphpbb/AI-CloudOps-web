<template>
  <div class="timeline-detail">
    <a-page-header
      class="page-header"
      :title="`时间线分析详情 - ${recordId}`"
      sub-title="事件时间线的详细分析结果与时序关系展示"
      @back="goBack"
    >
      <template #extra>
        <a-space>
          <a-button @click="refreshDetail" :loading="loading">
            <template #icon><reload-outlined /></template>
            刷新数据
          </a-button>
          <a-button type="primary" @click="exportTimeline" v-if="timelineDetail">
            <template #icon><download-outlined /></template>
            导出时间线
          </a-button>
        </a-space>
      </template>
    </a-page-header>

    <div v-if="loading && !timelineDetail" class="loading-container">
      <a-spin size="large">
        <template #indicator>
          <loading-outlined style="font-size: 24px" spin />
        </template>
        <div class="loading-text">正在加载时间线详情...</div>
      </a-spin>
    </div>

    <div v-else-if="timelineDetail" class="detail-content">
      <!-- 分析概览 -->
      <a-card class="overview-card">
        <template #title>
          <a-space>
            <clock-circle-outlined />
            时间线概览
          </a-space>
        </template>
        
        <a-descriptions :column="3" bordered>
          <a-descriptions-item label="记录ID">
            <a-typography-text code>{{ recordId }}</a-typography-text>
          </a-descriptions-item>
          <a-descriptions-item label="分析时段">
            <calendar-outlined class="period-icon" />
            {{ formatPeriod(timelineDetail.period) }}
          </a-descriptions-item>
          <a-descriptions-item label="事件总数">
            <a-badge :count="timelineDetail.timeline.timeline.length" show-zero>
              <bar-chart-outlined style="font-size: 16px" />
            </a-badge>
          </a-descriptions-item>
        </a-descriptions>
      </a-card>

      <!-- 时间线可视化 -->
      <a-card title="事件时间线" class="timeline-card">
        <template #title>
          <a-space>
            <node-index-outlined />
            事件时间线
          </a-space>
        </template>
        <template #extra>
          <a-space>
            <a-select v-model:value="timelineFilter" style="width: 120px">
              <a-select-option value="all">全部事件</a-select-option>
              <a-select-option value="critical">严重事件</a-select-option>
              <a-select-option value="high">高级事件</a-select-option>
              <a-select-option value="medium">中级事件</a-select-option>
              <a-select-option value="low">低级事件</a-select-option>
            </a-select>
          </a-space>
        </template>
        
        <a-timeline class="event-timeline">
          <a-timeline-item 
            v-for="(event, index) in filteredEvents" 
            :key="index"
            :color="getSeverityColor(event.severity)"
          >
            <template #dot>
              <component :is="getSeverityIcon(event.severity)" :style="{ color: getSeverityColor(event.severity) }" />
            </template>
            
            <a-card size="small" class="event-card" :class="`severity-${event.severity.toLowerCase()}`">
              <template #title>
                <a-space>
                  <a-typography-text strong>{{ event.event_type }}</a-typography-text>
                  <a-tag :color="getSeverityTagColor(event.severity)" size="small">
                    {{ formatSeverity(event.severity) }}
                  </a-tag>
                </a-space>
              </template>
              <template #extra>
                <a-typography-text type="secondary" class="event-time">
                  <clock-circle-outlined class="time-icon" />
                  {{ formatEventTime(event.timestamp) }}
                </a-typography-text>
              </template>
              
              <div class="event-content">
                <a-typography-paragraph 
                  :ellipsis="{ rows: 2, expandable: true }" 
                  class="event-description"
                >
                  {{ event.description }}
                </a-typography-paragraph>
                
                <!-- 受影响组件 -->
                <div v-if="event.affected_components && event.affected_components.length > 0" class="affected-components">
                  <a-typography-text type="secondary" class="components-label">
                    <api-outlined class="component-icon" />
                    受影响组件：
                  </a-typography-text>
                  <a-space wrap>
                    <a-tag 
                      v-for="component in event.affected_components" 
                      :key="component" 
                      color="blue"
                      size="small"
                      class="component-tag"
                    >
                      {{ component }}
                    </a-tag>
                  </a-space>
                </div>
                
                <!-- 元数据信息 -->
                <div v-if="event.metadata" class="event-metadata">
                  <a-collapse size="small">
                    <a-collapse-panel key="metadata" header="元数据信息">
                      <a-descriptions :column="2" size="small">
                        <a-descriptions-item 
                          v-for="(value, key) in event.metadata" 
                          :key="key" 
                          :label="key"
                        >
                          <a-typography-text code>{{ value }}</a-typography-text>
                        </a-descriptions-item>
                      </a-descriptions>
                    </a-collapse-panel>
                  </a-collapse>
                </div>
              </div>
            </a-card>
          </a-timeline-item>
        </a-timeline>
      </a-card>

      <!-- 分析洞察 -->
      <a-card title="时间线分析洞察" class="insights-card">
        <template #title>
          <a-space>
            <bar-chart-outlined />
            时间线分析洞察
          </a-space>
        </template>
        
        <a-row :gutter="24">
          <!-- 事件分布 -->
          <a-col :span="8">
            <a-card size="small" class="insight-item">
              <template #title>
                <a-space>
                  <pie-chart-outlined />
                  事件类型分布
                </a-space>
              </template>
              
              <div class="distribution-chart">
                <div v-for="(count, type) in eventDistribution" :key="type" class="distribution-item">
                  <div class="type-info">
                    <a-typography-text class="type-label">{{ type }}</a-typography-text>
                    <a-typography-text strong class="count-label">{{ count }}</a-typography-text>
                  </div>
                  <a-progress 
                    :percent="(count / maxEventCount * 100)" 
                    :stroke-color="getDistributionColor(type)"
                    size="small"
                    class="distribution-progress"
                  />
                </div>
              </div>
            </a-card>
          </a-col>
          
          <!-- 严重级别统计 -->
          <a-col :span="8">
            <a-card size="small" class="insight-item">
              <template #title>
                <a-space>
                  <warning-outlined />
                  严重级别分布
                </a-space>
              </template>
              
              <a-list 
                :data-source="Object.entries(severityBreakdown)" 
                size="small" 
                class="severity-list"
              >
                <template #renderItem="{ item }">
                  <a-list-item>
                    <a-list-item-meta>
                      <template #avatar>
                        <a-avatar 
                          :style="{
                            backgroundColor: getSeverityColor(item[0]),
                            color: 'white'
                          }"
                          size="small"
                        >
                          <component :is="getSeverityIcon(item[0])" />
                        </a-avatar>
                      </template>
                      <template #title>
                        <a-space>
                          <span>{{ formatSeverity(item[0]) }}</span>
                          <a-tag :color="getSeverityTagColor(item[0])" size="small">
                            {{ item[1] }}
                          </a-tag>
                        </a-space>
                      </template>
                    </a-list-item-meta>
                  </a-list-item>
                </template>
              </a-list>
            </a-card>
          </a-col>
          
          <!-- 受影响组件 -->
          <a-col :span="8">
            <a-card size="small" class="insight-item">
              <template #title>
                <a-space>
                  <cluster-outlined />
                  受影响组件排行
                </a-space>
              </template>
              
              <a-list 
                :data-source="Object.entries(topAffectedComponents)" 
                size="small" 
                class="components-list"
              >
                <template #renderItem="{ item, index }">
                  <a-list-item>
                    <a-list-item-meta>
                      <template #avatar>
                        <a-avatar 
                          :style="{
                            backgroundColor: getComponentColor(index),
                            color: 'white'
                          }"
                          size="small"
                        >
                          {{ index + 1 }}
                        </a-avatar>
                      </template>
                      <template #title>
                        <a-typography-text ellipsis>{{ item[0] }}</a-typography-text>
                      </template>
                      <template #description>
                        <a-typography-text type="secondary">
                          {{ item[1] }} 个事件
                        </a-typography-text>
                      </template>
                    </a-list-item-meta>
                  </a-list-item>
                </template>
              </a-list>
            </a-card>
          </a-col>
        </a-row>
      </a-card>
    </div>

    <div v-else class="no-data">
      <a-empty description="未找到时间线分析结果">
        <template #image>
          <clock-circle-outlined style="font-size: 64px; color: #d9d9d9" />
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
  ClockCircleOutlined,
  CalendarOutlined,
  BarChartOutlined,
  NodeIndexOutlined,
  ApiOutlined,
  PieChartOutlined,
  WarningOutlined,
  ClusterOutlined,
  ExclamationCircleOutlined,
  MinusCircleOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined
} from '@ant-design/icons-vue';
import { getTimelineDetailApi } from '#/api/core/rca';
import type { TimelineEntity } from '#/api/core/rca';

const route = useRoute();
const router = useRouter();
const recordId = ref(route.params.id as string || route.params.recordId as string);
const timelineDetail = ref<TimelineEntity | null>(null);
const loading = ref(false);
const timelineFilter = ref('all');

const filteredEvents = computed(() => {
  if (!timelineDetail.value) return [];
  
  const events = timelineDetail.value.timeline.timeline;
  if (timelineFilter.value === 'all') {
    return events;
  }
  
  return events.filter(event => 
    event.severity.toLowerCase() === timelineFilter.value.toLowerCase()
  );
});

const eventDistribution = computed(() => {
  if (!timelineDetail.value) return {};
  
  const distribution: Record<string, number> = {};
  timelineDetail.value.timeline.timeline.forEach(event => {
    distribution[event.event_type] = (distribution[event.event_type] || 0) + 1;
  });
  return distribution;
});

const maxEventCount = computed(() => {
  const counts = Object.values(eventDistribution.value);
  return counts.length > 0 ? Math.max(...counts) : 1;
});

const severityBreakdown = computed(() => {
  if (!timelineDetail.value) return {};
  
  const breakdown: Record<string, number> = {};
  timelineDetail.value.timeline.timeline.forEach(event => {
    breakdown[event.severity] = (breakdown[event.severity] || 0) + 1;
  });
  return breakdown;
});

const topAffectedComponents = computed(() => {
  if (!timelineDetail.value) return {};
  
  const components: Record<string, number> = {};
  timelineDetail.value.timeline.timeline.forEach(event => {
    if (event.affected_components) {
      event.affected_components.forEach(component => {
        components[component] = (components[component] || 0) + 1;
      });
    }
  });
  
  // Sort and return top 5
  return Object.entries(components)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .reduce((acc, [key, val]) => ({ ...acc, [key]: val }), {});
});

const loadTimelineDetail = async () => {
  loading.value = true;
  try {
    const response = await getTimelineDetailApi(recordId.value);
    timelineDetail.value = response.data || null;
  } catch (error) {
    console.error('Failed to load timeline detail:', error);
    message.error('加载时间线详情失败');
  } finally {
    loading.value = false;
  }
};

const refreshDetail = () => {
  loadTimelineDetail();
};

const exportTimeline = () => {
  if (!timelineDetail.value) return;
  
  const data = {
    record_id: recordId.value,
    analysis_period: timelineDetail.value.period,
    timeline: timelineDetail.value.timeline,
    insights: {
      event_distribution: eventDistribution.value,
      severity_breakdown: severityBreakdown.value,
      top_affected_components: topAffectedComponents.value
    },
    export_time: new Date().toISOString()
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `timeline-analysis-${recordId.value}-${dayjs().format('YYYY-MM-DD-HH-mm')}.json`;
  a.click();
  URL.revokeObjectURL(url);
  
  message.success('时间线分析结果已导出');
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

const formatEventTime = (timestamp: string) => {
  if (!timestamp) return '-';
  return dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss');
};

const getSeverityColor = (severity: string) => {
  const colorMap = {
    critical: '#ff4d4f',
    high: '#fa8c16',
    medium: '#faad14',
    low: '#52c41a'
  };
  return colorMap[severity.toLowerCase() as keyof typeof colorMap] || '#1890ff';
};

const getSeverityTagColor = (severity: string) => {
  const colorMap = {
    critical: 'error',
    high: 'volcano',
    medium: 'gold',
    low: 'success'
  };
  return colorMap[severity.toLowerCase() as keyof typeof colorMap] || 'default';
};

const getSeverityIcon = (severity: string) => {
  const iconMap = {
    critical: ExclamationCircleOutlined,
    high: WarningOutlined,
    medium: MinusCircleOutlined,
    low: CheckCircleOutlined
  };
  return iconMap[severity.toLowerCase() as keyof typeof iconMap] || InfoCircleOutlined;
};

const formatSeverity = (severity: string) => {
  const severityMap = {
    critical: '严重',
    high: '高级',
    medium: '中级',
    low: '低级'
  };
  return severityMap[severity.toLowerCase() as keyof typeof severityMap] || severity;
};

const getDistributionColor = (type: string) => {
  const colors = ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#fa8c16'];
  const hash = type.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
};

const getComponentColor = (index: number) => {
  const colors = ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1'];
  return colors[index % colors.length];
};

onMounted(() => {
  loadTimelineDetail();
});
</script>

<style scoped>
.timeline-detail {
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
.timeline-card,
.insights-card {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border-radius: 8px;
}

.period-icon {
  margin-right: 6px;
  color: #8c8c8c;
}

.event-timeline {
  margin-top: 16px;
}

.event-card {
  border-radius: 6px;
  transition: all 0.3s;
  margin-bottom: 16px;
}

.event-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.severity-critical {
  border-left: 4px solid #ff4d4f;
}

.severity-high {
  border-left: 4px solid #fa8c16;
}

.severity-medium {
  border-left: 4px solid #faad14;
}

.severity-low {
  border-left: 4px solid #52c41a;
}

.event-time {
  font-size: 13px;
}

.time-icon {
  margin-right: 4px;
  color: #8c8c8c;
}

.event-content {
  padding-top: 16px;
}

.event-description {
  margin-bottom: 16px;
  font-size: 14px;
  line-height: 1.6;
}

.affected-components {
  margin-bottom: 16px;
}

.components-label {
  display: block;
  margin-bottom: 8px;
  font-size: 13px;
}

.component-icon {
  margin-right: 4px;
}

.component-tag {
  margin-bottom: 4px;
}

.event-metadata {
  margin-top: 16px;
}

.insight-item {
  height: 100%;
  border-radius: 6px;
}

.distribution-chart {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.distribution-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.type-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.type-label {
  font-size: 13px;
  color: #666;
}

.count-label {
  font-size: 13px;
  color: #333;
}

.distribution-progress {
  margin: 0;
}

.severity-list,
.components-list {
  max-height: 300px;
  overflow-y: auto;
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
  .timeline-detail {
    padding: 16px;
  }
  
  .insights-card .ant-col {
    margin-bottom: 16px;
  }
  
  .overview-card .ant-descriptions {
    column: 1;
  }
}
</style>