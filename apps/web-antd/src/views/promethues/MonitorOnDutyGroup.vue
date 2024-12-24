<template>
  <div>
    <!-- 查询和操作 -->
    <div class="custom-toolbar">
      <!-- 查询功能 -->
      <div class="search-filters">
        <!-- 搜索输入框 -->
        <a-input
          v-model:value="searchText"
          placeholder="请输入值班组名称"
          style="width: 200px"
          allow-clear
        />
      </div>
      <!-- 操作按钮 -->
      <div class="action-buttons">
        <a-button type="primary" @click="showAddModal">新增值班组</a-button>
      </div>
    </div>

    <!-- 值班组记录列表表格 -->
    <a-table
      :columns="columns"
      :data-source="filteredData"
      row-key="id"
      :loading="loading"
      :pagination="{
        showSizeChanger: true,
        showQuickJumper: true,
        showTotal: (total: number) => `共 ${total} 条`
      }"
    >
      <!-- 操作列 -->
      <template #action="{ record }">
        <a-space>
          <a-button type="primary" ghost size="small" @click="showEditModal(record)">
            <template #icon><EditOutlined /></template>
            编辑
          </a-button>
          <a-button type="primary" ghost size="small" @click="viewSchedule(record)">
            <template #icon><EyeOutlined /></template>
            排班表
          </a-button>
          <a-button type="primary" danger ghost size="small" @click="handleDelete(record)">
            <template #icon><DeleteOutlined /></template>
            删除
          </a-button>
        </a-space>
      </template>

      <!-- 用户名称列自定义渲染 -->
      <template #userNames="{ text }">
        <a-tag v-for="name in text" :key="name" color="blue">{{ name }}</a-tag>
      </template>

      <!-- 创建时间列格式化 -->
      <template #CreatedAt="{ text }">
        {{ formatDate(text) }}
      </template>
    </a-table>

    <!-- 新增值班组模态框 -->
    <a-modal
      title="新增值班组"
      v-model:visible="isAddModalVisible"
      @ok="handleAdd"
      @cancel="closeAddModal"
      :confirmLoading="loading"
      :maskClosable="false"
    >
      <a-form :model="addForm" layout="vertical" ref="addFormRef">
        <a-form-item 
          label="名称" 
          name="name"
          :rules="[{ required: true, message: '请输入值班组名称' }]"
        >
          <a-input
            v-model:value="addForm.name"
            placeholder="请输入值班组名称"
            :maxLength="50"
          />
        </a-form-item>

        <a-form-item 
          label="轮班周期（天）"
          name="shiftDays"
          :rules="[{ required: true, message: '请输入轮班周期' }]"
        >
          <a-input-number
            v-model:value="addForm.shiftDays"
            :min="1"
            :max="365"
            style="width: 100%"
          />
        </a-form-item>

        <a-form-item 
          label="用户名称" 
          name="userNames"
          :rules="[{ required: true, message: '请选择至少一个用户' }]"
        >
          <a-select
            mode="multiple"
            v-model:value="addForm.userNames"
            placeholder="请选择用户"
            style="width: 100%"
            :maxTagCount="3"
            :filterOption="filterOption"
          >
            <a-select-option
              v-for="user in availableUsers"
              :key="user"
              :value="user"
            >
              {{ user }}
            </a-select-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 编辑值班组记录模态框 -->
    <a-modal
      title="编辑值班组"
      v-model:visible="isEditModalVisible"
      @ok="handleUpdate"
      @cancel="closeEditModal"
      :confirmLoading="loading"
      :maskClosable="false"
    >
      <a-form :model="editForm" layout="vertical" ref="editFormRef">
        <a-form-item 
          label="名称" 
          name="name"
          :rules="[{ required: true, message: '请输入值班组名称' }]"
        >
          <a-input
            v-model:value="editForm.name"
            placeholder="请输入值班组名称"
            :maxLength="50"
          />
        </a-form-item>

        <a-form-item 
          label="轮班周期（天）"
          name="shiftDays"
          :rules="[{ required: true, message: '请输入轮班周期' }]"
        >
          <a-input-number
            v-model:value="editForm.shiftDays"
            :min="1"
            :max="365"
            style="width: 100%"
          />
        </a-form-item>

        <a-form-item 
          label="用户名称" 
          name="userNames"
          :rules="[{ required: true, message: '请选择至少一个用户' }]"
        >
          <a-select
            mode="multiple"
            v-model:value="editForm.userNames"
            placeholder="请选择用户"
            style="width: 100%"
            :maxTagCount="3"
            :filterOption="filterOption"
          >
            <a-select-option
              v-for="user in availableUsers"
              :key="user"
              :value="user"
            >
              {{ user }}
            </a-select-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { message, Modal } from 'ant-design-vue';
import {
  getAllOnDutyApi,
  createOnDutyApi,
  updateOnDutyApi,
  deleteOnDutyApi,
  getUserList
} from '#/api';
import { useRouter } from 'vue-router';
import dayjs from 'dayjs';

// 定义数据类型
interface OnDutyChange {
  id: number;
  name: string;
  shiftDays: number;
  userNames: string[];
  userId: number;
  CreatedAt: string;
}

const router = useRouter();
const data = ref<OnDutyChange[]>([]);
const searchText = ref('');
const loading = ref(false);
const addFormRef = ref();
const editFormRef = ref();

// 过滤后的数据
const filteredData = computed(() => {
  const searchValue = searchText.value.trim().toLowerCase();
  return data.value.filter(item => 
    item.name.toLowerCase().includes(searchValue) ||
    item.userNames.some(name => name.toLowerCase().includes(searchValue))
  );
});

// 表格列配置
const columns = [
  {
    title: 'ID',
    dataIndex: 'id',
    width: 80,
  },
  {
    title: '名称',
    dataIndex: 'name',
    ellipsis: true,
  },
  {
    title: '轮班周期（天）',
    dataIndex: 'shiftDays',
    width: 120,
  },
  {
    title: '用户名称',
    dataIndex: 'userNames',
    slots: { customRender: 'userNames' },
  },
  {
    title: '创建者',
    dataIndex: 'userId',
    width: 100,
  },
  {
    title: '创建时间',
    dataIndex: 'CreatedAt',
    slots: { customRender: 'CreatedAt' },
    width: 160,
  },
  {
    title: '操作',
    key: 'action',
    slots: { customRender: 'action' },
    width: 200,
    fixed: 'right',
  },
];

const isAddModalVisible = ref(false);
const isEditModalVisible = ref(false);

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

const availableUsers = ref<string[]>([]);

// Select 筛选方法
const filterOption = (input: string, option: any) => {
  return option.value.toLowerCase().indexOf(input.toLowerCase()) >= 0;
};

// 格式化日期
const formatDate = (date: string) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss');
};

const showAddModal = () => {
  resetAddForm();
  isAddModalVisible.value = true;
};

const resetAddForm = () => {
  if (addFormRef.value) {
    addFormRef.value.resetFields();
  }
  addForm.name = '';
  addForm.shiftDays = 7;
  addForm.userNames = [];
};

const closeAddModal = () => {
  resetAddForm();
  isAddModalVisible.value = false;
};

const showEditModal = (record: OnDutyChange) => {
  editForm.id = record.id;
  editForm.name = record.name;
  editForm.shiftDays = record.shiftDays;
  editForm.userNames = [...record.userNames];
  isEditModalVisible.value = true;
};

const closeEditModal = () => {
  if (editFormRef.value) {
    editFormRef.value.resetFields();
  }
  isEditModalVisible.value = false;
};

const handleAdd = async () => {
  try {
    await addFormRef.value.validate();
    loading.value = true;

    const payload = {
      name: addForm.name.trim(),
      shiftDays: addForm.shiftDays,
      userNames: addForm.userNames,
    };

    await createOnDutyApi(payload);
    message.success('新增值班组成功');
    await fetchOnDutyChanges();
    closeAddModal();
  } catch (error) {
    console.error('新增值班组失败:', error);
    message.error('新增值班组失败，请稍后重试');
  } finally {
    loading.value = false;
  }
};

const handleUpdate = async () => {
  try {
    await editFormRef.value.validate();
    loading.value = true;

    const payload = {
      id: editForm.id,
      name: editForm.name.trim(),
      shiftDays: editForm.shiftDays,
      userNames: editForm.userNames,
    };

    await updateOnDutyApi(payload);
    message.success('更新值班组成功');
    await fetchOnDutyChanges();
    closeEditModal();
  } catch (error) {
    console.error('更新值班组失败:', error);
    message.error('更新值班组失败，请稍后重试');
  } finally {
    loading.value = false;
  }
};

const handleDelete = (record: OnDutyChange) => {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除值班组"${record.name}"吗？此操作不可恢复。`,
    okText: '确认',
    okType: 'danger',
    cancelText: '取消',
    async onOk() {
      try {
        loading.value = true;
        await deleteOnDutyApi(record.id);
        message.success('删除值班组成功');
        await fetchOnDutyChanges();
      } catch (error) {
        console.error('删除值班组失败:', error);
        message.error('删除值班组失败，请稍后重试');
      } finally {
        loading.value = false;
      }
    },
  });
};

const fetchUserList = async () => {
  try {
    loading.value = true;
    const response = await getUserList();
    availableUsers.value = response.map((user: any) => user.username);
  } catch (error) {
    console.error('获取用户列表失败:', error);
    message.error('获取用户列表失败，请稍后重试');
  } finally {
    loading.value = false;
  }
};

const viewSchedule = (record: OnDutyChange) => {
  router.push({
    name: 'MonitorOnDutyGroupTable',
    query: { id: record.id.toString() }
  });
};

const fetchOnDutyChanges = async () => {
  try {
    loading.value = true;
    const response = await getAllOnDutyApi();
    data.value = response;
  } catch (error) {
    console.error('获取值班组列表失败:', error);
    message.error('获取值班组列表失败，请稍后重试');
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  await Promise.all([
    fetchOnDutyChanges(),
    fetchUserList()
  ]);
});
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
  align-items: center;
  gap: 16px;
}

.action-buttons {
  display: flex;
  align-items: center;
  gap: 8px;
}

:deep(.ant-form-item) {
  margin-bottom: 24px;
}

:deep(.ant-tag) {
  margin: 2px;
}
</style>
