<template>
  <div>
    <!-- 查询和操作 -->
    <div class="custom-toolbar">
      <!-- 查询功能 -->
      <div class="search-filters">
        <!-- 搜索输入框 -->
        <a-input
          v-model="searchText"
          placeholder="请输入值班组名称"
          style="width: 200px; margin-right: 16px"
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
      row-key="ID"
    >
      <!-- 操作列 -->
      <template #action="{ record }">
        <a-space>
          <a-button type="link" @click="showEditModal(record)"
            >编辑值班组</a-button
          >
          <a-button type="link" @click="viewSchedule(record)"
            >查看排班表</a-button
          >
          <a-button type="link" danger @click="handleDelete(record)"
            >删除值班组</a-button
          >
        </a-space>
      </template>
    </a-table>

    <!-- 新增值班组模态框 -->
    <a-modal
      title="新增换班记录"
      v-model:visible="isAddModalVisible"
      @ok="handleAdd"
      @cancel="closeAddModal"
      :confirmLoading="loading"
    >
      <a-form :model="addForm" layout="vertical">
        <a-form-item label="名称" required>
          <a-input
            v-model:value="addForm.name"
            placeholder="请输入值班组名称"
          />
        </a-form-item>

        <a-form-item label="轮班周期（天）">
          <a-input-number
            v-model:value="addForm.shiftDays"
            :min="1"
            style="width: 100%"
          />
        </a-form-item>

        <a-form-item label="用户名称" required>
          <a-select
            mode="tags"
            v-model:value="addForm.userNames"
            placeholder="请输入用户名并按回车确认"
            style="width: 100%"
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
    >
      <a-form :model="editForm" layout="vertical">
        <a-form-item label="名称" required>
          <a-input
            v-model:value="editForm.name"
            placeholder="请输入值班组名称"
          />
        </a-form-item>

        <a-form-item label="轮班周期（天）">
          <a-input-number
            v-model:value="editForm.shiftDays"
            :min="1"
            style="width: 100%"
          />
        </a-form-item>

        <a-form-item label="用户名称" required>
          <a-select
            mode="tags"
            v-model:value="editForm.userNames"
            placeholder="请输入用户名并按回车确认"
            style="width: 100%"
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
} from '#/api'; // 请根据实际路径调整
import { useRouter } from 'vue-router'; // 导入 Vue Router 的 useRouter

// 定义数据类型
interface OnDutyChange {
  ID: number; // 换班记录ID
  name: string; // 值班组名称
  shiftDays: number; // 轮班周期（天）
  userNames: string[]; // 用户名称列表
  userId: number; // 创建者用户名
  CreatedAt: string; // 创建时间
}
// 在脚本中定义 router
const router = useRouter();
// 数据源
const data = ref<OnDutyChange[]>([]);

// 搜索文本
const searchText = ref('');

// 加载状态
const loading = ref(false);

// 过滤后的数据，通过 computed 属性动态计算
const filteredData = computed(() => {
  const searchValue = searchText.value.trim().toLowerCase();
  if (!searchValue) return data.value;
  return data.value.filter(
    (item) =>
      item.name.toLowerCase().includes(searchValue) ||
      item.userNames.some((username) =>
        username.toLowerCase().includes(searchValue),
      ),
  );
});

// 表格列配置
const columns = [
  {
    title: 'ID',
    dataIndex: 'ID',
    key: 'ID',
    sorter: (a: OnDutyChange, b: OnDutyChange) => a.ID - b.ID,
  },
  {
    title: '名称',
    dataIndex: 'name',
    key: 'name',
    sorter: (a: OnDutyChange, b: OnDutyChange) => a.name.localeCompare(b.name),
  },
  {
    title: '轮班周期（天）',
    dataIndex: 'shiftDays',
    key: 'shiftDays',
    sorter: (a: OnDutyChange, b: OnDutyChange) => a.shiftDays - b.shiftDays,
  },
  {
    title: '用户名称',
    dataIndex: 'userNames',
    key: 'userNames',
  },
  {
    title: '创建者',
    dataIndex: 'userId',
    key: 'userId',
  },
  {
    title: '创建时间',
    dataIndex: 'CreatedAt',
    key: 'CreatedAt',
  },
  {
    title: '操作',
    key: 'action',
    slots: { customRender: 'action' },
  },
];

// 模态框状态和表单
const isAddModalVisible = ref(false);
const isEditModalVisible = ref(false);

// 新增表单
const addForm = reactive({
  name: '',
  shiftDays: 7, // 默认值为7
  userNames: [] as string[],
});

// 编辑表单
const editForm = reactive({
  id: 0,
  name: '',
  shiftDays: 7,
  userNames: [] as string[],
});

// 可用的用户列表（可以从后端获取）
const availableUsers = ref<string[]>([]); // 示例数据

// 显示新增模态框
const showAddModal = () => {
  resetAddForm();
  isAddModalVisible.value = true;
};

// 重置新增表单
const resetAddForm = () => {
  addForm.name = '';
  addForm.shiftDays = 7;
  addForm.userNames = [];
};

// 关闭新增模态框
const closeAddModal = () => {
  isAddModalVisible.value = false;
};

// 显示编辑模态框
const showEditModal = (record: OnDutyChange) => {
  editForm.id = record.ID;
  editForm.name = record.name;
  editForm.shiftDays = record.shiftDays;
  editForm.userNames = [...record.userNames];
  isEditModalVisible.value = true;
};

// 关闭编辑模态框
const closeEditModal = () => {
  isEditModalVisible.value = false;
};

// 提交新增换班记录
const handleAdd = async () => {
  try {
    // 表单验证
    if (!addForm.name || addForm.userNames.length === 0) {
      message.error('请填写所有必填项');
      return;
    }

    const payload = {
      name: addForm.name,
      shiftDays: addForm.shiftDays,
      userNames: addForm.userNames,
    };

    await createOnDutyApi(payload); // 调用创建 API
    message.success('新增值班组成功');
    fetchOnDutyChanges();
    closeAddModal();
  } catch (error) {
    message.error('新增值班组失败，请稍后重试');
    console.error(error);
  }
};

// 提交更新换班记录
const handleUpdate = async () => {
  try {
    // 表单验证
    if (!editForm.name || editForm.userNames.length === 0) {
      message.error('请填写所有必填项');
      return;
    }

    const payload = {
      id: editForm.id,
      name: editForm.name,
      shiftDays: editForm.shiftDays,
      userNames: editForm.userNames,
    };

    loading.value = true;
    await updateOnDutyApi(payload); // 调用更新 API
    loading.value = false;

      message.success('更新值班组成功');
      fetchOnDutyChanges();
      closeEditModal();
  } catch (error) {
    loading.value = false;
    message.error('更新值班组失败，请稍后重试');
    console.error(error);
  }
};

// 处理删除换班记录
const handleDelete = (record: OnDutyChange) => {
  Modal.confirm({
    title: '确认删除',
    content: `您确定要删除值班组 "${record.name}" 吗？`,
    okText: '确认',
    cancelText: '取消',
    onOk: async () => {
      try {
        loading.value = true;
        await deleteOnDutyApi(record.ID); // 调用删除 API
        loading.value = false;
        message.success('值班组已删除');
        fetchOnDutyChanges();
      } catch (error) {
        loading.value = false;
        message.error('删除值班组失败，请稍后重试');
        console.error(error);
      }
    },
  });
};

const fetchUserList = async () => {
  try {
    const response = await getUserList();
    availableUsers.value = response.map((user: any) => user.username);
  } catch (error) {
    message.error('获取用户列表失败，请稍后重试');
    console.error(error);
  }
};

// 查看排班表
const viewSchedule = (record: OnDutyChange) => {
  // 跳转到排班表页面并传递当前值班组的 ID
  router.push({ name: 'MonitorOnDutyGroupTable', query: { id: record.ID } });
};

// 获取换班记录数据
const fetchOnDutyChanges = async () => {
  try {
    const response = await getAllOnDutyApi();
    data.value = response;
  } catch (error) {
    message.error('获取值班组失败，请稍后重试');
    console.error(error);
  }
};

// 在组件加载时获取数据
onMounted(() => {
  fetchOnDutyChanges();
  fetchUserList();
});
</script>

<style scoped>
.custom-toolbar {
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.search-filters {
  display: flex;
  align-items: center;
}

.action-buttons {
  display: flex;
  align-items: center;
}

a-form-item {
  margin-bottom: 16px;
}
</style>
