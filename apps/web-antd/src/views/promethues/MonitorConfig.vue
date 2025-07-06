<template>
  <div class="config-container">
    <!-- 页面标题和操作 -->
    <div class="page-header">
      <div class="header-actions">
        <button @click="showAddModal" class="btn-create">
          <PlusCircle :size="20" />
          <span class="btn-text">新增监控配置</span>
        </button>

        <div class="search-filters">
          <div class="search-input-wrapper">
            <Search class="search-icon" />
            <input v-model="searchText" type="text" placeholder="搜索配置名称..." class="search-input"
              @input="handleSearchInput" />
          </div>

          <select v-model="searchPoolId" class="filter-select" @change="handleFilterChange">
            <option value="">全部实例池</option>
            <option v-for="pool in poolOptions" :key="pool.id" :value="pool.id">
              {{ pool.name }}
            </option>
          </select>

          <select v-model="searchConfigType" class="filter-select" @change="handleFilterChange">
            <option value="">全部类型</option>
            <option :value="ConfigType.Prometheus">Prometheus配置</option>
            <option :value="ConfigType.AlertManager">AlertManager配置</option>
            <option :value="ConfigType.AlertRule">告警规则配置</option>
            <option :value="ConfigType.RecordRule">预聚合规则配置</option>
            <option :value="ConfigType.WebhookFile">Webhook文件</option>
          </select>

          <select v-model="searchStatus" class="filter-select" @change="handleFilterChange">
            <option value="">全部状态</option>
            <option :value="ConfigStatus.Active">激活</option>
            <option :value="ConfigStatus.Inactive">非激活</option>
          </select>

          <button @click="handleReset" class="reset-btn">
            <RefreshCw :size="16" />
            重置
          </button>
        </div>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-row">
      <div class="stats-grid">
        <div class="stats-card">
          <div class="stats-content">
            <div class="stats-info">
              <p class="stats-label">总配置数</p>
              <p class="stats-value stats-value-green">{{ stats.total }}</p>
            </div>
            <Settings class="stats-icon stats-icon-green" />
          </div>
        </div>

        <div class="stats-card">
          <div class="stats-content">
            <div class="stats-info">
              <p class="stats-label">激活配置</p>
              <p class="stats-value stats-value-blue">{{ stats.active }}</p>
            </div>
            <CheckCircle class="stats-icon stats-icon-blue" />
          </div>
        </div>

        <div class="stats-card">
          <div class="stats-content">
            <div class="stats-info">
              <p class="stats-label">告警规则</p>
              <p class="stats-value stats-value-yellow">{{ stats.alertRules }}</p>
            </div>
            <AlertTriangle class="stats-icon stats-icon-yellow" />
          </div>
        </div>

        <div class="stats-card">
          <div class="stats-content">
            <div class="stats-info">
              <p class="stats-label">实例数</p>
              <p class="stats-value stats-value-purple">{{ stats.instances }}</p>
            </div>
            <Server class="stats-icon stats-icon-purple" />
          </div>
        </div>
      </div>
    </div>

    <!-- 表格容器 -->
    <div class="table-container">
      <div class="table-card">
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>配置名称</th>
                <th>配置类型</th>
                <th>实例信息</th>
                <th>状态</th>
                <th>最后生成时间</th>
                <th>创建时间</th>
                <th class="text-center">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loading">
                <td colspan="7" class="loading-cell">
                  <div class="loading-content">
                    <div class="spinner"></div>
                    <span>加载中...</span>
                  </div>
                </td>
              </tr>
              <tr v-else-if="data.length === 0">
                <td colspan="7" class="empty-cell">暂无数据</td>
              </tr>
              <tr v-else v-for="record in data" :key="record.id" class="table-row">
                <td>
                  <div class="config-name-cell">
                    <div class="status-dot"
                      :class="record.status === ConfigStatus.Active ? 'status-dot-active' : 'status-dot-inactive'">
                    </div>
                    <span class="config-name">{{ record.name }}</span>
                  </div>
                </td>
                <td>
                  <span class="tech-tag" :class="getConfigTypeColor(record.config_type)">
                    {{ getConfigTypeName(record.config_type) }}
                  </span>
                </td>
                <td>
                  <div class="instance-info">
                    <div class="instance-item">实例池: {{ getPoolName(record.pool_id) }}</div>
                    <div class="instance-item instance-ip">IP: {{ record.instance_ip }}</div>
                  </div>
                </td>
                <td>
                  <span class="status-tag"
                    :class="record.status === ConfigStatus.Active ? 'status-tag-active' : 'status-tag-inactive'">
                    {{ record.status === ConfigStatus.Active ? '激活' : '非激活' }}
                  </span>
                </td>
                <td>
                  <div class="date-info">
                    <div class="date">{{ formatDate(record.last_generated_time) }}</div>
                    <div class="time">{{ formatTime(record.last_generated_time) }}</div>
                  </div>
                </td>
                <td>
                  <div class="date-info">
                    <div class="date">{{ formatDate(record.created_at) }}</div>
                    <div class="time">{{ formatTime(record.created_at) }}</div>
                  </div>
                </td>
                <td class="text-center">
                  <div class="action-buttons">
                    <button @click="handleViewDetail(record)" class="action-btn action-btn-blue" title="查看详情">
                      <Eye :size="16" />
                    </button>
                    <button @click="showEditModal(record)" class="action-btn action-btn-gray" title="编辑">
                      <Edit :size="16" />
                    </button>
                    <button @click="showPreviewModal(record)" class="action-btn action-btn-green" title="预览配置">
                      <FileText :size="16" />
                    </button>
                    <button @click="handleDelete(record)" class="action-btn action-btn-red" title="删除">
                      <Trash2 :size="16" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 分页 -->
        <div v-if="!loading && data.length > 0" class="pagination-container">
          <div class="pagination-info">
            <p class="pagination-text">
              显示第 <span class="font-medium">{{ (pagination.current - 1) * pagination.pageSize + 1 }}</span>
              到 <span class="font-medium">{{ Math.min(pagination.current * pagination.pageSize, pagination.total)
                }}</span>
              条，共 <span class="font-medium">{{ pagination.total }}</span> 条记录
            </p>
          </div>
          <div class="pagination-controls">
            <select v-model="pagination.pageSize" @change="handlePageSizeChange" class="page-size-select">
              <option value="10">10条/页</option>
              <option value="20">20条/页</option>
              <option value="50">50条/页</option>
              <option value="100">100条/页</option>
            </select>
            <div class="pagination-buttons">
              <button @click="handlePageChange(pagination.current - 1)" :disabled="pagination.current <= 1"
                class="pagination-btn pagination-btn-prev">
                上一页
              </button>
              <button v-for="page in visiblePages" :key="page" @click="handlePageChange(page)" class="pagination-btn"
                :class="page === pagination.current ? 'pagination-btn-active' : 'pagination-btn-normal'">
                {{ page }}
              </button>
              <button @click="handlePageChange(pagination.current + 1)" :disabled="pagination.current >= totalPages"
                class="pagination-btn pagination-btn-next">
                下一页
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 新增配置模态框 -->
    <a-modal v-model:visible="isAddModalVisible" title="新增监控配置" :width="700" @cancel="closeAddModal" @ok="handleAdd"
      okText="确定" cancelText="取消">
      <div class="form-section">
        <div class="section-title">基本信息</div>
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">配置名称</label>
            <input v-model="addForm.name" type="text" class="form-input" placeholder="请输入配置名称" />
          </div>
          <div class="form-group">
            <label class="form-label">配置类型</label>
            <select v-model="addForm.config_type" class="form-select">
              <option value="">请选择配置类型</option>
              <option :value="ConfigType.Prometheus">Prometheus配置</option>
              <option :value="ConfigType.AlertManager">AlertManager配置</option>
              <option :value="ConfigType.AlertRule">告警规则配置</option>
              <option :value="ConfigType.RecordRule">预聚合规则配置</option>
              <option :value="ConfigType.WebhookFile">Webhook文件</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">实例池</label>
            <select v-model="addForm.pool_id" class="form-select">
              <option value="">请选择实例池</option>
              <option v-for="pool in poolOptions" :key="pool.id" :value="pool.id">
                {{ pool.name }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">实例IP</label>
            <input v-model="addForm.instance_ip" type="text" class="form-input" placeholder="请输入实例IP" />
          </div>
        </div>
      </div>

      <div class="form-section">
        <div class="section-title">配置内容</div>
        <textarea v-model="addForm.config_content" rows="12" class="form-textarea" placeholder="请输入配置内容"></textarea>
      </div>

      <div class="form-section">
        <div class="section-title">状态设置</div>
        <div class="radio-group">
          <label class="radio-item">
            <input v-model="addForm.status" type="radio" :value="ConfigStatus.Active" class="radio-input" />
            <span class="radio-label">激活</span>
          </label>
          <label class="radio-item">
            <input v-model="addForm.status" type="radio" :value="ConfigStatus.Inactive" class="radio-input" />
            <span class="radio-label">非激活</span>
          </label>
        </div>
      </div>
    </a-modal>

    <!-- 编辑配置模态框 -->
    <a-modal v-model:visible="isEditModalVisible" title="编辑监控配置" :width="700" @cancel="closeEditModal" @ok="handleEdit"
      okText="确定" cancelText="取消">
      <div class="form-section">
        <div class="section-title">基本信息</div>
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">配置名称</label>
            <input v-model="editForm.name" type="text" class="form-input" placeholder="请输入配置名称" />
          </div>
          <div class="form-group">
            <label class="form-label">配置类型</label>
            <select v-model="editForm.config_type" class="form-select">
              <option value="">请选择配置类型</option>
              <option :value="ConfigType.Prometheus">Prometheus配置</option>
              <option :value="ConfigType.AlertManager">AlertManager配置</option>
              <option :value="ConfigType.AlertRule">告警规则配置</option>
              <option :value="ConfigType.RecordRule">预聚合规则配置</option>
              <option :value="ConfigType.WebhookFile">Webhook文件</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">实例池</label>
            <select v-model="editForm.pool_id" class="form-select">
              <option value="">请选择实例池</option>
              <option v-for="pool in poolOptions" :key="pool.id" :value="pool.id">
                {{ pool.name }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">实例IP</label>
            <input v-model="editForm.instance_ip" type="text" class="form-input" placeholder="请输入实例IP" />
          </div>
        </div>
      </div>

      <div class="form-section">
        <div class="section-title">配置内容</div>
        <textarea v-model="editForm.config_content" rows="12" class="form-textarea" placeholder="请输入配置内容"></textarea>
      </div>

      <div class="form-section">
        <div class="section-title">状态设置</div>
        <div class="radio-group">
          <label class="radio-item">
            <input v-model="editForm.status" type="radio" :value="ConfigStatus.Active" class="radio-input" />
            <span class="radio-label">激活</span>
          </label>
          <label class="radio-item">
            <input v-model="editForm.status" type="radio" :value="ConfigStatus.Inactive" class="radio-input" />
            <span class="radio-label">非激活</span>
          </label>
        </div>
      </div>
    </a-modal>

    <!-- 配置预览模态框 -->
    <a-modal v-model:visible="isPreviewModalVisible" title="配置内容预览" :width="900" @cancel="closePreviewModal"
      :footer="null">
      <template #title v-if="previewConfig">
        <div class="preview-header">
          <h3 class="modal-title">配置内容预览</h3>
          <span class="tech-tag" :class="getConfigTypeColor(previewConfig.config_type)">
            {{ getConfigTypeName(previewConfig.config_type) }}
          </span>
        </div>
      </template>

      <div v-if="previewConfig">
        <div class="preview-info">
          <h4 class="preview-name">{{ previewConfig.name }}</h4>
        </div>

        <textarea :value="previewConfig.config_content" readonly rows="20"
          class="form-textarea preview-textarea"></textarea>
      </div>

      <div class="modal-footer">
        <a-button @click="closePreviewModal">关闭</a-button>
      </div>
    </a-modal>

    <!-- 详情模态框 -->
    <a-modal v-model:visible="isDetailModalVisible" :width="900" @cancel="closeDetailModal" :footer="null">
      <template #title v-if="detailConfig">
        <div class="detail-header">
          <h2 class="detail-title">{{ detailConfig.name }}</h2>
          <div class="detail-badges">
            <span class="tech-tag" :class="getConfigTypeColor(detailConfig.config_type)">
              {{ getConfigTypeName(detailConfig.config_type) }}
            </span>
            <span class="status-tag"
              :class="detailConfig.status === ConfigStatus.Active ? 'status-tag-active' : 'status-tag-inactive'">
              {{ detailConfig.status === ConfigStatus.Active ? '激活' : '非激活' }}
            </span>
          </div>
        </div>
      </template>

      <div v-if="detailConfig">
        <div class="detail-info">
          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-label">ID:</span>
              <span class="detail-value">{{ detailConfig.id }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">实例池:</span>
              <span class="detail-value">{{ getPoolName(detailConfig.pool_id) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">实例IP:</span>
              <span class="detail-value">{{ detailConfig.instance_ip }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">配置Hash:</span>
              <span class="detail-value detail-hash">{{ detailConfig.config_hash }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">最后生成时间:</span>
              <span class="detail-value">{{ formatFullDateTime(detailConfig.last_generated_time) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">创建时间:</span>
              <span class="detail-value">{{ formatFullDateTime(detailConfig.created_at) }}</span>
            </div>
            <div class="detail-item detail-item-full">
              <span class="detail-label">更新时间:</span>
              <span class="detail-value">{{ formatFullDateTime(detailConfig.updated_at) }}</span>
            </div>
          </div>
        </div>

        <div class="config-content-section">
          <h4 class="content-title">配置内容</h4>
          <textarea :value="detailConfig.config_content" readonly rows="15"
            class="form-textarea preview-textarea"></textarea>
        </div>

        <div class="modal-footer">
          <a-button @click="closeDetailModal">关闭</a-button>
          <a-button type="primary" @click="showEditModalFromDetail(detailConfig)">编辑</a-button>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { message, Modal } from 'ant-design-vue';
import {
  PlusCircle,
  Search,
  RefreshCw,
  Settings,
  CheckCircle,
  AlertTriangle,
  Server,
  Eye,
  Edit,
  FileText,
  Trash2
} from 'lucide-vue-next';

// 导入 API 和类型
import {
  getMonitorConfigListApi,
  getMonitorConfigApi,
  createMonitorConfigApi,
  updateMonitorConfigApi,
  deleteMonitorConfigApi,
  ConfigType,
  ConfigStatus
} from '#/api/core/prometheus_config';

// 模拟实例池数据
const poolOptions = ref([
  { id: 1, name: 'Prometheus-Pool-1' },
  { id: 2, name: 'AlertManager-Pool-1' },
  { id: 3, name: 'Mixed-Pool-1' }
]);

// 状态数据
const loading = ref(false);
const data = ref([]);
const searchText = ref('');
const searchPoolId = ref('');
const searchConfigType = ref('');
const searchStatus = ref('');

// 分页配置
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0
});

// 统计数据
const stats = reactive({
  total: 0,
  active: 0,
  alertRules: 0,
  instances: 0
});

// 模态框状态
const isAddModalVisible = ref(false);
const isEditModalVisible = ref(false);
const isPreviewModalVisible = ref(false);
const isDetailModalVisible = ref(false);
const previewConfig = ref(null);
const detailConfig = ref(null);

// 表单数据
const addForm = reactive({
  name: '',
  pool_id: '',
  instance_ip: '',
  config_type: '',
  config_content: '',
  status: ConfigStatus.Active
});

const editForm = reactive({
  id: 0,
  name: '',
  pool_id: '',
  instance_ip: '',
  config_type: '',
  config_content: '',
  status: ConfigStatus.Active
});

// 防抖搜索
let searchTimeout = null;

// 计算属性
const totalPages = computed(() => Math.ceil(pagination.total / pagination.pageSize));

const visiblePages = computed(() => {
  const current = pagination.current;
  const total = totalPages.value;
  const delta = 2;
  const range = [];
  const rangeWithDots = [];

  for (let i = Math.max(2, current - delta); i <= Math.min(total - 1, current + delta); i++) {
    range.push(i);
  }

  if (current - delta > 2) {
    rangeWithDots.push(1, '...');
  } else {
    rangeWithDots.push(1);
  }

  rangeWithDots.push(...range);

  if (current + delta < total - 1) {
    rangeWithDots.push('...', total);
  } else {
    rangeWithDots.push(total);
  }

  return rangeWithDots.filter((item, index, arr) => arr.indexOf(item) === index && item !== '...' ? true : item === '...');
});

// 辅助方法
const getConfigTypeName = (type) => {
  const typeNames = {
    [ConfigType.Prometheus]: 'Prometheus',
    [ConfigType.AlertManager]: 'AlertManager',
    [ConfigType.AlertRule]: '告警规则',
    [ConfigType.RecordRule]: '预聚合规则',
    [ConfigType.WebhookFile]: 'Webhook文件'
  };
  return typeNames[type] || '未知';
};

const getConfigTypeColor = (type) => {
  const typeColors = {
    [ConfigType.Prometheus]: 'prometheus-tag',
    [ConfigType.AlertManager]: 'alert-tag',
    [ConfigType.AlertRule]: 'rule-tag',
    [ConfigType.RecordRule]: 'record-tag',
    [ConfigType.WebhookFile]: 'webhook-tag'
  };
  return typeColors[type] || 'default-tag';
};

const getPoolName = (poolId) => {
  const pool = poolOptions.value.find(p => p.id === poolId);
  return pool?.name || `Pool-${poolId}`;
};

const formatDate = (timestamp) => {
  if (!timestamp) return '';
  return new Date(timestamp * 1000).toLocaleDateString('zh-CN');
};

const formatTime = (timestamp) => {
  if (!timestamp) return '';
  return new Date(timestamp * 1000).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatFullDateTime = (timestamp) => {
  if (!timestamp) return '';
  return new Date(timestamp * 1000).toLocaleString('zh-CN');
};

// 更新统计数据
const updateStats = () => {
  stats.total = data.value.length;
  stats.active = data.value.filter(item => item.status === ConfigStatus.Active).length;
  stats.alertRules = data.value.filter(item => item.config_type === ConfigType.AlertRule).length;
  stats.instances = new Set(data.value.map(item => item.instance_ip)).size;
};

// 数据加载
const fetchConfigs = async () => {
  loading.value = true;
  try {
    const params = {
      page: pagination.current,
      size: pagination.pageSize,
      search: searchText.value || undefined,
      pool_id: searchPoolId.value ? parseInt(searchPoolId.value) : undefined,
      config_type: searchConfigType.value ? parseInt(searchConfigType.value) : undefined,
      status: searchStatus.value ? parseInt(searchStatus.value) : undefined
    };

    const response = await getMonitorConfigListApi(params);
    if (response) {
      data.value = response.items || [];
      pagination.total = response.total || 0;
      updateStats();
    }
  } catch (error) {
    console.error('加载配置列表失败:', error);
  } finally {
    loading.value = false;
  }
};

// 事件处理
const handleSearchInput = () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }
  searchTimeout = setTimeout(() => {
    pagination.current = 1;
    fetchConfigs();
  }, 500);
};

const handleFilterChange = () => {
  pagination.current = 1;
  fetchConfigs();
};

const handleReset = () => {
  searchText.value = '';
  searchPoolId.value = '';
  searchConfigType.value = '';
  searchStatus.value = '';
  pagination.current = 1;
  fetchConfigs();
};

const handlePageChange = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    pagination.current = page;
    fetchConfigs();
  }
};

const handlePageSizeChange = () => {
  pagination.current = 1;
  fetchConfigs();
};

// 表单处理
const resetAddForm = () => {
  Object.assign(addForm, {
    name: '',
    pool_id: '',
    instance_ip: '',
    config_type: '',
    config_content: '',
    status: ConfigStatus.Active
  });
};

const showAddModal = () => {
  resetAddForm();
  isAddModalVisible.value = true;
};

const closeAddModal = () => {
  isAddModalVisible.value = false;
};

const handleAdd = async () => {
  try {
    const params = {
      name: addForm.name,
      pool_id: parseInt(addForm.pool_id),
      instance_ip: addForm.instance_ip,
      config_type: parseInt(addForm.config_type),
      config_content: addForm.config_content,
      status: addForm.status
    };

    await createMonitorConfigApi(params);
    closeAddModal();
    fetchConfigs();
    message.success('新增配置成功');
  } catch (error) {
    message.error('新增配置失败: ' + (error.message || '未知错误'));
  }
};

const showEditModal = (record) => {
  editForm.id = record.id;
  editForm.name = record.name;
  editForm.pool_id = record.pool_id;
  editForm.instance_ip = record.instance_ip;
  editForm.config_type = record.config_type;
  editForm.config_content = record.config_content;
  editForm.status = record.status;
  isEditModalVisible.value = true;
};

const showEditModalFromDetail = (record) => {
  closeDetailModal();
  showEditModal(record);
};

const closeEditModal = () => {
  isEditModalVisible.value = false;
};

const handleEdit = async () => {
  try {
    const params = {
      id: editForm.id,
      name: editForm.name,
      pool_id: parseInt(editForm.pool_id),
      instance_ip: editForm.instance_ip,
      config_type: parseInt(editForm.config_type),
      config_content: editForm.config_content,
      status: editForm.status
    };

    await updateMonitorConfigApi(params);
    closeEditModal();
    fetchConfigs();
    message.success('更新配置成功');
  } catch (error) {
    message.error('更新配置失败: ' + (error.message || '未知错误'));
  }
};

const handleDelete = async (record) => {
  Modal.confirm({
    title: '确定要删除配置吗？',
    content: `确定要删除配置 "${record.name}" 吗？`,
    onOk: async () => {
      try {
        await deleteMonitorConfigApi({ id: record.id });
        fetchConfigs();
        message.success('删除配置成功');
      } catch (error) {
        message.error('删除配置失败: ' + (error.message || '未知错误'));
      }
    }
  });
};

const handleViewDetail = async (record) => {
  try {
    const detail = await getMonitorConfigApi({ id: record.id });
    detailConfig.value = detail;
    isDetailModalVisible.value = true;
  } catch (error) {
    console.error('获取配置详情失败:', error);
    message.error('获取配置详情失败: ' + (error.message || '未知错误'));
  }
};

const showPreviewModal = (record) => {
  previewConfig.value = record;
  isPreviewModalVisible.value = true;
};

const closePreviewModal = () => {
  isPreviewModalVisible.value = false;
  previewConfig.value = null;
};

const closeDetailModal = () => {
  isDetailModalVisible.value = false;
  detailConfig.value = null;
};

// 生命周期
onMounted(() => {
  fetchConfigs();
});
</script>

<style scoped>
.config-container {
  padding: 12px;
  min-height: 100vh;
}

/* 页面头部 */
.page-header {
  margin-bottom: 20px;
}

.header-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}

.btn-create {
  background: #1890ff;
  border: none;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  color: white;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.btn-create:hover {
  background: #40a9ff;
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.3);
}

.search-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.search-input-wrapper {
  position: relative;
  flex: 1;
  min-width: 250px;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  color: #9ca3af;
}

.search-input {
  width: 100%;
  padding: 8px 12px 8px 40px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}

.search-input:focus {
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.1);
}

.filter-select {
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
  background-color: white;
  min-width: 120px;
  cursor: pointer;
}

.filter-select:focus {
  outline: none;
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.1);
}

.reset-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background-color: #f5f5f5;
  color: #595959;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.reset-btn:hover {
  background-color: #e6e6e6;
}

/* 统计卡片 */
.stats-row {
  margin-bottom: 20px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.stats-card {
  background: white;
  padding: 24px 20px;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border: 1px solid #f0f0f0;
}

.stats-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stats-info {
  flex: 1;
}

.stats-label {
  font-size: 14px;
  color: #8c8c8c;
  margin: 0 0 8px 0;
}

.stats-value {
  font-size: 28px;
  font-weight: 600;
  margin: 0;
}

.stats-value-green {
  color: #3f8600;
}

.stats-value-blue {
  color: #52c41a;
}

.stats-value-yellow {
  color: #faad14;
}

.stats-value-purple {
  color: #cf1322;
}

.stats-icon {
  width: 28px;
  height: 28px;
}

.stats-icon-green {
  color: #3f8600;
}

.stats-icon-blue {
  color: #52c41a;
}

.stats-icon-yellow {
  color: #faad14;
}

.stats-icon-purple {
  color: #cf1322;
}

/* 表格容器 */
.table-container {
  margin-bottom: 24px;
}

.table-card {
  background: white;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border: 1px solid #f0f0f0;
  overflow: hidden;
}

.table-wrapper {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th {
  background-color: #fafafa;
  padding: 12px 16px;
  text-align: left;
  font-size: 14px;
  font-weight: 500;
  color: #595959;
  border-bottom: 1px solid #f0f0f0;
  white-space: nowrap;
}

.data-table td {
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
  vertical-align: top;
}

.table-row:hover {
  background-color: #fafafa;
}

.loading-cell,
.empty-cell {
  text-align: center;
  padding: 48px 16px;
  color: #8c8c8c;
}

.loading-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid #1890ff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

/* 表格内容样式 */
.config-name-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-dot-active {
  background-color: #52c41a;
}

.status-dot-inactive {
  background-color: #d9d9d9;
}

.config-name {
  font-weight: 500;
  color: rgba(0, 0, 0, 0.85);
  word-break: break-all;
}

.tech-tag {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 2px;
  font-size: 12px;
  font-weight: 500;
  margin-right: 4px;
}

.prometheus-tag {
  background-color: #e6f7ff;
  color: #0958d9;
  border-left: 3px solid #1890ff;
}

.alert-tag {
  background-color: #fff7e6;
  color: #d46b08;
  border-left: 3px solid #fa8c16;
}

.rule-tag {
  background-color: #fff1f0;
  color: #cf1322;
  border-left: 3px solid #ff4d4f;
}

.record-tag {
  background-color: #f6ffed;
  color: #389e0d;
  border-left: 3px solid #52c41a;
}

.webhook-tag {
  background-color: #f9f0ff;
  color: #722ed1;
  border-left: 3px solid #722ed1;
}

.default-tag {
  background-color: #f5f5f5;
  color: #595959;
  border-left: 3px solid #d9d9d9;
}

.status-tag {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  font-size: 12px;
  font-weight: 400;
  border-radius: 2px;
}

.status-tag-active {
  background-color: #f6ffed;
  color: #389e0d;
  border: 1px solid #b7eb8f;
}

.status-tag-inactive {
  background-color: #f5f5f5;
  color: #8c8c8c;
  border: 1px solid #d9d9d9;
}

.instance-info {
  font-size: 14px;
}

.instance-item {
  color: rgba(0, 0, 0, 0.85);
  margin-bottom: 4px;
}

.instance-ip {
  color: #8c8c8c;
  font-family: monospace;
}

.date-info {
  display: flex;
  flex-direction: column;
}

.date {
  font-weight: 500;
  font-size: 14px;
  color: rgba(0, 0, 0, 0.85);
}

.time {
  color: #8c8c8c;
  font-size: 12px;
}

.text-center {
  text-align: center;
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 4px;
  flex-wrap: wrap;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 5px;
  border: none;
  border-radius: 2px;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn-blue {
  background-color: #e6f7ff;
  color: #1890ff;
}

.action-btn-gray {
  background-color: #f5f5f5;
  color: #595959;
}

.action-btn-green {
  background-color: #f6ffed;
  color: #52c41a;
}

.action-btn-red {
  background-color: #fff1f0;
  color: #ff4d4f;
}

.action-btn:hover {
  opacity: 0.8;
}

/* 分页 */
.pagination-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-top: 1px solid #f0f0f0;
  background-color: white;
}

.pagination-info {
  color: #8c8c8c;
  font-size: 14px;
}

.pagination-text .font-medium {
  font-weight: 500;
  color: rgba(0, 0, 0, 0.85);
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 16px;
}

.page-size-select {
  padding: 4px 8px;
  border: 1px solid #d9d9d9;
  border-radius: 2px;
  font-size: 14px;
}

.pagination-buttons {
  display: flex;
  gap: 0;
}

.pagination-btn {
  min-width: 32px;
  height: 32px;
  padding: 0 8px;
  border: 1px solid #d9d9d9;
  background: white;
  color: rgba(0, 0, 0, 0.85);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  margin-right: -1px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.pagination-btn:first-child {
  border-radius: 2px 0 0 2px;
}

.pagination-btn:last-child {
  border-radius: 0 2px 2px 0;
  margin-right: 0;
}

.pagination-btn:hover:not(:disabled) {
  color: #1890ff;
  border-color: #1890ff;
  position: relative;
  z-index: 1;
}

.pagination-btn:disabled {
  color: #d9d9d9;
  cursor: not-allowed;
}

.pagination-btn-active {
  background-color: #1890ff;
  color: white;
  border-color: #1890ff;
  z-index: 1;
}

/* 模态框 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
  overflow-y: auto;
}

.modal-container {
  background: white;
  border-radius: 2px;
  box-shadow: 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 9px 28px 8px rgba(0, 0, 0, 0.05);
  width: 100%;
  max-width: 800px;
  max-height: calc(100vh - 40px);
  margin: 40px auto;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-large {
  max-width: 1000px;
}

.responsive-modal {
  max-width: calc(100vw - 32px);
  margin: 16px auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid #f0f0f0;
}

.modal-title {
  font-size: 16px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.85);
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  font-size: 16px;
  color: rgba(0, 0, 0, 0.45);
  cursor: pointer;
  padding: 0;
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.modal-close:hover {
  color: rgba(0, 0, 0, 0.75);
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.modal-body .form-group {
  margin-bottom: 24px;
}

.modal-body .form-textarea {
  width: 100%;
  min-height: 120px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 10px 16px;
  border-top: 1px solid #f0f0f0;
}

/* 按钮样式 */
.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 5px 16px;
  height: 32px;
  background: #1890ff;
  color: white;
  border: none;
  border-radius: 2px;
  font-size: 14px;
  font-weight: 400;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1);
  box-shadow: 0 2px 0 rgba(0, 0, 0, 0.045);
}

.btn-primary:hover {
  background: #40a9ff;
}

.btn-primary:active {
  background: #096dd9;
}

.btn-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 5px 16px;
  height: 32px;
  background-color: white;
  color: rgba(0, 0, 0, 0.85);
  border: 1px solid #d9d9d9;
  border-radius: 2px;
  font-size: 14px;
  font-weight: 400;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1);
}

.btn-secondary:hover {
  color: #40a9ff;
  border-color: #40a9ff;
}

.btn-secondary:active {
  color: #096dd9;
  border-color: #096dd9;
}

/* 表单样式 */
.form-section {
  margin-bottom: 24px;
  padding: 0;
  position: relative;
}

.section-title {
  font-size: 14px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.85);
  margin-bottom: 16px;
  padding-left: 12px;
  border-left: 3px solid #1890ff;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  margin-bottom: 24px;
}

.form-label {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.85);
  margin-bottom: 8px;
}

.form-input,
.form-select {
  padding: 4px 11px;
  height: 32px;
  border: 1px solid #d9d9d9;
  border-radius: 2px;
  font-size: 14px;
  color: rgba(0, 0, 0, 0.85);
  background-color: white;
  transition: all 0.3s;
}

.form-input:hover,
.form-select:hover {
  border-color: #40a9ff;
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: #40a9ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.form-textarea {
  padding: 4px 11px;
  border: 1px solid #d9d9d9;
  border-radius: 2px;
  font-size: 14px;
  font-family: monospace;
  line-height: 1.5715;
  resize: vertical;
  transition: all 0.3s;
  width: 100%;
  color: rgba(0, 0, 0, 0.85);
  box-sizing: border-box;
}

.form-textarea:hover {
  border-color: #40a9ff;
}

.form-textarea:focus {
  outline: none;
  border-color: #40a9ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.preview-textarea {
  background-color: #fafafa;
  font-family: monospace;
  cursor: default;
}

.radio-group {
  display: flex;
  gap: 24px;
}

.radio-item {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.radio-input {
  margin-right: 8px;
}

.radio-label {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.85);
}

/* 预览和详情样式 */
.preview-header,
.detail-header {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.detail-title {
  font-size: 18px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.85);
  margin: 0;
  word-break: break-all;
}

.detail-badges {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.preview-info {
  margin-bottom: 16px;
}

.preview-name {
  font-size: 16px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.85);
  margin: 0;
}

.detail-info {
  margin-bottom: 24px;
  padding: 16px;
  background: #fafafa;
  border-radius: 2px;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

.detail-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.detail-item-full {
  grid-column: 1 / -1;
}

.detail-label {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.45);
  min-width: 80px;
  flex-shrink: 0;
}

.detail-value {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.85);
  word-break: break-all;
}

.detail-hash {
  font-family: monospace;
  font-size: 12px;
  background: #f5f5f5;
  padding: 2px 4px;
  border-radius: 2px;
}

.config-content-section {
  margin-top: 24px;
}

.content-title {
  font-size: 14px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.85);
  margin-bottom: 12px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .config-container {
    padding: 8px;
  }

  .header-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .search-filters {
    width: 100%;
  }

  .search-input-wrapper {
    min-width: auto;
  }

  .filter-select {
    width: 100%;
    min-width: auto;
  }

  .btn-text {
    display: none;
  }

  .btn-create {
    padding: 4px 8px;
    min-width: auto;
  }

  .stats-grid {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  }

  .stats-value {
    font-size: 22px;
  }

  .stats-icon {
    width: 22px;
    height: 22px;
  }

  .pagination-container {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }

  .pagination-controls {
    justify-content: center;
    flex-wrap: wrap;
  }

  .modal-container {
    margin: 0;
    max-width: 100%;
    max-height: 100vh;
    border-radius: 0;
  }

  .responsive-modal {
    max-width: 100%;
    margin: 0;
    height: 100vh;
  }

  .modal-body {
    padding: 16px;
    max-height: calc(100vh - 132px);
    overflow-y: auto;
  }

  .modal-header,
  .modal-footer {
    padding: 12px 16px;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .detail-grid {
    grid-template-columns: 1fr;
  }

  .modal-footer {
    flex-direction: column-reverse;
  }

  .modal-footer button {
    width: 100%;
    margin-bottom: 8px;
  }

  .modal-footer button:last-child {
    margin-bottom: 0;
  }

  .action-buttons {
    gap: 2px;
  }

  .action-btn {
    padding: 4px;
  }

  .form-section {
    margin-bottom: 20px;
  }
}

@media (max-width: 480px) {
  .radio-group {
    flex-direction: column;
    gap: 12px;
  }

  .action-buttons {
    flex-wrap: wrap;
    gap: 4px;
  }
}

/* 表格滚动优化 */
.table-wrapper {
  overflow: auto;
}

.data-table th {
  white-space: nowrap;
}

.data-table td {
  word-break: break-word;
}

/* 对话框响应式优化 */
.responsive-modal {
  max-width: calc(100vw - 16px);
  margin: 8px;
}

@media (max-width: 768px) {
  .responsive-modal .modal-body {
    padding: 16px;
    max-height: calc(100vh - 132px);
    overflow-y: auto;
  }
}
</style>
