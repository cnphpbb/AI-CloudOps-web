<template>
  <div class="configmap-management-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="title-section">
          <div class="page-title">
            <ProfileOutlined class="title-icon" />
            <h1>ConfigMap 资源管理</h1>
          </div>
          <p class="page-subtitle">管理和监控您的 Kubernetes 配置资源</p>
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
      <div class="overview-card total-configmaps">
        <div class="card-icon">
          <ProfileOutlined />
        </div>
        <div class="card-info">
          <div class="card-number">{{ filteredConfigMaps.length }}</div>
          <div class="card-label">配置总数</div>
        </div>
      </div>
      
      <div class="overview-card selected-cluster">
        <div class="card-icon">
          <ClusterOutlined />
        </div>
        <div class="card-info">
          <div class="card-number">{{ selectedCluster ? clusters.find(c => c.id === selectedCluster)?.name || '-' : '-' }}</div>
          <div class="card-label">当前集群</div>
        </div>
      </div>
      
      <div class="overview-card selected-namespace">
        <div class="card-icon">
          <PartitionOutlined />
        </div>
        <div class="card-info">
          <div class="card-number">{{ selectedNamespace || '-' }}</div>
          <div class="card-label">命名空间</div>
        </div>
      </div>
      
      <div class="overview-card config-items">
        <div class="card-icon">
          <AppstoreOutlined />
        </div>
        <div class="card-info">
          <div class="card-number">{{ totalConfigItems }}</div>
          <div class="card-label">配置项总数</div>
        </div>
      </div>
    </div>

    <!-- 操作工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <a-select
          v-model:value="selectedCluster"
          placeholder="选择集群"
          class="cluster-selector"
          :loading="clustersLoading"
          @change="handleClusterChange"
          allow-clear
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
          class="namespace-selector"
          :loading="namespacesLoading"
          @change="handleNamespaceChange"
          allow-clear
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
          placeholder="搜索 ConfigMap 名称"
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
      <div class="display-header" v-if="filteredConfigMaps.length > 0">
        <div class="result-info">
          <span class="result-count">共 {{ filteredConfigMaps.length }} 个配置</span>
          <div class="env-tags" v-if="selectedCluster && selectedNamespace">
            <a-tag color="blue">
              {{ clusters.find(c => c.id === selectedCluster)?.name || '未知集群' }}
            </a-tag>
            <a-tag color="green">
              {{ selectedNamespace }}
            </a-tag>
          </div>
        </div>
      </div>

      <!-- 表格视图 -->
      <a-table
        v-if="viewMode === 'table'"
        :columns="columns"
        :data-source="filteredConfigMaps"
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
        class="configmap-table"
      >
        <!-- ConfigMap名称列 -->
        <template #name="{ text }">
          <div class="configmap-name">
            <ProfileOutlined />
            <span>{{ text }}</span>
          </div>
        </template>
        
        <!-- 数据条目列 -->
        <template #dataCount="{ record }">
          <a-badge 
            :count="Object.keys(record.data || {}).length" 
            :number-style="{ backgroundColor: '#1890ff' }"
          />
        </template>

        <!-- 配置项预览列 -->
        <template #dataPreview="{ record }">
          <div class="data-preview">
            <a-tag 
              v-for="(item, index) in Object.entries(record.data || {}).slice(0, 3)" 
              :key="index" 
              color="blue"
              class="data-key-tag"
            >
              {{ item[0] }}
            </a-tag>
            <a-tag v-if="Object.keys(record.data || {}).length > 3" color="default">
              +{{ Object.keys(record.data || {}).length - 3 }}
            </a-tag>
            <span v-if="!record.data || Object.keys(record.data).length === 0" class="empty-data">
              无数据项
            </span>
          </div>
        </template>

        <!-- 创建时间列 -->
        <template #creationTimestamp="{ text }">
          <div class="timestamp">
            <ClockCircleOutlined />
            <a-tooltip :title="formatDateTime(text)">
              {{ formatDate(text) }}
            </a-tooltip>
          </div>
        </template>

        <!-- 操作列 -->
        <template #action="{ record }">
          <div class="action-column">
            <a-tooltip title="查看 YAML">
              <a-button type="primary" ghost shape="circle" @click="viewConfigMapYaml(record)">
                <template #icon><CodeOutlined /></template>
              </a-button>
            </a-tooltip>
            
            <a-tooltip title="查看配置详情">
              <a-button type="primary" ghost shape="circle" @click="viewConfigDetail(record)">
                <template #icon><EyeOutlined /></template>
              </a-button>
            </a-tooltip>
            
            <a-tooltip title="删除配置">
              <a-popconfirm
                title="确定要删除该 ConfigMap 吗?"
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
            <ProfileOutlined style="font-size: 48px; color: #d9d9d9; margin-bottom: 16px" />
            <p>暂无配置数据</p>
            <a-button type="primary" @click="refreshData">刷新数据</a-button>
          </div>
        </template>
      </a-table>

      <!-- 卡片视图 -->
      <div v-else class="card-view">
        <a-spin :spinning="loading">
          <a-empty v-if="filteredConfigMaps.length === 0" description="暂无配置数据">
            <template #image>
              <ProfileOutlined style="font-size: 64px; color: #d9d9d9;" />
            </template>
            <template #description>
              <span style="color: #999;">暂无配置数据</span>
            </template>
            <a-button type="primary" @click="refreshData">刷新数据</a-button>
          </a-empty>
          <div v-else class="configmap-cards">
            <a-checkbox-group v-model:value="selectedCardIds" class="card-checkbox-group">
              <div v-for="configmap in filteredConfigMaps" :key="configmap.metadata.uid" class="configmap-card">
                <div class="card-header">
                  <a-checkbox :value="configmap.metadata.uid" class="card-checkbox" />
                  <div class="service-title configmap-title">
                    <ProfileOutlined class="service-icon" />
                    <h3>{{ configmap.metadata.name }}</h3>
                  </div>
                  <a-tag color="blue" class="card-type-tag">
                    <span class="status-dot"></span>
                    ConfigMap
                  </a-tag>
                </div>
                
                <div class="card-content">
                  <div class="card-detail namespace-detail">
                    <span class="detail-label">命名空间:</span>
                    <span class="detail-value">
                      {{ configmap.metadata.namespace || '-' }}
                    </span>
                  </div>
                  <div class="card-detail datacount-detail">
                    <span class="detail-label">配置项数量:</span>
                    <span class="detail-value">
                      <a-badge 
                        :count="Object.keys(configmap.data || {}).length" 
                        :number-style="{ backgroundColor: '#1890ff' }"
                      />
                    </span>
                  </div>
                  <div class="card-detail keys-detail">
                    <span class="detail-label">配置项:</span>
                    <div class="detail-value">
                      <div class="data-keys">
                        <a-tag 
                          v-for="(_, key, index) in configmap.data" 
                          :key="index" 
                          color="blue"
                          class="data-key-tag"
                          v-show="index < 5"
                        >
                          {{ key }}
                        </a-tag>
                        <a-tag v-if="Object.keys(configmap.data || {}).length > 5" color="default">
                          +{{ Object.keys(configmap.data || {}).length - 5 }}
                        </a-tag>
                        <span v-if="!configmap.data || Object.keys(configmap.data).length === 0" class="empty-data">
                          无数据项
                        </span>
                      </div>
                    </div>
                  </div>
                  <div class="card-detail created-detail">
                    <span class="detail-label">创建时间:</span>
                    <span class="detail-value">
                      <ClockCircleOutlined />
                      {{ formatDate(configmap.metadata.creationTimestamp) }}
                    </span>
                  </div>
                </div>
                
                <div class="card-footer card-action-footer">
                  <a-button type="primary" ghost size="small" @click="viewConfigMapYaml(configmap)">
                    <template #icon><CodeOutlined /></template>
                    YAML
                  </a-button>
                  <a-button type="primary" ghost size="small" @click="viewConfigDetail(configmap)">
                    <template #icon><EyeOutlined /></template>
                    查看配置
                  </a-button>
                  <a-popconfirm
                    title="确定要删除该 ConfigMap 吗?"
                    @confirm="handleDelete(configmap)"
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

    <!-- 查看 ConfigMap YAML 模态框 -->
    <a-modal
      v-model:open="viewYamlModalVisible"
      title="ConfigMap YAML 配置"
      :width="800"
      class="configmap-modal"
      :footer="null"
    >
      <a-alert v-if="currentConfigMap" class="modal-alert" type="info" show-icon>
        <template #message>{{ currentConfigMap.metadata.name }} ({{ currentConfigMap.metadata.namespace }})</template>
        <template #description>配置项数量: {{ Object.keys(currentConfigMap.data || {}).length }} | 创建于: {{ formatDateTime(currentConfigMap.metadata.creationTimestamp) }}</template>
      </a-alert>
      <div class="yaml-actions">
        <a-button type="primary" size="small" @click="copyYaml">
          <template #icon><CopyOutlined /></template>
          复制
        </a-button>
      </div>
      <pre class="yaml-editor">{{ configMapYaml }}</pre>
    </a-modal>

    <!-- 查看配置详情模态框 -->
    <a-modal
      v-model:open="configDetailModalVisible"
      title="ConfigMap 配置详情"
      :width="800"
      class="configmap-modal"
      :footer="null"
    >
      <a-alert v-if="currentConfigMap" class="modal-alert" type="info" show-icon>
        <template #message>{{ currentConfigMap.metadata.name }} ({{ currentConfigMap.metadata.namespace }})</template>
        <template #description>配置项数量: {{ Object.keys(currentConfigMap.data || {}).length }} | 创建于: {{ formatDateTime(currentConfigMap.metadata.creationTimestamp) }}</template>
      </a-alert>
      
      <a-tabs v-if="currentConfigMap && currentConfigMap.data">
        <a-tab-pane 
          v-for="(value, key, index) in currentConfigMap.data" 
          :key="index" 
          :tab="key"
        >
          <div class="config-detail-content">
            <div class="config-actions">
              <a-button type="primary" size="small" @click="copyConfigValue(value)">
                <template #icon><CopyOutlined /></template>
                复制内容
              </a-button>
            </div>
            <pre class="config-value-editor">{{ value }}</pre>
          </div>
        </a-tab-pane>
      </a-tabs>
      
      <a-empty v-else description="无配置数据" />
    </a-modal>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, watch } from 'vue';
import { message } from 'ant-design-vue';
import {
  getConfigMapListApi,
  getConfigMapYamlApi,
  deleteConfigMapApi,
  getAllClustersApi,
  getNamespacesByClusterIdApi,
} from '#/api';
import { 
  CloudServerOutlined, 
  TableOutlined, 
  AppstoreOutlined, 
  SearchOutlined,
  ReloadOutlined,
  DeleteOutlined,
  EyeOutlined, 
  CodeOutlined,
  ProfileOutlined,
  ClockCircleOutlined,
  CopyOutlined,
  ClusterOutlined,
  PartitionOutlined
} from '@ant-design/icons-vue';

// 类型定义
interface ConfigMap {
  metadata: {
    name: string;
    namespace: string;
    uid: string;
    creationTimestamp: string;
  };
  data: Record<string, string>;
}

// 状态变量
const loading = ref(false);
const clustersLoading = ref(false);
const namespacesLoading = ref(false);
const configMaps = ref<ConfigMap[]>([]);
const searchText = ref('');
const selectedRows = ref<ConfigMap[]>([]);
const namespaces = ref<string[]>(['default']);
const selectedNamespace = ref<string>('default');
const viewYamlModalVisible = ref(false);
const configDetailModalVisible = ref(false);
const configMapYaml = ref('');
const clusters = ref<Array<{id: number, name: string}>>([]);
const selectedCluster = ref<number>();
const viewMode = ref<'table' | 'card'>('table');
const currentConfigMap = ref<ConfigMap | null>(null);
const selectedCardIds = ref<string[]>([]);

// 计算属性：配置项总数
const totalConfigItems = computed(() => {
  return configMaps.value.reduce((total, cm) => {
    return total + Object.keys(cm.data || {}).length;
  }, 0);
});

// 根据卡片选择更新 selectedRows
watch(selectedCardIds, (newValue) => {
  selectedRows.value = configMaps.value.filter(configmap => 
    newValue.includes(configmap.metadata.uid)
  );
});

// 表格列配置
const columns = [
  {
    title: 'ConfigMap 名称',
    dataIndex: ['metadata', 'name'],
    key: 'name',
    slots: { customRender: 'name' },
    width: '20%',
    sorter: (a: ConfigMap, b: ConfigMap) => a.metadata.name.localeCompare(b.metadata.name),
  },
  {
    title: '命名空间',
    dataIndex: ['metadata', 'namespace'],
    key: 'namespace',
    width: '15%',
    sorter: (a: ConfigMap, b: ConfigMap) => a.metadata.namespace.localeCompare(b.metadata.namespace),
  },
  {
    title: '配置项数量',
    key: 'dataCount',
    width: '10%',
    slots: { customRender: 'dataCount' },
    sorter: (a: ConfigMap, b: ConfigMap) => 
      Object.keys(a.data || {}).length - Object.keys(b.data || {}).length,
  },
  {
    title: '配置项预览',
    key: 'dataPreview',
    width: '25%',
    slots: { customRender: 'dataPreview' },
  },
  {
    title: '创建时间',
    dataIndex: ['metadata', 'creationTimestamp'],
    key: 'creationTimestamp',
    width: '15%',
    sorter: (a: ConfigMap, b: ConfigMap) => new Date(a.metadata.creationTimestamp).getTime() - new Date(b.metadata.creationTimestamp).getTime(),
    slots: { customRender: 'creationTimestamp' },
  },
  {
    title: '操作',
    key: 'action',
    width: '15%',
    fixed: 'right',
    slots: { customRender: 'action' },
  },
];

// 计算属性：过滤后的ConfigMap列表
const filteredConfigMaps = computed(() => {
  const searchValue = searchText.value.toLowerCase().trim();
  if (!searchValue) return configMaps.value;
  return configMaps.value.filter(cm => 
    cm.metadata.name.toLowerCase().includes(searchValue) ||
    cm.metadata.namespace.toLowerCase().includes(searchValue)
  );
});

// 日期格式化
const formatDate = (dateString: string): string => {
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
  onChange: (_selectedRowKeys: string[], selectedRowsData: ConfigMap[]) => {
    selectedRows.value = selectedRowsData;
    selectedCardIds.value = selectedRowsData.map(row => row.metadata.uid);
  },
};

// 复制YAML
const copyYaml = async () => {
  try {
    await navigator.clipboard.writeText(configMapYaml.value);
    message.success('YAML 已复制到剪贴板');
  } catch (err) {
    message.error('复制失败，请手动选择并复制');
  }
};

// 复制配置值
const copyConfigValue = async (value: string) => {
  try {
    await navigator.clipboard.writeText(value);
    message.success('配置内容已复制到剪贴板');
  } catch (err) {
    message.error('复制失败，请手动选择并复制');
  }
};

// 获取集群列表
const getClusters = async () => {
  clustersLoading.value = true;
  try {
    const res = await getAllClustersApi();
    clusters.value = res || [];
    if (clusters.value.length > 0 && clusters.value[0]?.id) {
      selectedCluster.value = clusters.value[0].id;
      await getNamespaces();
      await getConfigMaps();
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

// 获取ConfigMap列表
const getConfigMaps = async () => {
  if (!selectedCluster.value || !selectedNamespace.value) {
    message.warning('请先选择集群和命名空间');
    return;
  }
  
  loading.value = true;
  try {
    const res = await getConfigMapListApi(selectedCluster.value, selectedNamespace.value);
    configMaps.value = res || [];
    selectedRows.value = [];
    selectedCardIds.value = [];
  } catch (error: any) {
    message.error(error.message || '获取ConfigMap列表失败');
  } finally {
    loading.value = false;
  }
};

// 刷新数据
const refreshData = () => {
  getConfigMaps();
};

// 搜索
const onSearch = () => {
  // 搜索逻辑已经在计算属性中实现，这里可以添加其他触发行为
};

// 查看ConfigMap YAML
const viewConfigMapYaml = async (configMap: ConfigMap) => {
  if (!selectedCluster.value) return;
  try {
    currentConfigMap.value = configMap;
    const res = await getConfigMapYamlApi(selectedCluster.value, configMap.metadata.name, configMap.metadata.namespace);
    configMapYaml.value = typeof res === 'string' ? res : JSON.stringify(res, null, 2);
    viewYamlModalVisible.value = true;
  } catch (error: any) {
    message.error(error.message || '获取ConfigMap YAML失败');
  }
};

// 查看配置详情
const viewConfigDetail = (configMap: ConfigMap) => {
  currentConfigMap.value = configMap;
  configDetailModalVisible.value = true;
};

// 删除ConfigMap
const handleDelete = async (configMap: ConfigMap) => {
  if (!selectedCluster.value) return;
  
  try {
    await deleteConfigMapApi(selectedCluster.value, configMap.metadata.namespace, configMap.metadata.name);
    message.success('ConfigMap删除成功');
    getConfigMaps();
  } catch (error: any) {
    message.error(error.message || '删除ConfigMap失败');
  }
};

// 批量删除ConfigMap
const handleBatchDelete = async () => {
  if (!selectedRows.value.length || !selectedCluster.value) return;
  
  try {
    loading.value = true;
    const promises = selectedRows.value.map(configMap => 
      deleteConfigMapApi(selectedCluster.value!, configMap.metadata.namespace, configMap.metadata.name)
    );
    
    await Promise.all(promises);
    message.success(`成功删除 ${selectedRows.value.length} 个配置`);
    selectedRows.value = [];
    selectedCardIds.value = [];
    getConfigMaps();
  } catch (error: any) {
    message.error(error.message || '批量删除失败');
  } finally {
    loading.value = false;
  }
};

// 切换命名空间
const handleNamespaceChange = () => {
  getConfigMaps();
};

// 切换集群
const handleClusterChange = () => {
  selectedNamespace.value = 'default';
  configMaps.value = [];
  getNamespaces();
  getConfigMaps();
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
.configmap-management-container {
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

.total-configmaps .card-icon {
  background: rgba(22, 119, 255, 0.1);
  color: var(--primary-color);
}

.selected-cluster .card-icon {
  background: rgba(82, 196, 26, 0.1);
  color: var(--success-color);
}

.selected-namespace .card-icon {
  background: rgba(250, 173, 20, 0.1);
  color: var(--warning-color);
}

.config-items .card-icon {
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
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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

.cluster-selector, .namespace-selector {
  width: 200px;
}

.cluster-selector :deep(.ant-select-selector),
.namespace-selector :deep(.ant-select-selector) {
  border-radius: var(--border-radius-sm);
  height: 40px;
}

.search-input {
  width: 280px;
}

.search-input :deep(.ant-input) {
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-base);
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
  gap: 8px;
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
.configmap-table {
  border: none;
}

.configmap-table :deep(.ant-table-container) {
  border-radius: 0;
}

.configmap-table :deep(.ant-table-thead > tr > th) {
  background: #fafafa;
  font-weight: 600;
  padding: 16px 16px;
  border-bottom: 1px solid var(--border-color-split);
  color: var(--text-primary);
  font-size: var(--font-size-base);
}

.configmap-table :deep(.ant-table-tbody > tr) {
  transition: background-color var(--transition-duration) var(--transition-function);
}

.configmap-table :deep(.ant-table-tbody > tr:hover) {
  background-color: #fafafa;
}

.configmap-table :deep(.ant-table-tbody > tr > td) {
  padding: 16px;
  border-bottom: 1px solid var(--border-color-split);
  vertical-align: middle;
  font-size: var(--font-size-base);
}

.configmap-name {
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 500;
}

.configmap-name span {
  color: var(--text-primary);
}

.data-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  max-width: 300px;
}

.data-key-tag {
  margin: 0 !important;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  max-width: 120px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.empty-data {
  color: var(--text-tertiary);
  font-style: italic;
  font-size: 12px;
}

.timestamp {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-secondary);
  font-size: var(--font-size-base);
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

.configmap-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 24px;
}

.card-checkbox-group {
  display: contents;
}

.configmap-card {
  background: var(--component-background);
  border-radius: var(--border-radius-base);
  box-shadow: var(--shadow-1);
  transition: all var(--transition-duration) var(--transition-function);
  overflow: hidden;
  border: 1px solid var(--border-color-split);
  position: relative;
}

.configmap-card:hover {
  box-shadow: var(--shadow-2);
  transform: translateY(-4px);
}

.card-header {
  padding: 24px 24px 16px;
  background: var(--component-background);
  position: relative;
}

.configmap-title {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-right: 60px;
}

.configmap-title h3 {
  margin: 0;
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.3;
}

.service-icon {
  font-size: 20px;
  color: var(--primary-color);
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
  align-items: flex-start;
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

.data-keys {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 4px;
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

.status-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: currentColor;
}

/* ==================== 模态框样式 ==================== */
.configmap-modal :deep(.ant-modal-content) {
  border-radius: var(--border-radius-base);
  overflow: hidden;
  box-shadow: var(--shadow-3);
}

.configmap-modal :deep(.ant-modal-header) {
  background: var(--component-background);
  border-bottom: 1px solid var(--border-color-split);
  padding: 20px 24px;
}

.configmap-modal :deep(.ant-modal-title) {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--text-primary);
}

.modal-alert {
  margin-bottom: 20px;
  border-radius: var(--border-radius-sm);
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
  border-radius: var(--border-radius-sm);
  border: 1px solid var(--border-color-split);
  overflow: auto;
  max-height: 500px;
  margin: 0;
  white-space: pre;
}

.config-detail-content {
  padding: 10px 0;
}

.config-actions {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 10px;
}

.config-value-editor {
  font-family: 'JetBrains Mono', 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.5;
  padding: 16px;
  background-color: #fafafa;
  border-radius: var(--border-radius-sm);
  border: 1px solid var(--border-color-split);
  overflow: auto;
  max-height: 400px;
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
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
  
  .configmap-cards {
    grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  }
}

@media (max-width: 1024px) {
  .configmap-management-container {
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
  
  .cluster-selector, .namespace-selector, .search-input {
    width: 100%;
  }
  
  .toolbar-right {
    justify-content: space-between;
  }
}

@media (max-width: 768px) {
  .configmap-management-container {
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
  
  .configmap-cards {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .configmap-card {
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
  
  .configmap-table :deep(.ant-table-tbody > tr > td) {
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
