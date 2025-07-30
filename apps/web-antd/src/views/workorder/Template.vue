<template>
  <div class="template-management-container">
    <div class="page-header">
      <div class="header-actions">
        <a-button type="primary" @click="handleCreateTemplate" class="btn-create">
          <template #icon>
            <PlusOutlined />
          </template>
          <span class="btn-text">创建新模板</span>
        </a-button>
        <div class="search-filters">
          <a-input-search v-model:value="searchQuery" placeholder="搜索模板..." class="search-input" @search="handleSearch"
            @change="handleSearchChange" allow-clear />
          <a-select v-model:value="categoryFilter" placeholder="选择分类" class="category-filter"
            @change="handleCategoryChange" allow-clear>
            <a-select-option :value="undefined">全部分类</a-select-option>
            <a-select-option v-for="category in categories" :key="category.id" :value="category.id">
              {{ category.name }}
            </a-select-option>
          </a-select>
          <a-select v-model:value="statusFilter" placeholder="状态" class="status-filter" @change="handleStatusChange"
            allow-clear>
            <a-select-option :value="undefined">全部状态</a-select-option>
            <a-select-option :value="1">启用</a-select-option>
            <a-select-option :value="0">禁用</a-select-option>
          </a-select>
          <a-select v-model:value="typeFilter" placeholder="类型" class="type-filter" @change="handleTypeChange"
            allow-clear>
            <a-select-option :value="undefined">全部类型</a-select-option>
            <a-select-option :value="1">表单模板</a-select-option>
            <a-select-option :value="2">流程模板</a-select-option>
            <a-select-option :value="3">邮件模板</a-select-option>
          </a-select>
          <a-button @click="handleResetFilters" class="reset-btn">
            重置
          </a-button>
        </div>
      </div>
    </div>

    <div class="stats-row">
      <a-row :gutter="[16, 16]">
        <a-col :xs="12" :sm="12" :md="6" :lg="6">
          <a-card class="stats-card">
            <a-statistic title="模板总数" :value="stats.total" :value-style="{ color: '#3f8600' }">
              <template #prefix>
                <FileTextOutlined />
              </template>
            </a-statistic>
          </a-card>
        </a-col>
        <a-col :xs="12" :sm="12" :md="6" :lg="6">
          <a-card class="stats-card">
            <a-statistic title="启用模板" :value="stats.enabled" :value-style="{ color: '#52c41a' }">
              <template #prefix>
                <CheckCircleOutlined />
              </template>
            </a-statistic>
          </a-card>
        </a-col>
        <a-col :xs="12" :sm="12" :md="6" :lg="6">
          <a-card class="stats-card">
            <a-statistic title="禁用模板" :value="stats.disabled" :value-style="{ color: '#faad14' }">
              <template #prefix>
                <StopOutlined />
              </template>
            </a-statistic>
          </a-card>
        </a-col>
        <a-col :xs="12" :sm="12" :md="6" :lg="6">
          <a-card class="stats-card">
            <a-statistic title="本月新增" :value="stats.thisMonth" :value-style="{ color: '#1890ff' }">
              <template #prefix>
                <PlusCircleOutlined />
              </template>
            </a-statistic>
          </a-card>
        </a-col>
      </a-row>
    </div>

    <div class="table-container">
      <a-card>
        <a-table :data-source="templates" :columns="columns" :pagination="paginationConfig" :loading="loading"
          row-key="id" bordered :scroll="{ x: 1200 }" @change="handleTableChange">
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'name'">
              <div class="template-name-cell">
                <div class="template-badge" :class="getStatusClass(record.status)"></div>
                <span class="template-name-text">{{ record.name }}</span>
                <a-tag v-if="record.icon" size="small" color="blue">
                  {{ record.icon }}
                </a-tag>
              </div>
            </template>

            <template v-if="column.key === 'category'">
              <a-tag v-if="record.category?.name" color="blue">
                {{ record.category.name }}
              </a-tag>
              <span v-else class="text-gray">未分类</span>
            </template>

            <template v-if="column.key === 'process'">
              <a-tag v-if="record.process?.name" color="geekblue">
                {{ record.process.name }}
              </a-tag>
              <span v-else class="text-gray">未关联</span>
            </template>

            <template v-if="column.key === 'description'">
              <span class="description-text">{{ record.description || '无描述' }}</span>
            </template>

            <template v-if="column.key === 'status'">
              <a-tag :color="getStatusColor(record.status)">
                {{ getStatusText(record.status) }}
              </a-tag>
            </template>

            <template v-if="column.key === 'sortOrder'">
              <a-tag color="default">{{ record.sort_order || 0 }}</a-tag>
            </template>

            <template v-if="column.key === 'creator'">
              <div class="creator-info">
                <a-avatar size="small" :style="{ backgroundColor: getAvatarColor(record.creator_name || '') }">
                  {{ getInitials(record.creator_name) }}
                </a-avatar>
                <span class="creator-name">{{ record.creator_name }}</span>
              </div>
            </template>

            <template v-if="column.key === 'createdAt'">
              <div class="date-info">
                <span class="date">{{ formatDate(record.created_at) }}</span>
                <span class="time">{{ formatTime(record.created_at) }}</span>
              </div>
            </template>

            <template v-if="column.key === 'action'">
              <div class="action-buttons">
                <a-button type="primary" size="small" @click="handleViewTemplate(record)">
                  查看
                </a-button>
                <a-button type="default" size="small" @click="handleEditTemplate(record)">
                  编辑
                </a-button>
                <a-dropdown>
                  <template #overlay>
                    <a-menu @click="(e: any) => handleMenuClick(e.key, record)">
                      <a-menu-item key="preview">
                        <EyeOutlined /> 预览
                      </a-menu-item>
                      <a-menu-divider />
                      <a-menu-item key="enable" v-if="record.status === 0">启用</a-menu-item>
                      <a-menu-item key="disable" v-if="record.status === 1">禁用</a-menu-item>
                      <a-menu-divider />
                      <a-menu-item key="delete" danger>删除</a-menu-item>
                    </a-menu>
                  </template>
                  <a-button size="small">
                    更多
                    <DownOutlined />
                  </a-button>
                </a-dropdown>
              </div>
            </template>
          </template>
        </a-table>
      </a-card>
    </div>

    <!-- 模板创建/编辑对话框 - 包含自动分页选择器 -->
    <a-modal :open="templateDialogVisible" :title="templateDialog.isEdit ? '编辑模板' : '创建模板'" :width="templateDialogWidth"
      @ok="saveTemplate" @cancel="closeTemplateDialog" :destroy-on-close="true" class="responsive-modal template-modal">
      <a-form ref="formRef" :model="templateDialog.form" :rules="templateRules" layout="vertical">
        <a-form-item label="模板名称" name="name">
          <a-input v-model:value="templateDialog.form.name" placeholder="请输入模板名称" />
        </a-form-item>

        <a-form-item label="描述" name="description">
          <a-textarea v-model:value="templateDialog.form.description" :rows="3" placeholder="请输入模板描述" />
        </a-form-item>

        <!-- 分类选择器 - 支持自动分页加载 -->
        <a-form-item label="分类" name="categoryId">
          <a-select v-model:value="templateDialog.form.categoryId" placeholder="请选择分类" style="width: 100%" show-search
            :filter-option="false" option-label-prop="children"
            :not-found-content="categorySelectorLoading ? undefined : (categorySearchKeyword ? '无搜索结果' : '无数据')"
            @search="handleCategorySearch" @dropdown-visible-change="handleCategoryDropdownChange"
            @popup-scroll="handleCategoryScroll" allow-clear :loading="categorySelectorLoading">
            <template #notFoundContent>
              <div v-if="categorySelectorLoading" class="category-loading">
                <a-spin size="small" />
                <span style="margin-left: 8px;">加载中...</span>
              </div>
              <div v-else class="category-empty">
                {{ categorySearchKeyword ? '无搜索结果' : '暂无分类数据' }}
              </div>
            </template>

            <!-- 分类选项 -->
            <a-select-option v-for="cat in templateDialogCategories" :key="cat.id" :value="cat.id">
              <div class="category-option">
                <span class="category-name">{{ cat.name }}</span>
                <span v-if="cat.description" class="category-desc">{{ cat.description }}</span>
              </div>
            </a-select-option>

            <!-- 加载更多指示器 -->
            <a-select-option v-if="categoryPagination.hasMore" :value="'__load_more__'" disabled
              class="load-more-option">
              <div class="load-more-content" @click.stop="loadMoreCategories">
                <a-button type="link" size="small" :loading="categorySelectorLoading"
                  style="padding: 0; height: auto; font-size: 12px;">
                  <template v-if="!categorySelectorLoading">
                    <DownOutlined style="margin-right: 4px;" />
                    加载更多 ({{ categoryPagination.current }}/{{ totalCategoryPages }})
                  </template>
                  <template v-else>
                    正在加载...
                  </template>
                </a-button>
              </div>
            </a-select-option>
          </a-select>
        </a-form-item>

        <!-- 流程选择器 - 支持自动分页加载 -->
        <a-form-item label="关联流程" name="processId">
          <a-select v-model:value="templateDialog.form.processId" placeholder="请选择流程" style="width: 100%" show-search
            :filter-option="false" option-label-prop="children"
            :not-found-content="processSelectorLoading ? undefined : (processSearchKeyword ? '无搜索结果' : '无数据')"
            @search="handleProcessSearch" @dropdown-visible-change="handleProcessDropdownChange"
            @popup-scroll="handleProcessScroll" allow-clear :loading="processSelectorLoading">
            <template #notFoundContent>
              <div v-if="processSelectorLoading" class="process-loading">
                <a-spin size="small" />
                <span style="margin-left: 8px;">加载中...</span>
              </div>
              <div v-else class="process-empty">
                {{ processSearchKeyword ? '无搜索结果' : '暂无流程数据' }}
              </div>
            </template>

            <!-- 流程选项 -->
            <a-select-option v-for="process in templateDialogProcesses" :key="process.id" :value="process.id">
              <div class="process-option">
                <span class="process-name">{{ process.name }}</span>
                <span v-if="process.description" class="process-desc">{{ process.description }}</span>
              </div>
            </a-select-option>

            <!-- 加载更多指示器 -->
            <a-select-option v-if="processPagination.hasMore" :value="'__load_more__'" disabled
              class="load-more-option">
              <div class="load-more-content" @click.stop="loadMoreProcesses">
                <a-button type="link" size="small" :loading="processSelectorLoading"
                  style="padding: 0; height: auto; font-size: 12px;">
                  <template v-if="!processSelectorLoading">
                    <DownOutlined style="margin-right: 4px;" />
                    加载更多 ({{ processPagination.current }}/{{ totalProcessPages }})
                  </template>
                  <template v-else>
                    正在加载...
                  </template>
                </a-button>
              </div>
            </a-select-option>
          </a-select>
        </a-form-item>

        <a-row :gutter="16">
          <a-col :xs="24" :sm="12">
            <a-form-item label="排序" name="sortOrder">
              <a-input-number v-model:value="templateDialog.form.sortOrder" :min="0" style="width: 100%"
                placeholder="排序值" />
            </a-form-item>
          </a-col>
          <a-col :xs="24" :sm="12">
            <a-form-item label="图标" name="icon">
              <a-input v-model:value="templateDialog.form.icon" placeholder="请输入图标名称" />
            </a-form-item>
          </a-col>
        </a-row>

        <a-form-item label="状态" name="status" v-if="templateDialog.isEdit">
          <a-radio-group v-model:value="templateDialog.form.status">
            <a-radio :value="1">启用</a-radio>
            <a-radio :value="0">禁用</a-radio>
          </a-radio-group>
        </a-form-item>

        <a-divider orientation="left">默认值设置</a-divider>

        <!-- 结构化默认值配置 -->
        <a-card title="默认值配置" size="small" class="default-values-card">
          <!-- 优先级设置 -->
          <a-form-item label="默认优先级" style="margin-bottom: 16px;">
            <a-select v-model:value="templateDialog.defaultValues.priority" placeholder="请选择优先级" style="width: 100%">
              <a-select-option :value="1">低</a-select-option>
              <a-select-option :value="2">中</a-select-option>
              <a-select-option :value="3">高</a-select-option>
            </a-select>
          </a-form-item>

          <!-- 审批人设置 -->
          <a-form-item label="默认审批人" style="margin-bottom: 16px;">
            <a-select v-model:value="templateDialog.defaultValues.approvers" mode="multiple" placeholder="请选择审批人"
              style="width: 100%" :loading="usersLoading" @dropdown-visible-change="onUsersDropdownVisibleChange"
              @popup-scroll="onUsersPopupScroll">
              <a-select-option v-for="user in users" :key="user.id" :value="user.id">
                {{ user.username }}
              </a-select-option>
              <div v-if="usersLoading" class="loading-more">
                <a-spin size="small" />
                <span>加载中...</span>
              </div>
            </a-select>
          </a-form-item>

          <!-- 自定义字段设置 -->
          <a-form-item label="自定义字段" style="margin-bottom: 16px;">
            <div class="custom-fields-section">
              <div v-for="(field, index) in templateDialog.defaultValues.customFields" :key="index" class="field-row">
                <a-input v-model:value="field.key" placeholder="字段名" class="field-key" />
                <a-input v-model:value="field.value" placeholder="默认值" class="field-value" />
                <a-button type="text" danger @click="removeCustomField(index)" class="field-remove">
                  <template #icon>
                    <DeleteOutlined />
                  </template>
                </a-button>
              </div>
              <a-button type="dashed" @click="addCustomField" style="width: 100%; margin-top: 8px;">
                <template #icon>
                  <PlusOutlined />
                </template>
                添加自定义字段
              </a-button>
            </div>
          </a-form-item>

          <!-- JSON预览 -->
          <a-form-item label="JSON预览">
            <a-textarea :value="generateDefaultValuesJSON()" :rows="6" readonly class="json-preview" />
          </a-form-item>
        </a-card>
      </a-form>
    </a-modal>

    <!-- 详情/预览对话框 -->
    <a-modal :open="detailDialogVisible" title="模板详情" :width="previewDialogWidth" :footer="null"
      @cancel="closeDetailDialog" class="detail-dialog">
      <div v-if="detailDialog.template" class="template-details">
        <div class="detail-header">
          <h3>{{ detailDialog.template.name }}</h3>
          <a-tag :color="getStatusColor(detailDialog.template.status)">
            {{ getStatusText(detailDialog.template.status) }}
          </a-tag>
        </div>

        <a-descriptions bordered :column="responsiveDescColumns" :labelStyle="{ width: '120px' }">
          <a-descriptions-item label="ID">{{ detailDialog.template.id }}</a-descriptions-item>
          <a-descriptions-item label="名称">{{ detailDialog.template.name }}</a-descriptions-item>
          <a-descriptions-item label="分类">
            <a-tag v-if="detailDialog.template.category?.name" color="blue">
              {{ detailDialog.template.category?.name }}
            </a-tag>
            <span v-else class="text-gray">未分类</span>
          </a-descriptions-item>
          <a-descriptions-item label="关联流程">
            <a-tag v-if="detailDialog.template.process?.name" color="geekblue">
              {{ detailDialog.template.process?.name }}
            </a-tag>
            <span v-else class="text-gray">未关联</span>
          </a-descriptions-item>
          <a-descriptions-item label="创建人">{{ detailDialog.template.creator_name }}</a-descriptions-item>
          <a-descriptions-item label="状态">{{ getStatusText(detailDialog.template.status) }}</a-descriptions-item>
          <a-descriptions-item label="排序">{{ detailDialog.template.sort_order || 0 }}</a-descriptions-item>
          <a-descriptions-item label="图标">{{ detailDialog.template.icon || '无' }}</a-descriptions-item>
          <a-descriptions-item label="创建时间" :span="2">{{ formatFullDateTime(detailDialog.template.created_at || '')
            }}</a-descriptions-item>
          <a-descriptions-item label="描述" :span="2">{{ detailDialog.template.description || '无描述'
            }}</a-descriptions-item>
        </a-descriptions>

        <div class="content-preview">
          <h4>默认值配置</h4>
          <div class="content-display">
            <pre class="content-text">{{ formatDefaultValues(detailDialog.template.default_values) }}</pre>
          </div>
        </div>

        <div class="detail-footer">
          <a-button @click="closeDetailDialog">关闭</a-button>
          <a-button type="primary" @click="handleEditTemplate(detailDialog.template)">编辑</a-button>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { message, Modal } from 'ant-design-vue';
import {
  PlusOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  StopOutlined,
  PlusCircleOutlined,
  DownOutlined,
  EyeOutlined,
  DeleteOutlined
} from '@ant-design/icons-vue';
import {
  type Template,
  type CreateTemplateReq,
  type UpdateTemplateReq,
  type ListTemplateReq,
  type TemplateDefaultValues,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  listTemplate,
  detailTemplate
} from '#/api/core/workorder_template';
import { listProcess } from '#/api/core/workorder_process';
import { listCategory } from '#/api/core/workorder_category';
import { getUserList } from '#/api/core/user';

// 类型定义
interface Category {
  id: number;
  name: string;
  description: string;
}

interface Process {
  id: number;
  name: string;
  description: string;
}

interface User {
  id: number;
  username: string;
}

interface CustomField {
  key: string;
  value: string;
}

interface DefaultValues {
  priority: number | null;
  approvers: number[];
  customFields: CustomField[];
}

// 表格列定义
const columns = [
  { title: '模板名称', dataIndex: 'name', key: 'name', width: 180, fixed: 'left' },
  { title: '分类', dataIndex: 'category', key: 'category', width: 120, align: 'center' as const },
  { title: '关联流程', dataIndex: 'process', key: 'process', width: 120, align: 'center' as const },
  { title: '描述', dataIndex: 'description', key: 'description', width: 200, ellipsis: true },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100, align: 'center' as const },
  { title: '排序', dataIndex: 'sort_order', key: 'sortOrder', width: 80, align: 'center' as const },
  { title: '创建人', dataIndex: 'creator_name', key: 'creator', width: 150 },
  { title: '创建时间', dataIndex: 'created_at', key: 'createdAt', width: 180 },
  { title: '操作', key: 'action', width: 200, align: 'center' as const, fixed: 'right' }
];

// 状态数据
const loading = ref(false);
const searchQuery = ref('');
const categoryFilter = ref<number | undefined>(undefined);
const statusFilter = ref<0 | 1 | undefined>(undefined);
const typeFilter = ref<number | undefined>(undefined);
const templates = ref<Template[]>([]);
const categories = ref<Category[]>([]);

// 模板对话框中的分页数据
const templateDialogCategories = ref<Category[]>([]);
const templateDialogProcesses = ref<Process[]>([]);
const users = ref<User[]>([]);
const categorySelectorLoading = ref(false);
const processSelectorLoading = ref(false);
const usersLoading = ref(false);
const categorySearchKeyword = ref('');
const processSearchKeyword = ref('');
let categorySearchTimeout: any = null;
let processSearchTimeout: any = null;

// 分类分页状态
const categoryPagination = reactive({
  current: 1,
  pageSize: 20,
  total: 0,
  hasMore: false
});

// 流程分页状态
const processPagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  hasMore: false
});

// 用户分页状态
const userPagination = reactive({
  current: 1,
  pageSize: 20,
  total: 0,
  hasMore: false
});

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
  thisMonth: 0
});

// 对话框状态
const templateDialogVisible = ref(false);
const detailDialogVisible = ref(false);

// 模板对话框数据
const templateDialog = reactive({
  isEdit: false,
  form: {
    id: undefined as number | undefined,
    name: '',
    description: '',
    categoryId: undefined as number | undefined,
    processId: undefined as number | undefined,
    status: 1 as number,
    icon: '',
    sortOrder: 0,
    defaultValues: {} as TemplateDefaultValues
  },
  defaultValues: {
    priority: null,
    approvers: [],
    customFields: []
  } as DefaultValues
});

// 详情对话框数据
const detailDialog = reactive({
  template: null as Template | null
});

// 表单验证规则
const templateRules = {
  name: [
    { required: true, message: '请输入模板名称', trigger: 'blur' },
    { min: 3, max: 50, message: '长度应为3到50个字符', trigger: 'blur' }
  ],
  categoryId: [
    { required: true, message: '请选择分类', trigger: 'change' }
  ]
};

// 表单引用
const formRef = ref();

// 响应式对话框宽度
const templateDialogWidth = computed(() => {
  if (typeof window !== 'undefined') {
    const width = window.innerWidth;
    if (width < 768) return '95%';
    if (width < 1024) return '90%';
    return '900px';
  }
  return '900px';
});

const previewDialogWidth = computed(() => {
  if (typeof window !== 'undefined') {
    const width = window.innerWidth;
    if (width < 768) return '95%';
    if (width < 1024) return '90%';
    return '80%';
  }
  return '80%';
});

// 响应式描述列数
const responsiveDescColumns = computed(() => {
  if (typeof window !== 'undefined') {
    const width = window.innerWidth;
    if (width < 768) return 1;
    return 2;
  }
  return 2;
});

// 计算总页数
const totalCategoryPages = computed(() => {
  return Math.ceil(categoryPagination.total / categoryPagination.pageSize);
});

const totalProcessPages = computed(() => {
  return Math.ceil(processPagination.total / processPagination.pageSize);
});

// 辅助方法
const getStatusColor = (status: number): string => {
  return status === 1 ? 'green' : 'default';
};

const getStatusText = (status: number): string => {
  return status === 1 ? '启用' : '禁用';
};

const getStatusClass = (status: number): string => {
  return status === 1 ? 'status-enabled' : 'status-disabled';
};

const formatDate = (dateStr: string): string => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('zh-CN');
};

const formatTime = (dateStr: string): string => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
};

const formatFullDateTime = (dateStr: string): string => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleString('zh-CN');
};

const getInitials = (name: string): string => {
  if (!name) return '';
  return name.slice(0, 2).toUpperCase();
};

const getAvatarColor = (name: string): string => {
  const colors = ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#13c2c2', '#eb2f96', '#fa8c16'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length]!;
};

const formatDefaultValues = (defaultValues: string | TemplateDefaultValues) => {
  try {
    if (!defaultValues) return '{}';
    if (typeof defaultValues === 'string') {
      const obj = JSON.parse(defaultValues);
      return JSON.stringify(obj, null, 2);
    } else {
      return JSON.stringify(defaultValues, null, 2);
    }
  } catch (e) {
    return typeof defaultValues === 'string' ? defaultValues : JSON.stringify(defaultValues);
  }
};

// 分页分类加载方法
const loadTemplateDialogCategories = async (reset: boolean = false, search?: string): Promise<void> => {
  if (categorySelectorLoading.value && !reset) {
    return;
  }

  categorySelectorLoading.value = true;

  try {
    const params = {
      page: reset ? 1 : categoryPagination.current,
      size: categoryPagination.pageSize,
      search: search !== undefined ? search : categorySearchKeyword.value || undefined
    };

    const response = await listCategory(params);

    if (response) {
      if (reset) {
        templateDialogCategories.value = response.items || [];
        categoryPagination.current = 1;
      } else {
        const existingIds = new Set(templateDialogCategories.value.map(cat => cat.id));
        const newItems = (response.items || []).filter((cat: any) => !existingIds.has(cat.id));
        templateDialogCategories.value = [...templateDialogCategories.value, ...newItems];
      }

      categoryPagination.total = response.total || 0;
      categoryPagination.hasMore = (response.items || []).length === categoryPagination.pageSize &&
        templateDialogCategories.value.length < categoryPagination.total;
    }
  } catch (error: any) {
    console.error('加载分类列表失败:', error);
    if (reset) {
      message.error(error.message || '加载分类列表失败');
      templateDialogCategories.value = [];
      categoryPagination.current = 1;
      categoryPagination.total = 0;
      categoryPagination.hasMore = false;
    }
  } finally {
    categorySelectorLoading.value = false;
  }
};

// 分页流程加载方法
const loadTemplateDialogProcesses = async (reset: boolean = false, search?: string): Promise<void> => {
  if (processSelectorLoading.value && !reset) {
    return;
  }

  processSelectorLoading.value = true;

  try {
    const params = {
      page: reset ? 1 : processPagination.current,
      size: processPagination.pageSize,
      search: search !== undefined ? search : processSearchKeyword.value || undefined
    };

    const response = await listProcess(params);

    if (response) {
      if (reset) {
        templateDialogProcesses.value = response.items || [];
        processPagination.current = 1;
      } else {
        const existingIds = new Set(templateDialogProcesses.value.map(process => process.id));
        const newItems = (response.items || []).filter((process: any) => !existingIds.has(process.id));
        templateDialogProcesses.value = [...templateDialogProcesses.value, ...newItems];
      }

      processPagination.total = response.total || 0;
      processPagination.hasMore = (response.items || []).length === processPagination.pageSize &&
        templateDialogProcesses.value.length < processPagination.total;
    }
  } catch (error: any) {
    console.error('加载流程列表失败:', error);
    if (reset) {
      message.error(error.message || '加载流程列表失败');
      templateDialogProcesses.value = [];
      processPagination.current = 1;
      processPagination.total = 0;
      processPagination.hasMore = false;
    }
  } finally {
    processSelectorLoading.value = false;
  }
};

// 分页用户加载方法
const loadUsers = async (reset: boolean = false): Promise<void> => {
  if (usersLoading.value && !reset) {
    return;
  }

  if (reset) {
    userPagination.current = 1;
    users.value = [];
    userPagination.hasMore = true;
  }

  if (!userPagination.hasMore) return;

  usersLoading.value = true;
  try {
    const response = await getUserList({
      page: userPagination.current,
      size: userPagination.pageSize,
      search: ''
    });

    let userItems = [];
    let total = 0;

    if (response?.data?.items) {
      userItems = response.data.items;
      total = response.data.total || 0;
    } else if (response?.items) {
      userItems = response.items;
      total = response.total || 0;
    }

    if (reset) {
      users.value = userItems;
    } else {
      users.value = [...users.value, ...userItems];
    }

    userPagination.total = total;
    userPagination.hasMore = users.value.length < total;

    if (userPagination.hasMore) {
      userPagination.current++;
    }
  } catch (error) {
    console.error('加载用户列表失败:', error);
    message.error('加载用户列表失败');
  } finally {
    usersLoading.value = false;
  }
};

// 处理分类搜索
const handleCategorySearch = (value: string): void => {
  categorySearchKeyword.value = value;

  if (categorySearchTimeout) {
    clearTimeout(categorySearchTimeout);
  }

  categorySearchTimeout = setTimeout(() => {
    categoryPagination.current = 1;
    loadTemplateDialogCategories(true, value);
  }, 300);
};

// 处理流程搜索
const handleProcessSearch = (value: string): void => {
  processSearchKeyword.value = value;

  if (processSearchTimeout) {
    clearTimeout(processSearchTimeout);
  }

  processSearchTimeout = setTimeout(() => {
    processPagination.current = 1;
    loadTemplateDialogProcesses(true, value);
  }, 300);
};

// 处理下拉框显示/隐藏
const handleCategoryDropdownChange = (open: boolean): void => {
  if (open) {
    if (templateDialogCategories.value.length === 0) {
      loadTemplateDialogCategories(true);
    }
  }
};

const handleProcessDropdownChange = (open: boolean): void => {
  if (open) {
    if (templateDialogProcesses.value.length === 0) {
      loadTemplateDialogProcesses(true);
    }
  }
};

const onUsersDropdownVisibleChange = (open: boolean) => {
  if (open && users.value.length === 0) {
    loadUsers(true);
  }
};

// 处理滚动加载更多
const handleCategoryScroll = (e: Event): void => {
  const { target } = e;
  if (!target) return;

  const element = target as HTMLElement;
  const { scrollTop, scrollHeight, clientHeight } = element;

  if (scrollTop + clientHeight >= scrollHeight - 10 &&
    categoryPagination.hasMore &&
    !categorySelectorLoading.value) {
    loadMoreCategories();
  }
};

const handleProcessScroll = (e: Event): void => {
  const { target } = e;
  if (!target) return;

  const element = target as HTMLElement;
  const { scrollTop, scrollHeight, clientHeight } = element;

  if (scrollTop + clientHeight >= scrollHeight - 10 &&
    processPagination.hasMore &&
    !processSelectorLoading.value) {
    loadMoreProcesses();
  }
};

const onUsersPopupScroll = (e: Event) => {
  const target = e.target as HTMLElement;
  if (target && target.scrollTop + target.offsetHeight === target.scrollHeight) {
    if (userPagination.hasMore && !usersLoading.value) {
      loadUsers();
    }
  }
};

// 加载更多方法
const loadMoreCategories = async (): Promise<void> => {
  if (!categoryPagination.hasMore || categorySelectorLoading.value) {
    return;
  }

  categoryPagination.current += 1;
  await loadTemplateDialogCategories(false);
};

const loadMoreProcesses = async (): Promise<void> => {
  if (!processPagination.hasMore || processSelectorLoading.value) {
    return;
  }

  processPagination.current += 1;
  await loadTemplateDialogProcesses(false);
};

// 默认值配置相关方法
const addCustomField = () => {
  templateDialog.defaultValues.customFields.push({
    key: '',
    value: ''
  });
};

const removeCustomField = (index: number) => {
  templateDialog.defaultValues.customFields.splice(index, 1);
};

const generateDefaultValuesJSON = () => {
  const defaultValues: TemplateDefaultValues = {
    fields: {},
    approvers: templateDialog.defaultValues.approvers,
    priority: templateDialog.defaultValues.priority || 1
  };

  // 构建 fields 对象
  templateDialog.defaultValues.customFields.forEach(field => {
    if (field.key && field.value) {
      defaultValues.fields[field.key] = field.value;
    }
  });

  return JSON.stringify(defaultValues, null, 2);
};

const parseDefaultValues = (defaultValues: string | TemplateDefaultValues) => {
  try {
    let parsed: TemplateDefaultValues;

    if (typeof defaultValues === 'string') {
      parsed = JSON.parse(defaultValues);
    } else {
      parsed = defaultValues;
    }

    // 重置默认值
    templateDialog.defaultValues = {
      priority: parsed.priority || null,
      approvers: parsed.approvers || [],
      customFields: []
    };

    // 解析自定义字段
    if (parsed.fields && typeof parsed.fields === 'object') {
      templateDialog.defaultValues.customFields = Object.entries(parsed.fields).map(([key, value]) => ({
        key,
        value: String(value)
      }));
    }
  } catch (error) {
    console.warn('解析默认值失败:', error);
    // 重置为默认值
    templateDialog.defaultValues = {
      priority: null,
      approvers: [],
      customFields: []
    };
  }
};

// 数据加载
const loadTemplates = async (): Promise<void> => {
  loading.value = true;
  try {
    const params: ListTemplateReq = {
      page: paginationConfig.current,
      size: paginationConfig.pageSize,
      search: searchQuery.value || undefined,
      status: statusFilter.value,
      category_id: categoryFilter.value
    };

    const response = await listTemplate(params);
    if (response) {
      templates.value = response.items || [];
      paginationConfig.total = response.total || 0;
      updateStats();
    }
  } catch (error) {
    console.error('加载模板列表失败:', error);
    message.error('加载模板列表失败');
  } finally {
    loading.value = false;
  }
};

const loadCategories = async (): Promise<void> => {
  try {
    const response = await listCategory({ page: 1, size: 100 });
    categories.value = response.items || [];
  } catch (error) {
    console.error('加载分类列表失败:', error);
    message.error('加载分类列表失败');
  }
};

const updateStats = (): void => {
  stats.total = paginationConfig.total;
  stats.enabled = templates.value.filter(t => t.status === 1).length;
  stats.disabled = templates.value.filter(t => t.status === 0).length;

  // 计算本月新增
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  stats.thisMonth = templates.value.filter(t => {
    if (t.created_at) {
      const createdAt = new Date(t.created_at);
      return createdAt >= startOfMonth;
    }
    return false;
  }).length;
};

// 事件处理
const handleTableChange = (pagination: any): void => {
  paginationConfig.current = pagination.current;
  paginationConfig.pageSize = pagination.pageSize;
  loadTemplates();
};

const handleSearch = (): void => {
  paginationConfig.current = 1;
  loadTemplates();
};

const handleSearchChange = (): void => {
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }
  searchTimeout = setTimeout(() => {
    paginationConfig.current = 1;
    loadTemplates();
  }, 500);
};

const handleCategoryChange = (): void => {
  paginationConfig.current = 1;
  loadTemplates();
};

const handleStatusChange = (): void => {
  paginationConfig.current = 1;
  loadTemplates();
};

const handleTypeChange = (): void => {
  paginationConfig.current = 1;
  loadTemplates();
};

const handleResetFilters = (): void => {
  searchQuery.value = '';
  categoryFilter.value = undefined;
  statusFilter.value = undefined;
  typeFilter.value = undefined;
  paginationConfig.current = 1;
  loadTemplates();
  message.success('过滤条件已重置');
};

const handleCreateTemplate = (): void => {
  templateDialog.isEdit = false;
  templateDialog.form = {
    id: undefined,
    name: '',
    description: '',
    categoryId: undefined,
    processId: undefined,
    status: 1,
    icon: '',
    sortOrder: 0,
    defaultValues: {
      fields: {},
      approvers: [],
      priority: 1
    }
  };

  // 重置默认值配置
  templateDialog.defaultValues = {
    priority: null,
    approvers: [],
    customFields: []
  };

  templateDialogVisible.value = true;
  resetSelectors();
};

const handleEditTemplate = async (record: Template): Promise<void> => {
  try {
    const response = await detailTemplate(record.id);

    let templateData;
    if (response?.data) {
      templateData = response.data;
    } else {
      templateData = response;
    }

    if (templateData) {
      templateDialog.isEdit = true;
      templateDialog.form = {
        id: templateData.id,
        name: templateData.name,
        description: templateData.description || '',
        categoryId: templateData.category_id,
        processId: templateData.process_id,
        status: templateData.status,
        icon: templateData.icon || '',
        sortOrder: templateData.sort_order || 0,
        defaultValues: templateData.default_values
      };

      // 解析默认值到结构化表单
      parseDefaultValues(templateData.default_values);

      templateDialogVisible.value = true;
      detailDialogVisible.value = false;

      await loadSelectorDataForEdit(templateData);
    }
  } catch (error) {
    console.error('获取模板详情失败:', error);
    message.error('获取模板详情失败');
  }
};

const handleViewTemplate = async (record: Template): Promise<void> => {
  try {
    const response = await detailTemplate(record.id);

    let templateData;
    if (response?.data) {
      templateData = response.data;
    } else {
      templateData = response;
    }

    if (templateData) {
      detailDialog.template = templateData;
      detailDialogVisible.value = true;
    }
  } catch (error) {
    console.error('获取模板详情失败:', error);
    message.error('获取模板详情失败');
  }
};

const handleMenuClick = (command: string, record: Template): void => {
  switch (command) {
    case 'preview':
      handleViewTemplate(record);
      break;
    case 'enable':
      toggleTemplateStatus(record, 1);
      break;
    case 'disable':
      toggleTemplateStatus(record, 0);
      break;
    case 'delete':
      confirmDelete(record);
      break;
  }
};

const toggleTemplateStatus = async (record: Template, status: number): Promise<void> => {
  try {
    const data: UpdateTemplateReq = {
      id: record.id,
      name: record.name,
      description: record.description,
      process_id: record.process_id,
      default_values: typeof record.default_values === 'string' ? JSON.parse(record.default_values) : record.default_values,
      icon: record.icon,
      category_id: record.category_id,
      sort_order: record.sort_order,
      status: status
    };
    
    await updateTemplate(data);

    const statusText = status === 1 ? '启用' : '禁用';
    message.success(`模板 "${record.name}" 已${statusText}`);
    loadTemplates();
  } catch (error) {
    console.error('更新模板状态失败:', error);
    message.error('更新模板状态失败');
  }
};

const confirmDelete = (record: Template): void => {
  Modal.confirm({
    title: '警告',
    content: `确定要删除模板 "${record.name}" 吗？`,
    okText: '删除',
    okType: 'danger',
    cancelText: '取消',
    async onOk() {
      try {
        await deleteTemplate(record.id);
        message.success(`模板 "${record.name}" 已删除`);

        // 检查当前页是否还有数据，如果删除后当前页没有数据且不是第一页，则回到上一页
        if (templates.value.length === 1 && paginationConfig.current > 1) {
          paginationConfig.current = paginationConfig.current - 1;
        }

        loadTemplates();
      } catch (error) {
        console.error('删除模板失败:', error);
        message.error('删除模板失败');
      }
    }
  });
};

// 表单保存
const saveTemplate = async (): Promise<void> => {
  // 先验证表单
  try {
    await formRef.value?.validate();
  } catch (error) {
    console.log('表单验证失败:', error);
    return;
  }

  // 验证必填字段
  if (!templateDialog.form.name.trim()) {
    message.error('模板名称不能为空');
    return;
  }

  if (!templateDialog.form.categoryId) {
    message.error('请选择分类');
    return;
  }

  // 构建默认值对象
  const defaultValues: TemplateDefaultValues = {
    fields: {},
    approvers: templateDialog.defaultValues.approvers,
    priority: templateDialog.defaultValues.priority || 1
  };

  // 构建 fields 对象
  templateDialog.defaultValues.customFields.forEach(field => {
    if (field.key && field.value) {
      defaultValues.fields[field.key] = field.value;
    }
  });

  try {
    if (templateDialog.isEdit && templateDialog.form.id) {
      const data: UpdateTemplateReq = {
        id: templateDialog.form.id,
        name: templateDialog.form.name,
        description: templateDialog.form.description,
        process_id: templateDialog.form.processId || 0,
        default_values: defaultValues,
        icon: templateDialog.form.icon,
        category_id: templateDialog.form.categoryId,
        sort_order: templateDialog.form.sortOrder,
        status: templateDialog.form.status
      };
      await updateTemplate(data);
      message.success(`模板 "${templateDialog.form.name}" 已更新`);
    } else {
      const data: CreateTemplateReq = {
        name: templateDialog.form.name,
        description: templateDialog.form.description,
        process_id: templateDialog.form.processId || 0,
        default_values: defaultValues,
        icon: templateDialog.form.icon,
        category_id: templateDialog.form.categoryId,
        sort_order: templateDialog.form.sortOrder
      };
      await createTemplate(data);
      message.success(`模板 "${templateDialog.form.name}" 已创建`);

      // 如果是创建新模板，跳转到第一页查看新创建的模板
      paginationConfig.current = 1;
    }
    templateDialogVisible.value = false;
    loadTemplates();
  } catch (error) {
    console.error('保存模板失败:', error);
    message.error('保存模板失败');
  }
};

// 为编辑模式加载选择器数据
const loadSelectorDataForEdit = async (template: Template): Promise<void> => {
  resetSelectors();

  try {
    await loadTemplateDialogCategories(true);
    await loadTemplateDialogProcesses(true);
    await loadUsers(true);

    // 确保当前选中的分类和流程在列表中
    if (template.category_id && !templateDialogCategories.value.find(cat => cat.id === template.category_id)) {
      templateDialogCategories.value = [
        { id: template.category_id, name: template.category?.name || `分类${template.category_id}`, description: '' },
        ...templateDialogCategories.value
      ];
    }

    if (template.process_id && !templateDialogProcesses.value.find(process => process.id === template.process_id)) {
      templateDialogProcesses.value = [
        { id: template.process_id, name: template.process?.name || `流程${template.process_id}`, description: '' },
        ...templateDialogProcesses.value
      ];
    }
  } catch (error) {
    console.error('加载编辑模式选择器数据失败:', error);
  }
};

// 重置选择器状态
const resetSelectors = (): void => {
  // 重置分类选择器
  templateDialogCategories.value = [];
  categoryPagination.current = 1;
  categoryPagination.total = 0;
  categoryPagination.hasMore = false;
  categorySearchKeyword.value = '';
  categorySelectorLoading.value = false;

  // 重置流程选择器
  templateDialogProcesses.value = [];
  processPagination.current = 1;
  processPagination.total = 0;
  processPagination.hasMore = false;
  processSearchKeyword.value = '';
  processSelectorLoading.value = false;

  // 重置用户选择器
  users.value = [];
  userPagination.current = 1;
  userPagination.total = 0;
  userPagination.hasMore = false;
  usersLoading.value = false;

  // 清除搜索定时器
  if (categorySearchTimeout) {
    clearTimeout(categorySearchTimeout);
    categorySearchTimeout = null;
  }
  if (processSearchTimeout) {
    clearTimeout(processSearchTimeout);
    processSearchTimeout = null;
  }
};

// 对话框关闭
const closeTemplateDialog = (): void => {
  templateDialogVisible.value = false;
  resetSelectors();
};

const closeDetailDialog = (): void => {
  detailDialogVisible.value = false;
};

// 生命周期钩子
onMounted(() => {
  loadCategories();
  loadTemplates();
});
</script>

<style scoped>
.template-management-container {
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

.category-filter,
.status-filter,
.type-filter {
  width: 120px;
  min-width: 100px;
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

.template-name-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.template-badge {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-enabled {
  background-color: #52c41a;
}

.status-disabled {
  background-color: #d9d9d9;
}

.template-name-text {
  font-weight: 500;
  word-break: break-all;
}

.description-text {
  color: #606266;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-all;
}

.text-gray {
  color: #999;
  font-style: italic;
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

/* 选择器样式 - 参考表单管理页面 */
.category-loading,
.category-empty,
.process-loading,
.process-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 12px;
  color: #8c8c8c;
  font-size: 14px;
}

.category-option,
.process-option {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.category-name,
.process-name {
  font-weight: 500;
  color: #262626;
}

.category-desc,
.process-desc {
  font-size: 12px;
  color: #8c8c8c;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
}

.load-more-option {
  text-align: center;
  border-top: 1px solid #f0f0f0;
  margin-top: 4px;
  background-color: #fafafa !important;
}

.load-more-option:hover {
  background-color: #f0f0f0 !important;
}

.load-more-content {
  padding: 8px 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.load-more-content:hover {
  background-color: #e6f7ff;
  border-radius: 4px;
}

.default-values-card {
  margin-bottom: 16px;
}

.custom-fields-section {
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  padding: 16px;
  background-color: #fafafa;
}

.field-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.field-row:last-child {
  margin-bottom: 0;
}

.field-key {
  flex: 1;
  min-width: 120px;
}

.field-value {
  flex: 1;
  min-width: 120px;
}

.field-remove {
  flex-shrink: 0;
}

.json-preview {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  background-color: #f6f8fa;
  border: 1px solid #e1e4e8;
}

.loading-more {
  padding: 8px 12px;
  text-align: center;
  color: #999;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

/* 详情对话框样式 */
.detail-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.detail-header h3 {
  margin: 0;
  font-size: 24px;
  color: #1f2937;
  word-break: break-all;
}

.content-preview {
  margin-top: 24px;
}

.content-preview h4 {
  margin-bottom: 16px;
  color: #1f2937;
  font-size: 18px;
}

.content-display {
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  background: #fafafa;
  padding: 16px;
}

.content-text {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 12px;
  line-height: 1.4;
  background: white;
  border: 1px solid #e1e4e8;
  padding: 12px;
  border-radius: 4px;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 300px;
  overflow-y: auto;
  margin: 0;
}

.detail-footer {
  margin-top: 24px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  flex-wrap: wrap;
}

/* 选择器下拉列表样式优化 */
:deep(.ant-select-dropdown) {
  .load-more-option.ant-select-item-option-disabled {
    color: #1890ff !important;
    cursor: pointer !important;
    background-color: #fafafa !important;
  }

  .load-more-option.ant-select-item-option-disabled:hover {
    background-color: #f0f0f0 !important;
  }
}

/* 移动端适配 */
@media (max-width: 768px) {
  .template-management-container {
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

  .category-filter,
  .status-filter,
  .type-filter {
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

  .detail-footer {
    justify-content: center;
  }

  .detail-footer .ant-btn {
    flex: 1;
    max-width: 120px;
  }

  .category-desc,
  .process-desc {
    max-width: 150px;
  }

  .load-more-content {
    padding: 6px 8px;
  }

  .responsive-modal :deep(.ant-modal-body) {
    padding: 16px;
    max-height: calc(100vh - 160px);
    overflow-y: auto;
  }

  .field-row {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .field-key,
  .field-value {
    width: 100%;
    min-width: auto;
  }

  .field-remove {
    align-self: center;
  }
}

/* 平板端适配 */
@media (max-width: 1024px) and (min-width: 769px) {
  .template-management-container {
    padding: 16px;
  }

  .search-input {
    width: 200px;
  }

  .category-desc,
  .process-desc {
    max-width: 180px;
  }
}

/* 超小屏幕适配 */
@media (max-width: 480px) {
  .header-actions {
    gap: 8px;
  }

  .stats-card {
    text-align: center;
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

  .detail-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .category-desc,
  .process-desc {
    max-width: 120px;
  }

  .load-more-content {
    padding: 4px 6px;
    font-size: 12px;
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

.template-modal :deep(.ant-modal-body) {
  max-height: 70vh;
  overflow-y: auto;
}

/* 焦点状态优化 */
.json-preview:focus-within {
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
  border-radius: 6px;
}
</style>
