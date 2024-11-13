<template>
  <!-- 查询和操作 -->
  <div class="custom-toolbar">
    <!-- 查询功能 -->
    <div class="search-filters">
      <a-input v-model="searchText" placeholder="请输入集群名称" style="width: 200px; margin-right: 16px;" />
    </div>
    <!-- 操作按钮 -->
    <div class="action-buttons">
      <a-button type="primary" @click="isAddModalVisible = true">新增集群</a-button>
    </div>
  </div>
  <div>
    <!-- 表格 -->
    <a-table :dataSource="filteredData" :columns="columns" rowKey="id" :rowSelection="rowSelection" pagination={false}>
      <template v-slot:action="{ record }">
        <a-button type="link" @click="handleEdit(record.id)">编辑集群</a-button>
        <a-popconfirm title="确定删除这个集群吗?" ok-text="删除" cancel-text="取消" @confirm="handleDelete(record.id)">
          <a-button type="link" danger>删除集群</a-button>
        </a-popconfirm>
      </template>
    </a-table>
  </div>
  <div>
    <!-- 新增集群模态框 -->
    <a-modal title="新增集群" v-model:visible="isAddModalVisible" @ok="handleAdd" @cancel="closeAddModal">
      <a-form :model="addForm" layout="vertical">
        <a-form-item label="集群名称" name="name" :rules="[{ required: true, message: '请输入集群名称' }]">
          <a-input v-model:value="addForm.name" placeholder="请输入集群名称" />
        </a-form-item>
        <a-form-item label="集群中文名称" name="name_zh">
          <a-input v-model:value="addForm.name_zh" placeholder="请输入集群中文名称" />
        </a-form-item>
        <a-form-item label="CPU 请求" name="cpu_request">
          <a-input v-model:value="addForm.cpu_request" placeholder="请输入 CPU 请求" />
        </a-form-item>
        <a-form-item label="CPU 限制" name="cpu_limit">
          <a-input v-model:value="addForm.cpu_limit" placeholder="请输入 CPU 限制" />
        </a-form-item>
        <a-form-item label="内存请求" name="memory_request">
          <a-input v-model:value="addForm.memory_request" placeholder="请输入内存请求" />
        </a-form-item>
        <a-form-item label="内存限制" name="memory_limit">
          <a-input v-model:value="addForm.memory_limit" placeholder="请输入内存限制" />
        </a-form-item>
        <a-form-item label="限制命名空间" name="restricted_name_space">
          <a-select v-model:value="addForm.restricted_name_space" mode="tags" placeholder="请选择限制命名空间"
            style="width: 100%">
          </a-select>
        </a-form-item>
        <a-form-item label="环境" name="env" :rules="[{ required: true, message: '请选择环境' }]">
          <a-select v-model:value="addForm.env" placeholder="请选择环境">
            <a-select-option value="dev">开发</a-select-option>
            <a-select-option value="prod">生产</a-select-option>
            <a-select-option value="stage">阶段</a-select-option>
            <a-select-option value="rc">发布候选</a-select-option>
            <a-select-option value="press">压力测试</a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item label="集群版本" name="version">
          <a-input v-model:value="addForm.version" placeholder="请输入集群版本" />
        </a-form-item>
        <a-form-item label="API 服务器地址" name="api_server_addr">
          <a-input v-model:value="addForm.api_server_addr" placeholder="请输入 API 服务器地址" />
        </a-form-item>
        <a-form-item label="KubeConfig 内容" name="kube_config_content">
          <a-textarea v-model:value="addForm.kube_config_content" placeholder="请输入 KubeConfig 内容" />
        </a-form-item>
        <a-form-item label="操作超时（秒）" name="action_timeout_seconds">
          <a-input-number v-model:value="addForm.action_timeout_seconds" placeholder="请输入操作超时（秒）" />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 编辑集群模态框 -->
    <a-modal title="编辑集群" v-model:visible="isEditModalVisible" @ok="handleUpdate" @cancel="closeEditModal">
      <a-form :model="editForm" layout="vertical">
        <a-form-item label="集群名称" name="name" :rules="[{ required: true, message: '请输入集群名称' }]">
          <a-input v-model:value="editForm.name" placeholder="请输入集群名称" />
        </a-form-item>
        <a-form-item label="集群中文名称" name="name_zh">
          <a-input v-model:value="editForm.name_zh" placeholder="请输入集群中文名称" />
        </a-form-item>
        <a-form-item label="CPU 请求" name="cpu_request">
          <a-input v-model:value="editForm.cpu_request" placeholder="请输入 CPU 请求" />
        </a-form-item>
        <a-form-item label="CPU 限制" name="cpu_limit">
          <a-input v-model:value="editForm.cpu_limit" placeholder="请输入 CPU 限制" />
        </a-form-item>
        <a-form-item label="内存请求" name="memory_request">
          <a-input v-model:value="editForm.memory_request" placeholder="请输入内存请求" />
        </a-form-item>
        <a-form-item label="内存限制" name="memory_limit">
          <a-input v-model:value="editForm.memory_limit" placeholder="请输入内存限制" />
        </a-form-item>
        <a-form-item label="限制命名空间" name="restricted_name_space">
          <a-select v-model:value="editForm.restricted_name_space" mode="tags" placeholder="请选择限制命名空间"
            style="width: 100%">
          </a-select>
        </a-form-item>
        <a-form-item label="环境" name="env" :rules="[{ required: true, message: '请选择环境' }]">
          <a-select v-model:value="editForm.env" placeholder="请选择环境">
            <a-select-option value="dev">开发</a-select-option>
            <a-select-option value="prod">生产</a-select-option>
            <a-select-option value="stage">阶段</a-select-option>
            <a-select-option value="rc">发布候选</a-select-option>
            <a-select-option value="press">压力测试</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="集群版本" name="version">
          <a-input v-model:value="editForm.version" placeholder="请输入集群版本" />
        </a-form-item>
        <a-form-item label="API 服务器地址" name="api_server_addr">
          <a-input v-model:value="editForm.api_server_addr" placeholder="请输入 API 服务器地址" />
        </a-form-item>
        <a-form-item label="KubeConfig 内容" name="kube_config_content">
          <a-textarea v-model:value="editForm.kube_config_content" placeholder="请输入 KubeConfig 内容" />
        </a-form-item>
        <a-form-item label="操作超时（秒）" name="action_timeout_seconds">
          <a-input-number v-model:value="editForm.action_timeout_seconds" placeholder="请输入操作超时（秒）" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, computed } from 'vue';
import { message } from 'ant-design-vue';
import { getAllClustersApi, getClusterApi, createClusterApi, updateClusterApi, deleteClusterApi, batchDeleteClusterApi } from '#/api';
import type { ClustersItem } from '#/api';

// 数据和状态管理
const clusters = ref<ClustersItem[]>([]);
const searchText = ref('');
const selectedRows = ref<ClustersItem[]>([]); // 用于批量删除
const isAddModalVisible = ref(false);
const isEditModalVisible = ref(false);

// 过滤后的数据并按 id 升序排列
const filteredData = computed(() => {
  const searchValue = searchText.value.trim().toLowerCase();
  const sortedClusters = clusters.value.sort((a, b) => a.id - b.id); // 按 id 升序排序
  return sortedClusters.filter((item: { name: string; }) => item.name.toLowerCase().includes(searchValue));
});


// 表格列配置
const columns = [
  {
    title: 'id',
    dataIndex: 'id',
    key: 'id',
  },
  {
    title: '集群名称',
    dataIndex: 'name',
    key: 'name',
  },
  {
    title: '集群中文名称',
    dataIndex: 'name_zh',
    key: 'name_zh',
  },
  {
    title: '所属环境',
    dataIndex: 'env',
    key: 'env',
  },
  {
    title: '创建用户id',
    dataIndex: 'user_id',
    key: 'user_id',
  },
  {
    title: '集群版本',
    dataIndex: 'version',
    key: 'version',
  },
  {
    title: '创建时间',
    dataIndex: 'created_at',
    key: 'created_at',
  },
  {
    title: '操作',
    key: 'action',
    slots: { customRender: 'action' },
  },
];

// 批量选择配置
const rowSelection = {
  selectedRowKeys: computed(() => selectedRows.value.map(row => row.id)),
  onChange: (selectedRowsData: any) => {
    selectedRows.value = selectedRowsData;
  },
};

// 新增、编辑表单
const addForm = reactive({
  name: '',
  name_zh: '',
  cpu_request: '',
  cpu_limit: '',
  memory_request: '',
  memory_limit: '',
  restricted_name_space: [] as string[],
  env: 'dev',
  version: '',
  api_server_addr: '',
  kube_config_content: '',
  action_timeout_seconds: 60,
});

const editForm = reactive({
  id: 0,
  name: '',
  name_zh: '',
  cpu_request: '',
  cpu_limit: '',
  memory_request: '',
  memory_limit: '',
  restricted_name_space: [] as string[],
  env: 'dev',
  version: '',
  api_server_addr: '',
  kube_config_content: '',
  action_timeout_seconds: 60,
});

// 获取集群列表
const getClusters = async () => {
  try {
    const res = await getAllClustersApi();
    clusters.value = res;
  } catch (error) {
    message.error('获取集群数据失败');
  }
};

// 打开新增集群弹窗
const handleAdd = async () => {
  try {
    const formToSubmit = { 
      ...addForm, 
      restricted_name_space: addForm.restricted_name_space 
    };
    await createClusterApi(formToSubmit);
    message.success('集群新增成功');
    getClusters();
    isAddModalVisible.value = false;
  } catch (error) {
    message.error('新增集群失败');
  }
};

// 打开编辑集群弹窗
const handleEdit = async (id: number) => {
  try {
    const res = await getClusterApi(id);
    editForm.id = res.id;
    editForm.name = res.name;
    editForm.name_zh = res.name_zh;
    editForm.cpu_request = res.cpu_request;
    editForm.cpu_limit = res.cpu_limit;
    editForm.memory_request = res.memory_request;
    editForm.memory_limit = res.memory_limit;
    editForm.restricted_name_space = res.restricted_name_space;
    editForm.env = res.env;
    editForm.version = res.version;
    editForm.api_server_addr = res.api_server_addr;
    editForm.kube_config_content = res.kube_config_content;
    editForm.action_timeout_seconds = res.action_timeout_seconds;
    isEditModalVisible.value = true;
  } catch (error) {
    message.error('获取集群数据失败');
  }
};

// 更新集群
const handleUpdate = async () => {
  if (editForm.id === null) {
    message.error('集群 ID 无效');
    return;
  }
  try {
    const formToSubmit = { 
      ...editForm, 
      restricted_name_space: editForm.restricted_name_space,
    };
    await updateClusterApi(formToSubmit);
    message.success('集群更新成功');
    getClusters();
    isEditModalVisible.value = false;
  } catch (error) {
    message.error('更新集群失败');
  }
};

// 删除集群
const handleDelete = async (id: number) => {
  try {
    await deleteClusterApi(id);
    message.success('集群删除成功');
    getClusters();
  } catch (error) {
    message.error('删除集群失败');
  }
};

// 批量删除
const handleBatchDelete = async () => {
  if (selectedRows.value.length === 0) {
    message.warning('请选择至少一个集群');
    return;
  }
  try {
    const ids = selectedRows.value.map(row => row.id);
    await batchDeleteClusterApi(ids);
    message.success('集群批量删除成功');
    getClusters();
    selectedRows.value = [];
  } catch (error) {
    message.error('批量删除集群失败');
  }
};

// 关闭模态框
const closeAddModal = () => {
  isAddModalVisible.value = false;
};

const closeEditModal = () => {
  isEditModalVisible.value = false;
};
getClusters()
</script>

<style scoped>
.custom-toolbar {
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
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
