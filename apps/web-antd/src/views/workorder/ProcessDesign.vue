<template>
  <div class="process-design-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">流程设计器</h1>
        <div class="header-actions">
          <a-space>
            <a-button type="primary" @click="saveProcess">
              <SaveOutlined /> 保存流程
            </a-button>
            <a-button @click="previewFlow">
              <EyeOutlined /> 预览
            </a-button>
            <a-button @click="validateFlow">
              <CheckCircleOutlined /> 验证
            </a-button>
          </a-space>
        </div>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="page-content">
      <div class="design-container">
        <!-- 左侧工具栏 -->
        <div class="design-sidebar">
          <div class="sidebar-section">
            <h3 class="section-title">流程元素</h3>
            <div class="element-list">
              <div v-for="elementType in stepTypes" :key="elementType.value" class="element-item"
                @click="addProcessStep(elementType.value)">
                <div class="element-icon" :class="getStepTypeClass(elementType.value)">
                  <component :is="getStepIcon(elementType.value)" />
                </div>
                <span class="element-name">{{ elementType.label }}</span>
              </div>
            </div>
          </div>

          <div class="sidebar-section">
            <h3 class="section-title">设计模式</h3>
            <a-radio-group v-model:value="editMode" class="mode-selector">
              <a-radio-button value="visual">可视化</a-radio-button>
              <a-radio-button value="json">JSON</a-radio-button>
            </a-radio-group>
          </div>
        </div>

        <!-- 中间设计画布 -->
        <div class="design-canvas">
          <!-- 可视化设计模式 -->
          <div v-if="editMode === 'visual'" class="visual-canvas">
            <div v-if="processSteps.length === 0" class="empty-canvas">
              <div class="empty-content">
                <PlayCircleOutlined class="empty-icon" />
                <h3>开始设计流程</h3>
                <p>从左侧拖拽或点击元素来创建您的流程</p>
                <a-button type="primary" @click="addProcessStep(ProcessStepType.Start)">
                  创建开始节点
                </a-button>
              </div>
            </div>

            <div v-else class="canvas-content">
              <div class="flow-diagram" ref="flowDiagramRef">
                <!-- SVG 连接线层 - 放在最下层 -->
                <svg class="connection-svg" v-if="connections.length > 0">
                  <defs>
                    <marker id="arrowhead" markerWidth="12" markerHeight="8" refX="10" refY="4" orient="auto"
                      markerUnits="strokeWidth">
                      <path d="M0,0 L0,8 L12,4 z" fill="#52c41a" stroke="#52c41a" stroke-width="1" />
                    </marker>
                    <!-- 渐变定义 -->
                    <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style="stop-color:#52c41a;stop-opacity:0.8" />
                      <stop offset="100%" style="stop-color:#1890ff;stop-opacity:0.8" />
                    </linearGradient>
                  </defs>
                  <path v-for="connection in connections" :key="`${connection.from}-${connection.to}`"
                    :d="getConnectionPath(connection)" stroke="url(#connectionGradient)" stroke-width="3" fill="none"
                    marker-end="url(#arrowhead)" class="connection-line"
                    :class="{ 'connection-highlighted': isConnectionHighlighted(connection) }" />
                </svg>

                <!-- 流程步骤节点层 -->
                <div class="steps-container">
                  <div v-for="step in sortedProcessSteps" :key="step.id" class="flow-step" :class="{
                    'step-selected': selectedStep?.id === step.id,
                    [getStepTypeClass(step.type)]: true
                  }" :data-step-id="step.id" @click="selectStepById(step.id)"
                    @mouseenter="highlightConnections(step.id)" @mouseleave="clearConnectionHighlight">
                    <div class="step-header">
                      <div class="step-icon">
                        <component :is="getStepIcon(step.type)" />
                      </div>
                      <div class="step-content">
                        <div class="step-title">{{ step.name || `步骤 ${step.sort_order}` }}</div>
                        <div class="step-subtitle">{{ getStepTypeText(step.type) }}</div>
                      </div>
                      <div class="step-actions">
                        <a-dropdown :trigger="['click']">
                          <a-button type="text" size="small">
                            <MoreOutlined />
                          </a-button>
                          <template #overlay>
                            <a-menu>
                              <a-menu-item @click="duplicateStep(step.id)">
                                <CopyOutlined /> 复制
                              </a-menu-item>
                              <a-menu-item @click="removeStepById(step.id)" danger>
                                <DeleteOutlined /> 删除
                              </a-menu-item>
                            </a-menu>
                          </template>
                        </a-dropdown>
                      </div>
                    </div>

                    <!-- 步骤详细信息 -->
                    <div class="step-details">
                      <div v-if="step.assignee_type && step.assignee_ids?.length" class="step-assignees">
                        <UserOutlined />
                        <span>{{ getAssigneeTypeText(step.assignee_type) }}: {{ step.assignee_ids.length }}人</span>
                      </div>

                      <div v-if="step.actions?.length" class="step-actions-list">
                        <a-tag v-for="action in step.actions" :key="action" size="small" color="blue">
                          {{ getActionText(action) }}
                        </a-tag>
                      </div>
                    </div>

                    <!-- 连接点指示器 -->
                    <div v-if="getOutgoingConnections(step.id).length > 0" class="connection-indicators">
                      <div class="outgoing-indicator">
                        <div class="indicator-dot"></div>
                        <span class="indicator-text">{{ getOutgoingConnections(step.id).length }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- JSON编辑模式 -->
          <div v-else class="json-canvas">
            <div class="json-header">
              <h3>JSON 流程定义</h3>
              <a-space>
                <a-button @click="formatJson">
                  <FormatPainterOutlined /> 格式化
                </a-button>
                <a-button @click="validateJson">
                  <CheckCircleOutlined /> 验证
                </a-button>
                <a-button type="primary" @click="syncToVisual">
                  <SyncOutlined /> 同步到可视化
                </a-button>
              </a-space>
            </div>
            <div class="json-editor">
              <a-textarea v-model:value="definitionJsonString" :rows="25" placeholder="请输入流程定义JSON..."
                class="json-input" />
            </div>
          </div>
        </div>

        <!-- 右侧属性面板 -->
        <div class="design-properties">
          <div v-if="selectedStep" class="properties-panel">
            <div class="panel-header">
              <h3>属性设置</h3>
              <a-button type="text" size="small" @click="clearSelection">
                <CloseOutlined />
              </a-button>
            </div>

            <div class="panel-content">
              <a-form layout="vertical" :model="selectedStep">
                <!-- 基础信息 -->
                <div class="form-section">
                  <h4>基础信息</h4>
                  <a-form-item label="步骤名称">
                    <a-input v-model:value="selectedStep.name" placeholder="请输入步骤名称" />
                  </a-form-item>

                  <a-form-item label="步骤类型">
                    <a-select v-model:value="selectedStep.type" placeholder="选择步骤类型" :options="stepTypes" />
                  </a-form-item>

                  <a-form-item label="排序">
                    <a-input-number v-model:value="selectedStep.sort_order" :min="1" style="width: 100%" />
                  </a-form-item>
                </div>

                <!-- 受理人设置 -->
                <div class="form-section">
                  <h4>受理人设置</h4>
                  <a-form-item label="受理人类型">
                    <a-select v-model:value="selectedStep.assignee_type" placeholder="选择受理人类型" allow-clear
                      :options="assigneeTypes" />
                  </a-form-item>

                  <a-form-item label="受理人">
                    <a-select v-model:value="selectedStep.assignee_ids" mode="multiple" placeholder="选择受理人"
                      style="width: 100%" :loading="userListLoading" show-search :filter-option="false"
                      @search="handleUserSearch" @focus="loadUsers">
                      <a-select-option v-for="user in userList" :key="user.user_id" :value="user.user_id">
                        {{ user.username }} ({{ user.real_name }})
                      </a-select-option>
                    </a-select>
                  </a-form-item>
                </div>

                <!-- 动作设置 -->
                <div class="form-section">
                  <h4>可执行动作</h4>
                  <a-form-item>
                    <a-checkbox-group v-model:value="selectedStep.actions" :options="actionOptions" />
                  </a-form-item>
                </div>

                <!-- 流程连接 -->
                <div class="form-section">
                  <h4>流程连接</h4>
                  <a-form-item label="后续步骤">
                    <a-select v-model:value="selectedStepConnections" mode="multiple" placeholder="选择后续步骤"
                      style="width: 100%" :options="otherStepsOptions" />
                  </a-form-item>
                </div>
              </a-form>
            </div>
          </div>

          <div v-else class="no-selection">
            <div class="no-selection-content">
              <SelectOutlined class="no-selection-icon" />
              <h4>选择一个步骤</h4>
              <p>点击画布中的步骤来编辑其属性</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 预览模态框 -->
    <a-modal v-model:open="isPreviewModalVisible" title="流程预览" :footer="null" width="800px" class="preview-modal">
      <div class="preview-container">
        <div v-if="processSteps.length === 0" class="preview-empty">
          <a-empty description="暂无流程步骤可预览" />
        </div>
        <div v-else class="preview-flow">
          <div v-for="(step, index) in sortedProcessSteps" :key="`preview-${step.id}`" class="preview-step"
            :class="getStepTypeClass(step.type)">
            <div class="preview-step-icon">
              <component :is="getStepIcon(step.type)" />
            </div>
            <div class="preview-step-info">
              <h4>{{ step.name }}</h4>
              <p>{{ getStepTypeText(step.type) }}</p>
              <div v-if="step.assignee_ids?.length" class="preview-assignees">
                受理人: {{ step.assignee_ids.length }}人
              </div>
            </div>
          </div>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue';
import { message, Modal } from 'ant-design-vue';
import {
  SaveOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  PlayCircleOutlined,
  StopOutlined,
  EditOutlined,
  UserOutlined,
  MoreOutlined,
  CopyOutlined,
  DeleteOutlined,
  CloseOutlined,
  FormatPainterOutlined,
  SyncOutlined,
  SelectOutlined
} from '@ant-design/icons-vue';

import {
  type GetUserListReq,
  getUserList
} from '#/api/core/user';
import type { UserInfo } from '@vben/types';

// 枚举定义
enum ProcessStepType {
  Start = 'Start',
  Approval = 'Approval',
  Task = 'Task',
  End = 'End'
}

enum Action {
  Start = 'Start',
  Approve = 'Approve',
  Reject = 'Reject',
  Complete = 'Complete',
  Notify = 'Notify'
}

enum AssigneeType {
  User = 'User',
  Group = 'Group'
}

// 类型定义
interface ProcessStep {
  id: string;
  type: ProcessStepType;
  name: string;
  assignee_type?: AssigneeType;
  assignee_ids?: string[];
  actions?: Action[];
  sort_order: number;
}

interface Connection {
  from: string;
  to: string;
}

interface ProcessDefinition {
  steps: ProcessStep[];
  connections: Connection[];
}

// 响应式数据
const editMode = ref<'visual' | 'json'>('visual');
const processSteps = ref<ProcessStep[]>([]);
const connections = ref<Connection[]>([]);
const selectedStepIndex = ref<number | null>(null);
const isPreviewModalVisible = ref(false);
const definitionJsonString = ref('{"steps":[],"connections":[]}');
const flowDiagramRef = ref<HTMLElement>();
const highlightedStepId = ref<string | null>(null);

// 用户相关数据
const userList = ref<UserInfo[]>([]);
const userListLoading = ref(false);
const userSearchKeyword = ref('');

// 配置选项
const stepTypes = [
  { label: '开始', value: ProcessStepType.Start },
  { label: '审批', value: ProcessStepType.Approval },
  { label: '任务', value: ProcessStepType.Task },
  { label: '结束', value: ProcessStepType.End }
];

const assigneeTypes = [
  { label: '用户', value: AssigneeType.User },
  { label: '系统', value: AssigneeType.Group }
];

const actionOptions = [
  { label: '开始', value: Action.Start },
  { label: '审批', value: Action.Approve },
  { label: '驳回', value: Action.Reject },
  { label: '完成', value: Action.Complete },
  { label: '通知', value: Action.Notify }
];

// 计算属性
const selectedStep = computed(() => {
  if (selectedStepIndex.value === null) return null;
  return processSteps.value[selectedStepIndex.value] || null;
});

const sortedProcessSteps = computed(() => {
  return [...processSteps.value].sort((a, b) => a.sort_order - b.sort_order);
});

const otherStepsOptions = computed(() => {
  if (!selectedStep.value) return [];
  return processSteps.value
    .filter(step => step.id !== selectedStep.value!.id)
    .map(step => ({
      label: `${step.name} (${getStepTypeText(step.type)})`,
      value: step.id
    }));
});

const selectedStepConnections = computed({
  get() {
    if (!selectedStep.value) return [];
    return connections.value
      .filter(c => c.from === selectedStep.value!.id)
      .map(c => c.to);
  },
  set(newTargetIds: string[]) {
    if (!selectedStep.value) return;
    const currentStepId = selectedStep.value.id;
    const otherConnections = connections.value.filter(c => c.from !== currentStepId);
    const newConns = newTargetIds.map(targetId => ({ from: currentStepId, to: targetId }));
    connections.value = [...otherConnections, ...newConns];
  }
});

// 生命周期
onMounted(() => {
  loadUsers();
});

// 获取步骤元素位置的辅助函数
const getStepElement = (stepId: string): HTMLElement | null => {
  return document.querySelector(`[data-step-id="${stepId}"]`) as HTMLElement;
};

// 计算两个步骤之间的距离和角度
const getStepRelativePosition = (fromId: string, toId: string) => {
  const fromStep = sortedProcessSteps.value.find(s => s.id === fromId);
  const toStep = sortedProcessSteps.value.find(s => s.id === toId);
  if (!fromStep || !toStep) return { distance: 0, isReverse: false };
  return {
    distance: Math.abs(toStep.sort_order - fromStep.sort_order),
    isReverse: toStep.sort_order < fromStep.sort_order
  };
};

// 计算优雅的曲线连接路径
const getConnectionPath = (connection: Connection): string => {
  const fromElement = getStepElement(connection.from);
  const toElement = getStepElement(connection.to);

  if (!fromElement || !toElement || !flowDiagramRef.value) return '';

  const containerRect = flowDiagramRef.value.getBoundingClientRect();
  const fromRect = fromElement.getBoundingClientRect();
  const toRect = toElement.getBoundingClientRect();

  // 计算相对于容器的位置
  const fromX = fromRect.left - containerRect.left + fromRect.width / 2;
  const fromY = fromRect.bottom - containerRect.top;
  const toX = toRect.left - containerRect.left + toRect.width / 2;
  const toY = toRect.top - containerRect.top;

  const { distance, isReverse } = getStepRelativePosition(connection.from, connection.to);

  // 根据距离和方向调整曲线参数
  const baseOffset = 80;
  const distanceMultiplier = Math.min(distance * 20, 100);
  const horizontalOffset = Math.abs(toX - fromX) > 50 ? Math.abs(toX - fromX) / 2 : baseOffset;

  let controlX1, controlY1, controlX2, controlY2;

  if (isReverse) {
    // 反向连接（如3→1），使用更大的侧向曲线
    const sideOffset = horizontalOffset + distanceMultiplier;
    const direction = fromX < toX ? 1 : -1;

    controlX1 = fromX + direction * sideOffset;
    controlY1 = fromY + baseOffset;
    controlX2 = toX + direction * sideOffset;
    controlY2 = toY - baseOffset;
  } else {
    // 正向连接，使用适中的曲线
    const verticalOffset = Math.max(baseOffset, distanceMultiplier);

    if (Math.abs(toX - fromX) > 100) {
      // 大横向距离时使用S型曲线
      controlX1 = fromX + (toX - fromX) * 0.2;
      controlY1 = fromY + verticalOffset;
      controlX2 = toX - (toX - fromX) * 0.2;
      controlY2 = toY - verticalOffset;
    } else {
      // 小横向距离时使用垂直曲线
      controlX1 = fromX;
      controlY1 = fromY + verticalOffset;
      controlX2 = toX;
      controlY2 = toY - verticalOffset;
    }
  }

  return `M ${fromX} ${fromY} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${toX} ${toY}`;
};

// 连接高亮相关方法
const highlightConnections = (stepId: string) => {
  highlightedStepId.value = stepId;
};

const clearConnectionHighlight = () => {
  highlightedStepId.value = null;
};

const isConnectionHighlighted = (connection: Connection): boolean => {
  return highlightedStepId.value === connection.from || highlightedStepId.value === connection.to;
};

// 获取步骤的出连接
const getOutgoingConnections = (stepId: string) => {
  return connections.value.filter(c => c.from === stepId);
};

// 方法
const loadUsers = async () => {
  try {
    userListLoading.value = true;
    const req: GetUserListReq = {
      page: 1,
      size: 100,
      search: userSearchKeyword.value
    };
    const response = await getUserList(req);
    userList.value = response.items || [];
  } catch (error) {
    message.error('加载用户列表失败');
  } finally {
    userListLoading.value = false;
  }
};

const handleUserSearch = (value: string) => {
  userSearchKeyword.value = value;
  loadUsers();
};

const addProcessStep = (type: ProcessStepType = ProcessStepType.Approval) => {
  const tempId = `step_${Date.now()}`;
  const newStep: ProcessStep = {
    id: tempId,
    type,
    name: `新${getStepTypeText(type)}`,
    assignee_type: AssigneeType.User,
    assignee_ids: [],
    actions: type === ProcessStepType.Approval ? [Action.Approve, Action.Reject] : [Action.Complete],
    sort_order: Math.max(0, ...processSteps.value.map(s => s.sort_order)) + 1
  };
  processSteps.value.push(newStep);
  selectStepById(tempId);
};

const duplicateStep = (stepId: string) => {
  const originalStep = processSteps.value.find(s => s.id === stepId);
  if (!originalStep) return;

  const duplicatedStep: ProcessStep = {
    ...originalStep,
    id: `step_${Date.now()}`,
    name: `${originalStep.name} (副本)`,
    sort_order: Math.max(0, ...processSteps.value.map(s => s.sort_order)) + 1
  };
  processSteps.value.push(duplicatedStep);
  selectStepById(duplicatedStep.id);
};

const removeStepById = (stepId: string) => {
  const index = processSteps.value.findIndex(s => s.id === stepId);
  if (index === -1) return;

  processSteps.value.splice(index, 1);
  connections.value = connections.value.filter(c => c.from !== stepId && c.to !== stepId);

  if (selectedStep.value?.id === stepId) {
    selectedStepIndex.value = null;
  }
  message.success('步骤已删除');
};

const selectStepById = (stepId: string) => {
  const index = processSteps.value.findIndex(s => s.id === stepId);
  if (index !== -1) {
    selectedStepIndex.value = index;
  }
};

const clearSelection = () => {
  selectedStepIndex.value = null;
};

const saveProcess = () => {
  if (processSteps.value.length === 0) {
    message.warning('请先添加流程步骤');
    return;
  }
  message.success('流程保存成功');
};

const previewFlow = () => {
  if (processSteps.value.length === 0) {
    message.warning('请先添加流程步骤');
    return;
  }
  isPreviewModalVisible.value = true;
};

const validateFlow = () => {
  const errors: string[] = [];

  if (processSteps.value.length === 0) {
    errors.push('流程至少需要一个步骤');
  } else {
    const startSteps = processSteps.value.filter(s => s.type === ProcessStepType.Start);
    if (startSteps.length === 0) {
      errors.push('流程必须有一个"开始"类型的步骤');
    }
    if (startSteps.length > 1) {
      errors.push('流程只能有一个"开始"类型的步骤');
    }
  }

  processSteps.value.forEach((step) => {
    if (!step.name?.trim()) {
      errors.push(`步骤 (${step.id}) 缺少名称`);
    }
  });

  if (errors.length > 0) {
    Modal.error({
      title: '流程验证失败',
      content: errors.join('\n')
    });
  } else {
    message.success('流程验证通过！');
  }
};

const formatJson = () => {
  try {
    const parsed = JSON.parse(definitionJsonString.value);
    definitionJsonString.value = JSON.stringify(parsed, null, 2);
    message.success('JSON已格式化');
  } catch {
    message.error('JSON格式错误，无法格式化');
  }
};

const validateJson = () => {
  try {
    const parsed = JSON.parse(definitionJsonString.value);
    if (!parsed.steps || !Array.isArray(parsed.steps)) {
      message.error('JSON缺少有效的steps数组');
      return;
    }
    message.success('JSON格式验证通过');
  } catch {
    message.error('JSON格式错误');
  }
};

const syncToVisual = () => {
  try {
    const definition = JSON.parse(definitionJsonString.value);
    if (definition.steps && Array.isArray(definition.steps)) {
      processSteps.value = definition.steps;
      connections.value = definition.connections || [];
      message.success('已从JSON同步到可视化设计');
    } else {
      message.error('JSON中没有有效的steps数据');
    }
  } catch {
    message.error('JSON格式错误，无法同步');
  }
};

// 辅助方法
const getStepTypeClass = (type: ProcessStepType): string => {
  return `step-${type.toLowerCase()}`;
};

const getStepIcon = (type: ProcessStepType) => {
  const icons = {
    [ProcessStepType.Start]: PlayCircleOutlined,
    [ProcessStepType.Approval]: CheckCircleOutlined,
    [ProcessStepType.Task]: EditOutlined,
    [ProcessStepType.End]: StopOutlined
  };
  return icons[type] || EditOutlined;
};

const getStepTypeText = (type: ProcessStepType): string => {
  const texts = {
    [ProcessStepType.Start]: '开始',
    [ProcessStepType.Approval]: '审批',
    [ProcessStepType.Task]: '任务',
    [ProcessStepType.End]: '结束'
  };
  return texts[type] || '未知';
};

const getAssigneeTypeText = (type: AssigneeType | undefined): string => {
  return type === AssigneeType.User ? '用户' : '系统';
};

const getActionText = (action: Action): string => {
  const texts = {
    [Action.Start]: '开始',
    [Action.Approve]: '审批',
    [Action.Reject]: '驳回',
    [Action.Complete]: '完成',
    [Action.Notify]: '通知'
  };
  return texts[action] || action;
};

// 监听器
watch([processSteps, connections], () => {
  const definition: ProcessDefinition = {
    steps: processSteps.value,
    connections: connections.value,
  };
  definitionJsonString.value = JSON.stringify(definition, null, 2);
}, { deep: true });

// 监听连接变化，重新渲染连接线
watch(connections, () => {
  nextTick(() => {
    // 触发重新渲染连接线
  });
}, { deep: true });
</script>

<style scoped>
.process-design-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
}

.page-header {
  background: white;
  border-bottom: 1px solid #e8e8e8;
  padding: 0 24px;
  height: 64px;
  display: flex;
  align-items: center;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.page-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #262626;
}

.page-content {
  flex: 1;
  overflow: hidden;
}

.design-container {
  display: grid;
  grid-template-columns: 280px 1fr 350px;
  height: 100%;
  gap: 0;
}

/* 左侧工具栏 */
.design-sidebar {
  background: white;
  border-right: 1px solid #e8e8e8;
  padding: 24px;
  overflow-y: auto;
}

.sidebar-section {
  margin-bottom: 32px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #262626;
  margin-bottom: 16px;
}

.element-list {
  display: grid;
  gap: 12px;
}

.element-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.element-item:hover {
  border-color: #1890ff;
  background: #f6ffed;
}

.element-icon {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 14px;
}

.element-name {
  font-size: 13px;
  color: #595959;
}

.mode-selector {
  width: 100%;
}

/* 中间画布区域 */
.design-canvas {
  background: #fafafa;
  overflow: auto;
  position: relative;
}

.visual-canvas {
  padding: 32px;
  min-height: 100%;
}

.empty-canvas {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 60vh;
}

.empty-content {
  text-align: center;
  color: #8c8c8c;
}

.empty-icon {
  font-size: 64px;
  color: #d9d9d9;
  margin-bottom: 16px;
}

.canvas-content {
  max-width: 800px;
  margin: 0 auto;
}

/* 流程图容器 */
.flow-diagram {
  position: relative;
  min-height: 600px;
  padding: 40px 20px;
}

.steps-container {
  position: relative;
  z-index: 10;
  display: flex;
  flex-direction: column;
  gap: 80px;
  align-items: center;
}

/* 流程步骤样式 */
.flow-step {
  background: white;
  border: 2px solid #e8e8e8;
  border-radius: 12px;
  padding: 24px;
  width: 100%;
  max-width: 450px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  position: relative;
}

.flow-step:hover {
  border-color: #1890ff;
  box-shadow: 0 4px 16px rgba(24, 144, 255, 0.15);
  transform: translateY(-2px);
}

.flow-step.step-selected {
  border-color: #1890ff;
  background: #f6ffed;
}

.step-header {
  display: flex;
  align-items: center;
  gap: 16px;
}

.step-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
  flex-shrink: 0;
}

.step-start .step-icon {
  background: linear-gradient(135deg, #52c41a, #73d13d);
}

.step-approval .step-icon {
  background: linear-gradient(135deg, #1890ff, #40a9ff);
}

.step-task .step-icon {
  background: linear-gradient(135deg, #faad14, #ffc53d);
}

.step-end .step-icon {
  background: linear-gradient(135deg, #f5222d, #ff4d4f);
}

.step-content {
  flex: 1;
}

.step-title {
  font-size: 16px;
  font-weight: 600;
  color: #262626;
  margin-bottom: 4px;
}

.step-subtitle {
  font-size: 13px;
  color: #8c8c8c;
}

.step-details {
  margin-top: 16px;
}

.step-assignees {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #595959;
  margin-bottom: 8px;
}

.step-actions-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

/* 连接点指示器 */
.connection-indicators {
  position: absolute;
  bottom: -12px;
  right: 24px;
  z-index: 15;
}

.outgoing-indicator {
  display: flex;
  align-items: center;
  gap: 4px;
  background: #52c41a;
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  box-shadow: 0 2px 6px rgba(82, 196, 26, 0.3);
}

.indicator-dot {
  width: 6px;
  height: 6px;
  background: white;
  border-radius: 50%;
}

.indicator-text {
  line-height: 1;
}

/* SVG 连接线 */
.connection-svg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 5;
  pointer-events: none;
  overflow: visible;
}

.connection-line {
  transition: all 0.3s ease;
  opacity: 0.8;
}

.connection-line:hover,
.connection-highlighted {
  stroke-width: 4 !important;
  opacity: 1;
  filter: drop-shadow(0 2px 4px rgba(82, 196, 26, 0.3));
}

/* JSON编辑器 */
.json-canvas {
  padding: 24px;
}

.json-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.json-editor {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e8e8e8;
}

.json-input {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  line-height: 1.5;
  border: none;
  resize: none;
}

/* 右侧属性面板 */
.design-properties {
  background: white;
  border-left: 1px solid #e8e8e8;
  overflow-y: auto;
}

.properties-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid #e8e8e8;
}

.panel-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.panel-content {
  flex: 1;
  padding: 24px;
}

.form-section {
  margin-bottom: 32px;
}

.form-section h4 {
  font-size: 14px;
  font-weight: 600;
  color: #262626;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.no-selection {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.no-selection-content {
  text-align: center;
  color: #8c8c8c;
}

.no-selection-icon {
  font-size: 48px;
  color: #d9d9d9;
  margin-bottom: 16px;
}

/* 预览模态框 */
.preview-modal :deep(.ant-modal-body) {
  padding: 24px;
}

.preview-container {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 24px;
  min-height: 400px;
}

.preview-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 300px;
}

.preview-flow {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
}

.preview-step {
  display: flex;
  align-items: center;
  background: white;
  border-radius: 12px;
  padding: 20px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.preview-step-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
  margin-right: 16px;
  flex-shrink: 0;
}

.preview-step.step-start .preview-step-icon {
  background: linear-gradient(135deg, #52c41a, #73d13d);
}

.preview-step.step-approval .preview-step-icon {
  background: linear-gradient(135deg, #1890ff, #40a9ff);
}

.preview-step.step-task .preview-step-icon {
  background: linear-gradient(135deg, #faad14, #ffc53d);
}

.preview-step.step-end .preview-step-icon {
  background: linear-gradient(135deg, #f5222d, #ff4d4f);
}

.preview-step-info h4 {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 600;
  color: #262626;
}

.preview-step-info p {
  margin: 0;
  font-size: 13px;
  color: #8c8c8c;
}

.preview-assignees {
  font-size: 12px;
  color: #1890ff;
  margin-top: 4px;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .design-container {
    grid-template-columns: 240px 1fr 300px;
  }
}

@media (max-width: 992px) {
  .design-container {
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr;
  }

  .design-sidebar {
    border-right: none;
    border-bottom: 1px solid #e8e8e8;
  }

  .design-properties {
    position: fixed;
    top: 0;
    right: -350px;
    width: 350px;
    height: 100vh;
    z-index: 1000;
    transition: right 0.3s ease;
    box-shadow: -2px 0 8px rgba(0, 0, 0, 0.15);
  }

  .design-properties.show {
    right: 0;
  }
}

@media (max-width: 768px) {
  .design-sidebar {
    padding: 16px;
  }

  .visual-canvas {
    padding: 16px;
  }

  .flow-step {
    padding: 16px;
  }

  .step-header {
    gap: 12px;
  }

  .step-icon {
    width: 36px;
    height: 36px;
    font-size: 16px;
  }
}
</style>
