<template>
  <div class="global-notification">
    <!-- 错误提示 -->
    <a-alert 
      v-if="error" 
      :message="error" 
      type="error" 
      closable 
      @close="handleErrorClose"
      class="notification-alert error-alert"
      show-icon
    />

    <!-- 成功提示 -->
    <a-alert 
      v-if="success" 
      :message="success" 
      type="success" 
      closable 
      @close="handleSuccessClose"
      class="notification-alert success-alert"
      show-icon
    />
  </div>
</template>

<script setup lang="ts">
interface Props {
  error?: string;
  success?: string;
}

interface Emits {
  (e: 'update:error', value: string): void;
  (e: 'update:success', value: string): void;
}

defineProps<Props>();
const emit = defineEmits<Emits>();

const handleErrorClose = () => {
  emit('update:error', '');
};

const handleSuccessClose = () => {
  emit('update:success', '');
};
</script>

<style scoped>
.global-notification {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.notification-alert {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-radius: 8px;
  animation: slideIn 0.3s ease-out;
}

.error-alert {
  border-left: 4px solid #ff4d4f;
}

.success-alert {
  border-left: 4px solid #52c41a;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@media (max-width: 768px) {
  .global-notification {
    left: 20px;
    right: 20px;
    max-width: none;
  }
}
</style>
