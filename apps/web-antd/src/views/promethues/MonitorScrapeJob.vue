<template>
  <div>
    <!-- 查询和操作 -->
    <div class="custom-toolbar">
      <!-- 查询功能 -->
      <div class="search-filters">
        <!-- 搜索输入框 -->
        <a-input 
          v-model:value="searchText" 
          placeholder="请输入采集任务名称" 
          style="width: 200px" 
        />
      </div>
      <!-- 操作按钮 -->
      <div class="action-buttons">
        <a-button type="primary" @click="openAddModal">新增采集任务</a-button>
      </div>
    </div>

    <!-- 数据加载状态 -->
    <a-spin :spinning="loading">
      <!-- 采集任务列表表格 -->
      <a-table :columns="columns" :data-source="filteredData" row-key="id">
        <!-- 服务发现类型列 -->
        <template #serviceDiscoveryType="{ record }">
          {{ record.serviceDiscoveryType === 'k8s' ? 'Kubernetes' : 'HTTP' }}
        </template>
        <!-- 关联采集池列 -->
        <template #poolName="{ record }">
          {{ getPoolName(record.poolId) }}
        </template>
        <!-- 创建者列 -->
        <template #userId="{ record }">
          {{ getUserName(record.userId) }}
        </template>
        <!-- 操作列 -->
        <template #action="{ record }">
          <a-space>
            <a-button type="primary" ghost size="small" @click="openEditModal(record)">
              <template #icon><EditOutlined /></template>
              编辑
            </a-button>
            <a-button type="primary" danger ghost size="small" @click="handleDelete(record)">
              <template #icon><DeleteOutlined /></template>
              删除
            </a-button>
          </a-space>
        </template>
        <!-- 树节点 ID 列 -->
        <template #treeNodeIds="{ record }">
          {{ formatTreeNodeIds(record.treeNodeIds) }}
        </template>
      </a-table>
    </a-spin>

    <!-- 新增采集任务模态框 -->
    <a-modal v-model:visible="isAddModalVisible" title="新增采集任务" @ok="handleAdd" @cancel="closeAddModal" :okText="'提交'"
      :cancelText="'取消'" :confirmLoading="confirmLoading">
      <a-form :model="addForm" layout="vertical" ref="addFormRef">
        <a-form-item label="采集任务名称" name="name" :rules="[{ required: true, message: '请输入采集任务名称' }]">
          <a-input v-model:value="addForm.name" placeholder="请输入采集任务名称" />
        </a-form-item>

        <a-form-item label="启用" name="enable" :rules="[{ required: true, message: '请选择是否启用' }]">
          <a-switch v-model:checked="addFormEnable" :checked-children="'启用'" :un-checked-children="'禁用'" />
        </a-form-item>

        <a-form-item label="服务发现类型" name="serviceDiscoveryType" :rules="[{ required: true, message: '请选择服务发现类型' }]">
          <a-select v-model:value="addForm.serviceDiscoveryType" placeholder="请选择服务发现类型">
            <a-select-option value="http">HTTP</a-select-option>
            <a-select-option value="k8s">Kubernetes</a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item label="协议方案" name="scheme" :rules="[{ required: true, message: '请选择协议方案' }]">
          <a-select v-model:value="addForm.scheme" placeholder="请选择协议方案">
            <a-select-option value="http">HTTP</a-select-option>
            <a-select-option value="https">HTTPS</a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item label="监控采集路径" name="metricsPath" :rules="[{ required: true, message: '请输入监控采集路径' }]">
          <a-input v-model:value="addForm.metricsPath" placeholder="请输入监控采集路径" />
        </a-form-item>

        <a-form-item label="采集间隔（秒）" name="scrapeInterval" :rules="[
          { required: true, message: '请输入采集间隔' },
          { type: 'number', min: 1, message: '采集间隔必须大于0' }
        ]">
          <a-input-number v-model:value="addForm.scrapeInterval" :min="1" style="width: 100%;"
            placeholder="请输入采集间隔（秒）" />
        </a-form-item>

        <a-form-item label="采集超时（秒）" name="scrapeTimeout" :rules="[
          { required: true, message: '请输入采集超时' },
          { type: 'number', min: 1, message: '采集超时必须大于0' }
        ]">
          <a-input-number v-model:value="addForm.scrapeTimeout" :min="1" style="width: 100%;"
            placeholder="请输入采集超时（秒）" />
        </a-form-item>

        <a-form-item label="关联采集池" name="poolId" :rules="[{ required: true, message: '请选择关联采集池' }]">
          <a-select v-model:value="addForm.poolId" placeholder="请选择关联采集池">
            <a-select-option v-for="pool in pools" :key="pool.id" :value="pool.id">
              {{ pool.name }}
            </a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item label="刷新间隔（秒）" name="refreshInterval" :rules="[
          { required: true, message: '请输入刷新间隔' },
          { type: 'number', min: 1, message: '刷新间隔必须大于0' }
        ]">
          <a-input-number v-model:value="addForm.refreshInterval" :min="1" style="width: 100%;"
            placeholder="请输入刷新间隔（秒）" />
        </a-form-item>

        <a-form-item label="端口" name="port" :rules="[
          { required: true, message: '请输入端口' },
          { type: 'number', min: 1, max: 65535, message: '端口必须在1-65535之间' }
        ]">
          <a-input-number v-model:value="addForm.port" :min="1" :max="65535" style="width: 100%;" placeholder="请输入端口" />
        </a-form-item>

        <a-form-item label="树节点" name="treeNodeIds" :rules="[{ required: true, message: '请选择树节点' }]">
          <a-tree-select
            v-model:value="addForm.treeNodeIds"
            :tree-data="leafNodes"
            :tree-checkable="true"
            :tree-default-expand-all="true"
            :show-checked-strategy="SHOW_PARENT"
            placeholder="请选择树节点"
            style="width: 100%"
          />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 编辑采集任务模态框 -->
    <a-modal v-model:visible="isEditModalVisible" title="编辑采集任务" @ok="handleUpdate" @cancel="closeEditModal"
      :okText="'提交'" :cancelText="'取消'" :confirmLoading="confirmLoading">
      <a-form :model="editForm" layout="vertical" ref="editFormRef" @submit.prevent>
        <a-form-item label="采集任务名称" name="name" :rules="[{ required: true, message: '请输入采集任务名称' }]">
          <a-input v-model:value="editForm.name" placeholder="请输入采集任务名称" />
        </a-form-item>

        <a-form-item label="启用" name="enable" :rules="[{ required: true, message: '请选择是否启用' }]">
          <a-switch v-model:checked="editFormEnable" :checked-children="'启用'" :un-checked-children="'禁用'" />
        </a-form-item>

        <a-form-item label="服务发现类型" name="serviceDiscoveryType" :rules="[{ required: true, message: '请选择服务发现类型' }]">
          <a-select v-model:value="editForm.serviceDiscoveryType" placeholder="请选择服务发现类型">
            <a-select-option value="http">HTTP</a-select-option>
            <a-select-option value="k8s">Kubernetes</a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item label="协议方案" name="scheme" :rules="[{ required: true, message: '请选择协议方案' }]">
          <a-select v-model:value="editForm.scheme" placeholder="请选择协议方案">
            <a-select-option value="http">HTTP</a-select-option>
            <a-select-option value="https">HTTPS</a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item label="监控采集路径" name="metricsPath" :rules="[{ required: true, message: '请输入监控采集路径' }]">
          <a-input v-model:value="editForm.metricsPath" placeholder="请输入监控采集路径" />
        </a-form-item>

        <a-form-item label="采集间隔（秒）" name="scrapeInterval" :rules="[
          { required: true, message: '请输入采集间隔' },
          { type: 'number', min: 1, message: '采集间隔必须大于0' }
        ]">
          <a-input-number v-model:value="editForm.scrapeInterval" :min="1" style="width: 100%;"
            placeholder="请输入采集间隔（秒）" />
        </a-form-item>

        <a-form-item label="采集超时（秒）" name="scrapeTimeout" :rules="[
          { required: true, message: '请输入采集超时' },
          { type: 'number', min: 1, message: '采集超时必须大于0' }
        ]">
          <a-input-number v-model:value="editForm.scrapeTimeout" :min="1" style="width: 100%;"
            placeholder="请输入采集超时（秒）" />
        </a-form-item>

        <a-form-item label="关联采集池" name="poolId" :rules="[{ required: true, message: '请选择关联采集池' }]">
          <a-select v-model:value="editForm.poolId" placeholder="请选择关联采集池">
            <a-select-option v-for="pool in pools" :key="pool.id" :value="pool.id">
              {{ pool.name }}
            </a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item label="刷新间隔（秒）" name="refreshInterval" :rules="[
          { required: true, message: '请输入刷新间隔' },
          { type: 'number', min: 1, message: '刷新间隔必须大于0' }
        ]">
          <a-input-number v-model:value="editForm.refreshInterval" :min="1" style="width: 100%;"
            placeholder="请输入刷新间隔（秒）" />
        </a-form-item>

        <a-form-item label="端口" name="port" :rules="[
          { required: true, message: '请输入端口' },
          { type: 'number', min: 1, max: 65535, message: '端口必须在1-65535之间' }
        ]">
          <a-input-number v-model:value="editForm.port" :min="1" :max="65535" style="width: 100%;"
            placeholder="请输入端口" />
        </a-form-item>

        <a-form-item label="树节点" name="treeNodeIds" :rules="[{ required: true, message: '请选择树节点' }]">
          <a-tree-select
            v-model:value="editForm.treeNodeIds"
            :tree-data="leafNodes"
            :tree-checkable="true"
            :tree-default-expand-all="true"
            :show-checked-strategy="SHOW_PARENT"
            placeholder="请选择树节点"
            style="width: 100%"
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script lang="ts" setup>
import { computed, reactive, ref, onMounted } from 'vue';
import { message, Modal } from 'ant-design-vue';
import { TreeSelect } from 'ant-design-vue';
const { SHOW_PARENT } = TreeSelect;
import {
  getMonitorScrapeJobApi,
  createScrapeJobApi,
  updateScrapeJobApi,
  deleteScrapeJobApi,
  getMonitorScrapePoolApi,
  getAllTreeNodes
} from '#/api';

// 定义数据类型
interface ScrapeJob {
  id: number;
  CreatedAt: string;
  UpdatedAt: string;
  DeletedAt: string | null;
  name: string;
  userId: number;
  enable: number;
  serviceDiscoveryType: string;
  metricsPath: string;
  scheme: string;
  scrapeInterval: number;
  scrapeTimeout: number;
  poolId: number;
  refreshInterval: number;
  port: number;
  treeNodeIds: string[];
}

interface Pool {
  id: number;
  name: string;
}

interface TreeNode {
  id: string;
  title: string;
  children?: TreeNode[];
  isLeaf?: boolean;
  value?: string;
  key?: string;
}

// 数据源（待从后端获取）
const data = ref<ScrapeJob[]>([]);

// 搜索文本
const searchText = ref('');

// 过滤后的数据
const filteredData = computed(() => {
  const searchValue = searchText.value.trim().toLowerCase();
  return data.value.filter(item => 
    item.name.toLowerCase().includes(searchValue)
  );
});

// 表格列配置 - 精简后的列
const columns = [
  {
    title: 'id',
    dataIndex: 'id',
    key: 'id',
  },
  {
    title: '采集任务名称',
    dataIndex: 'name',
    key: 'name',
  },
  {
    title: '服务发现类型',
    dataIndex: 'serviceDiscoveryType',
    key: 'serviceDiscoveryType',
    slots: { customRender: 'serviceDiscoveryType' },
  },
  {
    title: '监控采集路径',
    dataIndex: 'metricsPath',
    key: 'metricsPath',
  },
  {
    title: '关联采集池',
    dataIndex: 'poolId',
    key: 'poolId',
    slots: { customRender: 'poolName' },
  },
  {
    title: '树节点',
    dataIndex: 'treeNodeIds',
    key: 'treeNodeIds',
    slots: { customRender: 'treeNodeIds' },
  },
  {
    title: '创建者',
    dataIndex: 'userId',
    key: 'userId',
    slots: { customRender: 'userId' },
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

// 树形数据
const treeData = ref<TreeNode[]>([]);
const leafNodes = ref<TreeNode[]>([]);

// 递归处理树节点数据
const processTreeData = (nodes: any[]): TreeNode[] => {
  return nodes.map(node => {
    const processedNode: TreeNode = {
      id: node.id,
      title: node.name || node.title,
      key: node.id,
      value: node.id,
      isLeaf: !node.children || node.children.length === 0
    };

    if (!processedNode.isLeaf) {
      processedNode.children = processTreeData(node.children);
      processedNode.selectable = false;
    }

    return processedNode;
  });
};

// 递归获取所有叶子节点
const getLeafNodes = (nodes: TreeNode[]): TreeNode[] => {
  let leaves: TreeNode[] = [];
  nodes.forEach(node => {
    if (node.isLeaf) {
      leaves.push(node);
    } else if (node.children) {
      leaves = leaves.concat(getLeafNodes(node.children));
    }
  });
  return leaves;
};

// 获取树节点数据
const fetchTreeNodes = async () => {
  try {
    const response = await getAllTreeNodes();
    if (!response) {
      treeData.value = [];
      leafNodes.value = [];
      return;
    }
    treeData.value = processTreeData(response);
    leafNodes.value = getLeafNodes(treeData.value);
  } catch (error) {
    message.error('获取树节点数据失败，请稍后重试');
    console.error(error);
  }
};

// 模态框相关状态
const isAddModalVisible = ref(false);
const isEditModalVisible = ref(false);
const currentRecord = ref<ScrapeJob | null>(null);
const confirmLoading = ref(false);

// 表单引用
const addFormRef = ref();
const editFormRef = ref();

// 表单数据模型
const addForm = reactive({
  name: '',
  enable: 1,
  serviceDiscoveryType: 'http',
  metricsPath: '/metrics',
  scheme: 'http',
  scrapeInterval: 15,
  scrapeTimeout: 5,
  poolId: null as number | null,
  refreshInterval: 30,
  port: 9100,
  treeNodeIds: [] as string[],
});

const editForm = reactive({
  id: 0,
  name: '',
  enable: 1,
  serviceDiscoveryType: 'http',
  metricsPath: '/metrics',
  scheme: 'http',
  scrapeInterval: 15,
  scrapeTimeout: 5,
  poolId: null as number | null,
  refreshInterval: 30,
  port: 9100,
  treeNodeIds: [] as string[],
});

// 采集池列表
const pools = ref<Pool[]>([]);

// 计算属性：将 addForm.enable 映射为布尔值用于 a-switch
const addFormEnable = computed({
  get: () => addForm.enable === 1,
  set: (val: boolean) => {
    addForm.enable = val ? 1 : 2;
  }
});

// 计算属性：将 editForm.enable 映射为布尔值用于 a-switch
const editFormEnable = computed({
  get: () => editForm.enable === 1,
  set: (val: boolean) => {
    editForm.enable = val ? 1 : 2;
  }
});

// 获取采集池数据
const fetchPools = async () => {
  try {
    const response = await getMonitorScrapePoolApi();
    pools.value = response.map((pool: any) => ({
      id: pool.id,
      name: pool.name,
    }));
  } catch (error) {
    message.error('获取采集池数据失败，请稍后重试');
    console.error(error);
  }
};

// 获取采集任务数据
const loading = ref(false);

const fetchResources = async () => {
  loading.value = true;
  try {
    const response = await getMonitorScrapeJobApi();
    data.value = response.map((item: ScrapeJob) => ({
      ...item,
      // 确保 treeNodeIds 始终是字符串数组
      treeNodeIds: Array.isArray(item.treeNodeIds) ? item.treeNodeIds.map(String) : [],
    }));
  } catch (error) {
    message.error('获取采集任务数据失败，请稍后重试');
    console.error(error);
  } finally {
    loading.value = false;
  }
};

// 获取采集池名称
const getPoolName = (poolId: number) => {
  const pool = pools.value.find(p => p.id === poolId);
  return pool ? pool.name : '未知';
};

// 获取用户名
const getUserName = (userId: number) => {
  // 实际项目中应从用户列表中查找
  return `${userId}`;
};

// 格式化树节点 ID
const formatTreeNodeIds = (treeNodeIds: string[]) => {
  if (Array.isArray(treeNodeIds)) {
    return treeNodeIds.join(', ');
  }
  return '';
};

// 在组件挂载时获取数据
onMounted(() => {
  fetchResources();
  fetchPools();
  fetchTreeNodes();
});

// 打开新增模态框
const openAddModal = () => {
  resetAddForm();
  isAddModalVisible.value = true;
};

// 关闭新增模态框
const closeAddModal = () => {
  resetAddForm();
  isAddModalVisible.value = false;
};

// 重置新增表单
const resetAddForm = () => {
  addForm.name = '';
  addForm.enable = 1;
  addForm.serviceDiscoveryType = 'http';
  addForm.metricsPath = '/metrics';
  addForm.scheme = 'http';
  addForm.scrapeInterval = 15;
  addForm.scrapeTimeout = 5;
  addForm.poolId = null;
  addForm.refreshInterval = 30;
  addForm.port = 9100;
  addForm.treeNodeIds = [];
};

// 提交新增采集任务
const handleAdd = async () => {
  try {
    confirmLoading.value = true;
    // 表单验证
    await addFormRef.value.validateFields();

    // 确保 treeNodeIds 是字符串数组
    const formData = {
      ...addForm,
      treeNodeIds: addForm.treeNodeIds.map(String)
    };

    // 提交数据
    await createScrapeJobApi(formData);
    message.success('新增采集任务成功');
    fetchResources(); // 重新获取数据
    closeAddModal();
  } catch (error) {
    message.error('新增采集任务失败，请稍后重试');
    console.error(error);
  } finally {
    confirmLoading.value = false;
  }
};

// 打开编辑模态框
const openEditModal = (record: ScrapeJob) => {
  currentRecord.value = record;
  Object.assign(editForm, {
    id: record.id,
    name: record.name,
    enable: record.enable,
    serviceDiscoveryType: record.serviceDiscoveryType,
    metricsPath: record.metricsPath,
    scheme: record.scheme,
    scrapeInterval: record.scrapeInterval,
    scrapeTimeout: record.scrapeTimeout,
    poolId: record.poolId,
    refreshInterval: record.refreshInterval,
    port: record.port,
    treeNodeIds: Array.isArray(record.treeNodeIds) ? record.treeNodeIds.map(String) : [],
  });
  isEditModalVisible.value = true;
};

// 关闭编辑模态框
const closeEditModal = () => {
  isEditModalVisible.value = false;
};

// 提交更新采集任务
const handleUpdate = async () => {
  try {
    confirmLoading.value = true;
    // 表单验证
    await editFormRef.value.validateFields();

    // 确保 treeNodeIds 是字符串数组
    const formData = {
      ...editForm,
      treeNodeIds: editForm.treeNodeIds.map(String)
    };

    // 提交数据
    await updateScrapeJobApi(formData);
    message.success('更新采集任务成功');
    fetchResources(); // 重新获取数据
    closeEditModal();
  } catch (error) {
    message.error('更新采集任务失败，请稍后重试');
    console.error(error);
  } finally {
    confirmLoading.value = false;
  }
};

// 处理删除采集任务
const handleDelete = (record: ScrapeJob) => {
  Modal.confirm({
    title: '确认删除',
    content: `您确定要删除采集任务 "${record.name}" 吗？`,
    onOk: async () => {
      try {
        await deleteScrapeJobApi(record.id);
        message.success('删除采集任务成功');
        fetchResources(); // 重新获取数据
      } catch (error) {
        message.error('删除采集任务失败，请稍后重试');
        console.error(error);
      }
    },
  });
};
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
