<template>
  <div class="yaml-task-management-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="title-section">
          <div class="page-title">
            <FileProtectOutlined class="title-icon" />
            <h1>YAML 任务管理</h1>
          </div>
          <p class="page-subtitle">管理和执行您的 Kubernetes YAML 部署任务</p>
        </div>
        <div class="header-actions">
          <a-button type="primary" size="large" @click="showCreateModal">
            <template #icon><PlusOutlined /></template>
            新建任务
          </a-button>
        </div>
      </div>
    </div>

    <!-- 数据概览卡片 -->
    <div class="overview-cards">
      <div class="overview-card total-tasks">
        <div class="card-icon">
          <FileProtectOutlined />
        </div>
        <div class="card-info">
          <div class="card-number">{{ tasks.length }}</div>
          <div class="card-label">任务总数</div>
        </div>
      </div>
      
      <div class="overview-card total-templates">
        <div class="card-icon">
          <FileOutlined />
        </div>
        <div class="card-info">
          <div class="card-number">{{ templates.length }}</div>
          <div class="card-label">可用模板</div>
        </div>
      </div>
      
      <div class="overview-card total-clusters">
        <div class="card-icon">
          <CloudServerOutlined />
        </div>
        <div class="card-info">
          <div class="card-number">{{ clusters.length }}</div>
          <div class="card-label">集群连接</div>
        </div>
      </div>
      
      <div class="overview-card recent-activity">
        <div class="card-icon">
          <ClockCircleOutlined />
        </div>
        <div class="card-info">
          <div class="card-number">{{ recentTasksCount }}</div>
          <div class="card-label">近期任务</div>
        </div>
      </div>
    </div>

    <!-- 操作工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <a-input-search
          v-model:value="searchText"
          placeholder="搜索任务名称"
          class="search-input"
          @search="onSearch"
          allow-clear
        />
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
        
        <a-button @click="getTasks" :loading="loading">
          <template #icon><ReloadOutlined /></template>
        </a-button>
        
        <a-button type="primary" @click="showCreateModal">
          <template #icon><PlusOutlined /></template>
          新建任务
        </a-button>
      </div>
    </div>

    <!-- 数据展示区域 -->
    <div class="data-display">
      <div class="display-header" v-if="filteredTasks.length > 0">
        <div class="result-info">
          <span class="result-count">共 {{ filteredTasks.length }} 个任务</span>
        </div>
      </div>

      <!-- 表格视图 -->
      <a-table
        v-if="viewMode === 'table'"
        :columns="columns"
        :data-source="filteredTasks"
        :loading="loading"
        row-key="id"
        :pagination="{ 
          pageSize: 12, 
          showSizeChanger: true, 
          showQuickJumper: true,
          showTotal: (total: number) => `共 ${total} 条数据`,
          pageSizeOptions: ['12', '24', '48', '96']
        }"
        class="yaml-task-table"
      >
        <!-- 任务名称列 -->
        <template #name="{ text }">
          <div class="task-name">
            <FileProtectOutlined />
            <span class="task-title">{{ text }}</span>
          </div>
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

        <!-- 更新时间列 -->
        <template #updated_at="{ text }">
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
            <a-tooltip title="应用任务">
              <a-button type="primary" ghost shape="circle" @click="handleApply(record)">
                <template #icon><PlayCircleOutlined /></template>
              </a-button>
            </a-tooltip>
            
            <a-tooltip title="编辑任务">
              <a-button type="primary" ghost shape="circle" @click="handleEdit(record)">
                <template #icon><EditOutlined /></template>
              </a-button>
            </a-tooltip>
            
            <a-tooltip title="删除任务">
              <a-popconfirm
                title="确定要删除该任务吗?"
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
            <FileProtectOutlined style="font-size: 48px; color: #d9d9d9; margin-bottom: 16px" />
            <p>暂无任务数据</p>
            <a-button type="primary" @click="showCreateModal">创建第一个任务</a-button>
          </div>
        </template>
      </a-table>

      <!-- 卡片视图 -->
      <div v-else class="card-view">
        <a-spin :spinning="loading">
          <a-empty v-if="filteredTasks.length === 0" description="暂无任务数据">
            <template #image>
              <FileProtectOutlined style="font-size: 64px; color: #d9d9d9;" />
            </template>
            <template #description>
              <span style="color: #999;">暂无任务数据</span>
            </template>
            <a-button type="primary" @click="showCreateModal">创建第一个任务</a-button>
          </a-empty>
          <div v-else class="yaml-task-cards">
            <div v-for="task in filteredTasks" :key="task.id" class="yaml-task-card">
              <div class="card-header">
                <div class="service-title task-title">
                  <FileProtectOutlined class="service-icon" />
                  <h3>{{ task.name }}</h3>
                </div>
                <a-tag color="blue" class="card-type-tag">
                  <span class="status-dot"></span>
                  YAML任务
                </a-tag>
              </div>
              
              <div class="card-content">
                <div class="card-detail template-detail">
                  <span class="detail-label">模板:</span>
                  <span class="detail-value">
                    <FileOutlined />
                    {{ getTemplateName(task.template_id) }}
                  </span>
                </div>
                <div class="card-detail cluster-detail">
                  <span class="detail-label">集群:</span>
                  <span class="detail-value">
                    <CloudServerOutlined />
                    {{ getClusterName(task.cluster_id) }}
                  </span>
                </div>
                <div class="card-detail variables-detail">
                  <span class="detail-label">变量:</span>
                  <span class="detail-value">
                    <CodeOutlined />
                    {{ task.variables?.length || 0 }} 个
                  </span>
                </div>
                <div class="card-detail created-detail">
                  <span class="detail-label">创建时间:</span>
                  <span class="detail-value">
                    <ClockCircleOutlined />
                    {{ formatDate(task.created_at) }}
                  </span>
                </div>
              </div>
              
              <div class="card-footer card-action-footer">
                <a-button type="primary" ghost size="small" @click="handleApply(task)">
                  <template #icon><PlayCircleOutlined /></template>
                  应用
                </a-button>
                <a-button type="primary" ghost size="small" @click="handleEdit(task)">
                  <template #icon><EditOutlined /></template>
                  编辑
                </a-button>
                <a-popconfirm
                  title="确定要删除该任务吗?"
                  @confirm="handleDelete(task)"
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
          </div>
        </a-spin>
      </div>
    </div>

    <!-- 创建/编辑任务模态框 -->
    <a-modal
      v-model:open="modalVisible"
      :title="isEdit ? '编辑任务' : '创建任务'"
      @ok="handleSubmit"
      @cancel="closeModal"
      :width="900"
      :okText="isEdit ? '保存更改' : '创建任务'"
      :confirmLoading="submitLoading"
      class="yaml-task-modal"
    >
      <a-alert type="info" show-icon class="modal-alert">
        <template #message>{{ isEdit ? '编辑YAML任务' : '创建YAML任务' }}</template>
        <template #description>{{ isEdit ? '修改任务配置和变量信息' : '请配置任务的基本信息和部署参数' }}</template>
      </a-alert>
      
      <a-form :model="formState" layout="vertical" class="yaml-task-form" ref="formRef">
        <div class="form-section">
          <div class="section-title">基本信息</div>
          <a-form-item label="任务名称" name="name" :rules="rules.name">
            <a-input v-model:value="formState.name" placeholder="请输入任务名称" class="form-input">
              <template #prefix><FileProtectOutlined /></template>
            </a-input>
          </a-form-item>
        </div>
        
        <div class="form-section">
          <div class="section-title">配置选择</div>
          <a-row :gutter="16">
            <a-col :span="12">
              <a-form-item label="选择模板" name="template_id" :rules="rules.template_id">
                <a-select
                  v-model:value="formState.template_id"
                  placeholder="请选择模板"
                  class="form-select"
                >
                  <template #suffixIcon><FileOutlined /></template>
                  <a-select-option v-for="template in templates" :key="template.id" :value="template.id">
                    {{ template.name }}
                  </a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item label="选择集群" name="cluster_id" :rules="rules.cluster_id">
                <a-select
                  v-model:value="formState.cluster_id"
                  placeholder="请选择集群"
                  class="form-select"
                >
                  <template #suffixIcon><CloudServerOutlined /></template>
                  <a-select-option v-for="cluster in clusters" :key="cluster.id" :value="cluster.id">
                    {{ cluster.name }}
                  </a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
          </a-row>
        </div>
        
        <div class="form-section">
          <div class="section-header">
            <div class="section-title">变量配置</div>
            <a-button type="primary" ghost @click="addVariable" class="add-variable-btn">
              <PlusOutlined />
              添加变量
            </a-button>
          </div>
          
          <div class="variables-area">
            <a-empty v-if="!formState.variables?.length" class="variables-empty">
              <template #image>
                <CodeOutlined style="font-size: 48px; color: #d9d9d9;" />
              </template>
              <template #description>
                <span>暂无变量，点击上方按钮添加变量</span>
              </template>
            </a-empty>
            
            <div v-else class="variables-list">
              <div v-for="(variable, index) in formState.variables" :key="index" class="variable-row">
                <div class="variable-number">{{ index + 1 }}</div>
                <a-input
                  v-model:value="formState.variables[index]"
                  placeholder="key=value"
                  class="variable-input"
                >
                  <template #prefix>
                    <CodeOutlined />
                  </template>
                </a-input>
                <a-button 
                  type="text" 
                  danger 
                  @click="removeVariable(index)" 
                  class="remove-variable-btn"
                >
                  <DeleteOutlined />
                </a-button>
              </div>
            </div>
          </div>
        </div>
      </a-form>
    </a-modal>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import type { FormInstance } from 'ant-design-vue';
import {
  SearchOutlined,
  PlusOutlined,
  FileOutlined,
  FileProtectOutlined,
  EditOutlined,
  DeleteOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
  AppstoreOutlined,
  CloudServerOutlined,
  CodeOutlined,
  ClockCircleOutlined,
  UnorderedListOutlined
} from '@ant-design/icons-vue';
import {
  getYamlTaskListApi,
  createYamlTaskApi,
  updateYamlTaskApi,
  deleteYamlTaskApi,
  applyYamlTaskApi,
  getAllClustersApi,
  getYamlTemplateApi,
} from '#/api';

// 类型定义
interface YamlTask {
  id: number;
  name: string;
  template_id: number;
  cluster_id: number;
  variables: string[];
  created_at?: string;
  updated_at?: string;
}

interface ClusterItem {
  id: number;
  name: string;
}

interface TemplateItem {
  id: number;
  name: string;
}

// 状态变量
const loading = ref(false);
const submitLoading = ref(false);
const tasks = ref<YamlTask[]>([]);
const searchText = ref('');
const modalVisible = ref(false);
const isEdit = ref(false);
const formRef = ref<FormInstance>();
const clusters = ref<ClusterItem[]>([]);
const templates = ref<TemplateItem[]>([]);
const viewMode = ref<'table' | 'card'>('table');

// 计算属性：近期任务数量（7天内）
const recentTasksCount = computed(() => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  return tasks.value.filter(task => {
    if (!task.created_at) return false;
    return new Date(task.created_at) > sevenDaysAgo;
  }).length;
});

// 表单状态
const formState = reactive<Partial<YamlTask>>({
  name: '',
  template_id: undefined,
  cluster_id: undefined,
  variables: [],
});

// 表单校验规则
const rules = {
  name: [
    { required: true, message: '请输入任务名称', trigger: 'blur' },
    { min: 2, max: 50, message: '任务名称长度应为2-50个字符', trigger: 'blur' }
  ],
  template_id: [{ required: true, message: '请选择模板', trigger: 'change' }],
  cluster_id: [{ required: true, message: '请选择集群', trigger: 'change' }],
};

// 表格列配置
const columns = [
  {
    title: '任务名称',
    dataIndex: 'name',
    key: 'name',
    width: '30%',
    sorter: (a: YamlTask, b: YamlTask) => a.name.localeCompare(b.name),
    slots: { customRender: 'name' },
  },
  {
    title: '创建时间',
    dataIndex: 'created_at',
    key: 'created_at',
    width: '25%',
    sorter: (a: YamlTask, b: YamlTask) => {
      if (!a.created_at || !b.created_at) return 0;
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    },
    slots: { customRender: 'created_at' },
  },
  {
    title: '更新时间',
    dataIndex: 'updated_at',
    key: 'updated_at',
    width: '25%',
    sorter: (a: YamlTask, b: YamlTask) => {
      if (!a.updated_at || !b.updated_at) return 0;
      return new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
    },
    slots: { customRender: 'updated_at' },
  },
  {
    title: '操作',
    key: 'action',
    width: '20%',
    fixed: 'right',
    slots: { customRender: 'action' },
  },
];

// 计算属性：过滤后的任务列表
const filteredTasks = computed(() => {
  const searchValue = searchText.value.toLowerCase().trim();
  if (!searchValue) return tasks.value;
  return tasks.value.filter(task => task.name.toLowerCase().includes(searchValue));
});

// 日期格式化函数
const formatDate = (dateString?: string): string => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return `${date.getMonth() + 1}月${date.getDate()}日 ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

const formatDateTime = (dateString?: string): string => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
};

// 根据ID获取模板名称
const getTemplateName = (id?: number): string => {
  if (!id) return '-';
  const template = templates.value.find(t => t.id === id);
  return template ? template.name : '-';
};

// 根据ID获取集群名称
const getClusterName = (id?: number): string => {
  if (!id) return '-';
  const cluster = clusters.value.find(c => c.id === id);
  return cluster ? cluster.name : '-';
};

// 搜索处理
const onSearch = () => {
  // 搜索逻辑已在计算属性中实现
};

// 获取集群列表
const getClusters = async () => {
  try {
    const res = await getAllClustersApi();
    clusters.value = res || [];
  } catch (error: any) {
    message.error(error.message || '获取集群列表失败');
  }
};

// 获取模板列表
const getTemplates = async () => {
  try {
    const firstCluster = clusters.value[0];
    if (firstCluster) {
      const res = await getYamlTemplateApi(firstCluster.id);
      templates.value = res || [];
    }
  } catch (error: any) {
    message.error(error.message || '获取模板列表失败');
  }
};

// 获取任务列表
const getTasks = async () => {
  loading.value = true;
  try {
    const res = await getYamlTaskListApi();
    tasks.value = res || [];
  } catch (error: any) {
    message.error(error.message || '获取任务列表失败');
  } finally {
    loading.value = false;
  }
};

// 显示创建模态框
const showCreateModal = () => {
  isEdit.value = false;
  Object.assign(formState, {
    name: '',
    template_id: undefined,
    cluster_id: undefined,
    variables: [],
  });
  modalVisible.value = true;
};

// 显示编辑模态框
const handleEdit = (record: YamlTask) => {
  isEdit.value = true;
  Object.assign(formState, {
    id: record.id,
    name: record.name,
    template_id: record.template_id,
    cluster_id: record.cluster_id,
    variables: [...record.variables],
  });
  modalVisible.value = true;
};

// 添加变量
const addVariable = () => {
  if (!formState.variables) {
    formState.variables = [];
  }
  formState.variables.push('');
};

// 删除变量
const removeVariable = (index: number) => {
  formState.variables?.splice(index, 1);
};

// 应用任务
const handleApply = async (record: YamlTask) => {
  const hide = message.loading('正在应用任务...', 0);
  try {
    await applyYamlTaskApi(record.id);
    hide();
    message.success('任务应用成功');
  } catch (error: any) {
    hide();
    message.error(error.message || '任务应用失败');
  }
};

// 提交表单
const handleSubmit = async () => {
  try {
    await formRef.value?.validate();
    
    const variables = formState.variables?.filter(v => v.trim()) || [];
    submitLoading.value = true;
    
    if (isEdit.value) {
      await updateYamlTaskApi({
        id: formState.id!,
        name: formState.name!,
        template_id: formState.template_id!,
        cluster_id: formState.cluster_id!,
        variables,
      });
      message.success('任务更新成功');
    } else {
      await createYamlTaskApi({
        name: formState.name!,
        template_id: formState.template_id!,
        cluster_id: formState.cluster_id!,
        variables,
      });
      message.success('任务创建成功');
    }
    
    modalVisible.value = false;
    getTasks();
  } catch (error: any) {
    message.error(error.message || (isEdit.value ? '更新任务失败' : '创建任务失败'));
  } finally {
    submitLoading.value = false;
  }
};

// 删除任务
const handleDelete = async (task: YamlTask) => {
  const hide = message.loading('正在删除任务...', 0);
  try {
    await deleteYamlTaskApi(task.id);
    hide();
    message.success('删除成功');
    getTasks();
  } catch (error: any) {
    hide();
    message.error(error.message || '删除失败');
  }
};

// 关闭模态框
const closeModal = () => {
  modalVisible.value = false;
};

// 页面加载时获取数据
onMounted(async () => {
  await getClusters();
  await getTemplates();
  await getTasks();
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
.yaml-task-management-container {
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

.total-tasks .card-icon {
  background: rgba(22, 119, 255, 0.1);
  color: var(--primary-color);
}

.total-templates .card-icon {
  background: rgba(82, 196, 26, 0.1);
  color: var(--success-color);
}

.total-clusters .card-icon {
  background: rgba(250, 173, 20, 0.1);
  color: var(--warning-color);
}

.recent-activity .card-icon {
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

/* ==================== 表格样式 ==================== */
.yaml-task-table {
  border: none;
}

.yaml-task-table :deep(.ant-table-container) {
  border-radius: 0;
}

.yaml-task-table :deep(.ant-table-thead > tr > th) {
  background: #fafafa;
  font-weight: 600;
  padding: 16px 16px;
  border-bottom: 1px solid var(--border-color-split);
  color: var(--text-primary);
  font-size: var(--font-size-base);
}

.yaml-task-table :deep(.ant-table-tbody > tr) {
  transition: background-color var(--transition-duration) var(--transition-function);
}

.yaml-task-table :deep(.ant-table-tbody > tr:hover) {
  background-color: #fafafa;
}

.yaml-task-table :deep(.ant-table-tbody > tr > td) {
  padding: 16px;
  border-bottom: 1px solid var(--border-color-split);
  vertical-align: middle;
  font-size: var(--font-size-base);
}

.task-name {
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 500;
}

.task-title {
  color: var(--primary-color);
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

.yaml-task-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 24px;
}

.yaml-task-card {
  background: var(--component-background);
  border-radius: var(--border-radius-base);
  box-shadow: var(--shadow-1);
  transition: all var(--transition-duration) var(--transition-function);
  overflow: hidden;
  border: 1px solid var(--border-color-split);
  position: relative;
}

.yaml-task-card:hover {
  box-shadow: var(--shadow-2);
  transform: translateY(-4px);
}

.card-header {
  padding: 24px 24px 16px;
  background: var(--component-background);
  position: relative;
}

.task-title {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-right: 80px;
}

.task-title h3 {
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
  right: 16px;
  padding: 4px 8px;
  border-radius: var(--border-radius-sm);
  font-weight: 500;
  font-size: 12px;
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

.status-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: currentColor;
}

/* ==================== 模态框样式 ==================== */
.yaml-task-modal :deep(.ant-modal-content) {
  border-radius: var(--border-radius-base);
  overflow: hidden;
  box-shadow: var(--shadow-3);
}

.yaml-task-modal :deep(.ant-modal-header) {
  background: var(--component-background);
  border-bottom: 1px solid var(--border-color-split);
  padding: 20px 24px;
}

.yaml-task-modal :deep(.ant-modal-title) {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--text-primary);
}

.modal-alert {
  margin-bottom: 20px;
  border-radius: var(--border-radius-sm);
}

.yaml-task-form {
  padding: 8px 0;
}

.form-section {
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--border-color-split);
}

.form-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.section-title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-title::before {
  content: '';
  width: 4px;
  height: 20px;
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  border-radius: 2px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.form-input, .form-select {
  border-radius: var(--border-radius-sm);
  transition: all var(--transition-duration) var(--transition-function);
  font-size: var(--font-size-base);
}

.form-input {
  height: 40px;
}

.form-input:focus, .form-select:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(22, 119, 255, 0.1);
}

.add-variable-btn {
  border-radius: var(--border-radius-sm);
  height: 40px;
  font-weight: 500;
}

.variables-area {
  background: #f8fafc;
  border-radius: var(--border-radius-lg);
  padding: 20px;
}

.variables-empty {
  padding: 40px 0;
  margin: 0;
}

.variables-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.variable-row {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--component-background);
  border-radius: var(--border-radius-sm);
  padding: 12px;
  box-shadow: var(--shadow-1);
}

.variable-number {
  width: 32px;
  height: 32px;
  border-radius: var(--border-radius-sm);
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
}

.variable-input {
  flex: 1;
  height: 40px;
  border-radius: var(--border-radius-sm);
  border: 1px solid var(--border-color-split);
}

.remove-variable-btn {
  width: 32px;
  height: 32px;
  border-radius: var(--border-radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-duration) var(--transition-function);
}

.remove-variable-btn:hover {
  background: #fef2f2;
  color: var(--error-color);
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
  
  .yaml-task-cards {
    grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  }
}

@media (max-width: 1024px) {
  .yaml-task-management-container {
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
  
  .toolbar-right {
    justify-content: space-between;
  }
}

@media (max-width: 768px) {
  .yaml-task-management-container {
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
  
  .yaml-task-cards {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .yaml-task-card {
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
  
  .yaml-task-table :deep(.ant-table-tbody > tr > td) {
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
