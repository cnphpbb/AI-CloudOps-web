<template>
  <div class="template-management-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="title-section">
          <div class="page-title">
            <FileTextOutlined class="title-icon" />
            <h1>模板管理</h1>
          </div>
          <p class="page-subtitle">管理和维护您的 Kubernetes YAML 部署模板</p>
        </div>
        <div class="header-actions">
          <a-button type="primary" size="large" @click="showCreateModal" :disabled="!selectedCluster">
            <template #icon><PlusOutlined /></template>
            创建模板
          </a-button>
        </div>
      </div>
    </div>

    <!-- 数据概览卡片 -->
    <div class="overview-cards">
      <div class="overview-card total-templates">
        <div class="card-icon">
          <FileTextOutlined />
        </div>
        <div class="card-info">
          <div class="card-number">{{ templates.length }}</div>
          <div class="card-label">模板总数</div>
        </div>
      </div>
      
      <div class="overview-card total-clusters">
        <div class="card-icon">
          <ClusterOutlined />
        </div>
        <div class="card-info">
          <div class="card-number">{{ clusters.length }}</div>
          <div class="card-label">可用集群</div>
        </div>
      </div>
      
      <div class="overview-card selected-cluster">
        <div class="card-icon">
          <CloudServerOutlined />
        </div>
        <div class="card-info">
          <div class="card-number">{{ selectedClusterName || '未选择' }}</div>
          <div class="card-label">当前集群</div>
        </div>
      </div>
      
      <div class="overview-card last-update">
        <div class="card-icon">
          <ClockCircleOutlined />
        </div>
        <div class="card-info">
          <div class="card-number">{{ lastUpdateTime || '-' }}</div>
          <div class="card-label">最近更新</div>
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
        
        <a-input-search
          v-model:value="searchText"
          placeholder="搜索模板名称"
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
        
        <a-button @click="getTemplates" :loading="loading" :disabled="!selectedCluster">
          <template #icon><ReloadOutlined /></template>
        </a-button>
        
        <a-button type="primary" @click="showCreateModal" :disabled="!selectedCluster">
          <template #icon><PlusOutlined /></template>
          创建模板
        </a-button>
      </div>
    </div>

    <!-- 提示信息 -->
    <a-alert 
      v-if="!selectedCluster" 
      message="请先选择一个集群来管理模板" 
      type="info" 
      show-icon 
      class="cluster-alert"
    />

    <!-- 数据展示区域 -->
    <div class="data-display" v-if="selectedCluster">
      <div class="display-header" v-if="filteredTemplates.length > 0">
        <div class="result-info">
          <span class="result-count">共 {{ filteredTemplates.length }} 个模板</span>
          <div class="env-tags">
            <a-tag color="blue">
              {{ selectedClusterName }}
            </a-tag>
          </div>
        </div>
      </div>

      <!-- 表格视图 -->
      <a-table
        v-if="viewMode === 'table'"
        :columns="columns"
        :data-source="filteredTemplates"
        :loading="loading"
        row-key="id"
        :pagination="{
          pageSize: 12, 
          showSizeChanger: true, 
          showQuickJumper: true,
          showTotal: (total: number) => `共 ${total} 条模板`,
          pageSizeOptions: ['12', '24', '48', '96']
        }"
        class="template-table"
      >
        <!-- 模板名称列 -->
        <template #name="{ text }">
          <div class="template-name">
            <FileTextOutlined />
            <span>{{ text }}</span>
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
            <a-tooltip title="检查YAML格式">
              <a-button type="primary" ghost shape="circle" @click="handleCheck(record)">
                <template #icon><CheckOutlined /></template>
              </a-button>
            </a-tooltip>
            
            <a-tooltip title="编辑模板">
              <a-button type="primary" ghost shape="circle" @click="handleEdit(record)">
                <template #icon><EditOutlined /></template>
              </a-button>
            </a-tooltip>
            
            <a-tooltip title="删除模板">
              <a-popconfirm
                title="确定要删除该模板吗?"
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
            <FileTextOutlined style="font-size: 48px; color: #d9d9d9; margin-bottom: 16px" />
            <p>当前集群暂无模板数据</p>
            <a-button type="primary" @click="showCreateModal">创建第一个模板</a-button>
          </div>
        </template>
      </a-table>

      <!-- 卡片视图 -->
      <div v-else class="card-view">
        <a-spin :spinning="loading">
          <a-empty v-if="filteredTemplates.length === 0" description="暂无模板数据">
            <template #image>
              <FileTextOutlined style="font-size: 64px; color: #d9d9d9;" />
            </template>
            <template #description>
              <span style="color: #999;">暂无模板数据</span>
            </template>
            <a-button type="primary" @click="showCreateModal">创建第一个模板</a-button>
          </a-empty>
          <div v-else class="template-cards">
            <div v-for="template in filteredTemplates" :key="template.id" class="template-card">
              <div class="card-header">
                <div class="service-title template-title">
                  <FileTextOutlined class="service-icon" />
                  <h3>{{ template.name }}</h3>
                </div>
                <a-tag color="green" class="card-type-tag">
                  <span class="status-dot"></span>
                  模板
                </a-tag>
              </div>
              
              <div class="card-content">
                <div class="card-detail created-at-detail">
                  <span class="detail-label">创建时间:</span>
                  <span class="detail-value">
                    <ClockCircleOutlined />
                    {{ formatDate(template.created_at) }}
                  </span>
                </div>
                <div class="card-detail updated-at-detail">
                  <span class="detail-label">更新时间:</span>
                  <span class="detail-value">
                    <ClockCircleOutlined />
                    {{ formatDate(template.updated_at) }}
                  </span>
                </div>
                <div class="card-detail cluster-detail">
                  <span class="detail-label">所属集群:</span>
                  <span class="detail-value">
                    <CloudServerOutlined />
                    {{ selectedClusterName }}
                  </span>
                </div>
              </div>
              
              <div class="card-footer card-action-footer">
                <a-button type="primary" ghost size="small" @click="handleCheck(template)">
                  <template #icon><CheckOutlined /></template>
                  检查
                </a-button>
                <a-button type="primary" ghost size="small" @click="handleEdit(template)">
                  <template #icon><EditOutlined /></template>
                  编辑
                </a-button>
                <a-popconfirm
                  title="确定要删除该模板吗?"
                  @confirm="handleDelete(template)"
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

    <!-- 创建/编辑模板模态框 -->
    <a-modal
      v-model:open="modalVisible"
      :title="isEdit ? '编辑模板' : '创建模板'"
      @ok="handleSubmit"
      :width="800"
      :okText="isEdit ? '保存更改' : '创建模板'"
      :maskClosable="false"
      class="template-modal"
    >
      <a-alert v-if="selectedCluster" class="modal-alert" type="info" show-icon>
        <template #message>
          <span>{{ selectedClusterName }} 集群模板</span>
        </template>
        <template #description>
          <div>{{ isEdit ? '编辑现有模板' : '创建新模板' }}</div>
        </template>
      </a-alert>
      
      <a-form 
        :model="formState" 
        :rules="rules" 
        ref="formRef"
        layout="vertical"
        class="template-form"
      >
        <a-form-item label="模板名称" name="name">
          <a-input 
            v-model:value="formState.name" 
            placeholder="请输入模板名称" 
            class="form-input"
          >
            <template #prefix>
              <FileOutlined />
            </template>
          </a-input>
        </a-form-item>
        
        <a-form-item label="YAML内容" name="content">
          <div class="yaml-actions">
            <a-button type="primary" size="small" @click="formatYaml" :loading="formatting">
              <template #icon><AlignLeftOutlined /></template>
              格式化
            </a-button>
            <a-button size="small" @click="expandEditor = !expandEditor">
              <template #icon>
                <ExpandOutlined v-if="!expandEditor" />
                <CompressOutlined v-else />
              </template>
              {{ expandEditor ? '收起' : '展开' }}
            </a-button>
          </div>
          <a-textarea
            v-model:value="formState.content"
            placeholder="# 请输入标准YAML格式内容"
            :rows="10"
            :auto-size="{ minRows: expandEditor ? 20 : 10, maxRows: expandEditor ? 30 : 15 }"
            class="yaml-editor"
            spellcheck="false"
          />
          <div class="yaml-tips" :class="{ 'error-tips': formatErrorMsg }">
            <InfoCircleOutlined />
            <span>{{ formatErrorMsg || '提示：点击"格式化"按钮可以美化YAML排版' }}</span>
          </div>
        </a-form-item>
      </a-form>
      <template #footer>
        <div class="modal-footer">
          <a-button @click="modalVisible = false">取消</a-button>
          <a-button type="primary" ghost @click="checkCurrentYaml" :loading="checkingYaml">
            <template #icon><CheckOutlined /></template>
            检查YAML
          </a-button>
          <a-button type="primary" @click="handleSubmit" :loading="submitting">
            {{ isEdit ? '保存更改' : '创建模板' }}
          </a-button>
        </div>
      </template>
    </a-modal>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import type { FormInstance } from 'ant-design-vue';
import {
  SearchOutlined,
  PlusOutlined,
  FileOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckOutlined,
  ReloadOutlined,
  FileTextOutlined,
  AppstoreOutlined,
  CloudServerOutlined,
  ClockCircleOutlined,
  InfoCircleOutlined,
  AlignLeftOutlined,
  ExpandOutlined,
  CompressOutlined,
  TableOutlined,
  ClusterOutlined
} from '@ant-design/icons-vue';
import {
  getYamlTemplateApi,
  createYamlTemplateApi,
  updateYamlTemplateApi,
  deleteYamlTemplateApi,
  checkYamlTemplateApi,
  getAllClustersApi,
} from '#/api';

// @ts-ignore
import yaml from 'js-yaml';

// 类型定义
interface YamlTemplate {
  id: number;
  name: string;
  content: string;
  created_at?: string;
  updated_at?: string;
}

// 状态变量
const loading = ref(false);
const templates = ref<YamlTemplate[]>([]);
const searchText = ref('');
const modalVisible = ref(false);
const isEdit = ref(false);
const formRef = ref<FormInstance>();
const clusters = ref<Array<{id: number, name: string}>>([]);
const selectedCluster = ref<number>();
const expandEditor = ref(false);
const checkingYaml = ref(false);
const submitting = ref(false);
const formatting = ref(false);
const formatErrorMsg = ref('');
const viewMode = ref<'table' | 'card'>('table');

const formState = ref<Partial<YamlTemplate>>({
  name: '',
  content: '',
});

// 表单校验规则
const rules = {
  name: [
    { required: true, message: '请输入模板名称', trigger: 'blur' },
    { min: 2, max: 50, message: '模板名称长度应为2-50个字符', trigger: 'blur' }
  ],
  content: [{ required: true, message: '请输入YAML内容', trigger: 'blur' }],
};

// 表格列配置
const columns = [
  {
    title: '模板名称',
    dataIndex: 'name',
    key: 'name',
    width: '35%',
    sorter: (a: YamlTemplate, b: YamlTemplate) => a.name.localeCompare(b.name),
    slots: { customRender: 'name' },
  },
  {
    title: '创建时间',
    dataIndex: 'created_at',
    key: 'created_at',
    width: '25%',
    sorter: (a: YamlTemplate, b: YamlTemplate) => {
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
    sorter: (a: YamlTemplate, b: YamlTemplate) => {
      if (!a.updated_at || !b.updated_at) return 0;
      return new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
    },
    slots: { customRender: 'updated_at' },
  },
  {
    title: '操作',
    key: 'action',
    width: '15%',
    fixed: 'right',
    slots: { customRender: 'action' },
  },
];

// 计算属性
const selectedClusterName = computed(() => {
  const cluster = clusters.value.find(c => c.id === selectedCluster.value);
  return cluster ? cluster.name : '';
});

// 计算属性：最近更新时间
const lastUpdateTime = computed(() => {
  if (!templates.value.length) return '-';
  
  let latestDate = new Date(0);
  templates.value.forEach(template => {
    if (template.updated_at) {
      const updateDate = new Date(template.updated_at);
      if (updateDate > latestDate) {
        latestDate = updateDate;
      }
    }
  });
  
  if (latestDate.getTime() === 0) return '-';
  
  return formatDate(latestDate.toISOString());
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

// 计算属性：过滤后的模板列表
const filteredTemplates = computed(() => {
  const searchValue = searchText.value.toLowerCase().trim();
  if (!searchValue) return templates.value;
  return templates.value.filter(template => template.name.toLowerCase().includes(searchValue));
});

// 获取集群列表
const getClusters = async () => {
  try {
    const res = await getAllClustersApi();
    clusters.value = res || [];
    // 如果有集群，默认选择第一个
    if (clusters.value.length > 0 && !selectedCluster.value) {
      const firstCluster = clusters.value[0];
      if (firstCluster?.id) {
        selectedCluster.value = firstCluster.id;
        await getTemplates();
      }
    }
  } catch (error: any) {
    message.error(error.message || '获取集群列表失败');
  }
};

// 获取模板列表
const getTemplates = async () => {
  if (!selectedCluster.value) {
    message.warning('请先选择集群');
    return;
  }

  loading.value = true;
  try {
    const res = await getYamlTemplateApi(selectedCluster.value);
    templates.value = res || [];
  } catch (error: any) {
    message.error(error.message || '获取模板列表失败');
  } finally {
    loading.value = false;
  }
};

// 搜索
const onSearch = () => {
  // 搜索逻辑已经在计算属性中实现，这里可以添加其他触发行为
};

// 切换集群
const handleClusterChange = () => {
  templates.value = [];
  getTemplates();
};

// 显示创建模态框
const showCreateModal = () => {
  isEdit.value = false;
  formState.value = {
    name: '',
    content: '',
  };
  formatErrorMsg.value = '';
  modalVisible.value = true;
};

// 显示编辑模态框
const handleEdit = (record: YamlTemplate) => {
  isEdit.value = true;
  formState.value = {
    id: record.id,
    name: record.name,
    content: record.content,
  };
  formatErrorMsg.value = '';
  modalVisible.value = true;
};

// 检查YAML
const handleCheck = async (record: YamlTemplate) => {
  if (!selectedCluster.value) return;
  
  const hide = message.loading('正在检查YAML格式...', 0);
  try {
    await checkYamlTemplateApi({
      cluster_id: selectedCluster.value,
      name: record.name,
      content: record.content,
    });
    hide();
    message.success('YAML格式检查通过');
  } catch (error: any) {
    hide();
    message.error(error.message || 'YAML格式检查失败');
  }
};

// 检查当前编辑器中的YAML
const checkCurrentYaml = async () => {
  if (!selectedCluster.value || !formState.value.content) {
    message.warning('请先输入YAML内容');
    return;
  }
  
  checkingYaml.value = true;
  try {
    await checkYamlTemplateApi({
      cluster_id: selectedCluster.value,
      name: formState.value.name || '临时检查',
      content: formState.value.content,
    });
    message.success('YAML格式检查通过');
    formatErrorMsg.value = '';
  } catch (error: any) {
    message.error(error.message || 'YAML格式检查失败');
  } finally {
    checkingYaml.value = false;
  }
};

// 格式化YAML 
const formatYaml = () => {
  if (!formState.value.content?.trim()) {
    message.warning('请先输入YAML内容再进行格式化');
    return;
  }
  
  if (!yaml) {
    message.warning('格式化功能未加载，请确保已安装js-yaml库');
    return;
  }
  
  formatting.value = true;
  formatErrorMsg.value = '';
  
  try {
    // 使用js-yaml解析YAML内容
    const parsedYaml = yaml.load(formState.value.content);
    
    // 使用js-yaml重新dump格式化后的内容，设置缩进为2
    const formattedYaml = yaml.dump(parsedYaml, {
      indent: 2,
      lineWidth: -1,  // 不限制行宽
      noRefs: true,   // 不使用引用标记
      noCompatMode: true,  // 使用最新的YAML规范
    });
    
    // 更新文本框内容
    formState.value.content = formattedYaml;
    message.success('YAML格式化成功');
  } catch (error: any) {
    // 如果解析出错，显示错误信息
    message.error('YAML格式化失败，请检查语法');
    formatErrorMsg.value = `格式化错误: ${error.message}`;
    console.error('YAML格式化错误:', error);
  } finally {
    formatting.value = false;
  }
};

// 提交表单
const handleSubmit = async () => {
  if (!selectedCluster.value) return;

  try {
    await formRef.value?.validate();
    submitting.value = true;
    
    const hide = message.loading(isEdit.value ? '正在更新模板...' : '正在创建模板...', 0);
    
    if (isEdit.value) {
      await updateYamlTemplateApi({
        cluster_id: selectedCluster.value,
        id: formState.value.id,
        name: formState.value.name,
        content: formState.value.content,
      });
      hide();
      message.success('模板更新成功');
    } else {
      await createYamlTemplateApi({
        cluster_id: selectedCluster.value,
        name: formState.value.name,
        content: formState.value.content,
      });
      hide();
      message.success('模板创建成功');
    }
    
    modalVisible.value = false;
    getTemplates();
  } catch (error: any) {
    message.error(error.message || (isEdit.value ? '更新模板失败' : '创建模板失败'));
  } finally {
    submitting.value = false;
  }
};

// 删除模板
const handleDelete = async (template: YamlTemplate) => {
  if (!selectedCluster.value) {
    message.error('请选择集群');
    return;
  }

  const hide = message.loading('正在删除模板...', 0);
  try {
    await deleteYamlTemplateApi(template.id, selectedCluster.value);
    hide();
    message.success('删除成功');
    getTemplates();
  } catch (error: any) {
    hide();
    message.error(error.message || '删除失败');
  }
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
.template-management-container {
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

.total-templates .card-icon {
  background: rgba(22, 119, 255, 0.1);
  color: var(--primary-color);
}

.total-clusters .card-icon {
  background: rgba(82, 196, 26, 0.1);
  color: var(--success-color);
}

.selected-cluster .card-icon {
  background: rgba(250, 173, 20, 0.1);
  color: var(--warning-color);
}

.last-update .card-icon {
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

.cluster-selector {
  width: 200px;
}

.cluster-selector :deep(.ant-select-selector) {
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

.cluster-option {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 提示信息 */
.cluster-alert {
  border-radius: var(--border-radius-sm);
  margin-bottom: 24px;
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
.template-table {
  border: none;
}

.template-table :deep(.ant-table-container) {
  border-radius: 0;
}

.template-table :deep(.ant-table-thead > tr > th) {
  background: #fafafa;
  font-weight: 600;
  padding: 16px 16px;
  border-bottom: 1px solid var(--border-color-split);
  color: var(--text-primary);
  font-size: var(--font-size-base);
}

.template-table :deep(.ant-table-tbody > tr) {
  transition: background-color var(--transition-duration) var(--transition-function);
}

.template-table :deep(.ant-table-tbody > tr:hover) {
  background-color: #fafafa;
}

.template-table :deep(.ant-table-tbody > tr > td) {
  padding: 16px;
  border-bottom: 1px solid var(--border-color-split);
  vertical-align: middle;
  font-size: var(--font-size-base);
}

.template-name {
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 500;
}

.template-name span {
  color: var(--text-primary);
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

.template-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 24px;
}

.template-card {
  background: var(--component-background);
  border-radius: var(--border-radius-base);
  box-shadow: var(--shadow-1);
  transition: all var(--transition-duration) var(--transition-function);
  overflow: hidden;
  border: 1px solid var(--border-color-split);
  position: relative;
}

.template-card:hover {
  box-shadow: var(--shadow-2);
  transform: translateY(-4px);
}

.card-header {
  padding: 24px 24px 16px;
  background: var(--component-background);
  position: relative;
}

.template-title {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-right: 60px;
}

.template-title h3 {
  margin: 0;
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.3;
  word-break: break-all;
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
.template-modal :deep(.ant-modal-content) {
  border-radius: var(--border-radius-base);
  overflow: hidden;
  box-shadow: var(--shadow-3);
}

.template-modal :deep(.ant-modal-header) {
  background: var(--component-background);
  border-bottom: 1px solid var(--border-color-split);
  padding: 20px 24px;
}

.template-modal :deep(.ant-modal-title) {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--text-primary);
}

.modal-alert {
  margin-bottom: 20px;
  border-radius: var(--border-radius-sm);
}

.template-form {
  padding: 8px 0;
}

.form-input {
  border-radius: var(--border-radius-sm);
  transition: all var(--transition-duration) var(--transition-function);
  font-size: var(--font-size-base);
  height: 40px;
}

.form-input:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(22, 119, 255, 0.1);
}

.yaml-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-bottom: 10px;
}

.yaml-editor {
  font-family: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.5;
  border-radius: var(--border-radius-sm);
  background-color: #f9f9f9;
  padding: 12px;
  transition: all var(--transition-duration) var(--transition-function);
  tab-size: 2;
}

.yaml-editor:hover {
  background-color: #f5f5f5;
}

.yaml-editor:focus {
  background-color: #f0f0f0;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(22, 119, 255, 0.1);
}

.yaml-tips {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  color: var(--text-tertiary);
  font-size: 13px;
}

.error-tips {
  color: var(--error-color);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
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
  
  .template-cards {
    grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  }
}

@media (max-width: 1024px) {
  .template-management-container {
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
  
  .cluster-selector, .search-input {
    width: 100%;
  }
  
  .toolbar-right {
    justify-content: space-between;
  }
}

@media (max-width: 768px) {
  .template-management-container {
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
  
  .template-cards {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .template-card {
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
  
  .template-table :deep(.ant-table-tbody > tr > td) {
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
