<template>
  <div class="scrape-pool-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="header-actions">
        <a-button type="primary" @click="showAddModal" class="btn-create">
          <template #icon>
            <PlusOutlined />
          </template>
          <span class="btn-text">新增值班组</span>
        </a-button>
        <div class="search-filters">
          <a-input-search v-model:value="searchText" placeholder="请输入值班组名称..." class="search-input"
            @search="handleSearch" @change="handleSearchChange" allow-clear />
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
            <a-statistic title="总值班组" :value="stats.total" :value-style="{ color: '#3f8600' }">
              <template #prefix>
                <Icon icon="carbon:user-multiple" />
              </template>
            </a-statistic>
          </a-card>
        </a-col>
        <a-col :xs="12" :sm="6" :md="6" :lg="6">
          <a-card class="stats-card">
            <a-statistic title="活跃成员" :value="stats.activeMembers" :value-style="{ color: '#52c41a' }">
              <template #prefix>
                <Icon icon="carbon:user-activity" />
              </template>
            </a-statistic>
          </a-card>
        </a-col>
        <a-col :xs="12" :sm="6" :md="6" :lg="6">
          <a-card class="stats-card">
            <a-statistic title="平均周期" :value="stats.avgShiftDays" suffix="天" :value-style="{ color: '#faad14' }">
              <template #prefix>
                <Icon icon="carbon:calendar" />
              </template>
            </a-statistic>
          </a-card>
        </a-col>
        <a-col :xs="12" :sm="6" :md="6" :lg="6">
          <a-card class="stats-card">
            <a-statistic title="今日值班" :value="stats.todayOnDuty" :value-style="{ color: '#cf1322' }">
              <template #prefix>
                <Icon icon="carbon:user-certification" />
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
                <div class="pool-badge status-full"></div>
                <span class="pool-name-text">{{ record.name }}</span>
              </div>
            </template>

            <template v-if="column.key === 'user_names'">
              <div class="tag-container">
                <a-tag v-for="name in record.user_names" :key="name" class="tech-tag prometheus-tag">
                  {{ name }}
                </a-tag>
                <span v-if="!record.user_names?.length" class="empty-text">无成员</span>
              </div>
            </template>

            <template v-if="column.key === 'shift_info'">
              <div class="config-info">
                <div class="config-item">
                  <span class="config-label">周期:</span>
                  <span class="config-value">{{ record.shift_days }}天</span>
                </div>
                <div class="config-item">
                  <span class="config-label">成员:</span>
                  <span class="config-value">{{ record.user_names?.length || 0 }}人</span>
                </div>
              </div>
            </template>

            <template v-if="column.key === 'duty_status'">
              <div class="tag-container">
                <a-tag v-if="record.yesterday_normal_duty_user_id" class="tech-tag alert-tag">
                  昨日: {{ record.yesterday_normal_duty_user_id }}
                </a-tag>
                <a-tag v-if="record.today_duty_user" class="tech-tag label-tag">
                  今日: {{ record.today_duty_user }}
                </a-tag>
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
                <a-button type="primary" size="small" @click="handleViewDetail(record)">
                  详情
                </a-button>
                <a-button type="default" size="small" @click="handleViewFuturePlan(record)">
                  排班计划
                </a-button>
                <a-dropdown>
                  <template #overlay>
                    <a-menu @click="(e: any) => handleMenuClick(e.key, record)">
                      <a-menu-item key="edit">
                        <Icon icon="carbon:edit" /> 编辑
                      </a-menu-item>
                      <a-menu-item key="schedule">
                        <Icon icon="carbon:calendar" /> 查看排班表
                      </a-menu-item>
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

    <!-- 新增值班组模态框 -->
    <a-modal :open="isAddModalVisible" title="新增值班组" :width="formDialogWidth" @ok="handleAdd" @cancel="closeAddModal"
      :destroy-on-close="true" class="responsive-modal scrape-pool-modal">
      <a-form ref="addFormRef" :model="addForm" :rules="formRules" layout="vertical">
        <div class="form-section">
          <div class="section-title">基本信息</div>
          <a-row :gutter="16">
            <a-col :span="24">
              <a-form-item label="值班组名称" name="name" :rules="[{ required: true, message: '请输入值班组名称' }]">
                <a-input v-model:value="addForm.name" placeholder="请输入值班组名称" />
              </a-form-item>
            </a-col>
          </a-row>
          <a-row :gutter="16">
            <a-col :span="24">
              <a-form-item label="轮班周期（天）" name="shiftDays" :rules="[{ required: true, message: '请输入轮班周期' }]">
                <a-input-number v-model:value="addForm.shiftDays" :min="1" :max="365" class="full-width" />
              </a-form-item>
            </a-col>
          </a-row>
        </div>

        <div class="form-section">
          <div class="section-title">值班人员</div>
          <a-row :gutter="16">
            <a-col :span="24">
              <a-form-item label="用户名称" name="userNames" :rules="[{ required: true, message: '请选择至少一个用户' }]">
                <a-select mode="multiple" v-model:value="addForm.userNames" placeholder="请选择用户" style="width: 100%"
                  :maxTagCount="3" :filterOption="filterOption" :options="displayUsers" :loading="usersLoading"
                  @popupScroll="handleUserSelectScroll" @search="handleUserSearch" show-search></a-select>
              </a-form-item>
            </a-col>
          </a-row>
        </div>
      </a-form>
    </a-modal>

    <!-- 编辑值班组模态框 -->
    <a-modal :open="isEditModalVisible" title="编辑值班组" :width="formDialogWidth" @ok="handleUpdate"
      @cancel="closeEditModal" :destroy-on-close="true" class="responsive-modal scrape-pool-modal">
      <a-form ref="editFormRef" :model="editForm" :rules="formRules" layout="vertical">
        <div class="form-section">
          <div class="section-title">基本信息</div>
          <a-row :gutter="16">
            <a-col :span="24">
              <a-form-item label="值班组名称" name="name" :rules="[{ required: true, message: '请输入值班组名称' }]">
                <a-input v-model:value="editForm.name" placeholder="请输入值班组名称" />
              </a-form-item>
            </a-col>
          </a-row>
          <a-row :gutter="16">
            <a-col :span="24">
              <a-form-item label="轮班周期（天）" name="shiftDays" :rules="[{ required: true, message: '请输入轮班周期' }]">
                <a-input-number v-model:value="editForm.shiftDays" :min="1" :max="365" class="full-width" />
              </a-form-item>
            </a-col>
          </a-row>
        </div>

        <div class="form-section">
          <div class="section-title">值班人员</div>
          <a-row :gutter="16">
            <a-col :span="24">
              <a-form-item label="用户名称" name="userNames" :rules="[{ required: true, message: '请选择至少一个用户' }]">
                <a-select mode="multiple" v-model:value="editForm.userNames" placeholder="请选择用户" style="width: 100%"
                  :maxTagCount="3" :filterOption="filterOption" :options="displayUsers" :loading="usersLoading"
                  @popupScroll="handleUserSelectScroll" @search="handleUserSearch" show-search></a-select>
              </a-form-item>
            </a-col>
          </a-row>
        </div>
      </a-form>
    </a-modal>

    <!-- 值班组详情对话框 -->
    <a-modal :open="detailDialogVisible" title="值班组详情" :width="previewDialogWidth" :footer="null"
      @cancel="closeDetailDialog" class="detail-dialog">
      <div v-if="detailDialog.data" class="pool-details">
        <div class="detail-header">
          <h2>{{ detailDialog.data.name }}</h2>
          <div class="detail-badges">
            <a-tag color="blue">
              {{ detailDialog.data.shift_days }}天轮班
            </a-tag>
            <a-tag color="green">
              {{ detailDialog.data.user_names?.length || 0 }}名成员
            </a-tag>
          </div>
        </div>

        <a-descriptions bordered :column="1" :labelStyle="{ width: '150px' }">
          <a-descriptions-item label="ID">{{ detailDialog.data.id }}</a-descriptions-item>
          <a-descriptions-item label="值班组名称">{{ detailDialog.data.name }}</a-descriptions-item>
          <a-descriptions-item label="轮班周期">{{ detailDialog.data.shift_days }}天</a-descriptions-item>
          <a-descriptions-item label="成员数量">{{ detailDialog.data.user_names?.length || 0 }}人</a-descriptions-item>
          <a-descriptions-item label="成员列表">
            <div class="tag-container">
              <a-tag v-for="name in detailDialog.data.user_names" :key="name" class="tech-tag prometheus-tag">
                {{ name }}
              </a-tag>
            </div>
          </a-descriptions-item>
          <a-descriptions-item label="昨日值班">
            {{ detailDialog.data.yesterday_normal_duty_user_id || '无' }}
          </a-descriptions-item>
          <a-descriptions-item label="今日值班">
            {{ detailDialog.data.today_duty_user || '无' }}
          </a-descriptions-item>
          <a-descriptions-item label="创建人">{{ detailDialog.data.creator_name }}</a-descriptions-item>
          <a-descriptions-item label="创建时间">{{ formatFullDateTime(String(detailDialog.data.created_at))
          }}</a-descriptions-item>
        </a-descriptions>

        <div class="detail-footer">
          <a-button @click="closeDetailDialog">关闭</a-button>
          <a-button type="primary" @click="handleEditFromDetail">编辑</a-button>
          <a-button type="default" @click="handleViewFuturePlanFromDetail">查看排班计划</a-button>
        </div>
      </div>
    </a-modal>

    <!-- 未来排班计划对话框 -->
    <a-modal :open="futurePlanDialogVisible" title="未来排班计划" :width="previewDialogWidth" :footer="null"
      @cancel="closeFuturePlanDialog" class="detail-dialog future-plan-dialog">
      <div v-if="futurePlanDialog.data" class="future-plan-content">
        <div class="plan-header">
          <h3>{{ futurePlanDialog.groupName }} - 未来排班计划</h3>
          <div class="plan-info">
            <a-tag color="blue">计划时长: {{ futurePlanDialog.data.length }}天</a-tag>
            <a-tag color="green">轮班周期: {{ futurePlanDialog.shiftDays }}天</a-tag>
          </div>
        </div>

        <div class="plan-filters">
          <a-date-picker v-model:value="planDateFilter" placeholder="选择日期筛选" @change="handlePlanDateChange"
            style="margin-right: 12px;" />
          <a-select v-model:value="planUserFilter" placeholder="选择用户筛选" style="width: 150px; margin-right: 12px;"
            allow-clear @change="handlePlanUserChange" :options="planUserOptions" :loading="planUsersLoading"
            @search="handlePlanUserSearch" show-search :filterOption="false"></a-select>
          <a-button @click="resetPlanFilters">重置筛选</a-button>
        </div>

        <div class="plan-timeline">
          <a-timeline mode="left">
            <a-timeline-item v-for="(plan, index) in filteredFuturePlans" :key="index"
              :color="getPlanTimelineColor(plan, index)">
              <template #label>
                <div class="timeline-date">
                  <div class="date-main">{{ formatPlanDate(plan.date) }}</div>
                  <div class="date-sub">{{ formatPlanWeekday(plan.date) }}</div>
                </div>
              </template>
              <div class="timeline-content">
                <div class="duty-user">
                  <a-avatar size="small" :style="{ backgroundColor: getAvatarColor(plan.target_user_name) }">
                    {{ getInitials(plan.target_user_name) }}
                  </a-avatar>
                  <span class="user-name">{{ plan.target_user_name }}</span>
                  <a-tag v-if="isToday(plan.date)" color="red" class="today-tag">
                    今日
                  </a-tag>
                  <a-tag v-else-if="isTomorrow(plan.date)" color="orange" class="tomorrow-tag">
                    明日
                  </a-tag>
                </div>
                <div class="duty-details">
                  <span class="duty-type">正常值班</span>
                  <span class="cycle-info">第{{ getCycleDay(index) }}天</span>
                </div>
              </div>
            </a-timeline-item>
          </a-timeline>

          <!-- 添加分页 -->
          <div class="pagination-container"
            v-if="futurePlanDialog.data && futurePlanDialog.data.length > planPaginationConfig.pageSize">
            <a-pagination v-model:current="planPaginationConfig.current" :pageSize="planPaginationConfig.pageSize"
              :total="planPaginationConfig.total" :showSizeChanger="true" :pageSizeOptions="['10', '15', '30', '50']"
              @change="handlePlanPaginationChange" @showSizeChange="handlePlanPaginationChange" />
          </div>
        </div>

        <div class="plan-summary">
          <a-statistic-group>
            <a-statistic title="总计划天数" :value="futurePlanDialog.data.length" suffix="天" />
            <a-statistic title="参与人数" :value="futurePlanDialog.availableUsers.length" suffix="人" />
            <a-statistic title="轮班周期" :value="futurePlanDialog.shiftDays" suffix="天" />
          </a-statistic-group>
        </div>

        <div class="detail-footer">
          <a-button @click="closeFuturePlanDialog">关闭</a-button>
          <a-button type="primary" @click="exportPlan">导出计划</a-button>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { message, Modal } from 'ant-design-vue';
import {
  PlusOutlined,
  DownOutlined
} from '@ant-design/icons-vue';
import { Icon } from '@iconify/vue';
import {
  getMonitorOnDutyGroupListApi,
  createMonitorOnDutyGroupApi,
  updateMonitorOnDutyGroupApi,
  deleteMonitorOnDutyGroupApi,
  getMonitorOnDutyGroupDetailApi,
  getMonitorOnDutyGroupFuturePlanApi
} from '#/api/core/prometheus_onduty';
import { getUserList } from '#/api/core/user';
import type { MonitorOnDutyChange, MonitorOnDutyGroup } from '#/api/core/prometheus_onduty';
import { useRouter } from 'vue-router';
import dayjs from 'dayjs';

const router = useRouter();

// 响应式对话框宽度
const formDialogWidth = computed(() => {
  if (typeof window !== 'undefined') {
    const width = window.innerWidth;
    if (width < 768) return '95%';
    if (width < 1024) return '90%';
    return '700px';
  }
  return '700px';
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
  { title: 'ID', dataIndex: 'id', key: 'id', width: 80, fixed: 'left' },
  { title: '值班组名称', dataIndex: 'name', key: 'name', width: 200 },
  { title: '值班信息', dataIndex: 'shift_info', key: 'shift_info', width: 150 },
  { title: '成员列表', dataIndex: 'user_names', key: 'user_names', width: 200 },
  { title: '值班状态', dataIndex: 'duty_status', key: 'duty_status', width: 200 },
  { title: '创建人', dataIndex: 'create_user_name', key: 'creator', width: 120 },
  { title: '创建时间', dataIndex: 'created_at', key: 'createdAt', width: 180 },
  { title: '操作', key: 'action', width: 220, align: 'center' as const, fixed: 'right' }
];

// 状态数据
const data = ref<MonitorOnDutyGroup[]>([]);
const searchText = ref('');
const loading = ref(false);
const addFormRef = ref();
const editFormRef = ref();

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

// 用户选择相关状态
const availableUsers = ref<string[]>([]);
const userMap = ref<Record<string, number>>({});
const displayUsers = ref<{ value: string, label: string }[]>([]);
const usersLoading = ref(false);
const userSearchText = ref('');

// 添加用户列表分页配置
const userPaginationConfig = reactive({
  current: 1,
  pageSize: 20,
  total: 0,
  showSizeChanger: true,
  hasMore: true
});

// 计划用户选择相关状态
const planUserOptions = ref<{ value: string, label: string }[]>([]);
const planUsersLoading = ref(false);
const planUserSearchText = ref('');

// 计划用户选择分页配置
const planUserPaginationConfig = reactive({
  current: 1,
  pageSize: 20,
  total: 0,
  hasMore: true
});

// 添加排班计划分页配置
const planPaginationConfig = reactive({
  current: 1,
  pageSize: 15,
  total: 0,
  showSizeChanger: true,
  showTotal: (total: number) => `共 ${total} 条记录`,
});

// 统计数据
const stats = reactive({
  total: 0,
  activeMembers: 0,
  avgShiftDays: 0,
  todayOnDuty: 0
});

// 对话框状态
const isAddModalVisible = ref(false);
const isEditModalVisible = ref(false);
const detailDialogVisible = ref(false);
const futurePlanDialogVisible = ref(false);

// 表单数据
const addForm = reactive({
  name: '',
  shiftDays: 7,
  userNames: [] as string[],
});

const editForm = reactive({
  id: 0,
  name: '',
  shiftDays: 7,
  userNames: [] as string[],
});

// 详情对话框数据
const detailDialog = reactive({
  data: null as MonitorOnDutyGroup | null
});

// 未来排班计划对话框数据
const futurePlanDialog = reactive({
  data: null as any | null,
  groupId: 0,
  groupName: '',
  shiftDays: 0,
  availableUsers: [] as string[]
});

// 排班计划筛选
const planDateFilter = ref();
const planUserFilter = ref('');

// 表单验证规则
const formRules = {
  name: [
    { required: true, message: '请输入值班组名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度应为2到50个字符', trigger: 'blur' }
  ],
  shiftDays: [
    { required: true, message: '请输入轮班周期', trigger: 'blur' }
  ],
  userNames: [
    { required: true, message: '请选择至少一个用户', trigger: 'change' }
  ]
};

// 计算属性 - 筛选后的未来排班
const filteredFuturePlans = computed(() => {
  if (!futurePlanDialog.data) return [];

  let plans: any[] = [];

  // 处理新的API响应格式
  if (futurePlanDialog.data.details && Array.isArray(futurePlanDialog.data.details)) {
    plans = futurePlanDialog.data.details.map((item: any) => ({
      date: item.date,
      target_user_name: item.user?.real_name ||
        (futurePlanDialog.data.map && item.date ? futurePlanDialog.data.map[item.date] : '') || '',
      username: item.user?.username ||
        (futurePlanDialog.data.user_name_map && item.date ? futurePlanDialog.data.user_name_map[item.date] : '') || '',
      origin_user: item.origin_user ||
        (futurePlanDialog.data.origin_user_map && item.date ? futurePlanDialog.data.origin_user_map[item.date] : '') || ''
    }));
  } else if (Array.isArray(futurePlanDialog.data)) {
    // 兼容旧格式
    plans = [...futurePlanDialog.data];
  }

  // 按日期筛选
  if (planDateFilter.value) {
    const filterDate = dayjs(planDateFilter.value).format('YYYY-MM-DD');
    plans = plans.filter((plan: any) => plan.date === filterDate);
  }

  // 按用户筛选
  if (planUserFilter.value) {
    plans = plans.filter((plan: any) => plan.target_user_name === planUserFilter.value);
  }

  // 更新计划分页总数
  planPaginationConfig.total = plans.length;

  // 应用分页
  const startIndex = (planPaginationConfig.current - 1) * planPaginationConfig.pageSize;
  const endIndex = startIndex + planPaginationConfig.pageSize;
  return plans.slice(startIndex, endIndex);
});

// 辅助方法
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
  return dayjs(timestamp).format('YYYY-MM-DD');
};

const formatTime = (timestamp: string): string => {
  if (!timestamp) return '';
  return dayjs(timestamp).format('HH:mm');
};

const formatFullDateTime = (timestamp: string): string => {
  if (!timestamp) return '';
  return dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss');
};

const formatPlanDate = (date: string): string => {
  return dayjs(date).format('MM-DD');
};

const formatPlanWeekday = (date: string): string => {
  if (!date) return '';
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return weekdays[dayjs(date).day()] || '';
};

const isToday = (date: string): boolean => {
  return dayjs(date).isSame(dayjs(), 'day');
};

const isTomorrow = (date: string): boolean => {
  return dayjs(date).isSame(dayjs().add(1, 'day'), 'day');
};

const getPlanTimelineColor = (plan: MonitorOnDutyChange, index: number): string => {
  if (isToday(plan.date)) return 'red';
  if (isTomorrow(plan.date)) return 'orange';
  return index % 2 === 0 ? 'blue' : 'green';
};

const getCycleDay = (index: number): number => {
  return (index % futurePlanDialog.shiftDays) + 1;
};

const filterOption = (input: string, option: any) => {
  return option.value.toLowerCase().indexOf(input.toLowerCase()) >= 0;
};

// 更新统计数据
const updateStats = () => {
  stats.total = data.value.length;
  stats.activeMembers = data.value.reduce((total, item) => total + (item.user_names?.length || 0), 0);
  stats.avgShiftDays = data.value.length > 0
    ? Math.round(data.value.reduce((sum, item) => sum + item.shift_days, 0) / data.value.length)
    : 0;
  stats.todayOnDuty = data.value.filter(item => item.today_duty_user).length;
};

// 数据加载
const fetchOnDutyGroups = async (): Promise<void> => {
  loading.value = true;
  try {
    const response = await getMonitorOnDutyGroupListApi({
      page: paginationConfig.current,
      size: paginationConfig.pageSize,
      search: searchText.value.trim(),
    });

    if (response) {
      // 确保user_names数组正确填充
      data.value = response.items?.map((item: MonitorOnDutyGroup) => {
        // 如果members存在但user_names为空，则从members构建user_names
        if (item.members && Array.isArray(item.members) && (!item.user_names || item.user_names.length === 0)) {
          item.user_names = item.members.map((member: { id: number; username: string }) => member.username);
        }
        return item;
      }) || [];
      paginationConfig.total = response.total || 0;
      updateStats();
    } else {
      message.error(response.msg || '获取值班组列表失败');
    }
  } catch (error: any) {
    console.error('获取值班组列表失败:', error);
    message.error(error.message || '获取值班组列表失败');
  } finally {
    loading.value = false;
  }
};

// 获取用户列表 - 修改为分页加载
const fetchUserList = async (page = 1, search = '') => {
  try {
    usersLoading.value = true;
    const response = await getUserList({
      page,
      size: userPaginationConfig.pageSize,
      search
    });

    if (response && response.items) {
      const newUsers = response.items.map((user: any) => user.username);

      // 如果是第一页，重置用户列表
      if (page === 1) {
        availableUsers.value = newUsers;
      } else {
        // 否则追加
        availableUsers.value = [...availableUsers.value, ...newUsers];
      }

      // 更新用户ID映射
      response.items.forEach((user: any) => {
        userMap.value[user.username] = user.id;
      });

      // 更新分页状态
      userPaginationConfig.total = response.total || 0;
      userPaginationConfig.hasMore = page * userPaginationConfig.pageSize < response.total;

      // 更新显示的用户选项
      const newOptions = response.items.map((user: any) => ({
        value: user.username,
        label: user.username
      }));

      if (page === 1) {
        displayUsers.value = newOptions;
      } else {
        displayUsers.value = [...displayUsers.value, ...newOptions];
      }
    } else {
      message.error(response?.msg || '获取用户列表失败');
    }
  } catch (error: any) {
    console.error('获取用户列表失败:', error);
    message.error(error.message || '获取用户列表失败');
  } finally {
    usersLoading.value = false;
  }
};

// 处理用户选择下拉框滚动
const handleUserSelectScroll = (e: any) => {
  // 当滚动到底部且有更多数据时加载下一页
  const { target } = e;
  if (target.scrollTop + target.offsetHeight >= target.scrollHeight - 20) {
    if (userPaginationConfig.hasMore && !usersLoading.value) {
      fetchUserList(userPaginationConfig.current + 1, userSearchText.value);
      userPaginationConfig.current += 1;
    }
  }
};

// 处理用户搜索
const handleUserSearch = (value: string) => {
  userSearchText.value = value;
  userPaginationConfig.current = 1;
  fetchUserList(1, value);
};

// 加载排班计划用户选项 - 只使用当前排班计划中的用户
const loadPlanUserOptions = (search = '') => {
  try {
    planUsersLoading.value = true;

    // 从当前排班计划中的用户筛选，而不是从所有用户中筛选
    const filteredUsers = futurePlanDialog.availableUsers.filter(user => {
      return !search || user.toLowerCase().includes(search.toLowerCase());
    });

    // 更新用户选项
    planUserOptions.value = filteredUsers.map(user => ({
      value: user,
      label: user
    }));

  } catch (error: any) {
    console.error('获取排班计划用户列表失败:', error);
  } finally {
    planUsersLoading.value = false;
  }
};

// 处理排班用户选择搜索
const handlePlanUserSearch = (value: string) => {
  planUserSearchText.value = value;
  loadPlanUserOptions(value);
};

// 获取值班组详情
const fetchOnDutyGroupDetail = async (id: number): Promise<void> => {
  try {
    loading.value = true;
    const response = await getMonitorOnDutyGroupDetailApi(id);
    if (response) {
      detailDialog.data = response;
    } else {
      message.error(response.msg || '获取值班组详情失败');
    }
  } catch (error: any) {
    console.error('获取值班组详情失败:', error);
    message.error(error.message || '获取值班组详情失败');
  } finally {
    loading.value = false;
  }
};

// 获取未来排班计划
const fetchFuturePlan = async (id: number): Promise<void> => {
  loading.value = true;
  try {
    // 设置起始和结束时间，如默认获取当天起30天的排班计划
    const startTime = dayjs().format('YYYY-MM-DD');
    const endTime = dayjs().add(30, 'day').format('YYYY-MM-DD');

    const response = await getMonitorOnDutyGroupFuturePlanApi(id, {
      start_time: startTime,
      end_time: endTime
    });

    if (response) {
      futurePlanDialog.data = response;

      // 设置分页信息，使用details的长度或根据map的键数量
      if (response.details && Array.isArray(response.details)) {
        planPaginationConfig.total = response.details.length || 0;
      } else if (response.map) {
        planPaginationConfig.total = Object.keys(response.map).length || 0;
      }
      planPaginationConfig.current = 1;

      // 获取可用用户列表 - 从新的API响应格式中提取
      const uniqueUsers: string[] = [];

      if (response.map) {
        // 从map中提取唯一用户名
        const mapValues = Object.values(response.map);
        mapValues.forEach((value: any) => {
          if (typeof value === 'string' && !uniqueUsers.includes(value)) {
            uniqueUsers.push(value);
          }
        });
      } else if (response.details && Array.isArray(response.details)) {
        // 从details中提取唯一用户名
        response.details.forEach((item: any) => {
          if (item.user && item.user.real_name && typeof item.user.real_name === 'string' && !uniqueUsers.includes(item.user.real_name)) {
            uniqueUsers.push(item.user.real_name);
          }
        });
      }

      futurePlanDialog.availableUsers = uniqueUsers;

      // 加载用户选项
      loadPlanUserOptions('');
    } else {
      message.error('获取未来排班计划失败');
    }
  } catch (error: any) {
    console.error('获取未来排班计划失败:', error);
    message.error(error.message || '获取未来排班计划失败');
  } finally {
    loading.value = false;
  }
};

// 事件处理
const handleTableChange = (pagination: any): void => {
  paginationConfig.current = pagination.current;
  paginationConfig.pageSize = pagination.pageSize;
  fetchOnDutyGroups();
};

const handleSearch = (): void => {
  paginationConfig.current = 1;
  fetchOnDutyGroups();
};

const handleSearchChange = (): void => {
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }
  searchTimeout = setTimeout(() => {
    paginationConfig.current = 1;
    fetchOnDutyGroups();
  }, 500);
};

const handleReset = (): void => {
  searchText.value = '';
  paginationConfig.current = 1;
  fetchOnDutyGroups();
  message.success('过滤条件已重置');
};

// 查看详情
const handleViewDetail = async (record: MonitorOnDutyGroup): Promise<void> => {
  await fetchOnDutyGroupDetail(record.id);
  detailDialogVisible.value = true;
};

// 查看未来排班计划
const handleViewFuturePlan = async (record: MonitorOnDutyGroup): Promise<void> => {
  futurePlanDialog.groupId = record.id;
  futurePlanDialog.groupName = record.name;
  futurePlanDialog.shiftDays = record.shift_days;
  await fetchFuturePlan(record.id);
  futurePlanDialogVisible.value = true;
};

// 从详情页面查看排班计划
const handleViewFuturePlanFromDetail = async (): Promise<void> => {
  if (detailDialog.data) {
    futurePlanDialog.groupId = detailDialog.data.id;
    futurePlanDialog.groupName = detailDialog.data.name;
    futurePlanDialog.shiftDays = detailDialog.data.shift_days;
    await fetchFuturePlan(detailDialog.data.id);
    detailDialogVisible.value = false;
    futurePlanDialogVisible.value = true;
  }
};

// 从详情页面编辑
const handleEditFromDetail = (): void => {
  if (detailDialog.data) {
    showEditModal(detailDialog.data);
    detailDialogVisible.value = false;
  }
};

// 排班计划筛选处理
const handlePlanDateChange = (): void => {
  // 日期变化时重置分页到第一页
  planPaginationConfig.current = 1;
};

const handlePlanUserChange = (): void => {
  // 用户变化时重置分页到第一页
  planPaginationConfig.current = 1;
};

const resetPlanFilters = (): void => {
  planDateFilter.value = undefined;
  planUserFilter.value = '';
  planPaginationConfig.current = 1;

  // 重置用户筛选
  loadPlanUserOptions('');

  message.success('筛选条件已重置');
};

// 处理排班计划分页变化
const handlePlanPaginationChange = (pagination: any): void => {
  planPaginationConfig.current = pagination.current;
  planPaginationConfig.pageSize = pagination.pageSize;
};

// 导出计划
const exportPlan = (): void => {
  if (!futurePlanDialog.data) return;

  // 创建CSV内容
  const headers = ['日期', '星期', '值班人员', '值班类型'];
  const csvContent = [
    headers.join(','),
    ...filteredFuturePlans.value.map(plan => [
      plan.date,
      formatPlanWeekday(plan.date || ''),
      plan.target_user_name,
      '正常值班'
    ].join(','))
  ].join('\n');

  // 创建并下载文件
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${futurePlanDialog.groupName}_排班计划_${dayjs().format('YYYY-MM-DD')}.csv`;
  link.click();

  message.success('排班计划已导出');
};

const showAddModal = (): void => {
  resetAddForm();
  isAddModalVisible.value = true;
};

const resetAddForm = (): void => {
  if (addFormRef.value) {
    addFormRef.value.resetFields();
  }
  addForm.name = '';
  addForm.shiftDays = 7;
  addForm.userNames = [];
};

const closeAddModal = (): void => {
  resetAddForm();
  isAddModalVisible.value = false;
};

const showEditModal = (record: MonitorOnDutyGroup): void => {
  editForm.id = record.id;
  editForm.name = record.name;
  editForm.shiftDays = record.shift_days;

  // 确保从record中获取用户名
  if (Array.isArray(record.user_names) && record.user_names.length > 0) {
    editForm.userNames = [...record.user_names];
  } else if (Array.isArray(record.members) && record.members.length > 0) {
    // 如果user_names为空但members存在，从members中提取用户名
    editForm.userNames = record.members.map(member => member.username);
  } else {
    editForm.userNames = [];
  }

  // 确保这些用户名都存在于availableUsers中
  editForm.userNames.forEach(username => {
    if (!availableUsers.value.includes(username)) {
      availableUsers.value.push(username);
    }
  });

  isEditModalVisible.value = true;
};

const closeEditModal = (): void => {
  if (editFormRef.value) {
    editFormRef.value.resetFields();
  }
  isEditModalVisible.value = false;
};

const closeDetailDialog = (): void => {
  detailDialogVisible.value = false;
};

const closeFuturePlanDialog = (): void => {
  futurePlanDialogVisible.value = false;
  planDateFilter.value = undefined;
  planUserFilter.value = '';
};

const handleAdd = async (): Promise<void> => {
  try {
    await addFormRef.value.validate();
    loading.value = true;

    const memberIds = addForm.userNames.map(name => userMap.value[name]).filter((id): id is number => id !== undefined);

    const payload = {
      name: addForm.name.trim(),
      shift_days: addForm.shiftDays,
      member_ids: memberIds,
    };

    const response = await createMonitorOnDutyGroupApi(payload);

    if (response) {
      message.success('新增值班组成功');
      await fetchOnDutyGroups();
      closeAddModal();
    } else {
      message.error(response.msg || '新增值班组失败');
    }
  } catch (error: any) {
    console.error('新增值班组失败:', error);
    message.error(error.message || '新增值班组失败');
  } finally {
    loading.value = false;
  }
};

const handleUpdate = async (): Promise<void> => {
  try {
    await editFormRef.value.validate();
    loading.value = true;

    const memberIds = editForm.userNames.map(name => userMap.value[name]).filter((id): id is number => id !== undefined);

    const payload = {
      id: editForm.id,
      name: editForm.name.trim(),
      shift_days: editForm.shiftDays,
      member_ids: memberIds,
    };

    const response = await updateMonitorOnDutyGroupApi(payload);

    if (response) {
      message.success('更新值班组成功');
      await fetchOnDutyGroups();
      closeEditModal();
    } else {
      message.error(response.msg || '更新值班组失败');
    }
  } catch (error: any) {
    console.error('更新值班组失败:', error);
    message.error(error.message || '更新值班组失败');
  } finally {
    loading.value = false;
  }
};

const handleMenuClick = (command: string, record: MonitorOnDutyGroup): void => {
  switch (command) {
    case 'edit':
      showEditModal(record);
      break;
    case 'schedule':
      viewSchedule(record);
      break;
    case 'clone':
      message.info('暂未实现克隆功能');
      break;
    case 'delete':
      confirmDelete(record);
      break;
  }
};

const confirmDelete = (record: MonitorOnDutyGroup): void => {
  Modal.confirm({
    title: '警告',
    content: `确定要删除值班组 "${record.name}" 吗？`,
    okText: '删除',
    okType: 'danger',
    cancelText: '取消',
    async onOk() {
      try {
        const response = await deleteMonitorOnDutyGroupApi(record.id);

        if (response) {
          message.success(`值班组 "${record.name}" 已删除`);
          fetchOnDutyGroups();
        } else {
          message.error(response.msg || '删除值班组失败');
        }
      } catch (error: any) {
        console.error('删除值班组失败:', error);
        message.error(error.message || '删除值班组失败');
      }
    }
  });
};

const viewSchedule = (record: MonitorOnDutyGroup) => {
  router.push({
    name: 'MonitorOnDutyGroupTable',
    query: { id: record.id.toString() }
  });
};

// 生命周期钩子
onMounted(async () => {
  await Promise.all([
    fetchOnDutyGroups(),
    fetchUserList(1) // 只加载第一页用户
  ]);
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

.pool-name-text {
  font-weight: 500;
  word-break: break-all;
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

.prometheus-tag {
  background-color: #e6f7ff;
  color: #0958d9;
  border-left: 3px solid #1890ff;
}

.alert-tag {
  background-color: #fff7e6;
  color: #d46b08;
  border-left: 3px solid #fa8c16;
}

.label-tag {
  background-color: #f6ffed;
  color: #389e0d;
  border-left: 3px solid #52c41a;
}

.empty-text {
  color: #999;
  font-style: italic;
  font-size: 12px;
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

/* 未来排班计划样式 */
.future-plan-content {
  max-height: 70vh;
  overflow-y: auto;
}

.plan-header {
  margin-bottom: 20px;
}

.plan-header h3 {
  margin: 0 0 12px 0;
  font-size: 20px;
  color: #1f2937;
}

.plan-info {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.plan-filters {
  margin-bottom: 20px;
  padding: 16px;
  background: #f5f5f5;
  border-radius: 8px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.plan-timeline {
  margin-bottom: 20px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.timeline-date {
  text-align: right;
  padding-right: 12px;
}

.date-main {
  font-weight: 600;
  font-size: 14px;
  color: #1f2937;
}

.date-sub {
  font-size: 12px;
  color: #6b7280;
}

.timeline-content {
  padding: 8px 12px;
  background: #f8fafc;
  border-radius: 6px;
  border-left: 3px solid #1890ff;
}

.duty-user {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.user-name {
  font-weight: 500;
  color: #1f2937;
}

.today-tag,
.tomorrow-tag {
  font-size: 10px;
  padding: 2px 6px;
}

.duty-details {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #6b7280;
}

.duty-type {
  font-weight: 500;
}

.cycle-info {
  color: #9ca3af;
}

.plan-summary {
  margin-bottom: 20px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 8px;
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

  .detail-footer {
    justify-content: center;
  }

  .detail-footer .ant-btn {
    flex: 1;
    max-width: 120px;
  }

  .plan-filters {
    flex-direction: column;
    align-items: stretch;
  }

  .timeline-date {
    text-align: left;
    padding-right: 0;
    margin-bottom: 8px;
  }

  .duty-user {
    flex-wrap: wrap;
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

/* 时间轴样式优化 */
:deep(.ant-timeline-item-label) {
  width: 100px !important;
}

:deep(.ant-timeline-item-content) {
  margin-left: 120px !important;
}

@media (max-width: 768px) {
  :deep(.ant-timeline-item-label) {
    width: auto !important;
    position: relative !important;
  }

  :deep(.ant-timeline-item-content) {
    margin-left: 0 !important;
  }
}
</style>
