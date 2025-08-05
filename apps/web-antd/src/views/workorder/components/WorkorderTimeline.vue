<template>
  <div>
    <!-- 时间线对话框 -->
    <a-modal 
      :open="timelineDialog.visible" 
      title="工单时间线" 
      :width="previewDialogWidth" 
      :footer="null"
      @cancel="() => { timelineDialog.visible = false }" 
      class="timeline-dialog responsive-modal"
    >
      <div class="timeline-content">
        <a-timeline>
          <a-timeline-item 
            v-for="item in timelineList" 
            :key="item.id" 
            :color="getTimelineColor(item.action)"
          >
            <template #dot>
              <component :is="getTimelineIcon(item.action)" />
            </template>
            <div class="timeline-item">
              <div class="timeline-header">
                <span class="action-type">{{ getActionText(item.action) }}</span>
                <span class="action-time">{{ formatFullDateTime(item.created_at) }}</span>
              </div>
              <div class="action-content">
                <div class="operator-info">
                  <a-avatar size="small" :style="{ backgroundColor: getAvatarColor(item.operator_name || '') }">
                    {{ getInitials(item.operator_name) }}
                  </a-avatar>
                  <span class="operator-name">{{ item.operator_name }}</span>
                </div>
                <div class="action-comment" v-if="item.comment">
                  {{ item.comment }}
                </div>
                <div class="action-data" v-if="item.action_detail">
                  <pre class="json-content">{{ JSON.stringify(JSON.parse(item.action_detail), null, 2) }}</pre>
                </div>
              </div>
            </div>
          </a-timeline-item>
        </a-timeline>
        <div v-if="timelineList.length === 0" class="empty-timeline">
          <a-empty description="暂无时间线记录" />
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, defineExpose } from 'vue'
import { message } from 'ant-design-vue'
import {
  PlusOutlined,
  EditOutlined,
  SendOutlined,
  UserOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  StopOutlined,
  MessageOutlined,
  FileTextOutlined
} from '@ant-design/icons-vue'

import {
  type WorkorderInstanceTimelineItem,
  type ListWorkorderInstanceTimelineReq,
  TimelineAction,
  listWorkorderInstanceTimeline
} from '#/api/core/workorder_instance_time_line'

// 状态数据
const timelineList = ref<WorkorderInstanceTimelineItem[]>([])

// 时间线对话框
const timelineDialog = reactive({
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

const getTimelineColor = (action: string): string => {
  const colorMap: Record<string, string> = {
    [TimelineAction.Create]: 'green',
    [TimelineAction.Update]: 'blue',
    [TimelineAction.Submit]: 'orange',
    [TimelineAction.Assign]: 'purple',
    [TimelineAction.Approve]: 'green',
    [TimelineAction.Reject]: 'red',
    [TimelineAction.Cancel]: 'gray',
    [TimelineAction.Complete]: 'green',
    [TimelineAction.Return]: 'orange',
    [TimelineAction.Comment]: 'blue',
    [TimelineAction.View]: 'cyan',
    [TimelineAction.Attach]: 'purple',
    [TimelineAction.Notify]: 'orange',
    [TimelineAction.Remind]: 'red'
  }
  return colorMap[action] || 'blue'
}

const getTimelineIcon = (action: string) => {
  const iconMap: Record<string, any> = {
    [TimelineAction.Create]: PlusOutlined,
    [TimelineAction.Update]: EditOutlined,
    [TimelineAction.Submit]: SendOutlined,
    [TimelineAction.Assign]: UserOutlined,
    [TimelineAction.Approve]: CheckCircleOutlined,
    [TimelineAction.Reject]: ExclamationCircleOutlined,
    [TimelineAction.Cancel]: StopOutlined,
    [TimelineAction.Complete]: CheckCircleOutlined,
    [TimelineAction.Return]: ExclamationCircleOutlined,
    [TimelineAction.Comment]: MessageOutlined,
    [TimelineAction.View]: FileTextOutlined,
    [TimelineAction.Attach]: PlusOutlined,
    [TimelineAction.Notify]: MessageOutlined,
    [TimelineAction.Remind]: ExclamationCircleOutlined
  }
  return iconMap[action] || EditOutlined
}

const getActionText = (action: string): string => {
  const textMap: Record<string, string> = {
    [TimelineAction.Create]: '创建工单',
    [TimelineAction.Update]: '更新工单',
    [TimelineAction.Submit]: '提交工单',
    [TimelineAction.Assign]: '分配处理人',
    [TimelineAction.Approve]: '审批通过',
    [TimelineAction.Reject]: '拒绝工单',
    [TimelineAction.Cancel]: '取消工单',
    [TimelineAction.Complete]: '完成工单',
    [TimelineAction.Return]: '退回工单',
    [TimelineAction.Comment]: '添加评论',
    [TimelineAction.View]: '查看工单',
    [TimelineAction.Attach]: '添加附件',
    [TimelineAction.Notify]: '发送通知',
    [TimelineAction.Remind]: '催办提醒'
  }
  return textMap[action] || action
}

// 主要方法
const showTimeline = async (instanceId: number) => {
  timelineDialog.instanceId = instanceId
  timelineDialog.visible = true

  try {
    const params: ListWorkorderInstanceTimelineReq = {
      page: 1,
      size: 100,
      instance_id: instanceId
    }

    const res = await listWorkorderInstanceTimeline(params)
    if (res) {
      timelineList.value = res.items
    } else {
      timelineList.value = []
    }
  } catch (error: any) {
    console.error('Failed to load timeline:', error)
    message.error(`加载时间线失败: ${error.message || '未知错误'}`)
    timelineList.value = []
  }
}

// 导出方法供父组件调用
defineExpose({
  showTimeline
})
</script>

<style scoped>
/* 时间线样式增强 */
.timeline-content {
  max-height: 600px;
  overflow-y: auto;
  padding: 8px;
  background: #f8fafb;
  border-radius: 8px;
}

.timeline-content :deep(.ant-timeline) {
  padding: 16px 0;
}

.timeline-content :deep(.ant-timeline-item) {
  padding-bottom: 24px;
}

.timeline-content :deep(.ant-timeline-item-tail) {
  border-left: 2px solid #e8f4f8;
  left: 8px;
}

.timeline-content :deep(.ant-timeline-item-head) {
  width: 16px;
  height: 16px;
  left: 1px;
  border: 3px solid #fff;
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.timeline-content :deep(.ant-timeline-item-head-custom) {
  width: 20px;
  height: 20px;
  left: -1px;
  top: 0;
  background: #fff;
  border: 2px solid;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.timeline-content :deep(.ant-timeline-item-content) {
  margin-left: 32px;
  padding: 0;
  top: -6px;
}

.timeline-item {
  background: #ffffff;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid #e1e8ed;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.3s ease;
  position: relative;
  margin-left: 8px;
}

.timeline-item:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  transform: translateY(-1px);
}

.timeline-item::before {
  content: '';
  position: absolute;
  left: -12px;
  top: 50%;
  transform: translateY(-50%);
  width: 0;
  height: 0;
  border-top: 8px solid transparent;
  border-bottom: 8px solid transparent;
  border-right: 8px solid #ffffff;
  filter: drop-shadow(-1px 0 1px rgba(0, 0, 0, 0.1));
}

.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f2f5;
}

.action-type {
  font-weight: 600;
  color: #2c3e50;
  font-size: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.action-type::before {
  content: '';
  width: 4px;
  height: 16px;
  background: linear-gradient(135deg, #1890ff, #40a9ff);
  border-radius: 2px;
}

.action-time {
  font-size: 13px;
  color: #8c8c8c;
  background: #f8f9fa;
  padding: 6px 12px;
  border-radius: 20px;
  border: 1px solid #e8f0fe;
  white-space: nowrap;
}

.action-content {
  padding-left: 12px;
}

.operator-info {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  padding: 10px;
  background: #f0f8ff;
  border-radius: 8px;
  border: 1px solid #e1f3ff;
}

.operator-info .ant-avatar {
  border: 2px solid #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.operator-name {
  font-size: 15px;
  font-weight: 500;
  color: #2c3e50;
}

.action-comment {
  margin: 12px 0;
  padding: 16px;
  background: #f8fafb;
  border-radius: 8px;
  border-left: 4px solid #52c41a;
  color: #2c3e50;
  line-height: 1.6;
  font-size: 14px;
  position: relative;
}

.action-comment::before {
  content: '"';
  position: absolute;
  top: -5px;
  left: 8px;
  font-size: 24px;
  color: #52c41a;
  font-weight: bold;
}

.action-data {
  margin-top: 12px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
  border: 1px solid #e8eaed;
  font-size: 12px;
  position: relative;
}

.action-data::before {
  content: '详细数据';
  position: absolute;
  top: -8px;
  left: 12px;
  background: #f5f7fa;
  padding: 0 8px;
  font-size: 11px;
  color: #8c8c8c;
  font-weight: 500;
}

.json-content {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 12px;
  line-height: 1.5;
  color: #495057;
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
  background: #ffffff;
  padding: 12px;
  border-radius: 6px;
  border: 1px solid #e8eaed;
  max-height: 200px;
  overflow-y: auto;
}

.empty-timeline {
  text-align: center;
  padding: 60px 0;
  background: #fafbfc;
  border-radius: 12px;
  border: 2px dashed #e1e8ed;
}

.empty-timeline :deep(.ant-empty-description) {
  color: #8c8c8c;
  font-size: 16px;
}

/* 时间线对话框增强 */
.timeline-dialog :deep(.ant-modal-header) {
  background: linear-gradient(135deg, #722ed1 0%, #9254de 100%);
  border-radius: 8px 8px 0 0;
}

.timeline-dialog :deep(.ant-modal-title) {
  color: white;
  font-weight: 600;
}

.timeline-dialog :deep(.ant-modal-close) {
  color: white;
}

.timeline-dialog :deep(.ant-modal-close:hover) {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

.timeline-dialog :deep(.ant-modal-body) {
  padding: 0;
  background: #f8fafb;
}

/* 不同操作类型的特殊样式 */
.timeline-item[data-action="create"] {
  border-left: 4px solid #52c41a;
}

.timeline-item[data-action="update"] {
  border-left: 4px solid #1890ff;
}

.timeline-item[data-action="submit"] {
  border-left: 4px solid #faad14;
}

.timeline-item[data-action="approve"] {
  border-left: 4px solid #52c41a;
}

.timeline-item[data-action="reject"] {
  border-left: 4px solid #ff4d4f;
}

/* 响应式对话框 */
.responsive-modal :deep(.ant-modal) {
  max-width: calc(100vw - 16px);
  margin: 8px;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .timeline-content {
    padding: 4px;
  }
  
  .timeline-item {
    padding: 16px;
    margin-left: 4px;
  }
  
  .timeline-item::before {
    left: -8px;
    border-right-width: 6px;
    border-top-width: 6px;
    border-bottom-width: 6px;
  }

  .timeline-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .action-type {
    font-size: 15px;
  }

  .action-time {
    font-size: 12px;
    padding: 4px 8px;
  }

  .operator-info {
    padding: 8px;
    gap: 8px;
  }

  .operator-name {
    font-size: 14px;
  }

  .action-comment {
    padding: 12px;
    font-size: 13px;
  }

  .action-data {
    padding: 12px;
    font-size: 11px;
  }

  .json-content {
    font-size: 11px;
    padding: 8px;
    max-height: 150px;
  }

  .timeline-content :deep(.ant-timeline-item-content) {
    margin-left: 28px;
  }
}

/* 超小屏幕适配 */
@media (max-width: 480px) {
  .timeline-item {
    padding: 12px;
    border-radius: 8px;
  }

  .timeline-header {
    margin-bottom: 12px;
    padding-bottom: 8px;
  }

  .action-type {
    font-size: 14px;
  }

  .action-type::before {
    width: 3px;
    height: 14px;
  }

  .operator-info {
    flex-wrap: wrap;
    gap: 6px;
  }

  .action-comment {
    padding: 10px;
    font-size: 12px;
  }

  .action-data::before {
    font-size: 10px;
  }

  .empty-timeline {
    padding: 40px 16px;
  }
}

/* 滚动条样式 */
.timeline-content::-webkit-scrollbar {
  width: 6px;
}

.timeline-content::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.timeline-content::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.timeline-content::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

.json-content::-webkit-scrollbar {
  width: 4px;
}

.json-content::-webkit-scrollbar-track {
  background: #f8f9fa;
}

.json-content::-webkit-scrollbar-thumb {
  background: #d1d9e6;
  border-radius: 2px;
}
</style>