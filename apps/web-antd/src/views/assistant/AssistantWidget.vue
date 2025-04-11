<template>
  <div class="ai-assistant-container" :class="{ 'collapsed': !isVisible }">
    <div class="toggle-button" @click="toggleVisibility">
      <a-button type="primary" shape="circle" size="large" class="float-button">
        <template #icon>
          <robot-outlined v-if="!isVisible" />
          <close-outlined v-else />
        </template>
      </a-button>
    </div>

    <div class="chat-window" v-show="isVisible">
      <div class="chat-header">
        <div class="title">CloudOps AI小助手</div>
        <a-button type="text" @click="toggleVisibility" class="header-button">
          <template #icon><minus-outlined /></template>
        </a-button>
      </div>
      
      <div class="chat-messages" ref="messagesContainer">
        <div v-for="(message, index) in messages" :key="index" 
            :class="['message', message.role === 'user' ? 'user-message' : 'ai-message']">
          <a-avatar :class="message.role === 'user' ? 'user-avatar' : 'ai-avatar'">
            {{ message.role === 'user' ? 'U' : 'AI' }}
          </a-avatar>
          <div class="message-content">
            {{ message.content }}
          </div>
        </div>
        <div v-if="isLoading" class="message ai-message">
          <a-avatar class="ai-avatar">AI</a-avatar>
          <div class="message-content">
            <a-spin size="small" />
          </div>
        </div>
      </div>
      
      <div class="chat-input">
        <a-input-search
          v-model:value="userInput"
          placeholder="有什么可以帮您的..."
          enter-button="发送"
          @search="sendMessage"
          :disabled="isLoading"
          @pressEnter="sendMessage"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, reactive, onMounted, nextTick, watch } from 'vue';
import { RobotOutlined, CloseOutlined, MinusOutlined } from '@ant-design/icons-vue';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export default defineComponent({
  name: 'AiAssistant',
  components: {
    RobotOutlined,
    CloseOutlined,
    MinusOutlined
  },
  setup() {
    const isVisible = ref(false);
    const userInput = ref('');
    const messages = reactive<ChatMessage[]>([
      { role: 'assistant', content: '你好！我是AI小助手，有什么可以帮助你的吗？' }
    ]);
    const isLoading = ref(false);
    const messagesContainer = ref<HTMLElement | null>(null);

    const toggleVisibility = () => {
      isVisible.value = !isVisible.value;
    };

    const scrollToBottom = async () => {
      await nextTick();
      if (messagesContainer.value) {
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
      }
    };

    const sendMessage = async () => {
      if (userInput.value.trim() === '' || isLoading.value) return;
      
      messages.push({
        role: 'user',
        content: userInput.value
      });
      
      const userQuestion = userInput.value;
      userInput.value = '';
      scrollToBottom();
      
      isLoading.value = true;
      
      setTimeout(() => {
        const aiResponse = getAIResponse(userQuestion);
        messages.push({
          role: 'assistant',
          content: aiResponse
        });
        
        isLoading.value = false;
        scrollToBottom();
      }, 1000);
    };

    const getAIResponse = (question: string): string => {
      if (question.includes('你好') || question.includes('Hi') || question.includes('hello')) {
        return '你好！很高兴为您服务。';
      } else if (question.includes('名字')) {
        return '我是AI小助手，随时为您提供帮助！';
      } else if (question.includes('谢谢') || question.includes('感谢')) {
        return '不客气，这是我的荣幸！';
      } else {
        return `我收到了您的问题："${question}"。在实际应用中，这里应该调用AI API来获取回答。`;
      }
    };

    watch(messages, () => {
      scrollToBottom();
    });

    onMounted(() => {
      scrollToBottom();
    });

    return {
      isVisible,
      userInput,
      messages,
      isLoading,
      messagesContainer,
      toggleVisibility,
      sendMessage
    };
  }
});
</script>

<style scoped>
/* 深色主题变量 */
.ai-assistant-container {
  --primary-color: #055587;
  --dark-bg: #1a1a1a;
  --dark-text: #e0e0e0;
  --dark-border: #333;
  --dark-card-bg: #2d2d2d;
  --dark-hover: #3d3d3d;
}

.ai-assistant-container {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.toggle-button {
  margin-bottom: 10px;
  cursor: pointer;
  transition: transform 0.3s ease;
}

.toggle-button:hover {
  transform: scale(1.1);
}

.float-button {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.chat-window {
  width: 350px;
  height: 500px;
  background: var(--dark-card-bg);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--dark-border);
}

.chat-header {
  padding: 14px 20px;
  background: var(--primary-color);
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 16px;
}

.header-button {
  color: rgba(255, 255, 255, 0.8) !important;
}

.header-button:hover {
  background: rgba(255, 255, 255, 0.1) !important;
}

.chat-messages {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: var(--dark-bg);
}

.chat-messages::-webkit-scrollbar {
  width: 6px;
}

.chat-messages::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.1);
}

.chat-messages::-webkit-scrollbar-thumb {
  background: var(--primary-color);
  border-radius: 4px;
}

.message {
  display: flex;
  gap: 12px;
  max-width: 85%;
  animation: messageAppear 0.3s ease;
}

@keyframes messageAppear {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.user-message {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.ai-message {
  align-self: flex-start;
}

.message-content {
  padding: 12px 16px;
  border-radius: 14px;
  line-height: 1.5;
  font-size: 14px;
  max-width: 100%;
  word-break: break-word;
}

.user-message .message-content {
  background: var(--primary-color);
  color: white;
  border-bottom-right-radius: 4px;
}

.ai-message .message-content {
  background: var(--dark-card-bg);
  color: var(--dark-text);
  border-bottom-left-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.user-avatar {
  background: var(--primary-color);
  flex-shrink: 0;
}

.ai-avatar {
  background: #10b981;
  flex-shrink: 0;
}

.chat-input {
  padding: 16px;
  background: var(--dark-card-bg);
  border-top: 1px solid var(--dark-border);
}

.chat-input :deep(.ant-input) {
  background: var(--dark-bg);
  color: var(--dark-text);
  border-color: var(--dark-border);
}

.chat-input :deep(.ant-input-search-button) {
  background: var(--primary-color);
  border-color: var(--primary-color);
}

@media (max-width: 576px) {
  .chat-window {
    width: calc(100vw - 40px);
    height: 70vh;
    bottom: 70px;
  }
  
  .ai-assistant-container {
    bottom: 10px;
    right: 10px;
  }
}
</style>
