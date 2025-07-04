<template>
  <div class="scrape-pool-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="header-actions">
        <a-button type="primary" @click="showAddModal" class="btn-create">
          <template #icon>
            <PlusOutlined />
          </template>
          <span class="btn-text">新增AlertRule</span>
        </a-button>
        <div class="search-filters">
          <a-input-search v-model:value="searchText" placeholder="搜索AlertRule名称..." class="search-input"
            @search="handleSearch" @change="handleSearchChange" allow-clear />
          <a-select v-model:value="severityFilter" placeholder="严重性" class="filter-select"
            @change="handleSeverityChange" allow-clear>
            <a-select-option :value="undefined">全部</a-select-option>
            <a-select-option value="critical">Critical</a-select-option>
            <a-select-option value="warning">Warning</a-select-option>
            <a-select-option value="info">Info</a-select-option>
          </a-select>
          <a-select v-model:value="enableFilter" placeholder="启用状态" class="filter-select" @change="handleEnableChange"
            allow-clear>
            <a-select-option :value="undefined">全部</a-select-option>
            <a-select-option :value="1">启用</a-select-option>
            <a-select-option :value="2">禁用</a-select-option>
          </a-select>
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
            <a-statistic title="总规则" :value="stats.total" :value-style="{ color: '#3f8600' }">
              <template #prefix>
                <Icon icon="carbon:container-registry" />
              </template>
            </a-statistic>
          </a-card>
        </a-col>
        <a-col :xs="12" :sm="6" :md="6" :lg="6">
          <a-card class="stats-card">
            <a-statistic title="Critical" :value="stats.critical" :value-style="{ color: '#cf1322' }">
              <template #prefix>
                <Icon icon="carbon:warning-alt" />
              </template>
            </a-statistic>
          </a-card>
        </a-col>
        <a-col :xs="12" :sm="6" :md="6" :lg="6">
          <a-card class="stats-card">
            <a-statistic title="Warning" :value="stats.warning" :value-style="{ color: '#faad14' }">
              <template #prefix>
                <Icon icon="carbon:notification" />
              </template>
            </a-statistic>
          </a-card>
        </a-col>
        <a-col :xs="12" :sm="6" :md="6" :lg="6">
          <a-card class="stats-card">
            <a-statistic title="已启用" :value="stats.enabled" :value-style="{ color: '#1890ff' }">
              <template #prefix>
                <Icon icon="carbon:checkmark-outline" />
              </template>
            </a-statistic>
          </a-card>
        </a-col>
      </a-row>
    </div>

    <!-- 表格容器 -->
    <div class="table-container">
      <a-card>
        <a-table :data-source="data" :columns="columns" :pagination="paginationConfig" :loading="loading" row-key="id"
          bordered :scroll="{ x: 1400 }" @change="handleTableChange">
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'name'">
              <div class="pool-name-cell">
                <div class="pool-badge" :class="getAlertStatusClass(record)"></div>
                <span class="pool-name-text">{{ record.name }}</span>
              </div>
            </template>

            <template v-if="column.key === 'expr'">
              <div class="expr-container" :title="record.expr">
                {{ record.expr }}
              </div>
            </template>

            <template v-if="column.key === 'labels'">
              <div class="tag-container">
                <template v-if="record.labels && record.labels.length && record.labels[0] !== ''">
                  <a-tag v-for="label in record.labels" :key="label" class="tech-tag label-tag">
                    <span class="label-key">{{ label.split(',')[0] }}</span>
                    <span class="label-separator">:</span>
                    <span class="label-value">{{ label.split(',')[1] }}</span>
                  </a-tag>
                </template>
                <span v-else class="empty-text">无标签</span>
              </div>
            </template>

            <template v-if="column.key === 'annotations'">
              <div class="tag-container">
                <template v-if="record.annotations && record.annotations.length && record.annotations[0] !== ''">
                  <a-tag v-for="annotation in record.annotations" :key="annotation" class="tech-tag annotation-tag">
                    <span class="label-key">{{ annotation.split(',')[0] }}</span>
                    <span class="label-separator">:</span>
                    <span class="label-value">{{ annotation.split(',')[1] }}</span>
                  </a-tag>
                </template>
                <span v-else class="empty-text">无注解</span>
              </div>
            </template>

            <template v-if="column.key === 'severity'">
              <a-tag :class="['tech-tag', `severity-${record.severity}`]">
                {{ record.severity }}
              </a-tag>
            </template>

            <template v-if="column.key === 'enable'">
              <a-tag :color="record.enable === 1 ? 'success' : 'default'">
                {{ record.enable === 1 ? '启用' : '禁用' }}
              </a-tag>
            </template>

            <template v-if="column.key === 'pool_config'">
              <div class="config-info">
                <div class="config-item">
                  <span class="config-label">实例池:</span>
                  <span class="config-value">{{ getPoolName(record.pool_id) }}</span>
                </div>
                <div class="config-item">
                  <span class="config-label">发送组:</span>
                  <span class="config-value">{{ getSendGroupName(record.send_group_id) }}</span>
                </div>
              </div>
            </template>

            <template v-if="column.key === 'creator'">
              <div class="creator-info">
                <a-avatar size="small" :style="{ backgroundColor: getAvatarColor(record.create_user_name || '') }">
                  {{ getInitials(record.create_user_name) }}
                </a-avatar>
                <span class="creator-name">{{ record.create_user_name }}</span>
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
                <a-button type="primary" size="small" @click="handleViewAlert(record)">
                  查看
                </a-button>
                <a-button type="default" size="small" @click="showEditModal(record)">
                  编辑
                </a-button>
                <a-dropdown>
                  <template #overlay>
                    <a-menu @click="(e: MenuInfo) => handleMenuClick(e.key, record)">
                      <a-menu-item key="clone">
                        <Icon icon="carbon:copy" /> 克隆
                      </a-menu-item>
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

    <!-- 新增/编辑AlertRule对话框 -->
    <a-modal :open="isAddModalVisible || isEditModalVisible" :title="isEditModalVisible ? '编辑AlertRule' : '新增AlertRule'"
      :width="formDialogWidth" @ok="isEditModalVisible ? handleEdit : handleAdd" @cancel="closeFormDialog"
      :destroy-on-close="true" class="responsive-modal scrape-pool-modal">
      <a-form ref="formRef" :model="isEditModalVisible ? editForm : addForm" :rules="formRules" layout="vertical">
        <div class="form-section">
          <div class="section-title">基本信息</div>
          <a-row :gutter="16">
            <a-col :span="24">
              <a-form-item label="名称" name="name" :rules="[{ required: true, message: '请输入名称' }]">
                <a-input v-model:value="formName" placeholder="请输入名称" />
              </a-form-item>
            </a-col>
          </a-row>
          <a-row :gutter="16">
            <a-col :xs="24" :sm="12">
              <a-form-item label="所属实例池" name="pool_id" :rules="[{ required: true, message: '请选择所属实例池' }]">
                <a-select v-model:value="formPoolId" placeholder="请选择所属实例池">
                  <a-select-option v-for="pool in scrapePools" :key="pool.id" :value="pool.id">
                    {{ pool.name }}
                  </a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :xs="24" :sm="12">
              <a-form-item label="发送组" name="send_group_id">
                <a-select v-model:value="formSendGroupId" placeholder="请选择发送组">
                  <a-select-option v-for="group in sendGroups" :key="group.id" :value="group.id">
                    {{ group.name }}
                  </a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
          </a-row>
          <a-row :gutter="16">
            <a-col :span="24">
              <a-form-item label="目标地址" name="ip_address" :rules="[{ required: true, message: '请输入IP地址和端口' }]">
                <div class="ip-port-container">
                  <a-input v-model:value="formIp" placeholder="请输入IP地址" class="ip-input" />
                  <span class="separator">:</span>
                  <a-input v-model:value="formPort" placeholder="端口" class="port-input" />
                </div>
              </a-form-item>
            </a-col>
          </a-row>
          <a-row :gutter="16" v-if="isEditModalVisible">
            <a-col :span="24">
              <a-form-item label="启用状态" name="enable">
                <a-switch v-model:checked="editForm.enableSwitch" class="tech-switch"
                  @change="(checked: boolean) => editForm.enable = checked ? 1 : 2" />
              </a-form-item>
            </a-col>
          </a-row>
        </div>

        <div class="form-section">
          <div class="section-title">规则配置</div>
          <a-row :gutter="16">
            <a-col :span="24">
              <a-form-item label="表达式" name="expr">
                <a-input v-model:value="formExpr" placeholder="请输入表达式" />
              </a-form-item>
            </a-col>
          </a-row>
          <a-row :gutter="16">
            <a-col :span="24">
              <a-form-item>
                <a-button type="primary" class="action-button"
                  @click="isEditModalVisible ? validateEditExpression() : validateAddExpression(addForm.expr)">
                  验证表达式
                </a-button>
              </a-form-item>
            </a-col>
          </a-row>
          <a-row :gutter="16">
            <a-col :xs="24" :sm="12">
              <a-form-item label="严重性" name="severity">
                <a-select v-model:value="formSeverity" placeholder="请选择严重性">
                  <a-select-option value="critical">Critical</a-select-option>
                  <a-select-option value="warning">Warning</a-select-option>
                  <a-select-option value="info">Info</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :xs="24" :sm="12">
              <a-form-item label="持续时间" name="for_time">
                <a-input v-model:value="formForTime" placeholder="例如: 10s" />
              </a-form-item>
            </a-col>
          </a-row>
        </div>

        <div class="form-section">
          <div class="section-title">标签配置</div>
          <a-form-item v-for="(label, index) in (isEditModalVisible ? editForm.labels : addForm.labels)"
            :key="label.key" :label="index === 0 ? '分组标签' : ''">
            <div class="label-input-group">
              <a-input v-model:value="label.labelKey" placeholder="标签名" class="label-key-input" />
              <div class="label-separator">:</div>
              <a-input v-model:value="label.labelValue" placeholder="标签值" class="label-value-input" />
              <MinusCircleOutlined v-if="(isEditModalVisible ? editForm.labels : addForm.labels).length > 1"
                class="dynamic-delete-button"
                @click="isEditModalVisible ? removeEditLabel(label) : removeLabel(label)" />
            </div>
          </a-form-item>
          <a-form-item>
            <a-button type="dashed" class="add-dynamic-button"
              @click="isEditModalVisible ? addEditLabel() : addLabel()">
              <PlusOutlined />
              添加标签
            </a-button>
          </a-form-item>
        </div>

        <div class="form-section">
          <div class="section-title">注解配置</div>
          <a-form-item v-for="(annotation, index) in (isEditModalVisible ? editForm.annotations : addForm.annotations)"
            :key="annotation.key" :label="index === 0 ? '注解' : ''">
            <div class="label-input-group">
              <a-input v-model:value="annotation.labelKey" placeholder="注解名" class="label-key-input" />
              <div class="label-separator">:</div>
              <a-input v-model:value="annotation.labelValue" placeholder="注解值" class="label-value-input" />
              <MinusCircleOutlined v-if="(isEditModalVisible ? editForm.annotations : addForm.annotations).length > 1"
                class="dynamic-delete-button"
                @click="isEditModalVisible ? removeEditAnnotation(annotation) : removeAnnotation(annotation)" />
            </div>
          </a-form-item>
          <a-form-item>
            <a-button type="dashed" class="add-dynamic-button"
              @click="isEditModalVisible ? addEditAnnotation() : addAnnotation()">
              <PlusOutlined />
              添加注解
            </a-button>
          </a-form-item>
        </div>
      </a-form>
    </a-modal>

    <!-- 详情对话框 -->
    <a-modal :open="detailDialogVisible" title="AlertRule详情" :width="previewDialogWidth" :footer="null"
      @cancel="closeDetailDialog" class="detail-dialog">
      <div v-if="detailDialog.form" class="pool-details">
        <div class="detail-header">
          <h2>{{ detailDialog.form.name }}</h2>
          <div class="detail-badges">
            <a-tag :class="['tech-tag', `severity-${detailDialog.form.severity}`]">
              {{ detailDialog.form.severity }}
            </a-tag>
            <a-tag :color="detailDialog.form.enable === 1 ? 'success' : 'default'">
              {{ detailDialog.form.enable === 1 ? '启用' : '禁用' }}
            </a-tag>
          </div>
        </div>

        <a-descriptions bordered :column="1" :labelStyle="{ width: '150px' }">
          <a-descriptions-item label="ID">{{ detailDialog.form.id }}</a-descriptions-item>
          <a-descriptions-item label="表达式">{{ detailDialog.form.expr }}</a-descriptions-item>
          <a-descriptions-item label="持续时间">{{ detailDialog.form.for_time }}</a-descriptions-item>
          <a-descriptions-item label="目标地址">{{ detailDialog.form.ip_address }}</a-descriptions-item>
          <a-descriptions-item label="实例池">{{ getPoolName(detailDialog.form.pool_id) }}</a-descriptions-item>
          <a-descriptions-item label="发送组">{{ getSendGroupName(detailDialog.form.send_group_id) }}</a-descriptions-item>
          <a-descriptions-item label="创建人">{{ detailDialog.form.create_user_name }}</a-descriptions-item>
          <a-descriptions-item label="创建时间">{{ formatFullDateTime(detailDialog.form.created_at) }}</a-descriptions-item>
        </a-descriptions>

        <div class="detail-footer">
          <a-button @click="closeDetailDialog">关闭</a-button>
          <a-button type="primary" @click="showEditModal(detailDialog.form)">编辑</a-button>
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
  DownOutlined,
  MinusCircleOutlined
} from '@ant-design/icons-vue';
import { Icon } from '@iconify/vue';
import {
  getAlertRulesListApi,
  createAlertRuleApi,
  updateAlertRuleApi,
  deleteAlertRuleApi,
  validateExprApi,
  type GetAlertRulesListParams,
  type createAlertRuleReq,
  type updateAlertRuleReq,
  type validateExprApiReq
} from '#/api/core/prometheus_alert_rule';
import { getAlertManagerPoolListApi } from '#/api/core/prometheus_alert_pool';
import { getMonitorSendGroupListApi } from '#/api/core/prometheus_send_group';

// Define AlertRuleItem interface
interface AlertRuleItem {
  id: number;
  created_at: number;
  updated_at: number;
  deleted_at: number;
  name: string;
  pool_id: number;
  send_group_id: number;
  ip_address?: string;
  enable: number;
  expr: string;
  severity: string;
  grafana_link?: string;
  for_time: string;
  labels?: string[];
  annotations?: string[];
  creator_name?: string;
  create_user_name?: string;
}

interface ScrapePool {
  id: number;
  name: string;
}

interface SendGroup {
  id: number;
  name: string;
}

interface LabelItem {
  labelKey: string;
  labelValue: string;
  key: number;
}

// Menu event interface
interface MenuInfo {
  key: string;
  keyPath: string[];
  item: any;
  domEvent: MouseEvent;
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

const previewDialogWidth = computed(() => {
  if (typeof window !== 'undefined') {
    const width = window.innerWidth;
    if (width < 768) return '95%';
    if (width < 1024) return '90%';
    return '80%';
  }
  return '80%';
});

// 列定义
const columns = [
  { title: 'AlertRule名称', dataIndex: 'name', key: 'name', width: 200, fixed: 'left' },
  { title: '表达式', dataIndex: 'expr', key: 'expr', width: 250 },
  { title: '严重性', dataIndex: 'severity', key: 'severity', width: 100, align: 'center' as const },
  { title: '启用状态', dataIndex: 'enable', key: 'enable', width: 100, align: 'center' as const },
  { title: '标签', dataIndex: 'labels', key: 'labels', width: 200 },
  { title: '注解', dataIndex: 'annotations', key: 'annotations', width: 200 },
  { title: '实例配置', dataIndex: 'pool_config', key: 'pool_config', width: 180 },
  { title: '创建人', dataIndex: 'create_user_name', key: 'creator', width: 120 },
  { title: '创建时间', dataIndex: 'created_at', key: 'createdAt', width: 180 },
  { title: '操作', key: 'action', width: 200, align: 'center' as const, fixed: 'right' }
];

// 状态数据
const loading = ref(false);
const searchText = ref('');
const severityFilter = ref<'critical' | 'warning' | 'info' | undefined>(undefined);
const enableFilter = ref<1 | 2 | undefined>(undefined);
const data = ref<AlertRuleItem[]>([]);
const scrapePools = ref<ScrapePool[]>([]);
const sendGroups = ref<SendGroup[]>([]);

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
  critical: 0,
  warning: 0,
  info: 0,
  enabled: 0
});

// 对话框状态
const isAddModalVisible = ref(false);
const isEditModalVisible = ref(false);
const detailDialogVisible = ref(false);

// 详情对话框数据
const detailDialog = reactive({
  form: null as AlertRuleItem | null
});

// 新增表单
const addForm = reactive({
  name: '',
  pool_id: 0,
  send_group_id: 0,
  ip: '',
  port: '',
  enable: 1,
  expr: '',
  severity: '',
  grafana_link: '',
  for_time: '',
  labels: [
    { labelKey: 'severity', labelValue: '', key: Date.now() },
    { labelKey: 'alert_send_group', labelValue: '', key: Date.now() + 2 },
    { labelKey: 'alert_rule_id', labelValue: '', key: Date.now() + 3 }
  ] as LabelItem[],
  annotations: [
    { labelKey: 'severity', labelValue: '', key: Date.now() },
    { labelKey: 'alert_send_group', labelValue: '', key: Date.now() + 2 }
  ] as LabelItem[],
});

// 编辑表单
const editForm = reactive({
  id: 0,
  name: '',
  pool_id: 0,
  send_group_id: 0,
  ip: '',
  port: '',
  enable: 1,
  enableSwitch: true,
  expr: '',
  severity: '',
  grafana_link: '',
  for_time: '',
  labels: [{ labelKey: '', labelValue: '', key: Date.now() }] as LabelItem[],
  annotations: [{ labelKey: '', labelValue: '', key: Date.now() }] as LabelItem[],
});

// 计算属性来处理v-model绑定
const formName = computed({
  get: () => isEditModalVisible.value ? editForm.name : addForm.name,
  set: (val) => {
    if (isEditModalVisible.value) {
      editForm.name = val;
    } else {
      addForm.name = val;
    }
  }
});

const formPoolId = computed({
  get: () => isEditModalVisible.value ? editForm.pool_id : addForm.pool_id,
  set: (val) => {
    if (isEditModalVisible.value) {
      editForm.pool_id = val;
    } else {
      addForm.pool_id = val;
    }
  }
});

const formSendGroupId = computed({
  get: () => isEditModalVisible.value ? editForm.send_group_id : addForm.send_group_id,
  set: (val) => {
    if (isEditModalVisible.value) {
      editForm.send_group_id = val;
    } else {
      addForm.send_group_id = val;
    }
  }
});

const formIp = computed({
  get: () => isEditModalVisible.value ? editForm.ip : addForm.ip,
  set: (val) => {
    if (isEditModalVisible.value) {
      editForm.ip = val;
    } else {
      addForm.ip = val;
    }
  }
});

const formPort = computed({
  get: () => isEditModalVisible.value ? editForm.port : addForm.port,
  set: (val) => {
    if (isEditModalVisible.value) {
      editForm.port = val;
    } else {
      addForm.port = val;
    }
  }
});

const formExpr = computed({
  get: () => isEditModalVisible.value ? editForm.expr : addForm.expr,
  set: (val) => {
    if (isEditModalVisible.value) {
      editForm.expr = val;
    } else {
      addForm.expr = val;
    }
  }
});

const formSeverity = computed({
  get: () => isEditModalVisible.value ? editForm.severity : addForm.severity,
  set: (val) => {
    if (isEditModalVisible.value) {
      editForm.severity = val;
    } else {
      addForm.severity = val;
    }
  }
});

const formForTime = computed({
  get: () => isEditModalVisible.value ? editForm.for_time : addForm.for_time,
  set: (val) => {
    if (isEditModalVisible.value) {
      editForm.for_time = val;
    } else {
      addForm.for_time = val;
    }
  }
});

// 表单验证规则
const formRules = {
  name: [
    { required: true, message: '请输入名称', trigger: 'blur' },
    { min: 3, max: 50, message: '长度应为3到50个字符', trigger: 'blur' }
  ],
  pool_id: [
    { required: true, message: '请选择所属实例池', trigger: 'blur' }
  ],
  ip_address: [
    { required: true, message: '请输入IP地址和端口', trigger: 'blur' }
  ]
};

// 辅助方法
const getAlertStatusClass = (record: AlertRuleItem): string => {
  if (record.enable === 1 && record.severity === 'critical') return 'status-critical';
  if (record.enable === 1 && record.severity === 'warning') return 'status-warning';
  if (record.enable === 1) return 'status-enabled';
  return 'status-disabled';
};

const getPoolName = (poolId: number): string => {
  const pool = scrapePools.value.find(p => p.id === poolId);
  return pool ? pool.name : `ID: ${poolId}`;
};

const getSendGroupName = (groupId: number): string => {
  const group = sendGroups.value.find(g => g.id === groupId);
  return group ? group.name : `ID: ${groupId}`;
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

const formatFullDateTime = (timestamp: number): string => {
  if (!timestamp) return '';
  return new Date(timestamp * 1000).toLocaleString('zh-CN');
};

// 更新统计数据
const updateStats = () => {
  stats.total = data.value.length;
  stats.critical = data.value.filter(item => item.severity === 'critical').length;
  stats.warning = data.value.filter(item => item.severity === 'warning').length;
  stats.info = data.value.filter(item => item.severity === 'info').length;
  stats.enabled = data.value.filter(item => item.enable === 1).length;
};

// 数据加载
const fetchAlertRules = async (): Promise<void> => {
  loading.value = true;
  try {
    const params: GetAlertRulesListParams = {
      page: paginationConfig.current,
      size: paginationConfig.pageSize,
      search: searchText.value || undefined,
    };

    const response = await getAlertRulesListApi(params);
    if (response) {
      data.value = response.items || [];
      paginationConfig.total = response.total || 0;
      updateStats();
    }
  } catch (error: any) {
    console.error('加载AlertRule列表失败:', error);
    message.error(error.message || '加载AlertRule列表失败');
  } finally {
    loading.value = false;
  }
};

// 获取实例池数据
const fetchScrapePools = async () => {
  try {
    const response = await getAlertManagerPoolListApi({
      page: 1,
      size: 100,
      search: ''
    });
    scrapePools.value = response.items;
  } catch (error: any) {
    message.error(error.message || '获取实例池数据失败');
    console.error(error);
  }
};

// 获取发送组数据
const fetchSendGroups = async () => {
  try {
    const response = await getMonitorSendGroupListApi({
      page: 1,
      size: 100,
    });
    sendGroups.value = response.items;
  } catch (error: any) {
    message.error(error.message || '获取发送组数据失败');
    console.error(error);
  }
};

// 事件处理
const handleTableChange = (pagination: any): void => {
  paginationConfig.current = pagination.current;
  paginationConfig.pageSize = pagination.pageSize;
  fetchAlertRules();
};

const handleSearch = (): void => {
  paginationConfig.current = 1;
  fetchAlertRules();
};

const handleSearchChange = (): void => {
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }
  searchTimeout = setTimeout(() => {
    paginationConfig.current = 1;
    fetchAlertRules();
  }, 500);
};

const handleSeverityChange = (): void => {
  paginationConfig.current = 1;
  fetchAlertRules();
};

const handleEnableChange = (): void => {
  paginationConfig.current = 1;
  fetchAlertRules();
};

const handleReset = (): void => {
  searchText.value = '';
  severityFilter.value = undefined;
  enableFilter.value = undefined;
  paginationConfig.current = 1;
  fetchAlertRules();
  message.success('过滤条件已重置');
};

const showAddModal = (): void => {
  isAddModalVisible.value = true;
  resetAddForm();
};

const showEditModal = (record: AlertRuleItem): void => {
  isEditModalVisible.value = true;
  const ipParts = record.ip_address?.split(':') || ['', ''];

  Object.assign(editForm, {
    id: record.id,
    name: record.name,
    pool_id: record.pool_id || 0,
    send_group_id: record.send_group_id || 0,
    ip: ipParts[0] || '',
    port: ipParts[1] || '',
    enable: record.enable,
    enableSwitch: record.enable === 1,
    expr: record.expr,
    severity: record.severity,
    grafana_link: record.grafana_link || '',
    for_time: record.for_time,
    labels: record.labels ? record.labels.map((value: string) => {
      const [labelKey, labelValue] = value.split(',');
      return {
        labelKey: labelKey || '',
        labelValue: labelValue || '',
        key: Date.now() + Math.random()
      };
    }) : [{ labelKey: '', labelValue: '', key: Date.now() }],
    annotations: record.annotations ? record.annotations.map((value: string) => {
      const [labelKey, labelValue] = value.split(',');
      return {
        labelKey: labelKey || '',
        labelValue: labelValue || '',
        key: Date.now() + Math.random()
      };
    }) : [{ labelKey: '', labelValue: '', key: Date.now() }],
  });

  detailDialogVisible.value = false;
};

const handleViewAlert = (record: AlertRuleItem): void => {
  detailDialog.form = record;
  detailDialogVisible.value = true;
};

const handleMenuClick = (command: string, record: AlertRuleItem): void => {
  switch (command) {
    case 'clone':
      message.info('克隆功能暂未实现');
      break;
    case 'delete':
      confirmDelete(record);
      break;
  }
};

const confirmDelete = (record: AlertRuleItem): void => {
  Modal.confirm({
    title: '警告',
    content: `确定要删除AlertRule "${record.name}" 吗？`,
    okText: '删除',
    okType: 'danger',
    cancelText: '取消',
    async onOk() {
      try {
        await deleteAlertRuleApi(record.id);
        message.success(`AlertRule "${record.name}" 已删除`);
        fetchAlertRules();
      } catch (error: any) {
        console.error('删除AlertRule失败:', error);
        message.error(error.message || '删除AlertRule失败');
      }
    }
  });
};

// 表单保存
const handleAdd = async (): Promise<void> => {
  if (!addForm.name.trim() || addForm.pool_id === 0) {
    message.error('请填写所有必填项');
    return;
  }

  if (!addForm.ip || !addForm.port) {
    message.error('请填写IP地址和端口');
    return;
  }

  try {
    const ip_address = `${addForm.ip}:${addForm.port}`;

    const formData: createAlertRuleReq = {
      name: addForm.name,
      pool_id: addForm.pool_id,
      send_group_id: addForm.send_group_id,
      ip_address,
      enable: addForm.enable,
      expr: addForm.expr,
      severity: addForm.severity,
      grafana_link: addForm.grafana_link,
      for_time: addForm.for_time,
      labels: addForm.labels
        .filter(item => item.labelKey.trim() !== '' && item.labelValue.trim() !== '')
        .map(item => `${item.labelKey},${item.labelValue}`),
      annotations: addForm.annotations
        .filter(item => item.labelKey.trim() !== '' && item.labelValue.trim() !== '')
        .map(item => `${item.labelKey},${item.labelValue}`),
    };

    await createAlertRuleApi(formData);
    message.success(`AlertRule "${addForm.name}" 已创建`);
    isAddModalVisible.value = false;
    fetchAlertRules();
  } catch (error: any) {
    console.error('保存AlertRule失败:', error);
    message.error(error.message || '保存AlertRule失败');
  }
};

const handleEdit = async (): Promise<void> => {
  if (!editForm.name.trim() || editForm.pool_id === 0) {
    message.error('请填写所有必填项');
    return;
  }

  if (!editForm.ip || !editForm.port) {
    message.error('请填写IP地址和端口');
    return;
  }

  try {
    const ip_address = `${editForm.ip}:${editForm.port}`;

    const formData: updateAlertRuleReq = {
      id: editForm.id,
      name: editForm.name,
      pool_id: editForm.pool_id,
      send_group_id: editForm.send_group_id,
      ip_address,
      enable: editForm.enable,
      expr: editForm.expr,
      severity: editForm.severity,
      grafana_link: editForm.grafana_link,
      for_time: editForm.for_time,
      labels: editForm.labels
        .filter(item => item.labelKey.trim() !== '' && item.labelValue.trim() !== '')
        .map(item => `${item.labelKey},${item.labelValue}`),
      annotations: editForm.annotations
        .filter(item => item.labelKey.trim() !== '' && item.labelValue.trim() !== '')
        .map(item => `${item.labelKey},${item.labelValue}`),
    };

    await updateAlertRuleApi(formData);
    message.success(`AlertRule "${editForm.name}" 已更新`);
    isEditModalVisible.value = false;
    fetchAlertRules();
  } catch (error: any) {
    console.error('更新AlertRule失败:', error);
    message.error(error.message || '更新AlertRule失败');
  }
};

// 重置表单
const resetAddForm = (): void => {
  addForm.name = '';
  addForm.pool_id = 0;
  addForm.send_group_id = 0;
  addForm.ip = '';
  addForm.port = '';
  addForm.enable = 1;
  addForm.expr = '';
  addForm.severity = '';
  addForm.grafana_link = '';
  addForm.for_time = '';
  addForm.labels = [
    { labelKey: 'severity', labelValue: '', key: Date.now() },
    { labelKey: 'alert_send_group', labelValue: '', key: Date.now() + 2 },
    { labelKey: 'alert_rule_id', labelValue: '', key: Date.now() + 3 }
  ];
  addForm.annotations = [
    { labelKey: 'severity', labelValue: '', key: Date.now() },
    { labelKey: 'alert_send_group', labelValue: '', key: Date.now() + 2 }
  ];
};

// 动态表单项操作
const addLabel = (): void => {
  addForm.labels.push({
    labelKey: '',
    labelValue: '',
    key: Date.now(),
  });
};

const removeLabel = (item: LabelItem): void => {
  const index = addForm.labels.indexOf(item);
  if (index !== -1) {
    addForm.labels.splice(index, 1);
  }
};

const addEditLabel = (): void => {
  editForm.labels.push({
    labelKey: '',
    labelValue: '',
    key: Date.now(),
  });
};

const removeEditLabel = (item: LabelItem): void => {
  const index = editForm.labels.indexOf(item);
  if (index !== -1) {
    editForm.labels.splice(index, 1);
  }
};

const addAnnotation = (): void => {
  addForm.annotations.push({
    labelKey: '',
    labelValue: '',
    key: Date.now(),
  });
};

const removeAnnotation = (item: LabelItem): void => {
  const index = addForm.annotations.indexOf(item);
  if (index !== -1) {
    addForm.annotations.splice(index, 1);
  }
};

const addEditAnnotation = (): void => {
  editForm.annotations.push({
    labelKey: '',
    labelValue: '',
    key: Date.now(),
  });
};

const removeEditAnnotation = (item: LabelItem): void => {
  const index = editForm.annotations.indexOf(item);
  if (index !== -1) {
    editForm.annotations.splice(index, 1);
  }
};

// 验证表达式的方法
const validateAddExpression = async (expr: string) => {
  try {
    const payload: validateExprApiReq = { promql_expr: expr };
    const result = await validateExprApi(payload);
    message.success('验证表达式成功');
    return true;
  } catch (error: any) {
    message.error(error.message || '验证表达式失败');
    console.error(error);
    return false;
  }
};

const validateEditExpression = async () => {
  try {
    const payload: validateExprApiReq = { promql_expr: editForm.expr };
    const result = await validateExprApi(payload);
    message.success('验证表达式成功');
    return true;
  } catch (error: any) {
    message.error(error.message || '验证表达式失败');
    console.error(error);
    return false;
  }
};

// 对话框关闭
const closeFormDialog = (): void => {
  isAddModalVisible.value = false;
  isEditModalVisible.value = false;
};

const closeDetailDialog = (): void => {
  detailDialogVisible.value = false;
};

// 生命周期钩子
onMounted(() => {
  fetchAlertRules();
  fetchScrapePools();
  fetchSendGroups();
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

.filter-select {
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

.status-critical {
  background-color: #cf1322;
}

.status-warning {
  background-color: #faad14;
}

.status-enabled {
  background-color: #52c41a;
}

.status-disabled {
  background-color: #d9d9d9;
}

.pool-name-text {
  font-weight: 500;
  word-break: break-all;
}

.expr-container {
  max-width: 250px;
  word-break: break-all;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tag-container {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
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

.severity-critical {
  background-color: #fff1f0;
  color: #cf1322;
  border-left: 3px solid #ff4d4f;
}

.severity-warning {
  background-color: #fff7e6;
  color: #d46b08;
  border-left: 3px solid #fa8c16;
}

.severity-info {
  background-color: #e6f7ff;
  color: #0958d9;
  border-left: 3px solid #1890ff;
}

.label-tag {
  background-color: #f6ffed;
  color: #389e0d;
  border-left: 3px solid #52c41a;
}

.annotation-tag {
  background-color: #f0f5ff;
  color: #1d39c4;
  border-left: 3px solid #2f54eb;
}

.empty-text {
  color: #999;
  font-style: italic;
  font-size: 12px;
}

.label-key {
  font-weight: 600;
}

.label-separator {
  margin: 0 4px;
  color: #8c8c8c;
}

.label-value {
  color: #555;
}

.config-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.config-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.config-label {
  font-size: 12px;
  color: #666;
}

.config-value {
  font-size: 12px;
  font-weight: 500;
  color: #333;
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

/* IP地址和端口输入框样式 */
.ip-port-container {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ip-input {
  flex: 3;
}

.port-input {
  flex: 1;
}

.separator {
  font-weight: bold;
  color: #8c8c8c;
  font-size: 16px;
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

.tech-switch {
  background-color: rgba(0, 0, 0, 0.25);
}

.tech-switch.ant-switch-checked {
  background: linear-gradient(45deg, #1890ff, #36cfc9);
}

.dynamic-input-container {
  display: flex;
  align-items: center;
  gap: 12px;
}

.dynamic-input {
  width: 100%;
}

.dynamic-delete-button {
  cursor: pointer;
  color: #ff4d4f;
  font-size: 18px;
  transition: all 0.3s;
}

.dynamic-delete-button:hover {
  color: #cf1322;
  transform: scale(1.1);
}

.add-dynamic-button {
  width: 100%;
  margin-top: 8px;
  background: #f5f5f5;
  border: 1px dashed #d9d9d9;
  color: #595959;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.add-dynamic-button:hover {
  color: #1890ff;
  border-color: #1890ff;
  background: #f0f7ff;
}

.label-input-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.label-key-input,
.label-value-input {
  flex: 1;
}

.label-separator {
  font-weight: bold;
  color: #8c8c8c;
}

/* 详情对话框样式 */
.detail-dialog .pool-details {
  margin-bottom: 20px;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.detail-header h2 {
  margin: 0;
  font-size: 24px;
  color: #1f2937;
  word-break: break-all;
}

.detail-badges {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.detail-footer {
  margin-top: 24px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  flex-wrap: wrap;
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

  .filter-select {
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
}

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
