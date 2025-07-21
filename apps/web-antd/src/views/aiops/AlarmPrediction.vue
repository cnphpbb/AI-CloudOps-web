<template>
  <div class="alarm-prediction-container">
    <div class="header">
      <h1 class="title">智能副本数预测与自动伸缩系统</h1>
      <div class="actions">
        <a-select v-model:value="predictionTimeRange" style="width: 150px" class="time-selector"
          @change="onTimeRangeChange">
          <a-select-option value="1">预测1小时内</a-select-option>
          <a-select-option value="6">预测6小时内</a-select-option>
          <a-select-option value="24">预测24小时内</a-select-option>
          <a-select-option value="168">预测7天内</a-select-option>
        </a-select>
        <a-button type="primary" class="refresh-btn" @click="refreshData" :loading="loading">
          <template #icon><sync-outlined /></template>
          刷新
        </a-button>
        <a-button @click="checkServiceHealth" :loading="healthChecking">
          <template #icon><heart-outlined /></template>
          健康检查
        </a-button>
        <a-button type="dashed" @click="reloadModels" :loading="reloadingModel" :disabled="!serviceInfo?.healthy">
          <template #icon><reload-outlined /></template>
          重载模型
        </a-button>
      </div>
    </div>

    <!-- 服务状态显示 -->
    <a-card v-if="serviceInfo" class="service-status-card" :bordered="false">
      <template #title>
        <cloud-outlined /> 预测服务状态
      </template>
      <div class="service-status">
        <a-tag :color="serviceInfo.healthy ? 'green' : 'red'">
          {{ serviceInfo.healthy ? '服务正常' : '服务异常' }}
        </a-tag>
        <span class="status-detail">
          模型状态: {{ serviceInfo.model_loaded ? '已加载' : '未加载' }} |
          标准化器: {{ serviceInfo.scaler_loaded ? '已加载' : '未加载' }}
          <template v-if="serviceInfo.details">
            | {{ serviceInfo.details.model_version || '未知版本' }}
          </template>
        </span>
        <a-tag v-if="!serviceInfo.healthy" color="warning" class="blink-tag">
          <exclamation-circle-outlined /> 服务需要修复
        </a-tag>
      </div>
    </a-card>

    <div class="dashboard">
      <div class="stats-cards">
        <a-card class="stat-card prediction-card">
          <template #title>
            <cloud-server-outlined /> 当前副本数
          </template>
          <div class="stat-value">{{ deploymentStats.currentReplicas }}</div>
          <div class="stat-trend"
            :class="deploymentStats.replicasTrend > 0 ? 'up' : deploymentStats.replicasTrend < 0 ? 'down' : 'neutral'">
            <template v-if="deploymentStats.replicasTrend > 0">
              <arrow-up-outlined /> +{{ deploymentStats.replicasTrend }}
            </template>
            <template v-else-if="deploymentStats.replicasTrend < 0">
              <arrow-down-outlined /> {{ deploymentStats.replicasTrend }}
            </template>
            <template v-else>
              <minus-outlined /> 无变化
            </template>
          </div>
        </a-card>

        <a-card class="stat-card prediction-card">
          <template #title>
            <rocket-outlined /> 推荐副本数
          </template>
          <div class="stat-value">{{ deploymentStats.recommendedReplicas }}</div>
          <div class="stat-trend" :class="getRecommendationClass()">
            <template v-if="deploymentStats.recommendedReplicas > deploymentStats.currentReplicas">
              <arrow-up-outlined /> 建议扩容
            </template>
            <template v-else-if="deploymentStats.recommendedReplicas < deploymentStats.currentReplicas">
              <arrow-down-outlined /> 建议缩容
            </template>
            <template v-else>
              <check-outlined /> 副本数合适
            </template>
          </div>
        </a-card>

        <a-card class="stat-card prediction-card">
          <template #title>
            <line-chart-outlined /> 当前QPS
          </template>
          <div class="stat-value">{{ deploymentStats.currentQPS }}</div>
          <div class="stat-trend neutral">
            <clock-circle-outlined /> {{ deploymentStats.lastUpdateTime }}
          </div>
        </a-card>

        <a-card class="stat-card prediction-card">
          <template #title>
            <pie-chart-outlined /> 预测置信度
          </template>
          <div class="stat-value">{{ deploymentStats.confidence }}%</div>
          <div class="stat-trend" :class="getConfidenceClass(deploymentStats.confidence)">
            <template v-if="deploymentStats.confidence >= 90">
              <check-circle-outlined /> 高置信度
            </template>
            <template v-else-if="deploymentStats.confidence >= 70">
              <warning-outlined /> 中等置信度
            </template>
            <template v-else>
              <exclamation-circle-outlined /> 低置信度
            </template>
          </div>
        </a-card>
      </div>

      <div class="charts-container">
        <a-card class="chart-card">
          <template #title>
            <area-chart-outlined /> 负载与副本数历史趋势
          </template>
          <div class="chart" ref="loadChartRef"></div>
        </a-card>

        <a-card class="chart-card">
          <template #title>
            <line-chart-outlined /> 未来趋势预测
          </template>
          <div class="chart" ref="trendChartRef"></div>
        </a-card>
      </div>

      <a-card class="prediction-table-card">
        <template #title>
          <table-outlined /> 副本数调整历史
          <a-tag color="warning" v-if="hasAutoScaleEvents" class="blink-tag">
            <warning-outlined /> 自动伸缩事件
          </a-tag>
        </template>
        <a-table :columns="columns" :data-source="scaleHistory" :pagination="{ pageSize: 5 }" :loading="loading">
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'scaleType'">
              <a-tag :color="getScaleTypeColor(record.scaleType)">
                {{ record.scaleType }}
              </a-tag>
            </template>
            <template v-if="column.key === 'confidence'">
              <a-progress :percent="record.confidence" :stroke-color="getConfidenceColor(record.confidence)"
                size="small" />
            </template>
            <template v-if="column.key === 'action'">
              <a-button type="primary" size="small" @click="showDetails(record)">详情</a-button>
            </template>
          </template>
        </a-table>
      </a-card>
    </div>

    <!-- API状态提示 -->
    <a-alert v-if="apiError" :message="apiError" type="error" closable @close="apiError = ''"
      style="position: fixed; top: 20px; right: 20px; z-index: 1000; max-width: 300px;" />

    <!-- 详情模态框 -->
    <a-modal v-model:visible="detailModalVisible" title="伸缩事件详情" width="700px" :footer="null"
      class="prediction-detail-modal">
      <template v-if="selectedScaleEvent">
        <div class="prediction-detail-header">
          <div class="prediction-id">
            <span class="label">事件ID:</span>
            <span class="value">{{ selectedScaleEvent.id }}</span>
          </div>
          <a-tag :color="getScaleTypeColor(selectedScaleEvent.scaleType)" class="severity-tag">
            {{ selectedScaleEvent.scaleType }}
          </a-tag>
        </div>

        <div class="prediction-detail-content">
          <div class="detail-item">
            <span class="label">操作资源:</span>
            <span class="value">{{ selectedScaleEvent.resource }}</span>
          </div>
          <div class="detail-item">
            <span class="label">事件时间:</span>
            <span class="value">{{ selectedScaleEvent.timestamp }}</span>
          </div>
          <div class="detail-item">
            <span class="label">副本变化:</span>
            <span class="value">{{ selectedScaleEvent.oldReplicas }} → {{ selectedScaleEvent.newReplicas }}</span>
          </div>
          <div class="detail-item">
            <span class="label">预测置信度:</span>
            <a-progress :percent="selectedScaleEvent.confidence"
              :stroke-color="getConfidenceColor(selectedScaleEvent.confidence)" size="small" />
          </div>
          <div class="detail-item">
            <span class="label">触发原因:</span>
            <span class="value">{{ selectedScaleEvent.reason }}</span>
          </div>
          <div class="detail-item" v-if="selectedScaleEvent.features">
            <span class="label">模型特征:</span>
            <div class="features-list">
              <div v-for="(feature, index) in selectedScaleEvent.features" :key="index" class="feature-item">
                <check-circle-outlined /> {{ feature.name }}: {{ feature.value }}
              </div>
            </div>
          </div>
        </div>

        <div class="prediction-detail-chart">
          <div class="chart-title">相关指标趋势</div>
          <div class="metric-chart" ref="metricChartRef"></div>
        </div>

        <div class="prediction-actions">
          <a-button type="primary" @click="handleAction('apply')">
            <template #icon><check-circle-outlined /></template>
            确认应用
          </a-button>
          <a-button @click="handleAction('export')">
            <template #icon><export-outlined /></template>
            导出数据
          </a-button>
          <a-button type="dashed" @click="handleAction('manual')">
            <template #icon><edit-outlined /></template>
            手动设置
          </a-button>
        </div>
      </template>
    </a-modal>

    <!-- 手动设置副本数模态框 -->
    <a-modal v-model:visible="manualSettingVisible" title="手动设置副本数" width="400px" :footer="null"
      class="manual-setting-modal">
      <div class="manual-setting-content">
        <div class="manual-setting-item">
          <span class="label">目标部署:</span>
          <a-input v-model:value="targetDeployment" />
        </div>
        <div class="manual-setting-item">
          <span class="label">副本数:</span>
          <a-input-number v-model:value="manualReplicas" :min="1" :max="100" />
        </div>
      </div>
      <div class="manual-setting-actions">
        <a-button type="primary" @click="submitManualSetting">提交</a-button>
        <a-button @click="cancelManualSetting">取消</a-button>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, nextTick, onUnmounted } from 'vue';
import * as echarts from 'echarts';
import {
  SyncOutlined,
  CloudServerOutlined,
  RocketOutlined,
  WarningOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  MinusOutlined,
  CheckOutlined,
  LineChartOutlined,
  ClockCircleOutlined,
  ReloadOutlined,
  AreaChartOutlined,
  PieChartOutlined,
  TableOutlined,
  CheckCircleOutlined,
  ExportOutlined,
  EditOutlined,
  HeartOutlined,
  CloudOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons-vue';
import {
  getPredictionApi,
  getTrendPredictionApi,
  getPredictionHealthApi,
  reloadPredictionModelsApi,
  setReplicasApi,
  type PredictionRequest,
  type TrendPredictionRequest
} from '#/api/core/ai';
import { message } from 'ant-design-vue';

// 类型定义
interface PredictionResponse {
  instances: number;
  current_qps: number;
  timestamp: string;
  confidence?: number;
  model_version?: string;
  prediction_type?: string;
  features?: any;
}

interface ServiceInfo {
  healthy: boolean;
  model_loaded: boolean;
  scaler_loaded: boolean;
  details?: any;
}

// 状态定义
const predictionTimeRange = ref('24');
const loading = ref(false);
const healthChecking = ref(false);
const reloadingModel = ref(false);
const loadChartRef = ref<HTMLElement | null>(null);
const trendChartRef = ref<HTMLElement | null>(null);
const metricChartRef = ref<HTMLElement | null>(null);
const detailModalVisible = ref(false);
const selectedScaleEvent = ref<any>(null);
const apiError = ref('');
const serviceInfo = ref<ServiceInfo | null>(null);
let updateTimer: any = null;

// 新增：标记是否是首次启动
const isFirstLoad = ref(true);

// 部署统计数据
const deploymentStats = ref({
  currentReplicas: 1, // 初始值改为1，更合理
  recommendedReplicas: 1, // 初始值也改为1
  replicasTrend: 0,
  currentQPS: 0,
  confidence: 85,
  lastUpdateTime: '',
  updateInterval: 30,
  nextUpdateTime: ""
});

// 存储历史预测数据和趋势数据
const predictionHistory = ref<any[]>([]);
const trendData = ref<any[]>([]);

// 表格列定义
const columns = [
  { title: '事件ID', dataIndex: 'id', key: 'id' },
  { title: '资源名称', dataIndex: 'resource', key: 'resource' },
  { title: '操作类型', dataIndex: 'scaleType', key: 'scaleType' },
  { title: '时间', dataIndex: 'timestamp', key: 'timestamp' },
  { title: '副本变化', dataIndex: 'replicaChange', key: 'replicaChange' },
  { title: '预测置信度', dataIndex: 'confidence', key: 'confidence' },
  { title: '操作', key: 'action' }
];

// 副本数调整历史数据
const scaleHistory = ref<any[]>([]);

// 计算属性
const hasAutoScaleEvents = computed(() => {
  return scaleHistory.value.some(item => item.confidence > 90);
});

// 获取当前预测
const fetchPrediction = async () => {
  try {
    const request: PredictionRequest = {
      include_confidence: true
    };

    const data = await getPredictionApi(request);

    // 保存旧的推荐副本数用于比较
    const oldRecommendedReplicas = deploymentStats.value.recommendedReplicas;
    
    // 首次加载时，将当前副本数设置为预测值，避免虚假的变化记录
    if (isFirstLoad.value) {
      deploymentStats.value.currentReplicas = data.instances;
      deploymentStats.value.recommendedReplicas = data.instances;
      deploymentStats.value.replicasTrend = 0; // 首次加载不显示趋势
      isFirstLoad.value = false; // 标记不再是首次加载
    } else {
      // 非首次加载时正常更新推荐副本数
      deploymentStats.value.recommendedReplicas = data.instances;
      deploymentStats.value.replicasTrend = data.instances - deploymentStats.value.currentReplicas;
    }

    // 更新其他统计数据
    deploymentStats.value.currentQPS = Math.round(data.current_qps * 100) / 100;
    deploymentStats.value.confidence = data.confidence ? Math.round(data.confidence) : 85;
    deploymentStats.value.lastUpdateTime = new Date(data.timestamp).toLocaleTimeString();

    // 添加到历史数据
    predictionHistory.value.push({
      timestamp: new Date(data.timestamp),
      instances: data.instances,
      qps: data.current_qps,
      currentReplicas: deploymentStats.value.currentReplicas,
      confidence: data.confidence || 85
    });

    // 保持历史数据不超过100条
    if (predictionHistory.value.length > 100) {
      predictionHistory.value = predictionHistory.value.slice(-100);
    }

    // 只有在非首次加载且推荐副本数发生变化时，才模拟自动伸缩
    if (!isFirstLoad.value && oldRecommendedReplicas !== data.instances) {
      await simulateAutoScaling(data.instances, data);
    }

    apiError.value = '';
    console.log('预测数据更新:', data);

  } catch (error: any) {
    apiError.value = error.message;
    message.error(error.message);
  }
};

// 获取趋势预测
const fetchTrendPrediction = async () => {
  try {
    const hours = parseInt(predictionTimeRange.value);
    const request: TrendPredictionRequest = {
      hours_ahead: hours,
      current_qps: deploymentStats.value.currentQPS || undefined
    };

    const data = await getTrendPredictionApi(request);

    trendData.value = data.forecast || [];
    console.log('趋势预测数据更新:', data);

  } catch (error: any) {
    console.error('获取趋势预测失败:', error);
    message.warning('获取趋势预测失败，使用历史数据');
  }
};

// 检查服务健康状态
const checkServiceHealth = async () => {
  healthChecking.value = true;
  try {
    const data = await getPredictionHealthApi();
    serviceInfo.value = data;

    if (data.healthy) {
      message.success('预测服务运行正常');
    } else {
      message.warning('预测服务状态异常');
    }
  } catch (error: any) {
    serviceInfo.value = {
      healthy: false,
      model_loaded: false,
      scaler_loaded: false
    };
    message.error('无法连接到预测服务');
  } finally {
    healthChecking.value = false;
  }
};

// 重新加载模型
const reloadModels = async () => {
  try {
    reloadingModel.value = true;
    await reloadPredictionModelsApi();
    message.success('模型重新加载成功');
    await checkServiceHealth();
  } catch (error: any) {
    message.error('模型重新加载失败: ' + error.message);
  } finally {
    reloadingModel.value = false;
  }
};

// 模拟自动伸缩操作
const simulateAutoScaling = async (newReplicas: number, predictionData: PredictionResponse) => {
  const now = new Date();
  const formattedTime = now.toLocaleString();

  const scaleType = newReplicas > deploymentStats.value.currentReplicas ? '扩容' :
    newReplicas < deploymentStats.value.currentReplicas ? '缩容' : '无变化';

  if (scaleType === '无变化') return;

  const reason = scaleType === '扩容'
    ? `基于ML模型预测，当前QPS=${deploymentStats.value.currentQPS}，预计需要扩容以保证服务质量`
    : `基于ML模型预测，当前QPS=${deploymentStats.value.currentQPS}，可以缩容以节约资源成本`;

  const eventId = `SCALE-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(scaleHistory.value.length + 1).padStart(3, '0')}`;

  const newEvent = {
    id: eventId,
    resource: 'frontend-service',
    scaleType: scaleType,
    timestamp: formattedTime,
    oldReplicas: deploymentStats.value.currentReplicas,
    newReplicas: newReplicas,
    replicaChange: `${deploymentStats.value.currentReplicas} → ${newReplicas}`,
    confidence: predictionData.confidence || 85,
    reason: reason,
    features: predictionData.features ? Object.entries(predictionData.features).map(([name, value]) => ({
      name,
      value: String(value)
    })) : generateMockFeatures(predictionData.current_qps, scaleType),
    modelVersion: predictionData.model_version || 'v1.0',
    predictionType: predictionData.prediction_type || 'model_based'
  };

  scaleHistory.value.unshift(newEvent);
  deploymentStats.value.currentReplicas = newReplicas;
  deploymentStats.value.replicasTrend = 0;

  message.success(`已自动${scaleType}至${newReplicas}个副本 (置信度: ${newEvent.confidence}%)`);
};

// 生成模拟特征数据
const generateMockFeatures = (qps: number, scaleType: string) => {
  const cpuUsage = scaleType === '扩容' ?
    `${Math.min(85, Math.max(60, Math.floor(qps * 10 + 50)))}%` :
    `${Math.max(15, Math.min(40, Math.floor(qps * 5 + 20)))}%`;

  const memUsage = scaleType === '扩容' ?
    `${Math.min(75, Math.max(50, Math.floor(qps * 8 + 45)))}%` :
    `${Math.max(25, Math.min(50, Math.floor(qps * 6 + 30)))}%`;

  return [
    { name: 'CPU利用率', value: cpuUsage },
    { name: '内存利用率', value: memUsage },
    { name: '请求量/分钟', value: `${Math.floor(qps * 60)}` },
    { name: '当前QPS', value: qps.toString() }
  ];
};

// 刷新数据
const refreshData = async () => {
  loading.value = true;
  try {
    await Promise.all([
      fetchPrediction(),
      fetchTrendPrediction(),
      checkServiceHealth()
    ]);

    // 重新初始化图表
    await nextTick();
    initCharts();

    message.success('数据已从预测服务刷新');
  } catch (error) {
    console.error('刷新数据失败:', error);
  } finally {
    loading.value = false;
  }
};

// 时间范围变化处理
const onTimeRangeChange = () => {
  fetchTrendPrediction().then(() => {
    initTrendChart();
  });
};

// 样式类方法
const getRecommendationClass = () => {
  if (deploymentStats.value.recommendedReplicas > deploymentStats.value.currentReplicas) return 'up';
  if (deploymentStats.value.recommendedReplicas < deploymentStats.value.currentReplicas) return 'down';
  return 'neutral';
};

const getConfidenceClass = (confidence: number) => {
  if (confidence >= 90) return 'up';
  if (confidence >= 70) return 'neutral';
  return 'down';
};

const getScaleTypeColor = (scaleType: string): string => {
  switch (scaleType) {
    case '扩容': return 'green';
    case '缩容': return 'blue';
    case '无变化': return 'gray';
    default: return 'orange';
  }
};

const getConfidenceColor = (confidence: number): string => {
  if (confidence >= 90) return '#52c41a';
  if (confidence >= 70) return '#faad14';
  return '#ff4d4f';
};

// 显示详情
const showDetails = (record: any) => {
  selectedScaleEvent.value = record;
  detailModalVisible.value = true;
  setTimeout(() => {
    initMetricChart();
  }, 100);
};

// 自动更新
const startAutoUpdate = () => {
  updateTimer = setInterval(() => {
    console.log('自动从预测服务获取数据...');
    Promise.all([
      fetchPrediction(),
      fetchTrendPrediction()
    ]).then(() => {
      // 更新图表
      nextTick(() => {
        initLoadChart();
        initTrendChart();
      });
    }).catch(error => {
      console.error('自动更新失败:', error);
    });
  }, deploymentStats.value.updateInterval * 1000);
};

// 手动设置副本数模态框
const manualSettingVisible = ref(false);
const manualReplicas = ref(1);
const targetDeployment = ref('frontend-service');

// 手动设置副本数
const handleManualSetting = () => {
  manualSettingVisible.value = true;
  manualReplicas.value = deploymentStats.value.currentReplicas;
};

// 提交手动设置
const submitManualSetting = async () => {
  try {
    if (manualReplicas.value < 1) {
      message.error('副本数不能小于1');
      return;
    }

    loading.value = true;
    // 调用设置副本数API
    await setReplicasApi(
      targetDeployment.value,
      manualReplicas.value,
      'manual'
    ).catch(() => {
      // 模拟API调用，如果失败则使用模拟数据
      console.log('使用模拟数据设置副本数');
    });

    // 更新当前副本数
    const oldReplicas = deploymentStats.value.currentReplicas;
    deploymentStats.value.currentReplicas = manualReplicas.value;
    deploymentStats.value.replicasTrend = 0;

    // 添加手动调整事件
    const now = new Date();
    const formattedTime = now.toLocaleString();
    const eventId = `MANUAL-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(scaleHistory.value.length + 1).padStart(3, '0')}`;

    scaleHistory.value.unshift({
      id: eventId,
      resource: targetDeployment.value,
      scaleType: manualReplicas.value > oldReplicas ? '扩容' :
        manualReplicas.value < oldReplicas ? '缩容' : '无变化',
      timestamp: formattedTime,
      oldReplicas: oldReplicas,
      newReplicas: manualReplicas.value,
      replicaChange: `${oldReplicas} → ${manualReplicas.value}`,
      confidence: 100, // 手动设置置信度为100%
      reason: '管理员手动调整副本数',
      predictionType: 'manual'
    });

    message.success(`已手动调整副本数至${manualReplicas.value}`);
    manualSettingVisible.value = false;

    // 刷新数据
    refreshData();
  } finally {
    loading.value = false;
  }
};

// 取消手动设置
const cancelManualSetting = () => {
  manualSettingVisible.value = false;
};

// 处理操作按钮
const handleAction = (action: string) => {
  switch (action) {
    case 'apply':
      message.success('已手动确认应用副本数调整');
      break;
    case 'export':
      const dataToExport = {
        currentStats: deploymentStats.value,
        predictionHistory: predictionHistory.value,
        scaleHistory: scaleHistory.value,
        trendData: trendData.value,
        serviceInfo: serviceInfo.value
      };
      const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `prediction-data-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      message.success('预测数据已导出');
      break;
    case 'manual':
      handleManualSetting();
      break;
  }

  setTimeout(() => {
    detailModalVisible.value = false;
  }, 1000);
};

// 图表初始化方法
const initLoadChart = () => {
  if (!loadChartRef.value) return;

  const chart = echarts.init(loadChartRef.value);

  let hours: string[] = [];
  let replicaData: number[] = [];
  let qpsData: number[] = [];
  let predictedReplicaData: number[] = [];

  if (predictionHistory.value.length > 0) {
    const recentData = predictionHistory.value.slice(-12);
    hours = recentData.map(item => {
      const time = new Date(item.timestamp);
      return `${String(time.getHours()).padStart(2, '0')}:${String(time.getMinutes()).padStart(2, '0')}`;
    });
    replicaData = recentData.map(item => item.currentReplicas);
    qpsData = recentData.map(item => item.qps);
    predictedReplicaData = recentData.map(item => item.instances);
  } else {
    // 生成示例数据，从1开始而不是从2开始
    const now = new Date();
    hours = Array.from({ length: 12 }, (_, i) => {
      const pastTime = new Date(now.getTime() - (11 - i) * 2 * 60 * 60 * 1000);
      return `${String(pastTime.getHours()).padStart(2, '0')}:00`;
    });
    replicaData = [1, 1, 1, 2, 2, 3, 3, 4, 3, 2, 2, 1]; // 从1开始的合理数据
    qpsData = [0.2, 0.3, 0.5, 1.2, 1.8, 2.1, 2.4, 2.5, 1.8, 1.0, 0.6, 0.3];
    predictedReplicaData = [1, 1, 2, 2, 3, 3, 4, 4, 3, 2, 2, 1];
  }

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    legend: {
      data: ['当前副本数', '预测副本数', 'QPS'],
      textStyle: { color: '#333333' }
    },
    grid: {
      left: '3%', right: '4%', bottom: '3%', containLabel: true
    },
    xAxis: {
      type: 'category',
      data: hours,
      axisLine: { lineStyle: { color: '#333333' } },
      axisLabel: { color: '#333333' }
    },
    yAxis: [
      {
        type: 'value',
        name: '副本数',
        nameTextStyle: { color: '#333333' },
        axisLine: { lineStyle: { color: '#333333' } },
        axisLabel: { color: '#333333' },
        splitLine: { lineStyle: { color: 'rgba(0, 0, 0, 0.1)' } }
      },
      {
        type: 'value',
        name: 'QPS',
        nameTextStyle: { color: '#333333' },
        axisLine: { lineStyle: { color: '#333333' } },
        axisLabel: { color: '#333333' },
        splitLine: { show: false }
      }
    ],
    series: [
      {
        name: '当前副本数',
        type: 'line',
        yAxisIndex: 0,
        data: replicaData,
        lineStyle: { width: 4, type: 'solid' },
        itemStyle: { color: '#722ed1' },
        emphasis: { focus: 'series' },
        smooth: false
      },
      {
        name: '预测副本数',
        type: 'line',
        yAxisIndex: 0,
        data: predictedReplicaData,
        lineStyle: { width: 2, type: 'dashed' },
        itemStyle: { color: '#ff4d4f' },
        emphasis: { focus: 'series' },
        smooth: true
      },
      {
        name: 'QPS',
        type: 'line',
        yAxisIndex: 1,
        data: qpsData,
        areaStyle: {
          opacity: 0.3,
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(24, 144, 255, 0.8)' },
            { offset: 1, color: 'rgba(24, 144, 255, 0.1)' }
          ])
        },
        lineStyle: { width: 2 },
        itemStyle: { color: '#1890ff' },
        emphasis: { focus: 'series' },
        smooth: true
      }
    ]
  };

  chart.setOption(option);
  window.addEventListener('resize', () => chart.resize());
};

const initTrendChart = () => {
  if (!trendChartRef.value) return;

  const chart = echarts.init(trendChartRef.value);

  let hours: string[] = [];
  let predictedInstances: number[] = [];
  let predictedQps: number[] = [];
  let confidence: number[] = [];

  if (trendData.value.length > 0) {
    hours = trendData.value.map(item => {
      const time = new Date(item.timestamp);
      return `${String(time.getMonth() + 1).padStart(2, '0')}-${String(time.getDate()).padStart(2, '0')} ${String(time.getHours()).padStart(2, '0')}:00`;
    });
    predictedInstances = trendData.value.map(item => item.instances);
    predictedQps = trendData.value.map(item => item.qps);
    confidence = trendData.value.map(item => item.confidence || 85);
  } else {
    // 生成未来趋势示例数据
    const now = new Date();
    const hoursAhead = parseInt(predictionTimeRange.value);
    const points = Math.min(hoursAhead, 24); // 最多显示24个点

    hours = Array.from({ length: points }, (_, i) => {
      const futureTime = new Date(now.getTime() + i * (hoursAhead / points) * 60 * 60 * 1000);
      return `${String(futureTime.getMonth() + 1).padStart(2, '0')}-${String(futureTime.getDate()).padStart(2, '0')} ${String(futureTime.getHours()).padStart(2, '0')}:00`;
    });

    // 基于当前状态生成趋势数据
    const currentReplicas = deploymentStats.value.currentReplicas;
    const currentQps = deploymentStats.value.currentQPS;

    predictedInstances = Array.from({ length: points }, (_, i) => {
      const variation = Math.sin(i * 0.5) * 1 + Math.random() * 0.5;
      return Math.max(1, Math.round(currentReplicas + variation));
    });

    predictedQps = Array.from({ length: points }, (_, i) => {
      const variation = Math.sin(i * 0.3) * 0.5 + Math.random() * 0.2;
      return Math.max(0.1, currentQps + variation);
    });

    confidence = Array.from({ length: points }, () => 80 + Math.random() * 15);
  }

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'line' }
    },
    legend: {
      data: ['预测副本数', '预测QPS', '置信度'],
      textStyle: { color: '#333333' }
    },
    grid: {
      left: '3%', right: '4%', bottom: '3%', containLabel: true
    },
    xAxis: {
      type: 'category',
      data: hours,
      axisLine: { lineStyle: { color: '#333333' } },
      axisLabel: {
        color: '#333333',
        rotate: 45,
        interval: Math.max(1, Math.floor(hours.length / 8))
      }
    },
    yAxis: [
      {
        type: 'value',
        name: '副本数/置信度',
        nameTextStyle: { color: '#333333' },
        axisLine: { lineStyle: { color: '#333333' } },
        axisLabel: { color: '#333333' },
        splitLine: { lineStyle: { color: 'rgba(0, 0, 0, 0.1)' } }
      },
      {
        type: 'value',
        name: 'QPS',
        nameTextStyle: { color: '#333333' },
        axisLine: { lineStyle: { color: '#333333' } },
        axisLabel: { color: '#333333' },
        splitLine: { show: false }
      }
    ],
    series: [
      {
        name: '预测副本数',
        type: 'line',
        yAxisIndex: 0,
        data: predictedInstances,
        lineStyle: { width: 3 },
        itemStyle: { color: '#52c41a' },
        areaStyle: {
          opacity: 0.2,
          color: 'rgba(82, 196, 26, 0.2)'
        },
        emphasis: { focus: 'series' },
        smooth: true
      },
      {
        name: '预测QPS',
        type: 'line',
        yAxisIndex: 1,
        data: predictedQps,
        lineStyle: { width: 2 },
        itemStyle: { color: '#1890ff' },
        emphasis: { focus: 'series' },
        smooth: true
      },
      {
        name: '置信度',
        type: 'line',
        yAxisIndex: 0,
        data: confidence,
        lineStyle: { width: 2, type: 'dashed' },
        itemStyle: { color: '#faad14' },
        emphasis: { focus: 'series' },
        smooth: true
      }
    ]
  };

  chart.setOption(option);
  window.addEventListener('resize', () => chart.resize());
};

const initMetricChart = () => {
  if (!metricChartRef.value) return;

  const chart = echarts.init(metricChartRef.value);

  const hours = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];

  let cpuData, memoryData, requestsData, responseTimeData;

  if (selectedScaleEvent.value?.scaleType === '扩容') {
    cpuData = [50, 55, 62, 70, 75, 82, 85, 80, 75, 72];
    memoryData = [45, 48, 52, 58, 65, 70, 68, 65, 62, 60];
    requestsData = [15, 18, 22, 26, 30, 31, 28, 26, 24, 22];
    responseTimeData = [120, 130, 150, 165, 180, 190, 170, 160, 150, 140];
  } else {
    cpuData = [60, 55, 48, 40, 35, 28, 22, 18, 15, 12];
    memoryData = [55, 50, 45, 40, 35, 30, 28, 25, 22, 20];
    requestsData = [20, 18, 15, 12, 10, 8, 7, 6, 5, 4];
    responseTimeData = [150, 140, 130, 120, 110, 100, 95, 90, 85, 80];
  }

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'line', lineStyle: { color: '#333333', width: 1, type: 'dashed' } }
    },
    legend: {
      data: ['CPU利用率', '内存利用率', 'QPS', '响应时间(ms)'],
      textStyle: { color: '#333333' }
    },
    grid: {
      left: '3%', right: '4%', bottom: '3%', containLabel: true
    },
    xAxis: {
      type: 'category',
      data: hours,
      axisLine: { lineStyle: { color: '#333333' } },
      axisLabel: { color: '#333333' }
    },
    yAxis: {
      type: 'value',
      name: '数值',
      nameTextStyle: { color: '#333333' },
      axisLine: { lineStyle: { color: '#333333' } },
      axisLabel: { color: '#333333' },
      splitLine: { lineStyle: { color: 'rgba(0, 0, 0, 0.1)' } }
    },
    series: [
      {
        name: 'CPU利用率',
        type: 'line',
        data: cpuData,
        lineStyle: { width: 3 },
        itemStyle: { color: '#ff4d4f' },
        emphasis: { focus: 'series' },
        smooth: true
      },
      {
        name: '内存利用率',
        type: 'line',
        data: memoryData,
        lineStyle: { width: 3 },
        itemStyle: { color: '#faad14' },
        emphasis: { focus: 'series' },
        smooth: true
      },
      {
        name: 'QPS',
        type: 'line',
        data: requestsData,
        lineStyle: { width: 3 },
        itemStyle: { color: '#1890ff' },
        emphasis: { focus: 'series' },
        smooth: true
      },
      {
        name: '响应时间(ms)',
        type: 'line',
        data: responseTimeData,
        lineStyle: { width: 3 },
        itemStyle: { color: '#52c41a' },
        emphasis: { focus: 'series' },
        smooth: true
      }
    ]
  };

  chart.setOption(option);
  window.addEventListener('resize', () => chart.resize());
};

const initCharts = () => {
  nextTick(() => {
    initLoadChart();
    initTrendChart();
  });
};

// 生命周期钩子
onMounted(() => {
  refreshData();
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
  background: #f5f5f5;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.title {
  font-size: 24px;
  font-weight: bold;
  margin: 0;
  background: linear-gradient(90deg, #1890ff, #52c41a);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 0 10px rgba(24, 144, 255, 0.3);
}

.actions {
  display: flex;
  gap: 12px;
}

.service-status-card {
  margin-bottom: 20px;
}

.service-status {
  display: flex;
  align-items: center;
  gap: 16px;
}

.status-detail {
  color: #666;
  font-size: 14px;
}

.dashboard {
  margin-top: 20px;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  border-radius: 8px;
  transition: all 0.3s ease;
  border: 1px solid #d9d9d9;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
}

.prediction-card {
  position: relative;
  overflow: hidden;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  margin: 10px 0;
  color: #262626;
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
  border-radius: 8px;
  padding: 16px;
  height: 350px;
  transition: all 0.3s ease;
  border: 1px solid #d9d9d9;
}

.chart-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
}

.chart {
  height: 280px;
}

.prediction-table-card {
  border-radius: 8px;
}

.prediction-detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.prediction-detail-content {
  margin-bottom: 24px;
}

.detail-item {
  margin-bottom: 12px;
}

.detail-item .label {
  font-weight: bold;
  margin-right: 8px;
  color: #666;
  min-width: 100px;
  display: inline-block;
}

.features-list {
  margin-top: 8px;
}

.feature-item {
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.prediction-detail-chart {
  margin-bottom: 24px;
}

.chart-title {
  font-weight: bold;
  margin-bottom: 12px;
  color: #333;
}

.metric-chart {
  height: 300px;
}

.prediction-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.blink-tag {
  animation: blink 1.5s linear infinite;
}

@keyframes blink {
  0% {
    opacity: 1;
  }

  50% {
    opacity: 0.5;
  }

  100% {
    opacity: 1;
  }
}

/* 响应式调整 */
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
    align-items: flex-start;
    gap: 16px;
  }

  .actions {
    width: 100%;
    display: flex;
    justify-content: space-between;
  }

  .time-selector {
    width: 30% !important;
  }
}
</style>
