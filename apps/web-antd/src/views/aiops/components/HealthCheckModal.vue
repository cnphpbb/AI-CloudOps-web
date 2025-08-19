<template>
  <a-modal 
    v-model:visible="modalVisible" 
    title="系统健康检查" 
    width="700px" 
    :footer="null"
    class="health-check-modal"
  >
    <div v-if="result" class="health-check-content">
      <!-- 健康状态概览 -->
      <div class="health-overview">
        <div class="health-status" :class="getOverallStatusClass()">
          <div class="status-icon">
            <check-circle-outlined v-if="isHealthy" />
            <warning-outlined v-else-if="isDegraded" />
            <close-circle-outlined v-else />
          </div>
          <div class="status-info">
            <div class="status-text">{{ getOverallStatusText() }}</div>
            <div class="status-description">{{ getStatusDescription() }}</div>
          </div>
          <div class="uptime-info">
            <div class="uptime-label">运行时间</div>
            <div class="uptime-value">{{ formatUptime(result.uptime) }}</div>
          </div>
        </div>
        <div class="check-metadata">
          <div class="metadata-item">
            <clock-circle-outlined />
            <span>检查时间: {{ formatTimestamp(result.timestamp) }}</span>
          </div>
          <div class="metadata-item">
            <tag-outlined />
            <span>版本: {{ result.version || 'N/A' }}</span>
          </div>
        </div>
      </div>

      <!-- 组件状态详情 -->
      <div class="components-section">
        <h4 class="section-title">
          <apartment-outlined /> 组件状态详情
        </h4>
        <div class="components-grid">
          <div 
            v-for="(status, component) in result.components" 
            :key="component" 
            class="component-card"
            :class="{ 'healthy': status, 'unhealthy': !status }"
          >
            <div class="component-header">
              <div class="component-icon">
                <check-circle-outlined v-if="status" />
                <exclamation-circle-outlined v-else />
              </div>
              <div class="component-name">{{ formatComponentName(String(component)) }}</div>
            </div>
            <div class="component-status">
              <a-tag :color="status ? 'success' : 'error'">
                {{ status ? '正常运行' : '异常状态' }}
              </a-tag>
            </div>
            <div class="component-details">
              <div class="detail-item">
                <span class="detail-label">状态:</span>
                <span class="detail-value">{{ status ? '在线' : '离线' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">类型:</span>
                <span class="detail-value">{{ getComponentType(String(component)) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 通知服务详情 -->
      <div v-if="result.notification_details" class="notification-section">
        <h4 class="section-title">
          <notification-outlined /> 通知服务详情
        </h4>
        <div class="notification-card">
          <div class="notification-status">
            <div class="status-indicator" :class="{ 'healthy': result.notification_details.healthy }">
              <check-circle-outlined v-if="result.notification_details.healthy" />
              <warning-outlined v-else />
            </div>
            <div class="status-info">
              <div class="status-title">通知服务</div>
              <div class="status-description">
                {{ result.notification_details.healthy ? '服务运行正常' : '服务存在问题' }}
              </div>
            </div>
          </div>
          
          <div v-if="result.notification_details.channels" class="channels-info">
            <div class="channels-title">可用通道:</div>
            <div class="channels-list">
              <a-tag 
                v-for="channel in result.notification_details.channels" 
                :key="channel"
                color="blue"
                class="channel-tag"
              >
                <component :is="getChannelIcon(channel)" />
                {{ formatChannelName(channel) }}
              </a-tag>
            </div>
          </div>
        </div>
      </div>

      <!-- 系统资源状态 -->
      <div v-if="result.system" class="system-section">
        <h4 class="section-title">
          <dashboard-outlined /> 系统资源状态
        </h4>
        <div class="system-metrics">
          <div class="metric-item">
            <div class="metric-header">
              <cpu-outlined />
              <span>CPU 使用率</span>
            </div>
            <div class="metric-value">
              <a-progress 
                :percent="result.system?.cpu_percent || 0" 
                :status="getResourceStatus(result.system?.cpu_percent || 0)"
                :stroke-color="getResourceColor(result.system?.cpu_percent || 0)"
                size="small"
              />
              <span class="metric-text">{{ (result.system?.cpu_percent || 0).toFixed(1) }}%</span>
            </div>
          </div>
          
          <div class="metric-item">
            <div class="metric-header">
              <database-outlined />
              <span>内存使用率</span>
            </div>
            <div class="metric-value">
              <a-progress 
                :percent="result.system?.memory_percent || 0" 
                :status="getResourceStatus(result.system?.memory_percent || 0)"
                :stroke-color="getResourceColor(result.system?.memory_percent || 0)"
                size="small"
              />
              <span class="metric-text">{{ (result.system?.memory_percent || 0).toFixed(1) }}%</span>
            </div>
          </div>
          
          <div class="metric-item">
            <div class="metric-header">
              <hdd-outlined />
              <span>磁盘使用率</span>
            </div>
            <div class="metric-value">
              <a-progress 
                :percent="result.system?.disk_percent || 0" 
                :status="getResourceStatus(result.system?.disk_percent || 0)"
                :stroke-color="getResourceColor(result.system?.disk_percent || 0)"
                size="small"
              />
              <span class="metric-text">{{ (result.system?.disk_percent || 0).toFixed(1) }}%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="health-actions">
        <a-space>
          <a-button type="primary" @click="handleRefresh">
            <template #icon><reload-outlined /></template>
            重新检查
          </a-button>
          <a-button @click="handleExport">
            <template #icon><export-outlined /></template>
            导出报告
          </a-button>
          <a-button @click="handleClose">
            关闭
          </a-button>
        </a-space>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-state">
      <a-empty description="暂无健康检查数据" />
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import {
  CheckCircleOutlined,
  WarningOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  TagOutlined,
  ApartmentOutlined,
  NotificationOutlined,
  DashboardOutlined,
  DatabaseOutlined,
  ReloadOutlined,
  ExportOutlined,
  MailOutlined,
  MessageOutlined,
  PhoneOutlined,
  BellOutlined
} from '@ant-design/icons-vue';

// 使用别名避免冲突
import {
  DatabaseOutlined as CpuOutlined,
  HddOutlined
} from '@ant-design/icons-vue';

interface HealthCheckResult {
  status: string;
  timestamp: string;
  uptime: number;
  version: string;
  components: Record<string, boolean>;
  notification_details?: {
    healthy: boolean;
    channels?: string[];
  };
  system?: {
    cpu_percent: number;
    memory_percent: number;
    disk_percent: number;
  };
}

interface Props {
  visible: boolean;
  result: HealthCheckResult | null;
}

interface Emits {
  (e: 'update:visible', value: boolean): void;
  (e: 'refresh'): void;
  (e: 'export'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const modalVisible = computed({
  get: () => props.visible,
  set: (value: boolean) => emit('update:visible', value)
});

const isHealthy = computed(() => {
  if (!props.result) return false;
  return props.result.status === 'healthy' && 
         Object.values(props.result.components).every(status => status);
});

const isDegraded = computed(() => {
  if (!props.result) return false;
  return props.result.status === 'degraded' || 
         Object.values(props.result.components).some(status => !status);
});

const getOverallStatusClass = () => {
  if (isHealthy.value) return 'healthy';
  if (isDegraded.value) return 'degraded';
  return 'unhealthy';
};

const getOverallStatusText = () => {
  if (isHealthy.value) return '系统健康';
  if (isDegraded.value) return '系统降级';
  return '系统异常';
};

const getStatusDescription = () => {
  if (isHealthy.value) return '所有组件运行正常';
  if (isDegraded.value) return '部分组件存在问题';
  return '系统存在严重问题';
};

const formatComponentName = (component: string): string => {
  const nameMap: Record<string, string> = {
    'supervisor_agent': '主管Agent',
    'k8s_fixer_agent': 'K8s修复Agent',
    'notifier_agent': '通知Agent',
    'kubernetes_service': 'Kubernetes服务',
    'notification_service': '通知服务',
    'database': '数据库',
    'redis': 'Redis缓存',
    'message_queue': '消息队列'
  };
  return nameMap[component] || component;
};

const getComponentType = (component: string): string => {
  const typeMap: Record<string, string> = {
    'supervisor_agent': 'AI Agent',
    'k8s_fixer_agent': 'AI Agent',
    'notifier_agent': 'AI Agent',
    'kubernetes_service': '基础服务',
    'notification_service': '基础服务',
    'database': '存储服务',
    'redis': '缓存服务',
    'message_queue': '消息服务'
  };
  return typeMap[component] || '未知类型';
};

const formatChannelName = (channel: string): string => {
  const channelMap: Record<string, string> = {
    'email': '邮件',
    'sms': '短信',
    'webhook': 'Webhook',
    'slack': 'Slack',
    'teams': 'Teams',
    'dingtalk': '钉钉'
  };
  return channelMap[channel] || channel;
};

const getChannelIcon = (channel: string) => {
  const iconMap: Record<string, any> = {
    'email': MailOutlined,
    'sms': MessageOutlined,
    'webhook': BellOutlined,
    'slack': MessageOutlined,
    'teams': MessageOutlined,
    'dingtalk': MessageOutlined
  };
  return iconMap[channel] || BellOutlined;
};

const formatTimestamp = (timestamp: string): string => {
  try {
    return new Date(timestamp).toLocaleString('zh-CN');
  } catch {
    return timestamp;
  }
};

const formatUptime = (seconds: number): string => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (days > 0) {
    return `${days}天 ${hours}小时 ${minutes}分钟`;
  } else if (hours > 0) {
    return `${hours}小时 ${minutes}分钟`;
  } else {
    return `${minutes}分钟`;
  }
};

const getResourceStatus = (percent: number): 'success' | 'normal' | 'exception' => {
  if (percent < 60) return 'success';
  if (percent < 80) return 'normal';
  return 'exception';
};

const getResourceColor = (percent: number): string => {
  if (percent < 60) return '#52c41a';
  if (percent < 80) return '#faad14';
  return '#ff4d4f';
};

const handleRefresh = () => {
  emit('refresh');
};

const handleExport = () => {
  emit('export');
};

const handleClose = () => {
  modalVisible.value = false;
};
</script>

<style scoped>
.health-check-modal :deep(.ant-modal-body) {
  padding: 24px;
  max-height: 70vh;
  overflow-y: auto;
}

.health-check-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.health-overview {
  background: linear-gradient(135deg, #f6ffed 0%, #e6fffb 100%);
  border-radius: 12px;
  padding: 20px;
  border: 1px solid #e6f7ff;
}

.health-status {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.health-status.healthy .status-icon {
  color: #52c41a;
  font-size: 32px;
}

.health-status.degraded .status-icon {
  color: #faad14;
  font-size: 32px;
}

.health-status.unhealthy .status-icon {
  color: #ff4d4f;
  font-size: 32px;
}

.status-info {
  flex: 1;
}

.status-text {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 4px;
}

.status-description {
  font-size: 14px;
  color: #666;
}

.uptime-info {
  text-align: right;
}

.uptime-label {
  font-size: 12px;
  color: #999;
  margin-bottom: 4px;
}

.uptime-value {
  font-size: 16px;
  font-weight: bold;
  color: #1890ff;
}

.check-metadata {
  display: flex;
  gap: 24px;
  padding-top: 16px;
  border-top: 1px solid #e8f4fd;
}

.metadata-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #666;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #1a1a1a;
}

.components-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
}

.component-card {
  background: white;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #e8e8e8;
  transition: all 0.3s ease;
}

.component-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.component-card.healthy {
  border-left: 4px solid #52c41a;
}

.component-card.unhealthy {
  border-left: 4px solid #ff4d4f;
}

.component-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.component-icon {
  font-size: 20px;
}

.component-card.healthy .component-icon {
  color: #52c41a;
}

.component-card.unhealthy .component-icon {
  color: #ff4d4f;
}

.component-name {
  font-weight: 600;
  color: #1a1a1a;
}

.component-status {
  margin-bottom: 12px;
}

.component-details {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
}

.detail-label {
  color: #666;
}

.detail-value {
  color: #1a1a1a;
  font-weight: 500;
}

.notification-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  border: 1px solid #e8e8e8;
}

.notification-status {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.status-indicator {
  font-size: 24px;
}

.status-indicator.healthy {
  color: #52c41a;
}

.status-indicator:not(.healthy) {
  color: #faad14;
}

.status-title {
  font-weight: 600;
  margin-bottom: 4px;
}

.channels-title {
  font-weight: 500;
  margin-bottom: 8px;
  color: #666;
}

.channels-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.channel-tag {
  display: flex;
  align-items: center;
  gap: 4px;
}

.system-metrics {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.metric-item {
  background: white;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #e8e8e8;
}

.metric-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-weight: 600;
  color: #1a1a1a;
}

.metric-value {
  display: flex;
  align-items: center;
  gap: 12px;
}

.metric-text {
  font-weight: 600;
  min-width: 50px;
}

.health-actions {
  display: flex;
  justify-content: flex-end;
  padding-top: 20px;
  border-top: 1px solid #f0f0f0;
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .health-status {
    flex-direction: column;
    text-align: center;
    gap: 12px;
  }

  .uptime-info {
    text-align: center;
  }

  .check-metadata {
    flex-direction: column;
    gap: 12px;
  }

  .components-grid {
    grid-template-columns: 1fr;
  }

  .health-actions {
    justify-content: center;
  }

  .health-actions :deep(.ant-space) {
    flex-wrap: wrap;
    justify-content: center;
  }
}

/* 滚动条样式 */
.health-check-modal :deep(.ant-modal-body)::-webkit-scrollbar {
  width: 6px;
}

.health-check-modal :deep(.ant-modal-body)::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.health-check-modal :deep(.ant-modal-body)::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.health-check-modal :deep(.ant-modal-body)::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
