<template>
  <div class="rca-record-detail">
    <a-page-header
      class="page-header"
      :title="`RCA记录详情 #${recordId}`"
      @back="goBack"
    >
      <template #extra>
        <a-button @click="loadRecord" :loading="loading">
          <template #icon><reload-outlined /></template>
          刷新
        </a-button>
      </template>
    </a-page-header>

    <div v-if="loading && !record" class="loading-container">
      <a-spin size="large">
        <template #indicator>
          <loading-outlined style="font-size: 24px" spin />
        </template>
        <div class="loading-text">正在加载记录详情...</div>
      </a-spin>
    </div>

    <div v-else-if="record" class="detail-content">
      <a-row :gutter="16">
        <a-col :span="12">
          <a-card title="基本信息" class="info-card">
            <template #extra>
              <file-text-outlined />
            </template>
            <a-descriptions :column="1" size="small">
              <a-descriptions-item label="记录ID">
                <a-tag color="blue">{{ record.id }}</a-tag>
              </a-descriptions-item>
              <a-descriptions-item label="分析类型">
                <a-tag :color="getTypeColor(record.record_type)">
                  <component :is="getTypeIcon(record.record_type)" class="tag-icon" />
                  {{ formatRecordType(record.record_type) }}
                </a-tag>
              </a-descriptions-item>
              <a-descriptions-item label="状态">
                <a-tag :color="getStatusColor(record.status)">
                  <component :is="getStatusIcon(record.status)" class="tag-icon" />
                  {{ formatStatus(record.status) }}
                </a-tag>
              </a-descriptions-item>
              <a-descriptions-item label="命名空间">
                <span v-if="record.namespace">{{ record.namespace }}</span>
                <a-typography-text type="secondary" v-else>未指定</a-typography-text>
              </a-descriptions-item>
              <a-descriptions-item label="任务ID">
                <span v-if="record.job_id">{{ record.job_id }}</span>
                <a-typography-text type="secondary" v-else>-</a-typography-text>
              </a-descriptions-item>
            </a-descriptions>
          </a-card>
        </a-col>
        
        <a-col :span="12">
          <a-card title="时间信息" class="info-card">
            <template #extra>
              <clock-circle-outlined />
            </template>
            <a-descriptions :column="1" size="small">
              <a-descriptions-item label="开始时间">
                <calendar-outlined class="time-icon" />
                {{ formatDate(record.start_time) }}
              </a-descriptions-item>
              <a-descriptions-item label="结束时间">
                <calendar-outlined class="time-icon" />
                {{ formatDate(record.end_time) }}
              </a-descriptions-item>
              <a-descriptions-item label="创建时间">
                <plus-circle-outlined class="time-icon" />
                {{ formatDate(record.created_at) }}
              </a-descriptions-item>
              <a-descriptions-item label="更新时间">
                <edit-outlined class="time-icon" />
                {{ formatDate(record.updated_at) }}
              </a-descriptions-item>
            </a-descriptions>
          </a-card>
        </a-col>
      </a-row>

      <a-row :gutter="16" style="margin-top: 16px">
        <a-col :span="24">
          <a-card title="摘要信息" class="info-card">
            <template #extra>
              <file-text-outlined />
            </template>
            <a-typography-paragraph v-if="record.summary" :ellipsis="{ rows: 3, expandable: true }">
              {{ record.summary }}
            </a-typography-paragraph>
            <a-empty v-else description="暂无摘要信息" :image="false" />
          </a-card>
        </a-col>
      </a-row>

      <a-row :gutter="16" style="margin-top: 16px">
        <a-col :span="24">
          <a-card title="监控指标" class="info-card">
            <template #extra>
              <bar-chart-outlined />
            </template>
            <div v-if="record.metrics" class="metrics-section">
              <a-space wrap>
                <a-tag v-for="metric in parseMetrics(record.metrics)" :key="metric" color="processing">
                  <line-chart-outlined />
                  {{ metric }}
                </a-tag>
              </a-space>
            </div>
            <a-empty v-else description="未指定监控指标" :image="false" />
          </a-card>
        </a-col>
      </a-row>

      <a-row v-if="record.params" :gutter="16" style="margin-top: 16px">
        <a-col :span="24">
          <a-card title="分析参数" class="info-card">
            <template #extra>
              <setting-outlined />
            </template>
            <a-descriptions :column="2" bordered size="small">
              <a-descriptions-item 
                v-for="(value, key) in record.params" 
                :key="key" 
                :label="formatParamKey(String(key))"
              >
                <a-tag v-if="typeof value === 'boolean'" :color="value ? 'success' : 'default'">
                  {{ value ? '是' : '否' }}
                </a-tag>
                <span v-else>{{ value }}</span>
              </a-descriptions-item>
            </a-descriptions>
          </a-card>
        </a-col>
      </a-row>

      <a-row v-if="record.result" :gutter="16" style="margin-top: 16px">
        <a-col :span="24">
          <a-card title="分析结果" class="info-card result-card">
            <template #extra>
              <experiment-outlined />
            </template>
            
            <a-alert
              :message="`根因分析结果（置信度：${record.result.confidence}%）`"
              :description="record.result.root_cause"
              type="info"
              show-icon
              class="root-cause-alert"
            />
            
            <a-divider orientation="left">证据链</a-divider>
            <a-list 
              :data-source="record.result.evidence" 
              size="small"
              class="evidence-list"
            >
              <template #renderItem="{ item, index }">
                <a-list-item>
                  <a-typography-text>
                    <check-circle-outlined class="evidence-icon" />
                    {{ item }}
                  </a-typography-text>
                </a-list-item>
              </template>
            </a-list>
            
            <a-divider orientation="left">受影响组件</a-divider>
            <a-space wrap class="components-section">
              <a-tag 
                v-for="component in record.result.affected_components" 
                :key="component" 
                color="volcano"
              >
                <api-outlined />
                {{ component }}
              </a-tag>
            </a-space>
            
            <a-divider orientation="left">修复建议</a-divider>
            <a-list 
              :data-source="record.result.recommendations" 
              size="small"
              class="recommendations-list"
            >
              <template #renderItem="{ item, index }">
                <a-list-item>
                  <a-typography-text>
                    <bulb-outlined class="recommendation-icon" />
                    {{ item }}
                  </a-typography-text>
                </a-list-item>
              </template>
            </a-list>
          </a-card>
        </a-col>
      </a-row>

      <a-row v-if="record.error" :gutter="16" style="margin-top: 16px">
        <a-col :span="24">
          <a-card title="错误信息" class="info-card error-card">
            <template #extra>
              <exclamation-circle-outlined style="color: #ff4d4f" />
            </template>
            <a-alert
              :message="record.error"
              type="error"
              show-icon
              class="error-alert"
            />
          </a-card>
        </a-col>
      </a-row>
    </div>

    <div v-else class="no-data">
      <a-empty description="未找到记录" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import {
  ReloadOutlined,
  LoadingOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  PlusCircleOutlined,
  EditOutlined,
  BarChartOutlined,
  LineChartOutlined,
  SettingOutlined,
  ExperimentOutlined,
  CheckCircleOutlined,
  ApiOutlined,
  BulbOutlined,
  ExclamationCircleOutlined,
  PartitionOutlined,
  NodeIndexOutlined
} from '@ant-design/icons-vue';
import { getRcaRecordDetailApi } from '#/api/core/rca';
import type { RCARecordEntity } from '#/api/core/rca';

const route = useRoute();
const router = useRouter();
const recordId = ref(route.params.id as string);
const record = ref<RCARecordEntity | null>(null);
const loading = ref(false);

const loadRecord = async () => {
  loading.value = true;
  try {
    const response = await getRcaRecordDetailApi(Number(recordId.value));
    record.value = response.data || null;
  } catch (error) {
    console.error('Failed to load record:', error);
    message.error('加载记录详情失败，请重试');
  } finally {
    loading.value = false;
  }
};

const goBack = () => {
  router.back();
};

const formatDate = (date: string | undefined) => {
  if (!date) return '-';
  return new Date(date).toLocaleString();
};

const formatRecordType = (type: string | undefined) => {
  const typeMap = {
    'anomaly_detection': '异常检测',
    'correlation_analysis': '相关性分析',
    'topology_analysis': '拓扑分析',
    'timeline_analysis': '时间线分析'
  };
  return typeMap[type as keyof typeof typeMap] || type || '-';
};

const formatStatus = (status: string | undefined) => {
  const statusMap = {
    'pending': '等待中',
    'running': '运行中',
    'completed': '已完成',
    'failed': '失败'
  };
  return statusMap[status as keyof typeof statusMap] || status || '-';
};

const getTypeColor = (type: string | undefined) => {
  const colorMap = {
    'anomaly_detection': 'blue',
    'correlation_analysis': 'purple',
    'topology_analysis': 'green',
    'timeline_analysis': 'orange'
  };
  return colorMap[type as keyof typeof colorMap] || 'default';
};

const getStatusColor = (status: string | undefined) => {
  const colorMap = {
    'pending': 'warning',
    'running': 'processing',
    'completed': 'success',
    'failed': 'error'
  };
  return colorMap[status as keyof typeof colorMap] || 'default';
};

const getTypeIcon = (type: string | undefined) => {
  const iconMap = {
    'anomaly_detection': ExperimentOutlined,
    'correlation_analysis': PartitionOutlined,
    'topology_analysis': NodeIndexOutlined,
    'timeline_analysis': ClockCircleOutlined
  };
  return iconMap[type as keyof typeof iconMap] || ExperimentOutlined;
};

const getStatusIcon = (status: string | undefined) => {
  const iconMap = {
    'pending': ClockCircleOutlined,
    'running': LoadingOutlined,
    'completed': CheckCircleOutlined,
    'failed': ExclamationCircleOutlined
  };
  return iconMap[status as keyof typeof iconMap] || ExclamationCircleOutlined;
};

const formatParamKey = (key: string) => {
  return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

const parseMetrics = (metrics: string) => {
  try {
    return JSON.parse(metrics);
  } catch {
    return metrics.split(',').map(m => m.trim());
  }
};

onMounted(() => {
  loadRecord();
});
</script>

<style scoped>
.rca-record-detail {
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

.info-card {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border-radius: 8px;
}

.info-card :deep(.ant-card-head) {
  border-bottom: 1px solid #f0f0f0;
}

.info-card :deep(.ant-card-head-title) {
  font-weight: 600;
  color: #262626;
}

.tag-icon {
  margin-right: 4px;
}

.time-icon {
  margin-right: 6px;
  color: #8c8c8c;
}

.metrics-section {
  min-height: 40px;
}

.result-card {
  border: 1px solid #e6f7ff;
}

.result-card :deep(.ant-card-head) {
  background: #f6ffed;
  border-bottom-color: #b7eb8f;
}

.root-cause-alert {
  margin-bottom: 24px;
}

.evidence-list,
.recommendations-list {
  background: #fafafa;
  border-radius: 6px;
  padding: 8px;
}

.evidence-icon {
  color: #52c41a;
  margin-right: 8px;
}

.recommendation-icon {
  color: #faad14;
  margin-right: 8px;
}

.components-section {
  min-height: 32px;
  padding: 8px;
  background: #fafafa;
  border-radius: 6px;
}

.error-card {
  border: 1px solid #ffccc7;
}

.error-card :deep(.ant-card-head) {
  background: #fff2f0;
  border-bottom-color: #ffccc7;
}

.error-alert {
  margin: 0;
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

:deep(.ant-descriptions-item-label) {
  font-weight: 500;
  color: #595959;
}

:deep(.ant-list-item) {
  padding: 8px 12px;
  border-radius: 4px;
  margin-bottom: 4px;
  background: white;
}

:deep(.ant-divider-horizontal.ant-divider-with-text-left) {
  margin: 24px 0 16px 0;
}

:deep(.ant-page-header) {
  padding: 16px 24px;
}

@media (max-width: 768px) {
  .rca-record-detail {
    padding: 16px;
  }
  
  .detail-content .ant-col {
    margin-bottom: 16px;
  }
}
</style>
