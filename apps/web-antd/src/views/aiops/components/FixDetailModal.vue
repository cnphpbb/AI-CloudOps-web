<template>
  <a-modal 
    v-model:visible="modalVisible" 
    title="自动修复详情" 
    width="800px" 
    :footer="null" 
    class="fix-detail-modal"
    @cancel="handleClose"
  >
    <div v-if="record" class="fix-detail-content">
      <!-- 修复详情头部 -->
      <div class="fix-detail-header">
        <div class="fix-info">
          <div class="fix-id">
            <span class="label">修复ID:</span>
            <span class="value">{{ record.id }}</span>
          </div>
          <div class="fix-time">
            <span class="label">执行时间:</span>
            <span class="value">{{ record.timestamp }}</span>
          </div>
        </div>
        <a-tag :color="getStatusColor(record.status)" class="status-tag">
          <component :is="getStatusIcon(record.status)" />
          {{ getStatusText(record.status) }}
        </a-tag>
      </div>

      <!-- 基本信息 -->
      <div class="detail-section">
        <h4 class="section-title">
          <info-circle-outlined /> 基本信息
        </h4>
        <div class="info-grid">
          <div class="info-item">
            <span class="label">目标资源:</span>
            <span class="value">{{ record.deployment }}</span>
          </div>
          <div class="info-item">
            <span class="label">命名空间:</span>
            <span class="value">{{ record.namespace }}</span>
          </div>
          <div class="info-item">
            <span class="label">修复类型:</span>
            <span class="value">{{ getFixType(record.id) }}</span>
          </div>
          <div class="info-item">
            <span class="label">成功状态:</span>
            <span class="value">{{ record.success ? '是' : '否' }}</span>
          </div>
        </div>
      </div>

      <!-- 修复结果 -->
      <div class="detail-section">
        <h4 class="section-title">
          <check-circle-outlined v-if="record.success" style="color: #52c41a;" />
          <close-circle-outlined v-else style="color: #ff4d4f;" />
          修复结果
        </h4>
        <div class="result-content" :class="{ 'success': record.success, 'error': !record.success }">
          {{ record.result }}
        </div>
      </div>

      <!-- 错误信息 -->
      <div v-if="record.error_message" class="detail-section">
        <h4 class="section-title">
          <exclamation-circle-outlined style="color: #ff4d4f;" /> 错误信息
        </h4>
        <div class="error-content">
          {{ record.error_message }}
        </div>
      </div>

      <!-- 执行的操作 -->
      <div class="detail-section">
        <h4 class="section-title">
          <tool-outlined /> 执行的操作
        </h4>
        <div v-if="record.actions_taken.length > 0" class="actions-content">
          <div 
            v-for="(action, index) in record.actions_taken" 
            :key="index" 
            class="action-item"
          >
            <div class="action-index">{{ index + 1 }}</div>
            <div class="action-text">{{ action }}</div>
          </div>
        </div>
        <div v-else class="no-actions">
          <inbox-outlined />
          <span>暂无执行操作记录</span>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="fix-detail-actions">
        <a-space>
          <a-button type="primary" @click="handleExport">
            <template #icon><export-outlined /></template>
            导出数据
          </a-button>
          <a-button @click="handleCopy">
            <template #icon><copy-outlined /></template>
            复制信息
          </a-button>
          <a-button v-if="!record.success" type="default" @click="handleRetry">
            <template #icon><redo-outlined /></template>
            重新执行
          </a-button>
          <a-button type="dashed" @click="handleClose">
            关闭
          </a-button>
        </a-space>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-state">
      <a-empty description="暂无详情数据" />
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import {
  InfoCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  ToolOutlined,
  InboxOutlined,
  ExportOutlined,
  CopyOutlined,
  RedoOutlined,
  WarningOutlined,
  ClockCircleOutlined
} from '@ant-design/icons-vue';

interface FixRecord {
  id: string;
  deployment: string;
  namespace: string;
  status: 'success' | 'failed' | 'pending';
  timestamp: string;
  result: string;
  actions_taken: string[];
  error_message?: string;
  success: boolean;
}

interface Props {
  visible: boolean;
  record: FixRecord | null;
}

interface Emits {
  (e: 'update:visible', value: boolean): void;
  (e: 'export'): void;
  (e: 'copy'): void;
  (e: 'retry', record: FixRecord): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const modalVisible = computed({
  get: () => props.visible,
  set: (value: boolean) => emit('update:visible', value)
});

const getStatusColor = (status: string): string => {
  const colorMap: Record<string, string> = {
    'success': 'success',
    'failed': 'error',
    'pending': 'processing'
  };
  return colorMap[status] || 'default';
};

const getStatusText = (status: string): string => {
  const textMap: Record<string, string> = {
    'success': '修复成功',
    'failed': '修复失败',
    'pending': '执行中'
  };
  return textMap[status] || status;
};

const getStatusIcon = (status: string) => {
  const iconMap: Record<string, any> = {
    'success': CheckCircleOutlined,
    'failed': WarningOutlined,
    'pending': ClockCircleOutlined
  };
  return iconMap[status] || CheckCircleOutlined;
};

const getFixType = (id: string): string => {
  if (id.startsWith('FIX-')) {
    return '自动修复';
  } else if (id.startsWith('WF-')) {
    return '工作流执行';
  }
  return '未知类型';
};

const handleClose = () => {
  modalVisible.value = false;
};

const handleExport = () => {
  emit('export');
};

const handleCopy = () => {
  emit('copy');
};

const handleRetry = () => {
  if (props.record) {
    emit('retry', props.record);
  }
  handleClose();
};
</script>

<style scoped>
.fix-detail-modal :deep(.ant-modal-body) {
  padding: 24px;
}

.fix-detail-content {
  max-height: 70vh;
  overflow-y: auto;
}

.fix-detail-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.fix-info {
  flex: 1;
}

.fix-id,
.fix-time {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.label {
  font-weight: 600;
  color: #666;
  margin-right: 12px;
  min-width: 80px;
}

.value {
  color: #1a1a1a;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

.status-tag {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
}

.detail-section {
  margin-bottom: 24px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
  color: #1a1a1a;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.info-item {
  display: flex;
  align-items: center;
  padding: 8px 0;
}

.info-item .label {
  min-width: 100px;
}

.result-content,
.error-content {
  padding: 16px;
  border-radius: 8px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
  border: 1px solid;
}

.result-content.success {
  background-color: #f6ffed;
  border-color: #b7eb8f;
  color: #389e0d;
}

.result-content.error {
  background-color: #fff2f0;
  border-color: #ffccc7;
  color: #cf1322;
}

.error-content {
  background-color: #fff2f0;
  border-color: #ffccc7;
  color: #cf1322;
}

.actions-content {
  background-color: #fafafa;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #e8e8e8;
}

.action-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.action-item:last-child {
  border-bottom: none;
}

.action-index {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  background-color: #1890ff;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
}

.action-text {
  flex: 1;
  color: #1a1a1a;
  line-height: 1.5;
}

.no-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 32px;
  color: #999;
  font-size: 14px;
}

.fix-detail-actions {
  display: flex;
  justify-content: flex-end;
  padding-top: 20px;
  border-top: 1px solid #f0f0f0;
  margin-top: 20px;
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .fix-detail-header {
    flex-direction: column;
    gap: 16px;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .fix-detail-actions {
    justify-content: center;
  }

  .fix-detail-actions :deep(.ant-space) {
    flex-wrap: wrap;
    justify-content: center;
  }
}

/* 滚动条样式 */
.fix-detail-content::-webkit-scrollbar {
  width: 6px;
}

.fix-detail-content::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.fix-detail-content::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.fix-detail-content::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
