<template>
  <div class="scrape-pool-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="header-actions">
        <div class="page-title-section">
          <h2 class="page-title">配置文件下载</h2>
          <div class="page-description">根据目标服务器IP下载Prometheus和AlertManager配置文件</div>
        </div>
      </div>
    </div>

    <!-- IP验证卡片 -->
    <div class="stats-row">
      <a-row :gutter="[16, 16]">
        <a-col :span="24">
          <a-card class="ip-validation-card">
            <div class="section-title">目标服务器配置</div>
            <a-form layout="vertical" @submit.prevent>
              <a-form-item label="目标服务器 IP" :validate-status="ipError ? 'error' : isIpValid ? 'success' : ''"
                :help="ipError || '请输入目标服务器的 IP 地址'">
                <div class="search-filters">
                  <a-input v-model:value="ip" placeholder="例如：192.168.1.100" class="search-input"
                    @change="handleIpChange">
                    <template #prefix>
                      <Icon icon="mdi:ip-network" class="search-icon" />
                    </template>
                  </a-input>
                  <a-button type="primary" class="btn-create" @click="validateIp">
                    <template #icon>
                      <CheckOutlined />
                    </template>
                    <span class="btn-text">验证IP</span>
                  </a-button>
                  <a-button @click="resetIp" class="reset-btn">
                    <template #icon>
                      <ReloadOutlined />
                    </template>
                    重置
                  </a-button>
                </div>
              </a-form-item>
            </a-form>
          </a-card>
        </a-col>
      </a-row>
    </div>

    <!-- 状态统计卡片 -->
    <div class="stats-row">
      <a-row :gutter="[16, 16]">
        <a-col :xs="12" :sm="6" :md="6" :lg="6">
          <a-card class="stats-card">
            <a-statistic title="IP状态" :value="isIpValid ? '已验证' : '未验证'"
              :value-style="{ color: isIpValid ? '#52c41a' : '#d9d9d9' }">
              <template #prefix>
                <Icon :icon="isIpValid ? 'carbon:checkmark-filled' : 'carbon:warning-alt'" />
              </template>
            </a-statistic>
          </a-card>
        </a-col>
        <a-col :xs="12" :sm="6" :md="6" :lg="6">
          <a-card class="stats-card">
            <a-statistic title="Prometheus配置" value="可下载" :value-style="{ color: isIpValid ? '#1890ff' : '#d9d9d9' }">
              <template #prefix>
                <Icon icon="simple-icons:prometheus" />
              </template>
            </a-statistic>
          </a-card>
        </a-col>
        <a-col :xs="12" :sm="6" :md="6" :lg="6">
          <a-card class="stats-card">
            <a-statistic title="告警配置" value="可下载" :value-style="{ color: isIpValid ? '#faad14' : '#d9d9d9' }">
              <template #prefix>
                <Icon icon="carbon:warning-alt" />
              </template>
            </a-statistic>
          </a-card>
        </a-col>
        <a-col :xs="12" :sm="6" :md="6" :lg="6">
          <a-card class="stats-card">
            <a-statistic title="记录配置" value="可下载" :value-style="{ color: isIpValid ? '#52c41a' : '#d9d9d9' }">
              <template #prefix>
                <Icon icon="carbon:data-table" />
              </template>
            </a-statistic>
          </a-card>
        </a-col>
      </a-row>
    </div>

    <!-- 下载操作卡片 -->
    <div class="table-container">
      <a-card>
        <div class="section-title">配置文件下载</div>
        <div class="download-grid">
          <div class="download-item">
            <div class="download-info">
              <div class="config-icon prometheus-icon">
                <Icon icon="simple-icons:prometheus" />
              </div>
              <div class="config-details">
                <div class="config-name">Prometheus 配置文件</div>
                <div class="config-description">包含基础监控配置和采集规则</div>
              </div>
            </div>
            <a-button type="primary" :disabled="!isIpValid" :loading="loading.prometheus"
              @click="downloadConfig('prometheus')" class="download-button">
              <template #icon>
                <Icon icon="carbon:download" />
              </template>
              下载
            </a-button>
          </div>

          <div class="download-item">
            <div class="download-info">
              <div class="config-icon alert-icon">
                <Icon icon="mdi:alert-circle-outline" />
              </div>
              <div class="config-details">
                <div class="config-name">Prometheus 告警配置</div>
                <div class="config-description">包含告警规则和阈值配置</div>
              </div>
            </div>
            <a-button type="primary" :disabled="!isIpValid" :loading="loading.prometheus_alert"
              @click="downloadConfig('prometheus_alert')" class="download-button">
              <template #icon>
                <Icon icon="carbon:download" />
              </template>
              下载
            </a-button>
          </div>

          <div class="download-item">
            <div class="download-info">
              <div class="config-icon record-icon">
                <Icon icon="material-symbols:document-scanner-outline-rounded" />
              </div>
              <div class="config-details">
                <div class="config-name">Prometheus 记录配置</div>
                <div class="config-description">包含预聚合规则和记录配置</div>
              </div>
            </div>
            <a-button type="primary" :disabled="!isIpValid" :loading="loading.prometheus_record"
              @click="downloadConfig('prometheus_record')" class="download-button">
              <template #icon>
                <Icon icon="carbon:download" />
              </template>
              下载
            </a-button>
          </div>

          <div class="download-item">
            <div class="download-info">
              <div class="config-icon alertmanager-icon">
                <Icon icon="carbon:notification" />
              </div>
              <div class="config-details">
                <div class="config-name">AlertManager 配置文件</div>
                <div class="config-description">包含通知路由和接收器配置</div>
              </div>
            </div>
            <a-button type="primary" :disabled="!isIpValid" :loading="loading.alertManager"
              @click="downloadConfig('alertManager')" class="download-button">
              <template #icon>
                <Icon icon="carbon:download" />
              </template>
              下载
            </a-button>
          </div>
        </div>
      </a-card>
    </div>

    <!-- 使用说明卡片 -->
    <div class="table-container">
      <a-card>
        <div class="section-title">使用说明</div>
        <div class="instruction-content">
          <div class="instruction-item">
            <div class="instruction-badge">
              <span class="instruction-number">1</span>
            </div>
            <div class="instruction-info">
              <div class="instruction-title">输入服务器IP</div>
              <div class="instruction-description">输入目标服务器的 IP 地址并验证</div>
            </div>
          </div>
          <div class="instruction-item">
            <div class="instruction-badge">
              <span class="instruction-number">2</span>
            </div>
            <div class="instruction-info">
              <div class="instruction-title">选择配置类型</div>
              <div class="instruction-description">点击对应的按钮下载所需的配置文件</div>
            </div>
          </div>
          <div class="instruction-item">
            <div class="instruction-badge">
              <span class="instruction-number">3</span>
            </div>
            <div class="instruction-info">
              <div class="instruction-title">部署配置文件</div>
              <div class="instruction-description">将下载的配置文件放置在对应服务的配置目录中</div>
            </div>
          </div>
          <div class="instruction-item">
            <div class="instruction-badge">
              <span class="instruction-number">4</span>
            </div>
            <div class="instruction-info">
              <div class="instruction-title">重启服务</div>
              <div class="instruction-description">重启对应的服务使配置生效</div>
            </div>
          </div>
        </div>
      </a-card>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue';
import { message } from 'ant-design-vue';
import { CheckOutlined, ReloadOutlined } from '@ant-design/icons-vue';
import { Icon } from '@iconify/vue';

// IP 地址
const ip = ref('');
const ipError = ref('');
const isIpValid = ref(false);

// 加载状态
const loading = ref({
  prometheus: false,
  prometheus_alert: false,
  prometheus_record: false,
  alertManager: false,
});

// 验证 IP 地址格式
const validateIp = () => {
  const ipRegex = /^(25[0-5]|2[0-4]\d|[0-1]?\d{1,2})(\.(25[0-5]|2[0-4]\d|[0-1]?\d{1,2})){3}$/;
  if (!ip.value) {
    ipError.value = 'IP 地址不能为空';
    isIpValid.value = false;
    message.error('IP 地址不能为空');
  } else if (!ipRegex.test(ip.value)) {
    ipError.value = '请输入有效的 IP 地址';
    isIpValid.value = false;
    message.error('请输入有效的 IP 地址');
  } else {
    ipError.value = '';
    isIpValid.value = true;
    message.success('IP 地址有效');
  }
};

// 重置IP
const resetIp = () => {
  ip.value = '';
  ipError.value = '';
  isIpValid.value = false;
  message.success('IP 地址已重置');
};

// 处理IP变化
const handleIpChange = () => {
  if (ip.value) {
    const ipRegex = /^(25[0-5]|2[0-4]\d|[0-1]?\d{1,2})(\.(25[0-5]|2[0-4]\d|[0-1]?\d{1,2})){3}$/;
    if (!ipRegex.test(ip.value)) {
      ipError.value = '请输入有效的 IP 地址';
      isIpValid.value = false;
    } else {
      ipError.value = '';
      isIpValid.value = true;
    }
  } else {
    ipError.value = '';
    isIpValid.value = false;
  }
};

// 监听 IP 地址的变化并验证
watch(ip, handleIpChange);

// 下载配置文件
const downloadConfig = async (type: string) => {
  if (!isIpValid.value) {
    message.error('请先输入有效的 IP 地址');
    return;
  }

  let url = '';
  let fileName = '';
  switch (type) {
    case 'prometheus':
      url = `/api/monitor/prometheus_configs/prometheus?ip=${ip.value}`;
      fileName = 'prometheus_config.yaml';
      break;
    case 'prometheus_alert':
      url = `/api/monitor/prometheus_configs/prometheus_alert?ip=${ip.value}`;
      fileName = 'prometheus_alert_config.yaml';
      break;
    case 'prometheus_record':
      url = `/api/monitor/prometheus_configs/prometheus_record?ip=${ip.value}`;
      fileName = 'prometheus_record_config.yaml';
      break;
    case 'alertManager':
      url = `/api/monitor/prometheus_configs/alertManager?ip=${ip.value}`;
      fileName = 'alertmanager_config.yaml';
      break;
    default:
      message.error('未知的配置类型');
      return;
  }

  try {
    loading.value[type] = true;
    const response = await fetch(url);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || '下载配置文件失败');
    }
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
    message.success(`${fileName} 下载开始`);
  } catch (error: any) {
    message.error(error.message || '下载配置文件失败');
    console.error(error);
  } finally {
    loading.value[type] = false;
  }
};
</script>

<style scoped>
/* 继承采集池页面的基础样式 */
.scrape-pool-container {
  padding: 12px;
  min-height: 100vh;
}

.page-header {
  margin-bottom: 20px;
}

.header-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}

.page-title-section {
  flex: 1;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0 0 8px 0;
}

.page-description {
  color: #666;
  font-size: 14px;
  margin: 0;
}

.btn-create {
  background: linear-gradient(135deg, #1890ff 0%);
  border: none;
  flex-shrink: 0;
}

.search-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.search-input {
  flex: 1;
  min-width: 250px;
}

.search-icon {
  color: #bfbfbf;
  font-size: 16px;
}

.reset-btn {
  flex-shrink: 0;
}

.stats-row {
  margin-bottom: 20px;
}

.stats-card {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  height: 100%;
}

.ip-validation-card {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.table-container {
  margin-bottom: 24px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 16px;
  padding-left: 12px;
  border-left: 4px solid #1890ff;
}

/* 下载网格样式 */
.download-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 16px;
}

.download-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  background: #fafafa;
  transition: all 0.3s;
}

.download-item:hover {
  border-color: #1890ff;
  background: #f0f7ff;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.15);
}

.download-info {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
}

.config-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
  flex-shrink: 0;
}

.prometheus-icon {
  background: linear-gradient(45deg, #e6400a, #ff6b35);
}

.alert-icon {
  background: linear-gradient(45deg, #faad14, #ffc53d);
}

.record-icon {
  background: linear-gradient(45deg, #52c41a, #73d13d);
}

.alertmanager-icon {
  background: linear-gradient(45deg, #722ed1, #9254de);
}

.config-details {
  flex: 1;
}

.config-name {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 4px;
}

.config-description {
  font-size: 14px;
  color: #666;
}

.download-button {
  min-width: 80px;
  height: 36px;
  border-radius: 6px;
  font-weight: 500;
  transition: all 0.3s;
}

.download-button:not(:disabled):hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(24, 144, 255, 0.3);
}

/* 说明内容样式 */
.instruction-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.instruction-item {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 16px;
  border-radius: 8px;
  background: #fafafa;
  transition: all 0.3s;
}

.instruction-item:hover {
  background: #f0f7ff;
  transform: translateX(4px);
}

.instruction-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: linear-gradient(45deg, #1890ff, #36cfc9);
  border-radius: 50%;
  flex-shrink: 0;
}

.instruction-number {
  color: white;
  font-size: 18px;
  font-weight: 600;
}

.instruction-info {
  flex: 1;
  padding-top: 2px;
}

.instruction-title {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 4px;
}

.instruction-description {
  font-size: 14px;
  color: #666;
  line-height: 1.5;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .scrape-pool-container {
    padding: 8px;
  }

  .header-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .search-filters {
    width: 100%;
  }

  .search-input {
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

  .download-grid {
    grid-template-columns: 1fr;
  }

  .download-item {
    flex-direction: column;
    text-align: center;
    gap: 16px;
  }

  .download-info {
    flex-direction: column;
    text-align: center;
    gap: 12px;
  }

  .download-button {
    width: 100%;
  }

  .instruction-item {
    flex-direction: column;
    text-align: center;
    gap: 12px;
  }

  .instruction-info {
    text-align: center;
  }

  .stats-card :deep(.ant-statistic-title) {
    font-size: 12px;
  }

  .stats-card :deep(.ant-statistic-content) {
    font-size: 16px;
  }
}

@media (max-width: 480px) {
  .download-grid {
    gap: 12px;
  }

  .download-item {
    padding: 16px;
  }

  .config-icon {
    width: 40px;
    height: 40px;
    font-size: 20px;
  }

  .config-name {
    font-size: 14px;
  }

  .config-description {
    font-size: 12px;
  }

  .instruction-item {
    padding: 12px;
  }

  .instruction-badge {
    width: 32px;
    height: 32px;
  }

  .instruction-number {
    font-size: 16px;
  }

  .instruction-title {
    font-size: 14px;
  }

  .instruction-description {
    font-size: 12px;
  }
}

/* 加载状态优化 */
.download-button:disabled {
  background: #f5f5f5;
  color: rgba(0, 0, 0, 0.25);
  border-color: #d9d9d9;
}

/* 表单验证状态样式 */
:deep(.ant-form-item-has-success .ant-input) {
  border-color: #52c41a;
}

:deep(.ant-form-item-has-error .ant-input) {
  border-color: #ff4d4f;
}

:deep(.ant-form-item-has-success .ant-input:focus) {
  border-color: #52c41a;
  box-shadow: 0 0 0 2px rgba(82, 196, 26, 0.2);
}

:deep(.ant-form-item-has-error .ant-input:focus) {
  border-color: #ff4d4f;
  box-shadow: 0 0 0 2px rgba(255, 77, 79, 0.2);
}
</style>
