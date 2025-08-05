<template>
  <div class="tree-manager-container">
    <a-page-header title="服务树节点管理" subtitle="创建、编辑和管理服务树节点" :back-icon="true" @back="goBack">
      <template #extra>
        <a-space>
          <a-button type="primary" @click="showCreateNodeModal">
            <template #icon>
              <PlusOutlined />
            </template>
            创建节点
          </a-button>
          <a-button @click="refreshData">
            <template #icon>
              <ReloadOutlined />
            </template>
            刷新
          </a-button>
        </a-space>
      </template>
    </a-page-header>

    <a-row :gutter="16" class="main-content">
      <!-- 左侧树形结构 -->
      <a-col :span="6">
        <a-card title="服务树结构" :bordered="false" class="tree-card">
          <template #extra>
            <a-dropdown>
              <template #overlay>
                <a-menu>
                  <a-menu-item key="1" @click="expandAll">展开所有</a-menu-item>
                  <a-menu-item key="2" @click="collapseAll">收起所有</a-menu-item>
                </a-menu>
              </template>
              <a-button type="text">
                <SettingOutlined />
              </a-button>
            </a-dropdown>
          </template>

          <a-spin :spinning="loading">
            <a-input-search v-model:value="searchValue" placeholder="搜索节点" style="margin-bottom: 16px"
              @change="onSearchChange" allow-clear />

            <a-tree v-model:expanded-keys="expandedKeys" v-model:selected-keys="selectedKeys"
              :tree-data="filteredTreeData" :show-line="{ showLeafIcon: false }" @select="onSelect">
              <template #title="{ title, key }">
                <span class="tree-node-title">
                  {{ title }}
                  <div class="node-actions">
                    <a-tooltip title="新增子节点">
                      <PlusCircleOutlined @click.stop="showCreateChildNodeModal(key)" />
                    </a-tooltip>
                    <a-tooltip title="编辑节点">
                      <EditOutlined @click.stop="showEditNodeModal(key)" />
                    </a-tooltip>
                    <a-tooltip title="删除节点">
                      <DeleteOutlined @click.stop="confirmDeleteNode(key)" />
                    </a-tooltip>
                  </div>
                </span>
              </template>
            </a-tree>
          </a-spin>
        </a-card>
      </a-col>

      <!-- 右侧详情与管理 -->
      <a-col :span="18">
        <div v-if="selectedNode">
          <a-card :bordered="false" class="detail-card">
            <a-tabs v-model:active-key="activeTabKey">
              <a-tab-pane key="basicInfo" tab="基本信息">
                <a-descriptions title="节点详情" :column="3" bordered>
                  <a-descriptions-item label="节点ID">{{ selectedNode.id }}</a-descriptions-item>
                  <a-descriptions-item label="节点名称">{{ selectedNode.name }}</a-descriptions-item>
                  <a-descriptions-item label="层级">{{ selectedNode.level }}</a-descriptions-item>
                  <a-descriptions-item label="父节点">{{ selectedNode.parent_name || '无' }}</a-descriptions-item>
                  <a-descriptions-item label="创建时间">{{ formatDateTime(selectedNode.createdAt) }}</a-descriptions-item>
                  <a-descriptions-item label="更新时间">{{ formatDateTime(selectedNode.updatedAt) }}</a-descriptions-item>
                  <a-descriptions-item label="创建者">{{ selectedNode.creator_name || `ID: ${selectedNode.creator_id}` }}</a-descriptions-item>
                  <a-descriptions-item label="子节点数">{{ selectedNode.child_count || 0 }}</a-descriptions-item>
                  <a-descriptions-item label="资源数">{{ selectedNode.resource_count || 0 }}</a-descriptions-item>
                  <a-descriptions-item label="状态">
                    <a-tag :color="selectedNode.status === 'active' ? 'green' : 'red'">
                      {{ selectedNode.status === 'active' ? '活跃' : '非活跃' }}
                    </a-tag>
                  </a-descriptions-item>
                  <a-descriptions-item label="叶子节点">
                    <a-tag :color="selectedNode.isLeaf ? 'blue' : 'orange'">
                      {{ selectedNode.isLeaf ? '是' : '否' }}
                    </a-tag>
                  </a-descriptions-item>
                  <a-descriptions-item label="描述" :span="3">
                    {{ selectedNode.description || '无描述' }}
                  </a-descriptions-item>
                </a-descriptions>

                <a-divider orientation="left">快捷操作</a-divider>
                <a-space>
                  <a-button type="primary" @click="showEditNodeModal(String(selectedNode.id))">
                    <template #icon>
                      <EditOutlined />
                    </template>
                    编辑节点
                  </a-button>
                  <a-button @click="showCreateChildNodeModal(String(selectedNode.id))">
                    <template #icon>
                      <PlusOutlined />
                    </template>
                    添加子节点
                  </a-button>
                  <a-button @click="showMoveNodeModal">
                    <template #icon>
                      <SwapOutlined />
                    </template>
                    移动节点
                  </a-button>
                  <a-button danger @click="confirmDeleteNode(String(selectedNode.id))">
                    <template #icon>
                      <DeleteOutlined />
                    </template>
                    删除节点
                  </a-button>
                  <a-button @click="showBindResourceModal">
                    <template #icon>
                      <LinkOutlined />
                    </template>
                    绑定资源
                  </a-button>
                </a-space>
              </a-tab-pane>

              <a-tab-pane key="resources" tab="绑定资源">
                <div class="resource-header">
                  <a-space>
                    <a-button type="primary" size="small" @click="showBindResourceModal">
                      <template #icon>
                        <PlusOutlined />
                      </template>
                      绑定资源
                    </a-button>
                    <a-button size="small" @click="loadNodeResources(selectedNode.id)">
                      <template #icon>
                        <ReloadOutlined />
                      </template>
                      刷新资源
                    </a-button>
                  </a-space>
                </div>

                <a-table :data-source="nodeResources" :columns="resourceColumns" :pagination="{ pageSize: 10 }"
                  size="middle" :loading="resourceLoading">
                  <template #bodyCell="{ column, record }">
                    <template v-if="column.key === 'resource_status'">
                      <a-tag :color="getResourceStatusColor(record.resource_status)">
                        {{ record.resource_status }}
                      </a-tag>
                    </template>
                    <template v-if="column.key === 'action'">
                      <a-space>
                        <a-button size="small" type="link" @click="viewResourceDetail(record)">
                          查看
                        </a-button>
                        <a-button size="small" type="link" danger @click="confirmUnbindResource(record)">
                          解绑
                        </a-button>
                      </a-space>
                    </template>
                  </template>
                </a-table>
              </a-tab-pane>

              <a-tab-pane key="members" tab="成员管理">
                <a-tabs v-model:active-key="memberTabKey">
                  <a-tab-pane key="admins" tab="管理员">
                    <div class="member-header">
                      <a-space>
                        <a-button type="primary" size="small" @click="showAddMemberModal('admin')">
                          <template #icon>
                            <PlusOutlined />
                          </template>
                          添加管理员
                        </a-button>
                        <a-button size="small" @click="loadNodeMembers(selectedNode.id)">
                          <template #icon>
                            <ReloadOutlined />
                          </template>
                          刷新
                        </a-button>
                      </a-space>
                    </div>
                    <a-table :data-source="adminUsers" :columns="adminColumns" :pagination="{ pageSize: 10 }"
                      size="middle" :loading="memberLoading" :locale="{ emptyText: '暂无管理员' }">
                      <template #bodyCell="{ column, record }">
                        <template v-if="column.key === 'account_type'">
                          <a-tag :color="record.account_type === 2 ? 'blue' : 'green'">
                            {{ record.account_type === 2 ? '超级管理员' : '普通用户' }}
                          </a-tag>
                        </template>
                        <template v-if="column.key === 'enable'">
                          <a-tag :color="record.enable === 1 ? 'green' : 'red'">
                            {{ record.enable === 1 ? '启用' : '禁用' }}
                          </a-tag>
                        </template>
                        <template v-if="column.key === 'action'">
                          <a-space>
                            <a-button size="small" type="link" danger @click="confirmRemoveMember(record, 'admin')">
                              移除
                            </a-button>
                          </a-space>
                        </template>
                      </template>
                    </a-table>
                  </a-tab-pane>

                  <a-tab-pane key="members" tab="普通成员">
                    <div class="member-header">
                      <a-space>
                        <a-button type="primary" size="small" @click="showAddMemberModal('member')">
                          <template #icon>
                            <PlusOutlined />
                          </template>
                          添加成员
                        </a-button>
                        <a-button size="small" @click="loadNodeMembers(selectedNode.id)">
                          <template #icon>
                            <ReloadOutlined />
                          </template>
                          刷新
                        </a-button>
                      </a-space>
                    </div>
                    <a-table :data-source="memberUsers" :columns="memberColumns" :pagination="{ pageSize: 10 }"
                      size="middle" :loading="memberLoading" :locale="{ emptyText: '暂无普通成员' }">
                      <template #bodyCell="{ column, record }">
                        <template v-if="column.key === 'account_type'">
                          <a-tag :color="record.account_type === 2 ? 'blue' : 'green'">
                            {{ record.account_type === 2 ? '超级管理员' : '普通用户' }}
                          </a-tag>
                        </template>
                        <template v-if="column.key === 'enable'">
                          <a-tag :color="record.enable === 1 ? 'green' : 'red'">
                            {{ record.enable === 1 ? '启用' : '禁用' }}
                          </a-tag>
                        </template>
                        <template v-if="column.key === 'action'">
                          <a-space>
                            <a-button size="small" type="link" danger @click="confirmRemoveMember(record, 'member')">
                              移除
                            </a-button>
                          </a-space>
                        </template>
                      </template>
                    </a-table>
                  </a-tab-pane>
                </a-tabs>
              </a-tab-pane>
            </a-tabs>
          </a-card>
        </div>
        <a-empty v-else description="请选择服务树节点" />
      </a-col>
    </a-row>

    <!-- 创建/编辑节点模态框 -->
    <a-modal v-model:open="createNodeModalVisible" :title="getNodeModalTitle" @ok="handleCreateOrUpdateNode"
      :confirm-loading="confirmLoading" width="600px">
      <a-form :model="nodeForm" :rules="nodeFormRules" ref="nodeFormRef" layout="vertical">
        <a-form-item label="节点名称" name="name">
          <a-input v-model:value="nodeForm.name" placeholder="请输入节点名称" />
        </a-form-item>
        <a-form-item label="父节点" name="parent_id">
          <a-select v-model:value="nodeForm.parent_id" placeholder="请选择父节点" :disabled="!!currentParentId && !isEditMode">
            <a-select-option :value="0">无 (创建顶级节点)</a-select-option>
            <a-select-option v-for="option in parentNodeOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="描述" name="description">
          <a-textarea v-model:value="nodeForm.description" placeholder="请输入节点描述" :rows="4" />
        </a-form-item>
        <a-form-item label="节点类型" name="is_leaf">
          <a-radio-group v-model:value="nodeForm.is_leaf" :disabled="isEditMode">
            <a-radio :value="false">目录节点</a-radio>
            <a-radio :value="true">叶子节点</a-radio>
          </a-radio-group>
          <div v-if="isEditMode" class="ant-form-item-extra">
            节点类型创建后不可修改
          </div>
        </a-form-item>
        <a-form-item label="状态" name="status">
          <a-select v-model:value="nodeForm.status" placeholder="请选择状态">
            <a-select-option value="active">激活</a-select-option>
            <a-select-option value="inactive">未激活</a-select-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 移动节点模态框 -->
    <a-modal v-model:open="moveNodeModalVisible" title="移动节点" @ok="handleMoveNode" :confirm-loading="confirmLoading"
      width="500px">
      <a-form layout="vertical">
        <a-form-item label="当前节点">
          <a-input :value="selectedNode?.name" disabled />
        </a-form-item>
        <a-form-item label="移动到" name="new_parent_id">
          <a-select v-model:value="moveForm.new_parent_id" placeholder="请选择新的父节点">
            <a-select-option :value="0">根节点</a-select-option>
            <a-select-option v-for="option in moveNodeOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </a-select-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 绑定资源模态框 -->
    <a-modal v-model:open="bindResourceModalVisible" title="绑定资源" @ok="handleBindResource"
      :confirm-loading="confirmLoading" width="800px">
      <a-form :model="bindResourceForm" layout="vertical">
        <a-form-item label="资源类型" name="resource_type">
          <a-select v-model:value="bindResourceForm.resource_type" placeholder="请选择资源类型" @change="onResourceTypeChange">
            <a-select-option value="ecs">云服务器</a-select-option>
            <a-select-option value="elb">负载均衡</a-select-option>
            <a-select-option value="rds">数据库</a-select-option>
            <a-select-option value="local">本地集群</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="选择资源" name="resource_ids">
          <a-table :data-source="availableResources" :row-selection="{
            selectedRowKeys: bindResourceForm.resource_ids,
            onChange: onSelectedResourcesChange,
            type: 'checkbox'
          }" :columns="availableResourceColumns" size="middle" :pagination="{ pageSize: 5 }"
            :loading="availableResourceLoading" />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 添加成员模态框 -->
    <a-modal v-model:open="addMemberModalVisible" :title="getMemberModalTitle" @ok="handleAddMember"
      :confirm-loading="confirmLoading" width="600px">
      <a-form :model="memberForm" layout="vertical">
        <a-form-item label="选择用户" name="user_id" :rules="[{ required: true, message: '请选择用户', trigger: 'change' }]">
          <a-select v-model:value="memberForm.user_id" placeholder="请选择用户" show-search :filter-option="filterUserOption"
            style="width: 100%" :loading="userListLoading"
            :not-found-content="userListLoading ? '加载中...' : availableUsers.length === 0 ? '暂无可添加的用户' : '无匹配结果'">
            <a-select-option v-for="user in availableUsers" :key="user.id" :value="user.id"
              :disabled="user.enable !== 1">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <strong>{{ user.username }}</strong>
                  <span v-if="user.real_name" style="margin-left: 8px; color: #666;">
                    ({{ user.real_name }})
                  </span>
                </div>
                <div style="font-size: 12px; color: #999;">
                  <span v-if="user.mobile">{{ user.mobile }}</span>
                  <a-tag v-if="user.account_type === 2" color="blue" size="small" style="margin-left: 4px;">
                    超管
                  </a-tag>
                  <a-tag v-if="user.enable !== 1" color="red" size="small" style="margin-left: 4px;">
                    已禁用
                  </a-tag>
                </div>
              </div>
            </a-select-option>
          </a-select>
          <div v-if="!userListLoading && availableUsers.length === 0"
            style="margin-top: 8px; color: #999; font-size: 12px;">
            暂无可添加的用户
          </div>
        </a-form-item>

        <!-- 显示当前节点已有成员信息 -->
        <a-form-item label="当前成员统计">
          <a-space>
            <a-tag color="blue">管理员: {{ adminUsers.length }}人</a-tag>
            <a-tag color="green">普通成员: {{ memberUsers.length }}人</a-tag>
          </a-space>
        </a-form-item>

        <!-- 显示选中用户的详细信息 -->
        <a-form-item v-if="selectedUserInfo" label="用户信息">
          <a-descriptions size="small" :column="1" bordered>
            <a-descriptions-item label="用户名">{{ selectedUserInfo.username }}</a-descriptions-item>
            <a-descriptions-item label="真实姓名">{{ selectedUserInfo.real_name || '未设置' }}</a-descriptions-item>
            <a-descriptions-item label="手机号">{{ selectedUserInfo.mobile || '未设置' }}</a-descriptions-item>
            <a-descriptions-item label="账号类型">
              <a-tag :color="selectedUserInfo.account_type === 2 ? 'blue' : 'green'">
                {{ selectedUserInfo.account_type === 2 ? '超级管理员' : '普通用户' }}
              </a-tag>
            </a-descriptions-item>
            <a-descriptions-item label="状态">
              <a-tag :color="selectedUserInfo.enable === 1 ? 'green' : 'red'">
                {{ selectedUserInfo.enable === 1 ? '启用' : '禁用' }}
              </a-tag>
            </a-descriptions-item>
          </a-descriptions>
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 资源详情模态框 -->
    <a-modal v-model:open="resourceDetailModalVisible" title="资源详情" :footer="null" width="800px">
      <a-descriptions bordered :column="1" size="middle">
        <a-descriptions-item label="资源ID">{{ currentResourceDetail.resource_id }}</a-descriptions-item>
        <a-descriptions-item label="资源名称">{{ currentResourceDetail.resource_name }}</a-descriptions-item>
        <a-descriptions-item label="资源类型">{{ currentResourceDetail.resource_type }}</a-descriptions-item>
        <a-descriptions-item label="资源状态">
          <a-tag :color="getResourceStatusColor(currentResourceDetail.status)">
            {{ currentResourceDetail.status }}
          </a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="创建时间">{{ formatDateTime(currentResourceDetail.created_at)
          }}</a-descriptions-item>
        <a-descriptions-item label="更新时间">{{ formatDateTime(currentResourceDetail.updated_at)
          }}</a-descriptions-item>
        <a-descriptions-item v-if="currentResourceDetail.deleted_at" label="删除时间">
          {{ formatDateTime(currentResourceDetail.deleted_at) }}
        </a-descriptions-item>
      </a-descriptions>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import {
  PlusOutlined,
  ReloadOutlined,
  EditOutlined,
  DeleteOutlined,
  SettingOutlined,
  PlusCircleOutlined,
  LinkOutlined,
  SwapOutlined,
} from '@ant-design/icons-vue';
import { message, Modal } from 'ant-design-vue';
import {
  getTreeList,
  getNodeDetail,
  // getTreeStatistics,
  createNode,
  updateNode,
  deleteNode,
  moveNode,
  getNodeMembers,
  addNodeMember,
  removeNodeMember,
  getNodeResources,
  bindResource,
  unbindResource,
  type TreeNode,
  type User,
  type TreeNodeStatisticsResp,
  type NodeResourceInfo,
  type GetTreeNodeListReq,
  type CreateTreeNodeReq,
  type UpdateTreeNodeReq,
  type MoveTreeNodeReq,
  type AddTreeNodeMemberReq,
  type RemoveTreeNodeMemberReq,
  type BindTreeNodeResourceReq,
  type UnbindTreeNodeResourceReq,
  type CloudProvider,
} from '#/api/core/tree_node';
import { getUserList } from '#/api/core/user';

const router = useRouter();

// 基础状态
const loading = ref(false);
const confirmLoading = ref(false);
const resourceLoading = ref(false);
const memberLoading = ref(false);
const availableResourceLoading = ref(false);
const userListLoading = ref(false);

// 搜索和树状态
const searchValue = ref('');
const expandedKeys = ref<string[]>([]);
const selectedKeys = ref<string[]>([]);

// Tab状态
const activeTabKey = ref('basicInfo');
const memberTabKey = ref('admins');

// 模态框状态
const createNodeModalVisible = ref(false);
const moveNodeModalVisible = ref(false);
const bindResourceModalVisible = ref(false);
const addMemberModalVisible = ref(false);
const resourceDetailModalVisible = ref(false);

// 数据状态
const treeData = ref<any[]>([]);
const nodeDetails = ref<Record<string, TreeNode>>({});
const treeStatistics = ref<TreeNodeStatisticsResp | null>(null);
const nodeResources = ref<NodeResourceInfo[]>([]);
const adminUsers = ref<User[]>([]);
const memberUsers = ref<User[]>([]);
const availableUsers = ref<User[]>([]);
const allUsers = ref<User[]>([]);
const availableResources = ref<any[]>([]);
const currentResourceDetail = ref<NodeResourceInfo>({} as NodeResourceInfo);

// 表单状态
const nodeFormRef = ref<any>(null);
const isEditMode = ref(false);
const currentParentId = ref<number | null>(null);

const nodeForm = reactive<CreateTreeNodeReq & { id?: number }>({
  name: '',
  parent_id: 0,
  description: '',
  is_leaf: false,
  status: 'active',
});

const moveForm = reactive<Omit<MoveTreeNodeReq, 'id'>>({
  new_parent_id: 0,
});

const bindResourceForm = reactive<{
  resource_type: CloudProvider | '';
  resource_ids: string[];
}>({
  resource_type: '',
  resource_ids: [],
});

const memberForm = reactive<AddTreeNodeMemberReq>({
  node_id: 0,
  user_id: 0,
  member_type: 'admin',
});

// 表单验证规则
const nodeFormRules = {
  name: [{ required: true, message: '请输入节点名称', trigger: 'blur' }],
};

// 父节点选项
const parentNodeOptions = ref<{ label: string; value: number }[]>([]);

// 计算属性
const selectedNode = computed((): TreeNode | null => {
  if (selectedKeys.value.length > 0 && selectedKeys.value[0]) {
    const key = selectedKeys.value[0];
    const id = parseInt(key.toString());
    return nodeDetails.value[id] || null;
  }
  return null;
});

const selectedUserInfo = computed((): User | null => {
  if (memberForm.user_id && availableUsers.value.length > 0) {
    return availableUsers.value.find(user => user.id === memberForm.user_id) || null;
  }
  return null;
});

const filteredTreeData = computed(() => {
  if (!searchValue.value) {
    return treeData.value;
  }

  const search = searchValue.value.toLowerCase();

  const filterNode = (node: any): any => {
    if (node.title.toLowerCase().includes(search)) {
      return { ...node };
    }

    if (node.children) {
      const filteredChildren = node.children
        .map((child: any) => filterNode(child))
        .filter(Boolean);

      if (filteredChildren.length > 0) {
        return {
          ...node,
          children: filteredChildren,
        };
      }
    }

    return null;
  };

  return treeData.value
    .map(node => filterNode(node))
    .filter(Boolean);
});

// 动态计算模态框标题
const getNodeModalTitle = computed(() => {
  if (isEditMode.value) return '编辑节点';
  if (currentParentId.value) return '添加子节点';
  return '创建顶级节点';
});

const getMemberModalTitle = computed(() => {
  return memberForm.member_type === 'admin' ? '添加管理员' : '添加成员';
});

// 移动节点选项（排除自身和子节点）
const moveNodeOptions = computed(() => {
  if (!selectedNode.value) return parentNodeOptions.value;

  // 排除自身和自身的子节点
  const excludeIds = [selectedNode.value.id];

  return parentNodeOptions.value.filter(option =>
    !excludeIds.includes(option.value)
  );
});

// 表格列定义
const resourceColumns = [
  { title: '资源ID', dataIndex: 'resource_id', key: 'resource_id' },
  { title: '资源名称', dataIndex: 'resource_name', key: 'resource_name' },
  { title: '资源类型', dataIndex: 'resource_type', key: 'resource_type' },
  { title: '状态', dataIndex: 'status', key: 'status' },
  {
    title: '创建时间',
    dataIndex: 'created_at',
    key: 'created_at',
    customRender: ({ text }: { text: string }) => formatDateTime(text)
  },
  { title: '操作', key: 'action', width: 120 },
];

const adminColumns = [
  { title: '用户名', dataIndex: 'username', key: 'username' },
  {
    title: '真实姓名',
    dataIndex: 'real_name',
    key: 'real_name',
    customRender: ({ text }: { text: string }) => text || '-'
  },
  {
    title: '手机号',
    dataIndex: 'mobile',
    key: 'mobile',
    customRender: ({ text }: { text: string }) => text || '-'
  },
  { title: '账号类型', dataIndex: 'account_type', key: 'account_type' },
  { title: '状态', dataIndex: 'enable', key: 'enable' },
  { title: '操作', key: 'action', width: 100 },
];

const memberColumns = [
  { title: '用户名', dataIndex: 'username', key: 'username' },
  {
    title: '真实姓名',
    dataIndex: 'real_name',
    key: 'real_name',
    customRender: ({ text }: { text: string }) => text || '-'
  },
  {
    title: '手机号',
    dataIndex: 'mobile',
    key: 'mobile',
    customRender: ({ text }: { text: string }) => text || '-'
  },
  { title: '账号类型', dataIndex: 'account_type', key: 'account_type' },
  { title: '状态', dataIndex: 'enable', key: 'enable' },
  { title: '操作', key: 'action', width: 100 },
];

const availableResourceColumns = computed(() => {
  return [
    { title: '资源ID', dataIndex: 'id', key: 'id' },
    { title: '资源名称', dataIndex: 'name', key: 'name' },
    { title: '状态', dataIndex: 'status', key: 'status' },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      customRender: ({ text }: { text: string }) => formatDateTime(text)
    },
  ];
});

// 工具函数
const formatDateTime = (dateStr: string | number) => {
  if (!dateStr) return '-';

  let date: Date;
  if (typeof dateStr === 'number') {
    // 如果是时间戳，需要转换为毫秒
    date = new Date(dateStr * 1000);
  } else {
    date = new Date(dateStr);
  }

  return date.toLocaleString('zh-CN');
};

const getResourceStatusColor = (status: string) => {
  const colorMap: Record<string, string> = {
    'STARTING': 'green',
    'STOPPING': 'red',
    'STARTED': 'orange',
    'STOPPED': 'orange',
    'ACTIVE': 'green',
    'INACTIVE': 'red',
  };
  return colorMap[status] || 'default';
};

const filterUserOption = (input: string, option: any) => {
  if (!option?.children) return false;
  const text = String(option.children);
  return text.toLowerCase().includes(input.toLowerCase());
};

// 数据加载函数
const loadAllUsers = async () => {
  try {
    userListLoading.value = true;
    // 这里需要替换为你实际的用户API调用
    const response = await getUserList({
      page: 1,
      size: 100,
      search: ''
    });
    if (response) {
      allUsers.value = response.items;
      console.log('用户列表加载成功:', allUsers.value.length, '个用户');
    } else {
      console.error('获取用户列表响应格式错误:', response);
      message.error('获取用户列表失败');
      allUsers.value = [];
    }
  } catch (error) {
    console.error('获取用户列表失败:', error);
    message.error('获取用户列表失败');
    allUsers.value = [];
  } finally {
    userListLoading.value = false;
  }
};

const loadAvailableUsers = () => {
  if (allUsers.value.length === 0) {
    availableUsers.value = [];
    return;
  }

  // 过滤掉已经是当前节点成员的用户
  const currentAdminIds = adminUsers.value.map((user: User) => user.id);
  const currentMemberIds = memberUsers.value.map((user: User) => user.id);
  const existingUserIds = [...currentAdminIds, ...currentMemberIds];

  // 过滤出未添加的用户，只显示启用的用户
  availableUsers.value = allUsers.value.filter((user: User) =>
    !existingUserIds.includes(user.id)
  );

  console.log('可用用户列表更新:', availableUsers.value.length, '个用户');
};

const loadTreeData = async () => {
  loading.value = true;
  try {
    const params: GetTreeNodeListReq = {};
    const response = await getTreeList(params);

    console.log('原始API响应:', response);

    // 检查响应数据结构
    const data = response?.data || response;
    if (!data) {
      console.error('API返回空数据:', response);
      treeData.value = [];
      return;
    }

    const items = Array.isArray(data) ? data : (data.items || []);

    // 确保 items 是数组
    if (!Array.isArray(items)) {
      console.error('API返回的数据不是数组:', items);
      treeData.value = [];
      message.error('数据格式错误：期望数组格式');
      return;
    }

    // 验证数组中的元素
    const validItems = items.filter(item => {
      if (!item || typeof item !== 'object') {
        console.warn('跳过无效的节点数据:', item);
        return false;
      }
      if (!item.id || !item.name) {
        console.warn('跳过缺少必要字段的节点:', item);
        return false;
      }
      return true;
    });

    if (validItems.length === 0) {
      console.warn('没有有效的节点数据');
      treeData.value = [];
      return;
    }

    // 处理树节点数据
    const processNode = (node: TreeNode) => {
      try {
        // 确保节点有必要的属性
        const processedNode: TreeNode = {
          id: node.id || 0,
          name: node.name || '未命名节点',
          parentId: node.parentId || 0,
          level: node.level || 0,
          description: node.description || '',
          creator_id: node.creator_id || 0,
          status: node.status || 'active',
          isLeaf: Boolean(node.isLeaf),
          createdAt: node.createdAt || '',
          updatedAt: node.updatedAt || '',
          creator_name: node.creator_name || '',
          parent_name: node.parent_name || '',
          child_count: Array.isArray(node.children) ? node.children.length : 0,
          resource_count: node.resource_count || 0,
          admins: node.admins || [],
          members: node.members || [],
          children: node.children || [],
        };

        nodeDetails.value[processedNode.id] = processedNode;

        // 递归处理子节点
        if (Array.isArray(node.children) && node.children.length > 0) {
          node.children.forEach((child: TreeNode) => {
            if (child && typeof child === 'object') {
              processNode(child);
            }
          });
        }
      } catch (error) {
        console.error('处理节点时出错:', node, error);
      }
    };

    // 处理所有有效节点
    validItems.forEach(processNode);

    // 构建树形结构
    const transformNode = (node: TreeNode): any => {
      try {
        const transformed = {
          key: String(node.id || 0),
          title: node.name || '未命名节点',
          isLeaf: Boolean(node.isLeaf),
          children: undefined as any
        };

        // 处理子节点
        if (Array.isArray(node.children) && node.children.length > 0) {
          const validChildren = node.children.filter((child: TreeNode) =>
            child && typeof child === 'object' && child.id && child.name
          );

          if (validChildren.length > 0) {
            transformed.children = validChildren.map(transformNode);
          }
        }

        return transformed;
      } catch (error) {
        console.error('转换节点时出错:', node, error);
        return {
          key: String(node.id || Math.random()),
          title: '错误节点',
          isLeaf: true
        };
      }
    };

    // 转换为树形数据
    const transformedData = validItems.map(transformNode);

    // 最终验证
    if (!Array.isArray(transformedData)) {
      console.error('转换后的数据不是数组:', transformedData);
      treeData.value = [];
      return;
    }

    treeData.value = transformedData;
    updateParentNodeOptions(validItems);

    console.log('树形数据加载成功:', treeData.value.length, '个根节点');

  } catch (error) {
    console.error('加载树形数据失败:', error);
    message.error('加载树形数据失败');
    treeData.value = [];
  } finally {
    loading.value = false;
  }
};

const loadNodeDetail = async (nodeId: number) => {
  if (!nodeId || nodeId <= 0) return null;

  try {
    // 如果已经有缓存的节点详情，直接返回
    if (nodeDetails.value[nodeId]) {
      return nodeDetails.value[nodeId];
    }

    const res = await getNodeDetail(nodeId);
    if (res) {
      nodeDetails.value[nodeId] = res;
    }
    return res;
  } catch (error) {
    console.error('获取节点详情失败:', error);
    message.error('获取节点详情失败');
    return null;
  }
};

const loadNodeResources = async (nodeId: number) => {
  if (!nodeId) return;

  resourceLoading.value = true;
  try {
    const res = await getNodeResources(nodeId);
    nodeResources.value = Array.isArray(res) ? res : (res?.items || []);
  } catch (error) {
    console.error('获取节点资源失败:', error);
    message.error('获取节点资源失败');
    nodeResources.value = [];
  } finally {
    resourceLoading.value = false;
  }
};

const loadNodeMembers = async (nodeId: number) => {
  if (!nodeId) return;

  memberLoading.value = true;
  try {
    const adminRes = await getNodeMembers(nodeId, { id: nodeId, type: 'admin' });
    const memberRes = await getNodeMembers(nodeId, { id: nodeId, type: 'member' });

    adminUsers.value = adminRes.items || [];
    memberUsers.value = memberRes.items || [];

    // 更新可用用户列表
    loadAvailableUsers();

    console.log('节点成员加载成功 - 管理员:', adminUsers.value.length, '成员:', memberUsers.value.length);
  } catch (error) {
    console.error('获取节点成员失败:', error);
    message.error('获取节点成员失败');
    adminUsers.value = [];
    memberUsers.value = [];
  } finally {
    memberLoading.value = false;
  }
};

const loadStatistics = async () => {
  try {
    // 使用假数据
    const res = {
      total_nodes: 2,
      total_resources: 1,
      total_admins: 3,
      total_members: 3,
      active_nodes: 2,
      inactive_nodes: 0,
    };
    treeStatistics.value = res;
  } catch (error) {
    console.error('获取统计数据失败:', error);
  }
};

const updateParentNodeOptions = (nodes: TreeNode[]) => {
  const collectNodes = (node: TreeNode, result: any[] = []) => {
    if (!node.isLeaf) {
      result.push({
        label: node.name,
        value: node.id,
      });
    }

    if (node.children && node.children.length > 0) {
      node.children.forEach((child: TreeNode) => collectNodes(child, result));
    }

    return result;
  };

  parentNodeOptions.value = [];
  nodes.forEach(node => {
    collectNodes(node, parentNodeOptions.value);
  });
};

// 事件处理函数
const goBack = () => {
  router.push('/tree/overview');
};

const refreshData = async () => {
  await Promise.all([
    loadTreeData(),
    loadStatistics(),
    loadAllUsers(),
  ]);

  if (selectedNode.value) {
    // 检查节点是否还存在于树中
    const nodeExists = treeData.value.some(node => {
      const findNode = (nodes: any[]): boolean => {
        for (const n of nodes) {
          if (n.key === selectedNode.value?.id.toString()) {
            return true;
          }
          if (n.children && n.children.length > 0) {
            if (findNode(n.children)) {
              return true;
            }
          }
        }
        return false;
      };
      return findNode([node]);
    });

    if (nodeExists) {
      await Promise.all([
        loadNodeDetail(selectedNode.value.id),
        loadNodeResources(selectedNode.value.id),
        loadNodeMembers(selectedNode.value.id),
      ]);
    } else {
      // 节点已被删除，清空选择
      selectedKeys.value = [];
      message.info('当前选中的节点已不存在，请重新选择节点');
    }
  }
};

const onSearchChange = () => {
  if (searchValue.value) {
    expandAll();
  }
};

const expandAll = () => {
  const keys: string[] = [];
  const traverse = (nodes: any[]) => {
    for (const node of nodes) {
      keys.push(node.key);
      if (node.children) {
        traverse(node.children);
      }
    }
  };
  traverse(treeData.value);
  expandedKeys.value = keys;
};

const collapseAll = () => {
  expandedKeys.value = [];
};

const onSelect = async (keys: string[]) => {
  if (keys.length > 0 && keys[0]) {
    const nodeId = parseInt(keys[0].toString());
    if (nodeId > 0) {
      await Promise.all([
        loadNodeDetail(nodeId),
        loadNodeResources(nodeId),
        loadNodeMembers(nodeId),
      ]);
    }
  }
};

// 节点操作
const showCreateNodeModal = () => {
  isEditMode.value = false;
  currentParentId.value = null;
  resetNodeForm();
  createNodeModalVisible.value = true;
};

const showCreateChildNodeModal = (parentNodeKey: string) => {
  isEditMode.value = false;
  const parentId = parseInt(parentNodeKey);
  currentParentId.value = parentId;
  resetNodeForm();
  nodeForm.parent_id = parentId;
  createNodeModalVisible.value = true;
};

const showEditNodeModal = async (nodeKey: string) => {
  isEditMode.value = true;
  currentParentId.value = null;

  const nodeId = parseInt(nodeKey);
  const nodeDetail = await loadNodeDetail(nodeId);

  if (nodeDetail) {
    nodeForm.id = nodeDetail.id;
    nodeForm.name = nodeDetail.name;
    nodeForm.parent_id = nodeDetail.parentId;
    nodeForm.description = nodeDetail.description || '';
    nodeForm.is_leaf = nodeDetail.isLeaf;
    nodeForm.status = nodeDetail.status;
  }

  createNodeModalVisible.value = true;
};

const showMoveNodeModal = () => {
  if (!selectedNode.value) {
    message.warning('请先选择节点');
    return;
  }

  moveForm.new_parent_id = selectedNode.value.parentId;
  moveNodeModalVisible.value = true;
};

const resetNodeForm = () => {
  nodeForm.id = undefined;
  nodeForm.name = '';
  nodeForm.parent_id = 0;
  nodeForm.description = '';
  nodeForm.is_leaf = false;
  nodeForm.status = 'active';
};

const confirmDeleteNode = (nodeKey: string) => {
  const nodeId = parseInt(nodeKey);
  const nodeDetail = nodeDetails.value[nodeId];

  if (!nodeDetail) {
    message.error('未找到节点信息');
    return;
  }

  Modal.confirm({
    title: '确认删除',
    content: `确定要删除节点 "${nodeDetail.name}" 吗？该操作无法撤销。`,
    okText: '确认',
    okType: 'danger',
    cancelText: '取消',
    async onOk() {
      try {
        await deleteNode(nodeId);
        message.success(`节点 "${nodeDetail.name}" 已删除`);
        await refreshData();
      } catch (error) {
        console.error('删除节点失败:', error);
        message.error('删除节点失败');
      }
    },
  });
};

const handleCreateOrUpdateNode = async () => {
  if (!nodeFormRef.value) return;

  try {
    await nodeFormRef.value.validate();
    confirmLoading.value = true;

    if (isEditMode.value && nodeForm.id) {
      const updateParams: UpdateTreeNodeReq = {
        id: nodeForm.id,
        name: nodeForm.name,
        parent_id: nodeForm.parent_id,
        description: nodeForm.description,
        status: nodeForm.status,
      };

      await updateNode(nodeForm.id, updateParams);
      message.success('节点更新成功！');
    } else {
      const createParams: CreateTreeNodeReq = {
        name: nodeForm.name,
        parent_id: nodeForm.parent_id,
        description: nodeForm.description,
        is_leaf: nodeForm.is_leaf,
        status: nodeForm.status,
      };

      await createNode(createParams);
      message.success('节点创建成功！');
    }

    await refreshData();
    createNodeModalVisible.value = false;
  } catch (error: any) {
    if (error?.errorFields) {
      // 表单验证失败，不需要显示错误消息
      return;
    }
    console.error('节点操作失败:', error);
    message.error('节点操作失败');
  } finally {
    confirmLoading.value = false;
  }
};

const handleMoveNode = async () => {
  if (!selectedNode.value) return;

  confirmLoading.value = true;
  try {
    const moveParams: MoveTreeNodeReq = {
      id: selectedNode.value.id,
      new_parent_id: moveForm.new_parent_id,
    };

    await moveNode(selectedNode.value.id, moveParams);
    message.success('节点移动成功');
    await refreshData();
    moveNodeModalVisible.value = false;
  } catch (error) {
    console.error('移动节点失败:', error);
    message.error('移动节点失败');
  } finally {
    confirmLoading.value = false;
  }
};

// 资源操作
const showBindResourceModal = () => {
  if (!selectedNode.value) {
    message.warning('请先选择节点');
    return;
  }

  bindResourceForm.resource_type = '';
  bindResourceForm.resource_ids = [];
  availableResources.value = [];
  bindResourceModalVisible.value = true;
};

const onResourceTypeChange = (resourceType: string) => {
  bindResourceForm.resource_ids = [];
  if (resourceType) {
    loadAvailableResources(resourceType as CloudProvider);
  } else {
    availableResources.value = [];
  }
};

// 获取可用资源
const loadAvailableResources = async (resourceType: CloudProvider) => {
  if (!resourceType) return;

  availableResourceLoading.value = true;
  try {
    // 这里需要根据不同的资源类型调用不同的API
    // 临时模拟数据
    const mockResources = [
      {
        id: 'res-001',
        name: `${resourceType}-resource-1`,
        status: 'running',
        created_at: new Date().toISOString(),
      },
      {
        id: 'res-002',
        name: `${resourceType}-resource-2`,
        status: 'stopped',
        created_at: new Date().toISOString(),
      }
    ];

    availableResources.value = mockResources;
  } catch (error) {
    console.error('获取可用资源失败:', error);
    message.error('获取可用资源失败');
    availableResources.value = [];
  } finally {
    availableResourceLoading.value = false;
  }
};

const onSelectedResourcesChange = (selectedRowKeys: string[]) => {
  bindResourceForm.resource_ids = selectedRowKeys;
};

const handleBindResource = async () => {
  if (!selectedNode.value) return;
  if (bindResourceForm.resource_ids.length === 0) {
    message.warning('请至少选择一个资源');
    return;
  }

  confirmLoading.value = true;
  try {
    const params: BindTreeNodeResourceReq = {
      node_id: selectedNode.value.id,
      resource_type: bindResourceForm.resource_type as CloudProvider,
      resource_ids: bindResourceForm.resource_ids,
    };

    await bindResource(params);
    message.success(`成功绑定 ${bindResourceForm.resource_ids.length} 个资源`);

    await loadNodeResources(selectedNode.value.id);
    bindResourceModalVisible.value = false;
  } catch (error) {
    console.error('绑定资源失败:', error);
    message.error('绑定资源失败');
  } finally {
    confirmLoading.value = false;
  }
};

const confirmUnbindResource = (resource: NodeResourceInfo) => {
  Modal.confirm({
    title: '确认解绑',
    content: `确定要解绑资源 "${resource.resource_name}" 吗？`,
    okText: '确认',
    okType: 'danger',
    cancelText: '取消',
    async onOk() {
      try {
        const params: UnbindTreeNodeResourceReq = {
          node_id: selectedNode.value!.id,
          resource_id: resource.resource_id,
          resource_type: resource.resource_type as CloudProvider,
        };

        await unbindResource(params);
        message.success(`资源 "${resource.resource_name}" 已解绑`);

        if (selectedNode.value) {
          await loadNodeResources(selectedNode.value.id);
        }
      } catch (error) {
        console.error('解绑资源失败:', error);
        message.error('解绑资源失败');
      }
    },
  });
};

const viewResourceDetail = (resource: NodeResourceInfo) => {
  currentResourceDetail.value = resource;
  resourceDetailModalVisible.value = true;
};

// 成员操作
const showAddMemberModal = (type: 'admin' | 'member') => {
  if (!selectedNode.value) {
    message.warning('请先选择节点');
    return;
  }

  memberForm.node_id = selectedNode.value.id;
  memberForm.user_id = 0;
  memberForm.member_type = type;

  // 更新可用用户列表
  loadAvailableUsers();

  addMemberModalVisible.value = true;
};

const handleAddMember = async () => {
  if (!memberForm.user_id) {
    message.warning('请选择用户');
    return;
  }

  // 检查用户是否已经是成员
  const allCurrentMembers = [...adminUsers.value, ...memberUsers.value];
  const isAlreadyMember = allCurrentMembers.some(member => member.id === memberForm.user_id);

  if (isAlreadyMember) {
    message.warning('该用户已经是当前节点的成员');
    return;
  }

  confirmLoading.value = true;
  try {
    await addNodeMember(memberForm);

    const selectedUser = availableUsers.value.find(user => user.id === memberForm.user_id);
    const userName = selectedUser ? selectedUser.username : '用户';
    const roleText = memberForm.member_type === 'admin' ? '管理员' : '成员';

    message.success(`成功添加${roleText}: ${userName}`);

    if (selectedNode.value) {
      await loadNodeMembers(selectedNode.value.id);
    }

    addMemberModalVisible.value = false;
  } catch (error) {
    console.error('添加成员失败:', error);
    message.error('添加成员失败');
  } finally {
    confirmLoading.value = false;
  }
};

const confirmRemoveMember = (record: User, type: 'admin' | 'member') => {
  if (!selectedNode.value) return;

  const roleText = type === 'admin' ? '管理员' : '成员';

  Modal.confirm({
    title: '确认移除',
    content: `确定要移除${roleText} "${record.username}" 吗？`,
    okText: '确认',
    okType: 'danger',
    cancelText: '取消',
    async onOk() {
      try {
        const params: RemoveTreeNodeMemberReq = {
          node_id: selectedNode.value!.id,
          user_id: record.id,
          member_type: type,
        };

        await removeNodeMember(params);
        message.success(`${roleText} "${record.username}" 已移除`);

        if (selectedNode.value) {
          await loadNodeMembers(selectedNode.value.id);
        }
      } catch (error) {
        console.error('移除成员失败:', error);
        message.error('移除成员失败');
      }
    },
  });
};

// 监听表单变化
watch(() => memberForm.user_id, () => {
  // 当用户选择变化时，触发计算属性更新
});

watch(searchValue, (newVal) => {
  if (newVal) {
    expandAll();
  }
});

onMounted(async () => {
  await refreshData();
});
</script>

<style scoped lang="scss">
.tree-manager-container {
  padding: 12px;
  min-height: 100vh;

  .main-content {
    margin-top: 16px;
  }

  .tree-card {
    height: calc(100vh - 130px);
    overflow: auto;

    .tree-node-title {
      display: flex;
      align-items: center;
      width: 100%;
      justify-content: space-between;

      .node-actions {
        visibility: hidden;
        display: flex;
        gap: 8px;

        .anticon {
          padding: 2px;
          border-radius: 2px;

          &:hover {
            background-color: #f0f0f0;
          }
        }
      }

      &:hover .node-actions {
        visibility: visible;
      }
    }
  }

  .detail-card {
    margin-bottom: 24px;
  }

  .resource-header,
  .member-header {
    margin-bottom: 16px;
    display: flex;
    justify-content: flex-end;
  }
}
</style>
