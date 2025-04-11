<template>
  <div class="work-order-management dark">
    <div class="page-header">
      <h1>工单管理系统</h1>
      <div class="header-actions">
        <a-button type="primary" @click="showCreateModal">创建工单</a-button>
      </div>
    </div>

    <div class="dashboard-cards">
      <a-row :gutter="16">
        <a-col :span="6">
          <a-card class="stat-card">
            <template #title>
              <span class="card-title">待处理工单</span>
            </template>
            <div class="stat-number">{{ pendingCount }}</div>
            <div class="stat-trend">
              <span class="trend-up">↑12%</span> 较上周
            </div>
          </a-card>
        </a-col>
        <a-col :span="6">
          <a-card class="stat-card">
            <template #title>
              <span class="card-title">处理中工单</span>
            </template>
            <div class="stat-number">{{ processingCount }}</div>
            <div class="stat-trend">
              <span class="trend-down">↓5%</span> 较上周
            </div>
          </a-card>
        </a-col>
        <a-col :span="6">
          <a-card class="stat-card">
            <template #title>
              <span class="card-title">已完成工单</span>
            </template>
            <div class="stat-number">{{ completedCount }}</div>
            <div class="stat-trend">
              <span class="trend-up">↑8%</span> 较上周
            </div>
          </a-card>
        </a-col>
        <a-col :span="6">
          <a-card class="stat-card">
            <template #title>
              <span class="card-title">平均处理时长</span>
            </template>
            <div class="stat-number">2.5h</div>
            <div class="stat-trend">
              <span class="trend-down">↓10%</span> 较上周
            </div>
          </a-card>
        </a-col>
      </a-row>
    </div>

    <div class="main-content">
      <a-tabs v-model:activeKey="activeTab" class="dark-tabs">
        <a-tab-pane key="1" tab="全部工单">
          <work-order-list />
        </a-tab-pane>
        <a-tab-pane key="2" tab="我创建的">
          <work-order-list :filter="'created'" />
        </a-tab-pane>
        <a-tab-pane key="3" tab="待我处理">
          <work-order-list :filter="'assigned'" />
        </a-tab-pane>
      </a-tabs>
    </div>

    <a-modal v-model:visible="createModalVisible" title="创建工单" @ok="handleCreateWorkOrder" @cancel="handleCancel"
      okText="创建" cancelText="取消">
      <a-form :model="formState" layout="vertical">
        <a-form-item label="工单标题" name="title">
          <a-input v-model:value="formState.title" placeholder="请输入工单标题" />
        </a-form-item>
        <a-form-item label="工单描述" name="description">
          <a-textarea v-model:value="formState.description" placeholder="请输入工单描述" :rows="4" />
        </a-form-item>
        <a-form-item label="优先级" name="priority">
          <a-select v-model:value="formState.priority">
            <a-select-option value="紧急">紧急</a-select-option>
            <a-select-option value="高">高</a-select-option>
            <a-select-option value="中">中</a-select-option>
            <a-select-option value="低">低</a-select-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import WorkOrderList from './WorkOrderList.vue';
import { message } from 'ant-design-vue';

const activeTab = ref('1');
const createModalVisible = ref(false);

const pendingCount = ref(12);
const processingCount = ref(8);
const completedCount = ref(45);

const formState = reactive({
  title: '',
  description: '',
  priority: '中'
});

const showCreateModal = () => {
  createModalVisible.value = true;
};

const handleCancel = () => {
  createModalVisible.value = false;
  formState.title = '';
  formState.description = '';
  formState.priority = '中';
};

const handleCreateWorkOrder = () => {
  if (!formState.title || !formState.description) {
    message.error('请填写完整工单信息');
    return;
  }

  message.success('工单创建成功');
  handleCancel();
};
</script>

<style scoped lang="less">
.work-order-management {
  padding: 24px;
  background: #141414;
  min-height: 100vh;

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;

    h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 500;
      color: rgba(255, 255, 255, 0.85);
    }
  }

  .dashboard-cards {
    margin-bottom: 24px;

    .stat-card {
      border-radius: 8px;
      background: #1f1f1f;
      border: 1px solid #303030;

      :deep(.ant-card-head) {
        border-bottom: 1px solid #303030;
      }

      .card-title {
        font-size: 14px;
        color: rgba(255, 255, 255, 0.85);
      }

      .stat-number {
        font-size: 24px;
        font-weight: 500;
        margin: 16px 0;
        color: rgba(255, 255, 255, 0.85);
      }

      .stat-trend {
        font-size: 12px;
        color: rgba(255, 255, 255, 0.45);

        .trend-up {
          color: #52c41a;
        }

        .trend-down {
          color: #ff4d4f;
        }
      }
    }
  }

  .main-content {
    background: #1f1f1f;
    padding: 24px;
    border-radius: 8px;
    border: 1px solid #303030;

    :deep(.ant-tabs-tab) {
      color: rgba(255, 255, 255, 0.65);

      &:hover {
        color: #1890ff;
      }
    }

    :deep(.ant-tabs-tab-active) {
      .ant-tabs-tab-btn {
        color: #1890ff;
      }
    }

    :deep(.ant-tabs-ink-bar) {
      background: #1890ff;
    }
  }
}
</style>
