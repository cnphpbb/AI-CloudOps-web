<template>
  <div class="scrape-pool-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="header-actions">
        <a-button type="primary" @click="showAddModal" class="btn-create">
          <template #icon>
            <PlusOutlined />
          </template>
          <span class="btn-text">新增记录</span>
        </a-button>
        <div class="search-filters">
          <a-input-search 
            v-model:value="searchText" 
            placeholder="搜索记录名称..." 
            class="search-input" 
            @search="handleSearch"
            @change="handleSearchChange" 
            allow-clear 
          />
          <a-button @click="handleReset" class="reset-btn">
            重置
          </a-button>
        </div>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-row">
      <a-row :gutter="[16, 16]">
        <a-col :xs="12" :sm="6" :md="6" :lg="6">
          <a-card class="stats-card">
            <a-statistic 
              title="总记录" 
              :value="stats.total" 
              :value-style="{ color: '#3f8600' }"
            >
              <template #prefix>
                <Icon icon="carbon:data-table" />
              </template>
            </a-statistic>
          </a-card>
        </a-col>
        <a-col :xs="12" :sm="6" :md="6" :lg="6">
          <a-card class="stats-card">
            <a-statistic 
              title="已启用" 
              :value="stats.enabled" 
              :value-style="{ color: '#52c41a' }"
            >
              <template #prefix>
                <Icon icon="carbon:check-mark" />
              </template>
            </a-statistic>
          </a-card>
        </a-col>
        <a-col :xs="12" :sm="6" :md="6" :lg="6">
          <a-card class="stats-card">
            <a-statistic 
              title="已禁用" 
              :value="stats.disabled" 
              :value-style="{ color: '#faad14' }"
            >
              <template #prefix>
                <Icon icon="carbon:close-filled" />
              </template>
            </a-statistic>
          </a-card>
        </a-col>
        <a-col :xs="12" :sm="6" :md="6" :lg="6">
          <a-card class="stats-card">
            <a-statistic 
              title="实例池" 
              :value="stats.pools" 
              :value-style="{ color: '#cf1322' }"
            >
              <template #prefix>
                <Icon icon="carbon:server" />
              </template>
            </a-statistic>
          </a-card>
        </a-col>
      </a-row>
    </div>

    <!-- 表格容器 -->
    <div class="table-container">
      <a-card>
        <a-table 
          :data-source="data" 
          :columns="columns" 
          :pagination="paginationConfig" 
          :loading="loading"
          row-key="id" 
          bordered 
          :scroll="{ x: 1200 }" 
          @change="handleTableChange"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'name'">
              <div class="pool-name-cell">
                <div class="pool-badge" :class="getRecordStatusClass(record)"></div>
                <span class="pool-name-text">{{ record.name }}</span>
              </div>
            </template>

            <template v-if="column.key === 'enable'">
              <a-tag :class="record.enable ? 'tech-tag status-enabled' : 'tech-tag status-disabled'">
                {{ record.enable ? '启用' : '禁用' }}
              </a-tag>
            </template>

            <template v-if="column.key === 'creator'">
              <div class="creator-info">
                <a-avatar 
                  size="small" 
                  :style="{ backgroundColor: getAvatarColor(record.create_user_name || '') }"
                >
                  {{ getInitials(record.create_user_name) }}
                </a-avatar>
                <span class="creator-name">{{ record.create_user_name }}</span>
              </div>
            </template>

            <template v-if="column.key === 'created_at'">
              <div class="date-info">
                <span class="date">{{ formatDate(record.created_at) }}</span>
                <span class="time">{{ formatTime(record.created_at) }}</span>
              </div>
            </template>

            <template v-if="column.key === 'action'">
              <div class="action-buttons">
                <a-button type="primary" size="small" @click="showEditModal(record)">
                  编辑
                </a-button>
                <a-button type="primary" danger size="small" @click="handleDelete(record)">
                  删除
                </a-button>
              </div>
            </template>
          </template>
        </a-table>
      </a-card>
    </div>

    <!-- 新增记录规则模态框 -->
    <a-modal 
      :open="isAddModalVisible" 
      title="新增记录规则" 
      :width="formDialogWidth"
      @ok="handleAdd" 
      @cancel="closeAddModal" 
      :confirm-loading="loading" 
      :destroy-on-close="true" 
      class="responsive-modal scrape-pool-modal"
    >
      <a-form 
        ref="addFormRef" 
        :model="addForm" 
        :rules="formRules" 
        layout="vertical"
      >
        <div class="form-section">
          <div class="section-title">基本信息</div>
          <a-row :gutter="16">
            <a-col :span="24">
              <a-form-item 
                label="记录名称" 
                name="name"
              >
                <a-input 
                  v-model:value="addForm.name" 
                  placeholder="请输入记录名称" 
                />
              </a-form-item>
            </a-col>
          </a-row>

          <a-row :gutter="16">
            <a-col :span="24">
              <a-form-item 
                label="Prometheus 实例池" 
                name="pool_id"
              >
                <a-select 
                  v-model:value="addForm.pool_id" 
                  placeholder="请选择实例池" 
                  class="full-width"
                >
                  <a-select-option v-for="pool in poolOptions" :key="pool.id" :value="pool.id">
                    {{ pool.name }}
                  </a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
          </a-row>

          <a-row :gutter="16">
            <a-col :xs="24" :sm="12">
              <a-form-item 
                label="IP地址" 
                name="ip_address"
              >
                <a-input 
                  v-model:value="addForm.ip_address" 
                  placeholder="例如: 192.168.1.100" 
                />
              </a-form-item>
            </a-col>
            <a-col :xs="24" :sm="12">
              <a-form-item 
                label="端口" 
                name="port"
              >
                <a-input 
                  v-model:value="addForm.port" 
                  placeholder="例如: 9090" 
                />
              </a-form-item>
            </a-col>
          </a-row>
        </div>

        <div class="form-section">
          <div class="section-title">规则配置</div>
          <a-row :gutter="16">
            <a-col :xs="24" :sm="12">
              <a-form-item 
                label="是否启用" 
                name="enable"
              >
                <a-select v-model:value="addForm.enable" placeholder="请选择启用状态">
                  <a-select-option :value="1">启用</a-select-option>
                  <a-select-option :value="2">禁用</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :xs="24" :sm="12">
              <a-form-item 
                label="持续时间" 
                name="for_time"
              >
                <a-input 
                  v-model:value="addForm.for_time" 
                  placeholder="例如: 15s" 
                />
              </a-form-item>
            </a-col>
          </a-row>

          <a-row :gutter="16">
            <a-col :span="24">
              <a-form-item 
                label="表达式" 
                name="expr"
              >
                <a-input 
                  v-model:value="addForm.expr" 
                  placeholder="请输入表达式" 
                />
              </a-form-item>
              <a-form-item>
                <a-button 
                  type="primary" 
                  class="validate-button" 
                  @click="validateAddExpression"
                >
                  <template #icon>
                    <Icon icon="mdi:check-circle-outline" />
                  </template>
                  验证表达式
                </a-button>
              </a-form-item>
            </a-col>
          </a-row>
        </div>
      </a-form>
    </a-modal>

    <!-- 编辑记录规则模态框 -->
    <a-modal 
      :open="isEditModalVisible" 
      title="编辑记录规则" 
      :width="formDialogWidth"
      @ok="handleUpdate" 
      @cancel="closeEditModal" 
      :confirm-loading="loading" 
      :destroy-on-close="true" 
      class="responsive-modal scrape-pool-modal"
    >
      <a-form 
        ref="editFormRef" 
        :model="editForm" 
        :rules="formRules" 
        layout="vertical"
      >
        <div class="form-section">
          <div class="section-title">基本信息</div>
          <a-row :gutter="16">
            <a-col :span="24">
              <a-form-item 
                label="记录名称" 
                name="name"
              >
                <a-input 
                  v-model:value="editForm.name" 
                  placeholder="请输入记录名称" 
                />
              </a-form-item>
            </a-col>
          </a-row>

          <a-row :gutter="16">
            <a-col :span="24">
              <a-form-item 
                label="Prometheus 实例池" 
                name="pool_id"
              >
                <a-select 
                  v-model:value="editForm.pool_id" 
                  placeholder="请选择实例池" 
                  class="full-width"
                >
                  <a-select-option v-for="pool in poolOptions" :key="pool.id" :value="pool.id">
                    {{ pool.name }}
                  </a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
          </a-row>

          <a-row :gutter="16">
            <a-col :xs="24" :sm="12">
              <a-form-item 
                label="IP地址" 
                name="ip_address"
              >
                <a-input 
                  v-model:value="editForm.ip_address" 
                  placeholder="例如: 192.168.1.100" 
                />
              </a-form-item>
            </a-col>
            <a-col :xs="24" :sm="12">
              <a-form-item 
                label="端口" 
                name="port"
              >
                <a-input 
                  v-model:value="editForm.port" 
                  placeholder="例如: 9090" 
                />
              </a-form-item>
            </a-col>
          </a-row>
        </div>

        <div class="form-section">
          <div class="section-title">规则配置</div>
          <a-row :gutter="16">
            <a-col :xs="24" :sm="12">
              <a-form-item 
                label="是否启用" 
                name="enable"
              >
                <a-select v-model:value="editForm.enable" placeholder="请选择启用状态">
                  <a-select-option :value="1">启用</a-select-option>
                  <a-select-option :value="2">禁用</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :xs="24" :sm="12">
              <a-form-item 
                label="持续时间" 
                name="for_time"
              >
                <a-input 
                  v-model:value="editForm.for_time" 
                  placeholder="例如: 15s" 
                />
              </a-form-item>
            </a-col>
          </a-row>

          <a-row :gutter="16">
            <a-col :span="24">
              <a-form-item 
                label="表达式" 
                name="expr"
              >
                <a-input 
                  v-model:value="editForm.expr" 
                  placeholder="请输入表达式" 
                />
              </a-form-item>
              <a-form-item>
                <a-button 
                  type="primary" 
                  class="validate-button" 
                  @click="validateEditExpression"
                >
                  <template #icon>
                    <Icon icon="mdi:check-circle-outline" />
                  </template>
                  验证表达式
                </a-button>
              </a-form-item>
            </a-col>
          </a-row>
        </div>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { message, Modal } from 'ant-design-vue';
import {
  PlusOutlined,
} from '@ant-design/icons-vue';
import { Icon } from '@iconify/vue';
import {
  getRecordRulesListApi,
  createRecordRuleApi,
  updateRecordRuleApi,
  deleteRecordRuleApi,
  type AlertRecordItem,
} from '#/api/core/prometheus_alert_record';
import { getMonitorScrapePoolListApi } from '#/api/core/prometheus_scrape_pool';
import { validateExprApi } from '#/api/core/prometheus_alert_rule';
import type { FormInstance } from 'ant-design-vue';

// 定义 Pool 类型
interface Pool {
  id: number;
  name: string;
}

// 响应式对话框宽度
const formDialogWidth = computed(() => {
  if (typeof window !== 'undefined') {
    const width = window.innerWidth;
    if (width < 768) return '95%';
    if (width < 1024) return '90%';
    return '900px';
  }
  return '900px';
});

// 列定义
const columns = [
  { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
  { title: '记录名称', dataIndex: 'name', key: 'name', width: 200, fixed: 'left' },
  { title: '关联实例池', dataIndex: 'pool_name', key: 'pool_name', width: 180 },
  { title: 'IP地址', dataIndex: 'ip_address', key: 'ip_address', width: 120 },
  { title: '是否启用', dataIndex: 'enable', key: 'enable', width: 100, align: 'center' as const },
  { title: '持续时间', dataIndex: 'for_time', key: 'for_time', width: 100 },
  { title: '创建人', dataIndex: 'create_user_name', key: 'creator', width: 120 },
  { title: '创建时间', dataIndex: 'created_at', key: 'created_at', width: 180 },
  { title: '操作', key: 'action', width: 200, align: 'center' as const, fixed: 'right' }
];

// 状态数据
const loading = ref(false);
const searchText = ref('');
const data = ref<AlertRecordItem[]>([]);
const poolOptions = ref<Pool[]>([]);

// 防抖处理
let searchTimeout: any = null;

// 分页配置
const paginationConfig = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number) => `共 ${total} 条记录`,
  size: 'default' as const
});

// 统计数据
const stats = reactive({
  total: 0,
  enabled: 0,
  disabled: 0,
  pools: 0
});

// 对话框状态
const isAddModalVisible = ref(false);
const isEditModalVisible = ref(false);

// 表单引用
const addFormRef = ref<FormInstance>();
const editFormRef = ref<FormInstance>();

// 新增表单
const addForm = reactive({
  name: '',
  pool_id: 0,
  ip_address: '',
  port: '',
  enable: false,
  for_time: '15s',
  expr: '',
  labels: [],
  annotations: [],
});

// 编辑表单
const editForm = reactive({
  id: 0,
  name: '',
  pool_id: 0,
  ip_address: '',
  port: '',
  enable: true,
  for_time: '',
  expr: '',
  labels: [],
  annotations: [],
});

// 表单验证规则
const formRules = {
  name: [
    { required: true, message: '请输入记录名称', trigger: 'blur' },
    { min: 3, max: 50, message: '长度应为3到50个字符', trigger: 'blur' }
  ],
  pool_id: [
    { required: true, message: '请选择实例池', trigger: 'change' }
  ],
  ip_address: [
    { required: true, message: '请输入IP地址', trigger: 'blur' },
    { pattern: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/, message: '请输入有效的IP地址', trigger: 'blur' }
  ],
  port: [
    { required: true, message: '请输入端口号', trigger: 'blur' },
    { pattern: /^([1-9][0-9]{0,3}|[1-5][0-9]{4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2][0-9]|6553[0-5])$/, message: '请输入有效的端口号(1-65535)', trigger: 'blur' }
  ],
  enable: [
    { required: true, message: '请选择是否启用', trigger: 'change' }
  ]
};

// 辅助方法
const getRecordStatusClass = (record: AlertRecordItem): string => {
  return record.enable ? 'status-full' : 'status-none';
};

const getAvatarColor = (name: string): string => {
  const colors = ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#13c2c2', '#eb2f96', '#fa8c16'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length]!;
};

const getInitials = (name: string): string => {
  if (!name) return '';
  return name.slice(0, 2).toUpperCase();
};

const formatDate = (timestamp: number): string => {
  if (!timestamp) return '';
  return new Date(timestamp * 1000).toLocaleDateString('zh-CN');
};

const formatTime = (timestamp: number): string => {
  if (!timestamp) return '';
  return new Date(timestamp * 1000).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
};

// 更新统计数据
const updateStats = () => {
  stats.total = data.value.length;
  stats.enabled = data.value.filter(item => item.enable).length;
  stats.disabled = data.value.filter(item => !item.enable).length;
  stats.pools = new Set(data.value.map(item => item.pool_id)).size;
};

// 数据加载
const fetchRecordRules = async (): Promise<void> => {
  loading.value = true;
  try {
    const response = await getRecordRulesListApi({
      page: paginationConfig.current,
      size: paginationConfig.pageSize,
      search: searchText.value,
    });
    data.value = response.items;
    paginationConfig.total = response.total;
    updateStats();
  } catch (error: any) {
    console.error('加载记录规则列表失败:', error);
    message.error(error.message || '加载记录规则列表失败');
  } finally {
    loading.value = false;
  }
};

// 获取所有实例池数据
const fetchPools = async () => {
  try {
    const response = await getMonitorScrapePoolListApi({
      page: 1,
      size: 100,
      search: ''
    });
    poolOptions.value = response.items;
  } catch (error: any) {
    message.error(error.message || '获取实例池数据失败，请稍后重试');
    console.error(error);
  }
};

// 事件处理
const handleTableChange = (pagination: any): void => {
  paginationConfig.current = pagination.current;
  paginationConfig.pageSize = pagination.pageSize;
  fetchRecordRules();
};

const handleSearch = (): void => {
  paginationConfig.current = 1;
  fetchRecordRules();
};

const handleSearchChange = (): void => {
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }
  searchTimeout = setTimeout(() => {
    paginationConfig.current = 1;
    fetchRecordRules();
  }, 500);
};

const handleReset = (): void => {
  searchText.value = '';
  paginationConfig.current = 1;
  fetchRecordRules();
  message.success('过滤条件已重置');
};

// 模态框操作
const showAddModal = (): void => {
  resetAddForm();
  isAddModalVisible.value = true;
};

const closeAddModal = (): void => {
  isAddModalVisible.value = false;
};

const showEditModal = (record: AlertRecordItem): void => {
  Object.assign(editForm, {
    id: record.id,
    name: record.name,
    pool_id: record.pool_id,
    ip_address: record.ip_address,
    port: record.port,
    enable: record.enable,
    for_time: record.for_time,
    expr: record.expr,
    labels: record.labels,
    annotations: record.annotations,
  });
  isEditModalVisible.value = true;
};

const closeEditModal = (): void => {
  isEditModalVisible.value = false;
};

// 重置新增表单
const resetAddForm = (): void => {
  addForm.name = '';
  addForm.pool_id = 0;
  addForm.ip_address = '';
  addForm.port = '';
  addForm.enable = false;
  addForm.for_time = '15s';
  addForm.expr = '';
  addForm.labels = [];
  addForm.annotations = [];
};

// 提交新增记录
const handleAdd = async (): Promise<void> => {
  try {
    await addFormRef.value?.validate();

    const payload = {
      name: addForm.name,
      pool_id: addForm.pool_id,
      ip_address: addForm.ip_address,
      port: addForm.port,
      enable: addForm.enable,
      for_time: addForm.for_time,
      expr: addForm.expr,
      labels: addForm.labels,
      annotations: addForm.annotations,
    };

    await createRecordRuleApi(payload);
    message.success('新增记录成功');
    fetchRecordRules();
    closeAddModal();
  } catch (error: any) {
    console.error('新增记录失败:', error);
    message.error(error.message || '新增记录失败');
  }
};

// 提交更新记录
const handleUpdate = async (): Promise<void> => {
  try {
    await editFormRef.value?.validate();

    const payload = {
      id: editForm.id,
      name: editForm.name,
      pool_id: editForm.pool_id,
      ip_address: editForm.ip_address,
      port: editForm.port,
      enable: editForm.enable,
      for_time: editForm.for_time,
      expr: editForm.expr,
      labels: editForm.labels,
      annotations: editForm.annotations,
    };

    await updateRecordRuleApi(payload);
    message.success('更新记录规则成功');
    fetchRecordRules();
    closeEditModal();
  } catch (error: any) {
    console.error('更新记录规则失败:', error);
    message.error(error.message || '更新记录规则失败');
  }
};

// 处理删除记录规则
const handleDelete = (record: AlertRecordItem) => {
  Modal.confirm({
    title: '确认删除',
    content: `您确定要删除记录规则 "${record.name}" 吗？`,
    okText: '确认',
    cancelText: '取消',
    onOk: async () => {
      try {
        await deleteRecordRuleApi(record.id);
        message.success('记录规则已删除');
        fetchRecordRules();
      } catch (error: any) {
        console.error('删除记录规则失败:', error);
        message.error(error.message || '删除记录规则失败');
      }
    },
  });
};

// 表达式验证（新增）
const validateAddExpression = async () => {
  try {
    if (!addForm.expr) {
      message.error('表达式不能为空');
      return;
    }
    const payload = { promql_expr: addForm.expr };
    await validateExprApi(payload);
    message.success('表达式验证成功');
  } catch (error: any) {
    message.error(error.message || '表达式验证失败，请稍后重试');
    console.error(error);
  }
};

// 表达式验证（编辑）
const validateEditExpression = async () => {
  try {
    if (!editForm.expr) {
      message.error('表达式不能为空');
      return;
    }
    const payload = { promql_expr: editForm.expr };
    await validateExprApi(payload);
    message.success('表达式验证成功');
  } catch (error: any) {
    message.error(error.message || '表达式验证失败，请稍后重试');
    console.error(error);
  }
};

// 生命周期钩子
onMounted(() => {
  fetchRecordRules();
  fetchPools();
});
</script>

<style scoped>
.scrape-pool-container {
  padding: 12px;
  min-height: 100vh;
}

.page-header {
  margin-bottom: 20px;
}

.header-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}

.btn-create {
  background: linear-gradient(135deg, #1890ff 0%);
  border: none;
  flex-shrink: 0;
}

.search-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.search-input {
  width: 250px;
  min-width: 200px;
}

.reset-btn {
  flex-shrink: 0;
}

.stats-row {
  margin-bottom: 20px;
}

.stats-card {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  height: 100%;
}

.table-container {
  margin-bottom: 24px;
}

.pool-name-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.pool-badge {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-full {
  background-color: #52c41a;
}

.status-none {
  background-color: #d9d9d9;
}

.pool-name-text {
  font-weight: 500;
  word-break: break-all;
}

.tech-tag {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  border: none;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}

.status-enabled {
  background-color: #f6ffed;
  color: #389e0d;
  border-left: 3px solid #52c41a;
}

.status-disabled {
  background-color: #fff2f0;
  color: #cf1322;
  border-left: 3px solid #ff4d4f;
}

.creator-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.creator-name {
  font-size: 14px;
  word-break: break-all;
}

.date-info {
  display: flex;
  flex-direction: column;
}

.date {
  font-weight: 500;
  font-size: 14px;
}

.time {
  font-size: 12px;
  color: #8c8c8c;
}

.action-buttons {
  display: flex;
  gap: 4px;
  justify-content: center;
  flex-wrap: wrap;
}

/* 表单样式 */
.form-section {
  margin-bottom: 28px;
  padding: 0;
  position: relative;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 16px;
  padding-left: 12px;
  border-left: 4px solid #1890ff;
}

.full-width {
  width: 100%;
}

.validate-button {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #52c41a;
  border: none;
  box-shadow: 0 2px 6px rgba(82, 196, 26, 0.4);
  transition: all 0.3s;
}

.validate-button:hover {
  background: #389e0d;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(82, 196, 26, 0.5);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .scrape-pool-container {
    padding: 8px;
  }

  .header-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .search-filters {
    width: 100%;
  }

  .search-input {
    width: 100%;
    min-width: auto;
  }

  .btn-text {
    display: none;
  }

  .btn-create {
    padding: 4px 8px;
    min-width: auto;
  }

  .stats-card :deep(.ant-statistic-title) {
    font-size: 12px;
  }

  .stats-card :deep(.ant-statistic-content) {
    font-size: 16px;
  }

  .action-buttons {
    gap: 2px;
  }

  .action-buttons .ant-btn {
    padding: 0 4px;
    font-size: 12px;
  }

  .creator-info {
    flex-direction: column;
    gap: 4px;
    align-items: center;
  }

  .creator-name {
    font-size: 12px;
  }

  .date-info {
    text-align: center;
  }

  .date {
    font-size: 12px;
  }

  .time {
    font-size: 10px;
  }
}

@media (max-width: 480px) {
  .header-actions {
    gap: 8px;
  }

  .stats-card {
    text-align: center;
  }
}

/* 表格滚动优化 */
.table-container :deep(.ant-table-wrapper) {
  overflow: auto;
}

.table-container :deep(.ant-table-thead > tr > th) {
  white-space: nowrap;
}

.table-container :deep(.ant-table-tbody > tr > td) {
  word-break: break-word;
}

/* 对话框响应式优化 */
.responsive-modal :deep(.ant-modal) {
  max-width: calc(100vw - 16px);
  margin: 8px;
}

@media (max-width: 768px) {
  .responsive-modal :deep(.ant-modal-body) {
    padding: 16px;
    max-height: calc(100vh - 160px);
    overflow-y: auto;
  }
}
</style>
