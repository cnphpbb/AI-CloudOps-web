<template>
  <div class="send-group-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="header-actions">
        <a-button type="primary" @click="handleCreateSendGroup" class="btn-create">
          <template #icon>
            <PlusOutlined />
          </template>
          <span class="btn-text">创建发送组</span>
        </a-button>
        <div class="search-filters">
          <a-input-search v-model:value="searchQuery" placeholder="搜索发送组名称..." class="search-input"
            @search="handleSearch" @change="handleSearchChange" allow-clear />
          <a-select v-model:value="enableFilter" placeholder="启用状态" class="filter-select" @change="handleEnableChange"
            allow-clear>
            <a-select-option :value="undefined">全部</a-select-option>
            <a-select-option :value="true">启用</a-select-option>
            <a-select-option :value="false">禁用</a-select-option>
          </a-select>
          <a-select v-model:value="upgradeFilter" placeholder="升级配置" class="filter-select" @change="handleUpgradeChange"
            allow-clear>
            <a-select-option :value="undefined">全部</a-select-option>
            <a-select-option :value="true">需要升级</a-select-option>
            <a-select-option :value="false">无需升级</a-select-option>
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
            <a-statistic title="总发送组" :value="stats.total" :value-style="{ color: '#3f8600' }">
              <template #prefix>
                <Icon icon="carbon:send" />
              </template>
            </a-statistic>
          </a-card>
        </a-col>
        <a-col :xs="12" :sm="6" :md="6" :lg="6">
          <a-card class="stats-card">
            <a-statistic title="启用中" :value="stats.enabled" :value-style="{ color: '#52c41a' }">
              <template #prefix>
                <Icon icon="carbon:checkmark" />
              </template>
            </a-statistic>
          </a-card>
        </a-col>
        <a-col :xs="12" :sm="6" :md="6" :lg="6">
          <a-card class="stats-card">
            <a-statistic title="配置升级" :value="stats.needUpgrade" :value-style="{ color: '#faad14' }">
              <template #prefix>
                <Icon icon="carbon:upgrade" />
              </template>
            </a-statistic>
          </a-card>
        </a-col>
        <a-col :xs="12" :sm="6" :md="6" :lg="6">
          <a-card class="stats-card">
            <a-statistic title="关联池数" :value="stats.associatedPools" :value-style="{ color: '#cf1322' }">
              <template #prefix>
                <Icon icon="carbon:link" />
              </template>
            </a-statistic>
          </a-card>
        </a-col>
      </a-row>
    </div>

    <!-- 表格容器 -->
    <div class="table-container">
      <a-card>
        <a-table :data-source="sendGroupList" :columns="columns" :pagination="paginationConfig" :loading="loading"
          row-key="id" bordered :scroll="{ x: 1400 }" @change="handleTableChange">
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'name'">
              <div class="group-name-cell">
                <div class="group-badge" :class="getGroupStatusClass(record)"></div>
                <span class="group-name-text">{{ record.name }}</span>
              </div>
            </template>

            <template v-if="column.key === 'name_zh'">
              <div class="name-zh-cell">
                <span class="name-zh-text">{{ record.name_zh }}</span>
              </div>
            </template>

            <template v-if="column.key === 'pool_config'">
              <div class="config-info">
                <div class="config-item" v-if="record.pool_id">
                  <span class="config-label">采集池ID:</span>
                  <span class="config-value">{{ record.pool_id }}</span>
                </div>
                <div class="config-item" v-if="record.on_duty_group_id">
                  <span class="config-label">值班组ID:</span>
                  <span class="config-value">{{ record.on_duty_group_id }}</span>
                </div>
                <span v-if="!record.pool_id && !record.on_duty_group_id" class="empty-text">无关联</span>
              </div>
            </template>

            <template v-if="column.key === 'enable'">
              <a-tag :color="record.enable ? 'success' : 'default'">
                {{ record.enable ? '启用' : '禁用' }}
              </a-tag>
            </template>

            <template v-if="column.key === 'notification_config'">
              <div class="notification-info">
                <div class="config-item">
                  <span class="config-label">重复间隔:</span>
                  <span class="config-value">{{ record.repeat_interval || '30s' }}</span>
                </div>
                <div class="config-item">
                  <span class="config-label">发送恢复:</span>
                  <a-tag :color="record.send_resolved ? 'success' : 'default'" size="small">
                    {{ record.send_resolved ? '是' : '否' }}
                  </a-tag>
                </div>
              </div>
            </template>

            <template v-if="column.key === 'upgrade_config'">
              <div class="upgrade-info">
                <a-tag :color="record.need_upgrade ? 'warning' : 'default'">
                  {{ record.need_upgrade ? '需要升级' : '无需升级' }}
                </a-tag>
                <div v-if="record.need_upgrade && record.upgrade_minutes" class="config-item">
                  <span class="config-label">升级时间:</span>
                  <span class="config-value">{{ record.upgrade_minutes }}分钟</span>
                </div>
              </div>
            </template>

            <template v-if="column.key === 'robot_token'">
              <div class="token-info">
                <span v-if="record.fei_shu_qun_robot_token" class="token-text">
                  {{ maskToken(record.fei_shu_qun_robot_token) }}
                </span>
                <span v-else class="empty-text">未配置</span>
              </div>
            </template>

            <template v-if="column.key === 'creator'">
              <div class="creator-info">
                <a-avatar size="small" :style="{ backgroundColor: getAvatarColor(record.create_user_name || '') }">
                  {{ getInitials(record.create_user_name) }}
                </a-avatar>
                <span class="creator-name">{{ record.create_user_name || '系统' }}</span>
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
                <a-button type="primary" size="small" @click="handleViewSendGroup(record)">
                  查看
                </a-button>
                <a-button type="default" size="small" @click="handleEditSendGroup(record)">
                  编辑
                </a-button>
                <a-dropdown>
                  <template #overlay>
                    <a-menu @click="(e: any) => handleMenuClick(e.key, record)">
                      <a-menu-item key="clone">
                        <Icon icon="carbon:copy" /> 克隆
                      </a-menu-item>
                      <a-menu-item key="test">
                        <Icon icon="carbon:test-tool" /> 测试
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

    <!-- 创建/编辑发送组对话框 -->
    <a-modal :open="formDialogVisible" :title="formDialog.isEdit ? '编辑发送组' : '创建发送组'" :width="formDialogWidth"
      @ok="saveSendGroup" @cancel="closeFormDialog" :destroy-on-close="true" class="responsive-modal send-group-modal">
      <a-form ref="formRef" :model="formDialog.form" :rules="formRules" layout="vertical">
        <div class="form-section">
          <div class="section-title">基本信息</div>
          <a-row :gutter="16">
            <a-col :xs="24" :sm="12">
              <a-form-item label="发送组名称" name="name" :rules="[{ required: true, message: '请输入发送组名称' }]">
                <a-input v-model:value="formDialog.form.name" placeholder="请输入发送组名称" />
              </a-form-item>
            </a-col>
            <a-col :xs="24" :sm="12">
              <a-form-item label="发送组中文名称" name="name_zh" :rules="[{ required: true, message: '请输入发送组中文名称' }]">
                <a-input v-model:value="formDialog.form.name_zh" placeholder="请输入发送组中文名称" />
              </a-form-item>
            </a-col>
          </a-row>
        </div>

        <div class="form-section">
          <div class="section-title">关联配置</div>
          <a-row :gutter="16">
            <a-col :xs="24" :sm="12">
              <a-form-item label="关联采集池" name="pool_id">
                <a-select v-model:value="formDialog.form.pool_id" placeholder="请选择采集池" class="full-width" allow-clear>
                  <a-select-option v-for="pool in scrapePools" :key="pool.id" :value="pool.id">
                    {{ pool.name }}
                  </a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :xs="24" :sm="12">
              <a-form-item label="关联值班组" name="on_duty_group_id">
                <a-select v-model:value="formDialog.form.on_duty_group_id" placeholder="请选择值班组" class="full-width"
                  allow-clear>
                  <a-select-option v-for="group in onDutyGroups" :key="group.id" :value="group.id">
                    {{ group.name }}
                  </a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
          </a-row>
        </div>

        <div class="form-section">
          <div class="section-title">通知配置</div>
          <a-row :gutter="16">
            <a-col :xs="24" :sm="12">
              <a-form-item label="是否启用" name="enable">
                <a-switch v-model:checked="formDialog.form.enable" class="tech-switch" />
              </a-form-item>
            </a-col>
            <a-col :xs="24" :sm="12">
              <a-form-item label="发送恢复消息" name="send_resolved">
                <a-switch v-model:checked="formDialog.form.send_resolved" class="tech-switch" />
              </a-form-item>
            </a-col>
          </a-row>
          <a-row :gutter="16">
            <a-col :xs="24" :sm="12">
              <a-form-item label="重复发送间隔" name="repeat_interval">
                <a-input v-model:value="formDialog.form.repeat_interval" placeholder="例如：30s, 5m, 1h" />
              </a-form-item>
            </a-col>
            <a-col :xs="24" :sm="12">
              <a-form-item label="需要升级" name="need_upgrade">
                <a-switch v-model:checked="formDialog.form.need_upgrade" class="tech-switch" />
              </a-form-item>
            </a-col>
          </a-row>
          <a-row :gutter="16">
            <a-col :span="24">
              <a-form-item label="飞书群机器人Token" name="fei_shu_qun_robot_token">
                <a-input v-model:value="formDialog.form.fei_shu_qun_robot_token" placeholder="请输入飞书群机器人Token" />
              </a-form-item>
            </a-col>
          </a-row>
        </div>

        <div class="form-section" v-if="formDialog.form.need_upgrade">
          <div class="section-title">升级配置</div>
          <a-row :gutter="16">
            <a-col :xs="24" :sm="12">
              <a-form-item label="升级时间间隔(分钟)" name="upgrade_minutes">
                <a-input-number v-model:value="formDialog.form.upgrade_minutes" :min="1" placeholder="请输入升级时间间隔"
                  class="full-width" />
              </a-form-item>
            </a-col>
          </a-row>
        </div>

        <div class="form-section">
          <div class="section-title">接收用户配置</div>
          <!-- 静态接收用户 -->
          <a-form-item label="静态接收用户" name="static_receive_users">
            <a-select v-model:value="formDialog.form.static_receive_users" mode="multiple" placeholder="请选择静态接收用户"
              class="full-width" :options="userOptions" />
          </a-form-item>

          <!-- 通知方式 -->
          <a-form-item label="通知方式" name="notify_methods">
            <a-select v-model:value="formDialog.form.notify_methods" mode="multiple" placeholder="请选择通知方式"
              class="full-width">
              <a-select-option value="email">邮件</a-select-option>
              <a-select-option value="sms">短信</a-select-option>
              <a-select-option value="feishu">飞书</a-select-option>
              <a-select-option value="webhook">Webhook</a-select-option>
            </a-select>
          </a-form-item>

          <!-- 首次升级用户 -->
          <a-form-item v-if="formDialog.form.need_upgrade" label="首次升级用户" name="first_upgrade_users">
            <a-select v-model:value="formDialog.form.first_upgrade_users" mode="multiple" placeholder="请选择首次升级用户"
              class="full-width" :options="userOptions" />
          </a-form-item>

          <!-- 二次升级用户 -->
          <a-form-item v-if="formDialog.form.need_upgrade" label="二次升级用户" name="second_upgrade_users">
            <a-select v-model:value="formDialog.form.second_upgrade_users" mode="multiple" placeholder="请选择二次升级用户"
              class="full-width" :options="userOptions" />
          </a-form-item>
        </div>
      </a-form>
    </a-modal>

    <!-- 详情对话框 -->
    <a-modal :open="detailDialogVisible" title="发送组详情" :width="previewDialogWidth" :footer="null"
      @cancel="closeDetailDialog" class="detail-dialog">
      <div v-if="detailDialog.form" class="group-details">
        <div class="detail-header">
          <h2>{{ detailDialog.form.name_zh || detailDialog.form.name }}</h2>
          <div class="detail-badges">
            <a-tag :color="detailDialog.form.enable ? 'success' : 'default'">
              {{ detailDialog.form.enable ? '启用' : '禁用' }}
            </a-tag>
            <a-tag :color="detailDialog.form.need_upgrade ? 'warning' : 'default'">
              {{ detailDialog.form.need_upgrade ? '需要升级' : '无需升级' }}
            </a-tag>
            <a-tag :color="detailDialog.form.send_resolved ? 'success' : 'default'">
              {{ detailDialog.form.send_resolved ? '发送恢复' : '不发送恢复' }}
            </a-tag>
          </div>
        </div>

        <a-descriptions bordered :column="1" :labelStyle="{ width: '150px' }">
          <a-descriptions-item label="ID">{{ detailDialog.form.id }}</a-descriptions-item>
          <a-descriptions-item label="发送组名称">{{ detailDialog.form.name }}</a-descriptions-item>
          <a-descriptions-item label="中文名称">{{ detailDialog.form.name_zh }}</a-descriptions-item>
          <a-descriptions-item label="关联采集池">{{ detailDialog.form.pool_id || '未关联' }}</a-descriptions-item>
          <a-descriptions-item label="关联值班组">{{ detailDialog.form.on_duty_group_id || '未关联' }}</a-descriptions-item>
          <a-descriptions-item label="重复间隔">{{ detailDialog.form.repeat_interval || '30s' }}</a-descriptions-item>
          <a-descriptions-item label="升级时间">
            {{ detailDialog.form.need_upgrade ? `${detailDialog.form.upgrade_minutes || 0}分钟` : '无需升级' }}
          </a-descriptions-item>
          <a-descriptions-item label="飞书Token">
            {{ detailDialog.form.fei_shu_qun_robot_token ? maskToken(detailDialog.form.fei_shu_qun_robot_token) : '未配置'
            }}
          </a-descriptions-item>
          <a-descriptions-item label="创建时间">{{ formatFullDateTime(detailDialog.form.created_at) }}</a-descriptions-item>
        </a-descriptions>

        <div class="detail-footer">
          <a-button @click="closeDetailDialog">关闭</a-button>
          <a-button type="primary" @click="handleEditSendGroup(detailDialog.form)">编辑</a-button>
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
  getMonitorSendGroupListApi,
  createMonitorSendGroupApi,
  updateMonitorSendGroupApi,
  deleteMonitorSendGroupApi,
  type MonitorSendGroup
} from '#/api/core/prometheus_send_group';
import { getUserList } from '#/api/core/user';
import { getMonitorScrapePoolListApi, type ScrapePoolItem } from '#/api/core/prometheus_scrape_pool';
import { getMonitorOnDutyGroupListApi, type MonitorOnDutyGroup } from '#/api/core/prometheus_onduty';

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
  { title: '发送组名称', dataIndex: 'name', key: 'name', width: 200, fixed: 'left' },
  { title: '中文名称', dataIndex: 'name_zh', key: 'name_zh', width: 180 },
  { title: '关联配置', key: 'pool_config', width: 180 },
  { title: '启用状态', dataIndex: 'enable', key: 'enable', width: 100, align: 'center' as const },
  { title: '通知配置', key: 'notification_config', width: 160 },
  { title: '升级配置', key: 'upgrade_config', width: 120 },
  { title: '机器人Token', key: 'robot_token', width: 150 },
  { title: '创建人', dataIndex: 'create_user_name', key: 'creator', width: 120 },
  { title: '创建时间', dataIndex: 'created_at', key: 'createdAt', width: 180 },
  { title: '操作', key: 'action', width: 200, align: 'center' as const, fixed: 'right' }
];

// 状态数据
const loading = ref(false);
const searchQuery = ref('');
const enableFilter = ref<boolean | undefined>(undefined);
const upgradeFilter = ref<boolean | undefined>(undefined);
const sendGroupList = ref<MonitorSendGroup[]>([]);

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
  needUpgrade: 0,
  associatedPools: 0
});

// 对话框状态
const formDialogVisible = ref(false);
const detailDialogVisible = ref(false);

// 选项数据
const scrapePools = ref<ScrapePoolItem[]>([]);
const onDutyGroups = ref<MonitorOnDutyGroup[]>([]);
const userOptions = ref<Array<{ label: string; value: number }>>([]);

// 表单对话框数据
const formDialog = reactive({
  isEdit: false,
  form: {
    id: undefined as number | undefined,
    name: '',
    name_zh: '',
    enable: false,
    pool_id: null as number | null,
    on_duty_group_id: null as number | null,
    repeat_interval: '30s',
    send_resolved: false,
    need_upgrade: false,
    upgrade_minutes: 0,
    fei_shu_qun_robot_token: '',
    static_receive_users: [] as number[],
    notify_methods: [] as string[],
    first_upgrade_users: [] as number[],
    second_upgrade_users: [] as number[]
  }
});

// 详情对话框数据
const detailDialog = reactive({
  form: null as MonitorSendGroup | null
});

// 表单验证规则
const formRules = {
  name: [
    { required: true, message: '请输入发送组名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度应为2到50个字符', trigger: 'blur' }
  ],
  name_zh: [
    { required: true, message: '请输入发送组中文名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度应为2到50个字符', trigger: 'blur' }
  ]
};

// 辅助方法
const getGroupStatusClass = (record: MonitorSendGroup): string => {
  if (record.enable && record.need_upgrade) return 'status-full';
  if (record.enable || record.need_upgrade) return 'status-partial';
  return 'status-none';
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

const maskToken = (token: string): string => {
  if (!token || token.length <= 8) return token;
  return token.substring(0, 4) + '****' + token.substring(token.length - 4);
};

const formatDate = (timestamp: number | string): string => {
  if (!timestamp) return '';
  const date = typeof timestamp === 'string' ? new Date(timestamp) : new Date(timestamp * 1000);
  return date.toLocaleDateString('zh-CN');
};

const formatTime = (timestamp: number | string): string => {
  if (!timestamp) return '';
  const date = typeof timestamp === 'string' ? new Date(timestamp) : new Date(timestamp * 1000);
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
};

const formatFullDateTime = (timestamp: number | string): string => {
  if (!timestamp) return '';
  const date = typeof timestamp === 'string' ? new Date(timestamp) : new Date(timestamp * 1000);
  return date.toLocaleString('zh-CN');
};

// 更新统计数据
const updateStats = () => {
  stats.total = sendGroupList.value.length;
  stats.enabled = sendGroupList.value.filter(item => item.enable).length;
  stats.needUpgrade = sendGroupList.value.filter(item => item.need_upgrade).length;
  stats.associatedPools = new Set(sendGroupList.value.map(item => item.pool_id).filter(Boolean)).size;
};

// 数据加载
const loadSendGroupList = async (): Promise<void> => {
  loading.value = true;
  try {
    const params: any = {
      page: paginationConfig.current,
      size: paginationConfig.pageSize,
      search: searchQuery.value || undefined
    };

    // 添加API支持的过滤条件，而不是前端过滤
    if (enableFilter.value !== undefined) {
      params.enable = enableFilter.value ? 1 : 2; // API使用1表示启用，2表示禁用
    }

    // 如果API支持按需升级筛选，可以添加这个参数
    // if (upgradeFilter.value !== undefined) {
    //   params.need_upgrade = upgradeFilter.value ? 1 : 2;
    // }

    const response = await getMonitorSendGroupListApi(params);

    if (response) {
      let list = response.items || [];

      // 如果API不支持需升级的筛选，则在前端进行筛选
      if (upgradeFilter.value !== undefined) {
        list = list.filter((item: MonitorSendGroup) =>
          item.need_upgrade === (upgradeFilter.value ? 1 : 2)
        );
      }

      sendGroupList.value = list;
      paginationConfig.total = response.total;
      updateStats();
    } else {
      message.error(response?.msg || '加载发送组列表失败');
    }
  } catch (error: any) {
    console.error('加载发送组列表失败:', error);
    message.error(error.message || '加载发送组列表失败');
  } finally {
    loading.value = false;
  }
};

// 加载选项数据
const loadOptionsData = async (): Promise<void> => {
  try {
    // 加载采集池
    const scrapePoolResponse = await getMonitorScrapePoolListApi({
      page: 1,
      size: 100, // 使用合理的值避免超过服务器限制
      search: ''
    });
    if (scrapePoolResponse) {
      scrapePools.value = scrapePoolResponse.items || [];
    } else {
      message.error(scrapePoolResponse?.msg || '加载采集池数据失败');
    }

    // 加载值班组
    const onDutyGroupResponse = await getMonitorOnDutyGroupListApi({
      page: 1,
      size: 100, // 使用合理的值避免超过服务器限制
      search: ''
    });
    if (onDutyGroupResponse) {
      onDutyGroups.value = onDutyGroupResponse.items || [];
    } else {
      message.error(onDutyGroupResponse?.msg || '加载值班组数据失败');
    }

    // 加载用户列表
    const userResponse = await getUserList({
      page: 1,
      size: 100, // 使用合理的值避免超过服务器限制
      search: ''
    });
    if (userResponse) {
      userOptions.value = (userResponse.items || []).map((user: any) => ({
        label: user.username,
        value: user.id
      }));
    } else {
      message.error(userResponse?.msg || '加载用户数据失败');
    }
  } catch (error: any) {
    console.error('加载选项数据失败:', error);
    message.error('加载选项数据失败');
  }
};

// 事件处理
const handleTableChange = (pagination: any): void => {
  paginationConfig.current = pagination.current;
  paginationConfig.pageSize = pagination.pageSize;
  loadSendGroupList();
};

const handleSearch = (): void => {
  paginationConfig.current = 1;
  loadSendGroupList();
};

const handleSearchChange = (): void => {
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }
  searchTimeout = setTimeout(() => {
    paginationConfig.current = 1;
    loadSendGroupList();
  }, 500);
};

const handleEnableChange = (): void => {
  paginationConfig.current = 1;
  loadSendGroupList();
};

const handleUpgradeChange = (): void => {
  paginationConfig.current = 1;
  loadSendGroupList();
};

const handleResetFilters = (): void => {
  searchQuery.value = '';
  enableFilter.value = undefined;
  upgradeFilter.value = undefined;
  paginationConfig.current = 1;
  loadSendGroupList();
  message.success('过滤条件已重置');
};

const handleCreateSendGroup = (): void => {
  formDialog.isEdit = false;
  resetFormDialog();
  formDialogVisible.value = true;
};

const handleEditSendGroup = (record: MonitorSendGroup): void => {
  formDialog.isEdit = true;
  formDialog.form = {
    id: record.id,
    name: record.name,
    name_zh: record.name_zh,
    enable: record.enable === 1,
    pool_id: record.pool_id,
    on_duty_group_id: record.on_duty_group_id,
    repeat_interval: record.repeat_interval || '30s',
    send_resolved: record.send_resolved === 1,
    need_upgrade: record.need_upgrade === 1,
    upgrade_minutes: record.upgrade_minutes || 0,
    fei_shu_qun_robot_token: record.fei_shu_qun_robot_token || '',
    static_receive_users: record.static_receive_users?.map(user => user.id) || [],
    notify_methods: record.notify_methods || [],
    first_upgrade_users: record.monitor_send_group_first_upgrade_users?.map(user => user.id) || [],
    second_upgrade_users: record.second_upgrade_users?.map(user => user.id) || []
  };
  formDialogVisible.value = true;
  detailDialogVisible.value = false;
};

const handleViewSendGroup = (record: MonitorSendGroup): void => {
  detailDialog.form = record;
  detailDialogVisible.value = true;
};

const handleMenuClick = (command: string, record: MonitorSendGroup): void => {
  switch (command) {
    case 'clone':
      message.info('克隆功能暂未实现');
      break;
    case 'test':
      message.info('测试功能暂未实现');
      break;
    case 'delete':
      confirmDelete(record);
      break;
  }
};

const confirmDelete = (record: MonitorSendGroup): void => {
  Modal.confirm({
    title: '警告',
    content: `确定要删除发送组 "${record.name_zh || record.name}" 吗？`,
    okText: '删除',
    okType: 'danger',
    cancelText: '取消',
    async onOk() {
      try {
        const response = await deleteMonitorSendGroupApi(record.id);
        if (response) {
          message.success(`发送组 "${record.name_zh || record.name}" 已删除`);
          loadSendGroupList();
        } else {
          message.error(response.msg || '删除发送组失败');
        }
      } catch (error: any) {
        console.error('删除发送组失败:', error);
        message.error(error.message || '删除发送组失败');
      }
    }
  });
};

// 表单保存
const saveSendGroup = async (): Promise<void> => {
  if (!formDialog.form.name.trim()) {
    message.error('发送组名称不能为空');
    return;
  }

  if (!formDialog.form.name_zh.trim()) {
    message.error('发送组中文名称不能为空');
    return;
  }

  try {
    const formData = {
      ...formDialog.form,
      enable: formDialog.form.enable ? 1 : 0,
      send_resolved: formDialog.form.send_resolved ? 1 : 0,
      need_upgrade: formDialog.form.need_upgrade ? 1 : 0,
      // Convert user IDs to the format expected by the API
      static_receive_users: formDialog.form.static_receive_users.map(id => ({
        id,
        username: userOptions.value.find(user => user.value === id)?.label || ''
      })),
      monitor_send_group_first_upgrade_users: formDialog.form.first_upgrade_users.map(id => ({
        id,
        username: userOptions.value.find(user => user.value === id)?.label || ''
      })),
      second_upgrade_users: formDialog.form.second_upgrade_users.map(id => ({
        id,
        username: userOptions.value.find(user => user.value === id)?.label || ''
      }))
    };

    if (formDialog.isEdit && formDialog.form.id) {
      const response = await updateMonitorSendGroupApi(formData as any);
      if (response) {
        message.success(`发送组 "${formDialog.form.name_zh}" 已更新`);
        formDialogVisible.value = false;
        loadSendGroupList();
      } else {
        message.error(response.msg || '更新发送组失败');
      }
    } else {
      const response = await createMonitorSendGroupApi(formData as any);
      if (response) {
        message.success(`发送组 "${formDialog.form.name_zh}" 已创建`);
        formDialogVisible.value = false;
        loadSendGroupList();
      } else {
        message.error(response.msg || '创建发送组失败');
      }
    }
  } catch (error: any) {
    console.error('保存发送组失败:', error);
    message.error(error.message || '保存发送组失败');
  }
};

// 重置表单对话框
const resetFormDialog = (): void => {
  formDialog.form = {
    id: undefined,
    name: '',
    name_zh: '',
    enable: false,
    pool_id: null,
    on_duty_group_id: null,
    repeat_interval: '30s',
    send_resolved: false,
    need_upgrade: false,
    upgrade_minutes: 0,
    fei_shu_qun_robot_token: '',
    static_receive_users: [],
    notify_methods: [],
    first_upgrade_users: [],
    second_upgrade_users: []
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
  loadOptionsData();
  loadSendGroupList();
});
</script>

<style scoped>
/* 继承采集池页面的所有样式 */
.send-group-container {
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

.group-name-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.group-badge {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-full {
  background-color: #52c41a;
}

.status-partial {
  background-color: #faad14;
}

.status-none {
  background-color: #d9d9d9;
}

.group-name-text {
  font-weight: 500;
  word-break: break-all;
}

.name-zh-cell {
  display: flex;
  align-items: center;
}

.name-zh-text {
  color: #1a1a1a;
  font-weight: 500;
  word-break: break-all;
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

.notification-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.upgrade-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.token-info {
  display: flex;
  align-items: center;
}

.token-text {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 12px;
  color: #666;
  background-color: #f5f5f5;
  padding: 2px 6px;
  border-radius: 3px;
}

.empty-text {
  color: #999;
  font-style: italic;
  font-size: 12px;
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

/* 详情对话框样式 */
.detail-dialog .group-details {
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
  .send-group-container {
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
