<template>
  <a-modal 
    v-model:visible="modalVisible" 
    title="发送通知" 
    width="600px" 
    @ok="handleSubmit"
    @cancel="handleCancel" 
    :confirm-loading="loading"
    ok-text="发送通知"
    cancel-text="取消"
  >
    <a-form 
      :model="formData" 
      layout="vertical"
      ref="formRef"
      :rules="formRules"
    >
      <a-form-item label="通知类型" name="type" required>
        <a-select v-model:value="formData.type" @change="handleTypeChange">
          <a-select-option value="human_help">
            <div class="option-content">
              <user-outlined style="color: #1890ff;" />
              <span>人工帮助</span>
            </div>
          </a-select-option>
          <a-select-option value="incident">
            <div class="option-content">
              <alert-outlined style="color: #ff4d4f;" />
              <span>事件告警</span>
            </div>
          </a-select-option>
        </a-select>
      </a-form-item>

      <!-- 人工帮助的紧急程度 -->
      <a-form-item 
        v-if="formData.type === 'human_help'" 
        label="紧急程度" 
        name="urgency"
        required
      >
        <a-select v-model:value="formData.urgency">
          <a-select-option value="low">
            <a-tag color="green">低</a-tag>
            <span style="margin-left: 8px;">非紧急事项</span>
          </a-select-option>
          <a-select-option value="medium">
            <a-tag color="orange">中</a-tag>
            <span style="margin-left: 8px;">一般紧急</span>
          </a-select-option>
          <a-select-option value="high">
            <a-tag color="red">高</a-tag>
            <span style="margin-left: 8px;">比较紧急</span>
          </a-select-option>
          <a-select-option value="critical">
            <a-tag color="purple">紧急</a-tag>
            <span style="margin-left: 8px;">非常紧急</span>
          </a-select-option>
        </a-select>
      </a-form-item>

      <!-- 事件告警的严重程度 -->
      <a-form-item 
        v-if="formData.type === 'incident'" 
        label="严重程度" 
        name="severity"
        required
      >
        <a-select v-model:value="formData.severity">
          <a-select-option value="low">
            <a-tag color="green">低</a-tag>
            <span style="margin-left: 8px;">轻微影响</span>
          </a-select-option>
          <a-select-option value="medium">
            <a-tag color="orange">中</a-tag>
            <span style="margin-left: 8px;">一般影响</span>
          </a-select-option>
          <a-select-option value="high">
            <a-tag color="red">高</a-tag>
            <span style="margin-left: 8px;">严重影响</span>
          </a-select-option>
          <a-select-option value="critical">
            <a-tag color="purple">严重</a-tag>
            <span style="margin-left: 8px;">业务中断</span>
          </a-select-option>
        </a-select>
      </a-form-item>

      <!-- 通知消息 -->
      <a-form-item label="通知消息" name="message" required>
        <a-textarea 
          v-model:value="formData.message" 
          :rows="4" 
          placeholder="请详细描述需要通知的内容..."
          show-count
          :maxlength="500"
        />
        <div class="message-tips">
          <div class="tip-item">
            <info-circle-outlined style="color: #1890ff;" />
            <span>请详细描述问题现象、影响范围等信息</span>
          </div>
        </div>
      </a-form-item>

      <!-- 受影响的服务 -->
      <a-form-item 
        v-if="formData.type === 'incident'" 
        label="受影响的服务" 
        name="affected_services"
      >
        <a-select 
          v-model:value="formData.affected_services" 
          mode="tags" 
          placeholder="选择或输入服务名称"
          :options="serviceOptions"
        />
        <div class="service-tips">
          <div class="tip-item">
            <bulb-outlined style="color: #faad14;" />
            <span>可以选择预设服务或输入自定义服务名称</span>
          </div>
        </div>
      </a-form-item>

      <!-- 通知预览 -->
      <a-form-item label="通知预览">
        <div class="notification-preview">
          <div class="preview-header">
            <component :is="getTypeIcon(formData.type)" :style="{ color: getTypeColor(formData.type) }" />
            <span class="preview-title">{{ getNotificationTitle() }}</span>
            <a-tag :color="getLevelColor()">{{ getLevelText() }}</a-tag>
          </div>
          <div class="preview-content">
            <p><strong>消息内容:</strong></p>
            <div class="preview-message">
              {{ formData.message || '请输入通知消息...' }}
            </div>
            <div v-if="formData.type === 'incident' && formData.affected_services && formData.affected_services.length > 0" class="preview-services">
              <p><strong>受影响服务:</strong></p>
              <div class="services-list">
                <a-tag v-for="service in formData.affected_services" :key="service" size="small">
                  {{ service }}
                </a-tag>
              </div>
            </div>
          </div>
        </div>
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import {
  UserOutlined,
  AlertOutlined,
  InfoCircleOutlined,
  BulbOutlined
} from '@ant-design/icons-vue';
import type { FormInstance } from 'ant-design-vue';

interface NotificationForm {
  type: 'human_help' | 'incident';
  message: string;
  urgency?: 'low' | 'medium' | 'high' | 'critical';
  severity?: 'low' | 'medium' | 'high' | 'critical';
  affected_services?: string[];
}

interface Props {
  visible: boolean;
  loading: boolean;
  form: NotificationForm;
}

interface Emits {
  (e: 'update:visible', value: boolean): void;
  (e: 'submit'): void;
  (e: 'reset'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const formRef = ref<FormInstance>();

const modalVisible = computed({
  get: () => props.visible,
  set: (value: boolean) => emit('update:visible', value)
});

const formData = computed(() => props.form);

// 服务选项
const serviceOptions = [
  { value: 'frontend-service', label: '前端服务' },
  { value: 'backend-service', label: '后端服务' },
  { value: 'database-service', label: '数据库服务' },
  { value: 'cache-service', label: '缓存服务' },
  { value: 'message-queue', label: '消息队列' },
  { value: 'file-storage', label: '文件存储' },
  { value: 'monitoring-service', label: '监控服务' },
  { value: 'logging-service', label: '日志服务' }
];

// 表单验证规则
const formRules = {
  type: [
    { required: true, message: '请选择通知类型' }
  ],
  message: [
    { required: true, message: '请输入通知消息' },
    { min: 10, message: '通知消息至少需要10个字符' },
    { max: 500, message: '通知消息不能超过500个字符' }
  ],
  urgency: [
    { required: true, message: '请选择紧急程度', trigger: 'change' }
  ],
  severity: [
    { required: true, message: '请选择严重程度', trigger: 'change' }
  ]
};

const getTypeIcon = (type: string) => {
  return type === 'human_help' ? UserOutlined : AlertOutlined;
};

const getTypeColor = (type: string) => {
  return type === 'human_help' ? '#1890ff' : '#ff4d4f';
};

const getNotificationTitle = () => {
  const titleMap = {
    'human_help': '人工帮助请求',
    'incident': '事件告警通知'
  };
  return titleMap[formData.value.type] || '通知';
};

const getLevelColor = () => {
  const level = formData.value.type === 'human_help' ? formData.value.urgency : formData.value.severity;
  const colorMap: Record<string, string> = {
    'low': 'green',
    'medium': 'orange', 
    'high': 'red',
    'critical': 'purple'
  };
  return colorMap[level || 'medium'];
};

const getLevelText = () => {
  const level = formData.value.type === 'human_help' ? formData.value.urgency : formData.value.severity;
  const textMap: Record<string, string> = {
    'low': '低',
    'medium': '中',
    'high': '高', 
    'critical': formData.value.type === 'human_help' ? '紧急' : '严重'
  };
  return textMap[level || 'medium'];
};

const handleTypeChange = () => {
  // 重置相关字段
  if (formData.value.type === 'human_help') {
    formData.value.severity = 'medium';
    formData.value.affected_services = [];
  } else {
    formData.value.urgency = 'medium';
    if (!formData.value.affected_services) {
      formData.value.affected_services = [];
    }
  }
};

const handleSubmit = async () => {
  try {
    await formRef.value?.validate();
    emit('submit');
  } catch (error) {
    console.error('表单验证失败:', error);
  }
};

const handleCancel = () => {
  emit('reset');
  modalVisible.value = false;
};

// 监听表单重置
watch(() => props.visible, (visible) => {
  if (visible) {
    // 确保表单字段有默认值
    if (!formData.value.urgency) {
      formData.value.urgency = 'medium';
    }
    if (!formData.value.severity) {
      formData.value.severity = 'medium';
    }
  }
});
</script>

<style scoped>
.option-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.message-tips,
.service-tips {
  margin-top: 8px;
}

.tip-item {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #666;
  font-size: 12px;
}

.notification-preview {
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  padding: 16px;
  background-color: #fafafa;
}

.preview-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e8e8e8;
}

.preview-title {
  font-weight: 600;
  color: #1a1a1a;
}

.preview-content p {
  margin-bottom: 8px;
  font-weight: 500;
  color: #666;
}

.preview-message {
  background-color: white;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 12px;
  min-height: 60px;
  color: #1a1a1a;
  line-height: 1.5;
  white-space: pre-wrap;
}

.preview-services {
  margin-top: 12px;
}

.services-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 4px;
}

/* 表单项样式优化 */
:deep(.ant-form-item-label > label) {
  font-weight: 600;
}

:deep(.ant-select-selection-item) {
  display: flex;
  align-items: center;
}

:deep(.ant-textarea) {
  resize: none;
}

/* 选择器选项样式 */
:deep(.ant-select-item-option-content) {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 标签样式 */
:deep(.ant-tag) {
  display: inline-flex;
  align-items: center;
  border-radius: 4px;
  font-weight: 500;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .preview-header {
    flex-wrap: wrap;
    gap: 8px;
  }
  
  .services-list {
    gap: 4px;
  }
}
</style>
