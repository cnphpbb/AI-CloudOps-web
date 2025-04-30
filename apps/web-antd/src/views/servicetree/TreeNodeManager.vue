<template>
  <div class="service-tree-container">
    <a-page-header title="服务树节点管理" subtitle="管理您的服务节点和资源关系" class="page-header">
      <template #extra>
        <a-button type="primary" @click="handleCreateNode">
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
      </template>
    </a-page-header>

    <div class="content-layout">
      <a-row :gutter="16">
        <a-col :span="6">
          <a-card title="服务树结构" class="tree-card">
            <template #extra>
              <a-input-search v-model:value="searchValue" placeholder="搜索节点" style="width: 150px" @search="onSearch" />
            </template>
            <a-directory-tree v-model:selectedKeys="selectedKeys" :tree-data="treeData" :expandedKeys="expandedKeysRef"
              @select="onSelect" @expand="onExpand" />
          </a-card>
        </a-col>
        <a-col :span="18">
          <a-card v-if="selectedNode" class="node-detail-card">
            <template #title>
              <div class="node-title">
                <span>{{ selectedNode.title }} 节点详情</span>
                <a-tag v-if="selectedNode.nodeType" color="blue">{{ selectedNode.nodeType }}</a-tag>
              </div>
            </template>
            <template #extra>
              <a-space>
                <a-button type="primary" @click="handleUpdateNode" size="small">
                  <template #icon>
                    <EditOutlined />
                  </template>
                  编辑
                </a-button>
                <a-button danger @click="handleDeleteNode" size="small">
                  <template #icon>
                    <DeleteOutlined />
                  </template>
                  删除
                </a-button>
              </a-space>
            </template>

            <a-tabs default-active-key="1">
              <a-tab-pane key="1" tab="基本信息">
                <a-descriptions bordered :column="2">
                  <a-descriptions-item label="节点ID">{{ selectedNode.key }}</a-descriptions-item>
                  <a-descriptions-item label="节点名称">{{ selectedNode.title }}</a-descriptions-item>
                  <a-descriptions-item label="节点路径">{{ nodePath }}</a-descriptions-item>
                  <a-descriptions-item label="创建时间">{{ selectedNode.createdAt }}</a-descriptions-item>
                  <a-descriptions-item label="更新时间">{{ selectedNode.updatedAt }}</a-descriptions-item>
                  <a-descriptions-item label="描述" :span="2">{{ selectedNode.description || '暂无描述'
                    }}</a-descriptions-item>
                </a-descriptions>
              </a-tab-pane>

              <a-tab-pane key="2" tab="关联资源">
                <div class="resource-header">
                  <a-radio-group v-model:value="resourceType" button-style="solid">
                    <a-radio-button value="ecs">ECS</a-radio-button>
                    <a-radio-button value="rds">RDS</a-radio-button>
                    <a-radio-button value="elb">ELB</a-radio-button>
                  </a-radio-group>
                  <a-button type="primary" @click="handleBindResource">
                    <template #icon>
                      <LinkOutlined />
                    </template>
                    绑定资源
                  </a-button>
                </div>

                <a-table :columns="resourceColumns" :data-source="resourceList" :pagination="{ pageSize: 5 }"
                  :loading="loading" row-key="id" size="middle">
                  <template #bodyCell="{ column, record }">
                    <template v-if="column.key === 'status'">
                      <a-tag :color="getStatusColor(record.status)">
                        {{ record.status }}
                      </a-tag>
                    </template>
                    <template v-if="column.key === 'action'">
                      <a-space>
                        <a @click="() => handleViewResource(record)">查看</a>
                        <a-divider type="vertical" />
                        <a-popconfirm title="确定解绑该资源?" @confirm="() => handleUnbindResource(record)">
                          <a class="danger-action">解绑</a>
                        </a-popconfirm>
                      </a-space>
                    </template>
                  </template>
                </a-table>
              </a-tab-pane>

              <a-tab-pane key="3" tab="成员管理">
                <a-row :gutter="16">
                  <a-col :span="12">
                    <a-card title="管理员" class="member-card">
                      <template #extra>
                        <a-button type="link" @click="handleAddAdmin">
                          <PlusOutlined /> 添加
                        </a-button>
                      </template>
                      <a-list :data-source="adminList" :pagination="{ pageSize: 5 }">
                        <template #renderItem="{ item }">
                          <a-list-item>
                            <a-list-item-meta :title="item.name">
                              <template #avatar>
                                <a-avatar>{{ item.name.charAt(0) }}</a-avatar>
                              </template>
                              <template #description>{{ item.email }}</template>
                            </a-list-item-meta>
                            <a-popconfirm title="确定移除该管理员?" @confirm="() => handleRemoveAdmin(item)">
                              <a-button type="text" danger>
                                <DeleteOutlined />
                              </a-button>
                            </a-popconfirm>
                          </a-list-item>
                        </template>
                      </a-list>
                    </a-card>
                  </a-col>
                  <a-col :span="12">
                    <a-card title="普通成员" class="member-card">
                      <template #extra>
                        <a-button type="link" @click="handleAddMember">
                          <PlusOutlined /> 添加
                        </a-button>
                      </template>
                      <a-list :data-source="memberList" :pagination="{ pageSize: 5 }">
                        <template #renderItem="{ item }">
                          <a-list-item>
                            <a-list-item-meta :title="item.name">
                              <template #avatar>
                                <a-avatar>{{ item.name.charAt(0) }}</a-avatar>
                              </template>
                              <template #description>{{ item.email }}</template>
                            </a-list-item-meta>
                            <a-popconfirm title="确定移除该成员?" @confirm="() => handleRemoveMember(item)">
                              <a-button type="text" danger>
                                <DeleteOutlined />
                              </a-button>
                            </a-popconfirm>
                          </a-list-item>
                        </template>
                      </a-list>
                    </a-card>
                  </a-col>
                </a-row>
              </a-tab-pane>
            </a-tabs>
          </a-card>

          <a-empty v-else description="请选择服务树节点查看详情" />
        </a-col>
      </a-row>
    </div>

    <!-- 创建节点对话框 -->
    <a-modal v-model:visible="createModalVisible" title="创建服务树节点" @ok="confirmCreateNode" @cancel="cancelCreateNode"
      :confirm-loading="confirmLoading">
      <a-form :model="nodeForm" :rules="nodeRules" ref="nodeFormRef" layout="vertical">
        <a-form-item name="title" label="节点名称">
          <a-input v-model:value="nodeForm.title" placeholder="请输入节点名称" />
        </a-form-item>
        <a-form-item name="parentId" label="父节点">
          <a-tree-select v-model:value="nodeForm.parentId" :tree-data="treeData" placeholder="请选择父节点"
            tree-default-expand-all :field-names="{ children: 'children', label: 'title', value: 'key' }"
            style="width: 100%" />
        </a-form-item>
        <a-form-item name="nodeType" label="节点类型">
          <a-select v-model:value="nodeForm.nodeType" placeholder="请选择节点类型">
            <a-select-option value="department">部门</a-select-option>
            <a-select-option value="product">产品</a-select-option>
            <a-select-option value="service">服务</a-select-option>
            <a-select-option value="application">应用</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item name="description" label="描述">
          <a-textarea v-model:value="nodeForm.description" placeholder="请输入节点描述" :rows="4" />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 绑定资源对话框 -->
    <a-modal v-model:visible="bindResourceModalVisible" title="绑定资源" @ok="confirmBindResource"
      @cancel="cancelBindResource" :confirm-loading="confirmLoading" width="700px">
      <a-form layout="vertical">
        <a-form-item label="资源类型">
          <a-radio-group v-model:value="bindResourceForm.resourceType" button-style="solid">
            <a-radio-button value="ecs">ECS</a-radio-button>
            <a-radio-button value="rds">RDS</a-radio-button>
            <a-radio-button value="elb">ELB</a-radio-button>
          </a-radio-group>
        </a-form-item>
      </a-form>
      <a-table :columns="resourceColumns.filter(col => col.key !== 'action')" :data-source="availableResources"
        :pagination="{ pageSize: 5 }" :loading="loading" row-key="id" size="middle" :row-selection="{
          selectedRowKeys: bindResourceForm.resourceIds,
          onChange: onResourceSelectionChange
        }">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <a-tag :color="getStatusColor(record.status)">
              {{ record.status }}
            </a-tag>
          </template>
        </template>
      </a-table>
    </a-modal>

    <!-- 添加成员对话框 -->
    <a-modal v-model:visible="memberModalVisible" :title="memberModalType === 'admin' ? '添加管理员' : '添加成员'"
      @ok="confirmAddMember" @cancel="cancelAddMember" :confirm-loading="confirmLoading">
      <a-form layout="vertical">
        <a-form-item label="用户搜索">
          <a-select v-model:value="selectedUsers" mode="multiple" placeholder="请搜索并选择用户" :options="userOptions"
            :filter-option="filterUserOption" style="width: 100%" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import {
  PlusOutlined,
  ReloadOutlined,
  EditOutlined,
  DeleteOutlined,
  LinkOutlined
} from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';

// 树数据
const treeData = ref([
  {
    title: '基础设施部',
    key: '1',
    nodeType: 'department',
    createdAt: '2025-01-10 10:00:00',
    updatedAt: '2025-04-15 15:30:00',
    description: '负责公司基础设施维护和管理',
    children: [
      {
        title: '网络基础设施',
        key: '1-1',
        nodeType: 'product',
        createdAt: '2025-01-15 11:20:00',
        updatedAt: '2025-04-20 09:45:00',
        description: '负责公司网络基础设施的规划和维护',
        children: [
          {
            title: 'DNS服务',
            key: '1-1-1',
            nodeType: 'service',
            createdAt: '2025-01-20 14:30:00',
            updatedAt: '2025-04-22 11:10:00',
            description: '域名解析服务'
          },
          {
            title: '负载均衡',
            key: '1-1-2',
            nodeType: 'service',
            createdAt: '2025-01-25 09:15:00',
            updatedAt: '2025-04-23 16:40:00',
            description: '负责流量负载均衡'
          }
        ]
      }
    ]
  },
  {
    title: '研发部',
    key: '2',
    nodeType: 'department',
    createdAt: '2025-02-01 08:30:00',
    updatedAt: '2025-04-10 17:20:00',
    description: '负责公司产品研发',
    children: [
      {
        title: '电商平台',
        key: '2-1',
        nodeType: 'product',
        createdAt: '2025-02-05 10:45:00',
        updatedAt: '2025-04-12 14:15:00',
        description: '公司主要电商产品平台'
      },
      {
        title: '数据分析平台',
        key: '2-2',
        nodeType: 'product',
        createdAt: '2025-02-10 13:50:00',
        updatedAt: '2025-04-18 11:30:00',
        description: '数据分析和可视化平台',
        children: [
          {
            title: '日志分析服务',
            key: '2-2-1',
            nodeType: 'service',
            createdAt: '2025-02-15 09:20:00',
            updatedAt: '2025-04-25 10:05:00',
            description: '处理和分析系统日志'
          }
        ]
      }
    ]
  }
]);

// 状态变量
const searchValue = ref('');
const selectedKeys = ref<string[]>([]);
const expandedKeysRef = ref<string[]>(['1', '2', '1-1', '2-2']);
const nodePath = ref('');
const selectedNode = ref<any>(null);
const loading = ref(false);
const resourceType = ref('ecs');
const createModalVisible = ref(false);
const bindResourceModalVisible = ref(false);
const memberModalVisible = ref(false);
const memberModalType = ref('');
const confirmLoading = ref(false);

// 表单数据
const nodeForm = reactive({
  title: '',
  parentId: '',
  nodeType: '',
  description: ''
});

const nodeFormRef = ref();

const nodeRules = {
  title: [{ required: true, message: '请输入节点名称', trigger: 'blur' }],
  nodeType: [{ required: true, message: '请选择节点类型', trigger: 'change' }]
};

const bindResourceForm = reactive({
  resourceType: 'ecs',
  resourceIds: [] as string[]
});

const selectedUsers = ref<string[]>([]);

// 资源相关数据
const resourceColumns = [
  {
    title: 'ID',
    dataIndex: 'id',
    key: 'id',
    width: '80px'
  },
  {
    title: '名称',
    dataIndex: 'instanceName',
    key: 'instanceName'
  },
  {
    title: '实例ID',
    dataIndex: 'instanceId',
    key: 'instanceId'
  },
  {
    title: '区域',
    dataIndex: 'regionId',
    key: 'regionId',
    width: '120px'
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: '100px'
  },
  {
    title: '云厂商',
    dataIndex: 'provider',
    key: 'provider',
    width: '100px'
  },
  {
    title: '操作',
    key: 'action',
    width: '120px'
  }
];

// 模拟资源数据
const resourceList = ref([
  {
    id: '1',
    instanceName: 'web-server-01',
    instanceId: 'i-bp67acfmxazb4ph****',
    regionId: 'cn-hangzhou',
    zoneId: 'cn-hangzhou-h',
    provider: 'aliyun',
    status: 'Running',
    privateIpAddress: ['192.168.1.100'],
    publicIpAddress: ['47.98.123.456'],
    cpu: 2,
    memory: 4,
    instanceType: 'ecs.g6.large'
  },
  {
    id: '2',
    instanceName: 'web-server-02',
    instanceId: 'i-bp67acfmxazb4ph****',
    regionId: 'cn-hangzhou',
    zoneId: 'cn-hangzhou-h',
    provider: 'aliyun',
    status: 'Stopped',
    privateIpAddress: ['192.168.1.101'],
    publicIpAddress: ['47.98.123.457'],
    cpu: 4,
    memory: 8,
    instanceType: 'ecs.g6.xlarge'
  }
]);

// 可选资源列表（模拟数据）
const availableResources = ref([
  {
    id: '3',
    instanceName: 'app-server-01',
    instanceId: 'i-bp67acfmxazb4ph****',
    regionId: 'cn-beijing',
    zoneId: 'cn-beijing-h',
    provider: 'aliyun',
    status: 'Running',
    privateIpAddress: ['192.168.2.100'],
    publicIpAddress: ['47.95.123.456'],
    cpu: 2,
    memory: 4,
    instanceType: 'ecs.g6.large'
  },
  {
    id: '4',
    instanceName: 'db-server-01',
    instanceId: 'i-bp67acfmxazb4ph****',
    regionId: 'cn-shanghai',
    zoneId: 'cn-shanghai-h',
    provider: 'tencent',
    status: 'Running',
    privateIpAddress: ['192.168.3.100'],
    publicIpAddress: ['47.96.123.456'],
    cpu: 4,
    memory: 16,
    instanceType: 'ecs.g6.2xlarge'
  },
  {
    id: '5',
    instanceName: 'cache-server-01',
    instanceId: 'i-bp67acfmxazb4ph****',
    regionId: 'cn-hangzhou',
    zoneId: 'cn-hangzhou-i',
    provider: 'aws',
    status: 'Stopped',
    privateIpAddress: ['192.168.4.100'],
    publicIpAddress: [],
    cpu: 2,
    memory: 8,
    instanceType: 'ecs.g6.large'
  }
]);

// 成员数据
const adminList = ref<{ id: string; name: string; email: string }[]>([
  { id: '1', name: '张三', email: 'zhangsan@example.com' },
  { id: '2', name: '李四', email: 'lisi@example.com' }
]);

const memberList = ref<{ id: string; name: string; email: string }[]>([
  { id: '3', name: '王五', email: 'wangwu@example.com' },
  { id: '4', name: '赵六', email: 'zhaoliu@example.com' },
  { id: '5', name: '钱七', email: 'qianqi@example.com' }
]);

// 用户选项列表（模拟数据）
const userOptions = ref([
  { value: '1', label: '张三 (zhangsan@example.com)' },
  { value: '2', label: '李四 (lisi@example.com)' },
  { value: '3', label: '王五 (wangwu@example.com)' },
  { value: '4', label: '赵六 (zhaoliu@example.com)' },
  { value: '5', label: '钱七 (qianqi@example.com)' },
  { value: '6', label: '孙八 (sunba@example.com)' },
  { value: '7', label: '周九 (zhoujiu@example.com)' },
  { value: '8', label: '吴十 (wushi@example.com)' }
]);

// 方法
const onSearch = (value: string) => {
  // 实现搜索逻辑
  console.log('搜索:', value);
};

const onSelect = (selectedKeys: string[], info: any) => {
  if (selectedKeys.length > 0) {
    // 查找选中的节点数据
    const findNode = (data: any[], key: string): any => {
      for (const node of data) {
        if (node.key === key) {
          return node;
        }
        if (node.children) {
          const found = findNode(node.children, key);
          if (found) {
            return found;
          }
        }
      }
      return null;
    };

    const key = selectedKeys[0];
    if (key) {
      selectedNode.value = findNode(treeData.value, key);

      // 获取节点路径
      loadNodePath(key);
    }
  } else {
    selectedNode.value = null;
    nodePath.value = '';
  }
};

const onExpand = (expandedKeys: string[]) => {
  // 保存展开的节点keys
  expandedKeysRef.value = expandedKeys;
};

const loadNodePath = (nodeId: string) => {
  // 模拟加载节点路径
  loading.value = true;
  setTimeout(() => {
    // 这里应该是从API获取路径，这里模拟数据
    const pathMap: Record<string, string> = {
      '1': '基础设施部',
      '1-1': '基础设施部 / 网络基础设施',
      '1-1-1': '基础设施部 / 网络基础设施 / DNS服务',
      '1-1-2': '基础设施部 / 网络基础设施 / 负载均衡',
      '2': '研发部',
      '2-1': '研发部 / 电商平台',
      '2-2': '研发部 / 数据分析平台',
      '2-2-1': '研发部 / 数据分析平台 / 日志分析服务'
    };

    nodePath.value = pathMap[nodeId] || '';
    loading.value = false;
  }, 300);
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Running':
      return 'green';
    case 'Stopped':
      return 'red';
    case 'Starting':
      return 'blue';
    case 'Stopping':
      return 'orange';
    default:
      return 'default';
  }
};

const refreshData = () => {
  loading.value = true;
  setTimeout(() => {
    message.success('数据刷新成功');
    loading.value = false;
  }, 800);
};

// 创建节点相关方法
const handleCreateNode = () => {
  nodeForm.title = '';
  nodeForm.parentId = '';
  nodeForm.nodeType = '';
  nodeForm.description = '';
  createModalVisible.value = true;
};

const confirmCreateNode = () => {
  nodeFormRef.value.validate().then(() => {
    confirmLoading.value = true;

    // 模拟API调用
    setTimeout(() => {
      message.success('节点创建成功');
      createModalVisible.value = false;
      confirmLoading.value = false;

      // 这里应该重新加载树数据
      // 但现在使用的是假数据，所以这里简单模拟添加
      if (nodeForm.parentId) {
        const addChildToNode = (nodes: any[], parentKey: string, newNode: any) => {
          for (const node of nodes) {
            if (node.key === parentKey) {
              if (!node.children) {
                node.children = [];
              }
              node.children.push(newNode);
              return true;
            }
            if (node.children) {
              if (addChildToNode(node.children, parentKey, newNode)) {
                return true;
              }
            }
          }
          return false;
        };

        const newKey = `${nodeForm.parentId}-${Date.now()}`;
        const newNode = {
          title: nodeForm.title,
          key: newKey,
          nodeType: nodeForm.nodeType,
          createdAt: new Date().toLocaleString(),
          updatedAt: new Date().toLocaleString(),
          description: nodeForm.description
        };

        addChildToNode(treeData.value, nodeForm.parentId, newNode);
      } else {
        // 添加根节点
        const newKey = Date.now().toString();
        treeData.value.push({
          title: nodeForm.title,
          key: newKey,
          nodeType: nodeForm.nodeType,
          createdAt: new Date().toLocaleString(),
          updatedAt: new Date().toLocaleString(),
          description: nodeForm.description,
          children: []
        });
      }
    }, 1000);
  }).catch((error: any) => {
    console.log('表单验证失败:', error);
  });
};

const cancelCreateNode = () => {
  createModalVisible.value = false;
};

// 更新节点
const handleUpdateNode = () => {
  if (!selectedNode.value) {
    message.warning('请先选择一个节点');
    return;
  }

  nodeForm.title = selectedNode.value.title;
  nodeForm.nodeType = selectedNode.value.nodeType;
  nodeForm.description = selectedNode.value.description || '';
  createModalVisible.value = true;
};

// 删除节点
const handleDeleteNode = () => {
  if (!selectedNode.value) {
    message.warning('请先选择一个节点');
    return;
  }

  const key = selectedNode.value.key;

  // 确认删除
  const removeNodeFromTree = (nodes: any[], key: string): boolean => {
    for (let i = 0; i < nodes.length; i++) {
      if (nodes[i].key === key) {
        nodes.splice(i, 1);
        return true;
      }
      if (nodes[i].children) {
        if (removeNodeFromTree(nodes[i].children, key)) {
          return true;
        }
      }
    }
    return false;
  };

  loading.value = true;
  // 模拟API调用
  setTimeout(() => {
    removeNodeFromTree(treeData.value, key);
    selectedNode.value = null;
    selectedKeys.value = [];
    message.success('节点删除成功');
    loading.value = false;
  }, 800);
};

// 绑定资源相关方法
const handleBindResource = () => {
  if (!selectedNode.value) {
    message.warning('请先选择一个节点');
    return;
  }

  bindResourceForm.resourceIds = [];
  bindResourceForm.resourceType = resourceType.value;
  bindResourceModalVisible.value = true;
};

const onResourceSelectionChange = (selectedRowKeys: string[]) => {
  bindResourceForm.resourceIds = selectedRowKeys;
};

const confirmBindResource = () => {
  if (bindResourceForm.resourceIds.length === 0) {
    message.warning('请选择要绑定的资源');
    return;
  }

  confirmLoading.value = true;
  // 模拟API调用
  setTimeout(() => {
    // 这里应该是调用API绑定资源
    message.success(`成功绑定 ${bindResourceForm.resourceIds.length} 个资源`);

    // 模拟更新资源列表
    const newResources = bindResourceForm.resourceIds.map(id => {
      const resource = availableResources.value.find(item => item.id === id);
      return resource ? resource : undefined;
    }).filter((item): item is NonNullable<typeof item> => item !== undefined);

    resourceList.value = [...resourceList.value, ...newResources];

    // 从可用资源中移除已绑定的资源
    availableResources.value = availableResources.value.filter(
      item => !bindResourceForm.resourceIds.includes(item.id)
    );

    bindResourceModalVisible.value = false;
    confirmLoading.value = false;
  }, 1000);
};

const cancelBindResource = () => {
  bindResourceModalVisible.value = false;
};

// 解绑资源
const handleUnbindResource = (record: any) => {
  // 模拟API调用
  loading.value = true;
  setTimeout(() => {
    // 从当前资源列表中移除
    resourceList.value = resourceList.value.filter(item => item.id !== record.id);
    // 添加回可用资源列表
    availableResources.value.push(record);
    message.success('资源解绑成功');
    loading.value = false;
  }, 800);
};

// 查看资源详情
const handleViewResource = (record: any) => {
  message.info(`查看资源: ${record.instanceName}`);
  // 这里可以打开一个新的详情对话框或跳转详情页
};

// 添加管理员
const handleAddAdmin = () => {
  memberModalType.value = 'admin';
  selectedUsers.value = [];
  memberModalVisible.value = true;
};

// 添加成员
const handleAddMember = () => {
  memberModalType.value = 'member';
  selectedUsers.value = [];
  memberModalVisible.value = true;
};

// 确认添加成员
const confirmAddMember = () => {
  if (selectedUsers.value.length === 0) {
    message.warning('请选择要添加的用户');
    return;
  }

  confirmLoading.value = true;
  // 模拟API调用
  setTimeout(() => {
    const selectedUserObjects = selectedUsers.value.map(id => {
      const user = userOptions.value.find(u => u.value === id);
      if (user) {
        const parts = user.label.split(' ');
        const email = parts[1] ? parts[1].replace(/[()]/g, '') : '';
        return {
          id,
          name: parts[0] || '', // 确保name始终为字符串，不会是undefined
          email
        };
      }
      return null;
    }).filter((u): u is NonNullable<typeof u> => u !== null);

    if (memberModalType.value === 'admin') {
      // 添加管理员
      adminList.value = [...adminList.value, ...selectedUserObjects];
      message.success(`成功添加 ${selectedUserObjects.length} 个管理员`);
    } else {
      // 添加成员
      memberList.value = [...memberList.value, ...selectedUserObjects];
      message.success(`成功添加 ${selectedUserObjects.length} 个成员`);
    }

    memberModalVisible.value = false;
    confirmLoading.value = false;
  }, 1000);
};

const cancelAddMember = () => {
  memberModalVisible.value = false;
};

// 移除管理员
const handleRemoveAdmin = (admin: any) => {
  // 模拟API调用
  loading.value = true;
  setTimeout(() => {
    adminList.value = adminList.value.filter(item => item.id !== admin.id);
    message.success(`管理员 ${admin.name} 已移除`);
    loading.value = false;
  }, 800);
};

// 移除成员
const handleRemoveMember = (member: any) => {
  // 模拟API调用
  loading.value = true;
  setTimeout(() => {
    memberList.value = memberList.value.filter(item => item.id !== member.id);
    message.success(`成员 ${member.name} 已移除`);
    loading.value = false;
  }, 800);
};

// 过滤用户选项
const filterUserOption = (input: string, option: any) => {
  return option.label.toLowerCase().indexOf(input.toLowerCase()) >= 0;
};

// 生命周期钩子
onMounted(() => {
  // 初始化加载数据
  loading.value = true;
  setTimeout(() => {
    loading.value = false;
  }, 1000);
});
</script>

<style scoped lang="scss">
.service-tree-container {
  min-height: 100vh;
  padding: 16px;

  .page-header {
    border-radius: 4px;
    padding: 16px 24px;
  }

  .content-layout {
    margin-bottom: 24px;
  }

  .tree-card,
  .node-detail-card,
  .member-card {
    margin-bottom: 16px;
    border-radius: 4px;
  }

  .tree-card {
    height: calc(100vh - 150px);
    overflow: auto;

    .action-icon {
      cursor: pointer;
      color: var(--primary-color, #1890ff);
      margin-left: 8px;
      font-size: 14px;
    }
  }

  .node-title {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .resource-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 16px;
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: 24px 0 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--border-color-split, #f0f0f0);

    h3 {
      margin: 0;
    }
  }

  .danger-action {
    color: #ff4d4f;
  }
}
</style>
