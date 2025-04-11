<template>
  <div class="work-order-detail">
    <div class="header">
      <h1>工单详情</h1>
      <a-tag :color="getStatusColor(workOrderData.status)" class="status-tag">
        {{ workOrderData.status }}
      </a-tag>
    </div>

    <a-card class="info-card dark">
      <a-descriptions bordered>
        <a-descriptions-item label="工单编号">{{ workOrderData.id }}</a-descriptions-item>
        <a-descriptions-item label="标题">{{ workOrderData.title }}</a-descriptions-item>
        <a-descriptions-item label="优先级">
          <a-tag :color="getPriorityColor(workOrderData.priority)">
            {{ workOrderData.priority }}
          </a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="创建时间">{{ workOrderData.createTime }}</a-descriptions-item>
        <a-descriptions-item label="创建人">{{ workOrderData.creator }}</a-descriptions-item>
        <a-descriptions-item label="处理人">{{ workOrderData.handler }}</a-descriptions-item>
        <a-descriptions-item label="描述" :span="3">{{ workOrderData.description }}</a-descriptions-item>
      </a-descriptions>
    </a-card>

    <a-card title="处理记录" class="history-card dark">
      <a-timeline>
        <a-timeline-item v-for="record in workOrderData.history" :key="record.time">
          <template #dot>
            <CheckCircleOutlined v-if="record.type === 'complete'" style="color: #52c41a" />
            <ClockCircleOutlined v-else-if="record.type === 'process'" style="color: #1890ff" />
            <ExclamationCircleOutlined v-else style="color: #faad14" />
          </template>
          <p class="record-time">{{ record.time }}</p>
          <p class="record-operator">操作人: {{ record.operator }}</p>
          <p class="record-content">{{ record.content }}</p>
        </a-timeline-item>
      </a-timeline>
    </a-card>

    <div class="action-bar">
      <a-button type="primary" @click="handleProcess" :disabled="workOrderData.status === '已完成'">
        处理工单
      </a-button>
      <a-button @click="handleClose" :disabled="workOrderData.status === '已完成'">
        关闭工单
      </a-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import { useRouter } from 'vue-router';
import { CheckCircleOutlined, ClockCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons-vue';

const router = useRouter();

interface WorkOrderHistory {
  time: string;
  operator: string;
  content: string;
  type: 'create' | 'process' | 'complete';
}

interface WorkOrderDetail {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  createTime: string;
  creator: string;
  handler: string;
  history: WorkOrderHistory[];
}

const workOrderData = ref<WorkOrderDetail>({
  id: 'WO-2025001',
  title: '生产环境Kubernetes集群性能优化',
  description: '生产环境Kubernetes集群出现性能瓶颈，需要进行全面优化。包括但不限于：\n1. 节点资源使用率优化\n2. 网络性能调优\n3. 存储系统优化\n4. 监控告警体系完善',
  status: '处理中',
  priority: '紧急',
  createTime: '2025-12-01 10:00:00',
  creator: '张工',
  handler: '李四',
  history: [
    {
      time: '2025-12-01 10:00:00',
      operator: '张工',
      content: '创建工单',
      type: 'create'
    },
    {
      time: '2025-12-01 11:30:00',
      operator: '张工',
      content: '接受工单，开始处理。初步分析发现节点CPU使用率过高',
      type: 'process'
    },
    {
      time: '2025-12-01 15:00:00',
      operator: '张工',
      content: '完成节点资源使用率优化，开始进行网络性能调优',
      type: 'process'
    }
  ]
});

const mockData: WorkOrderDetail = {
  id: 'WO-2025001',
  title: '生产环境Kubernetes集群性能优化',
  description: '生产环境Kubernetes集群出现性能瓶颈，需要进行全面优化。包括但不限于：\n1. 节点资源使用率优化\n2. 网络性能调优\n3. 存储系统优化\n4. 监控告警体系完善',
  status: '处理中',
  priority: '紧急',
  createTime: '2025-12-01 10:00:00',
  creator: '张三',
  handler: '李四',
  history: [
    {
      time: '2025-12-01 10:00:00',
      operator: '张三',
      content: '创建工单',
      type: 'create'
    },
    {
      time: '2025-12-01 11:30:00',
      operator: '李四',
      content: '接受工单，开始处理。初步分析发现节点CPU使用率过高',
      type: 'process'
    },
    {
      time: '2025-12-01 15:00:00',
      operator: '李四',
      content: '完成节点资源使用率优化，开始进行网络性能调优',
      type: 'process'
    }
  ]
};

onMounted(() => {
  workOrderData.value = mockData;
});

const getStatusColor = (status: string) => {
  const colorMap: Record<string, string> = {
    '待处理': 'orange',
    '处理中': 'blue',
    '已完成': 'green'
  };
  return colorMap[status] || 'default';
};

const getPriorityColor = (priority: string) => {
  const colorMap: Record<string, string> = {
    '紧急': 'red',
    '高': 'orange',
    '中': 'blue',
    '低': 'green'
  };
  return colorMap[priority] || 'default';
};

const handleProcess = () => {
  message.success('开始处理工单');
  router.push('/workorder_list');
};

const handleClose = () => {
  message.success('工单已关闭');
  router.push('/workorder_list');
};
</script>

<style scoped lang="less">
.work-order-detail {
  padding: 24px;
  background: #141414;
  color: rgba(255, 255, 255, 0.85);

  .header {
    display: flex;
    align-items: center;
    margin-bottom: 24px;

    h1 {
      margin: 0;
      margin-right: 16px;
      color: rgba(255, 255, 255, 0.85);
    }

    .status-tag {
      font-size: 16px;
    }
  }

  .info-card {
    margin-bottom: 24px;
    background: #1f1f1f;
    border: 1px solid #303030;

    :deep(.ant-descriptions-item-label) {
      color: rgba(255, 255, 255, 0.85);
      background: #262626;
    }

    :deep(.ant-descriptions-item-content) {
      color: rgba(255, 255, 255, 0.65);
      background: #1f1f1f;
    }
  }

  .history-card {
    margin-bottom: 24px;
    background: #1f1f1f;
    border: 1px solid #303030;

    :deep(.ant-card-head) {
      color: rgba(255, 255, 255, 0.85);
      background: #1f1f1f;
      border-bottom: 1px solid #303030;
    }

    .record-time {
      font-weight: bold;
      margin-bottom: 4px;
      color: rgba(255, 255, 255, 0.85);
    }

    .record-operator {
      color: rgba(255, 255, 255, 0.45);
      margin-bottom: 4px;
    }

    .record-content {
      color: rgba(255, 255, 255, 0.65);
    }
  }

  .action-bar {
    display: flex;
    gap: 16px;
    justify-content: center;
  }
}
</style>
