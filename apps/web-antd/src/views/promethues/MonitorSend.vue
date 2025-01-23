<template>
  <div>
    <!-- 查询和操作 -->
    <div class="custom-toolbar">
      <div class="search-filters">
        <a-input
          v-model:value="searchText"
          placeholder="请输入发送组名称"
          style="width: 200px"
        />
      </div>
      <div class="action-buttons">
        <a-button type="primary" @click="showAddModal">新增发送组</a-button>
      </div>
    </div>

    <!-- 发送组列表表格 -->
    <a-table :columns="columns" :data-source="filteredData" row-key="id">
      <template #enable="{ record }">
        {{ record.enable === 1 ? '启用' : '禁用' }}
      </template>
      <template #sendResolved="{ record }">
        {{ record.sendResolved === 1 ? '是' : '否' }}
      </template>
      <template #upgradeUsers="{ record }">
        {{ record.upgradeUsers.join(', ') }}
      </template>
      <template #action="{ record }">
        <a-space>
          <a-button type="primary" ghost size="small" @click="showEditModal(record)">
            <template #icon><EditOutlined /></template>
            编辑
          </a-button>
          <a-button type="primary" danger ghost size="small" @click="handleDelete(record)">
            <template #icon><DeleteOutlined /></template>
            删除
          </a-button>
        </a-space>
      </template>
    </a-table>

    <!-- 新增/编辑模态框 -->
    <a-modal
      v-model:visible="isModalVisible"
      title="发送组"
      @ok="handleSubmit"
      @cancel="resetForm"
    >
      <a-form :model="form" :rules="rules">
        <a-form-item
          label="发送组名称"
          name="name"
          :rules="[{ required: true, message: '请输入发送组名称' }]"
        >
          <a-input v-model:value="form.name" />
        </a-form-item>
        <a-form-item
          label="发送组中文名称"
          name="nameZh"
          :rules="[{ required: true, message: '请输入发送组中文名称' }]"
        >
          <a-input v-model:value="form.nameZh" />
        </a-form-item>
        <a-form-item label="是否启用" name="enable">
          <a-select v-model:value="form.enable">
            <a-select-option :value="1">启用</a-select-option>
            <a-select-option :value="2">禁用</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="关联采集池ID" name="poolId">
          <a-input-number v-model:value="form.poolId" :min="1" />
        </a-form-item>
        <a-form-item label="关联值班组ID" name="onDutyGroupId">
          <a-input-number v-model:value="form.onDutyGroupId" :min="1" />
        </a-form-item>
        <a-form-item label="重复发送时间" name="repeatInterval">
          <a-input v-model:value="form.repeatInterval" placeholder="默认30s" />
        </a-form-item>
        <a-form-item label="是否发送恢复消息" name="sendResolved">
          <a-select v-model:value="form.sendResolved">
            <a-select-option :value="1">发送</a-select-option>
            <a-select-option :value="2">不发送</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="需要升级" name="needUpgrade">
          <a-select v-model:value="form.needUpgrade">
            <a-select-option :value="1">需要</a-select-option>
            <a-select-option :value="2">不需要</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="飞书群机器人 Token" name="feiShuQunRobotToken">
          <a-input v-model:value="form.feiShuQunRobotToken" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script lang="ts" setup>
import { computed, reactive, ref } from 'vue';
import { message, Modal } from 'ant-design-vue';
import {
  getMonitorSendGroupApi,
  createMonitorSendGroupApi,
  updateMonitorSendGroupApi,
  deleteMonitorSendGroupApi,
  getUserList,
} from '#/api'; // 你的 API 方法

const columns = [
  {
    title: 'id',
    dataIndex: 'id',
    key: 'id',
  },
  {
    title: '发送组名称',
    dataIndex: 'name',
    key: 'name',
  },
  {
    title: '发送组中文名称',
    dataIndex: 'nameZh',
    key: 'nameZh',
  },
  {
    title: '关联采集池ID',
    dataIndex: 'poolId',
    key: 'poolId',
  },
  {
    title: '关联值班组ID',
    dataIndex: 'onDutyGroupId',
    key: 'onDutyGroupId',
  },
  {
    title: '是否启用',
    dataIndex: 'enable',
    key: 'enable',
    customRender: ({ record }: { record: SendGroup }) =>
      record.enable === 1 ? '启用' : '禁用',
  },
  {
    title: '重复发送时间',
    dataIndex: 'repeatInterval',
    key: 'repeatInterval',
  },
  {
    title: '是否发送恢复消息',
    dataIndex: 'sendResolved',
    key: 'sendResolved',
    customRender: ({ record }: { record: SendGroup }) =>
      record.sendResolved === 1 ? '是' : '否',
  },
  {
    title: '需要升级',
    dataIndex: 'needUpgrade',
    key: 'needUpgrade',
    customRender: ({ record }: { record: SendGroup }) =>
      record.needUpgrade === 1 ? '需要' : '不需要',
  },
  {
    title: '操作',
    dataIndex: 'action',
    key: 'action',
    slots: { customRender: 'action' },
  },
];

interface SendGroup {
  id: number;
  name: string;
  nameZh: string;
  enable: number;
  poolId: number;
  onDutyGroupId: number;
  staticReceiveUsers: string[];
  feiShuQunRobotToken: string;
  repeatInterval: string;
  sendResolved: number;
  notifyMethods: string[];
  needUpgrade: number;
  firstUpgradeUsers: string[];
  upgradeMinutes: number;
  secondUpgradeUsers: string[];
}

const data = reactive<SendGroup[]>([]); // 后端数据
const searchText = ref('');
const filteredData = computed(() => {
  const searchValue = searchText.value.trim().toLowerCase();
  return data.filter(
    (item) =>
      item.name.toLowerCase().includes(searchValue) ||
      item.nameZh.toLowerCase().includes(searchValue),
  );
});

const isModalVisible = ref(false);
const form = reactive({
  id: 0,
  name: '',
  nameZh: '',
  enable: 0,
  poolId: 0,
  onDutyGroupId: 0,
  staticReceiveUsers: null,
  feiShuQunRobotToken: '',
  repeatInterval: '',
  sendResolved: 0,
  notifyMethods: null,
  needUpgrade: 0,
  firstUpgradeUsers: null,
  upgradeMinutes: 0,
  secondUpgradeUsers: null,
});

const createForm = reactive({
  name: '',
  nameZh: '',
  enable: 0,
  poolId: 0,
  onDutyGroupId: 0,
  staticReceiveUsers: null,
  feiShuQunRobotToken: '',
  repeatInterval: '',
  sendResolved: 0,
  notifyMethods: null,
  needUpgrade: 0,
  firstUpgradeUsers: null,
  upgradeMinutes: 0,
  secondUpgradeUsers: null,
});

const userOptions = ref([]); // 用户下拉框选项

const rules = {
  name: [{ required: true, message: '请输入发送组名称' }],
  nameZh: [{ required: true, message: '请输入发送组中文名称' }],
};

// 获取用户列表
const fetchUsers = async () => {
  try {
    const users = await getUserList(); // 调用获取用户的 API
    userOptions.value = users.map((user: { username: any; id: any }) => ({
      label: user.username,
      value: user.id,
    }));
  } catch (error) {
    message.error(error.message || '获取用户列表失败');
    console.error(error);
  }
};

const showAddModal = () => {
  resetForm();
  isModalVisible.value = true;
};

const showEditModal = (record: SendGroup) => {
  Object.assign(form, {
    ...record,
    enable: record.enable || 1,
    sendResolved: record.sendResolved || 1,
    needUpgrade: record.needUpgrade || 1,
    staticReceiveUsers: record.staticReceiveUsers || [],
    notifyMethods: record.notifyMethods || [],
    firstUpgradeUsers: record.firstUpgradeUsers || [],
    secondUpgradeUsers: record.secondUpgradeUsers || [],
  });

  isModalVisible.value = true;
};

const resetForm = () => {
  Object.assign(form, {
    id: 0,
    name: '',
    nameZh: '',
    enable: 1,
    repeatInterval: '30s',
    sendResolved: 1,
    needUpgrade: 1,
    staticReceiveUsers: [],
    notifyMethods: [],
    firstUpgradeUsers: [],
    secondUpgradeUsers: [],
  });
  isModalVisible.value = false;
};

const handleSubmit = async () => {
  try {
    const submitData = {
      id : form.id,
      name: form.name,
      nameZh: form.nameZh,
      enable: parseInt(form.enable),
      poolId: form.poolId,
      sendResolved: parseInt(form.sendResolved),
      onDutyGroupId: form.onDutyGroupId,
      needUpgrade: parseInt(form.needUpgrade),
      repeatInterval: form.repeatInterval,
      feiShuQunRobotToken: form.feiShuQunRobotToken,
    };

    if (form.id === 0) {
      // 新增发送组
      await createMonitorSendGroupApi(submitData);
      message.success('新增发送组成功');
    } else {
      // 编辑发送组，添加 id 字段
      submitData.id = form.id;
      await updateMonitorSendGroupApi(submitData);
      message.success('编辑发送组成功');
    }

    resetForm();
    fetchSendGroups(); // 刷新发送组列表
  } catch (error: any) {
    message.error(error.message || '提交失败，请重试');
    console.error(error);
  }
};

const handleDelete = (record: SendGroup) => {
  Modal.confirm({
    title: '确认删除',
    content: `您确定要删除发送组 "${record.nameZh}" 吗？`,
    onOk: async () => {
      try {
        // 删除逻辑，假设有一个 deleteMonitorSendGroupApi 方法
        await deleteMonitorSendGroupApi(record.id);
        message.success('发送组已删除');
        fetchSendGroups(); // 刷新发送组列表
      } catch (error: any) {
        message.error(error.message || '删除失败，请重试');
        console.error(error);
      }
    },
  });
};

// 组件加载时获取用户列表和发送组
fetchUsers();
const fetchSendGroups = async () => {
  try {
    const response = await getMonitorSendGroupApi(); // 获取发送组数据
    data.splice(0, data.length, ...response); // 清空 data 并重新赋值
  } catch (error: any) {
    message.error(error.message || '获取发送组数据失败');
    console.error(error);
  }
};

fetchSendGroups(); // 初始加载发送组
</script>

<style scoped>
.custom-toolbar {
  padding: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.search-filters {
  display: flex;
  gap: 16px;
  align-items: center;
}

.action-buttons {
  display: flex;
  gap: 8px;
  align-items: center;
}
</style>
