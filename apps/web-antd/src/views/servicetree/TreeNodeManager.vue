<template>
  <div>
    <!-- 操作工具栏 -->
    <div class="custom-toolbar">
      <div class="search-filters">
        <a-input 
          v-model:value="searchText" 
          placeholder="请输入节点名称" 
          style="width: 200px" 
        />
      </div>
      <div class="action-buttons">
        <a-button type="primary" @click="handleAddNode">新增节点</a-button>
      </div>
    </div>

    <!-- 节点列表 -->
    <a-table :columns="columns" :data-source="filteredData" row-key="id">
      <!-- 操作列 -->
      <template #action="{ record }">
        <a-space>
          <a-tooltip title="编辑节点">
            <a-button type="link" @click="handleEditNode(record)">
              <template #icon><Icon icon="clarity:note-edit-line" style="font-size: 22px" /></template>
            </a-button>
          </a-tooltip>
          <a-popconfirm
            title="确定要删除这个节点吗?"
            ok-text="确定"
            cancel-text="取消"
            placement="left"
            @confirm="handleDeleteNode(record)"
          >
            <a-tooltip title="删除节点">
              <a-button type="link" danger>
                <template #icon><Icon icon="ant-design:delete-outlined" style="font-size: 22px" /></template>
              </a-button>
            </a-tooltip>
          </a-popconfirm>
        </a-space>
        <!-- 编辑表单的模态框 -->
        <a-modal
          v-model:visible="isEditModalVisible"
          title="编辑节点"
          @ok="handleSaveNode"
          @cancel="handleCancel"
        >
          <a-form
            :model="editForm"
            :label-col="{ span: 6 }"
            :wrapper-col="{ span: 16 }"
            ref="editFormRef"
          >
            <a-form-item
              label="节点名称"
              name="title"
              :rules="[{ required: true, message: '请输入节点名称' }]"
            >
              <a-input
                v-model:value="editForm.title"
                placeholder="请输入节点名称"
              />
            </a-form-item>

            <a-form-item label="描述" name="desc">
              <a-input v-model:value="editForm.desc" placeholder="请输入描述" />
            </a-form-item>

            <a-form-item label="运维负责人" name="ops_admins">
              <a-select
                v-model:value="editForm.ops_admins"
                mode="multiple"
                placeholder="请选择运维负责人"
              >
                <a-select-option
                  v-for="person in availableOpsAdmins"
                  :key="person.id"
                  :value="person.id"
                >
                  {{ person.name }}
                </a-select-option>
              </a-select>
            </a-form-item>

            <a-form-item label="研发负责人" name="rd_admins">
              <a-select
                v-model:value="editForm.rd_admins"
                mode="multiple"
                placeholder="请选择研发负责人"
              >
                <a-select-option
                  v-for="person in availableRdAdmins"
                  :key="person.id"
                  :value="person.id"
                >
                  {{ person.name }}
                </a-select-option>
              </a-select>
            </a-form-item>

            <a-form-item label="研发工程师" name="rd_members">
              <a-select
                v-model:value="editForm.rd_members"
                mode="multiple"
                placeholder="请选择研发工程师"
              >
                <a-select-option
                  v-for="person in availableRdMembers"
                  :key="person.id"
                  :value="person.id"
                >
                  {{ person.name }}
                </a-select-option>
              </a-select>
            </a-form-item>
          </a-form>
        </a-modal>
      </template>
    </a-table>

    <!-- 新增节点的模态框 -->
    <a-modal
      v-model:visible="isAddModalVisible"
      title="新增节点"
      @ok="handleSaveAddNode"
      @cancel="handleAddCancel"
    >
      <a-form
        :model="addForm"
        :label-col="{ span: 6 }"
        :wrapper-col="{ span: 16 }"
        ref="addFormRef"
      >
        <a-form-item
          label="节点名称"
          name="title"
          :rules="[{ required: true, message: '请输入节点名称' }]"
        >
          <a-input v-model:value="addForm.title" placeholder="请输入节点名称" />
        </a-form-item>

        <a-form-item label="描述" name="desc">
          <a-input v-model:value="addForm.desc" placeholder="请输入描述" />
        </a-form-item>

        <a-form-item 
          label="父节点" 
          name="pId"
          :rules="[{ required: true, message: '请选择父节点' }]"
        >
          <a-tree-select
            v-if="isAddModalVisible"
            v-model:value="addForm.pId"
            style="width: 100%"
            :dropdown-style="{ maxHeight: '400px', overflow: 'auto' }"
            :tree-data="directoryNodes"
            placeholder="请选择父节点"
            tree-default-expand-all
            :field-names="{ label: 'title', value: 'id', children: 'children' }"
            :tree-line="true"
            @select="onParentSelect"
          />
        </a-form-item>

        <a-form-item 
          label="节点类型" 
          name="isLeaf"
          :rules="[{ required: true, message: '请选择节点类型' }]"
        >
          <a-select v-model:value="addForm.isLeaf" placeholder="请选择节点类型">
            <a-select-option :value="0">目录节点</a-select-option>
            <a-select-option :value="1">叶子节点</a-select-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script lang="ts" setup>
import { reactive, ref, onMounted, watch, computed } from 'vue';
import { message, Modal } from 'ant-design-vue';
import { Icon } from '@iconify/vue';
import { getAllTreeNodes, deleteTreeNode, updateTreeNode, createTreeNode } from '#/api';
import type { TreeNode, User } from '#/api/core/tree';

// 节点数据
const data = reactive<TreeNode[]>([]);
const isEditModalVisible = ref(false);
// 搜索文本
const searchText = ref('');
// 过滤后的数据
const filteredData = computed(() => {
  const searchValue = searchText.value.trim().toLowerCase();
  return data.filter((item) =>
    item.title.toLowerCase().includes(searchValue)
  );
});

// 计算属性：过滤出所有目录节点构建树形结构
const directoryNodes = computed(() => {
  const filterDirectoryNodes = (nodes: TreeNode[]): TreeNode[] => {
    return nodes
      .filter(node => !node.isLeaf)
      .map(node => ({
        ...node,
        children: node.children ? filterDirectoryNodes(node.children) : []
      }));
  };
  
  return [
    { id: 0, title: '顶级节点', key: '0', level: 0 },
    ...filterDirectoryNodes(data)
  ];
});

// 根据选择的父节点自动计算level
const onParentSelect = (value: number) => {
  if (value === 0) {
    addForm.level = 1;
    return;
  }
  
  const parentNode = findNodeById(data, value);
  if (parentNode) {
    addForm.level = parentNode.level + 1;
  }
};

// 表格列配置
const columns = [
  {
    title: '节点名称',
    dataIndex: 'title',
    key: 'title',
  },
  {
    title: '描述',
    dataIndex: 'desc',
    key: 'desc',
  },
  {
    title: 'ECS 数量',
    dataIndex: 'ecsCount',
    key: 'ecsCount',
  },
  {
    title: 'ELB 数量',
    dataIndex: 'elbCount',
    key: 'elbCount',
  },
  {
    title: 'RDS 数量',
    dataIndex: 'rdsCount',
    key: 'rdsCount',
  },
  {
    title: '操作',
    key: 'action',
    slots: { customRender: 'action' },
  },
];

// 编辑表单的数据
const editForm = reactive({
  id: 0,
  title: '',
  desc: '',
  ops_admins: [] as User[],
  rd_admins: [] as User[],
  rd_members: [] as User[],
});

// 可选的运维负责人列表 假数据
const availableOpsAdmins = [
  { id: 1, name: '运维负责人A' },
  { id: 2, name: '运维负责人B' },
];

// 可选的研发负责人列表 假数据
const availableRdAdmins = [
  { id: 3, name: '研发负责人A' },
  { id: 4, name: '研发负责人B' },
];

// 可选的研发工程师列表 假数据
const availableRdMembers = [
  { id: 5, name: '研发工程师A' },
  { id: 6, name: '研发工程师B' },
];

const handleDeleteNode = (record: TreeNode) => {
  // 手动创建一个确认 Modal
  Modal.confirm({
    title: '确认删除',
    content: `确认删除节点 "${record.title}" 吗?`,
    okText: '确认',
    cancelText: '取消',
    onOk: async () => {
      try {
        await deleteTreeNode(record.id);
        await refreshTreeData(); // 刷新节点数据
        message.success(`节点 "${record.title}" 已删除`);
      } catch (err: any) {
        message.error(String(err.message));
      }
    },
  });
};

const isAddModalVisible = ref(false);
const addFormRef = ref();
const editFormRef = ref();

// 添加节点的表单数据
const addForm = reactive({
  title: '',
  desc: '',
  pId: 0,
  isLeaf: 0,
  level: 1,
});

// 递归查找节点
const findNodeById = (nodes: TreeNode[], id: number): TreeNode | null => {
  for (const node of nodes) {
    if (node.id === id) {
      return node;
    }
    if (node.children) {
      const found = findNodeById(node.children, id);
      if (found) {
        return found;
      }
    }
  }
  return null;
};

const handleAddNode = () => {
  // 重置表单数据
  Object.assign(addForm, {
    title: '',
    desc: '',
    pId: 0,
    isLeaf: 0,
    level: 1,
  });
  
  // 显示添加节点的模态框
  isAddModalVisible.value = true;
};

// 添加保存新节点的方法
const handleSaveAddNode = async () => {
  try {
    await addFormRef.value?.validate();
    
    await createTreeNode({
      title: addForm.title,
      pId: addForm.pId,
      desc: addForm.desc,
      isLeaf: addForm.isLeaf,
      level: addForm.level,
    });

    message.success('新增节点成功');
    isAddModalVisible.value = false;
    await refreshTreeData(); // 刷新节点数据
  } catch (error) {
    message.error('新增节点失败');
    console.error(error);
  }
};

// 点击编辑按钮时，弹出表单并填充默认数据
const handleEditNode = (record: TreeNode) => {
  // 填充编辑表单的数据
  editForm.id = record.id;
  editForm.title = record.title;
  editForm.desc = record.desc;
  editForm.ops_admins = [...(record.ops_admins || [])]; 
  editForm.rd_admins = [...(record.rd_admins || [])];
  editForm.rd_members = [...(record.rd_members || [])];

  // 显示模态框
  isEditModalVisible.value = true;
};

// 保存节点数据
const handleSaveNode = async () => {
  try {
    await editFormRef.value?.validate();
    await updateTreeNode(editForm);
    message.success('节点信息已保存');
    isEditModalVisible.value = false;
    await refreshTreeData();
  } catch (error) {
    message.error('保存节点信息失败');
    console.error(error);
  }
};

// 取消编辑
const handleCancel = () => {
  editFormRef.value?.resetFields();
  isEditModalVisible.value = false;
};

// 取消新增
const handleAddCancel = () => {
  addFormRef.value?.resetFields();
  isAddModalVisible.value = false;
};

// 获取所有节点数据并更新页面
const refreshTreeData = async () => {
  try {
    const response = await getAllTreeNodes();
    if (!response) {
      data.splice(0, data.length);
      return;
    }
    data.splice(0, data.length, ...response);
  } catch (error) {
    message.error('刷新树节点数据失败');
    console.error(error);
  }
};

onMounted(async () => {
  try {
    const response = await getAllTreeNodes();
    if (response) {
      data.splice(0, data.length, ...response);
    } else {
      data.splice(0, data.length);
    }
  } catch (error) {
    message.error('获取树数据失败');
    console.error(error);
  }
});
</script>

<style scoped>
.custom-toolbar {
  padding: 8px;
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
</style>
