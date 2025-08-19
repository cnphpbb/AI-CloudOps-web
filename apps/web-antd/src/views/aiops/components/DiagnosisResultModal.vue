<template>
  <a-modal 
    v-model:visible="modalVisible" 
    title="集群诊断结果" 
    width="800px" 
    :footer="null"
    class="diagnosis-result-modal"
  >
    <div v-if="result" class="diagnosis-content">
      <!-- 诊断概览 -->
      <div class="diagnosis-header">
        <div class="diagnosis-title">
          <cluster-outlined />
          <span>集群健康诊断</span>
          <a-tag color="blue" class="namespace-tag">{{ result.namespace }}</a-tag>
        </div>
        <a-tag 
          :color="getStatusColor(result.status)" 
          class="status-tag"
          size="large"
        >
          <component :is="getStatusIcon(result.status)" />
          {{ result.status }}
        </a-tag>
      </div>

      <!-- 资源状态统计 -->
      <div class="stats-section">
        <h4 class="section-title">
          <dashboard-outlined /> 资源状态统计
        </h4>
        <div class="stats-grid">
          <div class="stat-card" :class="getResourceStatusClass(result.nodes)">
            <div class="stat-icon">
              <server-outlined />
            </div>
            <div class="stat-content">
              <div class="stat-title">节点状态</div>
              <div class="stat-numbers">
                <span class="ready">{{ result.nodes.ready }}</span>
                <span class="separator">/</span>
                <span class="total">{{ result.nodes.total }}</span>
              </div>
              <div class="stat-label">就绪节点</div>
              <div class="stat-progress">
                <a-progress 
                  :percent="getPercentage(result.nodes.ready, result.nodes.total)"
                  :status="getProgressStatus(result.nodes.ready, result.nodes.total)"
                  size="small"
                  :show-info="false"
                />
              </div>
            </div>
          </div>

          <div class="stat-card" :class="getResourceStatusClass(result.pods)">
            <div class="stat-icon">
              <apartment-outlined />
            </div>
            <div class="stat-content">
              <div class="stat-title">Pod状态</div>
              <div class="stat-numbers">
                <span class="ready">{{ result.pods.ready }}</span>
                <span class="separator">/</span>
                <span class="total">{{ result.pods.total }}</span>
              </div>
              <div class="stat-label">运行中Pod</div>
              <div class="stat-progress">
                <a-progress 
                  :percent="getPercentage(result.pods.ready, result.pods.total)"
                  :status="getProgressStatus(result.pods.ready, result.pods.total)"
                  size="small"
                  :show-info="false"
                />
              </div>
            </div>
          </div>

          <div class="stat-card" :class="getResourceStatusClass(result.deployments)">
            <div class="stat-icon">
              <deployment-unit-outlined />
            </div>
            <div class="stat-content">
              <div class="stat-title">部署状态</div>
              <div class="stat-numbers">
                <span class="ready">{{ result.deployments.ready }}</span>
                <span class="separator">/</span>
                <span class="total">{{ result.deployments.total }}</span>
              </div>
              <div class="stat-label">健康部署</div>
              <div class="stat-progress">
                <a-progress 
                  :percent="getPercentage(result.deployments.ready, result.deployments.total)"
                  :status="getProgressStatus(result.deployments.ready, result.deployments.total)"
                  size="small"
                  :show-info="false"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 警告事件 -->
      <div v-if="result.events.length > 0" class="events-section">
        <h4 class="section-title">
          <warning-outlined style="color: #faad14;" /> 最近警告事件 ({{ result.events.length }})
        </h4>
        <div class="events-container">
          <a-timeline>
            <a-timeline-item 
              v-for="(event, index) in result.events" 
              :key="index" 
              color="red"
              class="event-timeline-item"
            >
              <template #dot>
                <exclamation-circle-outlined style="color: #ff4d4f;" />
              </template>
              <div class="event-card">
                <div class="event-header">
                  <div class="event-name">{{ event.name || '未知事件' }}</div>
                  <a-tag color="volcano" size="small">警告</a-tag>
                </div>
                <div class="event-reason">
                  <strong>原因:</strong> {{ event.reason || '未知原因' }}
                </div>
                <div class="event-message" v-if="event.message">
                  <strong>详情:</strong> {{ event.message }}
                </div>
              </div>
            </a-timeline-item>
          </a-timeline>
        </div>
      </div>

      <!-- 无警告事件的状态 -->
      <div v-else class="no-events-section">
        <div class="no-events-content">
          <check-circle-outlined style="color: #52c41a; font-size: 48px;" />
          <h4>暂无警告事件</h4>
          <p>集群运行状态良好，未发现异常事件</p>
        </div>
      </div>

      <!-- 诊断建议 -->
      <div class="suggestion-section">
        <h4 class="section-title">
          <bulb-outlined style="color: #1890ff;" /> 诊断建议
        </h4>
        <div class="suggestion-card">
          <div v-if="result.suggestion" class="suggestion-content">
            <div class="suggestion-text">{{ result.suggestion }}</div>
          </div>
          <div v-else class="default-suggestion">
            <div class="suggestion-text">
              {{ getDefaultSuggestion() }}
            </div>
          </div>
          
          <!-- 建议操作按钮 -->
          <div class="suggestion-actions">
            <a-space wrap>
              <a-button 
                v-if="hasIssues" 
                type="primary" 
                size="small"
                @click="handleAutoFix"
              >
                <template #icon><tool-outlined /></template>
                尝试自动修复
              </a-button>
              <a-button size="small" @click="handleViewLogs">
                <template #icon><file-text-outlined /></template>
                查看日志
              </a-button>
              <a-button size="small" @click="handleViewMetrics">
                <template #icon><line-chart-outlined /></template>
                查看监控
              </a-button>
            </a-space>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="diagnosis-actions">
        <a-space>
          <a-button type="primary" @click="handleRecheck">
            <template #icon><reload-outlined /></template>
            重新诊断
          </a-button>
          <a-button @click="handleExport">
            <template #icon><export-outlined /></template>
            导出报告
          </a-button>
          <a-button @click="handleShare">
            <template #icon><share-alt-outlined /></template>
            分享结果
          </a-button>
          <a-button @click="handleClose">
            关闭
          </a-button>
        </a-space>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-state">
      <a-empty description="暂无诊断数据">
        <a-button type="primary" @click="handleRecheck">
          开始诊断
        </a-button>
      </a-empty>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { message } from 'ant-design-vue';
import {
  CheckCircleOutlined,
  WarningOutlined,
  ExclamationCircleOutlined,
  DashboardOutlined,
  BulbOutlined,
  ReloadOutlined,
  ExportOutlined,
  ShareAltOutlined,
  ToolOutlined,
  FileTextOutlined,
  LineChartOutlined,
  ApartmentOutlined,
  DatabaseOutlined as ServerOutlined,
  AppstoreOutlined as DeploymentUnitOutlined,
  CloudOutlined as ClusterOutlined
} from '@ant-design/icons-vue';

interface ResourceStatus {
  ready: number;
  total: number;
}

interface DiagnosisEvent {
  name: string;
  reason: string;
  message: string;
}

interface DiagnosisResult {
  namespace: string;
  status: string;
  nodes: ResourceStatus;
  pods: ResourceStatus;
  deployments: ResourceStatus;
  events: DiagnosisEvent[];
  suggestion: string;
}

interface Props {
  visible: boolean;
  result: DiagnosisResult | null;
}

interface Emits {
  (e: 'update:visible', value: boolean): void;
  (e: 'recheck'): void;
  (e: 'export'): void;
  (e: 'autoFix'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const modalVisible = computed({
  get: () => props.visible,
  set: (value: boolean) => emit('update:visible', value)
});

const hasIssues = computed(() => {
  if (!props.result) return false;
  
  return props.result.nodes.ready < props.result.nodes.total ||
         props.result.pods.ready < props.result.pods.total ||
         props.result.deployments.ready < props.result.deployments.total ||
         props.result.events.length > 0;
});

const getStatusColor = (status: string): string => {
  const colorMap: Record<string, string> = {
    '健康': 'success',
    '需要关注': 'warning',
    '异常': 'error'
  };
  return colorMap[status] || 'default';
};

const getStatusIcon = (status: string) => {
  const iconMap: Record<string, any> = {
    '健康': CheckCircleOutlined,
    '需要关注': WarningOutlined,
    '异常': ExclamationCircleOutlined
  };
  return iconMap[status] || CheckCircleOutlined;
};

const getResourceStatusClass = (resource: ResourceStatus): string => {
  if (resource.ready === resource.total) return 'healthy';
  if (resource.ready > resource.total * 0.7) return 'warning';
  return 'critical';
};

const getPercentage = (ready: number, total: number): number => {
  if (total === 0) return 0;
  return Math.round((ready / total) * 100);
};

const getProgressStatus = (ready: number, total: number): 'success' | 'normal' | 'exception' => {
  const percentage = getPercentage(ready, total);
  if (percentage === 100) return 'success';
  if (percentage >= 70) return 'normal';
  return 'exception';
};

const getDefaultSuggestion = (): string => {
  if (!props.result) return '暂无建议';
  
  if (!hasIssues.value) {
    return '集群运行状态良好，建议继续保持定期监控和维护。';
  }
  
  const suggestions = [];
  
  if (props.result.nodes.ready < props.result.nodes.total) {
    suggestions.push('检查节点状态，确保所有节点正常运行');
  }
  
  if (props.result.pods.ready < props.result.pods.total) {
    suggestions.push('检查Pod状态，重启异常的Pod或检查资源限制');
  }
  
  if (props.result.deployments.ready < props.result.deployments.total) {
    suggestions.push('检查部署配置，确保镜像和配置正确');
  }
  
  if (props.result.events.length > 0) {
    suggestions.push('处理警告事件，检查相关资源配置');
  }
  
  return suggestions.join('；') + '。';
};

const handleClose = () => {
  modalVisible.value = false;
};

const handleRecheck = () => {
  emit('recheck');
};

const handleExport = () => {
  if (!props.result) {
    message.warning('暂无数据可导出');
    return;
  }
  
  try {
    const exportData = {
      exportTime: new Date().toISOString(),
      namespace: props.result.namespace,
      diagnosisResult: props.result
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cluster-diagnosis-${props.result.namespace}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    message.success('诊断报告已导出');
  } catch (error) {
    message.error('导出失败');
  }
};

const handleShare = () => {
  if (!props.result) {
    message.warning('暂无数据可分享');
    return;
  }
  
  const shareText = `集群诊断结果 (${props.result.namespace})：
状态: ${props.result.status}
节点: ${props.result.nodes.ready}/${props.result.nodes.total} 就绪
Pod: ${props.result.pods.ready}/${props.result.pods.total} 运行中
部署: ${props.result.deployments.ready}/${props.result.deployments.total} 健康
警告事件: ${props.result.events.length} 个`;

  try {
    navigator.clipboard.writeText(shareText).then(() => {
      message.success('诊断结果已复制到剪贴板');
    });
  } catch (error) {
    message.error('分享失败');
  }
};

const handleAutoFix = () => {
  emit('autoFix');
  message.info('正在尝试自动修复问题...');
};

const handleViewLogs = () => {
  message.info('正在跳转到日志查看页面...');
  // 这里可以实现跳转到日志页面的逻辑
};

const handleViewMetrics = () => {
  message.info('正在跳转到监控页面...');
  // 这里可以实现跳转到监控页面的逻辑
};
</script>

<style scoped>
.diagnosis-result-modal :deep(.ant-modal-body) {
  padding: 24px;
  max-height: 70vh;
  overflow-y: auto;
}

.diagnosis-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.diagnosis-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border-radius: 12px;
  border: 1px solid #bae6fd;
}

.diagnosis-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
}

.namespace-tag {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

.status-tag {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  font-weight: 600;
  border-radius: 8px;
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

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid #e8e8e8;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.stat-card::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
}

.stat-card.healthy::before {
  background: linear-gradient(180deg, #52c41a, #73d13d);
}

.stat-card.warning::before {
  background: linear-gradient(180deg, #faad14, #ffc53d);
}

.stat-card.critical::before {
  background: linear-gradient(180deg, #ff4d4f, #ff7875);
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.stat-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-icon {
  font-size: 24px;
  margin-bottom: 8px;
}

.stat-card.healthy .stat-icon {
  color: #52c41a;
}

.stat-card.warning .stat-icon {
  color: #faad14;
}

.stat-card.critical .stat-icon {
  color: #ff4d4f;
}

.stat-title {
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.stat-numbers {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 24px;
  font-weight: bold;
  margin: 4px 0;
}

.stat-numbers .ready {
  color: #52c41a;
}

.stat-numbers .separator {
  color: #d9d9d9;
}

.stat-numbers .total {
  color: #8c8c8c;
}

.stat-label {
  font-size: 12px;
  color: #999;
  margin-bottom: 8px;
}

.stat-progress {
  margin-top: 8px;
}

.events-container {
  background: white;
  border-radius: 8px;
  padding: 20px;
  border: 1px solid #fff2e8;
  background: linear-gradient(135deg, #fffbe6 0%, #fff7e6 100%);
}

.event-timeline-item :deep(.ant-timeline-item-content) {
  margin-left: 20px;
}

.event-card {
  background: white;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #ffccc7;
  box-shadow: 0 2px 8px rgba(255, 77, 79, 0.1);
}

.event-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.event-name {
  font-weight: 600;
  color: #1a1a1a;
  font-size: 14px;
}

.event-reason,
.event-message {
  font-size: 13px;
  color: #666;
  margin-bottom: 4px;
  line-height: 1.5;
}

.no-events-section {
  background: linear-gradient(135deg, #f6ffed 0%, #e6fffb 100%);
  border-radius: 12px;
  padding: 40px;
  border: 1px solid #b7eb8f;
}

.no-events-content {
  text-align: center;
}

.no-events-content h4 {
  margin: 16px 0 8px 0;
  color: #52c41a;
  font-size: 18px;
}

.no-events-content p {
  color: #666;
  margin-bottom: 0;
}

.suggestion-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid #e6f7ff;
  background: linear-gradient(135deg, #f0f9ff 0%, #e6f7ff 100%);
}

.suggestion-content,
.default-suggestion {
  margin-bottom: 16px;
}

.suggestion-text {
  font-size: 14px;
  line-height: 1.6;
  color: #1a1a1a;
  white-space: pre-wrap;
}

.suggestion-actions {
  padding-top: 16px;
  border-top: 1px solid #e6f7ff;
}

.diagnosis-actions {
  display: flex;
  justify-content: flex-end;
  padding-top: 20px;
  border-top: 1px solid #f0f0f0;
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .diagnosis-header {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }
}

@media (max-width: 768px) {
  .diagnosis-actions {
    justify-content: center;
  }
  
  .diagnosis-actions :deep(.ant-space) {
    flex-wrap: wrap;
    justify-content: center;
  }
  
  .suggestion-actions :deep(.ant-space) {
    flex-wrap: wrap;
    width: 100%;
  }
  
  .stat-numbers {
    font-size: 20px;
  }
  
  .stat-icon {
    font-size: 20px;
  }
}

/* 滚动条样式 */
.diagnosis-result-modal :deep(.ant-modal-body)::-webkit-scrollbar {
  width: 6px;
}

.diagnosis-result-modal :deep(.ant-modal-body)::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.diagnosis-result-modal :deep(.ant-modal-body)::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.diagnosis-result-modal :deep(.ant-modal-body)::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 进度条样式优化 */
:deep(.ant-progress-bg) {
  transition: all 0.3s ease;
}

/* 时间轴样式优化 */
:deep(.ant-timeline-item-tail) {
  border-left: 2px solid #ff4d4f;
}

:deep(.ant-timeline-item-head) {
  background: white;
  border: 2px solid #ff4d4f;
}
</style>
