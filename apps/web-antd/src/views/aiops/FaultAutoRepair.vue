<template>
  <div class="autofix-container">
    <div class="header">
      <h1 class="title">智能K8s自动修复与监控系统</h1>
      <div class="actions">
        <a-select 
          v-model:value="selectedNamespace" 
          style="width: 150px" 
          class="namespace-selector"
          @change="onNamespaceChange"
        >
          <a-select-option value="default">default</a-select-option>
          <a-select-option value="kube-system">kube-system</a-select-option>
          <a-select-option value="production">production</a-select-option>
          <a-select-option value="staging">staging</a-select-option>
        </a-select>
        <a-button 
          type="primary" 
          class="refresh-btn" 
          @click="refreshAllData" 
          :loading="loading"
        >
          <template #icon><sync-outlined /></template>
          刷新
        </a-button>
        <a-button 
          type="default" 
          @click="performHealthCheck" 
          :loading="healthCheckLoading"
        >
          <template #icon><heart-outlined /></template>
          健康检查
        </a-button>
        <a-button 
          type="default" 
          @click="performClusterDiagnosis" 
          :loading="diagnoseLoading"
        >
          <template #icon><search-outlined /></template>
          集群诊断
        </a-button>
      </div>
    </div>

    <div class="dashboard">
      <!-- 系统状态卡片 -->
      <div class="stats-cards">
        <a-card class="stat-card" :loading="loading">
          <template #title>
            <cloud-server-outlined /> 集群状态
          </template>
          <div class="stat-content">
            <div class="stat-value" :class="getClusterStatusClass()">
              {{ clusterStats.status }}
            </div>
            <div class="stat-detail">
              <span>{{ clusterStats.healthyPods }}/{{ clusterStats.totalPods }} Pod健康</span>
            </div>
            <div class="stat-trend" :class="getClusterStatusClass()">
              <check-circle-outlined v-if="clusterStats.status === '健康'" />
              <warning-outlined v-else />
              {{ clusterStats.status === '健康' ? '运行正常' : '需要关注' }}
            </div>
          </div>
        </a-card>

        <a-card class="stat-card" :loading="loading">
          <template #title>
            <rocket-outlined /> 自动修复状态
          </template>
          <div class="stat-content">
            <div class="stat-value success">{{ autoFixStats.totalFixed }}</div>
            <div class="stat-detail">今日已修复</div>
            <div class="stat-trend up">
              <check-outlined /> 
              成功率 {{ formatPercentage(autoFixStats.successRate) }}
            </div>
          </div>
        </a-card>

        <a-card class="stat-card" :loading="loading">
          <template #title>
            <alert-outlined /> 待处理事件
          </template>
          <div class="stat-content">
            <div class="stat-value" :class="autoFixStats.pendingIssues > 0 ? 'warning' : 'success'">
              {{ autoFixStats.pendingIssues }}
            </div>
            <div class="stat-detail">需要处理</div>
            <div class="stat-trend" :class="autoFixStats.pendingIssues > 0 ? 'down' : 'neutral'">
              <clock-circle-outlined /> 
              {{ autoFixStats.pendingIssues > 0 ? '需要关注' : '状态良好' }}
            </div>
          </div>
        </a-card>

        <a-card class="stat-card" :loading="loading">
          <template #title>
            <clock-circle-outlined /> 系统运行时间
          </template>
          <div class="stat-content">
            <div class="stat-value neutral">{{ formatUptime(systemUptime) }}</div>
            <div class="stat-detail">最后更新: {{ formatTime(autoFixStats.lastUpdateTime) }}</div>
            <div class="stat-trend neutral">
              <reload-outlined /> 实时监控
            </div>
          </div>
        </a-card>
      </div>

      <!-- 图表容器 -->
      <div class="charts-container">
        <a-card class="chart-card">
          <template #title>
            <area-chart-outlined /> 集群健康状态趋势
          </template>
          <div class="chart" ref="healthChartRef"></div>
        </a-card>

        <a-card class="chart-card">
          <template #title>
            <pie-chart-outlined /> 修复成功率分析
          </template>
          <div class="chart" ref="successRateChartRef"></div>
        </a-card>
      </div>

      <!-- 自动修复操作面板 -->
      <a-card class="operation-panel-card">
        <template #title>
          <tool-outlined /> 自动修复操作面板
        </template>
        <div class="operation-panel">
          <a-form :model="fixRequest" layout="vertical">
            <a-row :gutter="16">
              <a-col :span="6">
                <a-form-item label="Deployment名称" :required="true">
                  <a-input 
                    v-model:value="fixRequest.deployment" 
                    placeholder="输入Deployment名称" 
                    :disabled="autoFixLoading"
                    @pressEnter="executeAutoFix"
                  />
                </a-form-item>
              </a-col>
              <a-col :span="6">
                <a-form-item label="命名空间">
                  <a-select 
                    v-model:value="fixRequest.namespace" 
                    :disabled="autoFixLoading"
                  >
                    <a-select-option value="default">default</a-select-option>
                    <a-select-option value="kube-system">kube-system</a-select-option>
                    <a-select-option value="production">production</a-select-option>
                    <a-select-option value="staging">staging</a-select-option>
                  </a-select>
                </a-form-item>
              </a-col>
              <a-col :span="8">
                <a-form-item label="问题描述">
                  <a-textarea 
                    v-model:value="fixRequest.event" 
                    placeholder="描述遇到的问题（可选）" 
                    :rows="1"
                    :disabled="autoFixLoading"
                  />
                </a-form-item>
              </a-col>
              <a-col :span="4">
                <a-form-item label=" ">
                  <a-button 
                    type="primary" 
                    block 
                    @click="executeAutoFix" 
                    :loading="autoFixLoading"
                    :disabled="!canExecuteFix"
                  >
                    <template #icon><bug-outlined /></template>
                    执行修复
                  </a-button>
                </a-form-item>
              </a-col>
            </a-row>
          </a-form>

          <div class="quick-actions">
            <a-space wrap>
              <a-button @click="executeWorkflow" :loading="workflowLoading" :disabled="!fixRequest.event">
                <template #icon><project-outlined /></template>
                执行工作流
              </a-button>
              <a-button @click="openNotificationModal">
                <template #icon><notification-outlined /></template>
                发送通知
              </a-button>
              <a-button @click="clearForm" :disabled="autoFixLoading">
                <template #icon><clear-outlined /></template>
                清空表单
              </a-button>
            </a-space>
            <a-switch 
              v-model:checked="fixRequest.force" 
              checked-children="强制修复" 
              un-checked-children="安全修复"
              :disabled="autoFixLoading"
            />
          </div>
        </div>
      </a-card>

      <!-- 修复历史表格 -->
      <a-card class="history-table-card">
        <template #title>
          <table-outlined /> 自动修复历史
          <a-tag 
            v-if="fixHistory.length > 0" 
            color="success" 
            class="record-count-tag"
          >
            <check-circle-outlined /> {{ fixHistory.length }} 条记录
          </a-tag>
        </template>
        <template #extra>
          <a-space>
            <a-button size="small" @click="exportHistory" :disabled="fixHistory.length === 0">
              <template #icon><export-outlined /></template>
              导出历史
            </a-button>
            <a-button size="small" @click="clearHistory" :disabled="fixHistory.length === 0">
              <template #icon><delete-outlined /></template>
              清空历史
            </a-button>
          </a-space>
        </template>
        
        <a-table 
          :columns="historyColumns" 
          :data-source="fixHistory" 
          :pagination="tablePagination"
          :loading="loading"
          :scroll="{ x: 800 }"
          row-key="id"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'status'">
              <a-tag :color="getStatusColor(record.status)">
                <component :is="getStatusIcon(record.status)" />
                {{ getStatusText(record.status) }}
              </a-tag>
            </template>
            <template v-if="column.key === 'actions_taken'">
              <div class="actions-list">
                <a-tag 
                  v-for="(action, index) in record.actions_taken.slice(0, 2)" 
                  :key="index" 
                  size="small"
                  color="blue"
                >
                  {{ action }}
                </a-tag>
                <a-tag 
                  v-if="record.actions_taken.length > 2" 
                  size="small" 
                  color="blue"
                >
                  +{{ record.actions_taken.length - 2 }} 更多
                </a-tag>
              </div>
            </template>
            <template v-if="column.key === 'action'">
              <a-space size="small">
                <a-button type="primary" size="small" @click="showFixDetails(record)">
                  详情
                </a-button>
                <a-button 
                  v-if="record.status === 'failed'" 
                  type="default" 
                  size="small" 
                  @click="retryAutoFix(record)"
                  :loading="autoFixLoading"
                >
                  重试
                </a-button>
              </a-space>
            </template>
          </template>
        </a-table>
      </a-card>
    </div>

    <!-- 全局提示组件 -->
    <global-notification 
      v-model:error="apiError"
      v-model:success="successMessage"
    />

    <!-- 修复详情模态框 -->
    <fix-detail-modal
      v-model:visible="detailModalVisible"
      :record="selectedFixRecord"
      @export="exportFixData"
      @copy="copyFixInfo"
    />

    <!-- 通知发送模态框 -->
    <notification-modal
      v-model:visible="notificationModalVisible"
      v-model:loading="notificationLoading"
      :form="notificationForm"
      @submit="submitNotification"
      @reset="resetNotificationForm"
    />

    <!-- 健康检查结果模态框 -->
    <health-check-modal
      v-model:visible="healthModalVisible"
      :result="healthCheckResult"
    />

    <!-- 诊断结果模态框 -->
    <diagnosis-result-modal
      v-model:visible="diagnosisModalVisible"
      :result="diagnosisResult"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, onUnmounted, computed, watch } from 'vue';
import * as echarts from 'echarts';
import { message } from 'ant-design-vue';
import {
  SyncOutlined,
  CloudServerOutlined,
  RocketOutlined,
  WarningOutlined,
  CheckOutlined,
  ClockCircleOutlined,
  ReloadOutlined,
  AreaChartOutlined,
  PieChartOutlined,
  TableOutlined,
  CheckCircleOutlined,
  ExportOutlined,
  ToolOutlined,
  BugOutlined,
  SearchOutlined,
  ProjectOutlined,
  NotificationOutlined,
  AlertOutlined,
  HeartOutlined,
  ClearOutlined,
  DeleteOutlined
} from '@ant-design/icons-vue';

import {
  executeAutoFixApi,
  diagnoseClusterApi,
  executeWorkflowApi,
  sendNotificationApi,
  getHealthStatusApi,
  type AutoFixRequest,
  type NotificationRequest,
  type WorkflowRequest,
  type HealthCheckResponse
} from '#/api/core/ai';

import GlobalNotification from './components/GlobalNotification.vue';
import FixDetailModal from './components/FixDetailModal.vue';
import NotificationModal from './components/NotificationModal.vue';
import HealthCheckModal from './components/HealthCheckModal.vue';
import DiagnosisResultModal from './components/DiagnosisResultModal.vue';

// 接口定义
interface ClusterStats {
  status: string;
  healthyPods: number;
  totalPods: number;
  lastCheck: Date;
}

interface AutoFixStats {
  totalFixed: number;
  pendingIssues: number;
  successRate: number;
  lastUpdateTime: Date;
}

interface FixHistoryRecord {
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

interface DiagnosisResult {
  namespace: string;
  status: string;
  nodes: { ready: number; total: number };
  pods: { ready: number; total: number };
  deployments: { ready: number; total: number };
  events: Array<{ name: string; reason: string; message: string }>;
  suggestion: string;
}

// 响应式状态
const loading = ref(false);
const autoFixLoading = ref(false);
const diagnoseLoading = ref(false);
const workflowLoading = ref(false);
const notificationLoading = ref(false);
const healthCheckLoading = ref(false);
const selectedNamespace = ref('default');
const apiError = ref('');
const successMessage = ref('');
const systemUptime = ref(0);

// 图表引用
const healthChartRef = ref<HTMLElement | null>(null);
const successRateChartRef = ref<HTMLElement | null>(null);
let healthChart: echarts.ECharts | null = null;
let successRateChart: echarts.ECharts | null = null;

// 模态框状态
const detailModalVisible = ref(false);
const notificationModalVisible = ref(false);
const healthModalVisible = ref(false);
const diagnosisModalVisible = ref(false);
const selectedFixRecord = ref<FixHistoryRecord | null>(null);
const healthCheckResult = ref<HealthCheckResponse | null>(null);
const diagnosisResult = ref<DiagnosisResult | null>(null);

// 表单数据
const fixRequest = ref<AutoFixRequest>({
  deployment: '',
  namespace: 'default',
  event: '',
  force: false
});

const notificationForm = ref<NotificationRequest>({
  type: 'human_help',
  message: '',
  urgency: 'medium',
  severity: 'medium',
  affected_services: []
});

// 统计数据
const clusterStats = ref<ClusterStats>({
  status: '检查中...',
  healthyPods: 0,
  totalPods: 0,
  lastCheck: new Date()
});

const autoFixStats = ref<AutoFixStats>({
  totalFixed: 0,
  pendingIssues: 0,
  successRate: 85,
  lastUpdateTime: new Date()
});

// 历史记录
const fixHistory = ref<FixHistoryRecord[]>([]);

// 计算属性
const canExecuteFix = computed(() => {
  return fixRequest.value.deployment.trim() !== '' && !autoFixLoading.value;
});

const tablePagination = computed(() => ({
  pageSize: 10,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number) => `共 ${total} 条记录`
}));

// 表格列定义
const historyColumns = [
  {
    title: '修复ID',
    dataIndex: 'id',
    key: 'id',
    width: 120,
    ellipsis: true
  },
  {
    title: '资源',
    dataIndex: 'deployment',
    key: 'deployment',
    width: 120,
    ellipsis: true
  },
  {
    title: '命名空间',
    dataIndex: 'namespace',
    key: 'namespace',
    width: 100
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 100
  },
  {
    title: '执行时间',
    dataIndex: 'timestamp',
    key: 'timestamp',
    width: 160
  },
  {
    title: '执行的操作',
    dataIndex: 'actions_taken',
    key: 'actions_taken',
    width: 200,
    ellipsis: true
  },
  {
    title: '操作',
    key: 'action',
    width: 120,
    fixed: 'right'
  }
];

// 定时器
let updateTimer: NodeJS.Timeout | null = null;
let uptimeTimer: NodeJS.Timeout | null = null;

// 核心功能函数
const executeAutoFix = async () => {
  if (!canExecuteFix.value) {
    message.warning('请填写必要的修复信息');
    return;
  }

  autoFixLoading.value = true;
  try {
    const requestData: AutoFixRequest = {
      deployment: fixRequest.value.deployment.trim(),
      namespace: fixRequest.value.namespace || selectedNamespace.value,
      event: fixRequest.value.event || `手动触发的自动修复: ${fixRequest.value.deployment}`,
      force: fixRequest.value.force
    };

    const response = await executeAutoFixApi(requestData);
    
    const fixRecord: FixHistoryRecord = {
      id: `FIX-${Date.now()}`,
      deployment: response.deployment,
      namespace: response.namespace,
      status: response.success ? 'success' : 'failed',
      timestamp: formatDateTime(new Date(response.timestamp)),
      result: response.result,
      actions_taken: response.actions_taken || [],
      error_message: response.error_message,
      success: response.success
    };

    fixHistory.value.unshift(fixRecord);

    if (response.success) {
      successMessage.value = `自动修复成功: ${response.deployment}`;
      autoFixStats.value.totalFixed++;
      autoFixStats.value.lastUpdateTime = new Date();
      clearForm();
    } else {
      apiError.value = `自动修复失败: ${response.error_message || '未知错误'}`;
    }

  } catch (error: any) {
    console.error('自动修复失败:', error);
    apiError.value = `自动修复请求失败: ${error.response?.data?.message || error.message || '网络错误'}`;
  } finally {
    autoFixLoading.value = false;
  }
};

const performClusterDiagnosis = async () => {
  diagnoseLoading.value = true;
  try {
    const response = await diagnoseClusterApi(selectedNamespace.value);
    const parsedResult = parseDiagnosisResponse(response.diagnosis);
    
    // 更新集群状态
    clusterStats.value = {
      status: parsedResult.status,
      healthyPods: parsedResult.pods.ready,
      totalPods: parsedResult.pods.total,
      lastCheck: new Date()
    };

    diagnosisResult.value = parsedResult;
    diagnosisModalVisible.value = true;
    
    successMessage.value = '集群诊断完成';

  } catch (error: any) {
    console.error('集群诊断失败:', error);
    apiError.value = `集群诊断失败: ${error.response?.data?.message || error.message || '网络错误'}`;
  } finally {
    diagnoseLoading.value = false;
  }
};

const executeWorkflow = async () => {
  if (!fixRequest.value.event?.trim()) {
    message.warning('请输入问题描述来执行工作流');
    return;
  }

  workflowLoading.value = true;
  try {
    const workflowRequest: WorkflowRequest = {
      problem_description: fixRequest.value.event.trim()
    };

    const response = await executeWorkflowApi(workflowRequest);
    
    const workflowRecord: FixHistoryRecord = {
      id: `WF-${Date.now()}`,
      deployment: 'workflow-execution',
      namespace: selectedNamespace.value,
      status: response.status === 'completed' ? 'success' : 'failed',
      timestamp: formatDateTime(new Date(response.timestamp)),
      result: response.summary || '工作流执行完成',
      actions_taken: response.workflow_steps?.map((step: any) => 
        `${step.agent}: ${step.action}`
      ) || [],
      error_message: response.error,
      success: response.status === 'completed'
    };

    fixHistory.value.unshift(workflowRecord);
    successMessage.value = '工作流执行完成';

  } catch (error: any) {
    console.error('工作流执行失败:', error);
    apiError.value = `工作流执行失败: ${error.response?.data?.message || error.message || '网络错误'}`;
  } finally {
    workflowLoading.value = false;
  }
};

const performHealthCheck = async () => {
  healthCheckLoading.value = true;
  try {
    const response = await getHealthStatusApi();
    healthCheckResult.value = response;
    healthModalVisible.value = true;
    
    // 更新系统运行时间
    if (response.uptime) {
      systemUptime.value = response.uptime;
    }

  } catch (error: any) {
    console.error('健康检查失败:', error);
    apiError.value = `健康检查失败: ${error.response?.data?.message || error.message || '网络错误'}`;
  } finally {
    healthCheckLoading.value = false;
  }
};

const submitNotification = async () => {
  if (!notificationForm.value.message?.trim()) {
    message.warning('请输入通知消息');
    return;
  }

  notificationLoading.value = true;
  try {
    await sendNotificationApi(notificationForm.value);
    successMessage.value = '通知发送成功';
    notificationModalVisible.value = false;
    resetNotificationForm();

  } catch (error: any) {
    console.error('通知发送失败:', error);
    apiError.value = `通知发送失败: ${error.response?.data?.message || error.message || '网络错误'}`;
  } finally {
    notificationLoading.value = false;
  }
};

// 工具函数
const parseDiagnosisResponse = (diagnosisText: string): DiagnosisResult => {
  const lines = diagnosisText.split('\n').filter(line => line.trim());
  
  const result: DiagnosisResult = {
    namespace: selectedNamespace.value,
    status: '健康',
    nodes: { ready: 0, total: 0 },
    pods: { ready: 0, total: 0 },
    deployments: { ready: 0, total: 0 },
    events: [],
    suggestion: ''
  };

  let currentSection = '';
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    if (trimmedLine.includes('命名空间:')) {
      const match = trimmedLine.match(/命名空间:\s*(\w+)/);
      if (match && match[1]) result.namespace = match[1];
      continue;
    }

    // 解析资源状态
    const nodeMatch = trimmedLine.match(/节点:\s*(\d+)\/(\d+)\s*就绪/);
    if (nodeMatch && nodeMatch[1] && nodeMatch[2]) {
      result.nodes.ready = parseInt(nodeMatch[1]);
      result.nodes.total = parseInt(nodeMatch[2]);
      continue;
    }

    const podMatch = trimmedLine.match(/Pod:\s*(\d+)\/(\d+)\s*运行中/);
    if (podMatch && podMatch[1] && podMatch[2]) {
      result.pods.ready = parseInt(podMatch[1]);
      result.pods.total = parseInt(podMatch[2]);
      continue;
    }

    const deployMatch = trimmedLine.match(/部署:\s*(\d+)\/(\d+)\s*健康/);
    if (deployMatch && deployMatch[1] && deployMatch[2]) {
      result.deployments.ready = parseInt(deployMatch[1]);
      result.deployments.total = parseInt(deployMatch[2]);
      continue;
    }

    // 解析段落标题
    if (trimmedLine === '最近警告事件:') {
      currentSection = 'events';
      continue;
    }

    if (trimmedLine === '诊断建议:') {
      currentSection = 'suggestion';
      continue;
    }

    // 解析内容
    if (currentSection === 'events' && trimmedLine.startsWith('-')) {
      const eventText = trimmedLine.substring(1).trim();
      const parts = eventText.split(':', 2);
      if (parts.length >= 2 && parts[0] && parts[1]) {
        result.events.push({
          name: parts[0].trim(),
          reason: parts[1].trim(),
          message: parts[1].trim()
        });
      }
    } else if (currentSection === 'suggestion' && trimmedLine) {
      result.suggestion += (result.suggestion ? '\n' : '') + trimmedLine;
    }
  }

  // 判断整体状态
  if (result.nodes.ready < result.nodes.total ||
      result.pods.ready < result.pods.total ||
      result.deployments.ready < result.deployments.total ||
      result.events.length > 0) {
    result.status = '需要关注';
  }

  return result;
};

const formatDateTime = (date: Date): string => {
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('zh-CN');
};

const formatUptime = (seconds: number): string => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (days > 0) {
    return `${days}天 ${hours}小时`;
  } else if (hours > 0) {
    return `${hours}小时 ${minutes}分钟`;
  } else {
    return `${minutes}分钟`;
  }
};

const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

const getClusterStatusClass = (): string => {
  return clusterStats.value.status === '健康' ? 'success' : 'warning';
};

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
    'success': '成功',
    'failed': '失败',
    'pending': '处理中'
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

// 事件处理函数
const onNamespaceChange = (namespace: string) => {
  fixRequest.value.namespace = namespace;
  // 可以在这里触发数据刷新
};

const retryAutoFix = (record: FixHistoryRecord) => {
  fixRequest.value = {
    deployment: record.deployment,
    namespace: record.namespace,
    event: `重试修复: ${record.deployment}`,
    force: true
  };
  executeAutoFix();
};

const showFixDetails = (record: FixHistoryRecord) => {
  selectedFixRecord.value = record;
  detailModalVisible.value = true;
};

const openNotificationModal = () => {
  notificationModalVisible.value = true;
};

const clearForm = () => {
  fixRequest.value = {
    deployment: '',
    namespace: selectedNamespace.value,
    event: '',
    force: false
  };
};

const resetNotificationForm = () => {
  notificationForm.value = {
    type: 'human_help',
    message: '',
    urgency: 'medium',
    severity: 'medium',
    affected_services: []
  };
};

const exportHistory = () => {
  try {
    const dataToExport = {
      exportTime: new Date().toISOString(),
      namespace: selectedNamespace.value,
      history: fixHistory.value
    };

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `autofix-history-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    message.success('历史记录已导出');
  } catch (error) {
    message.error('导出失败');
  }
};

const clearHistory = () => {
  fixHistory.value = [];
  message.success('历史记录已清空');
};

const exportFixData = () => {
  if (!selectedFixRecord.value) return;
  
  try {
    const dataToExport = {
      fixRecord: selectedFixRecord.value,
      exportTime: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `autofix-${selectedFixRecord.value.id}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    message.success('修复数据已导出');
  } catch (error) {
    message.error('导出失败');
  }
};

const copyFixInfo = () => {
  if (!selectedFixRecord.value) return;
  
  try {
    const info = `修复ID: ${selectedFixRecord.value.id}
资源: ${selectedFixRecord.value.deployment}/${selectedFixRecord.value.namespace}
状态: ${getStatusText(selectedFixRecord.value.status)}
时间: ${selectedFixRecord.value.timestamp}
结果: ${selectedFixRecord.value.result}`;

    navigator.clipboard.writeText(info).then(() => {
      message.success('修复信息已复制到剪贴板');
    });
  } catch (error) {
    message.error('复制失败');
  }
};

// 图表初始化
const initHealthChart = () => {
  if (!healthChartRef.value) return;

  healthChart = echarts.init(healthChartRef.value);

  const hours = Array.from({ length: 12 }, (_, i) => {
    const pastTime = new Date(Date.now() - (11 - i) * 60 * 60 * 1000);
    return `${String(pastTime.getHours()).padStart(2, '0')}:00`;
  });

  const healthyData = [95, 98, 96, 100, 97, 95, 98, 100, 96, 99, 100, 98];
  const errorData = [2, 1, 3, 0, 2, 4, 1, 0, 3, 1, 0, 1];

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' }
    },
    legend: {
      data: ['健康Pod百分比', '错误数量']
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: hours
    },
    yAxis: [
      {
        type: 'value',
        name: '健康度(%)',
        min: 0,
        max: 100
      },
      {
        type: 'value',
        name: '错误数量'
      }
    ],
    series: [
      {
        name: '健康Pod百分比',
        type: 'line',
        data: healthyData,
        smooth: true,
        areaStyle: { opacity: 0.3 },
        itemStyle: { color: '#52c41a' }
      },
      {
        name: '错误数量',
        type: 'bar',
        yAxisIndex: 1,
        data: errorData,
        itemStyle: { color: '#ff4d4f' }
      }
    ]
  };

  healthChart.setOption(option);
};

const initSuccessRateChart = () => {
  if (!successRateChartRef.value) return;

  successRateChart = echarts.init(successRateChartRef.value);

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c}%'
    },
    legend: {
      orient: 'vertical',
      right: 10,
      data: ['自动修复成功', '需要人工干预', '修复失败', '待处理']
    },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['40%', '50%'],
        data: [
          { value: 75, name: '自动修复成功', itemStyle: { color: '#52c41a' } },
          { value: 15, name: '需要人工干预', itemStyle: { color: '#faad14' } },
          { value: 7, name: '修复失败', itemStyle: { color: '#ff4d4f' } },
          { value: 3, name: '待处理', itemStyle: { color: '#1890ff' } }
        ],
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  };

  successRateChart.setOption(option);
};

const initCharts = () => {
  nextTick(() => {
    initHealthChart();
    initSuccessRateChart();
  });
};

const resizeCharts = () => {
  healthChart?.resize();
  successRateChart?.resize();
};

// 定时任务
const startAutoUpdate = () => {
  updateTimer = setInterval(() => {
    if (!loading.value) {
      performClusterDiagnosis();
    }
  }, 60000); // 每分钟更新一次

  uptimeTimer = setInterval(() => {
    systemUptime.value += 1;
  }, 1000); // 每秒更新运行时间
};

const stopAutoUpdate = () => {
  if (updateTimer) {
    clearInterval(updateTimer);
    updateTimer = null;
  }
  if (uptimeTimer) {
    clearInterval(uptimeTimer);
    uptimeTimer = null;
  }
};

// 数据刷新
const refreshAllData = async () => {
  loading.value = true;
  try {
    await Promise.all([
      performHealthCheck(),
      performClusterDiagnosis()
    ]);
    
    // 刷新图表
    initCharts();
    
    successMessage.value = '数据已刷新';
  } catch (error) {
    console.error('刷新数据失败:', error);
    apiError.value = '数据刷新失败';
  } finally {
    loading.value = false;
  }
};

// 监听器
watch(selectedNamespace, (newNamespace) => {
  fixRequest.value.namespace = newNamespace;
});

// 生命周期
onMounted(() => {
  refreshAllData();
  startAutoUpdate();
  
  // 监听窗口大小变化
  window.addEventListener('resize', resizeCharts);
});

onUnmounted(() => {
  stopAutoUpdate();
  
  // 清理图表实例
  healthChart?.dispose();
  successRateChart?.dispose();
  
  // 移除事件监听器
  window.removeEventListener('resize', resizeCharts);
});
</script>

<style scoped>
.autofix-container {
  padding: 20px;
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
}

.title {
  font-size: 28px;
  font-weight: bold;
  margin: 0;
  background: linear-gradient(90deg, #1890ff, #52c41a);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.dashboard {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.stat-card {
  border-radius: 12px;
  transition: all 0.3s ease;
  border: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
}

.stat-content {
  padding: 8px 0;
}

.stat-value {
  font-size: 32px;
  font-weight: bold;
  margin: 10px 0;
  transition: all 0.3s ease;
}

.stat-value.success {
  color: #52c41a;
}

.stat-value.warning {
  color: #faad14;
}

.stat-value.neutral {
  color: #1890ff;
}

.stat-detail {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.stat-trend {
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: 500;
}

.stat-trend.up {
  color: #52c41a;
}

.stat-trend.down {
  color: #ff4d4f;
}

.stat-trend.neutral {
  color: #1890ff;
}

.charts-container {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.chart-card {
  border-radius: 12px;
  height: 400px;
  border: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
}

.chart {
  height: 320px;
}

.operation-panel-card {
  border-radius: 12px;
  border: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
}

.operation-panel {
  padding: 8px 0;
}

.quick-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.history-table-card {
  border-radius: 12px;
  border: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
}

.record-count-tag {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

.actions-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .stats-cards {
    grid-template-columns: repeat(2, 1fr);
  }

  .charts-container {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .autofix-container {
    padding: 12px;
  }

  .stats-cards {
    grid-template-columns: 1fr;
  }

  .header {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }

  .actions {
    justify-content: space-between;
    flex-wrap: wrap;
  }

  .title {
    font-size: 24px;
    text-align: center;
  }

  .quick-actions {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }

  .chart-card {
    height: 300px;
  }

  .chart {
    height: 220px;
  }
}

/* 表格优化 */
:deep(.ant-table-thead > tr > th) {
  background-color: #fafafa;
  font-weight: 600;
}

:deep(.ant-table-tbody > tr:hover > td) {
  background-color: #f5f9ff;
}

:deep(.ant-table-pagination) {
  margin-top: 16px;
}

/* 表单优化 */
:deep(.ant-form-item-label > label) {
  font-weight: 500;
}

:deep(.ant-input:focus),
:deep(.ant-select-focused .ant-select-selector) {
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

/* 按钮优化 */
:deep(.ant-btn-primary) {
  background: linear-gradient(135deg, #1890ff, #40a9ff);
  border: none;
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.3);
}

:deep(.ant-btn-primary:hover) {
  background: linear-gradient(135deg, #40a9ff, #1890ff);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.4);
}

/* 加载状态优化 */
:deep(.ant-spin-spinning) {
  backdrop-filter: blur(2px);
}

/* 标签优化 */
:deep(.ant-tag) {
  border-radius: 6px;
  font-weight: 500;
}

/* 卡片标题优化 */
:deep(.ant-card-head-title) {
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 滚动条优化 */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
