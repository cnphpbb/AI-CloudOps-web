<template>
  <div>
    <!-- 查询和操作 -->
    <div class="custom-toolbar">
      <!-- 查询功能 -->
      <div class="search-filters">
        <!-- 搜索输入框 -->
        <a-input
          v-model="searchText"
          placeholder="请输入记录规则名称"
          style="width: 200px; margin-right: 16px"
        />
      </div>
      <!-- 操作按钮 -->
      <div class="action-buttons">
        <a-button type="primary" @click="showAddModal">新增记录规则</a-button>
      </div>
    </div>

    <!-- 记录规则列表表格 -->
    <a-table
      :columns="columns"
      :data-source="filteredData"
      row-key="key"
      :loading="loading"
    >
      <!-- 标签组列 -->
      <template #labels="{ record }">
        <a-tag v-for="label in record.labels" :key="label">{{ label }}</a-tag>
      </template>
      <!-- 操作列 -->
      <template #action="{ record }">
        <a-space>
          <a-button type="link" @click="showEditModal(record)"
            >编辑记录规则</a-button
          >
          <a-button type="link" danger @click="handleDelete(record)"
            >删除记录规则</a-button
          >
        </a-space>
      </template>
    </a-table>

    <!-- 新增记录规则模态框 -->
    <a-modal
      title="新增记录规则"
      v-model:visible="isAddModalVisible"
      @ok="handleAdd"
      @cancel="closeAddModal"
      :confirmLoading="loading"
      ok-text="提交"
      cancel-text="取消"
    >
      <a-form :model="addForm" layout="vertical">
        <a-form-item
          label="记录规则名称"
          name="name"
          :rules="[{ required: true, message: '请输入记录规则名称' }]"
        >
          <a-input
            v-model:value="addForm.name"
            placeholder="请输入记录规则名称"
          />
        </a-form-item>

        <a-form-item
          label="记录名称"
          name="recordName"
          :rules="[{ required: true, message: '请输入记录名称' }]"
        >
          <a-input
            v-model:value="addForm.recordName"
            placeholder="请输入记录名称"
          />
        </a-form-item>

        <a-form-item
          label="Prometheus 实例池"
          name="poolId"
          :rules="[{ required: true, message: '请选择实例池' }]"
        >
          <a-select
            v-model:value="addForm.poolId"
            placeholder="请选择实例池"
            style="width: 100%"
          >
            <a-select-option
              v-for="pool in poolOptions"
              :key="pool.id"
              :value="pool.id"
            >
              {{ pool.name }}
            </a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item
          label="树节点"
          name="TreeNodeID"
        >
          <a-select
            v-model:value="addForm.treeNodeId"
            placeholder="请选择树节点"
            style="width: 100%"
          >
            <a-select-option
              v-for="node in treeNodeOptions"
              :key="node.id"
              :value="node.id"
            >
              {{ node.title }}
            </a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item
          label="是否启用"
          name="enable"
          :rules="[{ required: true, message: '请选择是否启用' }]"
        >
          <a-select
            v-model:value="addForm.enable"
            placeholder="请选择是否启用"
            style="width: 100%"
          >
            <a-select-option :value="1">启用</a-select-option>
            <a-select-option :value="2">禁用</a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item
          label="持续时间"
          name="forTime"
        >
          <a-input v-model:value="addForm.forTime" placeholder="例如: 15s" />
        </a-form-item>

        <a-form-item
          label="表达式"
          name="expr"
        >
          <a-input v-model:value="addForm.expr" placeholder="请输入表达式" />
        </a-form-item>

        <a-form-item>
          <a-button type="primary" @click="validateAddExpression"
            >验证表达式</a-button
          >
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 编辑记录规则模态框 -->
    <a-modal
      title="编辑记录规则"
      v-model:visible="isEditModalVisible"
      @ok="handleUpdate"
      @cancel="closeEditModal"
      :confirmLoading="loading"
      ok-text="提交"
      cancel-text="取消"
    >
      <a-form :model="editForm" layout="vertical">
        <a-form-item
          label="记录规则名称"
          name="name"
          :rules="[{ required: true, message: '请输入记录规则名称' }]"
        >
          <a-input
            v-model:value="editForm.name"
            placeholder="请输入记录规则名称"
          />
        </a-form-item>

        <a-form-item
          label="记录名称"
          name="recordName"
          :rules="[{ required: true, message: '请输入记录名称' }]"
        >
          <a-input
            v-model:value="editForm.recordName"
            placeholder="请输入记录名称"
          />
        </a-form-item>

        <a-form-item
          label="Prometheus 实例池"
          name="poolId"
          :rules="[{ required: true, message: '请选择实例池' }]"
        >
          <a-select
            v-model:value="editForm.poolId"
            placeholder="请选择实例池"
            style="width: 100%"
          >
            <a-select-option
              v-for="pool in poolOptions"
              :key="pool.id"
              :value="pool.id"
            >
              {{ pool.name }}
            </a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item label="树节点" name="TreeNodeID">
          <a-select
            v-model:value="editForm.treeNodeId"
            placeholder="请选择树节点"
            style="width: 100%"
          >
            <a-select-option
              v-for="node in treeNodeOptions"
              :key="node.id"
              :value="node.id"
            >
              {{ node.title }}
            </a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item
          label="是否启用"
          name="enable"
          :rules="[{ required: true, message: '请选择是否启用' }]"
        >
          <a-select
            v-model:value="editForm.enable"
            placeholder="请选择是否启用"
            style="width: 100%"
          >
            <a-select-option :value="1">启用</a-select-option>
            <a-select-option :value="2">禁用</a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item
          label="持续时间"
          name="forTime"
        >
          <a-input v-model:value="editForm.forTime" placeholder="例如: 15s" />
        </a-form-item>

        <a-form-item
          label="表达式"
          name="expr"
        >
          <a-input v-model:value="editForm.expr" placeholder="请输入表达式" />
        </a-form-item>

        <a-form-item>
          <a-button type="primary" @click="validateEditExpression"
            >验证表达式</a-button
          >
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { message, Modal } from 'ant-design-vue';
import {
  getRecordRulesApi,
  createRecordRuleApi,
  updateRecordRuleApi,
  deleteRecordRuleApi,
  getMonitorScrapePoolApi,
  getAllTreeNodes,
  validateExprApi,
} from '#/api'; // 请根据实际路径调整

// 定义数据类型
interface RecordRule {
  id: number; // 记录规则id
  name: string; // 记录规则名称
  recordName: string; // 记录名称
  poolId: number; // 关联的 Prometheus 实例池 id
  poolName: string; // 关联的 Prometheus 实例池名称
  treeNodeId: number; // 绑定的树节点id
  enable: number; // 是否启用记录规则：1 启用，2 禁用
  expr: string; // 记录规则表达式
  forTime: string; // 持续时间，达到此时间才触发记录规则
  userId: string; // 创建者用户名
  CreatedAt: string; // 创建时间
}

// 定义 Pool 和 TreeNode 类型
interface Pool {
  id: number;
  name: string;
}

interface TreeNode {
  id: number;
  title: string;
}

// 数据源
const data = ref<RecordRule[]>([]);

// 下拉框数据源
const poolOptions = ref<Pool[]>([]);
const treeNodeOptions = ref<TreeNode[]>([]);

// 搜索文本
const searchText = ref('');

// 加载状态
const loading = ref(false);

// 过滤后的数据
const filteredData = computed(() => {
  const searchValue = searchText.value.trim().toLowerCase();
  return data.value.filter((item) =>
    item.name.toLowerCase().includes(searchValue),
  );
});

// 表格列配置
const columns = [
  {
    title: 'id',
    dataIndex: 'id',
    key: 'id',
    sorter: (a: RecordRule, b: RecordRule) => a.id - b.id,
  },
  {
    title: '记录规则名称',
    dataIndex: 'name',
    key: 'name',
    sorter: (a: RecordRule, b: RecordRule) => a.name.localeCompare(b.name),
  },
  {
    title: '记录名称',
    dataIndex: 'recordName',
    key: 'recordName',
    sorter: (a: RecordRule, b: RecordRule) =>
      a.recordName.localeCompare(b.recordName),
  },
  {
    title: '关联 Prometheus 实例池',
    dataIndex: 'poolId',
    key: 'poolId',
    sorter: (a: RecordRule, b: RecordRule) => a.poolId - b.poolId,
  },
  {
    title: '绑定树节点id',
    dataIndex: 'treeNodeId',
    key: 'treeNodeId',
    sorter: (a: RecordRule, b: RecordRule) => a.treeNodeId - b.treeNodeId,
  },
  {
    title: '是否启用',
    dataIndex: 'enable',
    key: 'enable',
    customRender: ({ text }: { text: number }) =>
      text === 1 ? '启用' : '禁用',
    sorter: (a: RecordRule, b: RecordRule) => a.enable - b.enable,
  },
  {
    title: '持续时间',
    dataIndex: 'forTime',
    key: 'forTime',
    sorter: (a: RecordRule, b: RecordRule) =>
      a.forTime.localeCompare(b.forTime),
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
  recordName: '',
  poolId: null as number | null,
  treeNodeId: null as number | null,
  enable: 1,
  forTime: '15s',
  expr: '',
});

// 编辑表单
const editForm = reactive({
  id: 0,
  name: '',
  recordName: '',
  poolId: null as number | null,
  treeNodeId: null as number | null,
  enable: 1,
  forTime: '',
  expr: '',
});

// 显示新增模态框
const showAddModal = () => {
  resetAddForm();
  isAddModalVisible.value = true;
};

// 重置新增表单
const resetAddForm = () => {
  addForm.name = '';
  addForm.recordName = '';
  addForm.poolId = null;
  addForm.treeNodeId = null;
  addForm.enable = 1;
  addForm.forTime = '15s';
  addForm.expr = '';
};

// 关闭新增模态框
const closeAddModal = () => {
  isAddModalVisible.value = false;
};

// 显示编辑模态框
const showEditModal = (record: RecordRule) => {
  Object.assign(editForm, {
    id: record.id,
    name: record.name,
    recordName: record.recordName,
    poolId: record.poolId,
    TreeNodeid: record.treeNodeId,
    enable: record.enable,
    forTime: record.forTime,
    expr: record.expr,
  });
  isEditModalVisible.value = true;
};

// 关闭编辑模态框
const closeEditModal = () => {
  isEditModalVisible.value = false;
};

// 提交新增记录规则
const handleAdd = async () => {
  try {
    // 表单验证
    if (
      !addForm.name ||
      !addForm.recordName ||
      !addForm.poolId ||
      !addForm.treeNodeId ||
      !addForm.forTime ||
      !addForm.expr
    ) {
      message.error('请填写所有必填项');
      return;
    }

    const payload = {
      name: addForm.name,
      recordName: addForm.recordName,
      poolId: addForm.poolId,
      treeNodeId: addForm.treeNodeId,
      enable: addForm.enable,
      forTime: addForm.forTime,
      expr: addForm.expr,
    };

    loading.value = true;
    await createRecordRuleApi(payload); // 调用创建 API
    loading.value = false;
    message.success('新增记录规则成功');
    fetchRecordRules();
    closeAddModal();
  } catch (error) {
    loading.value = false;
    message.error('新增记录规则失败，请稍后重试');
    console.error(error);
  }
};

// 提交更新记录规则
const handleUpdate = async () => {
  try {
    // 表单验证
    if (
      !editForm.name ||
      !editForm.recordName ||
      !editForm.poolId ||
      !editForm.treeNodeId ||
      !editForm.forTime ||
      !editForm.expr
    ) {
      message.error('请填写所有必填项');
      return;
    }

    const payload = {
      id: editForm.id,
      name: editForm.name,
      recordName: editForm.recordName,
      poolId: editForm.poolId,
      treeNodeId: editForm.treeNodeId,
      enable: editForm.enable,
      forTime: editForm.forTime,
      expr: editForm.expr,
    };

    loading.value = true;
    await updateRecordRuleApi(payload); // 调用更新 API
    loading.value = false;
    message.success('更新记录规则成功');
    fetchRecordRules();
    closeEditModal();
  } catch (error) {
    loading.value = false;
    message.error('更新记录规则失败，请稍后重试');
    console.error(error);
  }
};

// 处理删除记录规则
const handleDelete = (record: RecordRule) => {
  Modal.confirm({
    title: '确认删除',
    content: `您确定要删除记录规则 "${record.name}" 吗？`,
    okText: '确认',
    cancelText: '取消',
    onOk: async () => {
      try {
        loading.value = true;
        await deleteRecordRuleApi(record.id); // 调用删除 API
        loading.value = false;
        message.success('记录规则已删除');
        fetchRecordRules();
      } catch (error) {
        loading.value = false;
        message.error('删除记录规则失败，请稍后重试');
        console.error(error);
      }
    },
  });
};

// 获取记录规则数据
const fetchRecordRules = async () => {
  try {
    const response = await getRecordRulesApi(); // 调用获取数据 API
    data.value = response;
  } catch (error) {
    loading.value = false;
    message.error('获取记录规则数据失败，请稍后重试');
    console.error(error);
  }
};

// 获取所有实例池数据
const fetchPools = async () => {
  try {
    const response = await getMonitorScrapePoolApi(); // 调用获取实例池 API
    poolOptions.value = response;
  } catch (error) {
    message.error('获取实例池数据失败，请稍后重试');
    console.error(error);
  }
};

// 获取所有树节点数据
const fetchTreeNodes = async () => {
  try {
    const response = await getAllTreeNodes(); // 调用获取树节点 API
    treeNodeOptions.value = response;
  } catch (error) {
    message.error('获取树节点数据失败，请稍后重试');
    console.error(error);
  }
};

// 表达式验证（新增）
const validateAddExpression = async () => {
  try {
    if (!addForm.expr) {
      message.error('表达式不能为空');
      return;
    }
    const payload = { promqlExpr: addForm.expr };
    await validateExprApi(payload); // 调用验证 API
    message.success('表达式验证成功');
  } catch (error) {
    message.error('表达式验证失败，请稍后重试');
    console.error(error);
  }
};

// 表达式验证（编辑）
const validateEditExpression = async () => {
  try {
    if (!editForm.expr) {
      message.error('表达式不能为空');
      return;
    }
    const payload = { promqlExpr: editForm.expr };
    await validateExprApi(payload); // 调用验证 API
    message.success('表达式验证成功');
  } catch (error) {
    message.error('表达式验证失败，请稍后重试');
    console.error(error);
  }
};

// 在组件加载时获取数据
onMounted(() => {
  fetchRecordRules();
  fetchPools();
  fetchTreeNodes();
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
