<template>
  <div class="alarm-prediction-container">
    <div class="header">
      <h1 class="title">智能K8s自动修复与监控系统</h1>
      <div class="actions">
        <a-select v-model:value="selectedNamespace" style="width: 150px" class="namespace-selector">
          <a-select-option value="default">default</a-select-option>
          <a-select-option value="kube-system">kube-system</a-select-option>
          <a-select-option value="production">production</a-select-option>
          <a-select-option value="staging">staging</a-select-option>
        </a-select>
        <a-button type="primary" class="refresh-btn" @click="refreshAllData" :loading="loading">
          <template #icon><sync-outlined /></template>
          刷新
        </a-button>
        <a-button type="default" @click="showHealthCheck(true)" :loading="healthCheckLoading">
          <template #icon><heart-outlined /></template>
          健康检查
        </a-button>
        <a-button type="default" @click="diagnoseCluster(true)" :loading="diagnoseLoading">
          <template #icon><search-outlined /></template>
          集群诊断
        </a-button>
      </div>
    </div>

    <div class="dashboard">
      <!-- 系统状态卡片 -->
      <div class="stats-cards">
        <a-card class="stat-card prediction-card">
          <template #title>
            <cloud-server-outlined /> 集群状态
          </template>
          <div class="stat-value">{{ clusterStats.status }}</div>
          <div class="stat-trend" :class="getClusterStatusClass()">
            <template v-if="clusterStats.status === '健康'">
              <check-circle-outlined /> 运行正常
            </template>
            <template v-else>
              <warning-outlined /> 需要关注
            </template>
          </div>
        </a-card>

        <a-card class="stat-card prediction-card">
          <template #title>
            <rocket-outlined /> 自动修复状态
          </template>
          <div class="stat-value">{{ autoFixStats.totalFixed }}</div>
          <div class="stat-trend up">
            <check-outlined /> 今日已修复
          </div>
        </a-card>

        <a-card class="stat-card prediction-card">
          <template #title>
            <alert-outlined /> 待处理事件
          </template>
          <div class="stat-value">{{ autoFixStats.pendingIssues }}</div>
          <div class="stat-trend" :class="autoFixStats.pendingIssues > 0 ? 'down' : 'neutral'">
            <clock-circle-outlined /> 需要处理
          </div>
        </a-card>

        <a-card class="stat-card prediction-card">
          <template #title>
            <clock-circle-outlined /> 最后更新
          </template>
          <div class="stat-value">{{ formatTime(autoFixStats.lastUpdateTime) }}</div>
          <div class="stat-trend neutral">
            <reload-outlined /> 实时监控
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
          <div class="input-section">
            <a-row :gutter="16">
              <a-col :span="6">
                <a-input v-model:value="fixRequest.deployment" placeholder="Deployment名称" :disabled="autoFixLoading" />
              </a-col>
              <a-col :span="6">
                <a-input v-model:value="fixRequest.namespace" placeholder="命名空间" :disabled="autoFixLoading" />
              </a-col>
              <a-col :span="8">
                <a-textarea v-model:value="fixRequest.event" placeholder="问题描述（可选）" :rows="1"
                  :disabled="autoFixLoading" />
              </a-col>
              <a-col :span="4">
                <a-button type="primary" block @click="executeAutoFix" :loading="autoFixLoading">
                  <template #icon><bug-outlined /></template>
                  执行修复
                </a-button>
              </a-col>
            </a-row>
          </div>

          <div class="quick-actions">
            <a-space>
              <a-button @click="executeWorkflow" :loading="workflowLoading">
                <template #icon><project-outlined /></template>
                执行工作流
              </a-button>
              <a-button @click="sendNotification">
                <template #icon><notification-outlined /></template>
                发送通知
              </a-button>
            </a-space>
            <a-switch v-model:checked="fixRequest.force" checked-children="强制修复" un-checked-children="安全修复" />
          </div>
        </div>
      </a-card>

      <!-- 修复历史表格 -->
      <a-card class="history-table-card">
        <template #title>
          <table-outlined /> 自动修复历史
          <a-tag color="success" v-if="fixHistory.length > 0" class="blink-tag">
            <check-circle-outlined /> {{ fixHistory.length }} 条记录
          </a-tag>
        </template>
        <a-table :columns="historyColumns" :data-source="fixHistory" :pagination="{ pageSize: 8 }" :loading="loading"
          :scroll="{ x: 800 }">
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'status'">
              <a-tag :color="getStatusColor(record.status)">
                {{ record.status }}
              </a-tag>
            </template>
            <template v-if="column.key === 'actions_taken'">
              <div class="actions-list">
                <a-tag v-for="(action, index) in record.actions_taken.slice(0, 2)" :key="index" size="small">
                  {{ action }}
                </a-tag>
                <a-tag v-if="record.actions_taken.length > 2" size="small" color="blue">
                  +{{ record.actions_taken.length - 2 }}
                </a-tag>
              </div>
            </template>
            <template v-if="column.key === 'action'">
              <a-space>
                <a-button type="primary" size="small" @click="showFixDetails(record)">
                  详情
                </a-button>
                <a-button v-if="record.status === 'failed'" type="default" size="small" @click="retryAutoFix(record)">
                  重试
                </a-button>
              </a-space>
            </template>
          </template>
        </a-table>
      </a-card>
    </div>

    <!-- API状态提示 -->
    <a-alert v-if="apiError" :message="apiError" type="error" closable @close="apiError = ''"
      style="position: fixed; top: 20px; right: 20px; z-index: 1000; max-width: 400px;" />

    <!-- 成功提示 -->
    <a-alert v-if="successMessage" :message="successMessage" type="success" closable @close="successMessage = ''"
      style="position: fixed; top: 70px; right: 20px; z-index: 1000; max-width: 400px;" />

    <!-- 修复详情模态框 -->
    <a-modal v-model:visible="detailModalVisible" title="自动修复详情" width="800px" :footer="null" class="fix-detail-modal">
      <template v-if="selectedFixRecord">
        <div class="fix-detail-header">
          <div class="fix-id">
            <span class="label">修复ID:</span>
            <span class="value">{{ selectedFixRecord.id }}</span>
          </div>
          <a-tag :color="getStatusColor(selectedFixRecord.status)" class="status-tag">
            {{ selectedFixRecord.status }}
          </a-tag>
        </div>

        <div class="fix-detail-content">
          <div class="detail-item">
            <span class="label">目标资源:</span>
            <span class="value">{{ selectedFixRecord.deployment }}/{{ selectedFixRecord.namespace }}</span>
          </div>
          <div class="detail-item">
            <span class="label">执行时间:</span>
            <span class="value">{{ selectedFixRecord.timestamp }}</span>
          </div>
          <div class="detail-item">
            <span class="label">修复结果:</span>
            <div class="result-content">{{ selectedFixRecord.result }}</div>
          </div>
          <div class="detail-item" v-if="selectedFixRecord.error_message">
            <span class="label">错误信息:</span>
            <div class="error-content">{{ selectedFixRecord.error_message }}</div>
          </div>
          <div class="detail-item">
            <span class="label">执行的操作:</span>
            <div class="actions-list">
              <div v-for="(action, index) in selectedFixRecord.actions_taken" :key="index" class="action-item">
                <check-circle-outlined /> {{ action }}
              </div>
            </div>
          </div>
        </div>

        <div class="fix-detail-actions">
          <a-button type="primary" @click="exportFixData">
            <template #icon><export-outlined /></template>
            导出数据
          </a-button>
          <a-button @click="copyFixInfo">
            <template #icon><copy-outlined /></template>
            复制信息
          </a-button>
          <a-button type="dashed" @click="detailModalVisible = false">
            关闭
          </a-button>
        </div>
      </template>
    </a-modal>

    <!-- 通知发送模态框 -->
    <a-modal v-model:visible="notificationModalVisible" title="发送通知" width="600px" @ok="submitNotification"
      @cancel="resetNotificationForm" :confirm-loading="notificationLoading">
      <a-form :model="notificationForm" layout="vertical">
        <a-form-item label="通知类型">
          <a-select v-model:value="notificationForm.type">
            <a-select-option value="human_help">人工帮助</a-select-option>
            <a-select-option value="incident">事件告警</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="紧急程度" v-if="notificationForm.type === 'human_help'">
          <a-select v-model:value="notificationForm.urgency">
            <a-select-option value="low">低</a-select-option>
            <a-select-option value="medium">中</a-select-option>
            <a-select-option value="high">高</a-select-option>
            <a-select-option value="critical">紧急</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="严重程度" v-if="notificationForm.type === 'incident'">
          <a-select v-model:value="notificationForm.severity">
            <a-select-option value="low">低</a-select-option>
            <a-select-option value="medium">中</a-select-option>
            <a-select-option value="high">高</a-select-option>
            <a-select-option value="critical">严重</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="通知消息">
          <a-textarea v-model:value="notificationForm.message" :rows="4" placeholder="请输入通知消息内容..." />
        </a-form-item>
        <a-form-item label="受影响的服务" v-if="notificationForm.type === 'incident'">
          <a-select v-model:value="notificationForm.affected_services" mode="tags" placeholder="输入服务名称">
            <a-select-option value="frontend-service">frontend-service</a-select-option>
            <a-select-option value="backend-service">backend-service</a-select-option>
            <a-select-option value="database-service">database-service</a-select-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 健康检查结果模态框 -->
    <a-modal v-model:visible="healthModalVisible" title="系统健康检查" width="700px" :footer="null">
      <div v-if="healthCheckResult">
        <div class="health-overview">
          <div class="health-status" :class="healthCheckResult.status">
            <div class="status-icon">
              <check-circle-outlined v-if="healthCheckResult.status === 'healthy'" />
              <warning-outlined v-else />
            </div>
            <div class="status-text">{{ healthCheckResult.status === 'healthy' ? '系统健康' : '系统异常' }}</div>
          </div>
          <div class="check-time">检查时间: {{ healthCheckResult.timestamp }}</div>
        </div>

        <div class="components-status">
          <h4>组件状态</h4>
          <div class="component-list">
            <div v-for="(status, component) in healthCheckResult.components" :key="component" class="component-item">
              <div class="component-name">{{ formatComponentName(String(component)) }}</div>
              <a-tag :color="status ? 'success' : 'error'">
                {{ status ? '正常' : '异常' }}
              </a-tag>
            </div>
          </div>
        </div>

        <div class="notification-details" v-if="healthCheckResult.notification_details">
          <h4>通知服务详情</h4>
          <div class="notification-info">
            <div class="info-item">
              <span class="label">状态:</span>
              <span class="value">{{ healthCheckResult.notification_details.healthy ? '正常' : '异常' }}</span>
            </div>
            <div class="info-item" v-if="healthCheckResult.notification_details.channels">
              <span class="label">可用通道:</span>
              <span class="value">{{ healthCheckResult.notification_details.channels.join(', ') }}</span>
            </div>
          </div>
        </div>
      </div>
    </a-modal>

    <!-- 诊断结果模态框 -->
    <a-modal v-model:visible="diagnosisModalVisible" title="集群诊断结果" width="700px" :footer="null">
      <div v-if="diagnosisResult" class="diagnosis-result">
        <div class="diagnosis-header">
          <div class="diagnosis-title">
            <cluster-outlined /> 集群健康诊断 (命名空间: {{ diagnosisResult.namespace }})
          </div>
          <a-tag :color="diagnosisResult.status === '健康' ? 'success' : 'warning'" class="status-tag">
            {{ diagnosisResult.status }}
          </a-tag>
        </div>

        <div class="stats-section">
          <div class="stat-item"
            :class="diagnosisResult.nodes.ready === diagnosisResult.nodes.total ? 'healthy' : 'warning'">
            <div class="stat-icon">
              <server-outlined />
            </div>
            <div class="stat-content">
              <div class="stat-title">节点</div>
              <div class="stat-value">
                <span class="ready">{{ diagnosisResult.nodes.ready }}</span>
                <span class="separator">/</span>
                <span class="total">{{ diagnosisResult.nodes.total }}</span>
                <span class="label">就绪</span>
              </div>
            </div>
          </div>

          <div class="stat-item"
            :class="diagnosisResult.pods.ready === diagnosisResult.pods.total ? 'healthy' : 'warning'">
            <div class="stat-icon">
              <apartment-outlined />
            </div>
            <div class="stat-content">
              <div class="stat-title">Pod</div>
              <div class="stat-value">
                <span class="ready">{{ diagnosisResult.pods.ready }}</span>
                <span class="separator">/</span>
                <span class="total">{{ diagnosisResult.pods.total }}</span>
                <span class="label">运行中</span>
              </div>
            </div>
          </div>

          <div class="stat-item"
            :class="diagnosisResult.deployments.ready === diagnosisResult.deployments.total ? 'healthy' : 'warning'">
            <div class="stat-icon">
              <deployment-unit-outlined />
            </div>
            <div class="stat-content">
              <div class="stat-title">部署</div>
              <div class="stat-value">
                <span class="ready">{{ diagnosisResult.deployments.ready }}</span>
                <span class="separator">/</span>
                <span class="total">{{ diagnosisResult.deployments.total }}</span>
                <span class="label">健康</span>
              </div>
            </div>
          </div>
        </div>

        <div class="events-section" v-if="diagnosisResult.events.length > 0">
          <div class="section-title">
            <warning-outlined /> 最近警告事件
          </div>
          <a-timeline>
            <a-timeline-item v-for="(event, index) in diagnosisResult.events" :key="index" color="red">
              <div class="event-item">
                <div class="event-name">{{ event.name }}</div>
                <div class="event-reason">{{ event.reason }}</div>
                <div class="event-message">{{ event.message }}</div>
              </div>
            </a-timeline-item>
          </a-timeline>
        </div>

        <div class="suggestion-section">
          <div class="section-title">
            <bulb-outlined /> 诊断建议
          </div>
          <div class="suggestion-content">
            {{ diagnosisResult.suggestion }}
          </div>
        </div>

        <div class="diagnosis-actions">
          <a-button type="primary" @click="diagnosisModalVisible = false">
            确认
          </a-button>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, onUnmounted } from 'vue';
import * as echarts from 'echarts';
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
  CopyOutlined,
  DatabaseOutlined as ServerOutlined,
  AppstoreOutlined as ApartmentOutlined,
  ApartmentOutlined as DeploymentUnitOutlined,
  CloudOutlined as ClusterOutlined,
  BulbOutlined
} from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';
import {
  executeAutoFixApi,
  diagnoseClusterApi,
  executeWorkflowApi,
  sendNotificationApi,
  getHealthStatusApi,
  type AutoFixRequest,
  type NotificationRequest,
  type WorkflowRequest
} from '#/api/core/ai';

// 状态定义
const loading = ref(false);
const autoFixLoading = ref(false);
const diagnoseLoading = ref(false);
const workflowLoading = ref(false);
const notificationLoading = ref(false);
const healthCheckLoading = ref(false);
const selectedNamespace = ref('default');
const apiError = ref('');
const successMessage = ref('');

// 图表引用
const healthChartRef = ref(null);
const successRateChartRef = ref(null);

// 模态框状态
const detailModalVisible = ref(false);
const notificationModalVisible = ref(false);
const healthModalVisible = ref(false);
const selectedFixRecord = ref<any>(null);
const healthCheckResult = ref<any>(null);
const diagnosisModalVisible = ref(false);
const diagnosisResult = ref<any>(null);

// 自动修复请求表单
const fixRequest = ref<AutoFixRequest>({
  deployment: '',
  namespace: 'default',
  event: '',
  force: false
});

// 通知表单
const notificationForm = ref<NotificationRequest>({
  type: 'human_help',
  message: '',
  urgency: 'medium',
  severity: 'medium',
  affected_services: []
});

// 集群统计数据
const clusterStats = ref({
  status: '检查中...',
  healthyPods: 0,
  totalPods: 0,
  lastCheck: new Date()
});

// 自动修复统计数据
const autoFixStats = ref({
  totalFixed: 0,
  pendingIssues: 0,
  successRate: 0,
  lastUpdateTime: new Date()
});

// 修复历史数据
const fixHistory = ref<any[]>([]);

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
    width: 120
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
    width: 80
  },
  {
    title: '时间',
    dataIndex: 'timestamp',
    key: 'timestamp',
    width: 150
  },
  {
    title: '执行的操作',
    dataIndex: 'actions_taken',
    key: 'actions_taken',
    width: 200
  },
  {
    title: '操作',
    key: 'action',
    width: 120,
    fixed: 'right'
  }
];

// 更新定时器
let updateTimer: any = null;

// 执行自动修复
const executeAutoFix = async () => {
  if (!fixRequest.value.deployment) {
    message.error('请输入Deployment名称');
    return;
  }

  autoFixLoading.value = true;
  try {
    const response = await executeAutoFixApi({
      deployment: fixRequest.value.deployment,
      namespace: fixRequest.value.namespace || selectedNamespace.value,
      event: fixRequest.value.event || `手动触发的自动修复: ${fixRequest.value.deployment}`,
      force: fixRequest.value.force
    });

    // 添加到修复历史
    const data = response;
    const fixRecord = {
      id: `FIX-${Date.now()}`,
      deployment: data.deployment,
      namespace: data.namespace,
      status: data.success ? 'success' : 'failed',
      timestamp: new Date(data.timestamp).toLocaleString(),
      result: data.result,
      actions_taken: data.actions_taken || [],
      error_message: data.error_message,
      success: data.success
    };

    fixHistory.value.unshift(fixRecord);

    if (data.success) {
      successMessage.value = `自动修复成功: ${data.deployment}`;
      autoFixStats.value.totalFixed++;
    } else {
      message.error(`自动修复失败: ${data.error_message || '未知错误'}`);
    }

    // 清空表单
    fixRequest.value = {
      deployment: '',
      namespace: selectedNamespace.value,
      event: '',
      force: false
    };

  } catch (error: any) {
    console.error('自动修复失败:', error);
    apiError.value = `自动修复请求失败: ${error.message || '未知错误'}`;
  } finally {
    autoFixLoading.value = false;
  }
};

// 集群诊断
const diagnoseCluster = async (showModal = true) => {
  diagnoseLoading.value = true;
  try {
    const response = await diagnoseClusterApi(selectedNamespace.value);
    const data = response;

    // 解析诊断结果
    const diagnosis = data.diagnosis;
    let parsedResult = parseDiagnosisText(diagnosis);

    // 更新集群状态
    clusterStats.value = {
      status: parsedResult.status,
      healthyPods: parsedResult.pods.ready,
      totalPods: parsedResult.pods.total,
      lastCheck: new Date()
    };

    // 保存诊断结果并显示模态框
    diagnosisResult.value = parsedResult;

    // 仅在需要显示时才显示模态框
    if (showModal) {
      diagnosisModalVisible.value = true;
      successMessage.value = '集群诊断完成';
    }

  } catch (error: any) {
    console.error('集群诊断失败:', error);
    if (showModal) {
      apiError.value = `集群诊断请求失败: ${error.message || '未知错误'}`;
    }
  } finally {
    diagnoseLoading.value = false;
  }
};

// 解析诊断文本
const parseDiagnosisText = (diagnosisText: string) => {
  const lines = diagnosisText.split('\n');

  // 提取命名空间
  const namespaceMatch = lines[0]?.match(/命名空间: (\w+)/);
  const namespace = namespaceMatch?.[1] || 'default';

  // 初始化结果对象
  const result = {
    namespace,
    status: '健康',
    nodes: { ready: 0, total: 0 },
    pods: { ready: 0, total: 0 },
    deployments: { ready: 0, total: 0 },
    events: [] as { name: string; reason: string; message: string }[],
    suggestion: ''
  };

  // 分析各行内容
  let inEvents = false;
  let inSuggestion = false;
  let suggestionText: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]?.trim() || '';

    if (line === '' || line.startsWith('=====')) continue;

    // 解析资源状态
    const nodeMatch = line.match(/节点: (\d+)\/(\d+) 就绪/);
    if (nodeMatch) {
      result.nodes.ready = parseInt(nodeMatch?.[1] || "0");
      result.nodes.total = parseInt(nodeMatch?.[2] || "0");
      continue;
    }

    const podMatch = line.match(/Pod: (\d+)\/(\d+) 运行中/);
    if (podMatch) {
      result.pods.ready = parseInt(podMatch?.[1] || "0");
      result.pods.total = parseInt(podMatch?.[2] || "0");
      continue;
    }

    const deployMatch = line.match(/部署: (\d+)\/(\d+) 健康/);
    if (deployMatch) {
      result.deployments.ready = parseInt(deployMatch?.[1] || "0");
      result.deployments.total = parseInt(deployMatch?.[2] || "0");
      continue;
    }

    // 解析事件
    if (line === '最近警告事件:') {
      inEvents = true;
      continue;
    }

    if (inEvents && line.startsWith('-')) {
      const eventText = line.substring(2);
      const parts = eventText.split(': ', 2);

      if (parts.length === 2) {
        const name = parts[0]?.trim() || '';
        const rest = parts[1]?.trim() || '';

        // 尝试分离原因和消息
        const reasonParts = rest.split(' - ', 2);
        const reason = reasonParts[0]?.trim() || '';
        const message = reasonParts.length > 1 ? reasonParts[1]?.trim() || '' : '';

        result.events.push({ name, reason, message });
      } else {
        // 如果格式不匹配预期，仍然添加为事件
        result.events.push({ name: 'unknown', reason: '', message: eventText });
      }
      continue;
    }

    // 解析建议
    if (line === '诊断建议:') {
      inEvents = false;
      inSuggestion = true;
      continue;
    }

    if (inSuggestion) {
      suggestionText.push(line);
    }
  }

  // 合并建议文本
  result.suggestion = suggestionText.join('\n');

  // 判断整体状态
  if (result.nodes.ready < result.nodes.total ||
    result.pods.ready < result.pods.total ||
    result.deployments.ready < result.deployments.total ||
    result.events.length > 0) {
    result.status = '需要关注';
  }

  return result;
};

// 执行工作流
const executeWorkflow = async () => {
  if (!fixRequest.value.event) {
    message.error('请输入问题描述');
    return;
  }

  workflowLoading.value = true;
  try {
    const workflowRequest: WorkflowRequest = {
      problem_description: fixRequest.value.event
    };

    const response = await executeWorkflowApi(workflowRequest);
    const data = response;

    const workflowRecord = {
      id: `WF-${Date.now()}`,
      deployment: 'workflow',
      namespace: selectedNamespace.value,
      status: data.status === 'completed' ? 'success' : 'failed',
      timestamp: new Date(data.timestamp).toLocaleString(),
      result: data.summary || '工作流执行完成',
      actions_taken: data.workflow_steps?.map((step: any) => `${step.agent}: ${step.reasoning}`) || [],
      error_message: data.error,
      success: data.status === 'completed'
    };

    fixHistory.value.unshift(workflowRecord);
    successMessage.value = '工作流执行完成';

  } catch (error: any) {
    console.error('工作流执行失败:', error);
    apiError.value = `工作流执行请求失败: ${error.message || '未知错误'}`;
  } finally {
    workflowLoading.value = false;
  }
};

// 发送通知
const sendNotification = () => {
  notificationModalVisible.value = true;
};

const submitNotification = async () => {
  if (!notificationForm.value.message) {
    message.error('请输入通知消息');
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
    apiError.value = `通知发送请求失败: ${error.message || '未知错误'}`;
  } finally {
    notificationLoading.value = false;
  }
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

// 健康检查
const showHealthCheck = async (showModal = true) => {
  healthCheckLoading.value = true;
  try {
    const response = await getHealthStatusApi();
    healthCheckResult.value = response;

    if (showModal) {
      healthModalVisible.value = true;
    }

  } catch (error: any) {
    console.error('健康检查失败:', error);
    if (showModal) {
      apiError.value = `健康检查请求失败: ${error.message || '未知错误'}`;
    }
  } finally {
    healthCheckLoading.value = false;
  }
};

// 重试自动修复
const retryAutoFix = async (record: any) => {
  fixRequest.value = {
    deployment: record.deployment,
    namespace: record.namespace,
    event: `重试修复: ${record.deployment}`,
    force: true
  };
  await executeAutoFix();
};

// 显示修复详情
const showFixDetails = (record: any) => {
  selectedFixRecord.value = record;
  detailModalVisible.value = true;
};

// 导出修复数据
const exportFixData = () => {
  const dataToExport = {
    fixRecord: selectedFixRecord.value,
    timestamp: new Date().toISOString()
  };

  const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `autofix-${selectedFixRecord.value.id}-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);

  message.success('修复数据已导出');
};

// 复制修复信息
const copyFixInfo = () => {
  const info = `修复ID: ${selectedFixRecord.value.id}
资源: ${selectedFixRecord.value.deployment}/${selectedFixRecord.value.namespace}
状态: ${selectedFixRecord.value.status}
时间: ${selectedFixRecord.value.timestamp}
结果: ${selectedFixRecord.value.result}`;

  navigator.clipboard.writeText(info).then(() => {
    message.success('修复信息已复制到剪贴板');
  });
};

// 刷新所有数据
const refreshAllData = async () => {
  loading.value = true;
  try {
    // 避免同时弹出多个提示，只在诊断成功后显示一个成功提示
    await Promise.all([
      diagnoseCluster(false), // 不显示诊断模态框
      showHealthCheck(false)  // 不显示健康检查模态框
    ]);

    // 更新图表
    initCharts();

    successMessage.value = '数据已刷新';
  } catch (error) {
    console.error('刷新数据失败:', error);
  } finally {
    loading.value = false;
  }
};

// 工具方法
const formatTime = (date: Date) => {
  return date.toLocaleTimeString();
};

const formatComponentName = (component: string) => {
  const nameMap: { [key: string]: string } = {
    'supervisor_agent': '主管Agent',
    'k8s_fixer_agent': 'K8s修复Agent',
    'notifier_agent': '通知Agent',
    'kubernetes_service': 'Kubernetes服务',
    'notification_service': '通知服务'
  };
  return nameMap[component] || component;
};

const getClusterStatusClass = () => {
  return clusterStats.value.status === '健康' ? 'up' : 'down';
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'success': return 'success';
    case 'failed': return 'error';
    case 'pending': return 'processing';
    default: return 'default';
  }
};

// 图表初始化
const initHealthChart = () => {
  if (!healthChartRef.value) return;

  const chart = echarts.init(healthChartRef.value);

  // 生成健康状态历史数据
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
    xAxis: {
      type: 'category',
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

  chart.setOption(option);
};

const initSuccessRateChart = () => {
  if (!successRateChartRef.value) return;

  const chart = echarts.init(successRateChartRef.value);

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

  chart.setOption(option);
};

const initCharts = () => {
  nextTick(() => {
    initHealthChart();
    initSuccessRateChart();
  });
};

// 自动更新
const startAutoUpdate = () => {
  updateTimer = setInterval(() => {
    // 静默诊断，不显示模态框
    diagnoseCluster(false);
  }, 30000); // 每30秒更新一次
};

// 生命周期
onMounted(() => {
  refreshAllData();
  startAutoUpdate();
});

onUnmounted(() => {
  if (updateTimer) clearInterval(updateTimer);
});
</script>

<style scoped>
.alarm-prediction-container {
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
}

.title {
  font-size: 28px;
  font-weight: bold;
  margin: 0;
  background: linear-gradient(90deg, #1890ff, #52c41a);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.actions {
  display: flex;
  gap: 12px;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  border-radius: 12px;
  transition: all 0.3s ease;
  border: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
}

.stat-value {
  font-size: 32px;
  font-weight: bold;
  margin: 10px 0;
  color: #1890ff;
}

.stat-trend {
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.up {
  color: #52c41a;
}

.down {
  color: #ff4d4f;
}

.neutral {
  color: #1890ff;
}

.charts-container {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.chart-card {
  border-radius: 12px;
  height: 400px;
  border: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.chart {
  height: 320px;
}

.operation-panel-card {
  margin-bottom: 24px;
  border-radius: 12px;
  border: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.operation-panel {
  space-y: 16px;
}

.input-section {
  margin-bottom: 16px;
}

.quick-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.history-table-card {
  border-radius: 12px;
  border: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.actions-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.fix-detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.fix-detail-content {
  margin-bottom: 24px;
}

.detail-item {
  margin-bottom: 16px;
  display: flex;
  align-items: flex-start;
}

.detail-item .label {
  font-weight: bold;
  margin-right: 12px;
  color: #666;
  min-width: 100px;
  flex-shrink: 0;
}

.detail-item .value {
  flex: 1;
}

.result-content,
.error-content {
  padding: 12px;
  border-radius: 6px;
  margin-top: 8px;
  font-family: 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.5;
  white-space: pre-wrap;
}

.result-content {
  background-color: #f6ffed;
  border: 1px solid #b7eb8f;
  color: #389e0d;
}

.error-content {
  background-color: #fff2f0;
  border: 1px solid #ffccc7;
  color: #cf1322;
}

.action-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  color: #52c41a;
}

.fix-detail-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.health-overview {
  text-align: center;
  margin-bottom: 24px;
  padding: 20px;
  background: linear-gradient(135deg, #e6fffb 0%, #f6ffed 100%);
  border-radius: 8px;
}

.health-status {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 8px;
}

.health-status.healthy .status-icon {
  color: #52c41a;
  font-size: 24px;
}

.health-status.degraded .status-icon {
  color: #faad14;
  font-size: 24px;
}

.status-text {
  font-size: 18px;
  font-weight: bold;
}

.components-status {
  margin-bottom: 20px;
}

.component-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.component-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #fafafa;
  border-radius: 6px;
}

.notification-details {
  padding: 16px;
  background: #f0f0f0;
  border-radius: 6px;
}

.notification-info {
  margin-top: 12px;
}

.info-item {
  display: flex;
  margin-bottom: 8px;
}

.info-item .label {
  font-weight: bold;
  margin-right: 8px;
  min-width: 80px;
}

.blink-tag {
  animation: blink 2s linear infinite;
}

@keyframes blink {

  0%,
  50% {
    opacity: 1;
  }

  25%,
  75% {
    opacity: 0.5;
  }
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
  }

  .quick-actions {
    flex-direction: column;
    gap: 12px;
  }

  .component-list {
    grid-template-columns: 1fr;
  }
}

/* 诊断结果样式 */
.diagnosis-result {
  padding: 16px;
}

.diagnosis-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.diagnosis-title {
  font-size: 18px;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 8px;
}

.stats-section {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-item {
  display: flex;
  align-items: center;
  padding: 16px;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.stat-item.healthy {
  background: linear-gradient(135deg, #f6ffed 0%, #e6fffb 100%);
  border-left: 4px solid #52c41a;
}

.stat-item.warning {
  background: linear-gradient(135deg, #fff7e6 0%, #fff1f0 100%);
  border-left: 4px solid #faad14;
}

.stat-icon {
  font-size: 24px;
  margin-right: 16px;
}

.stat-content {
  flex: 1;
}

.stat-title {
  font-size: 14px;
  color: #666;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 18px;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 4px;
}

.stat-value .ready {
  color: #52c41a;
}

.stat-value .total {
  color: #666;
}

.stat-value .label {
  font-size: 12px;
  color: #999;
  margin-left: 8px;
  font-weight: normal;
}

.events-section {
  margin-bottom: 24px;
  background: #fffbe6;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #ffe58f;
}

.section-title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #555;
}

.event-item {
  margin-bottom: 8px;
}

.event-name {
  font-weight: bold;
  margin-bottom: 4px;
}

.event-reason {
  color: #ff4d4f;
  font-weight: 500;
  margin-bottom: 4px;
}

.event-message {
  color: #666;
  font-size: 12px;
  word-break: break-word;
}

.suggestion-section {
  background: #f6ffed;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #b7eb8f;
  margin-bottom: 24px;
}

.suggestion-content {
  white-space: pre-line;
  line-height: 1.6;
}

.diagnosis-actions {
  display: flex;
  justify-content: flex-end;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .stats-section {
    grid-template-columns: 1fr;
  }
}
</style>
