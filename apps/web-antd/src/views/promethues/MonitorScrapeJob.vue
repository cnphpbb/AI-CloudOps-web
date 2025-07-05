<template>
  <div class="scrape-job-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="header-actions">
        <a-button type="primary" @click="handleCreateScrapeJob" class="btn-create">
          <template #icon>
            <PlusOutlined />
          </template>
          <span class="btn-text">创建采集任务</span>
        </a-button>
        <div class="search-filters">
          <a-input-search v-model:value="searchQuery" placeholder="搜索采集任务名称..." class="search-input"
            @search="handleSearch" @change="handleSearchChange" allow-clear />
          <a-select v-model:value="enableFilter" placeholder="启用状态" class="filter-select" @change="handleEnableChange"
            allow-clear>
            <a-select-option :value="undefined">全部</a-select-option>
            <a-select-option :value="1">启用</a-select-option>
            <a-select-option :value="2">禁用</a-select-option>
          </a-select>
          <a-select v-model:value="poolFilter" placeholder="采集池" class="filter-select" @change="handlePoolChange"
            allow-clear>
            <a-select-option :value="undefined">全部</a-select-option>
            <a-select-option v-for="pool in pools" :key="pool.id" :value="pool.id">
              {{ pool.name }}
            </a-select-option>
          </a-select>
          <a-button @click="handleResetFilters" class="reset-btn">
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
            <a-statistic title="总采集任务" :value="stats.total" :value-style="{ color: '#3f8600' }">
              <template #prefix>
                <Icon icon="carbon:task" />
              </template>
            </a-statistic>
          </a-card>
        </a-col>
        <a-col :xs="12" :sm="6" :md="6" :lg="6">
          <a-card class="stats-card">
            <a-statistic title="已启用" :value="stats.enabled" :value-style="{ color: '#52c41a' }">
              <template #prefix>
                <Icon icon="carbon:checkmark" />
              </template>
            </a-statistic>
          </a-card>
        </a-col>
        <a-col :xs="12" :sm="6" :md="6" :lg="6">
          <a-card class="stats-card">
            <a-statistic title="Kubernetes" :value="stats.k8sJobs" :value-style="{ color: '#faad14' }">
              <template #prefix>
                <Icon icon="carbon:logo-kubernetes" />
              </template>
            </a-statistic>
          </a-card>
        </a-col>
        <a-col :xs="12" :sm="6" :md="6" :lg="6">
          <a-card class="stats-card">
            <a-statistic title="HTTP任务" :value="stats.httpJobs" :value-style="{ color: '#cf1322' }">
              <template #prefix>
                <Icon icon="carbon:http" />
              </template>
            </a-statistic>
          </a-card>
        </a-col>
      </a-row>
    </div>

    <!-- 表格容器 -->
    <div class="table-container">
      <a-card>
        <a-table :data-source="scrapeJobList" :columns="columns" :pagination="paginationConfig" :loading="loading"
          row-key="id" bordered :scroll="{ x: 1400 }" @change="handleTableChange">
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'name'">
              <div class="job-name-cell">
                <div class="job-badge" :class="getJobStatusClass(record)"></div>
                <span class="job-name-text">{{ record.name }}</span>
              </div>
            </template>

            <template v-if="column.key === 'service_discovery_type'">
              <a-tag :color="record.service_discovery_type === 'k8s' ? 'blue' : 'green'" class="tech-tag">
                {{ record.service_discovery_type === 'k8s' ? 'Kubernetes' : 'HTTP' }}
              </a-tag>
            </template>

            <template v-if="column.key === 'enable'">
              <a-tag :color="record.enable === 1 ? 'success' : 'default'">
                {{ record.enable === 1 ? '启用' : '禁用' }}
              </a-tag>
            </template>

            <template v-if="column.key === 'pool_id'">
              <a-tag color="purple" class="tech-tag">
                {{ getPoolName(record.pool_id) }}
              </a-tag>
            </template>

            <template v-if="column.key === 'target_info'">
              <div class="target-info">
                <div class="target-item">
                  <span class="target-label">地址:</span>
                  <span class="target-value">{{ record.ip_address }}:{{ record.port }}</span>
                </div>
                <div class="target-item">
                  <span class="target-label">路径:</span>
                  <span class="target-value">{{ record.metrics_path }}</span>
                </div>
              </div>
            </template>

            <template v-if="column.key === 'scrape_config'">
              <div class="config-info">
                <div class="config-item">
                  <span class="config-label">间隔:</span>
                  <span class="config-value">{{ record.scrape_interval }}s</span>
                </div>
                <div class="config-item">
                  <span class="config-label">超时:</span>
                  <span class="config-value">{{ record.scrape_timeout }}s</span>
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
                <a-button type="primary" size="small" @click="handleViewScrapeJob(record)">
                  查看
                </a-button>
                <a-button type="default" size="small" @click="handleEditScrapeJob(record)">
                  编辑
                </a-button>
                <a-dropdown>
                  <template #overlay>
                    <a-menu @click="(e: any) => handleMenuClick(e.key, record)">
                      <a-menu-item key="toggle">
                        <Icon :icon="record.enable === 1 ? 'carbon:pause' : 'carbon:play'" />
                        {{ record.enable === 1 ? '禁用' : '启用' }}
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

    <!-- 创建/编辑采集任务对话框 -->
    <a-modal :open="formDialogVisible" :title="formDialog.isEdit ? '编辑采集任务' : '创建采集任务'" :width="formDialogWidth"
      @ok="saveScrapeJob" @cancel="closeFormDialog" :destroy-on-close="true" class="responsive-modal scrape-job-modal">
      <a-form ref="formRef" :model="formDialog.form" :rules="formRules" layout="vertical">
        <div class="form-section">
          <div class="section-title">基本信息</div>
          <a-row :gutter="16">
            <a-col :xs="24" :sm="12">
              <a-form-item label="采集任务名称" name="name" :rules="[{ required: true, message: '请输入采集任务名称' }]">
                <a-input v-model:value="formDialog.form.name" placeholder="请输入采集任务名称" />
              </a-form-item>
            </a-col>
            <a-col :xs="24" :sm="12">
              <a-form-item label="启用状态" name="enable">
                <a-switch v-model:checked="formDialog.form.enableSwitch" class="tech-switch" :checked-children="'启用'"
                  :un-checked-children="'禁用'" />
              </a-form-item>
            </a-col>
          </a-row>
        </div>

        <div class="form-section">
          <div class="section-title">服务配置</div>
          <a-row :gutter="16">
            <a-col :xs="24" :sm="12">
              <a-form-item label="服务发现类型" name="service_discovery_type"
                :rules="[{ required: true, message: '请选择服务发现类型' }]">
                <a-select v-model:value="formDialog.form.service_discovery_type" placeholder="请选择服务发现类型">
                  <a-select-option value="http">HTTP</a-select-option>
                  <a-select-option value="k8s">Kubernetes</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :xs="24" :sm="12">
              <a-form-item label="协议方案" name="scheme" :rules="[{ required: true, message: '请选择协议方案' }]">
                <a-select v-model:value="formDialog.form.scheme" placeholder="请选择协议方案">
                  <a-select-option value="http">HTTP</a-select-option>
                  <a-select-option value="https">HTTPS</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
          </a-row>

          <a-row :gutter="16">
            <a-col :xs="24" :sm="12">
              <a-form-item label="监控采集路径" name="metrics_path" :rules="[{ required: true, message: '请输入监控采集路径' }]">
                <a-input v-model:value="formDialog.form.metrics_path" placeholder="请输入监控采集路径" />
              </a-form-item>
            </a-col>
            <a-col :xs="24" :sm="12">
              <a-form-item label="关联采集池" name="pool_id" :rules="[{ required: true, message: '请选择关联采集池' }]">
                <a-select v-model:value="formDialog.form.pool_id" placeholder="请选择关联采集池">
                  <a-select-option v-for="pool in pools" :key="pool.id" :value="pool.id">
                    {{ pool.name }}
                  </a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
          </a-row>
        </div>

        <div class="form-section">
          <div class="section-title">采集配置</div>
          <a-row :gutter="16">
            <a-col :xs="24" :sm="12">
              <a-form-item label="采集间隔（秒）" name="scrape_interval" :rules="[
                { required: true, message: '请输入采集间隔' },
                { type: 'number', min: 1, message: '采集间隔必须大于0' }
              ]">
                <a-input-number v-model:value="formDialog.form.scrape_interval" :min="1" class="full-width"
                  placeholder="请输入采集间隔（秒）" />
              </a-form-item>
            </a-col>
            <a-col :xs="24" :sm="12">
              <a-form-item label="采集超时（秒）" name="scrape_timeout" :rules="[
                { required: true, message: '请输入采集超时' },
                { type: 'number', min: 1, message: '采集超时必须大于0' }
              ]">
                <a-input-number v-model:value="formDialog.form.scrape_timeout" :min="1" class="full-width"
                  placeholder="请输入采集超时（秒）" />
              </a-form-item>
            </a-col>
          </a-row>

          <a-row :gutter="16">
            <a-col :xs="24" :sm="12">
              <a-form-item label="刷新间隔（秒）" name="refresh_interval" :rules="[
                { required: true, message: '请输入刷新间隔' },
                { type: 'number', min: 1, message: '刷新间隔必须大于0' }
              ]">
                <a-input-number v-model:value="formDialog.form.refresh_interval" :min="1" class="full-width"
                  placeholder="请输入刷新间隔（秒）" />
              </a-form-item>
            </a-col>
            <a-col :xs="24" :sm="12">
              <a-form-item label="端口" name="port" :rules="[
                { required: true, message: '请输入端口' },
                { type: 'number', min: 1, max: 65535, message: '端口必须在1-65535之间' }
              ]">
                <a-input-number v-model:value="formDialog.form.port" :min="1" :max="65535" class="full-width"
                  placeholder="请输入端口" />
              </a-form-item>
            </a-col>
          </a-row>
        </div>

        <div class="form-section">
          <div class="section-title">目标地址配置</div>
          <a-form-item label="IP地址" name="ip_address" :rules="[
            { required: true, message: '请输入IP地址' },
            { pattern: /^(\d{1,3}\.){3}\d{1,3}$/, message: '请输入正确的IP地址格式' }
          ]">
            <a-input v-model:value="formDialog.form.ip_address" placeholder="请输入IP地址，如：192.168.1.100" />
            <div class="form-help-text">
              <Icon icon="ant-design:info-circle-outlined" />
              请输入单个IP地址，端口配置在上方端口字段
            </div>
          </a-form-item>
        </div>

        <!-- Kubernetes配置（当选择k8s时显示） -->
        <div v-if="formDialog.form.service_discovery_type === 'k8s'" class="form-section">
          <div class="section-title">Kubernetes配置</div>
          <a-row :gutter="16">
            <a-col :xs="24" :sm="12">
              <a-form-item label="Kubernetes角色" name="kubernetes_sd_role">
                <a-select v-model:value="formDialog.form.kubernetes_sd_role" placeholder="请选择Kubernetes角色">
                  <a-select-option value="pod">Pod</a-select-option>
                  <a-select-option value="service">Service</a-select-option>
                  <a-select-option value="endpoints">Endpoints</a-select-option>
                  <a-select-option value="node">Node</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :xs="24" :sm="12">
              <a-form-item label="KubeConfig文件路径" name="kube_config_file_path">
                <a-input v-model:value="formDialog.form.kube_config_file_path" placeholder="请输入KubeConfig文件路径" />
              </a-form-item>
            </a-col>
          </a-row>
        </div>

        <!-- 安全配置 -->
        <div class="form-section">
          <div class="section-title">安全配置</div>
          <a-row :gutter="16">
            <a-col :xs="24" :sm="12">
              <a-form-item label="TLS CA文件路径" name="tls_ca_file_path">
                <a-input v-model:value="formDialog.form.tls_ca_file_path" placeholder="请输入TLS CA文件路径" />
              </a-form-item>
            </a-col>
            <a-col :xs="24" :sm="12">
              <a-form-item label="Bearer Token" name="bearer_token">
                <a-input v-model:value="formDialog.form.bearer_token" placeholder="请输入Bearer Token" />
              </a-form-item>
            </a-col>
          </a-row>
          <a-row :gutter="16">
            <a-col :span="24">
              <a-form-item label="TLS CA内容" name="tls_ca_content">
                <a-textarea v-model:value="formDialog.form.tls_ca_content" placeholder="请输入TLS CA证书内容" :rows="4" />
              </a-form-item>
            </a-col>
          </a-row>
        </div>

        <!-- 高级配置 -->
        <div class="form-section">
          <div class="section-title">高级配置</div>
          <a-form-item label="Relabel配置（YAML）" name="relabel_configs_yaml_string">
            <a-textarea v-model:value="formDialog.form.relabel_configs_yaml_string" placeholder="请输入Relabel配置（YAML格式）"
              :rows="6" />
          </a-form-item>
        </div>
      </a-form>
    </a-modal>

    <!-- 详情对话框 -->
    <a-modal :open="detailDialogVisible" title="采集任务详情" :width="previewDialogWidth" :footer="null"
      @cancel="closeDetailDialog" class="detail-dialog">
      <div v-if="detailDialog.form" class="job-details">
        <div class="detail-header">
          <h2>{{ detailDialog.form.name }}</h2>
          <div class="detail-badges">
            <a-tag :color="detailDialog.form.enable === 1 ? 'success' : 'default'">
              {{ detailDialog.form.enable === 1 ? '已启用' : '已禁用' }}
            </a-tag>
            <a-tag :color="detailDialog.form.service_discovery_type === 'k8s' ? 'blue' : 'green'">
              {{ detailDialog.form.service_discovery_type === 'k8s' ? 'Kubernetes' : 'HTTP' }}
            </a-tag>
          </div>
        </div>

        <a-descriptions bordered :column="1" :labelStyle="{ width: '150px' }">
          <a-descriptions-item label="ID">{{ detailDialog.form.id }}</a-descriptions-item>
          <a-descriptions-item label="服务发现类型">{{ detailDialog.form.service_discovery_type }}</a-descriptions-item>
          <a-descriptions-item label="协议方案">{{ detailDialog.form.scheme }}</a-descriptions-item>
          <a-descriptions-item label="监控路径">{{ detailDialog.form.metrics_path }}</a-descriptions-item>
          <a-descriptions-item label="目标地址">{{ detailDialog.form.ip_address }}:{{ detailDialog.form.port
          }}</a-descriptions-item>
          <a-descriptions-item label="采集间隔">{{ detailDialog.form.scrape_interval }}秒</a-descriptions-item>
          <a-descriptions-item label="采集超时">{{ detailDialog.form.scrape_timeout }}秒</a-descriptions-item>
          <a-descriptions-item label="刷新间隔">{{ detailDialog.form.refresh_interval }}秒</a-descriptions-item>
          <a-descriptions-item label="关联采集池">{{ getPoolName(detailDialog.form.pool_id) }}</a-descriptions-item>
          <a-descriptions-item label="创建人">{{ detailDialog.form.create_user_name }}</a-descriptions-item>
          <a-descriptions-item label="创建时间">{{ formatFullDateTime(detailDialog.form.created_at || '')
          }}</a-descriptions-item>
          <a-descriptions-item v-if="detailDialog.form.service_discovery_type === 'k8s'" label="Kubernetes角色">
            {{ detailDialog.form.kubernetes_sd_role || '未配置' }}
          </a-descriptions-item>
          <a-descriptions-item v-if="detailDialog.form.service_discovery_type === 'k8s'" label="KubeConfig路径">
            {{ detailDialog.form.kube_config_file_path || '未配置' }}
          </a-descriptions-item>
          <a-descriptions-item v-if="detailDialog.form.tls_ca_file_path" label="TLS CA文件">
            {{ detailDialog.form.tls_ca_file_path }}
          </a-descriptions-item>
          <a-descriptions-item v-if="detailDialog.form.bearer_token" label="Bearer Token">
            ******
          </a-descriptions-item>
        </a-descriptions>

        <div class="detail-footer">
          <a-button @click="closeDetailDialog">关闭</a-button>
          <a-button type="primary" @click="handleEditScrapeJob(detailDialog.form)">编辑</a-button>
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
  DownOutlined
} from '@ant-design/icons-vue';
import { Icon } from '@iconify/vue';
import {
  getMonitorScrapeJobListApi,
  createScrapeJobApi,
  updateScrapeJobApi,
  deleteScrapeJobApi,
  type MonitorScrapeJobItem,
  type GetScrapeJobListParams,
  type createScrapeJobReq,
  type updateScrapeJobReq
} from '#/api/core/prometheus_scrape_job';
import { getMonitorScrapePoolListApi } from '#/api/core/prometheus_scrape_pool';

// 采集池接口
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
  { title: '任务名称', dataIndex: 'name', key: 'name', width: 200, fixed: 'left' },
  { title: '服务发现', dataIndex: 'service_discovery_type', key: 'service_discovery_type', width: 120 },
  { title: '启用状态', dataIndex: 'enable', key: 'enable', width: 100, align: 'center' as const },
  { title: '关联采集池', dataIndex: 'pool_id', key: 'pool_id', width: 120 },
  { title: '目标信息', dataIndex: 'target_info', key: 'target_info', width: 200 },
  { title: '采集配置', dataIndex: 'scrape_config', key: 'scrape_config', width: 120 },
  { title: '创建人', dataIndex: 'create_user_name', key: 'creator', width: 120 },
  { title: '创建时间', dataIndex: 'created_at', key: 'createdAt', width: 180 },
  { title: '操作', key: 'action', width: 200, align: 'center' as const, fixed: 'right' }
];

// 状态数据
const loading = ref(false);
const searchQuery = ref('');
const enableFilter = ref<1 | 2 | undefined>(undefined);
const poolFilter = ref<number | undefined>(undefined);
const scrapeJobList = ref<MonitorScrapeJobItem[]>([]);
const pools = ref<Pool[]>([]);

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
  k8sJobs: 0,
  httpJobs: 0
});

// 对话框状态
const formDialogVisible = ref(false);
const detailDialogVisible = ref(false);

// 表单对话框数据
const formDialog = reactive({
  isEdit: false,
  form: {
    id: undefined as number | undefined,
    name: '',
    enableSwitch: true,
    enable: 1 as 1 | 2,
    service_discovery_type: 'http',
    metrics_path: '/metrics',
    scheme: 'http',
    scrape_interval: 15,
    scrape_timeout: 5,
    pool_id: null as number | null,
    refresh_interval: 30,
    port: 9100,
    ip_address: '',
    relabel_configs_yaml_string: '',
    kube_config_file_path: '',
    tls_ca_file_path: '',
    tls_ca_content: '',
    bearer_token: '',
    bearer_token_file: '',
    kubernetes_sd_role: '',
  }
});

// 详情对话框数据
const detailDialog = reactive({
  form: null as MonitorScrapeJobItem | null
});

// 表单验证规则
const formRules = {
  name: [
    { required: true, message: '请输入采集任务名称', trigger: 'blur' },
    { min: 3, max: 50, message: '长度应为3到50个字符', trigger: 'blur' }
  ],
  service_discovery_type: [
    { required: true, message: '请选择服务发现类型', trigger: 'change' }
  ],
  scheme: [
    { required: true, message: '请选择协议方案', trigger: 'change' }
  ],
  metrics_path: [
    { required: true, message: '请输入监控采集路径', trigger: 'blur' }
  ],
  pool_id: [
    { required: true, message: '请选择关联采集池', trigger: 'change' }
  ],
  scrape_interval: [
    { required: true, message: '请输入采集间隔', trigger: 'blur' }
  ],
  scrape_timeout: [
    { required: true, message: '请输入采集超时', trigger: 'blur' }
  ],
  refresh_interval: [
    { required: true, message: '请输入刷新间隔', trigger: 'blur' }
  ],
  port: [
    { required: true, message: '请输入端口', trigger: 'blur' }
  ],
  ip_address: [
    { required: true, message: '请输入IP地址', trigger: 'blur' },
    { pattern: /^(\d{1,3}\.){3}\d{1,3}$/, message: '请输入正确的IP地址格式', trigger: 'blur' }
  ]
};

// 辅助方法
const getJobStatusClass = (record: MonitorScrapeJobItem): string => {
  if (record.enable === 1) return 'status-enabled';
  return 'status-disabled';
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

const formatDate = (timestamp: string): string => {
  if (!timestamp) return '';
  return new Date(timestamp).toLocaleDateString('zh-CN');
};

const formatTime = (timestamp: string): string => {
  if (!timestamp) return '';
  return new Date(timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
};

const formatFullDateTime = (timestamp: string): string => {
  if (!timestamp) return '';
  return new Date(timestamp).toLocaleString('zh-CN');
};

const getPoolName = (poolId: number): string => {
  const pool = pools.value.find(p => p.id === poolId);
  return pool ? pool.name : '未知';
};

// 更新统计数据
const updateStats = () => {
  // 当前页数据统计
  const currentPageEnabled = scrapeJobList.value.filter(item => item.enable === 1).length;
  const currentPageK8sJobs = scrapeJobList.value.filter(item => item.service_discovery_type === 'k8s').length;
  const currentPageHttpJobs = scrapeJobList.value.filter(item => item.service_discovery_type === 'http').length;

  // 使用后端返回的总数
  stats.total = paginationConfig.total;

  // 估算总体比例（基于当前页）
  if (scrapeJobList.value.length > 0) {
    const enabledRatio = currentPageEnabled / scrapeJobList.value.length;
    const k8sRatio = currentPageK8sJobs / scrapeJobList.value.length;
    const httpRatio = currentPageHttpJobs / scrapeJobList.value.length;

    stats.enabled = Math.round(enabledRatio * paginationConfig.total);
    stats.k8sJobs = Math.round(k8sRatio * paginationConfig.total);
    stats.httpJobs = Math.round(httpRatio * paginationConfig.total);
  } else {
    stats.enabled = 0;
    stats.k8sJobs = 0;
    stats.httpJobs = 0;
  }
};

// 数据加载
const loadScrapeJobList = async (): Promise<void> => {
  loading.value = true;
  try {
    const params: GetScrapeJobListParams = {
      page: paginationConfig.current,
      page_size: paginationConfig.pageSize,
      search: searchQuery.value || undefined,
      enable: enableFilter.value,
      pool_id: poolFilter.value
    };

    const response = await getMonitorScrapeJobListApi(params);
    if (response && response.items) {
      scrapeJobList.value = response.items.map((item: any) => ({
        ...item,
        ip_address: Array.isArray(item.ip_address) ? item.ip_address[0] || '' : (item.ip_address || '')
      }));
      paginationConfig.total = response.total || 0;
      updateStats();
    } else {
      scrapeJobList.value = [];
      paginationConfig.total = 0;
    }
  } catch (error: any) {
    console.error('加载采集任务列表失败:', error);
    message.error(error.message || '加载采集任务列表失败');
  } finally {
    loading.value = false;
  }
};

// 获取采集池数据
const loadPools = async (): Promise<void> => {
  try {
    let allPools: Pool[] = [];
    let currentPage = 1;
    const pageSize = 100;
    let hasMoreData = true;

    while (hasMoreData) {
      const response = await getMonitorScrapePoolListApi({
        page: currentPage,
        size: pageSize,
        search: '',
        support_alert: 1,
        support_record: 1,
      });

      if (response && response.items && response.items.length > 0) {
        const pagePools = response.items.map((pool: any) => ({
          id: pool.id,
          name: pool.name,
        }));

        allPools = [...allPools, ...pagePools];

        // 检查是否还有更多数据
        if (response.items.length < pageSize || allPools.length >= (response.total || 0)) {
          hasMoreData = false;
        } else {
          currentPage++;
        }
      } else {
        hasMoreData = false;
      }
    }

    pools.value = allPools;
  } catch (error: any) {
    pools.value = [];
    message.error(error.message || '获取采集池数据失败');
  }
};

// 事件处理
const handleTableChange = (pagination: any, filters: any, sorter: any): void => {
  paginationConfig.current = pagination.current;
  paginationConfig.pageSize = pagination.pageSize;
  loadScrapeJobList();
};

const handleSearch = (): void => {
  paginationConfig.current = 1;
  loadScrapeJobList();
};

const handleSearchChange = (): void => {
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }
  searchTimeout = setTimeout(() => {
    paginationConfig.current = 1;
    loadScrapeJobList();
  }, 500);
};

const handleEnableChange = (): void => {
  paginationConfig.current = 1;
  loadScrapeJobList();
};

const handlePoolChange = (): void => {
  paginationConfig.current = 1;
  loadScrapeJobList();
};

const handleResetFilters = (): void => {
  searchQuery.value = '';
  enableFilter.value = undefined;
  poolFilter.value = undefined;
  paginationConfig.current = 1;
  loadScrapeJobList();
  message.success('过滤条件已重置');
};

const handleCreateScrapeJob = (): void => {
  formDialog.isEdit = false;
  resetFormDialog();
  formDialogVisible.value = true;
};

const handleEditScrapeJob = (record: MonitorScrapeJobItem): void => {
  formDialog.isEdit = true;
  formDialog.form = {
    id: record.id,
    name: record.name,
    enableSwitch: record.enable === 1,
    enable: record.enable,
    service_discovery_type: record.service_discovery_type,
    metrics_path: record.metrics_path,
    scheme: record.scheme,
    scrape_interval: record.scrape_interval,
    scrape_timeout: record.scrape_timeout,
    pool_id: record.pool_id,
    refresh_interval: record.refresh_interval,
    port: record.port,
    ip_address: Array.isArray(record.ip_address)
      ? (record.ip_address[0] || '')
      : (record.ip_address || ''),
    relabel_configs_yaml_string: record.relabel_configs_yaml_string || '',
    kube_config_file_path: record.kube_config_file_path || '',
    tls_ca_file_path: record.tls_ca_file_path || '',
    tls_ca_content: record.tls_ca_content || '',
    bearer_token: record.bearer_token || '',
    bearer_token_file: record.bearer_token_file || '',
    kubernetes_sd_role: record.kubernetes_sd_role || '',
  };
  formDialogVisible.value = true;
  detailDialogVisible.value = false;
};

const handleViewScrapeJob = (record: MonitorScrapeJobItem): void => {
  detailDialog.form = record;
  detailDialogVisible.value = true;
};

const handleMenuClick = (command: string, record: MonitorScrapeJobItem): void => {
  switch (command) {
    case 'toggle':
      toggleJobStatus(record);
      break;
    case 'delete':
      confirmDelete(record);
      break;
  }
};

const toggleJobStatus = async (record: MonitorScrapeJobItem): Promise<void> => {
  try {
    const newStatus = record.enable === 1 ? 2 : 1;
    const updateData: updateScrapeJobReq = {
      id: record.id,
      name: record.name,
      enable: newStatus,
      service_discovery_type: record.service_discovery_type,
      metrics_path: record.metrics_path,
      scheme: record.scheme,
      scrape_interval: record.scrape_interval,
      scrape_timeout: record.scrape_timeout,
      pool_id: record.pool_id,
      refresh_interval: record.refresh_interval,
      port: record.port,
      ip_address: Array.isArray(record.ip_address)
        ? (record.ip_address[0] || '')
        : (record.ip_address || ''),
    };

    await updateScrapeJobApi(updateData);
    message.success(`采集任务已${newStatus === 1 ? '启用' : '禁用'}`);
    loadScrapeJobList();
  } catch (error: any) {
    console.error('切换采集任务状态失败:', error);
    message.error(error.message || '切换采集任务状态失败');
  }
};

const confirmDelete = (record: MonitorScrapeJobItem): void => {
  Modal.confirm({
    title: '警告',
    content: `确定要删除采集任务 "${record.name}" 吗？`,
    okText: '删除',
    okType: 'danger',
    cancelText: '取消',
    async onOk() {
      try {
        await deleteScrapeJobApi(record.id);
        message.success(`采集任务 "${record.name}" 已删除`);

        // 如果当前页只有一条数据且不是第一页，则删除后返回上一页
        if (scrapeJobList.value.length === 1 && paginationConfig.current > 1) {
          paginationConfig.current--;
        }

        loadScrapeJobList();
      } catch (error: any) {
        console.error('删除采集任务失败:', error);
        message.error(error.message || '删除采集任务失败');
      }
    }
  });
};

// 表单保存
const saveScrapeJob = async (): Promise<void> => {
  if (!formDialog.form.name.trim()) {
    message.error('采集任务名称不能为空');
    return;
  }

  if (!formDialog.form.pool_id) {
    message.error('请选择关联采集池');
    return;
  }

  if (!formDialog.form.ip_address || formDialog.form.ip_address.trim() === '') {
    message.error('请输入IP地址');
    return;
  }

  try {
    const formData = {
      ...formDialog.form,
      enable: formDialog.form.enableSwitch ? 1 : 2,
      user_id: 1, // 这里应该从用户上下文获取
    };

    if (formDialog.isEdit && formDialog.form.id) {
      const updateData: updateScrapeJobReq = formData as updateScrapeJobReq;
      await updateScrapeJobApi(updateData);
      message.success(`采集任务 "${formDialog.form.name}" 已更新`);
    } else {
      const createData: createScrapeJobReq = formData as createScrapeJobReq;
      await createScrapeJobApi(createData);
      message.success(`采集任务 "${formDialog.form.name}" 已创建`);
      // 创建后返回第一页
      paginationConfig.current = 1;
    }

    formDialogVisible.value = false;
    loadScrapeJobList();
  } catch (error: any) {
    console.error('保存采集任务失败:', error);
    message.error(error.message || '保存采集任务失败');
  }
};

// 重置表单对话框
const resetFormDialog = (): void => {
  formDialog.form = {
    id: undefined,
    name: '',
    enableSwitch: true,
    enable: 1,
    service_discovery_type: 'http',
    metrics_path: '/metrics',
    scheme: 'http',
    scrape_interval: 15,
    scrape_timeout: 5,
    pool_id: null,
    refresh_interval: 30,
    port: 9100,
    ip_address: '',
    relabel_configs_yaml_string: '',
    kube_config_file_path: '',
    tls_ca_file_path: '',
    tls_ca_content: '',
    bearer_token: '',
    bearer_token_file: '',
    kubernetes_sd_role: '',
  };
};

// 对话框关闭
const closeFormDialog = (): void => {
  formDialogVisible.value = false;
};

const closeDetailDialog = (): void => {
  detailDialogVisible.value = false;
};

// 生命周期钩子
onMounted(() => {
  // 初始化分页
  paginationConfig.current = 1;
  paginationConfig.pageSize = 10;

  // 加载数据
  loadScrapeJobList();
  loadPools();
});
</script>

<style scoped>
.scrape-job-container {
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

.job-name-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.job-badge {
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

.job-name-text {
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

.target-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.target-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.target-label {
  font-size: 12px;
  color: #666;
}

.target-value {
  font-size: 12px;
  font-weight: 500;
  color: #333;
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

.form-help-text {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #666;
  font-size: 12px;
  margin-top: 4px;
}

/* 详情对话框样式 */
.detail-dialog .job-details {
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
  .scrape-job-container {
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
