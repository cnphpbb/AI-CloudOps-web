<template>
  <div class="local-resource-management">
    <a-page-header
      title="本地资源管理"
      sub-title="本地服务器统一管理"
      class="page-header"
    >
      <template #extra>
        <a-space wrap>
          <a-button type="primary" @click="handleTestConnection">
            <api-outlined /> 批量测试连接
          </a-button>
          <a-button type="primary" @click="showCreateModal">
            <plus-outlined /> 添加服务器
          </a-button>
        </a-space>
      </template>
    </a-page-header>

    <a-card class="filter-card">
      <a-form layout="vertical" :model="filterForm" class="filter-form">
        <div class="filter-grid">
          <a-form-item label="连接状态" class="filter-item">
            <a-select
              v-model:value="filterForm.status"
              placeholder="选择状态"
              allow-clear
            >
              <a-select-option :value="ResourceStatus.RUNNING">运行中</a-select-option>
              <a-select-option :value="ResourceStatus.STOPPED">已停止</a-select-option>
              <a-select-option :value="ResourceStatus.STARTING">启动中</a-select-option>
              <a-select-option :value="ResourceStatus.STOPPING">停止中</a-select-option>
              <a-select-option :value="ResourceStatus.RESTARTING">重启中</a-select-option>
              <a-select-option :value="ResourceStatus.ERROR">错误</a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item label="操作" class="filter-item filter-actions">
            <a-space>
              <a-button type="primary" @click="handleSearch">
                <search-outlined /> 搜索
              </a-button>
              <a-button @click="resetFilter">
                重置
              </a-button>
            </a-space>
          </a-form-item>
        </div>
      </a-form>
    </a-card>

    <a-card class="resource-card">
      <a-table
        :columns="columns"
        :data-source="localResources"
        :loading="loading"
        :pagination="paginationConfig"
        @change="handleTableChange"
        row-key="id"
        :scroll="{ x: '1000' }"
        class="resource-table"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <a-badge
              :status="getStatusBadge(record.status)"
              :text="getStatusText(record.status)"
            />
          </template>
          <template v-if="column.key === 'os_type'">
            <a-tag :color="record.os_type === 'linux' ? 'blue' : 'green'">
              <windows-outlined v-if="record.os_type === 'windows'" />
              <desktop-outlined v-else />
              {{ record.os_type === 'linux' ? 'Linux' : 'Windows' }}
            </a-tag>
          </template>
          <template v-if="column.key === 'auth_mode'">
            <a-tag :color="record.auth_mode === AuthMode.PASSWORD ? 'orange' : 'purple'">
              {{ getAuthModeText(record.auth_mode) }}
            </a-tag>
          </template>
          <template v-if="column.key === 'tree_nodes'">
            <div v-if="record.tree_node && record.tree_node.length > 0">
              <a-tag 
                v-for="node in record.tree_node.slice(0, 2)" 
                :key="node.id" 
                color="green"
                style="margin-bottom: 4px;"
              >
                {{ node.name }}
              </a-tag>
              <a-tag v-if="record.tree_node.length > 2" color="default">
                +{{ record.tree_node.length - 2 }}
              </a-tag>
              <a-button type="link" danger size="small" @click="showUnbindModal(record)">
                管理绑定
              </a-button>
            </div>
            <span v-else class="text-gray-400">-</span>
          </template>
          <template v-if="column.key === 'tags'">
            <template v-if="record.tags && record.tags.length > 0">
              <a-tag 
                v-for="tag in record.tags.slice(0, 3)" 
                :key="tag" 
                color="blue"
                style="margin-bottom: 4px;"
              >
                {{ tag }}
              </a-tag>
              <a-tag v-if="record.tags.length > 3" color="default">
                +{{ record.tags.length - 3 }}
              </a-tag>
            </template>
            <span v-else class="text-gray-400">-</span>
          </template>
          <template v-if="column.key === 'action'">
            <a-dropdown>
              <template #overlay>
                <a-menu>
                  <a-menu-item key="detail" @click="handleViewDetail(record)">
                    <info-circle-outlined /> 详情
                  </a-menu-item>
                  <a-menu-item key="test" @click="handleTestSingleConnection(record)">
                    <api-outlined /> 测试连接
                  </a-menu-item>
                  <a-menu-item key="edit" @click="handleEdit(record)">
                    <edit-outlined /> 编辑
                  </a-menu-item>
                  <a-menu-item key="bind" @click="showBindModal(record)">
                    <deployment-unit-outlined /> 绑定服务树
                  </a-menu-item>
                  <a-menu-item key="terminal" @click="handleConnectTerminal(record)">
                    <code-outlined /> 连接终端
                  </a-menu-item>
                  <a-menu-divider />
                  <a-menu-item key="delete" @click="handleDelete(record)">
                    <delete-outlined /> 删除
                  </a-menu-item>
                </a-menu>
              </template>
              <a-button type="link">
                操作 <down-outlined />
              </a-button>
            </a-dropdown>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 创建/编辑服务器对话框 -->
    <a-modal
      v-model:open="modalVisible"
      :title="isEdit ? '编辑服务器' : '添加服务器'"
      :width="modalWidth"
      :footer="null"
      :destroy-on-close="true"
    >
      <a-form
        :model="formData"
        :rules="formRules"
        layout="vertical"
        ref="formRef"
        class="server-form"
      >
        <div class="form-grid">
          <a-form-item label="服务器名称" name="name" class="form-item">
            <a-input
              v-model:value="formData.name"
              placeholder="请输入服务器名称"
            />
          </a-form-item>
          <a-form-item label="环境" name="environment" class="form-item">
            <a-select v-model:value="formData.environment" placeholder="选择环境">
              <a-select-option value="local">本地</a-select-option>
              <a-select-option value="dev">开发</a-select-option>
              <a-select-option value="test">测试</a-select-option>
              <a-select-option value="prod">生产</a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item label="IP地址" name="ip_addr" class="form-item">
            <a-input
              v-model:value="formData.ip_addr"
              placeholder="192.168.1.100"
            />
          </a-form-item>
          <a-form-item label="SSH端口" name="port" class="form-item">
            <a-input-number
              v-model:value="formData.port"
              :min="1"
              :max="65535"
              style="width: 100%"
              placeholder="22"
            />
          </a-form-item>
          <a-form-item label="用户名" name="username" class="form-item">
            <a-input
              v-model:value="formData.username"
              placeholder="root"
            />
          </a-form-item>
          <a-form-item label="操作系统类型" name="os_type" class="form-item">
            <a-select v-model:value="formData.os_type" placeholder="选择操作系统">
              <a-select-option value="linux">
                <desktop-outlined /> Linux
              </a-select-option>
              <a-select-option value="windows">
                <windows-outlined /> Windows
              </a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item label="操作系统名称" name="os_name" class="form-item">
            <a-input
              v-model:value="formData.os_name"
              placeholder="如: CentOS 7.9"
            />
          </a-form-item>
          <a-form-item label="镜像名称" name="image_name" class="form-item">
            <a-input
              v-model:value="formData.image_name"
              placeholder="如: centos-7.9-x86_64"
            />
          </a-form-item>
        </div>

        <a-form-item label="认证方式" name="auth_mode">
          <a-radio-group v-model:value="formData.auth_mode" @change="handleAuthModeChange">
            <a-radio :value="AuthMode.PASSWORD">密码认证</a-radio>
            <a-radio :value="AuthMode.KEY">密钥认证</a-radio>
          </a-radio-group>
        </a-form-item>

        <a-form-item 
          v-if="formData.auth_mode === AuthMode.PASSWORD" 
          label="登录密码" 
          name="password"
        >
          <a-input-password
            v-model:value="formData.password"
            placeholder="请输入登录密码"
            autocomplete="new-password"
          />
        </a-form-item>

        <a-form-item 
          v-if="formData.auth_mode === AuthMode.KEY" 
          label="私钥内容" 
          name="key"
        >
          <a-textarea
            v-model:value="formData.key"
            placeholder="请粘贴SSH私钥内容"
            :rows="6"
            style="font-family: 'Courier New', monospace;"
          />
        </a-form-item>

        <a-form-item label="描述信息">
          <a-textarea
            v-model:value="formData.description"
            placeholder="服务器用途描述"
            :rows="3"
          />
        </a-form-item>

        <a-form-item label="资源标签">
          <div class="tags-input">
            <div class="current-tags">
              <a-tag
                v-for="(tag, index) in formData.tags"
                :key="index"
                closable
                @close="removeTag(index)"
                color="blue"
              >
                {{ tag }}
              </a-tag>
            </div>
            <div class="add-tag">
              <a-input
                v-model:value="newTag"
                placeholder="输入标签，按回车添加"
                style="width: 200px; margin-right: 8px;"
                @pressEnter="addTag"
              />
              <a-button type="dashed" @click="addTag">
                <plus-outlined /> 添加标签
              </a-button>
            </div>
          </div>
        </a-form-item>

        <div class="form-actions">
          <a-button @click="modalVisible = false">取消</a-button>
          <a-button 
            type="primary" 
            @click="handleSubmit" 
            :loading="submitLoading"
            style="margin-left: 8px;"
          >
            {{ isEdit ? '更新' : '添加' }}
          </a-button>
          <a-button 
            v-if="!isEdit"
            @click="handleTestAndSubmit" 
            :loading="testLoading"
            style="margin-left: 8px;"
          >
            <api-outlined /> 测试并添加
          </a-button>
        </div>
      </a-form>
    </a-modal>

    <!-- 绑定服务树节点对话框 -->
    <a-modal
      v-model:open="bindModalVisible"
      title="绑定服务树节点"
      @ok="handleBind"
      :confirm-loading="bindLoading"
      :destroy-on-close="true"
    >
      <a-form layout="vertical">
        <a-form-item label="选择要绑定的服务树节点" required>
          <a-tree-select
            v-model:value="selectedTreeNodeIds"
            style="width: 100%"
            placeholder="请选择服务树节点"
            allow-clear
            multiple
            :tree-data="treeData"
            :field-names="{ children: 'children', label: 'name', value: 'id' }"
          />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 管理绑定对话框 -->
    <a-modal
      v-model:open="unbindModalVisible"
      title="管理服务树绑定"
      @ok="handleUnbind"
      :confirm-loading="unbindLoading"
      :destroy-on-close="true"
    >
      <a-form layout="vertical">
        <a-form-item label="当前绑定的节点">
          <div v-if="currentResource?.tree_node && currentResource.tree_node.length > 0">
            <a-checkbox-group v-model:value="selectedUnbindNodeIds">
              <div v-for="node in currentResource.tree_node" :key="node.id" style="margin-bottom: 8px;">
                <a-checkbox :value="node.id">{{ node.name }}</a-checkbox>
              </div>
            </a-checkbox-group>
          </div>
          <a-empty v-else description="暂无绑定的节点" />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 服务器详情抽屉 -->
    <a-drawer
      v-model:open="detailVisible"
      title="服务器详情"
      width="600"
      :destroy-on-close="true"
      class="detail-drawer"
    >
      <a-skeleton :loading="detailLoading" active>
        <template v-if="currentDetail">
          <a-descriptions bordered :column="1">
            <a-descriptions-item label="ID">
              {{ currentDetail.id }}
            </a-descriptions-item>
            <a-descriptions-item label="名称">
              {{ currentDetail.name }}
            </a-descriptions-item>
            <a-descriptions-item label="环境">
              {{ currentDetail.environment || '-' }}
            </a-descriptions-item>
            <a-descriptions-item label="IP地址">
              {{ currentDetail.ip_addr }}
            </a-descriptions-item>
            <a-descriptions-item label="SSH端口">
              {{ currentDetail.port }}
            </a-descriptions-item>
            <a-descriptions-item label="用户名">
              {{ currentDetail.username || '-' }}
            </a-descriptions-item>
            <a-descriptions-item label="操作系统">
              <a-tag :color="currentDetail.os_type === 'linux' ? 'blue' : 'green'">
                <windows-outlined v-if="currentDetail.os_type === 'windows'" />
                <desktop-outlined v-else />
                {{ currentDetail.os_type === 'linux' ? 'Linux' : 'Windows' }}
              </a-tag>
            </a-descriptions-item>
            <a-descriptions-item label="系统名称">
              {{ currentDetail.os_name || '-' }}
            </a-descriptions-item>
            <a-descriptions-item label="镜像名称">
              {{ currentDetail.image_name || '-' }}
            </a-descriptions-item>
            <a-descriptions-item label="认证方式">
              <a-tag :color="currentDetail.auth_mode === AuthMode.PASSWORD ? 'orange' : 'purple'">
                {{ getAuthModeText(currentDetail.auth_mode) }}
              </a-tag>
            </a-descriptions-item>
            <a-descriptions-item label="连接状态">
              <a-badge
                :status="getStatusBadge(currentDetail.status)"
                :text="getStatusText(currentDetail.status)"
              />
            </a-descriptions-item>
            <a-descriptions-item label="CPU">
              {{ currentDetail.cpu || '-' }}
            </a-descriptions-item>
            <a-descriptions-item label="内存">
              {{ currentDetail.memory || '-' }}
            </a-descriptions-item>
            <a-descriptions-item label="磁盘">
              {{ currentDetail.disk || '-' }}
            </a-descriptions-item>
            <a-descriptions-item label="描述">
              {{ currentDetail.description || '-' }}
            </a-descriptions-item>
            <a-descriptions-item label="创建时间">
              {{ formatDateTime(currentDetail.created_at) }}
            </a-descriptions-item>
            <a-descriptions-item label="更新时间">
              {{ formatDateTime(currentDetail.updated_at) }}
            </a-descriptions-item>
          </a-descriptions>
  
          <a-divider orientation="left">资源标签</a-divider>
          <div class="tag-list">
            <template v-if="currentDetail.tags && currentDetail.tags.length > 0">
              <a-tag 
                v-for="(tag, index) in currentDetail.tags" 
                :key="index" 
                color="blue"
              >
                {{ tag }}
              </a-tag>
            </template>
            <a-empty v-else :image="Empty.PRESENTED_IMAGE_SIMPLE" description="暂无标签" />
          </div>

          <a-divider orientation="left">绑定的服务树节点</a-divider>
          <div class="tree-node-list">
            <template v-if="currentDetail.tree_node && currentDetail.tree_node.length > 0">
              <a-tag 
                v-for="node in currentDetail.tree_node" 
                :key="node.id" 
                color="green"
                style="margin-bottom: 8px;"
              >
                {{ node.name }}
              </a-tag>
            </template>
            <a-empty v-else :image="Empty.PRESENTED_IMAGE_SIMPLE" description="暂无绑定节点" />
          </div>
          
          <div class="drawer-actions">
            <a-button-group>
              <a-button type="primary" @click="handleTestSingleConnection(currentDetail)">
                <api-outlined /> 测试连接
              </a-button>
              <a-button @click="handleEdit(currentDetail)">
                <edit-outlined /> 编辑
              </a-button>
            </a-button-group>
            <a-button danger @click="handleDelete(currentDetail)">
              <delete-outlined /> 删除
            </a-button>
          </div>
        </template>
      </a-skeleton>
    </a-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { message, Modal, Empty } from 'ant-design-vue';
import {
  PlusOutlined,
  SearchOutlined,
  InfoCircleOutlined,
  EditOutlined,
  DeleteOutlined,
  DownOutlined,
  ApiOutlined,
  WindowsOutlined,
  DesktopOutlined,
  DeploymentUnitOutlined,
  CodeOutlined,
} from '@ant-design/icons-vue';
import { useWindowSize } from '@vueuse/core';

// 导入新的API和类型定义
import {
  getTreeLocalList,
  getTreeLocalDetail,
  createTreeLocal,
  updateTreeLocal,
  deleteTreeLocal,
  bindTreeLocal,
  unbindTreeLocal,
  connectTerminal,
  AuthMode,
  ResourceStatus,
  type TreeLocalResource,
  type GetTreeLocalResourceListReq,
  type CreateTreeLocalResourceReq,
  type UpdateTreeLocalResourceReq,
  type BindTreeLocalResourceReq,
  type UnBindTreeLocalResourceReq,
  type TreeNode,
} from '#/api/core/tree_local';
import { getTreeList } from '#/api/core/tree_node';
import { getUserList, type GetUserListReq } from '#/api/core/user';


const loading = ref(false);
const detailLoading = ref(false);
const submitLoading = ref(false);
const testLoading = ref(false);
const modalVisible = ref(false);
const detailVisible = ref(false);
const isEdit = ref(false);
const bindModalVisible = ref(false);
const bindLoading = ref(false);
const unbindModalVisible = ref(false);
const unbindLoading = ref(false);

const router = useRouter();

const formRef = ref();
const newTag = ref('');
const selectedTreeNodeIds = ref<number[]>([]);
const selectedUnbindNodeIds = ref<number[]>([]);
const currentResource = ref<TreeLocalResource | null>(null);
const localResources = ref<TreeLocalResource[]>([]);
const currentDetail = ref<TreeLocalResource | null>(null);
const treeData = ref<TreeNode[]>([]);

const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number) => `共 ${total} 条记录`,
});

const filterForm = reactive<GetTreeLocalResourceListReq>({
  page: 1,
  size: 10,
  status: undefined,
});

const createInitialFormData = (): CreateTreeLocalResourceReq & { id?: number } => ({
  name: '',
  environment: 'local',
  description: '',
  tags: [],
  ip_addr: '',
  port: 22,
  username: 'root',
  password: '',
  os_type: 'linux',
  os_name: '',
  image_name: '',
  auth_mode: AuthMode.PASSWORD,
  key: '',
});

const formData = reactive<CreateTreeLocalResourceReq & { id?: number }>(createInitialFormData());

const paginationConfig = computed(() => ({
  ...pagination,
  onChange: (page: number, pageSize: number) => handleTableChange({ current: page, pageSize }),
  onShowSizeChange: (current: number, size: number) => handleTableChange({ current, pageSize: size }),
}));

const formRules = computed(() => ({
  name: [
    { required: true, message: '请输入服务器名称', trigger: 'blur' },
    { min: 2, max: 50, message: '名称长度在2-50个字符之间', trigger: 'blur' },
  ],
  ip_addr: [
    { required: true, message: '请输入IP地址', trigger: 'blur' },
    {
      pattern: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
      message: 'IP地址格式不正确',
      trigger: 'blur',
    },
  ],
  port: [
    { required: true, message: '请输入SSH端口', trigger: 'blur' },
    { type: 'number', min: 1, max: 65535, message: '端口范围为1-65535', trigger: 'blur' },
  ],
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 1, max: 50, message: '用户名长度在1-50个字符之间', trigger: 'blur' },
  ],
  os_type: [{ required: true, message: '请选择操作系统类型', trigger: 'change' }],
  auth_mode: [{ required: true, message: '请选择认证方式', trigger: 'change' }],
  password:
    formData.auth_mode === AuthMode.PASSWORD
      ? [
          { required: true, message: '请输入登录密码', trigger: 'blur' },
          { min: 6, message: '密码长度至少6位', trigger: 'blur' },
        ]
      : [],
  key:
    formData.auth_mode === AuthMode.KEY
      ? [
          { required: true, message: '请输入SSH私钥', trigger: 'blur' },
          { validator: validatePrivateKey, trigger: 'blur' },
        ]
      : [],
}));

// 表格列定义
const { width: windowWidth } = useWindowSize();

const modalWidth = computed(() => {
  if (windowWidth.value < 576) return '90%';
  if (windowWidth.value < 768) return '85%';
  return 800;
});

const columns = [
  { title: '名称', dataIndex: 'name', key: 'name', width: 150, fixed: 'left' as const },
  { title: 'IP地址', dataIndex: 'ip_addr', key: 'ip_addr', width: 140 },
  { title: '端口', dataIndex: 'port', key: 'port', width: 80 },
  { title: '用户名', dataIndex: 'username', key: 'username', width: 100 },
  { title: '操作系统', dataIndex: 'os_type', key: 'os_type', width: 100 },
  { title: '环境', dataIndex: 'environment', key: 'environment', width: 100 },
  { title: '认证方式', dataIndex: 'auth_mode', key: 'auth_mode', width: 100 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
  { title: '服务树节点', dataIndex: 'tree_nodes', key: 'tree_nodes', width: 200 },
  { title: '标签', dataIndex: 'tags', key: 'tags', width: 200, ellipsis: true },
  { title: '操作', key: 'action', fixed: 'right' as const, width: 120 },
];

const formatDateTime = (dateTime?: string): string => {
  if (!dateTime) return '-';
  try {
    return new Date(dateTime).toLocaleString('zh-CN');
  } catch {
    return dateTime;
  }
};

const getStatusBadge = (status: ResourceStatus): string => {
  const statusMap: Record<ResourceStatus, string> = {
    [ResourceStatus.RUNNING]: 'success',
    [ResourceStatus.STOPPED]: 'error',
    [ResourceStatus.STARTING]: 'processing',
    [ResourceStatus.STOPPING]: 'warning',
    [ResourceStatus.RESTARTING]: 'processing',
    [ResourceStatus.DELETING]: 'warning',
    [ResourceStatus.ERROR]: 'error',
  };
  return statusMap[status] || 'default';
};

const getStatusText = (status: ResourceStatus): string => {
  const statusMap: Record<ResourceStatus, string> = {
    [ResourceStatus.RUNNING]: '运行中',
    [ResourceStatus.STOPPED]: '已停止',
    [ResourceStatus.STARTING]: '启动中',
    [ResourceStatus.STOPPING]: '停止中',
    [ResourceStatus.RESTARTING]: '重启中',
    [ResourceStatus.DELETING]: '删除中',
    [ResourceStatus.ERROR]: '错误',
  };
  return statusMap[status] || '未知';
};

const getAuthModeText = (authMode: AuthMode): string => {
  const authModeMap: Record<AuthMode, string> = {
    [AuthMode.PASSWORD]: '密码认证',
    [AuthMode.KEY]: '密钥认证',
  };
  return authModeMap[authMode] || '未知';
};

const simulateConnectionTest = async (_name: string): Promise<boolean> => {
  await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000));
  return Math.random() > 0.2;
};

// 表单验证函数
async function validatePrivateKey(_rule: any, value: string): Promise<void> {
  if (formData.auth_mode === AuthMode.KEY && value && !value.includes('PRIVATE KEY')) {
    throw new Error('请输入有效的SSH私钥');
  }
}

const fetchTreeData = async (): Promise<void> => {
  try {
    const response = await getTreeList();
    treeData.value = response.items || [];
  } catch (error) {
    console.error('获取服务树数据失败:', error);
    message.error('获取服务树数据失败');
  }
};

const fetchLocalResources = async (): Promise<void> => {
  loading.value = true;
  try {
    const params: GetTreeLocalResourceListReq = {
      page: pagination.current,
      size: pagination.pageSize,
    };
    
    if (filterForm.status) {
      params.status = filterForm.status;
    }

    const response = await getTreeLocalList(params);

    localResources.value = response.items || [];
    pagination.total = response.total || 0;
  } catch (error) {
    message.error('获取本地资源列表失败');
    console.error('获取本地资源列表失败:', error);
    localResources.value = [];
    pagination.total = 0;
  } finally {
    loading.value = false;
  }
};

const handleSearch = (): void => {
  pagination.current = 1;
  filterForm.page = 1;
  fetchLocalResources();
};

const resetFilter = (): void => {
  filterForm.status = undefined;
  pagination.current = 1;
  filterForm.page = 1;
  fetchLocalResources();
};

const handleTableChange = (pag: { current?: number; pageSize?: number }): void => {
  pagination.current = pag.current || pagination.current;
  pagination.pageSize = pag.pageSize || pagination.pageSize;
  filterForm.page = pagination.current;
  filterForm.size = pagination.pageSize;
  fetchLocalResources();
};

const handleConnectTerminal = async (record: TreeLocalResource) => {
  try {
    // 获取token并连接终端
    const token = localStorage.getItem('token') || '';
    await connectTerminal(record.id, token);
    // 这里可以跳转到终端页面或打开新窗口
    router.push({ name: 'WebTerminal', params: { id: record.id } });
  } catch (error) {
    message.error('连接终端失败');
    console.error('连接终端失败:', error);
  }
};

const resetFormData = (): void => {
  Object.assign(formData, createInitialFormData());
  newTag.value = '';
  if (formRef.value) {
    formRef.value.resetFields();
  }
};

const showCreateModal = (): void => {
  isEdit.value = false;
  resetFormData();
  modalVisible.value = true;
};

const handleEdit = (record: TreeLocalResource): void => {
  isEdit.value = true;
  Object.assign(formData, {
    id: record.id,
    name: record.name,
    environment: record.environment,
    description: record.description,
    tags: record.tags || [],
    ip_addr: record.ip_addr,
    port: record.port,
    username: record.username,
    password: '', // 密码不回显
    os_type: record.os_type,
    os_name: record.os_name,
    image_name: record.image_name,
    auth_mode: record.auth_mode,
    key: '', // 私钥不回显
  });
  modalVisible.value = true;
  if (detailVisible.value) {
    detailVisible.value = false;
  }
};

const handleViewDetail = async (record: TreeLocalResource): Promise<void> => {
  detailVisible.value = true;
  detailLoading.value = true;
  currentDetail.value = record;

  try {
    const response = await getTreeLocalDetail(record.id);
    currentDetail.value = response;
  } catch (error) {
    console.error('获取资源详情失败:', error);
    message.error('获取资源详情失败');
  } finally {
    detailLoading.value = false;
  }
};

const handleAuthModeChange = (): void => {
  formData.password = '';
  formData.key = '';
  if (formRef.value) {
    formRef.value.clearValidate(['password', 'key']);
  }
};

const addTag = (): void => {
  const tagValue = newTag.value.trim();
  if (!tagValue) {
    message.warning('请输入标签内容');
    return;
  }
  
  if (!formData.tags) {
    formData.tags = [];
  }

  if (formData.tags.includes(tagValue)) {
    message.warning('标签已存在');
    return;
  }
  
  if (formData.tags.length >= 10) {
    message.warning('最多只能添加10个标签');
    return;
  }
  
  formData.tags.push(tagValue);
  newTag.value = '';
};

const removeTag = (index: number): void => {
  if (formData.tags) {
    formData.tags.splice(index, 1);
  }
};

const updateResourceStatus = (resourceId: number, status: ResourceStatus): void => {
  const resource = localResources.value.find((item: TreeLocalResource) => item.id === resourceId);
  if (resource) {
    resource.status = status;
  }
  if (currentDetail.value && currentDetail.value.id === resourceId) {
    currentDetail.value.status = status;
  }
};

const handleTestSingleConnection = async (record: TreeLocalResource): Promise<void> => {
  const hide = message.loading(`正在测试 ${record.name} 的连接...`, 0);
  
  try {
    const success = await simulateConnectionTest(record.name);
    
    if (success) {
      message.success(`${record.name} 连接测试成功`);
      updateResourceStatus(record.id, ResourceStatus.RUNNING);
    } else {
      message.error(`${record.name} 连接测试失败`);
      updateResourceStatus(record.id, ResourceStatus.STOPPED);
    }
  } catch (error) {
    message.error(`${record.name} 连接测试异常`);
    console.error('连接测试失败:', error);
  } finally {
    hide();
  }
};

const handleTestConnection = async (): Promise<void> => {
  if (localResources.value.length === 0) {
    message.warning('没有可测试的服务器');
    return;
  }
  
  const hide = message.loading('正在批量测试连接，请稍候...', 0);
  
  try {
    const testPromises = localResources.value.map(async (resource: TreeLocalResource) => {
      const success = await simulateConnectionTest(resource.name);
      updateResourceStatus(resource.id, success ? ResourceStatus.RUNNING : ResourceStatus.STOPPED);
      return success;
    });
    
    const results = await Promise.all(testPromises);
    const onlineCount = results.filter(Boolean).length;
    const totalCount = localResources.value.length;
    
    message.success(`批量测试完成，${onlineCount}/${totalCount} 台服务器在线`);
  } catch (error) {
    message.error('批量测试连接失败');
    console.error('批量测试失败:', error);
  } finally {
    hide();
  }
};

const handleTestAndSubmit = async (): Promise<void> => {
  try {
    await formRef.value?.validate();
    
    testLoading.value = true;
    
    const testHide = message.loading(`正在测试 ${formData.name!} 的连接...`, 0);
    
    try {
      const testSuccess = await simulateConnectionTest(formData.name!);
      testHide();
      
      if (!testSuccess) {
        message.error('连接测试失败，请检查服务器配置');
        return;
      }
      
      message.success('连接测试成功，正在添加服务器...');
      await handleSubmit();
      
    } catch (error) {
      testHide();
      message.error('连接测试失败');
    }
  } catch (error) {
    message.error('表单验证失败');
  } finally {
    testLoading.value = false;
  }
};

const showUnbindModal = (record: TreeLocalResource): void => {
  currentResource.value = record;
  selectedUnbindNodeIds.value = [];
  unbindModalVisible.value = true;
};

const showBindModal = (record: TreeLocalResource): void => {
  currentResource.value = record;
  selectedTreeNodeIds.value = [];
  bindModalVisible.value = true;
};

const handleBind = async (): Promise<void> => {
  if (!currentResource.value || selectedTreeNodeIds.value.length === 0) {
    message.warning('请选择要绑定的服务树节点');
    return;
  }

  bindLoading.value = true;
  try {
    const params: BindTreeLocalResourceReq = {
      id: currentResource.value.id,
      tree_node_ids: selectedTreeNodeIds.value,
    };
    await bindTreeLocal(currentResource.value.id, params);
    message.success('绑定成功');
    bindModalVisible.value = false;
    await fetchLocalResources();
  } catch (error) {
    message.error('绑定失败');
    console.error('绑定失败:', error);
  } finally {
    bindLoading.value = false;
  }
};

const handleUnbind = async (): Promise<void> => {
  if (!currentResource.value || selectedUnbindNodeIds.value.length === 0) {
    message.warning('请选择要解绑的节点');
    return;
  }

  unbindLoading.value = true;
  try {
    const params: UnBindTreeLocalResourceReq = {
      id: currentResource.value.id,
      tree_node_ids: selectedUnbindNodeIds.value,
    };
    await unbindTreeLocal(currentResource.value.id, params);
    message.success('解绑成功');
    unbindModalVisible.value = false;
    await fetchLocalResources();
  } catch (error) {
    message.error('解绑失败');
    console.error('解绑失败:', error);
  } finally {
    unbindLoading.value = false;
  }
};

const handleSubmit = async (): Promise<void> => {
  try {
    await formRef.value?.validate();

    submitLoading.value = true;

    // 从 formData 中提取有效字段
    const { id, ...rest } = formData;

    if (isEdit.value) {
      if (!id) {
        throw new Error('缺少资源ID');
      }
      await updateTreeLocal(id, rest as UpdateTreeLocalResourceReq);
      message.success('服务器信息更新成功');
    } else {
      await createTreeLocal(rest as CreateTreeLocalResourceReq);
      message.success('服务器添加成功');
    }

    modalVisible.value = false;
    await fetchLocalResources();
  } catch (error) {
    message.error(isEdit.value ? '更新服务器失败' : '添加服务器失败');
    console.error('提交表单失败:', error);
  } finally {
    submitLoading.value = false;
  }
};

const handleDelete = (record: TreeLocalResource): void => {
  Modal.confirm({
    title: '确定要删除此服务器吗？',
    content: `您正在删除服务器: ${record.name} (${record.ip_addr})，该操作不可恢复。`,
    okText: '确认删除',
    okType: 'danger',
    cancelText: '取消',
    async onOk() {
      try {
        await deleteTreeLocal(record.id);
        message.success('服务器删除成功');
        
        if (detailVisible.value && currentDetail.value?.id === record.id) {
          detailVisible.value = false;
        }
        
        await fetchLocalResources();
      } catch (error) {
        message.error('删除服务器失败');
        console.error('删除服务器失败:', error);
      }
    }
  });
};

onMounted(async () => {
  try {
    await Promise.all([
      fetchTreeData(),
      fetchLocalResources()
    ]);
  } catch (error) {
    console.error('初始化数据加载失败:', error);
    message.error('页面数据加载失败，请刷新页面重试');
  }
});
</script>

<style scoped lang="scss">
.local-resource-management {
  padding: 0 16px;
  
  .page-header {
    margin-bottom: 16px;
    padding: 16px 0;
  }
  
  .filter-card {
    margin-bottom: 16px;
  }
  
  .resource-card {
    :deep(.ant-card-body) {
      padding: 0;
    }
  }
  
  :deep(.ant-table-pagination.ant-pagination) {
    margin: 16px;
  }

  // 响应式布局 - 筛选区域
  .filter-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
    align-items: end;
    
    @media (max-width: 575px) {
      grid-template-columns: 1fr;
      gap: 12px;
    }
    
    @media (min-width: 576px) and (max-width: 767px) {
      grid-template-columns: repeat(2, 1fr);
    }
    
    @media (min-width: 768px) and (max-width: 991px) {
      grid-template-columns: repeat(3, 1fr);
    }
    
    @media (min-width: 992px) {
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    }
  }
  
  .filter-item {
    margin-bottom: 0;
  }
  
  .filter-actions {
    display: flex;
    align-items: flex-end;
    
    @media (max-width: 575px) {
      margin-top: 8px;
    }
  }

  // 响应式布局 - 表单区域
  .form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 16px;
    
    @media (max-width: 575px) {
      grid-template-columns: 1fr;
      gap: 12px;
    }
    
    @media (min-width: 576px) and (max-width: 767px) {
      grid-template-columns: repeat(2, 1fr);
    }
    
    @media (min-width: 768px) and (max-width: 991px) {
      grid-template-columns: repeat(2, 1fr);
    }
  }
  
  .form-item {
    margin-bottom: 0;
  }

  .server-form {
    .tags-input {
      .current-tags {
        margin-bottom: 12px;
        
        .ant-tag {
          margin-bottom: 8px;
        }
      }
      
      .add-tag {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 8px;
        
        @media (max-width: 575px) {
          flex-direction: column;
          align-items: stretch;
        }
      }
    }
    
    .form-actions {
      display: flex;
      justify-content: flex-end;
      margin-top: 24px;
      padding-top: 16px;
      border-top: 1px solid #f0f0f0;
      
      @media (max-width: 575px) {
        flex-direction: column;
        gap: 8px;
        
        .ant-btn {
          margin-left: 0 !important;
          width: 100%;
        }
      }
    }
  }

  .detail-drawer {
    .tag-list, .tree-node-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 16px;
    }
    
    .drawer-actions {
      display: flex;
      justify-content: space-between;
      margin-top: 24px;
      padding-top: 16px;
      border-top: 1px solid #f0f0f0;
      
      @media (max-width: 575px) {
        flex-direction: column;
        gap: 8px;
        
        .ant-btn-group {
          display: flex;
          flex-direction: column;
          width: 100%;
          
          .ant-btn {
            border-radius: 6px;
            margin-bottom: 8px;
          }
        }
        
        .ant-btn {
          width: 100%;
        }
      }
    }
  }

  .text-gray-400 {
    color: #9ca3af;
  }

  :deep(.ant-form-item) {
    margin-bottom: 20px;
  }

  :deep(.ant-descriptions-item-label) {
    width: 120px;
  }

  // 表格响应式处理
  .resource-table {
    :deep(.ant-table-content) {
      overflow-x: auto;
    }
    
    @media (max-width: 575px) {
      :deep(.ant-table-thead) {
        font-size: 12px;
      }
      
      :deep(.ant-table-tbody) {
        font-size: 12px;
      }
    }
  }

  // 容器响应式处理
  @media (max-width: 575px) {
    padding: 0 8px;
    
    .page-header {
      margin-bottom: 12px;
      padding: 12px 0;
    }
    
    .filter-card,
    .resource-card {
      margin-bottom: 12px;
    }
  }
}
</style>
