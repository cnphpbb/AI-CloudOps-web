<template>
  <div class="metrics-management">
    <a-page-header
      title="指标管理"
      sub-title="监控指标配置与管理中心"
      class="page-header"
    >
      <template #extra>
        <a-space>
          <a-button @click="loadMetrics" :loading="loading">
            <template #icon><reload-outlined /></template>
            刷新指标
          </a-button>
          <a-button type="primary" @click="showAddMetricModal">
            <template #icon><plus-outlined /></template>
            添加指标
          </a-button>
        </a-space>
      </template>
    </a-page-header>

    <!-- 指标概览 -->
    <a-row :gutter="24">
      <a-col :span="8">
        <a-card class="overview-card">
          <a-statistic
            title="默认指标"
            :value="defaultMetrics.length"
            class="overview-statistic"
          >
            <template #prefix>
              <dashboard-outlined style="color: #1890ff" />
            </template>
          </a-statistic>
        </a-card>
      </a-col>
      <a-col :span="8">
        <a-card class="overview-card">
          <a-statistic
            title="可用指标"
            :value="availableMetrics.length"
            class="overview-statistic"
          >
            <template #prefix>
              <bar-chart-outlined style="color: #722ed1" />
            </template>
          </a-statistic>
        </a-card>
      </a-col>
      <a-col :span="8">
        <a-card class="overview-card">
          <a-statistic
            title="启用指标"
            :value="activeMetricsCount"
            class="overview-statistic"
          >
            <template #prefix>
              <check-circle-outlined style="color: #52c41a" />
            </template>
          </a-statistic>
        </a-card>
      </a-col>
    </a-row>

    <!-- 默认指标卡片 -->
    <a-card title="默认指标" class="metrics-section" style="margin-top: 24px">
      <template #extra>
        <setting-outlined />
      </template>
      
      <a-typography-paragraph type="secondary" class="section-description">
        核心监控指标，系统始终收集和分析
      </a-typography-paragraph>
      
      <a-row :gutter="[16, 16]">
        <a-col 
          v-for="metric in defaultMetrics" 
          :key="metric" 
          :span="8"
        >
          <a-card size="small" class="metric-card default-metric">
            <template #title>
              <a-space>
                <line-chart-outlined />
                {{ metric }}
              </a-space>
            </template>
            <template #extra>
              <a-tag color="blue" size="small">默认</a-tag>
            </template>
            
            <a-descriptions :column="1" size="small">
              <a-descriptions-item label="类型">
                {{ getMetricType(metric) }}
              </a-descriptions-item>
              <a-descriptions-item label="单位">
                {{ getMetricUnit(metric) }}
              </a-descriptions-item>
              <a-descriptions-item label="状态">
                <a-tag color="success" size="small">
                  <check-circle-outlined />
                  启用
                </a-tag>
              </a-descriptions-item>
            </a-descriptions>
            
            <div class="metric-chart">
              <canvas :ref="`chart-${metric}`" class="mini-chart"></canvas>
            </div>
          </a-card>
        </a-col>
      </a-row>
    </a-card>

    <!-- 可用指标表格 -->
    <a-card title="可用指标" class="metrics-section" style="margin-top: 24px">
      <template #extra>
        <database-outlined />
      </template>
      
      <a-typography-paragraph type="secondary" class="section-description">
        可选择启用的监控指标
      </a-typography-paragraph>
      
      <div class="filters-section">
        <a-row :gutter="16">
          <a-col :span="8">
            <a-input-search
              v-model:value="searchQuery"
              placeholder="搜索指标..."
              allow-clear
            >
              <template #prefix><search-outlined /></template>
            </a-input-search>
          </a-col>
          <a-col :span="4">
            <a-select
              v-model:value="filterCategory"
              placeholder="分类筛选"
              allow-clear
              style="width: 100%"
            >
              <a-select-option value="">全部分类</a-select-option>
              <a-select-option value="performance">性能</a-select-option>
              <a-select-option value="resource">资源</a-select-option>
              <a-select-option value="business">业务</a-select-option>
              <a-select-option value="custom">自定义</a-select-option>
            </a-select>
          </a-col>
          <a-col :span="4">
            <a-select
              v-model:value="statusFilter"
              placeholder="状态筛选"
              allow-clear
              style="width: 100%"
            >
              <a-select-option value="">全部状态</a-select-option>
              <a-select-option value="active">已启用</a-select-option>
              <a-select-option value="inactive">未启用</a-select-option>
            </a-select>
          </a-col>
          <a-col :span="8">
            <a-space>
              <a-button @click="batchEnable" :disabled="!selectedRowKeys.length">
                批量启用
              </a-button>
              <a-button @click="batchDisable" :disabled="!selectedRowKeys.length">
                批量禁用
              </a-button>
            </a-space>
          </a-col>
        </a-row>
      </div>
      
      <a-table
        :columns="metricsColumns"
        :data-source="filteredMetrics"
        :loading="loading"
        :pagination="{
          current: currentPage,
          pageSize: pageSize,
          total: filteredMetrics.length,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条数据`
        }"
        :row-selection="{
          selectedRowKeys: selectedRowKeys,
          onChange: onSelectionChange
        }"
        row-key="name"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'name'">
            <a-typography-text strong>{{ record.name }}</a-typography-text>
          </template>
          
          <template v-else-if="column.key === 'category'">
            <a-tag :color="getCategoryColor(record.category)">
              {{ formatCategory(record.category) }}
            </a-tag>
          </template>
          
          <template v-else-if="column.key === 'status'">
            <a-tag :color="isMetricActive(record.name) ? 'success' : 'default'">
              <component :is="isMetricActive(record.name) ? CheckCircleOutlined : MinusCircleOutlined" />
              {{ isMetricActive(record.name) ? '已启用' : '未启用' }}
            </a-tag>
          </template>
          
          <template v-else-if="column.key === 'actions'">
            <a-space>
              <a-button 
                type="primary" 
                size="small" 
                @click="toggleMetric(record.name)"
                :loading="record.loading"
              >
                {{ isMetricActive(record.name) ? '禁用' : '启用' }}
              </a-button>
              <a-button size="small" @click="viewMetricDetail(record)">
                <template #icon><eye-outlined /></template>
                详情
              </a-button>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 配置面板 -->
    <a-row :gutter="24" style="margin-top: 24px">
      <a-col :span="12">
        <a-card title="采集配置" class="config-card">
          <template #extra>
            <clock-circle-outlined />
          </template>
          
          <a-form layout="vertical">
            <a-form-item label="采集间隔">
              <a-select v-model:value="collectionInterval" style="width: 100%">
                <a-select-option value="10">10 秒</a-select-option>
                <a-select-option value="30">30 秒</a-select-option>
                <a-select-option value="60">1 分钟</a-select-option>
                <a-select-option value="300">5 分钟</a-select-option>
              </a-select>
            </a-form-item>
            
            <a-form-item label="数据保留期">
              <a-select v-model:value="retentionPeriod" style="width: 100%">
                <a-select-option value="1">1 天</a-select-option>
                <a-select-option value="7">7 天</a-select-option>
                <a-select-option value="30">30 天</a-select-option>
                <a-select-option value="90">90 天</a-select-option>
              </a-select>
            </a-form-item>
            
            <a-form-item label="批处理大小">
              <a-input-number 
                v-model:value="batchSize" 
                :min="1" 
                :max="1000" 
                style="width: 100%"
              />
            </a-form-item>
          </a-form>
        </a-card>
      </a-col>
      
      <a-col :span="12">
        <a-card title="告警阈值" class="config-card">
          <template #extra>
            <alert-outlined />
          </template>
          
          <div v-if="activeMetricsList.length > 0">
            <a-list 
              :data-source="activeMetricsList.slice(0, 5)" 
              size="small"
              class="threshold-list"
            >
              <template #renderItem="{ item }">
                <a-list-item>
                  <a-list-item-meta>
                    <template #title>{{ item }}</template>
                  </a-list-item-meta>
                  <template #actions>
                    <a-input-number
                      :value="getThreshold(item)"
                      @change="(value) => updateThreshold(item, value)"
                      size="small"
                      style="width: 80px"
                    />
                    <a-select
                      :value="getThresholdType(item)"
                      @change="(value) => updateThresholdType(item, value)"
                      size="small"
                      style="width: 80px"
                    >
                      <a-select-option value="above">大于</a-select-option>
                      <a-select-option value="below">小于</a-select-option>
                    </a-select>
                  </template>
                </a-list-item>
              </template>
            </a-list>
            
            <a-button 
              v-if="activeMetricsList.length > 5" 
              type="link" 
              @click="showAllThresholds"
            >
              查看全部 {{ activeMetricsList.length }} 个指标
            </a-button>
          </div>
          
          <a-empty v-else description="暂无启用的指标" :image="false" />
        </a-card>
      </a-col>
    </a-row>

    <!-- 保存按钮 -->
    <div class="save-section">
      <a-button type="primary" size="large" @click="saveConfiguration" :loading="saving">
        <template #icon><save-outlined /></template>
        保存配置
      </a-button>
    </div>

    <!-- 添加指标模态框 -->
    <a-modal
      v-model:open="addMetricModalVisible"
      title="添加自定义指标"
      @ok="addCustomMetric"
      @cancel="resetAddMetricForm"
    >
      <a-form layout="vertical">
        <a-form-item label="指标名称" required>
          <a-input v-model:value="newMetric.name" placeholder="请输入指标名称" />
        </a-form-item>
        
        <a-form-item label="指标类型">
          <a-select v-model:value="newMetric.type" style="width: 100%">
            <a-select-option value="gauge">Gauge</a-select-option>
            <a-select-option value="counter">Counter</a-select-option>
            <a-select-option value="rate">Rate</a-select-option>
            <a-select-option value="duration">Duration</a-select-option>
          </a-select>
        </a-form-item>
        
        <a-form-item label="单位">
          <a-input v-model:value="newMetric.unit" placeholder="如：%、MB、ms等" />
        </a-form-item>
        
        <a-form-item label="描述">
          <a-textarea v-model:value="newMetric.description" :rows="3" />
        </a-form-item>
        
        <a-form-item label="分类">
          <a-select v-model:value="newMetric.category" style="width: 100%">
            <a-select-option value="performance">性能</a-select-option>
            <a-select-option value="resource">资源</a-select-option>
            <a-select-option value="business">业务</a-select-option>
            <a-select-option value="custom">自定义</a-select-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue';
import { message } from 'ant-design-vue';
import {
  ReloadOutlined,
  PlusOutlined,
  DashboardOutlined,
  BarChartOutlined,
  CheckCircleOutlined,
  MinusCircleOutlined,
  SettingOutlined,
  LineChartOutlined,
  DatabaseOutlined,
  SearchOutlined,
  EyeOutlined,
  ClockCircleOutlined,
  AlertOutlined,
  SaveOutlined
} from '@ant-design/icons-vue';
import { listAvailableMetricsApi } from '#/api/core/rca';
import type { RCAMetricsEntity } from '#/api/core/rca';
import type { TableColumnsType } from 'ant-design-vue';

// 响应式数据
const defaultMetrics = ref<string[]>([]);
const availableMetrics = ref<string[]>([]);
const activeMetrics = ref<Set<string>>(new Set());
const searchQuery = ref('');
const filterCategory = ref('');
const statusFilter = ref('');
const collectionInterval = ref(60);
const retentionPeriod = ref(7);
const batchSize = ref(100);
const thresholds = ref<Record<string, number>>({});
const thresholdTypes = ref<Record<string, string>>({});
const loading = ref(false);
const saving = ref(false);
const currentPage = ref(1);
const pageSize = ref(10);
const selectedRowKeys = ref<string[]>([]);
const addMetricModalVisible = ref(false);

// 新指标表单
const newMetric = ref({
  name: '',
  type: 'gauge',
  unit: '',
  description: '',
  category: 'custom'
});

// 计算属性
const activeMetricsCount = computed(() => activeMetrics.value.size);
const activeMetricsList = computed(() => Array.from(activeMetrics.value));

const filteredMetrics = computed(() => {
  let metrics = availableMetrics.value.map(name => ({
    name,
    category: getMetricCategory(name),
    type: getMetricType(name),
    unit: getMetricUnit(name),
    description: getMetricDescription(name)
  }));
  
  if (searchQuery.value) {
    metrics = metrics.filter(m => 
      m.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      m.description.toLowerCase().includes(searchQuery.value.toLowerCase())
    );
  }
  
  if (filterCategory.value) {
    metrics = metrics.filter(m => m.category === filterCategory.value);
  }
  
  if (statusFilter.value) {
    const isActive = statusFilter.value === 'active';
    metrics = metrics.filter(m => isMetricActive(m.name) === isActive);
  }
  
  return metrics;
});

// 表格列定义
const metricsColumns: TableColumnsType = [
  {
    title: '指标名称',
    dataIndex: 'name',
    key: 'name',
    width: 200,
    fixed: 'left'
  },
  {
    title: '分类',
    dataIndex: 'category',
    key: 'category',
    width: 100
  },
  {
    title: '类型',
    dataIndex: 'type',
    key: 'type',
    width: 100
  },
  {
    title: '单位',
    dataIndex: 'unit',
    key: 'unit',
    width: 80
  },
  {
    title: '描述',
    dataIndex: 'description',
    key: 'description',
    ellipsis: true
  },
  {
    title: '状态',
    key: 'status',
    width: 100
  },
  {
    title: '操作',
    key: 'actions',
    width: 150,
    fixed: 'right'
  }
];

// 方法
const loadMetrics = async () => {
  loading.value = true;
  try {
    const response = await listAvailableMetricsApi();
    if (response.data) {
      defaultMetrics.value = response.data.default_metrics || [];
      availableMetrics.value = response.data.available_metrics || [];
      
      // 默认指标设为启用状态
      defaultMetrics.value.forEach(m => activeMetrics.value.add(m));
      
      await nextTick();
      drawMiniCharts();
    }
  } catch (error) {
    console.error('Failed to load metrics:', error);
    message.error('加载指标失败，请重试');
  } finally {
    loading.value = false;
  }
};

const getMetricCategory = (metric: string) => {
  if (metric.includes('cpu') || metric.includes('memory')) return 'resource';
  if (metric.includes('response') || metric.includes('latency')) return 'performance';
  if (metric.includes('revenue') || metric.includes('conversion')) return 'business';
  return 'custom';
};

const getMetricType = (metric: string) => {
  if (metric.includes('rate')) return 'Rate';
  if (metric.includes('count')) return 'Counter';
  if (metric.includes('time')) return 'Duration';
  return 'Gauge';
};

const getMetricUnit = (metric: string) => {
  if (metric.includes('cpu')) return '%';
  if (metric.includes('memory')) return 'MB';
  if (metric.includes('time') || metric.includes('latency')) return 'ms';
  if (metric.includes('rate')) return '/s';
  return 'count';
};

const getMetricDescription = (metric: string) => {
  const descriptions: Record<string, string> = {
    cpu: 'CPU利用率百分比',
    memory: '内存使用量（MB）',
    network: '网络I/O吞吐量',
    disk_io: '磁盘I/O操作',
    response_time: '平均响应时间',
    error_rate: '每秒错误率',
    throughput: '请求吞吐量',
    latency: '请求延迟'
  };
  return descriptions[metric] || '自定义监控指标';
};

const formatCategory = (category: string) => {
  const categoryMap = {
    'resource': '资源',
    'performance': '性能',
    'business': '业务',
    'custom': '自定义'
  };
  return categoryMap[category as keyof typeof categoryMap] || category;
};

const getCategoryColor = (category: string) => {
  const colorMap = {
    'resource': 'blue',
    'performance': 'purple',
    'business': 'orange',
    'custom': 'default'
  };
  return colorMap[category as keyof typeof colorMap] || 'default';
};

const isMetricActive = (metric: string) => {
  return activeMetrics.value.has(metric);
};

const toggleMetric = (metric: string) => {
  if (activeMetrics.value.has(metric)) {
    activeMetrics.value.delete(metric);
    message.success(`已禁用指标：${metric}`);
  } else {
    activeMetrics.value.add(metric);
    message.success(`已启用指标：${metric}`);
  }
};

const viewMetricDetail = (record: any) => {
  // 查看指标详情
  message.info('指标详情功能开发中...');
};

const getThreshold = (metric: string) => {
  return thresholds.value[metric] || 0;
};

const updateThreshold = (metric: string, value: number | null) => {
  if (value !== null) {
    thresholds.value[metric] = value;
  }
};

const getThresholdType = (metric: string) => {
  return thresholdTypes.value[metric] || 'above';
};

const updateThresholdType = (metric: string, value: string) => {
  thresholdTypes.value[metric] = value;
};

const saveConfiguration = async () => {
  saving.value = true;
  try {
    // 模拟保存配置
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const config = {
      activeMetrics: Array.from(activeMetrics.value),
      collectionInterval: collectionInterval.value,
      retentionPeriod: retentionPeriod.value,
      batchSize: batchSize.value,
      thresholds: thresholds.value,
      thresholdTypes: thresholdTypes.value
    };
    
    console.log('Saving configuration:', config);
    message.success('配置保存成功');
  } catch (error) {
    message.error('配置保存失败，请重试');
  } finally {
    saving.value = false;
  }
};

const showAddMetricModal = () => {
  addMetricModalVisible.value = true;
};

const addCustomMetric = () => {
  if (!newMetric.value.name) {
    message.error('请输入指标名称');
    return;
  }
  
  // 添加自定义指标逻辑
  availableMetrics.value.push(newMetric.value.name);
  message.success(`已添加自定义指标：${newMetric.value.name}`);
  
  resetAddMetricForm();
  addMetricModalVisible.value = false;
};

const resetAddMetricForm = () => {
  newMetric.value = {
    name: '',
    type: 'gauge',
    unit: '',
    description: '',
    category: 'custom'
  };
};

const onSelectionChange = (selectedKeys: string[]) => {
  selectedRowKeys.value = selectedKeys;
};

const batchEnable = () => {
  selectedRowKeys.value.forEach(metric => {
    activeMetrics.value.add(metric);
  });
  message.success(`已批量启用 ${selectedRowKeys.value.length} 个指标`);
  selectedRowKeys.value = [];
};

const batchDisable = () => {
  selectedRowKeys.value.forEach(metric => {
    activeMetrics.value.delete(metric);
  });
  message.success(`已批量禁用 ${selectedRowKeys.value.length} 个指标`);
  selectedRowKeys.value = [];
};

const handleTableChange = (pagination: any) => {
  currentPage.value = pagination.current;
  pageSize.value = pagination.pageSize;
};

const showAllThresholds = () => {
  message.info('查看全部阈值功能开发中...');
};

const drawMiniCharts = () => {
  // 绘制迷你图表
  defaultMetrics.value.forEach(metric => {
    const canvas = document.querySelector(`canvas[ref="chart-${metric}"]`) as HTMLCanvasElement;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.width = 200;
        canvas.height = 50;
        ctx.strokeStyle = '#1890ff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        for (let i = 0; i < 10; i++) {
          const x = i * 20;
          const y = 25 + Math.random() * 20 - 10;
          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      }
    }
  });
};

onMounted(() => {
  loadMetrics();
});
</script>

<style scoped>
.metrics-management {
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

.overview-card {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border-radius: 8px;
}

.overview-statistic {
  text-align: center;
}

.metrics-section,
.config-card {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border-radius: 8px;
}

.section-description {
  margin-bottom: 16px;
}

.metric-card {
  transition: all 0.3s;
  border-radius: 6px;
}

.metric-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.default-metric {
  background: #f6ffed;
  border-color: #b7eb8f;
}

.metric-chart {
  margin-top: 12px;
  height: 50px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.mini-chart {
  width: 100%;
  height: 100%;
}

.filters-section {
  margin-bottom: 16px;
}

.threshold-list {
  max-height: 300px;
  overflow-y: auto;
}

.save-section {
  text-align: center;
  margin-top: 32px;
  padding: 24px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

:deep(.ant-statistic-title) {
  font-size: 14px;
  margin-bottom: 8px;
  color: #8c8c8c;
}

:deep(.ant-statistic-content) {
  font-size: 24px;
  font-weight: 600;
}

:deep(.ant-card-head-title) {
  font-weight: 600;
  color: #262626;
}

:deep(.ant-page-header) {
  padding: 16px 24px;
}

:deep(.ant-table-thead > tr > th) {
  background: #fafafa;
  font-weight: 600;
  color: #262626;
}

:deep(.ant-table-tbody > tr:hover > td) {
  background: #f5f7fa;
}

@media (max-width: 768px) {
  .metrics-management {
    padding: 16px;
  }
  
  .overview-card {
    margin-bottom: 16px;
  }
  
  .metric-card {
    margin-bottom: 16px;
  }
  
  .filters-section .ant-col {
    margin-bottom: 12px;
  }
}
</style>