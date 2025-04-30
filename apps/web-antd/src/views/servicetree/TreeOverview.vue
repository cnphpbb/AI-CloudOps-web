<template>
  <div class="service-tree-overview">
    <a-row class="header" :gutter="16">
      <a-col :span="18">
        <a-page-header title="服务树概览" sub-title="管理您的服务架构与资源" class="page-header">
          <!-- 移除了原来在这里的按钮 -->
        </a-page-header>
      </a-col>
      <a-col :span="6">
        <div class="action-buttons">
          <a-space size="middle">
            <a-button type="primary" @click="showCreateNodeModal">
              <template #icon>
                <PlusOutlined />
              </template>
              创建节点
            </a-button>
            <a-button @click="refreshTreeData">
              <template #icon>
                <SyncOutlined />
              </template>
              同步资源
            </a-button>
            <a-dropdown>
              <a-button>
                <template #icon>
                  <SettingOutlined />
                </template>
                设置
              </a-button>
              <template #overlay>
                <a-menu>
                  <a-menu-item key="1">系统设置</a-menu-item>
                  <a-menu-item key="2">权限管理</a-menu-item>
                  <a-menu-item key="3">导入/导出</a-menu-item>
                </a-menu>
              </template>
            </a-dropdown>
          </a-space>
        </div>
      </a-col>
    </a-row>
    <a-row :gutter="16" class="main-content">
      <a-col :span="6">
        <a-card title="服务树结构" class="tree-card">
          <template #extra>
            <a-space>
              <a-tooltip title="刷新">
                <reload-outlined class="action-icon" @click="refreshTreeData" />
              </a-tooltip>
              <a-tooltip title="创建节点">
                <plus-outlined class="action-icon" @click="showCreateNodeModal" />
              </a-tooltip>
            </a-space>
          </template>
          <a-input-search v-model:value="searchValue" placeholder="搜索节点" style="margin-bottom: 8px" />
          <a-spin :spinning="treeLoading">
            <a-tree :tree-data="mockData.treeData" :defaultExpandedKeys="['1']" :defaultSelectedKeys="['1']"
              @select="onSelectNode" class="service-tree" :showLine="{ showLeafIcon: false }" showIcon
              :replaceFields="{ key: 'id', title: 'name' }">
              <template #icon="{ type }">
                <folder-outlined v-if="type === 'folder'" />
                <appstore-outlined v-else-if="type === 'application'" />
                <laptop-outlined v-else-if="type === 'server'" />
                <database-outlined v-else-if="type === 'database'" />
                <cluster-outlined v-else />
              </template>
              <template #title="{ name, metadata }">
                <span>{{ name }}</span>
                <a-tag v-if="metadata && metadata.env" size="small">{{ metadata.env }}</a-tag>
              </template>
            </a-tree>
          </a-spin>
        </a-card>
      </a-col>

      <a-col :span="18">
        <a-card v-if="selectedNode" class="detail-card">
          <a-tabs>
            <a-tab-pane key="overview" tab="节点详情">
              <a-descriptions :column="3" bordered>
                <a-descriptions-item label="节点名称">{{ selectedNode?.name }}</a-descriptions-item>
                <a-descriptions-item label="节点类型">{{ selectedNode?.type }}</a-descriptions-item>
                <a-descriptions-item label="路径">{{ selectedNodePath }}</a-descriptions-item>
                <a-descriptions-item label="创建时间">{{ formatDate(selectedNode?.createdAt) }}</a-descriptions-item>
                <a-descriptions-item label="更新时间">{{ formatDate(selectedNode?.updatedAt) }}</a-descriptions-item>
                <a-descriptions-item label="环境">
                  <a-tag>{{ selectedNode?.metadata?.env || 'prod' }}</a-tag>
                </a-descriptions-item>
                <a-descriptions-item label="描述" :span="3">
                  {{ selectedNode?.description || '暂无描述' }}
                </a-descriptions-item>
              </a-descriptions>

              <div class="section-header">
                <h3>管理员</h3>
                <a-button type="link" @click="showAddAdminModal">
                  <template #icon><user-add-outlined /></template>
                  添加管理员
                </a-button>
              </div>
              <a-list :data-source="selectedNode?.admins || []" :grid="{ gutter: 16, column: 4 }">
                <template #renderItem="{ item }">
                  <a-list-item>
                    <a-card class="user-card">
                      <a-avatar :size="32">{{ item.name.charAt(0) }}</a-avatar>
                      <span class="user-name">{{ item.name }}</span>
                      <a-button type="text" danger>
                        <delete-outlined />
                      </a-button>
                    </a-card>
                  </a-list-item>
                </template>
                <template #empty>
                  <a-empty description="暂无管理员" />
                </template>
              </a-list>

              <div class="section-header">
                <h3>成员</h3>
                <a-button type="link" @click="showAddMemberModal">
                  <template #icon><team-outlined /></template>
                  添加成员
                </a-button>
              </div>
              <a-list :data-source="selectedNode?.members || []" :grid="{ gutter: 16, column: 4 }">
                <template #renderItem="{ item }">
                  <a-list-item>
                    <a-card class="user-card">
                      <a-avatar :size="32">{{ item.name.charAt(0) }}</a-avatar>
                      <span class="user-name">{{ item.name }}</span>
                      <a-button type="text" danger>
                        <delete-outlined />
                      </a-button>
                    </a-card>
                  </a-list-item>
                </template>
                <template #empty>
                  <a-empty description="暂无成员" />
                </template>
              </a-list>
            </a-tab-pane>

            <a-tab-pane key="resources" tab="关联资源">
              <div class="section-header resources-header">
                <a-radio-group v-model:value="resourceType" button-style="solid">
                  <a-radio-button value="all">全部</a-radio-button>
                  <a-radio-button value="ecs">服务器</a-radio-button>
                  <a-radio-button value="rds">数据库</a-radio-button>
                  <a-radio-button value="elb">负载均衡</a-radio-button>
                </a-radio-group>
                <a-button type="primary" @click="showBindResourceModal">
                  <template #icon><link-outlined /></template>
                  绑定资源
                </a-button>
              </div>

              <a-table :columns="resourceColumns" :data-source="filteredResources" :pagination="{ pageSize: 5 }"
                :loading="resourcesLoading" :rowKey="(record: Resource) => record.instanceId">
                <template #bodyCell="{ column, record }">
                  <template v-if="column.key === 'status'">
                    <a-tag :color="getStatusColor(record.status)">
                      {{ record.status }}
                    </a-tag>
                  </template>
                  <template v-if="column.key === 'provider'">
                    <span>
                      <cloud-outlined v-if="record.provider === 'aliyun'" />
                      <aws-outlined v-else-if="record.provider === 'aws'" />
                      <google-outlined v-else-if="record.provider === 'gcp'" />
                      {{ getProviderLabel(record.provider) }}
                    </span>
                  </template>
                  <template v-if="column.key === 'action'">
                    <a-space>
                      <a-button type="link" size="small">
                        <template #icon><eye-outlined /></template>
                        详情
                      </a-button>
                      <a-button type="link" size="small" danger @click="handleUnbindResource(record)">
                        <template #icon><disconnect-outlined /></template>
                        解绑
                      </a-button>
                    </a-space>
                  </template>
                </template>
              </a-table>
            </a-tab-pane>

            <a-tab-pane key="children" tab="子节点">
              <div class="child-nodes-header">
                <a-button type="primary" @click="showCreateChildNodeModal">
                  <template #icon><plus-outlined /></template>
                  添加子节点
                </a-button>
              </div>
              <a-table :columns="childNodeColumns" :data-source="selectedNode?.children || []"
                :pagination="{ pageSize: 5 }" :rowKey="(record: NodeChild) => record.id">
                <template #bodyCell="{ column, record }">
                  <template v-if="column.key === 'action'">
                    <a-space>
                      <a-button type="link" size="small" @click="onSelectNode([record.id])">
                        <template #icon><eye-outlined /></template>
                        查看
                      </a-button>
                      <a-button type="link" size="small">
                        <template #icon><edit-outlined /></template>
                        编辑
                      </a-button>
                      <a-popconfirm title="确定要删除此节点吗?" @confirm="handleDeleteNode(record)" ok-text="是" cancel-text="否">
                        <a-button type="link" danger size="small">
                          <template #icon><delete-outlined /></template>
                          删除
                        </a-button>
                      </a-popconfirm>
                    </a-space>
                  </template>
                </template>
              </a-table>
            </a-tab-pane>
          </a-tabs>
        </a-card>
        <a-empty v-else description="请选择一个节点查看详情" />
      </a-col>
    </a-row>
    <!-- 创建节点弹窗 -->
    <a-modal v-model:visible="createNodeModalVisible" title="创建节点" @ok="handleCreateNode" width="600px">
      <a-form :model="createNodeForm" :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }">
        <a-form-item label="父节点">
          <a-tree-select v-model:value="createNodeForm.parentId" :tree-data="mockData.treeData" placeholder="请选择父节点"
            :replaceFields="{ key: 'id', title: 'name', value: 'id' }" style="width: 100%" />
        </a-form-item>
        <a-form-item label="节点名称" required>
          <a-input v-model:value="createNodeForm.name" placeholder="请输入节点名称" />
        </a-form-item>
        <a-form-item label="节点类型">
          <a-select v-model:value="createNodeForm.type" placeholder="请选择节点类型">
            <a-select-option value="folder">文件夹</a-select-option>
            <a-select-option value="application">应用</a-select-option>
            <a-select-option value="server">服务器</a-select-option>
            <a-select-option value="database">数据库</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="环境">
          <a-select v-model:value="createNodeForm.env" placeholder="请选择环境">
            <a-select-option value="dev">开发环境</a-select-option>
            <a-select-option value="test">测试环境</a-select-option>
            <a-select-option value="staging">预发环境</a-select-option>
            <a-select-option value="prod">生产环境</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="描述">
          <a-textarea v-model:value="createNodeForm.description" placeholder="请输入描述信息" :rows="4" />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 绑定资源弹窗 -->
    <a-modal v-model:visible="bindResourceModalVisible" title="绑定资源" @ok="handleBindResource" width="800px">
      <a-form :layout="'vertical'">
        <a-form-item label="资源类型" required>
          <a-select v-model:value="bindResourceForm.resourceType" placeholder="请选择资源类型">
            <a-select-option value="ecs">服务器 (ECS)</a-select-option>
            <a-select-option value="rds">数据库 (RDS)</a-select-option>
            <a-select-option value="elb">负载均衡 (ELB)</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="选择资源" required>
          <a-table :columns="resourceSelectColumns" :data-source="mockData.availableResources" row-key="instanceId"
            :pagination="{ pageSize: 5 }" :rowSelection="{
              selectedRowKeys: bindResourceForm.selectedResourceIds,
              onChange: onSelectedResourceChange
            }">
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'status'">
                <a-tag :color="getStatusColor(record.status)">
                  {{ record.status }}
                </a-tag>
              </template>
              <template v-if="column.key === 'provider'">
                <span>
                  <cloud-outlined v-if="record.provider === 'aliyun'" />
                  <aws-outlined v-else-if="record.provider === 'aws'" />
                  {{ getProviderLabel(record.provider) }}
                </span>
              </template>
            </template>
          </a-table>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import {
  PlusOutlined,
  SyncOutlined,
  SettingOutlined,
  CloudServerOutlined,
  ReloadOutlined,
  FolderOutlined,
  AppstoreOutlined,
  LaptopOutlined,
  DatabaseOutlined,
  ClusterOutlined,
  UserAddOutlined,
  TeamOutlined,
  LinkOutlined,
  DisconnectOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  CloudOutlined,
  GoogleOutlined
} from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';

// 定义类型
interface Admin {
  id: number;
  name: string;
  email: string;
}

interface Member {
  id: number;
  name: string;
  email: string;
}

interface NodeChild {
  id: string;
  name: string;
  type: string;
  createdAt: string;
}

interface NodeMetadata {
  env?: string;
}

interface NodeDetail {
  id: string;
  name: string;
  type: string;
  createdAt: string;
  updatedAt: string;
  description: string;
  admins: Admin[];
  members: Member[];
  children: NodeChild[];
  metadata?: NodeMetadata;
}

interface Resource {
  instanceId: string;
  instanceName: string;
  provider: string;
  type: string;
  regionId: string;
  zoneId?: string;
  status: string;
  cpu?: number;
  memory?: number;
  privateIpAddress?: string[];
  publicIpAddress?: string[];
  creationTime: string;
  env?: string;
  engine?: string;
  engineVersion?: string;
  connectionString?: string;
  port?: number;
  addressType?: string;
  address?: string;
}

interface MockData {
  stats: {
    totalNodes: number;
    totalResources: number;
  };
  treeData: any[];
  nodeDetails: NodeDetail[];
  resources: Resource[];
  availableResources: Resource[];
}

interface CreateNodeForm {
  parentId: string | null;
  name: string;
  type: string;
  env: string;
  description: string;
}

interface BindResourceForm {
  resourceType: string;
  selectedResourceIds: string[];
}

// 假数据
const mockData = ref<MockData>({
  stats: {
    totalNodes: 56,
    totalResources: 128
  },
  treeData: [
    {
      id: '1',
      name: '总部',
      type: 'folder',
      children: [
        {
          id: '2',
          name: '研发部门',
          type: 'folder',
          children: [
            {
              id: '5',
              name: '订单系统',
              type: 'application',
              metadata: { env: 'prod' }
            },
            {
              id: '6',
              name: '支付系统',
              type: 'application',
              metadata: { env: 'prod' }
            }
          ]
        },
        {
          id: '3',
          name: '运维部门',
          type: 'folder',
          children: [
            {
              id: '7',
              name: '监控系统',
              type: 'application',
              metadata: { env: 'prod' }
            },
            {
              id: '8',
              name: '日志系统',
              type: 'application',
              metadata: { env: 'prod' }
            }
          ]
        },
        {
          id: '4',
          name: '测试部门',
          type: 'folder',
          children: [
            {
              id: '9',
              name: '测试环境',
              type: 'server',
              metadata: { env: 'test' }
            }
          ]
        }
      ]
    }
  ],
  nodeDetails: [
    {
      id: '1',
      name: '总部',
      type: 'folder',
      createdAt: '2023-12-01T08:00:00Z',
      updatedAt: '2024-04-15T10:30:00Z',
      description: '公司总部所有资源的根节点',
      admins: [
        { id: 1, name: '张三', email: 'zhangsan@example.com' },
        { id: 2, name: '李四', email: 'lisi@example.com' }
      ],
      members: [
        { id: 3, name: '王五', email: 'wangwu@example.com' },
        { id: 4, name: '赵六', email: 'zhaoliu@example.com' },
        { id: 5, name: '孙七', email: 'sunqi@example.com' }
      ],
      children: [
        { id: '2', name: '研发部门', type: 'folder', createdAt: '2023-12-02T09:00:00Z' },
        { id: '3', name: '运维部门', type: 'folder', createdAt: '2023-12-02T09:30:00Z' },
        { id: '4', name: '测试部门', type: 'folder', createdAt: '2023-12-02T10:00:00Z' }
      ]
    },
    {
      id: '5',
      name: '订单系统',
      type: 'application',
      createdAt: '2023-12-03T08:00:00Z',
      updatedAt: '2024-04-10T10:30:00Z',
      description: '处理用户订单的核心系统',
      metadata: { env: 'prod' },
      admins: [
        { id: 1, name: '张三', email: 'zhangsan@example.com' }
      ],
      members: [
        { id: 3, name: '王五', email: 'wangwu@example.com' },
        { id: 4, name: '赵六', email: 'zhaoliu@example.com' }
      ],
      children: []
    }
  ],
  resources: [
    {
      instanceId: 'i-bp67acfmxazb4p****',
      instanceName: 'order-server-01',
      provider: 'aliyun',
      type: 'ecs',
      regionId: 'cn-hangzhou',
      zoneId: 'cn-hangzhou-b',
      status: 'Running',
      cpu: 4,
      memory: 8,
      privateIpAddress: ['172.16.1.10'],
      publicIpAddress: ['47.98.99.100'],
      creationTime: '2023-10-01T08:00:00Z',
      env: 'prod'
    },
    {
      instanceId: 'i-bp67acfmxazb4p****2',
      instanceName: 'order-server-02',
      provider: 'aliyun',
      type: 'ecs',
      regionId: 'cn-hangzhou',
      zoneId: 'cn-hangzhou-b',
      status: 'Running',
      cpu: 4,
      memory: 8,
      privateIpAddress: ['172.16.1.11'],
      publicIpAddress: ['47.98.99.101'],
      creationTime: '2023-10-01T08:00:00Z',
      env: 'prod'
    },
    {
      instanceId: 'rm-bp1**********',
      instanceName: 'order-db-master',
      provider: 'aliyun',
      type: 'rds',
      regionId: 'cn-hangzhou',
      zoneId: 'cn-hangzhou-b',
      status: 'Running',
      engine: 'MySQL',
      engineVersion: '8.0',
      connectionString: 'rm-bp1**********.mysql.rds.aliyuncs.com',
      port: 3306,
      creationTime: '2023-10-01T09:00:00Z',
      env: 'prod'
    },
    {
      instanceId: 'lb-bp1**********',
      instanceName: 'order-elb',
      provider: 'aliyun',
      type: 'elb',
      regionId: 'cn-hangzhou',
      status: 'active',
      addressType: 'internet',
      address: 'lb-bp1**********.cn-hangzhou.elb.aliyuncs.com',
      creationTime: '2023-10-01T10:00:00Z',
      env: 'prod'
    }
  ],
  availableResources: [
    {
      instanceId: 'i-bp67acfmxazb4p****3',
      instanceName: 'app-server-01',
      provider: 'aliyun',
      type: 'ecs',
      regionId: 'cn-hangzhou',
      zoneId: 'cn-hangzhou-b',
      status: 'Running',
      privateIpAddress: ['172.16.1.20'],
      creationTime: '2023-11-01T08:00:00Z'
    },
    {
      instanceId: 'i-bp67acfmxazb4p****4',
      instanceName: 'app-server-02',
      provider: 'aws',
      type: 'ecs',
      regionId: 'ap-northeast-1',
      zoneId: 'ap-northeast-1a',
      status: 'Running',
      privateIpAddress: ['10.0.1.21'],
      creationTime: '2023-11-01T08:10:00Z'
    },
    {
      instanceId: 'rm-bp1**********2',
      instanceName: 'user-db',
      provider: 'aliyun',
      type: 'rds',
      regionId: 'cn-hangzhou',
      zoneId: 'cn-hangzhou-b',
      status: 'Running',
      creationTime: '2023-11-01T09:00:00Z'
    }
  ]
});

// 状态变量
const selectedNode = ref<NodeDetail | null>(null);
const selectedNodePath = ref<string>('');
const treeLoading = ref<boolean>(false);
const resourcesLoading = ref<boolean>(false);
const searchValue = ref<string>('');
const resourceType = ref<string>('all');

// 弹窗控制
const createNodeModalVisible = ref<boolean>(false);
const bindResourceModalVisible = ref<boolean>(false);
const createNodeForm = ref<CreateNodeForm>({
  parentId: null,
  name: '',
  type: 'folder',
  env: 'prod',
  description: ''
});
const bindResourceForm = ref<BindResourceForm>({
  resourceType: 'ecs',
  selectedResourceIds: []
});

// 表格列定义
const resourceColumns = [
  {
    title: '实例名称',
    dataIndex: 'instanceName',
    key: 'instanceName',
  },
  {
    title: '实例ID',
    dataIndex: 'instanceId',
    key: 'instanceId',
    width: 180,
  },
  {
    title: '类型',
    dataIndex: 'type',
    key: 'type',
    width: 100,
  },
  {
    title: '云厂商',
    dataIndex: 'provider',
    key: 'provider',
    width: 120,
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 100,
  },
  {
    title: '区域',
    dataIndex: 'regionId',
    key: 'regionId',
    width: 120,
  },
  {
    title: '操作',
    key: 'action',
    width: 150,
  }
];

const resourceSelectColumns = [
  {
    title: '实例名称',
    dataIndex: 'instanceName',
    key: 'instanceName',
  },
  {
    title: '实例ID',
    dataIndex: 'instanceId',
    key: 'instanceId',
  },
  {
    title: '类型',
    dataIndex: 'type',
    key: 'type',
  },
  {
    title: '厂商',
    dataIndex: 'provider',
    key: 'provider',
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
  }
];

const childNodeColumns = [
  {
    title: '节点名称',
    dataIndex: 'name',
    key: 'name',
  },
  {
    title: '节点类型',
    dataIndex: 'type',
    key: 'type',
  },
  {
    title: '创建时间',
    dataIndex: 'createdAt',
    key: 'createdAt',
    render: (text: string) => formatDate(text),
  },
  {
    title: '操作',
    key: 'action',
  }
];

// 计算属性
const filteredResources = computed(() => {
  if (resourceType.value === 'all') {
    return mockData.value.resources;
  } else {
    return mockData.value.resources.filter(r => r.type === resourceType.value);
  }
});

// 方法
const onSelectNode = (selectedKeys: string[]) => {
  if (selectedKeys.length > 0) {
    const nodeId = selectedKeys[0];

    // 模拟数据加载
    treeLoading.value = true;
    resourcesLoading.value = true;

    setTimeout(() => {
      const node = mockData.value.nodeDetails.find(n => n.id === nodeId);
      if (node) {
        selectedNode.value = node;
        selectedNodePath.value = `/总部/${node.name}`;
      } else {
        selectedNode.value = null;
        selectedNodePath.value = '';
      }
      treeLoading.value = false;
      resourcesLoading.value = false;
    }, 500);
  }
};

const refreshTreeData = () => {
  treeLoading.value = true;
  setTimeout(() => {
    treeLoading.value = false;
    message.success('服务树数据已刷新');
  }, 800);
};

const formatDate = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleString();
};

const getStatusColor = (status: string) => {
  const statusMap: Record<string, string> = {
    'Running': 'green',
    'Stopped': 'orange',
    'active': 'green',
    'inactive': 'orange',
    'Error': 'red'
  };
  return statusMap[status] || 'blue';
};

const getProviderLabel = (provider: string) => {
  const providerMap: Record<string, string> = {
    'aliyun': '阿里云',
    'aws': 'AWS',
    'gcp': 'GCP',
    'azure': 'Azure',
    'tencent': '腾讯云'
  };
  return providerMap[provider] || provider;
};

const showCreateNodeModal = () => {
  createNodeForm.value = {
    parentId: null,
    name: '',
    type: 'folder',
    env: 'prod',
    description: ''
  };
  createNodeModalVisible.value = true;
};

const showCreateChildNodeModal = () => {
  if (selectedNode.value) {
    createNodeForm.value = {
      parentId: selectedNode.value.id,
      name: '',
      type: 'folder',
      env: selectedNode.value.metadata?.env || 'prod',
      description: ''
    };
    createNodeModalVisible.value = true;
  }
};

const handleCreateNode = () => {
  // 模拟创建节点
  message.success(`节点 "${createNodeForm.value.name}" 创建成功`);
  createNodeModalVisible.value = false;
};

const showBindResourceModal = () => {
  if (!selectedNode.value) {
    message.warning('请先选择一个节点');
    return;
  }

  bindResourceForm.value = {
    resourceType: 'ecs',
    selectedResourceIds: []
  };
  bindResourceModalVisible.value = true;
};

const onSelectedResourceChange = (selectedRowKeys: string[]) => {
  bindResourceForm.value.selectedResourceIds = selectedRowKeys;
};

const handleBindResource = () => {
  if (bindResourceForm.value.selectedResourceIds.length === 0) {
    message.warning('请至少选择一个资源');
    return;
  }

  // 模拟绑定资源
  message.success(`已成功绑定 ${bindResourceForm.value.selectedResourceIds.length} 个资源到当前节点`);
  bindResourceModalVisible.value = false;
};

const handleUnbindResource = (resource: Resource) => {
  // 模拟解绑资源
  message.success(`资源 "${resource.instanceName}" 已成功解绑`);
};

const handleDeleteNode = (node: NodeDetail) => {
  // 模拟删除节点
  message.success(`节点 "${node.name}" 已成功删除`);
};

const showAddAdminModal = () => {
  message.info('添加管理员功能即将上线');
};

const showAddMemberModal = () => {
  message.info('添加成员功能即将上线');
};

onMounted(() => {
  // 模拟初始加载根节点
  onSelectNode(['1']);
});
</script>

<style scoped lang="scss">
.service-tree-overview {
  min-height: 100vh;
  padding: 16px;

  /* 添加到您的样式表中 */
  .action-buttons {
    margin-top: 16px;
    display: flex;
    justify-content: flex-end;
  }

  .header {
    margin-bottom: 2px;
    border-radius: 4px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    overflow: hidden;

    .page-header {
      padding: 16px 24px;
    }

    .stats-cards {
      display: flex;
      padding: 24px 16px;
      justify-content: space-around;

      .stat-item {
        text-align: center;
      }
    }
  }

  .main-content {
    .tree-card {
      height: calc(100vh - 140px);
      overflow: auto;

      .action-icon {
        cursor: pointer;
        color: var(--primary-color, #1890ff);
        margin-left: 8px;
        font-size: 14px;
      }

      .service-tree {
        margin-top: 12px;
      }
    }

    .detail-card {
      min-height: calc(100vh - 140px);

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

      .resources-header {
        margin-top: 0;
      }

      .user-card {
        display: flex;
        align-items: center;
        gap: 8px;

        .user-name {
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      }

      .child-nodes-header {
        margin-bottom: 16px;
        display: flex;
        justify-content: flex-end;
      }
    }
  }
}
</style>
