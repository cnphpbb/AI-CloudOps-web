<template>
  <div class="cluster-management-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="title-section">
          <div class="page-title">
            <ClusterOutlined class="title-icon" />
            <h1>Kubernetes 集群管理</h1>
          </div>
          <p class="page-subtitle">管理和监控您的 Kubernetes 集群资源</p>
        </div>
        <div class="header-actions">
          <a-button type="primary" size="large" @click="isAddModalVisible = true">
            <template #icon><PlusOutlined /></template>
            新建集群
          </a-button>
        </div>
      </div>
    </div>

    <!-- 数据概览卡片 -->
    <div class="overview-cards">
      <div class="overview-card total-clusters">
        <div class="card-icon">
          <ClusterOutlined />
        </div>
        <div class="card-info">
          <div class="card-number">{{ clusters.length }}</div>
          <div class="card-label">集群总数</div>
        </div>
      </div>
      
      <div class="overview-card running-clusters">
        <div class="card-icon">
          <CheckCircleOutlined />
        </div>
        <div class="card-info">
          <div class="card-number">{{ runningClusters }}</div>
          <div class="card-label">运行中</div>
        </div>
      </div>
      
      <div class="overview-card env-types">
        <div class="card-icon">
          <EnvironmentOutlined />
        </div>
        <div class="card-info">
          <div class="card-number">{{ Object.keys(envDistribution).length }}</div>
          <div class="card-label">环境类型</div>
        </div>
      </div>
      
      <div class="overview-card resource-usage">
        <div class="card-icon">
          <DashboardOutlined />
        </div>
        <div class="card-info">
          <div class="card-number">{{ resourceUtilization }}%</div>
          <div class="card-label">资源使用率</div>
        </div>
      </div>
    </div>

    <!-- 操作工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <a-input-search
          v-model:value="searchText"
          placeholder="搜索集群名称或描述"
          class="search-input"
          @search="onSearch"
          allow-clear
        />
        
        <a-select
          v-model:value="filterEnv"
          placeholder="选择环境"
          class="env-filter"
          allow-clear
          @change="onEnvFilterChange"
        >
          <a-select-option value="dev">开发环境</a-select-option>
          <a-select-option value="prod">生产环境</a-select-option>
          <a-select-option value="stage">测试环境</a-select-option>
          <a-select-option value="rc">预发布</a-select-option>
          <a-select-option value="press">压测环境</a-select-option>
        </a-select>
      </div>
      
      <div class="toolbar-right">
        <div class="view-toggle">
          <a-radio-group v-model:value="viewMode" button-style="solid" size="small">
            <a-radio-button value="table">
              <UnorderedListOutlined />
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
          @click="showBatchDeleteConfirm" 
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
      <div class="display-header" v-if="filteredData.length > 0">
        <div class="result-info">
          <span class="result-count">共 {{ filteredData.length }} 个集群</span>
          <div class="env-tags" v-if="Object.keys(envDistribution).length > 0">
            <a-tag v-for="(count, env) in envDistribution" :key="env" :color="getEnvColor(env)">
              {{ getEnvName(env) }} {{ count }}
            </a-tag>
          </div>
        </div>
      </div>

      <!-- 表格视图 -->
      <a-table
        v-if="viewMode === 'table'"
        :columns="columns"
        :data-source="filteredData"
        :row-selection="rowSelection"
        :loading="loading"
        row-key="id"
        :pagination="{ 
          pageSize: 12, 
          showSizeChanger: true, 
          showQuickJumper: true,
          showTotal: (total: number) => `共 ${total} 条数据`,
          pageSizeOptions: ['12', '24', '48', '96']
        }"
        class="cluster-table"
      >
      <!-- 集群名称列 -->
      <template #name="{ text, record }">
        <div class="cluster-name">
          <ClusterOutlined />
          <a @click="handleViewNodes(record.id)">{{ text }}</a>
        </div>
      </template>
      
      <!-- 环境列 -->
      <template #env="{ text }">
        <a-tag :color="getEnvColor(text)" class="env-tag">
          <span class="status-dot"></span>
          {{ getEnvName(text) }}
        </a-tag>
      </template>
      
      <!-- 状态列 -->
      <template #status="{ text }">
        <a-tag :color="getStatusColor(text)" class="status-tag">
          <span class="status-dot"></span>
          {{ text }}
        </a-tag>
      </template>

      <!-- 创建时间列 -->
      <template #created_at="{ text }">
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
          <a-tooltip title="编辑集群">
            <a-button type="primary" ghost shape="circle" @click="handleEdit(record.id)">
              <template #icon><EditOutlined /></template>
            </a-button>
          </a-tooltip>
          
          <a-tooltip title="查看节点">
            <a-button type="primary" ghost shape="circle" @click="handleViewNodes(record.id)">
              <template #icon><EyeOutlined /></template>
            </a-button>
          </a-tooltip>
          
          <a-tooltip title="删除集群">
            <a-popconfirm
              title="确定要删除该集群吗?"
              description="此操作不可撤销"
              @confirm="handleDelete(record.id)"
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
          <ClusterOutlined style="font-size: 48px; color: #d9d9d9; margin-bottom: 16px" />
          <p>暂无集群数据</p>
          <a-button type="primary" @click="isAddModalVisible = true">新增第一个集群</a-button>
        </div>
      </template>
    </a-table>

      <!-- 卡片视图 -->
      <div v-else class="card-view">
        <a-spin :spinning="loading">
          <a-empty v-if="filteredData.length === 0" description="暂无集群数据">
            <template #image>
              <ClusterOutlined style="font-size: 64px; color: #d9d9d9;" />
            </template>
            <template #description>
              <span style="color: #999;">暂无集群数据</span>
            </template>
            <a-button type="primary" @click="isAddModalVisible = true">创建第一个集群</a-button>
          </a-empty>
          <div v-else class="cluster-cards">
            <a-checkbox-group v-model:value="selectedCardIds" class="card-checkbox-group">
              <div v-for="cluster in filteredData" :key="cluster.id" class="cluster-card">
              <div class="card-header">
                <a-checkbox :value="cluster.id" class="card-checkbox" />
                <div class="service-title cluster-title">
                  <ClusterOutlined class="service-icon" />
                  <h3>{{ cluster.name }}</h3>
                </div>
                <a-tag :color="getEnvColor(cluster.env)" class="card-type-tag env-tag">
                  <span class="status-dot"></span>
                  {{ getEnvName(cluster.env) }}
                </a-tag>
              </div>
              
              <div class="card-content">
                <div class="card-detail name-zh-detail">
                  <span class="detail-label">中文名称:</span>
                  <span class="detail-value">
                    {{ cluster.name_zh || '-' }}
                  </span>
                </div>
                <div class="card-detail version-detail">
                  <span class="detail-label">版本:</span>
                  <span class="detail-value">
                    {{ cluster.version || '-' }}
                  </span>
                </div>
                <div class="card-detail status-detail">
                  <span class="detail-label">状态:</span>
                  <span class="detail-value">
                    <a-badge :status="getStatusType(cluster.status)" :text="cluster.status || '未知'" />
                  </span>
                </div>
                <div class="card-detail created-detail">
                  <span class="detail-label">创建时间:</span>
                  <span class="detail-value">
                    <ClockCircleOutlined />
                    {{ formatDate(cluster.created_at) }}
                  </span>
                </div>
              </div>
              
              <div class="card-footer card-action-footer">
                <a-button type="primary" ghost size="small" @click="handleViewNodes(cluster.id)">
                  <template #icon><EyeOutlined /></template>
                  查看节点
                </a-button>
                <a-button type="primary" ghost size="small" @click="handleEdit(cluster.id)">
                  <template #icon><EditOutlined /></template>
                  编辑
                </a-button>
                <a-popconfirm
                  title="确定要删除该集群吗?"
                  @confirm="handleDelete(cluster.id)"
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

    <!-- 新增集群模态框 -->
    <a-modal
      v-model:open="isAddModalVisible"
      title="新增集群"
      :width="800"
      @ok="handleAdd"
      @cancel="closeAddModal"
      :confirmLoading="submitLoading"
      class="cluster-modal"
    >
      <a-alert type="info" show-icon class="modal-alert">
        <template #message>新增Kubernetes集群</template>
        <template #description>请填写集群的基本信息和连接配置</template>
      </a-alert>
      
      <a-form :model="addForm" layout="vertical" class="cluster-form">
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="集群名称" name="name" :rules="[{ required: true, message: '请输入集群名称' }]">
              <a-input v-model:value="addForm.name" placeholder="请输入集群名称" class="form-input">
                <template #prefix><ClusterOutlined /></template>
              </a-input>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="集群中文名称" name="name_zh">
              <a-input v-model:value="addForm.name_zh" placeholder="请输入集群中文名称" class="form-input">
                <template #prefix><FontSizeOutlined /></template>
              </a-input>
            </a-form-item>
          </a-col>
        </a-row>
        
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="环境" name="env" :rules="[{ required: true, message: '请选择环境' }]">
              <a-select v-model:value="addForm.env" placeholder="请选择环境" class="form-select">
                <template #suffixIcon><EnvironmentOutlined /></template>
                <a-select-option value="dev">开发环境</a-select-option>
                <a-select-option value="prod">生产环境</a-select-option>
                <a-select-option value="stage">阶段环境</a-select-option>
                <a-select-option value="rc">发布候选</a-select-option>
                <a-select-option value="press">压力测试</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="集群版本" name="version">
              <a-input v-model:value="addForm.version" placeholder="请输入集群版本" class="form-input">
                <template #prefix><TagOutlined /></template>
              </a-input>
            </a-form-item>
          </a-col>
        </a-row>
        
        <a-divider orientation="left">集群资源限制</a-divider>
        <a-alert
          type="warning"
          show-icon
          banner
          message="警告"
          description="设置资源限制是一个敏感操作,请仔细确认输入的值是否正确。错误的资源限制可能会影响集群的正常运行。"
          style="margin-bottom: 16px"
        />
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="集群 CPU 请求 (cores)" name="cpu_request">
              <a-input-number v-model:value="addForm.cpu_request" style="width: 100%" placeholder="请输入集群 CPU 请求" addon-after="cores" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="集群 CPU 限制 (cores)" name="cpu_limit">
              <a-input-number v-model:value="addForm.cpu_limit" style="width: 100%" placeholder="请输入集群 CPU 限制" addon-after="cores" />  
            </a-form-item>
          </a-col>
        </a-row>
        
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="集群内存请求 (Mi)" name="memory_request">
              <a-input-number v-model:value="addForm.memory_request" style="width: 100%" placeholder="请输入内存请求" addon-after="Mi" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="集群内存限制 (Mi)" name="memory_limit">
              <a-input-number v-model:value="addForm.memory_limit" style="width: 100%" placeholder="请输入内存限制" addon-after="Mi" />
            </a-form-item>
          </a-col>
        </a-row>

        <a-form-item label="限制命名空间" name="restricted_name_space">
          <a-textarea
            v-model:value="addForm.restricted_name_space"
            placeholder="请输入限制命名空间，多个命名空间用逗号分隔"
            :auto-size="{ minRows: 3, maxRows: 6 }"
            style="width: 100%"
          />
        </a-form-item>
        
        <a-divider orientation="left">高级配置</a-divider>
        
        <a-form-item label="API 服务器地址" name="api_server_addr">
          <a-input v-model:value="addForm.api_server_addr" placeholder="请输入 API 服务器地址" class="form-input">
            <template #prefix><ApiOutlined /></template>
          </a-input>
        </a-form-item>
        
        <a-form-item label="KubeConfig 内容" name="kube_config_content">
          <a-textarea
            v-model:value="addForm.kube_config_content"
            placeholder="请输入 KubeConfig 内容"
            :auto-size="{ minRows: 4, maxRows: 8 }"
            class="form-textarea"
          />
        </a-form-item>
        
        <a-form-item label="操作超时（秒）" name="action_timeout_seconds">
          <a-slider
            v-model:value="addForm.action_timeout_seconds"
            :min="10"
            :max="300"
            :step="10"
            :marks="{
              10: '10s',
              60: '60s',
              120: '120s',
              300: '300s',
            }"
          />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 编辑集群模态框 -->
    <a-modal
      v-model:open="isEditModalVisible"
      title="编辑集群"
      :width="800"
      @ok="handleUpdate"
      @cancel="closeEditModal"
      :confirmLoading="submitLoading"
      class="cluster-modal"
    >
      <a-alert v-if="editForm.id" type="info" show-icon class="modal-alert">
        <template #message>编辑集群: {{ editForm.name }}</template>
        <template #description>ID: {{ editForm.id }} | 环境: {{ getEnvName(editForm.env) }}</template>
      </a-alert>
      
      <a-form :model="editForm" layout="vertical" class="cluster-form">
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="集群名称" name="name" :rules="[{ required: true, message: '请输入集群名称' }]">
              <a-input v-model:value="editForm.name" placeholder="请输入集群名称" class="form-input">
                <template #prefix><ClusterOutlined /></template>
              </a-input>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="集群中文名称" name="name_zh">
              <a-input v-model:value="editForm.name_zh" placeholder="请输入集群中文名称" class="form-input">
                <template #prefix><FontSizeOutlined /></template>
              </a-input>
            </a-form-item>
          </a-col>
        </a-row>
        
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="环境" name="env" :rules="[{ required: true, message: '请选择环境' }]">
              <a-select v-model:value="editForm.env" placeholder="请选择环境" class="form-select">
                <template #suffixIcon><EnvironmentOutlined /></template>
                <a-select-option value="dev">开发环境</a-select-option>
                <a-select-option value="prod">生产环境</a-select-option>
                <a-select-option value="stage">阶段环境</a-select-option>
                <a-select-option value="rc">发布候选</a-select-option>
                <a-select-option value="press">压力测试</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="集群版本" name="version">
              <a-input v-model:value="editForm.version" placeholder="请输入集群版本" class="form-input">
                <template #prefix><TagOutlined /></template>
              </a-input>
            </a-form-item>
          </a-col>
        </a-row>
        
        <a-divider orientation="left">资源配置</a-divider>
        
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="CPU 请求" name="cpu_request">
              <a-input-number v-model:value="editForm.cpu_request" style="width: 100%" placeholder="请输入 CPU 请求" addon-after="cores" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="CPU 限制" name="cpu_limit">
              <a-input-number v-model:value="editForm.cpu_limit" style="width: 100%" placeholder="请输入 CPU 限制" addon-after="cores" />
            </a-form-item>
          </a-col>
        </a-row>
        
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="内存请求" name="memory_request">
              <a-input-number v-model:value="editForm.memory_request" style="width: 100%" placeholder="请输入内存请求" addon-after="Mi" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="内存限制" name="memory_limit">
              <a-input-number v-model:value="editForm.memory_limit" style="width: 100%" placeholder="请输入内存限制" addon-after="Mi" />
            </a-form-item>
          </a-col>
        </a-row>
        
        <a-divider orientation="left">高级配置</a-divider>
        
        <a-form-item label="限制命名空间" name="restricted_name_space">
          <a-textarea
            v-model:value="editForm.restricted_name_space"
            placeholder="请输入限制命名空间，多个命名空间用逗号分隔"
            :auto-size="{ minRows: 3, maxRows: 6 }"
            style="width: 100%"
          />
        </a-form-item>
        
        <a-form-item label="API 服务器地址" name="api_server_addr">
          <a-input v-model:value="editForm.api_server_addr" placeholder="请输入 API 服务器地址" class="form-input">
            <template #prefix><ApiOutlined /></template>
          </a-input>
        </a-form-item>
        
        <a-form-item label="KubeConfig 内容" name="kube_config_content">
          <a-textarea
            v-model:value="editForm.kube_config_content"
            placeholder="请输入 KubeConfig 内容"
            :auto-size="{ minRows: 4, maxRows: 8 }"
            class="form-textarea"
          />
        </a-form-item>
        
        <a-form-item label="操作超时（秒）" name="action_timeout_seconds">
          <a-slider
            v-model:value="editForm.action_timeout_seconds"
            :min="10"
            :max="300"
            :step="10"
            :marks="{
              10: '10s',
              60: '60s',
              120: '120s',
              300: '300s',
            }"
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { message, Modal } from 'ant-design-vue';
import { 
  getAllClustersApi, 
  getClusterApi, 
  createClusterApi, 
  updateClusterApi, 
  deleteClusterApi 
} from '#/api';
import type { ClustersItem } from '#/api';
import { useRouter } from 'vue-router';
import { 
  EditOutlined, 
  DeleteOutlined, 
  EyeOutlined,
  PlusOutlined,
  ReloadOutlined,
  ClusterOutlined,
  EnvironmentOutlined,
  ApiOutlined,
  UnorderedListOutlined,
  AppstoreOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  DashboardOutlined,
  TagOutlined,
  FontSizeOutlined
} from '@ant-design/icons-vue';

// 路由和状态管理
const router = useRouter();
const loading = ref(false);
const submitLoading = ref(false);
const clusters = ref<ClustersItem[]>([]);
const searchText = ref('');
const filterEnv = ref<string | undefined>(undefined);
const selectedRows = ref<ClustersItem[]>([]);
const isAddModalVisible = ref(false);
const isEditModalVisible = ref(false);
const viewMode = ref<'table' | 'card'>('table');
const resourceUtilization = ref(68); // 模拟数据，实际应从API获取
const selectedCardIds = ref<number[]>([]);

// 表格列配置
const columns = [
  {
    title: '集群名称',
    dataIndex: 'name',
    key: 'name',
    width: '20%',
    sorter: (a: ClustersItem, b: ClustersItem) => a.name.localeCompare(b.name),
    slots: { customRender: 'name' },
  },
  {
    title: '中文名称',
    dataIndex: 'name_zh',
    key: 'name_zh',
    width: '15%'
  },
  {
    title: '环境',
    dataIndex: 'env',
    key: 'env',
    width: '10%',
    slots: { customRender: 'env' },
    filters: [
      { text: '开发环境', value: 'dev' },
      { text: '生产环境', value: 'prod' },
      { text: '阶段环境', value: 'stage' },
      { text: '发布候选', value: 'rc' },
      { text: '压力测试', value: 'press' },
    ],
    onFilter: (value: string, record: ClustersItem) => record.env === value,
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: '10%',
    slots: { customRender: 'status' },
  },
  {
    title: '版本',
    dataIndex: 'version',
    key: 'version',
    width: '10%',
  },
  {
    title: '创建者',
    dataIndex: 'user_id',
    key: 'user_id',
    width: '10%',
  },
  {
    title: '创建时间',
    dataIndex: 'created_at',
    key: 'created_at',
    width: '15%',
    sorter: (a: ClustersItem, b: ClustersItem) => {
      if (!a.created_at || !b.created_at) return 0;
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    },
    slots: { customRender: 'created_at' },
  },
  {
    title: '操作',
    key: 'action',
    width: '15%',
    fixed: 'right',
    slots: { customRender: 'action' },
  },
];

// 计算属性：环境分布
const envDistribution = computed(() => {
  const distribution: Record<string, number> = {};
  clusters.value.forEach(cluster => {
    const env = cluster.env || 'unknown';
    if (!distribution[env]) {
      distribution[env] = 0;
    }
    distribution[env]++;
  });
  return distribution;
});

// 计算属性：运行中的集群数量
const runningClusters = computed(() => {
  return clusters.value.filter(cluster => 
    cluster.status === 'Running' || cluster.status === '运行中'
  ).length;
});

// 根据搜索和筛选条件过滤数据
const filteredData = computed(() => {
  const searchValue = searchText.value.trim().toLowerCase();
  return clusters.value.filter(item => {
    const matchSearch = item.name.toLowerCase().includes(searchValue) || 
                       (item.name_zh && item.name_zh.toLowerCase().includes(searchValue));
    const matchEnv = !filterEnv.value || item.env === filterEnv.value;
    return matchSearch && matchEnv;
  });
});

// 根据卡片选择更新 selectedRows
watch(selectedCardIds, (newValue) => {
  selectedRows.value = clusters.value.filter(cluster => 
    newValue.includes(cluster.id)
  );
});

// 批量选择配置
const rowSelection = {
  onChange: (_selectedRowKeys: number[], selectedRowsData: ClustersItem[]) => {
    selectedRows.value = selectedRowsData;
    selectedCardIds.value = selectedRowsData.map(row => row.id);
  },
  getCheckboxProps: (_record: ClustersItem) => ({
    disabled: false, // 可以根据条件禁用某些行的选择
  }),
};

// 新增、编辑表单
interface ClusterForm {
  name: string;
  name_zh: string;
  cpu_request: string;
  cpu_limit: string;
  memory_request: string;
  memory_limit: string;
  restricted_name_space: string;
  env: string;
  version: string;
  api_server_addr: string;
  kube_config_content: string;
  action_timeout_seconds: number;
}

const addForm = reactive<ClusterForm>({
  name: '',
  name_zh: '',
  cpu_request: '',
  cpu_limit: '',
  memory_request: '',
  memory_limit: '',
  restricted_name_space: '',
  env: 'dev',
  version: '',
  api_server_addr: '',
  kube_config_content: '',
  action_timeout_seconds: 60,
});

const editForm = reactive<ClusterForm & { id: number }>({
  id: 0,
  name: '',
  name_zh: '',
  cpu_request: '',
  cpu_limit: '',
  memory_request: '',
  memory_limit: '',
  restricted_name_space: '',
  env: 'dev',
  version: '',
  api_server_addr: '',
  kube_config_content: '',
  action_timeout_seconds: 60,
});

// 获取集群列表
const getClusters = async () => {
  loading.value = true;
  try {
    const res = await getAllClustersApi();
    clusters.value = res;
  } catch (error: any) {
    message.error(error.message || '获取集群数据失败');
  } finally {
    loading.value = false;
  }
};

// 刷新数据
const refreshData = () => {
  searchText.value = '';
  filterEnv.value = undefined;
  getClusters();
};

// 搜索处理
const onSearch = (value: string) => {
  searchText.value = value;
};

// 环境筛选变化
const onEnvFilterChange = (value: string) => {
  filterEnv.value = value;
};

// 检查是否填写了资源限制
const hasResourceLimits = (form: ClusterForm) => {
  return form.cpu_request || form.cpu_limit || form.memory_request || form.memory_limit;
};

// 执行新增集群操作
const executeAdd = async () => {
  submitLoading.value = true;
  try {
    const formToSubmit = {
      ...addForm,
      restricted_name_space: addForm.restricted_name_space 
        ? addForm.restricted_name_space.split(',').map(ns => ns.trim()).filter(ns => ns)
        : []
    };
    await createClusterApi(formToSubmit);
    message.success('集群新增成功');
    getClusters();
    isAddModalVisible.value = false;
    
    // 重置表单
    Object.keys(addForm).forEach(key => {
      const k = key as keyof ClusterForm;
      if (k === 'env') {
        addForm[k] = 'dev';
      } else if (k === 'action_timeout_seconds') {
        addForm[k] = 60;
      } else if (k === 'restricted_name_space') {
        addForm[k] = '';
      } else {
        addForm[k] = '';
      }
    });
  } catch (error: any) {
    message.error(error.message || '新增集群失败');
  } finally {
    submitLoading.value = false;
  }
};

// 新增集群
const handleAdd = async () => {
  // 检查是否填写了资源限制
  if (hasResourceLimits(addForm)) {
    Modal.confirm({
      title: '确认资源限制设置',
      content: `您设置了以下资源限制：\n${addForm.cpu_request ? `CPU请求: ${addForm.cpu_request} cores\n` : ''}${addForm.cpu_limit ? `CPU限制: ${addForm.cpu_limit} cores\n` : ''}${addForm.memory_request ? `内存请求: ${addForm.memory_request} Mi\n` : ''}${addForm.memory_limit ? `内存限制: ${addForm.memory_limit} Mi\n` : ''}\n这是一个敏感操作，错误的资源限制可能会影响集群的正常运行。\n\n请确认这些设置是否正确？`,
      okText: '确认创建',
      okType: 'danger',
      cancelText: '取消',
      width: 500,
      onOk: executeAdd,
    });
  } else {
    await executeAdd();
  }
};

// 编辑集群
const handleEdit = async (id: number) => {
  loading.value = true;
  try {
    const res = await getClusterApi(id);
    editForm.id = res.id;
    editForm.name = res.name;
    editForm.name_zh = res.name_zh || '';
    editForm.cpu_request = res.cpu_request || '';
    editForm.cpu_limit = res.cpu_limit || '';
    editForm.memory_request = res.memory_request || '';
    editForm.memory_limit = res.memory_limit || '';
    editForm.restricted_name_space = Array.isArray(res.restricted_name_space) 
      ? res.restricted_name_space.join(', ') 
      : res.restricted_name_space || '';
    editForm.env = res.env || 'dev';
    editForm.version = res.version || '';
    editForm.api_server_addr = res.api_server_addr || '';
    editForm.kube_config_content = res.kube_config_content || '';
    editForm.action_timeout_seconds = res.action_timeout_seconds || 60;
    isEditModalVisible.value = true;
  } catch (error: any) {
    message.error(error.message || '获取集群数据失败');
  } finally {
    loading.value = false;
  }
};

// 执行更新集群操作
const executeUpdate = async () => {
  if (!editForm.id) {
    message.error('集群 ID 无效');
    return;
  }
  
  submitLoading.value = true;
  try {
    const formToSubmit = {
      ...editForm,
      restricted_name_space: editForm.restricted_name_space 
        ? editForm.restricted_name_space.split(',').map(ns => ns.trim()).filter(ns => ns)
        : []
    };
    await updateClusterApi(formToSubmit);
    message.success('集群更新成功');
    getClusters();
    isEditModalVisible.value = false;
  } catch (error: any) {
    message.error(error.message || '更新集群失败');
  } finally {
    submitLoading.value = false;
  }
};

// 更新集群
const handleUpdate = async () => {
  if (!editForm.id) {
    message.error('集群 ID 无效');
    return;
  }
  
  // 检查是否填写了资源限制
  if (hasResourceLimits(editForm)) {
    Modal.confirm({
      title: '确认资源限制设置',
      content: `您设置了以下资源限制：\n${editForm.cpu_request ? `CPU请求: ${editForm.cpu_request} cores\n` : ''}${editForm.cpu_limit ? `CPU限制: ${editForm.cpu_limit} cores\n` : ''}${editForm.memory_request ? `内存请求: ${editForm.memory_request} Mi\n` : ''}${editForm.memory_limit ? `内存限制: ${editForm.memory_limit} Mi\n` : ''}\n这是一个敏感操作，错误的资源限制可能会影响集群的正常运行。\n\n请确认这些设置是否正确？`,
      okText: '确认更新',
      okType: 'danger',
      cancelText: '取消',
      width: 500,
      onOk: executeUpdate,
    });
  } else {
    await executeUpdate();
  }
};

// 批量删除确认
const showBatchDeleteConfirm = () => {
  if (selectedRows.value.length === 0) {
    message.warning('请先选择要删除的集群');
    return;
  }
  
  Modal.confirm({
    title: `确定要删除选中的 ${selectedRows.value.length} 个集群吗?`,
    content: '删除后将无法恢复，集群相关配置和资源将被清除。',
    okText: '批量删除',
    okType: 'danger',
    cancelText: '取消',
    async onOk() {
      loading.value = true;
      try {
        for (const row of selectedRows.value) {
          await deleteClusterApi(row.id);
        }
        message.success(`成功删除 ${selectedRows.value.length} 个集群`);
        selectedRows.value = [];
        selectedCardIds.value = [];
        getClusters();
      } catch (error: any) {
        message.error(error.message || '批量删除集群失败');
      } finally {
        loading.value = false;
      }
    },
  });
};

// 删除集群
const handleDelete = async (id: number) => {
  loading.value = true;
  try {
    await deleteClusterApi(id);
    message.success('集群删除成功');
    getClusters();
  } catch (error: any) {
    message.error(error.message || '删除集群失败');
  } finally {
    loading.value = false;
  }
};

// 查看节点
const handleViewNodes = (id: number) => {
  router.push({ name: 'K8sNode', query: { cluster_id: id } });
};

// 关闭模态框
const closeAddModal = () => {
  isAddModalVisible.value = false;
};

const closeEditModal = () => {
  isEditModalVisible.value = false;
};

// 环境颜色映射
const getEnvColor = (env: string): string => {
  const colorMap: Record<string, string> = {
    dev: 'blue',
    prod: 'red',
    stage: 'green',
    rc: 'orange',
    press: 'purple'
  };
  return colorMap[env] || 'default';
};

// 状态颜色映射
const getStatusColor = (status: string): string => {
  if (!status) return 'default';
  
  const statusMap: Record<string, string> = {
    'Running': 'green',
    'Pending': 'orange',
    'Warning': 'orange',
    'Error': 'red',
    'Failed': 'red',
    'Unknown': 'gray'
  };
  
  return statusMap[status] || 'default';
};

// 环境名称映射
const getEnvName = (env: string): string => {
  const nameMap: Record<string, string> = {
    dev: '开发环境',
    prod: '生产环境',
    stage: '阶段环境',
    rc: '发布候选',
    press: '压力测试'
  };
  return nameMap[env] || env;
};

// 状态类型映射
const getStatusType = (status: string): string => {
  if (!status) return 'default';
  
  const statusMap: Record<string, string> = {
    'Running': 'success',
    'Pending': 'processing',
    'Warning': 'warning',
    'Error': 'error',
    'Failed': 'error',
    'Unknown': 'default'
  };
  
  return statusMap[status] || 'default';
};

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

.cluster-name a {
  color: var(--primary-color);
  transition: color var(--transition-duration) var(--transition-function);
  text-decoration: none;
  font-weight: 500;
}

.cluster-name a:hover {
  color: var(--primary-hover);
}

.env-tag, .status-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
  padding: 4px 12px;
  border-radius: var(--border-radius-base);
  font-size: 12px;
  border: none;
}

.status-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: currentColor;
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

.cluster-title {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-right: 60px;
}

.cluster-title h3 {
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

.cluster-form {
  padding: 8px 0;
}

.form-input, .form-select, .form-textarea {
  border-radius: var(--border-radius-sm);
  transition: all var(--transition-duration) var(--transition-function);
  font-size: var(--font-size-base);
}

.form-input {
  height: 40px;
}

.form-input:focus, .form-select:focus, .form-textarea:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(22, 119, 255, 0.1);
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
