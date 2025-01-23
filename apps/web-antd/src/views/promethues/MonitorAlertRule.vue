<template>
  <div>
    <div class="custom-toolbar">
      <div class="search-filters">
        <a-input v-model:value="searchText" placeholder="请输入AlertRule名称" style="width: 200px" />
      </div>
      <div class="action-buttons">
        <a-button type="primary" @click="showAddModal">新增AlertRule</a-button>
      </div>
    </div>
    <!-- AlertRule 列表表格 -->
    <a-table :columns="columns" :data-source="filteredData" row-key="id">
      <!-- 表达式列 -->
      <template #expr="{ record }">
        <div style="max-width: 300px; word-break: break-all">
          {{ record.expr }}
        </div>
      </template>
      <!-- 标签列 -->
      <template #labels="{ record }">
        <a-tag v-for="label in record.labels" :key="label" color="purple">
          {{ label }}
        </a-tag>
      </template>
      <!-- 注解列 -->
      <template #annotations="{ record }">
        <a-tag v-for="annotation in record.annotations" :key="annotation" color="orange">
          {{ annotation }}
        </a-tag>
      </template>
      <!-- Severity列 -->
      <template #severity="{ record }">
        <a-tag :color="severityColor(record.severity)">
          {{ record.severity }}
        </a-tag>
      </template>
      <!-- Enable列 -->
      <template #enable="{ record }">
        <a-tag :color="record.enable === 1 ? 'green' : 'red'">
          {{ record.enable === 1 ? '启用' : '禁用' }}
        </a-tag>
      </template>
      <!-- 操作列 -->
      <template #action="{ record }">
        <a-space>
          <a-button type="primary" ghost size="small" @click="showEditModal(record)">
            <template #icon>
              <EditOutlined />
            </template>
            编辑
          </a-button>
          <a-button type="primary" danger ghost size="small" @click="handleDelete(record)">
            <template #icon>
              <DeleteOutlined />
            </template>
            删除
          </a-button>
        </a-space>
      </template>
    </a-table>
    <!-- 新增AlertRule模态框 -->
    <a-modal title="新增AlertRule" v-model:visible="isAddModalVisible" @ok="handleAdd" @cancel="closeAddModal">
      <a-form :model="addForm" layout="vertical">
        <a-form-item label="名称" name="name" :rules="[{ required: true, message: '请输入名称' }]">
          <a-input v-model:value="addForm.name" placeholder="请输入名称" />
        </a-form-item>
        <a-form-item label="所属实例池" name="poolId" :rules="[{ required: true, message: '请选择所属实例池' }]">
          <a-select v-model:value="addForm.poolId" placeholder="请选择所属实例池">
            <a-select-option v-for="pool in scrapePools" :key="pool.id" :value="pool.id">
              {{ pool.name }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="发送组" name="sendGroupId">
          <a-select v-model:value="addForm.sendGroupId" placeholder="请选择发送组">
            <a-select-option v-for="group in sendGroups" :key="group.id" :value="group.id">
              {{ group.name }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="树节点" name="treeNodeId">
          <a-tree-select
            v-model:value="addForm.treeNodeId"
            :tree-data="leafNodes"
            :tree-default-expand-all="true"
            placeholder="请选择树节点"
            style="width: 100%"
          />
        </a-form-item>
        <a-form-item label="表达式" name="expr">
          <a-input v-model:value="addForm.expr" placeholder="请输入表达式"/>
        </a-form-item>
        <a-form-item>
          <a-button type="primary" @click="validateAddExpression(addForm.expr)">验证表达式</a-button>
        </a-form-item>
        <a-form-item label="严重性" name="severity">
          <a-select v-model:value="addForm.severity" placeholder="请选择严重性">
            <a-select-option value="critical">Critical</a-select-option>
            <a-select-option value="warning">Warning</a-select-option>
            <a-select-option value="info">Info</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="持续时间" name="forTime">
          <a-input v-model:value="addForm.forTime" placeholder="例如: 10s" />
        </a-form-item>
        <a-form-item label="标签" name="labels">
          <a-select mode="tags" v-model:value="addForm.labels" placeholder="请输入标签，例如 key=value" />
        </a-form-item>
        <a-form-item label="注解" name="annotations">
          <a-select mode="tags" v-model:value="addForm.annotations" placeholder="请输入注解" />
        </a-form-item>
      </a-form>
    </a-modal>
    <!-- 编辑AlertRule模态框 -->
    <a-modal title="编辑AlertRule" v-model:visible="isEditModalVisible" @ok="handleEdit" @cancel="closeEditModal">
      <a-form :model="editForm" layout="vertical">
        <a-form-item label="名称" name="name" :rules="[{ required: true, message: '请输入名称' }]">
          <a-input v-model:value="editForm.name" placeholder="请输入名称" />
        </a-form-item>
        <a-form-item label="所属实例池" name="poolId" :rules="[{ required: true, message: '请选择所属实例池' }]">
          <a-select v-model:value="editForm.poolId" placeholder="请选择所属实例池">
            <a-select-option v-for="pool in scrapePools" :key="pool.id" :value="pool.id">
              {{ pool.name }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="发送组" name="sendGroupId">
          <a-select v-model:value="editForm.sendGroupId" placeholder="请选择发送组">
            <a-select-option v-for="group in sendGroups" :key="group.id" :value="group.id">
              {{ group.name }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="树节点" name="treeNodeId">
          <a-tree-select
            v-model:value="editForm.treeNodeId"
            :tree-data="leafNodes"
            :tree-default-expand-all="true"
            placeholder="请选择树节点"
            style="width: 100%"
          />
        </a-form-item>
        <a-form-item label="启用" name="enable">
          <a-switch v-model:checked="editForm.enable"/>
        </a-form-item>
        <a-form-item label="表达式" name="expr">
          <a-input v-model:value="editForm.expr" placeholder="请输入表达式" />
        </a-form-item>
        <a-form-item>
          <a-button type="primary" @click="validateEditExpression">验证表达式</a-button>
        </a-form-item>
        <a-form-item label="严重性" name="severity">
          <a-select v-model:value="editForm.severity" placeholder="请选择严重性">
            <a-select-option value="critical">Critical</a-select-option>
            <a-select-option value="warning">Warning</a-select-option>
            <a-select-option value="info">Info</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="持续时间" name="forTime">
          <a-input v-model:value="editForm.forTime" placeholder="例如: 10s" />
        </a-form-item>
        <a-form-item label="标签" name="labels">
          <a-select mode="tags" v-model:value="editForm.labels" placeholder="请输入标签，例如 key=value" />
        </a-form-item>
        <a-form-item label="注解" name="annotations">
          <a-select mode="tags" v-model:value="editForm.annotations" placeholder="请输入注解" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { message, Modal } from 'ant-design-vue';
import {
  getAlertRulesApi,
  createAlertRuleApi,
  updateAlertRuleApi,
  deleteAlertRuleApi,
  getAllTreeNodes,
  validateExprApi,
  getMonitorScrapePoolApi,
  getMonitorSendGroupApi,
} from '#/api'; // 请根据实际路径调整

// 定义数据类型
interface AlertRule {
  id: number;
  name: string;
  userId: number;
  poolId: number;
  sendGroupId: number;
  treeNodeId: number;
  enable: number; // 1: 启用, 2: 禁用
  expr: string;
  severity: string;
  forTime: string;
  labels: string[];
  annotations: string[];
  CreatedAt: string;
  UpdatedAt: string;
}

// 定义树节点数据类型
interface TreeNode {
  id: string;
  title: string;
  children?: TreeNode[];
  isLeaf?: number;
  value?: string;
  key?: string;
}

interface ScrapePool {
  id: number;
  name: string;
}

interface SendGroup {
  id: number;
  name: string;
}

// 数据源
const data = ref<AlertRule[]>([]);
const scrapePools = ref<ScrapePool[]>([]);
const sendGroups = ref<SendGroup[]>([]);

// 搜索文本
const searchText = ref('');

// 加载状态
const loading = ref(false);

// 过滤后的数据
const filteredData = computed(() => {
  const searchValue = searchText.value.trim().toLowerCase();
  return data.value.filter(item =>
    item.name.toLowerCase().includes(searchValue)
  );
});

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
      isLeaf: node.isLeaf
    };

    if (node.children && node.children.length > 0) {
      processedNode.children = processTreeData(node.children);
    }

    return processedNode;
  });
};

// 递归获取所有叶子节点
const getLeafNodes = (nodes: TreeNode[]): TreeNode[] => {
  let leaves: TreeNode[] = [];
  nodes.forEach(node => {
    if (node.isLeaf === 1) {
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
  } catch (error: any) {
    message.error(error.message || '获取树节点数据失败');
    console.error(error);
  }
};

// 获取实例池数据
const fetchScrapePools = async () => {
  try {
    const response = await getMonitorScrapePoolApi();
    scrapePools.value = response;
  } catch (error: any) {
    message.error(error.message || '获取实例池数据失败');
    console.error(error);
  }
};

// 获取发送组数据
const fetchSendGroups = async () => {
  try {
    const response = await getMonitorSendGroupApi();
    sendGroups.value = response;
  } catch (error: any) {
    message.error(error.message || '获取发送组数据失败');
    console.error(error);
  }
};

// 表格列配置
const columns = [
  {
    title: 'id',
    dataIndex: 'id',
    key: 'id',
    sorter: (a: AlertRule, b: AlertRule) => a.id - b.id,
  },
  {
    title: '名称',
    dataIndex: 'name',
    key: 'name',
    sorter: (a: AlertRule, b: AlertRule) => a.name.localeCompare(b.name),
  },
  {
    title: '所属实例池ID',
    dataIndex: 'poolId',
    key: 'poolId',
    sorter: (a: AlertRule, b: AlertRule) => a.poolId - b.poolId,
  },
  {
    title: '绑定发送组ID',
    dataIndex: 'sendGroupId',
    key: 'sendGroupId',
    sorter: (a: AlertRule, b: AlertRule) => a.sendGroupId - b.sendGroupId,
  },
  {
    title: '绑定树节点ID',
    dataIndex: 'treeNodeId',
    key: 'treeNodeId',
    sorter: (a: AlertRule, b: AlertRule) => a.treeNodeId - b.treeNodeId,
  },
  {
    title: '严重性',
    dataIndex: 'severity',
    key: 'severity',
    slots: { customRender: 'severity' },
    sorter: (a: AlertRule, b: AlertRule) =>
      a.severity.localeCompare(b.severity),
  },
  {
    title: '持续时间',
    dataIndex: 'forTime',
    key: 'forTime',
    sorter: (a: AlertRule, b: AlertRule) => a.forTime.localeCompare(b.forTime),
  },
  {
    title: '启用',
    dataIndex: 'enable',
    key: 'enable',
    slots: { customRender: 'enable' },
    sorter: (a: AlertRule, b: AlertRule) => a.enable - b.enable,
  },
  {
    title: '标签',
    dataIndex: 'labels',
    key: 'labels',
    slots: { customRender: 'labels' },
  },
  {
    title: '注解',
    dataIndex: 'annotations',
    key: 'annotations',
    slots: { customRender: 'annotations' },
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
  poolId: null as number | null,
  sendGroupId: null as number | null,
  treeNodeId: null as number | null,
  expr: '',
  severity: '',
  forTime: '',
  enable: 1,
  labels: [] as string[],
  annotations: [] as string[],
});

// 编辑表单
const editForm = reactive({
  id: 0,
  name: '',
  poolId: null as number | null,
  sendGroupId: null as number | null,
  treeNodeId: null as number | null,
  expr: '',
  severity: '',
  forTime: '',
  enable: 1,
  labels: [] as string[],
  annotations: [] as string[],
});

// 显示新增模态框
const showAddModal = () => {
  resetAddForm();
  isAddModalVisible.value = true;
};

// 重置新增表单
const resetAddForm = () => {
  addForm.name = '';
  addForm.poolId = null;
  addForm.sendGroupId = null;
  addForm.treeNodeId = null;
  addForm.expr = '';
  addForm.severity = '';
  addForm.forTime = '';
  addForm.enable = 1;
  addForm.labels = [];
  addForm.annotations = [];
};

// 关闭新增模态框
const closeAddModal = () => {
  isAddModalVisible.value = false;
};

// 显示编辑模态框
const showEditModal = (record: AlertRule) => {
  Object.assign(editForm, {
    id: record.id,
    name: record.name,
    poolId: record.poolId,
    sendGroupId: record.sendGroupId,
    treeNodeId: record.treeNodeId,
    expr: record.expr,
    severity: record.severity,
    forTime: record.forTime,
    enable: record.enable === 1,
    labels: [...record.labels],
    annotations: [...record.annotations],
  });
  isEditModalVisible.value = true;
};

// 关闭编辑模态框
const closeEditModal = () => {
  isEditModalVisible.value = false;
};

// 提交新增 AlertRule
const handleAdd = async () => {
  try {
    // 表单验证逻辑可以在此添加
    if (addForm.name === '' || addForm.poolId === null) {
      message.error('请填写所有必填项');
      return;
    }

    const payload = {
      name: addForm.name,
      poolId: addForm.poolId,
      sendGroupId: addForm.sendGroupId || 0,
      treeNodeId: addForm.treeNodeId || 0,
      expr: addForm.expr,
      severity: addForm.severity,
      forTime: addForm.forTime,
      enable: addForm.enable ? 1 : 2,
      labels: addForm.labels,
      annotations: addForm.annotations,
    };

    await createAlertRuleApi(payload); // 调用创建 API
    message.success('新增AlertRule成功');
    fetchAlertRules();
    closeAddModal();
  } catch (error: any) {
    message.error(error.message || '新增AlertRule失败');
    console.error(error);
  }
};

// 提交更新AlertRule
const handleEdit = async () => {
  try {
    if (editForm.name === '' || editForm.poolId === null) {
      message.error('请填写所有必填项');
      return;
    }

    const payload = {
      id: editForm.id,
      name: editForm.name,
      poolId: editForm.poolId,
      sendGroupId: editForm.sendGroupId || 0,
      treeNodeId: editForm.treeNodeId || 0,
      expr: editForm.expr,
      severity: editForm.severity,
      forTime: editForm.forTime,
      enable: editForm.enable ? 1 : 2,
      labels: editForm.labels,
      annotations: editForm.annotations,
    };
    await updateAlertRuleApi(payload); // 调用更新 API
    message.success('更新AlertRule成功');
    fetchAlertRules();
    closeEditModal();
  } catch (error: any) {
    message.error(error.message || '更新AlertRule失败');
    console.error(error);
  } 
};

// 处理删除AlertRule
const handleDelete = (record: AlertRule) => {
  Modal.confirm({
    title: '确认删除',
    content: `您确定要删除AlertRule "${record.name}" 吗？`,
    okText: '确认',
    cancelText: '取消',
    onOk: async () => {
      try {
        loading.value = true;
        const response = await deleteAlertRuleApi(record.id); // 调用删除 API
        loading.value = false;
        message.success('AlertRule已删除');
        fetchAlertRules();
      } catch (error: any) {
        loading.value = false;
        message.error(error.message || '删除AlertRule失败');
        console.error(error);
      }
    },
  });
};

// 获取AlertRules数据
const fetchAlertRules = async () => {
  try {
    loading.value = true;
    const response = await getAlertRulesApi(); // 调用获取数据 API
    data.value = response;
  } catch (error: any) {
    message.error(error.message || '获取AlertRules数据失败');
    console.error(error);
  }
};

// 定义Severity颜色映射
const severityColor = (severity: string) => {
  switch (severity) {
    case 'critical':
      return 'red';
    case 'warning':
      return 'orange';
    case 'info':
      return 'blue';
    default:
      return 'default';
  }
};

const validateAddExpression = async (expr: string) => {
  try {
    const payload = { promqlExpr: expr };
    const result = await validateExprApi(payload);
    message.success('验证表达式成功', result.message);
    return true;
  } catch (error: any) {
    message.error(error.message || '验证表达式失败');
    console.error(error);
    return false;
  }
};

// 验证表达式的方法（编辑）
const validateEditExpression = async () => {
  try {
    const payload = { promqlExpr: editForm.expr };
    const result = await validateExprApi(payload);
    message.success('验证表达式成功', result.message);
    return true;
  } catch (error: any) {
    message.error(error.message || '验证表达式失败');
    console.error(error);
    return false;
  }
};

// 在组件加载时获取数据
onMounted(() => {
  fetchAlertRules();
  fetchTreeNodes();
  fetchScrapePools();
  fetchSendGroups();
});
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
