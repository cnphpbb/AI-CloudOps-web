<template>
  <div class="rca-health">
    <a-page-header
      title="RCA 系统健康"
      sub-title="根因分析系统的实时健康状态监控"
      class="page-header"
    >
      <template #tags>
        <a-tag :color="healthData?.status === 'healthy' ? 'success' : 'error'">
          <component :is="getStatusIcon(healthData?.status)" class="status-icon" />
          {{ formatStatus(healthData?.status) }}
        </a-tag>
      </template>
      <template #extra>
        <a-space>
          <a-typography-text type="secondary" class="last-updated">
            <clock-circle-outlined />
            最后更新：{{ lastUpdated }}
          </a-typography-text>
          <a-button type="primary" @click="refreshHealth" :loading="loading">
            <template #icon><reload-outlined /></template>
            刷新
          </a-button>
        </a-space>
      </template>
    </a-page-header>

    <div v-if="loading && !healthData" class="loading-container">
      <a-spin size="large">
        <template #indicator>
          <loading-outlined style="font-size: 24px" spin />
        </template>
        <div class="loading-text">正在检查系统健康状态...</div>
      </a-spin>
    </div>

    <div v-else-if="healthData" class="health-content">
      <a-row :gutter="24">
        <a-col :span="24">
          <a-card class="status-overview-card">
            <a-row :gutter="24" align="middle">
              <a-col :span="6">
                <div class="status-display">
                  <div class="status-avatar" :class="`status-${healthData.status}`">
                    <component :is="getStatusIcon(healthData.status)" class="status-icon-large" />
                  </div>
                  <div class="status-info">
                    <h3 class="status-title">{{ formatStatus(healthData.status) }}</h3>
                    <p class="status-desc">{{ getStatusMessage(healthData.status) }}</p>
                  </div>
                </div>
              </a-col>
              <a-col :span="18">
                <a-row :gutter="24">
                  <a-col :span="8">
                    <a-statistic
                      title="系统运行时间"
                      :value="formatUptime(healthData.uptime)"
                      class="status-statistic"
                    >
                      <template #prefix>
                        <rocket-outlined style="color: #52c41a" />
                      </template>
                    </a-statistic>
                  </a-col>
                  <a-col :span="8">
                    <a-statistic
                      title="系统版本"
                      :value="healthData.version || 'N/A'"
                      class="status-statistic"
                    >
                      <template #prefix>
                        <code-outlined style="color: #1890ff" />
                      </template>
                    </a-statistic>
                  </a-col>
                  <a-col :span="8">
                    <a-statistic
                      title="检查时间"
                      :value="formatDate(healthData.timestamp)"
                      class="status-statistic"
                    >
                      <template #prefix>
                        <calendar-outlined style="color: #722ed1" />
                      </template>
                    </a-statistic>
                  </a-col>
                </a-row>
              </a-col>
            </a-row>
          </a-card>
        </a-col>
      </a-row>

      <a-row :gutter="24" style="margin-top: 24px">
        <a-col :span="24">
          <a-card title="组件健康状态" class="components-card">
            <template #extra>
              <api-outlined />
            </template>
            
            <a-row :gutter="[16, 16]">
              <a-col 
                v-for="(status, component) in healthData.components" 
                :key="component"
                :span="6"
              >
                <a-card size="small" class="component-item" :class="status ? 'healthy' : 'unhealthy'">
                  <a-space align="center">
                    <a-avatar 
                      :style="{
                        backgroundColor: status ? '#52c41a' : '#ff4d4f',
                        color: 'white'
                      }"
                      size="small"
                    >
                      <component :is="status ? CheckCircleOutlined : ExclamationCircleOutlined" />
                    </a-avatar>
                    <div class="component-info">
                      <div class="component-name">{{ formatComponentName(String(component)) }}</div>
                      <a-tag :color="status ? 'success' : 'error'" size="small">
                        {{ status ? '正常' : '异常' }}
                      </a-tag>
                    </div>
                  </a-space>
                </a-card>
              </a-col>
            </a-row>
          </a-card>
        </a-col>
      </a-row>

      <a-row v-if="healthData.system" :gutter="24" style="margin-top: 24px">
        <a-col :span="24">
          <a-card title="系统资源状态" class="resources-card">
            <template #extra>
              <dashboard-outlined />
            </template>
            
            <a-row :gutter="24">
              <a-col :span="6">
                <a-card size="small" class="resource-item">
                  <a-statistic
                    title="CPU 使用率"
                    :value="(healthData.system.cpu_usage || 0).toFixed(1)"
                    suffix="%"
                    :value-style="getResourceValueStyle(healthData.system.cpu_usage || 0)"
                  >
                    <template #prefix>
                      <desktop-outlined />
                    </template>
                  </a-statistic>
                  <a-progress 
                    :percent="healthData.system.cpu_usage || 0" 
                    :stroke-color="getProgressColor(healthData.system.cpu_usage || 0)"
                    size="small"
                    class="resource-progress"
                  />
                </a-card>
              </a-col>
              
              <a-col :span="6">
                <a-card size="small" class="resource-item">
                  <a-statistic
                    title="内存使用率"
                    :value="(healthData.system.memory_usage || 0).toFixed(1)"
                    suffix="%"
                    :value-style="getResourceValueStyle(healthData.system.memory_usage || 0)"
                  >
                    <template #prefix>
                      <database-outlined />
                    </template>
                  </a-statistic>
                  <a-progress 
                    :percent="healthData.system.memory_usage || 0" 
                    :stroke-color="getProgressColor(healthData.system.memory_usage || 0)"
                    size="small"
                    class="resource-progress"
                  />
                </a-card>
              </a-col>
              
              <a-col :span="6">
                <a-card size="small" class="resource-item">
                  <a-statistic
                    title="磁盘使用率"
                    :value="(healthData.system.disk_usage || 0).toFixed(1)"
                    suffix="%"
                    :value-style="getResourceValueStyle(healthData.system.disk_usage || 0)"
                  >
                    <template #prefix>
                      <hdd-outlined />
                    </template>
                  </a-statistic>
                  <a-progress 
                    :percent="healthData.system.disk_usage || 0" 
                    :stroke-color="getProgressColor(healthData.system.disk_usage || 0)"
                    size="small"
                    class="resource-progress"
                  />
                </a-card>
              </a-col>
              
              <a-col :span="6" v-if="healthData.system.load_average">
                <a-card size="small" class="resource-item">
                  <a-statistic
                    title="系统负载"
                    :value="healthData.system.load_average[0]?.toFixed(2) || '0.00'"
                  >
                    <template #prefix>
                      <line-chart-outlined />
                    </template>
                  </a-statistic>
                  <div class="load-details">
                    <a-space size="small">
                      <a-tag size="small">1m: {{ healthData.system.load_average[0]?.toFixed(2) }}</a-tag>
                      <a-tag size="small">5m: {{ healthData.system.load_average[1]?.toFixed(2) }}</a-tag>
                      <a-tag size="small">15m: {{ healthData.system.load_average[2]?.toFixed(2) }}</a-tag>
                    </a-space>
                  </div>
                </a-card>
              </a-col>
            </a-row>
            
            <a-divider v-if="healthData.system.network_io" orientation="left">网络 I/O</a-divider>
            <a-row v-if="healthData.system.network_io" :gutter="[16, 16]">
              <a-col 
                v-for="(value, interface_name) in healthData.system.network_io" 
                :key="interface_name" 
                :span="8"
              >
                <a-card size="small" class="network-item">
                  <a-statistic
                    :title="interface_name"
                    :value="formatBytes(value)"
                    suffix="/s"
                  >
                    <template #prefix>
                      <wifi-outlined />
                    </template>
                  </a-statistic>
                </a-card>
              </a-col>
            </a-row>
          </a-card>
        </a-col>
      </a-row>

      <a-row :gutter="24" style="margin-top: 24px">
        <a-col :span="12">
          <a-card title="健康状态趋势" class="chart-card">
            <template #extra>
              <area-chart-outlined />
            </template>
            
            <div class="chart-container">
              <canvas ref="historyChart"></canvas>
            </div>
          </a-card>
        </a-col>
        
        <a-col :span="12">
          <a-card title="系统建议" class="recommendations-card">
            <template #extra>
              <bulb-outlined />
            </template>
            
            <a-list 
              :data-source="getRecommendations()" 
              size="small"
              class="recommendations-list"
            >
              <template #renderItem="{ item }">
                <a-list-item>
                  <a-list-item-meta>
                    <template #avatar>
                      <a-avatar 
                        :style="{
                          backgroundColor: getSeverityColor(item.severity),
                          color: 'white'
                        }"
                        size="small"
                      >
                        <component :is="getSeverityIcon(item.severity)" />
                      </a-avatar>
                    </template>
                    <template #title>
                      <a-typography-text :type="item.severity === 'high' ? 'danger' : 'secondary'">
                        {{ item.title }}
                      </a-typography-text>
                    </template>
                    <template #description>
                      <a-typography-paragraph 
                        :ellipsis="{ rows: 2, expandable: true }" 
                        class="recommendation-desc"
                      >
                        {{ item.description }}
                      </a-typography-paragraph>
                    </template>
                  </a-list-item-meta>
                </a-list-item>
              </template>
            </a-list>
          </a-card>
        </a-col>
      </a-row>
    </div>

    <div v-else class="no-data">
      Unable to fetch health data
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { message } from 'ant-design-vue';
import {
  ClockCircleOutlined,
  ReloadOutlined,
  LoadingOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ApiOutlined,
  DashboardOutlined,
  DesktopOutlined,
  DatabaseOutlined,
  HddOutlined,
  LineChartOutlined,
  WifiOutlined,
  AreaChartOutlined,
  BulbOutlined,
  RocketOutlined,
  CodeOutlined,
  CalendarOutlined,
  WarningOutlined,
  InfoCircleOutlined
} from '@ant-design/icons-vue';
import { rcaHealthApi } from '#/api/core/rca';
import type { HealthEntity } from '#/api/core/common';

const healthData = ref<HealthEntity | null>(null);
const loading = ref(false);
const lastUpdated = ref(new Date().toLocaleTimeString());
const historyChart = ref<HTMLCanvasElement | null>(null);
let refreshInterval: any = null;

const loadHealthData = async () => {
  loading.value = true;
  try {
    const response = await rcaHealthApi();
    healthData.value = response.data || null;
    lastUpdated.value = new Date().toLocaleTimeString();
    
    if (historyChart.value) {
      drawHistoryChart();
    }
  } catch (error) {
    console.error('Failed to load health data:', error);
    message.error('加载健康数据失败');
  } finally {
    loading.value = false;
  }
};

const refreshHealth = () => {
  loadHealthData();
};

const formatStatus = (status: string | undefined) => {
  const statusMap = {
    'healthy': '健康',
    'unhealthy': '异常',
    'degraded': '降级',
    'unknown': '未知'
  };
  return statusMap[status as keyof typeof statusMap] || status || '未知';
};

const getStatusIcon = (status: string | undefined) => {
  const icons = {
    healthy: CheckCircleOutlined,
    unhealthy: ExclamationCircleOutlined,
    degraded: WarningOutlined,
    unknown: InfoCircleOutlined
  };
  return icons[status as keyof typeof icons] || InfoCircleOutlined;
};

const getStatusMessage = (status: string) => {
  const messages: Record<string, string> = {
    healthy: 'All systems are operational',
    unhealthy: 'System is experiencing issues',
    degraded: 'System is operational with reduced performance',
    unknown: 'System status cannot be determined'
  };
  return messages[status] || 'Status unknown';
};

const formatUptime = (seconds: number | undefined) => {
  if (!seconds) return 'N/A';
  
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  return `${days}d ${hours}h ${minutes}m`;
};

const formatDate = (timestamp: string) => {
  return new Date(timestamp).toLocaleString();
};

const formatComponentName = (name: string) => {
  return name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
};

const getResourceValueStyle = (value: number) => {
  if (value > 80) return { color: '#ff4d4f' };
  if (value > 60) return { color: '#faad14' };
  return { color: '#52c41a' };
};

const getProgressColor = (value: number) => {
  if (value > 80) return '#ff4d4f';
  if (value > 60) return '#faad14';
  return '#52c41a';
};

const getSeverityColor = (severity: string) => {
  const colorMap = {
    'high': '#ff4d4f',
    'medium': '#faad14',
    'low': '#52c41a'
  };
  return colorMap[severity as keyof typeof colorMap] || '#1890ff';
};

const getSeverityIcon = (severity: string) => {
  const iconMap = {
    'high': ExclamationCircleOutlined,
    'medium': WarningOutlined,
    'low': CheckCircleOutlined
  };
  return iconMap[severity as keyof typeof iconMap] || InfoCircleOutlined;
};

const getRecommendations = () => {
  const recommendations = [];
  
  if (healthData.value?.system) {
    if ((healthData.value.system.cpu_usage || 0) > 80) {
      recommendations.push({
        id: 'cpu-high',
        severity: 'high',
        title: '高CPU使用率警告',
        description: 'CPU使用率超过80%，建议扩容资源或优化工作负载。'
      });
    }
    
    if ((healthData.value.system.memory_usage || 0) > 85) {
      recommendations.push({
        id: 'memory-high',
        severity: 'high',
        title: '高内存使用率警告',
        description: '内存使用率超过85%，建议增加内存分配或检查内存泄漏。'
      });
    }
    
    if ((healthData.value.system.disk_usage || 0) > 90) {
      recommendations.push({
        id: 'disk-high',
        severity: 'high',
        title: '磁盘空间不足',
        description: '磁盘使用率超过90%，请清理不必要的文件或扩容存储空间。'
      });
    }
  }
  
  if (healthData.value?.components) {
    const downComponents = Object.entries(healthData.value.components)
      .filter(([_, status]) => !status)
      .map(([name]) => formatComponentName(name));
    
    if (downComponents.length > 0) {
      recommendations.push({
        id: 'components-down',
        severity: 'high',
        title: '组件服务异常',
        description: `以下组件当前不可用：${downComponents.join('、')}。请检查并尝试重启服务。`
      });
    }
  }
  
  if (recommendations.length === 0) {
    recommendations.push({
      id: 'all-good',
      severity: 'low',
      title: '系统运行正常',
      description: '当前系统状态良好，无需立即处理的问题。请继续保持监控。'
    });
  }
  
  return recommendations;
};

const drawHistoryChart = () => {
  if (!historyChart.value) return;
  
  const ctx = historyChart.value.getContext('2d');
  if (!ctx) return;
  
  const width = historyChart.value.width = 800;
  const height = historyChart.value.height = 200;
  
  // Clear canvas
  ctx.clearRect(0, 0, width, height);
  
  // Draw axes
  ctx.strokeStyle = '#ddd';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(40, height - 30);
  ctx.lineTo(width - 20, height - 30);
  ctx.moveTo(40, 20);
  ctx.lineTo(40, height - 30);
  ctx.stroke();
  
  // Draw sample data (in real app, this would be historical data)
  const data = Array.from({length: 24}, () => Math.random() * 100);
  
  ctx.strokeStyle = '#1976d2';
  ctx.lineWidth = 2;
  ctx.beginPath();
  
  data.forEach((value, index) => {
    const x = 40 + (index / (data.length - 1)) * (width - 60);
    const y = height - 30 - (value / 100) * (height - 50);
    
    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  
  ctx.stroke();
  
  // Draw labels
  ctx.fillStyle = '#666';
  ctx.font = '12px Arial';
  ctx.fillText('100%', 5, 25);
  ctx.fillText('0%', 15, height - 25);
  ctx.fillText('24h ago', 40, height - 10);
  ctx.fillText('Now', width - 40, height - 10);
};

onMounted(() => {
  loadHealthData();
  
  // Auto-refresh every 30 seconds
  refreshInterval = setInterval(() => {
    loadHealthData();
  }, 30000);
});

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
});
</script>

<style scoped>
.rca-health {
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

.last-updated {
  font-size: 14px;
  color: #8c8c8c;
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

.health-content {
  width: 100%;
}

.status-overview-card {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border-radius: 8px;
  margin-bottom: 24px;
}

.status-display {
  display: flex;
  align-items: center;
  gap: 16px;
}

.status-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.status-avatar.status-healthy {
  background: linear-gradient(135deg, #52c41a, #73d13d);
}

.status-avatar.status-unhealthy {
  background: linear-gradient(135deg, #ff4d4f, #ff7875);
}

.status-avatar.status-degraded {
  background: linear-gradient(135deg, #faad14, #ffc53d);
}

.status-avatar.status-unknown {
  background: linear-gradient(135deg, #8c8c8c, #bfbfbf);
}

.status-icon-large {
  font-size: 32px;
  color: white;
}

.status-info {
  flex: 1;
}

.status-title {
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: 600;
  color: #262626;
}

.status-desc {
  margin: 0;
  color: #8c8c8c;
  font-size: 14px;
}

.status-statistic {
  text-align: center;
}

.components-card,
.resources-card,
.chart-card,
.recommendations-card {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border-radius: 8px;
}

.component-item {
  transition: all 0.3s;
  border-radius: 6px;
}

.component-item.healthy {
  background: #f6ffed;
  border-color: #b7eb8f;
}

.component-item.unhealthy {
  background: #fff2f0;
  border-color: #ffccc7;
}

.component-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.component-name {
  font-size: 13px;
  font-weight: 500;
  color: #262626;
  margin-bottom: 4px;
}

.resource-item {
  background: #fafafa;
  border: 1px solid #f0f0f0;
  transition: all 0.3s;
}

.resource-item:hover {
  background: white;
  border-color: #d9d9d9;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.resource-progress {
  margin-top: 8px;
}

.load-details {
  margin-top: 8px;
}

.network-item {
  background: #fafafa;
  border: 1px solid #f0f0f0;
  transition: all 0.3s;
}

.network-item:hover {
  background: white;
  border-color: #d9d9d9;
}

.chart-container {
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.recommendations-list {
  max-height: 400px;
  overflow-y: auto;
}

.recommendation-desc {
  margin: 0;
  font-size: 13px;
  line-height: 1.4;
}

:deep(.ant-statistic-title) {
  font-size: 12px;
  margin-bottom: 8px;
  color: #8c8c8c;
}

:deep(.ant-statistic-content) {
  font-size: 16px;
  font-weight: 600;
}

:deep(.ant-card-head-title) {
  font-weight: 600;
  color: #262626;
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

.status-icon {
  margin-right: 4px;
}

@media (max-width: 768px) {
  .rca-health {
    padding: 16px;
  }
  
  .status-display {
    flex-direction: column;
    text-align: center;
  }
  
  .status-overview-card .ant-col,
  .resources-card .ant-col,
  .components-card .ant-col {
    margin-bottom: 16px;
  }
}
</style>
