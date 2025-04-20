<template>
  <div class="ecs-management-container">
    <!-- 标题栏 -->
    <div class="header-section">
      <a-row align="middle">
        <a-col :span="12">
          <div class="page-title">
            <span>云服务器 ECS 管理控制台</span>
          </div>
        </a-col>
        <a-col :span="12" class="header-actions">
          <a-button type="primary" shape="round" @click="showCreateModal">
            <plus-outlined /> 创建实例
          </a-button>
        </a-col>
      </a-row>
    </div>

    <!-- 筛选区域 -->
    <a-card class="filter-card" :bordered="false">
      <a-row :gutter="16">
        <a-col :span="8">
          <a-form-item label="云服务商">
            <a-select v-model:value="filterParams.provider" placeholder="选择云服务商" allowClear>
              <a-select-option value="aliyun">阿里云</a-select-option>
              <a-select-option value="aws">AWS</a-select-option>
              <a-select-option value="tencent">腾讯云</a-select-option>
            </a-select>
          </a-form-item>
        </a-col>
        <a-col :span="8">
          <a-form-item label="区域">
            <a-select v-model:value="filterParams.region" placeholder="选择区域" allowClear>
              <a-select-option value="cn-hangzhou">华东 1 (杭州)</a-select-option>
              <a-select-option value="cn-beijing">华北 2 (北京)</a-select-option>
              <a-select-option value="cn-shanghai">华东 2 (上海)</a-select-option>
            </a-select>
          </a-form-item>
        </a-col>
        <a-col :span="8" class="search-buttons">
          <a-button type="primary" @click="fetchEcsList">
            <search-outlined /> 查询
          </a-button>
          <a-button class="reset-btn" @click="resetFilters">
            <reload-outlined /> 重置
          </a-button>
        </a-col>
      </a-row>
    </a-card>

    <!-- 列表区域 -->
    <a-card class="ecs-list-card" :bordered="false">
      <a-table :dataSource="ecsList" :columns="columns" :loading="tableLoading" :pagination="pagination"
        @change="handleTableChange" :row-key="(record: ResourceEcs) => record.instance_id" size="middle">
        <!-- 状态列 -->
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <a-tag :color="getStatusColor(record.status)">
              {{ getStatusText(record.status) }}
            </a-tag>
          </template>

          <!-- 操作列 -->
          <template v-if="column.key === 'action'">
            <div class="action-buttons">
              <a-button type="link" size="small" @click="showDetailDrawer(record)" class="detail-btn">
                <eye-outlined /> 详情
              </a-button>
              <a-dropdown>
                <template #overlay>
                  <a-menu>
                    <a-menu-item v-if="record.status !== 'Running'" key="start" @click="startEcs(record)">
                      <play-circle-outlined /> 启动
                    </a-menu-item>
                    <a-menu-item v-if="record.status === 'Running'" key="stop" @click="stopEcs(record)">
                      <pause-circle-outlined /> 停止
                    </a-menu-item>
                    <a-menu-item v-if="record.status === 'Running'" key="restart" @click="restartEcs(record)">
                      <reload-outlined /> 重启
                    </a-menu-item>
                    <a-menu-divider />
                    <a-menu-item key="delete" danger @click="confirmDelete(record)">
                      <delete-outlined /> 删除
                    </a-menu-item>
                  </a-menu>
                </template>
                <a-button type="text" size="small">
                  <more-outlined />
                </a-button>
              </a-dropdown>
            </div>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 创建实例弹窗 -->
    <a-modal v-model:visible="createModalVisible" title="创建 ECS 实例" width="800px" :footer="null" class="create-modal"
      :destroyOnClose="true">
      <a-steps :current="currentStep" size="small" class="create-steps">
        <a-step title="基础配置" />
        <a-step title="网络配置" />
        <a-step title="系统配置" />
        <a-step title="确认信息" />
      </a-steps>

      <a-form :model="createForm" layout="vertical" ref="createFormRef" class="create-form">
        <!-- 步骤 1: 基础配置 -->
        <div v-if="currentStep === 0">
          <a-form-item label="云服务商" name="provider" :rules="[{ required: true }]">
            <a-select v-model:value="createForm.provider" placeholder="选择云服务商" @change="handleProviderChange">
              <a-select-option value="aliyun">阿里云</a-select-option>
              <a-select-option value="aws">AWS</a-select-option>
              <a-select-option value="tencent">腾讯云</a-select-option>
            </a-select>
          </a-form-item>

          <a-form-item label="付费类型" name="payType" :rules="[{ required: true }]">
            <a-select v-model:value="createForm.payType" placeholder="选择付费类型" @change="handlePayTypeChange"
              :disabled="!createForm.provider">
              <a-select-option value="PostPaid">按量付费</a-select-option>
              <a-select-option value="PrePaid">包年包月</a-select-option>
            </a-select>
          </a-form-item>

          <a-form-item label="地域" name="region" :rules="[{ required: true }]">
            <a-select v-model:value="createForm.region" placeholder="选择地域" @change="handleRegionChange"
              :disabled="!createForm.payType">
              <a-select-option v-for="data in regionOptions" :key="data.region" :value="data.region">
                {{ data.region }}
              </a-select-option>
            </a-select>
          </a-form-item>

          <a-form-item label="可用区" name="zoneId" :rules="[{ required: true }]">
            <a-select v-model:value="createForm.zoneId" placeholder="选择可用区" @change="handleZoneChange"
              :disabled="!createForm.region">
              <a-select-option v-for="zone in zoneOptions" :key="zone.zone" :value="zone.zone">
                {{ zone.zone }}
              </a-select-option>
            </a-select>
          </a-form-item>

          <a-form-item label="实例规格" name="instanceType" :rules="[{ required: true }]">
            <a-select v-model:value="createForm.instanceType" placeholder="选择实例规格" @change="handleInstanceTypeChange"
              :disabled="!createForm.zoneId">
              <a-select-option v-for="type in instanceTypeOptions" :key="type.instanceType" :value="type.instanceType">
                {{ type.instanceType }} ({{ type.cpu }}核{{ type.memory }}GB)
              </a-select-option>
            </a-select>
          </a-form-item>

          <a-form-item label="镜像" name="imageId" :rules="[{ required: true }]">
            <a-select v-model:value="createForm.imageId" placeholder="选择镜像" :disabled="!createForm.instanceType">
              <a-select-option value="aliyun_3_x64_20G_alibase_20221102.vhd">CentOS 3.x 64位</a-select-option>
              <a-select-option value="ubuntu_18_04_x64_20G_alibase_20221102.vhd">Ubuntu 18.04 64位</a-select-option>
              <a-select-option value="win_2019_x64_dtc_zh-cn_40G_alibase_20221102.vhd">Windows Server 2019
                数据中心版</a-select-option>
            </a-select>
          </a-form-item>
        </div>

        <!-- 步骤 2: 网络配置 -->
        <div v-if="currentStep === 1">
          <a-form-item label="实例数量" name="amount" :rules="[{ required: true }]">
            <a-input-number v-model:value="createForm.amount" :min="1" :max="100" style="width: 100%" />
          </a-form-item>

          <a-form-item label="交换机" name="vSwitchId" :rules="[{ required: true }]">
            <a-select v-model:value="createForm.vSwitchId" placeholder="选择交换机">
              <a-select-option value="vsw-bp1980idvo9x8oqa7k8g7">交换机1 (172.16.0.0/24)</a-select-option>
              <a-select-option value="vsw-bp1980idvo9x8oqa7k8g8">交换机2 (172.16.1.0/24)</a-select-option>
            </a-select>
          </a-form-item>

          <a-form-item label="安全组" name="securityGroupIds" :rules="[{ required: true }]">
            <a-select v-model:value="createForm.securityGroupIds" placeholder="选择安全组" mode="multiple">
              <a-select-option value="sg-bp14awscejjfabbu6x5n">安全组1 (开放80,443端口)</a-select-option>
              <a-select-option value="sg-bp14awscejjfabbu6x5m">安全组2 (开放22,3389端口)</a-select-option>
            </a-select>
          </a-form-item>
        </div>

        <!-- 步骤 3: 系统配置 -->
        <div v-if="currentStep === 2">
          <a-form-item label="主机名前缀" name="hostnamePrefix">
            <a-input v-model:value="createForm.hostnamePrefix" placeholder="主机名前缀，如web-server" />
          </a-form-item>

          <a-form-item label="主机名" name="hostname">
            <a-input v-model:value="createForm.hostname" placeholder="主机名，如cloudops" />
          </a-form-item>

          <a-form-item label="实例名称" name="instanceName" :rules="[{ required: true }]">
            <a-input v-model:value="createForm.instanceName" placeholder="实例名称，如web-server-01" />
          </a-form-item>

          <a-form-item label="登录密码" name="password" :rules="[{ required: true }]">
            <a-input-password v-model:value="createForm.password" placeholder="请输入登录密码" />
          </a-form-item>

          <a-form-item label="实例描述" name="description">
            <a-textarea v-model:value="createForm.description" placeholder="实例描述" :rows="2" />
          </a-form-item>

          <a-form-item label="系统盘类型" name="systemDiskCategory" :rules="[{ required: true }]">
            <a-select v-model:value="createForm.systemDiskCategory" placeholder="选择系统盘类型"
              @change="handleSystemDiskCategoryChange" :disabled="!createForm.instanceType">
              <a-select-option v-for="disk in systemDiskOptions" :key="disk.systemDiskCategory"
                :value="disk.systemDiskCategory">
                {{ disk.systemDiskCategory }}
              </a-select-option>
            </a-select>
          </a-form-item>

          <a-form-item label="系统盘大小 (GB)" name="systemDiskSize" :rules="[{ required: true }]">
            <a-slider v-model:value="createForm.systemDiskSize" :min="20" :max="500" :step="10"
              :marks="{ 20: '20G', 100: '100G', 200: '200G', 500: '500G' }" />
          </a-form-item>

          <a-form-item label="数据盘类型" name="dataDiskCategory">
            <a-select v-model:value="createForm.dataDiskCategory" placeholder="选择数据盘类型"
              @change="handleDataDiskCategoryChange" :disabled="!createForm.systemDiskCategory">
              <a-select-option v-for="disk in dataDiskOptions" :key="disk.dataDiskCategory"
                :value="disk.dataDiskCategory">
                {{ disk.dataDiskCategory }}
              </a-select-option>
            </a-select>
          </a-form-item>

          <a-form-item label="数据盘大小 (GB)" name="dataDiskSize">
            <a-slider v-model:value="createForm.dataDiskSize" :min="20" :max="2000" :step="10"
              :marks="{ 20: '20G', 100: '100G', 500: '500G', 2000: '2TB' }" :disabled="!createForm.dataDiskCategory" />
          </a-form-item>

          <a-form-item label="标签" name="tags">
            <div class="tag-input-container">
              <div v-for="(tag, index) in tagsArray" :key="index" class="tag-item">
                <a-tag closable @close="removeTag(index)">{{ tag }}</a-tag>
              </div>
              <a-input v-model:value="tagInputValue" placeholder="输入标签，格式为key=value，按回车添加" @pressEnter="addTag"
                style="width: 200px" />
            </div>
          </a-form-item>
        </div>

        <!-- 步骤 4: 确认信息 -->
        <div v-if="currentStep === 3" class="confirmation-step">
          <a-descriptions bordered :column="1" size="small">
            <a-descriptions-item label="云服务商">{{ getProviderName(createForm.provider) }}</a-descriptions-item>
            <a-descriptions-item label="付费类型">{{ getPayTypeName(createForm.payType) }}</a-descriptions-item>
            <a-descriptions-item label="地域">{{ getRegionById(createForm.region)?.region || createForm.region
              }}</a-descriptions-item>
            <a-descriptions-item label="可用区">{{ getZoneById(createForm.zoneId)?.zone || createForm.zoneId
              }}</a-descriptions-item>
            <a-descriptions-item label="实例规格">{{ getInstanceTypeById(createForm.instanceType)?.instanceType ||
              createForm.instanceType }}</a-descriptions-item>
            <a-descriptions-item label="镜像">{{ getImageName(createForm.imageId) }}</a-descriptions-item>
            <a-descriptions-item label="实例数量">{{ createForm.amount }}</a-descriptions-item>
            <a-descriptions-item label="实例名称">{{ createForm.instanceName }}</a-descriptions-item>
            <a-descriptions-item label="系统盘">{{ getSystemDiskById(createForm.systemDiskCategory)?.systemDiskCategory ||
              createForm.systemDiskCategory }} {{
                createForm.systemDiskSize }}GB</a-descriptions-item>
            <a-descriptions-item label="数据盘" v-if="createForm.dataDiskCategory">{{
              getDataDiskById(createForm.dataDiskCategory)?.dataDiskCategory || createForm.dataDiskCategory }} {{
                createForm.dataDiskSize }}GB</a-descriptions-item>
            <a-descriptions-item label="标签" v-if="tagsArray.length > 0">
              <a-tag v-for="(tag, index) in tagsArray" :key="index" color="blue">{{ tag }}</a-tag>
            </a-descriptions-item>
          </a-descriptions>

          <a-alert type="info" showIcon style="margin-top: 20px;">
            <template #message>
              <span>创建 ECS 服务器后，服务器将立即启动，实例费用将根据付费类型收取。</span>
            </template>
          </a-alert>
        </div>

        <div class="steps-action">
          <a-button v-if="currentStep > 0" style="margin-right: 8px" @click="prevStep">
            上一步
          </a-button>
          <a-button v-if="currentStep < 3" type="primary" @click="nextStep">
            下一步
          </a-button>
          <a-button v-if="currentStep === 3" type="primary" @click="handleCreateSubmit" :loading="createLoading">
            创建实例
          </a-button>
        </div>
      </a-form>
    </a-modal>

    <!-- 详情抽屉 -->
    <a-drawer v-model:visible="detailDrawerVisible" title="ECS 实例详情" width="600" :destroyOnClose="true"
      class="detail-drawer">
      <a-skeleton :loading="detailLoading" active>
        <a-descriptions bordered :column="1">
          <a-descriptions-item label="实例 ID">{{ instanceDetail.instance_id }}</a-descriptions-item>
          <a-descriptions-item label="实例名称">{{ instanceDetail.instance_name }}</a-descriptions-item>
          <a-descriptions-item label="实例状态">
            <a-tag :color="getStatusColor(instanceDetail.status)">{{ getStatusText(instanceDetail.status) }}</a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="区域">{{ getRegionById(instanceDetail.region_id)?.region || instanceDetail.region_id
            }}</a-descriptions-item>
          <a-descriptions-item label="可用区">{{ instanceDetail.zone_id }}</a-descriptions-item>
          <a-descriptions-item label="实例规格">{{ instanceDetail.instanceType }}</a-descriptions-item>
          <a-descriptions-item label="CPU">{{ instanceDetail.cpu }} 核</a-descriptions-item>
          <a-descriptions-item label="内存">{{ instanceDetail.memory }} GB</a-descriptions-item>
          <a-descriptions-item label="操作系统">{{ instanceDetail.osName }}</a-descriptions-item>
          <a-descriptions-item label="IP 地址">
            <div>
              <div>内网: {{ instanceDetail.private_ip_address?.join(', ') }}</div>
              <div v-if="instanceDetail.public_ip_address && instanceDetail.public_ip_address.length > 0">公网: {{
                instanceDetail.public_ip_address?.join(', ') }}</div>
            </div>
          </a-descriptions-item>
          <a-descriptions-item label="创建时间">{{ instanceDetail.creation_time }}</a-descriptions-item>
          <a-descriptions-item label="付费方式">{{ getPayTypeName(instanceDetail.instance_charge_type)
            }}</a-descriptions-item>
        </a-descriptions>

        <a-divider orientation="left">磁盘信息</a-divider>
        <a-table :dataSource="disks" :columns="diskColumns" :pagination="false" size="small"
          :row-key="(record: Disk) => record.diskId"></a-table>

        <a-divider orientation="left">标签</a-divider>
        <div class="tag-list">
          <a-tag v-for="(tag, index) in instanceDetail.tags" :key="index" color="blue">{{ tag }}</a-tag>
          <a-empty v-if="!instanceDetail.tags || instanceDetail.tags.length === 0" :image="Empty.PRESENTED_IMAGE_SIMPLE"
            description="暂无标签" />
        </div>

        <div class="drawer-actions">
          <a-button-group>
            <a-button type="primary" :disabled="instanceDetail.status === 'Running'" @click="startEcs(instanceDetail)">
              <play-circle-outlined /> 启动
            </a-button>
            <a-button :disabled="instanceDetail.status !== 'Running'" @click="stopEcs(instanceDetail)">
              <pause-circle-outlined /> 停止
            </a-button>
            <a-button :disabled="instanceDetail.status !== 'Running'" @click="restartEcs(instanceDetail)">
              <reload-outlined /> 重启
            </a-button>
          </a-button-group>
          <a-button danger @click="confirmDelete(instanceDetail)">
            <delete-outlined /> 删除
          </a-button>
        </div>
      </a-skeleton>
    </a-drawer>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted } from 'vue';
import {
  message,
  Empty,
  Modal
} from 'ant-design-vue';
import {
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  DeleteOutlined,
  MoreOutlined,
} from '@ant-design/icons-vue';

import {
  getEcsResourceList,
  getEcsResourceDetail,
  createEcsResource,
  startEcsResource,
  stopEcsResource,
  restartEcsResource,
  deleteEcsResource,
  getInstanceOptions,
  type ResourceEcs,
  type ListEcsResourceReq,
  type ResourceECSListResp,
  type GetEcsDetailReq,
  type ResourceECSDetailResp,
  type StartEcsReq,
  type StopEcsReq,
  type RestartEcsReq,
  type DeleteEcsReq,
  type ListInstanceOptionsReq,
  type ListInstanceOptionsResp,
} from '#/api/core/tree';

// 定义磁盘数据的接口
interface Disk {
  diskId: string;
  diskName: string;
  type: string;
  category: string;
  size: number;
}

// 初始化实例详情
const instanceDetail = ref<ResourceEcs>({} as ResourceEcs);

// 磁盘列表
const disks = ref<Disk[]>([]);

// 表格列定义
const columns = [
  {
    title: '实例名称/ID',
    dataIndex: 'instance_name',
    key: 'instance_name',
    render: (text: string, record: ResourceEcs) => {
      return `${text}\n${record.instance_id}`;
    },
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
  },
  {
    title: '实例规格',
    dataIndex: 'instanceType',
    key: 'instanceType',
  },
  {
    title: 'IP地址',
    dataIndex: 'ipAddress',
    key: 'ipAddress',
    render: (text: string, record: ResourceEcs) => {
      let output = `内网: ${record.private_ip_address?.join(', ') || ''}`;
      if (record.public_ip_address && record.public_ip_address.length > 0) {
        output += `\n公网: ${record.public_ip_address.join(', ')}`;
      }
      return output;
    },
  },
  {
    title: '地域/可用区',
    dataIndex: 'region',
    key: 'region',
    render: (text: string, record: ResourceEcs) => {
      return `${getRegionById(record.region_id)?.region || record.region_id}\n${getZoneById(record.zone_id)?.zone || record.zone_id}`;
    },
  },
  {
    title: '创建时间',
    dataIndex: 'creation_time',
    key: 'creation_time',
  },
  {
    title: '操作',
    key: 'action',
    width: 160,
  },
];

// 磁盘表格列定义
const diskColumns = [
  {
    title: '磁盘名称',
    dataIndex: 'diskName',
    key: 'diskName',
  },
  {
    title: '磁盘ID',
    dataIndex: 'diskId',
    key: 'diskId',
  },
  {
    title: '类型',
    dataIndex: 'type',
    key: 'type',
  },
  {
    title: '类别',
    dataIndex: 'category',
    key: 'category',
  },
  {
    title: '大小(GB)',
    dataIndex: 'size',
    key: 'size',
  },
];

// 状态相关函数
const getStatusColor = (status: string) => {
  const statusMap: Record<string, string> = {
    'Running': 'green',
    'Stopped': 'red',
    'Starting': 'blue',
    'Stopping': 'orange',
    'Creating': 'purple',
  };
  return statusMap[status] || 'gray';
};

const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    'Running': '运行中',
    'Stopped': '已停止',
    'Starting': '启动中',
    'Stopping': '停止中',
    'Creating': '创建中',
  };
  return statusMap[status] || status;
};

// 筛选参数
const filterParams = reactive<ListEcsResourceReq>({
  provider: 'aliyun',
  region: 'cn-hangzhou',
  pageNumber: 1,
  pageSize: 10,
});

// 表格数据和加载状态
const ecsList = ref<ResourceEcs[]>([]);
const tableLoading = ref(false);
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showTotal: (total: number) => `共 ${total} 条数据`,
  showSizeChanger: true,
  pageSizeOptions: ['10', '20', '50', '100'],
});

// 详情抽屉
const detailDrawerVisible = ref(false);
const detailLoading = ref(false);

// 创建实例表单
const createModalVisible = ref(false);
const createFormRef = ref(null);
const createLoading = ref(false);
const currentStep = ref(0);

// 创建表单数据
const createForm = reactive({
  provider: 'aliyun',
  region: '',
  imageId: '',
  instanceType: '',
  amount: 1,
  zoneId: '',
  vSwitchId: '',
  securityGroupIds: [] as string[],
  hostnamePrefix: '',
  hostname: '',
  password: '',
  instanceName: '',
  payType: '',
  instanceChargeType: '',
  spotStrategy: 'NoSpot',
  description: '',
  systemDiskCategory: '',
  systemDiskSize: 40,
  dataDiskCategory: '',
  dataDiskSize: 100,
  dryRun: false,
  tags: {} as Record<string, string>,
  // 包年包月相关
  periodUnit: 'Month',
  period: 1,
  autoRenew: false,
  // 竞价相关
  spotDuration: 1,
});

// 标签数组，用于UI表示
const tagsArray = ref<string[]>([]);
const tagInputValue = ref('');

// 下拉选项
const regionOptions = ref<ListInstanceOptionsResp[]>([]);
const zoneOptions = ref<ListInstanceOptionsResp[]>([]);
const instanceTypeOptions = ref<ListInstanceOptionsResp[]>([]);
const systemDiskOptions = ref<ListInstanceOptionsResp[]>([]);
const dataDiskOptions = ref<ListInstanceOptionsResp[]>([]);

// 页面加载时获取数据
onMounted(() => {
  fetchEcsList();
});

// 实用函数 - 获取名称
const getProviderName = (provider: string): string => {
  const map: Record<string, string> = {
    'aliyun': '阿里云',
    'aws': 'AWS',
    'tencent': '腾讯云',
  };
  return map[provider] || provider;
};

const getPayTypeName = (payType: string): string => {
  const map: Record<string, string> = {
    'PostPaid': '按量付费',
    'PrePaid': '包年包月',
  };
  return map[payType] || payType;
};

const getRegionById = (regionId: string) => {
  return regionOptions.value.find(region => region.region === regionId);
};

const getZoneById = (zoneId: string) => {
  return zoneOptions.value.find(zone => zone.zone === zoneId);
};

const getInstanceTypeById = (instanceTypeId: string) => {
  return instanceTypeOptions.value.find(type => type.instanceType === instanceTypeId);
};

const getSystemDiskById = (diskId: string) => {
  return systemDiskOptions.value.find(disk => disk.systemDiskCategory === diskId);
};

const getDataDiskById = (diskId: string) => {
  return dataDiskOptions.value.find(disk => disk.dataDiskCategory === diskId);
};

const getImageName = (imageId: string): string => {
  const map: Record<string, string> = {
    'aliyun_3_x64_20G_alibase_20221102.vhd': 'CentOS 3.x 64位',
    'ubuntu_18_04_x64_20G_alibase_20221102.vhd': 'Ubuntu 18.04 64位',
    'win_2019_x64_dtc_zh-cn_40G_alibase_20221102.vhd': 'Windows Server 2019 数据中心版',
  };
  return map[imageId] || imageId;
};

// 表格变更处理
const handleTableChange = (pag: any) => {
  pagination.current = pag.current;
  pagination.pageSize = pag.pageSize;
  filterParams.pageNumber = pag.current;
  filterParams.pageSize = pag.pageSize;
  fetchEcsList();
};

// 重置筛选
const resetFilters = () => {
  filterParams.provider = 'aliyun';
  filterParams.region = 'cn-hangzhou';
  filterParams.pageNumber = 1;
  filterParams.pageSize = 10;
  pagination.current = 1;
  fetchEcsList();
};

// 获取ECS列表
const fetchEcsList = async () => {
  tableLoading.value = true;
  try {
    const response = await getEcsResourceList(filterParams);
    const data = response as ResourceECSListResp;
    ecsList.value = data.data || [];
    pagination.total = data.total || 0;
  } catch (error) {
    message.error('获取ECS实例列表失败');
    console.error('获取ECS实例列表失败:', error);
  } finally {
    tableLoading.value = false;
  }
};

// 显示详情抽屉
const showDetailDrawer = async (record: ResourceEcs) => {
  detailDrawerVisible.value = true;
  detailLoading.value = true;

  try {
    const req: GetEcsDetailReq = {
      provider: record.cloud_provider,
      region: record.region_id,
      instanceId: record.instance_id
    };

    const response = await getEcsResourceDetail(req);
    instanceDetail.value = response.data;

    // 处理磁盘数据
    if (instanceDetail.value.diskIds && instanceDetail.value.diskIds.length > 0) {
      // 这里需要根据实际情况构建磁盘数据
      // 如果后端接口返回的是磁盘ID数组而不是详细信息，可能需要额外请求
      disks.value = instanceDetail.value.diskIds.map((diskId, index) => {
        return {
          diskId: diskId,
          diskName: index === 0 ? '系统盘' : `数据盘${index}`,
          type: index === 0 ? 'system' : 'data',
          category: 'cloud_essd', // 假设使用的是ESSD云盘
          size: index === 0 ? 40 : 100 // 假设系统盘40G，数据盘100G
        };
      });
    } else {
      disks.value = [];
    }
  } catch (error) {
    message.error('获取ECS实例详情失败');
    console.error('获取ECS实例详情失败:', error);
  } finally {
    detailLoading.value = false;
  }
};

// 操作相关函数
const startEcs = async (record: ResourceEcs) => {
  const hide = message.loading(`正在启动实例 ${record.instance_name}...`, 0);

  try {
    const req: StartEcsReq = {
      provider: record.cloud_provider,
      region: record.region_id,
      instanceId: record.instance_id
    };

    await startEcsResource(req);
    message.success(`实例 ${record.instance_name} 正在启动中`);

    // 更新实例状态
    record.status = 'Starting';

    // 如果是详情抽屉中的实例，也更新状态
    if (instanceDetail.value && instanceDetail.value.instance_id === record.instance_id) {
      instanceDetail.value.status = 'Starting';
    }

    // 刷新列表
    setTimeout(() => {
      fetchEcsList();
    }, 2000);
  } catch (error) {
    message.error(`启动实例 ${record.instance_name} 失败`);
    console.error('启动实例失败:', error);
  } finally {
    hide();
  }
};

const stopEcs = async (record: ResourceEcs) => {
  const hide = message.loading(`正在停止实例 ${record.instance_name}...`, 0);

  try {
    const req: StopEcsReq = {
      provider: record.cloud_provider,
      region: record.region_id,
      instanceId: record.instance_id
    };

    await stopEcsResource(req);
    message.success(`实例 ${record.instance_name} 正在停止中`);

    // 更新实例状态
    record.status = 'Stopping';

    // 如果是详情抽屉中的实例，也更新状态
    if (instanceDetail.value && instanceDetail.value.instance_id === record.instance_id) {
      instanceDetail.value.status = 'Stopping';
    }

    // 刷新列表
    setTimeout(() => {
      fetchEcsList();
    }, 2000);
  } catch (error) {
    message.error(`停止实例 ${record.instance_name} 失败`);
    console.error('停止实例失败:', error);
  } finally {
    hide();
  }
};

const restartEcs = async (record: ResourceEcs) => {
  const hide = message.loading(`正在重启实例 ${record.instance_name}...`, 0);

  try {
    const req: RestartEcsReq = {
      provider: record.cloud_provider,
      region: record.region_id,
      instanceId: record.instance_id
    };

    await restartEcsResource(req);
    message.success(`实例 ${record.instance_name} 正在重启中`);

    // 更新实例状态
    record.status = 'Stopping';

    // 如果是详情抽屉中的实例，也更新状态
    if (instanceDetail.value && instanceDetail.value.instance_id === record.instance_id) {
      instanceDetail.value.status = 'Stopping';
    }

    // 刷新列表
    setTimeout(() => {
      fetchEcsList();
    }, 3000);
  } catch (error) {
    message.error(`重启实例 ${record.instance_name} 失败`);
    console.error('重启实例失败:', error);
  } finally {
    hide();
  }
};

const confirmDelete = (record: ResourceEcs) => {
  Modal.confirm({
    title: '确认删除',
    content: `您确定要删除实例 "${record.instance_name}" 吗？此操作不可恢复。`,
    okText: '确认',
    okType: 'danger',
    cancelText: '取消',
    onOk() {
      deleteEcs(record);
    },
  });
};

const deleteEcs = async (record: ResourceEcs) => {
  const hide = message.loading(`正在删除实例 ${record.instance_name}...`, 0);

  try {
    const req: DeleteEcsReq = {
      provider: record.cloud_provider,
      region: record.region_id,
      instanceId: record.instance_id
    };

    await deleteEcsResource(req);
    message.success(`实例 ${record.instance_name} 已成功删除`);

    // 关闭抽屉(如果打开)
    if (detailDrawerVisible.value && instanceDetail.value && instanceDetail.value.instance_id === record.instance_id) {
      detailDrawerVisible.value = false;
    }

    // 刷新列表
    fetchEcsList();
  } catch (error) {
    message.error(`删除实例 ${record.instance_name} 失败`);
    console.error('删除实例失败:', error);
  } finally {
    hide();
  }
};

// 创建实例相关函数
const showCreateModal = () => {
  createModalVisible.value = true;
  currentStep.value = 0;

  // 重置表单
  Object.assign(createForm, {
    provider: 'aliyun',
    region: '',
    imageId: '',
    instanceType: '',
    amount: 1,
    zoneId: '',
    vSwitchId: '',
    securityGroupIds: [],
    hostnamePrefix: '',
    hostname: '',
    password: '',
    instanceName: '',
    payType: '',
    instanceChargeType: '',
    spotStrategy: 'NoSpot',
    description: '',
    systemDiskCategory: '',
    systemDiskSize: 40,
    dataDiskCategory: '',
    dataDiskSize: 100,
    dryRun: false,
    tags: {},
    periodUnit: 'Month',
    period: 1,
    autoRenew: false,
    spotDuration: 1,
  });
  tagsArray.value = [];
  tagInputValue.value = '';
};

// 表单步骤控制
const nextStep = () => {
  if (currentStep.value < 3) {
    currentStep.value += 1;
  }
};

const prevStep = () => {
  if (currentStep.value > 0) {
    currentStep.value -= 1;
  }
};

// 标签处理
const addTag = () => {
  if (tagInputValue.value && tagInputValue.value.includes('=')) {
    tagsArray.value.push(tagInputValue.value as never);

    // 更新标签对象
    const parts = tagInputValue.value.split('=');
    if (parts.length === 2 && createForm.tags) {
      const key = parts[0]?.trim();
      const value = parts[1]?.trim();
      if (key && value) {
        createForm.tags[key] = value;
      } else {
        message.warning('标签格式不正确，请确保包含 key=value 格式');
      }
    }

    tagInputValue.value = '';
  } else {
    message.warning('标签格式应为 key=value');
  }
};

const removeTag = (index: number) => {
  if (index >= 0 && index < tagsArray.value.length) {
    const tag = tagsArray.value[index];
    if (tag) {
      const parts = tag.split('=');
      if (parts.length === 2 && createForm.tags) {
        const key = parts[0]?.trim();
        delete createForm.tags[key as string];
      }

      tagsArray.value.splice(index, 1);
    }
  }
};

// 表单提交
const handleCreateSubmit = async () => {
  createLoading.value = true;

  // 同步instanceChargeType和payType
  createForm.instanceChargeType = createForm.payType;

  try {
    const createParams = {
      periodUnit: createForm.periodUnit,
      period: createForm.period,
      autoRenew: createForm.autoRenew,
      instanceChargeType: createForm.instanceChargeType,
      spotStrategy: createForm.spotStrategy,
      spotDuration: createForm.spotDuration,
      systemDiskSize: createForm.systemDiskSize,
      dataDiskSize: createForm.dataDiskSize,
      dataDiskCategory: createForm.dataDiskCategory,
      dryRun: createForm.dryRun,
      tags: createForm.tags
    };

    await createEcsResource(createParams);
    message.success('ECS实例创建成功');
    createModalVisible.value = false;

    // 刷新列表
    fetchEcsList();
  } catch (error) {
    message.error('创建ECS实例失败');
    console.error('创建ECS实例失败:', error);
  } finally {
    createLoading.value = false;
  }
};

// 下拉菜单选项变更处理
const handleProviderChange = async (value: string) => {
  createForm.payType = '';
  createForm.region = '';
  createForm.zoneId = '';
  createForm.instanceType = '';
  createForm.systemDiskCategory = '';
  createForm.dataDiskCategory = '';

  // 重置所有选项
  regionOptions.value = [];
  zoneOptions.value = [];
  instanceTypeOptions.value = [];
  systemDiskOptions.value = [];
  dataDiskOptions.value = [];

  // 获取支持的地域列表
  try {
    const req: ListInstanceOptionsReq = { provider: value };
    const response = await getInstanceOptions(req);
    console.log(response);
    regionOptions.value = response.data;
  } catch (error) {
    message.error('获取地域列表失败');
  }
};

const handlePayTypeChange = async (value: string) => {
  createForm.region = '';
  createForm.zoneId = '';
  createForm.instanceType = '';
  createForm.systemDiskCategory = '';
  createForm.dataDiskCategory = '';

  // 重置依赖选项
  zoneOptions.value = [];
  instanceTypeOptions.value = [];
  systemDiskOptions.value = [];
  dataDiskOptions.value = [];

  regionOptions.value = [
    { region: 'cn-beijing', valid: true, dataDiskCategory: '', systemDiskCategory: '', instanceType: '', zone: '', payType: '', cpu: 0, memory: 0 },
    { region: 'cn-hangzhou', valid: true, dataDiskCategory: '', systemDiskCategory: '', instanceType: '', zone: '', payType: '', cpu: 0, memory: 0 },
    { region: 'cn-shanghai', valid: true, dataDiskCategory: '', systemDiskCategory: '', instanceType: '', zone: '', payType: '', cpu: 0, memory: 0 },
    { region: 'cn-shenzhen', valid: true, dataDiskCategory: '', systemDiskCategory: '', instanceType: '', zone: '', payType: '', cpu: 0, memory: 0 },
    { region: 'cn-hongkong', valid: true, dataDiskCategory: '', systemDiskCategory: '', instanceType: '', zone: '', payType: '', cpu: 0, memory: 0 }
  ];
};

const handleRegionChange = async (value: string) => {
  createForm.zoneId = '';
  createForm.instanceType = '';
  createForm.systemDiskCategory = '';
  createForm.dataDiskCategory = '';

  // 重置依赖选项
  zoneOptions.value = [];
  instanceTypeOptions.value = [];
  systemDiskOptions.value = [];
  dataDiskOptions.value = [];

  // 获取可用区列表
  try {
    const req: ListInstanceOptionsReq = {
      provider: createForm.provider,
      payType: createForm.payType,
      region: value
    };
    const response = await getInstanceOptions(req);
    zoneOptions.value = response;
  } catch (error) {
    console.error('获取可用区列表失败:', error);
    message.error('获取可用区列表失败');
  }
};

const handleZoneChange = async (value: string) => {
  createForm.instanceType = '';
  createForm.systemDiskCategory = '';
  createForm.dataDiskCategory = '';

  // 重置依赖选项
  instanceTypeOptions.value = [];
  systemDiskOptions.value = [];
  dataDiskOptions.value = [];

  // 获取实例规格列表
  try {
    const req: ListInstanceOptionsReq = {
      provider: createForm.provider,
      payType: createForm.payType,
      region: createForm.region,
      zone: value
    };
    const response = await getInstanceOptions(req);
    instanceTypeOptions.value = response;
  } catch (error) {
    console.error('获取实例规格列表失败:', error);
    message.error('获取实例规格列表失败');
  }
};

const handleInstanceTypeChange = async (value: string) => {
  createForm.systemDiskCategory = '';
  createForm.dataDiskCategory = '';

  // 重置依赖选项
  systemDiskOptions.value = [];
  dataDiskOptions.value = [];

  // 获取系统盘类型列表
  try {
    const req: ListInstanceOptionsReq = {
      provider: createForm.provider,
      payType: createForm.payType,
      region: createForm.region,
      zone: createForm.zoneId,
      instanceType: value
    };
    const response = await getInstanceOptions(req);
    console.log(response);
    // 假设接口返回系统盘类型列表
    systemDiskOptions.value = response;
  } catch (error) {
    console.error('获取系统盘类型列表失败:', error);
    message.error('获取系统盘类型列表失败');
  }
};

const handleSystemDiskCategoryChange = async (value: string) => {
  createForm.dataDiskCategory = '';

  // 重置依赖选项
  dataDiskOptions.value = [];

  // 获取数据盘类型列表
  try {
    const req: ListInstanceOptionsReq = {
      provider: createForm.provider,
      payType: createForm.payType,
      region: createForm.region,
      zone: createForm.zoneId,
      instanceType: createForm.instanceType,
      systemDiskCategory: value
    };
    const response = await getInstanceOptions(req);
    console.log(response);
    // 假设接口返回数据盘类型列表
    dataDiskOptions.value = response;
  } catch (error) {
    console.error('获取数据盘类型列表失败:', error);
    message.error('获取数据盘类型列表失败');
  }
};

const handleDataDiskCategoryChange = (value: string) => {
};
</script>

<style scoped>
/* 全局容器样式 */
.ecs-management-container {
  padding: 24px;
  height: 100%;
}

/* 标题栏样式 */
.header-section {
  margin-bottom: 24px;
}

.page-title {
  font-size: 24px;
  font-weight: bold;
  margin: 0;
  background: linear-gradient(90deg, #1890ff, #52c41a);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 0 10px rgba(24, 144, 255, 0.3);
}

.header-actions {
  display: flex;
  justify-content: flex-end;
}

/* 卡片样式 */
.filter-card {
  margin-bottom: 24px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.search-buttons {
  display: flex;
  justify-content: flex-end;
  align-items: flex-end;
}

.reset-btn {
  margin-left: 8px;
}

.ecs-list-card {
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

/* 表格操作按钮样式 */
.action-buttons {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 8px;
}

.detail-btn {
  color: var(--ant-primary-color, #1890ff);
}

/* 创建实例弹窗样式 */
.create-steps {
  margin-bottom: 24px;
}

.create-form {
  max-height: 500px;
  overflow-y: auto;
  padding: 0 12px;
}

.steps-action {
  margin-top: 24px;
  display: flex;
  justify-content: flex-end;
}

/* 标签列表 */
.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 20px;
}

.drawer-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 24px;
}

/* 标签输入容器 */
.tag-input-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.tag-item {
  margin-bottom: 4px;
}

/* 表单项间距 */
:deep(.ant-form-item) {
  margin-bottom: 20px;
}

/* 标签样式 */
:deep(.ant-tag) {
  margin-right: 0;
}
</style>
