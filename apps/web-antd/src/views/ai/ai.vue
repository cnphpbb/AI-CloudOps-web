<template>
  <div class="ai-assistant-container">
    <!-- 优化的悬浮按钮 -->
    <div class="assistant-float-button" @click="toggleFloatWindow" :class="{ 'active': isFloatWindowVisible }">
      <div class="float-button-icon">
        <MessageCircle :size="24" />
      </div>

      <!-- 浮动提示 -->
      <div class="tooltip-content" v-if="!isFloatWindowVisible">
        <Sparkles :size="16" />
        <span>AI-CloudOps助手</span>
      </div>
    </div>

    <!-- 悬浮窗 -->
    <div v-if="isFloatWindowVisible" class="ai-float-window" :style="floatWindowStyle" ref="floatWindow">
      <!-- 悬浮窗头部 -->
      <div class="float-window-header" @mousedown="startDrag">
        <div class="header-title">
          <div class="title-icon">
            <Bot :size="20" />
          </div>
          <div class="title-content">
            <span class="title-text">AI-CloudOps助手</span>
            <span class="title-subtitle">智能运维助手</span>
          </div>
        </div>

        <div class="header-actions">
          <button class="action-button minimize-btn" @click="minimizeWindow" title="最小化">
            <Minus :size="16" />
          </button>
          <button class="action-button resize-btn" @click="toggleWindowSize" :title="isExpanded ? '缩小' : '放大'">
            <Minimize2 v-if="isExpanded" :size="16" />
            <Maximize2 v-else :size="16" />
          </button>
          <button class="action-button clear-btn" @click="clearChat" title="清空聊天">
            <Trash2 :size="16" />
          </button>
          <button class="action-button refresh-btn" @click="refreshKnowledge" title="刷新知识库" :disabled="isRefreshing">
            <RefreshCw :size="16" :class="{ 'spinning': isRefreshing }" />
          </button>
          <button class="action-button close-btn" @click="closeWindow" title="关闭">
            <X :size="16" />
          </button>
        </div>
      </div>

      <!-- 状态栏 -->
      <div class="status-bar">
        <div class="status-indicator">
          <div class="status-dot" :class="{ 'online': isConnected }"></div>
          <span class="status-text">
            {{ connectionStatus }}
          </span>
        </div>
        <div class="message-count">
          {{ Math.max(0, chatMessages.length - 1) }} 条对话
        </div>
      </div>

      <!-- 错误提示 -->
      <div v-if="errorMessage" class="error-banner">
        <AlertCircle :size="16" />
        <span>{{ errorMessage }}</span>
        <button @click="errorMessage = ''" class="error-close">
          <X :size="14" />
        </button>
      </div>

      <!-- 消息内容区域 -->
      <div class="chat-messages" ref="messagesContainer">
        <div v-for="(msg, index) in chatMessages" :key="`msg-${index}-${msg.time}`" :class="['message', msg.type]">
          <div class="message-wrapper">
            <div class="avatar">
              <div class="avatar-container" :class="msg.type === 'ai' ? 'ai-avatar' : 'user-avatar'">
                <Bot v-if="msg.type === 'ai'" :size="18" />
                <User v-else :size="18" />
              </div>
            </div>
            <div class="content">
              <div class="message-header">
                <span class="name">{{ msg.type === 'user' ? '您' : 'AI助手' }}</span>
                <span class="time">{{ msg.time }}</span>
              </div>

              <!-- AI思考状态 -->
              <div v-if="msg.type === 'ai' && !msg.content && sending" class="typing-content">
                <div class="typing-animation">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <span class="typing-text">AI正在思考中...（最长等待60秒）</span>
              </div>

              <!-- 正常消息内容 -->
              <div v-else class="text" v-html="renderMarkdown(msg.content || '')"></div>

              <!-- 消息来源显示 -->
              <div v-if="msg.sources && msg.sources.length > 0" class="message-sources">
                <div class="sources-header">
                  <FileText :size="14" />
                  <span>参考来源</span>
                </div>
                <div class="sources-list">
                  <div v-for="(source, idx) in msg.sources" :key="`source-${idx}`" class="source-item">
                    <div class="source-title">{{ source.metadata.filename || '未知来源' }}</div>
                    <div v-if="source.url" class="source-url">{{ source.url }}</div>
                  </div>
                </div>
              </div>

              <div class="message-actions" v-if="msg.type === 'ai' && msg.content">
                <button class="message-action-btn" @click="copyMessage(msg.content)" title="复制">
                  <Copy :size="12" />
                </button>
                <button class="message-action-btn" @click="toggleLike(index)" title="点赞">
                  <ThumbsUp :size="12" :class="{ 'liked': msg.liked }" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 快捷操作 -->
      <div class="quick-actions" v-if="!sending && !isMinimized">
        <div class="quick-action-buttons">
          <button v-for="action in quickActions" :key="action.text" class="quick-action-btn"
            @click="sendQuickMessage(action.text)">
            <component :is="action.icon" :size="12" />
            {{ action.text }}
          </button>
        </div>
      </div>

      <!-- 输入区域 -->
      <div class="chat-input" v-if="!isMinimized">
        <div class="textarea-container">
          <div class="input-wrapper">
            <textarea v-model="globalInputMessage" placeholder="请输入您的问题..." :disabled="sending"
              @keydown="handleEnterKey" class="message-input" rows="1" ref="messageInput"></textarea>

            <div class="input-actions">
              <!-- 高级选项按钮 -->
              <button class="advanced-options-btn" @click="showAdvancedOptions = !showAdvancedOptions" title="高级选项"
                :class="{ 'active': showAdvancedOptions }">
                <Settings2 :size="16" />
              </button>

              <button class="send-button" :disabled="!globalInputMessage.trim() || sending" @click="handleSearch"
                :class="{ 'loading': sending }">
                <Send :size="16" v-if="!sending" />
                <div v-else class="loading-spinner"></div>
              </button>
            </div>
          </div>
        </div>

        <!-- 高级选项 -->
        <div v-if="showAdvancedOptions" class="advanced-options">
          <div class="option-item">
            <label class="option-label">
              <input type="checkbox" v-model="useWebSearch" class="option-checkbox" />
              <span>启用网络搜索</span>
            </label>
          </div>
          <div class="option-item">
            <label class="option-label">
              <span>最大上下文文档数：</span>
              <select v-model="maxContextDocs" class="option-select">
                <option value="3">3</option>
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="15">15</option>
              </select>
            </label>
          </div>
        </div>

        <div class="input-hints">
          <span class="hint-item">Shift+Enter发送</span>
          <span class="shortcut-hint">
            <span class="shortcut-key">Ctrl + /</span>
            快速打开
          </span>
        </div>
      </div>

      <!-- 调整大小的拖拽手柄 -->
      <div class="resize-handle" @mousedown="startResize" v-if="!isExpanded && !isMinimized"></div>
    </div>

    <!-- 遮罩层 -->
    <div v-if="isFloatWindowVisible" class="float-window-overlay" @click="closeWindow"></div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick, onBeforeUnmount, watch, computed } from 'vue';
import {
  MessageCircle,
  Sparkles,
  Bot,
  User,
  Trash2,
  X,
  Copy,
  ThumbsUp,
  Send,
  HelpCircle,
  Settings,
  Zap,
  FileText,
  Minus,
  Maximize2,
  Minimize2,
  RefreshCw,
  AlertCircle,
  Settings2
} from 'lucide-vue-next';
import { message } from 'ant-design-vue';
import {
  createAssistantSession,
  queryAssistant,
  clearAssistantCache,
  refreshKnowledgeBase
} from '#/api/core/assistant';

// 状态管理
const isFloatWindowVisible = ref(false);
const isMinimized = ref(false);
const isExpanded = ref(false);
const isDragging = ref(false);
const isResizing = ref(false);
const globalInputMessage = ref('');
const sending = ref(false);
const isConnected = ref(false);
const isRefreshing = ref(false);
const errorMessage = ref('');
const showAdvancedOptions = ref(false);
const messagesContainer = ref(null);
const floatWindow = ref(null);
const messageInput = ref(null);
const sessionId = ref('');

// 高级选项
const useWebSearch = ref(false);
const maxContextDocs = ref(5);

// 连接状态计算属性
const connectionStatus = computed(() => {
  if (sending.value) return '正在处理...';
  if (isRefreshing.value) return '刷新知识库中...';
  if (!sessionId.value) return '未连接';
  return isConnected.value ? '已连接' : '连接中...';
});

// 悬浮窗位置和大小
const windowPosition = reactive({
  x: 100,
  y: 100
});

const windowSize = reactive({
  width: 380,
  height: 600
});

const dragStart = reactive({
  x: 0,
  y: 0,
  windowX: 0,
  windowY: 0
});

const resizeStart = reactive({
  x: 0,
  y: 0,
  startWidth: 0,
  startHeight: 0
});

// 计算悬浮窗样式
const floatWindowStyle = computed(() => ({
  left: `${windowPosition.x}px`,
  top: `${windowPosition.y}px`,
  width: `${windowSize.width}px`,
  height: isMinimized.value ? '60px' : `${windowSize.height}px`,
  transform: isExpanded.value ? 'none' : undefined,
  position: 'fixed',
  ...(isExpanded.value ? {
    left: '50%',
    top: '50%',
    transform: 'translate(-50%, -50%)',
    width: '80vw',
    height: '80vh',
    maxWidth: '800px',
    maxHeight: '700px'
  } : {})
}));

// 快捷操作
const quickActions = [
  { text: '云服务器状态', icon: Settings },
  { text: '性能监控', icon: Zap },
  { text: '日志分析', icon: FileText },
  { text: '帮助文档', icon: HelpCircle }
];

// 聊天消息接口定义
const chatMessages = reactive([
  {
    content: '👋 您好！我是AI-CloudOps助手，专注于为您提供智能运维服务。\n\n我可以帮助您：\n• 🔍 监控云服务器状态\n• 📊 分析性能指标\n• 🛠️ 故障诊断与修复\n• 📋 生成运维报告\n\n请问有什么我可以为您服务的吗？',
    type: 'ai',
    time: formatTime(new Date())
  }
]);

// 悬浮窗控制
const toggleFloatWindow = () => {
  isFloatWindowVisible.value = !isFloatWindowVisible.value;
  if (isFloatWindowVisible.value) {
    initSession();
    nextTick(() => {
      scrollToBottom();
    });
  } else {
    resetWindow();
  }
};

const closeWindow = () => {
  isFloatWindowVisible.value = false;
  resetWindow();
};

const minimizeWindow = () => {
  isMinimized.value = !isMinimized.value;
};

const toggleWindowSize = () => {
  isExpanded.value = !isExpanded.value;
};

const resetWindow = () => {
  isMinimized.value = false;
  isExpanded.value = false;
  sending.value = false;
  sessionId.value = '';
  errorMessage.value = '';
  showAdvancedOptions.value = false;
  initChatMessages();
};

// 拖拽功能
const startDrag = (e) => {
  if (isExpanded.value) return;

  isDragging.value = true;
  dragStart.x = e.clientX;
  dragStart.y = e.clientY;
  dragStart.windowX = windowPosition.x;
  dragStart.windowY = windowPosition.y;

  document.addEventListener('mousemove', onDrag);
  document.addEventListener('mouseup', stopDrag);
  e.preventDefault();
};

const onDrag = (e) => {
  if (!isDragging.value) return;

  const deltaX = e.clientX - dragStart.x;
  const deltaY = e.clientY - dragStart.y;

  windowPosition.x = Math.max(0, Math.min(window.innerWidth - windowSize.width, dragStart.windowX + deltaX));
  windowPosition.y = Math.max(0, Math.min(window.innerHeight - (isMinimized.value ? 60 : windowSize.height), dragStart.windowY + deltaY));
};

const stopDrag = () => {
  isDragging.value = false;
  document.removeEventListener('mousemove', onDrag);
  document.removeEventListener('mouseup', stopDrag);
};

// 调整大小功能
const startResize = (e) => {
  if (isExpanded.value || isMinimized.value) return;

  isResizing.value = true;
  resizeStart.x = e.clientX;
  resizeStart.y = e.clientY;
  resizeStart.startWidth = windowSize.width;
  resizeStart.startHeight = windowSize.height;

  document.addEventListener('mousemove', onResize);
  document.addEventListener('mouseup', stopResize);
  e.preventDefault();
};

const onResize = (e) => {
  if (!isResizing.value) return;

  const deltaX = e.clientX - resizeStart.x;
  const deltaY = e.clientY - resizeStart.y;

  windowSize.width = Math.max(320, Math.min(600, resizeStart.startWidth + deltaX));
  windowSize.height = Math.max(400, Math.min(800, resizeStart.startHeight + deltaY));
};

const stopResize = () => {
  isResizing.value = false;
  document.removeEventListener('mousemove', onResize);
  document.removeEventListener('mouseup', stopResize);
};

// 初始化会话
const initSession = async () => {
  try {
    console.log('正在创建会话...');
    isConnected.value = false;

    const response = await createAssistantSession();
    console.log('会话创建响应:', response);

    if (response.session_id) {
      sessionId.value = response.session_id;
      isConnected.value = true;
      console.log('会话已创建，ID:', sessionId.value);
      showSuccess('会话连接成功');
    } else {
      throw new Error('会话创建失败，响应格式不正确');
    }
  } catch (error) {
    console.error('创建会话错误:', error);
    const errorMsg = error?.response?.message || error?.message || '连接服务器失败';
    showError(`创建会话失败: ${errorMsg}`);
    isConnected.value = false;
  }
};

// 初始化聊天记录
const initChatMessages = () => {
  chatMessages.length = 0;
  chatMessages.push({
    content: '👋 您好！我是AI-CloudOps助手，专注于为您提供智能运维服务。\n\n我可以帮助您：\n• 🔍 监控云服务器状态\n• 📊 分析性能指标\n• 🛠️ 故障诊断与修复\n• 📋 生成运维报告\n\n请问有什么我可以为您服务的吗？',
    type: 'ai',
    time: formatTime(new Date())
  });
};

// 发送消息
const sendMessage = async (value) => {
  const trimmedValue = value.trim();
  if (!trimmedValue) {
    showError('请输入消息内容');
    return;
  }

  globalInputMessage.value = '';

  // 检查会话是否已建立
  if (!sessionId.value) {
    console.log('会话未建立，正在重新创建...');
    await initSession();
    if (!sessionId.value) {
      showError('会话未建立，请稍后重试');
      return;
    }
  }

  // 添加用户消息
  chatMessages.push({
    content: trimmedValue,
    type: 'user',
    time: formatTime(new Date())
  });

  // 添加AI消息占位符
  chatMessages.push({
    content: '',
    type: 'ai',
    time: formatTime(new Date())
  });

  sending.value = true;
  await nextTick();
  scrollToBottom();

  try {
    // 构建查询参数
    const queryParams = {
      question: trimmedValue,
      session_id: sessionId.value,
      use_web_search: useWebSearch.value,
      max_context_docs: parseInt(maxContextDocs.value)
    };

    console.log('发送查询请求:', queryParams);

    const response = await queryAssistant(queryParams);
    console.log('查询响应:', response);

    if (response?.answer) {
      // 更新AI消息内容
      const lastMessage = chatMessages[chatMessages.length - 1];
      if (lastMessage) {
        lastMessage.content = response.answer;

        // 添加消息来源
        if (response.sources && response.sources.length > 0) {
          lastMessage.sources = response.sources;
        }

        // 更新会话ID（如果服务器返回了新的会话ID）
        if (response.session_id && response.session_id !== sessionId.value) {
          sessionId.value = response.session_id;
        }
      }
    } else {
      throw new Error('AI响应格式不正确');
    }
  } catch (error) {
    console.error('查询AI错误:', error);

    // 移除AI消息占位符
    if (chatMessages.length > 0 && chatMessages[chatMessages.length - 1]?.type === 'ai' && !chatMessages[chatMessages.length - 1]?.content) {
      chatMessages.pop();
    }

    const errorMsg = error?.response?.message || error?.message || '查询失败';
    showError(`AI查询失败: ${errorMsg}`);

    // 如果是会话相关错误，重新创建会话
    if (error?.response?.status === 401 || error?.response?.status === 403) {
      sessionId.value = '';
      isConnected.value = false;
    }
  } finally {
    sending.value = false;
    await nextTick();
    scrollToBottom();
  }
};

// 刷新知识库
const refreshKnowledge = async () => {
  if (isRefreshing.value) return;

  try {
    isRefreshing.value = true;
    console.log('正在刷新知识库...');

    const response = await refreshKnowledgeBase();
    console.log('刷新知识库响应:', response);

    if (response) {
      const docsCount = response.documents_count;
      message.success(`知识库刷新成功${docsCount ? `，共${docsCount}文档块` : ''}`);
    } else {
      throw new Error('刷新知识库失败，响应格式不正确');
    }
  } catch (error) {
    console.error('刷新知识库错误:', error);
    const errorMsg = error?.response?.message || error?.message || '刷新失败';
    message.error(`刷新知识库失败: ${errorMsg}`);
  } finally {
    isRefreshing.value = false;
  }
};

// 清空聊天
const clearChat = async () => {
  if (chatMessages.length <= 1) {
    message.error('暂无聊天记录');
    return;
  }

  if (!confirm('确定要清空所有聊天记录和缓存吗？此操作不可恢复。')) {
    return;
  }

  try {
    // 清除服务器缓存
    if (sessionId.value) {
      const response = await clearAssistantCache();
      console.log('清除缓存响应:', response);

      if (!response?.success) {
        console.warn('服务器未确认缓存清除成功');
      }
    }

    // 重新创建会话
    sessionId.value = '';
    isConnected.value = false;
    initChatMessages();

    await initSession();
    message.success('聊天记录已清空');
  } catch (error) {
    console.error('清空聊天错误:', error);
    // 即使清除缓存失败，也清空本地聊天记录
    initChatMessages();
    message.error('清除缓存失败，但本地记录已清空');
  }
};

// 快捷消息发送
const sendQuickMessage = (text) => {
  globalInputMessage.value = text;
  handleSearch();
};

// 其他功能函数
const handleSearch = () => {
  const msg = globalInputMessage.value.trim();
  if (!msg || sending.value) return;
  sendMessage(msg);
};

const copyMessage = async (content) => {
  try {
    await navigator.clipboard.writeText(content);
    message.success('已复制到剪贴板');
  } catch (err) {
    message.error('复制失败');
  }
};

const toggleLike = (index) => {
  if (chatMessages[index]) {
    chatMessages[index].liked = !chatMessages[index].liked;
    message.success(chatMessages[index].liked ? '已点赞' : '已取消点赞');
  }
};

const renderMarkdown = (content) => {
  if (!content) return '';
  // 简单的markdown渲染
  return content
    .replace(/\n/g, '<br>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/^• (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
};

const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTo({
      top: messagesContainer.value.scrollHeight,
      behavior: 'smooth'
    });
  }
};

const handleEnterKey = (e) => {
  if (e.shiftKey && e.key === 'Enter') {
    e.preventDefault();
    handleSearch();
  }
};

function formatTime(date) {
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

// 键盘快捷键
const handleKeydown = (e) => {
  if (e.ctrlKey && e.key === '/') {
    e.preventDefault();
    toggleFloatWindow();
  }
};

// 监听器
watch(chatMessages, () => {
  nextTick(() => {
    scrollToBottom();
  });
}, { deep: true });

onMounted(() => {
  window.addEventListener('keydown', handleKeydown);

  // 设置初始位置
  windowPosition.x = window.innerWidth - windowSize.width - 50;
  windowPosition.y = 100;
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown);
  document.removeEventListener('mousemove', onDrag);
  document.removeEventListener('mouseup', stopDrag);
  document.removeEventListener('mousemove', onResize);
  document.removeEventListener('mouseup', stopResize);
});
</script>

<style scoped>
/* 基础容器 */
.ai-assistant-container {
  position: relative;
  z-index: 9999;
}

/* 悬浮按钮 */
.assistant-float-button {
  position: fixed;
  bottom: 80px;
  right: 30px;
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.3);
  transition: all 0.3s ease;
  z-index: 10000;
}

.assistant-float-button:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
}

.assistant-float-button.active {
  background: linear-gradient(135deg, #10b981, #059669);
}

.float-button-icon {
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tooltip-content {
  position: absolute;
  right: 70px;
  top: 50%;
  transform: translateY(-50%);
  background: #1f2937;
  color: #f3f4f6;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border: 1px solid #374151;
  display: flex;
  align-items: center;
  gap: 6px;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s ease;
}

.assistant-float-button:hover .tooltip-content {
  opacity: 1;
}

.tooltip-content::after {
  content: '';
  position: absolute;
  left: 100%;
  top: 50%;
  transform: translateY(-50%);
  border: 6px solid transparent;
  border-left-color: #1f2937;
}

/* 遮罩层 */
.float-window-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 9998;
}

/* 悬浮窗 */
.ai-float-window {
  position: fixed;
  background: #1f2937;
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  border: 1px solid #374151;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 9999;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

/* 悬浮窗头部 */
.float-window-header {
  background: linear-gradient(135deg, #2d3748, #1a202c);
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #374151;
  cursor: move;
  user-select: none;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #f3f4f6;
}

.title-icon {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.title-content {
  display: flex;
  flex-direction: column;
}

.title-text {
  font-weight: 600;
  font-size: 16px;
  line-height: 1.2;
}

.title-subtitle {
  font-size: 12px;
  color: #9ca3af;
  opacity: 0.8;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.action-button {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: #9ca3af;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-button:hover {
  color: #f3f4f6;
  background: rgba(255, 255, 255, 0.1);
}

.action-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.close-btn:hover {
  background: #ef4444;
  color: white;
}

/* 状态栏 */
.status-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background: #2d3748;
  border-bottom: 1px solid #374151;
  font-size: 12px;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #ef4444;
  transition: all 0.3s ease;
}

.status-dot.online {
  background: #10b981;
}

.status-text {
  color: #d1d5db;
  font-weight: 500;
}

.message-count {
  color: #9ca3af;
  font-weight: 500;
}

/* 错误提示横幅 */
.error-banner {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #991b1b;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 14px;
}

.error-close {
  background: none;
  border: none;
  color: #991b1b;
  cursor: pointer;
  margin-left: auto;
  padding: 2px;
  border-radius: 4px;
  transition: background 0.2s;
}

.error-close:hover {
  background: rgba(239, 68, 68, 0.1);
}

/* 消息区域 */
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  min-height: 200px;
}

.chat-messages::-webkit-scrollbar {
  width: 4px;
}

.chat-messages::-webkit-scrollbar-track {
  background: transparent;
}

.chat-messages::-webkit-scrollbar-thumb {
  background: rgba(156, 163, 175, 0.3);
  border-radius: 2px;
}

/* 消息样式 */
.message {
  margin-bottom: 16px;
}

.message-wrapper {
  display: flex;
  gap: 12px;
}

.avatar-container {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-avatar {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
}

.ai-avatar {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
}

.content {
  flex: 1;
  min-width: 0;
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.name {
  font-weight: 600;
  font-size: 14px;
  color: #f3f4f6;
}

.time {
  font-size: 12px;
  color: #9ca3af;
}

.text {
  background: #2d3748;
  padding: 12px 16px;
  border-radius: 10px;
  color: #f3f4f6;
  line-height: 1.6;
  font-size: 14px;
  word-break: break-word;
  border: 1px solid #374151;
}

.message.user .text {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
  border-color: #2563eb;
}

.text :deep(ul) {
  margin: 8px 0;
  padding-left: 0;
}

.text :deep(li) {
  list-style: none;
  margin-bottom: 4px;
}

.text :deep(code) {
  background: #111827;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 13px;
  color: #93c5fd;
}

.message-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.message:hover .message-actions {
  opacity: 1;
}

.message-action-btn {
  border: none;
  background: transparent;
  color: #9ca3af;
  padding: 4px 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.message-action-btn:hover {
  color: #3b82f6;
  background: rgba(59, 130, 246, 0.1);
}

.message-action-btn .liked {
  color: #3b82f6;
}

/* 打字指示器 */
.typing-content {
  background: #2d3748;
  padding: 12px 16px;
  border-radius: 10px;
  border: 1px solid #374151;
  display: flex;
  align-items: center;
  gap: 12px;
}

.typing-animation {
  display: flex;
  gap: 3px;
}

.typing-animation span {
  height: 4px;
  width: 4px;
  background: #3b82f6;
  border-radius: 50%;
  display: block;
  animation: typing 1.4s infinite ease-in-out;
}

.typing-animation span:nth-child(1) {
  animation-delay: 0s;
}

.typing-animation span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-animation span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {

  0%,
  80%,
  100% {
    transform: scale(0.8);
    opacity: 0.5;
  }

  40% {
    transform: scale(1.2);
    opacity: 1;
  }
}

.typing-text {
  color: #d1d5db;
  font-size: 14px;
  font-weight: 500;
}

/* 消息来源样式 */
.message-sources {
  margin-top: 12px;
  padding: 12px;
  background: rgba(59, 130, 246, 0.1);
  border-radius: 8px;
  border: 1px solid rgba(59, 130, 246, 0.2);
}

.sources-header {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #60a5fa;
  font-weight: 600;
  font-size: 13px;
  margin-bottom: 8px;
}

.sources-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.source-item {
  background: rgba(59, 130, 246, 0.05);
  padding: 8px;
  border-radius: 6px;
  border: 1px solid rgba(59, 130, 246, 0.15);
}

.source-title {
  font-weight: 500;
  color: #e5e7eb;
  font-size: 13px;
  margin-bottom: 2px;
}

.source-url {
  font-size: 11px;
  color: #9ca3af;
  opacity: 0.8;
  word-break: break-all;
}

/* 快捷操作 */
.quick-actions {
  padding: 12px 16px;
  border-bottom: 1px solid #374151;
  background: #2d3748;
}

.quick-action-buttons {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.quick-action-btn {
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.3);
  color: #60a5fa;
  border-radius: 12px;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 6px;
}

.quick-action-btn:hover {
  background: rgba(59, 130, 246, 0.2);
  border-color: rgba(59, 130, 246, 0.5);
  transform: translateY(-1px);
}

/* 输入区域 */
.chat-input {
  padding: 16px;
  background: #2d3748;
  border-top: 1px solid #374151;
}

.input-wrapper {
  background: #374151;
  border-radius: 10px;
  padding: 12px 16px;
  border: 1px solid #4a5568;
  display: flex;
  align-items: flex-end;
  gap: 12px;
  transition: all 0.2s ease;
}

.input-wrapper:focus-within {
  border-color: #3b82f6;
  background: #2d3748;
}

.message-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: #f3f4f6;
  font-size: 14px;
  line-height: 1.5;
  resize: none;
  min-height: 20px;
  max-height: 80px;
  font-family: inherit;
}

.message-input::placeholder {
  color: #9ca3af;
}

.input-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

/* 高级选项按钮 */
.advanced-options-btn {
  background: transparent;
  border: 1px solid #4a5568;
  color: #9ca3af;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.advanced-options-btn:hover,
.advanced-options-btn.active {
  color: #3b82f6;
  border-color: #3b82f6;
  background: rgba(59, 130, 246, 0.1);
}

/* 高级选项面板 */
.advanced-options {
  background: #374151;
  border: 1px solid #4a5568;
  border-radius: 8px;
  padding: 12px;
  margin-top: 8px;
  font-size: 14px;
}

.option-item {
  margin-bottom: 8px;
}

.option-item:last-child {
  margin-bottom: 0;
}

.option-label {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #d1d5db;
  cursor: pointer;
}

.option-checkbox {
  width: 16px;
  height: 16px;
  accent-color: #3b82f6;
}

.option-select {
  background: #2d3748;
  border: 1px solid #4a5568;
  border-radius: 4px;
  color: #f3f4f6;
  padding: 4px 8px;
  font-size: 12px;
  margin-left: auto;
}

.send-button {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  color: white;
}

.send-button:hover:not(:disabled) {
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  transform: translateY(-1px);
}

.send-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s linear infinite;
}

/* 刷新按钮动画 */
.refresh-btn .spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 输入提示 */
.input-hints {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
  padding: 0 4px;
}

.hint-item {
  font-size: 12px;
  color: #9ca3af;
  font-weight: 500;
}

.shortcut-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #9ca3af;
  font-weight: 500;
}

.shortcut-key {
  background: #374151;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  color: #d1d5db;
  font-size: 11px;
  font-weight: 600;
}

/* 调整大小手柄 */
.resize-handle {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 16px;
  height: 16px;
  cursor: nw-resize;
  background: linear-gradient(-45deg, transparent 30%, #4a5568 30%, #4a5568 40%, transparent 40%, transparent 60%, #4a5568 60%, #4a5568 70%, transparent 70%);
}

/* 响应式调整 */
@media (max-width: 768px) {
  .ai-float-window {
    width: calc(100vw - 20px) !important;
    height: calc(100vh - 20px) !important;
    left: 10px !important;
    top: 10px !important;
  }

  .assistant-float-button {
    bottom: 20px;
    right: 20px;
    width: 50px;
    height: 50px;
  }

  .header-actions {
    gap: 4px;
  }

  .action-button {
    width: 28px;
    height: 28px;
  }
}
</style>
