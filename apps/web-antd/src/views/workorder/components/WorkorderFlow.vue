<template>
  <div>
    <!-- 流转记录对话框 -->
    <a-modal 
      :open="flowDialog.visible" 
      title="工单流转记录" 
      :width="previewDialogWidth" 
      :footer="null"
      @cancel="() => { flowDialog.visible = false }" 
      class="flow-dialog responsive-modal"
    >
      <div class="flow-content">
        <a-timeline>
          <a-timeline-item 
            v-for="item in flowList" 
            :key="item.id" 
            :color="getFlowActionColor(item.action)"
          >
            <template #dot>
              <component :is="getFlowActionIcon(item.action)" />
            </template>
            <div class="flow-item">
              <div class="flow-header">
                <span class="flow-action">{{ getFlowActionText(item.action) }}</span>
                <span class="flow-time">{{ formatFullDateTime(item.created_at) }}</span>
              </div>
              <div class="flow-content-detail">
                <div class="operator-info">
                  <a-avatar size="small" :style="{ backgroundColor: getAvatarColor(item.operator_name || '') }">
                    {{ getInitials(item.operator_name) }}
                  </a-avatar>
                  <span class="operator-name">{{ item.operator_name }}</span>
                  <a-tag v-if="item.is_system_action === 1" color="orange" size="small">系统</a-tag>
                </div>
                <div class="status-change">
                  <span class="from-status">{{ getStatusText(item.from_status) }}</span>
                  <span class="arrow">→</span>
                  <span class="to-status">{{ getStatusText(item.to_status) }}</span>
                </div>
                <div class="flow-comment" v-if="item.comment">
                  <strong>处理说明：</strong>{{ item.comment }}
                </div>
              </div>
            </div>
          </a-timeline-item>
        </a-timeline>
        <div v-if="flowList.length === 0" class="empty-flow">
          <a-empty description="暂无流转记录" />
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, defineExpose } from 'vue'
import { message } from 'ant-design-vue'
import {
  SendOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  UserOutlined,
  StopOutlined,
  PlayCircleOutlined
} from '@ant-design/icons-vue'

import {
  type WorkorderInstanceFlowItem,
  type ListWorkorderInstanceFlowReq,
  FlowAction,
  listWorkorderInstanceFlow
} from '#/api/core/workorder_instance_flow'

import { InstanceStatus } from '#/api/core/workorder_instance'

// 状态数据
const flowList = ref<WorkorderInstanceFlowItem[]>([])

// 流转记录对话框
const flowDialog = reactive({
  visible: false,
  instanceId: 0
})

// 响应式对话框宽度
const previewDialogWidth = computed(() => {
  if (typeof window !== 'undefined') {
    const width = window.innerWidth
    if (width < 768) return '95%'
    if (width < 1024) return '90%'
    return '80%'
  }
  return '80%'
})

// 工具方法
const formatFullDateTime = (dateStr: string | undefined) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getInitials = (name: string | undefined) => {
  if (!name) return ''
  return name
    .split('')
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

const getAvatarColor = (name: string | undefined) => {
  if (!name) return '#1890ff'

  const colors = [
    '#1890ff', '#52c41a', '#faad14', '#f5222d',
    '#722ed1', '#13c2c2', '#eb2f96', '#fa8c16'
  ]

  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }

  return colors[Math.abs(hash) % colors.length]
}

const getStatusText = (status: number): string => {
  const textMap = {
    [InstanceStatus.Draft]: '草稿',
    [InstanceStatus.Pending]: '待处理',
    [InstanceStatus.Processing]: '处理中',
    [InstanceStatus.Completed]: '已完成',
    [InstanceStatus.Rejected]: '已拒绝',
    [InstanceStatus.Cancelled]: '已取消'
  }
  return textMap[status as keyof typeof textMap] || '未知'
}

const getFlowActionColor = (action: string): string => {
  const colorMap: Record<string, string> = {
    [FlowAction.Submit]: 'orange',
    [FlowAction.Approve]: 'green',
    [FlowAction.Reject]: 'red',
    [FlowAction.Assign]: 'purple',
    [FlowAction.Cancel]: 'gray',
    [FlowAction.Complete]: 'green',
    [FlowAction.Return]: 'orange'
  }
  return colorMap[action] || 'blue'
}

const getFlowActionIcon = (action: string) => {
  const iconMap: Record<string, any> = {
    [FlowAction.Submit]: SendOutlined,
    [FlowAction.Approve]: CheckCircleOutlined,
    [FlowAction.Reject]: ExclamationCircleOutlined,
    [FlowAction.Assign]: UserOutlined,
    [FlowAction.Cancel]: StopOutlined,
    [FlowAction.Complete]: CheckCircleOutlined,
    [FlowAction.Return]: ExclamationCircleOutlined
  }
  return iconMap[action] || PlayCircleOutlined
}

const getFlowActionText = (action: string): string => {
  const textMap: Record<string, string> = {
    [FlowAction.Submit]: '提交工单',
    [FlowAction.Approve]: '审批通过',
    [FlowAction.Reject]: '审批拒绝',
    [FlowAction.Assign]: '指派处理人',
    [FlowAction.Cancel]: '取消工单',
    [FlowAction.Complete]: '完成工单',
    [FlowAction.Return]: '退回工单'
  }
  return textMap[action] || action
}

// 主要方法
const showFlow = async (instanceId: number) => {
  flowDialog.instanceId = instanceId
  flowDialog.visible = true

  try {
    const params: ListWorkorderInstanceFlowReq = {
      page: 1,
      size: 100,
      instance_id: instanceId
    }

    const res = await listWorkorderInstanceFlow(params)
    if (res && res.items) {
      flowList.value = res.items
    } else {
      flowList.value = []
    }
  } catch (error: any) {
    console.error('Failed to load flow:', error)
    message.error(`加载流转记录失败: ${error.message || '未知错误'}`)
    flowList.value = []
  }
}

// 导出方法供父组件调用
defineExpose({
  showFlow
})
</script>

<style scoped>
/* 流转记录样式增强 */
.flow-content {
  max-height: 600px;
  overflow-y: auto;
  padding: 8px;
  background: #f8fafb;
  border-radius: 8px;
}

.flow-content :deep(.ant-timeline) {
  padding: 16px 0;
}

.flow-content :deep(.ant-timeline-item) {
  padding-bottom: 24px;
}

.flow-content :deep(.ant-timeline-item-tail) {
  border-left: 3px solid;
  background: linear-gradient(to bottom, #e8f4f8, #d9ecf5);
  left: 8px;
  width: 3px;
}

.flow-content :deep(.ant-timeline-item-head) {
  width: 18px;
  height: 18px;
  left: 0px;
  border: 3px solid #fff;
  border-radius: 50%;
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.15);
}

.flow-content :deep(.ant-timeline-item-head-custom) {
  width: 24px;
  height: 24px;
  left: -2px;
  top: 0;
  background: #fff;
  border: 3px solid;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
}

.flow-content :deep(.ant-timeline-item-head-custom:hover) {
  transform: scale(1.1);
}

.flow-content :deep(.ant-timeline-item-content) {
  margin-left: 36px;
  padding: 0;
  top: -6px;
}

.flow-item {
  background: #ffffff;
  border-radius: 16px;
  padding: 24px;
  border: 1px solid #e1e8ed;
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
  position: relative;
  margin-left: 12px;
  overflow: hidden;
}

.flow-item:hover {
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}

.flow-item::before {
  content: '';
  position: absolute;
  left: -16px;
  top: 50%;
  transform: translateY(-50%);
  width: 0;
  height: 0;
  border-top: 10px solid transparent;
  border-bottom: 10px solid transparent;
  border-right: 12px solid #ffffff;
  filter: drop-shadow(-2px 0 2px rgba(0, 0, 0, 0.1));
}

.flow-item::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #1890ff, #40a9ff, #69c0ff);
  border-radius: 16px 16px 0 0;
}

.flow-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f2f5;
}

.flow-action {
  font-weight: 700;
  color: #2c3e50;
  font-size: 18px;
  display: flex;
  align-items: center;
  gap: 12px;
  position: relative;
}

.flow-action::before {
  content: '';
  width: 5px;
  height: 20px;
  background: linear-gradient(135deg, #52c41a, #73d13d);
  border-radius: 3px;
  box-shadow: 0 2px 4px rgba(82, 196, 26, 0.3);
}

.flow-time {
  font-size: 14px;
  color: #8c8c8c;
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
  padding: 8px 16px;
  border-radius: 24px;
  border: 1px solid #e8f0fe;
  white-space: nowrap;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.flow-content-detail {
  padding-left: 16px;
}

.operator-info {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
  padding: 14px;
  background: linear-gradient(135deg, #f0f8ff, #e6f4ff);
  border-radius: 12px;
  border: 1px solid #e1f3ff;
  position: relative;
}

.operator-info::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: linear-gradient(to bottom, #1890ff, #40a9ff);
  border-radius: 12px 0 0 12px;
}

.operator-info .ant-avatar {
  border: 3px solid #fff;
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
}

.operator-info .ant-avatar:hover {
  transform: scale(1.05);
}

.operator-name {
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
}

.status-change {
  margin: 16px 0;
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  padding: 16px;
  background: linear-gradient(135deg, #f9f9f9, #f0f2f5);
  border-radius: 12px;
  border: 1px solid #e8eaed;
  position: relative;
}

.status-change::before {
  content: '状态流转';
  position: absolute;
  top: -10px;
  left: 16px;
  background: linear-gradient(135deg, #f9f9f9, #f0f2f5);
  padding: 4px 12px;
  font-size: 12px;
  color: #8c8c8c;
  font-weight: 600;
  border-radius: 8px;
  border: 1px solid #e8eaed;
}

.from-status,
.to-status {
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  position: relative;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.from-status {
  background: linear-gradient(135deg, #f5f5f5, #e8e8e8);
  color: #666;
  border: 1px solid #d9d9d9;
}

.to-status {
  background: linear-gradient(135deg, #e6f7ff, #bae7ff);
  color: #1890ff;
  border: 1px solid #91d5ff;
}

.from-status:hover,
.to-status:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.arrow {
  color: #52c41a;
  font-weight: bold;
  font-size: 18px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.flow-comment {
  margin-top: 16px;
  padding: 20px;
  background: linear-gradient(135deg, #f6ffed, #f0f9ff);
  border-radius: 12px;
  line-height: 1.7;
  color: #2c3e50;
  font-size: 15px;
  border-left: 5px solid #52c41a;
  position: relative;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.flow-comment::before {
  content: '💬';
  position: absolute;
  top: -8px;
  left: 16px;
  background: linear-gradient(135deg, #f6ffed, #f0f9ff);
  padding: 4px 8px;
  border-radius: 8px;
  font-size: 16px;
  border: 1px solid #d9f7be;
}

.flow-comment strong {
  color: #52c41a;
  font-weight: 700;
  margin-right: 8px;
}

.empty-flow {
  text-align: center;
  padding: 80px 0;
  background: #fafbfc;
  border-radius: 16px;
  border: 2px dashed #e1e8ed;
  position: relative;
}

.empty-flow::before {
  content: '🔄';
  position: absolute;
  top: 30px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 32px;
  opacity: 0.5;
}

.empty-flow :deep(.ant-empty-description) {
  color: #8c8c8c;
  font-size: 18px;
  font-weight: 500;
  margin-top: 16px;
}

/* 流转对话框增强 */
.flow-dialog :deep(.ant-modal-header) {
  background: linear-gradient(135deg, #52c41a 0%, #73d13d 100%);
  border-radius: 8px 8px 0 0;
}

.flow-dialog :deep(.ant-modal-title) {
  color: white;
  font-weight: 700;
  font-size: 18px;
}

.flow-dialog :deep(.ant-modal-close) {
  color: white;
}

.flow-dialog :deep(.ant-modal-close:hover) {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 6px;
}

.flow-dialog :deep(.ant-modal-body) {
  padding: 0;
  background: #f8fafb;
}

/* 不同操作类型的特殊样式 */
.flow-item[data-action="submit"]::after {
  background: linear-gradient(90deg, #faad14, #ffc53d, #ffd666);
}

.flow-item[data-action="approve"]::after {
  background: linear-gradient(90deg, #52c41a, #73d13d, #95de64);
}

.flow-item[data-action="reject"]::after {
  background: linear-gradient(90deg, #ff4d4f, #ff7875, #ffa39e);
}

.flow-item[data-action="assign"]::after {
  background: linear-gradient(90deg, #722ed1, #9254de, #b37feb);
}

.flow-item[data-action="cancel"]::after {
  background: linear-gradient(90deg, #8c8c8c, #a6a6a6, #bfbfbf);
}

.flow-item[data-action="complete"]::after {
  background: linear-gradient(90deg, #52c41a, #73d13d, #95de64);
}

.flow-item[data-action="return"]::after {
  background: linear-gradient(90deg, #faad14, #ffc53d, #ffd666);
}

/* 系统操作标识 */
.flow-item:has(.ant-tag[color="orange"]) {
  background: linear-gradient(135deg, #fff7e6 0%, #fffbe6 100%);
  border-color: #ffe7ba;
}

.flow-item:has(.ant-tag[color="orange"])::after {
  background: linear-gradient(90deg, #faad14, #ffc53d, #ffd666);
}

/* 响应式对话框 */
.responsive-modal :deep(.ant-modal) {
  max-width: calc(100vw - 16px);
  margin: 8px;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .flow-content {
    padding: 4px;
  }
  
  .flow-item {
    padding: 18px;
    margin-left: 8px;
    border-radius: 12px;
  }
  
  .flow-item::before {
    left: -12px;
    border-right-width: 8px;
    border-top-width: 8px;
    border-bottom-width: 8px;
  }

  .flow-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 16px;
    padding-bottom: 12px;
  }

  .flow-action {
    font-size: 16px;
    gap: 8px;
  }

  .flow-action::before {
    width: 4px;
    height: 18px;
  }

  .flow-time {
    font-size: 13px;
    padding: 6px 12px;
  }

  .operator-info {
    padding: 12px;
    gap: 12px;
  }

  .operator-name {
    font-size: 15px;
  }

  .status-change {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
    padding: 12px;
  }

  .flow-comment {
    padding: 16px;
    font-size: 14px;
  }

  .flow-content :deep(.ant-timeline-item-content) {
    margin-left: 32px;
  }

  .flow-content :deep(.ant-timeline-item-head-custom) {
    width: 20px;
    height: 20px;
    left: -1px;
  }
}

/* 超小屏幕适配 */
@media (max-width: 480px) {
  .flow-item {
    padding: 16px;
    border-radius: 10px;
  }

  .flow-header {
    margin-bottom: 12px;
    padding-bottom: 10px;
  }

  .flow-action {
    font-size: 15px;
  }

  .flow-action::before {
    width: 3px;
    height: 16px;
  }

  .operator-info {
    flex-wrap: wrap;
    gap: 8px;
    padding: 10px;
  }

  .operator-name {
    font-size: 14px;
  }

  .status-change {
    padding: 10px;
    gap: 8px;
  }

  .from-status,
  .to-status {
    padding: 4px 12px;
    font-size: 13px;
  }

  .flow-comment {
    padding: 14px;
    font-size: 13px;
  }

  .flow-comment::before {
    font-size: 14px;
  }

  .empty-flow {
    padding: 60px 16px;
  }

  .empty-flow::before {
    font-size: 28px;
    top: 20px;
  }
}

/* 滚动条样式 */
.flow-content::-webkit-scrollbar {
  width: 8px;
}

.flow-content::-webkit-scrollbar-track {
  background: #f1f3f4;
  border-radius: 4px;
}

.flow-content::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #c1c1c1, #a8a8a8);
  border-radius: 4px;
}

.flow-content::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, #a8a8a8, #959595);
}

/* 加载动画 */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translate3d(0, 20px, 0);
  }
  to {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
}

.flow-item {
  animation: fadeInUp 0.5s ease-out;
}

.flow-item:nth-child(even) {
  animation-delay: 0.1s;
}

.flow-item:nth-child(odd) {
  animation-delay: 0.2s;
}
</style>