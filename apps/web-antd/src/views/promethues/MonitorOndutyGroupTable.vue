<template>
  <div class="duty-schedule-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="header-actions">
        <a-button type="primary" @click="handleCreateChange" class="btn-create">
          <template #icon>
            <PlusOutlined />
          </template>
          <span class="btn-text">创建换班记录</span>
        </a-button>
        <div class="search-filters">
          <a-input-search v-model:value="searchQuery" placeholder="搜索值班组名称..." class="search-input"
            @search="handleSearch" @change="handleSearchChange" allow-clear />
          <a-date-picker v-model:value="dateFilter" placeholder="选择日期" class="filter-select" @change="handleDateChange"
            allow-clear />
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
            <a-statistic title="总值班人数" :value="stats.totalOnDutyUsers" :value-style="{ color: '#3f8600' }">
              <template #prefix>
                <Icon icon="carbon:user-multiple" />
              </template>
            </a-statistic>
          </a-card>
        </a-col>
        <a-col :xs="12" :sm="6" :md="6" :lg="6">
          <a-card class="stats-card">
            <a-statistic title="今日值班" :value="stats.todayOnDuty" :value-style="{ color: '#52c41a' }">
              <template #prefix>
                <Icon icon="carbon:user-online" />
              </template>
            </a-statistic>
          </a-card>
        </a-col>
        <a-col :xs="12" :sm="6" :md="6" :lg="6">
          <a-card class="stats-card">
            <a-statistic title="换班记录" :value="stats.changeRecords" :value-style="{ color: '#faad14' }">
              <template #prefix>
                <Icon icon="carbon:change-catalog" />
              </template>
            </a-statistic>
          </a-card>
        </a-col>
        <a-col :xs="12" :sm="6" :md="6" :lg="6">
          <a-card class="stats-card">
            <a-statistic title="值班组" :value="stats.dutyGroups" :value-style="{ color: '#cf1322' }">
              <template #prefix>
                <Icon icon="carbon:group" />
              </template>
            </a-statistic>
          </a-card>
        </a-col>
      </a-row>
    </div>

    <!-- 日历展示区 -->
    <div class="table-container">
      <a-card>
        <div class="calendar-header">
          <div class="calendar-controls">
            <a-button @click="previousMonth" size="small">
              <template #icon>
                <Icon icon="carbon:chevron-left" />
              </template>
            </a-button>
            <span class="calendar-title">{{ currentMonthYear }}</span>
            <a-button @click="nextMonth" size="small">
              <template #icon>
                <Icon icon="carbon:chevron-right" />
              </template>
            </a-button>
          </div>
          <div class="duty-group-info">
            <span class="info-label">值班组：</span>
            <span class="info-value">{{ dutyGroupName }}</span>
          </div>
        </div>

        <div class="calendar">
          <div class="calendar-weekdays">
            <div class="weekday-header" v-for="weekday in weekdays" :key="weekday">
              {{ weekday }}
            </div>
          </div>

          <div class="calendar-days">
            <div class="calendar-day prev-month" v-for="day in previousMonthDays" :key="'prev-' + day.date">
              <div class="day-header">
                <div class="day-number">{{ day.date.split('-')[2] }}</div>
              </div>
              <div class="day-content">
                <div class="day-user" :class="{ 'no-user': !day.user_id }">
                  {{ day.user_id ? `值班人: ${day.create_user_name}` : '无值班人' }}
                </div>
              </div>
            </div>

            <div class="calendar-day" v-for="day in daysInMonth" :key="day.date"
              @click="isCurrentMonth(day.date) ? openSwapModal(day) : null" :class="{
                'has-user': day.user_id,
                'no-user': !day.user_id,
                'disabled': !isCurrentMonth(day.date),
                'today': isToday(day.date)
              }">
              <div class="day-header">
                <div class="day-number">{{ day.date.split('-')[2] }}</div>
                <div class="day-status" v-if="isToday(day.date)">今日</div>
              </div>
              <div class="day-content">
                <div class="duty-info-cell">
                  <div class="duty-badge" :class="getDutyStatusClass(day)"></div>
                  <span class="duty-name-text">
                    {{ day.user_id ? `值班人: ${day.create_user_name}` : '无值班人' }}
                  </span>
                </div>
                <div class="day-actions" v-if="day.user_id && isCurrentMonth(day.date)">
                  <a-button type="link" size="small" @click.stop="handleViewDay(day)">
                    查看
                  </a-button>
                  <a-button type="link" size="small" @click.stop="openSwapModal(day)">
                    换班
                  </a-button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </a-card>
    </div>

    <!-- 换班记录表格 -->
    <div class="table-container">
      <a-card>
        <template #title>
          <div class="card-title">
            <Icon icon="carbon:change-catalog" />
            换班记录
          </div>
        </template>

        <a-table :data-source="changeRecordList" :columns="changeColumns" :pagination="paginationConfig"
          :loading="loading" row-key="id" bordered :scroll="{ x: 1200 }" @change="handleTableChange">
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'date'">
              <div class="date-info">
                <span class="date">{{ formatDate(record.date) }}</span>
                <span class="time">{{ getDayOfWeek(record.date) }}</span>
              </div>
            </template>

            <template v-if="column.key === 'origin_user'">
              <div class="creator-info">
                <a-avatar size="small" :style="{ backgroundColor: getAvatarColor(record.origin_user_name || '') }">
                  {{ getInitials(record.origin_user_name) }}
                </a-avatar>
                <span class="creator-name">{{ record.origin_user_name }}</span>
              </div>
            </template>

            <template v-if="column.key === 'on_duty_user'">
              <div class="creator-info">
                <a-avatar size="small" :style="{ backgroundColor: getAvatarColor(record.target_user_name || '') }">
                  {{ getInitials(record.target_user_name) }}
                </a-avatar>
                <span class="creator-name">{{ record.target_user_name }}</span>
              </div>
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
                <span class="date">{{ formatDateFromTimestamp(record.created_at) }}</span>
                <span class="time">{{ formatTimeFromTimestamp(record.created_at) }}</span>
              </div>
            </template>

            <template v-if="column.key === 'action'">
              <div class="action-buttons">
                <a-button type="primary" size="small" @click="handleViewChange(record)">
                  查看
                </a-button>
                <a-button type="default" size="small" @click="handleEditChange(record)">
                  编辑
                </a-button>
                <a-button type="default" size="small" danger @click="handleDeleteChange(record)">
                  删除
                </a-button>
              </div>
            </template>
          </template>
        </a-table>
      </a-card>
    </div>

    <!-- 创建/编辑换班记录对话框 -->
    <a-modal :open="formDialogVisible" :title="formDialog.isEdit ? '编辑换班记录' : '创建换班记录'" :width="formDialogWidth"
      @ok="saveChange" @cancel="closeFormDialog" :destroy-on-close="true" class="responsive-modal change-modal">
      <a-form ref="formRef" :model="formDialog.form" :rules="formRules" layout="vertical">
        <div class="form-section">
          <div class="section-title">换班信息</div>
          <a-row :gutter="16">
            <a-col :span="24">
              <a-form-item label="值班组" name="on_duty_group_id" :rules="[{ required: true, message: '请选择值班组' }]">
                <a-select v-model:value="formDialog.form.on_duty_group_id" placeholder="请选择值班组" class="full-width"
                  show-search :loading="loadingDutyGroups" @search="handleDutyGroupSearch"
                  @focus="fetchDutyGroupOptions" @popupScroll="handleDutyGroupPopupScroll" :filter-option="false">
                  <a-select-option v-for="option in dutyGroupOptions" :key="option.value" :value="option.value">
                    {{ option.label }}
                  </a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
          </a-row>
          <a-row :gutter="16">
            <a-col :xs="24" :sm="12">
              <a-form-item label="换班日期" name="date" :rules="[{ required: true, message: '请选择换班日期' }]">
                <a-date-picker v-model:value="formDialog.form.date" placeholder="请选择换班日期" class="full-width" />
              </a-form-item>
            </a-col>
            <a-col :xs="24" :sm="12">
              <a-form-item label="原值班人" name="origin_user_id" :rules="[{ required: true, message: '原值班人信息' }]">
                <a-select v-model:value="formDialog.form.origin_user_id" placeholder="原值班人" class="full-width" disabled>
                  <a-select-option v-if="formDialog.form.origin_user_id" :value="formDialog.form.origin_user_id">
                    {{ formDialog.form.origin_user_name || '原值班人' }}
                  </a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
          </a-row>
          <a-row :gutter="16">
            <a-col :span="24">
              <a-form-item label="新值班人" name="on_duty_user_id" :rules="[{ required: true, message: '请选择新值班人' }]">
                <a-select v-model:value="formDialog.form.on_duty_user_id" placeholder="请选择新值班人" class="full-width"
                  show-search :loading="loadingNewUsers" @search="handleNewUserSearch" @focus="fetchNewUserOptions"
                  @popupScroll="handleNewUserPopupScroll" :filter-option="false">
                  <a-select-option v-for="option in newUserOptions" :key="option.value" :value="option.value">
                    {{ option.label }}
                  </a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
          </a-row>
        </div>
      </a-form>
    </a-modal>

    <!-- 详情对话框 -->
    <a-modal :open="detailDialogVisible" title="换班记录详情" :width="previewDialogWidth" :footer="null"
      @cancel="closeDetailDialog" class="detail-dialog">
      <div v-if="detailDialog.form" class="change-details">
        <div class="detail-header">
          <h2>换班记录详情</h2>
          <div class="detail-badges">
            <a-tag color="blue">{{ formatDate(detailDialog.form.date) }}</a-tag>
          </div>
        </div>

        <a-descriptions bordered :column="1" :labelStyle="{ width: '150px' }">
          <a-descriptions-item label="记录ID">{{ detailDialog.form.id }}</a-descriptions-item>
          <a-descriptions-item label="值班组">{{ detailDialog.form.pool_name }}</a-descriptions-item>
          <a-descriptions-item label="换班日期">{{ formatDate(detailDialog.form.date) }}</a-descriptions-item>
          <a-descriptions-item label="原值班人">{{ detailDialog.form.origin_user_name }}</a-descriptions-item>
          <a-descriptions-item label="新值班人">{{ detailDialog.form.target_user_name }}</a-descriptions-item>
          <a-descriptions-item label="创建人">{{ detailDialog.form.creator_name }}</a-descriptions-item>
          <a-descriptions-item label="创建时间">{{ formatFullDateTime(detailDialog.form.created_at) }}</a-descriptions-item>
        </a-descriptions>

        <div class="detail-footer">
          <a-button @click="closeDetailDialog">关闭</a-button>
          <a-button type="primary" @click="handleEditChange(detailDialog.form)">编辑</a-button>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { message, Modal } from 'ant-design-vue';
import dayjs, { Dayjs } from 'dayjs';
import {
  PlusOutlined
} from '@ant-design/icons-vue';
import { Icon } from '@iconify/vue';
import {
  getMonitorOnDutyGroupDetailApi,
  getMonitorOnDutyGroupFuturePlanApi,
  createMonitorOnDutyGroupChangeApi,
  getMonitorOnDutyGroupListApi,
  updateMonitorOnDutyGroupApi,
  deleteMonitorOnDutyGroupApi,
  type MonitorOnDutyChange,
  type createOnDutychangeReq,
  type updateOnDutyReq,
  getMonitorOnDutyGroupListApi as getAllOnDutyGroupsApi
} from '#/api/core/prometheus_onduty';
import { getUserList } from '#/api/core/user';

// 扩展值班变更类型，添加组件中使用的属性
interface ExtendedMonitorOnDutyChange extends MonitorOnDutyChange {
  on_duty_user_name?: string;
  create_user_name?: string;
}

// 用户选项接口
interface UserOption {
  value: number;
  label: string;
}

// 值班组选项接口
interface DutyGroupOption {
  value: number;
  label: string;
}

// 定义接口
interface Day {
  date: string;
  weekday: string;
  user_id: number | null;
  create_user_name: string;
}

// 响应式对话框宽度
const formDialogWidth = computed(() => {
  if (typeof window !== 'undefined') {
    const width = window.innerWidth;
    if (width < 768) return '95%';
    if (width < 1024) return '90%';
    return '600px';
  }
  return '600px';
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
const changeColumns = [
  { title: '换班日期', dataIndex: 'date', key: 'date', width: 150 },
  { title: '值班组', dataIndex: 'pool_name', key: 'on_duty_group', width: 120 },
  { title: '原值班人', dataIndex: 'origin_user_name', key: 'origin_user', width: 120 },
  { title: '新值班人', dataIndex: 'target_user_name', key: 'on_duty_user', width: 120 },
  { title: '创建人', dataIndex: 'creator_name', key: 'creator', width: 120 },
  { title: '创建时间', dataIndex: 'created_at', key: 'createdAt', width: 180 },
  { title: '操作', key: 'action', width: 200, align: 'center' as const, fixed: 'right' }
];

// 状态数据
const route = useRoute();
const loading = ref(false);
const searchQuery = ref('');
const dateFilter = ref<Dayjs>();
const dutyGroupName = ref('');
const createUserName = ref('');
const currentDate = ref(new Date());

// 用户和值班组选项
const userOptions = ref<UserOption[]>([]);
const dutyGroupOptions = ref<DutyGroupOption[]>([]);
const originUserOptions = ref<UserOption[]>([]);
const newUserOptions = ref<UserOption[]>([]);
const loadingOptions = ref(false);
const loadingDutyGroups = ref(false);
const loadingOriginUsers = ref(false);
const loadingNewUsers = ref(false);

// 分页配置 - 下拉框选项
const dutyGroupPagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  hasMore: true,
  searchQuery: ''
});

const originUserPagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  hasMore: true,
  searchQuery: ''
});

const newUserPagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  hasMore: true,
  searchQuery: ''
});

// 周显示
const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

// 日历数据
const daysInMonth = ref<Day[]>([]);
const previousMonthDays = ref<Day[]>([]);
const changeRecordList = ref<ExtendedMonitorOnDutyChange[]>([]);

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
  totalOnDutyUsers: 0,
  todayOnDuty: 0,
  changeRecords: 0,
  dutyGroups: 1
});

// 对话框状态
const formDialogVisible = ref(false);
const detailDialogVisible = ref(false);

// 表单对话框数据
const formDialog = reactive({
  isEdit: false,
  form: {
    id: undefined as number | undefined,
    on_duty_group_id: 0,
    date: undefined as Dayjs | undefined,
    origin_user_id: 0,
    origin_user_name: '',
    on_duty_user_id: null as number | null
  }
});

// 详情对话框数据
const detailDialog = reactive({
  form: null as ExtendedMonitorOnDutyChange | null
});

// 表单验证规则
const formRules = {
  on_duty_group_id: [
    { required: true, message: '请选择值班组', trigger: 'change' }
  ],
  date: [
    { required: true, message: '请选择换班日期', trigger: 'change' }
  ],
  origin_user_id: [
    { required: true, message: '请选择原值班人', trigger: 'change' }
  ],
  on_duty_user_id: [
    { required: true, message: '请选择新值班人', trigger: 'change' }
  ]
};

// 计算属性
const currentMonthYear = computed(() => {
  return `${currentDate.value.getFullYear()}年${currentDate.value.getMonth() + 1}月`;
});

// 辅助方法
const getDutyStatusClass = (day: Day): string => {
  if (day.user_id) return 'status-has-duty';
  return 'status-no-duty';
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

const formatDate = (dateStr: string): string => {
  if (!dateStr) return '';
  return dayjs(dateStr).format('YYYY-MM-DD');
};

const formatDateFromTimestamp = (timestamp: number): string => {
  if (!timestamp) return '';
  return dayjs(timestamp * 1000).format('YYYY-MM-DD');
};

const formatTimeFromTimestamp = (timestamp: number): string => {
  if (!timestamp) return '';
  return dayjs(timestamp * 1000).format('HH:mm');
};

const formatFullDateTime = (timestamp: number): string => {
  if (!timestamp) return '';
  return dayjs(timestamp * 1000).format('YYYY-MM-DD HH:mm:ss');
};

const getDayOfWeek = (dateStr: string): string => {
  if (!dateStr) return '';
  return dayjs(dateStr).format('dddd');
};

const isCurrentMonth = (dateStr: string): boolean => {
  const date = dayjs(dateStr);
  const current = dayjs(currentDate.value);
  return date.isSame(current, 'month');
};

const isToday = (dateStr: string): boolean => {
  return dayjs(dateStr).isSame(dayjs(), 'day');
};

// 月份导航
const previousMonth = (): void => {
  const newDate = new Date(currentDate.value);
  newDate.setMonth(newDate.getMonth() - 1);
  currentDate.value = newDate;
  fetchDutySchedule();
};

const nextMonth = (): void => {
  const newDate = new Date(currentDate.value);
  newDate.setMonth(newDate.getMonth() + 1);
  currentDate.value = newDate;
  fetchDutySchedule();
};

// 更新统计数据
const updateStats = (): void => {
  stats.changeRecords = changeRecordList.value.length;
  stats.todayOnDuty = daysInMonth.value.filter(day => isToday(day.date) && day.user_id).length;
  stats.totalOnDutyUsers = daysInMonth.value.filter(day => day.user_id).length;
};

// 值班组选项加载
const fetchDutyGroupOptions = async (initial = true): Promise<void> => {
  if (initial) {
    dutyGroupPagination.current = 1;
    dutyGroupOptions.value = [];
    dutyGroupPagination.hasMore = true;
  }

  if (!dutyGroupPagination.hasMore) return;

  loadingDutyGroups.value = true;
  try {
    const response = await getAllOnDutyGroupsApi({
      page: dutyGroupPagination.current,
      size: dutyGroupPagination.pageSize,
      search: dutyGroupPagination.searchQuery
    });

    if (response && response.items) {
      const newOptions = response.items.map((group: any) => ({
        value: group.id,
        label: group.name || `值班组${group.id}`
      }));

      if (initial) {
        dutyGroupOptions.value = newOptions;
      } else {
        dutyGroupOptions.value = [...dutyGroupOptions.value, ...newOptions];
      }

      dutyGroupPagination.total = response.total || 0;
      dutyGroupPagination.hasMore = dutyGroupPagination.current * dutyGroupPagination.pageSize < dutyGroupPagination.total;
      dutyGroupPagination.current++;
    }
  } catch (error: any) {
    console.error('获取值班组选项失败:', error);
    message.error(error.message || '获取值班组选项失败');
  } finally {
    loadingDutyGroups.value = false;
  }
};

const handleDutyGroupSearch = (value: string): void => {
  dutyGroupPagination.searchQuery = value;
  fetchDutyGroupOptions();
};

const handleDutyGroupPopupScroll = (e: UIEvent): void => {
  const target = e.target as HTMLElement;
  if (target.scrollHeight - target.scrollTop - target.clientHeight < 1) {
    fetchDutyGroupOptions(false);
  }
};

// 获取值班组成员
const fetchDutyGroupMembers = async (groupId: number): Promise<any[]> => {
  if (!groupId) return [];
  try {
    const response = await getMonitorOnDutyGroupDetailApi(groupId);
    if (response && response.members) {
      return response.members;
    }
    return [];
  } catch (error: any) {
    console.error('获取值班组成员失败:', error);
    return [];
  }
};

// We've removed fetchOriginUserOptions, handleOriginUserSearch, and handleOriginUserPopupScroll
// since the original on-duty user field is now read-only

// 新值班人选项加载
const fetchNewUserOptions = async (initial = true): Promise<void> => {
  if (initial) {
    newUserPagination.current = 1;
    newUserOptions.value = [];
    newUserPagination.hasMore = true;
  }

  if (!newUserPagination.hasMore) return;

  const groupId = formDialog.form.on_duty_group_id;
  if (!groupId) {
    message.warning('请先选择值班组');
    return;
  }

  loadingNewUsers.value = true;
  try {
    // 获取值班组成员
    const groupMembers = await fetchDutyGroupMembers(groupId);

    if (groupMembers && groupMembers.length > 0) {
      // 将值班组成员转换为选项
      const filteredOptions = groupMembers
        .filter((member) => {
          // 如果有搜索关键字，则过滤
          if (!newUserPagination.searchQuery) return true;
          return member.username && member.username.toLowerCase().includes(newUserPagination.searchQuery.toLowerCase());
        })
        .slice(
          (newUserPagination.current - 1) * newUserPagination.pageSize,
          newUserPagination.current * newUserPagination.pageSize
        )
        .map((member) => ({
          value: member.id,
          label: member.username || `用户${member.id}`
        }));

      if (initial) {
        newUserOptions.value = filteredOptions;
      } else {
        newUserOptions.value = [...newUserOptions.value, ...filteredOptions];
      }

      newUserPagination.total = groupMembers.length;
      newUserPagination.hasMore = newUserPagination.current * newUserPagination.pageSize < newUserPagination.total;
      newUserPagination.current++;
    } else {
      if (initial) {
        newUserOptions.value = [];
      }
      newUserPagination.total = 0;
      newUserPagination.hasMore = false;
    }
  } catch (error: any) {
    console.error('获取新值班人选项失败:', error);
    message.error(error.message || '获取新值班人选项失败');
  } finally {
    loadingNewUsers.value = false;
  }
};

const handleNewUserSearch = (value: string): void => {
  newUserPagination.searchQuery = value;
  fetchNewUserOptions();
};

const handleNewUserPopupScroll = (e: UIEvent): void => {
  const target = e.target as HTMLElement;
  if (target.scrollHeight - target.scrollTop - target.clientHeight < 1) {
    fetchNewUserOptions(false);
  }
};

// 替换原来的fetchOptions函数
const fetchOptions = async (): Promise<void> => {
  fetchDutyGroupOptions();
  if (formDialog.form.on_duty_group_id) {
    fetchNewUserOptions();
  }
};

// 监听值班组变化，刷新用户选项
watch(() => formDialog.form.on_duty_group_id, (newVal) => {
  if (newVal) {
    // 重置并加载新值班人选项
    newUserPagination.current = 1;
    newUserOptions.value = [];
    fetchNewUserOptions();
  } else {
    // 清空新值班人选项
    newUserOptions.value = [];
  }
});

// 数据加载
const fetchDutyGroups = async (): Promise<void> => {
  try {
    const id = parseInt(route.query.id as string) || 0;
    const response = await getMonitorOnDutyGroupDetailApi(id);

    if (response) {
      dutyGroupName.value = response.name || '未知值班组';
      createUserName.value = response.creator_name || '';
      formDialog.form.on_duty_group_id = id;
    } else {
      message.error(response.msg || '获取值班组信息失败');
    }
  } catch (error: any) {
    console.error('获取值班组信息失败:', error);
    message.error(error.message || '获取值班组信息失败');
  }
};

const fetchDutySchedule = async (): Promise<void> => {
  loading.value = true;
  try {
    const id = parseInt(route.query.id as string) || 0;

    // 设置起始和结束时间，获取当前月份的数据
    const currentMonth = dayjs(currentDate.value);
    const startOfMonth = currentMonth.startOf('month').format('YYYY-MM-DD');
    const endOfMonth = currentMonth.endOf('month').format('YYYY-MM-DD');

    const response = await getMonitorOnDutyGroupFuturePlanApi(id, {
      start_time: startOfMonth,
      end_time: endOfMonth
    });

    if (response) {
      const currentMonth = dayjs(currentDate.value);
      const startOfMonth = currentMonth.startOf('month');
      const endOfMonth = currentMonth.endOf('month');

      // 生成当月所有日期
      const days: Day[] = [];
      for (let date = startOfMonth; date.isBefore(endOfMonth) || date.isSame(endOfMonth); date = date.add(1, 'day')) {
        const dateStr = date.format('YYYY-MM-DD');
        const detail = response.details?.find((item: any) => item.date === dateStr);

        days.push({
          date: dateStr,
          weekday: date.format('dddd'),
          user_id: detail?.user?.id || null,
          create_user_name: detail?.user?.username || createUserName.value || ''
        });
      }

      daysInMonth.value = days;

      // 生成上月末尾几天
      const firstDayOfMonth = startOfMonth;
      const startWeekday = firstDayOfMonth.day();
      const prevDays: Day[] = [];

      for (let i = startWeekday - 1; i >= 0; i--) {
        const prevDate = firstDayOfMonth.subtract(i + 1, 'day');
        const dateStr = prevDate.format('YYYY-MM-DD');
        const detail = response.details?.find((item: any) => item.date === dateStr);

        prevDays.push({
          date: dateStr,
          weekday: prevDate.format('dddd'),
          user_id: detail?.user?.id || null,
          create_user_name: detail?.user?.username || createUserName.value || ''
        });
      }

      previousMonthDays.value = prevDays;
      updateStats();
    } else {
      message.error('获取值班计划失败');
    }
  } catch (error: any) {
    console.error('获取值班计划失败:', error);
    message.error(error.message || '获取值班计划失败');
  } finally {
    loading.value = false;
  }
};

const loadChangeRecords = async (): Promise<void> => {
  loading.value = true;
  try {
    const id = parseInt(route.query.id as string) || 0;

    // 使用正确的API参数
    const params = {
      page: paginationConfig.current,
      size: paginationConfig.pageSize,
      search: searchQuery.value,
      on_duty_group_id: id
    };

    const response = await getMonitorOnDutyGroupListApi(params);

    if (response) {
      changeRecordList.value = response.items || [];
      paginationConfig.total = response.total || 0;
      updateStats();
    } else {
      message.error(response.msg || '加载换班记录失败');
    }
  } catch (error: any) {
    console.error('加载换班记录失败:', error);
    message.error(error.message || '加载换班记录失败');
  } finally {
    loading.value = false;
  }
};

// 事件处理
const handleTableChange = (pagination: any): void => {
  paginationConfig.current = pagination.current;
  paginationConfig.pageSize = pagination.pageSize;
  loadChangeRecords();
};

const handleSearch = (): void => {
  paginationConfig.current = 1;
  loadChangeRecords();
};

const handleSearchChange = (): void => {
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }
  searchTimeout = setTimeout(() => {
    paginationConfig.current = 1;
    loadChangeRecords();
  }, 500);
};

const handleDateChange = (): void => {
  paginationConfig.current = 1;
  loadChangeRecords();
};

const handleResetFilters = (): void => {
  searchQuery.value = '';
  dateFilter.value = undefined;
  paginationConfig.current = 1;
  loadChangeRecords();
  message.success('过滤条件已重置');
};

const handleCreateChange = (): void => {
  formDialog.isEdit = false;
  resetFormDialog();
  formDialogVisible.value = true;
  fetchOptions();
};

const handleEditChange = (record: ExtendedMonitorOnDutyChange): void => {
  formDialog.isEdit = true;
  formDialog.form = {
    id: record.id,
    on_duty_group_id: record.on_duty_group_id,
    date: dayjs(record.date),
    origin_user_id: record.origin_user_id,
    origin_user_name: record.origin_user_name || '',
    on_duty_user_id: record.on_duty_user_id
  };
  formDialogVisible.value = true;
  detailDialogVisible.value = false;
  fetchOptions();
};

const handleViewChange = (record: ExtendedMonitorOnDutyChange): void => {
  detailDialog.form = record;
  detailDialogVisible.value = true;
};

const handleViewDay = (day: Day): void => {
  message.info(`${day.date} 值班人：${day.create_user_name}`);
};

const handleDeleteChange = (record: ExtendedMonitorOnDutyChange): void => {
  Modal.confirm({
    title: '警告',
    content: `确定要删除这条换班记录吗？`,
    okText: '删除',
    okType: 'danger',
    cancelText: '取消',
    async onOk() {
      try {
        const response = await deleteMonitorOnDutyGroupApi(record.id);
        if (response.code === 0) {
          message.success('换班记录已删除');
          loadChangeRecords();
        } else {
          message.error(response.msg || '删除换班记录失败');
        }
      } catch (error: any) {
        console.error('删除换班记录失败:', error);
        message.error(error.message || '删除换班记录失败');
      }
    }
  });
};

const openSwapModal = (day: Day): void => {
  formDialog.isEdit = false;
  formDialog.form = {
    id: undefined,
    on_duty_group_id: parseInt(route.query.id as string) || 0,
    date: dayjs(day.date),
    origin_user_id: day.user_id || 0,
    origin_user_name: day.create_user_name || '',
    on_duty_user_id: null
  };
  formDialogVisible.value = true;
  fetchOptions();
};

// 表单保存
const saveChange = async (): Promise<void> => {
  if (!formDialog.form.date) {
    message.error('请选择换班日期');
    return;
  }

  if (formDialog.form.on_duty_user_id === null) {
    message.error('请选择新值班人');
    return;
  }

  try {
    const formData = {
      on_duty_group_id: formDialog.form.on_duty_group_id,
      date: formDialog.form.date.format('YYYY-MM-DD'),
      origin_user_id: formDialog.form.origin_user_id,
      on_duty_user_id: formDialog.form.on_duty_user_id as number // Type assertion since we've validated it's not null
    };

    if (formDialog.isEdit && formDialog.form.id) {
      const updateData: updateOnDutyReq = {
        id: formDialog.form.id,
        name: "", // Required by updateOnDutyReq
        shift_days: 0, // Required by updateOnDutyReq
        member_ids: [] // Required by updateOnDutyReq
      };
      const response = await updateMonitorOnDutyGroupApi(updateData);
      if (response.code === 0) {
        message.success('换班记录已更新');
        formDialogVisible.value = false;
        loadChangeRecords();
        fetchDutySchedule();
      } else {
        message.error(response.msg || '更新换班记录失败');
      }
    } else {
      const createData: createOnDutychangeReq = formData;
      const response = await createMonitorOnDutyGroupChangeApi(createData);
      if (response) {
        message.success('换班记录已创建');
        formDialogVisible.value = false;
        loadChangeRecords();
        fetchDutySchedule();
      } else {
        message.error(response.msg || '创建换班记录失败');
      }
    }
  } catch (error: any) {
    console.error('保存换班记录失败:', error);
    message.error(error.message || '保存换班记录失败');
  }
};

// 重置表单对话框
const resetFormDialog = (): void => {
  formDialog.form = {
    id: undefined,
    on_duty_group_id: parseInt(route.query.id as string) || 0,
    date: undefined,
    origin_user_id: 0,
    origin_user_name: '',
    on_duty_user_id: null
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
  fetchOptions();
  fetchDutyGroups();
  fetchDutySchedule();
  loadChangeRecords();
});
</script>

<style scoped>
.duty-schedule-container {
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
  width: 150px;
  min-width: 120px;
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

.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

/* 日历样式 */
.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}

.calendar-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.calendar-title {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
}

.duty-group-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.info-label {
  font-weight: 500;
  color: #666;
}

.info-value {
  font-weight: 600;
  color: #1890ff;
}

.calendar {
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  overflow: hidden;
}

.calendar-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  background: #fafafa;
}

.weekday-header {
  padding: 12px;
  text-align: center;
  font-weight: 600;
  color: #666;
  border-right: 1px solid #f0f0f0;
}

.weekday-header:last-child {
  border-right: none;
}

.calendar-days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
}

.calendar-day {
  border-right: 1px solid #f0f0f0;
  border-bottom: 1px solid #f0f0f0;
  min-height: 120px;
  background: #fff;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  flex-direction: column;
}

.calendar-day:nth-child(7n) {
  border-right: none;
}

.calendar-day:hover {
  background: #f8f9fa;
}

.calendar-day.has-user {
  border-left: 4px solid #52c41a;
}

.calendar-day.no-user {
  border-left: 4px solid #ff4d4f;
}

.calendar-day.prev-month {
  background: #f9f9f9;
  color: #ccc;
  cursor: default;
}

.calendar-day.disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.calendar-day.today {
  background: #e6f7ff;
  border-color: #1890ff;
}

.day-header {
  padding: 8px 12px;
  background: #fafafa;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.day-number {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.day-status {
  font-size: 10px;
  padding: 2px 6px;
  background: #1890ff;
  color: white;
  border-radius: 4px;
}

.day-content {
  padding: 8px 12px;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.duty-info-cell {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.duty-badge {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-has-duty {
  background-color: #52c41a;
}

.status-no-duty {
  background-color: #ff4d4f;
}

.duty-name-text {
  font-size: 12px;
  color: #666;
  word-break: break-all;
  line-height: 1.4;
}

.day-actions {
  display: flex;
  gap: 4px;
  justify-content: flex-end;
}

.day-actions .ant-btn {
  padding: 0 4px;
  font-size: 10px;
  height: 20px;
  line-height: 18px;
}

/* 表格相关样式 */
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
.detail-dialog .change-details {
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
  .duty-schedule-container {
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

  .calendar-header {
    flex-direction: column;
    align-items: stretch;
  }

  .duty-group-info {
    justify-content: center;
  }

  .calendar-days {
    grid-template-columns: repeat(7, 1fr);
  }

  .calendar-day {
    min-height: 80px;
  }

  .duty-name-text {
    font-size: 10px;
  }

  .day-actions {
    flex-direction: column;
    gap: 2px;
  }

  .action-buttons {
    gap: 2px;
  }

  .action-buttons .ant-btn {
    padding: 0 4px;
    font-size: 12px;
  }
}

@media (max-width: 480px) {
  .calendar-weekdays {
    display: none;
  }

  .calendar-day {
    min-height: 60px;
  }

  .duty-name-text {
    font-size: 9px;
  }

  .day-number {
    font-size: 14px;
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
