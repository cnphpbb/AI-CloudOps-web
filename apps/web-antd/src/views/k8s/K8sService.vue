<template>
  <div class="cluster-management-container service-management-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="title-section">
          <div class="page-title">
            <ApiOutlined class="title-icon" />
            <h1>Kubernetes Service 管理</h1>
          </div>
          <p class="page-subtitle">管理和监控集群中的所有Service资源</p>
        </div>
        <div class="header-actions">
          <a-button type="primary" size="large" @click="refreshData" :loading="loading">
            <template #icon><ReloadOutlined /></template>
            刷新数据
          </a-button>
        </div>
      </div>
    </div>

    <!-- 数据概览卡片 -->
    <div class="overview-cards">
      <div class="overview-card total-clusters">
        <div class="card-icon">
          <ApiOutlined />
        </div>
        <div class="card-info">
          <div class="card-number">{{ services.length }}</div>
          <div class="card-label">Service 总数</div>
        </div>
      </div>
      
      <div class="overview-card running-clusters">
        <div class="card-icon">
          <CheckCircleOutlined />
        </div>
        <div class="card-info">
          <div class="card-number">{{ loadBalancerCount }}</div>
          <div class="card-label">LoadBalancer</div>
        </div>
      </div>
      
      <div class="overview-card env-types">
        <div class="card-icon">
          <CloudServerOutlined />
        </div>
        <div class="card-info">
          <div class="card-number">{{ clusterIPCount }}</div>
          <div class="card-label">ClusterIP</div>
        </div>
      </div>
      
      <div class="overview-card resource-usage">
        <div class="card-icon">
          <PartitionOutlined />
        </div>
        <div class="card-info">
          <div class="card-number">{{ selectedNamespace }}</div>
          <div class="card-label">命名空间</div>
        </div>
      </div>
    </div>

    <!-- 操作工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <a-select
          v-model:value="selectedCluster"
          placeholder="选择集群"
          class="env-filter cluster-selector"
          :loading="clustersLoading"
          @change="handleClusterChange"
        >
          <template #suffixIcon><ClusterOutlined /></template>
          <a-select-option v-for="cluster in clusters" :key="cluster.id" :value="cluster.id">
            <span class="cluster-option">
              <CloudServerOutlined />
              {{ cluster.name }}
            </span>
          </a-select-option>
        </a-select>
        
        <a-select
          v-model:value="selectedNamespace"
          placeholder="选择命名空间"
          class="env-filter namespace-selector"
          :loading="namespacesLoading"
          @change="handleNamespaceChange"
        >
          <template #suffixIcon><PartitionOutlined /></template>
          <a-select-option v-for="ns in namespaces" :key="ns" :value="ns">
            <span class="namespace-option">
              <AppstoreOutlined />
              {{ ns }}
            </span>
          </a-select-option>
        </a-select>
        
        <a-input-search
          v-model:value="searchText"
          placeholder="搜索 Service 名称"
          class="search-input"
          @search="onSearch"
          allow-clear
        />
      </div>
      
      <div class="toolbar-right">
        <div class="view-toggle">
          <a-radio-group v-model:value="viewMode" button-style="solid" size="small">
            <a-radio-button value="table">
              <TableOutlined />
            </a-radio-button>
            <a-radio-button value="card">
              <AppstoreOutlined />
            </a-radio-button>
          </a-radio-group>
        </div>
        
        <a-button @click="refreshData" :loading="loading">
          <template #icon><ReloadOutlined /></template>
        </a-button>
        
        <a-button 
          type="primary" 
          danger 
          @click="handleBatchDelete" 
          :disabled="!selectedRows.length"
          v-if="selectedRows.length > 0"
        >
          <template #icon><DeleteOutlined /></template>
          删除 ({{ selectedRows.length }})
        </a-button>
      </div>
    </div>

    <!-- 数据展示区域 -->
    <div class="data-display">
      <div class="display-header" v-if="filteredServices.length > 0">
        <div class="result-info">
          <span class="result-count">共 {{ filteredServices.length }} 个Service</span>
          <div class="env-tags">
            <a-tag color="blue">ClusterIP {{ clusterIPCount }}</a-tag>
            <a-tag color="green" v-if="nodePortCount > 0">NodePort {{ nodePortCount }}</a-tag>
            <a-tag color="purple" v-if="loadBalancerCount > 0">LoadBalancer {{ loadBalancerCount }}</a-tag>
            <a-tag color="orange" v-if="externalNameCount > 0">ExternalName {{ externalNameCount }}</a-tag>
          </div>
        </div>
      </div>

      <!-- 表格视图 -->
      <a-table
        v-if="viewMode === 'table'"
        :columns="columns"
        :data-source="filteredServices"
        :row-selection="rowSelection"
        :loading="loading"
        row-key="uid"
        :pagination="{ 
          pageSize: 12, 
          showSizeChanger: true, 
          showQuickJumper: true,
          showTotal: (total: number) => `共 ${total} 条数据`,
          pageSizeOptions: ['12', '24', '48', '96']
        }"
        class="cluster-table services-table"
      >
        <!-- Service名称列 -->
        <template #name="{ text, record }">
          <div class="cluster-name service-name">
            <ApiOutlined />
            <span>{{ text }}</span>
            <a-tag v-if="isLoadBalancerReady(record)" color="success" class="lb-tag">
              <CheckCircleOutlined /> LB Ready
            </a-tag>
          </div>
        </template>

        <!-- 命名空间列 -->
        <template #namespace="{ text }">
          <a-tag class="env-tag namespace-tag">
            <AppstoreOutlined /> {{ text }}
          </a-tag>
        </template>
        
        <!-- Service类型列 -->
        <template #type="{ text }">
          <a-tag :color="getServiceTypeColor(text)" class="env-tag service-type-tag">
            {{ text }}
          </a-tag>
        </template>

        <!-- Cluster IP列 -->
        <template #clusterIP="{ text }">
          <div class="timestamp ip-address">
            <CloudServerOutlined />
            <span>{{ text }}</span>
          </div>
        </template>

        <!-- Ports列 -->
        <template #ports="{ text }">
          <div class="port-list">
            <a-tag v-for="(port, index) in text" :key="index" class="port-tag">
              {{ port.port }}:{{ port.targetPort }}/{{ port.protocol }}
            </a-tag>
          </div>
        </template>

        <!-- 创建时间列 -->
        <template #creationTimestamp="{ text }">
          <div class="timestamp">
            <ClockCircleOutlined />
            <a-tooltip :title="formatDateTime(text)">
              <span>{{ formatDate(text) }}</span>
            </a-tooltip>
          </div>
        </template>

        <!-- 操作列 -->
        <template #action="{ record }">
          <div class="action-column">
            <a-tooltip title="查看 YAML">
              <a-button type="primary" ghost shape="circle" @click="viewServiceYaml(record)">
                <template #icon><CodeOutlined /></template>
              </a-button>
            </a-tooltip>
            
            <a-tooltip title="删除服务">
              <a-popconfirm
                title="确定要删除该 Service 吗?"
                description="此操作不可撤销"
                @confirm="handleDelete(record)"
                ok-text="确定"
                cancel-text="取消"
              >
                <a-button type="primary" danger ghost shape="circle">
                  <template #icon><DeleteOutlined /></template>
                </a-button>
              </a-popconfirm>
            </a-tooltip>
          </div>
        </template>

        <!-- 空状态 -->
        <template #emptyText>
          <div class="empty-state">
            <ApiOutlined style="font-size: 48px; color: #d9d9d9; margin-bottom: 16px" />
            <p>暂无Service数据</p>
            <a-button type="primary" @click="refreshData">刷新数据</a-button>
          </div>
        </template>
      </a-table>

      <!-- 卡片视图 -->
      <div v-else class="card-view">
        <a-spin :spinning="loading">
          <a-empty v-if="filteredServices.length === 0" description="暂无Service数据">
            <template #image>
              <ApiOutlined style="font-size: 64px; color: #d9d9d9;" />
            </template>
            <template #description>
              <span style="color: #999;">暂无Service数据</span>
            </template>
            <a-button type="primary" @click="refreshData">刷新数据</a-button>
          </a-empty>
          <div v-else class="cluster-cards service-cards">
            <a-checkbox-group v-model:value="selectedCardIds" class="card-checkbox-group">
              <div v-for="service in filteredServices" :key="service.metadata.uid" class="cluster-card service-card">
                <div class="card-header">
                  <a-checkbox :value="service.metadata.uid" class="card-checkbox" />
                  <div class="service-title">
                    <ApiOutlined class="service-icon" />
                    <h3>{{ service.metadata.name }}</h3>
                  </div>
                  <a-tag :color="getServiceTypeColor(service.spec.type)" class="card-type-tag env-tag">
                    {{ service.spec.type }}
                  </a-tag>
                </div>
                
                <div class="card-content">
                  <div class="card-detail">
                    <span class="detail-label">命名空间:</span>
                    <span class="detail-value">
                      <AppstoreOutlined />
                      {{ service.metadata.namespace }}
                    </span>
                  </div>
                  <div class="card-detail">
                    <span class="detail-label">Cluster IP:</span>
                    <span class="detail-value">
                      <CloudServerOutlined />
                      {{ service.spec.clusterIP }}
                    </span>
                  </div>
                  <div class="card-detail">
                    <span class="detail-label">创建时间:</span>
                    <span class="detail-value">
                      <ClockCircleOutlined />
                      {{ formatDate(service.metadata.creationTimestamp) }}
                    </span>
                  </div>
                  <div class="card-ports card-detail">
                    <span class="detail-label">端口映射:</span>
                    <div class="detail-value port-tags">
                      <a-tag 
                        v-for="(port, index) in service.spec.ports" 
                        :key="index"
                        class="port-tag"
                      >
                        {{ port.port }}:{{ port.targetPort }}/{{ port.protocol }}
                      </a-tag>
                    </div>
                  </div>
                </div>
                
                <div class="card-footer card-action-footer">
                  <a-button type="primary" ghost size="small" @click="viewServiceYaml(service)">
                    <template #icon><CodeOutlined /></template>
                    YAML
                  </a-button>
                  <a-popconfirm
                    title="确定要删除该 Service 吗?"
                    @confirm="handleDelete(service)"
                    ok-text="确定"
                    cancel-text="取消"
                  >
                    <a-button type="primary" danger ghost size="small">
                      <template #icon><DeleteOutlined /></template>
                      删除
                    </a-button>
                  </a-popconfirm>
                </div>
              </div>
            </a-checkbox-group>
          </div>
        </a-spin>
      </div>
    </div>

    <!-- 查看 Service YAML 模态框 -->
    <a-modal
      v-model:open="viewYamlModalVisible"
      title="Service YAML 配置"
      width="900px"
      class="cluster-modal yaml-modal"
      :footer="null"
    >
      <a-alert v-if="currentService" class="modal-alert" type="info" show-icon>
        <template #message>
          <span>{{ currentService.metadata.name }} ({{ currentService.metadata.namespace }})</span>
        </template>
        <template #description>
          <div>类型: {{ currentService.spec.type }} | 创建于: {{ formatDate(currentService.metadata.creationTimestamp) }}</div>
        </template>
      </a-alert>
      
      <div class="yaml-actions">
        <a-button type="primary" size="small" @click="copyYaml">
          <template #icon><CopyOutlined /></template>
          复制
        </a-button>
      </div>
      <pre class="yaml-editor">{{ serviceYaml }}</pre>
    </a-modal>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, watch } from 'vue';
import { message } from 'ant-design-vue';
import { useRoute } from 'vue-router';
import {
  getServiceListApi,
  getServiceYamlApi,
  deleteServiceApi,
  getAllClustersApi,
  getNamespacesByClusterIdApi,
} from '#/api';
import { 
  CloudServerOutlined, 
  TableOutlined, 
  AppstoreOutlined, 
  ReloadOutlined,
  DeleteOutlined,
  CodeOutlined,
  ApiOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CopyOutlined,
  ClusterOutlined,
  PartitionOutlined
} from '@ant-design/icons-vue';

// 类型定义
interface ServicePort {
  name: string;
  protocol: string;
  port: number;
  targetPort: number;
}

interface Service {
  metadata: {
    name: string;
    namespace: string;
    uid: string;
    creationTimestamp: string;
  };
  spec: {
    type: string;
    clusterIP: string;
    ports: ServicePort[];
    selector: Record<string, string>;
  };
  status: {
    loadBalancer: Record<string, any>;
  };
}

// 状态变量
const route = useRoute();
const loading = ref(false);
const clustersLoading = ref(false);
const namespacesLoading = ref(false);
const services = ref<Service[]>([]);
const searchText = ref('');
const selectedRows = ref<Service[]>([]);
const namespaces = ref<string[]>(['default']);
const selectedNamespace = ref<string>('default');
const viewYamlModalVisible = ref(false);
const serviceYaml = ref('');
const clusters = ref<Array<{id: number, name: string}>>([]);
const selectedCluster = ref<number>();
const viewMode = ref<'table' | 'card'>('table');
const currentService = ref<Service | null>(null);
const selectedCardIds = ref<string[]>([]);

// 根据卡片选择更新 selectedRows
watch(selectedCardIds, (newValue) => {
  selectedRows.value = services.value.filter(service => 
    newValue.includes(service.metadata.uid)
  );
});

// 表格列配置
const columns = [
  {
    title: 'Service 名称',
    dataIndex: ['metadata', 'name'],
    key: 'name',
    slots: { customRender: 'name' },
    width: '20%',
    sorter: (a: Service, b: Service) => a.metadata.name.localeCompare(b.metadata.name),
  },
  {
    title: '命名空间',
    dataIndex: ['metadata', 'namespace'],
    key: 'namespace',
    width: '12%',
    slots: { customRender: 'namespace' },
    sorter: (a: Service, b: Service) => a.metadata.namespace.localeCompare(b.metadata.namespace),
  },
  {
    title: '类型',
    dataIndex: ['spec', 'type'],
    key: 'type',
    width: '10%',
    slots: { customRender: 'type' },
    filters: [
      { text: 'ClusterIP', value: 'ClusterIP' },
      { text: 'NodePort', value: 'NodePort' },
      { text: 'LoadBalancer', value: 'LoadBalancer' },
      { text: 'ExternalName', value: 'ExternalName' },
    ],
    onFilter: (value: string, record: Service) => record.spec.type === value,
  },
  {
    title: 'Cluster IP',
    dataIndex: ['spec', 'clusterIP'],
    key: 'clusterIP',
    width: '15%',
    slots: { customRender: 'clusterIP' },
  },
  {
    title: '端口映射',
    dataIndex: ['spec', 'ports'],
    key: 'ports',
    width: '20%',
    slots: { customRender: 'ports' },
  },
  {
    title: '创建时间',
    dataIndex: ['metadata', 'creationTimestamp'],
    key: 'creationTimestamp',
    width: '15%',
    sorter: (a: Service, b: Service) => new Date(a.metadata.creationTimestamp).getTime() - new Date(b.metadata.creationTimestamp).getTime(),
    slots: { customRender: 'creationTimestamp' },
  },
  {
    title: '操作',
    key: 'action',
    width: '12%',
    fixed: 'right',
    slots: { customRender: 'action' },
  },
];

// 计算属性：过滤后的Service列表
const filteredServices = computed(() => {
  const searchValue = searchText.value.toLowerCase().trim();
  if (!searchValue) return services.value;
  return services.value.filter(svc => 
    svc.metadata.name.toLowerCase().includes(searchValue) ||
    svc.spec.type.toLowerCase().includes(searchValue) ||
    svc.spec.clusterIP.toLowerCase().includes(searchValue)
  );
});

// 计算属性：Service类型统计
const loadBalancerCount = computed(() => 
  services.value.filter(svc => svc.spec.type === 'LoadBalancer').length
);

const clusterIPCount = computed(() => 
  services.value.filter(svc => svc.spec.type === 'ClusterIP').length
);

const nodePortCount = computed(() => 
  services.value.filter(svc => svc.spec.type === 'NodePort').length
);

const externalNameCount = computed(() => 
  services.value.filter(svc => svc.spec.type === 'ExternalName').length
);

// 生成服务类型的颜色
const getServiceTypeColor = (type: string) => {
  switch (type) {
    case 'ClusterIP': return 'blue';
    case 'NodePort': return 'green';
    case 'LoadBalancer': return 'purple';
    case 'ExternalName': return 'orange';
    default: return 'default';
  }
};

// 检查负载均衡器是否就绪
const isLoadBalancerReady = (service: Service) => {
  return service.spec.type === 'LoadBalancer' && 
         service.status?.loadBalancer?.ingress && 
         service.status.loadBalancer.ingress.length > 0;
};

// 格式化日期
const formatDate = (dateString: string) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return `${date.getMonth() + 1}月${date.getDate()}日 ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

// 日期时间格式化
const formatDateTime = (dateString: string): string => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
};

// 表格选择配置
const rowSelection = {
  onChange: (selectedRowKeys: string[], selectedRowsData: Service[]) => {
    selectedRows.value = selectedRowsData;
    selectedCardIds.value = selectedRowsData.map(row => row.metadata.uid);
  },
  getCheckboxProps: (record: Service) => ({
    disabled: false, // 可以根据条件禁用某些行的选择
  }),
};

// 复制YAML
const copyYaml = async () => {
  try {
    await navigator.clipboard.writeText(serviceYaml.value);
    message.success('YAML 已复制到剪贴板');
  } catch (err) {
    message.error('复制失败，请手动选择并复制');
  }
};

// 获取集群列表
const getClusters = async () => {
  clustersLoading.value = true;
  try {
    const res = await getAllClustersApi();
    clusters.value = res ?? [];
    if (clusters.value.length > 0 && !selectedCluster.value) {
      selectedCluster.value = clusters.value[0]?.id;
      if (selectedCluster.value) {
        await getNamespaces();
        await getServices();
      }
    }
  } catch (error: any) {
    message.error(error.message || '获取集群列表失败');
  } finally {
    clustersLoading.value = false;
  }
};

// 获取命名空间列表
const getNamespaces = async () => {
  if (!selectedCluster.value) {
    message.warning('请先选择集群');
    return;
  }

  namespacesLoading.value = true;
  try {
    const res = await getNamespacesByClusterIdApi(selectedCluster.value);
    namespaces.value = res.map((ns: { name: string }) => ns.name);
    if (namespaces.value.length > 0) {
      selectedNamespace.value = namespaces.value[0] || 'default';
    }
  } catch (error: any) {
    message.error(error.message || '获取命名空间列表失败');
    namespaces.value = ['default'];
    selectedNamespace.value = 'default';
  } finally {
    namespacesLoading.value = false;
  }
};

// 获取Service列表
const getServices = async () => {
  if (!selectedCluster.value || !selectedNamespace.value) {
    message.warning('请先选择集群和命名空间');
    return;
  }
  
  loading.value = true;
  try {
    const res = await getServiceListApi(selectedCluster.value, selectedNamespace.value);
    services.value = res || [];
    selectedRows.value = [];
    selectedCardIds.value = [];
  } catch (error: any) {
    message.error(error.message || '获取Service列表失败');
  } finally {
    loading.value = false;
  }
};

// 刷新数据
const refreshData = () => {
  getServices();
};

// 搜索
const onSearch = () => {
  // 搜索逻辑已经在计算属性中实现，这里可以添加其他触发行为
};

// 查看Service YAML
const viewServiceYaml = async (service: Service) => {
  if (!selectedCluster.value) return;
  try {
    currentService.value = service;
    const res = await getServiceYamlApi(selectedCluster.value, service.metadata.name, service.metadata.namespace);
    serviceYaml.value = typeof res === 'string' ? res : JSON.stringify(res, null, 2);
    viewYamlModalVisible.value = true;
  } catch (error: any) {
    message.error(error.message || '获取Service YAML失败');
  }
};

// 删除Service
const handleDelete = async (service: Service) => {
  if (!selectedCluster.value) return;
  
  try {
    await deleteServiceApi(selectedCluster.value, service.metadata.namespace, service.metadata.name);
    message.success('Service删除成功');
    getServices();
  } catch (error: any) {
    message.error(error.message || '删除Service失败');
  }
};

// 批量删除Service
const handleBatchDelete = async () => {
  if (!selectedRows.value.length || !selectedCluster.value) return;
  
  try {
    loading.value = true;
    const promises = selectedRows.value.map(service => 
      deleteServiceApi(selectedCluster.value!, service.metadata.namespace, service.metadata.name)
    );
    
    await Promise.all(promises);
    message.success(`成功删除 ${selectedRows.value.length} 个服务`);
    selectedRows.value = [];
    selectedCardIds.value = [];
    getServices();
  } catch (error: any) {
    message.error(error.message || '批量删除失败');
  } finally {
    loading.value = false;
  }
};

// 切换命名空间
const handleNamespaceChange = () => {
  getServices();
};

// 切换集群
const handleClusterChange = () => {
  selectedNamespace.value = 'default';
  services.value = [];
  getNamespaces();
  getServices();
};

// 页面加载时获取数据
onMounted(() => {
  getClusters();
});
</script>

<style>
/* 现代化大气设计系统 */
:root {
  --primary-color: #1677ff;
  --primary-hover: #4096ff;
  --primary-active: #0958d9;
  --success-color: #52c41a;
  --warning-color: #faad14;
  --error-color: #ff4d4f;
  --text-primary: #000000d9;
  --text-secondary: #00000073;
  --text-tertiary: #00000040;
  --text-quaternary: #00000026;
  --border-color: #d9d9d9;
  --border-color-split: #f0f0f0;
  --background-color: #f5f5f5;
  --component-background: #ffffff;
  --layout-header-background: #001529;
  --shadow-1: 0 2px 8px rgba(0, 0, 0, 0.06);
  --shadow-2: 0 6px 16px rgba(0, 0, 0, 0.08);
  --shadow-3: 0 9px 28px rgba(0, 0, 0, 0.12);
  --border-radius-base: 8px;
  --border-radius-sm: 6px;
  --border-radius-lg: 12px;
  --font-size-base: 14px;
  --font-size-lg: 16px;
  --font-size-xl: 20px;
  --font-size-xxl: 24px;
  --line-height-base: 1.5714;
  --transition-duration: 0.3s;
  --transition-function: cubic-bezier(0.645, 0.045, 0.355, 1);
}

/* ==================== 布局容器 ==================== */
.cluster-management-container {
  min-height: 100vh;
  background: var(--background-color);
  padding: 24px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

/* ==================== 页面头部 ==================== */
.page-header {
  background: var(--component-background);
  border-radius: var(--border-radius-base);
  margin-bottom: 24px;
  box-shadow: var(--shadow-1);
  overflow: hidden;
}

.header-content {
  padding: 32px 40px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.title-section {
  flex: 1;
}

.page-title {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.title-icon {
  font-size: 28px;
  color: var(--primary-color);
  margin-right: 16px;
}

.page-title h1 {
  font-size: var(--font-size-xxl);
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
  line-height: 1.2;
}

.page-subtitle {
  font-size: var(--font-size-base);
  color: var(--text-secondary);
  margin: 0;
  line-height: var(--line-height-base);
}

.header-actions {
  flex-shrink: 0;
}

/* ==================== 概览卡片 ==================== */
.overview-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.overview-card {
  background: var(--component-background);
  border-radius: var(--border-radius-base);
  padding: 24px;
  box-shadow: var(--shadow-1);
  display: flex;
  align-items: center;
  transition: all var(--transition-duration) var(--transition-function);
  border: 1px solid var(--border-color-split);
}

.overview-card:hover {
  box-shadow: var(--shadow-2);
  transform: translateY(-2px);
}

.card-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--border-radius-base);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  margin-right: 16px;
  flex-shrink: 0;
}

.total-clusters .card-icon {
  background: rgba(22, 119, 255, 0.1);
  color: var(--primary-color);
}

.running-clusters .card-icon {
  background: rgba(82, 196, 26, 0.1);
  color: var(--success-color);
}

.env-types .card-icon {
  background: rgba(250, 173, 20, 0.1);
  color: var(--warning-color);
}

.resource-usage .card-icon {
  background: rgba(114, 46, 209, 0.1);
  color: #722ed1;
}

.card-info {
  flex: 1;
}

.card-number {
  font-size: var(--font-size-xl);
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.2;
  margin-bottom: 4px;
}

.card-label {
  font-size: var(--font-size-base);
  color: var(--text-secondary);
  line-height: var(--line-height-base);
}

/* ==================== 工具栏 ==================== */
.toolbar {
  background: var(--component-background);
  border-radius: var(--border-radius-base);
  padding: 20px 24px;
  margin-bottom: 24px;
  box-shadow: var(--shadow-1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  border: 1px solid var(--border-color-split);
}

.toolbar-left {
  display: flex;
  gap: 16px;
  align-items: center;
  flex: 1;
}

.search-input {
  width: 320px;
}

.search-input :deep(.ant-input) {
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-base);
  height: 40px;
}

.env-filter {
  width: 160px;
}

.env-filter :deep(.ant-select-selector) {
  border-radius: var(--border-radius-sm);
  height: 40px;
}

.toolbar-right {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-shrink: 0;
}

.view-toggle :deep(.ant-radio-group) {
  border-radius: var(--border-radius-sm);
}

.view-toggle :deep(.ant-radio-button-wrapper) {
  height: 32px;
  line-height: 30px;
  padding: 0 12px;
  border-radius: var(--border-radius-sm);
}

.view-toggle :deep(.ant-radio-button-wrapper:first-child) {
  border-radius: var(--border-radius-sm) 0 0 var(--border-radius-sm);
}

.view-toggle :deep(.ant-radio-button-wrapper:last-child) {
  border-radius: 0 var(--border-radius-sm) var(--border-radius-sm) 0;
}

.cluster-option, .namespace-option {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* ==================== 数据展示区域 ==================== */
.data-display {
  background: var(--component-background);
  border-radius: var(--border-radius-base);
  box-shadow: var(--shadow-1);
  border: 1px solid var(--border-color-split);
  overflow: hidden;
}

.display-header {
  padding: 16px 24px;
  border-bottom: 1px solid var(--border-color-split);
  background: var(--component-background);
}

.result-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.result-count {
  font-size: var(--font-size-base);
  color: var(--text-secondary);
  font-weight: 500;
}

.env-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.env-tags :deep(.ant-tag) {
  border-radius: var(--border-radius-sm);
  font-size: 12px;
  font-weight: 500;
  margin: 0;
}

/* ==================== 表格样式 ==================== */
.cluster-table {
  border: none;
}

.cluster-table :deep(.ant-table-container) {
  border-radius: 0;
}

.cluster-table :deep(.ant-table-thead > tr > th) {
  background: #fafafa;
  font-weight: 600;
  padding: 16px 16px;
  border-bottom: 1px solid var(--border-color-split);
  color: var(--text-primary);
  font-size: var(--font-size-base);
}

.cluster-table :deep(.ant-table-tbody > tr) {
  transition: background-color var(--transition-duration) var(--transition-function);
}

.cluster-table :deep(.ant-table-tbody > tr:hover) {
  background-color: #fafafa;
}

.cluster-table :deep(.ant-table-tbody > tr > td) {
  padding: 16px;
  border-bottom: 1px solid var(--border-color-split);
  vertical-align: middle;
  font-size: var(--font-size-base);
}

.cluster-name {
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 500;
}

.service-name {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 500;
}

.service-icon {
  color: var(--primary-color);
  font-size: 20px;
}

.lb-tag {
  margin-left: 8px;
}

.namespace-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #e6f7ff;
  color: #1890ff;
  border: 1px solid #91d5ff;
  font-size: 13px;
  padding: 2px 8px;
  border-radius: 4px;
}

.env-tag, .service-type-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
  padding: 4px 12px;
  border-radius: var(--border-radius-base);
  font-size: 12px;
  border: none;
}

.port-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.port-tag {
  margin: 0 !important;
  border-radius: 12px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  padding: 2px 8px;
}

.timestamp {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-secondary);
  font-size: var(--font-size-base);
}

.ip-address {
  display: flex;
  align-items: center;
  gap: 10px;
  font-family: 'Courier New', monospace;
  color: #595959;
}

.action-column {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.action-column :deep(.ant-btn) {
  width: 32px;
  height: 32px;
  border-radius: var(--border-radius-sm);
  transition: all var(--transition-duration) var(--transition-function);
}

.action-column :deep(.ant-btn:hover) {
  transform: translateY(-1px);
  box-shadow: var(--shadow-2);
}

/* ==================== 卡片视图 ==================== */
.card-view {
  padding: 24px;
}

.cluster-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 24px;
}

.card-checkbox-group {
  display: contents;
}

.cluster-card {
  background: var(--component-background);
  border-radius: var(--border-radius-base);
  box-shadow: var(--shadow-1);
  transition: all var(--transition-duration) var(--transition-function);
  overflow: hidden;
  border: 1px solid var(--border-color-split);
  position: relative;
}

.cluster-card:hover {
  box-shadow: var(--shadow-2);
  transform: translateY(-4px);
}

.card-header {
  padding: 24px 24px 16px;
  background: var(--component-background);
  position: relative;
}

.service-title {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-right: 60px;
}

.service-title h3 {
  margin: 0;
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.3;
}

.card-type-tag {
  position: absolute;
  top: 20px;
  right: 48px;
  padding: 4px 8px;
  border-radius: var(--border-radius-sm);
  font-weight: 500;
  font-size: 12px;
}

.card-checkbox {
  position: absolute;
  top: 20px;
  right: 16px;
}

.card-content {
  padding: 0 24px 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.card-detail {
  display: flex;
  align-items: center;
  line-height: var(--line-height-base);
}

.detail-label {
  color: var(--text-secondary);
  min-width: 100px;
  font-size: var(--font-size-base);
  font-weight: 500;
}

.detail-value {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: var(--font-size-base);
  color: var(--text-primary);
  flex: 1;
  font-weight: 500;
}

.card-ports {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.port-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.card-action-footer {
  padding: 16px 24px 20px;
  background: #fafafa;
  border-top: 1px solid var(--border-color-split);
  display: flex;
  gap: 12px;
}

.card-action-footer .ant-btn {
  flex: 1;
  height: 36px;
  border-radius: var(--border-radius-sm);
  font-weight: 500;
  transition: all var(--transition-duration) var(--transition-function);
  font-size: var(--font-size-base);
}

.card-action-footer .ant-btn:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-2);
}

/* ==================== 模态框样式 ==================== */
.cluster-modal :deep(.ant-modal-content) {
  border-radius: var(--border-radius-base);
  overflow: hidden;
  box-shadow: var(--shadow-3);
}

.cluster-modal :deep(.ant-modal-header) {
  background: var(--component-background);
  border-bottom: 1px solid var(--border-color-split);
  padding: 20px 24px;
}

.cluster-modal :deep(.ant-modal-title) {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--text-primary);
}

.modal-alert {
  margin-bottom: 20px;
  border-radius: var(--border-radius-sm);
}

/* YAML模态框样式 */
.yaml-modal {
  font-family: "Consolas", "Monaco", monospace;
}

.yaml-actions {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 10px;
}

.yaml-editor {
  font-family: 'JetBrains Mono', 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.5;
  padding: 16px;
  background-color: #fafafa;
  border-radius: 4px;
  border: 1px solid #f0f0f0;
  overflow: auto;
  max-height: 500px;
  margin: 0;
}

/* ==================== 空状态 ==================== */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60px 0;
  color: var(--text-secondary);
}

.empty-state p {
  margin: 16px 0 24px;
  font-size: var(--font-size-base);
}

/* ==================== 响应式设计 ==================== */
@media (max-width: 1400px) {
  .overview-cards {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .cluster-cards {
    grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  }
}

@media (max-width: 1024px) {
  .cluster-management-container {
    padding: 16px;
  }
  
  .header-content {
    flex-direction: column;
    align-items: stretch;
    gap: 20px;
    padding: 24px 32px;
  }
  
  .toolbar {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  
  .toolbar-left {
    flex-direction: column;
    gap: 12px;
  }
  
  .search-input {
    width: 100%;
  }
  
  .env-filter {
    width: 100%;
  }
  
  .toolbar-right {
    justify-content: space-between;
  }
}

@media (max-width: 768px) {
  .cluster-management-container {
    padding: 12px;
  }
  
  .header-content {
    padding: 20px 24px;
  }
  
  .page-title h1 {
    font-size: var(--font-size-xl);
  }
  
  .overview-cards {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
  
  .overview-card {
    padding: 16px;
  }
  
  .card-icon {
    width: 40px;
    height: 40px;
    font-size: 18px;
    margin-right: 12px;
  }
  
  .card-number {
    font-size: var(--font-size-lg);
  }
  
  .cluster-cards {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .cluster-card {
    margin-bottom: 0;
  }
  
  .card-action-footer {
    flex-direction: column;
    gap: 8px;
  }
}

@media (max-width: 480px) {
  .overview-cards {
    grid-template-columns: 1fr;
    gap: 8px;
  }
  
  .overview-card {
    padding: 12px;
  }
  
  .card-icon {
    width: 36px;
    height: 36px;
    font-size: 16px;
    margin-right: 8px;
  }
  
  .toolbar-right {
    flex-direction: column;
    gap: 8px;
  }
  
  .cluster-table :deep(.ant-table-tbody > tr > td) {
    padding: 12px 8px;
    font-size: 13px;
  }
  
  .action-column {
    flex-direction: column;
    gap: 4px;
  }
  
  .action-column :deep(.ant-btn) {
    width: 28px;
    height: 28px;
  }
}
</style>
