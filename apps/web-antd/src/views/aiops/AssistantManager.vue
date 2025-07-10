<template>
  <div class="assistant-manager-container">
    <div class="header">
      <h1 class="title">AI助手管理中心</h1>
      <div class="actions">
        <a-button type="primary" @click="refreshHealth" :loading="healthLoading">
          <template #icon><sync-outlined /></template>
          刷新状态
        </a-button>
        <a-button @click="showAddDocumentModal">
          <template #icon><file-add-outlined /></template>
          添加文档
        </a-button>
        <a-button @click="refreshKnowledge" :loading="refreshLoading">
          <template #icon><reload-outlined /></template>
          刷新知识库
        </a-button>
        <a-button @click="clearCache" :loading="clearLoading">
          <template #icon><clear-outlined /></template>
          清除缓存
        </a-button>
      </div>
    </div>

    <!-- 系统状态卡片 -->
    <div class="dashboard">
      <div class="status-cards">
        <a-card class="status-card" :loading="healthLoading">
          <template #title>
            <heart-outlined /> 助手健康状态
          </template>
          <div class="status-content">
            <a-tag :color="healthStatus?.status === 'healthy' ? 'green' : 'orange'" size="large">
              {{ healthStatus?.status === 'healthy' ? '正常运行' : '部分降级' }}
            </a-tag>
            <div class="health-details">
              <div class="health-item">
                <span>运行时间:</span>
                <span>{{ formatUptime(healthStatus?.uptime || 0) }}</span>
              </div>
              <div class="health-item">
                <span>版本:</span>
                <span>{{ healthStatus?.version || 'v1.0.0' }}</span>
              </div>
              <div class="health-item">
                <span>更新时间:</span>
                <span>{{ healthStatus?.timestamp || '--' }}</span>
              </div>
            </div>
          </div>
        </a-card>

        <a-card class="status-card">
          <template #title>
            <robot-outlined /> 组件状态
          </template>
          <div class="component-status">
            <div v-for="(status, component) in healthStatus?.components" :key="component" class="component-item">
              <span>{{ formatComponentName(component as any) }}:</span>
              <a-tag :color="status ? 'green' : 'red'" size="small">
                {{ status ? '正常' : '异常' }}
              </a-tag>
            </div>
          </div>
        </a-card>

        <a-card class="status-card">
          <template #title>
            <message-outlined /> 会话管理
          </template>
          <div class="session-info">
            <div class="session-item">
              <span>活跃会话:</span>
              <span>{{ sessionHistory.length }}</span>
            </div>
            <div class="session-item">
              <span>总查询数:</span>
              <span>{{ totalQueries }}</span>
            </div>
            <div class="session-actions">
              <a-button type="primary" size="small" @click="createNewSession" :loading="sessionLoading">
                创建新会话
              </a-button>
            </div>
          </div>
        </a-card>

        <a-card class="status-card">
          <template #title>
            <database-outlined /> 知识库状态
          </template>
          <div class="knowledge-info">
            <div class="knowledge-item">
              <span>文档数量:</span>
              <span>{{ knowledgeStats.documentsCount }}</span>
            </div>
            <div class="knowledge-item">
              <span>最后更新:</span>
              <span>{{ knowledgeStats.lastUpdate || '--' }}</span>
            </div>
            <div class="knowledge-actions">
              <a-tag :color="knowledgeStats.isHealthy ? 'green' : 'red'" size="small">
                {{ knowledgeStats.isHealthy ? '正常' : '需要更新' }}
              </a-tag>
            </div>
          </div>
        </a-card>
      </div>

      <!-- 助手查询测试 -->
      <a-card title="助手查询测试" class="query-card">
        <div class="query-controls">
          <div class="form-item">
            <label>会话ID:</label>
            <a-select v-model:value="queryForm.session_id" style="width: 100%" placeholder="选择会话或创建新会话">
              <a-select-option value="">创建新会话</a-select-option>
              <a-select-option v-for="session in sessionHistory" :key="session.id" :value="session.id">
                {{ session.name }} ({{ session.queries }}条查询)
              </a-select-option>
            </a-select>
          </div>
          <div class="form-item">
            <label>查询问题:</label>
            <a-textarea v-model:value="queryForm.question" placeholder="输入您想咨询的问题..." :rows="3" />
          </div>
          <a-row :gutter="16">
            <a-col :span="12">
              <div class="form-item">
                <a-checkbox v-model:checked="queryForm.use_web_search">启用网络搜索</a-checkbox>
              </div>
            </a-col>
            <a-col :span="12">
              <div class="form-item">
                <label>最大上下文文档数:</label>
                <a-input-number v-model:value="queryForm.max_context_docs" :min="1" :max="20" style="width: 100%" />
              </div>
            </a-col>
          </a-row>
          <div class="form-actions">
            <a-button type="primary" @click="executeQuery" :loading="queryLoading">
              <template #icon><search-outlined /></template>
              执行查询
            </a-button>
            <a-button @click="resetQueryForm">重置</a-button>
          </div>
        </div>
      </a-card>

      <!-- 查询历史 -->
      <a-card title="查询历史" class="history-card">
        <a-table :dataSource="queryHistory" :columns="queryColumns" :pagination="{ pageSize: 10 }" size="middle">
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'question'">
              <a-tooltip :title="record.question">
                <span class="ellipsis-text">{{ record.question }}</span>
              </a-tooltip>
            </template>
            <template v-if="column.key === 'answer'">
              <a-tooltip :title="record.answer">
                <span class="ellipsis-text">{{ record.answer }}</span>
              </a-tooltip>
            </template>
            <template v-if="column.key === 'use_web_search'">
              <a-tag :color="record.use_web_search ? 'blue' : 'default'" size="small">
                {{ record.use_web_search ? '是' : '否' }}
              </a-tag>
            </template>
            <template v-if="column.key === 'actions'">
              <a-button type="link" size="small" @click="showQueryDetails(record)">查看详情</a-button>
            </template>
          </template>
        </a-table>
      </a-card>
    </div>

    <!-- 添加文档模态框 -->
    <a-modal v-model:visible="addDocumentModalVisible" title="添加文档到知识库" width="600px" @ok="addDocument"
      :confirmLoading="addDocumentLoading">
      <div class="add-document-form">
        <div class="form-item">
          <label>文档内容:</label>
          <a-textarea v-model:value="documentForm.content" :rows="8" placeholder="输入文档内容..." />
        </div>
        <div class="form-item">
          <label>来源:</label>
          <a-input v-model:value="documentForm.metadata!.source" placeholder="文档来源" />
        </div>
        <div class="form-item">
          <label>作者:</label>
          <a-input v-model:value="documentForm.metadata!.author" placeholder="文档作者" />
        </div>
      </div>
    </a-modal>

    <!-- 查询详情模态框 -->
    <a-modal v-model:visible="queryDetailModalVisible" title="查询详情" width="800px" :footer="null">
      <div class="query-details" v-if="selectedQuery">
        <a-descriptions :column="2" bordered size="small">
          <a-descriptions-item label="查询ID">{{ selectedQuery.id }}</a-descriptions-item>
          <a-descriptions-item label="会话ID">{{ selectedQuery.session_id }}</a-descriptions-item>
          <a-descriptions-item label="查询时间">{{ selectedQuery.timestamp }}</a-descriptions-item>
          <a-descriptions-item label="网络搜索">
            <a-tag :color="selectedQuery.use_web_search ? 'blue' : 'default'" size="small">
              {{ selectedQuery.use_web_search ? '是' : '否' }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="上下文文档数">{{ selectedQuery.max_context_docs }}</a-descriptions-item>
        </a-descriptions>

        <div class="query-content">
          <h4>问题:</h4>
          <a-alert :message="selectedQuery.question" type="info" />
        </div>

        <div class="query-content">
          <h4>回答:</h4>
          <a-alert :message="selectedQuery.answer" type="success" />
        </div>

        <div class="query-sources" v-if="selectedQuery.sources?.length">
          <h4>参考来源:</h4>
          <a-list :dataSource="selectedQuery.sources" item-layout="vertical" size="small">
            <template #renderItem="{ item }">
              <a-list-item>
                <a-list-item-meta>
                  <template #title>
                    <a :href="item.url" target="_blank" v-if="item.url">{{ item.title || '未命名来源' }}</a>
                    <span v-else>{{ item.title || '未命名来源' }}</span>
                  </template>
                  <template #description>
                    {{ item.content || '无内容摘要' }}
                  </template>
                </a-list-item-meta>
              </a-list-item>
            </template>
          </a-list>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, reactive } from 'vue';
import { message } from 'ant-design-vue';
import {
  SyncOutlined,
  HeartOutlined,
  RobotOutlined,
  MessageOutlined,
  DatabaseOutlined,
  FileAddOutlined,
  ReloadOutlined,
  ClearOutlined,
  SearchOutlined
} from '@ant-design/icons-vue';
import {
  getHealthCheck,
  createAssistantSession,
  queryAssistant,
  refreshKnowledgeBase,
  addDocumentToKnowledgeBase,
  clearAssistantCache,
} from '#/api/core/assistant';

// 状态管理
const healthLoading = ref(false);
const sessionLoading = ref(false);
const queryLoading = ref(false);
const refreshLoading = ref(false);
const clearLoading = ref(false);
const addDocumentLoading = ref(false);

// 模态框状态
const addDocumentModalVisible = ref(false);
const queryDetailModalVisible = ref(false);
const selectedQuery = ref<any>(null);

// 健康状态
const healthStatus = ref<any>({
  code: 0,
  message: '',
  data: {
    status: 'unknown',
    timestamp: '',
    uptime: 0,
    version: '',
    components: {}
  }
});

// 知识库状态
const knowledgeStats = reactive({
  documentsCount: 0,
  lastUpdate: '',
  isHealthy: true
});

// 会话管理
const sessionHistory = ref<Array<{ id: string; name: string; queries: number; created: string }>>([]);
const totalQueries = ref(0);

// 查询表单
const queryForm = reactive<any>({
  question: '',
  session_id: '',
  use_web_search: false,
  max_context_docs: 5
});

// 文档表单
const documentForm = reactive<any>({
  content: '',
  metadata: {
    source: '',
    author: ''
  }
});

// 查询历史
const queryHistory = ref<Array<any>>([]);

// 表格列定义
const queryColumns = [
  { title: 'ID', dataIndex: 'id', key: 'id', width: 120 },
  { title: '问题', dataIndex: 'question', key: 'question', ellipsis: true, width: 200 },
  { title: '回答', dataIndex: 'answer', key: 'answer', ellipsis: true, width: 250 },
  { title: '会话ID', dataIndex: 'session_id', key: 'session_id', width: 150 },
  { title: '网络搜索', dataIndex: 'use_web_search', key: 'use_web_search', width: 100 },
  { title: '时间', dataIndex: 'timestamp', key: 'timestamp', width: 150 },
  { title: '操作', key: 'actions', width: 100 }
];

// API调用函数
const fetchHealthCheck = async () => {
  try {
    healthLoading.value = true;
    const response = await getHealthCheck();
    healthStatus.value = response;
  } catch (error: any) {
    console.error('获取健康状态失败:', error);
    message.error('获取健康状态失败');
  } finally {
    healthLoading.value = false;
  }
};

const createNewSession = async () => {
  try {
    sessionLoading.value = true;
    const response = await createAssistantSession();

    if (response) {
      const newSession = {
        id: response.session_id,
        name: `会话-${new Date().toLocaleTimeString()}`,
        queries: 0,
        created: new Date().toLocaleString()
      };
      sessionHistory.value.unshift(newSession);
      queryForm.session_id = response.session_id;
      message.success('新会话创建成功');
    } else {
      message.error('创建会话失败');
    }
  } catch (error: any) {
    console.error('创建会话失败:', error);
    message.error(`创建会话失败: ${error.message}`);
  } finally {
    sessionLoading.value = false;
  }
};

const executeQuery = async () => {
  if (!queryForm.question.trim()) {
    message.warning('请输入查询问题');
    return;
  }

  try {
    queryLoading.value = true;

    // 如果没有选择会话，创建新会话
    if (!queryForm.session_id) {
      await createNewSession();
    }

    const response = await queryAssistant(queryForm);

    if (response) {
      // 添加到查询历史
      const historyItem = {
        id: `Q-${Date.now()}`,
        question: queryForm.question,
        answer: response.answer,
        session_id: response.session_id,
        use_web_search: queryForm.use_web_search,
        max_context_docs: queryForm.max_context_docs,
        sources: response.sources,
        timestamp: new Date().toLocaleString()
      };
      queryHistory.value.unshift(historyItem);

      // 更新会话查询计数
      const session = sessionHistory.value.find(s => s.id === response.session_id);
      if (session) {
        session.queries++;
      }
      totalQueries.value++;

      message.success('查询执行成功');
      resetQueryForm();
    } else {
      message.error('查询执行失败');
    }
  } catch (error: any) {
    console.error('查询执行失败:', error);
    message.error(`查询执行失败: ${error.message}`);
  } finally {
    queryLoading.value = false;
  }
};

const refreshKnowledge = async () => {
  try {
    refreshLoading.value = true;
    const response = await refreshKnowledgeBase();

    if (response) {
      knowledgeStats.documentsCount = response.documents_count || 0;
      knowledgeStats.lastUpdate = new Date().toLocaleString();
      knowledgeStats.isHealthy = true;
      message.success('知识库刷新成功');
    } else {
      message.error('知识库刷新失败');
    }
  } catch (error: any) {
    console.error('刷新知识库失败:', error);
    message.error(`刷新知识库失败: ${error.message}`);
  } finally {
    refreshLoading.value = false;
  }
};

const addDocument = async () => {
  if (!documentForm.content.trim()) {
    message.warning('请输入文档内容');
    return;
  }

  try {
    addDocumentLoading.value = true;
    const response = await addDocumentToKnowledgeBase(documentForm);

    if (response?.success) {
      message.success('文档添加成功');
      addDocumentModalVisible.value = false;
      knowledgeStats.documentsCount++;

      // 重置表单
      Object.assign(documentForm, {
        content: '',
        metadata: { source: '', author: '' }
      });
    } else {
      message.error('文档添加失败');
    }
  } catch (error: any) {
    console.error('添加文档失败:', error);
    message.error(`添加文档失败: ${error.message}`);
  } finally {
    addDocumentLoading.value = false;
  }
};

const clearCache = async () => {
  try {
    clearLoading.value = true;
    const response = await clearAssistantCache();

    if (response) {
      message.success('缓存清除成功');
    } else {
      message.error('缓存清除失败');
    }
  } catch (error: any) {
    console.error('清除缓存失败:', error);
    message.error(`清除缓存失败: ${error.message}`);
  } finally {
    clearLoading.value = false;
  }
};

// 工具函数
const formatUptime = (uptime: number): string => {
  if (!uptime) return '未知';
  const hours = Math.floor(uptime / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  return `${hours}小时${minutes}分钟`;
};

const formatComponentName = (component: string): string => {
  const nameMap: Record<string, string> = {
    llm: 'LLM引擎',
    knowledge_base: '知识库',
    embeddings: '向量嵌入',
    cache: '缓存系统'
  };
  return nameMap[component] || component;
};

// 事件处理
const refreshHealth = async () => {
  await fetchHealthCheck();
  message.success('健康状态已刷新');
};

const showAddDocumentModal = () => {
  addDocumentModalVisible.value = true;
};

const resetQueryForm = () => {
  queryForm.question = '';
  queryForm.use_web_search = false;
  queryForm.max_context_docs = 5;
};

const showQueryDetails = (record: any) => {
  selectedQuery.value = record;
  queryDetailModalVisible.value = true;
};

// 生命周期
onMounted(() => {
  fetchHealthCheck();
});
</script>

<style scoped>
.assistant-manager-container {
  padding: 20px;
  min-height: 100vh;
  background-color: var(--ant-background-color-light);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.title {
  font-size: 24px;
  font-weight: bold;
  margin: 0;
  background: linear-gradient(90deg, #1890ff, #52c41a);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.actions {
  display: flex;
  gap: 12px;
}

.dashboard {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.status-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.status-card {
  border-radius: 8px;
  transition: all 0.3s ease;
  border: 1px solid #d9d9d9;
}

.status-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.status-content {
  padding: 10px 0;
}

.health-details {
  margin-top: 12px;
}

.health-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 14px;
}

.health-item span:first-child {
  color: #666;
  font-weight: 500;
}

.component-status {
  padding: 10px 0;
}

.component-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 14px;
}

.component-item span:first-child {
  color: #666;
  font-weight: 500;
}

.session-info,
.knowledge-info {
  padding: 10px 0;
}

.session-item,
.knowledge-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 14px;
}

.session-item span:first-child,
.knowledge-item span:first-child {
  color: #666;
  font-weight: 500;
}

.session-actions,
.knowledge-actions {
  margin-top: 12px;
}

.query-card,
.history-card {
  border-radius: 8px;
  transition: all 0.3s ease;
}

.query-card:hover,
.history-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.query-controls {
  padding: 10px 0;
}

.form-item {
  margin-bottom: 16px;
}

.form-item label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

.add-document-form .form-item {
  margin-bottom: 20px;
}

.query-details {
  padding: 16px 0;
}

.query-content {
  margin-top: 20px;
}

.query-content h4,
.query-sources h4 {
  margin-bottom: 12px;
  color: #333;
  font-weight: 600;
}

.query-sources {
  margin-top: 20px;
}

.ellipsis-text {
  display: inline-block;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .status-cards {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .status-cards {
    grid-template-columns: 1fr;
  }

  .header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .actions {
    width: 100%;
    flex-wrap: wrap;
  }
}

/* 动画效果 */
.ant-card-loading .ant-card-body {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 400% 100%;
  animation: loading 1.5s ease infinite;
}

@keyframes loading {
  0% {
    background-position: 200% 0;
  }

  100% {
    background-position: -200% 0;
  }
}
</style>
